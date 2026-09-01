const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=require('path').join(__dirname,'..');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css',
  '.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
http.createServer((req,res)=>{
  let f=decodeURIComponent(req.url.split('?')[0]); if(f==='/')f='/index.html';
  const p=path.join(ROOT,f);
  fs.readFile(p,(e,d)=>{
    if(e){res.writeHead(404);res.end('no');return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});
    res.end(d);
  });
}).listen(8755,()=>console.log('เสิร์ฟ Checklist ที่ http://localhost:8755'));
