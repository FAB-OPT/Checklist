-- ════════════════════════════════════════════════════════════════════
-- ล้างลิงก์รูปของใบเช็คลิสต์ที่เกินอายุเก็บ  (คู่กับการตั้งลบไฟล์จริงที่ Cloudflare R2)
--
-- โปรเจกต์: Training Record (cyjfgperenakjeazsfgf)
-- วิธีใช้: Supabase → SQL Editor → วางทั้งไฟล์ → Run (รันซ้ำได้ ไม่พัง)
--
-- ทำไมต้องล้างลิงก์ด้วย: R2 ลบไฟล์เมื่อครบอายุ ถ้าลิงก์ยังค้างในใบ ใบเก่าจะขึ้นรูปแตก
-- ล้างที่ฐานข้อมูลทีเดียว ไม่ต้องรอให้ใครเปิดแอปแล้วบังเอิญโหลดใบเก่ามาเจอ
--
-- ไม่แตะผลตรวจ ผ่าน/ไม่ผ่าน หมายเหตุ ชื่อผู้ส่ง เวลาส่ง — ล้างเฉพาะช่องรูป
-- ประทับ photosPurgedAt ไว้ หน้าเว็บจะขึ้นข้อความ "รูปถูกลบหลังเก็บครบ ... วัน" แทนรูป
-- ════════════════════════════════════════════════════════════════════

create or replace function public.ck_purge_photos(p_col text, p_before text, p_limit int default 500)
returns jsonb language plpgsql as $$
declare n int := 0;
begin
  if p_col not in ('dailyChecklists', 'jaedaengAudits') then
    raise exception 'ck_purge_photos: ห้ามล้างคอลเลกชัน %', p_col;
  end if;
  with target as (
    select d.id from public.ck_docs d
     where d.col = p_col
       and (d.data ->> 'date') < p_before
       and (d.data ->> 'photosPurgedAt') is null
       and jsonb_typeof(d.data -> 'items') = 'array'
       and exists (select 1 from jsonb_array_elements(d.data -> 'items') it
                    where jsonb_typeof(it -> 'photos') = 'array' and jsonb_array_length(it -> 'photos') > 0)
     order by (d.data ->> 'date')
     limit greatest(1, least(coalesce(p_limit, 500), 2000))
  )
  update public.ck_docs d
     set data = jsonb_set(d.data, '{items}', (
           select coalesce(jsonb_agg(
                    case when jsonb_typeof(it -> 'photos') = 'array' then jsonb_set(it, '{photos}', '[]'::jsonb) else it end
                    order by ord), '[]'::jsonb)
             from jsonb_array_elements(d.data -> 'items') with ordinality x(it, ord)))
                || jsonb_build_object('photosPurgedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
         server_at = now()
    from target t
   where d.col = p_col and d.id = t.id;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'col', p_col, 'purged', n, 'before', p_before);
end $$;

revoke all on function public.ck_purge_photos(text, text, int) from public, anon;
grant execute on function public.ck_purge_photos(text, text, int) to authenticated;

-- ดูว่าตอนนี้มีใบที่เข้าเงื่อนไขกี่ใบ (ยังไม่ล้าง แค่นับ)
select 'dailyChecklists' as col,
       count(*) filter (where (data ->> 'date') < to_char(now() - interval '360 days', 'YYYY-MM-DD')) as เกิน360วัน,
       count(*) as ทั้งหมด
  from public.ck_docs where col = 'dailyChecklists';
