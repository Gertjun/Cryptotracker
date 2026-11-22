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

test('laptop: zijbalk en kopbalk volgen de PWA-Core-schil (D66)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op laptop en tablet');
  await openApp(page);await importCsv(page);
  const side=page.locator('#side');
  await expect(side.locator('.brand img')).toBeVisible();
  await expect(side.locator('.brand-n')).toHaveText('Crypto Portfolio');
  await expect(page.locator('#topbar .app-brand')).toBeHidden();   // merk staat in de zijbalk
  await expect(page.locator('#topbar .app-screen-title')).toHaveText('Overzicht');
  await expect(page.locator('#topbar .app-screen-title')).toBeVisible();
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  const sb=await side.boundingBox(),tb=await page.locator('#topbar').boundingBox(),vb=await page.locator('#view').boundingBox();
  expect(sb.x).toBe(0);expect(Math.round(sb.width)).toBe(236);   // zijbalk 236 px breed, links
  expect(Math.round(tb.height)).toBe(61);                          // kopbalk 61 px, zoals de andere apps
  const nav=side.locator('nav');
  for(const label of ['Overzicht','Transacties','Analyse','Instellingen'])await expect(nav.getByRole('link',{name:label})).toBeVisible();
  // inklappen: smalle strook van 68 px, labels alleen voor schermlezers
  await side.locator('[data-act=sidetog]').click();
  await expect(page.locator('.shell')).toHaveClass(/side-min/);
  await expect.poll(async()=>Math.round((await side.boundingBox()).width)).toBe(68);   // na de animatie
  await side.locator('[data-act=sidetog]').click();
  expect(vb.x).toBeGreaterThanOrEqual(0);
});

test('laptop: hoofdbalkacties zijn bereikbaar en openen de juiste schermen',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op laptop en tablet');
  const errors=await openApp(page);await importCsv(page);
  await expect(page.locator('#topbar .header-add')).toBeVisible();
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  await expect(page.locator('#topbar [data-act=privacy]')).toBeVisible();
  await page.locator('#topbar .header-add').click();
  await expect(page.locator('#sheet')).toBeVisible();await page.evaluate(()=>closeSheet());
  await page.locator('#side nav').getByRole('link',{name:'Instellingen'}).click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(page.locator('#topbar .app-screen-title')).toHaveText('Instellingen');
  await expect(page.locator('#topbar [data-act=setback], #topbar [data-act=settings]')).toHaveCount(0);   // geen tandwiel of terugknop meer (D65)
  await expect(page.locator('#st_sync')).toBeVisible();
  expect(errors).toEqual([]);
});

test('telefoon: Instellingen is een vierde tabblad onderin; velden blijven staan (D65)',async({page},testInfo)=>{
  test.skip(!isPhone(testInfo),'alleen op de telefoon');
  await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#transacties'});await expect(page.locator('#txOut')).toBeVisible();
  await expect(page.locator('#topbar [data-act=settings], #topbar [data-act=setback]')).toHaveCount(0);   // geen tandwiel bovenin
  const setTab=page.locator('.tabbar a[data-tab="set"]');
  await expect(page.locator('.tabbar a')).toHaveCount(4);
  await setTab.click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(setTab).toHaveAttribute('aria-current','page');
  await expect(page.locator('.tabbar a[data-tab="txs"]')).not.toHaveAttribute('aria-current','page');
  const tb=await setTab.boundingBox();expect(tb.height).toBeGreaterThanOrEqual(44);
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
  await page.locator('.tabbar a[data-tab="txs"]').click();
  await expect(page).toHaveURL(/#transacties$/);await expect(page.locator('#txOut')).toBeVisible();
  await expect(page.locator('.tabbar a[data-tab="txs"]')).toHaveAttribute('aria-current','page');
  // terugknop van de browser
  await page.evaluate(()=>openSettings());await expect(page.locator('#st_sync')).toBeVisible();
  await page.goBack();await expect(page.locator('#txOut')).toBeVisible();
});

test('laptop: hoofdbalk bevat acties en navigatie is volledig bereikbaar',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op laptop en tablet');
  const errors=await openApp(page);await importCsv(page);
  await expect(page.locator('#topbar .header-add')).toBeVisible();
  await expect(page.locator('#topbar .header-sync')).toBeVisible();
  await expect(page.locator('#topbar [data-act=privacy]')).toBeVisible();
  await expect(page.locator('#topbar [data-act=settings]')).toHaveCount(0);
  const nav=page.locator('#side nav');
  for(const label of ['Overzicht','Transacties','Analyse','Instellingen'])await expect(nav.getByRole('link',{name:label})).toBeVisible();
  await page.locator('#topbar .header-add').click();await expect(page.locator('#sheet')).toBeVisible();await page.evaluate(()=>closeSheet());
  await nav.getByRole('link',{name:'Instellingen'}).click();
  await expect(page).toHaveURL(/#instellingen$/);
  await expect(page.locator('#st_sync')).toBeVisible();
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

test('iPad rechtop: kopbalk met tabbladen eronder; laptop zijbalk; liggende telefoon tabbalk (D66)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen met een instelbaar venster');
  const errors=await openApp(page);await importCsv(page);
  const side=page.locator('#side'),nav=page.locator('#side nav'),tab=page.locator('.tabbar');
  for(const [w,h,mode] of [[820,1180,'tabs'],[744,1133,'tabs'],[932,430,'phone'],[1440,900,'side']]){
    await page.setViewportSize({width:w,height:h});
    await page.evaluate(()=>{location.hash='#coin/bitcoin'});await page.waitForTimeout(400);
    if(mode==='phone'){await expect(nav).toBeHidden();await expect(tab).toBeVisible();continue}
    await expect(nav).toBeVisible();await expect(tab).toBeHidden();
    const s=await side.boundingBox(),t=await page.locator('#topbar').boundingBox(),n=await nav.boundingBox();
    if(mode==='tabs'){
      expect(s.width).toBeGreaterThan(w-2);expect(s.y).toBeGreaterThanOrEqual(t.y+t.height-1);   // rij over de volle breedte, onder de kopbalk
      expect(Math.abs((n.x+n.width/2)-w/2)).toBeLessThanOrEqual(2);                              // tabbladen gecentreerd
      await expect(page.locator('#topbar .app-brand')).toBeVisible();
      await expect(page.locator('#side .side-coin').first()).toBeHidden();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
    else{expect(s.x).toBe(0);expect(s.height).toBeGreaterThan(h-2);await expect(page.locator('.app-screen-title')).toBeVisible()}
  }
  expect(errors).toEqual([]);
});
