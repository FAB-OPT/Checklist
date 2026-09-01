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
  return {CK_BRANDS,CK_PHOTO_RULES,ckPhotoRule,ckPhotoExempt,ckHasLate,ckCutoffText,
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
eq('pick yamachan', A.ckPhotoRule('yamachan').pick, 5);
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
const cases=[['YAMACHAN_OPEN','yamachan',10],['YAMACHAN_CLOSE','yamachan',10],
             ['DAILY_OPEN','santafe',6],['DAILY_CLOSE','santafe',6],['JAEDAENG_CHECKLIST','jaedaeng',7]];
cases.forEach(([k,brand,want])=>{
  const r=simulate(A[k],brand,2000);
  const ok=(r.รูปต่อรอบ===String(want))&&r.หลุดข้อยกเว้น===0;
  if(!ok)fail++;
  console.log((ok?'  ok  ':'  ผิด ')+k.padEnd(20)+' รูป/รอบ '+r.รูปต่อรอบ.padStart(2)+
    ' (ควรได้ '+want+') · หลุดข้อยกเว้น '+r.หลุดข้อยกเว้น+
    ' · เคยถูกสุ่ม '+r.ข้อที่เคยถูกสุ่ม+'/'+r.ข้อทั้งหมด+' ข้อ');
});
console.log('\n'+(fail?('ไม่ผ่าน '+fail+' ข้อ'):'ผ่านทั้งหมด'));
process.exit(fail?1:0);
