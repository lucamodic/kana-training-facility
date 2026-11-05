const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
  const target=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!target.startsWith(root+path.sep)||name.split('/').some(part=>part.startsWith('.'))){res.writeHead(403).end();return;}
  fs.readFile(target,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});
}).listen(4173,'127.0.0.1',()=>{console.log('Local: http://127.0.0.1:4173');process.send?.('ready');});
