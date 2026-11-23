// Indeling (3.14.0): Analyse (voorheen Rapporten), filters op de telefoon, volgorde op de munt-pagina, zijbalk en kolomkoppen.
import {test,expect} from '@playwright/test';
import {openApp,seedTransactions,isPhone} from './helpers.mjs';

test('oude adressen van Rapporten openen het juiste tabblad van Analyse',async({page})=>{
  const errors=await openApp(page);await seedTransactions(page);
  await page.evaluate(()=>{location.hash='#rapporten/analyse'});
  await expect(page).toHaveURL(/#analyse\/vergelijken$/);
  await expect(page.locator('.rep-tabs [aria-current="page"]')).toHaveText('Vergelijken');
  await page.evaluate(()=>{location.hash='#rapporten/administratie'});
  await expect(page).toHaveURL(/#analyse\/administratie$/);
  await page.evaluate(()=>{location.hash='#rapporten'});
  await expect(page).toHaveURL(/#analyse$/);
  await expect(page.locator('.app-nav .app-nav-btn[data-screen="reps"]')).toHaveAttribute('aria-current','page');
  expect(errors).toEqual([]);
});

test('telefoon: filters en totalen staan achter de knop Filter',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await seedTransactions(page);
  await page.evaluate(()=>{location.hash='#transacties'});
  const btn=page.locator('.filt-btn');
  await expect(btn).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#tf_coin')).toBeHidden();
  await expect(page.locator('.tx-sum')).toBeHidden();
  await expect(page.locator('.tx-brief')).toContainText('84 transacties');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded','true');
  await page.selectOption('#tf_year','2026');
  await expect(btn).toContainText('(1)');
  await expect(page.locator('.tx-sum')).toBeVisible();
});

test('telefoon: transacties van een munt staan vóór de rekenhulpen',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await seedTransactions(page);
  await page.evaluate(()=>{location.hash='#coin/bitcoin'});
  const txY=(await page.locator('.coin-txs').boundingBox()).y,toolsY=(await page.locator('.coin-tools').boundingBox()).y;
  expect(txY).toBeLessThan(toolsY);
});

test('laptop: zijbalk en kopbalk komen uit PWA-Core (D67)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op laptop en tablet');
  await openApp(page);await seedTransactions(page);
  const nav=page.locator('.app-nav');
  // de navigatie is gemaakt door js/core/nav.js en de opmaak komt uit css/base.css (laag core)
  await expect(nav.locator('.app-nav-brand .app-title')).toHaveText('Crypto Portfolio');
  await expect(nav.locator('.app-nav-brand img')).toBeVisible();
  expect(await page.evaluate(()=>[...document.styleSheets].some(s=>[...s.cssRules].some(r=>r.layerName==='core'&&r.href?.endsWith('css/base.css'))))).toBe(true);
  await expect(page.locator('#topbar .app-brand')).toBeHidden();   // merk staat in de zijbalk
  await expect(page.locator('#topbar .app-screen-title')).toHaveText('Overzicht');
  await expect(page.locator('#topbar .app-screen-title')).toBeVisible();
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  const sb=await nav.boundingBox(),tb=await page.locator('#topbar').boundingBox();
  expect(sb.x).toBe(0);expect(Math.round(sb.width)).toBe(236);   // zijbalk 236 px breed, links
  expect(Math.round(tb.height)).toBe(61);                          // kopbalk 61 px, zoals de andere apps
  for(const label of ['Overzicht','Transacties','Analyse','Instellingen'])await expect(nav.getByRole('button',{name:label})).toBeVisible();
  // inklappen: smalle strook van 68 px (onthouden per apparaat, net als in de andere apps)
  await nav.locator('.app-nav-collapse').click();
  await expect(page.locator('#screen-app')).toHaveClass(/nav-collapsed/);
  await expect.poll(async()=>Math.round((await nav.boundingBox()).width)).toBe(68);
  await nav.locator('.app-nav-collapse').click();
  await expect.poll(async()=>Math.round((await nav.boundingBox()).width)).toBe(236);
});

test('laptop: hoofdbalkacties zijn bereikbaar en openen de juiste schermen',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op laptop en tablet');
  const errors=await openApp(page);await seedTransactions(page);
  await expect(page.locator('#topbar .header-add')).toBeVisible();
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  await expect(page.locator('#topbar [data-act=privacy]')).toBeVisible();
  await page.locator('#topbar .header-add').click();
  await expect(page.locator('#sheet')).toBeVisible();await page.evaluate(()=>closeSheet());
  await page.locator('.app-nav').getByRole('button',{name:'Instellingen'}).click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(page.locator('#topbar .app-screen-title')).toHaveText('Instellingen');
  await expect(page.locator('#topbar [data-act=setback], #topbar [data-act=settings]')).toHaveCount(0);   // geen tandwiel of terugknop meer (D65)
  await expect(page.locator('#st_sync')).toBeVisible();
  expect(errors).toEqual([]);
});

test('telefoon: Instellingen is een vierde tabblad onderin; velden blijven staan (D65, D67)',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await seedTransactions(page);
  await page.evaluate(()=>{location.hash='#transacties'});await expect(page.locator('#txOut')).toBeVisible();
  await expect(page.locator('#topbar [data-act=settings], #topbar [data-act=setback]')).toHaveCount(0);   // geen tandwiel bovenin
  const btn=id=>page.locator(`.app-nav .app-nav-btn[data-screen="${id}"]`);
  await expect(page.locator('.app-nav .app-nav-btn')).toHaveCount(4);
  await expect(btn('txs')).toHaveAttribute('aria-current','page');
  await btn('settings').click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(btn('settings')).toHaveAttribute('aria-current','page');
  await expect(btn('txs')).not.toHaveAttribute('aria-current','page');
  const tb=await btn('settings').boundingBox();expect(tb.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#sheet')).toBeHidden();
  await expect(page.locator('.set-nav')).toBeHidden();   // op de telefoon alle blokken onder elkaar
  for(const id of ['st_view','st_unit','st_pf','st_sec','st_sync','st_dev','st_cg','st_fng','st_imp','st_bak','st_danger','st_about'])await expect(page.locator('#'+id)).toBeVisible();
  await expect(page.locator('#btnAdd')).toBeHidden();
  // een koersupdate tekent het scherm niet opnieuw: wat je typt blijft staan
  await page.fill('#s_repo','geert/test');await page.evaluate(()=>render());
  await expect(page.locator('#s_repo')).toHaveValue('geert/test');
  // een vervolgblad (portefeuille) sluit terug naar het scherm
  await page.locator('[data-act=pfedit][data-id=""]').click();await expect(page.locator('#pf_name')).toBeVisible();
  await page.locator('#sheet [data-act=settings]').click();await expect(page.locator('#sheet')).toBeHidden();
  await expect(page.locator('#st_pf')).toBeVisible();
  await btn('txs').click();
  await expect(page).toHaveURL(/#transacties$/);await expect(page.locator('#txOut')).toBeVisible();
  await expect(btn('txs')).toHaveAttribute('aria-current','page');
  // munt-pagina hoort bij Overzicht; een tik op Overzicht gaat terug naar het overzicht
  await page.evaluate(()=>{location.hash='#coin/bitcoin'});await expect(btn('home')).toHaveAttribute('aria-current','page');
  await btn('home').click();await expect(page).toHaveURL(/#$|\/$|index\.html$/);
  // terugknop van de browser
  await page.evaluate(()=>{location.hash='#transacties'});await expect(page.locator('#txOut')).toBeVisible();
  await page.evaluate(()=>openSettings());await expect(page.locator('#st_sync')).toBeVisible();
  await page.goBack();await expect(page.locator('#txOut')).toBeVisible();
  await expect(btn('txs')).toHaveAttribute('aria-current','page');
});

test('laptop: hoofdbalk bevat acties en navigatie is volledig bereikbaar',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op laptop en tablet');
  const errors=await openApp(page);await seedTransactions(page);
  await expect(page.locator('#topbar .header-add')).toBeVisible();
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  await expect(page.locator('#topbar [data-act=privacy]')).toBeVisible();
  await expect(page.locator('#topbar [data-act=settings]')).toHaveCount(0);
  const nav=page.locator('.app-nav');
  for(const label of ['Overzicht','Transacties','Analyse','Instellingen'])await expect(nav.getByRole('button',{name:label})).toBeVisible();
  await page.locator('#topbar .header-add').click();await expect(page.locator('#sheet')).toBeVisible();await page.evaluate(()=>closeSheet());
  await nav.getByRole('button',{name:'Transacties'}).click();
  await expect(page).toHaveURL(/#transacties$/);await expect(page.locator('#txOut')).toBeVisible();
  await nav.getByRole('button',{name:'Instellingen'}).click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(page.locator('#st_sync')).toBeVisible();
  expect(errors).toEqual([]);
});
test('telefoon: de bovenbalk met appnaam en knoppen blijft staan bij scrollen',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await seedTransactions(page);
  await page.evaluate(()=>{location.hash='#transacties'});
  await page.waitForTimeout(300);
  await page.evaluate(()=>window.scrollTo(0,1500));
  await page.waitForTimeout(200);
  expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(500);
  const box=await page.locator('#topbar').boundingBox();
  expect(Math.abs(box.y)).toBeLessThan(2);
  // knoppen in de balk zijn zichtbaar en klikbaar (niets erboven)
  const hit=await page.evaluate(()=>{const b=document.querySelector('#topbar button');if(!b)return false;const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))});
  expect(hit).toBe(true);
});

test('één navigatie van PWA-Core: tabbalk, tabbladen of zijbalk per schermformaat (D67)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen met een instelbaar venster');
  const errors=await openApp(page);await seedTransactions(page);
  const nav=page.locator('.app-nav');
  for(const [w,h,mode] of [[820,1180,'tabs'],[744,1133,'tabs'],[932,430,'phone'],[390,844,'phone'],[1440,900,'side']]){
    await page.setViewportSize({width:w,height:h});
    await page.evaluate(()=>{location.hash='#coin/bitcoin'});await page.waitForTimeout(400);
    await expect(nav).toBeVisible();
    const n=await nav.boundingBox(),t=await page.locator('#topbar').boundingBox();
    if(mode==='phone'){expect(Math.round(n.y+n.height)).toBe(h);expect(Math.round(n.height)).toBeGreaterThanOrEqual(58);continue}   // tabbalk onderin
    if(mode==='tabs'){
      expect(n.width).toBeGreaterThan(w-2);expect(n.y).toBeGreaterThanOrEqual(t.y+t.height-1);   // rij over de volle breedte, onder de kopbalk
      await expect(page.locator('#topbar .app-brand')).toBeVisible();
      await expect(nav.locator('.app-nav-brand')).toBeHidden();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
    else{expect(n.x).toBe(0);expect(n.height).toBeGreaterThan(h-2);await expect(page.locator('.app-screen-title')).toBeVisible()}
  }
  expect(errors).toEqual([]);
});
