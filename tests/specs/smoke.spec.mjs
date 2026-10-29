// Rooktest: alle schermen openen zonder JavaScript-fouten of CSP-blokkades
import {test,expect} from '@playwright/test';
import {openApp,importCsv,chartReady} from './helpers.mjs';

const screens=[
  ['Overzicht',async p=>{await p.evaluate(()=>{location.hash=''});await chartReady(p)}],
  ['Munt',async p=>{await p.evaluate(()=>{location.hash='#coin/bitcoin'});await expect(p.locator('#chart')).toBeVisible()}],
  ['Transacties',async p=>{await p.evaluate(()=>{location.hash='#transacties'});await expect(p.locator('#txOut')).toBeVisible()}],
  ...['rendement','vergelijken','plannen','administratie'].map(t=>[`Analyse › ${t}`,async p=>{await p.evaluate(t=>{location.hash='#analyse/'+t},t);await expect(p.locator('.rep-tabs [aria-current=page]')).toHaveAttribute('href','#analyse/'+t)}]),
  ['Transactieformulier',async p=>{await p.evaluate(()=>openTx());await expect(p.locator('#sheet')).toBeVisible()}],
  ['Instellingen',async p=>{await p.evaluate(()=>{closeSheet();openSettings()});await expect(p.locator('#sheet h2')).toHaveText('Instellingen')}],
  ['Vergrote grafiek',async p=>{await p.evaluate(()=>{closeSheet();location.hash=''});await chartReady(p);await p.locator('[data-act=pzoom]').click();await expect(p.locator('#pzchart .pc-plot')).toBeVisible()}],
];

test('alle schermen zonder fouten',async({page})=>{
  const errors=await openApp(page);
  await importCsv(page);
  for(const [name,go] of screens){await test.step(name,async()=>{await go(page);await page.waitForTimeout(300)})}
  for(const v of ['total','ptotal','assets','pct'])await test.step('grafiek '+v,async()=>{
    await page.evaluate(v=>{closeZoom();settings.pView=v;saveSettings();location.hash='';render()},v);await chartReady(page)});
  expect(errors,errors.join('\n')).toEqual([]);
});

test('lege app (nog geen transacties) zonder fouten',async({page})=>{
  const errors=await openApp(page);
  await expect(page.locator('#view')).toContainText('Nog geen investeringen');
  await page.evaluate(()=>{location.hash='#analyse/plannen'});await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});
