import { DOMAINS, START_LEVEL, type Domain, type EnglishQuestion, type Level } from './schema.ts';

export const QUESTION_COUNT = 10;
export const TIME_LIMIT_MS = 20_000;
export type Outcome = 'correct' | 'incorrect' | 'timeout' | 'skip';
export type Evidence = { question: EnglishQuestion; outcome: Outcome; elapsedMs: number; selectedAnswer?: number };
export type Estimate = { level: Level; status: 'confirmed' | 'provisional'; correct: number; domains: Domain[] };
export type Session = {
  levels: readonly Level[];
  target: Level;
  history: readonly Evidence[];
  pending: EnglishQuestion | null;
  result: Estimate | null;
};
// recentIds is ordered newest first; an exhausted recent pool prefers older items.
type Options = { levels?: readonly Level[]; random?: () => number; recentIds?: readonly string[] };

export function validateBank(bank: readonly EnglishQuestion[], levels: readonly Level[]): void {
  if (!levels.length || new Set(levels).size !== levels.length || !levels.includes(START_LEVEL)) throw new Error('Levels must be unique and include the starting level.');
  const sorted = [...levels].sort((a, b) => a - b);
  if (sorted.some((level, i) => level < 1 || level > 7 || !Number.isInteger(level) || (i > 0 && level !== sorted[i - 1] + 1))) throw new Error('Levels must form a contiguous range.');
  const ids = new Set<string>();
  for (const q of bank) {
    if (ids.has(q.id)) throw new Error('Duplicate question: ' + q.id);
    ids.add(q.id);
    if (!DOMAINS.includes(q.domain) || !Number.isInteger(q.level) || q.level < 1 || q.level > 7 || q.choices.length !== 4 || new Set(q.choices).size !== 4 || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) throw new Error('Invalid question: ' + q.id);
    if (![q.id, q.slotId, q.skill, q.familyId, q.passage, q.prompt, q.explanation, ...q.choices].every(s => typeof s === 'string' && s.trim())) throw new Error('Empty question field: ' + q.id);
    if (!Number.isFinite(q.expectedMs) || q.expectedMs <= 0 || q.expectedMs > TIME_LIMIT_MS) throw new Error('Invalid timing: ' + q.id);
    if (q.speedEligible && (!Number.isFinite(q.fastThresholdMs) || q.fastThresholdMs! < 1000 || q.fastThresholdMs! >= TIME_LIMIT_MS)) throw new Error('Invalid fast threshold: ' + q.id);
  }
  for (const level of levels) for (const domain of DOMAINS) {
    // Three per domain allows ten questions even when the run stays at one level.
    if (bank.filter(q => q.level === level && q.domain === domain).length < 3) throw new Error('Insufficient bank for level/domain: ' + level + '/' + domain);
  }
}

function evidenceAt(history: readonly Evidence[], level: Level) {
  // Higher-level successes support a lower level; higher-level failures do not disprove it.
  const relevant = history.filter(e => e.question.level === level || (e.question.level > level && e.outcome === 'correct'));
  const correct = relevant.filter(e => e.outcome === 'correct');
  const domains = [...new Set(correct.map(e => e.question.domain))];
  return { correct: correct.length, domains, accuracy: relevant.length ? correct.length / relevant.length : 0 };
}

export function estimate(history: readonly Evidence[], levels: readonly Level[]): Estimate {
  for (const level of [...levels].sort((a, b) => b - a)) {
    const evidence = evidenceAt(history, level);
    if (evidence.correct >= 3 && evidence.domains.length >= 3 && evidence.accuracy >= .75) return { level, status: 'confirmed', correct: evidence.correct, domains: evidence.domains };
  }
  // A single advanced correct answer cannot determine a provisional high grade.
  const floor = Math.min(...levels) as Level;
  const evidence = evidenceAt(history, floor);
  return { level: floor, status: 'provisional', correct: evidence.correct, domains: evidence.domains };
}

function confirmationTarget(history: readonly Evidence[], levels: readonly Level[]): Level {
  const successes = history.filter(e => e.outcome === 'correct').map(e => e.question.level);
  return (successes.length ? Math.max(...successes) : Math.min(...levels)) as Level;
}

function select(bank: readonly EnglishQuestion[], state: Session, options: Options): EnglishQuestion {
  const used = new Set(state.history.map(e => e.question.id));
  let candidates = bank.filter(q => q.level === state.target && !used.has(q.id));
  if (!candidates.length) throw new Error('No unused question at target level: ' + state.target);
  const counts = Object.fromEntries(DOMAINS.map(d => [d, state.history.filter(e => e.question.domain === d).length])) as Record<Domain, number>;
  const demonstrated = new Set(evidenceAt(state.history, state.target).domains);
  // Preserve the diagnostic domain requirements before avoiding recent questions.
  if (state.history.length < 4) {
    const minimum = Math.min(...candidates.map(q => counts[q.domain]));
    candidates = candidates.filter(q => counts[q.domain] === minimum);
  } else if (state.history.length >= 7 && candidates.some(q => !demonstrated.has(q.domain))) {
    candidates = candidates.filter(q => !demonstrated.has(q.domain));
  }
  const recent = options.recentIds ?? [];
  const unseen = candidates.filter(q => !recent.includes(q.id));
  if (unseen.length) candidates = unseen;
  else if (recent.length) {
    const oldest = Math.max(...candidates.map(q => recent.indexOf(q.id)));
    candidates = candidates.filter(q => recent.indexOf(q.id) === oldest);
  }
  const previous = state.history.at(-1)?.question;
  const score = (q: EnglishQuestion) => [
    state.history.length < 4 ? counts[q.domain] : 0,
    state.history.length >= 7 && demonstrated.has(q.domain) ? 1 : 0,
    state.history.some(e => e.question.skill === q.skill) ? 1 : 0,
    previous?.domain === q.domain ? 1 : 0,
    state.history.some(e => e.question.familyId === q.familyId) ? 1 : 0,
    counts[q.domain],
  ];
  const compare = (a: EnglishQuestion, b: EnglishQuestion) => {
    const sa = score(a), sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sa[i] - sb[i];
    return 0;
  };
  candidates.sort(compare);
  const best = candidates.filter(q => compare(q, candidates[0]) === 0);
  const value = (options.random ?? Math.random)();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Random must return a number in [0, 1).');
  return best[Math.floor(value * best.length)];
}

export function startQuiz(bank: readonly EnglishQuestion[], options: Options = {}): Session {
  const levels = options.levels ?? [1, 2, 3, 4, 5, 6, 7];
  validateBank(bank, levels);
  const state: Session = { levels: [...levels], target: START_LEVEL, history: [], pending: null, result: null };
  return { ...state, pending: select(bank, state, options) };
}

export function submitAnswer(bank: readonly EnglishQuestion[], state: Session, answer: number | 'skip' | 'timeout', elapsedMs: number, options: Options = {}): Session {
  if (!state.pending || state.result) throw new Error('Session is complete.');
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new Error('Invalid elapsed time.');
  if (typeof answer === 'number' && (!Number.isInteger(answer) || answer < 0 || answer > 3)) throw new Error('Invalid answer.');
  if (typeof answer !== 'number' && answer !== 'skip' && answer !== 'timeout') throw new Error('Invalid answer.');
  const question = state.pending;
  const outcome: Outcome = elapsedMs >= TIME_LIMIT_MS || answer === 'timeout' ? 'timeout' : answer === 'skip' ? 'skip' : answer === question.answer ? 'correct' : 'incorrect';
  const history = [...state.history, { question, outcome, elapsedMs: Math.min(elapsedMs, TIME_LIMIT_MS), ...(typeof answer === 'number' ? { selectedAnswer: answer } : {}) }];
  if (history.length === QUESTION_COUNT) return { ...state, history, pending: null, result: estimate(history, state.levels) };
  let target: Level;
  if (history.length >= 7) target = confirmationTarget(history, state.levels);
  else {
    const fast = outcome === 'correct' && question.speedEligible && elapsedMs >= 1000 && elapsedMs <= question.fastThresholdMs!;
    const step = outcome === 'correct' ? (fast ? 2 : 1) : -1;
    target = Math.max(Math.min(...state.levels), Math.min(Math.max(...state.levels), state.target + step)) as Level;
  }
  const next: Session = { ...state, history, target, pending: null };
  return { ...next, pending: select(bank, next, options) };
}

export function shuffleChoices(question: EnglishQuestion, random: () => number = Math.random): EnglishQuestion {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Invalid random value.');
    const j = Math.floor(value * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...question, choices: order.map(i => question.choices[i]) as unknown as EnglishQuestion['choices'], answer: order.indexOf(question.answer) as EnglishQuestion['answer'] };
}
