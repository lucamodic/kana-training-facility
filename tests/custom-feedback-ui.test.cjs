const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');

test('Custom can open from the main menu and Manga Reader and return to the original screen', () => {
  const html=read('index.html');
  const custom=read('custom-collection.js');
  assert.equal((html.match(/id="openCustomButton"/g)||[]).length,1);
  assert.equal((html.match(/id="mangaOpenCustom"/g)||[]).length,1);
  assert.match(custom,/\$\('mangaOpenCustom'\)\.addEventListener\('click',open\)/);
  assert.match(custom,/returnView = !\$\('mangaScreen'\)\.hidden \? 'manga' : 'setup'/);
  assert.match(custom,/\$\('customBack'\)\.addEventListener\('click',\(\)=>close\(\)\)/);
});

test('Manga save buttons show a persistent saved state and animated confirmation', () => {
  const reader=read('manga-reader.js');
  const custom=read('custom-collection.js');
  const style=read('styles.css');
  assert.match(reader,/function updateSaveButton\(/);
  assert.match(reader,/\.classList\.add\('just-saved'\)/);
  assert.match(reader,/manga-save-feedback/);
  assert.match(reader,/ktf:custom-collection-changed/);
  assert.match(reader,/\.isSaved\?\.\('word',word\)/);
  assert.match(reader,/\.isSaved\?\.\('kanji',entry\)/);
  assert.match(custom,/const isSaved = \(kind, data\) =>/);
  assert.match(style,/\.manga-save-custom\.is-saved/);
  assert.match(style,/@keyframes ktf-save-confirm/);
});

test('Release assets are cache-busted together without changing existing manga cache namespace', () => {
  const html=read('index.html');
  const sw=read('sw.js');
  for (const file of ['styles.css','manga-reader.js','custom-collection.js','cloud-sync.js']) {
    assert.ok(html.includes(file+'?v=29.1'));
    assert.ok(sw.includes(file+'?v=29.1'));
  }
  assert.match(sw,/offline-v29-1-custom-practice-parity/);
  assert.match(html,/id="appVersion">v29\.1</);
  assert.match(read('manga-cache.js'),/ktf-manga-reader-cache/);
});
