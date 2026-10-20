// Local inspection server for the source snapshots. Not a product runtime change.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.'),port=Number(process.argv[3]||4173);
if(!fs.statSync(root).isDirectory())throw new Error('Expected a source directory');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.woff2':'font/woff2','.webm':'video/webm','.mp4':'video/mp4'};
http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1'),relative=decodeURIComponent(u.pathname),file=path.resolve(root,'.'+relative+(relative.endsWith('/')?'index.html':''));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  const stat=fs.statSync(file);if(!stat.isFile()){res.writeHead(404);return res.end('Not a file');}
  res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
 }catch(e){res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Source snapshot: '+root+'\nOpen http://127.0.0.1:'+port+'/index.html\nCtrl+C stops this server.'));
