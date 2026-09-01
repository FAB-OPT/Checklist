/* พรีวิวกล่อง "ภาพรวมการส่ง" ที่เพิ่งลงในแอปจริง
   ดึง CSS + ฟังก์ชันจาก index.html มาตรง ๆ แล้วป้อนข้อมูลจำลองที่มีสัดส่วนเท่าของจริง */
const fs=require('fs');
const SRC=__dirname+'/../index.html';
const src=fs.readFileSync(SRC,'utf8');
function grabFn(name){
  const i=src.indexOf('function '+name+'(');
  if(i<0) throw new Error('ไม่เจอ '+name);
  let j=src.indexOf('{',i),d=0,k=j;
  for(;;){const c=src[k]; if(c==='{')d++; else if(c==='}'){d--; if(!d)break;} k++;}
  return src.slice(i,k+1);
}
/* CSS ทั้งหมดของไฟล์ (ทุกบล็อก style) */
let css='';
src.replace(/<style[^>]*>([\s\S]*?)<\/style>/g,(m,b)=>{css+=b+'\n';return m;});

const fn=[grabFn('_sfDailyKpisHTML'),grabFn('_dailyMonthHM'),grabFn('_dailyMonthStripHTML'),
          grabFn('_sfRate'),grabFn('_sfCodeSet'),grabFn('_sfBenchHTML')].join('\n');

/* ปฏิทินหนึ่งเดือนของสาขาเดียว — ใส่เวลาส่งจริงเข้าไปด้วย */
function monthOf(y,m,pOk,pLate,late){
  const out=[]; const days=new Date(y,m,0).getDate();
  for(let d=1;d<=days;d++) for(const sh of ['open','close']){
    const r=Math.random(); if(r>=pOk+pLate) continue;
    const isLate=late&&r>=pOk;
    const base=sh==='open'?(isLate?11*60+40:6*60+35):(isLate?22*60+15:13*60+10);
    const mins=base+Math.floor(Math.random()*22)-8;
    const iso=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')
      +'T'+String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0')+':00';
    out.push({date:y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),
              shift:sh,late:isLate,submittedAt:iso,items:[]});
  }
  return out;
}
/* หลายสาขารวมกัน — ทำใบของ 12 สาขาในเดือนเดียว */
function monthMany(nb,pOk,pLate){
  let out=[];
  for(let b=0;b<nb;b++) out=out.concat(monthOf(2026,8,pOk,pLate,1).map(function(d){
    return Object.assign({},d,{branchCode:'50'+String(b).padStart(2,'0')});}));
  return out;
}
const MONTHS=[
  {t:'สาขาเดียว · ส่งดี — บอกเวลาที่ส่ง',late:1,n:1,d:monthOf(2026,8,.90,.05,1)},
  {t:'สาขาเดียว · ขาดบ่อย',late:1,n:1,d:monthOf(2026,8,.45,.12,1)},
  {t:'ยามะจัง · ไม่มีเวลาตัด',late:0,n:1,d:monthOf(2026,8,.82,0,0)},
  {t:'12 สาขารวมกัน — บอกจำนวนสาขาที่ส่ง',late:1,n:12,d:monthMany(12,.78,.10)},
];

/* ข้อมูลจำลอง: สัดส่วนตามของจริง ส.ค. 2569 — 64 สาขา 31 วัน ครบ 66% ช้า 12% ไม่ส่ง 22% */
function makeData(nBranch,nDays,pOk,pLate,late){
  const out=[];
  for(let b=0;b<nBranch;b++) for(let d=0;d<nDays;d++) for(const sh of ['open','close']){
    const r=Math.random();
    if(r>=pOk+pLate) continue;                       // ไม่ส่ง
    const isLate=late && r>=pOk;
    const items=[];
    for(let i=0;i<48;i++){
      const q=Math.random();
      items.push({status: q<0.006?'fail' : q<0.016?'na' : 'pass'});
    }
    out.push({date:'2569-08-'+String(d+1).padStart(2,'0'),branchCode:'50'+String(b).padStart(2,'0'),
              shift:sh,late:isLate,items});
  }
  return out;
}
const CASES=[
  {t:"Santa Fe' · ทั้งแบรนด์",n:64,d:31,ok:.66,lt:.12,late:1},
  {t:"Santa Fe' · โซนพี่ปิ๊ก",n:10,d:31,ok:.544,lt:.148,late:1},
  {t:"ยามะจัง · ไม่มีเวลาตัด",n:12,d:31,ok:.808,lt:0,late:0},
  {t:"สาขาเดียว",n:1,d:31,ok:.903,lt:.032,late:1},
  {t:"ยังไม่มีข้อมูล",n:0,d:0,ok:0,lt:0,late:0},
];
const blocks=CASES.map((c,i)=>({...c,data:makeData(c.n,c.d,c.ok,c.lt,c.late)}));

const html=`<!doctype html><html lang="th"><meta charset="utf-8"><title>พรีวิว ภาพรวมการส่ง</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${css}
body{background:#E9ECEF;font-family:Sarabun,sans-serif;margin:0;padding:26px 20px 70px}
.wrap{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start}
@media(max-width:900px){.wrap{grid-template-columns:1fr}}
h1{font-size:21px;font-weight:800;max-width:1180px;margin:0 auto 18px}
h2.sec{font-size:15px;font-weight:800;max-width:1180px;margin:30px auto 12px;color:#565E67}
.case{background:#fff;border:1px solid #D8DCE2;border-radius:16px;overflow:hidden}
.case>h2{margin:0;padding:13px 16px;border-bottom:1px solid #EEF0F3;font-size:14px;font-weight:800}
.case>.in{padding:16px;background:var(--bg)}
</style>
<h1>พรีวิว — ดึง CSS กับฟังก์ชันจาก index.html จริง</h1>
<h2 class="sec">ภาพรวมการส่ง</h2>
<div class="wrap" id="w"></div>
<h2 class="sec">แถบเทียบ</h2>
<div class="wrap" id="bn"></div>
<h2 class="sec">ปฏิทินการส่งทั้งเดือน</h2>
<div class="wrap" id="cal"></div>
<script>
${fn}
var _SC=0, _LATE=true;
function _sfTodayScopeRoster(){ return Array.from({length:_SC},function(_,i){return {code:'50'+String(i).padStart(2,'0')};}); }
function _isDailyLate(d){ return !!(d&&d.late); }
function ckHasLate(){ return _LATE; }
var CASES=${JSON.stringify(blocks.map(b=>({t:b.t,n:b.n,late:b.late,data:b.data})))};
var MONTHS=${JSON.stringify(MONTHS)};
function todayDateStr(){ return '2026-08-31'; }
function _dailyMonthKey(){ return '2026-08'; }
function fmtDateDMY(s){ var p=String(s).split('-'); return p[2]+'/'+p[1]+'/'+(Number(p[0])+543); }
function escapeAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function _dailyMonthShift(){} function _dailyPickDay(){}
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
var allDailyChecklists=[], _BR_ALL=64, _BR_SCOPE=64;
function ckViewBrandKey(){ return 'santafe'; }
function ckBrandOfBranch(){ return 'santafe'; }
function applySfClDateFilter(x){ return x; }
function _openBranches(){ return Array.from({length:_BR_ALL},function(_,i){return {code:'50'+String(i).padStart(2,'0')};}); }
function _sfBranchZone(){ return 'พี่ปิ๊ก'; }
var sfClFilter={zone:'all',branch:'all'};
document.getElementById('w').innerHTML=CASES.map(function(c){
  _SC=c.n; _LATE=!!c.late;
  return '<div class="case"><h2>'+c.t+'</h2><div class="in" id="dashboard-screen">'+
    '<div class="jd-dash-kpis" id="sf-cl-kpis">'+_sfDailyKpisHTML(c.data)+'</div></div></div>';
}).join('');
document.getElementById('bn').innerHTML=[
  {t:'BZM · โซนพี่ปิ๊ก 10 สาขา เทียบทั้งแบรนด์',scope:1,branch:'all'},
  {t:'กรองเหลือสาขาเดียว — มีเส้นโซนแทรก',scope:2,branch:'5069'},
  {t:'ดูทั้งแบรนด์อยู่แล้ว — ไม่แสดงอะไร',scope:0,branch:'all'},
].map(function(c){
  _LATE=true; allDailyChecklists=CASES[0].data;
  _BR_ALL=64; _SC=(c.scope===0?64:c.scope===1?10:1);
  sfClFilter={zone:'all',branch:c.branch};
  /* ขอบเขตที่ดูอยู่ต้องเป็นชุดย่อยของข้อมูลทั้งแบรนด์จริง ๆ ไม่งั้นตัวหารไม่ตรง */
  var codes={}; _sfTodayScopeRoster().forEach(function(b){codes[String(b.code)]=1;});
  var scope=CASES[0].data.filter(function(d){return codes[String(d.branchCode)];});
  var h=_sfBenchHTML(scope);
  return '<div class="case"><h2>'+c.t+'</h2><div class="in">'+(h||'<div style="font-size:12px;color:#8E959D;font-weight:700">— ไม่แสดง (ถูกต้อง) —</div>')+'</div></div>';
}).join('');
document.getElementById('cal').innerHTML=MONTHS.map(function(c){
  _LATE=!!c.late;
  return '<div class="case"><h2>'+c.t+'</h2><div class="in">'+_dailyMonthStripHTML(c.d,c.n)+'</div></div>';
}).join('');
</script>`;
fs.writeFileSync(__dirname+'/prev-kpi.html',html);
console.log('เขียน design/prev-kpi.html · เคส '+CASES.length+' · ใบทั้งหมด '+blocks.reduce((a,b)=>a+b.data.length,0));
