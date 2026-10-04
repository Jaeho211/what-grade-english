import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { timeLimitMs } from '../src/quiz/engine.ts';

const levels = [1, 2, 3, 4, 5, 6, 7];
const bank = levels.flatMap(level => JSON.parse(readFileSync(new URL('../src/quiz/data/level' + level + '.json', import.meta.url), 'utf8')));
assert.equal(bank.length, 336);
assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
assert.equal(new Set(bank.map(q => q.passage)).size, bank.length, "Repeated passage across grades");
const domains = ['vocabulary', 'usage', 'reading', 'discourse'];
for (const q of bank) {
  assert.ok(levels.includes(q.level), q.id);
  assert.ok(domains.includes(q.domain), q.id);
  assert.ok(new RegExp('^L' + q.level + '-[VURD]0[123]$').test(q.slotId), q.id);
  assert.equal({ V: 'vocabulary', U: 'usage', R: 'reading', D: 'discourse' }[q.slotId[3]], q.domain, q.id);
  assert.equal(q.choices.length, 4, q.id);
  assert.equal(new Set(q.choices).size, 4, q.id);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, q.id);
  for (const key of ['id', 'skill', 'familyId', 'passage', 'prompt', 'explanation']) {
    assert.ok(typeof q[key] === 'string' && q[key].trim(), q.id + ': ' + key);
  }
  assert.ok(q.expectedMs > 0 && q.expectedMs <= timeLimitMs(q), q.id);
  assert.equal(q.speedEligible, false, 'Speed remains disabled before calibration: ' + q.id);
}
const slots = new Set(bank.map(q => q.slotId));
assert.equal(slots.size, 84);
for (const slot of slots) assert.equal(bank.filter(q => q.slotId === slot).length, 4, slot);
for (const level of levels) for (const domain of domains) assert.equal(bank.filter(q => q.level === level && q.domain === domain).length, 12, level + '/' + domain);
console.log('PASS: 336 questions, 84 slots, 4 domains; structural checks only.');
