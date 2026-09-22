-- ════════════════════════════════════════════════════════════════════
-- Operations Checklist — ย้ายจาก Firestore (checklist-a89e2) มา Supabase
--
-- โปรเจกต์: Training Record (cyjfgperenakjeazsfgf)
-- วิธีใช้: Supabase → SQL Editor → วางทั้งไฟล์ → Run (รันซ้ำได้ ไม่พัง)
--
-- เก็บแบบเดียวกับ Firestore: 1 แถว = 1 เอกสาร (คอลเลกชัน + id + ข้อมูลทั้งก้อน)
-- หน้าเว็บจึงเปลี่ยนแค่ชั้นล่างสุด ตรรกะเดิมทั้งหมด (รวมข้อมูลในเครื่อง · ค้างส่ง · เทียบ updatedAt) ใช้ต่อได้
--   col = dailyChecklists | jaedaengAudits | dailySummary | appConfig | audits
--   server_at = เวลาเซิร์ฟเวอร์ตอนเขียน ใช้ดึงเฉพาะที่เปลี่ยน (แทน onSnapshot)
--   ลบ = ย้ายไป ck_trash เก็บไว้กู้คืนได้ (Firestore ลบแล้วหายเลย)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.ck_docs (
  col       text not null,
  id        text not null,
  data      jsonb not null default '{}'::jsonb,
  server_at timestamptz not null default now(),
  primary key (col, id)
);
create index if not exists ck_docs_date   on public.ck_docs (col, (data ->> 'date'));
create index if not exists ck_docs_branch on public.ck_docs (col, (data ->> 'branchCode'));
create index if not exists ck_docs_upd    on public.ck_docs (col, (data ->> 'updatedAt'));
create index if not exists ck_docs_store  on public.ck_docs (col, (data ->> 'storeName'));
create index if not exists ck_docs_srv    on public.ck_docs (col, server_at);

create table if not exists public.ck_trash (
  col        text not null,
  id         text not null,
  data       jsonb,
  deleted_at timestamptz not null default now()
);
create index if not exists ck_trash_at on public.ck_trash (col, deleted_at);

alter table public.ck_docs  enable row level security;
alter table public.ck_trash enable row level security;
drop policy if exists ck_docs_auth  on public.ck_docs;
drop policy if exists ck_trash_auth on public.ck_trash;
create policy ck_docs_auth  on public.ck_docs  for all to authenticated using (true) with check (true);
create policy ck_trash_auth on public.ck_trash for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.ck_docs, public.ck_trash to authenticated;
revoke all on public.ck_docs, public.ck_trash from anon;

-- ── รวมก้อน jsonb แบบลึก (เหมือน set(..., {merge:true}) ของ Firestore) ──
create or replace function public._ck_deep(a jsonb, b jsonb)
returns jsonb language sql immutable as $$
  select case
    when jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then
      (select coalesce(jsonb_object_agg(k,
         case when a ? k and b ? k then public._ck_deep(a -> k, b -> k)
              when b ? k then b -> k else a -> k end), '{}'::jsonb)
         from (select jsonb_object_keys(a) k union select jsonb_object_keys(b)) ks)
    else b end;
$$;

-- ── ค้นหา ── p_filters = [{"f":"date","op":">=","v":"2026-09-01"}, ...]
-- ช่องที่ค้นได้และตัวเทียบถูกจำกัดไว้ (กันประกอบคำสั่งแปลก ๆ)
-- p_since = คืนเฉพาะที่เปลี่ยนหลังเวลานี้ (เวลาเซิร์ฟเวอร์) + id ที่ถูกลบหลังเวลานี้
create or replace function public.ck_query(p_col text, p_filters jsonb default '[]'::jsonb, p_since timestamptz default null)
returns jsonb language plpgsql stable as $$
declare
  w text := format('col = %L', p_col);
  f jsonb; fld text; op text;
  rows jsonb; gone jsonb;
begin
  for f in select * from jsonb_array_elements(coalesce(p_filters, '[]'::jsonb)) loop
    fld := f ->> 'f'; op := f ->> 'op';
    if fld not in ('date', 'branchCode', 'updatedAt', 'storeName', 'brand', 'shift', 'month') then
      raise exception 'ck_query: ห้ามค้นช่อง %', fld;
    end if;
    if op = 'in' then
      w := w || format(' and (data ->> %L) = any (%L::text[])', fld,
             (select coalesce(array_agg(x), '{}') from jsonb_array_elements_text(f -> 'v') x));
    elsif op in ('==', '>=', '<=', '>', '<', '!=') then
      w := w || format(' and (data ->> %L) %s %L', fld, case op when '==' then '=' when '!=' then '<>' else op end, f ->> 'v');
    else
      raise exception 'ck_query: ห้ามใช้ตัวเทียบ %', op;
    end if;
  end loop;
  if p_since is not null then w := w || format(' and server_at > %L', p_since); end if;
  execute 'select coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''data'', data)), ''[]''::jsonb) from public.ck_docs where ' || w
    into rows;
  if p_since is not null then
    select coalesce(jsonb_agg(distinct t.id), '[]'::jsonb) into gone
      from public.ck_trash t where t.col = p_col and t.deleted_at > p_since
       and not exists (select 1 from public.ck_docs d where d.col = t.col and d.id = t.id);
  end if;
  return jsonb_build_object('rows', rows, 'gone', coalesce(gone, '[]'::jsonb), 'now', now());
end $$;

create or replace function public.ck_get(p_col text, p_id text)
returns jsonb language sql stable as $$
  select data from public.ck_docs where col = p_col and id = p_id;
$$;

-- เขียน 1 เอกสาร · p_merge = รวมแบบลึก (Firestore merge) · ไม่ merge = ทับทั้งก้อน
create or replace function public.ck_set(p_col text, p_id text, p_data jsonb, p_merge boolean default false)
returns jsonb language plpgsql as $$
begin
  if coalesce(p_col, '') = '' or coalesce(p_id, '') = '' then raise exception 'ck_set: ต้องมี col และ id'; end if;
  insert into public.ck_docs (col, id, data, server_at) values (p_col, p_id, coalesce(p_data, '{}'::jsonb), now())
  on conflict (col, id) do update set
    data = case when p_merge then public._ck_deep(public.ck_docs.data, excluded.data) else excluded.data end,
    server_at = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.ck_delete(p_col text, p_id text)
returns jsonb language plpgsql as $$
begin
  insert into public.ck_trash (col, id, data)
    select col, id, data from public.ck_docs where col = p_col and id = p_id;
  delete from public.ck_docs where col = p_col and id = p_id;
  return jsonb_build_object('ok', true);
end $$;

-- ย้ายของเดิมเข้าเป็นก้อน (ใช้ตอนย้ายจาก Firestore) · p_docs = [{"id":..,"data":{..}}]
create or replace function public.ck_import(p_col text, p_docs jsonb)
returns jsonb language plpgsql as $$
declare n int;
begin
  insert into public.ck_docs (col, id, data, server_at)
    select p_col, x ->> 'id', x -> 'data', now() from jsonb_array_elements(p_docs) x
  on conflict (col, id) do update set data = excluded.data, server_at = now();
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'n', n);
end $$;

do $$
declare f text;
begin
  foreach f in array array['ck_query(text,jsonb,timestamptz)', 'ck_get(text,text)', 'ck_set(text,text,jsonb,boolean)',
                           'ck_delete(text,text)', 'ck_import(text,jsonb)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;

-- ขนาดฐานข้อมูลตอนนี้ (ดูว่าเหลือที่จาก 500 MB เท่าไร)
select pg_size_pretty(pg_database_size(current_database())) as db_size_now;
