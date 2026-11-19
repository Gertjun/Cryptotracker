import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {openApp} from './helpers.mjs';

test('CSV-export neutraliseert spreadsheet-formules in tekstvelden',async({page})=>{
  await openApp(page);
  await page.evaluate(()=>{
    data.txs=[
      {id:'formula-1',type:'deposit',amount:100,fee:0,date:'2026-11-19T08:00:00',acct:'@SUM(1,1)',note:'=HYPERLINK("https://example.com","click")',mod:1},
      {id:'formula-2',type:'withdraw',amount:20,fee:0,date:'2026-11-19T08:01:00',acct:'-cmd|/C calc',to:'+SUM(1,1)',note:'veilig',mod:2},
    ];
    location.hash='#transacties';render();
  });
  await expect(page.locator('#txOut')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-act=csvall]').click();
  const download=await downloadPromise;
  const csv=await readFile(await download.path(),'utf8');
  expect(csv).toContain("'@SUM(1,1)");
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("'-cmd|/C calc");
  expect(csv).toContain("'+SUM(1,1)");
  expect(csv).not.toContain('=HYPERLINK');
});
