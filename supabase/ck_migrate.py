"""ย้ายเช็คลิสต์ Firestore → Supabase (Training Record · ck_docs)

  python ck_migrate.py full        สำรองใหม่ → ย้ายทุกคอลเลกชัน → เทียบ → ถ้าตรงครบ ติดป้าย _meta/live (= สลับ)
  python ck_migrate.py full --nolive   เหมือนข้างบนแต่ยังไม่ติดป้าย (ซ้อม)
  python ck_migrate.py delta <ISO>  เก็บตก: ใบใน Firestore ที่ถูกแก้หลังเวลา <ISO> (เครื่องที่ยังเปิดหน้าเก่า)
                                    เติมเข้า Supabase เฉพาะที่ Supabase ไม่มี หรือของ Firestore ใหม่กว่า (เทียบ updatedAt)
Firestore ไม่ถูกแก้/ลบเลย (อ่านอย่างเดียว)"""
import json, os, sys, time, urllib.request, datetime

FS_KEY = 'AIzaSyB489GnLRlLL00a-5JhsGBn5y7W8STIGpI'
FS = 'https://firestore.googleapis.com/v1/projects/checklist-a89e2/databases/(default)/documents'
SB = 'https://cyjfgperenakjeazsfgf.supabase.co'
SB_KEY = 'sb_publishable_xAtQvH3Bdaqt7PVJGbkxWw_KVhfBszo'
COLS = ['appConfig', 'dailySummary', 'audits', 'jaedaengAudits', 'dailyChecklists']

def http(url, body=None, headers=None, timeout=180):
    h = {'Content-Type': 'application/json'}; h.update(headers or {})
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), headers=h,
                                 method='GET' if body is None else 'POST')
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                t = r.read().decode('utf-8'); return json.loads(t) if t else None
        except urllib.error.HTTPError as e:
            if e.code < 500 or i == 3: raise RuntimeError(f'{e.code} {e.read().decode()[:300]}')
        except Exception:
            if i == 3: raise
        time.sleep(2 * (i + 1))

fs_tok = http('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FS_KEY, {'returnSecureToken': True})['idToken']
sb_h = {'apikey': SB_KEY, 'Authorization': 'Bearer ' + http(SB + '/auth/v1/signup', {}, {'apikey': SB_KEY})['access_token']}
rpc = lambda fn, args: http(f'{SB}/rest/v1/rpc/{fn}', args, sb_h)

def val(v):
    k, x = next(iter(v.items()))
    if k == 'mapValue': return {a: val(b) for a, b in (x.get('fields') or {}).items()}
    if k == 'arrayValue': return [val(b) for b in (x.get('values') or [])]
    if k == 'integerValue': return int(x)
    if k == 'doubleValue': return float(x)
    if k == 'nullValue': return None
    return x

def fs_all(col):
    out, token = [], None
    while True:
        d = http(f'{FS}/{col}?pageSize=300' + (f'&pageToken={token}' if token else ''), headers={'Authorization': 'Bearer ' + fs_tok})
        for doc in d.get('documents', []):
            out.append((doc['name'].split('/')[-1], doc.get('updateTime', ''), {a: val(b) for a, b in (doc.get('fields') or {}).items()}))
        token = d.get('nextPageToken')
        if not token: return out

def canon(x): return json.dumps(x, sort_keys=True, ensure_ascii=False)

mode = sys.argv[1] if len(sys.argv) > 1 else ''
if mode == 'full':
    stamp = datetime.datetime.now().strftime('%Y-%m-%d_%H%M')
    out = rf'C:\Users\kanka\Desktop\Work\AI\Checklist-backup-{stamp}'
    os.makedirs(out, exist_ok=True)
    t0 = datetime.datetime.now(datetime.timezone.utc).isoformat()
    ok_all = True
    for col in COLS:
        docs = fs_all(col)
        json.dump([{'_id': i, '_updateTime': u, **d} for i, u, d in docs], open(os.path.join(out, col + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
        CH = 150
        for i in range(0, len(docs), CH):
            rpc('ck_import', {'p_col': col, 'p_docs': [{'id': i2, 'data': d} for i2, _, d in docs[i:i + CH]]})
        sb = {}
        after = None
        while True:   # ทีละหน้า 300 ใบ — ก้อนใหญ่เกินเวลาที่ฐานข้อมูลให้ต่อคำสั่ง
            rows = rpc('ck_query', {'p_col': col, 'p_filters': [], 'p_since': None, 'p_after': after, 'p_limit': 300})['rows']
            for r in rows: sb[r['id']] = r['data']
            if len(rows) < 300: break
            after = rows[-1]['id']
        bad = [i for i, _, d in docs if canon(sb.get(i)) != canon(d)]
        ok_all = ok_all and not bad and len(sb) >= len(docs)
        print(f'{col}: Firestore {len(docs)} · Supabase {len(sb)} · ไม่ตรง {len(bad)} {bad[:3]}'); sys.stdout.flush()
    print('สำรองไว้ที่', out, '· เริ่มย้าย', t0)
    if ok_all and '--nolive' not in sys.argv:
        rpc('ck_set', {'p_col': '_meta', 'p_id': 'live', 'p_data': {'since': t0, 'by': 'ck_migrate.py'}, 'p_merge': False})
        print('✅ ติดป้าย _meta/live แล้ว — แอปสลับไป Supabase')
    elif not ok_all:
        print('❌ ข้อมูลไม่ตรง — ยังไม่ติดป้าย ไม่มีอะไรสลับ')
elif mode == 'delta':
    since = datetime.datetime.fromisoformat(sys.argv[2].replace('Z', '+00:00'))
    def ts(u):
        u = u.rstrip('Z'); base, _, frac = u.partition('.')
        return datetime.datetime.fromisoformat(base + ('.' + (frac + '000000')[:6] if frac else '') + '+00:00')
    for col in COLS:
        n_add = n_up = n_conf = 0
        for i, u, d in fs_all(col):
            if not u or ts(u) <= since: continue
            cur = rpc('ck_get', {'p_col': col, 'p_id': i})
            if cur is None:
                rpc('ck_set', {'p_col': col, 'p_id': i, 'p_data': d, 'p_merge': False}); n_add += 1
            elif canon(cur) == canon(d):
                continue
            elif str(d.get('updatedAt', '')) > str(cur.get('updatedAt', '')) and d.get('updatedAt'):
                rpc('ck_set', {'p_col': col, 'p_id': i, 'p_data': d, 'p_merge': False}); n_up += 1
            else:
                n_conf += 1; print('  ต่างกันแต่ตัดสินไม่ได้ (ไม่แตะ):', col, i)
        print(f'{col}: เติมใหม่ {n_add} · อัปเดต {n_up} · ปล่อยไว้ {n_conf}')
else:
    print(__doc__)
