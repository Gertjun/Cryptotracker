// Passkey hergebruiken na opnieuw installeren: de passkey staat nog in het wachtwoordbeheer,
// maar de app is alles kwijt (localStorage leeg). Nagebootst met een virtuele passkey van Chromium (met PRF).
import {test,expect} from '@playwright/test';
import {openApp} from './helpers.mjs';

async function authenticator(page){
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{protocol:'ctap2',transport:'internal',hasResidentKey:true,hasUserVerification:true,isUserVerified:true,hasPrf:true,automaticPresenceSimulation:true}});
}
async function lockOn(page){
  await page.evaluate(()=>{location.hash='#instellingen'});
  await page.evaluate(()=>showSetSec?.('sec'));
  await page.locator('[data-act=lockon]').first().evaluate(b=>b.click());
  await page.fill('#p_1','een lange zin als wachtwoord');
  await page.fill('#p_2','een lange zin als wachtwoord');
  await page.locator('[data-act=lockon2]').click();
  await expect(page.locator('[data-act=usepk]').first()).toBeVisible();
}

test('bestaande passkey opnieuw gebruiken na opnieuw installeren',async({page})=>{
  const errors=await openApp(page);
  await authenticator(page);
  // eerste installatie: vergrendeling aan en een nieuwe passkey maken
  await lockOn(page);
  await page.locator('#sheet [data-act=addpk]').click();
  await expect(page.locator('.pk-row')).toHaveCount(1);
  // "opnieuw installeren": alles in de app weg, de passkey blijft
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await lockOn(page);
  await page.locator('#sheet [data-act=usepk]').click();
  await expect(page.locator('.pk-row')).toHaveCount(1);
  // nog een keer dezelfde passkey: netjes geweigerd
  await page.locator('#view [data-act=usepk]').evaluate(b=>b.click());
  await expect(page.locator('.pk-row')).toHaveCount(1);
  // vergrendelen en ontgrendelen met de hergebruikte passkey
  await page.evaluate(()=>lockNow());
  await page.locator('[data-act=unlockpk]').click();
  await expect(page.locator('.lock')).toHaveCount(0);
  expect(errors).toEqual([]);
});
