const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.goto('/');
  await page.evaluate(()=>{document.getElementById('languageSelect').value='en';document.getElementById('languageSelect').dispatchEvent(new Event('change'));});
});
async function addCustom(page,surface='学校',romaji='gakkou'){
  await page.evaluate(async({surface,romaji})=>{
    await window.KTFCloud.addCustomEvent('custom_upsert',{item:{id:surface,kind:'word',surface,romaji,meaning:'school',source:'Test · Chapter 1',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}});
    await window.KTFCustomCollection.refresh();
  },{surface,romaji});
  await page.locator('#openCustomButton').click();
  await page.locator('[data-custom-filter="word"]').click();
  await page.locator('#customSelectAll').click();
}
test('custom long vowels, results, selected review and persisted session history',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await addCustom(page);
  await page.locator('#customMode').selectOption('romaji');
  await page.locator('#customOnePassButton').click();
  await page.locator('#customPracticeAnswer').fill('gakkō');
  await page.locator('#customPracticeCheck').click();
  await expect(page.locator('#customStatsCorrect')).toHaveText('1');
  await page.locator('#customPracticeNext').click();
  await expect(page.locator('#customSummary')).toBeVisible();
  await expect.poll(()=>page.evaluate(async()=> (await KTFCloud.getAttempts()).filter(x=>x.examId==='custom-practice').length)).toBe(1);
  await page.locator('#customSummaryAgain').click();
  await page.locator('#customPracticeAnswer').fill('gakko');
  await page.locator('#customPracticeCheck').click();
  await expect(page.locator('#customStatsCorrect')).toHaveText('0');
  await page.locator('#customPracticeNext').click();
  await page.locator('#customSummaryReview').click();
  await expect(page.locator('dialog[open] input[type=checkbox]')).toHaveCount(1);
  await page.locator('dialog[open] .button-primary').click();
  await expect(page.locator('#customPractice')).toBeVisible();
  expect(errors).toEqual([]);
});
test('grammar partial scoring, pause, settings persistence and review',async({page})=>{
  await page.locator('#openGrammarButton').click();
  await page.locator('#grammarTimerMode').selectOption('timer');
  await page.locator('#grammarTimerHours').fill('1');
  await page.locator('#grammarTimerMinutes').fill('2');
  await page.locator('#grammarTimerMinutes').blur();
  await page.locator('#grammarOnePass').click();
  const japanese=await page.locator('#grammarJapanese').textContent();
  const meaning=await page.evaluate(text=>KTFGrammar.lessons.flatMap(l=>l.examples).find(e=>e.japanese===text).meanings.en[0],japanese);
  await page.locator('#grammarRomaji').fill('wrong');await page.locator('#grammarMeaning').fill(meaning);await page.locator('#grammarCheck').click();
  await expect(page.locator('#grammarSkillStats')).toContainText('Meaning: 100%');
  await page.locator('#grammarPause').click();await expect(page.locator('#grammarNext')).toBeDisabled();
  await page.locator('#grammarFinish').click();
  await expect(page.locator('#grammarErrors .hardest-count')).toHaveText('1/2');
  await page.locator('#grammarReview').click();await page.locator('dialog[open] .button-primary').click();
  await expect(page.locator('#grammarJapanese')).toHaveText(japanese);
  await page.locator('#grammarSkip').click();await expect(page.locator('#grammarNext')).toBeEnabled();
  await page.locator('#grammarFinish').click();await page.locator('#grammarSummaryBack').click();
  await page.reload();await page.locator('#openGrammarButton').click();
  await expect(page.locator('#grammarTimerHours')).toHaveValue('1');await expect(page.locator('#grammarTimerMinutes')).toHaveValue('2');
});
test('custom guided passes, rapid fire and guess limits retain the original session behavior',async({page})=>{
  await addCustom(page);
  await page.locator('#customMode').selectOption('romaji');
  await page.locator('#customRapidEnabled').check();await page.locator('#customRapidSeconds').fill('1');
  await page.locator('#customLearnButton').click();
  for(let i=0;i<3;i++){
    await expect(page.locator('#customRapidIndicator')).toBeHidden();
    await expect(page.locator('#customGuidedAnswer')).toContainText('gakkou');
    await page.locator('#customGuidedNext').click();
  }
  await expect(page.locator('#customRapidIndicator')).toBeVisible();
  await expect(page.locator('#customStatsAnswered')).toHaveText('1',{timeout:4000});
  await expect(page.locator('#customPracticeNext')).toBeVisible();
  await expect(page.locator('#customLearningProgress [role=progressbar]')).toHaveAttribute('aria-valuemax','6');
  await page.locator('#customFinishLesson').click();await page.locator('#customSummaryBack').click();
  await page.locator('#customRapidEnabled').uncheck();await page.locator('#customTimerMode').selectOption('guesses');await page.locator('#customGuessCount').fill('2');
  await page.locator('#customPracticeButton').click();await expect(page.locator('#customGuessProgress')).toContainText('0 / 2');
  for(let i=0;i<2;i++){await page.locator('#customPracticeSkip').click();await page.locator('#customPracticeNext').click();}
  await expect(page.locator('#customSummaryEyebrow')).toHaveText('Guess limit reached');
  await page.reload();await page.locator('#openCustomButton').click();await expect(page.locator('#customMode')).toHaveValue('romaji');
});
test('original word practice uses the shared long-vowel matcher and keeps its panel',async({page})=>{
  await page.evaluate(()=>{
    const word=window.KTFBridge.words.find(word=>word.readings.includes('gakkou'));
    if(!word)throw Error('School is missing from the word bank');
    startQuiz('words',[word],'words','reading');
  });
  await page.locator('#answerInput').fill('gakkō');await page.locator('#checkButton').click();await expect(page.locator('#correctStat')).toHaveText('1');
  await page.locator('#finishLessonButton').click();await page.locator('#backToSelection').click();
  await expect(page.locator('#setupScreen .side-panel #openWordsButton')).toBeVisible();
});
test('navigation restores scroll, shares tabs and blocks overlapping sessions',async({page})=>{
  await page.evaluate(()=>window.scrollTo(0,350));
  const before=await page.evaluate(()=>scrollY);
  await page.evaluate(()=>document.getElementById('openGrammarButton').click());
  await expect(page.locator('#grammarScreen .study-switcher')).toBeVisible();
  await page.locator('#grammarBack').click();
  expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(3);
  await page.goBack();await expect(page.locator('#grammarScreen')).toBeVisible();
  await page.locator('#grammarOnePass').click();
  await page.locator('#progressOpen').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('[data-exam="kana-basics"]').click();
  await expect(page.locator('#examScreen')).toBeHidden();await expect(page.locator('#grammarPractice')).toBeVisible();
});
test('exam results lead to selectable feedback practice and historical detail',async({page})=>{
  await page.locator('#progressOpen').click();await page.locator('[data-exam="kana-basics"]').click();
  for(let i=0;i<30;i++)await page.locator('#examSkip').click();
  await expect(page.locator('#examResult')).toBeVisible();
  await expect(page.locator('#examResultMistakes .exam-mistake')).toHaveCount(30);
  await page.locator('#examReview').click();
  await page.getByRole('button',{name:'Clear selection',exact:true}).click();
  await page.locator('dialog[open] input[type=checkbox]').first().check();
  await page.locator('dialog[open] .button-primary').click();
  await page.locator('#examSkip').click();await expect(page.locator('#examReviewFeedback')).toBeVisible();
  await page.locator('#examNext').click();await expect(page.locator('#examResult')).toBeVisible();
  await page.locator('#examBack').click();await page.locator('[data-attempt]').first().click();await expect(page.locator('#examResult')).toBeVisible();
});
test('libraries and practice fit a mobile viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const id of ['openCustomButton','openGrammarButton']){
    await page.locator('#'+id).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished)));
    await page.screenshot({path:`test-results/${id}-mobile.png`,fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    const layout=await page.evaluate(id=>{
      const screen=document.getElementById(id==='openCustomButton'?'customScreen':'grammarScreen');
      const library=screen.querySelector('.custom-library,.grammar-library').getBoundingClientRect();
      const sidebar=screen.querySelector('.side-panel').getBoundingClientRect();return {difference:Math.abs(library.top-sidebar.top),beside:sidebar.left>library.right};
    },id);
    expect(layout.beside).toBe(true);expect(layout.difference).toBeLessThan(3);
    await page.screenshot({path:`test-results/${id}-desktop.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});
  }
});
