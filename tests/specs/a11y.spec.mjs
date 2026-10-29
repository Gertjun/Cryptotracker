// Toegankelijkheid (WCAG 2.2 AA) met axe-core, in alle thema's
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
  for(const t of ['rendement','vergelijken','plannen','administratie']){await page.evaluate(t=>{location.hash='#analyse/'+t},t);await check('Analyse '+t)}
  await page.evaluate(()=>{location.hash='';openSettings()});await check('Instellingen');
  await page.evaluate(()=>{closeSheet();openTx()});await check('Formulier');
  expect(found,found.join('\n')).toEqual([]);
});

// De extra thema's (Instellingen › Weergave): contrast en overige regels op de belangrijkste schermen
const EXTRA={black:'Zwart',navy:'Nachtblauw',soft:'Zacht',contrast:'Hoog contrast'};
for(const [th,naam] of Object.entries(EXTRA))test(`geen toegankelijkheidsfouten (thema ${naam})`,async({page})=>{
  await page.addInitScript(th=>{if(!sessionStorage.getItem('th')){sessionStorage.setItem('th','1');localStorage.setItem('cpt.settings',JSON.stringify({theme:th}))}},th);
  await openApp(page);await importCsv(page);await chartReady(page);
  await expect(page.locator('html')).toHaveClass(new RegExp('th-'+th));
  const found=[];
  const check=async n=>{await page.waitForTimeout(400);for(const v of await axe(page))found.push(n+': '+v)};
  await check('Overzicht');
  await page.evaluate(()=>{location.hash='#coin/ethereum'});await check('Munt');
  await page.evaluate(()=>{location.hash='#transacties'});await check('Transacties');
  await page.evaluate(()=>{location.hash='#analyse/rendement'});await check('Analyse');
  await page.evaluate(()=>{location.hash='';openSettings()});await check('Instellingen');
  expect(found,found.join('\n')).toEqual([]);
});

test('thema kiezen in Instellingen, en Automatisch volgt het apparaat',async({page})=>{
  await openApp(page,{theme:'dark'});
  const html=page.locator('html');
  await page.evaluate(()=>openSettings());
  await expect(page.locator('#themeAuto')).toBeVisible();
  await page.locator('#s_themeD').selectOption('navy');
  await expect(html).toHaveClass(/th-navy/);
  await page.emulateMedia({colorScheme:'light'});
  await expect(html).toHaveClass(/light/);await expect(html).not.toHaveClass(/th-navy/);
  await page.locator('#s_themeL').selectOption('soft');
  await expect(html).toHaveClass(/th-soft/);
  await page.locator('[data-theme=black]').click();
  await expect(html).toHaveClass(/th-black/);await expect(html).not.toHaveClass(/light/);
  await expect(page.locator('#themeAuto')).toBeHidden();
  await expect(page.locator('[data-theme=black]')).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>document.querySelector('meta[name=theme-color]').content)).toBe('#000000');
  await page.locator('[data-theme=contrast]').click();
  await expect(html).toHaveClass(/light/);await expect(html).toHaveClass(/th-contrast/);
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
