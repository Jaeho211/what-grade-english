import { DOMAINS, START_LEVEL, type Domain, type EnglishQuestion, type Level } from './schema.ts';

export const ESTIMATION_VERSION = '2026-10-04.direct-evidence-v1';
export const QUESTION_COUNT = 10;
export const TIME_LIMIT_MS = 30_000;
export function timeLimitMs(question: EnglishQuestion): number {
  if (question.format === 'quick-vocabulary') return 15_000;
  return question.domain === 'reading' || question.domain === 'discourse' ? 40_000 : TIME_LIMIT_MS;
}
export type Outcome = 'correct' | 'incorrect' | 'timeout' | 'skip';
export type Evidence = { question: EnglishQuestion; outcome: Outcome; elapsedMs: number; selectedAnswer?: number };
export type Estimate = { level: Level; status: 'confirmed' | 'provisional'; basis: 'confirmed' | 'partial' | 'floor'; correct: number; domains: Domain[] };
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
    if (!Number.isFinite(q.expectedMs) || q.expectedMs <= 0 || q.expectedMs > timeLimitMs(q)) throw new Error('Invalid timing: ' + q.id);
    if (q.format !== undefined && (q.format !== 'quick-vocabulary' || q.domain !== 'vocabulary')) throw new Error('Invalid format: ' + q.id);
    if (q.speedEligible && (!Number.isFinite(q.fastThresholdMs) || q.fastThresholdMs! < 1000 || q.fastThresholdMs! >= timeLimitMs(q))) throw new Error('Invalid fast threshold: ' + q.id);
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
  const direct = history.filter(e => e.question.level === level);
  const directCorrect = direct.filter(e => e.outcome === 'correct').length;
  return { correct: correct.length, domains, accuracy: relevant.length ? correct.length / relevant.length : 0,
    directCorrect, directTotal: direct.length, directAccuracy: direct.length ? directCorrect / direct.length : 0 };
}

export function estimate(history: readonly Evidence[], levels: readonly Level[]): Estimate {
  for (const level of [...levels].sort((a, b) => b - a)) {
    const evidence = evidenceAt(history, level);
    if (isConfirmed(evidence)) return { level, status: 'confirmed', basis: 'confirmed', correct: evidence.correct, domains: evidence.domains };
  }
  // Partial evidence may support a tentative grade, but never one lucky answer or one domain.
  for (const level of [...levels].sort((a, b) => b - a)) {
    const evidence = evidenceAt(history, level);
    if (evidence.correct >= 2 && evidence.domains.length >= 2 && evidence.accuracy >= .75) return { level, status: 'provisional', basis: 'partial', correct: evidence.correct, domains: evidence.domains };
  }
  // Without multi-domain evidence, keep the supported range floor explicit.
  const floor = Math.min(...levels) as Level;
  const evidence = evidenceAt(history, floor);
  return { level: floor, status: 'provisional', basis: 'floor', correct: evidence.correct, domains: evidence.domains };
}

// Explain the actual run without changing its estimate or treating a higher
// partial result as a confirmed grade.
export function resultDetails(history: readonly Evidence[], result: Estimate, levels: readonly Level[]) {
  const counts = (entries: readonly Evidence[]) => ({
    total: entries.length,
    correct: entries.filter(e => e.outcome === 'correct').length,
    incorrect: entries.filter(e => e.outcome === 'incorrect').length,
    timedOut: entries.filter(e => e.outcome === 'timeout').length,
    skipped: entries.filter(e => e.outcome === 'skip').length,
  });
  const supported = evidenceAt(history, result.level);
  const byLevel = [...levels].sort((a, b) => a - b)
    .filter(level => level >= result.level && history.some(e => e.question.level === level))
    .map(level => ({ level, ...counts(history.filter(e => e.question.level === level)) }));
  const higherPartial = [...levels].sort((a, b) => b - a).find(level => {
    if (level <= result.level) return false;
    const evidence = evidenceAt(history, level);
    return evidence.correct >= 2 && evidence.domains.length >= 2 && evidence.accuracy >= .75;
  });
  return { overall: counts(history), direct: counts(history.filter(e => e.question.level === result.level)),
    supportedDomains: supported.domains, byLevel,
    higherPartial: higherPartial === undefined ? null : { level: higherPartial, ...evidenceAt(history, higherPartial) } };
}

function isConfirmed(evidence: ReturnType<typeof evidenceAt>): boolean {
  return evidence.directCorrect >= 2 && evidence.correct >= 3 && evidence.domains.length >= 3
    && evidence.domains.some(domain => domain === 'reading' || domain === 'discourse')
    && evidence.directAccuracy >= .75;
}

function confirmationTarget(history: readonly Evidence[], levels: readonly Level[]): Level {
  const remaining = QUESTION_COUNT - history.length;
  const successes = history.filter(e => e.outcome === 'correct').map(e => e.question.level);
  const ceiling = successes.length ? Math.max(...successes) : Math.min(...levels);
  // Reassess after every answer. Only pursue a level that can still be confirmed
  // with the remaining questions, even if every subsequent answer is correct.
  for (const level of [...levels].sort((a, b) => b - a)) {
    if (level > ceiling) continue;
    const evidence = evidenceAt(history, level);
    const needed = Math.max(0, 2 - evidence.directCorrect, 3 - evidence.correct, 3 - evidence.domains.length);
    for (let count = needed; count <= remaining; count++) {
      const directTotal = evidence.directTotal + count;
      if (directTotal && (evidence.directCorrect + count) / directTotal >= .75) return level;
    }
  }
  // If confirmation is impossible, collect direct evidence for the best
  // tentative level rather than returning to a single highest lucky answer.
  return estimate(history, levels).level;
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
  // One quick vocabulary item in the balanced opening, another at question 6.
  // Keep all later confirmation questions available in their original domains.
  const quickCount = state.history.filter(e => e.question.format === 'quick-vocabulary').length;
  if (state.history.length === 5 && quickCount < 2) {
    const quick = bank.filter(q => q.level === state.target && !used.has(q.id) && q.format === 'quick-vocabulary');
    if (quick.length) candidates = quick;
  } else {
    const preferred = candidates.filter(q => q.domain === 'vocabulary'
      ? (quickCount === 0 ? q.format === 'quick-vocabulary' : q.format !== 'quick-vocabulary')
      : true);
    if (preferred.length) candidates = preferred;
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
  const limit = timeLimitMs(question);
  const outcome: Outcome = elapsedMs >= limit || answer === 'timeout' ? 'timeout' : answer === 'skip' ? 'skip' : answer === question.answer ? 'correct' : 'incorrect';
  const history = [...state.history, { question, outcome, elapsedMs: Math.min(elapsedMs, limit), ...(typeof answer === 'number' ? { selectedAnswer: answer } : {}) }];
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
