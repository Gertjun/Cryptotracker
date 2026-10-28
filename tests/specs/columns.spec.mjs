// Kolommen van de tabel Bezittingen: verplaatsen, verbergen, bewaren en standaard herstellen (alleen laptop)
import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';import fs from 'node:fs';
const axeSrc=fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'),'utf8');
import {openApp,importCsv,isPhone} from './helpers.mjs';

const heads=page=>page.locator('.hold-tbl:has(caption:text("Bezittingen")) thead th').allTextContents().then(a=>a.map(s=>s.replace('↓','').trim()));

test('kolommen verplaatsen, verbergen en herstellen',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabel staat alleen op de laptop');
  const errors=await openApp(page);await importCsv(page);
  expect(await heads(page)).toEqual(['Munt','Aantal','Gem. prijs','Koers','24 uur','7 dagen','30 dagen','Waarde','Geïnvesteerd','Winst/verlies','%']);

  await page.locator('[data-act=hcols]').click();
  await expect(page.locator('#sheet h2')).toHaveText('Kolommen aanpassen');
  // Koers twee plekken naar links (vóór Aantal), focus blijft op de knop
  const up=page.getByRole('button',{name:'Koers naar links'});
  await up.click();await up.click();
  await expect(page.getByRole('button',{name:'Koers naar links'})).toBeDisabled();
  // Gemiddelde aankoopprijs verbergen
  await page.locator('[data-hcol=avg]').uncheck();
  expect(await heads(page)).toEqual(['Munt','Koers','Aantal','24 uur','7 dagen','30 dagen','Waarde','Geïnvesteerd','Winst/verlies','%']);

  // Toegankelijkheid van het blad
  await page.evaluate(axeSrc);
  expect(await page.evaluate(async()=>(await window.axe.run('#sheet',{resultTypes:['violations']})).violations.map(v=>v.id))).toEqual([]);

  // Opgeslagen in de gegevens (en dus mee in de synchronisatie)
  const cfg=await page.evaluate(()=>data.cfg.hcols);
  expect(cfg.order.slice(0,2)).toEqual(['price','qty']);expect(cfg.hide).toEqual(['avg']);
  await page.reload();await expect(page.locator('.hold-tbl')).toBeVisible();
  expect((await heads(page))[1]).toBe('Koers');

  // Standaard herstellen
  await page.locator('[data-act=hcols]').click();
  await page.locator('[data-act=hcolreset]').click();
  expect(await heads(page)).toEqual(['Munt','Aantal','Gem. prijs','Koers','24 uur','7 dagen','30 dagen','Waarde','Geïnvesteerd','Winst/verlies','%']);
  expect(await page.evaluate(()=>data.cfg?.hcols)).toBeUndefined();
  expect(errors).toEqual([]);
});

test('kolomkeuze komt mee bij het samenvoegen van twee apparaten',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'één keer is genoeg');
  await openApp(page);
  const r=await page.evaluate(()=>{
    const a={txs:[],cfg:{mod:1}},b={txs:[],cfg:{mod:2,hcols:{order:['pl','qty'],hide:['ch7']}}};
    const m=merge(a,b);data.cfg=m.cfg;
    return holdCols().map(x=>x.k+(x.hide?'-':'')).join()});
  expect(r).toBe('pl,qty,avg,price,ch24,ch7-,ch30,value,cost,plabs');
});

test('volglijst heeft dezelfde kolommen als Bezittingen, met 0 voor wat je niet hebt',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabel staat alleen op de laptop');
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(async()=>{setWatch({id:'solana',name:'Solana',symbol:'sol'},true);await fetchPrice('solana');render()});
  const wt=page.locator('.tbl-wrap:has(caption:text("Volglijst"))');
  await expect(wt.locator('tbody tr')).toHaveCount(1);
  const wheads=()=>wt.locator('thead th').allTextContents().then(a=>a.map(s=>s.trim()));
  expect(await wheads()).toEqual(await heads(page));
  const cells=await wt.locator('tbody td').allTextContents();
  expect(cells[1]).toBe('0');expect(cells[2]).toBe('–');expect(cells[7]).toMatch(/0,00/);expect(cells[8]).toMatch(/0,00/);expect(cells[10]).toBe('+0,00%');
  // kolomkeuze geldt ook voor de volglijst
  await page.locator('[data-act=hcols]').click();
  await page.getByRole('button',{name:'Koers naar links'}).click();
  await page.locator('[data-hcol=cost]').uncheck();
  expect(await wheads()).toEqual(await heads(page));
  expect(await wheads()).not.toContain('Geïnvesteerd');
  expect(errors).toEqual([]);
});

test('Bezittingen en Volglijst passen op een brede laptop zonder schuifbalk, met kolommen onder elkaar',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabel staat alleen op de laptop');
  await openApp(page);await importCsv(page);
  await page.evaluate(async()=>{setWatch({id:'solana',name:'Solana',symbol:'sol'},true);await fetchPrice('solana');render()});
  for(const w of [1440,1600]){
    await page.setViewportSize({width:w,height:900});
    await page.evaluate(()=>render());
    const r=await page.evaluate(()=>{const t=[...document.querySelectorAll('.hold-tbl')];
      return{over:t.map(x=>x.parentElement.scrollWidth-x.parentElement.clientWidth),
        x:t.map(x=>[...x.querySelectorAll('thead th')].map(th=>Math.round(th.getBoundingClientRect().left)))}});
    expect(r.over,`breedte ${w}`).toEqual([0,0]);
    expect(r.x[1],`breedte ${w}`).toEqual(r.x[0]);
  }
});
