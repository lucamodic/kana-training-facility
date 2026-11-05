const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname,'..');
const filename = path.join(root,'custom-collection.js');
const source = fs.readFileSync(filename,'utf8').replace(
  '  attach();\n  refresh().catch(() => {});',
  '  window.KTFCustomTest = {fold,kanaToRomaji,accepted,itemKey};'
);
function load() {
  const window = {KTFCloud:{},KTFBridge:{isQuizActive:()=>false}};
  const context = vm.createContext({window,document:{documentElement:{lang:'es'}},crypto:{randomUUID:()=> 'test-id'},console});
  vm.runInContext(source,context,{filename});
  return window.KTFCustomTest;
}

test('custom collection folds saved words, edits, deletions and review history',()=>{
  const {fold} = load();
  const word = {id:'word-1',kind:'word',surface:'好き',romaji:'suki',meaning:'like',updatedAt:'2026-11-04T18:00:00.000Z'};
  const kanji = {id:'kanji-1',kind:'kanji',surface:'気',meaning:'spirit',updatedAt:'2026-11-04T18:01:00.000Z'};
  const events = [
    {id:'a',type:'custom_upsert',payload:{item:word},time:'2026-11-04T18:00:00.000Z'},
    {id:'b',type:'custom_upsert',payload:{item:kanji},time:'2026-11-04T18:01:00.000Z'},
    {id:'c',type:'custom_review',payload:{itemId:'word-1',correct:true},time:'2026-11-04T18:02:00.000Z'},
    {id:'d',type:'custom_review',payload:{itemId:'word-1',correct:false},time:'2026-11-04T18:03:00.000Z'},
    {id:'e',type:'custom_upsert',payload:{item:{...word,meaning:'to like',updatedAt:'2026-11-04T18:04:00.000Z'}},time:'2026-11-04T18:04:00.000Z'},
    {id:'f',type:'custom_delete',payload:{id:'kanji-1'},time:'2026-11-04T18:05:00.000Z'}
  ];
  const output=fold(events);
  assert.equal(output.items.length,1);
  assert.equal(output.items[0].meaning,'to like');
  assert.equal(output.scores.get('word-1').correct,1);
  assert.equal(output.scores.get('word-1').total,2);
});

test('kana from manga provides romaji when the reading can be transliterated',()=>{
  const {kanaToRomaji} = load();
  assert.equal(kanaToRomaji('すき'),'suki');
  assert.equal(kanaToRomaji('ショッピング'),'shoppingu');
  assert.equal(kanaToRomaji('がっこう'),'gakkou');
  assert.equal(kanaToRomaji('しゅじん'),'shujin');
  assert.equal(kanaToRomaji('part of whole word'),'');
});

test('reading and meaning practice check normalized accepted answers',()=>{
  const {accepted} = load();
  assert.equal(accepted('SUKI','suki','romaji'),true);
  assert.equal(accepted('shuu','shū / shuu','romaji'),true);
  assert.equal(accepted('AFFECTION','like / affection','meaning'),true);
  assert.equal(accepted('wrong','like / affection','meaning'),false);
});

test('reader and navigation include custom collection hooks',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const reader=fs.readFileSync(path.join(root,'manga-reader.js'),'utf8');
  const cloud=fs.readFileSync(path.join(root,'cloud-sync.js'),'utf8');
  assert.match(html,/id="customScreen"/);
  assert.match(html,/id="openCustomButton"/);
  assert.match(html,/src="\.\/custom-collection\.js\?v=29\.0"/);
  assert.match(reader,/data-custom-word/);
  assert.match(reader,/data-custom-kanji/);
  assert.match(cloud,/addCustomEvent,getCustomEvents/);
});
