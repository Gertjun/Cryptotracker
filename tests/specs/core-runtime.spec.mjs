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

test('legacy openen voor Core-migratie start geen oude GitHub-sync',async({page})=>{
  const githubCalls=[];
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({v:1,updated:1,deleted:[],txs:[]}));
    localStorage.setItem('cpt.settings',JSON.stringify({
      gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'},
    }));
  });
  await page.route('https://api.github.com/**',async route=>{
    githubCalls.push({method:route.request().method(),url:route.request().url()});
    return route.fulfill({status:404,json:{message:'Not Found'}});
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.goto('/index.html');
  await expect(page.locator('#core-gate')).toBeVisible();
  await page.evaluate(()=>window.CryptoPortfolioLegacy.startLegacy({allowSync:false}));
  await page.waitForTimeout(100);
  expect(githubCalls).toEqual([]);
});

test('migratie voegt legacy GitHub-data read-only samen en laat oud remote bestand ongemoeid',async({page})=>{
  const githubCalls=[];
  let legacyEnvelopeText=null;
  let legacyWrites=0;
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
    localStorage.setItem('cpt.charts',JSON.stringify({legacyMarker:{ts:Date.now(),pts:[]}}));
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    githubCalls.push({method:request.method(),path:url.pathname});
    if(url.pathname.endsWith('/contents/crypto-portfolio.enc.json')){
      if(request.method()==='GET')return route.fulfill({json:{
        sha:'legacy-blob-sha',encoding:'base64',content:Buffer.from(legacyEnvelopeText).toString('base64'),
      }});
      if(request.method()==='PUT'){legacyWrites++;return route.fulfill({status:500,json:{message:'Legacy writes are forbidden'}});}
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      return route.fulfill({status:404,json:{message:'Not Found'}});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      return route.fulfill({status:201,json:{content:{sha:'core-file-sha'}}});
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.enc.json'))return route.fulfill({status:404,json:{message:'Not Found'}});
    return route.fulfill({status:200,json:{private:true,default_branch:'main'}});
  });
  await page.goto('/index.html');
  legacyEnvelopeText=await page.evaluate(async()=>{
    const password='legacy-password';
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
    const remote={
      v:1,updated:1700000001000,deleted:[],
      txs:[
        {id:'legacy-tx-1',type:'buy',coinId:'bitcoin',qty:0.1,price:26000,fee:0,date:'2025-01-01',mod:1700000001000},
        {id:'legacy-remote-tx',type:'buy',coinId:'ethereum',qty:2,price:1500,fee:0,date:'2024-12-01',mod:1700000001000},
      ],
      watch:[],alerts:[],goals:[],plans:[],portfolios:[],allocs:[],
      hist:{ethereum:{1500:[1700000001000,1500]}},
    };
    const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(remote)));
    const b64=bytes=>btoa(String.fromCharCode(...bytes));
    return JSON.stringify({v:1,alg:'AES-GCM/PBKDF2-SHA256',it:600000,salt:b64(salt),iv:b64(iv),ct:b64(new Uint8Array(encrypted))});
  });
  await expect(page.locator('[data-core-action=migrate]')).toBeVisible();
  await page.locator('#core-password').fill('correct horse battery staple');
  await page.locator('#core-password-confirm').fill('correct horse battery staple');
  await page.locator('[data-core-action=migrate]').click();
  await expect(page.locator('#core-gate')).toContainText('Controleer de gegevens vóór migratie');
  await expect(page.locator('#core-gate')).toContainText('Het bestaande SyncData-bestand is gevonden');
  await expect(page.locator('#core-gate')).toContainText('Transacties');
  await expect(page.locator('#core-gate')).toContainText('Koershistoriepunten');
  expect(await page.evaluate(()=>localStorage.getItem('cpt:vault'))).toBeNull();
  await page.locator('[data-core-action=confirm-migrate]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await page.waitForFunction(()=>localStorage.getItem('cpt:vault')!==null);
  const historyAccess=await page.evaluate(async()=>{
    const runtime=window.PWACoreV1.runtime;
    const attempts=await Promise.allSettled([
      runtime.listVersions(),
      runtime.previewVersion('abcdef1234567'),
      runtime.restoreVersion('abcdef1234567','test-password'),
    ]);
    return attempts.map(result=>result.status==='rejected'?result.reason.message:'unexpected-success');
  });
  const consentError='Activeer eerst Core-synchronisatie om GitHub-versies te openen.';
  expect(historyAccess).toEqual([consentError,consentError,consentError]);
  expect(githubCalls.filter(call=>call.path.endsWith('/contents/crypto-portfolio.enc.json')&&call.method==='GET')).toHaveLength(1);
  expect(githubCalls.some(call=>call.path.endsWith('/contents/crypto-portfolio.pwa-core-v1.json'))).toBe(false);
  expect(legacyWrites).toBe(0);
  // Een gewone app-save mag de expliciete sync-toestemming niet inschakelen.
  await page.evaluate(()=>window.PWACoreV1.runtime.save(window.CryptoPortfolioLegacy.snapshot()));
  const consent=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return (await vault.getDeviceSettings()).syncEnabled;
  });
  expect(consent).toBe(false);
  // Alleen de legacy-GET vond plaats; Core-sync vereist nog steeds een aparte actie.
  expect(githubCalls.filter(call=>call.path.endsWith('/contents/crypto-portfolio.pwa-core-v1.json'))).toEqual([]);
  expect(legacyWrites).toBe(0);
  await page.evaluate(()=>window.PWACoreV1.runtime.updateGitHub({owner:'Gertjun',repo:'SyncData',token:'test-token',branch:'main'}));
  await page.waitForFunction(()=>window.PWACoreV1?.vault?.getSyncMeta?.().sha==='core-file-sha');
  const result=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return {
      payload:vault.getData(),
      device:await vault.getDeviceSettings(),
      legacyData:localStorage.getItem('cpt.data'),
      legacySettings:localStorage.getItem('cpt.settings'),
      legacyPrices:localStorage.getItem('cpt.prices'),
      legacyCharts:localStorage.getItem('cpt.charts'),
      legacyVault:localStorage.getItem('cpt.vault'),
      coreVault:localStorage.getItem('cpt:vault'),
    };
  });
  expect(result.payload.txs).toHaveLength(2);
  expect(result.payload.txs.find(tx=>tx.id==='legacy-tx-1').price).toBe(26000);
  expect(result.payload.txs.some(tx=>tx.id==='legacy-remote-tx')).toBe(true);
  expect(result.payload.hist.ethereum).toBeTruthy();
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
  expect(githubCalls.some(call=>call.path.endsWith('/contents/crypto-portfolio.enc.json')&&call.method==='GET')).toBe(true);
  expect(githubCalls.some(call=>call.path.endsWith('/contents/crypto-portfolio.enc.json')&&call.method==='PUT')).toBe(false);
  expect(legacyWrites).toBe(0);
  await page.evaluate(()=>{
    window.dispatchEvent(new StorageEvent('storage',{key:'cpt.data',newValue:JSON.stringify({
      v:1,updated:Date.now(),deleted:[],
      txs:[{id:'legacy-other-tab-tx',type:'buy',coinId:'ethereum',qty:2,price:1000,fee:0,date:'2025-02-01',mod:Date.now()}],
    })}));
    chartCache.coreModeProbe={ts:Date.now(),pts:[]};
    saveCharts();
  });
  await page.waitForTimeout(1700);
  const isolation=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return {ids:vault.getData().txs.map(tx=>tx.id),legacyCharts:localStorage.getItem('cpt.charts'),coreCharts:(await vault.getDeviceSettings()).app.chartCache};
  });
  expect(isolation.ids).not.toContain('legacy-other-tab-tx');
  expect(isolation.legacyCharts).toBe(result.legacyCharts);
  expect(isolation.coreCharts).toHaveProperty('coreModeProbe');
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

test('Core-instellingen tonen wachtwoordbeheer, nieuwe passkey en Core-versiegeschiedenis',async({page})=>{
  let remoteText=null;
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({v:1,updated:1,deleted:[],txs:[]}));
    localStorage.setItem('cpt.settings',JSON.stringify({gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'}}));
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.pathname==='/repos/Gertjun/SyncData')return route.fulfill({json:{private:true,default_branch:'main'}});
    if(request.method()==='GET'&&url.pathname.endsWith('/commits'))return route.fulfill({json:[{sha:'abcdef1234567890abcdef1234567890abcdef12',commit:{committer:{date:'2026-11-14T10:00:00Z'}}}]});
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      if(!remoteText)return route.fulfill({status:404,json:{message:'Not Found'}});
      return route.fulfill({json:{sha:'synthetic-blob',encoding:'base64',content:Buffer.from(remoteText).toString('base64')}});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      remoteText=Buffer.from(JSON.parse(request.postData()).content,'base64').toString();
      return route.fulfill({status:201,json:{content:{sha:'synthetic-file-sha'}}});
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.enc.json'))return route.fulfill({status:404,json:{message:'Not Found'}});
    return route.fulfill({status:200,json:{private:true,default_branch:'main'}});
  });
  await page.goto('/index.html');
  await page.locator('#core-password').fill('correct horse battery staple');
  await page.locator('#core-password-confirm').fill('correct horse battery staple');
  await page.locator('[data-core-action=migrate]').click();
  await expect(page.locator('#core-gate')).toContainText('Er is geen bestaand SyncData-bestand ingelezen');
  await expect(page.locator('#core-gate')).toContainText('repository, branch, pad of toegang niet klopt');
  await expect(page.locator('[data-core-action=confirm-migrate]')).toContainText('zonder remote data');
  expect(await page.evaluate(()=>localStorage.getItem('cpt:vault'))).toBeNull();
  await page.locator('[data-core-action=confirm-migrate]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await page.evaluate(()=>window.PWACoreV1.runtime.updateGitHub({owner:'Gertjun',repo:'SyncData',token:'test-token',branch:'main'}));
  await page.evaluate(()=>{location.hash='#instellingen'});
  await expect(page.locator('#setView')).toBeVisible();
  // Op telefoonformaat is de onderdelenlijst bewust verborgen; selecteer hetzelfde paneel via de appfunctie.
  await page.evaluate(()=>showSetSec('sec'));
  await expect(page.locator('[data-act=corepasskeynew]')).toBeVisible();
  await expect(page.locator('[data-act=corechpw]')).toBeVisible();
  await page.locator('[data-act=corechpw]').click();
  await expect(page.locator('#core-current-password')).toBeVisible();
  await page.locator('[data-act=closesheet]').first().click();
  await page.evaluate(()=>showSetSec('sync'));
  await page.locator('[data-act=versions]').click();
  await expect(page.locator('#verOut')).toContainText('14 nov');
  await page.locator('[data-act=verpick]').click();
  await expect(page.locator('#core-ver-password')).toBeVisible();
  await expect(page.locator('#verOut')).toContainText('Deze Core-versie terugzetten');
});
test('nieuw apparaat opent dezelfde Core-kluis via het nieuwe GitHub-bestand',async({browser})=>{
  let remoteText=null,remoteSha=0;
  const attachGitHub=async page=>page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{
      'access-control-allow-origin':'*',
      'access-control-allow-methods':'GET, PUT, OPTIONS',
      'access-control-allow-headers':'authorization,accept,x-github-api-version,content-type',
    }});
    if(request.method()==='GET'&&url.pathname==='/repos/Gertjun/SyncData'){
      return route.fulfill({json:{private:true,default_branch:'main'}});
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      if(!remoteText)return route.fulfill({status:404,json:{message:'Not Found'}});
      return route.fulfill({json:{sha:'remote-'+remoteSha,encoding:'base64',content:Buffer.from(remoteText).toString('base64')}});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      const body=JSON.parse(request.postData());
      remoteText=Buffer.from(body.content,'base64').toString();
      remoteSha++;
      return route.fulfill({status:201,json:{content:{sha:'remote-'+remoteSha}}});
    }
    return route.fulfill({status:404,json:{message:'Not Found'}});
  });
  const contextA=await browser.newContext({viewport:{width:1280,height:800}});
  const pageA=await contextA.newPage();
  await pageA.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({v:1,updated:1,deleted:[],txs:[{id:'shared-tx',type:'buy',coinId:'bitcoin',qty:1,price:25000,fee:0,date:'2025-01-01',mod:1}]}));
    localStorage.setItem('cpt.settings',JSON.stringify({gh:{repo:'Gertjun/SyncData',token:'test-token',path:'crypto-portfolio.enc.json',branch:'main',pass:'old-password'}}));
  });
  await pageA.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await attachGitHub(pageA);
  await pageA.goto('/index.html');
  await pageA.locator('#core-password').fill('shared core password 123');
  await pageA.locator('#core-password-confirm').fill('shared core password 123');
  await pageA.locator('[data-core-action=migrate]').click();
  await expect(pageA.locator('#core-gate')).toContainText('Er is geen bestaand SyncData-bestand ingelezen');
  await expect(pageA.locator('#core-gate')).toContainText('repository, branch, pad of toegang niet klopt');
  expect(await pageA.evaluate(()=>localStorage.getItem('cpt:vault'))).toBeNull();
  await pageA.locator('[data-core-action=confirm-migrate]').click();
  await pageA.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  expect(remoteText).toBeNull();
  await pageA.evaluate(()=>window.PWACoreV1.runtime.updateGitHub({owner:'Gertjun',repo:'SyncData',token:'test-token',branch:'main'}));
  await pageA.waitForFunction(()=>window.PWACoreV1?.vault?.getSyncMeta?.().sha==='remote-1');
  const contextB=await browser.newContext({viewport:{width:1280,height:800}});
  const pageB=await contextB.newPage();
  await pageB.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await attachGitHub(pageB);
  await pageB.goto('/index.html');
  // GitHub-velden staan bewust achter de inklapbare instellingen.
  await pageB.locator('#core-gate details summary').click();
  await pageB.locator('#core-owner').fill('Gertjun');
  await pageB.locator('#core-repo').fill('SyncData');
  await pageB.locator('#core-token').fill('test-token');
  await pageB.locator('#core-branch').fill('main');
  await pageB.locator('#core-password').fill('shared core password 123');
  await pageB.locator('[data-core-action=import]').click();
  await pageB.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  const result=await pageB.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return {txs:vault.getData().txs,device:await vault.getDeviceSettings()};
  });
  expect(result.txs.map(tx=>tx.id)).toContain('shared-tx');
  expect(result.device.github.path).toBe('crypto-portfolio.pwa-core-v1.json');
  expect(result.device.github.token).toBe('test-token');

  // Dezelfde echte runtime kan vanuit een ontgrendelde Core-kluis
  // een v3-koppeling maken en op een derde, leeg apparaat ontvangen.
  pageA.on('dialog', dialog => dialog.accept());
  await pageA.evaluate(() => { openSettings(); showSetSec('sync'); });
  await pageA.locator('[data-act=pairout]').click();
  const pairingDialog = pageA.locator('#dlg-pair');
  await expect(pairingDialog).toBeVisible();
  await expect(pairingDialog.locator('.pair-qr')).toBeVisible();
  const code = await pairingDialog.locator('textarea').inputValue();
  expect(code).toMatch(/^PWA-CORE-PAIR-3:/);
  await expect(pairingDialog.locator('#pair-pin-panel')).toHaveCount(0);
  const link = await pageA.evaluate(async code => (await import('/js/core/pairing-ui.js')).pairingLink(code, location.href), code);
  expect(new URL(link).searchParams.has('pair')).toBe(false);
  expect(new URLSearchParams(new URL(link).hash.slice(1)).get('pair')).toBe(code);
  await pairingDialog.getByRole('button', {name:'Klaar'}).click();

  // Een apparaat met bestaande Core-kluis mag niet opnieuw worden gekoppeld.
  await pageB.evaluate(link => { location.hash = new URL(link).hash; }, link);
  await pageB.waitForFunction(() => !location.hash.includes('pair='));
  expect(await pageB.evaluate(() => window.PWACoreV1.runtime.isActive())).toBe(true);
  expect(await pageB.evaluate(() => localStorage.getItem('cpt:pairing:used'))).toBeNull();
  await pageB.evaluate(() => window.PWACoreV1.runtime.lock());
  await expect(pageB.locator('#core-unlock-form')).toBeVisible();
  const existingVault = await pageB.evaluate(() => localStorage.getItem('cpt:vault'));
  await pageB.evaluate(link => { location.hash = new URL(link).hash; }, link);
  await pageB.waitForFunction(() => !location.hash.includes('pair='));
  await expect(pageB.locator('#core-unlock-form')).toBeVisible();
  await expect(pageB.locator('#core-gate-error')).toContainText('bestaat al een kluis');
  expect(await pageB.evaluate(() => localStorage.getItem('cpt:vault'))).toBe(existingVault);
  expect(await pageB.evaluate(() => window.PWACoreV1.runtime.isActive())).toBe(false);

  const contextC = await browser.newContext({viewport:{width:1280,height:800}});
  try {
    const pageC = await contextC.newPage();
    await pageC.route('https://api.coingecko.com/**', route => route.fulfill({json:{}}));
    await pageC.route('https://api.alternative.me/**', route => route.fulfill({json:{data:[]}}));
    await attachGitHub(pageC);
    await pageC.goto(link);
    await expect(pageC.locator('#core-pair-code')).toHaveValue(code);
    await expect(pageC.locator('#core-pair-legacy')).toBeHidden();
    await expect(pageC.locator('#core-password')).toBeHidden();
    expect(new URL(pageC.url()).hash).toBe('');
    expect(await pageC.evaluate(() => localStorage.getItem('cpt:vault'))).toBeNull();
    await pageC.locator('[data-core-action=pair]').click();
    await pageC.waitForFunction(() => window.PWACoreV1?.runtime?.isActive() === true);
    const paired = await pageC.evaluate(async () => {
      const vault = await import('/js/core/vault.js');
      return { ids: vault.getData().txs.map(tx => tx.id), settings: await vault.getDeviceSettings(), replay: localStorage.getItem('cpt:pairing:used') };
    });
    expect(paired.ids).toContain('shared-tx');
    expect(paired.settings.github.path).toBe('crypto-portfolio.pwa-core-v1.json');
    expect(paired.settings.syncEnabled).toBe(true);
    expect(paired.replay).not.toBeNull();
    await pageC.reload();
    await pageC.locator('#core-unlock-password').fill('shared core password 123');
    await pageC.locator('#core-unlock-form button[type="submit"]').click();
    await pageC.waitForFunction(() => window.PWACoreV1?.runtime?.isActive() === true);
  } finally { await contextC.close(); }
  await contextA.close();
  await contextB.close();
});


test('mislukte Core-bootstrap blokkeert legacy-start volledig',async({page})=>{
  const externalCalls=[];
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({v:1,updated:1,deleted:[],txs:[]}));
    localStorage.setItem('cpt.settings',JSON.stringify({
      gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'},
    }));
    window.__coreBootstrapFailed=false;
    window.addEventListener('pwa-core-error',()=>{window.__coreBootstrapFailed=true});
  });
  await page.route('**/js/config.js',route=>route.abort());
  await page.route('https://api.github.com/**',async route=>{
    externalCalls.push(route.request().url());
    return route.fulfill({status:404,json:{message:'Not Found'}});
  });
  await page.route('https://api.coingecko.com/**',route=>{
    externalCalls.push(route.request().url());
    return route.fulfill({json:{}});
  });
  await page.route('https://api.alternative.me/**',route=>{
    externalCalls.push(route.request().url());
    return route.fulfill({json:{data:[]}});
  });
  await page.goto('/index.html');
  await page.waitForFunction(()=>window.__coreBootstrapFailed===true);
  await expect(page.locator('#core-bootstrap-error')).toBeVisible();
  await expect(page.locator('#core-bootstrap-error')).toContainText('kan niet veilig starten');
  await expect(page.locator('#core-bootstrap-error')).toContainText('oude opslag wordt uit veiligheid niet automatisch geopend');
  await expect(page.locator('#app .top')).not.toBeVisible();
  expect(await page.evaluate(()=>document.body.classList.contains('locked'))).toBe(true);
  expect(externalCalls).toEqual([]);
  const state=await page.evaluate(()=>({
    legacyBridge:!!window.CryptoPortfolioLegacy,
    legacyData:localStorage.getItem('cpt.data'),
    legacySettings:localStorage.getItem('cpt.settings'),
  }));
  expect(state.legacyBridge).toBe(true);
  expect(state.legacyData).toContain('"txs":[]');
  expect(state.legacySettings).toContain('test-token');
});


test('legacy-ontgrendeling tijdens Core-overname laat het Core-instelscherm intact',async({page})=>{
  let priceRequests=0;
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({
      v:1,updated:1,deleted:[],
      txs:[{id:'legacy-btc',type:'buy',coinId:'bitcoin',qty:0.1,price:25000,fee:0,date:'2025-01-01',mod:1}],
    }));
    localStorage.setItem('cpt.settings',JSON.stringify({fng:false,gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'}}));
  });
  await page.route('https://api.coingecko.com/**',async route=>{
    priceRequests++;
    await new Promise(resolve=>setTimeout(resolve,250));
    return route.fulfill({json:[{id:'bitcoin',current_price:60000,price_change_percentage_24h:0,image:'',market_cap:1,market_cap_rank:1,total_volume:1}]});
  });
  await page.route('https://api.github.com/**',route=>route.fulfill({status:404,json:{message:'Not Found'}}));
  await page.goto('/index.html');
  await expect(page.locator('#core-gate')).toContainText('PWA-Core instellen');
  await page.evaluate(()=>{
    // Zelfde startpad als na een geslaagde legacy-passkeyontgrendeling.
    window.CryptoPortfolioLegacy.startLegacy({allowSync:false,coreHandoff:true});
    window.dispatchEvent(new Event('cpt-legacy-unlocked'));
  });
  await expect(page.locator('#core-gate')).toContainText('PWA-Core instellen');
  await page.waitForTimeout(400);
  await expect(page.locator('#core-gate')).toContainText('PWA-Core instellen');
  expect(priceRequests).toBe(0);
  expect(await page.evaluate(()=>localStorage.getItem('cpt.data'))).toContain('legacy-btc');
  expect(await page.evaluate(()=>localStorage.getItem('cpt:vault'))).toBeNull();
});


test('Core sync preserves changes from two devices during concurrent synchronisation',async({browser})=>{
  let remoteText=null,remoteVersion=0,conflicts=0;
  let barrierEnabled=false,barrierReads=0,releaseBarrier;
  let barrierPromise=new Promise(resolve=>{releaseBarrier=resolve});
  const attachGitHub=async page=>page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{
      'access-control-allow-origin':'*',
      'access-control-allow-methods':'GET, PUT, OPTIONS',
      'access-control-allow-headers':'authorization,accept,x-github-api-version,content-type',
    }});
    if(request.method()==='GET'&&url.pathname==='/repos/Gertjun/SyncData'){
      return route.fulfill({json:{private:true,default_branch:'main'}});
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      if(!remoteText)return route.fulfill({status:404,json:{message:'Not Found'}});
      const snapshot={sha:'core-sha-'+remoteVersion,text:remoteText};
      if(barrierEnabled&&barrierReads<2){
        barrierReads++;
        if(barrierReads===2)releaseBarrier();
        await barrierPromise;
      }
      return route.fulfill({json:{
        sha:snapshot.sha,encoding:'base64',content:Buffer.from(snapshot.text).toString('base64'),
      }});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      const body=JSON.parse(request.postData());
      const currentSha=remoteText?'core-sha-'+remoteVersion:null;
      if(currentSha&&body.sha!==currentSha){
        conflicts++;
        return route.fulfill({status:409,json:{message:'SHA conflict'}});
      }
      if(!currentSha&&body.sha)return route.fulfill({status:409,json:{message:'SHA conflict'}});
      remoteText=Buffer.from(body.content,'base64').toString();
      remoteVersion++;
      return route.fulfill({status:remoteVersion===1?201:200,json:{content:{sha:'core-sha-'+remoteVersion}}});
    }
    return route.fulfill({status:404,json:{message:'Not Found'}});
  });
  const makePage=async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:800}});
    const page=await context.newPage();
    await attachGitHub(page);
    await page.goto('/index.html');
    return {context,page};
  };
  const password='shared core password 123';
  const A=await makePage();
  await A.page.locator('#core-password').fill(password);
  await A.page.locator('#core-password-confirm').fill(password);
  await A.page.locator('[data-core-action=empty]').click();
  await A.page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await A.page.evaluate(()=>window.PWACoreV1.runtime.updateGitHub({
    owner:'Gertjun',repo:'SyncData',token:'synthetic-token',branch:'main',
  }));
  expect(remoteText).toBeTruthy();

  const B=await makePage();
  await B.page.locator('#core-gate details summary').click();
  await B.page.locator('#core-owner').fill('Gertjun');
  await B.page.locator('#core-repo').fill('SyncData');
  await B.page.locator('#core-token').fill('synthetic-token');
  await B.page.locator('#core-branch').fill('main');
  await B.page.locator('#core-password').fill(password);
  await B.page.locator('[data-core-action=import]').click();
  await B.page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await B.page.waitForFunction(async()=>{
    const vault=await import('/js/core/vault.js');
    const meta=vault.getSyncMeta();
    return typeof meta.sha==='string'&&meta.sha.startsWith('core-sha-')&&!meta.dirty;
  });
  const initialSha='core-sha-'+remoteVersion;

  await Promise.all([
    A.page.evaluate(async()=>{
      const vault=await import('/js/core/vault.js');
      const data=structuredClone(vault.getData());
      data.txs.push({id:'device-a-change',type:'buy',coinId:'bitcoin',qty:1,price:100,fee:0,date:'2026-11-16',created:1,mod:1700000000001});
      await vault.setData(data);
    }),
    B.page.evaluate(async()=>{
      const vault=await import('/js/core/vault.js');
      const data=structuredClone(vault.getData());
      data.txs.push({id:'device-b-change',type:'buy',coinId:'ethereum',qty:2,price:200,fee:0,date:'2026-11-16',created:2,mod:1700000000002});
      await vault.setData(data);
    }),
  ]);

  barrierEnabled=true;
  const [syncA,syncB]=await Promise.allSettled([
    A.page.evaluate(()=>window.PWACoreV1.runtime.syncNow(false)),
    B.page.evaluate(()=>window.PWACoreV1.runtime.syncNow(false)),
  ]);
  expect(syncA.status).toBe('fulfilled');
  expect(syncB.status).toBe('fulfilled');
  expect(barrierReads).toBe(2);
  // Core mag gelijktijdige writes ook intern serialiseren; een HTTP 409 is daarom niet vereist.
  // De echte invariant staat hieronder: beide onafhankelijke wijzigingen moeten remote behouden blijven.
  barrierEnabled=false;

  // Laat de eerste schrijver de door de tweede client samengevoegde eindstand ophalen.
  await A.page.evaluate(()=>window.PWACoreV1.runtime.syncNow(false));
  const finalData=await A.page.evaluate(async raw=>{
    const vault=await import('/js/core/vault.js');
    return vault.decryptRemote(JSON.parse(raw));
  },remoteText);
  const ids=finalData.txs.map(tx=>tx.id);
  expect(ids).toContain('device-a-change');
  expect(ids).toContain('device-b-change');
  expect(finalData.__pwaSync).toBeTruthy();
  expect(Object.keys(finalData.__pwaSync.devices||{}).length).toBeGreaterThanOrEqual(2);
  expect(initialSha).not.toBe('core-sha-'+remoteVersion);
  await A.context.close();
  await B.context.close();
});


test('Core sync retains an offline edit across reload and merges a remote device edit',async({browser})=>{
  let remoteText=null,remoteVersion=0;
  const attachGitHub=async page=>page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{
      'access-control-allow-origin':'*',
      'access-control-allow-methods':'GET, PUT, OPTIONS',
      'access-control-allow-headers':'authorization,accept,x-github-api-version,content-type',
    }});
    if(request.method()==='GET'&&url.pathname==='/repos/Gertjun/SyncData'){
      return route.fulfill({json:{private:true,default_branch:'main'}});
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      if(!remoteText)return route.fulfill({status:404,json:{message:'Not Found'}});
      return route.fulfill({json:{
        sha:'offline-sha-'+remoteVersion,encoding:'base64',
        content:Buffer.from(remoteText).toString('base64'),
      }});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      const body=JSON.parse(request.postData());
      const currentSha=remoteText?'offline-sha-'+remoteVersion:null;
      if(currentSha&&body.sha!==currentSha)return route.fulfill({status:409,json:{message:'SHA conflict'}});
      remoteText=Buffer.from(body.content,'base64').toString();
      remoteVersion++;
      return route.fulfill({status:remoteVersion===1?201:200,json:{content:{sha:'offline-sha-'+remoteVersion}}});
    }
    return route.fulfill({status:404,json:{message:'Not Found'}});
  });
  const contextA=await browser.newContext({viewport:{width:1280,height:800}});
  const pageA=await contextA.newPage();
  await attachGitHub(pageA);
  await pageA.goto('/index.html');
  const password='offline shared core password 123';
  await pageA.locator('#core-password').fill(password);
  await pageA.locator('#core-password-confirm').fill(password);
  await pageA.locator('[data-core-action=empty]').click();
  await pageA.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await pageA.evaluate(()=>window.PWACoreV1.runtime.updateGitHub({
    owner:'Gertjun',repo:'SyncData',token:'synthetic-token',branch:'main',
  }));

  const contextB=await browser.newContext({viewport:{width:1280,height:800}});
  const pageB=await contextB.newPage();
  await attachGitHub(pageB);
  await pageB.goto('/index.html');
  await pageB.locator('#core-gate details summary').click();
  await pageB.locator('#core-owner').fill('Gertjun');
  await pageB.locator('#core-repo').fill('SyncData');
  await pageB.locator('#core-token').fill('synthetic-token');
  await pageB.locator('#core-branch').fill('main');
  await pageB.locator('#core-password').fill(password);
  await pageB.locator('[data-core-action=import]').click();
  await pageB.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await pageB.waitForFunction(async()=>{
    const vault=await import('/js/core/vault.js');
    const meta=vault.getSyncMeta();
    return typeof meta.sha==='string'&&meta.sha.startsWith('offline-sha-')&&!meta.dirty;
  });

  await pageB.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    const data=structuredClone(vault.getData());
    data.txs.push({id:'online-device-change',type:'buy',coinId:'ethereum',qty:2,price:200,fee:0,date:'2026-11-16',created:2,mod:1700000000002});
    await vault.setData(data);
    await window.PWACoreV1.runtime.syncNow(false);
  });

  await contextA.setOffline(true);
  await pageA.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    const data=structuredClone(vault.getData());
    data.txs.push({id:'offline-device-change',type:'buy',coinId:'bitcoin',qty:1,price:100,fee:0,date:'2026-11-16',created:1,mod:1700000000001});
    await vault.setData(data);
    await vault.flush();
    const deviceSettings=await vault.getDeviceSettings();
    await vault.setDeviceSettings({...deviceSettings,syncEnabled:false});
    await vault.flush();
  });
  await pageA.close();

  await contextA.setOffline(false);
  const recoveredPage=await contextA.newPage();
  await attachGitHub(recoveredPage);
  await recoveredPage.goto('/index.html');
  await recoveredPage.locator('#core-unlock-password').fill(password);
  await recoveredPage.locator('#core-unlock-form button[type=submit]').click();
  await recoveredPage.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  const localAfterReload=await recoveredPage.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return vault.getData().txs.map(tx=>tx.id);
  });
  expect(localAfterReload).toContain('offline-device-change');
  await recoveredPage.evaluate(()=>window.PWACoreV1.runtime.updateGitHub({
    owner:'Gertjun',repo:'SyncData',token:'synthetic-token',branch:'main',
  }));
  await recoveredPage.waitForFunction(async()=>{
    const vault=await import('/js/core/vault.js');
    const meta=vault.getSyncMeta();
    return typeof meta.sha==='string'&&meta.sha.startsWith('offline-sha-')&&!meta.dirty;
  });

  const finalData=await recoveredPage.evaluate(async raw=>{
    const vault=await import('/js/core/vault.js');
    return vault.decryptRemote(JSON.parse(raw));
  },remoteText);
  const ids=finalData.txs.map(tx=>tx.id);
  expect(ids).toContain('offline-device-change');
  expect(ids).toContain('online-device-change');
  await contextA.close();
  await contextB.close();
});
