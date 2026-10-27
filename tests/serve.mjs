// Mini-webserver voor de tests: serveert de app vanaf één origin, net als GitHub Pages.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.md':'text/markdown','.webmanifest':'application/manifest+json'};
const port=+process.env.PORT||4173;
http.createServer((q,res)=>{let f=decodeURIComponent(new URL(q.url,'http://x').pathname);if(f.endsWith('/'))f+='index.html';
  const fp=path.join(root,f);if(!fp.startsWith(root)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);return res.end()}
  res.writeHead(200,{'content-type':types[path.extname(fp)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(fp).pipe(res)})
  .listen(port,()=>console.log('app op http://localhost:'+port));
