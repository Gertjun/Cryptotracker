// Tabellen en grafieken passen op het scherm: geen schuifbalk opzij (op elke schermbreedte en elk scherm).
// Past een tabel niet, dan verdwijnen eerst de minst belangrijke kolommen, met een melding onder de tabel.
import {test,expect} from '@playwright/test';
import {openApp,importCsv,isPhone} from './helpers.mjs';
const ROUTES=['','#transacties','#analyse/rendement','#analyse/vergelijken','#analyse/plannen','#analyse/administratie','#coin/bitcoin','#coin/fetch-ai'];
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
test('telefoon: koersverandering 1u, 24u, 7d en 30d op één regel onder elke munt (heel smal: twee regels)',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'de lijst staat alleen op de telefoon');
  await openApp(page);await importCsv(page);
  for(const w of [430,390,375,360,320]){await page.setViewportSize({width:w,height:844});await page.waitForTimeout(300);
    const res=await page.evaluate(()=>[...document.querySelectorAll('.list .mkt-chg')].map(el=>{
      const sp=[...el.children].filter(s=>!s.classList.contains('sr-only'));
      return{labels:sp.map(s=>s.querySelector('abbr').textContent).join(' '),
        lines:new Set(sp.map(s=>Math.round(s.getBoundingClientRect().top))).size,
        fits:sp.every(s=>s.scrollWidth<=s.clientWidth+1&&s.getBoundingClientRect().right<=el.getBoundingClientRect().right+1)}}));
    expect(res.length).toBeGreaterThan(0);
    for(const r of res)expect(r,`${w}px`).toEqual({labels:'1u 24u 7d 30d',lines:w<360?2:1,fits:true})}
});

test('portfolio-grafiek blijft binnen het paneel',async({page},testInfo)=>{
  const errors=await openApp(page);await importCsv(page);await chartReady(page);
  const bounds=await page.evaluate(()=>{const panel=document.querySelector('#pchart')?.closest('.panel'),chart=document.querySelector('#pchart'),svg=chart?.querySelector('svg');if(!panel||!chart||!svg)return null;
    const p=panel.getBoundingClientRect(),c=chart.getBoundingClientRect(),s=svg.getBoundingClientRect();
    return {panel:{left:p.left,right:p.right},chart:{left:c.left,right:c.right},svg:{left:s.left,right:s.right},viewport:document.documentElement.clientWidth}});
  expect(bounds, 'grafiek en paneel moeten bestaan').not.toBeNull();
  expect(bounds.chart.left).toBeGreaterThanOrEqual(bounds.panel.left-1);
  expect(bounds.chart.right).toBeLessThanOrEqual(bounds.panel.right+1);
  expect(bounds.svg.left).toBeGreaterThanOrEqual(bounds.chart.left-1);
  expect(bounds.svg.right).toBeLessThanOrEqual(bounds.chart.right+1);
  expect(errors).toEqual([]);
});
test('hoofdbalk toont appnaam, logo, versie en synchronisatiestatus',async({page})=>{
  await openApp(page);
  await expect(page.locator('#topbar .app-brand-icon')).toBeVisible();
  await expect(page.locator('#topbar .app-title')).toHaveText('Crypto Portfolio');
  await expect(page.locator('#topbar .app-brand-version')).toContainText('4.0.7');
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  await expect(page.locator('#topbar .app-screen-title')).toHaveText('Overzicht');
});
