import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../../app.js',import.meta.url),'utf8');
const pairingUi=source.slice(source.indexOf('async function openPairOut(){'),source.indexOf('\nfunction openPairIn(){'));

test('pairing UI keeps the transfer code and PIN in separate hidden panels',()=>{
  expect(pairingUi).toContain('id="pair-code-panel"');
  expect(pairingUi).toContain('id="pair-pin-panel" hidden');
  expect(source).toContain("case 'pairpin':$('#pair-code-panel').hidden=true;$('#pair-pin-panel').hidden=false");
  expect(source).toContain("case 'paircode':$('#pair-pin-panel').hidden=true;$('#pair-code-panel').hidden=false");
  expect(pairingUi).toContain('Pincode tonen (koppelcode verbergen)');
});

test('pairing UI has separate copy actions for the transfer code and PIN',()=>{
  expect(pairingUi).toContain('data-act="paircopy"');
  expect(pairingUi).toContain('data-act="pairpincopy"');
  expect(pairingUi).toContain('Pincode kopiëren');
});
