import {test,expect} from '@playwright/test';

test('PWA-Core laat een vaste-ID-record herleven na een aantoonbaar nieuwere wijziging',async({page})=>{
  await page.goto('/index.html');
  const result=await page.evaluate(async()=>{
    const {applyDeletionLedger}=await import('/js/core/deletions.js');
    const data={
      txs:[{id:'fixed-day',updatedAt:101,value:42}],
      __pwaSync:{version:1,devices:{},deletions:{'txs:fixed-day':100}},
    };
    const reconciled=applyDeletionLedger(data);
    return {
      records:reconciled.txs,
      tombstone:reconciled.__pwaSync.deletions['txs:fixed-day']??null,
    };
  });
  expect(result.records).toEqual([{id:'fixed-day',updatedAt:101,value:42}]);
  expect(result.tombstone).toBeNull();
});

test('PWA-Core houdt gelijke, oudere en ontbrekende timestamps fail-closed',async({page})=>{
  await page.goto('/index.html');
  const results=await page.evaluate(async()=>{
    const {applyDeletionLedger}=await import('/js/core/deletions.js');
    return [100,99,undefined].map(updatedAt=>{
      const record={id:'fixed-day',value:42};
      if(updatedAt!==undefined)record.updatedAt=updatedAt;
      const data={
        txs:[record],
        __pwaSync:{version:1,devices:{},deletions:{'txs:fixed-day':100}},
      };
      const reconciled=applyDeletionLedger(data);
      return {
        count:reconciled.txs.length,
        tombstone:reconciled.__pwaSync.deletions['txs:fixed-day'],
      };
    });
  });
  expect(results).toEqual([
    {count:0,tombstone:100},
    {count:0,tombstone:100},
    {count:0,tombstone:100},
  ]);
});
