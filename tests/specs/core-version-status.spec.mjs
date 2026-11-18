// PWA-Core-versie en synchronisatiestatus in de app-instellingen
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const configSource=readFileSync(new URL('../../js/config.js',import.meta.url),'utf8');
const configValue=(key)=>configSource.match(new RegExp("\\b"+key+":\\s*'([^']+)'"))?.[1];
import {openApp} from './helpers.mjs';

const lock=JSON.parse(readFileSync(new URL('../../pwa-core.lock.json',import.meta.url),'utf8'));

test('app-configuratie volgt exact de vastgepinde PWA-Core-release',()=>{
  expect(configValue('version')).toBe('4.0.5');
  expect(configValue('coreVersion')).toBe(lock.version);
  expect(configValue('coreCommit')).toBe(lock.commit);
});

test('Core-versie is zichtbaar en synchronisatiestatus is niet afhankelijk van het legacy-wachtwoord',async({page})=>{
  await openApp(page);
  await page.evaluate(({version,commit})=>{
    CryptoPortfolioLegacy.setRuntime({
      save:async()=>{},
      getInfo:()=>({coreVersion:version,coreCommit:commit}),
      getSyncInfo:()=>({enabled:true,configured:true,lastSyncAt:null}),
      syncNow:async()=>{},
    });
    CryptoPortfolioLegacy.activateCore(
      {txs:[],deleted:[],updated:0},
      {syncEnabled:true,github:{owner:'Gertjun',repo:'SyncData',token:'test-token',branch:'main'},app:{settings:{},prices:{}}}
    );
    openSettings();
    showSetSec('about');
  },{version:configValue('coreVersion'),commit:configValue('coreCommit')});

  // #st_about is alleen de kop; de Core-versieregel staat in de volledige pane-inhoud eromheen.
  const aboutPane=page.locator('.set-pane[data-pane="about"]');
  await expect(aboutPane).toContainText('PWA-Core');
  await expect(aboutPane).toContainText('1.2.2');
  await expect(aboutPane).toContainText('14dc3ad');

  await page.evaluate(()=>showSetSec('sync'));
  await expect(page.locator('#setNav')).toContainText('Nog niet gesynchroniseerd');
  await page.evaluate(()=>CryptoPortfolioLegacy.setSyncStatus('ok'));
  await expect(page.locator('#setNav')).toContainText('Gesynchroniseerd');
  await expect(page.locator('#setSync')).toContainText('Gesynchroniseerd');
  await page.evaluate(()=>CryptoPortfolioLegacy.setSyncError('GitHub-token ongeldig'));
  await expect(page.locator('#setNav')).toContainText('Synchronisatie mislukt');
  await expect(page.locator('#setSync')).toContainText('GitHub-token ongeldig');
});
