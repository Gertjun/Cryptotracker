// Marktsentiment (3.22.0, wens W24): angst- en hebzuchtmeter van alternative.me op het Overzicht.
import {test,expect} from '@playwright/test';
import {openApp,importCsv} from './helpers.mjs';

test('marktsentiment staat op het Overzicht met gisteren en vorige week',async({page})=>{
  const errors=await openApp(page);await importCsv(page);
  const card=page.locator('#fngCard');
  await expect(card).toBeVisible();
  await expect(card.locator('.fng-v')).toHaveText('62');
  await expect(card).toContainText('Hebzucht');
  await expect(card.locator('.fng-hist')).toContainText('Gisteren');
  await expect(card.locator('.fng-hist')).toContainText('55 · Hebzucht');
  await expect(card.locator('.fng-hist')).toContainText('Vorige week');
  await expect(card.locator('.fng-hist')).toContainText('30 · Angst');
  await expect(card.getByRole('link',{name:'alternative.me'})).toHaveAttribute('rel',/noopener/);
  expect(errors).toEqual([]);
});

test('marktsentiment uitzetten in Instellingen haalt het blok weg en blijft bewaard',async({page})=>{
  await openApp(page);await importCsv(page);
  await expect(page.locator('#fngCard')).toBeVisible();
  await page.evaluate(()=>{location.hash='#instellingen'});
  const box=page.getByLabel('Marktsentiment tonen op het Overzicht');
  await expect(box).toBeChecked();
  await box.uncheck();
  await page.evaluate(()=>{location.hash=''});
  await expect(page.locator('#heroVal')).toBeVisible();
  await expect(page.locator('#fngCard')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#heroVal')).toBeVisible();
  await expect(page.locator('#fngCard')).toHaveCount(0);
});

test('lukt alternative.me niet, dan geen blok en geen fouten',async({page})=>{
  const errors=await openApp(page,{fngFail:true});await importCsv(page);
  await expect(page.locator('#heroVal')).toBeVisible();
  await expect(page.locator('#fngCard')).toHaveCount(0);
  expect(errors).toEqual([]);
});
