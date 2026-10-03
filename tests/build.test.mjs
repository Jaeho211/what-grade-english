import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
const root = new URL('../', import.meta.url);
test('static build: executable modules, full bank and relative deployment paths', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fileURLToPath(root), stdio: 'pipe' });
  const html = await readFile(new URL('dist/index.html', root), 'utf8');
  assert.ok(html.includes('lang="ko"'));
  assert.ok(html.includes('src="./web/app.js"'));
  assert.ok(!/(?:src|href)="\//.test(html));
  for (const file of ['web/app.js', 'quiz/engine.js', 'quiz/schema.js']) {
    execFileSync(process.execPath, ['--check', fileURLToPath(new URL('dist/' + file, root))], { stdio: 'pipe' });
    const source = await readFile(new URL('dist/' + file, root), 'utf8');
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.ok(!match[1].endsWith('.ts'));
      await stat(new URL(match[1], new URL('dist/' + file, root)));
    }
  }
  const bank = JSON.parse(await readFile(new URL('dist/quiz/data/bank.json', root), 'utf8'));
  assert.equal(bank.length, 168);
  const { startQuiz } = await import('../dist/quiz/engine.js');
  assert.ok(startQuiz(bank).pending);
  for (const file of ['styles.css', 'icon.svg']) await stat(new URL('dist/' + file, root));
});
