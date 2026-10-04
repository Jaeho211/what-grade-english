import { timeLimitMs } from '../src/quiz/engine.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startQuiz, submitAnswer, shuffleChoices } from '../src/quiz/engine.ts';
import { makeRecord, parseRecords, summarize, questionVersion, MAX_RECORDS } from '../src/quiz/records.ts';
const bank = [1,2,3,4,5,6,7].flatMap(l => JSON.parse(readFileSync(new URL(`../src/quiz/data/level${l}.json`, import.meta.url))));
function complete() {
  let session = startQuiz(bank, { random: () => 0 });
  for (let i=0; i<10; i++) session = submitAnswer(bank, session, session.pending.answer, 5000, { random: () => 0 });
  return makeRecord(session, 'bank-v1', Array.from({length:10}, () => ({observedMs:5000, interrupted:false})), 'local-id', '2026-10-04T03:00:00Z');
}
test('record roundtrip keeps selected answer text and actual per-domain deadline', () => {
  const record = complete();
  assert.deepEqual(parseRecords(JSON.stringify([record])), [record]);
  for (const t of record.trials) {
    assert.equal(t.selectedChoice, t.correctChoice);
    assert.equal(t.limitMs, timeLimitMs(bank.find(q => q.id === t.id)));
  }
  assert.throws(() => makeRecord(startQuiz(bank), 'v1', [], 'id', new Date().toISOString()));
});
test('shuffled choices share a version; edited content creates a new calibration group', () => {
  const q = bank[0];
  assert.equal(questionVersion(q), questionVersion(shuffleChoices(q, () => .2)));
  assert.notEqual(questionVersion(q), questionVersion({...q, passage:q.passage+' More.'}));
  const first=complete(), second=structuredClone(first);
  second.trials[0].version='new-version';
  assert.equal(summarize([first,second]).filter(s => s.id===first.trials[0].id).length,2);
});
test('summary separates interruptions, skips and timeouts and excludes subsecond answers from timing', () => {
  const base=complete(); base.trials=base.trials.slice(0,1);
  const a=structuredClone(base), b=structuredClone(base), c=structuredClone(base), d=structuredClone(base), e=structuredClone(base);
  a.trials[0].interrupted=true;
  b.trials[0].outcome='skip'; delete b.trials[0].selectedChoice;
  c.trials[0].outcome='timeout'; delete c.trials[0].selectedChoice;
  d.trials[0].elapsedMs=500;
  e.trials[0].elapsedMs=7000;
  const [s]=summarize([a,b,c,d,e]);
  assert.deepEqual([s.total,s.usable,s.interrupted,s.correct,s.skipped,s.timedOut],[5,4,1,2,1,1]);
  assert.equal(s.correctRate,.5); assert.equal(s.timeoutRate,.25); assert.equal(s.correctMedianMs,7000);
});
test('corrupt local storage cannot break play; history is bounded', () => {
  for (const raw of ['broken','{}','[null]']) assert.deepEqual(parseRecords(raw),[]);
  const bad=complete(); bad.trials[0].elapsedMs=-1;
  assert.deepEqual(parseRecords(JSON.stringify([bad])),[]);
  assert.equal(parseRecords(JSON.stringify(Array(70).fill(complete()))).length,MAX_RECORDS);
});

test('estimation version is preserved while legacy records keep their unknown policy', async () => {
  const { ESTIMATION_VERSION } = await import('../src/quiz/engine.ts');
  const { exportRecords } = await import('../src/quiz/records.ts');
  const current = complete();
  assert.equal(current.estimationVersion, ESTIMATION_VERSION);
  const legacy = structuredClone(current);
  delete legacy.estimationVersion;
  const parsed = parseRecords(JSON.stringify([current, legacy]));
  assert.equal(parsed.length, 2);
  assert.equal(parsed[1].estimationVersion, undefined);
  const exported = exportRecords(parsed, '2026-10-04T09:00:00Z');
  assert.equal(exported.records[0].estimationVersion, ESTIMATION_VERSION);
  assert.equal(exported.records[1].estimationVersion, undefined);
  assert.equal(exported.records[1].result.level, legacy.result.level);
  for (const version of [null, 2, '', ' ']) {
    assert.deepEqual(parseRecords(JSON.stringify([{...current, estimationVersion: version}])), []);
  }
});
