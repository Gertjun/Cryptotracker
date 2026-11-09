// Zijbalk op de laptop met gewone schuifbalken (zoals Chrome op Windows): niets verspringt tussen de schermen
import {test,expect} from '@playwright/test';
import {openApp,importCsv,isPhone} from './helpers.mjs';
test.use({launchOptions:{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),ignoreDefaultArgs:['--hide-scrollbars']}});

test('laptop: appnaam, inklapknop en versienummer staan op elk scherm op dezelfde plek, ook met een gewone schuifbalk (3.24.2)',async({page},testInfo)=>{
  test.skip(isPhone(testInfo),'alleen op de laptop');
  await page.setViewportSize({width:1440,height:600});   // laag venster: de zijbalk met munten moet schuiven
  await openApp(page);await importCsv(page);
  const pos=[];
  for(const h of ['','#transacties','#analyse','#instellingen','#coin/bitcoin']){
    await page.evaluate(h=>{location.hash=h},h);await page.waitForTimeout(300);
    pos.push(await page.evaluate(()=>['.side-tog','.app-ver','.brand-n'].map(s=>{const b=document.querySelector('#side '+s).getBoundingClientRect();return [Math.round(b.x),Math.round(b.y)]})));
  }
  for(const p of pos)expect(p).toEqual(pos[0]);
});
