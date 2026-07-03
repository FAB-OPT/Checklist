/**
 * Santa Fe Daily BOT — แจ้งเตือน Telegram สำหรับเช็คลิสต์รายวัน (เปิด/ปิดร้าน) ฝั่งซานตาเฟ่
 *
 * ทำ 2 อย่าง:
 *   ①  doPost()  — รับข้อมูลจากแอปทันทีที่สาขาส่งผลตรวจที่ "มีข้อไม่ผ่าน" → ส่งเข้ากลุ่ม
 *   ②  reportOpen()/reportClose() — ตั้งเวลา 11:00 (เปิด) และ 22:00 (ปิด)
 *        อ่านผลตรวจวันนี้จาก Firestore แล้วสรุป:
 *          - รายชื่อสาขาที่ "ยังไม่ส่ง" รอบนั้น
 *          - สาขาที่ "มีข้อไม่ผ่าน" + จำนวนข้อ (พร้อมรายละเอียด)
 *
 * ── ติดตั้ง (ทำครั้งเดียว) ─────────────────────────────────────────────
 * 1) Project Settings → Time zone = (GMT+07:00) Bangkok
 * 2) Project Settings → Script Properties เพิ่ม 3 ค่า:
 *      BOT_TOKEN         = โทเคนบอท Telegram (จาก @BotFather)
 *      CHAT_ID           = id กลุ่มซานตาเฟ่ (เช่น -1001234567890)
 *      FIREBASE_API_KEY  = apiKey ของ Firebase web (ดูใน FIREBASE_CONFIG ใน index.html)
 *    (PROJECT_ID ตั้งค่าเริ่มต้นเป็น checklist-a89e2 แล้ว — แก้ด้านล่างถ้าเปลี่ยนโปรเจกต์)
 * 3) Deploy → New deployment → Web app
 *      Execute as = Me · Who has access = Anyone
 *      คัดลอก URL ที่ลงท้าย /exec ไปวางในตัวแปร SF_TG_NOTIFY_URL ใน index.html
 * 4) รันฟังก์ชัน setupTriggers() หนึ่งครั้ง (กดอนุญาตสิทธิ์) → สร้างทริกเกอร์ 11:00 และ 22:00 ให้อัตโนมัติ
 * 5) ทดสอบ: รัน testReportOpen() / testReportClose() ดูว่าข้อความเข้ากลุ่มถูกต้อง
 * ─────────────────────────────────────────────────────────────────────
 */

var PROJECT_ID = 'checklist-a89e2';
var COLLECTION = 'dailyChecklists';
var TZ = 'Asia/Bangkok';

// รายชื่อสาขา Santa Fe — ต้อง sync กับ BRANCHES ใน index.html ถ้ามีการเพิ่ม/ลดสาขา
var BRANCHES = [
  ['5001','แฟชั่น ไอส์แลนด์'],['5002','ซีคอนสแควร์ ศรีนครินทร์'],['5003','เดอะมอลล์ ท่าพระ'],
  ['5004','เซ็นทรัล รัตนาธิเบศร์'],['5005','เดอะมอลล์ บางกะปิ'],['5007','เซ็นทรัลพลาซา พระราม 2'],
  ['5010','แพชชั่น ระยอง'],['5011','เดอะมอลล์ งามวงศ์วาน'],['5012','โลตัส บางพลี'],
  ['5013','แหลมทอง บางแสน'],['5014','บิ๊กซี พัทยากลาง'],['5015','แปซิฟิกพาร์ค ศรีราชา'],
  ['5016','อิมพีเรียลเวิลด์ สำโรง'],['5017','ซีคอน บางแค'],['5018','เซ็นทรัล รามอินทรา'],
  ['5019','เทอร์มินัล 21 อโศก'],['5021','เซ็นทรัล ปิ่นเกล้า'],['5023','บิ๊กซี พัทยาใต้'],
  ['5024','เดอะมอลล์ บางแค'],['5026','IT หลักสี่'],['5027','เซ็นทรัล แจ้งวัฒนะ'],
  ['5028','โลตัส ปทุมธานี'],['5030','เพลินนารี่ มอลล์'],['5031','เซ็นทรัล ศาลายา'],
  ['5033','โลตัส แจ้งวัฒนะ'],['5034','โลตัส ศาลายา'],['5035','เซ็นทรัลพัทยา บีช'],
  ['5036','โลตัส บางปะกอก'],['5038','เซ็นทรัล ระยอง'],['5039','เซ็นทรัล ชลบุรี'],
  ['5040','เซ็นทรัล Westgate'],['5041','เซ็นทรัล พระราม3'],['5042','ฟิวเจอร์ปาร์ค รังสิต'],
  ['5044','โลตัส ระยอง'],['5045','Promenade'],['5046','โลตัส บางกะปิ'],
  ['5047','เซ็นทรัล East ville'],['5049','โลตัส ชลบุรี'],['5050','บิ๊กซี บางพลี'],
  ['5052','โลตัส นวนคร'],['5054','บิ๊กซี บางใหญ่'],['5055','โลตัส สุขาภิบาล 3'],
  ['5057','โลตัส รังสิต'],['5061','บิ๊กซี สัตหีบ'],['5062','โรบินสัน ชลบุรี'],
  ['5063','โลตัส พนัสนิคม'],['5064','เทอร์มินอล พัทยา'],['5065','เกตเวย์ เอกมัย'],
  ['5066','เกตเวย์ บางซื่อ'],['5068','คอสโม บาร์ซา'],['5069','โลตัส พัฒนาการ'],
  ['5070','พันทิพย์ งามวงศ์วาน'],['5071','โลตัส จรัญสนิทวงศ์'],['5072','โลตัส สุขาภิบาล 1'],
  ['5073','โลตัส ลาดพร้าว'],['5074','บิ๊กซี พระราม 4'],['5076','บิ๊กซี ติวานนท์'],
  ['5077','เทอมินัล โคราช'],['5078','เดอะมอลล์ โคราช'],['5079','เซ็นทรัล โคราช'],
  ['5080','โลตัส แกลง ระยอง'],['5081','โลตัส ติวานนท์'],['5082','มาเก็ตเพลส วงศ์สว่างเซ็นเตอร์'],
  ['5084','เทอมินัล 21 พระราม 3'],['5085','ICS ไอคอนสยาม'],['5087','ศูนย์การประชุมแห่งชาติสิริกิติ์'],
  ['5088','สยาม สแควร์'],['5089','FAB Avenue'],['5090','S Oasis'],
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

// ───────────────────────── ② สรุปตามรอบเวลา (11:00 / 22:00) ─────────────────────────
function reportOpen()  { buildRoundReport('open'); }
function reportClose() { buildRoundReport('close'); }

function buildRoundReport(shift) {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var docs;
  try {
    docs = queryDailyByDate(today).filter(function (d) { return !d.deleted && d.shift === shift; });
  } catch (err) {
    sendMessage('⚠️ Santa Fe BOT อ่านข้อมูลจาก Firestore ไม่สำเร็จ (' + esc(String(err)) +
                ') — ตรวจ FIREBASE_API_KEY และสิทธิ์อ่าน (Security Rules)');
    return;
  }

  var submitted = {};              // branchCode → doc
  docs.forEach(function (d) { if (d.branchCode) submitted[String(d.branchCode)] = d; });

  var notSent = BRANCHES.filter(function (b) { return !submitted[b[0]]; });

  var fails = [];                  // {code,name,count,items[]}
  docs.forEach(function (d) {
    var f = (d.items || []).filter(function (it) { return it && it.status === 'fail'; });
    if (f.length) fails.push({ code: d.branchCode, name: d.branchName, count: f.length, items: f });
  });

  var head = shift === 'close' ? '🌙 <b>สรุปรอบปิดร้าน (Close)</b>' : '🌅 <b>สรุปรอบเปิดร้าน (Open)</b>';
  var timeTxt = shift === 'close' ? '22:00' : '11:00';
  var L = [];
  L.push(head);
  L.push('📅 ' + today + '   ⏰ ' + timeTxt + ' น.');
  L.push('');
  L.push('❌ <b>ยังไม่ส่ง (' + notSent.length + '/' + BRANCHES.length + ' สาขา)</b>');
  if (notSent.length) notSent.forEach(function (b) { L.push('• ' + b[0] + ' ' + esc(b[1])); });
  else L.push('🎉 ส่งครบทุกสาขา');
  L.push('');
  L.push('⚠️ <b>สาขาที่มีข้อไม่ผ่าน (' + fails.length + ' สาขา)</b>');
  if (fails.length) {
    fails.forEach(function (fx) {
      L.push('🏢 ' + fx.code + ' ' + esc(fx.name || '') + ' — <b>' + fx.count + '</b> ข้อ');
      fx.items.forEach(function (it, i) {
        L.push('   ' + (i + 1) + ') [' + esc(it.section || '') + '] ข้อ ' + (it.num || '') + ': ' + esc(it.text || ''));
        if (it.note) L.push('      ↳ ' + esc(it.note));
      });
    });
  } else {
    L.push('✅ ไม่มีสาขาที่มีข้อไม่ผ่าน');
  }
  L.push('');
  L.push('📊 ส่งแล้ว ' + docs.length + '/' + BRANCHES.length + ' สาขา');
  sendLong(L.join('\n'));
}

// ───────────────────────── Firestore REST (อ่านอย่างเดียว) ─────────────────────────
function queryDailyByDate(dateStr) {
  var key = PropertiesService.getScriptProperties().getProperty('FIREBASE_API_KEY');
  var url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
            '/databases/(default)/documents:runQuery?key=' + key;
  var body = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: dateStr } } }
    }
  };
  var res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  var arr = JSON.parse(res.getContentText());
  if (!Array.isArray(arr)) throw new Error(res.getResponseCode() + ' ' + res.getContentText().slice(0, 300));
  var out = [];
  arr.forEach(function (row) { if (row && row.document) out.push(decodeDoc(row.document.fields)); });
  return out;
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
  var media = urls.slice(0, 10).map(function (u, i) {
    var m = { type: 'photo', media: u };
    if (i === 0) { m.caption = caption.slice(0, 1024); m.parse_mode = 'HTML'; }
    return m;
  });
  var res = tg('sendMediaGroup', { chat_id: chatId(), media: media });
  // ถ้าแคปชั่นถูกตัด (เกิน 1024) ส่งข้อความเต็มตามอีกที
  if (caption.length > 1024) sendLong(caption);
  return res;
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
  ScriptApp.newTrigger('reportOpen').timeBased().everyDays(1).atHour(11).nearMinute(0).create();
  ScriptApp.newTrigger('reportClose').timeBased().everyDays(1).atHour(22).nearMinute(0).create();
}
function testReportOpen()  { reportOpen(); }
function testReportClose() { reportClose(); }
