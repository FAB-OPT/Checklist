# Santa Fe Daily BOT — แจ้งเตือน Telegram (เช็คลิสต์รายวัน เปิด/ปิดร้าน)

ไฟล์: [`santafe-daily-bot.gs`](santafe-daily-bot.gs) — Google Apps Script ตัวเดียวทำ 2 อย่าง

| งาน | ทำงานเมื่อ | ส่งอะไร |
|-----|-----------|---------|
| ① แจ้งทันที | สาขากดส่งผลตรวจที่ **มีข้อไม่ผ่าน** | รายละเอียดข้อที่ไม่ผ่าน + รูปหลักฐาน |
| ② สรุปตามรอบ | **11:00** (เปิด) และ **22:00** (ปิด) | สาขาที่ยังไม่ส่ง + สาขาที่มีข้อไม่ผ่าน (พร้อมรายละเอียด) |

## ติดตั้ง (ครั้งเดียว)
1. สร้างโปรเจกต์ใหม่ที่ https://script.google.com → วางโค้ดจาก `santafe-daily-bot.gs`
2. **Project Settings → Time zone = (GMT+07:00) Bangkok**
3. **Project Settings → Script Properties** เพิ่ม 3 ค่า (ความลับ ไม่ต้องแก้ในโค้ด):
   - `BOT_TOKEN` = โทเคนบอท (จาก @BotFather)
   - `CHAT_ID` = id กลุ่มซานตาเฟ่ (เช่น `-1001234567890`)
   - `FIREBASE_API_KEY` = `apiKey` ของ Firebase web (ดูใน `FIREBASE_CONFIG` ใน `index.html`)
4. **Deploy → New deployment → Web app** · Execute as = **Me** · Who has access = **Anyone**
   → คัดลอก URL ที่ลงท้าย `/exec`
5. เอา URL ไปวางในตัวแปร `SF_TG_NOTIFY_URL` ใน `index.html` (ตอนนี้เว้นว่าง = ปิดอยู่)
6. รัน `setupTriggers()` หนึ่งครั้ง (กดอนุญาตสิทธิ์) → สร้างทริกเกอร์ 11:00 และ 22:00 อัตโนมัติ
7. ทดสอบ: รัน `testReportOpen()` / `testReportClose()` ดูว่าข้อความเข้ากลุ่มถูกต้อง

## ข้อควรรู้
- ทริกเกอร์เวลาของ Google รันในช่วง ~±15 นาทีของชั่วโมงที่ตั้ง (ไม่เป๊ะวินาที)
- ต้องให้ Firestore Security Rules **อ่านได้** (ตอนนี้แอปอ่านแบบไม่ล็อกอินอยู่แล้ว จึงใช้ได้)
- รายชื่อสาขาฝังอยู่ในตัวแปร `BRANCHES` ในสคริปต์ — ถ้าเพิ่ม/ลดสาขาต้องแก้ให้ตรงกับ `BRANCHES` ใน `index.html`
- อยากได้บอทแยกสำหรับ **เจ๊แดง**? ตัวนั้นมี Apps Script ของตัวเองอยู่แล้ว (`JD_TG_NOTIFY_URL`)
