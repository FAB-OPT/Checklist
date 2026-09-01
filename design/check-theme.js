const puppeteer=require('C:/Users/kanka/node_modules/puppeteer-core'),fs=require('fs');
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',process.env.LOCALAPPDATA+'/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
(async()=>{
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:1280,height:1200});
  await pg.evaluateOnNewDocument(()=>{localStorage.setItem('fab_session',JSON.stringify(
    {code:'601183',name:'Kantapon',nick:'พี่กาย',role:'admin',crossBrand:true,loggedInAt:new Date().toISOString()}));});
  await pg.goto('http://localhost:8755/',{waitUntil:'domcontentloaded',timeout:30000});
  await new Promise(r=>setTimeout(r,4000));
  await pg.evaluate(()=>{
    const roster=_openBranches(); const out=[];
    roster.forEach(function(bch){ for(let d=1;d<=31;d++) ['open','close'].forEach(function(sh){
      const r=Math.random(); if(r>=0.78) return; const date='2026-08-'+String(d).padStart(2,'0');
      const items=[]; for(let i=0;i<48;i++){const q=Math.random();
        items.push({text:'ข้อ '+i,section:'หมวด '+(i%6+1),status:q<0.006?'fail':q<0.016?'na':'pass'});}
      out.push({branchCode:String(bch.code),branchName:bch.name,date:date,shift:sh,late:r>=0.66,items:items,
        startedAt:date+'T07:10:00',submittedAt:date+'T07:13:00'});});});
    allDailyChecklists=out; showDashboard(); renderSfChecklistTab();
  });
  await new Promise(r=>setTimeout(r,1200));
  const o=await pg.evaluate(()=>{
    /* ส้ม/แบรนด์ = hue 15-45 และอิ่มตัวพอควร */
    const isBrand=(c)=>{
      const m=String(c).match(/[\d.]+/g); if(!m||m.length<3) return false;
      let [r,g,bl]=m.slice(0,3).map(Number);
      if(m.length>=4 && Number(m[3])===0) return false;
      if(r<=1&&g<=1&&bl<=1){r*=255;g*=255;bl*=255;}
      const mx=Math.max(r,g,bl), mn=Math.min(r,g,bl);
      if(mx-mn < 28) return false;                 /* เทา ไม่นับ */
      if(!(r>g && g>bl)) return false;             /* ต้องเป็นโทนส้ม/เหลือง */
      const h=((g-bl)/(mx-mn))*60;
      return h>=8 && h<=48;
    };
    const seen={}, out=[];
    document.querySelectorAll('#app-screen *').forEach(el=>{
      if(!el.offsetParent && el.tagName!=='BODY') return;
      const s=getComputedStyle(el);
      ['backgroundColor','color','borderTopColor','borderLeftColor','outlineColor'].forEach(k=>{
        const v=s[k];
        if(!isBrand(v)) return;
        const key=el.className+'|'+k+'|'+v;
        if(seen[key]) return; seen[key]=1;
        out.push({ที่:(el.tagName.toLowerCase()+'.'+String(el.className||'').split(' ').filter(Boolean).slice(0,2).join('.')).slice(0,52),
          สมบัติ:k, สี:v, ข้อความ:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,28)});
      });
    });
    return out;
  });
  /* ที่อนุญาตให้เป็นสีแบรนด์ได้: ไทล์แบรนด์ กับจุดสีในปุ่มสลับแบรนด์ ที่เหลือคือสีสถานะ */
  const OK=/nav-brand-icon|hvp-dot/;
  const STATUS=/rgb\(200, 121, 20\)|rgb\(140, 86, 19\)|rgb\(251, 235, 212\)/;
  const bad=o.filter(x=>!OK.test(x.ที่)&&!STATUS.test(x.สี));
  console.log('จุดที่ยังเป็นสีแบรนด์แต่ไม่ควรเป็น: '+bad.length);
  bad.slice(0,20).forEach(x=>console.log('  '+x.ที่.padEnd(50)+x.สมบัติ.padEnd(18)+x.สี+'  '+x.ข้อความ));
  if(bad.length){ await b.close(); process.exit(1); }
  console.log('ผ่าน — เหลือสีแบรนด์เฉพาะไทล์กับจุดสลับแบรนด์');
  const _unused=(
  0);
  await b.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
