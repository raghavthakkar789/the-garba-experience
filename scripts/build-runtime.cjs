/* Dependency-free consolidation: preserve source order and bytes/semantics. */
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const dist = path.resolve(__dirname, '../dist');
const manifest = require('./runtime-manifest.json');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
for (const [kind, extension, pattern, tag] of [
  ['styles', 'css', /<link rel="stylesheet" href="[^\"]+"\s*\/>/g, name => `<link rel="stylesheet" href="${name}" />`],
  ['scripts', 'js', /<script defer src="[^\"]+"><\/script>/g, name => `<script defer src="${name}"></script>`],
]) {
  const content = manifest[kind].map(name => `/* ${name} */\n${fs.readFileSync(path.join(dist, name), 'utf8')}`).join(extension === 'js' ? '\n;\n' : '\n');
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  const filename = `runtime.${hash}.${extension}`;
  fs.writeFileSync(path.join(dist, filename), content);
  let replaced = false;
  html = html.replace(pattern, () => { if (replaced) return ''; replaced = true; return tag(filename); });
  if (!replaced) throw Error(`Missing ${kind} entry point`);
  for (const old of fs.readdirSync(dist))
    if (new RegExp(`^runtime\\.[a-f0-9]{12}\\.${extension}$`).test(old) && old !== filename)
      fs.unlinkSync(path.join(dist, old));
  console.log(`${kind}: ${manifest[kind].length} requests -> 1 (${filename}, ${Buffer.byteLength(content)} bytes)`);
}
html = html.replace(/\n(?:[ \t]*\n){2,}/g, '\n\n');
fs.writeFileSync(path.join(dist, 'index.html'), html);
