import { test, expect } from '@playwright/test';

test('adapter.flush geeft een eerdere opslagfout door en laat vervolgschrijfacties toe', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createLegacyStorageAdapter } = await import('/js/core/legacy-adapter.js');
    let failNextWrite = true;
    let flushCalls = 0;
    let stored = null;
    const fakeVault = {
      async setData(value) {
        if (failNextWrite) {
          failNextWrite = false;
          throw new Error('synthetic quota failure');
        }
        stored = structuredClone(value);
      },
      async setDeviceSettings() {},
      async flush() { flushCalls++; },
      getData() { return structuredClone(stored); },
    };
    const adapter = createLegacyStorageAdapter(fakeVault);
    const snapshot = { data: { v: 1, txs: [{ id: 'retry-ok' }], deleted: [] }, settings: {}, prices: {} };
    const saveError = await adapter.save(snapshot).then(() => '', error => error.message);
    const flushError = await adapter.flush().then(() => '', error => error.message);
    await adapter.save(snapshot);
    await adapter.flush();
    return { saveError, flushError, flushCalls, stored };
  });
  expect(result.saveError).toBe('synthetic quota failure');
  expect(result.flushError).toBe('synthetic quota failure');
  expect(result.flushCalls).toBe(1);
  expect(result.stored.txs).toEqual([{ id: 'retry-ok' }]);
});
