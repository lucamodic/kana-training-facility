const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const source = read('custom-collection.js');

function load() {
  const output = source.replace('  attach();\n  refresh().catch(() => {});','  window.KTFCustomSessionTest = {answerTypes,validInteger,shuffledQuestions,accepted};');
  const window = {KTFCloud:{},KTFBridge:{isQuizActive:()=>false}};
  vm.runInNewContext(output,{window,document:{documentElement:{lang:'en'}},console,crypto:{randomUUID:()=> 'test-id'}},{filename:'custom-collection.js'});
  return window.KTFCustomSessionTest;
}

test('custom practice has all three modes and the same configurable session controls',()=>{
  const html=read('index.html');
  for(const id of ['customLearnButton','customPracticeButton','customOnePassButton','customMode','customTimerMode','customSessionTimerFields','customGuessFields','customRapidEnabled','customRapidSeconds','customPauseSession','customClockToggle','customGuidedBlock']) {
    assert.ok(html.includes(`id="${id}"`),id);
  }
  for(const mode of ['off','custom','guesses'])assert.ok(html.includes(`<option value="${mode}">`));
  assert.match(source,/session\.mode!=='infinite'/);
  assert.match(source,/session\.mode==='onepass'/);
  assert.match(source,/session\.mode==='learn'/);
  assert.match(source,/session\.round===6/);
  assert.doesNotMatch(source,/return bank\.slice\(0,20\)/);
});

test('custom session input validation prevents invalid time, guesses, and rapid-fire limits',()=>{
  const {validInteger}=load();
  assert.equal(validInteger('59',0,59),59);
  assert.equal(validInteger('60',0,59),null);
  assert.equal(validInteger('0',1,10000),null);
  assert.equal(validInteger('10001',1,10000),null);
  assert.equal(validInteger('300',1,300),300);
  assert.equal(validInteger('301',1,300),null);
  assert.equal(validInteger('1.5',1,300),null);
});

test('custom choices respect reading, meaning, mixed mode and avoid adjacent repeats',()=>{
  const {answerTypes,shuffledQuestions}=load();
  const reading={id:'r',romaji:'ki',meaning:''};
  const meaning={id:'m',romaji:'',meaning:'spirit'};
  assert.deepEqual(Array.from(answerTypes(reading,'romaji')),['romaji']);
  assert.deepEqual(Array.from(answerTypes(reading,'meaning')),[]);
  assert.deepEqual(Array.from(answerTypes(meaning,'mixed')),['meaning']);
  const pool=[{id:'a',romaji:'a',meaning:'first'},{id:'b',romaji:'b',meaning:'second'}];
  for(let i=0;i<20;i++){
    const deck=shuffledQuestions({pool,lastItem:'a',answerMode:'mixed'});
    assert.equal(deck.length,2);
    assert.equal(deck[0].item.id,'b');
    assert.ok(['romaji','meaning'].includes(deck[0].type));
  }
});

test('the session stores per-answer review events but guided passes only progress through the deck',()=>{
  assert.match(source,/if\(correct\) session\.correct\+\+/);
  assert.match(source,/persist\('custom_review',\{itemId:question\.item\.id,correct/);
  assert.match(source,/session\.guided=session\.mode==='learn' && session\.round<=3/);
  assert.match(source,/if \(!session \|\| session\.done \|\| session\.paused \|\| session\.guided \|\| session\.checked\) return/);
  assert.match(source,/session\.answered>=session\.guessLimit/);
  assert.match(source,/session\.rapidElapsedMs>=session\.rapidSeconds\*1000/);
});

test('the new version uses unique element ids and updates all PWA assets',()=>{
  const html=read('index.html');
  const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),match=>match[1]);
  assert.equal(new Set(ids).size,ids.length);
  assert.match(html,/id="appVersion">v30\.0/);
  const sw=read('sw.js');
  assert.match(sw,/offline-v30-grammar-foundations/);
  for(const file of ['styles.css','app.js','cloud-sync.js','manga-reader.js','custom-collection.js']){
    assert.ok(html.includes(`${file}?v=30.0`));
    assert.ok(sw.includes(`${file}?v=30.0`));
  }
  assert.equal(JSON.parse(read('package.json')).version,'30.0.0');
});
