const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.goto('/');
  await page.evaluate(()=>{document.getElementById('languageSelect').value='en';document.getElementById('languageSelect').dispatchEvent(new Event('change'));});
});
test('Custom both mode filters incomplete items and scores reading and meaning separately',async({page})=>{
  await page.evaluate(async()=>{
    await KTFCloud.addCustomEvents([{id:'both',surface:'猫',kind:'word',romaji:'neko',meaning:'cat'},{id:'reading',surface:'犬',kind:'word',romaji:'inu',meaning:''}].map(item=>({type:'custom_upsert',payload:{item}})));
    await KTFCustomCollection.refresh();
  });
  await page.locator('#openCustomButton').click();await page.locator('[data-custom-filter=all]').click();await page.locator('#customSelectAll').click();
  await page.locator('#customMode').selectOption('both');await expect(page.locator('#customBothHelp')).toBeVisible();
  await page.locator('#customOnePassButton').click();
  await expect(page.locator('#customPracticeSymbol')).toHaveText('猫');
  await page.locator('#customPracticeAnswer').fill('neko');await page.locator('#customPracticeMeaning').fill('dog');await page.locator('#customPracticeCheck').click();
  await expect(page.locator('#customStatsCorrect')).toHaveText('0');
  await expect(page.locator('#customPracticeFeedback')).toContainText('✓ Romaji');await expect(page.locator('#customPracticeFeedback')).toContainText('✕ Meaning');
  await page.locator('#customPracticeNext').click();await expect(page.locator('#customSummary')).toBeVisible();
  await expect.poll(()=>page.evaluate(async()=>(await KTFCloud.getCustomEvents()).filter(e=>e.payload.studyReview).length)).toBe(1);
  await page.reload();await page.locator('#openCustomButton').click();await expect(page.locator('#customMode')).toHaveValue('both');
  await expect(page.locator('#spacedReviewStatus')).toContainText('Next review');
});
test('automatic practice handles dual answers, saves schedules and persists across reload',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(async()=>{
    await KTFCloud.addCustomEvent('custom_upsert',{item:{id:'only',surface:'猫',romaji:'neko',meaning:'cat',kind:'word'}});
    await KTFCloud.addCustomEvent('custom_review',{itemId:'study:custom:only:both',studyReview:true,key:'custom:only:both',correct:false});
    await KTFCustomCollection.refresh();await KTFReview.refresh();
  });
  await page.locator('#spacedReviewCount').fill('1');await page.locator('#spacedReviewAuto').click();
  await expect(page.locator('#spacedReviewPrompt')).toHaveText('猫');
  await page.locator('#spacedReviewReading').fill('neko');await page.locator('#spacedReviewMeaning').fill('cat');await page.locator('#spacedReviewCheck').click();
  await expect(page.locator('#spacedReviewFeedback')).toContainText('✓ Meaning');await page.locator('#spacedReviewNext').click();
  await expect(page.locator('#spacedReviewResult')).toContainText('1 / 1');
  await page.locator('#spacedReviewExit').click();
  await expect.poll(()=>page.evaluate(async()=>(await KTFCloud.getCustomEvents()).filter(e=>e.payload.studyReview).length)).toBe(2);
  await page.reload();await expect(page.locator('#spacedReviewDue')).toBeDisabled();await expect(page.locator('#spacedReviewStatus')).toContainText('Next review');
  for(const width of [390,768]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
  expect(errors).toEqual([]);
});
test('due reviews honor the clock, deleted Custom items and account isolation',async({page})=>{
  await page.clock.install({time:new Date('2026-11-06T12:00:00Z')});
  await page.evaluate(async()=>{
    await KTFCloud.addCustomEvent('custom_upsert',{item:{id:'due',surface:'猫',romaji:'neko',meaning:'cat',kind:'word'}});
    await KTFCloud.addCustomEvent('custom_review',{itemId:'study:custom:due:both',studyReview:true,key:'custom:due:both',correct:false});
    await KTFCustomCollection.refresh();await KTFReview.refresh();
  });
  await expect(page.locator('#spacedReviewDue')).toBeDisabled();
  await page.clock.setSystemTime(new Date('2026-11-06T12:11:00Z'));
  await page.evaluate(()=>KTFReview.refresh());await expect(page.locator('#spacedReviewDue')).toBeEnabled();
  await page.locator('#spacedReviewDue').click();await expect(page.locator('#spacedReviewPrompt')).toHaveText('猫');
  await page.locator('#spacedReviewExit').click();await page.locator('#spacedReviewExit').click();
  await page.evaluate(async()=>{
    const getStatus=KTFCloud.getStatus;KTFCloud.getStatus=()=>({...getStatus(),owner:'another-account'});
    const getEvents=KTFCloud.getCustomEvents;KTFCloud.getCustomEvents=async()=>[];
    await KTFReview.refresh();
    window.restoreReviewAccount=()=>{KTFCloud.getStatus=getStatus;KTFCloud.getCustomEvents=getEvents;};
  });
  await expect(page.locator('#spacedReviewDue')).toBeDisabled();
  await page.evaluate(async()=>{restoreReviewAccount();await KTFCloud.addCustomEvent('custom_delete',{id:'due'});await KTFCustomCollection.refresh();await KTFReview.refresh();});
  await expect(page.locator('#spacedReviewDue')).toBeDisabled();
});
