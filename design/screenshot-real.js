const puppeteer=require('C:/Users/kanka/node_modules/puppeteer-core'),fs=require('fs');
const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',process.env.LOCALAPPDATA+'/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
(async()=>{
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:1280,height:1200,deviceScaleFactor:2});
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,240)));
  await pg.evaluateOnNewDocument(()=>{
    localStorage.setItem('fab_session',JSON.stringify(
      {code:'601183',name:'Kantapon',nick:'พี่กาย',role:'admin',crossBrand:true,
       loggedInAt:new Date().toISOString()}));
  });
  await pg.goto('http://localhost:8755/',{waitUntil:'domcontentloaded',timeout:30000});
  await new Promise(r=>setTimeout(r,4000));

  const info=await pg.evaluate(()=>{
    /* สร้างข้อมูลจำลองให้ตรงกับทะเบียนสาขาจริงของแบรนด์ที่เปิดอยู่ */
    const roster=_openBranches();
    const y=2026,m=8, days=31;
    const out=[];
    roster.forEach(function(bch){
      for(let d=1;d<=days;d++){
        ['open','close'].forEach(function(sh){
          const r=Math.random();
          if(r>=0.78) return;
          const late=r>=0.66;
          const hh=sh==='open'?(late?11:6):(late?22:13);
          const mm=Math.floor(Math.random()*50)+5;
          const date=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
          const items=[];
          for(let i=0;i<48;i++){const q=Math.random();
            items.push({text:'ข้อ '+i,status:q<0.006?'fail':q<0.016?'na':'pass'});}
          out.push({id:bch.code+'-'+date+'-'+sh,branchCode:String(bch.code),branchName:bch.name,
            date:date,shift:sh,late:late,items:items,
            startedAt:date+'T'+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':00',
            submittedAt:date+'T'+String(hh).padStart(2,'0')+':'+String(mm+3).padStart(2,'0')+':00'});
        });
      }
    });
    allDailyChecklists=out;
    if (typeof showDashboard==='function') showDashboard();
    if (typeof renderSfChecklistTab==='function') renderSfChecklistTab();
    return {สาขาในทะเบียน:roster.length, ใบที่สร้าง:out.length};
  });
  await new Promise(r=>setTimeout(r,1500));
  console.log(JSON.stringify(info));
  const o=await pg.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const kA=q('#sf-cl-kpis .sfk');
    return {
      กล่องภาพรวม: !!kA,
      ฐาน: kA?q('.sfk-top b').textContent:'—',
      แถว: [...document.querySelectorAll('#sf-cl-kpis .sfk-r')].map(r=>r.querySelector('span').textContent+' '+r.querySelector('b').textContent+' '+r.querySelector('em').textContent),
      สามช่อง: [...document.querySelectorAll('#sf-cl-kpis .sfk-m')].map(m=>m.textContent),
      แถบเทียบ: !!q('#sf-cl-kpis .sfb'),
      ปฏิทิน: !!q('#sf-cl-month .dm-wrap'),
      ช่องปฏิทิน: document.querySelectorAll('#sf-cl-month .dm-cell:not(.is-empty)').length,
      สรุปปฏิทิน: q('#sf-cl-month .dm-sum')?q('#sf-cl-month .dm-sum').textContent:'—',
      ตัวอย่างช่อง: q('#sf-cl-month .dm-cell:not(.is-empty) .dm-h em')?[...document.querySelectorAll('#sf-cl-month .dm-cell:not(.is-empty)')][10].textContent.replace(/\s+/g,' '):'—'
    };
  });
  console.log(JSON.stringify(o,null,1));
  console.log('Error: '+(errs.length?errs.join('\n'):'ไม่มี'));
  const el=await pg.$('#sf-tab-checklist');
  if(el){const bx=await el.boundingBox();
    await pg.screenshot({path:__dirname+'/real-dash.png',clip:{x:bx.x,y:bx.y,width:bx.width,height:Math.min(1700,bx.height)}});
    console.log('ภาพ: design/real-dash.png');}
  await b.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1);});
