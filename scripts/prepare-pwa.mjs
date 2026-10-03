import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'dist/inventory-app/browser';
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}
const files = (await walk(root)).filter(file => /\.(js|css|html|png|ico|svg|webmanifest|woff2)$/.test(file) && !file.endsWith('sw.js')).sort();
const hash = createHash('sha256');
hash.update(await readFile('public/sw.js'));
for (const file of files) { hash.update(relative(root, file)); hash.update(await readFile(file)); }
const assets = files.map(file => '/' + relative(root, file).replaceAll('\\', '/'));
const worker = (await readFile('public/sw.js', 'utf8'))
  .replace('__PWA_VERSION__', hash.digest('hex').slice(0, 20))
  .replace('/*__PWA_ASSETS__*/ []', JSON.stringify(assets));
await writeFile(join(root, 'sw.js'), worker);
console.log('PWA shell prepared: ' + assets.length + ' local assets.');
