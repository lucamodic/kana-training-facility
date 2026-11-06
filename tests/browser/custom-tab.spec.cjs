const {test,expect}=require('@playwright/test');
test('populated custom collection is a stable fourth home tab with compact filters',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.setViewportSize({width:1366,height:950});
  await page.addInitScript(()=>localStorage.setItem('ktf-custom-session-settings-v1',JSON.stringify({timerMode:'guesses',guesses:1})));
  await page.goto('/');
  await page.evaluate(async()=>{
    document.getElementById('languageSelect').value='en';document.getElementById('languageSelect').dispatchEvent(new Event('change'));
    document.querySelector('[data-palette="blue"]').click();
    const chars=['掛','引','髪','推','日','今','黒','越','人','気','行'];
    const words=['学校','今日','日本','先生','学生','本','水','猫','犬','電車','時間','電話','友達','名前','映画','音楽','料理','天気','仕事','家族','旅行','写真','病院','公園','図書館'];
    await KTFCloud.addCustomEvents([...chars.map((surface,i)=>({surface,kind:'kanji',romaji:['ka','hi','kami','o','hi','ima','kuro','go','hito','ki','i'][i],meaning:'character'})),...words.map(surface=>({surface,kind:'word',romaji:'nihongo',meaning:'saved vocabulary'}))].map((item,i)=>({type:'custom_upsert',payload:{item:{...item,id:'fixture-'+i,updatedAt:new Date().toISOString()}}})));
    await KTFCustomCollection.refresh();
    document.getElementById('tabHiragana').click();
  });
  const before=await page.evaluate(()=>({url:location.href,history:history.length,scroll:scrollY,top:document.getElementById('studyTabs').getBoundingClientRect().top}));
  await page.evaluate(()=>document.getElementById('openCustomButton').click());
  await expect(page.locator('#setupScreen')).toBeVisible();await expect(page.locator('#customScreen')).toBeHidden();
  await expect(page.locator('#legacyCustomSessionTimer')).toBeHidden();
  await expect(page.locator('#customTimerMode')).toHaveValue('off');
  await expect(page.locator('#studyTabs > [role=tab]')).toHaveCount(5);
  await expect(page.locator('#studyTabs > [role=tab][aria-selected=true]')).toHaveAttribute('id','openCustomButton');
  const after=await page.evaluate(()=>({url:location.href,history:history.length,scroll:scrollY,top:document.getElementById('studyTabs').getBoundingClientRect().top}));
  expect(after).toEqual(before);
  await expect(page.locator('#customCharacterCount')).toHaveText('11');await expect(page.locator('#customWordCount')).toHaveText('25');await expect(page.locator('#customAllCount')).toHaveText('36');
  await expect(page.locator('#customItems [data-custom-tile]')).toHaveCount(11);
  await page.locator('#customItems [data-custom-tile]').first().click();await expect(page.locator('#customSideSelected')).toHaveText('1');await expect(page.locator('#customCharacterCount')).toHaveText('11');
  await page.locator('[data-custom-filter=word]').click();await expect(page.locator('#customItems [data-custom-tile]')).toHaveCount(25);
  await page.locator('[data-custom-filter=all]').click();await expect(page.locator('#customItems [data-custom-tile]')).toHaveCount(36);
  await page.locator('#customSearch').fill('学校');await expect(page.locator('#customItems [data-custom-tile]')).toHaveCount(1);
  await page.locator('#customSearch').fill('');await page.locator('[data-custom-filter=kanji]').click();
  await page.screenshot({path:'test-results/custom-populated-desktop.png',fullPage:true});
  await page.locator('#tabKatakana').click();await expect(page.locator('#characterPanel')).toBeVisible();await expect(page.locator('#customBrowse')).toBeHidden();await expect(page.locator('#originalSessionOptions')).toBeVisible();
  await page.locator('#tabKanji').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#openCustomButton')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#customSideSelected')).toHaveText('1');
  await page.locator('#customAddButton').click();await expect(page.locator('#customEditorDialog')).toBeVisible();await page.locator('#customEditorClose').click();
  for(const width of [390,768]){
    await page.setViewportSize({width,height:950});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const tops=await page.locator('#studyTabs > [role=tab]').evaluateAll(tabs=>tabs.map(tab=>tab.getBoundingClientRect().top));expect(Math.max(...tops)-Math.min(...tops)).toBeLessThan(2);
    await page.screenshot({path:`test-results/custom-populated-${width}.png`,fullPage:true});
  }
  expect(errors).toEqual([]);
});
