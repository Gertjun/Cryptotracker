import {test,expect} from '@playwright/test';

const HISTORICAL_SHA='abcdef1234567890abcdef1234567890abcdef12';
const PASSWORD='current core password 123';
const HISTORICAL_PASSWORD='historical core password 123';

async function openMigratedCore(page,{raceAfterHistoryRead=false}={}){
  let historicalEnvelope=null;
  let remoteText=null;
  let remoteSha=null;
  let putBodies=[];
  let racePending=false;

  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({
      v:1,updated:1700000000000,deleted:[],
      txs:[{id:'current-tx',type:'buy',coinId:'bitcoin',qty:1,price:25000,fee:0,date:'2025-01-01',mod:1700000000000}],
    }));
    localStorage.setItem('cpt.settings',JSON.stringify({
      gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'},
    }));
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(request.method()==='GET'&&url.pathname==='/repos/Gertjun/SyncData'){
      return route.fulfill({json:{private:true,default_branch:'main'}});
    }
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      if(url.searchParams.get('ref')===HISTORICAL_SHA){
        racePending=raceAfterHistoryRead;
        return route.fulfill({json:{
          sha:'historical-blob',encoding:'base64',
          content:Buffer.from(JSON.stringify(historicalEnvelope)).toString('base64'),
        }});
      }
      if(racePending){remoteSha='sha-raced-after-preview';racePending=false;}
      if(!remoteText)return route.fulfill({status:404,json:{message:'Not Found'}});
      return route.fulfill({json:{
        sha:remoteSha,encoding:'base64',content:Buffer.from(remoteText).toString('base64'),
      }});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      const body=JSON.parse(request.postData());
      putBodies.push(body);
      remoteText=Buffer.from(body.content,'base64').toString();
      remoteSha=putBodies.length===1?'sha-current-1':'sha-restored-2';
      return route.fulfill({status:201,json:{content:{sha:remoteSha}}});
    }
    return route.fulfill({status:200,json:{private:true,default_branch:'main'}});
  });

  await page.goto('/index.html');
  historicalEnvelope=await page.evaluate(async({password})=>{
    const c=await import('/js/core/crypto.js');
    const {APP}=await import('/js/core/config.js');
    const kdf={name:'PBKDF2-SHA256',iterations:APP.kdfIterations,salt:c.bytesToB64(c.randomBytes(16))};
    const kek=await c.passwordKey(password,c.b64ToBytes(kdf.salt),kdf.iterations);
    const key=await c.generateDataKey();
    const payload={schema:1,updated:1700000000000,deleted:[],txs:[
      {id:'historical-tx',type:'buy',coinId:'ethereum',qty:2,price:1500,fee:0,date:'2024-12-01',mod:1700000000000},
    ]};
    return {
      format:'pwa-vault',version:1,kdf,
      wrappedKey:await c.wrapDataKey(key,kek),
      payload:await c.encryptJSON(payload,key),
      updatedAt:1700000000000,
    };
  },{password:HISTORICAL_PASSWORD});

  await page.locator('#core-password').fill(PASSWORD);
  await page.locator('#core-password-confirm').fill(PASSWORD);
  await page.locator('[data-core-action=migrate]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await page.waitForFunction(()=>window.PWACoreV1?.vault?.getSyncMeta?.().sha==='sha-current-1');
  return {
    getRemote:()=>remoteText,
    getRemoteSha:()=>remoteSha,
    getPuts:()=>putBodies,
  };
}

test('historische Core-versie met andere datasleutel wordt veilig hersteld en gesynchroniseerd',async({page})=>{
  const remote=await openMigratedCore(page);
  const result=await page.evaluate(async({sha,password})=>
    window.PWACoreV1.runtime.restoreVersion(sha,password),
  {sha:HISTORICAL_SHA,password:HISTORICAL_PASSWORD});

  expect(result.sameKey).toBe(false);
  const state=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return {ids:vault.getData().txs.map(tx=>tx.id),meta:vault.getSyncMeta()};
  });
  expect(state.ids).toContain('historical-tx');
  expect(state.meta.sha).toBe('sha-restored-2');
  expect(remote.getRemoteSha()).toBe('sha-restored-2');
  const puts=remote.getPuts();
  expect(puts).toHaveLength(2);
  expect(puts[0].sha).toBeUndefined();
  expect(puts[1].sha).toBe('sha-current-1');
  expect(JSON.parse(remote.getRemote()).format).toBe('pwa-vault');
});

test('historisch herstel overschrijft geen GitHub-versie die na de preview veranderde',async({page})=>{
  const remote=await openMigratedCore(page,{raceAfterHistoryRead:true});
  const outcome=await page.evaluate(async({sha,password})=>{
    try {
      await window.PWACoreV1.runtime.restoreVersion(sha,password);
      return {ok:true};
    } catch(error) {
      return {ok:false,message:error.message};
    }
  },{sha:HISTORICAL_SHA,password:HISTORICAL_PASSWORD});

  expect(outcome.ok).toBe(false);
  expect(outcome.message).toContain('tegelijk op een ander apparaat gewijzigd');
  expect(remote.getRemoteSha()).toBe('sha-raced-after-preview');
  expect(remote.getPuts()).toHaveLength(1);
  const state=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return vault.getData().txs.map(tx=>tx.id);
  });
  // Lokale restore is beschikbaar; de conflicterende remote blijft onaangeroerd.
  expect(state).toContain('historical-tx');
});
