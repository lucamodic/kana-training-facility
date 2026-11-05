const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadCollection() {
  const source = read('custom-collection.js').replace(
    '  attach();\n  refresh().catch(() => {});',
    '  window.KTFCustomTest = {fold};'
  );
  const window = {KTFCloud:{},KTFBridge:{isQuizActive:()=>false}};
  vm.runInNewContext(source,{window,document:{documentElement:{lang:'en'}},crypto:{randomUUID:()=> 'test-id'},console});
  return window.KTFCustomTest;
}

test('custom collection and session settings share the main page two-column layout', () => {
  const html = read('index.html');
  const css = read('styles.css');
  const section = html.slice(html.indexOf('id="customBrowse"'), html.indexOf('id="customPractice"'));
  assert.match(section,/class="custom-content"/);
  assert.match(section,/class="side-panel custom-side-panel"/);
  assert.match(section,/class="side-grid"/);
  assert.match(section,/class="custom-session-choices session-choices"/);
  for (const id of ['customLearnButton','customPracticeButton','customOnePassButton','customTimerMode','customMode','customRapidEnabled','customSideSelected']) assert.match(section,new RegExp(`id="${id}"`));
  assert.match(css,/\.custom-screen \.custom-browse\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(280px,320px\)/);
});

test('the trash action follows Deselect visible, asks for confirmation and writes cloud tombstones in one batch', () => {
  const html = read('index.html');
  const js = read('custom-collection.js');
  const cloud = read('cloud-sync.js');
  const toolbar = html.slice(html.indexOf('class="custom-select-actions"'), html.indexOf('id="customItems"'));
  assert.ok(toolbar.indexOf('id="customDeleteSelected"') > toolbar.indexOf('id="customSelectNone"'));
  assert.match(toolbar,/aria-label="Delete selected items"/);
  assert.match(js,/window\.confirm\(question\)/);
  assert.match(js,/const events=targets\.map\(item=>\(\{type:'custom_delete',payload:\{id:item\.id\}\}\)\)/);
  assert.match(js,/await cloud\.addCustomEvents\(events\)/);
  assert.match(cloud,/async function addCustomEvents\(events\)/);
  assert.match(cloud,/await putMany\(records\)/);
  const {fold} = loadCollection();
  const time = ['2026-11-05T00:00:00.000Z','2026-11-05T00:00:01.000Z','2026-11-05T00:00:02.000Z','2026-11-05T00:00:03.000Z'];
  const item = (id,surface) => ({id,kind:'kanji',surface,updatedAt:time[0]});
  const rows = [
    {id:'1',time:time[0],type:'custom_upsert',payload:{item:item('a','森')}},
    {id:'2',time:time[1],type:'custom_upsert',payload:{item:item('b','気')}},
    {id:'3',time:time[2],type:'custom_delete',payload:{id:'a'}},
    {id:'4',time:time[3],type:'custom_delete',payload:{id:'b'}}
  ];
  assert.equal(fold(rows).items.length,0);
});

test('custom quiz and results reuse the classes of the main trainer and finish control', () => {
  const html = read('index.html');
  const js = read('custom-collection.js');
  const practice = html.slice(html.indexOf('id="customPractice"'),html.indexOf('id="customSummary"'));
  const summary = html.slice(html.indexOf('id="customSummary"'),html.indexOf('id="examScreen"'));
  for (const token of ['class="quiz-top"','class="quiz-top-right"','class="stats"','class="quiz-panel custom-practice-card"','class="quiz-bottom"','class="answer-input"','class="quiz-actions custom-practice-actions"']) assert.ok(practice.includes(token),token);
  for (const id of ['customPracticeExit','customFinishLesson','customPauseSession','customPracticeClock']) assert.ok(practice.includes(`id="${id}"`),id);
  for (const token of ['class="summary-card"','class="stats summary-stats"','class="hardest-list"','class="summary-actions"']) {
    if (token==='class="hardest-list"') assert.match(js,/class="hardest-list"/);
    else assert.ok(summary.includes(token),token);
  }
  for (const id of ['customSummaryBack','customSummaryAgain','customSummaryReview','customSummaryAccuracy']) assert.ok(summary.includes(`id="${id}"`),id);
  assert.match(js,/function completeSession\(reason=''/);
  assert.match(js,/function retryPractice\(onlyMistakes=false\)/);
  assert.match(js,/session\.history\.push/);
});

test('v30.0 packages the complete release with updated PWA references', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  assert.equal(JSON.parse(read('package.json')).version,'30.0.0');
  assert.match(html,/id="appVersion">v30\.0</);
  assert.match(sw,/offline-v30-grammar-foundations/);
  for (const asset of ['styles.css','custom-collection.js','cloud-sync.js','manga-reader.js']) {
    assert.ok(html.includes(`${asset}?v=30.0`));
    assert.ok(sw.includes(`${asset}?v=30.0`));
  }
  assert.match(read('manga-cache.js'),/ktf-manga-reader-cache/);
});
