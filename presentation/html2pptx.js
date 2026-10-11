const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const NM = path.resolve(__dirname, '../deck/node_modules');
const pptxgen = require(NM + '/pptxgenjs');
const src = path.resolve(process.argv[2]), out = process.argv[3];
const html = fs.readFileSync(src + '.html', 'utf8');
const IN = 144; // px per inch (1920px = 13.333in)
const hex = c => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/); if (!m) return null; if (m[4] !== undefined && +m[4] === 0) return null; return [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase(); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + src + '.html');
  await p.evaluate(() => document.fonts.ready);
  // pdf.js already transformed custom elements in the saved html? no: re-run transform from pdf.js via injected script
  await p.addScriptTag({ path: path.resolve(__dirname, 'transform.js') });
  await p.evaluate(() => window.__transform());
  const slides = await p.evaluate(() => {
    const res = [];
    document.querySelectorAll('section').forEach((sec, si) => {
      const so = sec.getBoundingClientRect();
      const items = [];
      const R = e => { const r = e.getBoundingClientRect(); return { x: r.left - so.left, y: r.top - so.top, w: r.width, h: r.height }; };
      const notes = (sec.querySelector('aside') || {}).textContent || '';
      let svgi = 0;
      const walk = (el) => {
        if (el.tagName === 'ASIDE') return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none') return;
        const r = R(el);
        if (el.tagName.toLowerCase() === 'svg') {
          const id = `s${si}_${svgi++}`; el.setAttribute('data-svgid', id);
          el.style.color = cs.color;
          items.push({ t: 'svg', id, ...r }); return;
        }
        // box
        const bw = ['Top', 'Right', 'Bottom', 'Left'].map(s => parseFloat(cs['border' + s + 'Width']) || 0);
        const bc = ['Top', 'Right', 'Bottom', 'Left'].map(s => cs['border' + s + 'Color']);
        const bg = cs.backgroundColor;
        const uniform = bw.every(v => v === bw[0]) && bc.every(c => c === bc[0]);
        if ((bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) || (uniform && bw[0] > 0)) {
          items.push({ t: 'box', ...r, bg, bw: uniform ? bw[0] : 0, bc: bc[0], rad: parseFloat(cs.borderTopLeftRadius) || 0 });
        }
        if (!uniform) ['Top', 'Right', 'Bottom', 'Left'].forEach((s, i) => { if (bw[i] > 0) items.push({ t: 'edge', side: s, ...r, bw: bw[i], bc: bc[i] }); });
        // text block?
        const kids = [...el.childNodes];
        const blockKids = kids.filter(n => n.nodeType === 1 && !['B', 'I', 'U', 'SPAN', 'BR', 'A', 'STRONG', 'EM'].includes(n.tagName));
        const hasText = kids.some(n => (n.nodeType === 3 && n.textContent.trim()) || (n.nodeType === 1 && ['B', 'I', 'U', 'SPAN', 'A', 'STRONG', 'EM'].includes(n.tagName) && n.textContent.trim()));
        if (hasText && blockKids.length === 0) {
          const runs = [];
          const addRuns = (node, inherit) => {
            for (const n of node.childNodes) {
              if (n.nodeType === 3) {
                let txt = n.textContent; const pc = getComputedStyle(n.parentElement);
                if (!/pre|nowrap/.test(pc.whiteSpace) || pc.whiteSpace === 'nowrap') txt = txt.replace(/[ \t\n\r]+/g, ' ');
                if (!txt) continue;
                runs.push({ text: txt, color: pc.color, w: parseInt(pc.fontWeight), italic: pc.fontStyle === 'italic', size: parseFloat(pc.fontSize), font: pc.fontFamily.split(',')[0].replace(/['"]/g, '').trim(), ls: parseFloat(pc.letterSpacing) || 0 });
              } else if (n.tagName === 'BR') runs.push({ br: true });
              else if (n.nodeType === 1) addRuns(n);
            }
          };
          addRuns(el);
          // trim leading/trailing spaces
          if (runs.length && runs[0].text) runs[0].text = runs[0].text.replace(/^ +/, '');
          const last = runs.filter(r => r.text).pop(); if (last) last.text = last.text.replace(/ +$/, '');
          const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
          const fs = parseFloat(cs.fontSize); const lh = cs.lineHeight === 'normal' ? fs * 1.3 : parseFloat(cs.lineHeight);
          // measure actual text extent
          const rg = document.createRange(); rg.selectNodeContents(el); const tr = rg.getBoundingClientRect();
          const lines = Math.round((r.h - pt - pb) / lh);
          const bullet = el.tagName === 'LI';
          items.push({ t: 'text', x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb, runs, align: cs.textAlign, lh, fs, lines, tw: tr.width, nowrap: cs.whiteSpace === 'nowrap', bullet });
          return;
        }
        for (const c of el.children) walk(c);
      };
      items.push({ t: 'bg', bg: getComputedStyle(sec).backgroundColor });
      for (const c of sec.children) walk(c);
      res.push({ id: sec.id, items, notes });
    });
    return res;
  });
  // rasterize svgs
  const svgs = await p.evaluate(() => [...document.querySelectorAll('[data-svgid]')].map(s => { const r = s.getBoundingClientRect(); const c = s.cloneNode(true); c.setAttribute('width', r.width); c.setAttribute('height', r.height); c.style.position = 'static'; c.style.left = c.style.top = ''; return { id: s.getAttribute('data-svgid'), w: r.width, h: r.height, html: c.outerHTML }; }));
  const q = await b.newPage({ deviceScaleFactor: 3 });
  const img = {};
  for (const s of svgs) {
    await q.setViewportSize({ width: Math.ceil(s.w) || 1, height: Math.ceil(s.h) || 1 });
    await q.setContent(`<html><body style="margin:0;background:transparent">${s.html}</body></html>`);
    img[s.id] = 'image/png;base64,' + (await q.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: Math.ceil(s.w) || 1, height: Math.ceil(s.h) || 1 } })).toString('base64');
  }
  await b.close();
  const pres = new pptxgen(); pres.layout = 'LAYOUT_WIDE'; pres.title = 'Online Car Rental System';
  const I = v => v / IN;
  for (const s of slides) {
    const sl = pres.addSlide();
    for (const it of s.items) {
      if (it.t === 'bg') { sl.background = { color: hex(it.bg) }; continue; }
      if (it.t === 'svg') { if (it.w > 0 && it.h > 0) sl.addImage({ data: img[it.id], x: I(it.x), y: I(it.y), w: I(it.w), h: I(it.h) }); continue; }
      if (it.t === 'box') {
        const fill = hex(it.bg); const line = it.bw > 0 && hex(it.bc) ? { color: hex(it.bc), width: it.bw * 0.5 } : undefined;
        const round = it.rad > 0;
        const o = { x: I(it.x), y: I(it.y), w: I(it.w), h: I(it.h), fill: fill ? { color: fill } : { type: 'none' }, line: line || { type: 'none' } };
        if (round) o.rectRadius = Math.min(it.rad, it.h / 2, it.w / 2) / Math.min(it.w, it.h);
        sl.addShape(round ? pres.ShapeType.roundRect : pres.ShapeType.rect, o); continue;
      }
      if (it.t === 'edge') {
        const c = hex(it.bc); if (!c) continue; const w = it.bw;
        const g = { Top: [it.x, it.y, it.w, w], Bottom: [it.x, it.y + it.h - w, it.w, w], Left: [it.x, it.y, w, it.h], Right: [it.x + it.w - w, it.y, w, it.h] }[it.side];
        sl.addShape(pres.ShapeType.rect, { x: I(g[0]), y: I(g[1]), w: I(g[2]), h: I(g[3]), fill: { color: c }, line: { type: 'none' } }); continue;
      }
      if (it.t === 'text') {
        const runs = []; for (const r of it.runs) {
          if (r.br) { if (runs.length) runs[runs.length - 1].options.breakLine = true; else runs.push({ text: '', options: { breakLine: true } }); continue; }
          const mono = /Mono/.test(r.font);
          let font = mono ? 'IBM Plex Mono' : 'IBM Plex Sans Thai', bold = r.w >= 650;
          if (mono) bold = r.w >= 600; else if (!bold && r.w >= 500) font = 'IBM Plex Sans Thai Medium';
          runs.push({ text: r.text.replace(/ /g, ' '), options: { color: hex(r.color) || '000000', bold, italic: r.italic, fontSize: r.size * 0.5, fontFace: font, charSpacing: r.ls ? r.ls * 0.5 : undefined } });
        }
        if (!runs.length) continue;
        if (it.bullet) runs[0].text = '• ' + runs[0].text;
        const single = it.lines <= 1;
        // slack so substituted fonts don't wrap/clip
        const slack = single ? Math.max(24, it.w * 0.08) : it.w * 0.04;
        let x = it.x, w = it.w + slack;
        if (it.align === 'center') x -= slack / 2; else if (it.align === 'right') x -= slack;
        sl.addText(runs, { x: I(x), y: I(it.y), w: I(w), h: I(Math.max(it.h, it.lh)), margin: 0, valign: 'top', align: ['center', 'right'].includes(it.align) ? it.align : 'left', lineSpacingMultiple: +(it.lh / it.fs / 1.17).toFixed(2), wrap: !(single || it.nowrap), fit: 'none', isTextBox: true, paraSpaceBefore: 0, paraSpaceAfter: 0 });
      }
    }
    if (s.notes.trim()) sl.addNotes(s.notes.trim());
  }
  await pres.writeFile({ fileName: out });
  console.log('wrote', out, slides.length);
})();
