const release=require('./release-info.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');

test('Custom has tabs like the kana selector, a modal, and click or drag multi-selection', () => {
  const html = read('index.html');
  const custom = read('custom-collection.js');
  const styles = read('styles.css');
  for (const filter of ['kanji','word','all']) assert.match(html,new RegExp(`role="tab" data-custom-filter="${filter}"`));
  assert.match(html,/id="customEditorDialog"/);
  assert.match(html,/id="customAddButton"/);
  assert.match(custom,/data-custom-tile=/);
  assert.match(custom,/aria-pressed=/);
  assert.match(custom,/addEventListener\('pointerdown'/);
  assert.match(custom,/addEventListener\('pointermove'/);
  assert.match(custom,/function applyDrag\(tile\)/);
  assert.doesNotMatch(custom,/data-custom-edit=/);
  assert.doesNotMatch(custom,/data-custom-remove=/);
  assert.doesNotMatch(custom,/score.correct.*score.total/);
  assert.match(styles,/\.custom-screen \.custom-items\{display:grid/);
  assert.match(styles,/\.custom-screen \.custom-study-actions\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\);align-items:end/);
});

test('Manga reader has separate library and reading surfaces with preserved page strip', () => {
  const html = read('index.html');
  const reader = read('manga-reader.js');
  const manage = html.slice(html.indexOf('id="mangaManageView"'),html.indexOf('id="mangaReadView"'));
  const reading = html.slice(html.indexOf('id="mangaReadView"'),html.indexOf('id="customScreen"'));
  for (const id of ['mangaDrop','mangaChapterForm','mangaLibraryToggle','mangaHistoryPanel']) assert.ok(manage.includes(`id="${id}"`));
  for (const id of ['mangaPageStrip','mangaWorkspace','mangaManageToggle']) assert.ok(reading.includes(`id="${id}"`));
  assert.doesNotMatch(reading,/id="mangaDrop"|id="mangaChapterForm"/);
  assert.match(reader,/function switchMangaView\(view\)/);
  assert.match(reader,/mangaView = 'read'/);
  assert.match(reader,/mangaView = pages\.length \? 'read' : 'manage'/);
  assert.match(reader,/refreshHistory\(\)\.catch/);
});

test('Version 29 keeps old manga data and uses new PWA assets', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  const cache = read('manga-cache.js');
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.version,release.packageVersion);
  assert.match(html,release.labelPattern);
  assert.match(sw,release.cachePattern);
  assert.match(cache,/ktf-manga-reader-cache/);
  for (const filename of ['app.js','styles.css','manga-reader.js','custom-collection.js']) {
    assert.ok(html.includes(`${filename}?v=${release.version}`));
    assert.ok(sw.includes(`${filename}?v=${release.version}`));
  }
});
