const puppeteer=require('C:/Users/kanka/node_modules/puppeteer-core'),fs=require('fs');
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',process.env.LOCALAPPDATA+'/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
(async()=>{
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:1500,height:1200,deviceScaleFactor:2});
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,180)));
  const url=require('url').pathToFileURL(__dirname+'/ck-all.html').href;
  await pg.goto(url,{waitUntil:'networkidle2',timeout:60000});
  await new Promise(r=>setTimeout(r,3200));
  await pg.evaluate(()=>{[...document.querySelectorAll('body>div')].forEach(d=>{
     if(getComputedStyle(d).position==='fixed') d.style.visibility='hidden';});});
  const man=[];
  for(const k of ['santafe','yamachan','jaedaeng']){
    await pg.evaluate(x=>{document.querySelector('.pk[data-k="'+x+'"]').click();},k);
    await new Promise(r=>setTimeout(r,700));
    const ids=await pg.evaluate(()=>{const d=[...document.querySelectorAll('[data-brand]')].find(x=>!x.hidden);
      return {d:[...d.querySelectorAll('[data-desk]')].map(e=>e.dataset.desk),
              m:[...d.querySelectorAll('[data-mob]')].map(e=>e.dataset.mob)};});
    for(const id of ids.d){
      const el=await pg.$('[data-desk="'+id+'"]'); const bx=await el.boundingBox();
      await pg.screenshot({path:__dirname+'/s-'+id+'.png',clip:{x:bx.x,y:bx.y,width:bx.width,height:bx.height}});
      man.push(['d',id,Math.round(bx.height)]);
    }
    for(const id of ids.m){
      const el=await pg.$('[data-mob="'+id+'"]');
      const ph=await pg.evaluateHandle(e=>e.closest('.phone'),el);
      const bx=await ph.boundingBox();
      await pg.screenshot({path:__dirname+'/s-'+id+'.png',clip:{x:bx.x,y:bx.y,width:bx.width,height:bx.height}});
      man.push(['m',id,Math.round(bx.height)]);
    }
    console.log(k+' ✓');
  }
  fs.writeFileSync(__dirname+'/manifest.json',JSON.stringify(man));
  console.log('รวม '+man.length+' ภาพ  Error: '+(errs.length?errs.join('|'):'ไม่มี'));
  await b.close();
})().catch(e=>console.error('ERR',e.message));
