const {test,expect}=require('@playwright/test');
test('grammar vocabulary saves to Custom and remains available after reload',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.goto('/');
  await page.locator('#openGrammarButton').click();
  await page.locator('[data-lesson-open="sentence"]').click();
  const picker=page.locator('.grammar-custom-picker').first();
  await picker.locator('summary').click();
  for(const surface of ['学生','私']){
    await picker.locator(`[data-grammar-surface="${surface}"]`).click();
    const editor=page.locator('.grammar-custom-editor');
    await editor.locator('[name=romaji]').fill(surface==='学生'?'gakusei':'watashi');
    await editor.locator('[name=meaning]').fill(surface==='学生'?'student':'I');
    await editor.locator('[type=submit]').click();
    await expect(editor.locator('[role=status]')).toContainText(/Saved|Guardado/);
    await editor.locator('[data-close]').click();
  }
  await page.reload();
  await page.locator('#openCustomButton').click();
  await page.locator('[data-custom-filter=all]').click();
  await expect(page.locator('#customItems')).toContainText('学生');
  await expect(page.locator('#customItems')).toContainText('私');
  await page.locator('#customSelectAll').click();
  await expect(page.locator('#customLearnButton')).toBeEnabled();
  await page.locator('#customLearnButton').click();
  await expect(page.locator('#customPractice')).toBeVisible();
  expect(errors).toEqual([]);
});
test('saving during grammar practice pauses and resumes the session',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4173')?route.continue():route.abort());
  await page.goto('/');
  await page.locator('#openGrammarButton').click();
  await page.locator('#grammarLearn').click();
  await page.locator('#grammarCustomPicker summary').click();
  await page.locator('#grammarCustomPicker [data-grammar-surface]').first().click();
  await expect(page.locator('#grammarPause')).toHaveAttribute('aria-pressed','true');
  await page.locator('.grammar-custom-editor [data-close]').click();
  await expect(page.locator('#grammarPause')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#grammarGuidedNext')).toBeEnabled();
  expect(errors).toEqual([]);
});
