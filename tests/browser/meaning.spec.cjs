const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.goto('/');
  await page.selectOption('#languageSelect','en');
});
async function seed(page){
  await page.evaluate(async()=>{
    await KTFCloud.addCustomEvent('custom_upsert',{item:{id:'fixture',kind:'word',surface:'見てる',romaji:'miteru',kana:'みてる',meaning:'watching; looking (casual contraction of 見ている)',notes:'Original note',source:'Test',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'}});
    await KTFCustomCollection.refresh();
  });
}
for(const mode of ['meaning','both'])test(`Custom ${mode} accepts a listed meaning without its editorial note`,async({page})=>{
  await seed(page);await page.locator('#openCustomButton').click();await page.locator('[data-custom-filter=all]').click();await page.locator('#customSelectAll').click();
  await page.locator('#customMode').selectOption(mode);await page.locator('#customOnePassButton').click();
  await page.locator('#customPracticeAnswer').fill(mode==='both'?'miteru':'LOOKING!');
  if(mode==='both')await page.locator('#customPracticeMeaning').fill('LOOKING!');
  await page.locator('#customPracticeCheck').click();await expect(page.locator('#customStatsCorrect')).toHaveText('1');
});
test('automatic practice uses the same meaning variants as Custom',async({page})=>{
  await seed(page);await page.evaluate(async()=>{
    await KTFCloud.addCustomEvent('custom_review',{itemId:'study:custom:fixture:both',studyReview:true,key:'custom:fixture:both',correct:false});
    await KTFReview.refresh();
  });
  await page.locator('#progressOpen').click();await page.locator('#spacedReviewCount').fill('1');await page.locator('#spacedReviewAuto').click();
  await page.locator('#spacedReviewReading').fill('miteru');await page.locator('#spacedReviewMeaning').fill('looking!');await page.locator('#spacedReviewCheck').click();
  await expect(page.locator('#spacedReviewFeedback')).toContainText('✓ Meaning');
});
test('JSON update works through the collection UI with preview, cancel, backup and validation',async({page})=>{
  await seed(page);await page.locator('#openCustomButton').click();
  const before=await page.evaluate(()=>KTFCustomCollection.getItems());
  const rows=before.map(item=>({...item,meaning:'watching; looking',notes:'Updated'}));
  const upload=async items=>page.locator('#customJsonFile').setInputFiles({name:'corrected.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(items))});
  await upload(rows);await expect(page.locator('#customJsonDialog')).toBeVisible();await expect(page.locator('#customJsonChanges')).toContainText('watching; looking');
  expect(await page.evaluate(()=>KTFCustomCollection.getItems())).toEqual(before);
  await page.locator('#customJsonCancel').click();expect(await page.evaluate(()=>KTFCustomCollection.getItems())).toEqual(before);
  await upload(rows);const downloading=page.waitForEvent('download');await page.locator('#customJsonApply').click();
  expect(JSON.parse(fs.readFileSync(await (await downloading).path(),'utf8'))).toEqual(before);
  await expect(page.locator('#customJsonStatus')).toContainText('1 items updated');
  await upload([{...rows[0],id:'missing'}]);await expect(page.locator('#customJsonStatus')).toContainText('does not match');
  await expect(page.locator('#customJsonDialog')).toBeHidden();
  expect(await page.evaluate(()=>KTFCustomCollection.getItems()[0].meaning)).toBe('watching; looking');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
