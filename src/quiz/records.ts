import { timeLimitMs, type Session, type Outcome } from './engine.ts';
import type { EnglishQuestion, Domain } from './schema.ts';

export const RECORDS_KEY = 'what-grade-english:records:v1';
export const MAX_RECORDS = 50;
export type Observation = { observedMs: number; interrupted: boolean };
export type Trial = {
  id: string; version: string; level: number; domain: Domain;
  passage: string; prompt: string; choices: string[]; correctChoice: string; selectedChoice?: string;
  outcome: Outcome; elapsedMs: number; limitMs: number; observedMs: number; interrupted: boolean;
};
export type PlayRecord = { id: string; completedAt: string; bankVersion: string; result: Session['result']; trials: Trial[] };
// Content fingerprint, not an identity or security token. Choice shuffling must not change it.
export function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function questionVersion(q: EnglishQuestion): string {
  return fingerprint(JSON.stringify([q.level, q.domain, q.passage, q.prompt, [...q.choices].sort(), q.choices[q.answer], timeLimitMs(q)]));
}
export function makeRecord(session: Session, bankVersion: string, observations: Observation[], id: string, completedAt: string): PlayRecord {
  if (!session.result || session.pending || session.history.length !== 10 || observations.length !== 10) throw new Error('Only complete quizzes can be recorded.');
  return { id, completedAt, bankVersion, result: { ...session.result, domains: [...session.result.domains] }, trials: session.history.map((e, i) => ({
    id: e.question.id, version: questionVersion(e.question), level: e.question.level, domain: e.question.domain,
    passage: e.question.passage, prompt: e.question.prompt, choices: [...e.question.choices], correctChoice: e.question.choices[e.question.answer],
    ...(e.selectedAnswer === undefined ? {} : { selectedChoice: e.question.choices[e.selectedAnswer] }),
    outcome: e.outcome, elapsedMs: e.elapsedMs, limitMs: timeLimitMs(e.question), ...observations[i],
  })) };
}
export function parseRecords(raw: string | null): PlayRecord[] {
  try {
    const value = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.slice(0, MAX_RECORDS).filter((r: any) =>
      r && typeof r.id === 'string' && typeof r.bankVersion === 'string' && typeof r.completedAt === 'string' && Number.isFinite(Date.parse(r.completedAt)) &&
      r.result && Number.isInteger(r.result.level) && r.result.level >= 1 && r.result.level <= 7 &&
      Array.isArray(r.trials) && r.trials.length === 10 && r.trials.every((t: any) =>
        t && typeof t.id === 'string' && typeof t.version === 'string' && Number.isInteger(t.level) && t.level >= 1 && t.level <= 7 &&
        ['vocabulary', 'usage', 'reading', 'discourse'].includes(t.domain) && ['correct', 'incorrect', 'skip', 'timeout'].includes(t.outcome) &&
        [t.passage, t.prompt, t.correctChoice].every(v => typeof v === 'string') && Array.isArray(t.choices) && t.choices.length === 4 && t.choices.every(v => typeof v === 'string') && t.choices.includes(t.correctChoice) &&
        (t.selectedChoice === undefined || t.choices.includes(t.selectedChoice)) &&
        Number.isFinite(t.elapsedMs) && t.elapsedMs >= 0 && [15000, 20000, 30000, 40000].includes(t.limitMs) && t.elapsedMs <= t.limitMs &&
        Number.isFinite(t.observedMs) && t.observedMs >= t.elapsedMs && typeof t.interrupted === 'boolean'
      )
    );
  } catch { return []; }
}
function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
export function summarize(records: PlayRecord[]) {
  const groups = new Map<string, Trial[]>();
  for (const r of records) for (const t of r.trials) {
    const key = t.id + ':' + t.version;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  return [...groups.values()].map(trials => {
    const usable = trials.filter(t => !t.interrupted);
    const count = (outcome: Outcome) => usable.filter(t => t.outcome === outcome).length;
    const correct = usable.filter(t => t.outcome === 'correct');
    return {
      id: trials[0].id, version: trials[0].version, level: trials[0].level, domain: trials[0].domain, limitMs: trials[0].limitMs,
      total: trials.length, usable: usable.length, interrupted: trials.length - usable.length,
      correct: count('correct'), incorrect: count('incorrect'), skipped: count('skip'), timedOut: count('timeout'),
      correctRate: usable.length ? correct.length / usable.length : null,
      timeoutRate: usable.length ? count('timeout') / usable.length : null,
      correctMedianMs: median(correct.filter(t => t.elapsedMs >= 1000).map(t => t.elapsedMs)),
      selectedChoices: Object.fromEntries(trials[0].choices.map(choice => [choice, usable.filter(t => t.selectedChoice === choice).length])),
      // Repeated attempts on one device are not independent participants.
      needsMoreSamples: usable.length < 5,
    };
  }).sort((a, b) => a.id.localeCompare(b.id) || a.version.localeCompare(b.version));
}
export function exportRecords(records: PlayRecord[], exportedAt: string) {
  return { schemaVersion: 1, exportedAt, note: 'Local play records; repeated attempts are not independent participants. Interrupted trials are excluded from summary rates and timing. Correct responses below 1 second are excluded from timing only.', records, summary: summarize(records) };
}
