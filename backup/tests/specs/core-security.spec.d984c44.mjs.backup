import {test,expect} from '@playwright/test';

const CURRENT_PASSWORD='current core password 123';
const NEW_PASSWORD='new core password 456';

test('Core-wachtwoord wijzigen, passkey aanmaken en bestaande passkey opnieuw koppelen',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator',{options:{
    protocol:'ctap2',transport:'internal',hasResidentKey:true,
    hasUserVerification:true,isUserVerified:true,hasPrf:true,
    automaticPresenceSimulation:true,
  }});

  let remoteText=null;
  let remoteSha=null;
  let writes=0;
  const paths=[];
  await page.addInitScript(()=>{
    localStorage.setItem('cpt.data',JSON.stringify({
      v:1,updated:1700000000000,deleted:[],
      txs:[{id:'security-test-tx',type:'buy',coinId:'bitcoin',qty:1,price:25000,fee:0,date:'2025-01-01',mod:1700000000000}],
    }));
    localStorage.setItem('cpt.settings',JSON.stringify({
      gh:{token:'test-token',repo:'Gertjun/SyncData',path:'crypto-portfolio.enc.json',branch:'main',pass:'legacy-password'},
    }));
  });
  await page.route('https://api.coingecko.com/**',route=>route.fulfill({json:{}}));
  await page.route('https://api.alternative.me/**',route=>route.fulfill({json:{data:[]}}));
  await page.route('https://api.github.com/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    paths.push(url.pathname);
    if(request.method()==='GET'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      if(!remoteText)return route.fulfill({status:404,json:{message:'Not Found'}});
      return route.fulfill({json:{sha:remoteSha,encoding:'base64',content:Buffer.from(remoteText).toString('base64')}});
    }
    if(request.method()==='PUT'&&url.pathname.endsWith('/contents/crypto-portfolio.pwa-core-v1.json')){
      const body=JSON.parse(request.postData());
      if(body.sha&&body.sha!==remoteSha)return route.fulfill({status:409,json:{message:'Conflict'}});
      remoteText=Buffer.from(body.content,'base64').toString();
      remoteSha='security-core-sha-'+(++writes);
      return route.fulfill({status:201,json:{content:{sha:remoteSha}}});
    }
    return route.fulfill({status:200,json:{private:true,default_branch:'main'}});
  });

  await page.goto('/index.html');
  await page.locator('#core-password').fill(CURRENT_PASSWORD);
  await page.locator('#core-password-confirm').fill(CURRENT_PASSWORD);
  await page.locator('[data-core-action=migrate]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);
  await page.waitForFunction(()=>window.PWACoreV1?.vault?.getSyncMeta?.().sha==='security-core-sha-1');

  await page.evaluate(()=>{location.hash='#instellingen'});
  await expect(page.locator('#setView')).toBeVisible();
  await page.evaluate(()=>showSetSec('sec'));
  await page.locator('[data-act=corepasskeynew]').click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('cpt:biometric'))).not.toBeNull();

  // Simuleer herinstallatie: credential blijft in de virtuele authenticator,
  // alleen de lokale koppeling met de datasleutel wordt gewist.
  await page.evaluate(()=>localStorage.removeItem('cpt:biometric'));
  await page.locator('[data-act=corepasskey]').click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('cpt:biometric'))).not.toBeNull();

  await page.locator('[data-act=corelock]').click();
  await expect(page.locator('#core-gate')).toBeVisible();
  await page.locator('[data-core-action=passkey]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);

  // Wachtwoord wijzigen via de echte instellingen-UI.
  await page.evaluate(()=>{location.hash='#instellingen'});
  await expect(page.locator('#setView')).toBeVisible();
  await page.evaluate(()=>showSetSec('sec'));
  await page.locator('[data-act=corechpw]').click();
  await page.locator('#core-current-password').fill(CURRENT_PASSWORD);
  await page.locator('#core-new-password').fill(NEW_PASSWORD);
  await page.locator('#core-confirm-password').fill(NEW_PASSWORD);
  await page.locator('[data-act=corechpw-save]').click();
  await expect.poll(()=>remoteSha).toBe('security-core-sha-2');
  await expect(page.locator('#sheet')).toBeHidden();
  const updatedKdf=await page.evaluate(async()=>{
    const vault=await import('/js/core/vault.js');
    return vault.getEnvelope().kdf.salt;
  });
  expect(updatedKdf).toBeTruthy();

  // De passkey gebruikt dezelfde datasleutel en blijft dus geldig na de
  // wijziging van de wachtwoord-wrapper.
  await page.locator('[data-act=corelock]').click();
  await page.locator('[data-core-action=passkey]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);

  // Het oude wachtwoord wordt geweigerd; het nieuwe wachtwoord opent dezelfde kluis.
  await page.evaluate(()=>window.PWACoreV1.runtime.lock());
  await page.locator('#core-unlock-password').fill(CURRENT_PASSWORD);
  await page.locator('#core-unlock-form button[type=submit]').click();
  await expect(page.locator('#core-gate-error')).toContainText('Onjuist wachtwoord');
  await page.locator('#core-unlock-password').fill(NEW_PASSWORD);
  await page.locator('#core-unlock-form button[type=submit]').click();
  await page.waitForFunction(()=>window.PWACoreV1?.runtime?.isActive()===true);

  expect(paths.some(path=>path.endsWith('/contents/crypto-portfolio.enc.json'))).toBe(false);
  expect(errors).toEqual([]);
  await cdp.detach();
});
