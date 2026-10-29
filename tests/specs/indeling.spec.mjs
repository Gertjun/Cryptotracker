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
