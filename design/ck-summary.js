/* ═══ สรุปหน้าตาทั้งหมด — 3 แบรนด์ × ทุกสิทธิ์ × คอม/มือถือ ═══
   สามแบรนด์ไม่ได้ต่างกันแค่สี ต่างกันที่ "มีอะไรให้วัด"
   จำนวนหน้าจอจึงไม่เท่ากัน — เจ๊แดงไม่มีแดชบอร์ดฝั่งสาขาเลย */
const BR=[
 {k:'santafe', n:"Santa Fe'", c:'#F97316', real:1,
  rule:'daily:true · cutoff เปิด 11:30 · ปิด 22:00 → วัดได้ 3 ทาง ครบ / ช้า / ไม่ส่ง',
  facts:['64 สาขา · 7 โซน','2 รอบต่อวัน — เปิดร้าน / ปิดร้าน','ฟอร์มเปิดร้าน <b>6 หมวด 60 ข้อ</b> · ปิดร้าน 6 หมวด 43 ข้อ · สาขา 55 (ST_Easy) ใช้ฟอร์มย่อคนละชุด','สุ่มขอรูปหมวดละ 1 ข้อ → ถ่ายอย่างน้อย <b>6 รูป</b> ต่อรอบ','สาขากรอกเช็คลิสต์เอง']},
 {k:'yamachan',n:'ยามะจัง',   c:'#2563EB', real:0,
  rule:'daily:true · <b>ไม่มี cutoff</b> → "ส่งช้า" เป็น 0 เสมอ เหลือ 2 ทาง ครบ / ไม่ส่ง',
  facts:['12 สาขา · 1 โซน','2 รอบต่อวัน — เปิดร้าน / ปิดร้าน','ฟอร์มเปิดร้าน <b>2 หมวด 44 ข้อ</b> (ส่วนครัว 23 · ส่วนบริการ 21) · ปิดร้าน 36 ข้อ','สุ่มขอรูป <b>หมวดละ 5 ข้อ</b> → ถ่ายอย่างน้อย <b>10 รูป</b> ต่อรอบ มากที่สุดใน 3 แบรนด์ · ยกเว้นข้อที่ขึ้นต้นว่า “สุ่มชิมวัตถุดิบ” ที่ไม่ถูกสุ่มและตกก็ไม่ต้องแนบรูป','โซนเดียว → BZM เห็นเท่ากับทั้งแบรนด์ และไม่มีชั้น "รายโซน" ให้ยุบ']},
 {k:'jaedaeng',n:'เจ๊แดงสามย่าน',c:'#DC2626',real:0,
  rule:'<b>daily:false</b> · ไม่มีรอบเลย → เป็นการตรวจร้านเป็นครั้ง ไม่มีตัวหาร ทำ % ไม่ได้',
  facts:['49 สาขา · 5 โซน (แยกด้วยชื่อร้าน ไม่มีรหัสสาขา)','ไม่มีรอบ — BZM ลงพื้นที่ไปตรวจเป็นครั้ง','ฟอร์ม <b>7 หมวด 64 ข้อ</b> · ต้องเปิด GPS ถึงเริ่มได้ แต่ระยะเกิน 500 ม. แค่เตือนให้ยืนยัน ไม่ปิดกั้น','สุ่มขอรูปหมวดละ 1 ข้อ → ถ่ายอย่างน้อย <b>7 รูป</b> ต่อครั้ง · มีรายการข้อที่ยกเว้นไม่ถูกสุ่ม','<b>สาขาไม่มีแดชบอร์ด</b> — สิทธิ์ view-jd-dash ไม่รวม branch']},
];
const ROLE={branch:'สาขา',bzm:'BZM',admin:'แอดมิน / ผู้บริหาร'};
const MOBN={dash:'แดชบอร์ด',check:'ตรวจร้าน',form:'ฟอร์มตรวจ'};
const NOTE={
 'santafe-branch':'เห็นเฉพาะสาขาตัวเอง · ปฏิทินทั้งเดือนแยกรอบเปิด/ปิด พร้อมเวลาที่ส่ง · แถบเทียบกับโซนและทั้งแบรนด์',
 'santafe-bzm':'เห็นเฉพาะสาขาในโซนตัวเอง (พี่ปิ๊ก 10 สาขา) · มีแถบเทียบว่าโซนตัวเองอยู่ตรงไหน',
 'santafe-admin':'เห็นทุกสาขา ทุกโซน · สลับแบรนด์ได้ · ตารางรายโซนใช้ฐาน = รอบที่ควรส่ง',
 'yamachan-branch':'เหมือนซานตาเฟ่ แต่<b>ไม่มีแถว "ส่งช้า"</b> — ตัดทิ้งทั้งแถว ไม่ใช่โชว์ 0 ค้างไว้ · ปฏิทินไม่มีช่องสีส้มเลย',
 'yamachan-bzm':'ยามะจังมีโซนเดียว BZM จึงเห็นเท่ากับทั้งแบรนด์ · ตารางเป็นรายสาขา 12 แถว ไม่ใช่รายโซน',
 'yamachan-admin':'ตารางเป็นรายสาขาตรง ๆ · <b>คอลัมน์ "ช้า" หายไปทั้งคอลัมน์</b> ช่อง % จึงบีบแคบลงตาม',
 'jaedaeng-branch':'<b>ไม่มีแดชบอร์ด</b> เปิดได้แค่ฟอร์มลงตรวจ · ต้องเปิด GPS ก่อน สาขานอกรัศมี 500 ม. เลือกได้แต่จะถามยืนยัน',
 'jaedaeng-bzm':'เห็นสาขาในโซนตัวเอง (พี่กัส 11 สาขา) · เรียงตามคะแนน สาขาที่ยังไม่ถูกตรวจอยู่ท้ายสุดและขึ้นเป็นแดง',
 'jaedaeng-admin':'KPI คนละชุด — ครั้งที่ลงตรวจ / คะแนนเฉลี่ย / ข้อไม่ผ่าน (NCR) / สาขาที่ตรวจแล้ว · ไม่มี "ส่งครบ/ช้า/ไม่ส่ง" เลย',
};
const MAN=window.MANIFEST;
const host=document.getElementById('body');
host.innerHTML=BR.map(function(b){
 const mine=MAN.filter(function(x){return x[1].indexOf(b.k+'-')===0;});
 const roles=[];
 ['branch','bzm','admin'].forEach(function(r){
  const d=mine.filter(function(x){return x[0]==='d'&&x[1]===b.k+'-'+r;});
  const m=mine.filter(function(x){return x[0]==='m'&&x[1].indexOf(b.k+'-'+r+'-')===0;});
  if(d.length||m.length) roles.push({r:r,d:d,m:m});
 });
 return '<div data-b="'+b.k+'" hidden>'+
  '<div class="rule'+(b.real?'':' fake')+'">'+
   '<div class="rule-h"><b>'+b.n+'</b><span>'+b.rule+'</span></div>'+
   '<ul>'+b.facts.map(function(f){return '<li>'+f+'</li>';}).join('')+'</ul>'+
   (b.real?'<p class="ok">ตัวเลขทั้งหมดเป็นข้อมูลจริงเดือน ส.ค. 2569</p>'
          :'<p class="warn">ตัวเลขเป็น<b>ตัวอย่าง</b> — โครงหน้าจอถูกต้องตามเงื่อนไขจริงในโค้ด แต่ยังไม่ได้ต่อข้อมูลจริง</p>')+
  '</div>'+
  roles.map(function(x){
   return '<section class="role">'+
    '<div class="rh"><span class="tag">'+ROLE[x.r]+'</span><span class="d">'+(NOTE[b.k+'-'+x.r]||'')+'</span></div>'+
    '<div class="rb">'+
     x.d.map(function(f){return '<figure class="u d"><figcaption>จอคอม 1400px</figcaption>'+
       '<img loading="lazy" src="s-'+f[1]+'.png"></figure>';}).join('')+
     x.m.map(function(f){const p=f[1].split('-').pop();
       return '<figure class="u m"><figcaption>มือถือ 430px · '+(MOBN[p]||p)+'</figcaption>'+
       '<img loading="lazy" src="s-'+f[1]+'.png"></figure>';}).join('')+
    '</div></section>';}).join('')+
 '</div>';
}).join('');

const sw=document.getElementById('bsw');
BR.forEach(function(b,i){
 const el=document.createElement('button');
 el.innerHTML='<i style="background:'+b.c+'"></i>'+b.n+(b.real?'':' <s>ตัวอย่าง</s>');
 el.onclick=function(){
  document.querySelectorAll('[data-b]').forEach(function(d){d.hidden=d.dataset.b!==b.k;});
  sw.querySelectorAll('button').forEach(function(x,j){x.classList.toggle('on',j===i);});
  window.scrollTo({top:0,behavior:'instant'});
 };
 sw.appendChild(el);
});
sw.querySelectorAll('button')[0].click();
