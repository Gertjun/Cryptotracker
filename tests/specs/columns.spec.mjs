// Kolommen van de tabel Bezittingen: verplaatsen, verbergen, bewaren en standaard herstellen (alleen laptop)
import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';import fs from 'node:fs';
const axeSrc=fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'),'utf8');
import {openApp,importCsv,isPhone} from './helpers.mjs';

const heads=page=>page.locator('.hold-tbl:has(caption:text("Bezittingen")) thead th').allTextContents().then(a=>a.map(s=>s.replace('↓','').trim()));

test('kolommen verplaatsen, verbergen en herstellen',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabel staat alleen op de laptop');
  const errors=await openApp(page);await importCsv(page);
  expect(await heads(page)).toEqual(['Munt','Aantal','Gem. prijs','Koers','1 uur','24 uur','7 dagen','30 dagen','Waarde','Geïnvesteerd','Winst/verlies','%']);

  await page.locator('[data-act=hcols]').click();
  await expect(page.locator('#sheet h2')).toHaveText('Kolommen aanpassen');
  // Koers twee plekken naar links (vóór Aantal), focus blijft op de knop
  const up=page.getByRole('button',{name:'Koers naar links'});
  await up.click();await up.click();
  await expect(page.getByRole('button',{name:'Koers naar links'})).toBeDisabled();
  // Gemiddelde aankoopprijs verbergen
  await page.locator('[data-hcol=avg]').uncheck();
  expect(await heads(page)).toEqual(['Munt','Koers','Aantal','1 uur','24 uur','7 dagen','30 dagen','Waarde','Geïnvesteerd','Winst/verlies','%']);

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
  expect(await heads(page)).toEqual(['Munt','Aantal','Gem. prijs','Koers','1 uur','24 uur','7 dagen','30 dagen','Waarde','Geïnvesteerd','Winst/verlies','%']);
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
  expect(r).toBe('pl,qty,avg,price,ch1h,ch4h-,ch24,ch7-,ch30,ch1y-,value,cost,plabs');
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
  expect(cells[1]).toBe('0');expect(cells[2]).toBe('–');expect(cells[8]).toMatch(/0,00/);expect(cells[9]).toMatch(/0,00/);expect(cells[11]).toBe('+0,00%');
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

test('kolommen 1 uur, 4 uur en 1 jaar: 1 uur staat aan, 4 uur en 1 jaar kun je aanzetten',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabel staat alleen op de laptop');
  const errors=await openApp(page);await importCsv(page);
  const col=async name=>{const h=await heads(page),i=h.indexOf(name);if(i<0)return null;
    return page.locator('.hold-tbl:has(caption:text("Bezittingen")) tbody tr:first-child td').nth(i).textContent()};
  expect(await col('1 uur')).toMatch(/^[+−]\d+,\d\d%$/);
  expect(await heads(page)).not.toContain('4 uur');expect(await heads(page)).not.toContain('1 jaar');
  await page.locator('[data-act=hcols]').click();
  await page.locator('[data-hcol=ch4h]').check();await page.locator('[data-hcol=ch1y]').check();
  const h=await heads(page);
  expect(h.slice(4,7)).toEqual(['1 uur','4 uur','24 uur']);expect(h.indexOf('1 jaar')).toBe(h.indexOf('30 dagen')+1);
  await expect.poll(()=>col('4 uur')).toMatch(/^[+−]\d+,\d\d%$/);
  expect(await col('1 jaar')).toMatch(/^[+−]\d+,\d\d%$/);
  // 4 uur klopt met de grafiek: koers nu t.o.v. 4 uur geleden
  const ok=await page.evaluate(()=>{const id=openCoins()[0].coinId,v=ch4h(id),pts=chartCache[id+'|1'].pts,t=Date.now()-4*3600e3;
    const b=pts.reduce((a,p)=>Math.abs(p[0]-t)<Math.abs(a[0]-t)?p:a);return Math.abs(v-(prices[id].price/b[1]-1)*100)<1e-9});
  expect(ok).toBe(true);
  expect(await page.evaluate(()=>data.cfg.hcols.show.sort())).toEqual(['ch1y','ch4h']);
  // standaard herstellen zet ze weer uit
  await page.locator('[data-act=hcolreset]').click();
  expect(await heads(page)).not.toContain('4 uur');
  expect(errors).toEqual([]);
});

test('een eerder bewaarde kolomvolgorde krijgt de nieuwe kolom 1 uur op zijn standaardplek',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'één keer is genoeg');
  await openApp(page);
  const r=await page.evaluate(()=>{data.cfg={mod:1,hcols:{order:['price','ch24','ch7','ch30','qty','avg','cost','value','plabs','pl'],hide:[]}};
    return holdCols().filter(x=>!x.hide).map(x=>x.k).join()});
  expect(r).toBe('price,ch1h,ch24,ch7,ch30,qty,avg,cost,value,plabs,pl');
});

test('volglijst sorteren via de kolomkoppen: eerst hoog naar laag, dan laag naar hoog',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'de tabel staat alleen op de laptop');
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(async()=>{for(const [id,name,symbol] of [['solana','Solana','sol'],['dogecoin','Dogecoin','doge'],['polkadot','Polkadot','dot']]){setWatch({id,name,symbol},true);await fetchPrice(id)}render()});
  const wt=page.locator('.tbl-wrap:has(caption:text("Volglijst"))');
  const koers=()=>wt.locator('tbody tr').evaluateAll(rs=>rs.map(r=>r.dataset.coin));
  const prijs=id=>page.evaluate(id=>prices[id].price,id);
  const btn=wt.locator('[data-wsort=price]');
  await btn.click();
  let ids=await koers(),p=await Promise.all(ids.map(prijs));
  expect(p).toEqual([...p].sort((a,b)=>b-a));
  await expect(wt.locator('th[aria-sort=descending]')).toHaveCount(1);
  await expect(wt.locator('[data-wsort=price]')).toBeFocused();
  await wt.locator('[data-wsort=price]').click();
  ids=await koers();p=await Promise.all(ids.map(prijs));
  expect(p).toEqual([...p].sort((a,b)=>a-b));
  await expect(wt.locator('th[aria-sort=ascending]')).toHaveCount(1);
  // naam: eerst A → Z
  await wt.locator('[data-wsort=name]').click();
  expect(await koers()).toEqual(['dogecoin','polkadot','solana']);
  // Bezittingen blijft gewoon gesorteerd zoals het was
  expect(await page.evaluate(()=>settings.sort??'value')).toBe('value');
  expect(errors).toEqual([]);
});
