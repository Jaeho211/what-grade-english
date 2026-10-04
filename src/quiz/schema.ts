export const LEVELS = [
  { level: 1, label: '초등학교 6학년' },
  { level: 2, label: '중학교 1학년' },
  { level: 3, label: '중학교 2학년' },
  { level: 4, label: '중학교 3학년' },
  { level: 5, label: '고등학교 1학년' },
  { level: 6, label: '고등학교 2학년' },
  { level: 7, label: '고등학교 3학년' },
] as const;
export type Level = typeof LEVELS[number]['level'];
export const MIN_LEVEL: Level = 1;
export const MAX_LEVEL: Level = 7;
export const START_LEVEL: Level = 3;
export const DOMAINS = ['vocabulary', 'usage', 'reading', 'discourse'] as const;
export type Domain = typeof DOMAINS[number];
export type EnglishQuestion = {
  id: string;
  level: Level;
  slotId: string;
  domain: Domain;
  skill: string;
  familyId: string;
  passage: string;
  prompt: string;
  choices: readonly [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  format?: 'quick-vocabulary';
  expectedMs: number;
  speedEligible: boolean;
  fastThresholdMs?: number;
};
