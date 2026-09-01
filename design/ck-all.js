/* ═══ ข้อมูลรายการหัวข้อ (ซานตาเฟ่ · ข้อมูลจริง) ═══
   FAILS/NAS = ทั้งแบรนด์ · BFAILS/BNAS = สาขา 5069 */
const FAILS=[['หลอดไฟ ฝ้า เพดาน ไม่มีหยากไย่และไม่ชำรุด',55],
 ['เมนู ใบช่วยขายมีเพียงพอ สะอาด ไม่ชำรุด',25],
 ['ป้ายร้าน กล่องไฟ สื่อโฆษณาหน้าร้าน สะอาดไม่ชำรุด',11],
 ['สื่อการขาย เล่มเมนู และกล่องไม้ใส่ใบช่วยขาย สะอาด',10],
 ['กระจกรอบร้านสะอาด ไม่มีรอยนิ้วมือ',9]];
const NAS=[['เงินทอนและเงินยอดขายจัดเก็บเข้าเซฟเรียบร้อย',273],
 ['เตรียมเงินทอนพร้อมก่อนร้านเปิดการขาย',247],
 ['เครื่องอีซี่แคร์ สะอาดและอุปกรณ์ครบพร้อมใช้งาน',215],
 ['ตู้เย็น เครื่องอีซี่แคร์ สะอาดและอุณหภูมิได้มาตรฐาน 2-5',115],
 ['เตรียมซอสมะเขือเทศ ซอสพริก เพียงพอต่อการใช้งาน',111]];
const BFAILS=[['เมนู ใบช่วยขายมีเพียงพอ สะอาด ไม่ชำรุด',23],
 ['สื่อการขาย เล่มเมนู และกล่องไม้ใส่ใบช่วยขาย สะอาด',10],
 ['หลอดไฟ ฝ้า เพดาน ไม่มีหยากไย่และไม่ชำรุด',8]];
const BNAS=[['เงินทอนและเงินยอดขายจัดเก็บเข้าเซฟเรียบร้อย',28],
 ['เตรียมเงินทอนพร้อมก่อนร้านเปิดการขาย',27],
 ['เครื่องอีซี่แคร์ สะอาดและอุปกรณ์ครบพร้อมใช้งาน',24]];
const D7=[
 {d:'31 ส.ค.',r:[{s:'open',t:'10:12',p:100},{s:'close',t:null}]},
 {d:'30 ส.ค.',r:[{s:'open',t:'10:26',p:100}]},
 {d:'29 ส.ค.',r:[{s:'open',t:'10:08',p:100},{s:'close',t:'21:44',p:98}]},
 {d:'28 ส.ค.',r:[{s:'open',t:'10:19',p:100},{s:'close',t:'21:52',p:98}]},
 {d:'27 ส.ค.',r:[{s:'open',t:'10:03',p:100},{s:'close',t:'22:06',p:96,late:1}]},
 {d:'26 ส.ค.',r:[{s:'open',t:'10:31',p:98},{s:'close',t:'21:38',p:97}]},
 {d:'25 ส.ค.',r:[{s:'open',t:'10:14',p:98},{s:'close',t:'21:49',p:98}]},
];

/* ═══ ชิ้นส่วนที่ใช้ซ้ำ ═══ */
const esc=s=>String(s);
const list=(rows,cls,col)=>rows.map(r=>'<div class="li"><span class="t">'+r[0]+
  '<span class="lbar"><i style="width:'+(r[1]/rows[0][1]*100)+'%;background:'+col+'"></i></span></span>'+
  '<span class="n '+cls+'">'+r[1]+'</span></div>').join('');
const cal=()=>{const part=[13,30],none=[7];let h='';
  for(let i=1;i<=31;i++){const cls='c '+(none.includes(i)?'miss':part.includes(i)?'part':'full')+(i===31?' today':'');
    const t=none.includes(i)?'k-x':(i===27?'k-l':'k-o'), b=none.includes(i)||part.includes(i)?'k-x':(i===27?'k-l':'k-o');
    h+='<span class="'+cls+'"><b>'+i+'</b><em><i class="'+t+'"></i><i class="'+b+'"></i></em></span>';}
  return '<div class="mo-g">'+h+'</div>';};
const d7html=()=>'<div class="d7">'+D7.map(d=>'<div class="dd"><div class="dd-h">'+d.d+
  '<em>'+d.r.filter(x=>x.t).length+'/2 รอบ</em></div>'+d.r.map(r=>'<div class="dd-r">'+
  '<span class="ic"><span class="material-symbols-rounded">'+(r.s==='open'?'wb_sunny':'bedtime')+'</span></span>'+
  '<span class="tx">'+(r.s==='open'?'เปิดร้าน':'ปิดร้าน')+(r.t?' · '+r.t+' น.':'')+
  (r.late?'<span class="tag">เกินเวลา</span>':'')+(!r.t?'<span class="tag x">ยังไม่ส่ง</span>':'')+'</span>'+
  (r.p!=null?'<span class="pc" style="color:'+(r.p>=99?'var(--ok)':'var(--late)')+'">'+r.p+'%</span>':'')+
  '</div>').join('')+'</div>').join('')+'</div>';

/* ── บล็อกเนื้อหาที่ใช้ทั้งคอมและมือถือ ── */
/* ── หัวข้อหมวด ──
   ของเดิม: เส้นทึบ 2px พาดเต็มความกว้าง + ชื่อ + คำอธิบายบรรทัดล่าง + ช่วงเวลาชิดขวา
   ปัญหา: เส้นเต็มความกว้างดูเหมือน "เส้นปิดท้ายของบล็อกข้างบน" มากกว่าเส้นเปิดหมวดใหม่
          และบนมือถือคำอธิบายถูกบีบจนสูงแค่ 21px อ่านไม่ออก จึงไม่เหมือนกันสองจอ
   ใหม่:  ครอบทั้งหัวหมวดด้วยกรอบสีแบรนด์ (พื้นอ่อน ๆ ในกรอบ)
          กรอบบอกขอบเขตของหัวหมวดชัดกว่าขีดเล็ก ๆ หน้าชื่อ และไม่ไปแย่งกับบล็อกข้างบน
          คำอธิบายต่อท้ายชื่อบรรทัดเดียวกัน · ช่วงเวลาเป็นป้ายขาวชิดขวา */
const secHead=(t,d,r)=>'<div class="sech">'+
 '<span class="sech-t">'+t+'</span>'+
 (r?'<span class="sech-r">'+r+'</span>':'')+
 (d?'<span class="sech-d">'+d+'</span>':'')+
'</div>';

/* ── กราฟภาพรวมการส่ง ──
   คอมกับมือถือใช้คนละแบบ เพราะขนาดช่องต่างกันคนละเรื่อง
   คอม   = ปฏิทิน ช่องละวัน ในช่องแบ่งสองแถว "เปิด/ปิด" พร้อมเวลาส่ง (ช่อง ~89px)
   มือถือ = ปฏิทินสองขีดแบบเดิม (ช่อง ~34px ใส่ตัวหนังสือกับเวลาไม่ไหว)
   ใช้ตัวหนังสือแทนไอคอนบนคอม จึงไม่ต้องมีคำอธิบายว่าไอคอนไหนคือรอบอะไร */
const TT=[
 {d:1,o:null,c:null},{d:2,o:672,c:1317},{d:3,o:640,c:1307},{d:4,o:643,c:1328,cl:1},
 {d:5,o:635,c:1307},{d:6,o:641,c:null},{d:7,o:640,c:1311},{d:8,o:658,c:1314},
 {d:9,o:664,c:1319},{d:10,o:643,c:1322},{d:11,o:634,c:1318},{d:12,o:622,c:1317},
 {d:13,o:634,c:1329,cl:1},{d:14,o:637,c:1311},{d:15,o:657,c:1313},{d:16,o:638,c:1326},
 {d:17,o:646,c:1310},{d:18,o:647,c:1310},{d:19,o:659,c:1313},{d:20,o:658,c:1303},
 {d:21,o:649,c:1311},{d:22,o:649,c:1312},{d:23,o:659,c:1313},{d:24,o:655,c:1312},
 {d:25,o:651,c:1295},{d:26,o:659,c:1307},{d:27,o:663,c:1307},{d:28,o:641,c:1300},
 {d:29,o:660,c:1294},{d:30,o:null,c:1322},{d:31,o:642,c:1322}
];
const fmtT=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
/* ใช้ธงที่แอปตีไว้เท่านั้น — แอปตัดสิน "ช้า" จากเวลาที่เริ่มตรวจ ไม่ใช่เวลาที่กดส่ง */
const stI=(v,late)=>v==null?'s-ms':(late?'s-lt':'s-ok');
const DOW=['จ','อ','พ','พฤ','ศ','ส','อา'], CAL_OFF=5;   /* 1 ส.ค. 2569 = เสาร์ */


/* ═══════════════════════════════════════════════════════════════
   เงื่อนไขจริงของแต่ละแบรนด์ — อ่านจาก CK_BRANDS ในแอปจริง (บ. 7108–7116)
   สามแบรนด์ไม่ได้ต่างกันแค่สี แต่ต่างกันที่ "มีอะไรให้วัด" เลย

   santafe   daily:true  · cutoff เปิด 11:30 ปิด 22:00 → วัดได้ 3 ทาง ครบ/ช้า/ไม่ส่ง
   yamachan  daily:true  · ไม่มี cutoff              → "ส่งช้า" เป็น 0 เสมอ เหลือ 2 ทาง
   jaedaeng  daily:false · ไม่มีรอบเลย                → เป็นการตรวจเป็นครั้ง ไม่มีตัวหาร ทำ % ไม่ได้
   ═══════════════════════════════════════════════════════════════ */
const BRANDS=[
 {key:'santafe', color:'#F97316',tile:'SF',short:"Santa Fe'",name:"Santa Fe'",
  kind:'daily', late:true, real:true,
  nBranch:64, nZone:7,
  sub:{branch:'5069 โลตัส พัฒนาการ', bzm:'โซนพี่ปิ๊ก · 10 สาขา', admin:'64 สาขา · 7 โซน'},
  cutoffTxt:'นับส่งช้าจากเวลาที่เริ่มตรวจ — รอบเปิดหลัง 11:30 น. รอบปิดหลัง 22:00 น.',
  br:{due:62,pOk:90.3,pLt:3.2,pMs:6.5,sent:58,fullDays:28,
      sc:'98.5%',fail:41,na:181,naP:'6%',
      zoneName:'โซนพี่นพ',zoneV:73.5,brandV:66.0,meV:90.3,
      note:'สาขานี้ <b>90.3%</b> สูงกว่าค่าเฉลี่ยโซน <b>16.8 จุด</b> · ขาดอีก <b>3 รอบ</b> ก็ถึงเป้า 95%'},
  bzm:{due:620,ok:337,lt:92,ms:191,r:'10 สาขา · 31 วัน',
       foot:'เฉลี่ยวันละ <b>13.8</b> ครั้ง · มี <b>1</b> สาขาแทบไม่ส่งเลย',
       v:54.4,note:'โซนนี้ <b>54.4%</b> <b>ต่ำกว่า</b>ค่าเฉลี่ยแบรนด์ <b>11.6 จุด</b> · ตัวถ่วงหลักคือ 5021 ปิ่นเกล้า ที่แทบไม่ส่งเลย'},
  ad:{due:3968,ok:2619,lt:478,ms:871,r:'64 สาขา · 31 วัน',
      foot:'เฉลี่ยวันละ <b>99.9</b> ครั้ง · มี <b>3</b> สาขาไม่ส่งเลยทั้งเดือน'},
  items:{bzm:{sc:'100%',f:'10',na:'74',naP:'0.3%',foot:'ผ่าน <b>21,466</b> จาก 21,476 ข้อที่ตอบ · ข้อที่ตกพบใน <b>4</b> สาขา'},
         ad:{sc:'99.8%',f:'240',na:'1,394',naP:'0.9%',foot:'ผ่าน <b>155,404</b> จาก 155,644 ข้อที่ตอบ · ข้อที่ตกพบใน <b>30</b> สาขา'}},
  tot:{bzm:{a:'รวมทั้งโซน',b:'10 สาขา',on:54.4,lt:14.8,ms:30.8,sc:100.0,na:0.3},
       ad:{a:'รวมทั้งแบรนด์',b:'64 สาขา',on:66.0,lt:12.0,ms:22.0,sc:99.8,na:0.9}}},

 {key:'yamachan',color:'#2563EB',tile:'YM',short:'ยามะจัง',name:'ยามะจัง',
  kind:'daily', late:false, real:false,
  nBranch:12, nZone:1,
  sub:{branch:'6003 เซ็นทรัล พระราม 9', bzm:'ทั้งแบรนด์ · 12 สาขา', admin:'12 สาขา · 1 โซน'},
  cutoffTxt:'ไม่มีเวลาตัด — ส่งเมื่อไรก็ไม่นับว่าช้า',
  br:{due:62,pOk:93.5,pLt:0,pMs:6.5,sent:58,fullDays:29,
      sc:'97.8%',fail:26,na:96,naP:'4%',
      zoneName:'ทั้งแบรนด์',zoneV:80.8,brandV:80.8,meV:93.5,
      note:'สาขานี้ <b>93.5%</b> สูงกว่าค่าเฉลี่ยแบรนด์ <b>12.7 จุด</b> · ขาดอีก <b>1 รอบ</b> ก็ถึงเป้า 95%'},
  bzm:{due:744,ok:601,lt:0,ms:143,r:'12 สาขา · 31 วัน',
       foot:'เฉลี่ยวันละ <b>19.4</b> ครั้ง · ยามะจังไม่มีเวลาตัด จึงไม่มีรอบที่นับว่าส่งช้า',
       v:80.8,note:'ยามะจังมีโซนเดียว BZM จึงเห็นเท่ากับทั้งแบรนด์'},
  ad:{due:744,ok:601,lt:0,ms:143,r:'12 สาขา · 31 วัน',
      foot:'เฉลี่ยวันละ <b>19.4</b> ครั้ง · ยามะจังไม่มีเวลาตัด จึงไม่มีรอบที่นับว่าส่งช้า'},
  items:{bzm:{sc:'97.8%',f:'58',na:'302',naP:'1.1%',foot:'ผ่าน <b>26,842</b> จาก 26,900 ข้อที่ตอบ · ข้อที่ตกพบใน <b>9</b> สาขา'},
         ad:{sc:'97.8%',f:'58',na:'302',naP:'1.1%',foot:'ผ่าน <b>26,842</b> จาก 26,900 ข้อที่ตอบ · ข้อที่ตกพบใน <b>9</b> สาขา'}},
  tot:{bzm:{a:'รวมทั้งแบรนด์',b:'12 สาขา',on:80.8,lt:0,ms:19.2,sc:97.8,na:1.1},
       ad:{a:'รวมทั้งแบรนด์',b:'12 สาขา',on:80.8,lt:0,ms:19.2,sc:97.8,na:1.1}}},

 {key:'jaedaeng',color:'#DC2626',tile:'JD',short:'เจ๊แดง',name:'เจ๊แดงสามย่าน',
  kind:'audit', late:false, real:false,
  nBranch:49, nZone:5,
  sub:{branch:'สามย่านมิตรทาวน์', bzm:'โซนพี่กัส · 11 สาขา', admin:'49 สาขา · 5 โซน'},
  cutoffTxt:'ไม่มีรอบเปิด-ปิด · เป็นการตรวจร้านเป็นครั้ง ไม่มีเป้าต่อเดือน จึงไม่มีตัวหารให้คิดเปอร์เซ็นต์',
  bzm:{visits:31,sc:93.1,ncr:88,done:9,of:11,r:'11 สาขา · 31 วัน',
       foot:'เฉลี่ย <b>3.4</b> ครั้งต่อสาขาที่ตรวจแล้ว · ยังไม่ได้ตรวจ <b>2</b> สาขา'},
  ad:{visits:138,sc:92.4,ncr:411,done:41,of:49,r:'49 สาขา · 31 วัน',
      foot:'เฉลี่ย <b>3.4</b> ครั้งต่อสาขาที่ตรวจแล้ว · ยังไม่ได้ตรวจ <b>8</b> สาขา'},
  gps:{inside:134,outside:4}},
];


/* โซนของ Santa Fe' (ข้อมูลจริง) */
const Z_SF=[
 {z:'พี่ปิ๊ก',br:10,on:54.2,lt:14.8,ms:31.0,sc:100.0,na:0.3},
 {z:'พี่รุต', br:10,on:59.4,lt:12.3,ms:28.4,sc:99.9, na:0.6},
 {z:'พี่เอ็ม',br:10,on:64.0,lt:6.6, ms:29.4,sc:99.8, na:0.8},
 {z:'พี่หยี', br:10,on:67.4,lt:18.9,ms:13.7,sc:99.8, na:0.7},
 {z:'พี่นพ',  br:11,on:73.5,lt:10.7,ms:15.8,sc:99.9, na:1.0},
 {z:'พี่เจี๊ยบ',br:12,on:73.9,lt:8.6,ms:17.5,sc:99.8, na:1.2},
 {z:'พี่บิ๊ก', br:1, on:79.0,lt:16.1,ms:4.8, sc:100.0,na:0.3},
];
/* สาขาในโซนพี่ปิ๊ก — หน้า BZM ของ Santa Fe' */
const ZB=[
 {c:'5021',n:'เซ็นทรัล ปิ่นเกล้า', on:0.0, lt:1.6, ms:98.4,sc:null,na:0.0},
 {c:'5003',n:'เดอะมอลล์ ท่าพระ',   on:21.0,lt:21.0,ms:58.1,sc:100.0,na:0.0},
 {c:'5024',n:'เดอะมอลล์ บางแค',    on:27.4,lt:22.6,ms:50.0,sc:100.0,na:0.4},
 {c:'5017',n:'ซีคอน บางแค',        on:46.8,lt:16.1,ms:37.1,sc:99.9,na:0.2},
 {c:'5040',n:'เซ็นทรัล Westgate',  on:54.8,lt:38.7,ms:6.5, sc:99.9,na:0.7},
 {c:'5071',n:'โลตัส จรัญสนิทวงศ์', on:56.5,lt:19.4,ms:24.2,sc:100.0,na:0.0},
 {c:'5054',n:'บิ๊กซี บางใหญ่',     on:79.0,lt:12.9,ms:8.1, sc:100.0,na:0.0},
 {c:'5031',n:'เซ็นทรัล ศาลายา',    on:80.6,lt:11.3,ms:8.1, sc:100.0,na:1.4},
 {c:'5508',n:'รพ.วชิระพยาบาล',     on:83.9,lt:3.2, ms:12.9,sc:99.7,na:0.0},
 {c:'5034',n:'โลตัส ศาลายา',       on:93.5,lt:1.6, ms:4.8, sc:100.0,na:0.0},
];
/* ยามะจังมีโซนเดียว — แอดมินกับ BZM จึงเห็นรายสาขาตรง ๆ ไม่มีชั้นโซนให้ยุบ
   คอลัมน์ "ช้า" เป็น 0 ทุกแถวเพราะแบรนด์นี้ไม่มีเวลาตัด */
const B_YM=[
 {c:'6011',n:'เซ็นทรัล เวสต์เกต',  on:41.9,lt:0,ms:58.1,sc:96.9,na:2.1},
 {c:'6008',n:'ฟิวเจอร์พาร์ค รังสิต',on:59.7,lt:0,ms:40.3,sc:97.2,na:1.6},
 {c:'6002',n:'เซ็นทรัล ลาดพร้าว',  on:71.0,lt:0,ms:29.0,sc:97.5,na:1.3},
 {c:'6006',n:'เมกาบางนา',          on:75.8,lt:0,ms:24.2,sc:97.6,na:1.2},
 {c:'6001',n:'สยามพารากอน',        on:80.6,lt:0,ms:19.4,sc:98.0,na:0.9},
 {c:'6009',n:'เซ็นทรัล ปิ่นเกล้า',  on:82.3,lt:0,ms:17.7,sc:97.9,na:1.0},
 {c:'6004',n:'เดอะมอลล์ บางกะปิ',  on:85.5,lt:0,ms:14.5,sc:98.1,na:0.8},
 {c:'6012',n:'เซ็นทรัล อีสต์วิลล์', on:87.1,lt:0,ms:12.9,sc:97.7,na:1.1},
 {c:'6003',n:'เซ็นทรัล พระราม 9',  on:93.5,lt:0,ms:6.5, sc:97.8,na:1.0},
 {c:'6007',n:'ไอคอนสยาม',          on:93.5,lt:0,ms:6.5, sc:98.3,na:0.7},
 {c:'6005',n:'เอ็มควอเทียร์',       on:95.2,lt:0,ms:4.8, sc:98.4,na:0.6},
 {c:'6010',n:'เซ็นทรัล เชียงใหม่',  on:98.4,lt:0,ms:1.6, sc:98.2,na:0.9},
];
/* โซนเจ๊แดง — ไม่มีคอลัมน์ครบ/ช้า/ไม่ส่ง เพราะไม่มีรอบ
   วัดได้แค่ ตรวจไปกี่ครั้ง · ครอบคลุมกี่สาขา · คะแนน · ข้อไม่ผ่าน */
const Z_JD=[
 {z:'พี่กัส',  br:11,vis:31,done:9,sc:93.1,ncr:88},
 {z:'พี่อ้อย', br:10,vis:29,done:9,sc:92.8,ncr:79},
 {z:'พี่ดาว',  br:10,vis:27,done:8,sc:91.6,ncr:92},
 {z:'พี่อีฟ',  br:7, vis:22,done:7,sc:93.5,ncr:57},
 {z:'พี่เฟิร์น',br:11,vis:29,done:8,sc:91.2,ncr:95},
];
/* สาขาในโซนพี่กัส — สองสาขาท้ายยังไม่ถูกตรวจเลยทั้งเดือน */
const ZB_JD=[
 {n:'สามย่านมิตรทาวน์', vis:4,sc:95.2,ncr:6, last:'29 ส.ค.'},
 {n:'เซ็นทรัลเวิลด์',    vis:4,sc:94.1,ncr:8, last:'28 ส.ค.'},
 {n:'สยามสแควร์ ซ.5',   vis:3,sc:93.8,ncr:7, last:'27 ส.ค.'},
 {n:'เอ็มบีเค เซ็นเตอร์', vis:3,sc:93.0,ncr:9, last:'25 ส.ค.'},
 {n:'เซ็นทรัล พระราม 3', vis:3,sc:92.6,ncr:10,last:'24 ส.ค.'},
 {n:'ท่าพระ',            vis:3,sc:92.4,ncr:11,last:'22 ส.ค.'},
 {n:'บางรัก',            vis:3,sc:92.0,ncr:12,last:'20 ส.ค.'},
 {n:'อโศก',              vis:4,sc:91.5,ncr:13,last:'19 ส.ค.'},
 {n:'ลาดพร้าว 71',       vis:4,sc:90.8,ncr:12,last:'18 ส.ค.'},
 {n:'รัชดา 32',          vis:0,sc:null,ncr:0, last:null},
 {n:'บางแค',             vis:0,sc:null,ncr:0, last:null},
];
/* จำนวนครั้งที่ตรวจในแต่ละวัน (เจ๊แดง) — ใช้แทนปฏิทินเปิด-ปิด
   ศุกร์-เสาร์เป็น 0 เพราะทีมไม่ลงตรวจวันหยุด */
const VIS=[0,5,4,6,0,0,5,7,4,5,6,0,0,4,6,5,4,7,0,0,5,6,4,5,6,0,0,4,7,5,8];
const FAILS_YM=[['อุณหภูมิตู้แช่บันทึกครบทุกช่วงเวลา',18],
 ['พื้นครัวและรางระบายน้ำสะอาด ไม่มีคราบ',14],
 ['ภาชนะและอุปกรณ์จัดเก็บเข้าที่ ไม่วางกับพื้น',11],
 ['ป้ายราคาและสื่อในร้านตรงกับรอบโปรโมชัน',9],
 ['เครื่องแบบพนักงานสะอาด เรียบร้อย ครบชุด',6]];
const NAS_YM=[['เตรียมเงินทอนพร้อมก่อนร้านเปิดการขาย',77],
 ['ตรวจนับสต๊อกวัตถุดิบประจำวัน',64],
 ['เครื่องรูดบัตรพร้อมใช้งาน กระดาษสลิปเพียงพอ',58],
 ['ตรวจสอบระบบดูดควันและพัดลมระบายอากาศ',52],
 ['จัดเก็บเงินยอดขายเข้าเซฟเรียบร้อย',51]];
const NCR_JD=[['อุณหภูมิตู้เย็น/ตู้แช่ไม่ได้มาตรฐาน',63],
 ['พื้นและรางระบายน้ำในครัวมีคราบสะสม',54],
 ['ภาชนะวางกับพื้น ไม่มีชั้นรอง',47],
 ['ไม่มีป้ายกำกับวันหมดอายุวัตถุดิบ',41],
 ['เครื่องดักไขมันไม่ได้ทำความสะอาดตามรอบ',38]];


/* ═══ ชิ้นส่วนที่รู้จักเงื่อนไขแบรนด์ ═══ */
const F=n=>n.toLocaleString('th-TH');
const ITEMS={santafe:{f:FAILS,n:NAS,bf:BFAILS,bn:BNAS},
             yamachan:{f:FAILS_YM,n:NAS_YM,bf:FAILS_YM.slice(0,3),bn:NAS_YM.slice(0,3)},
             jaedaeng:{f:NCR_JD,n:[],bf:[],bn:[]}};

/* ปฏิทินเปิด-ปิด (คอม) — ถ้าแบรนด์ไม่มีเวลาตัด ธง cl จะถูกมองข้าม ไม่มีช่องสีส้มเลย */
const calI=(C)=>{
 const half=(x,k)=>{const v=x[k], late=(C.late && k==='c' && x.cl);
  return '<div class="i-h '+stI(v,late)+'"><span class="i-k">'+(k==='o'?'เปิด':'ปิด')+'</span>'+
   '<em>'+(v==null?'—':fmtT(v))+'</em></div>';};
 let h=DOW.map(d=>'<div class="dow">'+d+'</div>').join('');
 for(let i=0;i<CAL_OFF;i++) h+='<div class="i-c e"></div>';
 TT.forEach(x=>{h+='<div class="i-c'+(x.d===31?' today':'')+'"><div class="i-d">'+x.d+'</div>'+
  half(x,'o')+half(x,'c')+'</div>';});
 return '<div class="g7">'+h+'</div>';
};
/* ปฏิทินการลงตรวจ (เจ๊แดง) — ไม่มีรอบ จึงนับเป็นจำนวนครั้งต่อวันแทน */
const calVis=()=>{
 const mx=Math.max.apply(null,VIS);
 let h=DOW.map(d=>'<div class="dow">'+d+'</div>').join('');
 for(let i=0;i<CAL_OFF;i++) h+='<div class="i-c e"></div>';
 VIS.forEach((v,i)=>{
  const d=i+1, on=v>0;
  h+='<div class="i-c'+(d===31?' today':'')+'"><div class="i-d">'+d+'</div>'+
   '<div class="i-v'+(on?'':' zero')+'">'+
     (on?'<b>'+v+'</b><em>ครั้ง</em><span class="i-vb" style="width:'+(v/mx*100)+'%"></span>':'<s>ไม่ลงตรวจ</s>')+
   '</div></div>';});
 return '<div class="g7">'+h+'</div>';
};
const legend=(C,withTime)=>'<div class="note" style="display:flex;gap:12px;flex-wrap:wrap">'+
 '<span class="lgk"><i style="background:var(--ok)"></i>ส่งแล้ว</span>'+
 (C.late?'<span class="lgk"><i style="background:var(--late)"></i>เกินเวลา</span>':'')+
 '<span class="lgk"><i style="background:var(--miss)"></i>ไม่ได้ส่ง</span>'+
 (withTime?'<span style="margin-left:auto">ตัวเลขในช่อง = เวลาที่ส่ง'+(C.late?'':' · แบรนด์นี้ไม่มีเวลาตัด')+'</span>':
           '<span style="margin-left:auto">ขีดบน = เปิดร้าน · ขีดล่าง = ปิดร้าน</span>')+'</div>';

const bench=(rows,note)=>'<div class="cd bmk">'+
 '<div class="sech sub" style="margin:-2px 0 9px"><span class="sech-t">ส่งครบตรงเวลา — เทียบกับที่อื่น</span>'+
 '<span class="sech-r">เป้า 95%</span></div>'+
 rows.map(r=>'<div class="bmk-r"><span class="bmk-l">'+r.l+'</span>'+
  '<span class="bmk-t"><i class="bmk-f'+(r.me?' me':'')+'" style="width:'+r.v+'%"></i><i class="bmk-m"></i></span>'+
  '<span class="bmk-v'+(r.me?' me':'')+'">'+r.v.toFixed(1)+'%</span></div>').join('')+
 (note?'<div class="note" style="margin-top:9px">'+note+'</div>':'')+'</div>';

/* กล่องสรุปการส่ง — ตั้งต้นที่ "รอบที่ควรส่ง" เสมอ
   ยามะจังไม่มีเวลาตัด แถว "ส่งช้า" จึงถูกตัดทิ้งทั้งแถว ไม่ใช่โชว์เลข 0 ค้างไว้ */
const kpiSend=(C,scope)=>{
 const d=C[scope];
 const P=n=>n/d.due*100;
 const rows=[['ส่งครบ'+(C.late?'ตรงเวลา':''),'ok',d.ok]]
   .concat(C.late?[['ส่งช้า','late',d.lt]]:[])
   .concat([['ไม่ได้ส่ง','miss',d.ms]]);
 return '<div class="kA">'+
  '<div class="kA-top"><b>'+F(d.due)+'</b><em>รอบที่ควรส่งเดือนนี้</em><s>'+d.r+'</s></div>'+
  '<div class="kA-bar">'+rows.map(r=>'<i style="width:'+P(r[2])+'%;background:var(--'+r[1]+')"></i>').join('')+'</div>'+
  rows.map(r=>'<div class="kA-r k-'+r[1]+'"><u style="background:var(--'+r[1]+')"></u>'+
   '<span>'+r[0]+'</span><b style="color:var(--'+r[1]+')">'+F(r[2])+'</b>'+
   '<em style="color:var(--'+r[1]+')">'+P(r[2]).toFixed(1)+'%</em></div>').join('')+
 '</div><div class="note">'+d.foot+'</div>';
};
/* กล่องสรุปของเจ๊แดง — ไม่มีเป้าต่อเดือน จึงไม่มีตัวหาร ทำ % ไม่ได้
   โชว์เป็นจำนวนครั้งล้วน + ความครอบคลุมว่าตรวจไปกี่สาขาจากทั้งหมด */
const kpiAudit=(C,scope)=>{
 const d=C[scope];
 const cov=d.done/d.of*100;
 return '<div class="kA">'+
  '<div class="kA-top"><b>'+F(d.visits)+'</b><em>ครั้งที่ลงตรวจเดือนนี้</em><s>'+d.r+'</s></div>'+
  '<div class="three" style="margin-bottom:11px">'+
   '<span class="m ok"><b>'+d.sc.toFixed(1)+'%</b>คะแนนเฉลี่ย</span>'+
   '<span class="m ms"><b>'+F(d.ncr)+'</b>ข้อไม่ผ่าน (NCR)</span>'+
   '<span class="m na"><b>'+d.done+'/'+d.of+'</b>สาขาที่ตรวจแล้ว</span></div>'+
  '<div class="sech sub" style="margin:0 0 7px"><span class="sech-t">ความครอบคลุม</span>'+
   '<span class="sech-r">'+cov.toFixed(0)+'% ของสาขาทั้งหมด</span></div>'+
  '<div class="kA-bar" style="margin-bottom:0"><i style="width:'+cov+'%;background:var(--ok)"></i>'+
   '<i style="width:'+(100-cov)+'%;background:var(--miss)"></i></div>'+
 '</div><div class="note">'+d.foot+'</div>';
};
const kpi3items=(C,scope)=>{
 const d=C.items[scope];
 return '<div class="three"><span class="m ok"><b>'+d.sc+'</b>คะแนนเฉลี่ย</span>'+
  '<span class="m ms"><b>'+d.f+'</b>ข้อที่ตก</span>'+
  '<span class="m na"><b>'+d.na+'</b>N/A · '+d.naP+'</span></div>'+
  '<div class="note">'+d.foot+'</div>';
};


/* ── ตาราง/การ์ด รายโซน หรือ รายสาขา ──
   ยามะจังมีโซนเดียว ชั้น "โซน" จึงไม่มีความหมาย แอดมินเห็นรายสาขา 12 แถวตรง ๆ
   คอลัมน์ "ช้า" หายไปทั้งคอลัมน์ ไม่ใช่โชว์ 0.0 ทุกแถว */
const rowsOf=(C,scope)=>{
 if(C.key==='yamachan') return B_YM.map(x=>({a:x.c,b:x.n,on:x.on,lt:x.lt,ms:x.ms,sc:x.sc,na:x.na}));
 return scope==='ad'
  ? Z_SF.map(z=>({a:z.z,b:z.br+' สาขา',on:z.on,lt:z.lt,ms:z.ms,sc:z.sc,na:z.na}))
  : ZB.map(x=>({a:x.c,b:x.n,on:x.on,lt:x.lt,ms:x.ms,sc:x.sc,na:x.na}));
};
const headOf=(C,scope)=>C.key==='yamachan'?['สาขา','ชื่อ']:(scope==='ad'?['โซน','สาขา']:['สาขา','ชื่อ']);
const titleOf=(C,scope)=>C.key==='yamachan'?'รายสาขา':(scope==='ad'?'รายโซน':'รายสาขาในโซน');
const countOf=(C,scope)=>C.key==='yamachan'?'12 สาขา':(scope==='ad'?C.nZone+' โซน':'10 สาขา');

const bar3=(C,on,lt,ms)=>'<span class="bar3"><i style="width:'+on+'%;background:var(--ok)"></i>'+
  (C.late?'<i style="width:'+lt+'%;background:var(--late)"></i>':'')+
  '<i style="width:'+ms+'%;background:var(--miss)"></i></span>';

const tableSend=(C,scope)=>{
 const rows=rowsOf(C,scope), tot=C.tot[scope], h=headOf(C,scope);
 const cls=C.late?'':' no-late';
 const r=x=>'<div class="zr'+cls+'"><span class="zn">'+x.a+'</span><span class="zb">'+x.b+'</span>'+
   bar3(C,x.on,x.lt,x.ms)+
   '<span class="zpc"><s class="c-ok">'+x.on.toFixed(1)+'</s>'+
   (C.late?'<s class="c-late">'+x.lt.toFixed(1)+'</s>':'')+
   '<s class="c-miss">'+x.ms.toFixed(1)+'</s></span>'+
   '<span class="zsc">'+(x.sc==null?'—':x.sc.toFixed(1)+'%')+'</span><span class="zna">'+x.na.toFixed(1)+'%</span></div>';
 return '<div class="zh'+cls+'"><span>'+h[0]+'</span><span>'+h[1]+'</span>'+
   '<span>สัดส่วนการส่ง (ฐาน = รอบที่ควรส่ง)</span>'+
   '<span style="text-align:right">'+(C.late?'ครบ · ช้า · ไม่ส่ง %':'ครบ · ไม่ส่ง %')+'</span>'+
   '<span style="text-align:right">คะแนนเฉลี่ย</span><span style="text-align:right">N/A</span></div>'+
   rows.map(r).join('')+'<div class="zr tot'+cls+'">'+r(tot).slice(cls?24:16);
};
const cardsSend=(C,scope)=>{
 let rows=rowsOf(C,scope);
 if(C.key!=='yamachan'&&scope!=='ad') rows=rows.map(x=>({a:x.a+' '+x.b,b:'',on:x.on,lt:x.lt,ms:x.ms,sc:x.sc,na:x.na}));
 if(C.key==='yamachan') rows=rows.map(x=>({a:x.a+' '+x.b,b:'',on:x.on,lt:x.lt,ms:x.ms,sc:x.sc,na:x.na}));
 return '<div class="zlist">'+rows.map(x=>'<div class="zc"><div class="zc-h">'+
  '<span class="zc-n">'+x.a+'</span><span class="zc-b">'+x.b+'</span>'+
  '<span class="zc-sc">คะแนน '+(x.sc==null?'—':x.sc.toFixed(1)+'%')+' · N/A '+x.na.toFixed(1)+'%</span></div>'+
  bar3(C,x.on,x.lt,x.ms).replace('class="bar3"','class="bar3 zc-bar"')+
  '<div class="zc-f"><span><u style="background:var(--ok)"></u>ครบ '+x.on.toFixed(1)+'%</span>'+
  (C.late?'<span><u style="background:var(--late)"></u>ช้า '+x.lt.toFixed(1)+'%</span>':'')+
  '<span><u style="background:var(--miss)"></u>ไม่ส่ง '+x.ms.toFixed(1)+'%</span></div></div>').join('')+'</div>';
};

/* ── ตาราง/การ์ดของเจ๊แดง ──
   ไม่มีสัดส่วนการส่งให้แสดง แถบที่เห็นคือ "ตรวจไปแล้วกี่สาขาจากทั้งโซน"
   สาขาที่ยังไม่ถูกตรวจเลยขึ้นเป็นแดง เพราะนั่นคือสิ่งที่ต้องตามจริง ๆ */
const tableJD=(scope)=>{
 if(scope==='ad'){
  const r=z=>{const cov=z.done/z.br*100;
   return '<div class="jr"><span class="zn">'+z.z+'</span><span class="zb">'+z.br+' สาขา</span>'+
    '<span class="bar3"><i style="width:'+cov+'%;background:var(--ok)"></i>'+
      '<i style="width:'+(100-cov)+'%;background:var(--miss)"></i></span>'+
    '<span class="zpc"><s class="c-ok">'+z.done+'</s><s class="c-miss">'+(z.br-z.done)+'</s></span>'+
    '<span class="zsc">'+z.vis+'</span><span class="zsc">'+z.sc.toFixed(1)+'%</span>'+
    '<span class="zna" style="color:var(--miss)">'+z.ncr+'</span></div>';};
  const tot={z:'รวมทั้งแบรนด์',br:49,done:41,vis:138,sc:92.4,ncr:411};
  return '<div class="jh"><span>โซน</span><span>สาขา</span><span>ตรวจแล้ว · ยังไม่ตรวจ</span>'+
   '<span style="text-align:right">แล้ว · ยัง</span><span style="text-align:right">ครั้ง</span>'+
   '<span style="text-align:right">คะแนน</span><span style="text-align:right">NCR</span></div>'+
   Z_JD.map(r).join('')+'<div class="jr tot">'+r(tot).slice(16);
 }
 const r=x=>'<div class="jr b'+(x.vis?'':' none')+'"><span class="zn">'+x.n+'</span>'+
   '<span class="zb">'+(x.last?'ตรวจล่าสุด '+x.last:'<b style="color:var(--miss)">ยังไม่ได้ตรวจเลย</b>')+'</span>'+
   '<span class="zsc">'+(x.vis||'—')+'</span>'+
   '<span class="zsc">'+(x.sc==null?'—':x.sc.toFixed(1)+'%')+'</span>'+
   '<span class="zna" style="color:'+(x.ncr?'var(--miss)':'var(--ink-3)')+'">'+(x.ncr||'—')+'</span></div>';
 return '<div class="jh b"><span>สาขา</span><span>สถานะ</span><span style="text-align:right">ครั้ง</span>'+
   '<span style="text-align:right">คะแนน</span><span style="text-align:right">NCR</span></div>'+
   ZB_JD.map(r).join('');
};
const cardsJD=(scope)=>{
 if(scope==='ad') return '<div class="zlist">'+Z_JD.map(z=>{const cov=z.done/z.br*100;
  return '<div class="zc"><div class="zc-h"><span class="zc-n">'+z.z+'</span>'+
   '<span class="zc-b">'+z.br+' สาขา</span>'+
   '<span class="zc-sc">คะแนน '+z.sc.toFixed(1)+'% · NCR '+z.ncr+'</span></div>'+
   '<span class="bar3 zc-bar"><i style="width:'+cov+'%;background:var(--ok)"></i>'+
     '<i style="width:'+(100-cov)+'%;background:var(--miss)"></i></span>'+
   '<div class="zc-f"><span><u style="background:var(--ok)"></u>ตรวจแล้ว '+z.done+' สาขา</span>'+
   '<span><u style="background:var(--miss)"></u>ยังไม่ตรวจ '+(z.br-z.done)+'</span>'+
   '<span style="margin-left:auto">'+z.vis+' ครั้ง</span></div></div>';}).join('')+'</div>';
 return '<div class="zlist">'+ZB_JD.map(x=>'<div class="zc'+(x.vis?'':' none')+'"><div class="zc-h">'+
  '<span class="zc-n">'+x.n+'</span>'+
  '<span class="zc-sc">'+(x.vis?x.vis+' ครั้ง · คะแนน '+x.sc.toFixed(1)+'%':'')+'</span></div>'+
  '<div class="zc-f">'+(x.last
   ?'<span>ตรวจล่าสุด '+x.last+'</span><span style="margin-left:auto;color:var(--miss)">NCR '+x.ncr+'</span>'
   :'<span style="color:var(--miss);font-weight:800">ยังไม่ได้ตรวจเลยทั้งเดือน</span>')+'</div></div>').join('')+'</div>';
};


/* ═══ หมวดในหน้าจอ ═══ */
const secOverviewBranch=(C,dev)=>{
 const b=C.br;
 return secHead('ภาพรวมการส่ง','เดือนนี้ส่งครบแค่ไหน · วันไหนขาด','ส.ค. 2569 · 31 วัน')+
 '<div class="three"><span class="m ok"><b>'+b.pOk+'%</b>ส่งครบ'+(C.late?'ตรงเวลา':'')+'</span>'+
 (C.late?'<span class="m lt"><b>'+b.pLt+'%</b>ส่งช้า</span>':'')+
 '<span class="m ms"><b>'+b.pMs+'%</b>ไม่ได้ส่ง</span></div>'+
 '<div class="cd" style="padding:11px 12px">'+
   '<div class="note" style="margin-bottom:10px">ครบทั้งวัน <b>'+b.fullDays+'</b> จาก 31 วัน · ส่งไปแล้ว <b>'+b.sent+'</b> จาก '+b.due+' รอบ · เฉลี่ย <b>1.9</b> รอบ/วัน</div>'+
   (dev==='desk'? calI(C) : cal())+
   '<div style="margin-top:10px">'+legend(C,dev==='desk')+'</div>'+
 '</div>'+
 bench([{l:'สาขานี้',v:b.meV,me:1}].concat(C.key==='yamachan'?[]:[{l:b.zoneName,v:b.zoneV}])
        .concat([{l:'ทั้งแบรนด์',v:b.brandV}]), b.note);
};
const secItemsBranch=(C)=>{
 const b=C.br, I=ITEMS[C.key];
 return secHead('หัวข้อที่ตก · N/A · คะแนนเฉลี่ย','ข้อไหนตกบ่อย ข้อไหนถูกข้ามประจำ')+
 '<div class="three"><span class="m ok"><b>'+b.sc+'</b>คะแนนเฉลี่ย</span>'+
 '<span class="m ms"><b>'+b.fail+'</b>ข้อที่ตก</span><span class="m na"><b>'+b.na+'</b>N/A · '+b.naP+'</span></div>'+
 '<div class="sech sub"><span class="sech-t">หัวข้อที่ตกบ่อย</span><span class="sech-r">'+b.fail+' ข้อ</span></div>'+
 '<div class="cd" style="padding:8px 13px 11px">'+list(I.bf,'f','var(--miss)')+'</div>'+
 '<div class="sech sub"><span class="sech-t">หัวข้อที่ตอบ N/A บ่อย</span><span class="sech-r">'+b.na+' ข้อ</span>'+
   '<span class="sech-d">ข้อที่ข้ามประจำ อาจต้องทบทวน</span></div>'+
 '<div class="cd" style="padding:8px 13px 11px">'+list(I.bn,'a','var(--na)')+'</div>';
};
const secCheckToday=(C)=>
 secHead('เช็คลิสต์วันนี้','กดเพื่อเริ่มตรวจ','อาทิตย์ 31 ส.ค. 2569')+
 '<div class="today"><div class="sh done"><span class="material-symbols-rounded">wb_sunny</span>'+
 '<span class="sh-t">เปิดร้าน</span><span class="sh-s">✓ ส่งแล้ว 10:12 น. · 100%</span></div>'+
 '<div class="sh todo"><span class="material-symbols-rounded">bedtime</span>'+
 '<span class="sh-t">ปิดร้าน</span><span class="sh-s">แตะเพื่อเริ่มตรวจ</span></div></div>'+
 '<div class="note">'+C.cutoffTxt+'</div>';
const secLast7=(C)=>
 secHead('ผลการส่งล่าสุด','ย้อนดูได้ทั้งเดือน หรือเลือกช่วงเอง','7 วัน')+
 '<div class="srch"><input placeholder="🔍 ค้นหาวันที่ / รอบ">'+
 '<select><option>7 วันล่าสุด</option><option>เดือนนี้</option><option>เลือกช่วงเอง…</option></select></div>'+
 d7html()+'<div class="note" style="text-align:center">แสดง 7 วันล่าสุด · เลือกช่วงอื่นได้จากตัวกรองด้านบน</div>';

/* ── หน้าตรวจร้านของเจ๊แดง ──
   ไม่ใช่ "เช็คลิสต์วันนี้" แบบสาขากรอกเอง แต่เป็นการลงพื้นที่ไปตรวจ
   จึงต้องเลือกสาขาก่อน และต้องผ่าน GPS ว่าอยู่หน้าร้านจริง (รัศมี 500 ม.) */
const secCheckJD=(C)=>
 secHead('ลงตรวจร้าน','เลือกสาขาที่จะเข้าตรวจ','อาทิตย์ 31 ส.ค. 2569')+
 '<div class="cd gpsc"><div class="gps-h"><span class="material-symbols-rounded">location_on</span>'+
  '<div><b>บันทึกตำแหน่งแล้ว</b><s>ความแม่นยำ ±18 ม. · ใกล้สุดคือ สามย่านมิตรทาวน์ 120 ม.</s></div>'+
  '<span class="gps-ok">พร้อมตรวจ</span></div></div>'+
 '<div class="srch"><input placeholder="🔍 ค้นหาสาขา"><select><option>เรียงตามระยะทาง</option><option>เรียงตามชื่อ</option></select></div>'+
 '<div class="jdlist">'+
  [['สามย่านมิตรทาวน์','120 ม.',1],['เซ็นทรัลเวิลด์','1.8 กม.',0],['สยามสแควร์ ซ.5','2.1 กม.',0],
   ['เอ็มบีเค เซ็นเตอร์','2.4 กม.',0]].map(x=>
   '<button class="jdi'+(x[2]?' near':'')+'"><span class="jdi-n">'+x[0]+'</span>'+
   '<span class="jdi-d'+(x[2]?'':' far')+'">'+x[1]+'</span>'+
   '<span class="material-symbols-rounded">chevron_right</span></button>').join('')+
 '</div>'+
 /* เกิน 500 ม. แค่เด้งถามยืนยัน ไม่ได้ปิดกั้น (บ. 11673–11686)
    สัญญาณ GPS หยาบ ๆ ก็เตือนได้ทั้งที่ยืนอยู่หน้าร้านจริง ถ้าบล็อกจะตรวจไม่ได้เลย */
 '<div class="cd warnc"><span class="material-symbols-rounded">wrong_location</span>'+
  '<div><b>เลือกสาขาที่ไกลกว่า 500 ม. ได้</b>'+
  '<s>ระบบจะถามยืนยันก่อนว่า “ตรวจสาขานี้จริงหรือไม่” กดยืนยันแล้วตรวจต่อได้ตามปกติ — '+
  'สัญญาณ GPS หยาบ ๆ ก็เตือนได้ทั้งที่ยืนอยู่หน้าร้านจริง</s></div></div>'+
 '<div class="note">ต้องเปิด GPS ถึงจะเริ่มตรวจได้ แต่<b>ระยะห่างไม่ได้ปิดกั้น</b> · '+
   'เดือนนี้ตรวจในรัศมี <b>'+C.gps.inside+'</b> ครั้ง · นอกรัศมีแล้วกดยืนยัน <b>'+C.gps.outside+'</b> ครั้ง</div>';

const secOverviewJD=(C,scope,dev)=>
 secHead('ภาพรวมการลงตรวจ', scope==='ad'?'เดือนนี้ลงตรวจไปกี่ครั้ง · สาขาไหนยังไม่ถูกตรวจ':'โซนนี้ลงตรวจไปกี่ครั้ง · สาขาไหนยังไม่ถูกตรวจ','ส.ค. 2569 · 31 วัน')+
 kpiAudit(C,scope)+
 (dev==='desk'
  ? '<div class="cd" style="padding:11px 12px;margin-top:11px">'+
    '<div class="sech sub" style="margin:-2px 0 9px"><span class="sech-t">ลงตรวจวันไหนบ้าง</span>'+
    '<span class="sech-r">'+C[scope].visits+' ครั้ง · 31 วัน</span></div>'+calVis()+
    '<div class="note" style="margin-top:9px">ศุกร์–เสาร์ไม่มีการลงตรวจ เพราะทีมไม่ลงพื้นที่วันหยุด</div></div>'
  : '');


/* ═══ แบบฟอร์มตรวจจริงของแต่ละแบรนด์ ═══
   ชื่อหมวดและจำนวนข้อ นับจากฟอร์มจริงในโค้ด
   (นับเฉพาะข้อจริง — fillLabel ของข้อที่มีช่องกรอก ไม่ใช่ข้อแยก)

   กติกาแนบรูป
     · ระบบสุ่ม "ต้องแนบรูป" กี่ข้อต่อหมวด ขึ้นกับแบรนด์ → รูปขั้นต่ำ = สุ่มต่อหมวด × จำนวนหมวด
     · ข้อที่ตอบ "ไม่ผ่าน" ต้องแนบรูปเสมอ
     · ข้อที่ตอบ "N/A" ไม่ต้องแนบ แม้จะเป็นข้อที่ถูกสุ่มได้
     · ข้อที่สุ่มได้ผูกกับเรคคอร์ด — กลับมาแก้รอบเดิมได้ข้อเดิม รอบใหม่สุ่มใหม่ กันใช้รูปซ้ำ
     · บางแบรนด์มีข้อที่ยกเว้น — ไม่ถูกสุ่ม และบางชุดตกแล้วก็ไม่ต้องแนบรูป */
const FORMS={
 santafe:{round:'เปิดร้าน',set:'DAILY_OPEN',total:60,pick:1,
  secs:[['จุดเตรียมงาน',11],['PASTA',10],['STEAK',9],['BAR',11],['CASHIER',5],['FOH',14]],
  items:['ห้องสต๊อก ปริมาณ คุณภาพ วันรับเข้า สินค้าและวัตถุดิบ FIFO เป็นระเบียบ',
         'ตู้แช่ต่างๆ ปริมาณ คุณภาพ DRE ความสะอาด อุณหภูมิ',
         'โต๊ะเตรียมและชั้นวาง สะอาด จัดเก็บเป็นระเบียบ ( แยกอุปกรณ์มีคมอย่างชัดเจน )'],
  gps:0,done:7,
  note:'สาขารหัสขึ้นต้น <b>55</b> (ST_Easy) ใช้ฟอร์มย่อคนละชุด — เปิดร้าน 52 ข้อ ปิดร้าน 36 ข้อ'},
 yamachan:{round:'เปิดร้าน',set:'YAMACHAN_OPEN',total:44,pick:5,
  secs:[['ส่วนครัว',23],['ส่วนบริการ',21]],
  items:['เช็คอุณหภูมิตู้เย็นทุกตู้ (อุณหภูมิ 2-5 องศา)',
         'เช็คอุณหภูมิตู้แช่แข็งทุกตู้ (อุณหภูมิ -18 ถึง -25 องศา)',
         'ซอสต่าง ๆ ใส่ภาชนะพร้อมใช้งาน'],
  /* ข้อสุ่มชิมวัตถุดิบ — ยกเว้นทั้งการสุ่มและการแนบรูปตอนตก
     ถ่ายรูปการชิมไม่ได้ความอยู่แล้ว แต่ต้องกรอกว่าชิมอะไร
     ยึดจากข้อความ ไม่ใช่เลขข้อ — แทรกข้อใหม่ในส่วนครัวแล้วกติกาไม่เลื่อนตาม
     และรอบปิดร้านไม่มีข้อขึ้นต้นแบบนี้ จึงไม่มีข้อยกเว้นเองโดยอัตโนมัติ */
  exemptRule:'สุ่มชิมวัตถุดิบ',
  exempt:{no:19,q:'สุ่มชิมวัตถุดิบ — ชนิดที่ 1',fill:'ชื่อวัตถุดิบที่ชิม',
          tag:'ข้อนี้ไม่ต้องแนบรูป'},
  gps:0,done:12,
  note:'ยกเว้นข้อที่ขึ้นต้นว่า <b>“สุ่มชิมวัตถุดิบ”</b> (ตอนนี้มี 5 ข้อในส่วนครัว รอบเปิดร้าน)<br>'+
       'รอบปิดร้าน 2 หมวด 36 ข้อ สุ่มอย่างละ 5 เหมือนกัน และไม่มีข้อยกเว้นเพราะไม่มีข้อขึ้นต้นแบบนี้'},
 jaedaeng:{round:'ตรวจร้าน QSC',set:'JAEDAENG_CHECKLIST',total:64,pick:1,
  secs:[['บริเวณภายในร้าน',17],['บริเวณภายในครัว (ส่วนกลาง)',24],['มาตรฐานทุก Station ในครัว',4],
        ['Station ส้มตำ',4],['Station ย่าง-ทอด',6],['Station ต้ม-ลาบ-น้ำตก-ยำ',3],['ทีมบริหารร้าน',6]],
  items:['บริเวณด้านหน้าร้าน, รอบร้าน, ที่จอดรถ, ทางเดินหน้าร้าน สะอาด และเป็นระเบียบ',
         'ประตูทางเข้าร้าน, กระจก สะอาด และมีสติ๊กเกอร์เวลาเปิด-ปิดร้าน รวมถึงสื่อโฆษณา',
         'ป้ายต่างๆ สะอาด อยู่ในสภาพดี'],
  gps:1,done:9,
  note:'เจ๊แดงมีรายการ <b>ยกเว้นการสุ่ม</b> (JAEDAENG_PHOTO_EXEMPT) — ข้อในรายการนั้นไม่ถูกสุ่ม แต่ถ้าตอบไม่ผ่านก็ยังต้องแนบรูป'},
};
const minPhoto=(f)=>f.pick*f.secs.length;
const secForm=(C)=>{
 const f=FORMS[C.key];
 const pct=Math.round(f.done/f.secs[0][1]*100);
 /* ตัวอย่างเลือกให้ครบทุกกรณีของกติกาแนบรูป
    1 = ผ่าน · 2 = ไม่ผ่าน · 3 = N/A */
 const ROW=[{a:1,pick:1},{a:2,pick:0},{a:3,pick:0}];
 const btn=(k,on)=>'<button class="ch '+k+(on?' on':'')+'">'+
   (k==='p'?'ผ่าน':k==='f'?'ไม่ผ่าน':'N/A')+'</button>';
 /* ไม่ติดป้ายว่าข้อไหนเป็นข้อที่ระบบสุ่มมา — ช่องแนบรูปที่โผล่ขึ้นมาบอกอยู่แล้วว่าข้อนี้ต้องมีรูป
    ป้ายบอกว่า "สุ่มได้" ทำให้คนกรอกรู้ว่าข้อไหนเป็นข้อสุ่ม ซึ่งไม่ได้ช่วยอะไรในการกรอก */
 const item=(no,q,a,pick,tag,photo,fill)=>
  '<div class="fi'+(a===2?' bad':'')+(tag?' exempt':'')+'">'+
   '<div class="fi-q"><span class="fi-n">'+no+'</span><span class="fi-t">'+q+'</span></div>'+
   (fill?'<input class="fi-cm" style="width:100%;margin-bottom:8px" placeholder="'+fill+'" value="กุ้งสด">':'')+
   '<div class="fi-a">'+btn('p',a===1)+btn('f',a===2)+btn('n',a===3)+'</div>'+
   (photo?'<div class="fi-x">'+
     (a===1
      ?'<span class="fi-thumb"><span class="material-symbols-rounded">image</span>IMG_2841.jpg<b>✓</b></span>'
      :'<button class="fi-ph need"><span class="material-symbols-rounded">photo_camera</span>แนบรูป (บังคับ)</button>'+
       '<input class="fi-cm" placeholder="ระบุปัญหาที่พบ">')+
    '</div>'
    :(a===2?'<div class="fi-x"><input class="fi-cm" placeholder="ระบุปัญหาที่พบ"></div>':''))+
   /* ข้อยกเว้น: ตอบไม่ผ่านแล้วไม่มีปุ่มแนบรูป ต้องบอกว่าตั้งใจ ไม่ใช่แอปพัง */
   (tag&&!photo?'<div class="fi-no">'+tag+'</div>':'')+
  '</div>';
 return secHead(f.round, C.sub.branch, f.set+' · '+f.total+' ข้อ')+
 (f.gps?'<div class="cd gpsc" style="margin-bottom:8px"><div class="gps-h">'+
   '<span class="material-symbols-rounded">location_on</span>'+
   '<div><b>บันทึกตำแหน่งแล้ว</b><s>±18 ม. · ห่างจากสาขา 120 ม.</s></div>'+
   '<span class="gps-ok">ในรัศมี</span></div></div>':'')+
 '<div class="fprog"><div class="fprog-h"><b>'+f.done+' / '+f.secs[0][1]+'</b>'+
   '<span>หมวด '+f.secs[0][0]+'</span><s>ทั้งฟอร์ม '+f.total+' ข้อ · '+f.secs.length+' หมวด</s></div>'+
   '<span class="fprog-b"><i style="width:'+pct+'%"></i></span>'+
   '<div class="fprog-p"><span class="material-symbols-rounded">photo_camera</span>'+
     'ต้องแนบรูปอย่างน้อย <b>'+minPhoto(f)+'</b> รูป — ระบบสุ่มมาหมวดละ <b>'+f.pick+'</b> ข้อ</div></div>'+
 '<div class="ftabs">'+f.secs.map((s,i)=>'<button class="ft'+(i===0?' on':'')+'">'+
   '<em>'+s[0]+'</em><span>'+(i===0?f.done+'/'+s[1]:'0/'+s[1])+'</span></button>').join('')+'</div>'+
 '<div class="fitems">'+
  f.items.map((q,i)=>{const r=ROW[i];
    return item(i+1,q,r.a,r.pick,'', (r.pick&&r.a!==3)||r.a===2, 0);}).join('')+
  (f.exempt?item(f.exempt.no,f.exempt.q,2,0,f.exempt.tag,0,f.exempt.fill):'')+
  '<div class="fmore">อีก '+(f.secs[0][1]-f.items.length-(f.exempt?1:0))+' ข้อในหมวดนี้</div>'+
 '</div>'+
 /* ไม่มีคำอธิบายกติกาท้ายฟอร์ม — คนกรอกเห็นจากตัวฟอร์มเองอยู่แล้ว
    ว่าข้อไหนต้องแนบรูป กติกาเต็ม ๆ ไปอยู่ในเอกสารสเปกแทน */
 '<div class="fbar"><button class="fb-s">บันทึกร่าง</button>'+
   '<button class="fb-p">ส่งผลตรวจ</button></div>';
};

/* ═══ ประกอบหน้าจอ ═══ */
const sidebar=(C,role)=>{
 const audit=C.kind==='audit';
 const menu=[['dashboard','แดชบอร์ด',role!=='branch'||!audit],
             [audit?'storefront':'checklist',audit?'ลงตรวจร้าน':'ตรวจร้าน',role==='branch'&&audit]];
 const who = role==='branch' ? C.sub.branch
           : role==='bzm'    ? C.name+' · '+(audit?'พี่กัส':C.key==='yamachan'?'พี่ตั้ม':'พี่ปิ๊ก')+' (BZM)'
                             : C.name+' · กันตภณ (Admin)';
 return '<aside class="side">'+
  '<div class="brandhd"><div class="tile sm">'+C.tile+'</div><div>'+
    '<div class="bn">Operations Checklist</div><div class="bs">'+who+'</div></div></div>'+
  '<div class="lab">เมนู</div>'+
  menu.filter(m=>!(role==='branch'&&audit&&m[0]==='dashboard'))
      .map(m=>'<button class="ni'+(m[2]?' on':'')+'"><span class="material-symbols-rounded">'+m[0]+'</span>'+m[1]+'</button>').join('')+
  (role==='admin'?'<div class="div"></div><div class="lab">แบรนด์</div><div class="seg" data-seg></div>':'')+
  '<div class="sp"></div><div class="div"></div>'+
  '<button class="quiet"><span class="material-symbols-rounded">arrow_back</span>กลับเมนูหลัก</button>'+
  '<button class="quiet"><span class="material-symbols-rounded">logout</span>ออกจากระบบ</button></aside>';
};
const head=(title,sub)=>'<div class="head"><div><h1>'+title+'</h1><div class="sub">'+sub+'</div></div>'+
 '<div style="flex:1"></div><button class="chip"><span class="material-symbols-rounded">calendar_month</span>เดือนนี้</button>'+
 '<button class="chip"><span class="material-symbols-rounded">refresh</span>รีเฟรช</button></div>';

const twoCol=(C,scope)=>{
 const I=ITEMS[C.key], d=C.items[scope];
 return '<div class="two" style="margin-top:12px">'+
  '<div><div class="sech sub"><span class="sech-t">หัวข้อที่ตกบ่อย</span><span class="sech-r">'+d.f+' ข้อ</span></div>'+
   '<section class="cd" style="border-radius:10px"><div class="pad">'+list(I.f,'f','var(--miss)')+'</div></section></div>'+
  '<div><div class="sech sub"><span class="sech-t">หัวข้อที่ตอบ N/A บ่อย</span><span class="sech-r">'+d.na+' ข้อ</span>'+
   '<span class="sech-d">ข้อที่ข้ามประจำ อาจต้องทบทวน</span></div>'+
   '<section class="cd" style="border-radius:10px"><div class="pad">'+list(I.n,'a','var(--na)')+'</div></section></div>'+
 '</div>';
};

function deskScreen(C,role){
 const app=(inner)=>'<div class="app">'+sidebar(C,role)+'<main class="main">'+inner+'</main></div>';
 /* ── เจ๊แดง ── */
 if(C.kind==='audit'){
  if(role==='branch') return app(
   head('ลงตรวจร้าน','<b>เจ๊แดงไม่มีแดชบอร์ดฝั่งสาขา</b> — สาขาเปิดฟอร์มตรวจได้อย่างเดียว')+
   '<div class="cd why"><span class="material-symbols-rounded">info</span>'+
    '<div><b>ทำไมสาขาเจ๊แดงไม่มีแดชบอร์ด</b>'+
    '<s>ซานตาเฟ่กับยามะจัง สาขากรอกเช็คลิสต์เอง จึงมีสถิติของตัวเองให้ดู · '+
    'ส่วนเจ๊แดงเป็นการตรวจร้านโดย BZM ที่ลงพื้นที่ ไม่มีรอบ ไม่มียอดส่งของสาขา สิทธิ์ดูแดชบอร์ดจึงมีแค่ BZM ขึ้นไป</s></div></div>'+
   secCheckJD(C));
  const scope = role==='admin'?'ad':'bzm';
  return app(
   head('แดชบอร์ด',C.name+' · '+C.sub[role==='admin'?'admin':'bzm']+' · 31 วัน')+
   secOverviewJD(C,scope,'desk')+
   secHead(scope==='ad'?'รายโซน':'รายสาขาในโซน',scope==='ad'?'โซนไหนตรวจครอบคลุมแล้ว โซนไหนยังไม่ทั่ว':'เรียงตามคะแนน · สาขาที่ยังไม่ถูกตรวจอยู่ท้ายสุด',
           scope==='ad'?'5 โซน':'11 สาขา')+
   '<section class="cd" style="border-radius:10px"><div class="pad">'+tableJD(scope)+'</div></section>'+
   secHead('ข้อไม่ผ่านที่พบบ่อย','ข้อไหนตกซ้ำ ๆ ทั้งแบรนด์',C[scope].ncr+' ข้อ')+
   '<section class="cd" style="border-radius:10px"><div class="pad">'+list(NCR_JD,'f','var(--miss)')+'</div></section>');
 }
 /* ── ซานตาเฟ่ / ยามะจัง ── */
 if(role==='branch') return app(
  head('แดชบอร์ด',C.sub.branch+' · ส.ค. 2569')+
  '<div class="colx">'+secOverviewBranch(C,'desk')+'</div>'+
  secHead('หัวข้อที่ตก · N/A · คะแนนเฉลี่ย','ข้อไหนตกบ่อย ข้อไหนถูกข้ามประจำ')+
  '<div class="three" style="margin-bottom:13px"><span class="m ok"><b>'+C.br.sc+'</b>คะแนนเฉลี่ย</span>'+
    '<span class="m ms"><b>'+C.br.fail+'</b>ข้อที่ตก</span><span class="m na"><b>'+C.br.na+'</b>N/A · '+C.br.naP+'</span></div>'+
  '<div class="two">'+
    '<div><div class="sech sub"><span class="sech-t">หัวข้อที่ตกบ่อย</span><span class="sech-r">'+C.br.fail+' ข้อ</span></div>'+
      '<section class="cd" style="padding:9px 14px 12px">'+list(ITEMS[C.key].bf,'f','var(--miss)')+'</section></div>'+
    '<div><div class="sech sub"><span class="sech-t">หัวข้อที่ตอบ N/A บ่อย</span><span class="sech-r">'+C.br.na+' ข้อ</span>'+
      '<span class="sech-d">ข้อที่ข้ามประจำ อาจต้องทบทวน</span></div>'+
      '<section class="cd" style="padding:9px 14px 12px">'+list(ITEMS[C.key].bn,'a','var(--na)')+'</section></div>'+
  '</div>');
 const scope = role==='admin'?'ad':'bzm';
 return app(
  head('แดชบอร์ด',C.name+' · '+C.sub[role==='admin'?'admin':'bzm']+' · 31 วัน')+
  secHead('ภาพรวมการส่ง', scope==='ad'?'ทั้งแบรนด์ส่งครบแค่ไหน · '+(C.key==='yamachan'?'สาขาไหนต้องตาม':'โซนไหนต้องตาม')
                                      :(C.key==='yamachan'?'ยามะจังมีโซนเดียว BZM จึงเห็นเท่ากับทั้งแบรนด์':'โซนนี้ส่งครบแค่ไหน · สาขาไหนต้องตาม'),
          'เดือนนี้ · 31 วัน')+kpiSend(C,scope)+
  (scope==='bzm'&&C.key!=='yamachan' ? bench([{l:'โซนนี้',v:C.bzm.v,me:1},{l:'ทั้งแบรนด์',v:C.tot.ad.on}],C.bzm.note) : '')+
  secHead(titleOf(C,scope),'เรียงจากที่ต้องตามก่อน',countOf(C,scope))+
  '<section class="cd" style="border-radius:10px"><div class="pad">'+tableSend(C,scope)+'</div></section>'+
  secHead('หัวข้อที่ตก · N/A · คะแนนเฉลี่ย','ข้อไหนตกบ่อย ข้อไหนถูกข้ามประจำ')+kpi3items(C,scope)+twoCol(C,scope));
}


function mobScreen(C,role,page){
 const audit=C.kind==='audit';
 const nav=(a,b)=>'<nav class="nav">'+
  (role==='branch'&&audit?'':'<button class="ni2'+(a?' on':'')+'"><span class="material-symbols-rounded">dashboard</span>แดชบอร์ด</button>')+
  '<button class="ni2'+(b?' on':'')+'"><span class="material-symbols-rounded">'+(audit?'storefront':'checklist')+'</span>'+(audit?'ลงตรวจ':'ตรวจร้าน')+'</button>'+
  '<button class="ni2"><span class="material-symbols-rounded">apps</span>เมนูหลัก</button></nav>';
 const hd=(sub)=>'<div class="hd"><div class="tile">'+C.tile+'</div><div>'+
  '<div class="hd-t">Operations Checklist</div><div class="hd-b">'+sub+'</div></div>'+
  '<span class="material-symbols-rounded" style="margin-left:auto;color:var(--ink-3)">expand_more</span></div>';
 const wrap=(sub,body,a,b)=>'<div class="mscr">'+hd(sub)+'<div class="body">'+body+'</div>'+nav(a,b)+'</div>';

 if(audit){
  if(role==='branch') return wrap(C.sub.branch, page==='form' ? secForm(C) :
   '<div class="cd why sm"><span class="material-symbols-rounded">info</span>'+
    '<div><b>สาขาเจ๊แดงไม่มีแดชบอร์ด</b><s>เป็นการตรวจโดย BZM ที่ลงพื้นที่ ไม่มีรอบส่งของสาขา</s></div></div>'+
   secCheckJD(C),0,1);
  const scope=role==='admin'?'ad':'bzm';
  return wrap(C.name+' · '+C.sub[role==='admin'?'admin':'bzm'],
   secOverviewJD(C,scope,'mob')+
   secHead(scope==='ad'?'รายโซน':'รายสาขาในโซน','สาขาที่ยังไม่ถูกตรวจอยู่ท้ายสุด',scope==='ad'?'5 โซน':'11 สาขา')+cardsJD(scope)+
   secHead('ข้อไม่ผ่านที่พบบ่อย','ข้อไหนตกซ้ำ ๆ',C[scope].ncr+' ข้อ')+
   '<div class="cd" style="padding:8px 13px 11px">'+list(NCR_JD.slice(0,3),'f','var(--miss)')+'</div>',1,0);
 }
 if(role==='branch'){
  const body = page==='form'  ? secForm(C)
             : page==='check' ? secCheckToday(C)+secLast7(C)
                              : secOverviewBranch(C,'mob')+secItemsBranch(C);
  return wrap(C.sub.branch,body,page==='dash',page!=='dash');
 }
 const scope = role==='admin'?'ad':'bzm';
 const I=ITEMS[C.key], d=C.items[scope];
 return wrap(C.name+' · '+C.sub[role==='admin'?'admin':'bzm'],
  secHead('ภาพรวมการส่ง','',C.sub[role==='admin'?'admin':'bzm'].split(' · ')[0]+' · 31 วัน')+kpiSend(C,scope)+
  (scope==='bzm'&&C.key!=='yamachan'
    ? bench([{l:'โซนนี้',v:C.bzm.v,me:1},{l:'ทั้งแบรนด์',v:C.tot.ad.on}],'ต่ำกว่าค่าเฉลี่ยแบรนด์ <b>11.6 จุด</b>') : '')+
  secHead(titleOf(C,scope),'เรียงจากที่ต้องตามก่อน',countOf(C,scope))+cardsSend(C,scope)+
  secHead('หัวข้อที่ตก · N/A · คะแนน','ข้อไหนตกบ่อย ข้อไหนถูกข้ามประจำ')+kpi3items(C,scope)+
  '<div class="sech sub"><span class="sech-t">หัวข้อที่ตกบ่อย</span><span class="sech-r">'+d.f+' ข้อ</span></div>'+
  '<div class="cd" style="padding:8px 13px 11px">'+list(I.f.slice(0,3),'f','var(--miss)')+'</div>'+
  '<div class="sech sub"><span class="sech-t">หัวข้อที่ตอบ N/A บ่อย</span><span class="sech-r">'+d.na+' ข้อ</span></div>'+
  '<div class="cd" style="padding:8px 13px 11px">'+list(I.n.slice(0,3),'a','var(--na)')+'</div>',1,0);
}

/* ═══ วางลงหน้า ═══
   แต่ละแบรนด์มีชุดหน้าจอของตัวเอง เพราะโครงไม่เหมือนกัน
   ไม่ใช่หน้าเดียวแล้วเปลี่ยนสี — เจ๊แดงไม่มีแดชบอร์ดสาขาด้วยซ้ำ */
const ROLES=(C)=>[
 {id:'branch',label:'สาขา',
  note:C.kind==='audit'?'เปิดฟอร์มตรวจได้ แต่ไม่มีแดชบอร์ด (สิทธิ์ view-jd-dash ไม่รวม branch)'
                       :'เห็นเฉพาะสาขาตัวเอง · ไม่มีปุ่มสลับแบรนด์',
  mob:C.kind==='audit'?['check','form']:['dash','check','form']},
 {id:'bzm',label:'BZM',
  note:C.kind==='audit'?'เห็นสาขาในโซนตัวเอง (ตัวอย่าง: พี่กัส 11 สาขา)'
       :C.key==='yamachan'?'ยามะจังมีโซนเดียว BZM จึงเห็นเท่ากับทั้งแบรนด์'
                          :'เห็นเฉพาะสาขาในโซนตัวเอง (ตัวอย่าง: พี่ปิ๊ก 10 สาขา)',
  mob:['dash']},
 {id:'admin',label:'แอดมิน / ผู้บริหาร',note:'เห็นทุกสาขา ทุกโซน · สลับแบรนด์ได้',mob:['dash']},
];
const host=document.getElementById('rows');
host.innerHTML = BRANDS.map(C=>
 '<div data-brand="'+C.key+'" hidden>'+
  (C.real?'':'<div class="fake">ตัวเลขของ '+C.name+' เป็น<b>ตัวอย่าง</b> — โครงหน้าจอถูกต้องตามเงื่อนไขจริงในโค้ด แต่ยังไม่ได้ต่อข้อมูลจริง · '+C.cutoffTxt+'</div>')+
  ROLES(C).map(r=>
  '<section class="rowsec">'+
   '<div class="rowh"><span class="rk">'+r.label+'</span><span class="rn">'+r.note+'</span></div>'+
   '<div class="rowbody">'+
     '<div class="unit"><div class="ul">จอคอม 1400px</div><div class="frame"><div class="stage v" data-v data-desk="'+C.key+'-'+r.id+'">'+deskScreen(C,r.id)+'</div></div></div>'+
     r.mob.map(p=>'<div class="unit"><div class="ul">มือถือ 430px · '+(p==='form'?'ฟอร์มตรวจ':p==='check'?(C.kind==='audit'?'ลงตรวจร้าน':'ตรวจร้าน'):'แดชบอร์ด')+'</div>'+
       '<div class="phone"><div class="v" data-v data-mob="'+C.key+'-'+r.id+'-'+p+'">'+mobScreen(C,r.id,p)+'</div></div></div>').join('')+
   '</div></section>').join('')+
 '</div>').join('');

function paint(b){
 document.querySelectorAll('[data-brand]').forEach(d=>{d.hidden = d.dataset.brand!==b.key;});
 document.querySelectorAll('[data-v]').forEach(v=>v.style.setProperty('--brand',b.color));
 document.querySelectorAll('.pk').forEach(p=>p.classList.toggle('on',p.dataset.k===b.key));
 document.querySelectorAll('.bl').forEach(x=>x.classList.toggle('on',x.dataset.k===b.key));
 fit();
}
const pEl=document.getElementById('picker');
BRANDS.forEach(b=>{const e=document.createElement('button');e.className='pk';e.dataset.k=b.key;
 e.innerHTML='<i style="background:'+b.color+'"></i>'+b.short;e.onclick=()=>paint(b);pEl.appendChild(e);});
document.querySelectorAll('[data-seg]').forEach(seg=>{
 BRANDS.forEach(b=>{const e=document.createElement('button');e.className='bl';e.dataset.k=b.key;
  e.innerHTML='<i style="background:'+b.color+'"></i>'+b.short;e.onclick=()=>paint(b);seg.appendChild(e);});});

function fit(){
 document.querySelectorAll('.frame').forEach(f=>{
  const s=f.querySelector('.stage'); if(!s||!f.clientWidth) return;
  const k=f.clientWidth/1400; s.style.transform='scale('+k+')'; f.style.height=(s.scrollHeight*k)+'px';});
}
window.addEventListener('resize',fit); document.fonts.ready.then(fit); setTimeout(fit,300);
paint(BRANDS[0]);


/* ── โหมดชี้จุด ──
   รูปที่ส่งมาคุยกันไม่ผ่านระบบ เลยครอบกรอบสีให้ทุกบล็อก พร้อมเลขกำกับ
   กรอบบอก "ขอบเขต" ของบล็อกด้วย ไม่ใช่แค่จุดมุมเดียวที่เดาไม่ออกว่าครอบถึงไหน */
(function markers(){
 const COLORS=['#2563EB','#DC2626','#059669','#7C3AED','#EA580C','#0891B2','#BE185D','#65A30D'];
 const bar=document.createElement('div');
 bar.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99';
 const btn=document.createElement('button');
 btn.textContent='ครอบกรอบสี';
 btn.style.cssText='border:1px solid #14161A;background:#14161A;color:#fff;border-radius:999px;'+
  'padding:10px 18px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;'+
  'box-shadow:0 8px 20px -8px rgba(16,24,40,.5)';
 bar.appendChild(btn); document.body.appendChild(bar);
 let on=false;
 const SEL=['.sech','.three','.kA','.g7','.mo-g','.cd.bmk','.zh','.zlist','.today','.d7','.srch',
            '.side','.head','.kpis','.hd','.nav'];
 btn.onclick=()=>{
  on=!on;
  document.querySelectorAll('.mk').forEach(e=>e.remove());
  if(!on){ btn.textContent='ครอบกรอบสี'; return; }
  let n=0;
  document.querySelectorAll('.rowsec').forEach(sec=>{
   const who=sec.querySelector('.rk').textContent;
   sec.querySelectorAll('.frame,.phone').forEach(unit=>{
    const dev=unit.classList.contains('phone')?'มือถือ':'คอม';
    const host=unit.closest('.unit')||unit.parentElement;
    if(getComputedStyle(host).position==='static') host.style.position='relative';
    const hr=host.getBoundingClientRect();
    SEL.forEach(sel=>unit.querySelectorAll(sel).forEach(el=>{
     const r=el.getBoundingClientRect(); if(r.width<24||r.height<12) return;
     n++;
     const col=COLORS[(n-1)%COLORS.length];
     const box=document.createElement('div');
     box.className='mk';
     box.title=n+' = '+who+' · '+dev;
     box.style.cssText='position:absolute;z-index:9;pointer-events:none;border-radius:8px;'+
      'border:2px solid '+col+';background:'+col+'14;'+
      'left:'+(r.left-hr.left)+'px;top:'+(r.top-hr.top)+'px;'+
      'width:'+r.width+'px;height:'+r.height+'px';
     const tag=document.createElement('span');
     tag.textContent=n;
     tag.style.cssText='position:absolute;left:-2px;top:-11px;background:'+col+';color:#fff;'+
      'font-family:Sarabun,sans-serif;font-size:11px;font-weight:800;min-width:18px;height:18px;'+
      'border-radius:5px;display:grid;place-items:center;padding:0 4px;line-height:1';
     box.appendChild(tag); host.appendChild(box);
    }));
   });
  });
  btn.textContent='เอากรอบออก ('+n+' กรอบ)';
 };
})();
