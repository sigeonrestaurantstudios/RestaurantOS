/* =====================================================================
   RestaurantOS shell: wallpapers, window manager, taskbar, start, flyouts,
   notifications, dialogs, spotlight, task view, power, shortcuts.
   ===================================================================== */
const APPS = {};
function defApp(def) { APPS[def.id] = Object.assign({ w: 820, h: 560, cat: 'Utilities', core: true, desc: '' }, def); }
const grad = a => `background:linear-gradient(150deg,${a.colors[0]},${a.colors[1]})`;
function appIcon(id, cls = '') { const a = APPS[id]; if (!a) return `<div class="ai ${cls}" style="background:#666">${svg('info')}</div>`; return `<div class="ai ${cls}" style="${grad(a)}">${svg(a.glyph)}</div>`; }
let installedApps = () => Object.values(APPS).filter(a => !a.hidden && (a.core || S.installed.includes(a.id))).sort((a, b) => a.name.localeCompare(b.name));
let isInstalled = id => APPS[id] && (APPS[id].core || S.installed.includes(id));

/* ---------- Accent ---------- */
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function applyAccent(c) {
  const [r, g, b] = hexToRgb(c); const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const mix = (v, t) => Math.round(v + (255 - v) * t);
  const R = document.documentElement.style;
  R.setProperty('--accent', c); R.setProperty('--accent2', `rgb(${mix(r, .45)},${mix(g, .45)},${mix(b, .45)})`);
  R.setProperty('--accent-ink', lum > .55 ? '#16110d' : '#ffffff');
}

/* ---------- Wallpapers ---------- */
const WALLS = {
  ember: { name: 'Ember', css: 'radial-gradient(ellipse at 18% 85%,#ff7a45 0%,transparent 48%),radial-gradient(ellipse at 85% 15%,#2ec4b6 0%,transparent 42%),radial-gradient(ellipse at 62% 72%,#7a1f3d 0%,transparent 55%),linear-gradient(160deg,#0b1216,#1a0f14)' },
  aurora: { name: 'Aurora (live)', live: 'aurora', css: 'radial-gradient(ellipse at 30% 30%,#2ec4b6 0%,transparent 50%),radial-gradient(ellipse at 70% 60%,#7b2ff7 0%,transparent 50%),linear-gradient(180deg,#04080f,#0b1325)' },
  tide: { name: 'Tide', css: 'radial-gradient(circle at 28% 30%,#2ec4b6,transparent 50%),radial-gradient(circle at 75% 80%,#1b4965,transparent 60%),radial-gradient(circle at 90% 10%,#5fa8d3,transparent 35%),linear-gradient(200deg,#062a30,#0b1d2c)' },
  dune: { name: 'Dune', css: 'radial-gradient(ellipse at 70% 30%,#fff1d6 0%,transparent 25%),linear-gradient(175deg,#f6d1a8 0%,#f0a873 32%,#c8643b 58%,#5a2a2f 84%,#241521 100%)' },
  midnight: { name: 'Midnight', css: 'radial-gradient(ellipse at 50% 120%,#3a2b6b,transparent 60%),radial-gradient(ellipse at 50% -20%,#0f3d4a,transparent 60%),linear-gradient(#05070c,#05070c)' },
  bloom: { name: 'Bloom', css: 'radial-gradient(circle at 60% 40%,transparent 0,rgba(0,0,0,.55) 75%),conic-gradient(from 200deg at 60% 40%,#ff7a45,#ff4d6d,#c77dff,#2ec4b6,#ffd166,#ff7a45)' },
  glacier: { name: 'Glacier', css: 'radial-gradient(ellipse at 20% 20%,#ffffff 0%,transparent 40%),linear-gradient(160deg,#e0f2f1,#b2dfdb 40%,#80cbc4 70%,#4f8a8b)' },
  graphite: { name: 'Graphite', css: 'radial-gradient(circle at 50% 0%,#2b333a,#0d1013 70%)' },
  nebula: { name: 'Nebula (live)', live: 'nebula', css: 'radial-gradient(ellipse at 40% 50%,#3a1c5c,transparent 60%),linear-gradient(#020308,#020308)' },
  waves: { name: 'Waves (live)', live: 'waves', css: 'linear-gradient(160deg,#0a1a24,#14202c)' },
  sunset: { name: 'Sunset', css: 'radial-gradient(circle at 50% 75%,#ffd166 0,#ff7a45 12%,transparent 32%),linear-gradient(180deg,#1d1b3a 0%,#6b2d5c 45%,#f06c4a 75%,#ffb26b 100%)' },
  forest: { name: 'Forest', css: 'radial-gradient(ellipse at 30% 20%,#9be7a8 0%,transparent 40%),linear-gradient(170deg,#1f4d3a,#0f2a21 60%,#081712)' }
};
let CUSTOM_WP = Store.get('customWp', null);
const Wall = {
  raf: 0, cur: null,
  css(name = S.wallpaper) { return name === 'custom' && CUSTOM_WP ? `url(${CUSTOM_WP}) center/cover` : (WALLS[name] || WALLS.ember).css; },
  apply() {
    const el = $('#wallpaper'); el.style.background = this.css(); el.style.backgroundSize = 'cover';
    const w = WALLS[S.wallpaper];
    if (this.cur !== S.wallpaper) { cancelAnimationFrame(this.raf); el.innerHTML = ''; this.cur = S.wallpaper; if (w && w.live) this.live(w.live, el); }
  },
  live(kind, el) {
    const c = document.createElement('canvas'); el.appendChild(c); const x = c.getContext('2d'); let t = 0;
    const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), tw: Math.random() * 6 }));
    const f = () => {
      this.raf = requestAnimationFrame(f);
      if (STAGE !== 'os' || document.hidden) return;
      const W = c.width = Math.ceil(innerWidth / 2), H = c.height = Math.ceil(innerHeight / 2); t += (S.saver ? .3 : 1) * .004;
      if (kind === 'aurora') {
        x.fillStyle = '#04080f'; x.fillRect(0, 0, W, H);
        x.globalCompositeOperation = 'lighter';
        const cols = ['46,196,182', '123,47,247', '255,122,69', '76,201,240'];
        for (let i = 0; i < 4; i++) {
          x.beginPath(); const yb = H * (.3 + i * .12);
          x.moveTo(0, H);
          for (let px = 0; px <= W; px += 8) x.lineTo(px, yb + Math.sin(px * .006 + t * (1 + i * .3) + i) * H * .12 + Math.sin(px * .013 - t * 1.7) * H * .05);
          x.lineTo(W, H); x.closePath();
          const g = x.createLinearGradient(0, yb - H * .2, 0, H); g.addColorStop(0, `rgba(${cols[i]},.0)`); g.addColorStop(.2, `rgba(${cols[i]},.35)`); g.addColorStop(1, `rgba(${cols[i]},0)`);
          x.fillStyle = g; x.fill();
        }
        x.globalCompositeOperation = 'source-over';
      } else if (kind === 'nebula') {
        x.fillStyle = '#020308'; x.fillRect(0, 0, W, H);
        const g = x.createRadialGradient(W * (.5 + Math.sin(t) * .1), H * .5, 0, W * .5, H * .5, W * .6);
        g.addColorStop(0, 'rgba(120,50,180,.45)'); g.addColorStop(.4, 'rgba(255,122,69,.15)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        for (const s of stars) { s.x += (s.z * .0004); if (s.x > 1) s.x = 0; const a = .4 + Math.sin(t * 20 + s.tw) * .3; x.fillStyle = `rgba(255,255,255,${a * s.z})`; x.fillRect(s.x * W, s.y * H, s.z * 1.6 + .3, s.z * 1.6 + .3); }
      } else if (kind === 'waves') {
        x.fillStyle = '#0a1a24'; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 26; i++) {
          x.beginPath(); x.strokeStyle = `hsla(${(i * 7 + 160) % 360},70%,60%,${.12 + i * .012})`; x.lineWidth = 1;
          for (let px = 0; px <= W; px += 6) { const y = H * .5 + Math.sin(px * .008 + t * 2 + i * .25) * (30 + i * 3) + Math.cos(px * .003 - t + i * .1) * 40; px ? x.lineTo(px, y) : x.moveTo(px, y); }
          x.stroke();
        }
      }
    };
    f();
  }
};

/* ---------- Simulated weather ---------- */
function seeded(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
const Weather = {
  conds: [['Sunny', 'sun'], ['Partly cloudy', 'weather'], ['Cloudy', 'weather'], ['Light rain', 'weather'], ['Clear', 'moon'], ['Windy', 'weather']],
  base() { return { 'New York': 14, London: 12, Berlin: 11, Warsaw: 10, Paris: 14, Madrid: 19, Rome: 19, Tokyo: 18, Toronto: 9, Sydney: 21, 'São Paulo': 23, Mumbai: 30 }[S.city] ?? 15; },
  day(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); const r = seeded(S.city + d.toDateString()); const hi = Math.round(this.base() + r() * 8 - 3); const c = this.conds[Math.floor(r() * 4)]; return { date: d, hi, lo: hi - Math.round(4 + r() * 5), cond: c[0], icon: c[1], rain: Math.round(r() * 80), wind: Math.round(5 + r() * 25), hum: Math.round(40 + r() * 50), uv: Math.round(r() * 8) }; },
  now() { const d = this.day(0); const h = new Date().getHours(); const temp = Math.round(d.lo + (d.hi - d.lo) * Math.max(0, Math.sin((h - 6) / 24 * Math.PI * 1.6))); const night = h < 6 || h > 20; return { ...d, temp, cond: night && d.cond === 'Sunny' ? 'Clear' : d.cond }; },
  hours() { const d = this.day(0); return Array.from({ length: 24 }, (_, h) => Math.round(d.lo + (d.hi - d.lo) * Math.max(0, Math.sin((h - 6) / 24 * Math.PI * 1.6)))); }
};

/* ---------- Battery ---------- */
const Batt = { level: 87, charging: false, real: false };
try { navigator.getBattery?.().then(b => { const u = () => { Batt.level = Math.round(b.level * 100); Batt.charging = b.charging; Batt.real = true; Bus.emit('batt'); }; u(); b.onlevelchange = u; b.onchargingchange = u; }).catch(() => { }); } catch (e) { }
setInterval(() => { if (!Batt.real && !Batt.charging) { Batt.level = Math.max(5, Batt.level - 1); Bus.emit('batt'); } }, S.saver ? 360000 : 180000);

/* =====================================================================
   DIALOGS / CONTEXT MENU / NOTIFICATIONS / OSD
   ===================================================================== */
const UI = {
  dialog({ title, msg = '', input = null, buttons = [{ label: 'OK', primary: true, value: true }], danger = false }) {
    return new Promise(res => {
      const back = html(`<div class="modal-back"><div class="modal glass" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${msg ? `<p>${msg}</p>` : ''}${input ? `<input class="inp" id="dlgIn" type="${input.type || 'text'}" value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}">` : ''}<div class="acts">${buttons.map((b, i) => `<button class="btn ${b.primary ? (danger ? 'danger' : 'primary') : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div></div>`);
      ($('#os:not(.hidden)') || document.body).appendChild(back);
      const inp = back.querySelector('#dlgIn');
      const done = v => { back.remove(); res(v); };
      back.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const B = buttons[+b.dataset.i]; done(input && B.primary ? inp.value : B.value); });
      back.onpointerdown = e => { if (e.target === back) done(input ? null : false); };
      back.onkeydown = e => { e.stopPropagation(); if (e.key === 'Escape') done(input ? null : false); if (e.key === 'Enter') { const p = buttons.find(b => b.primary); done(input ? inp.value : p ? p.value : true); } };
      setTimeout(() => { if (inp) { inp.focus(); const dot = inp.value.lastIndexOf('.'); inp.setSelectionRange(0, dot > 0 ? dot : inp.value.length); } else back.querySelector('.btn.primary, .btn')?.focus(); }, 30);
    });
  },
  alert(title, msg) { return this.dialog({ title, msg }); },
  confirm(title, msg, ok = 'OK', danger = false) { return this.dialog({ title, msg, danger, buttons: [{ label: 'Cancel', value: false }, { label: ok, primary: true, value: true }] }); },
  prompt(title, msg, value = '', placeholder = '') { return this.dialog({ title, msg, input: { value, placeholder }, buttons: [{ label: 'Cancel', value: null }, { label: 'OK', primary: true }] }); }
};
const Ctx = {
  el: null,
  show(x, y, items) {
    this.hide(); Snd.play('click');
    const el = html(`<div class="ctx glass" role="menu"></div>`);
    items.filter(Boolean).forEach(it => {
      if (it === '-') return el.appendChild(document.createElement('hr'));
      const b = html(`<button role="menuitem" ${it.disabled ? 'disabled' : ''}>${it.icon ? svg(it.icon) : '<svg></svg>'}<span>${esc(it.label)}</span>${it.kbd ? `<kbd>${it.kbd}</kbd>` : ''}</button>`);
      b.onclick = () => { this.hide(); it.action?.(); }; el.appendChild(b);
    });
    $('#os').appendChild(el); this.el = el;
    const r = el.getBoundingClientRect();
    el.style.left = Math.min(x, innerWidth - r.width - 6) + 'px'; el.style.top = Math.min(y, innerHeight - r.height - 6) + 'px';
  },
  hide() { this.el?.remove(); this.el = null; }
};
let NOTIFS = Store.get('notifs', []); let unread = 0;
function notify(title, body = '', app = 'settings', opts = {}) {
  const n = { id: uid(), title, body, app, t: Date.now(), open: opts.open };
  NOTIFS.unshift(n); NOTIFS = NOTIFS.slice(0, 40); Store.set('notifs', NOTIFS);
  if (STAGE !== 'os') return;
  if (!S.dnd) {
    Snd.play('notify');
    const t = html(`<div class="toast glass">${appIcon(APPS[app] ? app : 'settings')}<div style="min-width:0"><b>${esc(title)}</b><p>${esc(body)}</p></div></div>`);
    t.onclick = () => { t.remove(); if (opts.open) opts.open(); else if (APPS[app]) WM.open(app); };
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, opts.dur || 5200);
  }
  unread++; Taskbar.badge();
  if ($('#notifPanel').classList.contains('open')) renderNotif();
}
let osdT = 0;
function osd(icon, val) {
  const o = $('#osd'); o.innerHTML = `${svg(icon)}<div class="bar"><i style="width:${val}%"></i></div><span style="font-size:12px;width:28px;text-align:right">${Math.round(val)}</span>`;
  o.classList.add('show'); clearTimeout(osdT); osdT = setTimeout(() => o.classList.remove('show'), 1400);
}

/* =====================================================================
   WINDOW MANAGER
   ===================================================================== */
const WM = {
  wins: [], z: 10, active: null, desk: 0, desks: Store.get('desks', ['Desktop 1']),
  area() { return { w: innerWidth, h: innerHeight - 56 }; },
  open(id, args = {}) {
    const app = APPS[id]; if (!app) return null;
    if (!isInstalled(id)) { notify('App not installed', `${app.name} is available in RestoStore.`, 'store', { open: () => WM.open('store', { q: app.name }) }); return null; }
    if (app.single) { const ex = this.wins.find(w => w.app.id === id); if (ex) { ex.onArgs?.(args); this.focus(ex); return ex; } }
    const A = this.area(); const small = innerWidth < 700;
    const W = Math.min(args.w || app.w, A.w - 24), H = Math.min(args.h || app.h, A.h - 24);
    const n = this.wins.filter(w => w.desk === this.desk && !w.min).length % 7;
    let x = Math.round((A.w - W) / 2 + n * 30 - 60), y = Math.round((A.h - H) / 2 + n * 26 - 50);
    x = clamp(x, 6, Math.max(6, A.w - W - 6)); y = clamp(y, 6, Math.max(6, A.h - H - 6));
    const el = html(`<div class="win opening" role="dialog" aria-label="${esc(app.name)}">
      <div class="titlebar"><div class="ai" style="${grad(app)}">${svg(app.glyph)}</div><div class="ttl">${esc(app.name)}</div>
      <div class="wbtns"><button class="mn" aria-label="Minimize" title="Minimize">${svg('min')}</button><button class="mx" aria-label="Maximize" title="Maximize">${svg('max')}</button><button class="x" aria-label="Close" title="Close">${svg('x')}</button></div></div>
      <div class="wbody"></div><div class="blocker"></div>${['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<div class="rz ${d}" data-d="${d}"></div>`).join('')}</div>`);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: W + 'px', height: H + 'px' });
    if (app.minW) el.style.minWidth = app.minW + 'px';
    const w = { id: uid(), app, el, body: el.querySelector('.wbody'), desk: this.desk, max: false, min: false, onClose: [], title: app.name, top: false, prev: { x, y, w: W, h: H } };
    w.setTitle = t => { w.title = t; el.querySelector('.ttl').textContent = t; Taskbar.render(); };
    w.close = () => this.close(w);
    w.on = (ev, f) => { if (ev === 'close') w.onClose.push(f); };
    $('#winLayer').appendChild(el); this.wins.push(w);
    el.addEventListener('pointerdown', () => this.focus(w), true);
    const tb = el.querySelector('.titlebar');
    tb.addEventListener('pointerdown', e => { if (!e.target.closest('.wbtns')) this.drag(w, e); });
    tb.addEventListener('dblclick', e => { if (!e.target.closest('.wbtns')) this.toggleMax(w); });
    tb.addEventListener('contextmenu', e => { e.preventDefault(); this.winMenu(w, e.clientX, e.clientY); });
    el.querySelector('.mn').onclick = () => this.minimize(w);
    el.querySelector('.mx').onclick = () => this.toggleMax(w);
    el.querySelector('.x').onclick = () => this.close(w);
    el.querySelectorAll('.rz').forEach(h => h.addEventListener('pointerdown', e => this.resize(w, e, h.dataset.d)));
    try { app.run(w, args); } catch (err) { console.error(err); w.body.innerHTML = `<div class="empty">${svg('info')}<b>${esc(app.name)} stopped working</b><span>${esc(err.message)}</span></div>`; }
    if (small) this.toggleMax(w, true);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('opening')));
    this.focus(w); Snd.play('open');
    const tbb = Taskbar.btnFor(id); if (tbb) { tbb.classList.remove('bounce'); void tbb.offsetWidth; tbb.classList.add('bounce'); }
    Bus.emit('wins');
    return w;
  },
  focus(w) {
    if (!w) return;
    if (w.desk !== this.desk) this.switchDesk(w.desk);
    if (w.min) { w.min = false; w.el.classList.remove('minimized'); w.el.style.transform = ''; }
    this.z++; w.el.style.zIndex = (w.top ? 5000 : 0) + this.z;
    if (this.active !== w) { this.active = w; this.wins.forEach(x => x.el.classList.toggle('inactive', x !== w)); Taskbar.render(); w.onFocus?.(); }
  },
  focusTop() {
    const vis = this.wins.filter(w => !w.min && w.desk === this.desk).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex);
    this.active = null; if (vis[0]) this.focus(vis[0]); else { this.wins.forEach(x => x.el.classList.add('inactive')); Taskbar.render(); }
  },
  minimize(w) {
    if (w.min) return; w.min = true;
    const b = Taskbar.btnFor(w.app.id); const r = w.el.getBoundingClientRect();
    let tx = 0, ty = innerHeight - r.top;
    if (b) { const br = b.getBoundingClientRect(); tx = br.left + br.width / 2 - (r.left + r.width / 2); ty = br.top - (r.top + r.height * .8); }
    w.el.style.transform = `translate(${tx}px,${ty}px) scale(.1)`; w.el.classList.add('minimized');
    Snd.play('min'); if (this.active === w) this.focusTop(); Taskbar.render(); Bus.emit('wins');
  },
  toggleMax(w, silent) {
    const A = this.area(), el = w.el;
    if (w.max) { w.max = false; el.classList.remove('max'); Object.assign(el.style, { left: w.prev.x + 'px', top: w.prev.y + 'px', width: w.prev.w + 'px', height: w.prev.h + 'px' }); }
    else { if (!w.snapped) this.savePrev(w); w.max = true; w.snapped = null; el.classList.add('max'); Object.assign(el.style, { left: '0px', top: '0px', width: A.w + 'px', height: A.h + 'px' }); if (!silent) Snd.play('max'); }
    this.updMaxBtn(w); setTimeout(() => w.onResize?.(), 280);
  },
  savePrev(w) { const s = w.el.style; w.prev = { x: parseFloat(s.left), y: parseFloat(s.top), w: parseFloat(s.width), h: parseFloat(s.height) }; },
  updMaxBtn(w) { const b = w.el.querySelector('.mx'); b.innerHTML = svg(w.max ? 'unmax' : 'max'); b.title = w.max ? 'Restore' : 'Maximize'; },
  close(w, force) {
    if (w.closing) return;
    if (w.beforeClose && !force) { w.beforeClose().then(ok => ok && this.close(w, true)); return; }
    w.closing = true;
    w.onClose.forEach(f => { try { f(); } catch (e) { } });
    w.el.classList.add('closing'); Snd.play('close');
    setTimeout(() => w.el.remove(), 240);
    this.wins = this.wins.filter(x => x !== w);
    if (this.active === w) this.focusTop(); Taskbar.render(); Bus.emit('wins');
  },
  closeAll() { this.wins.slice().forEach(w => { w.onClose.forEach(f => { try { f(); } catch (e) { } }); w.el.remove(); }); this.wins = []; this.active = null; },
  rectFor(side) {
    const A = this.area(), hw = Math.round(A.w / 2), hh = Math.round(A.h / 2);
    return { max: [0, 0, A.w, A.h], left: [0, 0, hw, A.h], right: [hw, 0, A.w - hw, A.h], tl: [0, 0, hw, hh], tr: [hw, 0, A.w - hw, hh], bl: [0, hh, hw, A.h - hh], br: [hw, hh, A.w - hw, A.h - hh] }[side];
  },
  snapPreview(side) {
    const p = $('#snapPreview'); if (!side) { p.style.opacity = 0; return; }
    const [x, y, w, h] = this.rectFor(side); Object.assign(p.style, { left: x + 8 + 'px', top: y + 8 + 'px', width: w - 16 + 'px', height: h - 16 + 'px', opacity: 1 });
  },
  snap(w, side) {
    if (side === 'max') { if (!w.max) this.toggleMax(w); return; }
    if (w.max) { w.max = false; w.el.classList.remove('max'); this.updMaxBtn(w); }
    else if (!w.snapped) this.savePrev(w);
    const [x, y, ww, hh] = this.rectFor(side); w.snapped = side;
    Object.assign(w.el.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); Snd.play('max');
    setTimeout(() => w.onResize?.(), 280);
  },
  drag(w, e) {
    if (e.button !== 0) return;
    const el = w.el, A = this.area(); let sx = e.clientX, sy = e.clientY, r = el.getBoundingClientRect(), moved = false, snap = null;
    const move = ev => {
      if (!moved) {
        if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 5) return;
        moved = true; document.body.classList.add('dragging'); el.classList.add('notrans');
        if (w.max || w.snapped) {
          const ratio = (sx - r.left) / r.width; w.max = false; w.snapped = null; el.classList.remove('max'); this.updMaxBtn(w);
          const nx = ev.clientX - w.prev.w * ratio; Object.assign(el.style, { width: w.prev.w + 'px', height: w.prev.h + 'px', left: nx + 'px', top: Math.max(0, ev.clientY - 20) + 'px' });
          r = { left: nx, top: Math.max(0, ev.clientY - 20), width: w.prev.w }; sx = ev.clientX; sy = ev.clientY;
        }
      }
      const nx = r.left + ev.clientX - sx, ny = clamp(r.top + ev.clientY - sy, 0, A.h - 42);
      el.style.left = nx + 'px'; el.style.top = ny + 'px';
      const X = ev.clientX, Y = ev.clientY, edge = 3;
      snap = (X <= edge && Y < 90) ? 'tl' : (X <= edge && Y > A.h - 90) ? 'bl' : (X >= innerWidth - edge - 1 && Y < 90) ? 'tr' : (X >= innerWidth - edge - 1 && Y > A.h - 90) ? 'br' : Y <= edge ? 'max' : X <= edge ? 'left' : X >= innerWidth - edge - 1 ? 'right' : null;
      this.snapPreview(snap);
    };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up);
      document.body.classList.remove('dragging'); el.classList.remove('notrans'); this.snapPreview(null);
      if (moved) { if (snap) this.snap(w, snap); else this.savePrev(w); w.onResize?.(); }
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  },
  resize(w, e, d) {
    e.stopPropagation(); e.preventDefault();
    const el = w.el, sx = e.clientX, sy = e.clientY, s = el.style;
    const o = { x: parseFloat(s.left), y: parseFloat(s.top), w: parseFloat(s.width), h: parseFloat(s.height) };
    const minW = parseFloat(getComputedStyle(el).minWidth) || 280, minH = 180;
    document.body.classList.add('dragging'); el.classList.add('notrans'); w.snapped = null;
    const move = ev => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (d.includes('e')) s.width = Math.max(minW, o.w + dx) + 'px';
      if (d.includes('s')) s.height = Math.max(minH, o.h + dy) + 'px';
      if (d.includes('w')) { const nw = Math.max(minW, o.w - dx); s.width = nw + 'px'; s.left = o.x + o.w - nw + 'px'; }
      if (d.includes('n')) { const nh = Math.max(minH, o.h - dy); s.height = nh + 'px'; s.top = Math.max(0, o.y + o.h - nh) + 'px'; }
      w.onResize?.();
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); document.body.classList.remove('dragging'); el.classList.remove('notrans'); this.savePrev(w); w.onResize?.(); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  },
  winMenu(w, x, y) {
    Ctx.show(x, y, [
      { label: w.max ? 'Restore' : 'Maximize', icon: w.max ? 'unmax' : 'max', action: () => this.toggleMax(w) },
      { label: 'Minimize', icon: 'min', kbd: 'Alt+M', action: () => this.minimize(w) },
      { label: 'Snap left', icon: 'back', kbd: 'Alt+←', action: () => this.snap(w, 'left') },
      { label: 'Snap right', icon: 'fwd', kbd: 'Alt+→', action: () => this.snap(w, 'right') },
      { label: (w.top ? '✓ ' : '') + 'Always on top', icon: 'pin', action: () => { w.top = !w.top; this.focus(w); w.el.style.zIndex = (w.top ? 5000 : 0) + (++this.z); } },
      '-',
      ...this.desks.map((d, i) => i !== w.desk ? { label: 'Move to ' + d, icon: 'taskview', action: () => this.moveToDesk(w, i) } : null),
      this.desks.length > 1 ? '-' : null,
      { label: 'Close', icon: 'x', kbd: 'Alt+W', action: () => this.close(w) }
    ]);
  },
  switchDesk(i) {
    if (i >= this.desks.length) return;
    this.desk = i; this.wins.forEach(w => w.el.classList.toggle('otherdesk', w.desk !== i));
    this.active = null; this.focusTop(); Taskbar.render();
  },
  moveToDesk(w, i) { w.desk = i; w.el.classList.toggle('otherdesk', i !== this.desk); if (this.active === w) this.focusTop(); Taskbar.render(); notify('Window moved', `${w.title} is now on ${this.desks[i]}.`, 'settings'); },
  addDesk() { if (this.desks.length >= 6) return; this.desks.push('Desktop ' + (this.desks.length + 1)); Store.set('desks', this.desks); },
  removeDesk(i) { if (this.desks.length <= 1) return; this.wins.forEach(w => { if (w.desk === i) w.desk = 0; else if (w.desk > i) w.desk--; }); this.desks.splice(i, 1); this.desks = this.desks.map((_, k) => 'Desktop ' + (k + 1)); Store.set('desks', this.desks); this.switchDesk(Math.min(this.desk, this.desks.length - 1)); },
  showDesktop() {
    const vis = this.wins.filter(w => !w.min && w.desk === this.desk);
    if (vis.length) { this._shown = vis; vis.forEach(w => this.minimize(w)); }
    else if (this._shown) { this._shown.forEach(w => this.wins.includes(w) && this.focus(w)); this._shown = null; }
  }
};
addEventListener('resize', () => { const A = WM.area(); WM.wins.forEach(w => { if (w.max) Object.assign(w.el.style, { width: A.w + 'px', height: A.h + 'px' }); else if (w.snapped) WM.snap(w, w.snapped); w.onResize?.(); }); });

/* =====================================================================
   FILE OPENING / RECENTS
   ===================================================================== */
let RECENT = Store.get('recent', []);
function addRecent(p) { RECENT = [p, ...RECENT.filter(x => x !== p)].slice(0, 8); Store.set('recent', RECENT); }
function fileIcon(name, dir) {
  if (dir) return `<div class="ai folder">${svg('folder')}</div>`;
  const e = FS.ext(name);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return `<div class="ai" style="background:linear-gradient(150deg,#4cc9f0,#3a56d4)">${svg('image')}</div>`;
  if (['html', 'htm', 'css', 'js', 'json'].includes(e)) return `<div class="ai" style="background:linear-gradient(150deg,#3ddc97,#1b8a5a)">${svg('code')}</div>`;
  if (['mp3', 'wav', 'ogg'].includes(e)) return `<div class="ai" style="background:linear-gradient(150deg,#ff4d6d,#a4133c)">${svg('music')}</div>`;
  if (e === 'md') return `<div class="ai" style="background:linear-gradient(150deg,#c77dff,#6a3dbd)">${svg('doc')}</div>`;
  return `<div class="ai file">${svg('doc')}</div>`;
}
function openPath(p) {
  const n = FS.node(p); if (!n) { UI.alert('File not found', `RestaurantOS can't find "${esc(p)}". It may have been moved or deleted.`); return; }
  if (n.t === 'd') return WM.open('files', { path: p });
  addRecent(p); const e = FS.ext(p);
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return WM.open('photos', { path: p });
  if (['html', 'htm'].includes(e)) return WM.open('code', { path: p });
  if (['mp3', 'wav', 'ogg'].includes(e)) return WM.open('music', { path: p });
  return WM.open('notepad', { path: p });
}

/* =====================================================================
   DESKTOP ICONS
   ===================================================================== */
let ICONPOS = Store.get('iconPos', {});
const Desk = {
  sel: new Set(),
  items() {
    const fixed = [['app:files', 'Files', () => WM.open('files'), appIcon('files')], ['app:trash', 'Recycle Bin', () => WM.open('files', { path: '/Trash' }), `<div class="ai" style="background:linear-gradient(150deg,#b8c2cc,#59636e)">${svg('trash')}</div>`], ['app:browser', 'Resto Browser', () => WM.open('browser'), appIcon('browser')], ['app:store', 'RestoStore', () => WM.open('store'), appIcon('store')], ['app:settings', 'Settings', () => WM.open('settings'), appIcon('settings')], ['app:terminal', 'Terminal', () => WM.open('terminal'), appIcon('terminal')]];
    const files = FS.list('/Desktop').map(e => ['fs:' + e.path, e.name, () => openPath(e.path), fileIcon(e.name, e.dir), e.path]);
    return [...fixed, ...files].map(([key, name, open, icon, path]) => ({ key, name, open, icon, path }));
  },
  render() {
    const box = $('#icons'); box.innerHTML = ''; const items = this.items();
    const A = WM.area(); const cw = 96, ch = 104; const rows = Math.max(1, Math.floor((A.h - 10) / ch));
    const used = new Set(Object.entries(ICONPOS).filter(([k]) => items.some(i => i.key === k)).map(([, p]) => p.c + ',' + p.r));
    let slot = 0;
    items.forEach(it => {
      let p = ICONPOS[it.key];
      if (!p || p.r >= rows) { while (used.has(Math.floor(slot / rows) + ',' + slot % rows)) slot++; p = { c: Math.floor(slot / rows), r: slot % rows }; used.add(p.c + ',' + p.r); ICONPOS[it.key] = p; }
      const el = html(`<div class="dicon ${this.sel.has(it.key) ? 'sel' : ''}" data-k="${esc(it.key)}" tabindex="0">${it.icon}<span>${esc(it.name.replace(/\.txt$/, ''))}</span></div>`);
      el.style.left = 8 + p.c * cw + 'px'; el.style.top = 8 + p.r * ch + 'px';
      el.ondblclick = () => it.open();
      el.onkeydown = e => { if (e.key === 'Enter') it.open(); };
      el.onpointerdown = e => this.iconDown(e, it, el, cw, ch, rows);
      el.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); this.iconMenu(e, it); };
      box.appendChild(el);
    });
    Store.set('iconPos', ICONPOS);
  },
  iconDown(e, it, el, cw, ch, rows) {
    if (e.button !== 0) return; e.stopPropagation();
    if (!e.ctrlKey && !this.sel.has(it.key)) this.sel.clear();
    if (e.ctrlKey && this.sel.has(it.key)) this.sel.delete(it.key); else this.sel.add(it.key);
    $$('.dicon').forEach(d => d.classList.toggle('sel', this.sel.has(d.dataset.k)));
    const sx = e.clientX, sy = e.clientY, ox = parseFloat(el.style.left), oy = parseFloat(el.style.top); let moved = false;
    const move = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return; moved = true; el.style.zIndex = 5; el.style.left = ox + dx + 'px'; el.style.top = oy + dy + 'px'; };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); el.style.zIndex = '';
      if (!moved) return;
      const c = Math.max(0, Math.round((parseFloat(el.style.left) - 8) / cw)), r = clamp(Math.round((parseFloat(el.style.top) - 8) / ch), 0, rows - 1);
      const taken = Object.entries(ICONPOS).find(([k, p]) => k !== it.key && p.c === c && p.r === r);
      if (taken) ICONPOS[taken[0]] = ICONPOS[it.key];
      ICONPOS[it.key] = { c, r }; this.render();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  },
  iconMenu(e, it) {
    if (!this.sel.has(it.key)) { this.sel = new Set([it.key]); $$('.dicon').forEach(d => d.classList.toggle('sel', this.sel.has(d.dataset.k))); }
    const fs = it.path;
    Ctx.show(e.clientX, e.clientY, [
      { label: 'Open', icon: 'open', action: it.open },
      it.key === 'app:trash' ? { label: 'Empty Recycle Bin', icon: 'trash', action: emptyTrash } : null,
      fs ? '-' : null,
      fs ? { label: 'Rename', icon: 'edit', kbd: 'F2', action: () => renamePath(fs) } : null,
      fs ? { label: 'Copy to Documents', icon: 'copy', action: () => { FS.move(fs, '/Documents', true); notify('Copied', `${it.name} was copied to Documents.`, 'files'); } } : null,
      fs ? { label: 'Delete', icon: 'trash', kbd: 'Del', action: () => this.deleteSel() } : null,
      '-',
      { label: 'Properties', icon: 'info', action: () => fs ? showProps(fs) : UI.alert(it.name, 'System shortcut to ' + it.name + '.') }
    ]);
  },
  deleteSel() { const paths = [...this.sel].filter(k => k.startsWith('fs:')).map(k => k.slice(3)); if (!paths.length) return; paths.forEach(p => FS.remove(p)); Snd.play('trash'); this.sel.clear(); },
  bgMenu(e) {
    Ctx.show(e.clientX, e.clientY, [
      { label: 'View', icon: 'grid', action: () => WM.open('settings', { page: 'personal' }) },
      { label: 'Sort icons by name', icon: 'sort', action: () => { ICONPOS = {}; this.render(); } },
      { label: 'Refresh', icon: 'refresh', action: () => { $('#icons').style.opacity = 0; setTimeout(() => { this.render(); $('#icons').style.opacity = 1; }, 150); } },
      '-',
      { label: 'New folder', icon: 'newfolder', action: async () => { const n = await UI.prompt('New folder', 'Name the folder:', FS.uniq('/Desktop', 'New folder')); if (n) FS.mkdir('/Desktop/' + n); } },
      { label: 'New text document', icon: 'newfile', action: async () => { const n = await UI.prompt('New text document', 'Name the file:', FS.uniq('/Desktop', 'New document.txt')); if (n) { FS.write('/Desktop/' + n, ''); openPath('/Desktop/' + n); } } },
      { label: 'Paste', icon: 'paste', disabled: !CLIP, action: () => pasteInto('/Desktop') },
      '-',
      { label: 'Open in Terminal', icon: 'terminal', action: () => WM.open('terminal', { cwd: '/Desktop' }) },
      { label: 'Next wallpaper', icon: 'image', action: nextWallpaper },
      { label: 'Display settings', icon: 'display', action: () => WM.open('settings', { page: 'display' }) },
      { label: 'Personalize', icon: 'palette', action: () => WM.open('settings', { page: 'personal' }) }
    ]);
  },
  initBg() {
    const d = $('#desktop'), box = $('#selbox');
    d.addEventListener('contextmenu', e => { if (e.target.closest('.dicon')) return; e.preventDefault(); this.bgMenu(e); });
    d.addEventListener('pointerdown', e => {
      if (e.target.closest('.dicon') || e.button !== 0) return;
      this.sel.clear(); $$('.dicon').forEach(x => x.classList.remove('sel'));
      const sx = e.clientX, sy = e.clientY;
      const move = ev => {
        const x = Math.min(sx, ev.clientX), y = Math.min(sy, ev.clientY), w = Math.abs(ev.clientX - sx), h = Math.abs(ev.clientY - sy);
        Object.assign(box.style, { display: 'block', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
        $$('.dicon').forEach(ic => { const r = ic.getBoundingClientRect(); const hit = r.left < x + w && r.right > x && r.top < y + h && r.bottom > y; ic.classList.toggle('sel', hit); hit ? this.sel.add(ic.dataset.k) : this.sel.delete(ic.dataset.k); });
      };
      const up = () => { box.style.display = 'none'; removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
      addEventListener('pointermove', move); addEventListener('pointerup', up);
    });
    // drop real files from the host computer onto the desktop
    d.addEventListener('dragover', e => e.preventDefault());
    d.addEventListener('drop', e => { e.preventDefault(); importFiles(e.dataTransfer.files, '/Desktop'); });
  }
};
function importFiles(files, dir) {
  [...files].forEach(f => {
    const r = new FileReader(); const isImg = f.type.startsWith('image/');
    if (!isImg && f.size > 400000) { notify('File too large', `${f.name} is over 400 KB.`, 'files'); return; }
    r.onload = () => { const nm = FS.uniq(dir, f.name); if (FS.write(dir + '/' + nm, r.result)) notify('File added', `${nm} was copied to ${dir.slice(1) || 'Home'}.`, 'files'); };
    isImg ? r.readAsDataURL(f) : r.readAsText(f);
  });
}
let CLIP = null;
function pasteInto(dir) { if (!CLIP) return; const ok = FS.move(CLIP.path, dir, CLIP.mode === 'copy'); if (ok && CLIP.mode === 'cut') CLIP = null; }
async function renamePath(p) { const old = FS.parts(p).pop(); const n = await UI.prompt('Rename', '', old); if (n && n !== old && !FS.rename(p, n)) UI.alert("Can't rename", 'That name is empty, contains "/", or is already used in this folder.'); }
async function emptyTrash() { const n = FS.list('/Trash').length; if (!n) return notify('Recycle Bin is empty', 'There is nothing to delete.', 'files'); if (await UI.confirm('Empty Recycle Bin?', `Permanently delete ${n} item${n > 1 ? 's' : ''}? This can't be undone.`, 'Delete', true)) { FS.node('/Trash').c = {}; FS.save(); Bus.emit('fs'); Snd.play('trash'); } }
function showProps(p) { const n = FS.node(p); if (!n) return; UI.alert(FS.parts(p).pop() || 'Home', `<span class="kv" style="display:grid"><b>Type</b> ${n.t === 'd' ? 'Folder' : (FS.ext(p).toUpperCase() || 'Plain') + ' file'}<br><b>Location</b> ${esc(p)}<br><b>Size</b> ${fmtSize(FS.size(n))}<br><b>Modified</b> ${new Date(n.m).toLocaleString()}</span>`); }
function nextWallpaper() { const k = Object.keys(WALLS); S.wallpaper = k[(k.indexOf(S.wallpaper) + 1) % k.length]; applySettings(); }

/* =====================================================================
   TASKBAR
   ===================================================================== */
const Taskbar = {
  build() {
    $('#taskbar').innerHTML = `<div id="tbCenter">
      <button class="tbb" id="startBtn" data-fly="startMenu" aria-label="Start" title="Start">${NLOGO}</button>
      <button class="tbb" id="searchBtn" aria-label="Search" title="Search (Ctrl+K)">${svg('search')}</button>
      <button class="tbb" id="tvBtn" aria-label="Task view" title="Task view (Alt+V)">${svg('taskview')}</button>
      <button class="tbb" id="wgBtn" data-fly="widgets" aria-label="Widgets" title="Widgets (Alt+G)">${svg('widgets')}</button>
      <span class="sep" style="height:26px"></span><div id="tbApps" style="display:flex;gap:4px"></div></div>
      <div id="tbRight">
        <button class="tray" id="trayBtn" data-fly="quick" aria-label="Quick settings"><span class="lang">${esc(S.kb.split(' ')[0].slice(0, 3).toUpperCase())}</span><span id="trWifi"></span><span id="trVol"></span><span id="trBat"></span></button>
        <button class="tray" id="clockBtn" data-fly="notifPanel" aria-label="Notifications and calendar"><span id="tbTime"></span><span id="tbDate" style="color:var(--fg2)"></span><span class="badge" id="tbBadge"></span></button>
        <button id="showDesk" title="Show desktop (Alt+D)" aria-label="Show desktop"></button></div>`;
    $('#startBtn').onclick = () => Fly.toggle('startMenu');
    $('#searchBtn').onclick = () => Spot.open();
    $('#tvBtn').onclick = () => TaskView.toggle();
    $('#wgBtn').onclick = () => Fly.toggle('widgets');
    $('#trayBtn').onclick = () => Fly.toggle('quick');
    $('#clockBtn').onclick = () => Fly.toggle('notifPanel');
    $('#showDesk').onclick = () => WM.showDesktop();
    $('#taskbar').addEventListener('contextmenu', e => { if (e.target.closest('.tbb.app')) return; e.preventDefault(); Ctx.show(e.clientX, e.clientY, [{ label: 'Task Manager', icon: 'taskmgr', action: () => WM.open('taskmgr') }, { label: 'Taskbar settings', icon: 'settings', action: () => WM.open('settings', { page: 'personal' }) }, { label: 'Align ' + (S.tbAlign === 'center' ? 'left' : 'center'), icon: 'sort', action: () => { S.tbAlign = S.tbAlign === 'center' ? 'left' : 'center'; applySettings(); } }, '-', { label: 'Show desktop', icon: 'display', action: () => WM.showDesktop() }]); });
    this.tray(); this.render();
  },
  tray() {
    const tw = $('#trWifi'); if (!tw) return;
    tw.innerHTML = svg(S.wifi && !S.airplane && navigator.onLine !== false ? 'wifi' : S.airplane ? 'plane' : 'wifioff');
    $('#trVol').innerHTML = svg(S.sound && S.volume > 0 ? 'vol' : 'mute');
    $('#trBat').innerHTML = `<svg viewBox="0 0 24 24"><rect x="3" y="8" width="15" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 10.5v3" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="10" width="${Math.max(1, 11 * Batt.level / 100)}" height="4" rx=".5" fill="${Batt.level < 20 ? 'var(--bad)' : 'currentColor'}" stroke="none"/></svg>`;
    $('#trayBtn').title = `${S.wifi && !S.airplane ? S.wifiName : 'Not connected'} · Volume ${S.volume}% · Battery ${Batt.level}%${Batt.charging ? ' (charging)' : ''}`;
  },
  btnFor(id) { return $(`#tbApps [data-app="${id}"]`); },
  render() {
    const box = $('#tbApps'); if (!box) return;
    const running = [...new Set(WM.wins.map(w => w.app.id))];
    const ids = [...S.pinned.filter(isInstalled), ...running.filter(r => !S.pinned.includes(r))];
    box.innerHTML = '';
    ids.forEach(id => {
      const wins = WM.wins.filter(w => w.app.id === id);
      const act = WM.active && WM.active.app.id === id && !WM.active.min;
      const b = html(`<button class="tbb app ${wins.length ? 'running' : ''} ${act ? 'active' : ''}" data-app="${id}" aria-label="${esc(APPS[id].name)}">${appIcon(id)}</button>`);
      b.onclick = () => this.click(id);
      b.onauxclick = e => { if (e.button === 1) WM.open(id); };
      b.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); this.menu(e, id); };
      b.onmouseenter = () => this.tip(b, wins.length ? wins.map(w => w.title).join(' · ') : APPS[id].name);
      b.onmouseleave = () => this.tip();
      box.appendChild(b);
    });
  },
  click(id) {
    Snd.play('click'); this.tip();
    const wins = WM.wins.filter(w => w.app.id === id);
    if (!wins.length) return WM.open(id);
    if (wins.length === 1) { const w = wins[0]; if (WM.active === w && !w.min) WM.minimize(w); else WM.focus(w); return; }
    const sorted = wins.sort((a, b) => +a.el.style.zIndex - +b.el.style.zIndex); WM.focus(sorted[0]);
  },
  menu(e, id) {
    const pinned = S.pinned.includes(id); const wins = WM.wins.filter(w => w.app.id === id);
    Ctx.show(e.clientX, e.clientY - 10, [
      ...wins.map(w => ({ label: w.title, icon: 'max', action: () => WM.focus(w) })), wins.length ? '-' : null,
      { label: 'Open new window', icon: 'plus', action: () => WM.open(id) },
      { label: pinned ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', action: () => { S.pinned = pinned ? S.pinned.filter(x => x !== id) : [...S.pinned, id]; saveS(); this.render(); } },
      wins.length ? { label: wins.length > 1 ? 'Close all windows' : 'Close window', icon: 'x', action: () => wins.forEach(w => WM.close(w)) } : null
    ]);
  },
  tip(b, text) {
    $('.tb-tip')?.remove(); if (!b) return;
    const r = b.getBoundingClientRect(); const t = html(`<div class="tb-tip glass">${esc(text)}</div>`); t.style.left = r.left + r.width / 2 + 'px'; $('#os').appendChild(t);
  },
  clock() { if (!$('#tbTime')) return; const d = new Date(); $('#tbTime').textContent = fmtTime(d); $('#tbDate').textContent = d.toLocaleDateString(LOCALE, { month: 'numeric', day: 'numeric', year: 'numeric' }); },
  badge() { const b = $('#tbBadge'); if (!b) return; b.textContent = unread; b.style.display = unread ? 'grid' : 'none'; }
};

/* =====================================================================
   FLYOUTS: start, quick settings, notifications, widgets
   ===================================================================== */
const Fly = {
  open: null,
  toggle(id) { if (this.open === id) return this.close(); this.close(); this.open = id; Snd.play('click'); ({ startMenu: renderStart, quick: renderQuick, notifPanel: renderNotif, widgets: renderWidgets })[id](); requestAnimationFrame(() => $('#' + id).classList.add('open')); },
  close() { if (!this.open) return; $('#' + this.open).classList.remove('open'); this.open = null; }
};
document.addEventListener('pointerdown', e => {
  if (Ctx.el && !e.target.closest('.ctx')) Ctx.hide();
  if (Fly.open && !e.target.closest('.flyout') && !e.target.closest(`[data-fly="${Fly.open}"]`) && !e.target.closest('.modal-back')) Fly.close();
}, true);

let smView = 'pinned';
function renderStart() {
  const el = $('#startMenu'); smView = 'pinned';
  el.innerHTML = `<div class="sm-search">${svg('search')}<input id="smQ" placeholder="Search apps, files and settings" autocomplete="off" aria-label="Search"></div>
    <div class="sm-scroll" id="smBody"></div>
    <div class="sm-foot"><button class="sm-user" id="smUser">${avatarEl()}<span>${esc(S.user || 'User')}</span></button>
    <button class="icon-btn" id="smPow" aria-label="Power" title="Power" style="background:none">${svg('power')}</button>
    <div class="power-menu glass" id="powMenu">
      <button data-p="lock">${svg('lock')}Lock<kbd style="margin-left:auto;font-size:11px;color:var(--fg2)">Alt+L</kbd></button><button data-p="signout">${svg('signout')}Sign out</button><button data-p="sleep">${svg('moon')}Sleep</button>
      <hr style="border:0;border-top:1px solid var(--line);margin:4px"><button data-p="restart">${svg('restart')}Restart</button><button data-p="bios">${svg('cpu')}Restart to BIOS</button><button data-p="off">${svg('power')}Shut down</button></div></div>`;
  const body = $('#smBody');
  const pinned = () => {
    const pins = S.startPinned.filter(isInstalled);
    body.innerHTML = `<div class="sm-head"><span>Pinned</span><button id="smAll">All apps ›</button></div>
      <div class="sm-grid">${pins.map((id, i) => `<button class="sm-app" data-app="${id}" style="animation-delay:${i * 18}ms">${appIcon(id)}<span>${esc(APPS[id].name)}</span></button>`).join('')}</div>
      <div class="sm-head"><span>Recommended</span></div>
      <div class="sm-rec">${RECENT.filter(p => FS.exists(p)).slice(0, 6).map(p => `<button class="sm-row" data-path="${esc(p)}">${fileIcon(p, false)}<div style="min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(FS.parts(p).pop())}</div><small>${esc(p.split('/').slice(0, -1).join('/') || '/')}</small></div></button>`).join('') || `<div class="muted" style="font-size:13px;padding:6px 10px;grid-column:1/-1">Files you open will show up here.</div>`}</div>`;
    $('#smAll').onclick = () => all();
  };
  const all = () => {
    let last = ''; body.innerHTML = `<div class="sm-head"><span>All apps</span><button id="smBack">‹ Back</button></div><div class="sm-list">${installedApps().map(a => { const L = a.name[0].toUpperCase(); const hd = L !== last ? `<div class="sm-letter">${L}</div>` : ''; last = L; return hd + `<button class="sm-row" data-app="${a.id}">${appIcon(a.id)}<div><div>${esc(a.name)}</div><small>${esc(a.cat)}</small></div></button>`; }).join('')}</div>`;
    $('#smBack').onclick = pinned;
  };
  const search = q => {
    const ql = q.toLowerCase(); const apps = installedApps().filter(a => (a.name + ' ' + (a.kw || '') + ' ' + a.cat).toLowerCase().includes(ql));
    const files = FS.walk('/').filter(f => f.name.toLowerCase().includes(ql) && !f.path.startsWith('/Trash')).slice(0, 6);
    body.innerHTML = `<div class="sm-list">${apps.length ? '<div class="sm-letter">Apps</div>' : ''}${apps.map((a, i) => `<button class="sm-row ${i === 0 ? 'kb' : ''}" data-app="${a.id}">${appIcon(a.id)}<div><div>${esc(a.name)}</div><small>${esc(a.desc || a.cat)}</small></div></button>`).join('')}
      ${files.length ? '<div class="sm-letter">Files</div>' : ''}${files.map(f => `<button class="sm-row" data-path="${esc(f.path)}">${fileIcon(f.name, f.dir)}<div><div>${esc(f.name)}</div><small>${esc(f.path)}</small></div></button>`).join('')}
      <div class="sm-letter">Web</div><button class="sm-row" data-web="1">${appIcon('browser')}<div><div>Search the web for "${esc(q)}"</div><small>Resto Browser</small></div></button></div>`;
    $('[data-web]', body).onclick = () => { Fly.close(); WM.open('browser', { q }); };
  };
  pinned();
  body.onclick = e => { const a = e.target.closest('[data-app]'); const p = e.target.closest('[data-path]'); if (a) { Fly.close(); WM.open(a.dataset.app); } else if (p) { Fly.close(); openPath(p.dataset.path); } };
  body.oncontextmenu = e => { const a = e.target.closest('[data-app]'); if (!a) return; e.preventDefault(); const id = a.dataset.app; const sp = S.startPinned.includes(id), tp = S.pinned.includes(id);
    Ctx.show(e.clientX, e.clientY, [{ label: 'Open', icon: 'open', action: () => { Fly.close(); WM.open(id); } }, { label: sp ? 'Unpin from Start' : 'Pin to Start', icon: 'pin', action: () => { S.startPinned = sp ? S.startPinned.filter(x => x !== id) : [...S.startPinned, id]; saveS(); renderStart(); } }, { label: tp ? 'Unpin from taskbar' : 'Pin to taskbar', icon: 'pin', action: () => { S.pinned = tp ? S.pinned.filter(x => x !== id) : [...S.pinned, id]; saveS(); Taskbar.render(); } }, !APPS[id].core ? { label: 'Uninstall', icon: 'trash', action: () => uninstallApp(id) } : null]); };
  const q = $('#smQ');
  q.oninput = () => q.value.trim() ? search(q.value.trim()) : pinned();
  q.onkeydown = e => { if (e.key === 'Enter') { const f = $('.sm-row.kb, .sm-row', body); f?.click(); } if (e.key === 'Escape') Fly.close(); };
  setTimeout(() => q.focus(), 60);
  $('#smUser').onclick = () => { Fly.close(); WM.open('settings', { page: 'accounts' }); };
  $('#smPow').onclick = e => { e.stopPropagation(); $('#powMenu').classList.toggle('open'); };
  $$('#powMenu [data-p]').forEach(b => b.onclick = () => { Fly.close(); ({ lock: lockScreen, signout: signOut, sleep: sleepPC, restart: () => restart(), bios: () => restart(true), off: powerOff })[b.dataset.p](); });
}
function uninstallApp(id) {
  UI.confirm('Uninstall ' + APPS[id].name + '?', 'The app and its pins will be removed. You can reinstall it from RestoStore.', 'Uninstall', true).then(ok => {
    if (!ok) return; WM.wins.filter(w => w.app.id === id).forEach(w => WM.close(w));
    S.installed = S.installed.filter(x => x !== id); S.pinned = S.pinned.filter(x => x !== id); S.startPinned = S.startPinned.filter(x => x !== id); saveS(); Taskbar.render(); Bus.emit('apps');
    notify('App removed', APPS[id].name + ' was uninstalled.', 'store');
  });
}
function renderQuick() {
  const el = $('#quick');
  const T = [['wifi', S.wifi && !S.airplane ? 'wifi' : 'wifioff', S.wifi && !S.airplane ? S.wifiName : 'Wi-Fi'], ['bt', 'bt', 'Bluetooth'], ['airplane', 'plane', 'Airplane'], ['night', 'moon', 'Night light'], ['dnd', 'belloff', 'Focus'], ['saver', 'leaf', 'Battery saver'], ['dark', 'contrast', 'Dark mode'], ['sound', 'vol', 'Sounds'], ['full', 'full', 'Fullscreen']];
  const on = k => k === 'dark' ? S.theme === 'dark' : k === 'full' ? !!document.fullscreenElement : !!S[k];
  el.innerHTML = `<div class="qs-grid">${T.map(([k, ic, l]) => `<button class="qs ${on(k) ? 'on' : ''}" data-k="${k}"><i>${svg(ic)}</i><span style="max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(l)}</span></button>`).join('')}</div>
    <div class="qs-slider">${svg('sun')}<input type="range" id="qsBri" min="20" max="100" value="${S.brightness}" aria-label="Brightness"><span id="qsBriV">${S.brightness}</span></div>
    <div class="qs-slider">${svg(S.volume ? 'vol' : 'mute')}<input type="range" id="qsVol" min="0" max="100" value="${S.volume}" aria-label="Volume"><span id="qsVolV">${S.volume}</span></div>
    <div class="qs-foot"><span class="bat">${svg('bat')}${Batt.level}%${Batt.charging ? ' · Charging' : ''}${Batt.real ? '' : ' · simulated'}</span><button class="icon-btn" id="qsSet" aria-label="All settings" style="background:none">${svg('settings')}</button></div>`;
  $$('.qs-foot svg').forEach(s => s.style.cssText = 'width:18px;height:18px');
  $$('.qs', el).forEach(b => b.onclick = () => {
    const k = b.dataset.k; Snd.play('toggle');
    if (k === 'dark') S.theme = S.theme === 'dark' ? 'light' : 'dark';
    else if (k === 'full') { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())?.catch?.(() => notify('Fullscreen unavailable', 'This view does not allow fullscreen.', 'settings')); setTimeout(renderQuick, 300); return; }
    else S[k] = !S[k];
    if (k === 'airplane' && S.airplane) { S.wifi = false; S.bt = false; }
    if (k === 'wifi' && S.wifi) S.airplane = false;
    applySettings(); renderQuick();
  });
  const sl = (id, key, icon) => { const r = $('#' + id); const set = () => { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }; set(); r.oninput = () => { S[key] = +r.value; $('#' + id + 'V').textContent = r.value; set(); applySettings(); osd(icon, key === 'brightness' ? (r.value - 20) / .8 : +r.value); }; r.onchange = () => key === 'volume' && Snd.play('pop'); };
  sl('qsBri', 'brightness', 'sun'); sl('qsVol', 'volume', 'vol');
  $('#qsSet').onclick = () => { Fly.close(); WM.open('settings'); };
}
let calOff = 0;
function miniCal(off, events = {}) {
  const now = new Date(); const d = new Date(now.getFullYear(), now.getMonth() + off, 1);
  const start = (d.getDay() + 6) % 7; const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); const prevDays = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
  let cells = ''; for (let i = 0; i < 42; i++) { const n = i - start + 1; let cls = 'd', label = n; if (n < 1) { cls += ' o'; label = prevDays + n; } else if (n > days) { cls += ' o'; label = n - days; } else { const key = `${d.getFullYear()}-${d.getMonth() + 1}-${n}`; if (off === 0 && n === now.getDate()) cls += ' t'; if (events[key]?.length) cls += ' ev'; } cells += `<div class="${cls}">${label}</div>`; }
  return { title: d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }), html: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(x => `<div class="dn">${x}</div>`).join('') + cells };
}
function renderNotif() {
  const el = $('#notifPanel'); unread = 0; Taskbar.badge();
  const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'now' : s < 3600 ? Math.floor(s / 60) + 'm' : s < 86400 ? Math.floor(s / 3600) + 'h' : Math.floor(s / 86400) + 'd'; };
  const c = miniCal(calOff, Store.get('events', {}));
  el.innerHTML = `<section class="np-list glass"><div class="np-head"><span>Notifications ${S.dnd ? '<span class="chip" style="margin-left:6px">Focus on</span>' : ''}</span><button id="npClear">Clear all</button></div>
    <div class="np-items">${NOTIFS.length ? NOTIFS.map(n => `<div class="ncard" data-id="${n.id}">${appIcon(APPS[n.app] ? n.app : 'settings')}<div style="min-width:0;flex:1"><div style="display:flex;gap:8px"><b>${esc(n.title)}</b><time>${ago(n.t)}</time></div><p>${esc(n.body)}</p></div><button class="nx" aria-label="Dismiss">✕</button></div>`).join('') : `<div class="np-empty">${svg('bell')}<br>No new notifications</div>`}</div></section>
    <section class="np-cal glass"><div style="font-family:var(--f-display);font-size:18px;font-weight:600">${fmtDate()}</div><div class="cal-h" style="margin-top:10px"><span>${c.title}</span><span><button id="cP" aria-label="Previous month">‹</button><button id="cN" aria-label="Next month">›</button></span></div><div class="cal-g">${c.html}</div></section>`;
  $$('.np-empty svg').forEach(s => s.style.cssText = 'width:36px;height:36px;opacity:.5');
  $('#npClear').onclick = () => { NOTIFS = []; Store.set('notifs', NOTIFS); renderNotif(); };
  $$('.ncard', el).forEach(c => { c.querySelector('.nx').onclick = e => { e.stopPropagation(); NOTIFS = NOTIFS.filter(n => n.id !== c.dataset.id); Store.set('notifs', NOTIFS); c.style.cssText = 'transition:.25s;opacity:0;transform:translateX(40px)'; setTimeout(renderNotif, 250); }; c.onclick = () => { const n = NOTIFS.find(x => x.id === c.dataset.id); Fly.close(); if (n && APPS[n.app]) WM.open(n.app); }; });
  $('#cP').onclick = () => { calOff--; renderNotif(); }; $('#cN').onclick = () => { calOff++; renderNotif(); };
  $('.np-cal .cal-h').ondblclick = () => { Fly.close(); WM.open('calendar'); };
}
const QUOTES = ['"The best way to predict the future is to invent it." — Alan Kay', '"Simplicity is prerequisite for reliability." — Edsger Dijkstra', '"Make it work, make it right, make it fast." — Kent Beck', '"Design is how it works." — Steve Jobs', '"Stay hungry, stay foolish." — Whole Earth Catalog'];
function renderWidgets() {
  const el = $('#widgets'); const w = Weather.now(); const todos = Store.get('todos', []); const open = todos.filter(t => !t.done);
  const up = Math.floor((Date.now() - BOOT_T) / 60000);
  const ev = Store.get('events', {}); const k = new Date(); const today = ev[`${k.getFullYear()}-${k.getMonth() + 1}-${k.getDate()}`] || [];
  el.innerHTML = `<div class="wg-top"><h3 id="wgTime">${fmtTime(new Date(), false)}</h3><span class="muted">${fmtDate()}</span></div>
    <div class="wgrid">
      <div class="wcard weather span" data-open="weather"><h4>${esc(S.city)}</h4><div class="row" style="justify-content:space-between"><div><div class="big">${w.temp}°</div><div>${w.cond}</div></div><div style="text-align:right;font-size:13px;opacity:.9">H ${w.hi}° · L ${w.lo}°<br>Rain ${w.rain}% · Wind ${w.wind} km/h</div></div></div>
      <div class="wcard" data-open="todo"><h4>To Do</h4><div class="big">${open.length}</div><div class="muted" style="font-size:12px">${open[0] ? esc(open[0].text) : 'All done'}</div></div>
      <div class="wcard" data-open="taskmgr"><h4>System</h4><div class="big">${WM.wins.length}</div><div class="muted" style="font-size:12px">open windows · up ${up} min</div></div>
      <div class="wcard span" data-open="calendar"><h4>Today</h4>${today.length ? today.map(e => `<div style="font-size:13px;padding:3px 0">• ${esc(e)}</div>`).join('') : '<div class="muted" style="font-size:13px">No events today. Double-click a day in Calendar to add one.</div>'}</div>
      <div class="wcard span"><h4>RestaurantOS News</h4>
        ${[['RestaurantOS 1.0 lands with live wallpapers and virtual desktops', '#ff7a45,#2ec4b6'], ['RestoStore adds Breakout, Memory and Piano', '#c77dff,#4cc9f0'], ['Tip: drag windows into screen corners to tile them in quarters', '#ffd166,#ff4d6d']].map(([t, g]) => `<div class="news-item"><i style="background:linear-gradient(135deg,${g})"></i><span>${t}</span></div>`).join('')}</div>
      <div class="wcard span"><h4>Quote of the day</h4><div style="font-size:13px;line-height:1.5">${QUOTES[new Date().getDate() % QUOTES.length]}</div></div>
    </div>`;
  $$('[data-open]', el).forEach(c => { c.style.cursor = 'pointer'; c.onclick = () => { Fly.close(); WM.open(c.dataset.open); }; });
}

/* ---------- Task view ---------- */
const TaskView = {
  open: false,
  toggle() { this.open ? this.close() : this.show(); },
  show() {
    Fly.close(); this.open = true; const el = $('#taskview');
    const wins = WM.wins.filter(w => w.desk === WM.desk);
    el.innerHTML = `<div class="tv-bg"></div><div class="tv-wins">${wins.length ? wins.map((w, i) => `<div class="tv-card" data-id="${w.id}" style="animation-delay:${i * 40}ms"><header>${appIcon(w.app.id)}<span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(w.title)}</span><button class="tvx" aria-label="Close">✕</button></header><div class="prev">${appIcon(w.app.id)}</div></div>`).join('') : '<div style="color:#fff;opacity:.7">No windows open on this desktop</div>'}</div>
      <div class="tv-desks">${WM.desks.map((d, i) => `<div class="tv-desk ${i === WM.desk ? 'on' : ''}" data-d="${i}" style="background:${Wall.css()}"><span>${d} · ${WM.wins.filter(w => w.desk === i).length} windows</span>${WM.desks.length > 1 ? '<button class="dx" aria-label="Remove desktop">✕</button>' : ''}</div>`).join('')}${WM.desks.length < 6 ? '<div class="tv-desk add" data-add="1" title="New desktop">+</div>' : ''}</div>`;
    el.classList.add('open');
    $('.tv-bg', el).onclick = () => this.close();
    $$('.tv-card', el).forEach(c => { const w = WM.wins.find(x => x.id === c.dataset.id); c.onclick = () => { this.close(); WM.focus(w); }; c.querySelector('.tvx').onclick = e => { e.stopPropagation(); WM.close(w); setTimeout(() => this.show(), 250); }; c.oncontextmenu = e => { e.preventDefault(); WM.winMenu(w, e.clientX, e.clientY); }; });
    $$('.tv-desk[data-d]', el).forEach(d => { d.onclick = e => { if (e.target.closest('.dx')) { WM.removeDesk(+d.dataset.d); return this.show(); } WM.switchDesk(+d.dataset.d); this.show(); }; });
    $('[data-add]', el)?.addEventListener('click', () => { WM.addDesk(); WM.switchDesk(WM.desks.length - 1); this.show(); });
  },
  close() { this.open = false; $('#taskview').classList.remove('open'); }
};

/* ---------- Spotlight search ---------- */
const SETTINGS_PAGES = [['display', 'Display', 'brightness night light scale'], ['sound', 'Sound', 'volume audio'], ['personal', 'Personalization', 'theme accent wallpaper dark light taskbar'], ['accounts', 'Accounts', 'password user avatar name'], ['time', 'Time & language', 'clock 24 hour seconds city'], ['notifs', 'Notifications', 'focus dnd'], ['power', 'Power & battery', 'screensaver sleep battery'], ['storage', 'Storage', 'disk space'], ['privacy', 'Privacy & security', 'location diagnostics'], ['apps', 'Apps', 'uninstall startup default'], ['access', 'Accessibility', 'motion animation text size'], ['update', 'RestaurantOS Update', 'update upgrade version'], ['about', 'About', 'system specs device name version']];
const Spot = {
  idx: 0, res: [],
  open() {
    Fly.close(); const el = $('#spot');
    el.innerHTML = `<div class="spot-box glass"><div class="spot-in">${svg('search')}<input id="spQ" placeholder="Search apps, files, settings, or type a calculation" autocomplete="off" aria-label="Search"></div><div class="spot-res" id="spR"></div></div>`;
    el.classList.add('open'); const q = $('#spQ'); setTimeout(() => q.focus(), 30);
    q.oninput = () => this.search(q.value);
    q.onkeydown = e => {
      if (e.key === 'ArrowDown') { this.idx = Math.min(this.res.length - 1, this.idx + 1); this.hl(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { this.idx = Math.max(0, this.idx - 1); this.hl(); e.preventDefault(); }
      else if (e.key === 'Enter') { const r = this.res[this.idx]; if (r) { this.close(); r.run(); } }
      else if (e.key === 'Escape') this.close();
      e.stopPropagation();
    };
    el.onpointerdown = e => { if (e.target === el) this.close(); };
    this.search('');
  },
  close() { $('#spot').classList.remove('open'); },
  search(q) {
    q = q.trim(); const ql = q.toLowerCase(); const R = [];
    if (!q) { installedApps().slice(0, 6).forEach(a => R.push({ g: 'Suggested', icon: appIcon(a.id), t: a.name, s: a.desc || a.cat, run: () => WM.open(a.id) })); }
    else {
      if (/^[\d\s+\-*/().%^]+$/.test(q) && /\d/.test(q) && /[+\-*/%^]/.test(q)) { try { const v = Function('"use strict";return (' + q.replace(/\^/g, '**') + ')')(); if (isFinite(v)) R.push({ g: 'Calculator', icon: appIcon('calc'), t: '= ' + (+v.toFixed(10)), s: q + ' · press Enter to copy', run: () => navigator.clipboard?.writeText(String(v)).catch(() => { }) }); } catch (e) { } }
      installedApps().filter(a => (a.name + ' ' + (a.kw || '') + ' ' + a.cat).toLowerCase().includes(ql)).forEach(a => R.push({ g: 'Apps', icon: appIcon(a.id), t: a.name, s: a.desc || a.cat, run: () => WM.open(a.id) }));
      Object.values(APPS).filter(a => appVisible(a) && !isInstalled(a.id) && a.name.toLowerCase().includes(ql)).forEach(a => R.push({ g: 'Get from RestoStore', icon: appIcon(a.id), t: a.name, s: 'Not installed · open RestoStore', run: () => WM.open('store', { q: a.name }) }));
      SETTINGS_PAGES.filter(([, n, kw]) => (n + ' ' + kw).toLowerCase().includes(ql)).forEach(([p, n]) => R.push({ g: 'Settings', icon: appIcon('settings'), t: n, s: 'Settings', run: () => WM.open('settings', { page: p }) }));
      FS.walk('/').filter(f => f.name.toLowerCase().includes(ql)).slice(0, 8).forEach(f => R.push({ g: 'Files', icon: fileIcon(f.name, f.dir), t: f.name, s: f.path, run: () => openPath(f.path) }));
      const cmds = [['Lock', lockScreen, 'lock'], ['Sleep', sleepPC, 'moon'], ['Restart', () => restart(), 'restart'], ['Shut down', powerOff, 'power'], ['Dark mode', () => { S.theme = 'dark'; applySettings(); }, 'contrast'], ['Light mode', () => { S.theme = 'light'; applySettings(); }, 'sun'], ['Next wallpaper', nextWallpaper, 'image'], ['Show desktop', () => WM.showDesktop(), 'display'], ['Empty Recycle Bin', emptyTrash, 'trash'], ['Task view', () => TaskView.show(), 'taskview']];
      cmds.filter(([n]) => n.toLowerCase().includes(ql)).forEach(([n, f, ic]) => R.push({ g: 'Actions', icon: `<div class="ai" style="background:linear-gradient(150deg,#4b5563,#1f2937)">${svg(ic)}</div>`, t: n, s: 'System action', run: f }));
      R.push({ g: 'Web', icon: appIcon('browser'), t: `Search the web for "${q}"`, s: 'Resto Browser', run: () => WM.open('browser', { q }) });
    }
    this.res = R; this.idx = 0; let lastG = '';
    $('#spR').innerHTML = R.map((r, i) => { const g = r.g !== lastG ? `<div class="grp">${esc(r.g)}</div>` : ''; lastG = r.g; return g + `<button class="sm-row" data-i="${i}">${r.icon}<div style="min-width:0"><div>${esc(r.t)}</div><small>${esc(r.s)}</small></div></button>`; }).join('');
    $$('#spR [data-i]').forEach(b => { b.onclick = () => { this.close(); R[+b.dataset.i].run(); }; b.onmouseenter = () => { this.idx = +b.dataset.i; this.hl(); }; });
    this.hl();
  },
  hl() { $$('#spR [data-i]').forEach(b => b.classList.toggle('kb', +b.dataset.i === this.idx)); $(`#spR [data-i="${this.idx}"]`)?.scrollIntoView({ block: 'nearest' }); }
};

/* ---------- Alt+` window switcher ---------- */
const Switcher = {
  on: false, idx: 0, list: [],
  step() {
    if (!this.on) { this.list = WM.wins.filter(w => w.desk === WM.desk).sort((a, b) => (a.min - b.min) || (+b.el.style.zIndex - +a.el.style.zIndex)); if (!this.list.length) return; this.on = true; this.idx = 0; }
    this.idx = (this.idx + 1) % this.list.length;
    const el = $('#switcher'); el.innerHTML = this.list.map((w, i) => `<div class="sw-item ${i === this.idx ? 'on' : ''}">${appIcon(w.app.id)}<span>${esc(w.title)}</span></div>`).join(''); el.classList.add('open');
  },
  commit() { if (!this.on) return; this.on = false; $('#switcher').classList.remove('open'); const w = this.list[this.idx]; if (w) WM.focus(w); }
};

/* =====================================================================
   SETTINGS APPLY / POWER / SCREENSAVER
   ===================================================================== */
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
darkMQ.addEventListener?.('change', () => S.theme === 'auto' && applySettings());
function applySettings() {
  const os = $('#os');
  os.dataset.mode = S.theme === 'auto' ? (darkMQ.matches ? 'dark' : 'light') : S.theme;
  os.classList.toggle('no-glass', !S.glass); os.classList.toggle('no-anim', !S.anim); os.classList.toggle('tb-left', S.tbAlign === 'left');
  applyAccent(S.accent);
  const R = document.documentElement.style; R.setProperty('--radius', S.radius + 'px'); R.setProperty('--speed', S.anim ? 1 : .01);
  os.style.setProperty('--fs', S.fontScale / 100); os.style.setProperty('--is', S.iconSize / 100);
  $('#nightLight').style.opacity = S.night ? .2 : 0; $('#dim').style.opacity = ((100 - S.brightness) / 100 * .85).toFixed(2);
  Wall.apply(); Snd.upd(); saveS(); Taskbar.tray(); Bus.emit('settings');
}
let shellBuilt = false;
function enterDesktop(fromBoot) {
  show('os'); applySettings();
  if (!shellBuilt) { shellBuilt = true; Taskbar.build(); Desk.initBg(); Bus.on('fs', () => Desk.render()); }
  Desk.render(); Taskbar.render(); Taskbar.clock(); Taskbar.badge(); Taskbar.tray();
  const os = $('#os'); os.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
  $('#taskbar').animate([{ transform: 'translateY(60px)' }, { transform: 'none' }], { duration: 600, delay: 200, easing: 'cubic-bezier(.2,.9,.25,1.1)', fill: 'backwards' });
  $$('.dicon').forEach((d, i) => d.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 300 + i * 40, fill: 'backwards' }));
  if (fromBoot) {
    setTimeout(() => Snd.play('startup'), 200);
    if (fromBoot === true && !Store.get('welcomed', false)) { Store.set('welcomed', true); setTimeout(() => { WM.open('tips'); notify('Welcome to RestaurantOS, ' + S.user + '!', 'Your PC is ready. Open Tips to learn the shortcuts.', 'tips'); }, 1300); }
    else setTimeout(() => notify('Good ' + greet() + ', ' + S.user, `It's ${Weather.now().temp}° and ${Weather.now().cond.toLowerCase()} in ${S.city}.`, 'weather'), 1500);
    S.startupApps.filter(isInstalled).forEach((id, i) => setTimeout(() => WM.open(id), 900 + i * 300));
  }
}
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'; };
function lockScreen() { Fly.close(); TaskView.close(); Spot.close(); showLock(false); }
function signOut() { WM.closeAll(); Taskbar.render(); showLock(false); }
function sleepPC() { Fly.close(); show('sleep'); $('#sleep').onclick = wake; }
function wake() { if (STAGE !== 'sleep') return; if (S.pass && S.lockOnWake) showLock(false); else enterDesktop(false); }
async function shutdownScreen(msg) {
  Fly.close(); TaskView.close(); Spot.close(); Ctx.hide();
  show('shutdown'); $('#shutdown').innerHTML = `<div class="sd"><div class="finish-ring" style="width:44px;height:44px;border-color:rgba(255,255,255,.1);border-top-color:#fff"></div><div>${msg}</div></div>`;
  Snd.play('shutdown'); FS.save?.(); saveS();
  await sleep(2600); WM.closeAll(); return;
}
async function restart(toBios) { if (STAGE === 'os' || STAGE === 'lock') await shutdownScreen('Restarting'); show('power'); await sleep(500); runPOST(); if (toBios) postState.setup = true; }
async function powerOff() { if (STAGE === 'os' || STAGE === 'lock') await shutdownScreen('Shutting down'); show('power'); $('#pwLed').classList.remove('on'); }
async function bsod(code = 'CRITICAL_PROCESS_DIED') {
  WM.closeAll(); Fly.close(); show('bsod'); Snd.play('error');
  const el = $('#bsod');
  el.innerHTML = `<div class="face">:(</div><h2>RestaurantOS ran into a problem and needs to restart. We're collecting some error info, and then we'll restart for you.</h2><div><span id="bsP">0</span>% complete</div><div class="qr"><i></i><div>For more information about this issue and possible fixes, visit restaurantos.dev/stopcode<br><br>If you call a support person, give them this info:<br>Stop code: ${esc(code)}</div></div>`;
  for (let i = 0; i <= 100; i += Math.ceil(Math.random() * 12)) { $('#bsP').textContent = Math.min(100, i); await sleep(300); }
  $('#bsP').textContent = 100; await sleep(800); show('power'); await sleep(400); runPOST();
}

/* Screensaver */
let lastInput = Date.now(), ssOn = false, ssRaf = 0;
function markInput() { lastInput = Date.now(); if (ssOn) stopSS(); }
['pointermove', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, markInput, { passive: true }));
setInterval(() => { if (STAGE === 'os' && S.screensaver > 0 && !ssOn && Date.now() - lastInput > S.screensaver * 60000) startSS(); }, 4000);
function startSS(style = S.ssStyle) {
  ssOn = true; const box = $('#screensaver'); box.classList.add('on'); const c = $('#ssCanvas'), x = c.getContext('2d'); let t = 0;
  const stars = Array.from({ length: 400 }, () => ({ x: rand(-1, 1), y: rand(-1, 1), z: Math.random() }));
  let bx = 100, by = 100, vx = 1.6, vy = 1.2;
  const f = () => {
    if (!ssOn) return; ssRaf = requestAnimationFrame(f);
    const W = c.width = innerWidth, H = c.height = innerHeight; t += .01;
    if (style === 'stars') {
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      for (const s of stars) { s.z -= .006; if (s.z <= .01) { s.z = 1; s.x = rand(-1, 1); s.y = rand(-1, 1); } const px = W / 2 + s.x / s.z * W * .3, py = H / 2 + s.y / s.z * H * .3, r = (1 - s.z) * 2.5; x.fillStyle = `rgba(255,255,255,${1 - s.z})`; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
    } else if (style === 'clock') {
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      x.font = `600 ${Math.min(120, W / 8)}px Unbounded, sans-serif`; const txt = fmtTime(new Date(), false); const tw = x.measureText(txt).width;
      bx += vx; by += vy; if (bx < 0 || bx + tw > W) vx *= -1; if (by < 100 || by > H - 20) vy *= -1;
      const g = x.createLinearGradient(bx, 0, bx + tw, 0); g.addColorStop(0, getComputedStyle(document.documentElement).getPropertyValue('--accent')); g.addColorStop(1, '#2ec4b6');
      x.fillStyle = g; x.fillText(txt, bx, by); x.font = '20px Outfit, sans-serif'; x.fillStyle = '#888'; x.fillText(fmtDate(), bx, by + 40);
    } else {
      x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) { x.beginPath(); x.strokeStyle = `hsla(${(t * 40 + i * 50) % 360},80%,60%,.5)`; x.lineWidth = 2; for (let px = 0; px <= W; px += 10) { const py = H / 2 + Math.sin(px * .004 + t * (1 + i * .2) + i) * H * .25 * Math.sin(t * .3 + i); px ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
    }
  };
  f();
}
function stopSS() { ssOn = false; cancelAnimationFrame(ssRaf); $('#screensaver').classList.remove('on'); if (S.pass && S.lockOnWake && STAGE === 'os') lockScreen(); }

/* =====================================================================
   KEYBOARD
   ===================================================================== */
let metaAlone = false;
document.addEventListener('keydown', e => {
  lastInput = Date.now();
  if (ssOn) { stopSS(); e.preventDefault(); return; }
  if (STAGE === 'bios') {
    if (e.key === 'Delete' || e.key === 'F2') { postState.setup = true; e.preventDefault(); }
    else if (e.key === 'F12') { postState.menu = true; e.preventDefault(); }
    else if (e.key === 'Escape') postState.skip = true;
    return;
  }
  if (STAGE === 'biosSetup') return biosKey(e);
  if (STAGE === 'bootMenu') return bootMenuKey(e);
  if (STAGE === 'power' && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== $('#powerBtn')) { powerOn(); return; }
  if (STAGE === 'lock') { if (!$('#lock').classList.contains('auth')) { lockReveal?.(); e.preventDefault(); } return; }
  if (STAGE === 'sleep') { wake(); return; }
  if (STAGE !== 'os') return;
  metaAlone = e.key === 'Meta';
  const A = WM.active, k = e.code;
  if ((e.ctrlKey && k === 'KeyK') || (e.ctrlKey && k === 'Space')) { e.preventDefault(); $('#spot').classList.contains('open') ? Spot.close() : Spot.open(); return; }
  if (e.key === 'Escape') { if (Ctx.el) Ctx.hide(); else if ($('#spot').classList.contains('open')) Spot.close(); else if (TaskView.open) TaskView.close(); else if (Fly.open) Fly.close(); return; }
  if (e.altKey && !e.ctrlKey) {
    const map = {
      KeyT: () => WM.open('terminal'), KeyE: () => WM.open('files'), KeyI: () => WM.open('settings'), KeyB: () => WM.open('browser'),
      KeyN: () => Fly.toggle('notifPanel'), KeyA: () => Fly.toggle('quick'), KeyS: () => Fly.toggle('startMenu'), KeyG: () => Fly.toggle('widgets'),
      KeyW: () => A && WM.close(A), KeyM: () => A && WM.minimize(A), KeyD: () => WM.showDesktop(), KeyL: () => lockScreen(), KeyV: () => TaskView.toggle(),
      ArrowUp: () => A && !A.max && WM.toggleMax(A), ArrowDown: () => A && (A.max ? WM.toggleMax(A) : WM.minimize(A)), ArrowLeft: () => A && WM.snap(A, 'left'), ArrowRight: () => A && WM.snap(A, 'right'),
      Backquote: () => Switcher.step(), Digit1: () => WM.switchDesk(0), Digit2: () => WM.switchDesk(1), Digit3: () => WM.switchDesk(2), Digit4: () => WM.switchDesk(3)
    };
    if (map[k]) { e.preventDefault(); map[k](); return; }
  }
  if (e.key === 'Delete' && !e.target.closest('input,textarea,[contenteditable]') && Desk.sel.size && !A) Desk.deleteSel();
  if (e.key === 'F2' && !e.target.closest('input,textarea') && Desk.sel.size === 1 && !A) { const k1 = [...Desk.sel][0]; if (k1.startsWith('fs:')) renamePath(k1.slice(3)); }
  if (e.key === 'F5' && !A) { e.preventDefault(); Desk.render(); }
  if (Fly.open === 'startMenu' && e.key.length === 1 && document.activeElement !== $('#smQ')) $('#smQ')?.focus();
});
document.addEventListener('keyup', e => {
  if (e.key === 'Alt') Switcher.commit();
  if (e.key === 'Meta' && metaAlone && STAGE === 'os') Fly.toggle('startMenu');
});
addEventListener('blur', () => Switcher.commit());

/* Clock tick */
setInterval(() => { Taskbar.clock(); if (Fly.open === 'widgets' && $('#wgTime')) $('#wgTime').textContent = fmtTime(new Date(), false); Bus.emit('tick'); }, 1000);
Bus.on('batt', () => { Taskbar.tray(); if ($('#lkBat')) $('#lkBat').textContent = Batt.level + '%'; if (Batt.level === 15 && !Batt.charging && STAGE === 'os') notify('Battery low', '15% remaining. Plug in your PC or turn on Battery saver.', 'settings'); });
addEventListener('online', () => Taskbar.tray()); addEventListener('offline', () => Taskbar.tray());
addEventListener('beforeunload', () => { saveS(); });
applyAccent(S.accent);
