const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const pkg = require(path.join(root, 'package.json'));

test('Word Challenge appears only once and is inside the right-hand practice controls', () => {
  assert.equal((html.match(/id="openWordsButton"/g) || []).length, 1);
  assert.equal((html.match(/id="wordsLaunchText"/g) || []).length, 1);
  assert.equal((html.match(/id="wordAvailableCount"/g) || []).length, 1);
  const side = html.slice(html.indexOf('<aside class="side-panel"'), html.indexOf('</aside>'));
  assert.match(side, /<div class="session-choices">[\s\S]*id="onePassButton"[\s\S]*id="openWordsButton"/);
  const top = html.slice(html.indexOf('<div class="study-switcher">'), html.indexOf('<div class="main-panel"'));
  assert.doesNotMatch(top, /id="openWordsButton"/);
});

test('version, package, and updated offline cache match this release', () => {
  assert.match(html, /id="appVersion">v29\.2</);
  assert.equal(pkg.version, '29.2.0');
  assert.match(sw, /offline-v29-2-custom-main-parity/);
  assert.doesNotMatch(sw, /if \(SHELL_URLS\.has\(url\.href\)\)/);
  assert.match(sw, /await cache\.match\(request\)/);
});
