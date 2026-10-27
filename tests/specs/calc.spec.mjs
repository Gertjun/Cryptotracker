// Berekeningen: cash, inleg, gerealiseerde winst, en dat grafiek en tabel hetzelfde percentage tonen
import {test,expect} from '@playwright/test';
import {openApp,importCsv,chartReady} from './helpers.mjs';

test('vaste bedragen uit de test-export',async({page})=>{
  await openApp(page);await importCsv(page);
  const r=await page.evaluate(()=>{const p=portfolio();return{n:data.txs.length,cash:+p.cash.toFixed(2),dep:+p.dep.toFixed(2),real:+p.realized.toFixed(2),coins:p.open.length}});
  // Deze getallen hangen alleen van de export af, niet van koersen
  expect(r).toEqual({n:84,cash:439.87,dep:1600,real:47.79,coins:5});
});

test('% per munt in de grafiek = percentage in de tabel Bezittingen',async({page})=>{
  await openApp(page);await importCsv(page);
  for(const range of ['1h','7','max']){
    await page.evaluate(r=>{settings.pView='pct';settings.pRange=r;saveSettings();render()},range);await chartReady(page);
    const r=await page.evaluate(()=>{const g=[...document.querySelectorAll('#plegend li')].map(li=>li.textContent.trim().replace(/\s+/g,' '));
      const t=openCoins().slice(0,6).map(c=>symOf(c)+' '+pct1(c.unrealPct));return{g,t}});
    expect(r.g,range).toEqual(r.t);
  }
});

test('% Totaal eindigt op het percentage bij Totaal ongerealiseerd',async({page})=>{
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{settings.pView='ptotal';settings.pRange='30';saveSettings();render()});await chartReady(page);
  const r=await page.evaluate(()=>{const p=portfolio();return{g:document.querySelector('#plegend b').textContent,t:pct1(p.unrealPct)}});
  expect(r.g).toBe(r.t);
});

test('in bitcoin bekeken staat bitcoin op min de kosten',async({page})=>{
  await openApp(page);await importCsv(page);
  const pct=await page.evaluate(async()=>{await setUnit('BTC');return inUnit(()=>computeCoin('bitcoin').unrealPct)});
  expect(pct).toBeLessThan(0);expect(pct).toBeGreaterThan(-1);   // alleen de transactiekosten (≈ −0,25%)
});

test('ingevuld formulier: hoogstens 8 decimalen, bedrag met 2 decimalen',async({page})=>{
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>openTx({coinId:'bitcoin',type:'buy',total:112.1,fee:0.28}));
  await expect(page.locator('#f_total')).toHaveValue('112,10');
  const q=await page.locator('#f_qty').inputValue();
  expect(q.split(/[.,]/)[1]?.length??0).toBeLessThanOrEqual(8);
});
