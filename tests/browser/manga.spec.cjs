const {test,expect}=require('@playwright/test');
async function authorize(page){
  await page.route('**/functions/v1/ktf-manga-analyze',route=>route.fulfill({json:{allowed:true}}));
  await page.evaluate(()=>{
    const getStatus=window.KTFCloud.getStatus;
    window.KTFCloud.getStatus=()=>({...getStatus(),user:{id:'test-owner'},owner:'test-owner'});
    window.KTFCloud.getAccessToken=async()=> 'test-only';
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.locator('#openMangaButton')).toBeVisible();
}
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.goto('/');
  await page.evaluate(()=>{document.getElementById('languageSelect').value='en';document.getElementById('languageSelect').dispatchEvent(new Event('change'));});
  await page.evaluate(async()=>{
    const cache=KTFMangaCache,owner='test-owner';
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=2400;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,400,2400);ctx.fillStyle='#000';ctx.font='40px sans-serif';ctx.fillText('学校',40,400);
    const imageBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    await cache.saveChapter(owner,{id:'chapter',mangaTitle:'Test',chapterTitle:'Chapter 1'});
    for(let i=1;i<=2;i++){
      const hash='page-'+i;
      await cache.save(owner,{hash,name:hash+'.png',imageBlob,status:'completed',items:[{japanese:'学校',romaji:'gakkō',reading:'がっこう',english:'school',words:[],kanji:[],bbox:[0,0,300,200]},{japanese:'大きい',romaji:'ōkii',reading:'おおきい',english:'big',words:[],kanji:[],bbox:[0,400,300,600]}]});
      await cache.addPageToChapter(owner,'chapter',{hash,name:hash+'.png'});
    }
  });
});
test('manga restores page, dialogue and scroll; zoom, keyboard and romaji work',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await authorize(page);await page.locator('#openMangaButton').click();await page.locator('[data-chapter-open="chapter"]').click();
  await page.locator('#mangaNextPage').click();await expect(page.locator('#mangaPageName')).toHaveText('page-2.png');
  await page.locator('#mangaReadings [data-answer]').first().fill('gakkou');
  await page.locator('#mangaReadings [data-check]').first().evaluate(form=>form.requestSubmit());
  await expect(page.locator('#mangaReadings')).toContainText('Looks right!');
  await page.locator('#mangaReadings [data-answer]').nth(1).focus();
  await page.evaluate(()=>{document.getElementById('mangaImageScroller').scrollTop=650;});
  await expect.poll(()=>page.evaluate(async()=> (await KTFMangaCache.readChapter('test-owner','chapter')).position?.top)).toBeGreaterThan(600);
  await page.reload();await authorize(page);await page.locator('#openMangaButton').click();await page.locator('[data-chapter-open="chapter"]').click();
  await expect(page.locator('#mangaPageName')).toHaveText('page-2.png');
  await expect(page.locator('#mangaReadings .is-selected')).toContainText('大きい');
  await expect.poll(()=>page.locator('#mangaImageScroller').evaluate(el=>el.scrollTop)).toBeGreaterThan(600);
  await page.locator('#mangaZoomIn').click();await expect(page.locator('#mangaZoomValue')).toHaveText('125%');
  await page.locator('#mangaWide').click();await expect(page.locator('#mangaScreen')).toHaveClass(/is-reading-wide/);
  await page.keyboard.press('ArrowLeft');await expect(page.locator('#mangaPageName')).toHaveText('page-1.png');
  await page.keyboard.press('Escape');await expect(page.locator('#mangaScreen')).not.toHaveClass(/is-reading-wide/);
  expect(errors).toEqual([]);
});
test('backup round-trip is owner scoped, merges without overwriting and rejects corrupt files atomically',async({page})=>{
  const result=await page.evaluate(async()=>{
    const c=KTFMangaCache,backup=await c.exportLibrary('test-owner');
    const count=await c.importLibrary('second-owner',backup);
    const page=await c.read('second-owner','page-1');
    const originalText=page.items[0].japanese;page.items[0].japanese='変更';await c.save('second-owner',page);
    const repeated=await c.importLibrary('second-owner',backup);
    const unchanged=(await c.read('second-owner','page-1')).items[0].japanese;
    const corrupt=structuredClone(backup);corrupt.pages[1].image.base64='not base64%%%';let rejected=false;
    try{await c.importLibrary('third-owner',corrupt);}catch(_){rejected=true;}
    return {count,repeated,unchanged,originalText,rejected,third:(await c.list('third-owner')).length,second:(await c.list('second-owner')).length,first:(await c.read('test-owner','page-1')).items[0].japanese,blobSize:page.imageBlob.size};
  });
  expect(result).toMatchObject({count:3,repeated:0,unchanged:'変更',originalText:'学校',rejected:true,third:0,second:2,first:'学校'});expect(result.blobSize).toBeGreaterThan(0);
  await authorize(page);await page.locator('#openMangaButton').click();
  const download=page.waitForEvent('download');await page.locator('#mangaExportLibrary').click();expect((await download).suggestedFilename()).toBe('kana-manga-library.json');
});
test('saved chapter vocabulary opens a custom review session',async({page})=>{
  await authorize(page);
  await page.evaluate(async()=>{await KTFCloud.addCustomEvent('custom_upsert',{item:{id:'school',kind:'word',surface:'学校',romaji:'gakkou',meaning:'school',source:'Test · Chapter 1',updatedAt:new Date().toISOString()}});await KTFCustomCollection.refresh();});
  await page.locator('#openMangaButton').click();await page.locator('[data-chapter-open="chapter"]').click();
  await page.locator('#mangaPracticeChapter').click();await expect(page.locator('#customPractice')).toBeVisible();await expect(page.locator('#mangaScreen')).toBeHidden();
});
