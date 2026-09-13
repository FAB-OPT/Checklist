/* ดึงเฉพาะตัวที่แก้ออกมารันใน Node — ไม่ต้องพึ่ง DOM
   เอาข้อความจริงจาก index.html ไม่ใช่ก๊อปมาวาง จะได้เทสต์ของจริง */
const fs=require('fs');
const src=fs.readFileSync('C:/Users/kanka/Desktop/Work/AI/Checklist/index.html','utf8');
function grab(sig, open, close){
  const i=src.indexOf(sig);
  if(i<0) throw new Error('ไม่เจอ '+sig);
  let j=src.indexOf(open,i), d=0, k=j;
  for(;;){ const c=src[k]; if(c===open)d++; else if(c===close){d--; if(!d)break;} k++; }
  return src.slice(i,k+1);
}
const parts=[
  grab('const CK_BRANDS = {','{','}')+';',
  grab('const CK_PHOTO_RULES = {','{','}')+';',
  grab('function ckPhotoRule(','{','}'),
  grab('function ckPhotoExempt(','{','}'),
  grab('function ckPickFresh(','{','}'),
  grab('function ckHasLate(','{','}'),
  grab('function ckCutoffText(','{','}'),
  grab('const YAMACHAN_OPEN = [','[',']')+';',
  grab('const YAMACHAN_CLOSE = [','[',']')+';',
  grab('const DAILY_OPEN = [','[',']')+';',
  grab('const DAILY_CLOSE = [','[',']')+';',
  grab('const JAEDAENG_CHECKLIST = [','[',']')+';',
];
let currentBrand='santafe';
const box={};
const run=new Function('currentBrandRef', parts.join('\n')+`
  return {CK_BRANDS,CK_PHOTO_RULES,ckPhotoRule,ckPhotoExempt,ckPickFresh,ckHasLate,ckCutoffText,
          YAMACHAN_OPEN,YAMACHAN_CLOSE,DAILY_OPEN,DAILY_CLOSE,JAEDAENG_CHECKLIST};`
  .replace(/currentBrand/g,'currentBrandRef.v'));
const ref={v:'santafe'};
const A=run(ref);

let fail=0;
const eq=(name,got,want)=>{const ok=JSON.stringify(got)===JSON.stringify(want);
  if(!ok)fail++;
  console.log((ok?'  ok  ':'  ผิด ')+name.padEnd(46)+'= '+JSON.stringify(got)+(ok?'':'  (ควรได้ '+JSON.stringify(want)+')'));};

console.log('■ เวลาตัดต่อแบรนด์');
eq('ckHasLate santafe', A.ckHasLate('santafe'), true);
eq('ckHasLate yamachan', A.ckHasLate('yamachan'), false);
eq('ckHasLate jaedaeng', A.ckHasLate('jaedaeng'), false);
eq('ckCutoffText santafe', A.ckCutoffText('santafe'), 'รอบเปิดหลัง 11:30 น. รอบปิดหลัง 22:00 น.');
eq('ckCutoffText yamachan', A.ckCutoffText('yamachan'), '');

console.log('\n■ จำนวนที่สุ่มต่อหมวด');
eq('pick santafe', A.ckPhotoRule('santafe').pick, 1);
eq('pick yamachan', A.ckPhotoRule('yamachan').pick, 4);
eq('pick jaedaeng', A.ckPhotoRule('jaedaeng').pick, 1);

console.log('\n■ ข้อที่ยกเว้น (ยึดข้อความ)');
eq('ชิม/yamachan', A.ckPhotoExempt('สุ่มชิมวัตถุดิบ — ชนิดที่ 3','yamachan'), true);
eq('ชิม+เว้นวรรคหน้า/yamachan', A.ckPhotoExempt('  สุ่มชิมวัตถุดิบ — ชนิดที่ 1','yamachan'), true);
eq('ไฟดาวน์ไลน์/yamachan', A.ckPhotoExempt('ไฟดาวน์ไลน์ติดทุกดวง','yamachan'), false);
eq('ชิม/santafe', A.ckPhotoExempt('สุ่มชิมวัตถุดิบ — ชนิดที่ 3','santafe'), false);
eq('ชิม/jaedaeng', A.ckPhotoExempt('สุ่มชิมวัตถุดิบ — ชนิดที่ 3','jaedaeng'), false);

/* จำลองการสุ่มด้วยตรรกะชุดเดียวกับในแอป */
const txtOf=r=>(r&&typeof r==='object')?r.text:r;
function simulate(tpl,brand,rounds){
  const pick=A.ckPhotoRule(brand).pick;
  const flat=[]; tpl.forEach(s=>s.items.forEach(r=>flat.push(txtOf(r))));
  const counts=new Set(); let leak=0; const seen=new Set();
  for(let t=0;t<rounds;t++){
    const req=[]; let gi=0;
    tpl.forEach(sec=>{
      const pool=[];
      sec.items.forEach((raw,i)=>{ if(!A.ckPhotoExempt(txtOf(raw),brand)) pool.push(gi+i); });
      for(let k=pool.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));const x=pool[k];pool[k]=pool[j];pool[j]=x;}
      pool.slice(0,pick).forEach(g=>req.push(g));
      gi+=sec.items.length;
    });
    counts.add(req.length);
    req.forEach(i=>{ seen.add(i); if(A.ckPhotoExempt(flat[i],brand)) leak++; });
    if(new Set(req).size!==req.length) leak+=1000;   /* สุ่มซ้ำข้อเดิมในรอบเดียว */
  }
  return {รูปต่อรอบ:[...counts].sort((a,b)=>a-b).join('/'), หลุดข้อยกเว้น:leak, ข้อที่เคยถูกสุ่ม:seen.size, ข้อทั้งหมด:flat.length};
}
console.log('\n■ จำลองสุ่ม 2,000 รอบต่อชุด');
/* ตัวเลขที่คาดหวัง = จำนวนที่สุ่มต่อหมวด × จำนวนหมวดของชุดนั้น
   ยามะจัง 4 × 2 หมวด = 8 · ซานตาเฟ่ 1 × 6 = 6 · เจ๊แดง 1 × 7 = 7 */
const cases=[['YAMACHAN_OPEN','yamachan',8],['YAMACHAN_CLOSE','yamachan',8],
             ['DAILY_OPEN','santafe',6],['DAILY_CLOSE','santafe',6],['JAEDAENG_CHECKLIST','jaedaeng',7]];
cases.forEach(([k,brand,want])=>{
  const r=simulate(A[k],brand,2000);
  const ok=(r.รูปต่อรอบ===String(want))&&r.หลุดข้อยกเว้น===0;
  if(!ok)fail++;
  console.log((ok?'  ok  ':'  ผิด ')+k.padEnd(20)+' รูป/รอบ '+r.รูปต่อรอบ.padStart(2)+
    ' (ควรได้ '+want+') · หลุดข้อยกเว้น '+r.หลุดข้อยกเว้น+
    ' · เคยถูกสุ่ม '+r.ข้อที่เคยถูกสุ่ม+'/'+r.ข้อทั้งหมด+' ข้อ');
});
/* ── ไม่ซ้ำกับรอบก่อน ๆ ──
   จำลองสาขาเดียวตรวจต่อกัน 60 รอบ ส่งประวัติรอบก่อน ๆ เข้าไปแบบที่แอปทำ
   เทียบกับการสุ่มแบบเดิม (ไม่ดูประวัติ) · วัดสองอย่าง:
   - ข้อที่ถูกขอรูปซ้ำกับรอบที่แล้วกี่ข้อ (แบบใหม่ต้องเป็น 0 ถ้าหมวดมีข้อพอ)
   - แต่ละหมวด ข้อไหนถูกขอซ้ำก่อนจะวนครบทุกข้อไหม (แบบใหม่ต้องไม่มี) */
function sequence(tpl,brand,rounds,fresh){
  const pick=A.ckPhotoRule(brand).pick;
  /* ตัวระบุ = หมวด|ข้อความ แบบเดียวกับ ckPhotoKey ในแอป (ข้อความเดียวกันต่างหมวดคือคนละข้อ)
     ข้อยกเว้นยังเช็คจากข้อความล้วน (textOnly) */
  const flat=[], textOnly=[]; tpl.forEach(s=>s.items.forEach(r=>{ flat.push(s.name+'|'+txtOf(r)); textOnly.push(txtOf(r)); }));
  const history=[];   // เรียงรอบล่าสุดก่อน
  let repeatPrev=0, earlyRepeat=0, leak=0, total=0;
  for(let t=0;t<rounds;t++){
    const req=[]; let gi=0;
    /* อายุของแต่ละข้อ = ถูกขอครั้งล่าสุดเมื่อกี่รอบก่อน (ไม่เคย = Infinity) */
    const age={}; history.forEach((set,r)=>set.forEach(k=>{ if(!(k in age)) age[k]=r+1; }));
    const ageOf=g=>(flat[g] in age)?age[flat[g]]:Infinity;
    tpl.forEach((sec,si)=>{
      const pool=[];
      sec.items.forEach((raw,i)=>{ if(!A.ckPhotoExempt(txtOf(raw),brand)) pool.push(gi+i); });
      let got;
      if(fresh) got=A.ckPickFresh(pool,pick,g=>flat[g],history.slice(0,30));
      else { const p=pool.slice(); for(let k=p.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));const x=p[k];p[k]=p[j];p[j]=x;} got=p.slice(0,pick); }
      /* ซ้ำก่อนเวลา = เลือกข้อที่เพิ่งถูกขอ ทั้งที่ยังมีข้อในหมวดเดียวกันที่ถูกขอนานกว่า (หรือไม่เคยถูกขอ) เหลืออยู่
         ยามะจังขอหมวดละ 4 แต่หมวดครัวมีข้อให้เลือก 18 — ท้ายวงเหลือข้อใหม่ 2 ข้อ อีก 2 ข้อต้องซ้ำ
         แบบนั้นไม่นับ เพราะหลีกเลี่ยงไม่ได้ · นับเฉพาะที่เลี่ยงได้แต่ไม่เลี่ยง */
      const chosen=new Set(got);
      const leftBest=Math.max(-1,...pool.filter(g=>!chosen.has(g)).map(ageOf));
      got.forEach(g=>{ if(ageOf(g)<leftBest) earlyRepeat++; });
      got.forEach(g=>req.push(g));
      gi+=sec.items.length;
    });
    const texts=new Set(req.map(g=>flat[g]));
    if(history[0]) texts.forEach(x=>{ if(history[0].has(x)) repeatPrev++; });
    req.forEach(g=>{ if(A.ckPhotoExempt(textOnly[g],brand)) leak++; });
    total+=req.length;
    history.unshift(texts);
  }
  return {repeatPrev,earlyRepeat,leak,total};
}
console.log('\n■ ไม่ซ้ำกับรอบก่อน ๆ (สาขาเดียว ตรวจต่อกัน 60 รอบ · เฉลี่ย 50 ครั้ง)');
cases.forEach(([k,brand,want])=>{
  let o={repeatPrev:0,earlyRepeat:0,total:0}, n={repeatPrev:0,earlyRepeat:0,leak:0,total:0};
  for(let r=0;r<50;r++){
    const a=sequence(A[k],brand,60,false), b=sequence(A[k],brand,60,true);
    o.repeatPrev+=a.repeatPrev; o.earlyRepeat+=a.earlyRepeat; o.total+=a.total;
    n.repeatPrev+=b.repeatPrev; n.earlyRepeat+=b.earlyRepeat; n.leak+=b.leak; n.total+=b.total;
  }
  const pct=(x,t)=>(x/t*100).toFixed(1)+'%';
  const ok=n.repeatPrev===0&&n.earlyRepeat===0&&n.leak===0&&(n.total/50/60)===want;
  if(!ok)fail++;
  console.log((ok?'  ok  ':'  ผิด ')+k.padEnd(20)+
    ' ซ้ำรอบที่แล้ว: เดิม '+pct(o.repeatPrev,o.total).padStart(6)+' → ใหม่ '+pct(n.repeatPrev,n.total).padStart(5)+
    ' · ซ้ำก่อนวนครบหมวด: เดิม '+pct(o.earlyRepeat,o.total).padStart(6)+' → ใหม่ '+pct(n.earlyRepeat,n.total).padStart(5)+
    ' · รูป/รอบ '+(n.total/50/60)+' · หลุดข้อยกเว้น '+n.leak);
});

console.log('\n'+(fail?('ไม่ผ่าน '+fail+' ข้อ'):'ผ่านทั้งหมด'));
process.exit(fail?1:0);
