/**
 * Santa Fe Daily BOT — แจ้งเตือน Telegram สำหรับเช็คลิสต์รายวัน (เปิด/ปิดร้าน) ฝั่งซานตาเฟ่
 *
 * ทำ 2 อย่าง:
 *   ①  doPost()  — รับข้อมูลจากแอปทันทีที่สาขาส่งผลตรวจที่ "มีข้อไม่ผ่าน" → ส่งเข้ากลุ่ม
 *   ②  reportOpen()/reportClose() — ตั้งเวลา 11:30 (เปิด) และ 22:00 (ปิด)
 *        อ่านผลตรวจวันนี้จาก Firestore แล้วสรุป:
 *          - รายชื่อสาขาที่ "ยังไม่ส่ง" รอบนั้น
 *          - สาขาที่ "มีข้อไม่ผ่าน" + จำนวนข้อ (พร้อมรายละเอียด)
 *
 * ── ติดตั้ง (ทำครั้งเดียว) ─────────────────────────────────────────────
 * 1) Project Settings → Time zone = (GMT+07:00) Bangkok
 * 2) Project Settings → Script Properties เพิ่ม 4 ค่า:
 *      BOT_TOKEN         = โทเคนบอท Telegram (จาก @BotFather)
 *      CHAT_ID           = id กลุ่มซานตาเฟ่ (เช่น -1001234567890)
 *      FB_CLIENT_EMAIL   = อีเมล service account   ─┐ ก๊อปจากโปรเจค
 *      FB_PRIVATE_KEY    = กุญแจส่วนตัวของ service account ─┘ Telegram Notify Checklist JD
 *
 *    ตั้งแต่ 7 ก.ย. 2569 ฐานข้อมูลล็อกกฎเป็น "ต้องล็อกอินก่อน" แล้ว
 *    FIREBASE_API_KEY เปล่า ๆ จะโดนปฏิเสธ (403) ต้องใช้ service account เท่านั้น
 *    ถ้าไม่ได้ตั้งสองค่านี้ บอทจะรายงานว่าทุกสาขาไม่ส่ง ทั้งที่ส่งครบ
 *    ซึ่งผิดในทางที่อันตรายกว่าเงียบไปเฉย ๆ — ตรวจได้ด้วย testReportOpen()
 *    (PROJECT_ID ตั้งค่าเริ่มต้นเป็น checklist-a89e2 แล้ว — แก้ด้านล่างถ้าเปลี่ยนโปรเจกต์)
 * 3) Deploy → New deployment → Web app
 *      Execute as = Me · Who has access = Anyone
 *      คัดลอก URL ที่ลงท้าย /exec ไปวางในตัวแปร SF_TG_NOTIFY_URL ใน index.html
 * 4) รันฟังก์ชัน setupTriggers() หนึ่งครั้ง (กดอนุญาตสิทธิ์) → สร้างทริกเกอร์ 11:30 และ 22:00 ให้อัตโนมัติ
 * 5) ทดสอบ: รัน testReportOpen() / testReportClose() ดูว่าข้อความเข้ากลุ่มถูกต้อง
 * ─────────────────────────────────────────────────────────────────────
 */

var PROJECT_ID = 'checklist-a89e2';
var COLLECTION = 'dailyChecklists';
var TZ = 'Asia/Bangkok';

// รายชื่อสาขา Santa Fe — ต้อง sync กับ BRANCHES ใน index.html ถ้ามีการเพิ่ม/ลดสาขา
var BRANCHES = [
  ['5001','แฟชั่น ไอส์แลนด์'],['5002','ซีคอนสแควร์ ศรีนครินทร์'],['5003','เดอะมอลล์ ท่าพระ'],
  ['5005','เดอะมอลล์ บางกะปิ'],['5007','เซ็นทรัลพลาซา พระราม 2'],
  ['5010','แพชชั่น ระยอง'],['5011','เดอะมอลล์ งามวงศ์วาน'],['5012','โลตัส บางพลี'],
  ['5014','บิ๊กซี พัทยากลาง'],['5015','แปซิฟิกพาร์ค ศรีราชา'],
  ['5016','อิมพีเรียลเวิลด์ สำโรง'],['5017','ซีคอน บางแค'],['5018','เซ็นทรัล รามอินทรา'],
  ['5019','เทอร์มินัล 21 อโศก'],['5021','เซ็นทรัล ปิ่นเกล้า'],['5023','บิ๊กซี พัทยาใต้'],
  ['5024','เดอะมอลล์ บางแค'],['5026','IT หลักสี่'],
  ['5028','โลตัส ปทุมธานี'],['5030','เพลินนารี่ มอลล์'],['5031','เซ็นทรัล ศาลายา'],
  ['5033','โลตัส แจ้งวัฒนะ'],['5034','โลตัส ศาลายา'],['5035','เซ็นทรัลพัทยา บีช'],
  ['5036','โลตัส บางปะกอก'],['5038','เซ็นทรัล ระยอง'],['5039','เซ็นทรัล ชลบุรี'],
  ['5040','เซ็นทรัล Westgate'],['5042','ฟิวเจอร์ปาร์ค รังสิต'],
  ['5045','Promenade'],['5046','โลตัส บางกะปิ'],
  ['5049','โลตัส ชลบุรี'],['5050','บิ๊กซี บางพลี'],
  ['5052','โลตัส นวนคร'],['5054','บิ๊กซี บางใหญ่'],['5055','โลตัส สุขาภิบาล 3'],
  ['5057','โลตัส รังสิต'],['5061','บิ๊กซี สัตหีบ'],['5062','โรบินสัน ชลบุรี'],
  ['5063','โลตัส พนัสนิคม'],['5064','เทอร์มินอล พัทยา'],['5065','เกตเวย์ เอกมัย'],
  ['5066','เกตเวย์ บางซื่อ'],['5068','คอสโม บาร์ซา'],['5069','โลตัส พัฒนาการ'],
  ['5070','พันทิพย์ งามวงศ์วาน'],['5071','โลตัส จรัญสนิทวงศ์'],['5072','โลตัส สุขาภิบาล 1'],
  ['5073','โลตัส ลาดพร้าว'],['5076','บิ๊กซี ติวานนท์'],
  ['5077','เทอมินัล โคราช'],
  ['5080','โลตัส แกลง ระยอง'],['5082','มาเก็ตเพลส วงศ์สว่างเซ็นเตอร์'],
  ['5084','เทอมินัล 21 พระราม 3'],['5085','ICS ไอคอนสยาม'],['5087','ศูนย์การประชุมแห่งชาติสิริกิติ์'],
  ['5088','สยาม สแควร์'],['5090','S Oasis'],
  ['5091','ปตท.เกษรนวมินทร์'],['5504','โลตัสวังหิน'],['5505','โลตัสเลียบคลองสอง'],
  ['5508','รพ.วชิระพยาบาล'],['5509','โลตัส นครอินทร์']
];

// ───────────────────────── ① รับ POST ตอนสาขาส่ง (มีข้อไม่ผ่าน) ─────────────────────────
function doPost(e) {
  try {
    var r = JSON.parse(e.postData.contents);
    var shiftTxt = r.shift === 'close' ? '🌙 รอบปิดร้าน (Close)' : '🌅 รอบเปิดร้าน (Open)';
    var lines = [];
    lines.push('🔴 <b>พบข้อไม่ผ่าน — Santa Fe</b>');
    lines.push(shiftTxt);
    lines.push('🏢 ' + esc(r.storeName || (r.branchCode + ' ' + (r.branchName || ''))));
    if (r.submittedByName) lines.push('👤 ผู้ตรวจ: ' + esc(r.submittedByName));
    if (r.bzm) lines.push('👔 ผจก.เขต: ' + esc(r.bzm));
    lines.push('🕐 ' + esc(r.date || '') + (r.time ? ' ' + esc(r.time) + ' น.' : ''));
    if (r.late) lines.push('⏰ <b>ตรวจช้า</b>' + (r.lateReason ? ': ' + esc(r.lateReason) : ''));
    lines.push('❌ ไม่ผ่าน <b>' + (r.failCount || 0) + '</b> ข้อ  (ผ่าน ' + (r.passCount || 0) +
               ' · N/A ' + (r.naCount || 0) + ' · ทั้งหมด ' + (r.totalCount || 0) + ')');
    lines.push('━━━━━━━━━━━━━━');
    (r.failed || []).forEach(function (f, i) {
      lines.push((i + 1) + ') [' + esc(f.section || '') + '] ข้อ ' + (f.num || '') + ': ' + esc(f.text || ''));
      if (f.note) lines.push('   ↳ เหตุผล: ' + esc(f.note));
    });
    var text = lines.join('\n');
    var photos = (r.photos || []).filter(function (u) { return typeof u === 'string' && /^https?:\/\//.test(u); });
    if (photos.length) sendPhotos(photos, text);
    else sendMessage(text);
    return ok();
  } catch (err) {
    sendMessage('⚠️ Santa Fe BOT doPost error: ' + err);
    return ok();
  }
}

// ───────────────────────── ② สรุปตามรอบเวลา (11:30 / 22:00) ─────────────────────────
function reportOpen()  { buildRoundReport('open'); }
function reportClose() { buildRoundReport('close'); }

function buildRoundReport(shift) {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var docs;
  try {
    docs = queryDailyByDate(today).filter(function (d) { return !d.deleted && d.shift === shift; });
  } catch (err) {
    sendMessage('⚠️ Santa Fe BOT อ่านข้อมูลจาก Firestore ไม่สำเร็จ — <b>ยังไม่รู้ว่าสาขาไหนส่ง/ไม่ส่ง</b>\n' +
                'สาเหตุ: ' + esc(String(err)) + '\n' +
                '(ถ้าเป็น RESOURCE_EXHAUSTED/Quota = โควตาอ่านฟรีหมด · หรือเช็ค FIREBASE_API_KEY / Security Rules)');
    return;
  }

  var submitted = {};              // branchCode → doc
  docs.forEach(function (d) { if (d.branchCode) submitted[String(d.branchCode)] = d; });

  var roster = getBranchRoster();  // รายชื่อสาขาจาก Firestore (sync กับแอป) · fallback = ลิสต์ฝังในสคริปต์
  var notSent = roster.filter(function (b) { return !submitted[b[0]]; });

  var fails = [];                  // {code,name,items[],date}
  docs.forEach(function (d) {
    var f = (d.items || []).filter(function (it) { return it && it.status === 'fail'; });
    if (f.length) fails.push({ code: d.branchCode, name: d.branchName, items: f, date: d.date });
  });

  // ── ข้อความสรุปหลัก: รายชื่อสาขาที่ยังไม่ส่ง + ยอดรวม ──
  var head = shift === 'close' ? '🌙 <b>สรุปเช็คลิสต์รอบปิด (Close)</b>' : '🌅 <b>สรุปเช็คลิสต์รอบเปิด (Open)</b>';
  var roundTxt = shift === 'close' ? 'รอบปิด' : 'รอบเปิด';
  var timeTxt = shift === 'close' ? '22:00' : '11:30';
  var L = [];
  L.push(head);
  L.push('📅 ' + today + '   ⏰ ' + timeTxt + ' น.');
  L.push('');
  L.push('❌ <b>ยังไม่ส่ง (' + notSent.length + '/' + roster.length + ' สาขา)</b>');
  if (notSent.length) notSent.forEach(function (b) { L.push('• ' + b[0] + ' ' + esc(b[1])); });
  else L.push('🎉 ส่งครบทุกสาขา');
  L.push('');
  L.push('⚠️ <b>สาขาที่มีข้อไม่ผ่าน: ' + fails.length + ' สาขา</b>' + (fails.length ? ' (รายละเอียดแยกด้านล่าง 👇)' : ''));
  L.push('📊 ส่งแล้ว ' + docs.length + '/' + roster.length + ' สาขา');
  sendLong(L.join('\n'));

  // ── แยกส่งรายสาขาที่มีข้อไม่ผ่าน เป็นข้อความละสาขา พร้อมรูปหลักฐาน ──
  fails.forEach(function (fx) {
    var C = [];
    C.push('🏢 <b>' + fx.code + ' ' + esc(fx.name || '') + '</b>');
    C.push((shift === 'close' ? '🌙 ' : '🌅 ') + roundTxt + ' · 📅 ' + esc(fx.date || today));
    C.push('❌ ไม่ผ่าน <b>' + fx.items.length + '</b> ข้อ');
    C.push('━━━━━━━━━━━━━━');
    var photos = [];
    fx.items.forEach(function (it, i) {
      C.push((i + 1) + ') [' + esc(it.section || '') + '] ข้อ ' + (it.num || '') + ': ' + esc(it.text || ''));
      if (it.note) C.push('   ↳ ' + esc(it.note));
      (it.photos || []).forEach(function (u) { if (typeof u === 'string' && /^https?:\/\//.test(u)) photos.push(u); });
    });
    photos = photos.filter(function (u, i, a) { return a.indexOf(u) === i; }).slice(0, 10);
    var caption = C.join('\n');
    if (photos.length) sendPhotos(photos, caption);
    else sendLong(caption);
    Utilities.sleep(1200); // เว้นจังหวะกัน Telegram limit เมื่อมีหลายสาขา
  });
}

// ───────────────────────── Firestore REST (อ่านอย่างเดียว) ─────────────────────────

/* สิทธิ์เข้า Firestore

   เดิมใช้ FIREBASE_API_KEY เปล่า ๆ ซึ่งใช้ได้เพราะกฎเปิดให้ทุกคนอ่าน
   พอล็อกกฎเป็น "ต้องล็อกอินก่อน" คีย์เปล่าจะถูกปฏิเสธ แล้วบอทจะรายงานว่า
   ทุกสาขาไม่ส่ง ทั้งที่ส่งครบ — ผิดในทางที่อันตรายกว่าเงียบไปเฉย ๆ

   จึงเปลี่ยนมาใช้ service account เดียวกับสคริปต์ Telegram
   (Script properties: FB_CLIENT_EMAIL / FB_PRIVATE_KEY)
   ยังไม่ได้ตั้ง = ถอยไปใช้คีย์เดิม ทำงานได้จนกว่ากฎจะเปลี่ยน */
function _fbToken() {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('FB_CLIENT_EMAIL');
  var key = (props.getProperty('FB_PRIVATE_KEY') || '').replace(/[\\]n/g, String.fromCharCode(10));
  if (!email || !key) return '';

  var cache = CacheService.getScriptCache();
  var hit = cache.get('sfbot_token');
  if (hit) return hit;

  var now = Math.floor(Date.now() / 1000);
  var enc = function (o) { return Utilities.base64EncodeWebSafe(JSON.stringify(o)).replace(/=+$/, ''); };
  var toSign = enc({ alg: 'RS256', typ: 'JWT' }) + '.' + enc({
    iss: email, scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  var jwt = toSign + '.' + Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(toSign, key)).replace(/=+$/, '');

  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt } });
  var data = JSON.parse(res.getContentText() || '{}');
  if (!data.access_token) throw new Error('ขอโทเคน service account ไม่สำเร็จ: ' + res.getContentText().slice(0, 200));
  cache.put('sfbot_token', data.access_token, 3300);
  return data.access_token;
}
function _fbAuth(url) {
  var t = _fbToken();
  if (t) return { url: url, headers: { Authorization: 'Bearer ' + t } };
  var key = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');
  return { url: url + (url.indexOf('?') >= 0 ? '&' : '?') + 'key=' + key, headers: {} };
}
function queryDailyByDate(dateStr) {
  var a = _fbAuth('https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
                  '/databases/(default)/documents:runQuery');
  var body = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: dateStr } } }
    }
  };
  var res = UrlFetchApp.fetch(a.url, {
    method: 'post', contentType: 'application/json', headers: a.headers,
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var arr = JSON.parse(res.getContentText());
  if (!Array.isArray(arr)) throw new Error(res.getResponseCode() + ' ' + res.getContentText().slice(0, 300));
  var out = [];
  arr.forEach(function (row) {
    // Firestore ห่อ error ไว้ในอาเรย์ (เช่น 429 Quota exceeded) → ต้องโยน ไม่งั้นจะนับเป็น "0 ข้อมูล" = แจ้งว่าทุกสาขาไม่ส่ง
    if (row && row.error) throw new Error((row.error.status || row.error.code || 'ERROR') + ': ' + (row.error.message || JSON.stringify(row.error)));
    if (row && row.document) out.push(decodeDoc(row.document.fields));
  });
  return out;
}

// รายชื่อสาขาจาก Firestore (appConfig/sfBranches) — sync กับที่แอปจัดการ · fallback = BRANCHES ที่ฝังไว้
/* รายชื่อสาขา — ฮับคือแหล่งกลาง

   แอปเช็คลิสต์ย้ายมาอ่านจากฮับตั้งแต่ต้น (⚙️ → 🏪 จัดการสาขา) แต่บอทยังค้าง
   อยู่ที่ Firestore ซึ่งเป็นแหล่งสำรองเก่า ผลคือปิดสาขาในฮับแล้วบอทยังทวงอยู่
   ทำให้ตัวเลข "ยังไม่ส่ง x/74" ผิด และคนอ่านสรุปทุกเช้าเชื่อผิดตามไปด้วย

   ลำดับแหล่งข้อมูลเดียวกับแอปเป๊ะ ๆ:
     1) ฮับ        — ของจริง แก้ที่เดียวเห็นตรงกันทุกระบบ
     2) Firestore  — สำรอง เผื่อฮับล่ม
     3) ลิสต์ในสคริปต์ — ด่านสุดท้าย กันบอทเงียบ

   สาขาที่ปิดแล้วถูกตัดออกทุกทาง เพราะบอทใช้รายชื่อนี้เพื่อ "ทวงคนที่ยังไม่ส่ง"
   สาขาที่ปิดไม่มีใครส่งอยู่แล้ว ทวงไปก็ไม่มีความหมาย
   (แอปยังเก็บสาขาปิดไว้ในลิสต์ เพราะต้องแปลงรหัสเป็นชื่อในรายงานย้อนหลัง
    แต่บอทไม่ต้องใช้ จึงตัดทิ้งตั้งแต่ตรงนี้เลย) */
var HUB_CONFIG_URL = 'https://script.google.com/macros/s/AKfycbyjGvhSuDrnnOkWdwoq4CsR5jM3__lp58ZWe_BjcrxDIoOtnlFaiEdKUXX10EANUFCRXA/exec';

/* เก็บเฉพาะรหัสของซานตาเฟ่ — ฮับมีทุกแบรนด์ปนกันในก้อนเดียว
   40xx = เจ๊แดง · 60xx = ยามะจัง · 50xx กับ 55xx = ซานตาเฟ่ */
function _isSantaFeCode(code) {
  var c = String(code);
  return c.indexOf('50') === 0 || c.indexOf('55') === 0;
}

function _rosterFromHub() {
  var res = UrlFetchApp.fetch(HUB_CONFIG_URL + '?action=config&_=' + Date.now(),
    { muteHttpExceptions: true, followRedirects: true });
  if (res.getResponseCode() !== 200) return null;
  var j = JSON.parse(res.getContentText() || '{}');
  if (!j || !j.ok || !j.branches || !j.branches.branches) return null;
  var names = j.branches.branches, st = j.branches.statusMap || {};
  var out = [];
  for (var code in names) {
    if (!_isSantaFeCode(code)) continue;
    if (st[code] === 'closed') continue;          /* ปิดสาขาแล้ว ไม่ต้องทวง */
    out.push([String(code), names[code] || '']);
  }
  /* เรียงตามรหัส ให้รายชื่อในข้อความออกมาลำดับเดิมทุกวัน อ่านซ้ำแล้วไม่สับสน */
  out.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  return out.length ? out : null;
}

function _rosterFromFirestore() {
  var a = _fbAuth('https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/appConfig/sfBranches');
  var res = UrlFetchApp.fetch(a.url, { method: 'get', headers: a.headers, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  var doc = JSON.parse(res.getContentText());
  if (!doc || !doc.fields) return null;
  var d = decodeDoc(doc.fields);
  if (!d || !(d.list instanceof Array) || !d.list.length) return null;
  var out = d.list
    .filter(function (b) { return b && b.code && !b.closed; })
    .map(function (b) { return [String(b.code), b.name || '']; });
  return out.length ? out : null;
}

function getBranchRoster() {
  try { var h = _rosterFromHub();       if (h) return h; } catch (e) {}
  try { var f = _rosterFromFirestore(); if (f) return f; } catch (e) {}
  return BRANCHES;
}

/* รันมือเพื่อดูว่าตอนนี้บอทเห็นสาขาจากที่ไหน กี่สาขา — ใช้ตอนสงสัยว่าตัวเลขเพี้ยน */
function testRoster() {
  var src = 'ลิสต์ในสคริปต์', list = null;
  try { list = _rosterFromHub(); if (list) src = 'ฮับ'; } catch (e) { Logger.log('ฮับ: ' + e); }
  if (!list) { try { list = _rosterFromFirestore(); if (list) src = 'Firestore'; } catch (e) { Logger.log('Firestore: ' + e); } }
  if (!list) list = BRANCHES;
  Logger.log('แหล่งข้อมูล: ' + src + '  ·  ' + list.length + ' สาขา');
  Logger.log(list.map(function (b) { return b[0] + ' ' + b[1]; }).join(String.fromCharCode(10)));
  return { source: src, count: list.length };
}

function decodeDoc(fields) {
  var o = {};
  for (var k in fields) o[k] = decodeVal(fields[k]);
  return o;
}
function decodeVal(v) {
  if (v == null) return null;
  if ('stringValue'  in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue'  in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue'    in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue'   in v) return ((v.arrayValue.values) || []).map(decodeVal);
  if ('mapValue'     in v) return decodeDoc(v.mapValue.fields || {});
  return null;
}

// ───────────────────────── Telegram ─────────────────────────
function tg(method, payload) {
  var token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  return UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  });
}
function chatId() { return PropertiesService.getScriptProperties().getProperty('CHAT_ID'); }

function sendMessage(text) {
  tg('sendMessage', { chat_id: chatId(), text: text, parse_mode: 'HTML', disable_web_page_preview: true });
}
// ข้อความยาว → แบ่งส่งทีละ ≤3500 ตัวอักษร (Telegram จำกัด 4096)
function sendLong(text) {
  var lines = text.split('\n'), buf = '';
  for (var i = 0; i < lines.length; i++) {
    if ((buf + '\n' + lines[i]).length > 3500) { sendMessage(buf); buf = lines[i]; }
    else buf = buf ? buf + '\n' + lines[i] : lines[i];
  }
  if (buf) sendMessage(buf);
}
// ส่งรูปหลักฐาน (สูงสุด 10) พร้อมแคปชั่นข้อความในรูปแรก
function sendPhotos(urls, caption) {
  urls = urls.slice(0, 10);
  var cap = caption.slice(0, 1024);
  if (urls.length === 1) {
    // รูปเดียว → sendPhoto (sendMediaGroup ต้องมีอย่างน้อย 2 รูป)
    tg('sendPhoto', { chat_id: chatId(), photo: urls[0], caption: cap, parse_mode: 'HTML' });
  } else {
    var media = urls.map(function (u, i) {
      var m = { type: 'photo', media: u };
      if (i === 0) { m.caption = cap; m.parse_mode = 'HTML'; }
      return m;
    });
    tg('sendMediaGroup', { chat_id: chatId(), media: media });
  }
  // ถ้าแคปชั่นถูกตัด (เกิน 1024) ส่งข้อความเต็มตามอีกที
  if (caption.length > 1024) sendLong(caption);
}
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function ok() { return ContentService.createTextOutput('ok'); }

// ───────────────────────── ตั้งทริกเกอร์ + ทดสอบ ─────────────────────────
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'reportOpen' || f === 'reportClose') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('reportOpen').timeBased().everyDays(1).atHour(11).nearMinute(30).create();
  ScriptApp.newTrigger('reportClose').timeBased().everyDays(1).atHour(22).nearMinute(0).create();
}
function testReportOpen()  { reportOpen(); }
function testReportClose() { reportClose(); }
