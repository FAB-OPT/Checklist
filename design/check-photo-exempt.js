/* ตรวจว่า "ยึดข้อความ" ครอบข้อไหนบ้างในฟอร์มจริงทั้ง 4 ชุดของยามะจัง + ซานตาเฟ่/เจ๊แดง
   กันพลาดว่ากติกาไปโดนข้อที่ไม่ตั้งใจ */
const fs=require('fs');
const src=fs.readFileSync('C:/Users/kanka/Desktop/Work/AI/Checklist/index.html','utf8');
function block(v){
  const i=src.indexOf('const '+v+' = ['); if(i<0) return null;
  let j=src.indexOf('[',i),d=0,k=j;
  for(;;){const c=src[k]; if(c==='[')d++; else if(c===']'){d--; if(!d)break;} k++;}
  return src.slice(j,k+1);
}
const SEC=/\{\s*name:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\n  \]\s*\}/g;
function items(body){
  body=body.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
  const out=[];
  body.split('\n').forEach(function(l){
    const s=l.trim().replace(/,$/,'');
    if(s.startsWith('{')&&s.indexOf('text:')>=0){const m=s.match(/text:\s*"([^"]*)"/); if(m)out.push(m[1]);}
    else if(s.startsWith('"')&&s.endsWith('"')) out.push(s.slice(1,-1));
  });
  return out;
}
const RULE=t=>t.trim().indexOf('สุ่มชิมวัตถุดิบ')===0;
['YAMACHAN_OPEN','YAMACHAN_CLOSE','DAILY_OPEN','DAILY_CLOSE','DAILY_OPEN_55','DAILY_CLOSE_55','JAEDAENG_CHECKLIST'].forEach(function(v){
  const b=block(v); if(!b){console.log('ไม่เจอ '+v);return;}
  SEC.lastIndex=0; let m,tot=0,hit=[],lines=[];
  while((m=SEC.exec(b))){
    const it=items(m[2]); tot+=it.length;
    it.forEach(function(t,i){ if(RULE(t)) hit.push(m[1]+' ข้อ '+(i+1)+': '+t); });
    lines.push(m[1]+' '+it.length);
  }
  console.log('■ '+v.padEnd(20)+tot+' ข้อ  ['+lines.join(' · ')+']  → เข้าเงื่อนไขยกเว้น '+hit.length+' ข้อ');
  hit.forEach(function(h){console.log('     '+h);});
});
