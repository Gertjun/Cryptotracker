import {test,expect} from '@playwright/test';

test('legacy-opruiming vereist geverifieerde migratie en bewaart versleutelde herstelbestanden',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({v:1,updated:1,deleted:[],txs:[{id:'cleanup-test-tx',type:'buy',coinId:'bitcoin',qty:1,price:25000,fee:0,date:'2025-01-01',mod:1}]}));
    localStorage.setItem('cpt.settings',JSON.stringify({theme:'dark',gh:{token:'synthetic-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'synthetic-password'}}));
    localStorage.setItem('cpt.prices',JSON.stringify({bitcoin:{eur:25000}}));
    localStorage.setItem('cpt.charts',JSON.stringify({legacy:{pts:[]}}));
    localStorage.setItem('cpt.vault','synthetic-encrypted-legacy-vault');
    localStorage.setItem('cpt.lock','synthetic-legacy-lock-wrapper');
    localStorage.setItem('cpt.vcharts','synthetic-encrypted-legacy-charts');
    localStorage.setItem('cpt:charts','synthetic-core-charts');
    localStorage.setItem('cpt:device','synthetic-core-device-settings');
    localStorage.setItem('cpt:sync','synthetic-core-sync-state');
    localStorage.setItem('cpt:device-id','synthetic-core-device-id');
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://api.github.com/**',async route=>{
    const url=new URL(route.request().url());
    if(route.request().method()==='GET'&&url.pathname==='/repos/Gertjun/SyncData')return route.fulfill({json:{private:true,default_branch:'main'}});
    if(route.request().method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.enc.json'))return route.fulfill({status:404,json:{message:'Not Found'}});
    return route.fulfill({status:404,json:{message:'Not Found'}});
  });
  await page.goto('/index.html');
  await page.locator('#core-password').fill('synthetic core password 123');
  await page.locator('#core-password-confirm').fill('synthetic core password 123');
  await page.locator('[data-core-action=migrate]').click();
  await page.locator('[data-core-action=confirm-migrate]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  expect(await page.evaluate(()=>window.PWACoreV1.runtime.isLegacyMigrationVerified())).toBe(true);
  await page.evaluate(()=>{localStorage.setItem('cpt:device','synthetic-core-device-settings');localStorage.setItem('cpt:sync','synthetic-core-sync-state');localStorage.setItem('cpt:device-id','synthetic-core-device-id');location.hash='#instellingen';showSetSec('sec')});
  await expect(page.locator('[data-act=corecleanup]')).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('[data-act=corecleanup]').click();
  const result=await page.evaluate(()=>window.PWACoreV1.runtime.cleanupLegacyStorage());
  expect(result.removed).toBe(4);
  const keys=await page.evaluate(()=>Object.fromEntries([
    'cpt.data','cpt.settings','cpt.prices','cpt.charts','cpt.vault','cpt.lock','cpt.vcharts',
    'cpt:charts','cpt:vault','cpt:device','cpt:sync','cpt:device-id',
  ].map(key=>[key,localStorage.getItem(key)])));
  for(const key of ['cpt.data','cpt.settings','cpt.prices','cpt.charts'])expect(keys[key]).toBeNull();
  expect(keys['cpt.vault']).toBe('synthetic-encrypted-legacy-vault');
  expect(keys['cpt.lock']).toBe('synthetic-legacy-lock-wrapper');
  expect(keys['cpt.vcharts']).toBe('synthetic-encrypted-legacy-charts');
  expect(keys['cpt:charts']).toBe('synthetic-core-charts');
  expect(keys['cpt:vault']).not.toBeNull();
  expect(keys['cpt:device']).not.toBeNull();
  expect(keys['cpt:sync']).not.toBeNull();
  expect(keys['cpt:device-id']).not.toBeNull();
  const again=await page.evaluate(()=>window.PWACoreV1.runtime.cleanupLegacyStorage());
  expect(again.removed).toBe(0);
});

test('legacy-migratie faalt gesloten als Core-device-settings niet correct kunnen worden teruggelezen',async({page})=>{
  await page.goto('/index.html');
  const error=await page.evaluate(async()=>{
    const {createLegacyStorageAdapter}=await import('/js/core/legacy-adapter.js');
    let storedData=null;
    const vault={
      async create(password,payload){storedData=structuredClone(payload)},
      async setDeviceSettings(){},
      async flush(){},
      getData(){return storedData},
      async getDeviceSettings(){return {github:{owner:'wrong'}}},
      getStorageStatus(){return {pending:false,requestedRevision:1,persistedRevision:1}},
    };
    try{
      await createLegacyStorageAdapter(vault).create('synthetic password 123',{
        data:{txs:[],deleted:[]},settings:{gh:{repo:'Gertjun/SyncData',token:'synthetic-token'}},
        prices:{},coreDeviceSettings:{syncEnabled:false},
      });
      return null;
    }catch(e){return e.message}
  });
  expect(error).toContain('Core-apparaatinstellingen wijken af');
});
