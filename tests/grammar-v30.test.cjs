const release=require('./release-info.cjs');
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const load=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=load('index.html');
const js=load('grammar.js');
const sw=load('sw.js');

test('v30 includes grammar navigation and all versioned assets without duplicating IDs',()=>{
  assert.match(html,/id="openGrammarButton"/);
  assert.match(html,/id="openMangaButton"/);
  assert.match(html,/id="grammarScreen"/);
  assert.ok(html.indexOf('id="openGrammarButton"')>html.indexOf('id="openCustomButton"'));
  assert.ok(html.indexOf('id="openMangaButton"')>html.indexOf('id="openGrammarButton"'));
  assert.equal(new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])).size,[...html.matchAll(/\bid="([^"]+)"/g)].length);
  for(const file of ['grammar.js','grammar-data.js','styles.css','custom-collection.js','manga-reader.js']){
    assert.ok(html.includes(`${file}?v=${release.version}`));
    assert.ok(sw.includes(`${file}?v=${release.version}`));
  }
  assert.match(html,release.labelPattern);
  assert.match(sw,release.cachePattern);
});

test('13 grammar lessons contain valid examples with distinct IDs and both languages',()=>{
  const window={};
  vm.runInNewContext(load('grammar-data.js'),{window});
  const {lessons,groups}=window.KTFGrammarData;
  assert.ok(lessons.length>=12);
  assert.equal(groups.length,4);
  const all=lessons.flatMap(l=>l.examples);
  assert.ok(all.length>=36);
  assert.equal(new Set(all.map(x=>x.id)).size,all.length);
  for(const lesson of lessons){
    assert.ok(lesson.title.en&&lesson.title.es&&lesson.concept.en&&lesson.concept.es);
    assert.ok(groups.some(group=>group.id===lesson.group));
    assert.ok(lesson.examples.length>=3);
  }
  for(const item of all){
    assert.ok(item.japanese.match(/[\u3040-\u30ff\u3400-\u9fff]/));
    assert.ok(item.reading.length>=3);
    assert.ok(item.meanings.en.length&&item.meanings.es.length);
    assert.ok(item.breakdown.en&&item.breakdown.es);
  }
});

test('grammar practice always requires separate romaji and meaning answers and has a correction override',()=>{
  for(const id of ['grammarRomaji','grammarMeaning','grammarAnswerForm','grammarCheck','grammarAcceptMeaning','grammarNext','grammarSummary','grammarInfinite','grammarOnePass','grammarLearn'])assert.match(html,new RegExp(`id="${id}"`));
  for(const token of ['matchReading','matchMeaning','readingCorrect','meaningCorrect','session.results.push','session.correct++','addAttempt','grammar-practice','isGuided']) assert.ok(js.includes(token),token);
  assert.ok(js.includes("currentGroup='basics'"));
  assert.ok(js.includes('session.round<3'));
  assert.match(js,/session\.round>=6/);
});

test('grammar remains separate from paid manga analysis and requires no new Supabase event type',()=>{
  assert.ok(!js.includes('ktf-manga-analyze'));
  assert.ok(!js.includes('OPENAI_API_KEY'));
  assert.match(load('setup/supabase-schema.sql'),/exam_attempt/);
  assert.match(load('cloud-sync.js'),/async function addAttempt/);
});
