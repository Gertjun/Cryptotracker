// Wachtwoordregels, synchroniseren bij het verlaten van de app, tabbladen en de gegevensversie
import {test,expect} from '@playwright/test';
import {openApp} from './helpers.mjs';

test.beforeEach(()=>test.skip(test.info().project.name!=='laptop','één keer is genoeg (laptop)'));

// Nep-GitHub: houdt één bestand bij en telt het aantal keer opslaan
function fakeGitHub(state={file:null,puts:0}){
  return async page=>page.route('https://api.github.com/**',async r=>{const q=r.request(),acc=q.headers()['accept']||'';
    if(q.method()==='GET'){if(/\/commits/.test(q.url()))return r.fulfill({json:[]});
      if(!state.file)return r.fulfill({status:404,body:'{}'});if(acc.includes('raw'))return r.fulfill({status:200,body:state.file});
      return r.fulfill({json:{sha:'s'+state.puts,encoding:'base64',content:Buffer.from(state.file).toString('base64')}})}
    if(q.method()==='PUT'){const j=JSON.parse(q.postData());state.file=Buffer.from(j.content,'base64').toString();state.puts++;return r.fulfill({json:{content:{sha:'s'+state.puts}}})}
    return r.continue()})}

test('nieuw versleutelwachtwoord moet minimaal 12 tekens zijn, met indicator en oogje',async({page})=>{
  const st={file:null,puts:0};await fakeGitHub(st)(page);await openApp(page);
  await page.evaluate(()=>openSettings());
  await page.fill('#s_repo','u/r');await page.fill('#s_token','t');
  await page.locator('#s_pass').pressSequentially('kort123');
  await expect(page.locator('#s_pass_str')).toContainText('Te kort');
  await page.locator('[data-act=savesync]').click();
  await expect(page.locator('#s_pass_err')).toContainText('minimaal 12 tekens');
  expect(await page.evaluate(()=>settings.gh.pass)).toBe('');
  // oogje
  await page.locator('[data-act=pweye][data-for=s_pass]').click();
  await expect(page.locator('#s_pass')).toHaveAttribute('type','text');
  await expect(page.locator('[data-act=pweye][data-for=s_pass]')).toHaveAttribute('aria-pressed','true');
  await page.fill('#s_pass','paars konijn op de fiets');
  await expect(page.locator('#s_pass_str')).toHaveText('Sterk');
  await page.locator('[data-act=savesync]').click();
  await page.waitForFunction(()=>syncState.s==='ok');
  expect(st.puts).toBe(1);
});

test('kort wachtwoord mag wel als er al een bestand op GitHub staat',async({page})=>{
  const st={file:'{"v":1}',puts:0};await fakeGitHub(st)(page);await openApp(page);
  await page.evaluate(()=>openSettings());
  await page.fill('#s_repo','u/r');await page.fill('#s_token','t');await page.fill('#s_pass','kort123');
  await page.locator('[data-act=savesync]').click();
  await page.waitForFunction(()=>settings.gh.pass==='kort123');
});

test('wijzigingen gaan samen naar GitHub, en direct bij het verlaten van de app',async({page})=>{
  const st={file:null,puts:0};await fakeGitHub(st)(page);await openApp(page);
  await page.evaluate(()=>{Object.assign(settings.gh,{token:'t',repo:'u/r',pass:'paars konijn op de fiets',branch:'main',path:'p.json'});saveSettings()});
  await page.evaluate(()=>syncNow(false));await page.waitForFunction(()=>syncState.s==='ok');
  const before=st.puts;
  await page.evaluate(()=>{for(let i=0;i<3;i++){(data.watch=data.watch||[]).push({id:'w'+i,coinId:'bitcoin',mod:Date.now()+i});saveData()}});
  await page.waitForTimeout(2500);
  expect(st.puts).toBe(before);   // nog niet: er wordt 20 seconden gewacht
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  await expect.poll(()=>st.puts).toBe(before+1);   // één versie voor alle drie
});

test('twee tabbladen overschrijven elkaars wijzigingen niet',async({context})=>{
  const A=await context.newPage();await openApp(A);
  const B=await context.newPage();await openApp(B);
  const add=(p,id)=>p.evaluate(id=>{data.txs.push({id,type:'deposit',qty:100,price:1,fee:0,date:'2026-10-01',created:Date.now(),mod:Date.now()});saveData(false)},id);
  await add(A,'tA');
  await B.waitForFunction(()=>data.txs.some(t=>t.id==='tA'));   // B neemt de wijziging van A over
  await add(B,'tB');
  await A.waitForFunction(()=>data.txs.some(t=>t.id==='tB'));
  const ids=p=>p.evaluate(()=>data.txs.map(t=>t.id).sort());
  expect(await ids(A)).toEqual(['tA','tB']);expect(await ids(B)).toEqual(['tA','tB']);
  expect(await A.evaluate(()=>JSON.parse(localStorage.getItem('cpt.data')).txs.length)).toBe(2);
});

test('gegevens van een nieuwere app-versie: niet synchroniseren, vragen om te vernieuwen',async({page})=>{
  const st={file:null,puts:0};await fakeGitHub(st)(page);await openApp(page);
  // een "nieuwere app" zet gegevens met een hogere gegevensversie op GitHub
  const file=await page.evaluate(async()=>JSON.stringify(await encryptObj({v:DATA_V+1,txs:[],deleted:[],nieuweLijst:[{id:'x'}]},'paars konijn op de fiets')));
  st.file=file;
  await page.evaluate(()=>{Object.assign(settings.gh,{token:'t',repo:'u/r',pass:'paars konijn op de fiets',branch:'main',path:'p.json'});saveSettings()});
  await page.evaluate(()=>syncNow(true));
  await expect(page.locator('#toonew')).toBeVisible();
  await expect(page.locator('#toonew')).toContainText('Vernieuw de app');
  expect(await page.evaluate(()=>syncState.s)).toBe('err');
  expect(st.puts).toBe(0);
  expect(st.file).toBe(file);   // het bestand op GitHub is niet aangeraakt
});

test('samenvoegen bewaart onbekende onderdelen en de gegevensversie',async({page})=>{
  await openApp(page);
  expect(await page.evaluate(()=>{const m=merge({v:1,txs:[],deleted:[]},{txs:[],deleted:[],nieuweLijst:[1]});return [m.v,m.nieuweLijst]})).toEqual([1,[1]]);
});

test('back-up downloaden op de laptop, en inhoud verborgen in de app-wisselaar',async({page})=>{
  await openApp(page);
  const dl=page.waitForEvent('download');await page.evaluate(()=>exportData());
  expect((await dl).suggestedFilename()).toMatch(/^crypto-portfolio-.*\.json$/);
  const vis=h=>page.evaluate(h=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>h});document.dispatchEvent(new Event('visibilitychange'))},h);
  await vis(true);expect(await page.evaluate(()=>document.body.classList.contains('shield'))).toBe(false);   // zonder vergrendeling: niets verbergen
  await page.evaluate(()=>{lockCfg={autoLock:-1}});
  await vis(true);expect(await page.evaluate(()=>document.body.classList.contains('shield'))).toBe(true);
  await vis(false);expect(await page.evaluate(()=>document.body.classList.contains('shield'))).toBe(false);
});
