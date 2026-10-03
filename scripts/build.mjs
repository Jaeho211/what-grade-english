import { mkdir, readFile, writeFile, rm, readdir, copyFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join } from 'node:path';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
async function compile(directory) {
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'data') await compile(path); continue; }
    if (!entry.name.endsWith('.ts')) continue;
    const source = await readFile(new URL(path, root), 'utf8');
    const output = stripTypeScriptTypes(source).replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2');
    const target = path.replace(/^src\//, '').replace(/\.ts$/, '.js');
    await mkdir(new URL(dirname(target) + '/', dist), { recursive: true });
    await writeFile(new URL(target, dist), output);
  }
}
await compile('src');
const bank = [];
for (let level = 1; level <= 7; level++) bank.push(...JSON.parse(await readFile(new URL(`src/quiz/data/level${level}.json`, root), 'utf8')));
await mkdir(new URL('quiz/data/', dist), { recursive: true });
await writeFile(new URL('quiz/data/bank.json', dist), JSON.stringify(bank));
for (const name of ['index.html', 'styles.css', 'icon.svg']) await copyFile(new URL('public/' + name, root), new URL(name, dist));
console.log(`Built static app in dist with ${bank.length} questions.`);
