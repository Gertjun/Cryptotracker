// Rendementskalender (3.16.0): kiezen tussen dag, week, maand en jaar.
import {test,expect} from '@playwright/test';
import {openApp,importCsv} from './helpers.mjs';

test('rendementskalender per dag, week, maand en jaar',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  await page.evaluate(()=>{location.hash='#analyse/rendement'});
  const card=page.locator('.card',{has:page.getByRole('heading',{name:'Rendementskalender'})});
  await expect(card.locator('.cal-nav b')).toHaveText('oktober 2026');
  await expect(card.locator('.cal .h')).toHaveCount(7);
  await card.getByRole('button',{name:'Week',exact:true}).click();
  await expect(card.locator('.cal-nav b')).toHaveText('2026');
  await expect(card.locator('.cal .cd')).toHaveCount(53);
  await expect(card.locator('.cd.today .n')).toHaveText('wk 44');
  await expect(card).toContainText('Weken in de plus / min');
  await card.getByRole('button',{name:'Maand',exact:true}).click();
  await expect(card.locator('.cal .cd')).toHaveCount(12);
  await expect(card.locator('.cal-4')).toHaveCount(1);
  await card.getByRole('button',{name:'Jaar',exact:true}).click();
  await expect(card.locator('.cal-nav')).toHaveCount(0);
  await expect(card).toContainText('Totaal alle jaren');
  await card.getByRole('button',{name:'Dag',exact:true}).click();
  await expect(card.locator('.cal-nav b')).toHaveText('oktober 2026');
  expect(errors).toEqual([]);
});
