import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { startQuiz, submitAnswer, estimate, shuffleChoices, timeLimitMs } from '../src/quiz/engine.ts';

const bank = [2, 3, 4].flatMap(level => JSON.parse(readFileSync(new URL('../src/quiz/data/level' + level + '.json', import.meta.url), 'utf8')));
const levels = [2, 3, 4];
const rng = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
function run(pattern, source = bank, supported = levels, seed = 1) {
  const options = { levels: supported, random: rng(seed) };
  let state = startQuiz(source, options);
  for (let i = 0; i < 10; i++) {
    const q = state.pending;
    const response = typeof pattern === 'function' ? pattern(q, i) : pattern[i];
    const answer = response === true ? q.answer : response === false ? (q.answer + 1) % 4 : response;
    state = submitAnswer(source, state, answer, response === 'timeout' ? 20000 : 5000, options);
  }
  return state;
}

test('all 1024 correctness paths terminate with balanced opening and no repeated IDs, across eight seeds', () => {
  for (let seed = 1; seed <= 8; seed++) for (let path = 0; path < 1024; path++) {
    const state = run(Array.from({ length: 10 }, (_, i) => Boolean(path & (1 << i))), bank, levels, seed);
    assert.equal(state.history.length, 10);
    assert.equal(state.history.filter(e => e.question.format === 'quick-vocabulary').length, 2);
    assert.equal(state.pending, null);
    assert.equal(new Set(state.history.map(e => e.question.id)).size, 10);
    assert.equal(new Set(state.history.slice(0, 4).map(e => e.question.domain)).size, 4);
    assert.ok(levels.includes(state.result.level));
    if (state.result.status === 'confirmed') {
      assert.ok(state.result.correct >= 3);
      assert.ok(state.result.domains.length >= 3);
    }
  }
});
test('all correct confirms upper prototype level; first mistake can recover', () => {
  assert.deepEqual([run(Array(10).fill(true)).result.level, run(Array(10).fill(true)).result.status], [4, 'confirmed']);
  const recovered = run([false, ...Array(9).fill(true)]);
  assert.equal(recovered.result.level, 4);
  assert.equal(recovered.result.status, 'confirmed');
});
test('all wrong, skipped, or timed out remains provisional at prototype floor', () => {
  for (const value of [false, 'skip', 'timeout']) {
    const state = run(Array(10).fill(value));
    assert.equal(state.result.level, 2);
    assert.equal(state.result.status, 'provisional');
  }
});
test('one-domain success cannot confirm a grade', () => {
  assert.equal(run(q => q.domain === 'vocabulary').result.status, 'provisional');
});
test('higher failures do not erase lower evidence', () => {
  const evidence = bank.filter(q => q.level === 2).filter((q, i, all) => all.findIndex(other => other.domain === q.domain) === i).map(question => ({ question, outcome: 'correct', elapsedMs: 5000 }));
  evidence.push(...bank.filter(q => q.level === 4).slice(0, 6).map(question => ({ question, outcome: 'incorrect', elapsedMs: 5000 })));
  assert.equal(estimate(evidence, levels).level, 2);
  assert.equal(estimate(evidence, levels).status, 'confirmed');
});
test('timer boundary, invalid inputs, immutable state and completed session', () => {
  const options = { levels, random: () => 0 };
  const initial = startQuiz(bank, options);
  const next = submitAnswer(bank, initial, initial.pending.answer, timeLimitMs(initial.pending), options);
  assert.equal(next.history[0].outcome, 'timeout');
  assert.equal(initial.history.length, 0);
  for (const ms of [-1, NaN, Infinity]) assert.throws(() => submitAnswer(bank, initial, 0, ms, options));
  for (const answer of [-1, 4, 0.5, 'invalid']) assert.throws(() => submitAnswer(bank, initial, answer, 5000, options));
  assert.throws(() => submitAnswer(bank, run(Array(10).fill(true)), 0, 5000, options));
  assert.throws(() => startQuiz(bank)); // Full seven-level game must not silently use an incomplete bank.
  assert.throws(() => startQuiz(bank, { levels: [2, 4] }));
  assert.throws(() => startQuiz(bank, { levels, random: () => 1 }));
});
test('shuffling preserves correct text and does not mutate original choices', () => {
  for (let seed = 0; seed < 100; seed++) {
    const q = bank[seed % bank.length];
    const old = [...q.choices];
    const shuffled = shuffleChoices(q, rng(seed));
    assert.equal(shuffled.choices[shuffled.answer], q.choices[q.answer]);
    assert.deepEqual(q.choices, old);
    assert.deepEqual([...shuffled.choices].sort(), [...q.choices].sort());
  }
});
test('synthetic seven-level coverage can reach and confirm high3 (not curriculum validation)', () => {
  const synthetic = Array.from({ length: 7 }, (_, i) => bank.filter(q => q.level === 3).map(q => ({ ...q, id: 'synthetic-' + (i + 1) + '-' + q.id, level: i + 1 })) ).flat();
  assert.equal(run(Array(10).fill(true), synthetic, [1, 2, 3, 4, 5, 6, 7]).result.level, 7);
});
test('speed acceleration requires eligible content and excludes sub-second answers', () => {
  const synthetic = Array.from({ length: 7 }, (_, i) => bank.filter(q => q.level === 3).map(q => ({ ...q, id: 'speed-' + (i + 1) + '-' + q.id, level: i + 1, speedEligible: true, fastThresholdMs: 4000 }))).flat();
  const options = { levels: [1, 2, 3, 4, 5, 6, 7], random: () => 0 };
  const initial = startQuiz(synthetic, options);
  assert.equal(submitAnswer(synthetic, initial, initial.pending.answer, 3000, options).target, 5);
  assert.equal(submitAnswer(synthetic, initial, initial.pending.answer, 500, options).target, 4);
  assert.equal(submitAnswer(synthetic, initial, initial.pending.answer, 5000, options).target, 4);
});
test('exact-level accuracy and three distinct domains are required', () => {
  const evidence = ['vocabulary', 'usage', 'reading'].map(domain => ({ question: bank.find(q => q.level === 4 && q.domain === domain), outcome: 'correct', elapsedMs: 5000 }));
  evidence.push({ question: bank.find(q => q.level === 4 && q.domain === 'discourse'), outcome: 'incorrect', elapsedMs: 5000 });
  assert.equal(estimate(evidence, levels).level, 4); // 3/4 = 75%
  evidence.push({ question: bank.find(q => q.level === 4 && q.domain === 'discourse' && q.id !== evidence[3].question.id), outcome: 'incorrect', elapsedMs: 5000 });
  assert.notEqual(estimate(evidence, levels).level, 4); // 3/5 is insufficient
});
test('all-recent pool remains playable and its oldest matching item is preferred', () => {
  const options = { levels, random: () => 0, recentIds: bank.map(q => q.id) };
  const initial = startQuiz(bank, options);
  // Initial candidates are tied in other criteria; oldest L3 item wins.
  assert.equal(initial.pending.id, bank.filter(q => q.level === 3).at(-1).id);
});
const fullLevels = [1, 2, 3, 4, 5, 6, 7];
const fullBank = fullLevels.flatMap(level => JSON.parse(readFileSync(new URL('../src/quiz/data/level' + level + '.json', import.meta.url), 'utf8')));
test('real seven-level bank: all 1024 paths across eight seeds terminate without repeat', () => {
  for (let seed = 1; seed <= 8; seed++) for (let path = 0; path < 1024; path++) {
    const state = run(Array.from({ length: 10 }, (_, i) => Boolean(path & (1 << i))), fullBank, fullLevels, seed);
    assert.equal(state.history.length, 10);
    assert.equal(new Set(state.history.map(e => e.question.id)).size, 10);
    assert.equal(new Set(state.history.slice(0, 4).map(e => e.question.domain)).size, 4);
    assert.ok(fullLevels.includes(state.result.level));
    if (state.result.status === 'confirmed') assert.ok(state.result.correct >= 3 && state.result.domains.length >= 3);
  }
});
test('real seven-level bank: perfect and recovered runs confirm high3, failures hit elementary6 floor', () => {
  for (const pattern of [Array(10).fill(true), [false, ...Array(9).fill(true)]]) {
    const state = run(pattern, fullBank, fullLevels);
    assert.equal(state.result.level, 7);
    assert.equal(state.result.status, 'confirmed');
  }
  for (const value of [false, 'skip', 'timeout']) {
    const state = run(Array(10).fill(value), fullBank, fullLevels);
    assert.equal(state.result.level, 1);
    assert.equal(state.result.status, 'provisional');
  }
});
test('mixed non-answer paths remain playable and preserve numeric answers for review', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const random = rng(seed);
    const pattern = Array.from({ length: 10 }, () => [true, false, 'skip', 'timeout'][Math.floor(random() * 4)]);
    const state = run(pattern, fullBank, fullLevels, seed);
    assert.equal(state.history.length, 10);
    for (const entry of state.history) {
      if (['correct', 'incorrect'].includes(entry.outcome)) assert.ok(Number.isInteger(entry.selectedAnswer));
      else assert.equal(entry.selectedAnswer, undefined);
    }
  }
});

test('unseen questions beat skill preferences within the required opening domain', () => {
  const first = startQuiz(bank, { levels, random: () => 0 });
  const history = [{ question: first.pending, outcome: 'incorrect', elapsedMs: 5000 }];
  const pending = bank.find(q => q.level === 3 && q.domain !== first.pending.domain);
  const fresh = bank.find(q => q.level === 2 && q.domain !== first.pending.domain && q.domain !== pending.domain);
  const source = bank.map(q => q.id === fresh.id ? { ...q, skill: first.pending.skill } : q);
  const state = { ...first, target: 3, history, pending };
  const recentIds = source.filter(q => q.id !== fresh.id).map(q => q.id);
  const next = submitAnswer(source, state, 'skip', 5000, { levels, recentIds, random: () => 0 });
  assert.equal(next.pending.id, fresh.id);
});

test('eight replay sessions preserve domain requirements and avoid recent eligible questions', () => {
  for (const response of ['correct', 'incorrect', 'skip']) {
    let recentIds = [];
    for (let round = 0; round < 8; round++) {
      const options = { recentIds, random: rng(round + 1) };
      let state = startQuiz(fullBank, options);
      for (let i = 0; i < 10; i++) {
        const used = new Set(state.history.map(e => e.question.id));
        let eligible = fullBank.filter(q => q.level === state.target && !used.has(q.id));
        const counts = Object.fromEntries(['vocabulary', 'usage', 'reading', 'discourse'].map(d => [d, state.history.filter(e => e.question.domain === d).length]));
        if (i < 4) {
          const min = Math.min(...eligible.map(q => counts[q.domain]));
          eligible = eligible.filter(q => counts[q.domain] === min);
        } else if (i >= 7) {
          const demonstrated = new Set(state.history.filter(e => e.outcome === 'correct' && e.question.level >= state.target).map(e => e.question.domain));
          if (eligible.some(q => !demonstrated.has(q.domain))) eligible = eligible.filter(q => !demonstrated.has(q.domain));
        }
        const quickCount = state.history.filter(e => e.question.format === 'quick-vocabulary').length;
        if (i === 5 && quickCount < 2) eligible = fullBank.filter(q => q.level === state.target && !used.has(q.id) && q.format === 'quick-vocabulary');
        else {
          const preferred = eligible.filter(q => q.domain !== 'vocabulary' || (quickCount === 0 ? q.format === 'quick-vocabulary' : q.format !== 'quick-vocabulary'));
          if (preferred.length) eligible = preferred;
        }
        if (eligible.some(q => !recentIds.includes(q.id))) assert.ok(!recentIds.includes(state.pending.id), `Unexpected repeat in ${response}, round ${round}, question ${i}`);
        else assert.equal(recentIds.indexOf(state.pending.id), Math.max(...eligible.map(q => recentIds.indexOf(q.id))));
        const q = state.pending;
        recentIds = [q.id, ...recentIds.filter(id => id !== q.id)].slice(0, 400);
        state = submitAnswer(fullBank, state, response === 'correct' ? q.answer : response === 'skip' ? 'skip' : (q.answer + 1) % 4, 5000, { ...options, recentIds });
      }
      assert.equal(new Set(state.history.slice(0, 4).map(e => e.question.domain)).size, 4);
      assert.equal(new Set(state.history.map(e => e.question.id)).size, 10);
    }
  }
});

test('domain timer accepts reading at 20 seconds and expires at each exact deadline', () => {
  const options = { levels, random: () => 0 };
  for (const domain of ['vocabulary', 'usage', 'reading', 'discourse']) {
    const question = bank.find(q => q.level === 3 && q.domain === domain);
    const initial = { ...startQuiz(bank, options), pending: question };
    const limit = domain === 'reading' || domain === 'discourse' ? 40000 : 30000;
    assert.equal(submitAnswer(bank, initial, question.answer, limit - 1, options).history[0].outcome, 'correct');
    const expired = submitAnswer(bank, initial, question.answer, limit, options).history[0];
    assert.equal(expired.outcome, 'timeout');
    assert.equal(expired.elapsedMs, limit);
    if (limit === 40000) assert.equal(submitAnswer(bank, initial, question.answer, 20000, options).history[0].outcome, 'correct');
  }
});

function evidence(level, domains, outcome = 'correct') {
  return domains.map(domain => ({ question: fullBank.find(q => q.level === level && q.domain === domain), outcome, elapsedMs: 5000 }));
}
test('two-domain partial evidence supports a tentative intermediate grade, never a single lucky answer', () => {
  const partial = estimate(evidence(5, ['vocabulary', 'reading']), fullLevels);
  assert.deepEqual([partial.level, partial.status, partial.basis], [5, 'provisional', 'partial']);
  assert.equal(estimate(evidence(7, ['reading']), fullLevels).basis, 'floor');
  assert.equal(estimate(evidence(7, ['reading', 'reading', 'reading']), fullLevels).basis, 'floor');
  assert.equal(estimate(evidence(3, ['vocabulary', 'usage']), fullLevels).level, 3);
});
test('partial evidence observes accuracy, higher failures and the confirmed result priority', () => {
  const history = evidence(5, ['vocabulary', 'reading']);
  assert.equal(estimate([...history, ...evidence(5, ['usage'], 'incorrect')], fullLevels).level, 4);
  assert.equal(estimate([...history, ...evidence(7, ['usage'], 'timeout')], fullLevels).level, 5);
  const confirmed = estimate([...history, ...evidence(3, ['discourse'])], fullLevels);
  assert.deepEqual([confirmed.level, confirmed.status, confirmed.basis], [3, 'confirmed', 'confirmed']);
  for (const outcome of ['skip', 'timeout']) {
    assert.equal(estimate([...history, ...evidence(5, ['usage'], outcome)], fullLevels).level, 4);
  }
  const reversed = estimate([...history].reverse().map(e => ({ ...e, elapsedMs: 29000 })), fullLevels);
  assert.equal(reversed.level, 5);
});

test('two quick vocabulary items keep balanced opening and exact 15-second boundary', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const state = run((q, i) => i % 3 !== 0, fullBank, [1,2,3,4,5,6,7], seed);
    assert.equal(state.history.filter(e => e.question.format === 'quick-vocabulary').length, 2);
    assert.equal(state.history[5].question.format, 'quick-vocabulary');
    assert.equal(new Set(state.history.slice(0,4).map(e => e.question.domain)).size, 4);
  }
  const options = { levels, random: () => 0 };
  const question = bank.find(q => q.format === 'quick-vocabulary');
  const initial = { ...startQuiz(bank, options), pending: question };
  assert.equal(timeLimitMs(question), 15000);
  assert.equal(submitAnswer(bank, initial, question.answer, 14999, options).history[0].outcome, 'correct');
  assert.equal(submitAnswer(bank, initial, question.answer, 15000, options).history[0].outcome, 'timeout');
});

test('24 short words support twelve fixed-level replays without repeating a quick item', () => {
  let recentIds = [];
  const quickIds = [];
  for (let round = 0; round < 12; round++) {
    const options = { levels: [3], random: rng(round + 1), recentIds };
    let state = startQuiz(fullBank, options);
    for (let i = 0; i < 10; i++) {
      const q = state.pending;
      if (q.format === 'quick-vocabulary') quickIds.push(q.id);
      recentIds = [q.id, ...recentIds.filter(id => id !== q.id)].slice(0, 400);
      state = submitAnswer(fullBank, state, q.answer, 5000, { ...options, recentIds });
    }
  }
  assert.equal(quickIds.length, 24);
  assert.equal(new Set(quickIds).size, 24);
});
