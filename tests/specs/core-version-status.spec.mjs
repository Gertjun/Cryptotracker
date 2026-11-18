// PWA-Core-versie en synchronisatiestatus in de app-instellingen
import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {APP} from '../../js/config.js';
import {openApp} from './helpers.mjs';

const lock=JSON.parse(readFileSync(new URL('../../pwa-core.lock.json',import.meta.url),'utf8'));

test('app-configuratie volgt exact de vastgepinde PWA-Core-release',()=>{
  expect(APP.version).toBe('4.0.5');
  expect(APP.coreVersion).toBe(lock.version);
  expect(APP.coreCommit).toBe(lock.commit);
});

test('Core-versie is zichtbaar en synchronisatiestatus is niet afhankelijk van het legacy-wachtwoord',async({page})=>{
  await openApp(page);
  await page.evaluate(()=>{
    CryptoPortfolioLegacy.setRuntime({
      getInfo:()=>({coreVersion:'1.2.2',coreCommit:'14dc3ad12c56a448f7de47e2c4c39347475355f6'}),
      getSyncInfo:()=>({enabled:true,configured:true,lastSyncAt:null}),
    });
    CryptoPortfolioLegacy.activateCore(
      {txs:[],deleted:[],updated:0},
      {syncEnabled:true,github:{owner:'Gertjun',repo:'SyncData',token:'test-token',branch:'main'},app:{settings:{},prices:{}}}
    );
    settings.setSec='about';
    openSettings();
  });
  await expect(page.locator('#st_about')).toContainText('PWA-Core');
  await expect(page.locator('#st_about')).toContainText('1.2.2');
  await expect(page.locator('#st_about')).toContainText('14dc3ad');

  await page.evaluate(()=>{settings.setSec='sync';openSettings()});
  await expect(page.locator('#setNav')).toContainText('Nog niet gesynchroniseerd');
  await page.evaluate(()=>CryptoPortfolioLegacy.setSyncStatus('ok'));
  await expect(page.locator('#setNav')).toContainText('Gesynchroniseerd');
  await expect(page.locator('#setSync')).toContainText('Gesynchroniseerd');
  await page.evaluate(()=>CryptoPortfolioLegacy.setSyncError('GitHub-token ongeldig'));
  await expect(page.locator('#setNav')).toContainText('Synchronisatie mislukt');
  await expect(page.locator('#setSync')).toContainText('GitHub-token ongeldig');
});
