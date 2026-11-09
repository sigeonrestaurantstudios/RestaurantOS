'use strict';
/* =====================================================================
   RestaurantOS 1.0 — core: utilities, storage, sound, filesystem,
   firmware (BIOS / boot menu / recovery), boot splash, setup, lock.
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const uid = () => Math.random().toString(36).slice(2, 9);
function html(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; }

const IS2 = () => Store.get('version', 1) >= 2;
const osv = () => IS2() ? '2.0' : '1.0';
const Store = {
  get(k, d) { try { const v = localStorage.getItem('restaurantos:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('restaurantos:' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('restaurantos:' + k); } catch (e) { } },
  wipe() { try { Object.keys(localStorage).filter(k => k.startsWith('restaurantos:')).forEach(k => localStorage.removeItem(k)); } catch (e) { } },
  size() { let n = 0; try { for (const k of Object.keys(localStorage)) if (k.startsWith('restaurantos:')) n += (localStorage.getItem(k) || '').length * 2; } catch (e) { } return n; }
};

const DEF_SETTINGS = {
  theme: 'dark', accent: '#ff7a45', wallpaper: 'ember', glass: true, anim: true, sound: true, volume: 70, brightness: 100,
  night: false, fontScale: 100, iconSize: 100, radius: 14, tbAlign: 'center', h24: false, secs: false,
  lang: 'English (US)', region: 'United States', kb: 'US', user: '', pass: '', hint: '', avatar: 0,
  dnd: false, wifi: true, bt: true, airplane: false, saver: false, screensaver: 5, ssStyle: 'aurora', city: 'Berlin',
  device: 'RESTO-PC', setupDone: false, wifiName: 'RestoNet 5G', lockOnWake: true,
  privacy: { location: true, diag: false, tailored: false, findDevice: true },
  pinned: ['files', 'browser', 'terminal', 'notepad', 'music', 'store', 'settings'],
  startPinned: ['files', 'browser', 'settings', 'store', 'notepad', 'calc', 'terminal', 'music', 'photos', 'paint', 'clock', 'calendar', 'weather', 'nova', 'code', 'taskmgr', 'todo', 'snake'],
  installed: ['snake', 'minesweeper', 'g2048', 'notes'],
  startupApps: []
};
let S = Object.assign({}, DEF_SETTINGS, Store.get('settings', {}));
const saveS = () => Store.set('settings', S);

const DEF_BIOS = { fastBoot: false, bootStyle: 'Ember Ring', secureBoot: true, tpm: true, oc: false, virt: true, sata: 'AHCI', fan: 'Balanced', usbLegacy: true, led: 'Ember', bootOrder: ['RestaurantOS (NVMe0)', 'USB Storage Device', 'Network Boot (PXE)'], beep: true };
let B = Object.assign({}, DEF_BIOS, Store.get('bios', {}));
const saveB = () => Store.set('bios', B);

const AVATARS = [['#ff7a45', '#c2410c'], ['#2ec4b6', '#1b6f8a'], ['#c77dff', '#6a3dbd'], ['#ffd166', '#e08e0b'], ['#ff4d6d', '#a4133c'], ['#4cc9f0', '#3a56d4'], ['#3ddc97', '#1b8a5a'], ['#adb5bd', '#495057']];
function avatarEl(cls = '', idx = S.avatar, name = S.user) {
  const [a, b] = AVATARS[idx % AVATARS.length];
  return `<div class="av ${cls}" style="background:linear-gradient(140deg,${a},${b})">${esc((name || 'N').trim()[0] || 'N').toUpperCase()}</div>`;
}

/* ---------- Glyphs ---------- */
const G = {
  files: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  doc: 'M6 3h9l4 4v14H6z M15 3v4h4 M9 12h7 M9 16h7 M9 8h3',
  terminal: 'M4 5h16v14H4z M7 9l3 3-3 3 M12 15h5',
  calc: 'M6 3h12v18H6z M9 7h6 M9 11h.5 M14.5 11h.5 M9 15h.5 M14.5 15h.5 M9 18.5h.5 M14.5 18.5h.5',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 2.5v3 M12 18.5v3 M2.5 12h3 M18.5 12h3 M5.3 5.3l2.1 2.1 M16.6 16.6l2.1 2.1 M5.3 18.7l2.1-2.1 M16.6 7.4l2.1-2.1',
  browser: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  paint: 'M18.4 3.6a2 2 0 0 1 2.8 2.8L11 16.6 7.4 13z M7.4 13c-2 0-3.4 1.6-3.4 3.4 0 1.4-.6 2.6-2 3.6 3.6.4 7.6-.6 9-3.4',
  music: 'M9 18V6l11-2v12 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2',
  weather: 'M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z M15 4v1 M20 6l-.7.7 M10.5 5.5l.7.7',
  taskmgr: 'M3 12h4l3-8 4 16 3-8h4',
  photos: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15.5 9.5h.01',
  piano: 'M3 5h18v14H3z M7.5 5v14 M12 5v14 M16.5 5v14',
  code: 'M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16',
  notes: 'M5 4h14v10l-6 6H5z M13 20v-6h6',
  todo: 'M4 6l2 2 3-3 M11 7h9 M4 13l2 2 3-3 M11 14h9 M4 19.5h2 M11 20h9',
  store: 'M5 8h14l-1 12H6z M9 8V6a3 3 0 0 1 6 0v2',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  game: 'M6 9h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5 2l-2-2H9l-2 2a3 3 0 0 1-5-2v-1a4 4 0 0 1 4-4z M7 11.5v3 M5.5 13h3 M16 12h.01 M18 14h.01',
  snake: 'M4 18c0-3 3-4 6-4s6-1 6-4-3-4-6-4 M16 6.5h.01 M4 18h4',
  bomb: 'M11 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M15 8l3-3 M18.5 2v1.5 M20.5 4H22 M20 2.5l1-1',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  ttt: 'M9 3v18 M15 3v18 M3 9h18 M3 15h18',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v6 M12 7.5v.01',
  chat: 'M4 5h16v11H9l-5 4z M8 10h.01 M12 10h.01 M16 10h.01',
  brick: 'M3 5h5v3H3z M10 5h5v3h-5z M17 5h4v3h-4z M10 19h6 M8 14.5h.01',
  cards: 'M4 6h10v14H4z M10 4h10v14',
  convert: 'M4 8h13l-3-3 M20 16H7l3 3',
  tips: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  power: 'M12 3v8 M6.3 6.8a8 8 0 1 0 11.4 0',
  restart: 'M3 12a9 9 0 1 0 3-6.7 M3 4v5h5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 21a8 8 0 0 1 16 0',
  signout: 'M15 4h4v16h-4 M10 8l-4 4 4 4 M6 12h10',
  wifi: 'M2 9a15 15 0 0 1 20 0 M5 12.5a10 10 0 0 1 14 0 M8.5 16a5 5 0 0 1 7 0 M12 19.5h.01',
  wifioff: 'M2 9a15 15 0 0 1 20 0 M5 12.5a10 10 0 0 1 14 0 M12 19.5h.01 M3 3l18 18',
  vol: 'M4 9h4l5-4v14l-5-4H4z M16 9a4 4 0 0 1 0 6 M18.5 6.5a8 8 0 0 1 0 11',
  mute: 'M4 9h4l5-4v14l-5-4H4z M17 9l5 5 M22 9l-5 5',
  bat: 'M3 8h15v8H3z M20 10.5v3 M5 10h6v4H5z',
  bt: 'M7 7l10 10-5 5V2l5 5L7 17',
  plane: 'M10 21l2-1 2 1v-2l-1.5-1.5V13l8 3v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-3v4.5L10 19z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 21h4',
  belloff: 'M6 16V11a6 6 0 0 1 9-5.2 M18 11v5l2 2H8 M10 21h4 M3 3l18 18',
  leaf: 'M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z M5 19l7-7',
  contrast: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 3v18 M12 7h5 M12 11h8 M12 15h7',
  full: 'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5',
  widgets: 'M4 4h7v9H4z M13 4h7v5h-7z M13 11h7v9h-7z M4 15h7v5H4z',
  taskview: 'M3 6h12v12H3z M18 8h3v8h-3',
  plus: 'M12 5v14 M5 12h14',
  x: 'M6 6l12 12 M18 6L6 18',
  min: 'M5 12h14',
  max: 'M5 5h14v14H5z',
  unmax: 'M8 8h11v11H8z M5 16V5h11',
  back: 'M15 6l-6 6 6 6',
  fwd: 'M9 6l6 6-6 6',
  up: 'M12 19V5 M6 11l6-6 6 6',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6 M20 4v5h-5',
  home: 'M4 11l8-7 8 7 M6 9.5V20h12V9.5',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z',
  edit: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  copy: 'M8 8h12v12H8z M4 16V4h12',
  cut: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.5 7.5L20 19 M8.5 16.5L20 5',
  paste: 'M9 4h6v3H9z M7 5H5v16h14V5h-2',
  image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  save: 'M5 3h11l3 3v15H5z M8 3v5h7V3 M8 21v-7h8v7',
  open: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1 M3 7v11h15l3-8H6z',
  play: 'M7 4v16l13-8z',
  pause: 'M7 4h4v16H7z M13 4h4v16h-4z',
  next: 'M5 4l10 8-10 8z M17 4h2v16h-2z',
  prev: 'M19 4L9 12l10 8z M5 4h2v16H5z',
  shuffle: 'M3 7h4l10 10h4 M3 17h4l3-3 M14 10l3-3h4 M18 4l3 3-3 3 M18 14l3 3-3 3',
  display: 'M3 5h18v12H3z M8 21h8 M12 17v4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18',
  apps: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  access: 'M12 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z M5 9l7 1 7-1 M12 10v5 M9 21l3-6 3 6',
  update: 'M12 3v12 M7 10l5 5 5-5 M4 20h16',
  storage: 'M4 6h16v5H4z M4 13h16v5H4z M7 8.5h.01 M7 15.5h.01',
  palette: 'M12 3a9 9 0 0 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.5-1-1.8-1-3 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z M7.5 11h.01 M10 7.5h.01 M14.5 7.5h.01',
  cpu: 'M7 7h10v10H7z M10 10h4v4h-4z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 20h16',
  pin: 'M9 4h6l-1 6 4 3H6l4-3z M12 13v8',
  sort: 'M7 4v16 M3 16l4 4 4-4 M17 20V4 M13 8l4-4 4 4',
  newfolder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M12 11v5 M9.5 13.5h5',
  newfile: 'M6 3h9l4 4v14H6z M15 3v4h4 M12 11v6 M9 14h6',
  undo: 'M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5 M20 9H10a6 6 0 0 0 0 12h3',
  brush: 'M18.4 3.6a2 2 0 0 1 2.8 2.8L11 16.6 7.4 13z M7.4 13c-2 0-3.4 1.6-3.4 3.4 0 1.4-.6 2.6-2 3.6 3.6.4 7.6-.6 9-3.4',
  eraser: 'M7 21h12 M5.5 15.5l9-9 5 5-7 7H8z',
  line: 'M5 19L19 5',
  rect: 'M4 6h16v12H4z',
  circle: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z',
  fill: 'M5 12l7-7 7 7-7 7z M19 15s2 2.5 2 4a2 2 0 0 1-4 0c0-1.5 2-4 2-4z',
  text: 'M5 6V4h14v2 M12 4v16 M9 20h6',
  send: 'M4 12l16-8-6 16-3-7z M11 13l9-9',
  mic: 'M9 4a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z M5 11a7 7 0 0 0 14 0 M12 18v3',
  check: 'M5 12l5 5L20 7',
  flag: 'M5 21V4 M5 4h11l-2 4 2 4H5',
  heart: 'M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  rocket: 'M12 2c3 2 5 6 5 10l-2 4H9l-2-4c0-4 2-8 5-10z M12 9h.01 M9 16l-3 4 M15 16l3 4',
  diamond: 'M6 3h12l4 6-10 12L2 9z M2 9h20 M10 3l-2 6 4 12 4-12-2-6'
};
const svg = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${G[name] || G.info}"/></svg>`;
const NLOGO = `<svg class="nlogo" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="16" fill="url(#nlg)"/><path d="M23 46V18h11a8 8 0 0 1 0 16H23 M33 34l11 12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="16" r="4" fill="#fff"/></svg>`;

/* ---------- Sound engine (WebAudio synth) ---------- */
const Snd = {
  ctx: null, master: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      this.ctx = new AC(); this.master = this.ctx.createGain();
      const comp = this.ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ctx.destination);
      this.upd();
    } catch (e) { this.ctx = null; }
  },
  upd() { if (this.master) this.master.gain.value = S.sound ? (S.volume / 100) * .9 : 0; },
  tone(f, d = .15, type = 'sine', v = .2, t0 = 0, atk = .006, dest) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + d + .05); return o;
  },
  sweep(f1, f2, d, type = 'sine', v = .12, t0 = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + t0;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + .05);
  },
  play(n) {
    if (!this.ctx || !S.sound) return;
    const T = (...a) => this.tone(...a);
    switch (n) {
      case 'startup': {
        const notes = [174.6, 261.6, 329.6, 392, 523.3, 659.3, 784];
        notes.forEach((f, i) => { T(f, 3.2 - i * .2, 'triangle', .07, i * .11, .08); T(f * 2, 2.4, 'sine', .025, i * .11 + .02, .1); });
        T(1046.5, 2.5, 'sine', .04, .9, .3); T(1568, 2, 'sine', .02, 1.1, .3); break;
      }
      case 'shutdown': [784, 659.3, 523.3, 392, 261.6].forEach((f, i) => T(f, 1.4, 'triangle', .07, i * .14, .05)); break;
      case 'click': T(2200, .025, 'sine', .04); break;
      case 'open': T(523, .12, 'sine', .08); T(784, .18, 'sine', .07, .05); break;
      case 'close': T(660, .1, 'sine', .07); T(440, .14, 'sine', .06, .05); break;
      case 'min': this.sweep(700, 250, .18, 'sine', .07); break;
      case 'max': this.sweep(300, 800, .15, 'sine', .06); break;
      case 'notify': T(880, .3, 'sine', .12); T(1318.5, .45, 'sine', .1, .12); break;
      case 'error': T(196, .22, 'square', .05); T(146.8, .3, 'square', .05, .13); break;
      case 'beep': T(1000, .16, 'square', .06); break;
      case 'unlock': T(659.3, .12, 'sine', .1); T(987.8, .25, 'sine', .1, .08); break;
      case 'toggle': T(1500, .04, 'sine', .05); break;
      case 'trash': this.sweep(900, 120, .25, 'triangle', .08); break;
      case 'alarm': for (let i = 0; i < 6; i++) { T(880, .12, 'square', .06, i * .3); T(1100, .12, 'square', .06, i * .3 + .14); } break;
      case 'success': [523.3, 659.3, 784, 1046.5].forEach((f, i) => T(f, .3, 'sine', .08, i * .08)); break;
      case 'pop': this.sweep(400, 1200, .08, 'sine', .08); break;
      case 'eat': T(1200, .06, 'square', .04); break;
      case 'lose': [400, 300, 200].forEach((f, i) => T(f, .25, 'sawtooth', .05, i * .15)); break;
    }
  }
};

/* ---------- Virtual filesystem ---------- */
const FS = {
  root: null,
  dir(c = {}) { return { t: 'd', c, m: Date.now() }; },
  file(d = '') { return { t: 'f', d, m: Date.now() }; },
  load() { this.root = Store.get('fs', null) || this.seed(); },
  save() { if (!Store.set('fs', this.root)) notify?.('Storage is full', 'Your browser storage limit was reached. Delete large files such as pictures to free space.', 'settings'); },
  seed() {
    const d = (c) => this.dir(c), f = (s) => this.file(s);
    return d({
      Desktop: d({ 'Welcome.txt': f('Welcome to RestaurantOS 1.0!\n\nThings to try:\n • Right-click the desktop for options\n • Press Ctrl+K to search everything\n • Drag a window to the screen edge to snap it\n • Alt+` switches windows, Alt+1..4 switches desktops\n • Open the Terminal and type "help" or "neofetch"\n • Ask Nova, the assistant, to "open paint" or "tell me a joke"\n • Restart and press DEL to enter the BIOS\n\nHave fun!') }),
      Documents: d({
        'Notes.md': f('# My Notes\n\n## Ideas\n- Build a game in **Code Studio**\n- Try the *Breakout* game from RestoStore\n- Customize the accent color\n\n## Shortcuts\n`Ctrl+K` search · `Alt+T` terminal · `Alt+E` files'),
        'Shopping list.txt': f('Milk\nEggs\nCoffee beans\nBananas\nBread\nOlive oil'),
        Projects: d({ 'hello.html': f('<!doctype html>\n<html>\n<head>\n<style>\n  body{font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#ff7a45,#2ec4b6);color:#fff}\n  h1{font-size:48px}\n</style>\n</head>\n<body>\n  <h1 id="t">Hello, RestaurantOS!</h1>\n  <script>\n    let n=0;document.body.onclick=()=>document.getElementById("t").textContent="Clicked "+(++n)+" times";\n  <\/script>\n</body>\n</html>'), 'todo.txt': f('1. Finish the website\n2. Learn JavaScript\n3. Beat 2048') })
      }),
      Pictures: d({}), Music: d({ 'Playlist.txt': f('Ember Drift\nTidal Lines\nNeon Circuit\nMidnight Bloom') }),
      Downloads: d({ 'readme.txt': f('RestaurantOS 1.0\nBuild 26.10 — "Phoenix"\n\nThis folder is for files you save from apps.') }),
      Trash: d({})
    });
  },
  parts(p) { return p.split('/').filter(Boolean); },
  norm(p, cwd = '/') {
    if (!p) return cwd; if (p === '~') p = '/'; if (p.startsWith('~/')) p = p.slice(1);
    const base = p.startsWith('/') ? [] : this.parts(cwd); const out = base;
    for (const s of this.parts(p)) { if (s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
    return '/' + out.join('/');
  },
  node(p) { let n = this.root; for (const s of this.parts(p)) { if (!n || n.t !== 'd') return null; n = n.c[s]; } return n || null; },
  parentOf(p) { const a = this.parts(p); const name = a.pop(); return [this.node('/' + a.join('/')), name, '/' + a.join('/')]; },
  list(p) { const n = this.node(p); if (!n || n.t !== 'd') return []; return Object.entries(n.c).map(([name, x]) => ({ name, path: (p === '/' ? '' : p) + '/' + name, dir: x.t === 'd', node: x })).sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name, undefined, { numeric: true })); },
  read(p) { const n = this.node(p); return n && n.t === 'f' ? n.d : null; },
  exists(p) { return !!this.node(p); },
  write(p, data) { const [par, name] = this.parentOf(p); if (!par || par.t !== 'd' || !name) return false; const ex = par.c[name]; if (ex && ex.t === 'd') return false; par.c[name] = this.file(data); par.m = Date.now(); this.save(); Bus.emit('fs'); return true; },
  mkdir(p) { const [par, name] = this.parentOf(p); if (!par || par.t !== 'd' || !name || par.c[name]) return false; par.c[name] = this.dir(); this.save(); Bus.emit('fs'); return true; },
  uniq(dirPath, name) { const n = this.node(dirPath); if (!n) return name; if (!n.c[name]) return name; const m = name.match(/^(.*?)(\.[^.]*)?$/); let i = 2; while (n.c[`${m[1]} (${i})${m[2] || ''}`]) i++; return `${m[1]} (${i})${m[2] || ''}`; },
  remove(p, hard = false) {
    const [par, name, pp] = this.parentOf(p); if (!par || !par.c[name]) return false;
    const node = par.c[name]; delete par.c[name];
    if (!hard && !p.startsWith('/Trash')) { const t = this.node('/Trash'); const nn = this.uniq('/Trash', name); node.o = p; t.c[nn] = node; }
    this.save(); Bus.emit('fs'); return true;
  },
  restore(p) { const n = this.node(p); if (!n) return false; const dest = n.o || '/Documents/' + this.parts(p).pop(); const [par, , pp] = this.parentOf(dest); const target = par ? dest : '/Documents/' + this.parts(dest).pop(); const [tp, , tpp] = this.parentOf(target); const nm = this.uniq(tpp, this.parts(target).pop()); delete n.o; tp.c[nm] = n; const [op, oname] = this.parentOf(p); delete op.c[oname]; this.save(); Bus.emit('fs'); return true; },
  rename(p, newName) { const [par, name] = this.parentOf(p); if (!par || !par.c[name] || !newName || newName.includes('/') || par.c[newName]) return false; par.c[newName] = par.c[name]; delete par.c[name]; this.save(); Bus.emit('fs'); return true; },
  move(src, destDir, copy = false) {
    const [par, name] = this.parentOf(src); const d = this.node(destDir); if (!par || !par.c[name] || !d || d.t !== 'd') return false;
    if ((destDir + '/').startsWith(src + '/')) return false;
    const nm = this.uniq(destDir, name); d.c[nm] = copy ? JSON.parse(JSON.stringify(par.c[name])) : par.c[name]; if (!copy) delete par.c[name];
    this.save(); Bus.emit('fs'); return true;
  },
  size(n) { if (!n) return 0; if (n.t === 'f') return (n.d || '').length; return Object.values(n.c).reduce((a, x) => a + this.size(x), 0); },
  walk(p = '/', out = []) { for (const e of this.list(p)) { out.push(e); if (e.dir) this.walk(e.path, out); } return out; },
  ext(name) { const m = /\.([^.]+)$/.exec(name); return m ? m[1].toLowerCase() : ''; }
};
const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';

/* ---------- Tiny event bus ---------- */
const Bus = { h: {}, on(e, f) { (this.h[e] ||= []).push(f); }, off(e, f) { this.h[e] = (this.h[e] || []).filter(x => x !== f); }, emit(e, d) { (this.h[e] || []).slice().forEach(f => { try { f(d); } catch (err) { console.error(err); } }); } };

/* ---------- Stage manager ---------- */
let STAGE = 'power';
function show(id) {
  $$('.stage').forEach(s => s.classList.toggle('hidden', s.id !== id));
  STAGE = id; Bus.emit('stage', id);
}

/* ---------- Clock helpers ---------- */
const LOCALE = 'en-US';
function fmtTime(d = new Date(), secs = S.secs) { return d.toLocaleTimeString(LOCALE, { hour: S.h24 ? '2-digit' : 'numeric', minute: '2-digit', second: secs ? '2-digit' : undefined, hour12: !S.h24 }); }
function fmtDate(d = new Date(), o = { weekday: 'long', month: 'long', day: 'numeric' }) { return d.toLocaleDateString(LOCALE, o); }
const BOOT_T = Date.now();

/* =====================================================================
   POWER → BIOS
   ===================================================================== */
let postTimer = null, postState = { setup: false, menu: false, done: false };
$('#powerBtn').addEventListener('click', powerOn);
function powerOn() {
  Snd.init();
  $('#pwLed').classList.add('on');
  setTimeout(() => runPOST(), 350);
}
async function runPOST() {
  show('bios');
  postState = { setup: false, menu: false, done: false, skip: false };
  const L = $('#biosLines'); L.innerHTML = '';
  if (B.beep) Snd.play('beep');
  const line = (t, cls = '') => { const d = document.createElement('div'); d.innerHTML = cls ? `<span class="${cls}">${t}</span>` : t; L.appendChild(d); return d; };
  const fast = B.fastBoot; const w = ms => postState.skip ? Promise.resolve() : sleep(fast ? ms / 4 : ms);
  const cpu = B.oc ? 'RestoTech Quantum X9 @ 5.80GHz <span class="warn">[OVERCLOCKED]</span>' : 'RestoTech Quantum X9 @ 5.20GHz';
  const steps = [
    () => line('Main Processor : ' + cpu),
    () => line('CPU Cores      : 16 Cores / 32 Threads   L3 Cache: 64MB'),
    async () => { const d = line('Memory Test    : 0MB'); const tot = 32768; if (fast || postState.skip) { d.innerHTML = `Memory Test    : ${tot}MB <span class="ok">OK</span>`; return; } for (let m = 0; m <= tot; m += 1024) { if (postState.skip || postState.setup || postState.menu) break; d.innerHTML = `Memory Test    : ${m}MB`; await sleep(28); } d.innerHTML = `Memory Test    : ${tot}MB <span class="ok">OK</span> (DDR5-6400 Dual Channel)`; },
    () => line(''),
    () => line('Detecting NVMe0 ... RestoDrive Pro 2TB NVMe <span class="ok">[OK]</span>'),
    () => line('Detecting SATA1 ... None'),
    () => line('Detecting USB   ... 3 devices (Keyboard, Mouse, Hub)'),
    () => line('Graphics       : RestoForce RTX 9090 24GB  <span class="dim">Resizable BAR enabled</span>'),
    () => line('Virtualization : ' + (B.virt ? '<span class="ok">Enabled</span>' : 'Disabled') + '   Secure Boot: ' + (B.secureBoot ? '<span class="ok">On</span>' : '<span class="warn">Off</span>') + '   TPM 2.0: ' + (B.tpm ? 'Ready' : 'Disabled')),
    () => line('Fan Profile    : ' + B.fan + '   CPU Temp: ' + (B.oc ? '71' : '42') + '°C'),
    () => line(''),
  ];
  for (const s of steps) { if (postState.setup || postState.menu) break; await s(); await w(240); }
  if (postState.setup) return openBiosSetup();
  if (postState.menu) return openBootMenu();
  await w(500);
  if (postState.setup) return openBiosSetup();
  if (postState.menu) return openBootMenu();
  // walk boot order
  for (const dev of B.bootOrder) {
    if (dev.startsWith('RestaurantOS')) { line('Booting from ' + dev + ' ...', 'ok'); await w(500); return bootSplash(); }
    if (dev.startsWith('USB')) { line('Checking USB Storage Device ... <span class="warn">No bootable media found</span>'); await w(700); }
    if (dev.startsWith('Network')) { line('PXE-E61: Media test failure, check cable', 'warn'); line('PXE-M0F: Exiting PXE ROM.', 'dim'); await w(900); }
  }
  line('Reboot and select proper boot device, or insert boot media and press a key', 'warn');
}
$('#biosEnterBtn').addEventListener('click', () => { postState.setup = true; if (postState.done) openBiosSetup(); });
$('#bootMenuBtn').addEventListener('click', () => { postState.menu = true; });

/* ---------- BIOS Setup utility ---------- */
const BIOS_TABS = ['Main', 'Advanced', 'Boot', 'Security', 'Exit'];
let bs = { tab: 0, sel: 0, draft: null, dialog: null };
function biosItems(tab) {
  const D = bs.draft; const now = new Date();
  const ro = (k, v, help) => ({ k, v, ro: true, help });
  const opt = (k, key, vals, help) => ({ k, key, vals, help });
  switch (BIOS_TABS[tab]) {
    case 'Main': return [
      { sec: 'System Information' },
      ro('BIOS Version', 'RestoTech UEFI 4.20.1', 'Firmware build installed on this machine.'),
      ro('Build Date', '10/01/2026', ''),
      ro('Processor', D.oc ? 'Quantum X9 @ 5.80 GHz' : 'Quantum X9 @ 5.20 GHz', 'Overclocking can be changed under Advanced.'),
      ro('Total Memory', '32768 MB (DDR5-6400)', ''),
      ro('Storage', 'RestoDrive Pro 2TB NVMe', ''),
      { sec: 'Date & Time' },
      ro('System Date', now.toLocaleDateString('en-US'), 'Set automatically from the RestaurantOS clock.'),
      ro('System Time', now.toLocaleTimeString('en-US', { hour12: false }), 'Set automatically from the RestaurantOS clock.'),
      opt('System Beep', 'beep', [true, false], 'Play a short beep at power on (POST).')
    ];
    case 'Advanced': return [
      { sec: 'CPU Configuration' },
      opt('CPU Overclock (RestoBoost)', 'oc', [false, true], 'Raises the CPU clock to 5.8 GHz. Task Manager will show higher speeds and temperatures.'),
      opt('Virtualization (VT-n)', 'virt', [true, false], 'Hardware virtualization for virtual machines.'),
      { sec: 'Devices' },
      opt('SATA Mode', 'sata', ['AHCI', 'RAID', 'IDE'], 'Controller mode for SATA drives.'),
      opt('USB Legacy Support', 'usbLegacy', [true, false], 'Allows USB keyboards to work before the OS loads.'),
      opt('Fan Profile', 'fan', ['Silent', 'Balanced', 'Turbo'], 'Cooling curve for system fans.'),
      opt('RGB Lighting', 'led', ['Ember', 'Tide', 'Rainbow', 'Off'], 'Color of the chassis lighting. Also tints the boot logo.')
    ];
    case 'Boot': return [
      { sec: 'Boot Configuration' },
      opt('Fast Boot', 'fastBoot', [false, true], 'Skips the memory test and shortens startup.'),
      opt('Boot Animation', 'bootStyle', ['Ember Ring', 'Classic Bar', 'Minimal'], 'Animation shown while RestaurantOS loads.'),
      { sec: 'Boot Priority (Enter to move up)' },
      ...D.bootOrder.map((d, i) => ({ k: 'Boot Option #' + (i + 1), v: d, order: i, help: 'Press Enter or click to move this device up in the boot order.' }))
    ];
    case 'Security': return [
      { sec: 'Security Settings' },
      opt('Secure Boot', 'secureBoot', [true, false], 'Only allow signed bootloaders to start.'),
      opt('TPM 2.0 Device', 'tpm', [true, false], 'Trusted Platform Module for encryption keys.'),
      ro('Supervisor Password', 'Not Installed', 'Password support is managed from RestaurantOS Settings › Accounts.'),
      ro('Chassis Intrusion', 'No intrusion detected', '')
    ];
    case 'Exit': return [
      { sec: 'Exit Options' },
      { k: 'Save Changes and Exit', act: 'save', help: 'Save configuration and restart. (F10)' },
      { k: 'Discard Changes and Exit', act: 'discard', help: 'Exit without saving any changes.' },
      { k: 'Load Optimized Defaults', act: 'defaults', help: 'Restore factory firmware settings. (F9)' },
      { sec: 'Boot Override' },
      { k: 'RestaurantOS (NVMe0)', act: 'boot', help: 'Boot RestaurantOS directly without saving.' },
      { k: 'RestaurantOS Recovery Environment', act: 'recovery', help: 'Open recovery tools: repair, reset, and more.' }
    ];
  }
}
const fmtV = v => v === true ? '[Enabled]' : v === false ? '[Disabled]' : '[' + v + ']';
function openBiosSetup() {
  bs = { tab: 0, sel: 0, draft: JSON.parse(JSON.stringify(B)), dialog: null };
  show('biosSetup'); renderBios();
  clearInterval(bs.clock); bs.clock = setInterval(() => STAGE === 'biosSetup' && !bs.dialog && BIOS_TABS[bs.tab] === 'Main' && renderBios(), 1000);
}
function selectable(items) { return items.map((it, i) => it.sec || it.ro ? -1 : i).filter(i => i >= 0); }
function renderBios() {
  const el = $('#biosSetup'); const items = biosItems(bs.tab); const sel = selectable(items);
  if (!sel.includes(bs.sel)) bs.sel = sel[0] ?? -1;
  const cur = items[bs.sel];
  el.innerHTML = `<div class="bs-top">RestoTech UEFI Setup Utility</div>
  <div class="bs-tabs">${BIOS_TABS.map((t, i) => `<button data-t="${i}" class="${i === bs.tab ? 'on' : ''}">${t}</button>`).join('')}</div>
  <div class="bs-body"><div class="bs-main">${items.map((it, i) => it.sec ? `<div class="bs-sec">${it.sec}</div>` :
    `<div class="bs-row ${it.ro ? 'ro' : ''} ${i === bs.sel ? 'sel' : ''}" data-i="${i}"><span>${it.k}</span><span class="v">${it.key ? fmtV(bs.draft[it.key]) : it.v ? (it.order != null ? '[' + it.v + ']' : it.v) : ''}</span></div>`).join('')}</div>
  <div class="bs-help"><h4>Item Help</h4>${cur ? (cur.help || '') : ''}<br><br><span style="color:#fff">→←</span> Select Screen<br><span style="color:#fff">↑↓</span> Select Item<br><span style="color:#fff">Enter</span> Change / Select<br><span style="color:#fff">F9</span> Optimized Defaults<br><span style="color:#fff">F10</span> Save &amp; Exit<br><span style="color:#fff">ESC</span> Exit</div></div>
  <div class="bs-foot"><span>F1 General Help</span><span>F9 Defaults</span><span>F10 Save &amp; Exit</span><span>ESC Exit</span><span style="margin-left:auto">v4.20.1 © RestoTech</span></div>
  ${bs.dialog ? `<div class="bs-dialog"><div><h5>${bs.dialog.title}</h5><div style="text-align:center">${bs.dialog.msg}</div><div class="opts">${bs.dialog.opts.map((o, i) => `<button data-o="${i}" class="${i === bs.dialog.sel ? 'sel' : ''}">${o.l}</button>`).join('')}</div></div></div>` : ''}`;
  $$('.bs-tabs button', el).forEach(b => b.onclick = () => { bs.tab = +b.dataset.t; bs.sel = -1; renderBios(); });
  $$('.bs-row', el).forEach(r => r.onclick = () => { const i = +r.dataset.i; if (items[i].ro) return; if (bs.sel === i) biosActivate(); else { bs.sel = i; renderBios(); } });
  $$('.bs-dialog button', el).forEach(b => b.onclick = () => { const o = bs.dialog.opts[+b.dataset.o]; bs.dialog = null; o.f(); });
}
function biosDialog(title, msg, opts) { bs.dialog = { title, msg, opts, sel: 0 }; renderBios(); }
function biosActivate() {
  const items = biosItems(bs.tab); const it = items[bs.sel]; if (!it) return;
  Snd.play('click');
  if (it.key) { const i = it.vals.indexOf(bs.draft[it.key]); bs.draft[it.key] = it.vals[(i + 1) % it.vals.length]; renderBios(); }
  else if (it.order != null) { if (it.order > 0) { const o = bs.draft.bootOrder; [o[it.order - 1], o[it.order]] = [o[it.order], o[it.order - 1]]; bs.sel--; } renderBios(); }
  else if (it.act === 'save') biosSaveExit();
  else if (it.act === 'discard') biosDialog('Exit Without Saving', 'Quit without saving changes?', [{ l: 'Yes', f: () => runPOST() }, { l: 'No', f: renderBios }]);
  else if (it.act === 'defaults') biosDefaults();
  else if (it.act === 'boot') bootSplash();
  else if (it.act === 'recovery') openRecovery();
}
function biosSaveExit() { biosDialog('Save & Exit Setup', 'Save configuration changes and exit now?', [{ l: 'Yes', f: () => { B = bs.draft; saveB(); runPOST(); } }, { l: 'No', f: renderBios }]); }
function biosDefaults() { biosDialog('Load Optimized Defaults', 'Load optimized default settings?', [{ l: 'Yes', f: () => { bs.draft = JSON.parse(JSON.stringify(DEF_BIOS)); renderBios(); } }, { l: 'No', f: renderBios }]); }
function biosKey(e) {
  if (bs.dialog) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') { bs.dialog.sel = (bs.dialog.sel + 1) % bs.dialog.opts.length; renderBios(); }
    else if (e.key === 'Enter') { const o = bs.dialog.opts[bs.dialog.sel]; bs.dialog = null; o.f(); }
    else if (e.key === 'Escape') { bs.dialog = null; renderBios(); }
    e.preventDefault(); return;
  }
  const items = biosItems(bs.tab); const sel = selectable(items); const pos = sel.indexOf(bs.sel);
  switch (e.key) {
    case 'ArrowRight': bs.tab = (bs.tab + 1) % BIOS_TABS.length; bs.sel = -1; break;
    case 'ArrowLeft': bs.tab = (bs.tab + BIOS_TABS.length - 1) % BIOS_TABS.length; bs.sel = -1; break;
    case 'ArrowDown': bs.sel = sel[(pos + 1) % sel.length]; break;
    case 'ArrowUp': bs.sel = sel[(pos - 1 + sel.length) % sel.length]; break;
    case 'Enter': case ' ': biosActivate(); e.preventDefault(); return;
    case 'F9': biosDefaults(); e.preventDefault(); return;
    case 'F10': biosSaveExit(); e.preventDefault(); return;
    case 'Escape': biosDialog('Exit Setup', 'Save changes before exiting?', [{ l: 'Save', f: () => { B = bs.draft; saveB(); runPOST(); } }, { l: 'Discard', f: () => runPOST() }, { l: 'Cancel', f: renderBios }]); e.preventDefault(); return;
    default: return;
  }
  e.preventDefault(); Snd.play('click'); renderBios();
}

/* ---------- Boot menu (F12) ---------- */
let bm = { sel: 0 };
const BM_ITEMS = [
  { l: 'RestaurantOS (NVMe0: RestoDrive Pro 2TB)', f: () => bootSplash() },
  { l: 'RestaurantOS Recovery Environment', f: () => openRecovery() },
  { l: 'USB Storage Device', f: () => bmFail('No bootable media found on USB Storage Device.') },
  { l: 'Network Boot (IPv4 PXE)', f: () => bmFail('PXE-E61: Media test failure, check cable.') },
  { l: 'Enter Setup', f: () => openBiosSetup() }
];
function openBootMenu() { bm.sel = 0; show('bootMenu'); renderBootMenu(); }
function renderBootMenu(msg) {
  const el = $('#bootMenu');
  el.innerHTML = `<div class="bm-box"><h3>Please select boot device:</h3><ul>${BM_ITEMS.map((x, i) => `<li data-i="${i}" class="${i === bm.sel ? 'sel' : ''}">${x.l}</li>`).join('')}</ul><p>${msg ? '<span style="color:#ffc857">' + msg + '</span>' : '↑ and ↓ to move selection · ENTER to select boot device'}</p></div>`;
  $$('li', el).forEach(li => li.onclick = () => { bm.sel = +li.dataset.i; BM_ITEMS[bm.sel].f(); });
}
function bmFail(m) { Snd.play('error'); renderBootMenu(m); }
function bootMenuKey(e) {
  if (e.key === 'ArrowDown') bm.sel = (bm.sel + 1) % BM_ITEMS.length;
  else if (e.key === 'ArrowUp') bm.sel = (bm.sel - 1 + BM_ITEMS.length) % BM_ITEMS.length;
  else if (e.key === 'Enter') { BM_ITEMS[bm.sel].f(); e.preventDefault(); return; }
  else if (e.key === 'Escape') { bootSplash(); return; }
  else return;
  e.preventDefault(); Snd.play('click'); renderBootMenu();
}

/* ---------- Recovery environment ---------- */
function openRecovery() {
  show('recovery');
  const el = $('#recovery');
  const tile = (id, ic, t, d) => `<button data-r="${id}" style="display:flex;gap:16px;align-items:center;text-align:left;padding:18px 20px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#fff;font-family:var(--f-ui)"><span style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:rgba(255,122,69,.15);color:#ff7a45;flex:none">${svg(ic)}</span><span><b style="font-size:15px">${t}</b><br><small style="color:#8d99a4">${d}</small></span></button>`;
  el.innerHTML = `<div style="width:min(720px,92vw);font-family:var(--f-ui);color:#fff;display:grid;gap:20px">
    <div style="display:flex;gap:14px;align-items:center"><div style="width:44px">${NLOGO}</div><div><div style="font-family:var(--f-display);font-size:22px">RestaurantOS Recovery</div><div style="color:#8d99a4;font-size:13px">Choose an option</div></div></div>
    <div id="recBody" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:12px">
      ${tile('cont', 'fwd', 'Continue', 'Exit and start RestaurantOS ' + osv())}
      ${tile('repair', 'settings', 'Startup Repair', 'Scan and fix problems that keep RestaurantOS from loading')}
      ${tile('reset', 'restart', 'Reset this PC', 'Erase all your files and settings and start fresh')}
      ${tile('bios', 'cpu', 'UEFI Firmware Settings', 'Change settings in the RestoTech BIOS')}
      ${tile('off', 'power', 'Turn off your PC', 'Shut down the computer')}
    </div></div>`;
  $$('[data-r]', el).forEach(b => { b.querySelector('svg').style.cssText = 'width:22px;height:22px'; b.onclick = () => recAction(b.dataset.r); });
}
async function recAction(a) {
  const body = $('#recBody');
  if (a === 'cont') return bootSplash();
  if (a === 'bios') return openBiosSetup();
  if (a === 'off') return powerOff();
  if (a === 'repair') {
    body.style.display = 'block';
    body.innerHTML = `<div style="padding:30px;border-radius:16px;background:rgba(255,255,255,.04)"><div id="rp" style="font-size:15px;margin-bottom:14px">Diagnosing your PC…</div><div class="prog" style="background:rgba(255,255,255,.1)"><i id="rpb"></i></div></div>`;
    const msgs = ['Checking disk NVMe0…', 'Verifying boot configuration…', 'Scanning system files (2,418 files)…', 'Checking registry hive integrity…', 'Repairing boot records…'];
    for (let i = 0; i <= 100; i += 2) { $('#rpb').style.width = i + '%'; if (i % 20 === 0) $('#rp').textContent = msgs[i / 20] || 'Finishing…'; await sleep(60); }
    Snd.play('success');
    $('#rp').innerHTML = '<b style="color:#3ddc97">Startup Repair finished.</b> No problems were found that prevent RestaurantOS from starting.';
    await sleep(1600); return openRecovery();
  }
  if (a === 'reset') {
    body.style.display = 'block';
    body.innerHTML = `<div style="padding:28px;border-radius:16px;background:rgba(255,255,255,.04)"><b style="font-size:17px">Reset this PC?</b><p style="color:#9aa6b2;line-height:1.6">This removes every file, setting and app you added, then restarts into RestaurantOS Setup. This can't be undone.</p><div style="display:flex;gap:10px"><button class="btn danger" id="rsY">Reset</button><button class="btn" id="rsN">Cancel</button></div></div>`;
    $('#rsN').onclick = openRecovery;
    $('#rsY').onclick = async () => {
      body.innerHTML = `<div style="padding:30px;border-radius:16px;background:rgba(255,255,255,.04)"><div style="margin-bottom:14px">Resetting this PC… <span id="rsp">0</span>%</div><div class="prog" style="background:rgba(255,255,255,.1)"><i id="rsb"></i></div></div>`;
      for (let i = 0; i <= 100; i++) { $('#rsb').style.width = i + '%'; $('#rsp').textContent = i; await sleep(30); }
      factoryReset();
    };
  }
}
function factoryReset() {
  Store.wipe(); S = Object.assign({}, DEF_SETTINGS); B = Object.assign({}, DEF_BIOS); FS.root = FS.seed();
  location.reload();
}

/* =====================================================================
   BOOT SPLASH
   ===================================================================== */
async function bootSplash() {
  show('boot');
  const wrap = $('#bootWrap'); const style = B.bootStyle;
  const ledCol = { Ember: '#ff7a45', Tide: '#2ec4b6', Rainbow: '#c77dff', Off: '#ffffff' }[B.led] || '#ff7a45';
  document.documentElement.style.setProperty('--ember', ledCol);
  if (IS2() && style !== 'Minimal') { wrap.innerHTML = bootV2Markup(); } else if (style === 'Minimal') {
    wrap.innerHTML = `<div class="boot-word" style="animation-delay:.2s">Restaurant<b>OS</b></div><div class="boot-loader" style="animation-delay:.4s"><i></i><i></i><i></i><i></i><i></i></div>`;
  } else {
    wrap.innerHTML = `<svg class="logo-mark" viewBox="0 0 132 132"><circle class="lm-ring" cx="66" cy="66" r="60" transform="rotate(-90 66 66)"/><path class="lm-n" d="M48 92V40h20a14 14 0 0 1 0 28H48 M66 68l20 24"/><circle class="lm-spark" cx="98" cy="34" r="7"/></svg>
    <div style="display:grid;gap:10px;justify-items:center"><div class="boot-word">Restaurant<b>OS</b></div><div class="boot-sub">${osv()}</div></div>
    ${style === 'Classic Bar' ? '<div class="boot-bar"><i id="bootBar"></i></div>' : '<div class="boot-loader"><i></i><i></i><i></i><i></i><i></i></div>'}
    <div class="boot-msg" id="bootMsg"></div>`;
  }
  const msgs = ['Starting kernel…', 'Loading drivers…', 'Mounting RestoFS…', 'Starting compositor…', 'Preparing desktop…'];
  const total = B.fastBoot ? 2600 : 4400;
  for (let i = 0; i < 20; i++) {
    await sleep(total / 20);
    const bar = $('#bootBar'); if (bar) bar.style.width = ((i + 1) * 5) + '%';
    const m = $('#bootMsg'); if (m && i > 8) m.textContent = msgs[Math.min(msgs.length - 1, Math.floor((i - 8) / 2.4))];
  }
  FS.load();
  if (Store.get('updating', null)) updaterScreen(); else if (!S.setupDone) startOOBE(); else if (Store.get('justUpdated', false)) postUpdateHello(); else showLock(true);
}

/* =====================================================================
   OOBE / SETUP
   ===================================================================== */
const OOBE_STEPS = ['Welcome', 'Region', 'Network', 'Account', 'Privacy', 'Personalize', 'Finish'];
let ob = { step: 0, data: {} };
let oobeAnim = null;
function startOOBE() {
  show('oobe');
  ob = { step: 0, data: { name: '', pass: '', pass2: '', hint: '', device: 'RESTO-PC', avatar: 0, wifi: null, theme: 'dark', accent: '#ff7a45', wallpaper: 'ember', region: 'United States', kb: 'US', lang: 'English (US)', privacy: { location: true, diag: false, tailored: false, findDevice: true } } };
  const el = $('#oobe');
  el.querySelector('.oobe-card')?.remove();
  el.appendChild(html(`<div class="oobe-card"><aside class="oobe-side"><div class="brand">Restaurant<b>OS</b></div><ol class="oobe-steps">${OOBE_STEPS.map(s => `<li>${s}</li>`).join('')}</ol><div style="margin-top:auto;font-size:12px;color:#6f7c86;line-height:1.6">Setup takes about a minute. You can change all of this later in Settings.</div></aside><main class="oobe-main" id="oobeMain"></main></div>`));
  oobeCanvas(); renderOOBE();
}
function oobeCanvas() {
  const c = $('#oobeCanvas'), x = c.getContext('2d');
  const blobs = Array.from({ length: 6 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: rand(.25, .45), dx: rand(-.0006, .0006), dy: rand(-.0006, .0006), c: ['#ff7a45', '#2ec4b6', '#7a1f3d', '#1b4965', '#ffb38a', '#3a2b6b'][i] }));
  cancelAnimationFrame(oobeAnim);
  const f = () => {
    if (STAGE !== 'oobe') return;
    c.width = innerWidth / 3; c.height = innerHeight / 3;
    x.fillStyle = '#05080a'; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      b.x += b.dx; b.y += b.dy; if (b.x < 0 || b.x > 1) b.dx *= -1; if (b.y < 0 || b.y > 1) b.dy *= -1;
      const R = b.r * Math.max(c.width, c.height); const g = x.createRadialGradient(b.x * c.width, b.y * c.height, 0, b.x * c.width, b.y * c.height, R);
      g.addColorStop(0, b.c + '66'); g.addColorStop(1, b.c + '00'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    }
    x.globalCompositeOperation = 'source-over';
    oobeAnim = requestAnimationFrame(f);
  };
  f();
}
let helloTimer = null;
function renderOOBE() {
  const m = $('#oobeMain'); const d = ob.data; const st = OOBE_STEPS[ob.step];
  $$('.oobe-steps li').forEach((li, i) => { li.className = i === ob.step ? 'on' : i < ob.step ? 'done' : ''; });
  clearInterval(helloTimer);
  const nav = (nextLabel = 'Next', back = true, dis = false) => `<div class="oobe-nav">${back ? '<button class="btn" id="obBack">Back</button>' : '<span></span>'}<button class="btn primary" id="obNext" ${dis ? 'disabled' : ''}>${nextLabel}</button></div>`;
  const sel = (id, opts, v) => `<select class="inp" id="${id}">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  let body = '';
  if (st === 'Welcome') {
    body = `<div class="oobe-pane"><div class="hello-word" id="helloW">Hello</div><h2>Welcome to RestaurantOS</h2><p class="lead">A fresh start for your computer. Let's set up a few things so it feels like yours.</p>
    <div class="field" style="max-width:320px"><label for="obLang">Language</label>${sel('obLang', ['English (US)', 'English (UK)', 'Deutsch', 'Español', 'Français', 'Italiano', 'Polski', 'Português', '日本語'], d.lang)}</div></div>${nav("Let's go", false)}`;
  } else if (st === 'Region') {
    body = `<div class="oobe-pane"><h2>Is this the right country or region?</h2><p class="lead">This sets formats for dates, times, and the weather location.</p>
    <div class="field"><label for="obRegion">Country or region</label>${sel('obRegion', ['United States', 'United Kingdom', 'Germany', 'Poland', 'France', 'Spain', 'Italy', 'Japan', 'Canada', 'Australia', 'Brazil', 'India'], d.region)}</div>
    <div class="field"><label for="obKb">Keyboard layout</label>${sel('obKb', ['US', 'UK', 'German (QWERTZ)', 'French (AZERTY)', 'Polish (Programmer)', 'Spanish', 'Japanese'], d.kb)}</div></div>${nav()}`;
  } else if (st === 'Network') {
    const nets = [['RestoNet 5G', 4, true], ['Bistro_Home', 3, true], ['CoffeeShop Free', 2, false], ['Starlink-7F2A', 3, true], ['DIRECT-Printer', 1, true]];
    body = `<div class="oobe-pane"><h2>Let's connect you to a network</h2><p class="lead">You'll need the internet for updates and RestoStore. Pick a network below.</p>
    <div class="wifi-list">${nets.map(([n, s, sec]) => `<button class="wifi-item ${d.wifi === n ? 'on' : ''}" data-n="${n}" data-sec="${sec}">${svg('wifi')}<div><b>${n}</b><small>${sec ? 'Secured' : 'Open'} · ${['Weak', 'Fair', 'Good', 'Excellent'][s - 1]}</small></div><span class="st">${d.wifi === n ? 'Connected' : ''}</span></button>`).join('')}</div>
    <div id="wifiPw" style="margin-top:14px"></div></div>${nav(d.wifi ? 'Next' : 'Skip for now')}`;
  } else if (st === 'Account') {
    body = `<div class="oobe-pane"><h2>Who's going to use this PC?</h2><p class="lead">Your name appears on the lock screen and in the Start menu. A password is optional.</p>
    <div class="field"><label for="obName">Your name</label><input class="inp" id="obName" maxlength="24" placeholder="e.g. Alex" value="${esc(d.name)}" autocomplete="off"></div>
    <div class="row" style="align-items:start"><div class="field grow"><label for="obPass">Password (optional)</label><input class="inp" type="password" id="obPass" value="${esc(d.pass)}"></div><div class="field grow"><label for="obPass2">Confirm password</label><input class="inp" type="password" id="obPass2" value="${esc(d.pass2)}"></div></div>
    <div class="field"><label for="obHint">Password hint</label><input class="inp" id="obHint" value="${esc(d.hint)}" placeholder="Something only you would know"></div>
    <div class="field"><label>Pick an avatar color</label><div class="avatar-grid">${AVATARS.map((_, i) => `<button style="border:0;background:none;padding:0" data-av="${i}">${avatarEl(i === d.avatar ? 'on' : '', i, d.name || 'N')}</button>`).join('')}</div></div>
    <div id="obErr" style="color:var(--bad);font-size:13px;min-height:18px"></div></div>${nav('Next', true, !d.name.trim())}`;
  } else if (st === 'Privacy') {
    const t = (k, title, desc) => `<div class="toggle-row"><div><b>${title}</b><small>${desc}</small></div><input type="checkbox" class="sw-t" data-p="${k}" ${d.privacy[k] ? 'checked' : ''} aria-label="${title}"></div>`;
    body = `<div class="oobe-pane"><h2>Choose privacy settings for your device</h2><p class="lead">RestaurantOS keeps everything on this device. These switches control which features use your data.</p>
    ${t('location', 'Location', 'Lets Weather and Clock show local information.')}
    ${t('findDevice', 'Find my device', 'Helps locate this PC if it is lost.')}
    ${t('diag', 'Diagnostic data', 'Send optional reports about crashes and performance.')}
    ${t('tailored', 'Tailored experiences', 'Get tips and suggestions based on how you use RestaurantOS.')}</div>${nav('Accept')}`;
  } else if (st === 'Personalize') {
    const accents = ['#ff7a45', '#2ec4b6', '#4cc9f0', '#c77dff', '#ff4d6d', '#ffd166', '#3ddc97', '#e5e5e5'];
    const walls = ['ember', 'tide', 'aurora', 'dune', 'midnight', 'glacier'];
    body = `<div class="oobe-pane"><h2>Make it yours</h2><p class="lead">Pick a look. Everything here can be changed later in Settings › Personalization.</p>
    <div class="choice-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${['dark', 'light'].map(t => `<button class="choice ${d.theme === t ? 'on' : ''}" data-theme="${t}"><div class="sw" style="background:${t === 'dark' ? 'linear-gradient(135deg,#11161b,#232b33)' : 'linear-gradient(135deg,#f3f5f7,#d9dfe5)'};display:grid;place-items:center"><div style="width:60%;height:50%;border-radius:6px;background:${t === 'dark' ? 'rgba(40,46,54,.9)' : 'rgba(255,255,255,.95)'};box-shadow:0 4px 10px rgba(0,0,0,.2)"></div></div><b>${t === 'dark' ? 'Dark' : 'Light'}</b></button>`).join('')}</div>
    <div class="field" style="margin-top:18px"><label>Accent color</label><div class="row">${accents.map(a => `<button class="swatch ${d.accent === a ? 'on' : ''}" data-acc="${a}" style="background:${a}" aria-label="Accent ${a}"></button>`).join('')}</div></div>
    <div class="field"><label>Wallpaper</label><div class="wp-grid" style="grid-template-columns:repeat(auto-fill,minmax(90px,1fr))">${walls.map(w => `<div class="wp-thumb ${d.wallpaper === w ? 'on' : ''}" data-wp="${w}" style="background:${WALLS[w].css}"><span>${WALLS[w].name}</span></div>`).join('')}</div></div></div>${nav()}`;
  } else if (st === 'Finish') {
    body = `<div class="oobe-pane finish-wrap"><div class="finish-ring"></div><div class="finish-msg" id="finMsg">Hi, ${esc(d.name)}</div><div class="muted" style="font-size:13px">Don't turn off your PC</div><div class="prog" style="max-width:300px"><i id="finBar"></i></div></div>`;
  }
  m.innerHTML = body;
  // wire
  const back = $('#obBack'), next = $('#obNext');
  if (back) back.onclick = () => { Snd.play('click'); ob.step--; renderOOBE(); };
  if (next) next.onclick = () => { if (validateStep()) { Snd.play('click'); ob.step++; renderOOBE(); } };
  if (st === 'Welcome') {
    const words = ['Hello', 'Hola', 'Bonjour', 'Cześć', 'Hallo', 'Ciao', 'こんにちは', 'Olá', 'Привет', 'Merhaba'];
    let i = 0; helloTimer = setInterval(() => { const w = $('#helloW'); if (!w) return; w.classList.add('out'); setTimeout(() => { w.textContent = words[++i % words.length]; w.classList.remove('out'); }, 450); }, 2200);
    $('#obLang').onchange = e => d.lang = e.target.value;
  }
  if (st === 'Region') { $('#obRegion').onchange = e => d.region = e.target.value; $('#obKb').onchange = e => d.kb = e.target.value; }
  if (st === 'Network') $$('.wifi-item').forEach(b => b.onclick = () => {
    const n = b.dataset.n, sec = b.dataset.sec === 'true';
    const connect = async () => { b.querySelector('.st').textContent = 'Connecting…'; await sleep(1200); d.wifi = n; Snd.play('success'); renderOOBE(); };
    if (!sec) return connect();
    $('#wifiPw').innerHTML = `<div class="field"><label for="wpw">Network security key for ${esc(n)}</label><div class="row"><input class="inp grow" id="wpw" type="password" placeholder="At least 8 characters"><button class="btn primary" id="wgo">Connect</button></div><small id="werr" style="color:var(--bad)"></small></div>`;
    $('#wpw').focus();
    const go = () => { if ($('#wpw').value.length < 8) { $('#werr').textContent = 'The key must be at least 8 characters.'; Snd.play('error'); return; } $('#wifiPw').innerHTML = ''; connect(); };
    $('#wgo').onclick = go; $('#wpw').onkeydown = e => e.key === 'Enter' && go();
  });
  if (st === 'Account') {
    const upd = () => { d.name = $('#obName').value; d.pass = $('#obPass').value; d.pass2 = $('#obPass2').value; d.hint = $('#obHint').value; $('#obNext').disabled = !d.name.trim(); };
    ['obName', 'obPass', 'obPass2', 'obHint'].forEach(id => $('#' + id).oninput = upd);
    $('#obName').onchange = () => renderOOBE();
    $$('[data-av]').forEach(b => b.onclick = () => { upd(); d.avatar = +b.dataset.av; renderOOBE(); });
    setTimeout(() => $('#obName')?.focus(), 50);
  }
  if (st === 'Privacy') $$('[data-p]').forEach(c => c.onchange = () => { d.privacy[c.dataset.p] = c.checked; Snd.play('toggle'); });
  if (st === 'Personalize') {
    $$('[data-theme]').forEach(b => b.onclick = () => { d.theme = b.dataset.theme; renderOOBE(); });
    $$('[data-acc]').forEach(b => b.onclick = () => { d.accent = b.dataset.acc; applyAccent(d.accent); renderOOBE(); });
    $$('[data-wp]').forEach(b => b.onclick = () => { d.wallpaper = b.dataset.wp; renderOOBE(); });
  }
  if (st === 'Finish') finishOOBE();
}
function validateStep() {
  const d = ob.data;
  if (OOBE_STEPS[ob.step] === 'Account') {
    if (!d.name.trim()) return false;
    if (d.pass !== d.pass2) { $('#obErr').textContent = "Passwords don't match."; Snd.play('error'); return false; }
  }
  return true;
}
async function finishOOBE() {
  const d = ob.data;
  Object.assign(S, { user: d.name.trim(), pass: d.pass, hint: d.hint, avatar: d.avatar, theme: d.theme, accent: d.accent, wallpaper: d.wallpaper, region: d.region, kb: d.kb, lang: d.lang, privacy: d.privacy, wifi: !!d.wifi, wifiName: d.wifi || 'RestoNet 5G' });
  S.city = { 'United States': 'New York', 'United Kingdom': 'London', Germany: 'Berlin', Poland: 'Warsaw', France: 'Paris', Spain: 'Madrid', Italy: 'Rome', Japan: 'Tokyo', Canada: 'Toronto', Australia: 'Sydney', Brazil: 'São Paulo', India: 'Mumbai' }[d.region] || 'Berlin';
  const msgs = [`Hi, ${d.name.trim()}`, 'Setting up your desktop', 'Installing apps', 'Applying your theme', "You're all set"];
  for (let i = 0; i <= 100; i++) {
    const bar = $('#finBar'); if (!bar) return; bar.style.width = i + '%';
    if (i % 20 === 0) { const m = $('#finMsg'); m.style.opacity = 0; await sleep(250); m.textContent = msgs[i / 20] || msgs[4]; m.style.opacity = 1; }
    await sleep(45);
  }
  S.setupDone = true; saveS(); FS.save();
  await sleep(500);
  enterDesktop(true);
}

/* =====================================================================
   LOCK SCREEN
   ===================================================================== */
let lockTick = null;
function showLock(fromBoot = false) {
  show('lock');
  const el = $('#lock'); el.classList.remove('auth');
  const w = WALLS[S.wallpaper] || WALLS.ember;
  el.innerHTML = `<div class="wp" style="background:${S.wallpaper === 'custom' && CUSTOM_WP ? `url(${CUSTOM_WP}) center/cover` : w.css}"></div>
  <div class="lock-clock"><div class="lock-time" id="lkT"></div><div class="lock-date" id="lkD"></div></div>
  <div class="lock-widgets"><div>${svg('weather')}<span>${esc(S.city)} · ${Weather.now().temp}° ${Weather.now().cond}</span></div><div>${svg('bat')}<span id="lkBat">${Batt.level}%</span></div><div>${svg('bell')}<span>${NOTIFS.length} notifications</span></div></div>
  <div class="lock-hint">Click or press any key to sign in</div>
  <div class="lock-auth"><div class="card">${avatarEl()}<h3>${esc(S.user || 'User')}</h3>
    ${S.pass ? `<div class="pw-row"><input class="inp" type="password" id="lkPw" placeholder="Password" aria-label="Password"><button class="btn primary" id="lkGo" aria-label="Sign in">${svg('fwd')}</button></div><small id="lkHint" style="opacity:.8;min-height:16px"></small>` : `<button class="btn primary" id="lkGo" style="min-width:160px">Sign in</button>`}
  </div></div>
  <div class="lock-power"><button class="icon-btn" id="lkRestart" title="Restart" aria-label="Restart">${svg('restart')}</button><button class="icon-btn" id="lkOff" title="Shut down" aria-label="Shut down">${svg('power')}</button></div>`;
  $$('.lock-widgets svg').forEach(s => s.style.cssText = 'width:16px;height:16px');
  const tick = () => { if (!$('#lkT')) return; $('#lkT').textContent = fmtTime(new Date(), false); $('#lkD').textContent = fmtDate(); };
  tick(); clearInterval(lockTick); lockTick = setInterval(tick, 1000);
  const reveal = (e) => { if (el.classList.contains('auth')) return; if (e && e.target.closest('.lock-power')) return; el.classList.add('auth'); Snd.play('click'); setTimeout(() => $('#lkPw')?.focus(), 400); };
  el.onclick = reveal; lockReveal = reveal;
  $('#lkRestart').onclick = e => { e.stopPropagation(); restart(); };
  $('#lkOff').onclick = e => { e.stopPropagation(); powerOff(); };
  let tries = 0;
  const go = () => {
    if (S.pass && $('#lkPw').value !== S.pass) {
      tries++; Snd.play('error'); const r = $('.pw-row'); r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake');
      $('#lkHint').textContent = 'Incorrect password.' + (S.hint && tries > 1 ? ' Hint: ' + S.hint : ''); $('#lkPw').select(); return;
    }
    Snd.play('unlock'); clearInterval(lockTick);
    enterDesktop(fromBoot);
    fromBoot = false;
  };
  $('#lkGo').onclick = e => { e.stopPropagation(); go(); };
  $('#lkPw') && ($('#lkPw').onkeydown = e => { if (e.key === 'Enter') go(); });
}
let lockReveal = null;
