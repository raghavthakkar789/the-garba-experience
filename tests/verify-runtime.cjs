const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const dist = path.resolve(__dirname, '../dist'), manifest = require('../scripts/runtime-manifest.json');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
for (const [kind, extension] of [['styles','css'], ['scripts','js']]) {
  const expected = require('../scripts/runtime-source.cjs')(dist, manifest[kind], extension);
  const hash = crypto.createHash('sha256').update(expected).digest('hex').slice(0,12);
  const filename = `runtime.${hash}.${extension}`;
  assert(html.includes(`"${filename}"`), 'Rebuild runtime after source changes');
  assert.equal(fs.readFileSync(path.join(dist, filename),'utf8'),expected,'source contents and order preserved');
  assert.equal((html.match(extension === 'js' ? /<script defer src=/g : /<link rel="stylesheet"/g)||[]).length,1);
}
console.log('PASS: deterministic runtime bundles, source order/content, matching hashes and two entry requests');

const vendor = path.join(dist, 'vendor/gsap-3.15.0');
const provenance = JSON.parse(fs.readFileSync(path.join(vendor,'provenance.json'),'utf8'));
for (const [name,sha256] of Object.entries(provenance.files)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(vendor,name))).digest('hex'),sha256,'pinned GSAP file: '+name);
}
console.log('PASS: local GSAP/ScrollToPlugin dependency files match recorded package hashes');
