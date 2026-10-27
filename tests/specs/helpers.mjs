// Gedeelde hulpfuncties voor de tests
import {expect} from '@playwright/test';
import {routeCG} from '../mock.mjs';
import path from 'node:path';import {fileURLToPath} from 'node:url';
export const CSV=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../fixtures/dummy-bitvavo-export.csv');
// Vaste "nu": koersen uit de nep-CoinGecko en alle berekeningen zijn daardoor elke keer gelijk
export const NOW=Date.parse('2026-10-26T12:00:00Z');

// Start de app met nep-koersen, een vaste klok en het opvangen van fouten (JS-fouten en CSP-blokkades)
export async function openApp(page,{theme='dark'}={}){
  const errors=[];
  page.on('pageerror',e=>errors.push('JS: '+e.message));
  page.on('console',m=>{const t=m.text();if(m.type()==='error'&&!/Failed to load resource|ERR_|status of 404/.test(t))errors.push('console: '+t)});
  await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>console.error('CSP-blokkade: '+e.violatedDirective+' '+e.blockedURI)));
  await page.addInitScript(()=>{globalThis.__cgFast=true});   // nep-CoinGecko: geen wachttijd tussen verzoeken nodig
  await page.clock.setFixedTime(NOW);
  await routeCG(page,null,NOW);
  await page.emulateMedia({colorScheme:theme});
  await page.goto('/index.html');
  return errors;
}
// Importeer de test-export van Bitvavo (85 regels, 84 transacties)
export async function importCsv(page){
  await page.evaluate(()=>{document.querySelector('#bvFile').value=''});
  await page.setInputFiles('#bvFile',CSV);
  await page.locator('[data-act=doimport]').click();
  await expect(page.locator('#heroVal')).toBeVisible();
  await page.waitForFunction(()=>Object.keys(prices||{}).length>=4);
}
// Wacht tot de portfoliografiek getekend is
export async function chartReady(page){await page.waitForFunction(()=>document.querySelector('#pchart .pc-plot'))}
export const isPhone=testInfo=>testInfo.project.name==='telefoon';
