const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('Custom and Grammar report answers, guided practice and session completion to the global study clock',()=>{
  const custom=read('custom-collection.js');
  const grammar=read('grammar.js');
  for(const source of [custom,grammar]){
    assert.match(source,/KTFStudyClock\?\.onQuizStart\(/);
    assert.match(source,/KTFStudyClock\?\.onGuided\(/);
    assert.match(source,/KTFStudyClock\?\.onAnswer\(/);
    assert.match(source,/KTFStudyClock\?\.onQuizFinish\(/);
  }
  assert.match(grammar,/function recordStudyAnswer\(/);
  assert.match(grammar,/attempt\.studyClockRecorded=true/);
  assert.match(grammar,/if\(session\.phase==='feedback'\)recordStudyAnswer\(\)/);
});

test('Manga Reader reports unique pages, successful analysis, exercises and new saved vocabulary',()=>{
  const manga=read('manga-reader.js');
  const clock=read('study-clock.js');
  assert.match(manga,/KTFStudyClock\?\.onMangaPage\(/);
  assert.match(manga,/KTFStudyClock\?\.onMangaAnalysis\(/);
  assert.match(manga,/KTFStudyClock\?\.onMangaSaved\(/);
  assert.match(manga,/KTFStudyClock\?\.onAnswer\(\{source:'manga'/);
  assert.match(clock,/clock\.stats\.mangaPageIds\.includes\(key\)/);
  assert.match(clock,/sectionNames = \['kana','words','custom','grammar','manga'\]/);
});

test('My Study Time has per-source session details and does not tally while paused',()=>{
  const clock=read('study-clock.js');
  assert.match(clock,/function accumulateTime\(/);
  assert.match(clock,/!track\(\) \|\| document\.hidden/);
  assert.match(clock,/activeStats\(section\)\.started\+\+/);
  assert.match(clock,/activeStats\(section\)\.finished\+\+/);
  assert.match(clock,/activityRows=sectionNames\.map/);
  assert.match(clock,/readingCorrect/);
  assert.match(clock,/meaningCorrect/);
  assert.match(clock,/stats\.errors\[key\]/);
});
