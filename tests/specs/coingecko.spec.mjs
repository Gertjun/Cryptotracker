// Tempo van CoinGecko-verzoeken: 6 direct, daarna 15 per minuut (zonder eigen sleutel)
import {test,expect} from '@playwright/test';
import {openApp} from './helpers.mjs';
test.beforeEach(()=>test.skip(test.info().project.name!=='laptop','één keer is genoeg (laptop)'));

test('emmer: 6 verzoeken direct, daarna om de 4 seconden',async({page})=>{
  await openApp(page);
  const waits=await page.evaluate(()=>{globalThis.__cgFast=false;cgTok=6;cgTokAt=mono();return Array.from({length:8},()=>Math.round(cgTake()/100)*100)});
  expect(waits.slice(0,6)).toEqual([0,0,0,0,0,0]);
  expect(waits[6]).toBeGreaterThanOrEqual(3900);expect(waits[7]).toBeGreaterThanOrEqual(7900);
});
test('met Demo-sleutel: 10 direct, daarna om de 2 seconden',async({page})=>{
  await openApp(page);
  const waits=await page.evaluate(()=>{globalThis.__cgFast=false;data.cfg={...(data.cfg||{}),cgKey:'CG-test'};cgTok=10;cgTokAt=mono();return Array.from({length:11},()=>Math.round(cgTake()/100)*100)});
  expect(waits.slice(0,10).every(w=>w===0)).toBe(true);expect(waits[10]).toBeGreaterThanOrEqual(1900);
});
