import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const ignored = new Set(['.git', '.source-media', 'node_modules', 'output', 'tmp', '.playwright-cli']);
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute);
    else files.push(path.relative(root, absolute).split(path.sep).join('/'));
  }
}
await walk(root);
const tracked = process.argv.includes('--tracked')
  ? new Set(execFileSync('git', ['-c', `safe.directory=${path.resolve(root).replaceAll('\\', '/')}`, 'ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0'))
  : null;
const known = new Set(files.filter(file => !tracked || tracked.has(file)));
const caseInsensitive = new Map([...known].map(file => [file.toLowerCase(), file]));
const failures = [];
let references = 0;
function check(from, reference) {
  if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference) || reference.includes('${')) return;
  const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!clean) return;
  let target = path.posix.normalize(clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(from), clean));
  if (target.endsWith('/')) target += 'index.html';
  references++;
  if (known.has(target)) return;
  const correctCase = caseInsensitive.get(target.toLowerCase());
  failures.push(`${from}: ${reference}${correctCase ? ` (case must match ${correctCase})` : ' (file missing)'}`);
}
for (const file of [...known].filter(file => /\.(html|css|js|mjs|md)$/.test(file))) {
  const text = await readFile(path.join(root, file), 'utf8');
  if (file.endsWith('.html')) {
    for (const match of text.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']*)["']/g)) check(file, match[1]);
  } else if (file.endsWith('.css')) {
    for (const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) check(file, match[1]);
  } else if (file.endsWith('.md')) {
    for (const match of text.matchAll(/\]\(([^\s)]+)\)/g)) check(file, match[1]);
  } else {
    for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["']((?:\.{1,2}\/|\/)[^"'\r\n]+)["']/g)) check(file, match[1]);
  }
}
const { projectCatalog } = await import('../js/data/project-catalog.js');
for (const project of projectCatalog) for (const slide of project.slides) {
  for (const reference of [...(slide.images || [slide.src]), ...(slide.poster ? [slide.poster] : [])]) check('index.html', reference);
  assert.ok(!slide.src.endsWith('.gif'), `${project.id}: heavy GIF should use optimized video`);
  if (slide.src.endsWith('.mp4')) assert.equal(slide.video, true, `${project.id}: MP4 must render as a video`);
}
assert.deepEqual(failures, [], failures.join('\n'));
console.log(`Validated ${references} local references, exact filename case, module imports and optimized animation types.`);
