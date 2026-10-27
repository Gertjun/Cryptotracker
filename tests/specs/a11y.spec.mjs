// Toegankelijkheid (WCAG 2.2 AA) met axe-core, in het donkere en het lichte thema
import {test,expect} from '@playwright/test';
import {openApp,importCsv,chartReady} from './helpers.mjs';
import {createRequire} from 'node:module';import fs from 'node:fs';
const axeSrc=fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'),'utf8');
async function axe(page){await page.evaluate(axeSrc);
  return page.evaluate(async()=>(await window.axe.run(document,{resultTypes:['violations']})).violations.map(v=>`${v.id} (${v.impact}): ${v.nodes.slice(0,3).map(n=>n.target.join(' ')).join(' | ')}`))}

for(const theme of ['dark','light'])test(`geen toegankelijkheidsfouten (${theme==='dark'?'donker':'licht'})`,async({page})=>{
  await openApp(page,{theme});await importCsv(page);await chartReady(page);
  const found=[];
  const check=async n=>{await page.waitForTimeout(400);for(const v of await axe(page))found.push(n+': '+v)};
  await check('Overzicht');
  await page.evaluate(()=>{location.hash='#coin/ethereum'});await check('Munt');
  await page.evaluate(()=>{location.hash='#transacties'});await check('Transacties');
  for(const t of ['rendement','analyse','plannen','administratie']){await page.evaluate(t=>{location.hash='#rapporten/'+t},t);await check('Rapporten '+t)}
  await page.evaluate(()=>{location.hash='';openSettings()});await check('Instellingen');
  await page.evaluate(()=>{closeSheet();openTx()});await check('Formulier');
  expect(found,found.join('\n')).toEqual([]);
});

test('portfoliografiek is met het toetsenbord te bedienen',async({page})=>{
  test.skip(test.info().project.name!=='laptop','toetsenbord: laptop');
  await openApp(page);await importCsv(page);await chartReady(page);
  const chart=page.locator('#pchart .pc-plot');
  await expect(chart).toHaveAttribute('role','slider');
  await chart.focus();await page.keyboard.press('End');
  const last=await chart.getAttribute('aria-valuenow');
  await page.keyboard.press('ArrowLeft');
  expect(+await chart.getAttribute('aria-valuenow')).toBe(+last-1);
  await expect(chart).toHaveAttribute('aria-valuetext',/totaal €/);
  await page.keyboard.press('Home');await expect(chart).toHaveAttribute('aria-valuenow','0');
});
