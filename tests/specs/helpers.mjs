// Gedeelde hulpfuncties voor de tests
import {expect} from '@playwright/test';
import {routeCG,routeFng} from '../mock.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const FIXTURE=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../fixtures/test-transactions.json');
// Vaste "nu": koersen uit de nep-CoinGecko en alle berekeningen zijn daardoor elke keer gelijk
export const NOW=Date.parse('2026-10-26T12:00:00Z');

// Start de app met nep-koersen, een vaste klok en het opvangen van fouten (JS-fouten en CSP-blokkades)
export async function openApp(page,{theme='dark',fngFail=false}={}){
  const errors=[];
  page.on('pageerror',e=>errors.push('JS: '+e.message));
  page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|ERR_|status of 404/.test(t))errors.push('console: '+t)});
  await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>console.error('CSP-blokkade: '+e.violatedDirective+' '+e.blockedURI)));
  await page.addInitScript(()=>{globalThis.__cgFast=true;globalThis.__CPT_TEST_LEGACY__=true});   // nep-CoinGecko: geen wachttijd tussen verzoeken nodig
  await page.clock.setFixedTime(NOW);
  await routeCG(page,null,NOW);
  await routeFng(page,NOW,{fail:fngFail});
  await page.emulateMedia({colorScheme:theme});
  await page.goto('/index.html');
  return errors;
}
// Seed de app met generieke synthetische transacties; geen broker-importfunctie nodig.
export async function seedTransactions(page){
  const txs=JSON.parse(await fs.readFile(FIXTURE,'utf8'));
  await page.evaluate(txs=>{data.txs=txs;data.deleted=[];saveData(false);render()},txs);
  await expect(page.locator('#heroVal')).toBeVisible();
  await page.waitForFunction(()=>Object.keys(prices||{}).length>=4);
}
// Wacht tot de portfoliografiek getekend is
export async function chartReady(page){await page.waitForFunction(()=>document.querySelector('#pchart .pc-plot'))}
export const isPhone=testInfo=>testInfo.project.name==='telefoon';
