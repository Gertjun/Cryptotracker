// Versleutelde GitHub-synchronisatie tussen twee apparaten (met een nep-GitHub)
import {test,expect} from '@playwright/test';
import {openApp,importCsv} from './helpers.mjs';

test.describe.configure({mode:'serial'});
test.beforeEach(()=>test.skip(test.info().project.name!=='laptop','één keer is genoeg (laptop)'));

function fakeGitHub(){let file=null,sha=0;
  return async page=>page.route('https://api.github.com/**',async r=>{const q=r.request(),acc=q.headers()['accept']||'';
    if(q.method()==='GET'){if(/\/commits/.test(q.url()))return r.fulfill({json:[]});
      if(!file)return r.fulfill({status:404,body:'{}'});if(acc.includes('raw'))return r.fulfill({status:200,body:file});
      return r.fulfill({json:{sha:'s'+sha,encoding:'base64',content:Buffer.from(file).toString('base64')}})}
    if(q.method()==='PUT'){const j=JSON.parse(q.postData());file=Buffer.from(j.content,'base64').toString();sha++;return r.fulfill({json:{content:{sha:'s'+sha}}})}
    return r.continue()})}
const GH={token:'t',repo:'u/r',pass:'geheim123',branch:'main',path:'portfolio.json'};

test('transacties, portefeuilles en verwijderen komen op het andere apparaat aan',async({browser})=>{
  const gh=fakeGitHub();
  const dev=async()=>{const ctx=await browser.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();await gh(p);await openApp(p);
    await p.evaluate(g=>{Object.assign(settings.gh,g);saveSettings()},GH);return p};
  const A=await dev();await importCsv(A);
  await A.evaluate(()=>{data.portfolios=[{id:'pP',name:'Partner',mod:Date.now()}];
    data.txs.push({id:'pt1',pf:'pP',type:'buy',coinId:'ethereum',name:'Ethereum',symbol:'eth',qty:0.1,price:3000,fee:1,date:'2026-10-01',created:Date.now(),mod:Date.now()});saveData()});
  await A.evaluate(()=>syncNow(false));await A.waitForFunction(()=>syncState.s==='ok');
  // het bestand op GitHub is versleuteld
  const B=await dev();await B.evaluate(()=>syncNow(false));await B.waitForFunction(()=>syncState.s==='ok');
  expect(await B.evaluate(()=>({n:data.txs.length,pfs:pfList().map(p=>p.name),partner:withPf('pP',()=>TX().length)}))).toEqual({n:85,pfs:['Mijn portefeuille','Partner'],partner:1});
  // verwijderen op A komt ook op B aan
  A.once('dialog',d=>d.accept());await A.evaluate(()=>delPf('pP'));await A.evaluate(()=>syncNow(false));await A.waitForFunction(()=>syncState.s==='ok');
  await B.evaluate(()=>syncNow(false));await B.waitForFunction(()=>syncState.s==='ok');
  expect(await B.evaluate(()=>({n:data.txs.length,pfs:pfList().length}))).toEqual({n:84,pfs:1});
});

test('nieuw apparaat koppelen met koppelcode en pincode',async({browser})=>{
  const gh=fakeGitHub();
  const dev=async()=>{const ctx=await browser.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();await gh(p);await openApp(p);return p};
  const A=await dev();await A.evaluate(g=>{Object.assign(settings.gh,g);saveSettings()},GH);await importCsv(A);
  await A.evaluate(()=>syncNow(false));await A.waitForFunction(()=>syncState.s==='ok');
  await A.evaluate(()=>openSettings());await A.locator('[data-act=pairout]').click();
  const code=await A.locator('#pair_out').inputValue(),pin=await A.locator('.pair-pin').textContent();
  expect(code).toMatch(/^CPK1\./);expect(code).not.toContain('geheim123');
  const B=await dev();
  await B.locator('[data-act=pairopen]').click();
  await B.fill('#pair_in',code);await B.fill('#pair_pin','AAAA-AAAA');await B.locator('[data-act=pairin]').click();
  await expect(B.locator('#pair_pin_err')).toContainText('pincode klopt niet');
  await B.fill('#pair_pin',pin.toLowerCase());await B.locator('[data-act=pairin]').click();
  await B.waitForFunction(()=>syncState.s==='ok'&&data.txs.length===84);
  expect(await B.evaluate(()=>({repo:settings.gh.repo,pass:settings.gh.pass}))).toEqual({repo:GH.repo,pass:GH.pass});
});
