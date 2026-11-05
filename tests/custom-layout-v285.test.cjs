const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');

test('custom input is in a separate add-item dialog', () => {
  const html = read('index.html');
  const js = read('custom-collection.js');
  assert.match(html, /<dialog id="customEditorDialog"[^>]+aria-labelledby="customAddTitle"/);
  assert.match(html, /id="customAddButton"[^>]+aria-controls="customEditorDialog"/);
  assert.match(js, /\$\('customAddButton'\)\.addEventListener\('click',\(\)=>showEditor\(\)\)/);
  assert.match(js, /if \(!dialog\.open\) dialog\.showModal\(\)/);
  assert.match(js, /if \(ok\) hideEditor\(\)/);
  assert.doesNotMatch(js, /data-custom-edit/);
  assert.doesNotMatch(js, /data-custom-remove/);
  assert.match(js, /\$\('customEditorDialog'\)\.addEventListener\('close',resetForm\)/);
});

test('custom uses tabs, shared search toolbar and compact selectable tiles', () => {
  const html = read('index.html');
  const css = read('styles.css');
  const toolbar = html.slice(html.indexOf('<div class="custom-toolbar">'),html.indexOf('<div id="customItems"'));
  for (const id of ['customSearch','customSelectAll','customSelectNone']) assert.ok(toolbar.includes(`id="${id}"`));
  for (const filter of ['all','kanji','word']) assert.ok(html.includes(`data-custom-filter="${filter}"`));
  assert.match(css,/\.custom-screen \.custom-toolbar\{display:grid/);
  assert.match(read('custom-collection.js'),/data-custom-tile/);
  assert.match(read('custom-collection.js'),/aria-pressed/);
  assert.match(css,/\.custom-browse\[hidden\]/);
  assert.match(css,/\.custom-practice-card::before/);
});

test('study timer is always floating, minimized by default, retains setup inputs and supports moving', () => {
  const html = read('index.html');
  const js = read('study-clock.js');
  const css = read('styles.css');
  assert.match(html,/global-study shell is-floating is-minimized/);
  assert.match(js,/clockElement\.classList\.add\('is-floating'\)/);
  assert.match(js,/let isMinimized = true/);
  assert.match(js,/titlebar\.addEventListener\('pointerdown', pointerStart\)/);
  assert.match(css,/\.global-study\.is-floating \.study-clock-inputs\{display:flex/);
  assert.match(css,/\.global-study\.is-floating\.is-active \.study-clock-inputs\{display:none/);
  assert.match(js,/ktf-study-clock-window-minimized/);
});

test('manga reader omits requested status lines and has taller reading panels', () => {
  const html = read('index.html');
  const reader = read('manga-reader.js');
  const css = read('styles.css');
  assert.doesNotMatch(html,/When you analyze, the image is sent/);
  assert.doesNotMatch(reader,/toast\(pages\.length \? ct\('opened'\)/);
  assert.match(css,/\.manga-image-scroller\{max-height:min\(90dvh,1200px\)/);
  assert.match(css,/\.manga-readings-scroll\{height:min\(90dvh,1200px\)/);
  assert.doesNotMatch(html,/id="customAccountHelp"|id="customStatus"/);
});
