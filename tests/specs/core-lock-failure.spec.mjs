import {test,expect} from '@playwright/test';

test('Core blijft ontgrendeld wanneer opslaan vóór vergrendelen mislukt',async({page})=>{
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.goto('/index.html');
  await page.locator('#core-password').fill('correct horse battery staple');
  await page.locator('#core-password-confirm').fill('correct horse battery staple');
  await page.locator('[data-core-action=empty]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);

  const result=await page.evaluate(async()=>{
    const runtime=window.PWACoreV1.runtime;
    const vault=window.PWACoreV1.vault;
    const snapshot=window.CryptoPortfolioLegacy.snapshot();
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='cpt:vault')throw new DOMException('synthetic quota failure','QuotaExceededError');
      return original.call(this,key,value);
    };
    let saveError='',lockError='';
    try{await runtime.save(snapshot)}catch(error){saveError=error.message}
    try{await runtime.lock()}catch(error){lockError=error.message}
    const afterFailure={active:runtime.isActive(),unlocked:vault.isUnlocked(),saveError,lockError};
    Storage.prototype.setItem=original;
    await runtime.save(snapshot);
    await runtime.lock();
    return {...afterFailure,activeAfterRecovery:runtime.isActive(),unlockedAfterRecovery:vault.isUnlocked()};
  });

  expect(result.saveError).toContain('opslag');
  expect(result.lockError).toContain('opslag');
  expect(result.active).toBe(true);
  expect(result.unlocked).toBe(true);
  expect(result.activeAfterRecovery).toBe(false);
  expect(result.unlockedAfterRecovery).toBe(false);
});
