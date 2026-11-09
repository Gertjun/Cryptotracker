// Indeling (3.14.0): Analyse (voorheen Rapporten), filters op de telefoon, volgorde op de munt-pagina, zijbalk en kolomkoppen.
import {test,expect} from '@playwright/test';
import {openApp,importCsv,isPhone} from './helpers.mjs';

test('oude adressen van Rapporten openen het juiste tabblad van Analyse',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#rapporten/analyse'});
  await expect(page).toHaveURL(/#analyse\/vergelijken$/);
  await expect(page.locator('.rep-tabs [aria-current="page"]')).toHaveText('Vergelijken');
  await page.evaluate(()=>{location.hash='#rapporten/administratie'});
  await expect(page).toHaveURL(/#analyse\/administratie$/);
  await page.evaluate(()=>{location.hash='#rapporten'});
  await expect(page).toHaveURL(/#analyse$/);
  await expect(page.locator('.tabbar a[data-tab="reps"]')).toContainText('Analyse');
  expect(errors).toEqual([]);
});

test('telefoon: filters en totalen staan achter de knop Filter',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await importCsv(page);
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
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#coin/bitcoin'});
  const txY=(await page.locator('.coin-txs').boundingBox()).y,toolsY=(await page.locator('.coin-tools').boundingBox()).y;
  expect(txY).toBeLessThan(toolsY);
});

test('laptop: zijbalk zonder dubbele muntenlijst op het Overzicht; kolomkoppen blijven staan',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op de laptop');
  await openApp(page);await importCsv(page);
  await expect(page.locator('#side .side-coin')).toHaveCount(0);
  await page.evaluate(()=>{location.hash='#coin/bitcoin'});
  await expect(page.locator('#side .side-coin').first()).toBeVisible();
  await page.evaluate(()=>{location.hash='#transacties'});
  await expect(page.locator('.tbl-wrap.only-d tbody tr').first()).toBeVisible();
  await page.mouse.wheel(0,2000);
  await expect.poll(()=>page.locator('.tbl-wrap.only-d thead th').first().evaluate(th=>Math.round(th.getBoundingClientRect().top))).toBe(0);
});

test('laptop: zijbalk in- en uitklappen, onthouden na herladen',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op de laptop');
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#coin/bitcoin'});
  const side=page.locator('#side'),tog=page.locator('#side [data-act=sidetog]');
  await expect(tog).toHaveAttribute('aria-expanded','true');
  const wide=await side.evaluate(e=>e.getBoundingClientRect().width);
  await tog.click();
  await expect(tog).toHaveAttribute('aria-expanded','false');
  await expect(tog).toBeFocused();
  expect(await side.evaluate(e=>e.getBoundingClientRect().width)).toBeLessThan(80);
  expect(wide).toBeGreaterThan(200);
  await expect(page.locator('#side .side-coin').first()).toBeHidden();
  await expect(page.getByRole('link',{name:'Transacties'}).first()).toBeVisible();
  await page.reload();await expect(page.locator('#side [data-act=sidetog]')).toHaveAttribute('aria-expanded','false');
  await page.locator('#side [data-act=sidetog]').click();
  await expect(page.locator('#side [data-act=sidetog]')).toHaveAttribute('aria-expanded','true');
  expect(await side.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(200);
});

test('telefoon: Instellingen is een eigen scherm; tandwiel opent het, terug brengt je terug, velden blijven staan',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#transacties'});await expect(page.locator('#txOut')).toBeVisible();
  await page.locator('[data-act=settings]:visible').first().click();
  await expect(page).toHaveURL(/#instellingen$/);
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
  await page.locator('[data-act=setback]:visible').click();
  await expect(page).toHaveURL(/#transacties$/);await expect(page.locator('#txOut')).toBeVisible();
  // terugknop van de browser
  await page.evaluate(()=>openSettings());await expect(page.locator('#st_sync')).toBeVisible();
  await page.goBack();await expect(page.locator('#txOut')).toBeVisible();
});

test('laptop: knoppen in de zijbalk, Instellingen als vierde knop met onderdelen (3.24.0)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op de laptop');
  const errors=await openApp(page);await importCsv(page);
  const side=page.locator('#side');
  // synchronisatie, + Transactie en het oogje staan in de zijbalk; rechtsboven staan geen knoppen meer
  for(const s of ['.sync','[data-act=add]','[data-act=privacy]'])await expect(side.locator(s)).toBeVisible();
  await expect(page.locator('.d-top .tb-act')).toBeHidden();
  await expect(page.locator('.d-top [data-act=settings]')).toHaveCount(0);
  await side.locator('[data-act=add]').click();await expect(page.locator('#sheet')).toBeVisible();await page.evaluate(()=>closeSheet());
  // Instellingen via de zijbalk
  await side.getByRole('link',{name:'Instellingen'}).click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(side.getByRole('link',{name:'Instellingen'})).toHaveAttribute('aria-current','page');
  await expect(page.locator('.set-nav')).toBeVisible();
  await expect(page.locator('[data-setsec=sync]')).toHaveAttribute('aria-current','true');
  await expect(page.locator('#st_sync')).toBeVisible();await expect(page.locator('#st_view')).toBeHidden();
  // wat je typt blijft staan, ook als je naar een ander onderdeel gaat en terug
  await page.fill('#s_repo','geert/test');await page.evaluate(()=>render());
  await page.locator('[data-setsec=view]').click();
  await expect(page.locator('#st_view')).toBeVisible();await expect(page.locator('#st_unit')).toBeVisible();await expect(page.locator('#st_sync')).toBeHidden();
  await expect(page.locator('[data-setsec=view]')).toHaveAttribute('aria-current','true');
  await page.locator('[data-theme=light]').click();await expect(page.locator('[data-setsec=view]')).toContainText('Licht');
  await page.locator('[data-setsec=sync]').click();await expect(page.locator('#s_repo')).toHaveValue('geert/test');
  // het gekozen onderdeel blijft na een vervolgblad en na herladen
  await page.locator('[data-setsec=pf]').click();
  await page.locator('[data-act=pfedit][data-id=""]').click();await expect(page.locator('#pf_name')).toBeVisible();
  await page.locator('#sheet [data-act=settings]').click();await expect(page.locator('#st_pf')).toBeVisible();
  await page.reload();await expect(page.locator('#st_pf')).toBeVisible();
  // ingeklapte zijbalk: de knoppen blijven bereikbaar
  await side.locator('[data-act=sidetog]').click();
  for(const s of ['.sync','[data-act=privacy]'])await expect(side.locator(s)).toBeVisible();
  await expect(side.getByRole('button',{name:'Transactie toevoegen'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('telefoon: de bovenbalk met appnaam en knoppen blijft staan bij scrollen',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await importCsv(page);
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

test('iPad rechtop: tabbladen bovenaan zonder zijbalk; laptop zijbalk; liggende telefoon tabbalk (3.23.1)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen met een instelbaar venster');
  const errors=await openApp(page);await importCsv(page);
  const nav=page.locator('#side nav'),tab=page.locator('.tabbar');
  for(const [w,h,mode] of [[820,1180,'tabs'],[744,1133,'tabs'],[932,430,'phone'],[1440,900,'side']]){
    await page.setViewportSize({width:w,height:h});
    await page.evaluate(()=>{location.hash='#coin/bitcoin'});await page.waitForTimeout(400);
    if(mode==='phone'){await expect(nav).toBeHidden();await expect(tab).toBeVisible();continue}
    await expect(nav).toBeVisible();await expect(tab).toBeHidden();
    await expect(page.locator('.d-top h1')).toBeVisible();
    const n=await nav.boundingBox(),hd=await page.locator('.d-top h1').boundingBox();
    if(mode==='tabs'){expect(n.width).toBeGreaterThan(w-60);expect(hd.y).toBeGreaterThan(n.y);   // tabbladen over de volle breedte, munttitel eronder
      await expect(page.locator('#side .side-coin').first()).toBeHidden();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
    else expect(n.width).toBeLessThan(300);
  }
  expect(errors).toEqual([]);
});
