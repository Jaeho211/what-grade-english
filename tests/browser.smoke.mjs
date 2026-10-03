import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base = process.env.QUIZ_BASE_URL || 'http://127.0.0.1:4173/';
const bank = JSON.parse(await readFile(new URL('../dist/quiz/data/bank.json', import.meta.url), 'utf8'));
await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__sharedText = text; } }, configurable: true });
  });
  await page.goto(base);
  await page.locator('#start').waitFor();
  await page.screenshot({ path: new URL('../test-results/mobile-home.png', import.meta.url).pathname, fullPage: true });
  await page.locator('#start').click();
  for (let i = 0; i < 10; i++) {
    const passage = await page.locator('.question-card .passage').innerText();
    const question = bank.find(q => q.passage === passage);
    assert.ok(question, passage);
    const text = question.choices[question.answer];
    const choices = page.locator('.choice');
    let correctIndex = -1;
    for (let index = 0; index < 4; index++) if ((await choices.nth(index).locator('span').nth(1).innerText()) === text) correctIndex = index;
    assert.ok(correctIndex >= 0);
    assert.equal(await page.locator('#feedback').innerText(), '');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    if (i === 5) await page.screenshot({ path: new URL('../test-results/mobile-question.png', import.meta.url).pathname, fullPage: true });
    await choices.nth(correctIndex).click();
    await page.locator('#next').waitFor();
    assert.ok((await page.locator('#feedback').innerText()).includes('정답이에요!'));
    assert.equal(await page.locator('.choice:disabled').count(), 4);
    await page.locator('#next').click();
  }
  await page.locator('#share').waitFor();
  assert.ok((await page.locator('.result h1').innerText()).includes('고등학교 3학년'));
  assert.equal(await page.locator('.review').count(), 10);
  await page.locator('.review summary').first().click();
  assert.ok((await page.locator('.review').first().innerText()).includes('내 답:'));
  await page.locator('#share').click();
  assert.ok((await page.evaluate(() => window.__sharedText)).includes('10문제 중 10개 정답'));
  assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('what-grade-english:recent:v1')))).length, 10);
  await page.screenshot({ path: new URL('../test-results/mobile-result.png', import.meta.url).pathname, fullPage: true });
  await page.locator('#again').click();
  for (let i = 0; i < 10; i++) { await page.locator('#skip').click(); await page.locator('#next').click(); }
  assert.ok((await page.locator('.result h1').innerText()).includes('초등학교 6학년'));
  assert.ok((await page.locator('.result-note').innerText()).includes('정답 근거가 적어'));
  const timed = await browser.newPage({ viewport: { width: 360, height: 800 } });
  timed.on('pageerror', error => errors.push(error.message));
  await timed.clock.install();
  await timed.goto(base);
  await timed.locator('#start').click();
  await timed.clock.runFor(20_050);
  assert.ok((await timed.locator('#feedback').innerText()).includes('시간이 끝났어요'));
  await timed.locator('#next').click();
  assert.equal(await timed.locator('.choice').count(), 4);
  assert.ok(await timed.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  desktop.on('pageerror', error => errors.push(error.message));
  await desktop.goto(base);
  await desktop.locator('#start').waitFor();
  await desktop.screenshot({ path: new URL('../test-results/desktop-home.png', import.meta.url).pathname, fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: mobile perfect run, all skips, timeout, review, share, recent history, desktop; no browser errors.');
} finally { await browser.close(); }
