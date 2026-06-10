/****************************************************************************************
 * สรุปการตรวจสาขา (เจ๊แดง) → แจ้งเตือนกลุ่ม Telegram ทุกวัน 17:00 น.
 * ───────────────────────────────────────────────────────────────────────────────────
 * อ่านข้อมูลการตรวจของ "วันนี้" จาก Firebase Firestore (collection: jaedaengAudits)
 * แล้วโพสต์สรุปลงกลุ่ม Telegram ว่า "มีใครตรวจที่ไหนบ้าง"
 *
 * ── วิธีติดตั้ง (ทำครั้งเดียว) ────────────────────────────────────────────────────────
 * 1) สร้าง Apps Script ใหม่: https://script.google.com → New project → วางโค้ดนี้ทั้งไฟล์
 *
 * 2) สร้าง Service Account ให้สิทธิ์อ่าน Firestore:
 *    - เปิด https://console.cloud.google.com → เลือกโปรเจกต์ checklist-a89e2
 *    - IAM & Admin → Service Accounts → Create service account (ตั้งชื่ออะไรก็ได้)
 *    - ให้ Role: "Cloud Datastore Viewer" (หรือ "Firebase Viewer")
 *    - กดเข้า service account ที่สร้าง → Keys → Add key → Create new key → JSON → ดาวน์โหลด
 *    - เปิดไฟล์ JSON จะเห็น "client_email" และ "private_key"
 *
 * 3) ใส่ค่าลับใน Project Settings → Script properties (อย่าฮาร์ดโค้ดในไฟล์):
 *    TG_BOT_TOKEN     = โทเค็นบอท (จาก @BotFather — ใช้บอทเดิมที่มีอยู่ได้)
 *    TG_CHAT_ID       = chat_id ของกลุ่มหลัก (รับทั้งเด้งทันที+รูป และสรุป 17:00) (ดูข้อ 5)
 *    TG_CHAT_ID_2     = (ไม่บังคับ) chat_id ของกลุ่มที่ 2 — รับ "เฉพาะสรุป 17:00" เท่านั้น
 *    FB_PROJECT_ID    = checklist-a89e2
 *    FB_CLIENT_EMAIL  = client_email จากไฟล์ JSON
 *    FB_PRIVATE_KEY   = private_key จากไฟล์ JSON (วางทั้งก้อน รวม -----BEGIN/END-----)
 *
 * 4) เพิ่มบอทเข้ากลุ่ม Telegram + ตั้งบอทเป็นแอดมิน (ให้โพสต์ได้)
 *
 * 5) หา chat_id ของกลุ่ม: ส่งข้อความอะไรก็ได้ในกลุ่ม แล้วเปิด
 *    https://api.telegram.org/bot<TG_BOT_TOKEN>/getUpdates
 *    มองหา "chat":{"id":-100xxxxxxxxxx ...} → เลขนั้น (ติดลบ) คือ chat_id ของกลุ่ม
 *
 * 6) กดรันฟังก์ชัน testRun() หนึ่งครั้ง → กด Allow สิทธิ์ → เช็คว่ามีข้อความเข้ากลุ่ม
 *
 * 7) ตั้งให้รันอัตโนมัติ 17:00 ทุกวัน: รันฟังก์ชัน createDailyTrigger() หนึ่งครั้ง
 *    (หรือ Triggers ⏰ → Add Trigger → sendDailyAuditSummary → Time-driven → Day timer → 5pm–6pm)
 *
 * หมายเหตุ: timezone ของ trigger ใช้ตามโปรเจกต์ Apps Script — ตั้งเป็น (GMT+07:00) Bangkok
 *           ที่ Project Settings → Time zone
 ****************************************************************************************/

var COLLECTION = 'jaedaengAudits';   // เฉพาะการตรวจเจ๊แดง
var BRAND_LABEL = 'เจ๊แดง จุ่มนัวร์';
var TZ = 'Asia/Bangkok';

// รหัสพนักงาน → ชื่อจริง / ชื่อเล่น (ใช้แสดงชื่อจริงในข้อความ)
var USERS_BY_CODE = {
  '550713': { name: 'ณฐกร',      nick: 'พี่ปอ' },
  '590022': { name: 'คณัสวรรณ',   nick: 'พี่เฟิร์น' },
  '490057': { name: 'พิมพ์พิชชา',  nick: 'พี่อ้อย' },
  '560874': { name: 'จุรีพร',      nick: 'พี่อีฟ' },
  '651221': { name: 'ขวัญดาว',    nick: 'พี่ดาว' },
  '651462': { name: 'นุชจรินทร์',  nick: 'พี่กัส' },
  '601183': { name: 'Kantapon',  nick: 'พี่กาย' },
  '681201': { name: 'อังคณา',     nick: 'พี่อิ๊ว' }
};

// ทีมที่ "ควรตรวจ" (BZM เจ๊แดง) — ใช้เช็คว่าใครยังไม่ได้ตรวจวันนี้ (แก้รายชื่อได้)
var EXPECTED_CODES = ['590022', '490057', '560874', '651221', '651462'];

// แสดงชื่อจริง (พร้อมชื่อเล่นในวงเล็บ) จากรหัส — ไม่พบรหัส ใช้ค่า fallback
function nameByCode_(code, fallback) {
  var u = USERS_BY_CODE[String(code || '')];
  if (u) return u.name + (u.nick ? ' (' + u.nick + ')' : '');
  return fallback || '-';
}

var TH_MONTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

/** ── ฟังก์ชันหลัก (ตัวที่ตั้ง trigger ให้รัน 17:00) ──
 *  ส่ง "สรุปประจำวัน" เข้าทุกกลุ่ม: TG_CHAT_ID (กลุ่มหลัก) + TG_CHAT_ID_2 (กลุ่มสรุปอย่างเดียว)
 *  หมายเหตุ: การเด้งทันที + รูป (doPost) ส่งเฉพาะกลุ่มหลัก TG_CHAT_ID เท่านั้น */
function sendDailyAuditSummary() {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var audits = queryAuditsByDate_(today);
  var text = formatMessage_(audits, today);
  var props = PropertiesService.getScriptProperties();
  var ids = [props.getProperty('TG_CHAT_ID'), props.getProperty('TG_CHAT_ID_2')]
    .filter(function (x) { return x && String(x).trim(); });
  ids.forEach(function (id) { sendTelegram_(text, id); });
}

/** ── ทดสอบรันทันที (วันนี้) ── */
function testRun() {
  sendDailyAuditSummary();
}

/** ── แจ้งเตือนทันที เมื่อแอปบันทึกผลตรวจใหม่ (เรียกผ่าน Web App POST) ──
 *  ต้อง Deploy โปรเจกต์นี้เป็น Web app (Execute as: Me · Access: Anyone)
 *  แล้วเอา URL /exec ไปใส่ในแอป (ตัวแปร JD_TG_NOTIFY_URL ใน index.html) */
function doPost(e) {
  try {
    var data = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    sendTelegram_(formatInstant_(data));
    if (data.photos && data.photos.length) sendPhotos_(data.photos);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** ส่งรูปหลักฐานเข้ากลุ่ม (สูงสุด 10 รูป · เฉพาะ URL http/https) */
function sendPhotos_(urls) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TG_BOT_TOKEN');
  var chatId = props.getProperty('TG_CHAT_ID');
  urls = (urls || []).filter(function (u) { return typeof u === 'string' && /^https?:\/\//i.test(u); }).slice(0, 10);
  if (!token || !chatId || !urls.length) return;
  var sendUrl = 'https://api.telegram.org/bot' + token + '/sendPhoto';
  var errReported = false;
  function _err(msg) { if (!errReported) { errReported = true; try { sendTelegram_('⚠️ ' + msg); } catch (e) {} } }
  // โหลดรูปเองแล้วอัปขึ้น Telegram (multipart) — กันเคส Telegram ดึง URL ไม่ได้
  urls.forEach(function (u) {
    try {
      var img = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true });
      if (img.getResponseCode() !== 200) { _err('โหลดรูปไม่ได้ (' + img.getResponseCode() + '): ' + u); return; }
      var res = UrlFetchApp.fetch(sendUrl, {
        method: 'post',
        payload: { chat_id: chatId, photo: img.getBlob() },
        muteHttpExceptions: true
      });
      if (res.getResponseCode() !== 200) { _err('ส่งรูปไม่สำเร็จ (' + res.getResponseCode() + '): ' + String(res.getContentText()).slice(0, 200)); }
    } catch (e) { _err('ส่งรูป error: ' + (e && e.message || e)); }
  });
}

/** ข้อความแจ้งเตือนทันที (ต่อ 1 การตรวจ) — แบบละเอียด */
function formatInstant_(a) {
  var who = esc_(nameByCode_(a.auditorCode || a.submittedBy, a.auditor || a.submittedByName));
  var store = esc_(a.storeName || '-');
  var time = a.time ? ('  ·  ' + esc_(a.time) + ' น.') : '';
  var date = a.date ? (' · ' + esc_(thaiDate_(a.date))) : '';

  var pctNum = parseFloat(a.passPct);
  var pct = isNaN(pctNum) ? '-' : pctNum.toFixed(1) + '%';
  var tier = isNaN(pctNum) ? '' : (pctNum >= 90 ? '🟢 ดีเยี่ยม' : pctNum >= 70 ? '🟡 ผ่านเกณฑ์' : '🔴 เร่งด่วน');

  var pass = parseInt(a.passCount, 10), na = parseInt(a.naCount, 10), tot = parseInt(a.totalCount, 10);
  var fail = parseInt(a.failCount, 10) || 0;
  var counts = '\n   ✅ ผ่าน ' + (isNaN(pass) ? '-' : pass) +
               ' · ❌ ไม่ผ่าน ' + fail +
               ' · ⚪ N/A ' + (isNaN(na) ? '-' : na) +
               (isNaN(tot) ? '' : (' · รวม ' + tot + ' ข้อ'));

  var bzm = (a.bzmNick || a.bzm) ? ('\n👥 BZM: ' + esc_(a.bzmNick || a.bzm)) : '';

  // รายการข้อที่ไม่ผ่าน (พร้อมหมายเหตุ) — จำกัดไม่เกิน 12 ข้อ
  var failedTxt = '';
  var fails = a.failed || [];
  if (fails.length) {
    var CAP = 12;
    var rows = fails.slice(0, CAP).map(function (it) {
      var sec = it.section ? ('[' + esc_(it.section) + '] ') : '';
      var note = it.note ? (' — <i>' + esc_(it.note) + '</i>') : '';
      return '• ' + sec + esc_(it.text || '') + note;
    });
    var more = fails.length > CAP ? ('\n…และอีก ' + (fails.length - CAP) + ' ข้อ') : '';
    failedTxt = '\n\n❌ <b>ข้อที่ไม่ผ่าน (' + fails.length + '):</b>\n' + rows.join('\n') + more;
  }

  // ลิงก์พิกัดที่ตรวจ (ถ้ามี GPS)
  var gpsTxt = '';
  if (a.gps && a.gps.lat != null && a.gps.lng != null) {
    gpsTxt = '\n\n📍 <a href="https://www.google.com/maps?q=' + a.gps.lat + ',' + a.gps.lng + '">ดูพิกัดที่ตรวจ</a>';
  }

  return '🔔 <b>มีการตรวจสาขาใหม่</b> — ' + esc_(BRAND_LABEL) + esc_(date) + '\n\n' +
         '🏬 <b>' + store + '</b>\n' +
         '👤 ' + who + time + bzm + '\n\n' +
         '📊 ผ่านเกณฑ์ <b>' + pct + '</b>' + (tier ? ('  ' + tier) : '') + counts +
         failedTxt + gpsTxt;
}

/** ── สร้าง trigger รายวัน 17:00 (รันครั้งเดียว) ── */
function createDailyTrigger() {
  // ลบ trigger เดิมของฟังก์ชันนี้ก่อน กันซ้ำ
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendDailyAuditSummary') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendDailyAuditSummary')
    .timeBased().everyDays(1).atHour(17).nearMinute(0)
    .inTimezone(TZ)
    .create();
  Logger.log('ตั้ง trigger 17:00 ทุกวันเรียบร้อย');
}

/* ─────────────────────────── Firestore ─────────────────────────── */

/** ดึงเอกสารใน collection ที่ field date == dateStr */
function queryAuditsByDate_(dateStr) {
  var props = PropertiesService.getScriptProperties();
  var pid = props.getProperty('FB_PROJECT_ID');
  var token = getAccessToken_();
  var url = 'https://firestore.googleapis.com/v1/projects/' + pid +
            '/databases/(default)/documents:runQuery';
  var body = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'date' },
          op: 'EQUAL',
          value: { stringValue: dateStr }
        }
      }
    }
  };
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Firestore query error ' + res.getResponseCode() + ': ' + res.getContentText());
  }
  var arr = JSON.parse(res.getContentText()) || [];
  var out = [];
  arr.forEach(function (row) {
    if (!row.document || !row.document.fields) return;
    out.push(parseFields_(row.document.fields));
  });
  return out;
}

/** แปลง fields แบบ Firestore (typed) → object ธรรมดา */
function parseFields_(fields) {
  var o = {};
  Object.keys(fields).forEach(function (k) { o[k] = fsVal_(fields[k]); });
  return o;
}
function fsVal_(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) return parseFields_((v.mapValue && v.mapValue.fields) || {});
  if ('arrayValue' in v) return ((v.arrayValue && v.arrayValue.values) || []).map(fsVal_);
  return null;
}

/** OAuth access token จาก service account (scope: datastore) */
function getAccessToken_() {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('FB_CLIENT_EMAIL');
  var key = (props.getProperty('FB_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('ยังไม่ได้ตั้ง FB_CLIENT_EMAIL / FB_PRIVATE_KEY ใน Script properties');

  var now = Math.floor(Date.now() / 1000);
  var enc = function (o) { return Utilities.base64EncodeWebSafe(JSON.stringify(o)).replace(/=+$/, ''); };
  var header = { alg: 'RS256', typ: 'JWT' };
  var claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  var toSign = enc(header) + '.' + enc(claim);
  var sig = Utilities.computeRsaSha256Signature(toSign, key);
  var jwt = toSign + '.' + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');

  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true
  });
  var data = JSON.parse(res.getContentText());
  if (!data.access_token) throw new Error('ขอ OAuth token ไม่สำเร็จ: ' + res.getContentText());
  return data.access_token;
}

/* ─────────────────────────── ข้อความสรุป ─────────────────────────── */

function thaiDate_(ymd) {
  var p = String(ymd).split('-');
  return parseInt(p[2], 10) + ' ' + TH_MONTH[parseInt(p[1], 10) - 1] + ' ' + (parseInt(p[0], 10) + 543);
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMessage_(audits, dateStr) {
  var head = '📋 <b>สรุปการตรวจสาขา ' + esc_(BRAND_LABEL) + '</b>\n' +
             '🗓️ ' + esc_(thaiDate_(dateStr)) + '\n';

  // ── ใครยังไม่ได้ตรวจวันนี้ (เทียบ EXPECTED_CODES กับคนที่มีผลตรวจ) ──
  var inspected = {};
  audits.forEach(function (a) {
    if (a.auditorCode) inspected[String(a.auditorCode)] = true;
    if (a.submittedBy) inspected[String(a.submittedBy)] = true;
  });
  var missing = EXPECTED_CODES.filter(function (c) { return !inspected[c]; });
  var missingTxt = missing.length
    ? '\n\n⛔️ <b>ยังไม่ได้ตรวจวันนี้:</b> ' + missing.map(function (c) { return esc_(nameByCode_(c)); }).join(', ')
    : '\n\n🎉 <b>ทีมตรวจครบทุกคนแล้ว</b>';

  if (!audits.length) {
    return head + '\n📭 วันนี้ยังไม่มีการตรวจสาขา' + missingTxt;
  }

  // เรียงตามเวลา (ถ้ามี) แล้วค่อย submittedAt
  audits.sort(function (a, b) {
    var ta = a.time || '', tb = b.time || '';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.submittedAt || '') < String(b.submittedAt || '') ? -1 : 1;
  });

  var lines = audits.map(function (a, i) {
    var who = esc_(nameByCode_(a.auditorCode || a.submittedBy, a.auditor && a.auditor !== '-' ? a.auditor : a.submittedByName));
    var store = esc_(a.storeName || '-');
    var time = a.time ? ('  ' + esc_(a.time) + ' น.') : '';
    var pct = (typeof a.passPct === 'number') ? a.passPct.toFixed(1) + '%' : '-';
    var fail = (typeof a.failCount === 'number') ? a.failCount : 0;
    var failTxt = fail > 0 ? ('  (ไม่ผ่าน ' + fail + ' ข้อ)') : '';
    return (i + 1) + '. <b>' + who + '</b>\n' +
           '   🏬 ' + store + time + '\n' +
           '   ✅ ผ่านเกณฑ์ ' + pct + esc_(failTxt);
  });

  return head + '\n✅ วันนี้มีการตรวจ <b>' + audits.length + '</b> สาขา\n\n' +
         lines.join('\n\n') + missingTxt;
}

/* ─────────────────────────── Telegram ─────────────────────────── */

function sendTelegram_(text, chatId) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TG_BOT_TOKEN');
  chatId = chatId || props.getProperty('TG_CHAT_ID');
  if (!token || !chatId) throw new Error('ยังไม่ได้ตั้ง TG_BOT_TOKEN / TG_CHAT_ID ใน Script properties');

  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    payload: {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: 'true'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('Telegram error ' + res.getResponseCode() + ': ' + res.getContentText());
  }
}
