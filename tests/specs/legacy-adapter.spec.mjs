import {test,expect} from '@playwright/test';

test('legacy-adapter behoudt onbekende data en zet verwijderingen om',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {convertLegacyDeletions,splitLegacySnapshot}=await import('/js/core/legacy-adapter.js');
    const {applyDeletionLedger}=await import('/js/core/deletions.js');
    const source={
      v:1,updated:1700000000000,deleted:['tx-old'],
      txs:[{id:'tx-live',type:'buy',qty:1},{id:'tx-del',del:true,mod:1700000000123}],
      watch:[{id:'watch-del',del:true,updated:1700000000456}],
      futureField:{keep:['a',1]},
    };
    const converted=convertLegacyDeletions(source);
    const split=splitLegacySnapshot({
      data:source,
      settings:{theme:'dark',gh:{token:'secret-token',repo:'Gertjun/SyncData',path:'old.enc.json',branch:'main',pass:'legacy-secret'}},
      prices:{bitcoin:{price:123}},
      visit:{last:'overview'},
    });
    return {
      sourceUnchanged:!source.__pwaSync && source.deleted[0]==='tx-old',
      unknownPreserved:converted.futureField.keep.join(',')==='a,1',
      txDeletion:converted.__pwaSync.deletions['data/txs:tx-old'],
      legacyDel:converted.__pwaSync.deletions['data/txs:tx-del'],
      watchDel:converted.__pwaSync.deletions['data/watch:watch-del'],
      rootLedger:Object.hasOwn(split.payload,'__pwaSync'),
      nestedLedger:Object.hasOwn(split.payload.data,'__pwaSync'),
      applied:applyDeletionLedger(structuredClone(split.payload)),
      retained:applyDeletionLedger({
        ...structuredClone(split.payload),
        __pwaSync:{
          ...structuredClone(split.payload.__pwaSync),
          devices:{deviceA:{createdAt:1,lastSeenAt:1,acknowledged:{}}},
        },
      }),
      convertedDeletedFlag:converted.txs.find(x=>x.id==='tx-del').deleted===true,
      settings:split.payload.settings,
      deviceSettings:split.deviceSettings,
      payload:split.payload,
    };
  });
  expect(result.sourceUnchanged).toBe(true);
  expect(result.unknownPreserved).toBe(true);
  expect(result.txDeletion).toBe(1700000000000);
  expect(result.legacyDel).toBe(1700000000123);
  expect(result.watchDel).toBe(1700000000456);
  expect(result.rootLedger).toBe(true);
  expect(result.nestedLedger).toBe(false);
  expect(result.applied.data.txs).toEqual([{id:'tx-live',type:'buy',qty:1}]);
  expect(result.applied.data.watch).toEqual([]);
  expect(result.convertedDeletedFlag).toBe(true);
  expect(result.retained.data.txs.find(x=>x.id==='tx-del').deleted).toBe(true);
  expect(result.retained.data.watch.find(x=>x.id==='watch-del').deleted).toBe(true);
  expect(result.settings).toEqual({theme:'dark'});
  expect(result.deviceSettings.github.token).toBe('secret-token');
  expect(result.deviceSettings.github.path).toBe('crypto-portfolio.pwa-core-v1.json');
  expect(result.deviceSettings.github).not.toHaveProperty('pass');
  expect(JSON.stringify(result.payload)).not.toContain('secret-token');
  expect(JSON.stringify(result.payload)).not.toContain('legacy-secret');
});

test('legacy-adapter schrijft serieel, flushes en laat opslagfouten door',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {createLegacyStorageAdapter}=await import('/js/core/legacy-adapter.js');
    const calls=[];
    let current=null;
    const fake={
      async create(password,payload){calls.push('create');current=payload},
      async setData(payload){calls.push('setData');current=payload},
      async setDeviceSettings(){calls.push('deviceSettings')},
      async flush(){calls.push('flush')},
      getData(){return structuredClone(current)},
      lock(){calls.push('lock')},
    };
    const adapter=createLegacyStorageAdapter(fake);
    const snapshot={data:{v:1,txs:[],deleted:[]},settings:{gh:{token:'t'}},prices:{},visit:null};
    await Promise.all([adapter.create('password',snapshot),adapter.save({...snapshot,data:{v:1,txs:[{id:'a'}],deleted:[]}})]);
    await adapter.flush();
    const loaded=adapter.load();
    await adapter.lock();
    const failed=createLegacyStorageAdapter({...fake,async setData(){throw new Error('quota')}});
    let error='';
    try{await failed.save(snapshot)}catch(e){error=e.message}
    return {calls,loaded,error};
  });
  expect(result.calls).toEqual(['create','deviceSettings','flush','setData','deviceSettings','flush','flush','flush','lock']);
  expect(result.loaded.data.txs).toEqual([{id:'a'}]);
  expect(result.error).toBe('quota');
});

test('sessielock weigert ontbrekende Web Locks en bezette sessie',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {withExclusiveSessionLock}=await import('/js/core/legacy-adapter.js');
    let missing='',busy='';
    try{await withExclusiveSessionLock(()=>{},null)}catch(e){missing=e.message}
    try{await withExclusiveSessionLock(()=>{},{
      request:async(name,options,callback)=>callback(null),
    })}catch(e){busy=e.message}
    const ok=await withExclusiveSessionLock(()=>42,{
      request:async(name,options,callback)=>callback({name}),
    });
    return {missing,busy,ok};
  });
  expect(result.missing).toContain('blijft gesloten');
  expect(result.busy).toContain('al actief');
  expect(result.ok).toBe(42);
});


test('legacy-adapter koppelt bestaande passkey aan de Core-datasleutel via de Core-API',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {createLegacyStorageAdapter}=await import('/js/core/legacy-adapter.js');
    const coreDataKey={marker:'core-data-key'};
    const fakeVault={
      async setData(){}, async flush(){}, getData(){return{}},
      getDataKey(){return coreDataKey},
    };
    const adapter=createLegacyStorageAdapter(fakeVault);
    let received=null;
    const biometric={async enrollExisting(key){received=key;return 'enrolled'}};
    const outcome=await adapter.enrollExistingPasskey(biometric);
    return {sameKey:received===coreDataKey,outcome};
  });
  expect(result).toEqual({sameKey:true,outcome:'enrolled'});
});
