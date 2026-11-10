// Inzicht in je portfolio: break-even (W45), bijdrage per munt (W17), meebewegen met bitcoin (W44),
// munten vergelijken (W27) en het Overzicht zelf indelen (W34).
import {test,expect} from '@playwright/test';
import {openApp,importCsv,isPhone} from './helpers.mjs';

test('afstand tot break-even bij een munt op verlies (W45)',async({page},testInfo)=>{
  const errors=await openApp(page);await importCsv(page);
  const want=await page.evaluate(()=>pct(beNeed(computeCoin('iostoken'))));
  expect(want).toBe('+14,09%');   // IOST staat −12,35% → +14,09% nodig
  await page.evaluate(()=>{location.hash='#coin/iostoken'});
  await expect(page.locator('.be-note')).toContainText(want);
  // munt op winst: geen regel
  await page.evaluate(()=>{location.hash='#coin/bitcoin'});
  await expect(page.locator('#pxMain')).toBeVisible();
  await expect(page.locator('.be-note')).toHaveCount(0);
  if(!isPhone(testInfo)){
    // kolom staat standaard uit en is aan te zetten
    await page.evaluate(()=>{location.hash=''});
    const tbl=page.locator('.hold-tbl:has(caption:text("Bezittingen"))');
    await expect(tbl.locator('thead th',{hasText:'Tot break-even'})).toHaveCount(0);
    await page.locator('[data-act=hcols]').click();
    await page.locator('[data-hcol=be]').check();
    await page.locator('#sheet [data-act=closesheet]').last().click();
    await expect(tbl.locator('thead th',{hasText:'Tot break-even'})).toHaveCount(1);
    await expect(tbl.locator('tbody tr',{hasText:'IOST'})).toContainText(want);
  }
  expect(errors).toEqual([]);
});

test('bijdrage per munt aan je rendement (W17)',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#analyse/rendement'});
  const card=page.locator('.card.ctb');
  await expect(card).toBeVisible();
  await expect(card.locator('.cal-nav b')).toContainText('oktober 2026');
  // Alles: per munt ongerealiseerd + gerealiseerd; samen gelijk aan het totaal van "Beste en slechtste munt"
  await card.getByRole('button',{name:'Alles'}).click();
  const want=await page.evaluate(()=>inEUR(()=>{const r=coinIds().map(computeCoin);return{tot:r.reduce((s,c)=>s+(c.unreal||0)+c.realized,0),
    top:r.map(c=>({s:c.meta.symbol.toUpperCase(),v:(c.unreal||0)+c.realized})).sort((a,b)=>b.v-a.v)[0].s}}));
  const eur=t=>(t.startsWith('−')?-1:1)*+t.replace(/[^0-9,]/g,'').replace(',','.');
  await expect(card.locator('tr:has-text("Samen") td').last()).toHaveText(/€/);
  expect(Math.abs(eur(await card.locator('tr:has-text("Samen") td').last().textContent())-want.tot)).toBeLessThan(0.02);   // FIFO-afronding: hooguit een cent verschil
  await expect(card.locator('tbody tr th').first()).toHaveText(want.top);
  // per kwartaal, bladeren naar het vorige kwartaal en terug
  await card.getByRole('button',{name:'Kwartaal'}).click();
  await expect(card.locator('.cal-nav b')).toContainText('Kwartaal 4 2026');
  await card.getByRole('button',{name:'Vorig kwartaal'}).click();
  await expect(card.locator('.cal-nav b')).toContainText('Kwartaal 3 2026');
  await expect(card.getByRole('button',{name:'Vorig kwartaal'})).toBeFocused();   // focus blijft op de knop
  await card.getByRole('button',{name:'Volgend kwartaal'}).click();
  await expect(card.getByRole('button',{name:'Volgend kwartaal'})).toBeDisabled();
  expect(errors).toEqual([]);
});

test('meebewegen met bitcoin (W44)',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#analyse/vergelijken'});
  const card=page.locator('.card.beta');
  await expect(card).toBeVisible();
  await expect(card.locator('.risk-lead')).toContainText('Als bitcoin 10% daalt, daalt je crypto gemiddeld',{timeout:15000});
  // bitcoin zelf beweegt precies mee
  await expect(card.locator('tr',{hasText:'(zelf)'})).toContainText('−10,0%');
  await expect(card.locator('tr',{hasText:'(zelf)'})).toContainText('sterk');
  // de waarde in de tabel is dezelfde bèta als de berekening
  const want=await page.evaluate(()=>{const B=new Map(dailySeries('bitcoin'));return pct1(-btcBeta(dailySeries('ethereum'),B).beta*10)});
  expect(want).toMatch(/%$/);
  await expect(card.locator('tr',{hasText:'ETH'})).toContainText(want);
  expect(errors).toEqual([]);
});

test('munten vergelijken in één grafiek (W27)',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#analyse/vergelijken'});
  const card=page.locator('.card.cmp');
  await expect(card).toBeVisible();
  await expect(card.locator('.cmp-legend li')).toHaveCount(2);   // standaard je twee grootste munten
  // een derde munt die je niet hebt (eerst op de volglijst)
  await page.evaluate(()=>{setWatch({id:'polkadot',name:'Polkadot',symbol:'dot'},true)});
  await page.evaluate(()=>{location.hash='#analyse/rendement'});await page.evaluate(()=>{location.hash='#analyse/vergelijken'});
  await card.getByLabel('Munt 3 (mag leeg)').focus();await card.getByLabel('Munt 3 (mag leeg)').selectOption('polkadot');
  await expect(card.locator('.cmp-legend li')).toHaveCount(3);
  await expect(card.locator('.cmp-legend')).toContainText('Polkadot');
  await expect(card.getByLabel('Munt 3 (mag leeg)')).toBeFocused();
  // laatste waarde = koersverandering over de periode
  await card.getByRole('button',{name:'1J'}).click();
  await expect(card.getByRole('button',{name:'1J'})).toHaveClass(/on/);
  await page.waitForFunction(()=>['polkadot','bitcoin','ethereum'].every(id=>chartCache[id+'|365']));
  await expect(card.locator('.cmp-legend li')).toHaveCount(3);
  const want=await page.evaluate(()=>{const p=chartCache['polkadot|365'].pts,b=chartCache['bitcoin|365'].pts,e=chartCache['ethereum|365'].pts,t0=Math.max(p[0][0],b[0][0],e[0][0]);
    const f=p.filter(q=>q[0]>=t0);return pct1((f[f.length-1][1]/f[0][1]-1)*100)});
  await expect(card.locator('.cmp-legend li',{hasText:'Polkadot'})).toContainText(want);
  // keuze blijft bewaard (per apparaat)
  expect(await page.evaluate(()=>settings.cmpIds[2])).toBe('polkadot');
  expect(errors).toEqual([]);
});

test('Overzicht zelf indelen: blokken verbergen en verplaatsen, per apparaat (W34)',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  const heads=()=>page.locator('#view > .list-head h2, #view > details.closed summary').allTextContents();
  expect((await heads()).map(t=>t.replace(/\s*\(.*$/,''))).toEqual(['Bezittingen','Volglijst']);
  await page.locator('[data-act=homeblocks]').click();
  await expect(page.locator('#sheet h2')).toHaveText('Overzicht indelen');
  // Volglijst boven Bezittingen; focus blijft op de knop
  const up=page.getByRole('button',{name:'Volglijst omhoog'});
  await up.click();
  await expect(page.getByRole('button',{name:'Volglijst omhoog'})).toBeFocused();
  await page.getByRole('button',{name:'Volglijst omhoog'}).click();
  await expect(page.getByRole('button',{name:'Volglijst omhoog'})).toBeDisabled();
  // Cash en Marktsentiment verbergen
  await page.locator('[data-hblk=cash]').uncheck();
  await page.locator('[data-hblk=fng]').uncheck();
  await page.locator('#sheet [data-act=closesheet]').last().click();
  expect(await heads()).toEqual(['Volglijst','Bezittingen']);
  await expect(page.locator('#fngCard')).toHaveCount(0);
  await expect(page.locator('.side-col [data-act=addcash]')).toHaveCount(0);
  expect(await page.evaluate(()=>settings.fng)).toBe(false);   // zelfde instelling als in Instellingen
  // blijft bewaard na herladen
  await page.reload();await expect(page.locator('#heroVal')).toBeVisible();
  expect(await heads()).toEqual(['Volglijst','Bezittingen']);
  // standaard herstellen via Instellingen › Weergave
  await page.evaluate(()=>{location.hash='#instellingen'});
  const sec=page.locator('[data-setsec=view]');if(await sec.isVisible())await sec.click();
  await page.getByRole('button',{name:'Overzicht indelen'}).click();
  await page.locator('[data-act=hblkreset]').click();
  await page.locator('#sheet [data-act=closesheet]').last().click();
  await page.evaluate(()=>{location.hash=''});
  await expect(page.locator('#heroVal')).toBeVisible();
  expect(await heads()).toEqual(['Bezittingen','Volglijst']);
  await expect(page.locator('#fngCard')).toBeVisible();
  expect(errors).toEqual([]);
});
