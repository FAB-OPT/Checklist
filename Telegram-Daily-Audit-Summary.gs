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

/* ─────────── รายชื่อทีม: อ่านจากทะเบียนผู้ใช้ของฮับ (hub_config · key=users) ───────────
   ทะเบียนผู้ใช้อยู่ที่ฮับที่เดียว (⚙️ → จัดการผู้ใช้) — เดิมสคริปต์นี้ฝังรายชื่อไว้เอง
   พอมีคนเข้า/ออก/เปลี่ยนชื่อ ข้อความในกลุ่มก็ผิดตามไปด้วย (เช่น ยังเตือนว่า "พี่กัส ยังไม่ได้ตรวจ" ทุกวัน
   ทั้งที่ออกจากทีมไปแล้ว) · ตอนนี้ดึงของจริงมาทุกครั้ง · ดึงไม่ได้ → ใช้รายชื่อสำรองด้านล่าง และบอกในข้อความ */
var HUB_SB_URL = 'https://pzspcjqlxoqnbtvlfjsy.supabase.co';
var HUB_SB_KEY = 'sb_publishable_n1w7k8mdxGbtaHKZ4xnNWA_wxUHhEtP';

// รายชื่อสำรอง (ใช้เมื่ออ่านทะเบียนฮับไม่ได้เท่านั้น) · role: bzm = ทีมที่ "ควรตรวจ"
var FALLBACK_USERS = [
  { code: '550713', name: 'Nattakorn Ersathaporn',  nick: "P'Por",    role: 'vp',  brands: ['jaedaeng'] },
  { code: '590022', name: 'Kanusswan  aimsumrun',    nick: "P'Fern",   role: 'bzm', brands: ['jaedaeng'] },
  { code: '490057', name: 'Phimphitcha Chatchawan', nick: "P'Aoy",    role: 'bzm', brands: ['jaedaeng'] },
  { code: '560874', name: 'Jureeporn Thong-ach',    nick: "P'Eve",    role: 'bzm', brands: ['jaedaeng'] },
  { code: '651221', name: 'Khwandao Boonruang',     nick: "P'Daw",    role: 'bzm', brands: ['jaedaeng'] },
  { code: '601183', name: 'Kantapon Lapmongkolnawin', nick: "P'Guy",  role: 'admin', brands: ['santafe'] },
  { code: '681201', name: 'Angkana Nilkumnerd',     nick: "P'Ew",     role: 'coo', brands: ['santafe'] }
];
// ชื่อเล่นแบบอื่นของคนเดียวกัน (เช่น ชื่อไทย) ที่อาจติดมากับผลตรวจ → แสดงเป็นชื่อเล่นปัจจุบันในทะเบียน
var OLD_NICK_BY_CODE = {
  '550713': ['พี่ปอ'], '590022': ['พี่เฟิร์น'], '490057': ['พี่อ้อย'], '560874': ['พี่อีฟ'], '651221': ['พี่ดาว'], '681201': ['พี่อิ๊ว']
};

var _usersCache = null, _usersSource = '';
function hubSbToken_() {
  var cache = CacheService.getScriptCache();
  var t = cache.get('hub_sb_tok');
  if (t) return t;
  var res = UrlFetchApp.fetch(HUB_SB_URL + '/auth/v1/signup', {
    method: 'post', contentType: 'application/json', payload: '{}',
    headers: { apikey: HUB_SB_KEY }, muteHttpExceptions: true });
  var j = JSON.parse(res.getContentText() || '{}');
  if (!j.access_token) throw new Error('ล็อกอิน Supabase (ฮับ) ไม่สำเร็จ: ' + res.getContentText().slice(0, 200));
  cache.put('hub_sb_tok', j.access_token, 3000);
  return j.access_token;
}
function loadRegistryUsers_() {
  try {
    var res = UrlFetchApp.fetch(HUB_SB_URL + '/rest/v1/hub_config?select=value&key=eq.users',
      { headers: { apikey: HUB_SB_KEY, Authorization: 'Bearer ' + hubSbToken_() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    var rows = JSON.parse(res.getContentText() || '[]');
    var v = rows && rows[0] && rows[0].value;
    return (Array.isArray(v) && v.length) ? v : null;
  } catch (e) { return null; }
}
function users_() {
  if (_usersCache) return _usersCache;
  var list = loadRegistryUsers_();
  if (list) { _usersSource = 'registry'; } else { list = FALLBACK_USERS; _usersSource = 'fallback'; }
  _usersCache = list;
  return list;
}
function userByCode_(code) {
  var c = String(code || ''), list = users_();
  for (var i = 0; i < list.length; i++) if (String(list[i].code) === c) return list[i];
  return null;
}
function userBrands_(u) {
  return (u && Array.isArray(u.brands) && u.brands.length) ? u.brands : (u && u.brand ? [u.brand] : []);
}

// ทีมที่ "ควรตรวจ" = BZM ที่ดูแลแบรนด์เจ๊แดงในทะเบียน — ใช้เช็คว่าใครยังไม่ได้ตรวจวันนี้
function expectedCodes_() {
  return users_().filter(function (u) {
    return u.role === 'bzm' && userBrands_(u).indexOf('jaedaeng') >= 0;
  }).map(function (u) { return String(u.code); });
}

// แสดงชื่อเล่น (พร้อมชื่อจริงในวงเล็บ) จากรหัส — ไม่พบรหัส ใช้ค่า fallback
function nameByCode_(code, fallback) {
  var u = userByCode_(code);
  if (u) return u.nick ? (u.nick + (u.name ? ' (' + u.name + ')' : '')) : (u.name || fallback || '-');   // ชื่อเล่นนำ — ทะเบียนเก็บชื่อจริงเป็นอังกฤษ
  return fallback || '-';
}

// ชื่อเล่นที่ติดมากับผลตรวจ (อาจเป็นชื่ออีกแบบ เช่น พี่อีฟ) → ชื่อเล่นปัจจุบันของคนนั้นตามทะเบียน
function currentNick_(raw) {
  var t = String(raw == null ? '' : raw).trim();
  if (!t) return '';
  var list = users_();
  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    if (t === u.nick || t === u.name) return u.nick || u.name;
    var olds = OLD_NICK_BY_CODE[String(u.code)] || [];
    if (olds.indexOf(t) >= 0) return u.nick || t;
  }
  return t;
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
  urls = (urls || []).filter(function (u) { return typeof u === 'string' && u; }).slice(0, 10);
  if (!token || !chatId || !urls.length) return;
  var errReported = false;
  function _err(msg) { if (!errReported) { errReported = true; try { sendTelegram_('⚠️ ' + msg); } catch (e) {} } }

  // เตรียม blob ของรูปทุกใบ (รองรับทั้ง base64 และ URL R2)
  var blobs = [];
  urls.forEach(function (u) {
    try {
      var m = /^data:(image\/[\w.+-]+);base64,(.*)$/i.exec(u);
      if (m) {
        blobs.push(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'photo.jpg'));
      } else if (/^https?:\/\//i.test(u)) {
        var img = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true });
        if (img.getResponseCode() !== 200) { _err('โหลดรูปไม่ได้ (' + img.getResponseCode() + '): ' + u); return; }
        blobs.push(img.getBlob());
      }
    } catch (e) { _err('เตรียมรูป error: ' + (e && e.message || e)); }
  });
  if (!blobs.length) return;

  // รูปเดียว → sendPhoto · หลายรูป → sendMediaGroup (อัลบั้มเดียว)
  if (blobs.length === 1) {
    var res1 = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendPhoto', {
      method: 'post', payload: { chat_id: chatId, photo: blobs[0] }, muteHttpExceptions: true
    });
    if (res1.getResponseCode() !== 200) _err('ส่งรูปไม่สำเร็จ (' + res1.getResponseCode() + '): ' + String(res1.getContentText()).slice(0, 200));
    return;
  }
  var media = [], payload = { chat_id: chatId };
  blobs.forEach(function (b, i) {
    var key = 'photo' + i;
    media.push({ type: 'photo', media: 'attach://' + key });
    payload[key] = b;
  });
  payload.media = JSON.stringify(media);
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMediaGroup', {
    method: 'post', payload: payload, muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) _err('ส่งอัลบั้มไม่สำเร็จ (' + res.getResponseCode() + '): ' + String(res.getContentText()).slice(0, 200));
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

  var bzm = (a.bzmNick || a.bzm) ? ('\n👥 BZM: ' + esc_(currentNick_(a.bzmNick || a.bzm))) : '';

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

/* ─────────── เช็คลิสต์ย้ายไป Supabase (Training Record · ตาราง ck_docs) ───────────
   ย้ายข้อมูลแล้ว → อ่านจาก Supabase · ยังไม่ย้าย (ไม่มีตาราง/ตารางยังว่าง) → คืน null ให้ใช้ Firestore ต่อ
   ทำแบบนี้จึง deploy สคริปต์นี้ได้ก่อนวันสลับ ถึงวันแล้วสลับตามเองไม่ต้องแก้อีก */
var CK_SB_URL = 'https://cyjfgperenakjeazsfgf.supabase.co';
var CK_SB_KEY = 'sb_publishable_xAtQvH3Bdaqt7PVJGbkxWw_KVhfBszo';
function _ckSbToken() {
  var cache = CacheService.getScriptCache();
  var t = cache.get('ck_sb_tok');
  if (t) return t;
  var res = UrlFetchApp.fetch(CK_SB_URL + '/auth/v1/signup', {
    method: 'post', contentType: 'application/json', payload: '{}',
    headers: { apikey: CK_SB_KEY }, muteHttpExceptions: true });
  var j = JSON.parse(res.getContentText() || '{}');
  if (!j.access_token) throw new Error('ล็อกอิน Supabase ไม่สำเร็จ: ' + res.getContentText().slice(0, 200));
  cache.put('ck_sb_tok', j.access_token, 3000);
  return j.access_token;
}
function _ckSbHeaders() { return { apikey: CK_SB_KEY, Authorization: 'Bearer ' + _ckSbToken() }; }
/* ย้ายข้อมูลแล้วหรือยัง = มีป้าย _meta/live (เขียนเป็นขั้นสุดท้ายหลังย้ายครบ) */
function _ckSbLive() {
  try {
    var res = UrlFetchApp.fetch(CK_SB_URL + '/rest/v1/ck_docs?select=id&col=eq._meta&id=eq.live&limit=1',
      { headers: _ckSbHeaders(), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return false;
    return (JSON.parse(res.getContentText() || '[]') || []).length > 0;
  } catch (e) { return false; }
}
/* filters = [{f:'date', op:'==', v:'2026-09-23'}] · คืน null = ยังไม่ย้าย ให้ใช้ Firestore */
function _ckSbQuery(col, filters) {
  if (!_ckSbLive()) return null;
  /* ดึงทีละหน้า 300 ใบ — ก้อนใหญ่ก้อนเดียวเกินเวลาที่ฐานข้อมูลให้ต่อคำสั่ง */
  var out = [], after = null;
  for (var g = 0; g < 400; g++) {
    var res = UrlFetchApp.fetch(CK_SB_URL + '/rest/v1/rpc/ck_query', {
      method: 'post', contentType: 'application/json', headers: _ckSbHeaders(),
      payload: JSON.stringify({ p_col: col, p_filters: filters || [], p_since: null, p_after: after, p_limit: 300 }), muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Supabase ตอบ ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 200));
    var rows = JSON.parse(res.getContentText()).rows || [];
    rows.forEach(function (r) { var o = r.data || {}; if (o.id == null) o.id = r.id; out.push(o); });
    if (rows.length < 300) break;
    after = rows[rows.length - 1].id;
  }
  return out;
}

/** ดึงเอกสารใน collection ที่ field date == dateStr */
function queryAuditsByDate_(dateStr) {
  var sb = _ckSbQuery(COLLECTION, [{ f: 'date', op: '==', v: dateStr }]);
  if (sb) return sb;
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
  var missing = expectedCodes_().filter(function (c) { return !inspected[c]; });
  var missingTxt = missing.length
    ? '\n\n⛔️ <b>ยังไม่ได้ตรวจวันนี้:</b> ' + missing.map(function (c) { return esc_(nameByCode_(c)); }).join(', ')
    : '\n\n🎉 <b>ทีมตรวจครบทุกคนแล้ว</b>';
  if (_usersSource === 'fallback') missingTxt += '\n<i>(อ่านทะเบียนผู้ใช้จากฮับไม่ได้ — ใช้รายชื่อสำรอง)</i>';

  if (!audits.length) {
    return head + '\n📭 วันนี้ยังไม่มีการตรวจสาขา' + missingTxt;
  }

  // เรียงตามเวลา (ถ้ามี) แล้วค่อย submittedAt
  audits.sort(function (a, b) {
    var ta = a.time || '', tb = b.time || '';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.submittedAt || '') < String(b.submittedAt || '') ? -1 : 1;
  });

  /* รวมตามคนตรวจ — คนเดียวตรวจหลายสาขาในวันเดียว ขึ้นเป็นกลุ่มเดียว แล้วลิสต์สาขาข้างใต้ (เรียงตามเวลาที่ตรวจครั้งแรกของแต่ละคน) */
  var groups = [], byKey = {};
  audits.forEach(function (a) {
    var key = String(a.auditorCode || a.submittedBy || (a.auditor && a.auditor !== '-' ? a.auditor : a.submittedByName) || '-');
    if (!byKey[key]) {
      byKey[key] = { who: esc_(nameByCode_(a.auditorCode || a.submittedBy, a.auditor && a.auditor !== '-' ? a.auditor : a.submittedByName)), items: [] };
      groups.push(byKey[key]);
    }
    byKey[key].items.push(a);
  });

  var lines = groups.map(function (g, i) {
    var rows = g.items.map(function (a) {
      var store = esc_(a.storeName || '-');
      var time = a.time ? ('  ' + esc_(a.time) + ' น.') : '';
      var pct = (typeof a.passPct === 'number') ? a.passPct.toFixed(1) + '%' : '-';
      var fail = (typeof a.failCount === 'number') ? a.failCount : 0;
      var failTxt = fail > 0 ? ('  (ไม่ผ่าน ' + fail + ' ข้อ)') : '';
      return '   🏬 ' + store + time + '\n' +
             '      ✅ ผ่านเกณฑ์ ' + pct + esc_(failTxt);
    });
    return (i + 1) + '. <b>' + g.who + '</b> · ตรวจ ' + g.items.length + ' สาขา\n' + rows.join('\n');
  });

  return head + '\n✅ วันนี้มีการตรวจ <b>' + audits.length + '</b> สาขา · <b>' + groups.length + '</b> คน\n\n' +
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
