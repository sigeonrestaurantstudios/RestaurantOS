/* =====================================================================
   RestaurantOS 2.0 — update flow, full-screen updater, 2.0 boot,
   and every 2.0 feature (gated by IS2()).
   ===================================================================== */
const V2DEF = { tbStyle: 'bar', magnify: false, hotTL: 'taskview', hotTR: 'none', hotBL: 'none', hotBR: 'none', sndTheme: 'Classic', cfilter: 'none', wpSlide: 0, dwidgets: [] };
for (const k in V2DEF) if (!(k in S)) S[k] = JSON.parse(JSON.stringify(V2DEF[k]));
const V2_APPS = ['whatsnew', 'sheets', 'mail', 'recipes', 'focus', 'orderup', 'blocks'];

const V2_FEATURES = [
  ['rocket', 'New boot animation', 'A cloche lifts off the plate to serve the new logo every time you start up.', null],
  ['tips', "What's New", 'This tour of everything that changed in 2.0.', null],
  ['max', 'Snap Layouts', 'Hover over any maximize button to pick a layout: halves, thirds or quarters.', () => { const w = WM.open('notepad'); setTimeout(() => w && showSnapFly(w), 400); }],
  ['bolt', 'Live Activities', 'A pill at the top of the screen shows music, timers and focus sessions.', () => WM.open('focus')],
  ['copy', 'Clipboard history', 'Press Ctrl+Shift+V to see everything you copied and paste it again.', () => ClipPanel.toggle()],
  ['heart', 'Emoji panel', 'Press Alt+. in any text field to insert emoji.', () => EmojiPanel.toggle()],
  ['display', 'Hot corners', 'Push the pointer into a screen corner to open Task view and more.', () => WM.open('settings', { page: 'personal' })],
  ['widgets', 'Desktop widgets', 'Pin clocks, weather, notes and more right onto your desktop.', () => WidgetPicker()],
  ['apps', 'Floating dock', 'Turn the taskbar into a floating dock with icon magnification.', () => { S.tbStyle = 'dock'; S.magnify = true; applySettings(); }],
  ['vol', 'Sound themes', 'Classic, Soft, Retro 8-bit and Kitchen sound packs.', () => WM.open('settings', { page: 'sound' })],
  ['image', 'Dynamic wallpapers', 'New Bistro and Neon Diner wallpapers, a time-of-day wallpaper and slideshows.', () => { S.wallpaper = 'dynamic'; applySettings(); }],
  ['terminal', 'Run dialog', 'Press Alt+R to open any app, file or address by name.', () => RunDlg()],
  ['clock', 'Focus Sessions', 'Timed focus blocks that silence notifications and track your streak.', () => WM.open('focus')],
  ['grid', 'Sheets', 'A spreadsheet with formulas, CSV files and charts.', () => WM.open('sheets')],
  ['send', 'Mail', 'A local mailbox with folders, stars, replies and compose.', () => WM.open('mail')],
  ['notes', 'Recipe Book', 'Recipes that scale by servings, with built-in cooking timers.', () => WM.open('recipes')],
  ['game', 'Order Up!', 'Run the grill: build burgers to order before customers lose patience.', () => WM.open('orderup')],
  ['brick', 'Blocks', 'Falling-block puzzle with ghost pieces and levels.', () => WM.open('blocks')],
  ['contrast', 'Color filters', 'Grayscale, inverted, high-contrast and warm filters in Accessibility.', () => WM.open('settings', { page: 'access' })],
  ['save', 'Backup & restore', 'Export your settings and files as a backup and restore them any time.', () => WM.open('settings', { page: 'storage' })]
];

/* ---------- gating helpers (override core definitions) ---------- */
const appVisible = a => !a.hidden && (!a.v2 || IS2());
installedApps = () => Object.values(APPS).filter(a => appVisible(a) && (a.core || S.installed.includes(a.id))).sort((a, b) => a.name.localeCompare(b.name));
isInstalled = id => !!APPS[id] && appVisible(APPS[id]) && (APPS[id].core || S.installed.includes(id));
WM.area = function () { return { w: innerWidth, h: innerHeight - (IS2() && S.tbStyle === 'dock' ? 74 : 56) }; };

/* =====================================================================
   SETTINGS › RESTAURANTOS UPDATES
   ===================================================================== */
function updThumb(big) {
  return `<div class="up-thumb ${big ? 'big' : ''}"><div class="ut-wall"></div><div class="ut-pill"><i></i>Now playing · Ember Drift</div><div class="ut-win"><b></b><span></span><span></span></div><div class="ut-win two"><b></b><span></span></div><div class="ut-logo">${NLOGO}</div><div class="ut-ver">2.0</div><div class="ut-dock"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`;
}
function updatePageHTML() {
  const hist = Store.get('updHist', ['RestaurantOS 1.0 (Build 26.10) — installed']);
  const histHtml = `<div class="h2">Update history</div><div class="card" style="font-size:13px;line-height:1.8">${hist.map(x => '• ' + esc(x)).join('<br>')}</div>`;
  if (IS2()) return `<div class="h1">RestaurantOS Updates</div>
    <div class="up-card">${updThumb()}<div class="up-info"><span class="chip good">Installed</span><h2>RestaurantOS 2.0</h2><div class="muted" style="font-size:13px">Build 26.11 "Bistro" · You're up to date</div><p>You're running the latest version of RestaurantOS. Last checked: ${esc(Store.get('lastUpd', 'just now'))}.</p><div class="row"><button class="btn primary" id="upNew">${svg('tips')} See what's new</button><button class="btn" id="upChk">Check for updates</button></div><div class="muted" id="upMsg" style="font-size:12px"></div></div></div>${histHtml}`;
  return `<div class="h1">RestaurantOS Updates</div>
    <div class="up-card">${updThumb()}<div class="up-info"><span class="chip warn">Feature update available</span><h2>RestaurantOS 2.0</h2><div class="muted" style="font-size:13px">Build 26.11 "Bistro" · 2.4 GB · Released November 2026</div>
      <p>The biggest RestaurantOS update yet. A new boot animation, Snap Layouts, Live Activities, desktop widgets, a floating dock, clipboard history and an emoji panel, plus seven new apps and games: Sheets, Mail, Recipe Book, Focus Sessions, Order Up!, Blocks and What's New.</p>
      <div class="row"><button class="btn primary" id="up2">${svg('download')} Download and install</button><span class="muted" style="font-size:12px">Your PC will shut down to install. Takes about 5 minutes.</span></div></div></div>
    <div class="h2">What's in RestaurantOS 2.0</div><div class="up-feats">${V2_FEATURES.map(([ic, t, d]) => `<div class="up-feat"><span>${svg(ic)}</span><div><b>${t}</b><small>${d}</small></div></div>`).join('')}</div>${histHtml}`;
}
function wireUpdatePage(main, render) {
  $('#up2', main)?.addEventListener('click', async () => {
    const ok = await UI.confirm('Install RestaurantOS 2.0?', 'Your PC will shut down to install the update. It takes about 5 minutes and restarts on its own. Open windows will close, so save your work first.', 'Shut down and update');
    if (ok) startUpdate();
  });
  $('#upNew', main)?.addEventListener('click', () => WM.open('whatsnew'));
  $('#upChk', main)?.addEventListener('click', async () => { const m = $('#upMsg', main); m.textContent = 'Checking for updates…'; await sleep(1400); Store.set('lastUpd', new Date().toLocaleString()); m.textContent = "You're up to date. RestaurantOS 2.0 is the latest version."; });
}

/* =====================================================================
   FULL-SCREEN UPDATER (5 minutes)
   ===================================================================== */
const UPD_DUR = 300000;
const UPD_KEYS = [[0, 0], [.05, 3], [.16, 15], [.22, 19], [.38, 42], [.45, 44], [.57, 58], [.60, 60], [.64, 60], [.66, 62], [.80, 81], [.86, 87], [.93, 93], [.97, 98], [1, 100]];
const UPD_TASKS = [[0, 'Preparing your PC for RestaurantOS 2.0'], [3, 'Checking free space on RestoDrive (C:)'], [6, 'Backing up your settings'], [10, 'Installing the new compositor'], [14, 'Installing Snap Layouts'], [18, 'Installing Live Activities'], [22, 'Installing the new boot animation'], [26, 'Installing Sheets'], [30, 'Installing Mail'], [34, 'Installing Recipe Book'], [38, 'Installing Focus Sessions'], [42, 'Installing Order Up! and Blocks'], [46, 'Updating RestoStore'], [50, 'Updating driver: RestoForce RTX 9090'], [54, 'Updating driver: RestoDrive NVMe controller'], [58, 'Preparing to restart'], [61, 'Migrating your files'], [66, 'Configuring desktop widgets'], [71, 'Configuring hot corners'], [75, 'Setting up clipboard history and the emoji panel'], [79, 'Applying sound themes'], [83, 'Optimizing apps for 2.0'], [88, 'Rebuilding the search index'], [91, 'Cleaning up temporary files'], [95, 'Finishing up'], [99, 'Almost done']];
function updProgress(t) { for (let i = 0; i < UPD_KEYS.length - 1; i++) { const [t0, p0] = UPD_KEYS[i], [t1, p1] = UPD_KEYS[i + 1]; if (t <= t1) return p0 + (p1 - p0) * ((t - t0) / (t1 - t0 || 1)); } return 100; }
let UPD = null;
async function startUpdate() {
  Store.set('updating', { elapsed: 0 });
  await shutdownScreen('Shutting down to install updates');
  updaterScreen();
}
function updaterScreen() {
  let el = $('#updater'); if (!el) { el = html('<section id="updater" class="stage"></section>'); document.body.insertBefore(el, $('#overlays')); }
  show('updater');
  const st = Store.get('updating', { elapsed: 0 });
  UPD = { elapsed: st.elapsed || 0, speed: 1, last: performance.now(), task: -1, log: [], restartShown: false, saveT: 0 };
  el.innerHTML = `<canvas class="upd-bg"></canvas><div class="upd-center">
      <div class="upd-ring"><svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="96" class="trk"/><circle cx="110" cy="110" r="96" class="bar" id="updBar"/></svg><div class="upd-pct"><span id="updPct">0</span><small>%</small></div></div>
      <h1 id="updTitle">Working on updates</h1><p class="upd-sub">Don't turn off your PC. This will take a while.</p>
      <div class="upd-steps">${['Installing features', 'Configuring RestaurantOS 2.0', 'Finishing up'].map((s, i) => `<div class="upd-step" data-s="${i}"><i>${i + 1}</i><span>${s}</span></div>`).join('<b class="upd-line"></b>')}</div>
      <div class="upd-task"><span class="dot"></span><span id="updTask"></span></div>
      <div class="upd-meta"><span id="updEta"></span><span>·</span><span id="updEl"></span></div></div>
    <div class="upd-brand"><div style="width:30px">${NLOGO}</div><div><b>RestaurantOS 2.0</b><small>Build 26.11 "Bistro"</small></div></div>
    <button class="upd-det" id="updDet">Show details</button><div class="upd-log" id="updLog" hidden></div><div class="upd-ff" id="updFF" hidden>Fast-forward ×40</div>
    <div class="upd-restart" id="updRestart" hidden><div style="width:64px">${NLOGO}</div><div class="boot-loader" style="opacity:1;animation:none"><i></i><i></i><i></i><i></i><i></i></div><div>Restarting · stage 2 of 3</div></div>`;
  $('#updDet').onclick = () => { const l = $('#updLog'); l.hidden = !l.hidden; $('#updDet').textContent = l.hidden ? 'Show details' : 'Hide details'; };
  updBg($('.upd-bg', el));
  clearInterval(UPD.iv); UPD.iv = setInterval(updTick, 200); updTick();
}
function updBg(c) {
  const x = c.getContext('2d'); const blobs = Array.from({ length: 4 }, (_, i) => ({ a: Math.random() * 6, r: .3 + i * .08, s: .0006 + i * .0002 }));
  const f = () => {
    if (STAGE !== 'updater') return; requestAnimationFrame(f);
    c.width = innerWidth / 3; c.height = innerHeight / 3; x.fillStyle = '#06080b'; x.fillRect(0, 0, c.width, c.height);
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff7a45';
    blobs.forEach((b, i) => { b.a += b.s * (UPD ? Math.min(UPD.speed, 4) : 1) * 6; const cx = c.width * (.5 + Math.cos(b.a + i) * .35), cy = c.height * (.5 + Math.sin(b.a * 1.3 + i) * .35); const g = x.createRadialGradient(cx, cy, 0, cx, cy, c.width * b.r); g.addColorStop(0, (i % 2 ? '#2ec4b6' : acc) + '33'); g.addColorStop(1, '#00000000'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); });
  }; f();
}
function updTick() {
  if (STAGE !== 'updater' || !UPD) return;
  const now = performance.now(); UPD.elapsed += (now - UPD.last) * UPD.speed; UPD.last = now;
  const t = Math.min(1, UPD.elapsed / UPD_DUR); const p = updProgress(t);
  if ((UPD.saveT += 1) % 10 === 0) Store.set('updating', { elapsed: UPD.elapsed });
  // mid-update restart (between 60% and 64% of the time)
  const restarting = t >= .60 && t < .64; $('#updRestart').hidden = !restarting;
  if (restarting && !UPD.restartShown) { UPD.restartShown = true; Snd.play('beep'); }
  const pi = Math.floor(p);
  $('#updPct').textContent = pi; $('#updBar').style.strokeDashoffset = 603 * (1 - p / 100);
  const stage = p < 60 ? 0 : p < 90 ? 1 : 2;
  $$('.upd-step').forEach((s, i) => { s.classList.toggle('on', i === stage); s.classList.toggle('done', i < stage); });
  $('#updTitle').textContent = p >= 100 ? 'Restarting' : `Working on updates`;
  let ti = 0; UPD_TASKS.forEach(([at], i) => { if (p >= at) ti = i; });
  let task = UPD_TASKS[ti][1];
  if (task === 'Migrating your files') task += ` (${Math.min(48, Math.max(1, Math.round((p - 61) / 5 * 48)))} of 48)`;
  $('#updTask').textContent = task;
  if (ti !== UPD.task) { UPD.task = ti; UPD.log.push(`[${new Date().toLocaleTimeString(LOCALE, { hour12: false })}] ${UPD_TASKS[ti][1]}`); $('#updLog').innerHTML = UPD.log.map(l => `<div>${esc(l)}</div>`).join(''); $('#updLog').scrollTop = 1e6; }
  const left = Math.max(0, (UPD_DUR - UPD.elapsed) / 1000 / UPD.speed);
  $('#updEta').textContent = p >= 100 ? 'Done' : left > 90 ? `About ${Math.ceil(left / 60)} minutes left` : left > 45 ? 'About a minute left' : 'Less than a minute left';
  const es = Math.floor(UPD.elapsed / 1000); $('#updEl').textContent = `Elapsed ${Math.floor(es / 60)}:${String(es % 60).padStart(2, '0')}`;
  $('#updFF').hidden = UPD.speed === 1;
  if (t >= 1) finishUpdate();
}
async function finishUpdate() {
  clearInterval(UPD.iv); UPD = null;
  Store.set('version', 2); Store.del('updating'); Store.set('justUpdated', true);
  const hist = Store.get('updHist', ['RestaurantOS 1.0 (Build 26.10) — installed']); hist.unshift('RestaurantOS 2.0 (Build 26.11 "Bistro") — installed ' + new Date().toLocaleDateString()); Store.set('updHist', hist);
  V2_APPS.forEach(id => { if (!S.startPinned.includes(id)) S.startPinned.push(id); });
  if (S.wallpaper === 'ember') S.wallpaper = 'bistro';
  saveS(); Store.set('lastUpd', new Date().toLocaleString());
  Snd.play('success'); await sleep(2200);
  show('power'); await sleep(600); runPOST();
}
document.addEventListener('keydown', e => {
  if (STAGE === 'updater') { if (e.ctrlKey && e.shiftKey && e.code === 'KeyF' && UPD) { UPD.speed = UPD.speed === 1 ? 40 : 1; } e.preventDefault(); e.stopImmediatePropagation(); }
}, true);

/* ---------- 2.0 boot splash + post-update welcome ---------- */
function bootV2Markup() {
  return `<svg class="b2" viewBox="0 0 200 170"><defs><linearGradient id="b2g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9c2"/><stop offset=".55" stop-color="#ff7a45"/><stop offset="1" stop-color="#c2410c"/></linearGradient><linearGradient id="b2c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f5f7"/><stop offset="1" stop-color="#8d99a4"/></linearGradient></defs>
    <ellipse class="b2-shadow" cx="100" cy="142" rx="70" ry="9"/><ellipse class="b2-plate" cx="100" cy="136" rx="78" ry="11"/>
    <g class="b2-logo"><rect x="70" y="72" width="60" height="60" rx="17" fill="url(#b2g)"/><path d="M89 120V84h14a10 10 0 0 1 0 20H89 M101 104l12 16" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="b2-steam"><path d="M84 66c-6-8 6-12 0-22"/><path d="M100 62c-6-8 6-12 0-24"/><path d="M116 66c-6-8 6-12 0-22"/></g>
    <g class="b2-cloche"><path d="M38 132a62 62 0 0 1 124 0z" fill="url(#b2c)"/><path d="M52 112a50 50 0 0 1 30-34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/><rect x="92" y="62" width="16" height="10" rx="4" fill="#cfd6dc"/><circle cx="100" cy="60" r="7" fill="#e9eef3"/><rect x="30" y="130" width="140" height="6" rx="3" fill="#aab4bd"/></g></svg>
    <div style="display:grid;gap:10px;justify-items:center"><div class="boot-word" style="animation-delay:2s">Restaurant<b>OS</b></div><div class="boot-sub" style="animation-delay:2.3s">2.0 · Bistro</div></div>
    <div class="boot-loader" style="animation-delay:2.5s"><i></i><i></i><i></i><i></i><i></i></div><div class="boot-msg" id="bootMsg"></div>`;
}
async function postUpdateHello() {
  Store.del('justUpdated'); Store.set('showWhatsNew', true);
  let el = $('#hello2'); if (!el) { el = html('<section id="hello2" class="stage"></section>'); document.body.insertBefore(el, $('#overlays')); }
  show('hello2');
  const msgs = [`Hi, ${esc(S.user || 'there')}.`, "We've updated your PC.", 'All your files are exactly where you left them.', 'Getting a few new things ready for you…', `Welcome to Restaurant<b>OS</b> 2.0`];
  el.innerHTML = `<div class="h2-msg" id="h2m"></div><div class="h2-sub">Don't turn off your PC</div>`;
  for (let i = 0; i < msgs.length; i++) {
    const m = $('#h2m'); m.classList.remove('in'); await sleep(500); m.innerHTML = msgs[i]; m.classList.add('in');
    el.style.setProperty('--hue', (i * 40) + 'deg'); await sleep(i === msgs.length - 1 ? 2600 : 2200);
  }
  showLock(true);
}

/* =====================================================================
   APPLYING 2.0 TO THE SHELL
   ===================================================================== */
const V2WALLS = {
  bistro: { name: 'Bistro', css: 'radial-gradient(ellipse at 75% 20%,#ffd9a0 0%,transparent 28%),radial-gradient(ellipse at 20% 90%,#7a1f3d 0%,transparent 50%),radial-gradient(circle at 50% 120%,#ff7a45 0%,transparent 55%),linear-gradient(165deg,#2b1a14 0%,#5c2a1d 45%,#1a0f0c 100%)' },
  neondiner: { name: 'Neon Diner', css: 'radial-gradient(circle at 25% 30%,#ff2e88 0%,transparent 32%),radial-gradient(circle at 78% 65%,#00e5ff 0%,transparent 30%),repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 2px,transparent 2px 60px),linear-gradient(180deg,#0a0614,#1b0b2e)' },
  dynamic: { name: 'Time of day', get css() { const h = new Date().getHours(); return h < 6 ? 'radial-gradient(ellipse at 50% 110%,#1d2b53,transparent 60%),linear-gradient(#03050c,#0b1325)' : h < 10 ? 'radial-gradient(circle at 30% 75%,#ffd166 0,#ff9a6b 15%,transparent 45%),linear-gradient(180deg,#5b7bd5 0%,#f6a6b2 60%,#ffd3a5 100%)' : h < 17 ? 'radial-gradient(circle at 80% 15%,#fffbe0 0,transparent 25%),linear-gradient(180deg,#2a8fe8 0%,#7cc7ff 60%,#d9f1ff 100%)' : h < 20 ? 'radial-gradient(circle at 50% 80%,#ffd166 0,#ff7a45 15%,transparent 40%),linear-gradient(180deg,#2b1d4f 0%,#8c3a6b 50%,#ff8a5c 100%)' : 'radial-gradient(ellipse at 70% 20%,#3a2b6b,transparent 50%),linear-gradient(#070b1a,#121a33)'; } }
};
let v2Booted = false;
function applyV2Visual() {
  const os = $('#os'); const on = IS2();
  if (on) for (const k in V2WALLS) if (!WALLS[k]) Object.defineProperty(WALLS, k, { value: V2WALLS[k], enumerable: true, configurable: true });
  os.classList.toggle('tb-dock', on && S.tbStyle === 'dock'); os.classList.toggle('magnify', on && S.magnify);
  os.style.filter = on ? ({ none: '', grayscale: 'grayscale(1)', invert: 'invert(1) hue-rotate(180deg)', contrast: 'contrast(1.35) saturate(1.25)', warm: 'sepia(.35) saturate(1.2)' }[S.cfilter] || '') : '';
  document.title = 'RestaurantOS ' + osv(); const h = $('#power h1'); if (h) h.textContent = 'RestaurantOS ' + osv();
  if (on) DWidgets.render(); else $('#dwidgets')?.remove();
  Live.render();
}
const _applySettings = applySettings;
applySettings = function () { _applySettings(); try { applyV2Visual(); } catch (e) { console.error(e); } };
const _enterDesktop = enterDesktop;
enterDesktop = function (fromBoot) {
  _enterDesktop(fromBoot);
  if (!IS2()) return;
  if (!v2Booted) { v2Booted = true; }
  if (Store.get('showWhatsNew', false)) { Store.del('showWhatsNew'); setTimeout(() => { WM.open('whatsnew'); notify('Welcome to RestaurantOS 2.0', '20 new features are ready. Open What\'s New to try them.', 'whatsnew'); }, 1300); }
};
// wallpaper slideshow + dynamic wallpaper refresh
let slideT = Date.now();
setInterval(() => {
  if (STAGE !== 'os' || !IS2()) return;
  if (S.wallpaper === 'dynamic') { Wall.cur = null; Wall.apply(); }
  if (S.wpSlide > 0 && Date.now() - slideT > S.wpSlide * 60000) { slideT = Date.now(); nextWallpaper(); }
}, 30000);

/* ---------- Sound themes ---------- */
const _tone = Snd.tone.bind(Snd), _play = Snd.play.bind(Snd);
Snd.tone = function (f, d = .15, type = 'sine', v = .2, t0 = 0, atk = .006, dest) {
  const th = IS2() ? S.sndTheme : 'Classic';
  if (th === 'Retro') { type = 'square'; v *= .5; f = Math.round(f / 55) * 55 || f; d = Math.min(d, .25); }
  else if (th === 'Soft') { type = 'sine'; f *= .8; v *= .7; d *= 1.35; atk = Math.max(atk, .03); }
  else if (th === 'Kitchen' && type === 'square') type = 'triangle';
  return _tone(f, d, type, v, t0, atk, dest);
};
Snd.play = function (n) {
  if (IS2() && S.sndTheme === 'Kitchen' && this.ctx && S.sound) {
    if (n === 'notify') { _tone(2093, 1.6, 'sine', .12); _tone(4186, 1.0, 'sine', .04); _tone(2637, 1.2, 'sine', .05, .02); return; }
    if (n === 'click') { _tone(900, .02, 'triangle', .06); return; }
    if (n === 'success') { [1568, 2093, 2637].forEach((f, i) => _tone(f, .9, 'sine', .07, i * .1)); return; }
  }
  return _play(n);
};

/* =====================================================================
   LIVE ACTIVITIES
   ===================================================================== */
const Live = {
  items: {}, sig: '',
  set(key, v) { if (v) this.items[key] = v; else delete this.items[key]; this.render(); },
  render() {
    const os = $('#os'); if (!os) return;
    let el = $('#live'); const list = IS2() ? Object.entries(this.items) : [];
    const sig = list.map(([k, v]) => k + v.text + (v.sub || '')).join('|');
    if (!list.length) { el?.classList.remove('show'); this.sig = ''; return; }
    if (!el) { el = html('<div id="live" class="glass"></div>'); os.appendChild(el); }
    if (sig === this.sig) return; this.sig = sig;
    el.innerHTML = list.map(([k, v]) => `<button data-k="${k}"><span class="lv-ic">${svg(v.icon)}</span><span class="lv-t"><b>${esc(v.text)}</b>${v.sub ? `<small>${esc(v.sub)}</small>` : ''}</span>${v.bars ? '<span class="lv-bars"><i></i><i></i><i></i><i></i></span>' : ''}</button>`).join('');
    $$('button', el).forEach(b => b.onclick = () => this.items[b.dataset.k]?.open?.());
    requestAnimationFrame(() => el.classList.add('show'));
  }
};

/* =====================================================================
   SNAP LAYOUTS
   ===================================================================== */
const SNAP_LAYOUTS = [[[0, 0, .5, 1], [.5, 0, .5, 1]], [[0, 0, .66, 1], [.66, 0, .34, 1]], [[0, 0, .333, 1], [.333, 0, .334, 1], [.667, 0, .333, 1]], [[0, 0, .5, 1], [.5, 0, .5, .5], [.5, .5, .5, .5]], [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]], [[0, 0, .25, 1], [.25, 0, .5, 1], [.75, 0, .25, 1]]];
function placeFrac(w, [fx, fy, fw, fh]) {
  const A = WM.area(), el = w.el;
  if (w.max) { w.max = false; el.classList.remove('max'); WM.updMaxBtn(w); } else if (!w.snapped) WM.savePrev(w);
  w.snapped = null; Object.assign(el.style, { left: Math.round(A.w * fx) + 'px', top: Math.round(A.h * fy) + 'px', width: Math.round(A.w * fw) + 'px', height: Math.round(A.h * fh) + 'px' });
  Snd.play('max'); WM.focus(w); setTimeout(() => w.onResize?.(), 280);
}
let snapFlyT = 0;
function showSnapFly(w) {
  $('.snapfly')?.remove(); if (!w || !WM.wins.includes(w)) return;
  const b = w.el.querySelector('.mx').getBoundingClientRect();
  const f = html(`<div class="snapfly glass">${SNAP_LAYOUTS.map((L, li) => `<div class="sl">${L.map((z, zi) => `<i data-l="${li}" data-z="${zi}" style="left:${z[0] * 100}%;top:${z[1] * 100}%;width:${z[2] * 100}%;height:${z[3] * 100}%"></i>`).join('')}</div>`).join('')}</div>`);
  $('#os').appendChild(f);
  const r = f.getBoundingClientRect(); f.style.left = clamp(b.left + b.width / 2 - r.width / 2, 8, innerWidth - r.width - 8) + 'px'; f.style.top = b.bottom + 6 + 'px';
  $$('i', f).forEach(z => z.onclick = () => { placeFrac(w, SNAP_LAYOUTS[+z.dataset.l][+z.dataset.z]); f.remove(); });
  f.onmouseleave = () => { snapFlyT = setTimeout(() => f.remove(), 250); }; f.onmouseenter = () => clearTimeout(snapFlyT);
}
document.addEventListener('mouseover', e => {
  if (!IS2() || STAGE !== 'os') return; const mx = e.target.closest?.('.win .mx'); if (!mx) return;
  const w = WM.wins.find(x => x.el.contains(mx)); clearTimeout(snapFlyT);
  snapFlyT = setTimeout(() => { if (mx.matches(':hover')) showSnapFly(w); }, 450);
  mx.addEventListener('mouseleave', () => { clearTimeout(snapFlyT); snapFlyT = setTimeout(() => { if (!$('.snapfly:hover')) $('.snapfly')?.remove(); }, 300); }, { once: true });
});

/* =====================================================================
   CLIPBOARD HISTORY + EMOJI PANEL + RUN DIALOG
   ===================================================================== */
let CLIPH = Store.get('cliph', []); let LASTFIELD = null;
document.addEventListener('focusin', e => { if (e.target.matches?.('input:not([type=checkbox]):not([type=range]):not([type=color]):not([type=file]),textarea')) LASTFIELD = e.target; });
const recordCopy = () => {
  const a = document.activeElement; let t = '';
  if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.selectionStart != null) t = a.value.slice(a.selectionStart, a.selectionEnd);
  if (!t) t = String(getSelection() || '');
  t = t.trim(); if (!t || !IS2()) return;
  CLIPH = [{ t, at: Date.now(), pin: false }, ...CLIPH.filter(c => c.t !== t)].slice(0, 25); Store.set('cliph', CLIPH);
};
document.addEventListener('copy', recordCopy); document.addEventListener('cut', recordCopy);
function insertText(t) {
  const f = LASTFIELD; if (f && document.contains(f) && !f.disabled) { f.focus(); const s = f.selectionStart ?? f.value.length, e = f.selectionEnd ?? s; f.setRangeText(t, s, e, 'end'); f.dispatchEvent(new Event('input', { bubbles: true })); return true; }
  return false;
}
const panelPos = el => { $('#os').appendChild(el); };
const ClipPanel = {
  toggle() { if ($('#clipPanel')) return $('#clipPanel').remove(); EmojiPanel.close(); this.render(); },
  render() {
    $('#clipPanel')?.remove(); const items = [...CLIPH.filter(c => c.pin), ...CLIPH.filter(c => !c.pin)];
    const el = html(`<div id="clipPanel" class="v2panel glass"><div class="vp-h"><b>Clipboard history</b><button data-clr>Clear all</button></div><div class="vp-list">${items.length ? items.map(c => `<div class="clip-it" data-t="${esc(c.t)}"><div class="ct">${esc(c.t.slice(0, 220))}</div><div class="cm"><small>${new Date(c.at).toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })}</small><button data-pin title="Pin">${c.pin ? '★' : '☆'}</button><button data-del title="Delete">✕</button></div></div>`).join('') : `<div class="np-empty">Copy some text (Ctrl+C) and it shows up here.</div>`}</div><div class="vp-f">Click an item to paste it · Ctrl+Shift+V</div></div>`);
    panelPos(el);
    $$('.clip-it', el).forEach(it => {
      const c = CLIPH.find(x => x.t === it.dataset.t);
      it.onclick = e => { if (e.target.closest('button')) return; navigator.clipboard?.writeText(c.t).catch(() => { }); el.remove(); if (!insertText(c.t)) notify('Copied', 'The text is on your clipboard.', 'settings'); };
      it.querySelector('[data-pin]').onclick = () => { c.pin = !c.pin; Store.set('cliph', CLIPH); this.render(); };
      it.querySelector('[data-del]').onclick = () => { CLIPH = CLIPH.filter(x => x !== c); Store.set('cliph', CLIPH); this.render(); };
    });
    $('[data-clr]', el).onclick = () => { CLIPH = CLIPH.filter(c => c.pin); Store.set('cliph', CLIPH); this.render(); };
  }
};
const EMOJI = {
  'Food': '🍔 🍟 🍕 🌭 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🥞 🧇 🥓 🥩 🍗 🍖 🧀 🥚 🍳 🥐 🍞 🥖 🥨 🥯 🍰 🎂 🧁 🍩 🍪 🍫 🍬 🍦 🍨 ☕ 🍵 🧃 🥤 🍷 🍺 🍹 🥂 🍎 🍋 🍓 🍇 🍉 🍌 🥑 🍅 🥕 🌽 🌶️ 🥦 🍄 🧄 🧅',
  'Smileys': '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😛 😜 🤪 😎 🤩 🥳 😏 😌 😴 🤤 😮 😯 😲 🥺 😢 😭 😤 😡 🤯 😱 🤔 🤫 🤭 🙄 😬 🤗 🤠 🤓 🧐 😷 🤒 👻 💀 🤖 👽',
  'Gestures': '👍 👎 👏 🙌 👐 🤝 🙏 ✌️ 🤞 🤟 🤘 👌 🤌 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 💪 🦾 ✍️ 👀 🧠 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ✨ 🔥 💯',
  'Objects': '💻 🖥️ ⌨️ 🖱️ 📱 ☎️ 📷 🎧 🎮 🕹️ 🎲 🧩 📚 📝 📌 📎 ✂️ 🔒 🔑 🔨 🛠️ ⚙️ 💡 🔋 ⏰ ⏳ 📅 📈 📊 🗂️ 📦 ✉️ 🎁 🎈 🎉 🏆 🥇 🚀 ⭐ 🌙 ☀️ 🌈 ⚡ ❄️ 🌊'
};
let emojiRecent = Store.get('emojiRecent', []);
const EmojiPanel = {
  cat: 'Food',
  close() { $('#emojiPanel')?.remove(); },
  toggle() { if ($('#emojiPanel')) return this.close(); $('#clipPanel')?.remove(); this.render(); },
  render(q = '') {
    this.close(); const cats = emojiRecent.length ? ['Recent', ...Object.keys(EMOJI)] : Object.keys(EMOJI);
    const list = this.cat === 'Recent' ? emojiRecent : EMOJI[this.cat].split(' ');
    const el = html(`<div id="emojiPanel" class="v2panel glass"><div class="vp-h"><b>Emoji</b><span class="muted" style="font-size:11px">Alt+.</span></div><div class="tabs" style="border:0;padding:0 8px">${cats.map(c => `<button data-c="${c}" class="${c === this.cat ? 'on' : ''}">${c}</button>`).join('')}</div><div class="emo-grid">${list.map(e => `<button data-e="${e}">${e}</button>`).join('')}</div><div class="vp-f">${LASTFIELD ? 'Inserts into the last text field you used' : 'Copies the emoji to your clipboard'}</div></div>`);
    panelPos(el);
    $$('[data-c]', el).forEach(b => b.onclick = () => { this.cat = b.dataset.c; this.render(); });
    $$('[data-e]', el).forEach(b => b.onclick = () => { const e = b.dataset.e; emojiRecent = [e, ...emojiRecent.filter(x => x !== e)].slice(0, 24); Store.set('emojiRecent', emojiRecent); if (!insertText(e)) navigator.clipboard?.writeText(e).catch(() => { }); Snd.play('pop'); });
  }
};
function RunDlg() {
  const back = html(`<div class="modal-back"><div class="modal glass" style="width:min(460px,calc(100vw - 32px))"><div class="row" style="flex-wrap:nowrap;gap:14px;align-items:flex-start"><div class="ai" style="width:40px;height:40px;background:linear-gradient(150deg,#3a4250,#11151a)">${svg('terminal')}</div><div><h3>Run</h3><p style="margin:0">Type the name of an app, folder, file or web address and RestaurantOS will open it.</p></div></div><input class="inp" id="runIn" list="runList" placeholder="e.g. sheets, /Documents, resto://news, calc" style="margin-top:14px"><datalist id="runList">${installedApps().map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}</datalist><small id="runErr" style="color:var(--bad);display:block;min-height:16px;margin-top:6px"></small><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>OK</button></div></div></div>`);
  $('#os').appendChild(back); const inp = $('#runIn', back); setTimeout(() => { inp.value = Store.get('runLast', ''); inp.select(); }, 30);
  const go = () => {
    const v = inp.value.trim(); if (!v) return; const lv = v.toLowerCase();
    const alias = { cmd: 'terminal', shell: 'terminal', control: 'settings', explorer: 'files', mspaint: 'paint', excel: 'sheets', outlook: 'mail', web: 'browser', taskmgr: 'taskmgr', write: 'notepad' };
    const app = APPS[alias[lv] || lv] || Object.values(APPS).find(a => a.name.toLowerCase() === lv);
    if (app && isInstalled(app.id)) WM.open(app.id);
    else if (/^(resto:\/\/|https?:\/\/)/.test(lv) || /^[\w-]+\.[a-z]{2,}/.test(lv)) WM.open('browser', { url: v });
    else if (FS.exists(FS.norm(v))) openPath(FS.norm(v));
    else { $('#runErr', back).textContent = `RestaurantOS can't find "${v}". Check the spelling and try again.`; Snd.play('error'); return; }
    Store.set('runLast', v); back.remove();
  };
  $('[data-ok]', back).onclick = go; $('[data-x]', back).onclick = () => back.remove();
  inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') go(); if (e.key === 'Escape') back.remove(); };
}

/* =====================================================================
   HOT CORNERS
   ===================================================================== */
const HOT_ACTIONS = { none: ['Nothing', null], taskview: ['Task view', () => TaskView.toggle()], desktop: ['Show desktop', () => WM.showDesktop()], start: ['Start menu', () => Fly.toggle('startMenu')], spot: ['Search', () => Spot.open()], widgets: ['Widgets', () => Fly.toggle('widgets')], notif: ['Notifications', () => Fly.toggle('notifPanel')], lock: ['Lock', () => lockScreen()], ss: ['Screensaver', () => startSS()] };
let hotIn = null, hotT = 0;
addEventListener('pointermove', e => {
  if (!IS2() || STAGE !== 'os' || document.body.classList.contains('dragging')) return;
  const x = e.clientX, y = e.clientY, W = innerWidth - 2, H = innerHeight - 2;
  const c = x <= 1 && y <= 1 ? 'hotTL' : x >= W && y <= 1 ? 'hotTR' : x <= 1 && y >= H ? 'hotBL' : x >= W && y >= H ? 'hotBR' : null;
  if (c === hotIn) return; hotIn = c; clearTimeout(hotT);
  if (c && S[c] && S[c] !== 'none') hotT = setTimeout(() => { const a = HOT_ACTIONS[S[c]]; if (a && a[1]) { a[1](); hotPulse(c); } }, 220);
}, { passive: true });
function hotPulse(c) { const p = html(`<div class="hotpulse ${c}"></div>`); $('#os').appendChild(p); setTimeout(() => p.remove(), 700); }

/* =====================================================================
   DESKTOP WIDGETS
   ===================================================================== */
const DW_TYPES = { clock: ['Clock', 'clock'], weather: ['Weather', 'weather'], calendar: ['Calendar', 'calendar'], note: ['Note', 'notes'], system: ['System', 'cpu'], quote: ['Quote', 'tips'], focus: ['Focus', 'bolt'] };
const DWidgets = {
  render() {
    let box = $('#dwidgets'); if (!box) { box = html('<div id="dwidgets"></div>'); $('#desktop').appendChild(box); }
    box.innerHTML = '';
    S.dwidgets.forEach(wd => {
      const el = html(`<div class="dw glass" data-id="${wd.id}" style="left:${wd.x}px;top:${wd.y}px"><div class="dw-h"><span>${svg(DW_TYPES[wd.type][1])}${DW_TYPES[wd.type][0]}</span><button aria-label="Remove widget">✕</button></div><div class="dw-b"></div></div>`);
      box.appendChild(el); this.fill(wd, el);
      el.querySelector('.dw-h button').onclick = () => { S.dwidgets = S.dwidgets.filter(x => x.id !== wd.id); saveS(); this.render(); };
      el.querySelector('.dw-h').onpointerdown = e => {
        if (e.target.closest('button')) return; const sx = e.clientX, sy = e.clientY, ox = wd.x, oy = wd.y;
        const mv = ev => { wd.x = clamp(ox + ev.clientX - sx, 0, innerWidth - 120); wd.y = clamp(oy + ev.clientY - sy, 0, innerHeight - 140); el.style.left = wd.x + 'px'; el.style.top = wd.y + 'px'; };
        const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); saveS(); };
        addEventListener('pointermove', mv); addEventListener('pointerup', up);
      };
    });
  },
  fill(wd, el) {
    const b = el.querySelector('.dw-b'); const now = new Date();
    if (wd.type === 'clock') b.innerHTML = `<div class="dw-big">${fmtTime(now, false)}</div><div class="muted">${fmtDate(now)}</div>`;
    if (wd.type === 'weather') { const w = Weather.now(); b.innerHTML = `<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div class="dw-big">${w.temp}°</div><div style="text-align:right;font-size:12px">${esc(S.city)}<br>${w.cond}<br><span class="muted">H ${w.hi}° L ${w.lo}°</span></div></div>`; }
    if (wd.type === 'calendar') { const c = miniCal(0, Store.get('events', {})); b.innerHTML = `<div style="font-weight:600;margin-bottom:6px">${c.title}</div><div class="cal-g">${c.html}</div>`; }
    if (wd.type === 'note') { b.innerHTML = `<textarea class="dw-note" aria-label="Note">${esc(wd.text || '')}</textarea>`; b.firstChild.oninput = e => { wd.text = e.target.value; saveS(); }; }
    if (wd.type === 'system') { const cpu = Math.round(6 + WM.wins.length * 4 + Math.random() * 8); b.innerHTML = `<div style="font-size:12px">CPU ${cpu}%</div><div class="meter" style="height:6px;margin:4px 0 8px"><i style="width:${cpu}%;background:var(--accent)"></i></div><div style="font-size:12px">Windows open: ${WM.wins.length} · Battery ${Batt.level}%</div><div class="muted" style="font-size:12px">Up ${Math.floor((Date.now() - BOOT_T) / 60000)} min</div>`; }
    if (wd.type === 'quote') b.innerHTML = `<div style="font-size:13px;line-height:1.5">${QUOTES[new Date().getDate() % QUOTES.length]}</div>`;
    if (wd.type === 'focus') { const f = FOCUS.run ? fmtFocus(FOCUS.left()) : 'Not running'; b.innerHTML = `<div class="dw-big" style="font-size:24px">${f}</div><div class="muted" style="font-size:12px">Today: ${focusToday()} min focused</div><button class="btn sm primary" style="margin-top:8px">${FOCUS.run ? 'Open' : 'Start 25 min'}</button>`; b.querySelector('button').onclick = () => { if (!FOCUS.run) FOCUS.start(25); WM.open('focus'); }; }
  },
  tick() { if (!IS2() || STAGE !== 'os') return; S.dwidgets.forEach(wd => { if (['clock', 'system', 'focus'].includes(wd.type)) { const el = $(`.dw[data-id="${wd.id}"]`); if (el && !(wd.type === 'focus' && el.contains(document.activeElement))) this.fill(wd, el); } }); },
  add(type) { const n = S.dwidgets.length; S.dwidgets.push({ id: uid(), type, x: innerWidth - 260 - (n % 3) * 240, y: 70 + Math.floor(n / 3) * 190 + (n % 3) * 10 }); saveS(); this.render(); Snd.play('pop'); }
};
Bus.on('tick', () => DWidgets.tick());
function WidgetPicker() {
  const back = html(`<div class="modal-back"><div class="modal glass" style="width:min(520px,calc(100vw - 32px))"><h3>Add a desktop widget</h3><p>Widgets sit on your desktop behind your windows. Drag them by their title to move them.</p><div class="store-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${Object.entries(DW_TYPES).map(([k, [n, ic]]) => `<button class="store-card" data-w="${k}" style="color:var(--fg);align-items:center;cursor:pointer"><div class="ai" style="width:36px;height:36px;background:linear-gradient(150deg,var(--accent2),var(--accent))">${svg(ic)}</div><b>${n}</b></button>`).join('')}</div><div class="acts"><button class="btn" data-x>Done</button></div></div></div>`);
  $('#os').appendChild(back); $$('[data-w]', back).forEach(b => b.onclick = () => DWidgets.add(b.dataset.w)); $('[data-x]', back).onclick = () => back.remove(); back.onpointerdown = e => e.target === back && back.remove();
}
const _bgMenu = Desk.bgMenu.bind(Desk);
Desk.bgMenu = function (e) {
  _bgMenu(e); if (!IS2() || !Ctx.el) return;
  const add = (label, icon, fn) => { const b = html(`<button role="menuitem">${svg(icon)}<span>${label}</span></button>`); b.onclick = () => { Ctx.hide(); fn(); }; Ctx.el.appendChild(b); };
  Ctx.el.appendChild(document.createElement('hr'));
  add('Add widgets…', 'widgets', WidgetPicker); add('Run…', 'terminal', RunDlg); add("What's new in 2.0", 'tips', () => WM.open('whatsnew'));
  const r = Ctx.el.getBoundingClientRect(); Ctx.el.style.top = Math.max(6, Math.min(parseFloat(Ctx.el.style.top), innerHeight - r.height - 6)) + 'px';
};

/* ---------- 2.0 keyboard shortcuts ---------- */
document.addEventListener('keydown', e => {
  if (STAGE !== 'os' || !IS2()) return;
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') { e.preventDefault(); ClipPanel.toggle(); }
  else if (e.altKey && e.code === 'Period') { e.preventDefault(); EmojiPanel.toggle(); }
  else if (e.altKey && !e.ctrlKey && e.code === 'KeyR') { e.preventDefault(); RunDlg(); }
  else if (e.key === 'Escape') { $('#clipPanel')?.remove(); EmojiPanel.close(); $('.snapfly')?.remove(); }
});
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('#clipPanel,#emojiPanel')) { $('#clipPanel')?.remove(); if (!e.target.closest('input,textarea')) EmojiPanel.close(); }
  if (!e.target.closest('.snapfly')) $('.snapfly')?.remove();
}, true);

/* =====================================================================
   SETTINGS ADDITIONS (2.0)
   ===================================================================== */
function settingsV2(page, root, render) {
  if (!IS2() || !root) return;
  const sel = (key, title, desc, icon, opts) => `<div class="set-row"><div class="lbl">${svg(icon)}<div><div>${title}</div>${desc ? `<small>${desc}</small>` : ''}</div></div><select class="inp" data-v2s="${key}" aria-label="${title}">${opts.map(([v, l]) => `<option value="${v}" ${String(S[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
  const tog = (key, title, desc, icon) => `<div class="set-row"><div class="lbl">${svg(icon)}<div><div>${title}</div>${desc ? `<small>${desc}</small>` : ''}</div></div><input type="checkbox" class="sw-t" data-v2t="${key}" ${S[key] ? 'checked' : ''} aria-label="${title}"></div>`;
  const hot = Object.entries(HOT_ACTIONS).map(([k, [l]]) => [k, l]);
  let add = '';
  if (page === 'personal') add = `<div class="h2">Taskbar style <span class="chip">New in 2.0</span></div>${sel('tbStyle', 'Taskbar style', 'A full-width bar or a floating dock', 'apps', [['bar', 'Classic bar'], ['dock', 'Floating dock']])}${tog('magnify', 'Icon magnification', 'Taskbar icons grow when you point at them', 'search')}
    <div class="h2">Hot corners <span class="chip">New in 2.0</span></div>${sel('hotTL', 'Top-left corner', '', 'max', hot)}${sel('hotTR', 'Top-right corner', '', 'max', hot)}${sel('hotBL', 'Bottom-left corner', '', 'max', hot)}${sel('hotBR', 'Bottom-right corner', '', 'max', hot)}
    <div class="h2">Wallpaper slideshow <span class="chip">New in 2.0</span></div>${sel('wpSlide', 'Change wallpaper every', '', 'image', [[0, 'Off'], [1, '1 minute'], [5, '5 minutes'], [10, '10 minutes'], [30, '30 minutes']])}
    <div class="h2">Desktop widgets <span class="chip">New in 2.0</span></div><div class="row"><button class="btn" data-v2a="widgets">${svg('widgets')} Add widgets</button><span class="muted" style="font-size:12px">${S.dwidgets.length} on your desktop</span></div>`;
  if (page === 'sound') add = `<div class="h2">Sound theme <span class="chip">New in 2.0</span></div><div class="choice-grid">${[['Classic', 'The original RestaurantOS sounds'], ['Soft', 'Gentle, rounded tones'], ['Retro', '8-bit chiptune bleeps'], ['Kitchen', 'Service bells and crisp ticks']].map(([t, d]) => `<button class="choice ${S.sndTheme === t ? 'on' : ''}" data-snt="${t}" style="color:var(--fg)"><b>${t}</b><small class="muted">${d}</small></button>`).join('')}</div>`;
  if (page === 'access') add = `<div class="h2">Color filters <span class="chip">New in 2.0</span></div>${sel('cfilter', 'Color filter', 'Changes how colors look across RestaurantOS', 'contrast', [['none', 'Off'], ['grayscale', 'Grayscale'], ['invert', 'Inverted'], ['contrast', 'High contrast'], ['warm', 'Warm']])}
    <div class="card kv" style="display:grid;margin-top:10px">${[['Ctrl+Shift+V', 'Clipboard history'], ['Alt+.', 'Emoji panel'], ['Alt+R', 'Run dialog']].map(([k, d]) => `<dt><span class="kbd">${k}</span></dt><dd>${d} <span class="chip">2.0</span></dd>`).join('')}</div>`;
  if (page === 'storage') add = `<div class="h2">Backup &amp; restore <span class="chip">New in 2.0</span></div><div class="set-row"><div class="lbl">${svg('save')}<div><div>Create a backup</div><small>Copies your settings, files and app data as text you can keep anywhere</small></div></div><button class="btn sm" data-v2a="backup">Back up</button></div><div class="set-row"><div class="lbl">${svg('restart')}<div><div>Restore from a backup</div><small>Paste a backup to bring everything back</small></div></div><button class="btn sm" data-v2a="restore">Restore</button></div>`;
  if (!add) return;
  root.insertAdjacentHTML('beforeend', add);
  $$('[data-v2s]', root).forEach(s => s.onchange = () => { const v = s.value; S[s.dataset.v2s] = isNaN(+v) || v === '' ? v : +v; applySettings(); if (s.dataset.v2s === 'tbStyle') WM.wins.forEach(w => w.max && (w.max = false, WM.toggleMax(w, true))); });
  $$('[data-v2t]', root).forEach(c => c.onchange = () => { S[c.dataset.v2t] = c.checked; Snd.play('toggle'); applySettings(); });
  $$('[data-snt]', root).forEach(b => b.onclick = () => { S.sndTheme = b.dataset.snt; saveS(); render(); Snd.play('notify'); });
  $('[data-v2a="widgets"]', root)?.addEventListener('click', WidgetPicker);
  $('[data-v2a="backup"]', root)?.addEventListener('click', backupDlg);
  $('[data-v2a="restore"]', root)?.addEventListener('click', restoreDlg);
}
function backupDlg() {
  const data = {}; try { Object.keys(localStorage).filter(k => k.startsWith('restaurantos:') && k !== 'restaurantos:customWp').forEach(k => data[k] = localStorage.getItem(k)); } catch (e) { }
  const txt = JSON.stringify({ app: 'RestaurantOS', v: 2, made: new Date().toISOString(), data });
  const back = html(`<div class="modal-back"><div class="modal glass" style="width:min(560px,calc(100vw - 32px))"><h3>Backup created</h3><p>${fmtSize(txt.length)} · Copy this text and keep it somewhere safe. A copy was also saved to Documents.</p><textarea class="inp mono" style="height:180px;font-size:11px;resize:none" readonly>${esc(txt)}</textarea><div class="acts"><button class="btn" data-x>Close</button><button class="btn primary" data-c>Copy backup</button></div></div></div>`);
  $('#os').appendChild(back); const ta = $('textarea', back);
  $('[data-c]', back).onclick = () => { navigator.clipboard?.writeText(txt).then(() => notify('Backup copied', 'Paste it anywhere to keep it safe.', 'settings')).catch(() => { ta.select(); }); };
  $('[data-x]', back).onclick = () => back.remove();
  FS.write('/Documents/' + FS.uniq('/Documents', 'RestaurantOS backup ' + new Date().toISOString().slice(0, 10) + '.json'), txt.length < 600000 ? txt : '{"note":"Backup too large to store as a file"}');
}
function restoreDlg() {
  const back = html(`<div class="modal-back"><div class="modal glass" style="width:min(560px,calc(100vw - 32px))"><h3>Restore from a backup</h3><p>Paste the backup text below. Your current settings and files will be replaced, then RestaurantOS restarts.</p><textarea class="inp mono" style="height:160px;font-size:11px;resize:none" placeholder='{"app":"RestaurantOS", ...}'></textarea><small id="rsErr" style="color:var(--bad)"></small><div class="acts"><button class="btn" data-x>Cancel</button><button class="btn danger" data-r>Restore and restart</button></div></div></div>`);
  $('#os').appendChild(back); const ta = $('textarea', back); ta.onkeydown = e => e.stopPropagation();
  $('[data-x]', back).onclick = () => back.remove();
  $('[data-r]', back).onclick = async () => {
    let b; try { b = JSON.parse(ta.value); } catch (e) { } if (!b || b.app !== 'RestaurantOS' || !b.data) { $('#rsErr', back).textContent = "That doesn't look like a RestaurantOS backup."; Snd.play('error'); return; }
    try { Object.entries(b.data).forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e) { $('#rsErr', back).textContent = 'Not enough storage space to restore.'; return; }
    back.remove(); await shutdownScreen('Restoring your backup'); location.reload();
  };
}

/* =====================================================================
   FOCUS SESSIONS (global state so it runs with the app closed)
   ===================================================================== */
const fmtFocus = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const dayKey = () => new Date().toISOString().slice(0, 10);
const focusStats = () => Store.get('focusStats', { days: {}, sessions: 0 });
const focusToday = () => focusStats().days[dayKey()] || 0;
const FOCUS = {
  run: false, end: 0, mins: 25, prevDnd: false, paused: 0,
  left() { return this.paused ? this.paused : Math.max(0, (this.end - Date.now()) / 1000); },
  start(m) { this.mins = m; this.end = Date.now() + m * 60000; this.run = true; this.paused = 0; this.prevDnd = S.dnd; S.dnd = true; applySettings(); Snd.play('success'); this.live(); Bus.emit('focus'); },
  pause() { if (!this.run) return; if (this.paused) { this.end = Date.now() + this.paused * 1000; this.paused = 0; } else this.paused = this.left(); this.live(); Bus.emit('focus'); },
  stop(done) {
    if (!this.run) return; const spent = Math.round((this.mins * 60 - this.left()) / 60); this.run = false; this.paused = 0; S.dnd = this.prevDnd; applySettings(); Live.set('focus', null);
    if (spent > 0) { const st = focusStats(); st.days[dayKey()] = (st.days[dayKey()] || 0) + spent; if (done) st.sessions++; Store.set('focusStats', st); }
    if (done) { Snd.play('alarm'); notify('Focus session complete', `${this.mins} minutes of focus. Take a 5 minute break!`, 'focus', { dur: 12000 }); }
    Bus.emit('focus');
  },
  live() { Live.set('focus', this.run ? { icon: 'bolt', text: fmtFocus(this.left()), sub: this.paused ? 'Focus paused' : 'Focusing', open: () => WM.open('focus') } : null); }
};
Bus.on('tick', () => { if (!FOCUS.run) return; if (!FOCUS.paused && FOCUS.left() <= 0) FOCUS.stop(true); else FOCUS.live(); });

/* keep the version label right on the power screen and tab title */
function syncVersionLabels() { document.title = 'RestaurantOS ' + osv(); const h = $('#power h1'); if (h) h.textContent = 'RestaurantOS ' + osv(); }
syncVersionLabels(); Bus.on('stage', syncVersionLabels);
