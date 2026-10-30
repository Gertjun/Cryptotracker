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

test('Instellingen is een eigen scherm: tandwiel opent het, terug brengt je terug, velden blijven staan',async({page})=>{
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#transacties'});await expect(page.locator('#txOut')).toBeVisible();
  await page.locator('[data-act=settings]:visible').first().click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(page.locator('#sheet')).toBeHidden();
  for(const id of ['st_view','st_pf','st_sec','st_sync','st_cg','st_imp','st_danger'])await expect(page.locator('#'+id)).toBeVisible();
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
