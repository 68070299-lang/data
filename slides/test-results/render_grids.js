// Render MySQL-client style result grids to PNG.
// usage: node render.js spec.json outdir
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const F = process.env.FONTDIR;
const b64 = p => 'data:font/woff2;base64,'+fs.readFileSync(p).toString('base64');
const font = (w, sub) => b64(`${F}/fontsource-ibm-plex-sans-thai-5.3.0/files/ibm-plex-sans-thai-${sub}-${w}-normal.woff2`);
const mono = w => b64(`${F}/fontsource-ibm-plex-mono-5.3.0/files/ibm-plex-mono-latin-${w}-normal.woff2`);
const css = `
@font-face{font-family:P;src:url(${font(400,'thai')});font-weight:400;unicode-range:U+0E00-0E7F}
@font-face{font-family:P;src:url(${font(400,'latin')});font-weight:400}
@font-face{font-family:P;src:url(${font(600,'thai')});font-weight:600;unicode-range:U+0E00-0E7F}
@font-face{font-family:P;src:url(${font(600,'latin')});font-weight:600}
@font-face{font-family:M;src:url(${mono(400)});font-weight:400}
*{box-sizing:border-box;margin:0;padding:0}
body{background:transparent;font-family:P;color:#1f2937}
.win{display:inline-block;background:#fff;border:1px solid #c7ccd4;border-radius:8px;overflow:hidden}
.bar{display:flex;align-items:center;gap:14px;background:#eef0f3;border-bottom:1px solid #d5d9df;padding:0 12px;height:calc(var(--f)*2.1);font-size:calc(var(--f)*.82);color:#4b5563}
.tab{font-weight:600;color:#111827;display:flex;align-items:center;gap:7px}
.tab i{display:inline-block;width:calc(var(--f)*.8);height:calc(var(--f)*.8);border:2px solid #3b6fb6;border-radius:2px;background:linear-gradient(#3b6fb6,#3b6fb6) 0 33%/100% 2px no-repeat,linear-gradient(#3b6fb6,#3b6fb6) 0 66%/100% 2px no-repeat,linear-gradient(#3b6fb6,#3b6fb6) 50% 0/2px 100% no-repeat}
.sep{width:1px;height:55%;background:#c9ced6}
.q{font-family:M;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wrap{position:relative;overflow:hidden}
table{border-collapse:collapse;font-size:var(--f);white-space:nowrap}
th,td{border-right:1px solid #e3e6ea;border-bottom:1px solid #e3e6ea;padding:calc(var(--f)*.32) calc(var(--f)*.6);text-align:left}
th{background:#f6f7f9;font-weight:600;color:#111827;border-bottom:1px solid #cfd4db}
td.n,th.n{text-align:right}
td.rn,th.rn{background:#f6f7f9;color:#9aa1ab;text-align:right;font-size:calc(var(--f)*.8)}
tr.sel td{background:#dbe7fb}
tr.sel td.rn{background:#c9dbf7;color:#3b5f98}
td.null{color:#9ca3af;font-style:italic}
td.bad{color:#b91c1c;font-weight:600}
tr:nth-child(even) td:not(.rn){background:#fbfbfc}
tr.sel:nth-child(even) td:not(.rn){background:#dbe7fb}
.empty{height:calc(var(--f)*3.2);border-bottom:1px solid #e3e6ea;background:repeating-linear-gradient(#fff 0 calc(var(--f)*1.6),#fbfbfc calc(var(--f)*1.6) calc(var(--f)*3.2))}
.status{display:flex;align-items:center;gap:10px;background:#f6f7f9;border-top:1px solid #d5d9df;padding:0 12px;height:calc(var(--f)*1.9);font-size:calc(var(--f)*.8);color:#374151}
.ok{color:#15803d;font-weight:600}.err{color:#b91c1c;font-weight:600}
.status .r{margin-left:auto;color:#6b7280}
.hs{position:absolute;left:0;right:0;bottom:0;height:8px;background:#eef0f3}
.hs b{position:absolute;left:2px;top:2px;height:4px;border-radius:2px;background:#aeb4bd}
.vs{position:absolute;top:0;right:0;bottom:0;width:8px;background:#eef0f3}
.vs b{position:absolute;right:2px;top:2px;width:4px;border-radius:2px;background:#aeb4bd}
.log table{width:100%;white-space:normal}.log td{white-space:normal;vertical-align:top}.log td.rn{color:#dc2626;font-size:var(--f);white-space:nowrap}.x{color:#dc2626}
`;
const isNum = v => /^-?\d+(\.\d+)?$/.test(v);
function html(s){
  const f = s.font || 18;
  const off = s.offset||0; const rows = s.rows.slice(off, off + (s.show ?? s.rows.length));
  const numCols = s.cols.map((c,i)=> s.rows.length && s.rows.every(r=> r[i]==='NULL' || isNum(r[i])));
  let t = `<table><tr><th class="rn"></th>${s.cols.map((c,i)=>`<th class="${numCols[i]?'n':''}">${c}</th>`).join('')}</tr>`;
  rows.forEach((r,ri)=>{
    t += `<tr class="${(s.sel||[]).includes(off+ri)?'sel':''}"><td class="rn">${s.icons? s.icons[ri] : off+ri+1}</td>` + r.map((v,i)=>{
      const cls=[numCols[i]?'n':'', v==='NULL'?'null':'', (s.bad||[]).some(b=>(b[0]===off+ri||b[0]===-1)&&b[1]===i)?'bad':''].join(' ');
      return `<td class="${cls}">${v}</td>`;}).join('') + '</tr>';
  });
  t += '</table>';
  const empty = s.rows.length===0 ? '<div class="empty"></div>' : '';
  const more = rows.length < s.rows.length; const top = 100*off/Math.max(1,s.rows.length);
  const status = s.status || (s.rows.length===0 ? `<span class="ok">✔</span> 0 row(s) returned`
     : `<span class="ok">✔</span> ${s.rows.length} row(s) returned`);
  const right = s.right ?? (more ? `แถว ${off+1}–${off+rows.length} จาก ${s.rows.length}` : '');
  return `<html><head><style>${css}</style></head><body style="--f:${f}px">
  <div class="win" id="w" style="${s.width?`width:${s.width}px`:''}">
   <div class="bar"><span class="tab"><i></i>${s.tab||'Result Grid'}</span><span class="sep"></span><span class="q">${s.title||''}</span></div>
   <div class="wrap ${s.log?'log':''}" id="wrap">${t}${empty}${more?'<div class="vs"><b style="top:calc(2px + '+top+'%);height:'+Math.max(18,100*rows.length/s.rows.length)+'%"></b></div>':''}</div>
   <div class="status">${status}<span class="r">${right}</span></div>
  </div></body></html>`;
}
(async()=>{
  const specs = JSON.parse(fs.readFileSync(process.argv[2]));
  const out = process.argv[3]; fs.mkdirSync(out,{recursive:true});
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p = await b.newPage({deviceScaleFactor: 2, viewport:{width:2400,height:1400}});
  const report = {};
  for (const s of specs){
    await p.setContent(html(s)); await p.evaluate(()=>document.fonts.ready);
    const tw = await p.$eval('table', e=>e.scrollWidth);
    const el = await p.$('#w'); const bb = await el.boundingBox();
    report[s.name] = {natural: tw, w: Math.round(bb.width), h: Math.round(bb.height)};
    if (!s.measureOnly) await el.screenshot({path: path.join(out, s.name+'.png'), omitBackground:true});
  }
  console.log(JSON.stringify(report));
  await b.close();
})();
