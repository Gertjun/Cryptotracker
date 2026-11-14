import {test,expect} from '@playwright/test';

test('Core-startscherm blokkeert legacy-start en legacy-sync',async({page})=>{
  const githubCalls=[];
  await page.route('https://api.github.com/**',route=>{githubCalls.push(route.request().url());return route.fulfill({status:404,json:{message:'Not Found'}})});
  await page.goto('/index.html');
  await expect(page.locator('#core-gate')).toBeVisible();
  await expect(page.locator('#core-gate')).toContainText('PWA-Core instellen');
  const serviceWorker = await page.request.get('/sw.js');
  expect(await serviceWorker.text()).toContain('"js/core/runtime.js"');
  const state=await page.evaluate(()=>({
    legacyBridge:!!window.CryptoPortfolioLegacy,
    legacyData:localStorage.getItem('cpt.data'),
    coreVault:localStorage.getItem('cpt:vault'),
  }));
  expect(state.legacyBridge).toBe(true);
  expect(state.legacyData).toBeNull();
  expect(state.coreVault).toBeNull();
  expect(githubCalls).toEqual([]);
});

test('migratie schrijft naar Core en laat legacy-opslag en oud remote pad ongemoeid',async({page})=>{
  const githubCalls=[];
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({
      v:1,updated:1700000000000,deleted:[],
      txs:[{id:'legacy-tx-1',type:'buy',coinId:'bitcoin',qty:0.1,price:25000,fee:0,date:'2025-01-01',mod:1700000000000}],
      watch:[],alerts:[],goals:[],plans:[],portfolios:[],allocs:[],
      hist:{bitcoin:{20000:[1700000000000,25000]}},
    }));
    localStorage.setItem('cpt.settings',JSON.stringify({
      theme:'dark',
      gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'},
    }));
    localStorage.setItem('cpt.prices',JSON.stringify({bitcoin:{eur:25000}}));
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    githubCalls.push({method:request.method(),path:url.pathname});
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      return route.fulfill({status:404,json:{message:'Not Found'}});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      return route.fulfill({status:201,json:{content:{sha:'core-file-sha'}}});
    }
    return route.fulfill({status:200,json:{private:true,default_branch:'main'}});
  });
  await page.goto('/index.html');
  await expect(page.locator('[data-core-action=migrate]')).toBeVisible();
  await page.locator('#core-password').fill('correct horse battery staple');
  await page.locator('#core-password-confirm').fill('correct horse battery staple');
  await page.locator('[data-core-action=migrate]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await page.waitForFunction(()=>localStorage.getItem('cpt:vault')!==null);
  await page.waitForFunction(()=>window.PWACoreV1?.vault?.getSyncMeta?.().sha==='core-file-sha');
  const result=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return {
      payload:vault.getData(),
      device:await vault.getDeviceSettings(),
      legacyData:localStorage.getItem('cpt.data'),
      legacySettings:localStorage.getItem('cpt.settings'),
      legacyPrices:localStorage.getItem('cpt.prices'),
      legacyVault:localStorage.getItem('cpt.vault'),
      coreVault:localStorage.getItem('cpt:vault'),
    };
  });
  expect(result.payload.txs).toHaveLength(1);
  expect(result.payload.txs[0].id).toBe('legacy-tx-1');
  expect(result.payload.schema).toBe(1);
  expect(result.payload).toHaveProperty('__pwaSync');
  expect(result.device.github.path).toBe('crypto-portfolio.pwa-core-v1.json');
  expect(result.device.github.owner).toBe('Gertjun');
  expect(result.device.github.repo).toBe('SyncData');
  expect(result.device.github).not.toHaveProperty('pass');
  expect(result.device.app.prices.bitcoin.eur).toBe(25000);
  expect(result.legacyData).toContain('legacy-tx-1');
  expect(result.legacySettings).toContain('crypto-portfolio.enc.json');
  expect(result.legacyPrices).toContain('25000');
  expect(result.legacyVault).toBeNull();
  expect(result.coreVault).not.toBeNull();
  expect(githubCalls.some(call=>call.path.endsWith('/contents/crypto-portfolio.enc.json'))).toBe(false);
  expect(githubCalls.some(call=>call.path.endsWith('/contents/crypto-portfolio.pwa-core-v1.json'))).toBe(true);
  await page.evaluate(()=>{
    data.txs.push({id:'core-only-tx',type:'buy',coinId:'ethereum',qty:1,price:1000,fee:0,date:'2025-02-01',mod:Date.now()});
    saveData(false);
  });
  await page.waitForFunction(async()=>{
    const vault=await import('/js/core/vault.js');
    return vault.getData().txs.some(tx=>tx.id==='core-only-tx');
  });
  const after=await page.evaluate(()=>localStorage.getItem('cpt.data'));
  expect(after).toBe(result.legacyData);
});
