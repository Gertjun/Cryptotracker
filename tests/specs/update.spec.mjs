// Updates: de service worker moet na een nieuwe versie direct de nieuwe app.js geven,
// ook als de server (zoals GitHub Pages) de browser 10 minuten laat bewaren
import {test,expect} from '@playwright/test';
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const sw=fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../sw.js'),'utf8');
test.beforeEach(()=>test.skip(test.info().project.name!=='laptop','één keer is genoeg (laptop)'));

test('nieuwe versie komt direct binnen',async({browser})=>{
  let ver='A';
  const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0],h={'cache-control':'max-age=600'};
    if(u==='/sw.js'){r.writeHead(200,{...h,'content-type':'text/javascript'});return r.end(sw.replace(/crypto-portfolio-[v0-9.]+/,'cp-'+ver))}
    if(u==='/'||u==='/index.html'){r.writeHead(200,{...h,'content-type':'text/html'});return r.end('<!doctype html><script src="app.js"></script>')}
    if(u==='/app.js'){r.writeHead(200,{...h,'content-type':'text/javascript'});return r.end(`window.V='${ver}'`)}
    r.writeHead(200,h);r.end('x')}).listen(0);
  await new Promise(r=>srv.on('listening',r));const B='http://localhost:'+srv.address().port+'/';
  const p=await (await browser.newContext()).newPage();
  await p.goto(B);await p.evaluate(()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}));
  await p.waitForFunction(()=>navigator.serviceWorker.controller||new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(true))));
  await p.reload();expect(await p.evaluate(()=>window.V)).toBe('A');
  ver='B';   // "nieuwe versie op GitHub gezet"
  await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});await p.waitForTimeout(1500);
  await p.reload();expect(await p.evaluate(()=>window.V)).toBe('B');
  srv.close();
});
