/* =====================================================================
   RestaurantOS 2.0 apps: What's New, Sheets, Mail, Recipe Book,
   Focus Sessions, Order Up!, Blocks   (all v2: hidden in 1.0)
   ===================================================================== */

/* ---------------- WHAT'S NEW ---------------- */
defApp({
  id: 'whatsnew', name: "What's New", glyph: 'star', colors: ['#ffd166', '#ff4d6d'], w: 980, h: 660, cat: 'System', v2: true, single: true, desc: 'Tour the 20 new features of RestaurantOS 2.0', kw: 'release notes update tour 2.0',
  run(w) {
    w.body.innerHTML = `<div class="scroll" style="flex:1"><div class="wn-hero"><div class="wn-glow"></div><div style="width:64px;position:relative">${NLOGO}</div><div style="position:relative"><div class="wn-eyebrow">Build 26.11 "Bistro"</div><h1>RestaurantOS <span>2.0</span></h1><p>Twenty new features, seven new apps, and a fresh coat of paint. Click any card to try it.</p></div></div>
      <div class="wn-grid">${V2_FEATURES.map(([ic, t, d, f], i) => `<button class="wn-card" data-i="${i}" style="animation-delay:${i * 30}ms"><span class="wn-n">${String(i + 1).padStart(2, '0')}</span><span class="wn-ic">${svg(ic)}</span><b>${t}</b><small>${d}</small>${f ? '<em>Try it →</em>' : ''}</button>`).join('')}</div></div>`;
    $$('.wn-card', w.body).forEach(c => c.onclick = () => { const f = V2_FEATURES[+c.dataset.i][3]; if (f) f(); });
  }
});

/* ---------------- SHEETS ---------------- */
const SH_COLS = 'ABCDEFGHIJ'.split(''), SH_ROWS = 30;
const SH_SAMPLE = { A1: 'Dish', B1: 'Price', C1: 'Sold', D1: 'Revenue', A2: 'Margherita Pizza', B2: '12.5', C2: '48', D2: '=B2*C2', A3: 'Carbonara', B3: '14', C3: '35', D3: '=B3*C3', A4: 'Chicken Curry', B4: '13.5', C4: '29', D4: '=B4*C4', A5: 'Caesar Salad', B5: '9', C5: '41', D5: '=B5*C5', A6: 'Burger & Fries', B6: '11', C6: '62', D6: '=B6*C6', A7: 'Tiramisu', B7: '6.5', C7: '33', D7: '=B7*C7', A9: 'Total', C9: '=SUM(C2:C7)', D9: '=SUM(D2:D7)', A10: 'Average price', B10: '=AVG(B2:B7)', A11: 'Best seller (sold)', C11: '=MAX(C2:C7)', F1: 'Tip: click a cell, type =B2*C2 and press Enter' };
defApp({
  id: 'sheets', name: 'Sheets', glyph: 'grid', colors: ['#3ddc97', '#15803d'], w: 1000, h: 620, cat: 'Productivity', v2: true, desc: 'Spreadsheets with formulas and charts', kw: 'excel spreadsheet table csv calc',
  run(w, args) {
    let D = {}, bold = {}, sel = 'A1', path = args.path || null;
    if (path) loadCSV(FS.read(path) || ''); else { const st = Store.get('sheet', null); D = st ? st.D : { ...SH_SAMPLE }; bold = st ? st.bold : { A1: 1, B1: 1, C1: 1, D1: 1, A9: 1, D9: 1 }; }
    function loadCSV(txt) { D = {}; bold = {}; txt.split(/\r?\n/).forEach((line, r) => { const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []; cells.slice(0, SH_COLS.length).forEach((c, ci) => { c = c.replace(/,$/, ''); if (/^".*"$/.test(c)) c = c.slice(1, -1).replace(/""/g, '"'); if (c) D[SH_COLS[ci] + (r + 1)] = c; }); }); }
    const toCSV = () => { let maxR = 0, maxC = 0; Object.keys(D).forEach(k => { const c = SH_COLS.indexOf(k[0]), r = +k.slice(1); if (D[k] !== '') { maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); } }); const out = []; for (let r = 1; r <= maxR; r++) { const row = []; for (let c = 0; c <= maxC; c++) { const v = String(D[SH_COLS[c] + r] ?? ''); row.push(/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v); } out.push(row.join(',')); } return out.join('\n'); };
    const save = () => { if (!path) Store.set('sheet', { D, bold }); };
    const range = (a, b) => { const c1 = SH_COLS.indexOf(a[0]), c2 = SH_COLS.indexOf(b[0]), r1 = +a.slice(1), r2 = +b.slice(1); const out = []; for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) out.push(SH_COLS[c] + r); return out; };
    const val = (ref, stack = new Set()) => {
      const raw = D[ref]; if (raw == null || raw === '') return '';
      if (!String(raw).startsWith('=')) return isNaN(+raw) ? raw : +raw;
      if (stack.has(ref)) throw new Error('#CIRC'); stack.add(ref);
      let e = raw.slice(1).toUpperCase();
      e = e.replace(/\b(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-J]\d+):([A-J]\d+)\)/g, (m, fn, a, b) => { const vs = range(a, b).map(r => val(r, new Set(stack))).filter(v => typeof v === 'number'); const r = fn === 'SUM' ? vs.reduce((x, y) => x + y, 0) : fn === 'COUNT' ? vs.length : !vs.length ? 0 : fn === 'MIN' ? Math.min(...vs) : fn === 'MAX' ? Math.max(...vs) : vs.reduce((x, y) => x + y, 0) / vs.length; return '(' + r + ')'; });
      e = e.replace(/\b([A-J])(\d{1,2})\b/g, m => { const v = val(m, new Set(stack)); return '(' + (typeof v === 'number' ? v : 0) + ')'; });
      if (!/^[\d\s+\-*/().%^]*$/.test(e)) throw new Error('#NAME?');
      const r = Function('"use strict";return (' + e.replace(/\^/g, '**') + ')')(); if (typeof r !== 'number' || !isFinite(r)) throw new Error('#DIV/0'); return r;
    };
    const show = ref => { try { const v = val(ref); return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : String(v); } catch (e) { return e.message.startsWith('#') ? e.message : '#ERR'; } };
    w.body.innerHTML = `<div class="app-tb"><button class="tbtn" data-a="new" title="New sheet">${svg('newfile')}</button><button class="tbtn" data-a="open" title="Open CSV">${svg('open')}</button><button class="tbtn" data-a="save" title="Save as CSV">${svg('save')}</button><span class="sep"></span><button class="tbtn" data-a="bold" title="Bold"><b>B</b></button><button class="tbtn" data-a="sum" title="AutoSum">Σ</button><button class="tbtn" data-a="chart" title="Chart this column">${svg('taskmgr')} Chart</button><span class="grow"></span><span class="muted fn" style="font-size:12px"></span></div>
      <div class="sh-fbar"><span class="sh-ref"></span><span class="muted">fx</span><input class="sh-in" spellcheck="false" aria-label="Cell contents"></div>
      <div class="scroll sh-wrap" style="flex:1" tabindex="0"><table class="sh-t"><thead><tr><th></th>${SH_COLS.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: SH_ROWS }, (_, r) => `<tr><th>${r + 1}</th>${SH_COLS.map(c => `<td data-r="${c}${r + 1}"></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="statusbar"><span class="sh-stat"></span></div>`;
    const inp = $('.sh-in', w.body), wrap = $('.sh-wrap', w.body);
    const paint = () => { $$('td[data-r]', w.body).forEach(td => { const r = td.dataset.r; td.textContent = show(r); td.classList.toggle('sel', r === sel); td.classList.toggle('b', !!bold[r]); td.classList.toggle('num', !isNaN(parseFloat(td.textContent)) && isFinite(td.textContent)); }); $('.sh-ref', w.body).textContent = sel; inp.value = D[sel] ?? ''; $('.fn', w.body).textContent = path || 'Autosaved'; const v = show(sel); $('.sh-stat', w.body).textContent = String(D[sel] ?? '').startsWith('=') ? `${sel} = ${v}` : `${sel}`; w.setTitle((path ? FS.parts(path).pop() : 'Restaurant sales') + ' — Sheets'); };
    const commit = (move = 'down') => { const v = inp.value; if (v) D[sel] = v; else delete D[sel]; save(); if (move === 'down') go(0, 1); else paint(); wrap.focus(); };
    const go = (dc, dr) => { const c = clamp(SH_COLS.indexOf(sel[0]) + dc, 0, SH_COLS.length - 1), r = clamp(+sel.slice(1) + dr, 1, SH_ROWS); sel = SH_COLS[c] + r; paint(); $(`td[data-r="${sel}"]`, w.body)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); };
    $('tbody', w.body).onclick = e => { const td = e.target.closest('td[data-r]'); if (!td) return; if (e.detail === 2) { sel = td.dataset.r; paint(); inp.focus(); return; } sel = td.dataset.r; paint(); wrap.focus(); };
    wrap.onkeydown = e => {
      const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], Tab: [1, 0], Enter: [0, 1] }[e.key];
      if (m) { e.preventDefault(); go(...m); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { delete D[sel]; save(); paint(); }
      else if (e.key === 'F2') { inp.focus(); }
      else if (e.key.length === 1 && !e.ctrlKey && !e.altKey) { inp.value = ''; inp.focus(); }
    };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { inp.value = D[sel] ?? ''; wrap.focus(); } if (e.key === 'Tab') { e.preventDefault(); commit('none'); go(1, 0); } };
    const act = async a => {
      if (a === 'new') { if (await UI.confirm('New sheet?', 'Start an empty sheet. The current one is replaced unless it was saved as a file.', 'New sheet')) { D = {}; bold = {}; path = null; save(); sel = 'A1'; paint(); } }
      if (a === 'open') { const p = await pickFile('Open a CSV file', f => /\.csv$/i.test(f.name)); if (p) { path = p; loadCSV(FS.read(p)); paint(); } }
      if (a === 'save') { if (!path) { const n = await UI.prompt('Save as CSV', 'File name:', FS.uniq('/Documents', 'Restaurant sales.csv')); if (!n) return; path = '/Documents/' + (n.endsWith('.csv') ? n : n + '.csv'); } FS.write(path, toCSV()); notify('Sheet saved', path, 'sheets'); paint(); }
      if (a === 'bold') { bold[sel] = !bold[sel]; save(); paint(); }
      if (a === 'sum') { const c = sel[0]; let r = +sel.slice(1) - 1; const end = r; while (r >= 1 && typeof (() => { try { return val(c + r); } catch (e) { return ''; } })() === 'number') r--; if (end > r) { D[sel] = `=SUM(${c}${r + 1}:${c}${end})`; save(); paint(); } }
      if (a === 'chart') {
        const c = sel[0], rows = []; for (let r = 1; r <= SH_ROWS; r++) { let v; try { v = val(c + r); } catch (e) { v = ''; } if (typeof v === 'number') rows.push([String(D['A' + r] ?? c + r), v]); }
        if (!rows.length) return UI.alert('Nothing to chart', `Column ${c} has no numbers. Select a cell in a column with numbers, then click Chart.`);
        const back = html(`<div class="modal-back"><div class="modal glass" style="width:min(640px,calc(100vw - 32px))"><h3>${esc(String(D[c + '1'] ?? 'Column ' + c))}</h3><canvas width="580" height="300" style="width:100%;max-width:100%"></canvas><div class="acts"><button class="btn primary">Close</button></div></div></div>`);
        $('#os').appendChild(back); back.querySelector('button').onclick = () => back.remove();
        const cv = back.querySelector('canvas'), x = cv.getContext('2d'), mx = Math.max(...rows.map(r => r[1])), bw = 520 / rows.length;
        const fg = getComputedStyle(w.el).color, acc = getComputedStyle(document.documentElement).getPropertyValue('--accent');
        x.strokeStyle = 'rgba(127,127,127,.25)'; for (let i = 0; i <= 4; i++) { const y = 260 - i * 60; x.beginPath(); x.moveTo(50, y); x.lineTo(575, y); x.stroke(); x.fillStyle = fg; x.font = '11px Outfit'; x.fillText(String(Math.round(mx * i / 4)), 4, y + 4); }
        rows.forEach(([l, v], i) => { const h = v / mx * 240; x.fillStyle = acc; x.fillRect(56 + i * bw + bw * .15, 260 - h, bw * .7, h); x.fillStyle = fg; x.font = '11px Outfit'; x.textAlign = 'center'; x.fillText(l.slice(0, 12), 56 + i * bw + bw / 2, 278); x.fillText(Number.isInteger(v) ? v : v.toFixed(1), 56 + i * bw + bw / 2, 254 - h); x.textAlign = 'start'; });
      }
    };
    $$('[data-a]', w.body).forEach(b => b.onclick = () => act(b.dataset.a));
    paint(); setTimeout(() => wrap.focus(), 100);
  }
});

/* ---------------- MAIL ---------------- */
const mailAddr = () => (S.user || 'user').toLowerCase().replace(/[^a-z0-9]+/g, '.') + '@restaurantos.dev';
const MAIL_SEED = () => [
  { from: 'team@restaurantos.dev', name: 'RestaurantOS Team', subj: 'Welcome to RestaurantOS 2.0 🎉', body: `Hi ${S.user || 'there'},\n\nThanks for updating! RestaurantOS 2.0 brings Snap Layouts, Live Activities, desktop widgets, a floating dock and seven new apps.\n\nOpen "What's New" from the Start menu for a guided tour.\n\nBon appétit,\nThe RestaurantOS Team`, h: 0 },
  { from: 'chef.remy@restopedia.org', name: 'Chef Remy', subj: 'Recipe of the week: Carbonara', body: 'Ciao!\n\nThis week: a real Carbonara. No cream, ever. Eggs, Pecorino, guanciale and lots of black pepper.\n\nYou can find it in the new Recipe Book app, with timers for every step.\n\n– Remy', h: 3 },
  { from: 'store@restaurantos.dev', name: 'RestoStore', subj: 'New in RestoStore: Order Up! and Blocks', body: 'Two new games are built into RestaurantOS 2.0:\n\n• Order Up! — run a burger grill and serve customers before they lose patience.\n• Blocks — the falling-block puzzle classic, with ghost pieces.\n\nHave fun!', h: 20 },
  { from: 'security@restaurantos.dev', name: 'RestoDefender', subj: 'Your weekly security summary', body: 'RestoDefender checked your PC this week.\n\n• Threats found: 0\n• Secure Boot: on\n• Last scan: today\n\nNo action is needed.', h: 30 },
  { from: 'hello@bistro-luna.example', name: 'Bistro Luna', subj: 'Your table for Friday is confirmed', body: 'Good news! Your table for 2 on Friday at 19:30 is confirmed.\n\nIf your plans change, just reply to this email.\n\nSee you soon,\nBistro Luna', h: 52 }
].map((m, i) => ({ id: uid(), folder: 'inbox', to: mailAddr(), t: Date.now() - m.h * 3600000 - i * 60000, read: i > 1, star: i === 1, ...m }));
defApp({
  id: 'mail', name: 'Mail', glyph: 'send', colors: ['#4cc9f0', '#3a56d4'], w: 1000, h: 620, cat: 'Productivity', v2: true, single: true, desc: 'Your inbox, with folders, stars and compose', kw: 'email inbox outlook gmail messages',
  run(w) {
    let M = Store.get('mail', null); if (!M) { M = MAIL_SEED(); Store.set('mail', M); }
    let folder = 'inbox', cur = null, q = '';
    const save = () => Store.set('mail', M);
    const F = [['inbox', 'Inbox', 'download'], ['star', 'Starred', 'star'], ['sent', 'Sent', 'send'], ['drafts', 'Drafts', 'edit'], ['trash', 'Trash', 'trash']];
    const list = () => M.filter(m => (folder === 'star' ? m.star && m.folder !== 'trash' : m.folder === folder) && (!q || (m.subj + m.body + m.name).toLowerCase().includes(q))).sort((a, b) => b.t - a.t);
    const when = t => { const d = new Date(t); return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' }); };
    const render = () => {
      const L = list(); const m = M.find(x => x.id === cur);
      w.body.innerHTML = `<div class="split"><nav class="side" style="width:190px"><button class="btn primary" id="mlNew" style="margin:4px 4px 10px">${svg('edit')} New mail</button>${F.map(([k, n, ic]) => { const c = k === 'inbox' ? M.filter(x => x.folder === 'inbox' && !x.read).length : 0; return `<button data-f="${k}" class="${folder === k ? 'on' : ''}">${svg(ic)}<span style="flex:1">${n}</span>${c ? `<span class="chip">${c}</span>` : ''}</button>`; }).join('')}<div class="sh">Account</div><div class="muted" style="font-size:11px;padding:0 10px;word-break:break-all">${esc(mailAddr())}</div></nav>
        <div class="ml-list"><div style="padding:8px"><input class="fx-search" style="width:100%" placeholder="Search mail" value="${esc(q)}" aria-label="Search mail"></div>${L.map(x => `<div class="ml-it ${x.read ? '' : 'unread'} ${x.id === cur ? 'on' : ''}" data-id="${x.id}"><div class="row" style="flex-wrap:nowrap;justify-content:space-between"><b>${esc(folder === 'sent' || folder === 'drafts' ? 'To: ' + (x.to || '(no recipient)') : x.name)}</b><small class="muted">${when(x.t)}</small></div><div class="ml-s">${x.star ? '★ ' : ''}${esc(x.subj || '(no subject)')}</div><div class="ml-p muted">${esc(x.body.slice(0, 90))}</div></div>`).join('') || '<div class="empty">Nothing here</div>'}</div>
        <div class="ml-read scroll">${m ? `<div class="app-tb" style="border:0"><button class="tbtn" data-m="reply">${svg('back')} Reply</button><button class="tbtn" data-m="fwd">${svg('fwd')} Forward</button><button class="tbtn" data-m="star">${svg('star')} ${m.star ? 'Unstar' : 'Star'}</button><button class="tbtn" data-m="unread">Mark unread</button><button class="tbtn" data-m="del">${svg('trash')} ${m.folder === 'trash' ? 'Delete forever' : 'Delete'}</button></div><div class="pad"><h2 style="margin:0 0 12px;font-size:20px">${esc(m.subj || '(no subject)')}</h2><div class="row" style="margin-bottom:18px">${avatarEl('', (m.name || 'x').length, m.name || m.to).replace('class="av', 'style="width:40px;height:40px;font-size:16px" class="av')}<div><b>${esc(m.name || 'You')}</b> <span class="muted" style="font-size:12px">&lt;${esc(m.from)}&gt;</span><div class="muted" style="font-size:12px">to ${esc(m.to)} · ${new Date(m.t).toLocaleString()}</div></div></div><div style="white-space:pre-wrap;line-height:1.7">${esc(m.body)}</div></div>` : '<div class="empty">' + svg('send') + '<b>Select a message to read it</b></div>'}</div></div>`;
      $('#mlNew', w.body).onclick = () => compose();
      $$('[data-f]', w.body).forEach(b => b.onclick = () => { folder = b.dataset.f; cur = null; render(); });
      $$('.ml-it', w.body).forEach(it => it.onclick = () => { cur = it.dataset.id; const x = M.find(y => y.id === cur); if (x.folder === 'drafts') return compose(x); x.read = true; save(); render(); });
      const s = $('.fx-search', w.body); s.oninput = () => { q = s.value.toLowerCase(); render(); const n = $('.fx-search', w.body); n.focus(); n.setSelectionRange(q.length, q.length); };
      $$('[data-m]', w.body).forEach(b => b.onclick = () => { const a = b.dataset.m;
        if (a === 'reply') compose({ to: m.from, subj: /^re:/i.test(m.subj) ? m.subj : 'Re: ' + m.subj, body: `\n\nOn ${new Date(m.t).toLocaleString()}, ${m.name} wrote:\n> ${m.body.split('\n').join('\n> ')}` });
        if (a === 'fwd') compose({ to: '', subj: 'Fwd: ' + m.subj, body: `\n\n---------- Forwarded message ----------\nFrom: ${m.name} <${m.from}>\n\n${m.body}` });
        if (a === 'star') { m.star = !m.star; save(); render(); }
        if (a === 'unread') { m.read = false; cur = null; save(); render(); }
        if (a === 'del') { if (m.folder === 'trash') M = M.filter(x => x !== m); else m.folder = 'trash'; cur = null; save(); render(); Snd.play('trash'); }
      });
      w.setTitle(`${F.find(f => f[0] === folder)[1]} — Mail`);
    };
    const compose = (pre = {}) => {
      const back = html(`<div class="ml-compose glass"><div class="vp-h"><b>${pre.id ? 'Edit draft' : 'New message'}</b><button data-x aria-label="Close">✕</button></div><input class="inp" id="mcTo" placeholder="To" value="${esc(pre.to || '')}"><input class="inp" id="mcSu" placeholder="Subject" value="${esc(pre.subj || '')}"><textarea class="inp" id="mcBo" placeholder="Write your message…">${esc(pre.body || '')}</textarea><div class="row" style="justify-content:space-between"><span class="muted" style="font-size:11px">Tip: send to ${esc(mailAddr())} or "me" to mail yourself</span><button class="btn primary" data-s>${svg('send')} Send</button></div></div>`);
      w.body.appendChild(back); $('#mcTo', back).focus(); $$('input,textarea', back).forEach(i => i.onkeydown = e => e.stopPropagation());
      const vals = () => ({ to: $('#mcTo', back).value.trim(), subj: $('#mcSu', back).value.trim(), body: $('#mcBo', back).value });
      $('[data-x]', back).onclick = () => { const v = vals(); if (v.to || v.subj || v.body.trim()) { if (pre.id) Object.assign(M.find(x => x.id === pre.id), v, { t: Date.now() }); else M.push({ id: uid(), folder: 'drafts', from: mailAddr(), name: S.user, t: Date.now(), read: true, ...v }); save(); notify('Draft saved', v.subj || '(no subject)', 'mail'); } back.remove(); render(); };
      $('[data-s]', back).onclick = () => {
        const v = vals(); if (!v.to) { $('#mcTo', back).focus(); Snd.play('error'); return; }
        if (pre.id) M = M.filter(x => x.id !== pre.id);
        M.push({ id: uid(), folder: 'sent', from: mailAddr(), name: S.user, t: Date.now(), read: true, ...v }); save(); back.remove(); render(); Snd.play('pop');
        const self = v.to.toLowerCase() === 'me' || v.to.toLowerCase() === mailAddr();
        setTimeout(() => {
          const inc = self ? { from: mailAddr(), name: S.user || 'Me', to: mailAddr(), subj: v.subj, body: v.body } : { from: 'mailer-daemon@restaurantos.dev', name: 'Mail Delivery', to: mailAddr(), subj: 'Delivered locally: ' + (v.subj || '(no subject)'), body: `Your message to ${v.to} was saved in Sent.\n\nRestaurantOS Mail is a local mailbox, so messages to outside addresses stay on this PC.` };
          M.push({ id: uid(), folder: 'inbox', t: Date.now(), read: false, star: false, ...inc }); save(); render(); notify(inc.name, inc.subj, 'mail');
        }, 2500);
      };
    };
    render();
  }
});

/* ---------------- RECIPE BOOK ---------------- */
const RECIPES = [
  { id: 'pizza', name: 'Margherita Pizza', e: '🍕', c: ['#ff7a45', '#c2410c'], mins: 45, serves: 2, lvl: 'Medium', ing: [[250, 'g', 'bread flour'], [160, 'ml', 'warm water'], [5, 'g', 'dried yeast'], [1, 'tsp', 'salt'], [150, 'g', 'tomato passata'], [125, 'g', 'fresh mozzarella'], [6, '', 'basil leaves'], [1, 'tbsp', 'olive oil']], steps: [['Mix flour, yeast, salt and water into a soft dough. Knead for 8 minutes.', 8], ['Cover and let the dough rise somewhere warm.', 20], ['Heat the oven as hot as it goes (250°C).', 0], ['Stretch the dough thin, spread the passata, tear over the mozzarella.', 0], ['Bake until the crust is blistered and golden.', 9], ['Finish with basil and a drizzle of olive oil.', 0]] },
  { id: 'carbonara', name: 'Spaghetti Carbonara', e: '🍝', c: ['#ffd166', '#e08e0b'], mins: 20, serves: 2, lvl: 'Easy', ing: [[200, 'g', 'spaghetti'], [100, 'g', 'guanciale or pancetta'], [2, '', 'eggs'], [1, '', 'egg yolk'], [40, 'g', 'Pecorino Romano'], [1, 'tsp', 'black pepper']], steps: [['Boil the spaghetti in well-salted water.', 10], ['Fry the guanciale until crisp; turn off the heat.', 6], ['Whisk eggs, yolk, Pecorino and pepper.', 0], ['Toss pasta with guanciale, then the egg mix off the heat, adding pasta water until silky.', 0]] },
  { id: 'curry', name: 'Chicken Curry', e: '🍛', c: ['#f4a261', '#9c4a1a'], mins: 40, serves: 4, lvl: 'Medium', ing: [[600, 'g', 'chicken thighs'], [2, '', 'onions'], [3, '', 'garlic cloves'], [1, 'tbsp', 'grated ginger'], [2, 'tbsp', 'curry paste'], [400, 'ml', 'coconut milk'], [1, '', 'lime'], [300, 'g', 'rice']], steps: [['Soften the onions in oil.', 8], ['Add garlic, ginger and curry paste; fry until fragrant.', 2], ['Add chicken and brown on all sides.', 6], ['Pour in coconut milk and simmer.', 20], ['Squeeze over lime and serve with rice.', 0]] },
  { id: 'pancakes', name: 'Fluffy Pancakes', e: '🥞', c: ['#ffb38a', '#c77d4a'], mins: 25, serves: 3, lvl: 'Easy', ing: [[200, 'g', 'flour'], [2, 'tsp', 'baking powder'], [1, 'tbsp', 'sugar'], [1, '', 'egg'], [250, 'ml', 'milk'], [30, 'g', 'melted butter'], [1, 'pinch', 'salt']], steps: [['Whisk the dry ingredients together.', 0], ['Whisk egg, milk and butter, then fold into the dry mix. Rest the batter.', 5], ['Cook ladlefuls in a hot pan until bubbles appear, then flip.', 3], ['Stack and serve with syrup and berries.', 0]] },
  { id: 'guac', name: 'Guacamole', e: '🥑', c: ['#3ddc97', '#1b6f45'], mins: 10, serves: 4, lvl: 'Easy', ing: [[3, '', 'ripe avocados'], [1, '', 'lime'], [0.5, '', 'red onion'], [1, '', 'tomato'], [1, '', 'chili'], [2, 'tbsp', 'chopped coriander'], [0.5, 'tsp', 'salt']], steps: [['Mash the avocados with lime juice and salt.', 0], ['Fold in finely chopped onion, tomato, chili and coriander.', 0], ['Taste, adjust, and serve right away with tortilla chips.', 0]] },
  { id: 'cookies', name: 'Chocolate Chip Cookies', e: '🍪', c: ['#c08457', '#5c3a1e'], mins: 30, serves: 12, lvl: 'Easy', ing: [[115, 'g', 'soft butter'], [100, 'g', 'brown sugar'], [50, 'g', 'white sugar'], [1, '', 'egg'], [180, 'g', 'flour'], [0.5, 'tsp', 'baking soda'], [150, 'g', 'chocolate chips']], steps: [['Cream butter and sugars until fluffy.', 3], ['Beat in the egg, then mix in flour and baking soda.', 0], ['Fold in chocolate chips and chill the dough.', 10], ['Scoop onto a tray and bake at 180°C.', 11], ['Cool on the tray for a few minutes.', 5]] }
];
defApp({
  id: 'recipes', name: 'Recipe Book', glyph: 'notes', colors: ['#ff7a45', '#7a1f3d'], w: 940, h: 640, cat: 'Productivity', v2: true, single: true, desc: 'Recipes with servings scaling and cooking timers', kw: 'cook food kitchen restaurant meals',
  run(w) {
    let cur = null, serves = 0, q = '', favs = Store.get('recipeFavs', ['carbonara']), done = {};
    const fmtQ = n => { const r = Math.round(n * 100) / 100; return r % 1 ? (Math.abs(r - Math.round(r * 2) / 2) < .01 ? (Math.floor(r) ? Math.floor(r) + ' ' : '') + '½' : r.toFixed(1)) : r; };
    const grid = () => {
      const L = RECIPES.filter(r => !q || r.name.toLowerCase().includes(q)).sort((a, b) => favs.includes(b.id) - favs.includes(a.id));
      w.body.innerHTML = `<div class="app-tb"><b style="padding:0 6px;font-family:var(--f-display)">Recipe Book</b><span class="grow"></span><input class="fx-search" placeholder="Search recipes" value="${esc(q)}" aria-label="Search recipes"></div><div class="scroll pad" style="flex:1"><div class="rc-grid">${L.map(r => `<button class="rc-card" data-id="${r.id}"><div class="rc-img" style="background:linear-gradient(140deg,${r.c[0]},${r.c[1]})"><span>${r.e}</span>${favs.includes(r.id) ? '<i>★</i>' : ''}</div><b>${r.name}</b><small class="muted">${r.mins} min · ${r.lvl} · serves ${r.serves}</small></button>`).join('')}</div></div>`;
      $$('.rc-card', w.body).forEach(c => c.onclick = () => open(c.dataset.id));
      const s = $('.fx-search', w.body); s.oninput = () => { q = s.value.toLowerCase(); grid(); const n = $('.fx-search', w.body); n.focus(); n.setSelectionRange(q.length, q.length); };
      w.setTitle('Recipe Book');
    };
    const open = id => {
      cur = RECIPES.find(r => r.id === id); if (!serves || cur.id !== open.last) { serves = cur.serves; done = {}; } open.last = cur.id; const k = serves / cur.serves; const fav = favs.includes(cur.id);
      w.body.innerHTML = `<div class="app-tb"><button class="tbtn" data-a="back">${svg('back')} All recipes</button><span class="grow"></span><button class="tbtn ${fav ? 'on' : ''}" data-a="fav">${svg('star')} ${fav ? 'Favorite' : 'Add to favorites'}</button><button class="tbtn" data-a="shop">${svg('todo')} Add to To Do</button></div>
        <div class="scroll" style="flex:1"><div class="rc-hero" style="background:linear-gradient(140deg,${cur.c[0]},${cur.c[1]})"><span>${cur.e}</span><div><h1>${cur.name}</h1><div>${cur.mins} min · ${cur.lvl}</div></div></div>
        <div class="rc-body"><div><div class="row" style="justify-content:space-between"><b>Ingredients</b><span class="row" style="gap:6px"><button class="btn sm" data-s="-1">−</button><span style="min-width:74px;text-align:center">${serves} serving${serves > 1 ? 's' : ''}</span><button class="btn sm" data-s="1">+</button></span></div>
          <ul class="rc-ing">${cur.ing.map(([n, u, name]) => `<li><b>${fmtQ(n * k)}${u ? ' ' + u : ''}</b> ${esc(name)}</li>`).join('')}</ul></div>
        <div><b>Method</b><ol class="rc-steps">${cur.steps.map(([t, m], i) => `<li class="${done[i] ? 'done' : ''}" data-i="${i}"><span>${esc(t)}</span>${m ? `<button class="btn sm" data-t="${m}">${svg('clock')} ${m} min</button>` : ''}</li>`).join('')}</ol></div></div></div>`;
      $$('[data-s]', w.body).forEach(b => b.onclick = () => { serves = clamp(serves + +b.dataset.s, 1, 40); open(cur.id); });
      $$('.rc-steps li', w.body).forEach(li => li.onclick = e => { if (e.target.closest('button')) return; done[li.dataset.i] = !done[li.dataset.i]; li.classList.toggle('done'); Snd.play('click'); });
      $$('[data-t]', w.body).forEach(b => b.onclick = () => { WM.open('clock', { timer: +b.dataset.t * 60 }); notify('Cooking timer started', `${b.dataset.t} minutes for ${cur.name}.`, 'recipes'); });
      $('[data-a=back]', w.body).onclick = grid;
      $('[data-a=fav]', w.body).onclick = () => { favs = fav ? favs.filter(x => x !== cur.id) : [...favs, cur.id]; Store.set('recipeFavs', favs); open(cur.id); };
      $('[data-a=shop]', w.body).onclick = () => { const t = Store.get('todos', []); cur.ing.slice().reverse().forEach(([n, u, name]) => t.unshift({ id: uid(), text: `Buy ${fmtQ(n * k)}${u ? ' ' + u : ''} ${name}`, done: false })); Store.set('todos', t); Bus.emit('todos'); notify('Shopping list ready', `${cur.ing.length} ingredients added to To Do.`, 'todo'); };
      w.setTitle(cur.name + ' — Recipe Book');
    };
    grid();
  }
});

/* ---------------- FOCUS SESSIONS ---------------- */
defApp({
  id: 'focus', name: 'Focus Sessions', glyph: 'bolt', colors: ['#7b61ff', '#c77dff'], w: 560, h: 600, minW: 360, cat: 'Productivity', v2: true, single: true, desc: 'Timed focus with streaks and quiet notifications', kw: 'pomodoro timer concentrate productivity',
  run(w) {
    let pick = Store.get('focusPick', 25);
    const render = () => {
      const st = focusStats(); const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const k = d.toISOString().slice(0, 10); return [d.toLocaleDateString(LOCALE, { weekday: 'narrow' }), st.days[k] || 0]; });
      let streak = 0; for (let i = 0; ; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (st.days[d.toISOString().slice(0, 10)]) streak++; else if (i) break; else continue; if (i > 365) break; }
      const mx = Math.max(30, ...days.map(d => d[1])); const left = FOCUS.run ? FOCUS.left() : pick * 60, tot = FOCUS.run ? FOCUS.mins * 60 : pick * 60;
      w.body.innerHTML = `<div class="scroll pad" style="flex:1;display:grid;gap:18px;justify-items:center;text-align:center">
        <svg viewBox="0 0 200 200" width="220" height="220" style="max-width:100%"><circle cx="100" cy="100" r="86" fill="none" stroke="var(--press)" stroke-width="10"/><circle id="fcRing" cx="100" cy="100" r="86" fill="none" stroke="url(#fcg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="540" stroke-dashoffset="${540 * (1 - left / tot)}" transform="rotate(-90 100 100)"/><defs><linearGradient id="fcg"><stop offset="0" stop-color="#7b61ff"/><stop offset="1" stop-color="#c77dff"/></linearGradient></defs><text id="fcT" x="100" y="108" text-anchor="middle" fill="currentColor" style="font:600 36px Unbounded,sans-serif">${fmtFocus(left)}</text><text x="100" y="134" text-anchor="middle" fill="currentColor" opacity=".6" style="font:12px Outfit,sans-serif">${FOCUS.run ? (FOCUS.paused ? 'Paused' : 'Focusing · notifications off') : 'Ready'}</text></svg>
        ${FOCUS.run ? `<div class="row"><button class="btn primary" id="fcP">${FOCUS.paused ? 'Resume' : 'Pause'}</button><button class="btn" id="fcS">End session</button></div>` : `<div class="row" style="justify-content:center">${[15, 25, 45, 60].map(m => `<button class="btn sm ${m === pick ? 'primary' : ''}" data-m="${m}">${m} min</button>`).join('')}</div><button class="btn primary" id="fcGo" style="min-width:200px">${svg('play')} Start focus session</button>`}
        <div class="card" style="width:100%;text-align:left"><div class="row" style="justify-content:space-between"><b>This week</b><span class="muted" style="font-size:12px">Today ${focusToday()} min · ${st.sessions} sessions · ${streak}-day streak</span></div>
          <div class="fc-bars">${days.map(([l, v]) => `<div><i style="height:${v / mx * 100}%"></i><small>${l}</small></div>`).join('')}</div></div>
        <p class="muted" style="font-size:12px;margin:0">Focus turns on Do not disturb and shows a Live Activity at the top of the screen.</p></div>`;
      $$('[data-m]', w.body).forEach(b => b.onclick = () => { pick = +b.dataset.m; Store.set('focusPick', pick); render(); });
      $('#fcGo', w.body)?.addEventListener('click', () => { FOCUS.start(pick); render(); });
      $('#fcP', w.body)?.addEventListener('click', () => { FOCUS.pause(); render(); });
      $('#fcS', w.body)?.addEventListener('click', () => { FOCUS.stop(false); render(); });
    };
    onWin(w, 'focus', render);
    onWin(w, 'tick', () => { if (!FOCUS.run) return; const t = $('#fcT', w.body), r = $('#fcRing', w.body); if (t) t.textContent = fmtFocus(FOCUS.left()); if (r) r.style.strokeDashoffset = 540 * (1 - FOCUS.left() / (FOCUS.mins * 60)); });
    render();
  }
});

/* ---------------- ORDER UP! (restaurant game) ---------------- */
const OU_ING = { bb: ['Bottom bun', '#d9a05b'], pa: ['Patty', '#5a3020'], ch: ['Cheese', '#ffcc33'], le: ['Lettuce', '#5fd068'], to: ['Tomato', '#ef4444'], on: ['Onion', '#c4a3d8'], tb: ['Top bun', '#e0a85e'] };
defApp({
  id: 'orderup', name: 'Order Up!', glyph: 'game', colors: ['#ff7a45', '#ffd166'], w: 820, h: 640, minW: 520, cat: 'Games', v2: true, desc: 'Build burgers to order before customers lose patience', kw: 'restaurant cooking burger game kitchen',
  run(w) {
    let coins, served, missed, lvl, time, tickets, plate, iv, over, combo;
    const NAMES = ['Ava', 'Leo', 'Mia', 'Kai', 'Zoe', 'Max', 'Ivy', 'Sam', 'Noah', 'Luna', 'Eli', 'Ruby'];
    const mkOrder = () => { const fill = ['pa']; if (Math.random() < .7) fill.push('ch'); const extras = ['le', 'to', 'on'].filter(() => Math.random() < .25 + lvl * .07); if (lvl > 1 && Math.random() < .3) fill.push('pa'); const stack = ['bb', ...fill, ...extras.sort(() => Math.random() - .5), 'tb']; return { id: uid(), who: NAMES[Math.floor(Math.random() * NAMES.length)], stack, fries: Math.random() < .35, drink: Math.random() < .35, pat: 1, rate: .00055 + lvl * .00015 }; };
    const reset = () => { coins = 0; served = 0; missed = 0; lvl = 1; time = 120; tickets = [mkOrder()]; plate = { stack: [], fries: false, drink: false }; over = false; combo = 0; clearInterval(iv); iv = setInterval(step, 100); render(); };
    const burger = (stack, small) => `<div class="ou-burger ${small ? 'sm' : ''}">${stack.slice().reverse().map(k => `<i class="ou-${k}" style="background:${OU_ING[k][1]}"></i>`).join('')}</div>`;
    const render = () => {
      w.body.innerHTML = `<div class="ou"><div class="game-hud"><span>🪙 <b class="oc">${coins}</b></span><span>Served <b class="os">${served}</b></span><span>Level <b>${lvl}</b></span><span>⏱ <b class="ot">${Math.ceil(time)}</b>s</span><span>Best <b>${Store.get('hi:orderup', 0)}</b></span></div>
        <div class="ou-tickets">${tickets.map(t => `<button class="ou-ticket" data-id="${t.id}" title="Serve the plate to ${t.who}"><div class="ou-who"><b>${t.who}</b><span>${t.fries ? '🍟' : ''}${t.drink ? '🥤' : ''}</span></div>${burger(t.stack, true)}<div class="ou-pat"><i style="width:${t.pat * 100}%;background:${t.pat > .5 ? 'var(--good)' : t.pat > .25 ? 'var(--warn)' : 'var(--bad)'}"></i></div></button>`).join('')}</div>
        <div class="ou-kitchen"><div class="ou-plate">${plate.stack.length ? burger(plate.stack) : '<span class="muted">Build a burger: start with a bottom bun</span>'}<div class="ou-sides">${plate.fries ? '🍟' : ''}${plate.drink ? '🥤' : ''}</div></div>
          <div class="ou-btns">${Object.entries(OU_ING).map(([k, [n, c]]) => `<button data-k="${k}"><i style="background:${c}"></i>${n}</button>`).join('')}<button data-side="fries">🍟 Fries</button><button data-side="drink">🥤 Drink</button><button data-trash class="ou-trash">${svg('trash')} Bin it</button></div></div>
        <div class="muted" style="font-size:12px;text-align:center">Build the order on your plate, then click the customer's ticket to serve it. Faster service = bigger tips.</div></div>`;
      $$('[data-k]', w.body).forEach(b => b.onclick = () => { if (plate.stack.length < 10) { plate.stack.push(b.dataset.k); Snd.play('click'); render(); } });
      $$('[data-side]', w.body).forEach(b => b.onclick = () => { plate[b.dataset.side] = !plate[b.dataset.side]; Snd.play('pop'); render(); });
      $('[data-trash]', w.body).onclick = () => { plate = { stack: [], fries: false, drink: false }; Snd.play('trash'); render(); };
      $$('.ou-ticket', w.body).forEach(b => b.onclick = () => serve(b.dataset.id));
    };
    const serve = id => {
      if (over) return; const t = tickets.find(x => x.id === id); if (!t || !plate.stack.length) return;
      const ok = t.stack.join() === plate.stack.join() && t.fries === plate.fries && t.drink === plate.drink;
      if (ok) { combo++; const earn = 10 + t.stack.length * 2 + (t.fries ? 4 : 0) + (t.drink ? 3 : 0) + Math.round(t.pat * 10) + combo * 2; coins += earn; served++; time = Math.min(150, time + 4); Snd.play('success'); tickets = tickets.filter(x => x !== t); flash(`+${earn} 🪙${combo > 1 ? ' · combo ×' + combo : ''}`, 'good'); if (served % 5 === 0) { lvl++; flash('Level ' + lvl + '! Rush hour', 'good'); } }
      else { combo = 0; coins = Math.max(0, coins - 5); Snd.play('error'); flash('Wrong order! −5 🪙', 'bad'); t.pat = Math.max(0, t.pat - .2); }
      plate = { stack: [], fries: false, drink: false }; render();
    };
    const flash = (txt, cls) => { const f = html(`<div class="ou-flash ${cls}">${txt}</div>`); w.body.querySelector('.ou')?.appendChild(f); setTimeout(() => f.remove(), 1100); };
    let spawnT = 0;
    const step = () => {
      if (over || WM.active !== w) return;
      time -= .1; spawnT += .1;
      if (spawnT > Math.max(3, 8 - lvl) && tickets.length < 4) { spawnT = 0; tickets.push(mkOrder()); render(); }
      let changed = false; tickets.forEach(t => { t.pat -= t.rate * 100 * .1 / 1; if (t.pat <= 0) changed = true; });
      if (changed) { const lost = tickets.filter(t => t.pat <= 0); missed += lost.length; combo = 0; tickets = tickets.filter(t => t.pat > 0); Snd.play('lose'); render(); flash(lost.map(l => l.who).join(', ') + ' left hungry 😠', 'bad'); }
      if (!tickets.length) { tickets.push(mkOrder()); render(); }
      $$('.ou-ticket', w.body).forEach(b => { const t = tickets.find(x => x.id === b.dataset.id); const i = b.querySelector('.ou-pat i'); if (t && i) { i.style.width = t.pat * 100 + '%'; i.style.background = t.pat > .5 ? 'var(--good)' : t.pat > .25 ? 'var(--warn)' : 'var(--bad)'; } });
      const ot = $('.ot', w.body); if (ot) ot.textContent = Math.ceil(time);
      if (time <= 0) { over = true; clearInterval(iv); const best = hiScore('orderup', coins); Snd.play('success'); const g = html('<div class="game-wrap" style="position:absolute;inset:0;padding:0"></div>'); w.body.appendChild(g); gameOver(w, 'Kitchen closed! 🍔', `You earned ${coins} coins, served ${served} customers and missed ${missed}. Best: ${best}`, () => { g.remove(); reset(); }); }
    };
    w.on('close', () => clearInterval(iv));
    reset();
  }
});

/* ---------------- BLOCKS ---------------- */
defApp({
  id: 'blocks', name: 'Blocks', glyph: 'brick', colors: ['#4cc9f0', '#c77dff'], w: 520, h: 660, minW: 420, cat: 'Games', v2: true, desc: 'Falling-block puzzle with ghost pieces', kw: 'tetris puzzle game',
  run(w) {
    const C = 10, R = 20, Z = 26;
    const P = { I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]] };
    const COL = { I: '#4cc9f0', O: '#ffd166', T: '#c77dff', S: '#3ddc97', Z: '#ff5d6c', J: '#3a56d4', L: '#ff7a45' };
    let grid, cur, next, score, lines, level, dropT, raf, over, paused, bag = [];
    w.body.innerHTML = `<div class="game-wrap"><div class="row" style="align-items:flex-start;gap:16px;flex-wrap:nowrap"><canvas class="bk" width="${C * Z}" height="${R * Z}" style="border-radius:10px;max-height:calc(100% - 10px);max-width:100%"></canvas><div style="display:grid;gap:12px;min-width:110px"><div class="card"><small class="muted">Next</small><canvas class="bn" width="100" height="70"></canvas></div><div class="card game-hud" style="display:grid;gap:6px"><span>Score <b class="bs">0</b></span><span>Lines <b class="bl">0</b></span><span>Level <b class="bv">1</b></span><span>Best <b>${Store.get('hi:blocks', 0)}</b></span></div><div class="muted" style="font-size:11px;line-height:1.6">← → move<br>↑ rotate<br>↓ soft drop<br>Space hard drop<br>P pause</div></div></div></div>`;
    const cv = $('.bk', w.body), x = cv.getContext('2d'), nx = $('.bn', w.body).getContext('2d');
    const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse());
    const pick = () => { if (!bag.length) bag = Object.keys(P).sort(() => Math.random() - .5); const k = bag.pop(); return { k, m: P[k].map(r => r.slice()), x: 3, y: 0 }; };
    const fits = (m, px, py) => m.every((r, y) => r.every((v, xx) => !v || (px + xx >= 0 && px + xx < C && py + y < R && (py + y < 0 || !grid[py + y][px + xx]))));
    const reset = () => { grid = Array.from({ length: R }, () => Array(C).fill(null)); bag = []; cur = pick(); next = pick(); score = 0; lines = 0; level = 1; over = false; paused = false; dropT = 0; hud(); };
    const hud = () => { $('.bs', w.body).textContent = score; $('.bl', w.body).textContent = lines; $('.bv', w.body).textContent = level; };
    const lock = () => {
      cur.m.forEach((r, y) => r.forEach((v, xx) => { if (v && cur.y + y >= 0) grid[cur.y + y][cur.x + xx] = cur.k; }));
      let cl = 0; for (let y = R - 1; y >= 0; y--) if (grid[y].every(Boolean)) { grid.splice(y, 1); grid.unshift(Array(C).fill(null)); cl++; y++; }
      if (cl) { score += [0, 100, 300, 500, 800][cl] * level; lines += cl; level = 1 + Math.floor(lines / 10); Snd.play(cl >= 4 ? 'success' : 'eat'); } else Snd.play('click');
      cur = next; next = pick(); hud();
      if (!fits(cur.m, cur.x, cur.y)) { over = true; const b = hiScore('blocks', score); Snd.play('lose'); gameOver(w, 'Game over', `Score ${score} · ${lines} lines · Best ${b}`, () => { reset(); }); }
    };
    const move = (dx, dy) => { if (fits(cur.m, cur.x + dx, cur.y + dy)) { cur.x += dx; cur.y += dy; return true; } return false; };
    const ghostY = () => { let y = cur.y; while (fits(cur.m, cur.x, y + 1)) y++; return y; };
    const cell = (c, px, py, col, a = 1) => { c.globalAlpha = a; c.fillStyle = col; c.fillRect(px + 1, py + 1, Z - 2, Z - 2); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(px + 1, py + 1, Z - 2, 4); c.globalAlpha = 1; };
    let last = performance.now();
    const loop = now => {
      raf = requestAnimationFrame(loop); const dt = now - last; last = now;
      if (!over && !paused && WM.active === w) { dropT += dt; if (dropT > Math.max(80, 700 - (level - 1) * 60)) { dropT = 0; if (!move(0, 1)) lock(); } }
      x.fillStyle = '#0b1018'; x.fillRect(0, 0, cv.width, cv.height); x.strokeStyle = 'rgba(255,255,255,.04)';
      for (let i = 0; i <= C; i++) { x.beginPath(); x.moveTo(i * Z, 0); x.lineTo(i * Z, R * Z); x.stroke(); } for (let i = 0; i <= R; i++) { x.beginPath(); x.moveTo(0, i * Z); x.lineTo(C * Z, i * Z); x.stroke(); }
      grid.forEach((r, y) => r.forEach((k, xx) => k && cell(x, xx * Z, y * Z, COL[k])));
      if (!over) { const gy = ghostY(); cur.m.forEach((r, y) => r.forEach((v, xx) => { if (v) { cell(x, (cur.x + xx) * Z, (gy + y) * Z, COL[cur.k], .2); cell(x, (cur.x + xx) * Z, (cur.y + y) * Z, COL[cur.k]); } })); }
      nx.clearRect(0, 0, 100, 70); next.m.forEach((r, y) => r.forEach((v, xx) => { if (v) { nx.fillStyle = COL[next.k]; nx.fillRect(10 + xx * 20, 10 + y * 20, 18, 18); } }));
      if (paused) { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#fff'; x.font = '600 22px Unbounded'; x.textAlign = 'center'; x.fillText('Paused', cv.width / 2, cv.height / 2); x.textAlign = 'start'; }
    };
    winKeys(w, e => {
      if (over) return; const k = e.key;
      if (k === 'p' || k === 'P') { paused = !paused; return; } if (paused) return;
      if (k === 'ArrowLeft') move(-1, 0); else if (k === 'ArrowRight') move(1, 0); else if (k === 'ArrowDown') { if (move(0, 1)) score += 1; hud(); }
      else if (k === 'ArrowUp') { const m = rot(cur.m); for (const kick of [0, -1, 1, -2, 2]) if (fits(m, cur.x + kick, cur.y)) { cur.m = m; cur.x += kick; break; } }
      else if (k === ' ') { let d = 0; while (move(0, 1)) d++; score += d * 2; lock(); } else return;
      e.preventDefault();
    });
    w.on('close', () => cancelAnimationFrame(raf));
    reset(); raf = requestAnimationFrame(loop);
  }
});
