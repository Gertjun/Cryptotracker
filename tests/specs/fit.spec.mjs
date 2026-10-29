// Tabellen en grafieken passen op het scherm: geen schuifbalk opzij (op elke schermbreedte en elk scherm).
// Past een tabel niet, dan verdwijnen eerst de minst belangrijke kolommen, met een melding onder de tabel.
import {test,expect} from '@playwright/test';
import {openApp,importCsv,isPhone} from './helpers.mjs';
const ROUTES=['','#transacties','#rapporten/rendement','#rapporten/analyse','#rapporten/plannen','#rapporten/administratie','#coin/bitcoin','#coin/fetch-ai'];
// alles wat opzij scrolt (behalve de bewust brede dag/week-grafiek in het vergrote scherm op een telefoon)
const overflow=page=>page.evaluate(()=>{const out=[],de=document.documentElement;if(de.scrollWidth>de.clientWidth+1)out.push('pagina');
  for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if(!/auto|scroll/.test(cs.overflowX)||!el.getClientRects().length)continue;
    if(el.scrollWidth>el.clientWidth+1)out.push((el.id?'#'+el.id:el.className)+' '+el.scrollWidth+'>'+el.clientWidth)}return out});
test('geen schuifbalk opzij bij tabellen en grafieken',async({page},testInfo)=>{
  const widths=isPhone(testInfo)?[null]:[768,1024,1280,1440];
  const errors=await openApp(page);await importCsv(page);
  for(const w of widths){if(w)await page.setViewportSize({width:w,height:900});
    for(const r of ROUTES){await page.evaluate(h=>{location.hash=h},r);await page.waitForTimeout(500);
      expect(await overflow(page),`${w||'telefoon'} ${r||'overzicht'}`).toEqual([])}}
  expect(errors).toEqual([]);
});
test('te brede tabel: minst belangrijke kolommen verdwijnen, met melding; op 1440 px past alles',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabellen staan alleen op de laptop');
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#transacties'});
  const note=page.locator('.fit-note');
  await expect(page.locator('.tbl-wrap.only-d tbody tr').first()).toBeVisible();
  await expect(note).toHaveCount(0);
  await page.setViewportSize({width:1024,height:900});
  await expect(note).toContainText('Broker · notitie');
  await expect(page.locator('.tbl-wrap.only-d thead th:has-text("Kosten")')).toBeHidden();
  await expect(page.locator('.tbl-wrap.only-d thead th:has-text("Winst/verlies")')).toBeVisible();
  // Munt staat als ticker in de tabel, met de volledige naam voor schermlezers
  await expect(page.locator('.tbl-wrap.only-d tbody .coin-cell',{hasText:'BTC'}).first()).toContainText('Bitcoin');
  await page.setViewportSize({width:1440,height:900});
  await expect(note).toHaveCount(0);
});
