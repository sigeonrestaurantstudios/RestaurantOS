/* =====================================================================
   Apps (2/3): Paint, Music, Photos, Clock, Calendar, Weather,
   Task Manager, Code Studio, To Do, Sticky Notes, RestoStore, Nova,
   Tips, Converter, Piano
   ===================================================================== */

/* ---------------- PAINT ---------------- */
defApp({
  id: 'paint', name: 'Paint', glyph: 'paint', colors: ['#ff4d6d', '#c77dff'], w: 960, h: 640, cat: 'Media', desc: 'Draw, sketch and save pictures', kw: 'draw sketch art',
  run(w, args) {
    let tool = 'brush', color = '#ff7a45', size = 6, path = args.path || null; const undo = [], redo = [];
    const PAL = ['#000000', '#ffffff', '#6b7280', '#ff5d6c', '#ff7a45', '#ffd166', '#3ddc97', '#2ec4b6', '#4cc9f0', '#3a56d4', '#c77dff', '#ff4d9d', '#8b5a2b', '#1f2937'];
    const tools = [['brush', 'brush', 'Brush (B)'], ['eraser', 'eraser', 'Eraser (E)'], ['line', 'line', 'Line (L)'], ['rect', 'rect', 'Rectangle (R)'], ['circle', 'circle', 'Ellipse (O)'], ['fill', 'fill', 'Fill (F)'], ['text', 'text', 'Text (T)'], ['spray', 'star', 'Spray (S)']];
    w.body.innerHTML = `<div class="app-tb">${tools.map(([t, ic, l]) => `<button class="tbtn" data-tool="${t}" title="${l}">${svg(ic)}</button>`).join('')}<span class="sep"></span>
      <div class="pal">${PAL.map(c => `<i data-c="${c}" style="background:${c}"></i>`).join('')}</div><input type="color" value="${color}" aria-label="Custom color" style="width:30px;height:28px;border:0;background:none;padding:0">
      <span class="sep"></span><input type="range" min="1" max="60" value="${size}" style="width:90px" aria-label="Brush size"><span class="muted sz" style="font-size:12px;width:28px">${size}px</span><span class="sep"></span>
      <button class="tbtn" data-a="undo" title="Undo (Ctrl+Z)">${svg('undo')}</button><button class="tbtn" data-a="redo" title="Redo (Ctrl+Y)">${svg('redo')}</button><button class="tbtn" data-a="clear" title="Clear">${svg('trash')}</button><button class="tbtn" data-a="open" title="Open">${svg('open')}</button><button class="tbtn" data-a="save" title="Save (Ctrl+S)">${svg('save')}</button></div>
      <div class="paint-wrap"><canvas width="1000" height="620"></canvas></div><div class="statusbar"><span class="pos">0, 0</span><span>1000 × 620 px</span><span class="pf" style="margin-left:auto"></span></div>`;
    const cv = $('canvas', w.body), x = cv.getContext('2d', { willReadFrequently: true });
    const fit = () => { const wrap = $('.paint-wrap', w.body); const s = Math.min(1, (wrap.clientWidth - 32) / cv.width, (wrap.clientHeight - 32) / cv.height); cv.style.width = cv.width * s + 'px'; cv.style.height = cv.height * s + 'px'; };
    w.onResize = fit; setTimeout(fit, 50);
    const blank = () => { x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); };
    blank();
    const snap = () => { undo.push(x.getImageData(0, 0, cv.width, cv.height)); if (undo.length > 30) undo.shift(); redo.length = 0; };
    const loadImg = src => { const im = new Image(); im.onload = () => { cv.width = Math.min(1600, im.width); cv.height = Math.min(1200, im.height); blank(); x.drawImage(im, 0, 0, cv.width, cv.height); fit(); $('.statusbar span:nth-child(2)', w.body).textContent = `${cv.width} × ${cv.height} px`; }; im.src = src; };
    if (path) { const d = FS.read(path); if (d) loadImg(d); w.setTitle(FS.parts(path).pop() + ' — Paint'); }
    const setTool = t => { tool = t; $$('[data-tool]', w.body).forEach(b => b.classList.toggle('on', b.dataset.tool === t)); cv.style.cursor = t === 'text' ? 'text' : 'crosshair'; };
    const setColor = c => { color = c; $$('.pal i', w.body).forEach(i => i.classList.toggle('on', i.dataset.c === c)); $('input[type=color]', w.body).value = c.length === 7 ? c : '#000000'; };
    setTool('brush'); setColor(color);
    const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * cv.width / r.width), Math.round((e.clientY - r.top) * cv.height / r.height)]; };
    const flood = (sx, sy) => {
      const img = x.getImageData(0, 0, cv.width, cv.height), d = img.data, W = cv.width, H = cv.height; const i0 = (sy * W + sx) * 4;
      const [tr, tg, tb] = [d[i0], d[i0 + 1], d[i0 + 2]]; const [fr, fg, fb] = hexToRgb(color); if (tr === fr && tg === fg && tb === fb) return;
      const match = i => Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) < 48;
      const st = [[sx, sy]];
      while (st.length) { let [cx, cy] = st.pop(); let i = (cy * W + cx) * 4; while (cy >= 0 && match(i)) { cy--; i -= W * 4; } cy++; i += W * 4; let L = false, R = false;
        while (cy < H && match(i)) { d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
          if (cx > 0) { if (match(i - 4)) { if (!L) { st.push([cx - 1, cy]); L = true; } } else L = false; }
          if (cx < W - 1) { if (match(i + 4)) { if (!R) { st.push([cx + 1, cy]); R = true; } } else R = false; }
          cy++; i += W * 4; } }
      x.putImageData(img, 0, 0);
    };
    let down = false, start, base, lastP;
    cv.onpointerdown = async e => {
      cv.setPointerCapture(e.pointerId); const p = pt(e); snap();
      if (tool === 'fill') { flood(p[0], p[1]); return; }
      if (tool === 'text') { const t = await UI.prompt('Add text', 'Type the text to place on the canvas:'); if (t) { x.fillStyle = color; x.font = `600 ${size * 4}px Outfit, sans-serif`; x.fillText(t, p[0], p[1]); } else undo.pop(); return; }
      down = true; start = lastP = p; base = x.getImageData(0, 0, cv.width, cv.height);
      x.lineCap = x.lineJoin = 'round'; x.lineWidth = size; x.strokeStyle = tool === 'eraser' ? '#fff' : color; x.fillStyle = color;
      if (tool === 'brush' || tool === 'eraser') { x.beginPath(); x.arc(p[0], p[1], size / 2, 0, 7); x.fillStyle = x.strokeStyle; x.fill(); }
    };
    cv.onpointermove = e => {
      const p = pt(e); $('.pos', w.body).textContent = p.join(', ');
      if (!down) return;
      if (tool === 'brush' || tool === 'eraser') { x.beginPath(); x.moveTo(...lastP); x.lineTo(...p); x.stroke(); lastP = p; }
      else if (tool === 'spray') { for (let i = 0; i < size * 2; i++) { const a = Math.random() * 7, r = Math.random() * size * 1.5; x.fillRect(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r, 1.5, 1.5); } }
      else { x.putImageData(base, 0, 0); x.beginPath();
        if (tool === 'line') { x.moveTo(...start); x.lineTo(...p); }
        if (tool === 'rect') x.rect(start[0], start[1], p[0] - start[0], p[1] - start[1]);
        if (tool === 'circle') x.ellipse((start[0] + p[0]) / 2, (start[1] + p[1]) / 2, Math.abs(p[0] - start[0]) / 2, Math.abs(p[1] - start[1]) / 2, 0, 0, 7);
        e.shiftKey && tool !== 'line' ? x.fill() : x.stroke(); }
    };
    cv.onpointerup = () => { down = false; $('.pf', w.body).textContent = path ? 'Unsaved changes' : ''; };
    const save = async () => {
      if (!path) { const n = await UI.prompt('Save drawing', 'Name your picture:', FS.uniq('/Pictures', 'Drawing.png')); if (!n) return; path = '/Pictures/' + (n.endsWith('.png') ? n : n + '.png'); }
      const tmp = document.createElement('canvas'); const s = Math.min(1, 1200 / cv.width); tmp.width = cv.width * s; tmp.height = cv.height * s; tmp.getContext('2d').drawImage(cv, 0, 0, tmp.width, tmp.height);
      if (FS.write(path, tmp.toDataURL('image/png'))) { w.setTitle(FS.parts(path).pop() + ' — Paint'); $('.pf', w.body).textContent = 'Saved to ' + path; notify('Picture saved', path + ' was saved.', 'paint', { open: () => openPath(path) }); }
    };
    const act = async a => {
      if (a === 'undo' && undo.length) { redo.push(x.getImageData(0, 0, cv.width, cv.height)); x.putImageData(undo.pop(), 0, 0); }
      if (a === 'redo' && redo.length) { undo.push(x.getImageData(0, 0, cv.width, cv.height)); x.putImageData(redo.pop(), 0, 0); }
      if (a === 'clear') { snap(); blank(); }
      if (a === 'save') save();
      if (a === 'open') { const p = await pickFile('Open picture', f => /^data:image/.test(f.node.d || '')); if (p) { path = p; loadImg(FS.read(p)); w.setTitle(FS.parts(p).pop() + ' — Paint'); } }
    };
    $$('[data-tool]', w.body).forEach(b => b.onclick = () => setTool(b.dataset.tool));
    $$('.pal i', w.body).forEach(i => i.onclick = () => setColor(i.dataset.c));
    $('input[type=color]', w.body).oninput = e => setColor(e.target.value);
    const rg = $('input[type=range]', w.body); const upr = () => rg.style.setProperty('--p', (size / 60 * 100) + '%'); upr();
    rg.oninput = () => { size = +rg.value; $('.sz', w.body).textContent = size + 'px'; upr(); };
    $$('[data-a]', w.body).forEach(b => b.onclick = () => act(b.dataset.a));
    winKeys(w, e => { if (e.target.closest('input,textarea')) return; if (e.ctrlKey && e.key === 'z') { e.preventDefault(); act('undo'); } else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); act('redo'); } else if (e.ctrlKey && e.key === 's') { e.preventDefault(); act('save'); } else { const m = { b: 'brush', e: 'eraser', l: 'line', r: 'rect', o: 'circle', f: 'fill', t: 'text', s: 'spray' }[e.key]; if (m && !e.ctrlKey) setTool(m); } });
  }
});

/* ---------------- MUSIC ---------------- */
const TRACKS = [
  { name: 'Ember Drift', artist: 'RestaurantOS Sound Lab', bpm: 92, root: 57, prog: [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-2, 2, 5]], mel: [12, null, 10, null, 7, null, 10, 12, 15, null, 12, null, 10, 7, null, null], c: ['#ff7a45', '#7a1f3d'], lead: 'triangle' },
  { name: 'Tidal Lines', artist: 'RestaurantOS Sound Lab', bpm: 108, root: 50, prog: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], mel: [7, 9, 12, null, 14, 12, 9, null, 7, null, 4, 7, 9, null, null, null], c: ['#2ec4b6', '#1b4965'], lead: 'sine' },
  { name: 'Neon Circuit', artist: 'RestaurantOS Sound Lab', bpm: 124, root: 45, prog: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]], mel: [12, 12, 15, 12, 19, null, 17, 15, 12, null, 10, 12, 15, null, 12, null], c: ['#c77dff', '#3a56d4'], lead: 'square' },
  { name: 'Midnight Bloom', artist: 'RestaurantOS Sound Lab', bpm: 76, root: 53, prog: [[0, 4, 7, 11], [-3, 0, 4, 7], [2, 5, 9, 12], [-5, -1, 2, 5]], mel: [16, null, null, 14, 12, null, 11, null, 9, null, 7, null, 11, null, null, null], c: ['#ff4d6d', '#3a2b6b'], lead: 'sine' }
];
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
defApp({
  id: 'music', name: 'Music', glyph: 'music', colors: ['#ff4d6d', '#a4133c'], w: 860, h: 560, cat: 'Media', single: true, desc: 'Generative music player with visualizer', kw: 'player audio songs',
  run(w, args) {
    Snd.init(); const ctx = Snd.ctx; if (!ctx) { w.body.innerHTML = '<div class="empty">Audio is not available in this browser.</div>'; return; }
    const gain = ctx.createGain(), an = ctx.createAnalyser(); an.fftSize = 256; gain.connect(an); an.connect(ctx.destination);
    const vol = () => gain.gain.value = (S.volume / 100) * .7; vol(); onWin(w, 'settings', vol);
    let ti = 0, playing = false, step = 0, nextT = 0, timer = 0, startedAt = 0, elapsed = 0, shuffle = false, audioEl = null, raf = 0;
    const noise = (() => { const b = ctx.createBuffer(1, ctx.sampleRate * .3, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
    const len = t => 16 * 4 * 60 / t.bpm;
    const note = (f, t, d, type, v, filt) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); if (filt) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filt; o.connect(fl); fl.connect(g); } else o.connect(g); g.connect(gain); o.start(t); o.stop(t + d + .05); };
    const drum = (kind, t) => {
      if (kind === 'k') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .15); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + .3); o.connect(g); g.connect(gain); o.start(t); o.stop(t + .3); }
      else { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 7000 : 1800; g.gain.setValueAtTime(kind === 'h' ? .12 : .3, t); g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'h' ? .05 : .18)); s.connect(f); f.connect(g); g.connect(gain); s.start(t); s.stop(t + .2); }
    };
    const sched = () => {
      const t = TRACKS[ti], sp = 60 / t.bpm / 4;
      while (nextT < ctx.currentTime + .12) {
        const bar = Math.floor(step / 16) % 4, s = step % 16, ch = t.prog[bar];
        if (s === 0) ch.forEach(n => note(midi(t.root + 12 + n), nextT, sp * 15, 'sawtooth', .035, 1400));
        if (s % 4 === 0 || s === 6 || s === 14) note(midi(t.root - 12 + ch[0]), nextT, sp * 1.8, 'triangle', .22);
        const m = t.mel[(s + (bar % 2) * 3) % 16]; if (m != null && step >= 64) note(midi(t.root + 12 + m + ch[0] * 0), nextT, sp * 2.5, t.lead, .07, t.lead === 'square' ? 2400 : null);
        if (s % 4 === 0) drum('k', nextT); if (s % 8 === 4) drum('s', nextT); if (s % 2 === 0 && t.bpm > 80) drum('h', nextT);
        nextT += sp; step++;
      }
      if (elapsed + (ctx.currentTime - startedAt) >= len(t)) next();
    };
    const play = () => { if (audioEl) { audioEl.play(); playing = true; return ui(); } if (playing) return; playing = true; if (ctx.state === 'suspended') ctx.resume(); nextT = ctx.currentTime + .05; startedAt = ctx.currentTime; timer = setInterval(sched, 25); ui(); };
    const pause = () => { if (audioEl) { audioEl.pause(); playing = false; return ui(); } if (!playing) return; playing = false; clearInterval(timer); elapsed += ctx.currentTime - startedAt; ui(); };
    const load = (i, auto = true) => { stopEl(); const was = playing || auto; pause(); ti = (i + TRACKS.length) % TRACKS.length; step = 0; elapsed = 0; if (was) play(); ui(); };
    const next = () => load(shuffle ? Math.floor(Math.random() * TRACKS.length) : ti + 1);
    const stopEl = () => { if (audioEl) { audioEl.pause(); audioEl.remove(); audioEl = null; } };
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    w.body.innerHTML = `<div class="music"><div class="mu-now"><canvas class="mu-art" width="200" height="200"></canvas><div style="text-align:center"><div class="mu-title" style="font-family:var(--f-display);font-size:20px;font-weight:600"></div><div class="mu-artist muted"></div></div>
      <div class="mu-prog"><span class="t0">0:00</span><div class="prog grow"><i></i></div><span class="t1">0:00</span></div>
      <div class="mu-ctrl"><button data-a="shuf" title="Shuffle">${svg('shuffle')}</button><button data-a="prev" title="Previous"><svg viewBox="0 0 24 24"><path d="M19 5L9 12l10 7z M5 5h2.5v14H5z"/></svg></button><button class="play" data-a="play" title="Play"></button><button data-a="next" title="Next"><svg viewBox="0 0 24 24"><path d="M5 5l10 7-10 7z M16.5 5H19v14h-2.5z"/></svg></button><label class="tbtn" title="Play a file from your computer" style="cursor:pointer">${svg('open')}<input type="file" accept="audio/*" hidden></label></div>
      <canvas class="mu-viz"></canvas></div><div class="mu-list"><div class="sh muted" style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:6px 8px">Up next</div></div></div>`;
    const list = $('.mu-list', w.body);
    const ui = () => {
      const t = TRACKS[ti];
      $('.mu-title', w.body).textContent = audioEl ? audioEl.dataset.name : t.name; $('.mu-artist', w.body).textContent = audioEl ? 'Local file' : t.artist + ' · ' + t.bpm + ' BPM';
      $('[data-a=play]', w.body).innerHTML = playing ? '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7z M13.5 5H17v14h-3.5z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      $('[data-a=shuf]', w.body).style.color = shuffle ? 'var(--accent)' : '';
      list.querySelectorAll('.mu-track').forEach(e => e.remove());
      TRACKS.forEach((tr, i) => { const e = html(`<div class="mu-track ${i === ti && !audioEl ? 'on' : ''}"><i style="background:linear-gradient(135deg,${tr.c[0]},${tr.c[1]})"></i><div><div>${tr.name}</div><small class="muted">${fmt(len(tr))}</small></div></div>`); e.onclick = () => load(i); list.appendChild(e); });
      w.setTitle((playing ? '▶ ' : '') + (audioEl ? audioEl.dataset.name : t.name) + ' — Music');
      Live.set('music', playing ? { icon: 'music', text: audioEl ? audioEl.dataset.name : t.name, sub: 'Now playing', bars: true, open: () => WM.focus(w) } : null);
    };
    const art = $('.mu-art', w.body).getContext('2d'), vc = $('.mu-viz', w.body), vx = vc.getContext('2d'); const data = new Uint8Array(an.frequencyBinCount);
    const draw = () => {
      raf = requestAnimationFrame(draw); an.getByteFrequencyData(data);
      const t = TRACKS[ti], bass = data.slice(0, 6).reduce((a, b) => a + b, 0) / 6 / 255, tm = performance.now() / 1000;
      const g = art.createLinearGradient(0, 0, 200, 200); g.addColorStop(0, t.c[0]); g.addColorStop(1, t.c[1]); art.fillStyle = g; art.fillRect(0, 0, 200, 200);
      for (let i = 0; i < 5; i++) { art.beginPath(); art.arc(100 + Math.cos(tm * .5 + i) * 40, 100 + Math.sin(tm * .7 + i * 2) * 40, 20 + bass * 50 + i * 6, 0, 7); art.fillStyle = `rgba(255,255,255,${.05 + bass * .12})`; art.fill(); }
      art.fillStyle = 'rgba(255,255,255,.9)'; art.font = '600 20px Unbounded, sans-serif'; art.fillText((audioEl ? 'LOCAL' : t.name.split(' ')[0]).toUpperCase(), 16, 184);
      vc.width = vc.clientWidth; vc.height = vc.clientHeight; const bw = vc.width / data.length * 1.6;
      for (let i = 0; i < data.length / 1.6; i++) { const h = data[i] / 255 * vc.height; const gg = vx.createLinearGradient(0, vc.height, 0, vc.height - h); gg.addColorStop(0, t.c[0]); gg.addColorStop(1, t.c[1]); vx.fillStyle = gg; vx.fillRect(i * bw, vc.height - h, bw - 2, h); }
      const pos = audioEl ? audioEl.currentTime : elapsed + (playing ? ctx.currentTime - startedAt : 0), L = audioEl ? (audioEl.duration || 0) : len(t);
      $('.t0', w.body).textContent = fmt(pos); $('.t1', w.body).textContent = fmt(L); $('.mu-prog .prog i', w.body).style.width = (L ? pos / L * 100 : 0) + '%';
    };
    draw();
    $$('[data-a]', w.body).forEach(b => b.onclick = () => { const a = b.dataset.a; if (a === 'play') playing ? pause() : play(); if (a === 'next') next(); if (a === 'prev') load(ti - 1); if (a === 'shuf') { shuffle = !shuffle; ui(); } });
    $('input[type=file]', w.body).onchange = e => { const f = e.target.files[0]; if (!f) return; pause(); stopEl(); audioEl = new Audio(URL.createObjectURL(f)); audioEl.dataset.name = f.name.replace(/\.[^.]+$/, ''); ctx.createMediaElementSource(audioEl).connect(gain); audioEl.onended = () => { stopEl(); load(ti); }; play(); };
    w.on('close', () => { Live.set('music', null); clearInterval(timer); cancelAnimationFrame(raf); stopEl(); setTimeout(() => gain.disconnect(), 300); });
    ui(); if (args.autoplay !== false) setTimeout(play, 300);
  }
});

/* ---------------- PHOTOS ---------------- */
function genArt(seed, W = 800, H = 600) {
  const r = seeded('art' + seed), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const pals = [['#ff7a45', '#2ec4b6', '#1a0f14', '#ffd166'], ['#c77dff', '#4cc9f0', '#0b1325', '#ff4d6d'], ['#3ddc97', '#1b4965', '#081712', '#ffd166'], ['#ff4d6d', '#ffb38a', '#241521', '#7b61ff'], ['#f6d1a8', '#c8643b', '#241521', '#2ec4b6'], ['#4cc9f0', '#e0f2f1', '#0d1013', '#ff7a45']];
  const p = pals[seed % pals.length]; const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, p[2]); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const cx = r() * W, cy = r() * H, rad = 100 + r() * 300; const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rad); rg.addColorStop(0, p[i % 2] + 'aa'); rg.addColorStop(1, p[i % 2] + '00'); x.fillStyle = rg; x.fillRect(0, 0, W, H); }
  x.globalCompositeOperation = 'source-over';
  const kind = seed % 3;
  for (let i = 0; i < 40; i++) {
    x.strokeStyle = p[3] + '55'; x.lineWidth = 1 + r() * 2; x.beginPath();
    if (kind === 0) { const y = r() * H; x.moveTo(0, y); for (let px = 0; px < W; px += 20) x.lineTo(px, y + Math.sin(px * .01 + i) * 40 * r()); }
    else if (kind === 1) { x.arc(W / 2, H / 2, 20 + i * 9, r() * 6, r() * 6 + 2); }
    else { const a = r() * 7; x.moveTo(W / 2, H * .9); x.lineTo(W / 2 + Math.cos(a) * W, H * .9 + Math.sin(a) * H); }
    x.stroke();
  }
  return c.toDataURL('image/jpeg', .85);
}
const GALLERY_NAMES = ['Ember Field', 'Neon Orbit', 'Aurora Rays', 'Velvet Dusk', 'Dune Glow', 'Cold Signal', 'Coral Static', 'Deep Bloom'];
defApp({
  id: 'photos', name: 'Photos', glyph: 'photos', colors: ['#4cc9f0', '#3a56d4'], w: 900, h: 600, cat: 'Media', desc: 'View your pictures and the RestaurantOS gallery', kw: 'images gallery pictures viewer',
  run(w, args) {
    let gallery = null;
    const all = () => { if (!gallery) gallery = GALLERY_NAMES.map((n, i) => ({ name: n, src: genArt(i), gen: true })); return [...FS.walk('/').filter(f => !f.dir && /^data:image/.test(f.node.d || '') && !f.path.startsWith('/Trash')).map(f => ({ name: f.name, src: f.node.d, path: f.path })), ...gallery]; };
    let items = [], idx = -1, slide = 0;
    const grid = () => {
      items = all();
      w.body.innerHTML = `<div class="app-tb"><b style="padding:0 6px">Collection</b><span class="muted" style="font-size:12px">${items.length} photos</span><span class="grow"></span><label class="tbtn" style="cursor:pointer">${svg('download')} Import<input type="file" accept="image/*" multiple hidden></label><button class="tbtn" data-ss>${svg('play')} Slideshow</button></div><div class="scroll" style="flex:1;position:relative"><div class="ph-grid">${items.map((p, i) => `<figure data-i="${i}" title="${esc(p.name)}"><img src="${p.src}" alt="${esc(p.name)}" loading="lazy"></figure>`).join('')}</div></div>`;
      $$('figure', w.body).forEach(f => f.onclick = () => view(+f.dataset.i));
      $('input[type=file]', w.body).onchange = e => importFiles(e.target.files, '/Pictures');
      $('[data-ss]', w.body).onclick = () => { view(0); toggleSlide(); };
    };
    const view = i => {
      idx = (i + items.length) % items.length; const p = items[idx];
      $('.ph-view', w.body)?.remove();
      const v = html(`<div class="ph-view"><div class="bar"><button class="tbtn" data-v="back">${svg('back')} All photos</button><span class="grow" style="align-self:center;text-align:center">${esc(p.name)} · ${idx + 1}/${items.length}</span><button class="tbtn" data-v="wall" title="Set as wallpaper">${svg('image')}</button>${p.path ? `<button class="tbtn" data-v="edit" title="Edit in Paint">${svg('edit')}</button><button class="tbtn" data-v="del" title="Delete">${svg('trash')}</button>` : `<button class="tbtn" data-v="save" title="Save to Pictures">${svg('save')}</button>`}<button class="tbtn" data-v="slide" title="Slideshow">${svg(slide ? 'pause' : 'play')}</button></div><div class="img"><img src="${p.src}" alt="${esc(p.name)}"></div><div class="bar"><button class="tbtn" data-v="prev">${svg('back')}</button><button class="tbtn" data-v="next">${svg('fwd')}</button></div></div>`);
      $('.scroll', w.body).appendChild(v); w.setTitle(p.name + ' — Photos');
      $$('[data-v]', v).forEach(b => b.onclick = async () => { const a = b.dataset.v;
        if (a === 'back') { clearInterval(slide); slide = 0; v.remove(); idx = -1; w.setTitle('Photos'); }
        if (a === 'prev') view(idx - 1); if (a === 'next') view(idx + 1);
        if (a === 'wall') setCustomWallpaper(p.src);
        if (a === 'edit') WM.open('paint', { path: p.path });
        if (a === 'save') { const n = FS.uniq('/Pictures', p.name + '.jpg'); FS.write('/Pictures/' + n, p.src); notify('Saved', n + ' was saved to Pictures.', 'photos'); }
        if (a === 'del' && await UI.confirm('Delete photo?', esc(p.name) + ' will be moved to the Recycle Bin.', 'Delete', true)) { FS.remove(p.path); grid(); }
        if (a === 'slide') toggleSlide();
      });
    };
    const toggleSlide = () => { if (slide) { clearInterval(slide); slide = 0; } else slide = setInterval(() => view(idx + 1), 3000); if (idx >= 0) view(idx); };
    winKeys(w, e => { if (idx < 0) return; if (e.key === 'ArrowRight') view(idx + 1); if (e.key === 'ArrowLeft') view(idx - 1); if (e.key === 'Escape') $('[data-v=back]', w.body)?.click(); });
    w.on('close', () => clearInterval(slide));
    onWin(w, 'fs', () => idx < 0 && grid());
    grid();
    if (args.path) { const i = items.findIndex(p => p.path === args.path); if (i >= 0) view(i); }
    w.onArgs = a => { if (a.path) { grid(); const i = items.findIndex(p => p.path === a.path); if (i >= 0) view(i); } };
  }
});

/* ---------------- CLOCK (alarms are global) ---------------- */
let ALARMS = Store.get('alarms', [{ t: '07:30', on: false, label: 'Wake up' }]);
let lastAlarmMin = '';
Bus.on('tick', () => {
  const d = new Date(), hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  if (hm === lastAlarmMin) return; lastAlarmMin = hm;
  ALARMS.filter(a => a.on && a.t === hm).forEach(a => { Snd.play('alarm'); notify('⏰ ' + (a.label || 'Alarm'), 'It is ' + fmtTime(d, false) + '.', 'clock', { dur: 15000 }); });
});
defApp({
  id: 'clock', name: 'Clock', glyph: 'clock', colors: ['#7b61ff', '#3a2b6b'], w: 640, h: 560, cat: 'Utilities', single: true, desc: 'World clock, alarms, stopwatch and timer', kw: 'alarm timer stopwatch time',
  run(w, args) {
    let tab = args.tab || 'clock', sw = { run: false, t0: 0, acc: 0, laps: [] }, tm = { total: 300, left: 300, run: false, end: 0 }, raf = 0;
    const CITIES = [['Local', Intl.DateTimeFormat().resolvedOptions().timeZone], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Berlin', 'Europe/Berlin'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']];
    w.body.innerHTML = `<div class="tabs">${[['clock', 'Clock'], ['alarm', 'Alarms'], ['sw', 'Stopwatch'], ['timer', 'Timer']].map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join('')}</div><div class="scroll pad" style="flex:1"></div>`;
    const main = $('.scroll', w.body);
    const fmtMs = ms => { const t = Math.floor(ms / 10); const cs = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };
    const fmtS = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0'); };
    const face = (cv) => {
      const x = cv.getContext('2d'), R = 110, d = new Date(); cv.width = cv.height = 220;
      x.translate(R, R); x.beginPath(); x.arc(0, 0, R - 4, 0, 7); x.fillStyle = getComputedStyle(w.el).getPropertyValue('--field') || 'rgba(127,127,127,.1)'; x.fill();
      x.strokeStyle = getComputedStyle(w.el).color; for (let i = 0; i < 60; i++) { x.save(); x.rotate(i * Math.PI / 30); x.lineWidth = i % 5 ? 1 : 3; x.globalAlpha = i % 5 ? .3 : .8; x.beginPath(); x.moveTo(0, -R + 10); x.lineTo(0, -R + (i % 5 ? 15 : 22)); x.stroke(); x.restore(); }
      const hand = (a, len, wd, col) => { x.save(); x.rotate(a); x.strokeStyle = col; x.lineWidth = wd; x.lineCap = 'round'; x.globalAlpha = 1; x.beginPath(); x.moveTo(0, 12); x.lineTo(0, -len); x.stroke(); x.restore(); };
      const h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds() + d.getMilliseconds() / 1000;
      const fg = getComputedStyle(w.el).color; hand((h + m / 60) * Math.PI / 6, 55, 5, fg); hand((m + s / 60) * Math.PI / 30, 80, 3, fg);
      hand(s * Math.PI / 30, 90, 1.5, getComputedStyle(document.documentElement).getPropertyValue('--accent')); x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent'); x.fill();
    };
    const render = () => {
      $$('[data-tab]', w.body).forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      if (tab === 'clock') main.innerHTML = `<div class="row" style="gap:28px;justify-content:center;margin-bottom:18px"><canvas class="clock-face"></canvas><div><div class="big-num" id="ckD"></div><div class="muted">${fmtDate()}</div></div></div>${CITIES.map(([n, tz]) => `<div class="city" data-tz="${tz}"><div><div>${n}</div><small class="muted">${tz}</small></div><b></b></div>`).join('')}`;
      if (tab === 'alarm') main.innerHTML = `<div class="row" style="margin-bottom:14px"><input type="time" class="inp" id="alT" value="08:00" style="width:auto"><input class="inp grow" id="alL" placeholder="Label" value="Alarm"><button class="btn primary" id="alAdd">${svg('plus')} Add alarm</button></div>${ALARMS.map((a, i) => `<div class="city"><div><b>${a.t}</b><div class="muted" style="font-size:12px">${esc(a.label)}</div></div><div class="row"><input type="checkbox" class="sw-t" data-al="${i}" ${a.on ? 'checked' : ''} aria-label="Enable alarm"><button class="tbtn" data-del="${i}" aria-label="Delete">${svg('trash')}</button></div></div>`).join('') || '<div class="empty">No alarms</div>'}<p class="muted" style="font-size:12px">Alarms ring while RestaurantOS is running, even when this app is closed.</p>`;
      if (tab === 'sw') main.innerHTML = `<div style="text-align:center;padding:20px 0"><div class="big-num" id="swV" style="font-size:64px">00:00.00</div><div class="row" style="justify-content:center;margin-top:16px"><button class="btn primary" id="swGo">${sw.run ? 'Pause' : 'Start'}</button><button class="btn" id="swLap">${sw.run ? 'Lap' : 'Reset'}</button></div></div><div id="swLaps">${sw.laps.map((l, i) => `<div class="city"><span>Lap ${sw.laps.length - i}</span><b style="font-size:16px">${fmtMs(l)}</b></div>`).join('')}</div>`;
      if (tab === 'timer') main.innerHTML = `<div style="text-align:center;padding:10px 0"><svg viewBox="0 0 200 200" width="220" height="220" style="max-width:100%"><circle cx="100" cy="100" r="88" fill="none" stroke="var(--press)" stroke-width="8"/><circle id="tmRing" cx="100" cy="100" r="88" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="553" transform="rotate(-90 100 100)"/><text id="tmV" x="100" y="112" text-anchor="middle" fill="currentColor" style="font:600 34px Unbounded,sans-serif"></text></svg>
        <div class="row" style="justify-content:center;margin:10px 0">${[1, 3, 5, 10, 15, 25, 60].map(m => `<button class="btn sm" data-min="${m}">${m} min</button>`).join('')}</div>
        <div class="row" style="justify-content:center"><button class="btn primary" id="tmGo">${tm.run ? 'Pause' : 'Start'}</button><button class="btn" id="tmRe">Reset</button></div></div>`;
      wire();
    };
    const wire = () => {
      const on = (id, f) => { const e = $('#' + id, main); if (e) e.onclick = f; };
      on('alAdd', () => { ALARMS.push({ t: $('#alT', main).value, label: $('#alL', main).value || 'Alarm', on: true }); Store.set('alarms', ALARMS); render(); });
      $$('[data-al]', main).forEach(c => c.onchange = () => { ALARMS[+c.dataset.al].on = c.checked; Store.set('alarms', ALARMS); });
      $$('[data-del]', main).forEach(b => b.onclick = () => { ALARMS.splice(+b.dataset.del, 1); Store.set('alarms', ALARMS); render(); });
      on('swGo', () => { if (sw.run) { sw.acc += performance.now() - sw.t0; sw.run = false; } else { sw.t0 = performance.now(); sw.run = true; } render(); });
      on('swLap', () => { if (sw.run) { sw.laps.unshift(sw.acc + performance.now() - sw.t0); } else { sw.acc = 0; sw.laps = []; } render(); });
      $$('[data-min]', main).forEach(b => b.onclick = () => { tm = { total: +b.dataset.min * 60, left: +b.dataset.min * 60, run: false, end: 0 }; render(); });
      on('tmGo', () => { if (tm.run) { tm.left = (tm.end - Date.now()) / 1000; tm.run = false; } else { tm.end = Date.now() + tm.left * 1000; tm.run = true; } render(); });
      on('tmRe', () => { tm.left = tm.total; tm.run = false; render(); });
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (tm.run) { tm.left = (tm.end - Date.now()) / 1000; if (tm.left <= 0) { tm.run = false; tm.left = 0; Snd.play('alarm'); notify("⏱ Time's up", `Your ${fmtS(tm.total)} timer finished.`, 'clock', { dur: 12000 }); tm.left = tm.total; if (tab === 'timer') render(); } }
      if (tab === 'clock') { const cv = $('.clock-face', main); if (cv) face(cv); const d = $('#ckD', main); if (d) d.textContent = fmtTime(new Date(), true); $$('[data-tz]', main).forEach(c => { try { c.querySelector('b').textContent = new Date().toLocaleTimeString(LOCALE, { timeZone: c.dataset.tz, hour: '2-digit', minute: '2-digit', hour12: !S.h24 }); } catch (e) { } }); }
      if (tab === 'sw') { const v = $('#swV', main); if (v) v.textContent = fmtMs(sw.acc + (sw.run ? performance.now() - sw.t0 : 0)); }
      Live.set('timer', tm.run ? { icon: 'clock', text: fmtS(tm.left), sub: 'Timer', open: () => { tab = 'timer'; WM.focus(w); render(); } } : sw.run ? { icon: 'clock', text: fmtMs(sw.acc + performance.now() - sw.t0).slice(0, 5), sub: 'Stopwatch', open: () => { tab = 'sw'; WM.focus(w); render(); } } : null);
      if (tab === 'timer') { const v = $('#tmV', main); if (v) { v.textContent = fmtS(tm.left); $('#tmRing', main).style.strokeDashoffset = 553 * (1 - tm.left / tm.total); } }
    };
    $$('[data-tab]', w.body).forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
    w.onArgs = a => { if (a.tab) { tab = a.tab; render(); } if (a.timer) { tm = { total: a.timer, left: a.timer, run: true, end: Date.now() + a.timer * 1000 }; tab = 'timer'; render(); } };
    w.on('close', () => { cancelAnimationFrame(raf); Live.set('timer', null); });
    render(); loop(); if (args.timer) w.onArgs(args);
  }
});

/* ---------------- CALENDAR ---------------- */
defApp({
  id: 'calendar', name: 'Calendar', glyph: 'calendar', colors: ['#ff5d6c', '#c2410c'], w: 860, h: 600, cat: 'Productivity', single: true, desc: 'Plan your month', kw: 'events schedule agenda',
  run(w) {
    let off = 0; const ev = () => Store.get('events', {});
    const render = () => {
      const now = new Date(), d = new Date(now.getFullYear(), now.getMonth() + off, 1), start = (d.getDay() + 6) % 7, days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); const E = ev();
      let cells = '';
      for (let i = 0; i < 42; i++) { const dt = new Date(d.getFullYear(), d.getMonth(), i - start + 1); const key = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`; const isT = dt.toDateString() === now.toDateString(); cells += `<div class="cd ${dt.getMonth() !== d.getMonth() ? 'o' : ''} ${isT ? 't' : ''}" data-k="${key}" tabindex="0"><span class="n">${dt.getDate()}</span>${(E[key] || []).slice(0, 3).map(e => `<div class="ev">${esc(e)}</div>`).join('')}${(E[key] || []).length > 3 ? `<div class="muted" style="font-size:10px">+${E[key].length - 3} more</div>` : ''}</div>`; }
      w.body.innerHTML = `<div class="app-tb"><button class="tbtn" data-o="-1">${svg('back')}</button><button class="tbtn" data-o="0">Today</button><button class="tbtn" data-o="1">${svg('fwd')}</button><b style="font-family:var(--f-display);font-size:18px;margin-left:8px">${d.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })}</b><span class="grow"></span><span class="muted" style="font-size:12px">Click a day to add or remove events</span></div>
        <div class="calapp"><div class="cg" style="flex:none;grid-auto-rows:auto;margin-bottom:4px">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<div class="muted" style="font-size:12px;padding:2px 8px">${x}</div>`).join('')}</div><div class="cg">${cells}</div></div>`;
      $$('[data-o]', w.body).forEach(b => b.onclick = () => { off = +b.dataset.o === 0 ? 0 : off + +b.dataset.o; render(); });
      $$('.cd', w.body).forEach(c => { c.onclick = () => dayDlg(c.dataset.k); c.onkeydown = e => e.key === 'Enter' && dayDlg(c.dataset.k); });
    };
    const dayDlg = k => {
      const E = ev(); const list = E[k] || []; const [y, m, dd] = k.split('-').map(Number);
      const back = html(`<div class="modal-back"><div class="modal glass"><h3>${new Date(y, m - 1, dd).toLocaleDateString(LOCALE, { weekday: 'long', month: 'long', day: 'numeric' })}</h3><div id="evl">${list.map((e, i) => `<div class="todo-item"><span>${esc(e)}</span><button data-d="${i}" style="opacity:1">✕</button></div>`).join('') || '<p>No events yet.</p>'}</div><div class="row"><input class="inp grow" id="evIn" placeholder="e.g. 14:00 Team call"><button class="btn primary" id="evAdd">Add</button></div><div class="acts"><button class="btn" id="evX">Done</button></div></div></div>`);
      $('#os').appendChild(back); const inp = $('#evIn', back); setTimeout(() => inp.focus(), 30);
      const save = l => { const E2 = ev(); if (l.length) E2[k] = l; else delete E2[k]; Store.set('events', E2); };
      const add = () => { if (!inp.value.trim()) return; list.push(inp.value.trim()); save(list); back.remove(); render(); dayDlg(k); };
      $('#evAdd', back).onclick = add; inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') add(); if (e.key === 'Escape') { back.remove(); } };
      $$('[data-d]', back).forEach(b => b.onclick = () => { list.splice(+b.dataset.d, 1); save(list); back.remove(); render(); dayDlg(k); });
      $('#evX', back).onclick = () => back.remove(); back.onpointerdown = e => e.target === back && back.remove();
    };
    render();
  }
});

/* ---------------- WEATHER ---------------- */
defApp({
  id: 'weather', name: 'Weather', glyph: 'weather', colors: ['#5cb8ff', '#2a6fdb'], w: 860, h: 620, cat: 'Utilities', single: true, desc: 'Forecasts for your city', kw: 'forecast temperature rain',
  run(w) {
    let raf = 0;
    const render = () => {
      const n = Weather.now(), days = Array.from({ length: 7 }, (_, i) => Weather.day(i)), hrs = Weather.hours(); const night = new Date().getHours() < 6 || new Date().getHours() > 20;
      const bg = night ? 'linear-gradient(180deg,#0b1325,#1d2b53)' : n.cond.includes('rain') ? 'linear-gradient(180deg,#3d4a5c,#6b7b8f)' : n.cond.includes('loud') ? 'linear-gradient(180deg,#4a6fa5,#9bb7d4)' : 'linear-gradient(180deg,#2a6fdb,#5cb8ff)';
      const mx = Math.max(...hrs), mn = Math.min(...hrs); const pts = hrs.map((t, i) => `${i * 30 + 15},${100 - (t - mn) / (mx - mn || 1) * 70}`).join(' ');
      w.body.innerHTML = `<div class="weather-app" style="background:${bg}"><canvas class="wx-bg"></canvas><div class="wx-in">
        <div class="row" style="justify-content:space-between"><select class="inp" id="wxCity" style="width:auto;background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.25);color:#fff">${['New York', 'London', 'Berlin', 'Warsaw', 'Paris', 'Madrid', 'Rome', 'Tokyo', 'Toronto', 'Sydney', 'São Paulo', 'Mumbai'].map(c => `<option ${c === S.city ? 'selected' : ''}>${c}</option>`).join('')}</select><span style="font-size:12px;opacity:.8">Simulated forecast · updated ${fmtTime(new Date(), false)}</span></div>
        <div class="wx-now" style="margin-top:18px"><div class="t">${n.temp}°</div><div><div style="font-size:22px">${n.cond}</div><div style="opacity:.85">Feels like ${n.temp - 2}° · H ${n.hi}° L ${n.lo}°</div></div></div>
        <div class="wx-card"><div style="font-size:12px;opacity:.8;margin-bottom:6px">HOURLY</div><div style="overflow-x:auto"><svg viewBox="0 0 720 130" style="width:720px;height:130px"><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/><polygon points="15,110 ${pts} 705,110" fill="rgba(255,255,255,.15)"/>${hrs.map((t, i) => i % 3 === 0 ? `<text x="${i * 30 + 15}" y="${92 - (t - mn) / (mx - mn || 1) * 70}" fill="#fff" font-size="11" text-anchor="middle">${t}°</text><text x="${i * 30 + 15}" y="126" fill="rgba(255,255,255,.75)" font-size="10" text-anchor="middle">${String(i).padStart(2, '0')}:00</text>` : '').join('')}<circle cx="${new Date().getHours() * 30 + 15}" cy="${100 - (hrs[new Date().getHours()] - mn) / (mx - mn || 1) * 70}" r="5" fill="#fff"/></svg></div></div>
        <div class="wx-days">${days.map((d, i) => `<div class="wx-day">${i ? d.date.toLocaleDateString(LOCALE, { weekday: 'short' }) : 'Today'}<div style="margin:6px auto;width:26px;height:26px">${svg(d.icon)}</div><b>${d.hi}°</b><span style="opacity:.75">${d.lo}°</span><div style="font-size:10px;opacity:.75;margin-top:4px">${d.rain}% rain</div></div>`).join('')}</div>
        <div class="wx-stats">${[['Humidity', n.hum + '%'], ['Wind', n.wind + ' km/h'], ['UV index', n.uv], ['Rain chance', n.rain + '%'], ['Sunrise', '6:4' + (n.uv % 10)], ['Sunset', '18:1' + (n.hum % 10)]].map(([k, v]) => `<div class="wx-card" style="margin:0"><div style="font-size:11px;opacity:.8">${k.toUpperCase()}</div><div style="font-family:var(--f-display);font-size:22px;margin-top:4px">${v}</div></div>`).join('')}</div></div></div>`;
      $$('.wx-day svg', w.body).forEach(s => s.style.cssText = 'width:26px;height:26px;stroke:#fff');
      $('#wxCity', w.body).onchange = e => { S.city = e.target.value; saveS(); render(); };
      fx(n.cond, night);
    };
    const fx = (cond, night) => {
      cancelAnimationFrame(raf); const c = $('.wx-bg', w.body), x = c.getContext('2d'); const drops = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), s: rand(.6, 1.4) }));
      const clouds = Array.from({ length: 5 }, (_, i) => ({ x: Math.random(), y: .05 + i * .07, s: rand(.5, 1.2) }));
      const f = () => {
        raf = requestAnimationFrame(f); c.width = c.clientWidth; c.height = c.clientHeight; const W = c.width, H = c.height, t = performance.now() / 1000;
        if (night) drops.slice(0, 80).forEach(d => { x.fillStyle = `rgba(255,255,255,${.3 + Math.sin(t * 2 + d.x * 50) * .3})`; x.fillRect(d.x * W, d.y * H * .6, 1.5, 1.5); });
        else if (/Sunny|Clear/.test(cond)) { const g = x.createRadialGradient(W * .85, H * .08, 0, W * .85, H * .08, 260); g.addColorStop(0, 'rgba(255,240,180,.7)'); g.addColorStop(1, 'rgba(255,240,180,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); for (let i = 0; i < 12; i++) { x.save(); x.translate(W * .85, H * .08); x.rotate(t * .1 + i * Math.PI / 6); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(0, -10, 500, 20); x.restore(); } }
        if (/cloud|rain|Windy/i.test(cond)) clouds.forEach(cl => { cl.x += .0003 * cl.s; if (cl.x > 1.2) cl.x = -.3; x.fillStyle = 'rgba(255,255,255,.18)'; [0, 40, 80].forEach((o, i) => { x.beginPath(); x.arc(cl.x * W + o * cl.s, cl.y * H + (i === 1 ? -20 : 0), 40 * cl.s, 0, 7); x.fill(); }); });
        if (/rain/i.test(cond)) { x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1; drops.forEach(d => { d.y += .012 * d.s; if (d.y > 1) { d.y = 0; d.x = Math.random(); } x.beginPath(); x.moveTo(d.x * W, d.y * H); x.lineTo(d.x * W - 2, d.y * H + 12); x.stroke(); }); }
      }; f();
    };
    w.on('close', () => cancelAnimationFrame(raf));
    render();
  }
});

/* ---------------- TASK MANAGER ---------------- */
defApp({
  id: 'taskmgr', name: 'Task Manager', glyph: 'taskmgr', colors: ['#3ddc97', '#1b8a5a'], w: 820, h: 560, cat: 'System', single: true, desc: 'Processes and performance', kw: 'processes cpu memory performance kill',
  run(w) {
    let tab = 'proc', sel = null; const H = { cpu: [], mem: [], gpu: [], net: [], fps: [] }; let fps = 60, frames = 0, last = performance.now(), raf = 0;
    const SYS = [['resto-kernel', 'System', 0.4, 120, true], ['compositor', 'System', 2.1, 210, false], ['audio-service', 'System', 0.3, 34, false], ['restofs-indexer', 'System', 0.2, 58, false], ['network-manager', 'System', 0.1, 22, false], ['restodefender', 'Security', 0.6, 96, false]];
    const loopF = () => { raf = requestAnimationFrame(loopF); frames++; const n = performance.now(); if (n - last >= 1000) { fps = frames; frames = 0; last = n; } }; loopF();
    w.body.innerHTML = `<div class="tabs"><button data-t="proc">Processes</button><button data-t="perf">Performance</button><button data-t="start">Startup apps</button></div><div class="scroll" style="flex:1"></div><div class="statusbar"></div>`;
    const main = $('.scroll', w.body), st = $('.statusbar', w.body);
    const sample = () => {
      const base = (B.oc ? 14 : 8) + WM.wins.length * 3.5 + (S.wallpaper && WALLS[S.wallpaper]?.live ? 6 : 0);
      const push = (k, v) => { H[k].push(v); if (H[k].length > 60) H[k].shift(); };
      push('cpu', clamp(base + rand(-5, 8), 1, 100)); push('mem', clamp(18 + WM.wins.length * 2.2 + rand(-.4, .4), 5, 95)); push('gpu', clamp(base * .7 + rand(-4, 6), 0, 100)); push('net', S.wifi && !S.airplane ? rand(0, 40) : 0); push('fps', fps);
    };
    for (let i = 0; i < 30; i++) sample();
    const spark = (cv, data, max, col) => { const x = cv.getContext('2d'); cv.width = cv.clientWidth * devicePixelRatio; cv.height = cv.clientHeight * devicePixelRatio; const W = cv.width, Hh = cv.height; x.strokeStyle = 'rgba(127,127,127,.15)'; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(0, Hh * i / 4); x.lineTo(W, Hh * i / 4); x.stroke(); } x.beginPath(); data.forEach((v, i) => { const px = i / 59 * W, py = Hh - v / max * Hh; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.strokeStyle = col; x.lineWidth = 2 * devicePixelRatio; x.stroke(); x.lineTo(W, Hh); x.lineTo(0, Hh); x.closePath(); x.fillStyle = col + '30'; x.fill(); };
    const render = () => {
      $$('[data-t]', w.body).forEach(b => b.classList.toggle('on', b.dataset.t === tab));
      const cpu = H.cpu[H.cpu.length - 1], mem = H.mem[H.mem.length - 1];
      st.innerHTML = `<span>Processes: ${SYS.length + WM.wins.length}</span><span>CPU: ${cpu.toFixed(0)}%</span><span>Memory: ${mem.toFixed(0)}%</span><span>FPS: ${fps}</span>`;
      if (tab === 'proc') {
        const rows = [...WM.wins.map(x => ({ id: x.id, name: x.title, type: 'App', cpu: rand(.2, 4) + (x === WM.active ? 2 : 0), mem: 60 + (x.app.id.length * 23) % 200, icon: appIcon(x.app.id), win: x })), ...SYS.map(([n, t, c, m, crit]) => ({ id: n, name: n, type: t, cpu: c + rand(0, .5), mem: m, crit, icon: `<div class="ai" style="background:linear-gradient(150deg,#6b7280,#374151)">${svg('cpu')}</div>` }))];
        main.innerHTML = `<table class="tbl"><thead><tr><th>Name</th><th>Type</th><th style="text-align:right">CPU</th><th style="text-align:right">Memory</th></tr></thead><tbody>${rows.map(r => `<tr data-id="${esc(r.id)}" class="${sel === r.id ? 'sel' : ''}"><td><div class="row" style="flex-wrap:nowrap">${r.icon.replace('class="ai', 'style="width:22px;height:22px;border-radius:6px" class="ai')}<span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:320px">${esc(r.name)}</span></div></td><td class="muted">${r.type}</td><td style="text-align:right">${r.cpu.toFixed(1)}%</td><td style="text-align:right">${r.mem.toFixed(0)} MB</td></tr>`).join('')}</tbody></table>
          <div style="position:sticky;bottom:0;padding:10px;display:flex;justify-content:flex-end;background:var(--win-solid);border-top:1px solid var(--line)"><button class="btn sm" id="tmEnd" ${sel ? '' : 'disabled'}>End task</button></div>`;
        $$('tr[data-id]', main).forEach(tr => tr.onclick = () => { sel = tr.dataset.id; render(); });
        $('#tmEnd', main).onclick = async () => { const r = rows.find(x => x.id === sel); if (!r) return; if (r.win) { WM.close(r.win, true); sel = null; render(); return; } if (r.crit) { if (await UI.confirm('End resto-kernel?', 'Ending this system process will crash RestaurantOS and restart your PC. Unsaved work will be lost.', 'End process', true)) bsod('CRITICAL_PROCESS_DIED'); return; } notify('Process restarted', `${r.name} was restarted by the system.`, 'taskmgr'); sel = null; };
      } else if (tab === 'perf') {
        main.innerHTML = `<div class="tm-graphs">${[['cpu', 'CPU', `Quantum X9 · ${B.oc ? '5.80' : '5.20'} GHz`, cpu.toFixed(0) + '%', 100, '#2ec4b6'], ['mem', 'Memory', '32 GB DDR5', (mem * .32).toFixed(1) + ' / 32 GB', 100, '#c77dff'], ['gpu', 'GPU', 'RestoForce RTX 9090', H.gpu[H.gpu.length - 1].toFixed(0) + '%', 100, '#ff7a45'], ['net', 'Wi-Fi', S.wifi && !S.airplane ? S.wifiName : 'Disconnected', H.net[H.net.length - 1].toFixed(1) + ' Mbps', 50, '#4cc9f0'], ['fps', 'Display', 'Real frames per second', fps + ' FPS', 150, '#3ddc97']].map(([k, n, d, v, mx, c]) => `<div class="tm-g"><div class="row" style="justify-content:space-between"><b>${n}</b><span class="big" style="color:${c}">${v}</span></div><div class="muted" style="font-size:12px">${esc(d)}</div><canvas data-k="${k}" data-m="${mx}" data-c="${c}"></canvas></div>`).join('')}</div>
          <div class="pad" style="padding-top:0"><div class="card kv" style="display:grid"><dt>Uptime</dt><dd>${Math.floor((Date.now() - BOOT_T) / 60000)} min</dd><dt>JS heap (real)</dt><dd>${performance.memory ? fmtSize(performance.memory.usedJSHeapSize) : 'not reported by this browser'}</dd><dt>Logical processors (real)</dt><dd>${navigator.hardwareConcurrency || '?'}</dd><dt>CPU temperature</dt><dd>${(B.oc ? 64 : 40) + Math.round(cpu / 5)} °C · fan ${B.fan}</dd></div></div>`;
        $$('canvas[data-k]', main).forEach(cv => spark(cv, H[cv.dataset.k], +cv.dataset.m, cv.dataset.c));
      } else {
        main.innerHTML = `<div class="pad"><p class="muted">Apps that open automatically when you sign in.</p><table class="tbl"><tbody>${installedApps().map(a => `<tr><td><div class="row" style="flex-wrap:nowrap">${appIcon(a.id).replace('class="ai', 'style="width:22px;height:22px;border-radius:6px" class="ai')}${esc(a.name)}</div></td><td style="text-align:right"><input type="checkbox" class="sw-t" data-s="${a.id}" ${S.startupApps.includes(a.id) ? 'checked' : ''} aria-label="Start ${esc(a.name)} automatically"></td></tr>`).join('')}</tbody></table></div>`;
        $$('[data-s]', main).forEach(c => c.onchange = () => { S.startupApps = c.checked ? [...S.startupApps, c.dataset.s] : S.startupApps.filter(x => x !== c.dataset.s); saveS(); });
      }
    };
    $$('[data-t]', w.body).forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    const iv = setInterval(() => { sample(); if (tab !== 'start') { const y = main.scrollTop; render(); main.scrollTop = y; } }, 1000);
    w.on('close', () => { clearInterval(iv); cancelAnimationFrame(raf); });
    render();
  }
});

/* ---------------- CODE STUDIO ---------------- */
const CODE_TPL = {
  'Hello page': `<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: system-ui; display: grid; place-items: center; height: 100vh; margin: 0;\n         background: linear-gradient(135deg, #ff7a45, #2ec4b6); color: white; }\n  h1 { font-size: 3rem; }\n</style>\n</head>\n<body>\n  <h1>Hello from Code Studio</h1>\n</body>\n</html>`,
  'Canvas animation': `<canvas id="c"></canvas>\n<style>body{margin:0;background:#0b1014}canvas{display:block}</style>\n<script>\nconst c = document.getElementById('c'), x = c.getContext('2d');\nlet t = 0;\nfunction draw() {\n  c.width = innerWidth; c.height = innerHeight;\n  for (let i = 0; i < 60; i++) {\n    const a = i / 60 * Math.PI * 2 + t;\n    x.fillStyle = 'hsl(' + (i * 6 + t * 50) + ',80%,60%)';\n    x.beginPath();\n    x.arc(c.width/2 + Math.cos(a) * (100 + Math.sin(t*2+i)*40), c.height/2 + Math.sin(a) * (100 + Math.sin(t*2+i)*40), 6, 0, 7);\n    x.fill();\n  }\n  t += 0.01; requestAnimationFrame(draw);\n}\ndraw();\n<\/script>`,
  'Clicker game': `<style>\n  body{font-family:system-ui;text-align:center;background:#11161b;color:#fff;padding-top:60px}\n  button{font-size:24px;padding:20px 40px;border-radius:16px;border:0;background:#ff7a45;color:#fff;cursor:pointer}\n  button:active{transform:scale(.95)}\n</style>\n<h1>Score: <span id="s">0</span></h1>\n<button id="b">Click me!</button>\n<p id="m"></p>\n<script>\n  let s = 0;\n  b.onclick = () => {\n    s++; document.getElementById('s').textContent = s;\n    if (s % 10 === 0) m.textContent = 'Level ' + (s / 10) + ' reached!';\n  };\n<\/script>`
};
defApp({
  id: 'code', name: 'Code Studio', glyph: 'code', colors: ['#3ddc97', '#0f766e'], w: 1000, h: 620, cat: 'Productivity', desc: 'Write HTML, CSS and JavaScript with live preview', kw: 'ide programming html javascript editor dev',
  run(w, args) {
    let path = args.path || null, auto = true, t = 0;
    w.body.innerHTML = `<div class="app-tb"><button class="tbtn" data-a="run" title="Run (Ctrl+Enter)">${svg('play')} Run</button><button class="tbtn on" data-a="auto">Auto-run</button><span class="sep"></span><button class="tbtn" data-a="open">${svg('open')}</button><button class="tbtn" data-a="save" title="Save (Ctrl+S)">${svg('save')}</button><span class="sep"></span><select class="inp" style="width:auto;padding:5px 8px" aria-label="Template"><option value="">Templates…</option>${Object.keys(CODE_TPL).map(k => `<option>${k}</option>`).join('')}</select><span class="grow"></span><span class="muted fn" style="font-size:12px"></span></div>
      <div class="code-split"><div class="code-ed"><div class="gut"></div><textarea spellcheck="false" aria-label="Code"></textarea></div><iframe sandbox="allow-scripts" title="Preview"></iframe></div>`;
    const ta = $('textarea', w.body), gut = $('.gut', w.body), fr = $('iframe', w.body);
    const lines = () => { gut.textContent = Array.from({ length: ta.value.split('\n').length }, (_, i) => i + 1).join('\n'); gut.scrollTop = ta.scrollTop; };
    const run = () => { fr.srcdoc = ta.value; };
    const setName = () => { $('.fn', w.body).textContent = path || 'Unsaved'; w.setTitle((path ? FS.parts(path).pop() : 'Untitled') + ' — Code Studio'); };
    ta.value = path ? (FS.read(path) || '') : CODE_TPL['Hello page']; lines(); run(); setName();
    ta.oninput = () => { lines(); if (auto) { clearTimeout(t); t = setTimeout(run, 500); } };
    ta.onscroll = () => gut.scrollTop = ta.scrollTop;
    ta.onkeydown = e => {
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); ta.oninput(); }
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); run(); }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); act('save'); }
      const pairs = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" }; if (pairs[e.key] && ta.selectionStart === ta.selectionEnd) { e.preventDefault(); const p = ta.selectionStart; ta.setRangeText(e.key + pairs[e.key], p, p, 'start'); ta.selectionStart = ta.selectionEnd = p + 1; ta.oninput(); }
      if (e.key === 'Enter' && !e.ctrlKey) { const p = ta.selectionStart; const ln = ta.value.slice(0, p).split('\n').pop(); const ind = ln.match(/^\s*/)[0]; e.preventDefault(); ta.setRangeText('\n' + ind, p, ta.selectionEnd, 'end'); ta.oninput(); }
    };
    const act = async a => {
      if (a === 'run') run();
      if (a === 'auto') { auto = !auto; $('[data-a=auto]', w.body).classList.toggle('on', auto); }
      if (a === 'open') { const p = await pickFile('Open code file', f => /\.(html?|css|js|txt)$/.test(f.name)); if (p) { path = p; ta.value = FS.read(p); lines(); run(); setName(); } }
      if (a === 'save') { if (!path) { const n = await UI.prompt('Save', 'File name:', FS.uniq('/Documents/Projects', 'page.html')); if (!n) return; path = '/Documents/Projects/' + n; } if (FS.write(path, ta.value)) { setName(); notify('Saved', path, 'code'); } }
    };
    $$('[data-a]', w.body).forEach(b => b.onclick = () => act(b.dataset.a));
    $('select', w.body).onchange = e => { if (!e.target.value) return; ta.value = CODE_TPL[e.target.value]; e.target.value = ''; lines(); run(); };
    w.onArgs = a => { if (a.path) { path = a.path; ta.value = FS.read(a.path) || ''; lines(); run(); setName(); } };
  }
});

/* ---------------- TO DO ---------------- */
defApp({
  id: 'todo', name: 'To Do', glyph: 'todo', colors: ['#4cc9f0', '#3a56d4'], w: 520, h: 600, minW: 320, cat: 'Productivity', single: true, desc: 'Tasks and checklists', kw: 'tasks list reminders checklist',
  run(w) {
    let todos = Store.get('todos', [{ id: uid(), text: 'Explore RestaurantOS', done: false, star: true }, { id: uid(), text: 'Change the wallpaper', done: false }, { id: uid(), text: 'Try the BIOS (restart, press DEL)', done: false }]), filter = 'all';
    const save = () => { Store.set('todos', todos); render(); };
    const render = () => {
      const list = todos.filter(t => filter === 'all' || (filter === 'active' ? !t.done : filter === 'done' ? t.done : t.star)); const left = todos.filter(t => !t.done).length;
      w.body.innerHTML = `<div class="pad" style="padding-bottom:10px"><div class="h1" style="margin-bottom:4px">My Day</div><div class="muted" style="font-size:13px">${fmtDate()} · ${left} task${left === 1 ? '' : 's'} left</div><div class="row" style="margin-top:14px;flex-wrap:nowrap"><input class="inp grow" id="tdIn" placeholder="Add a task and press Enter" aria-label="New task"><button class="btn primary" id="tdAdd">${svg('plus')}</button></div></div>
        <div class="tabs">${[['all', 'All'], ['active', 'Active'], ['done', 'Completed'], ['star', 'Important']].map(([k, l]) => `<button data-f="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="scroll pad" style="flex:1;padding-top:12px">${list.map(t => `<div class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}"><input type="checkbox" ${t.done ? 'checked' : ''} aria-label="Complete"><span class="grow">${esc(t.text)}</span><button data-star style="opacity:1;color:${t.star ? 'var(--warn)' : 'var(--fg2)'}" aria-label="Important">★</button><button data-del aria-label="Delete">✕</button></div>`).join('') || `<div class="empty">${svg('check')}<b>Nothing here</b><span>Add a task above.</span></div>`}</div>
        <div class="statusbar"><span>${todos.length} total</span><a href="#" id="tdClr" style="margin-left:auto;color:var(--accent)">Clear completed</a></div>`;
      const inp = $('#tdIn', w.body); const add = () => { if (inp.value.trim()) { todos.unshift({ id: uid(), text: inp.value.trim(), done: false }); Snd.play('pop'); save(); setTimeout(() => $('#tdIn', w.body)?.focus(), 0); } };
      inp.onkeydown = e => e.key === 'Enter' && add(); $('#tdAdd', w.body).onclick = add;
      $$('[data-f]', w.body).forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });
      $$('.todo-item', w.body).forEach(el => { const t = todos.find(x => x.id === el.dataset.id); el.querySelector('input').onchange = e => { t.done = e.target.checked; if (t.done) Snd.play('success'); save(); }; el.querySelector('[data-del]').onclick = () => { todos = todos.filter(x => x !== t); save(); }; el.querySelector('[data-star]').onclick = () => { t.star = !t.star; save(); }; });
      $('#tdClr', w.body).onclick = e => { e.preventDefault(); todos = todos.filter(t => !t.done); save(); };
    };
    onWin(w, 'todos', () => { todos = Store.get('todos', []); render(); });
    render();
  }
});

/* ---------------- STICKY NOTES (store) ---------------- */
defApp({
  id: 'notes', name: 'Sticky Notes', glyph: 'notes', colors: ['#ffd166', '#e08e0b'], w: 760, h: 520, cat: 'Productivity', core: false, single: true, desc: 'Colorful notes for quick thoughts', kw: 'memo post-it',
  run(w) {
    const COLS = ['#fff3a3', '#ffd6a5', '#caffbf', '#a0e7ff', '#ffc6ff', '#e4e4e7'];
    let notes = Store.get('stickies', [{ id: uid(), text: 'Welcome to Sticky Notes!\nEverything saves automatically.', c: 0, r: -2 }, { id: uid(), text: 'Ideas:\n• Learn Code Studio\n• Beat 2048', c: 2, r: 1.5 }]);
    const save = () => Store.set('stickies', notes);
    const render = () => {
      w.body.innerHTML = `<div class="app-tb"><button class="tbtn" id="snAdd">${svg('plus')} New note</button><span class="muted" style="font-size:12px">${notes.length} notes</span></div><div class="scroll" style="flex:1"><div class="sticky-grid">${notes.map(n => `<div class="sticky" data-id="${n.id}" style="background:${COLS[n.c]};--r:${n.r}deg"><div class="sh"><button data-col aria-label="Change color">●</button><button data-del aria-label="Delete">✕</button></div><textarea aria-label="Note">${esc(n.text)}</textarea></div>`).join('')}</div></div>`;
      $('#snAdd', w.body).onclick = () => { notes.push({ id: uid(), text: '', c: Math.floor(Math.random() * COLS.length), r: rand(-3, 3) }); save(); render(); $$('.sticky textarea', w.body).pop()?.focus(); };
      $$('.sticky', w.body).forEach(el => { const n = notes.find(x => x.id === el.dataset.id); el.querySelector('textarea').oninput = e => { n.text = e.target.value; save(); }; el.querySelector('[data-del]').onclick = () => { notes = notes.filter(x => x !== n); save(); render(); }; el.querySelector('[data-col]').onclick = () => { n.c = (n.c + 1) % COLS.length; save(); el.style.background = COLS[n.c]; }; });
    };
    render();
  }
});

/* ---------------- RESTOSTORE ---------------- */
defApp({
  id: 'store', name: 'RestoStore', glyph: 'store', colors: ['#ff7a45', '#c2410c'], w: 960, h: 640, cat: 'System', single: true, desc: 'Get apps and games', kw: 'app store install download market',
  run(w, args) {
    let cat = 'All', q = args.q || '', installing = {};
    w.onArgs = a => { if (a.q != null) { q = a.q; render(); } };
    const stars = id => { const r = 3.8 + (id.length * 7 % 12) / 10; return `<span style="color:var(--warn)">${'★'.repeat(Math.round(r))}</span><span class="muted">${'★'.repeat(5 - Math.round(r))} ${r.toFixed(1)}</span>`; };
    const render = () => {
      const pool = Object.values(APPS).filter(a => appVisible(a) && (cat === 'All' || (cat === 'Installed' ? isInstalled(a.id) : a.cat === cat)) && (!q || (a.name + a.desc + (a.kw || '')).toLowerCase().includes(q.toLowerCase())));
      const featured = Object.values(APPS).filter(a => !a.core && appVisible(a));
      w.body.innerHTML = `<div class="app-tb"><input class="fx-search" style="width:min(320px,50%)" placeholder="Search apps and games" value="${esc(q)}" aria-label="Search RestoStore"><span class="grow"></span><span class="muted" style="font-size:12px">${featured.filter(a => isInstalled(a.id)).length}/${featured.length} extras installed</span></div>
        <div class="tabs">${['All', 'Games', 'Productivity', 'Media', 'Utilities', 'System', 'Installed'].map(c => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div>
        <div class="scroll pad" style="flex:1">${cat === 'All' && !q ? `<div class="store-hero"><div style="font-size:12px;letter-spacing:.15em;opacity:.85">FEATURED</div><h2>Game night on RestaurantOS</h2><p style="margin:0 0 14px;opacity:.9;max-width:44ch">Breakout, Memory Match and Tic-Tac-Toe are free. Install them in one click.</p><button class="btn" id="getGames" style="background:#fff;color:#c2410c">Get all games</button></div>` : ''}
        <div class="store-grid">${pool.map(a => { const inst = isInstalled(a.id); return `<div class="store-card">${appIcon(a.id)}<div class="grow"><h4>${esc(a.name)}</h4><div style="font-size:11px">${stars(a.id)} · ${a.cat}</div><p>${esc(a.desc)}</p><div class="row">${installing[a.id] != null ? `<div class="prog"><i style="width:${installing[a.id]}%"></i></div>` : inst ? `<button class="btn sm primary" data-open="${a.id}">Open</button>${a.core ? '<span class="chip">Built-in</span>' : `<button class="btn sm" data-un="${a.id}">Uninstall</button>`}` : `<button class="btn sm primary" data-get="${a.id}">${svg('download')} Get</button><span class="muted" style="font-size:11px">Free</span>`}</div></div></div>`; }).join('') || '<div class="empty">No apps match your search.</div>'}</div></div>`;
      const s = $('.fx-search', w.body); s.oninput = () => { q = s.value; render(); const n = $('.fx-search', w.body); n.focus(); n.setSelectionRange(q.length, q.length); };
      $$('[data-c]', w.body).forEach(b => b.onclick = () => { cat = b.dataset.c; render(); });
      $$('[data-get]', w.body).forEach(b => b.onclick = () => install(b.dataset.get));
      $$('[data-open]', w.body).forEach(b => b.onclick = () => WM.open(b.dataset.open));
      $$('[data-un]', w.body).forEach(b => b.onclick = () => uninstallApp(b.dataset.un));
      $('#getGames', w.body)?.addEventListener('click', () => Object.values(APPS).filter(a => a.cat === 'Games' && appVisible(a) && !isInstalled(a.id)).forEach((a, i) => setTimeout(() => install(a.id), i * 400)));
    };
    const install = async id => {
      if (installing[id] != null) return; installing[id] = 0; render();
      while (installing[id] < 100) { await sleep(70); installing[id] = Math.min(100, installing[id] + rand(4, 14)); const bar = $(`[data-get="${id}"]`, w.body)?.closest('.row')?.querySelector('.prog i'); render(); }
      delete installing[id]; if (!S.installed.includes(id)) S.installed.push(id); if (!S.startPinned.includes(id)) S.startPinned.push(id); saveS(); render(); Bus.emit('apps'); Snd.play('success');
      notify(APPS[id].name + ' installed', 'Find it in the Start menu. Click to open it now.', id);
    };
    onWin(w, 'apps', render);
    render();
  }
});

/* ---------------- NOVA ASSISTANT ---------------- */
const JOKES = ['Why do programmers prefer dark mode? Because light attracts bugs.', 'I told my computer I needed a break, and it said "No problem — I\'ll go to sleep."', 'There are 10 kinds of people: those who understand binary and those who don\'t.', 'Why did the window manager go to therapy? It had too many unresolved focus issues.', 'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"'];
const FACTS = ['The first computer "bug" was a real moth found in a Harvard Mark II in 1947.', 'RestaurantOS synthesizes every sound live — there are no audio files at all.', 'The QWERTY layout was designed in the 1870s for typewriters.', 'The first webcam watched a coffee pot at Cambridge University.', 'Honey never spoils; archaeologists found 3,000-year-old honey that was still edible.'];
defApp({
  id: 'nova', name: 'Nova', glyph: 'chat', colors: ['#c77dff', '#4cc9f0'], w: 460, h: 620, minW: 340, cat: 'Utilities', single: true, desc: 'Your built-in assistant', kw: 'assistant ai chat help cortana siri',
  run(w) {
    const hist = Store.get('novaHist', []);
    w.body.innerHTML = `<div class="chat"></div><div class="sugg">${['What can you do?', 'Open Paint', 'Tell me a joke', 'Set a timer for 1 minute', "What's the weather?", 'Dark mode'].map(s => `<button>${s}</button>`).join('')}</div><div class="chat-in"><input class="inp grow" placeholder="Ask Nova something…" aria-label="Message"><button class="btn primary" aria-label="Send">${svg('send')}</button></div>`;
    const chat = $('.chat', w.body), inp = $('input', w.body);
    const add = (t, who) => { const m = html(`<div class="msg ${who}"></div>`); m.textContent = t; chat.appendChild(m); chat.scrollTop = chat.scrollHeight; };
    const reply = q => {
      const s = q.toLowerCase().trim(); let m;
      const findApp = name => Object.values(APPS).find(a => a.name.toLowerCase() === name || a.id === name || (a.name + ' ' + (a.kw || '')).toLowerCase().split(/\s+/).includes(name)) || Object.values(APPS).find(a => a.name.toLowerCase().includes(name));
      if (/^(hi|hello|hey|yo|hola|cześć)\b/.test(s)) return `Hi ${S.user}! How can I help you today?`;
      if (/how are you/.test(s)) return "I'm running at a cool " + (B.oc ? '64' : '40') + "°C and feeling great. Thanks for asking!";
      if (/who are you|your name/.test(s)) return "I'm Nova, the assistant built into RestaurantOS. I can open apps, change settings, set timers, do math and tell terrible jokes.";
      if (/what can you do|help/.test(s)) return 'Try:\n• "Open Calculator"\n• "Set a timer for 5 minutes"\n• "Remind me to stretch in 10 minutes"\n• "Add buy milk to my list"\n• "Dark mode" / "Light mode"\n• "Change wallpaper"\n• "Volume 40"\n• "What time is it?"\n• "12 * 7 + 3"\n• "Flip a coin" / "Roll a die"\n• "Tell me a fact"';
      if ((m = s.match(/^(?:open|launch|start|run)\s+(.+)$/))) { const a = findApp(m[1].replace(/^the\s+/, '')); if (a) { setTimeout(() => WM.open(a.id), 400); return `Opening ${a.name}…`; } return `I couldn't find an app called "${m[1]}". Check RestoStore for more apps.`; }
      if (/close (all|everything)/.test(s)) { setTimeout(() => WM.wins.filter(x => x !== w).forEach(x => WM.close(x)), 300); return 'Closing all other windows.'; }
      if (/time/.test(s) && !/timer/.test(s)) return `It's ${fmtTime(new Date(), false)}.`;
      if (/date|day is it|today/.test(s)) return `Today is ${fmtDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
      if (/weather|temperature|forecast/.test(s)) { const n = Weather.now(), t = Weather.day(1); return `It's ${n.temp}° and ${n.cond.toLowerCase()} in ${S.city}. Tomorrow: ${t.cond.toLowerCase()}, high of ${t.hi}°.`; }
      if ((m = s.match(/timer (?:for )?(\d+)\s*(second|sec|minute|min|hour)/))) { const secs = +m[1] * (/^s/.test(m[2]) ? 1 : /^h/.test(m[2]) ? 3600 : 60); WM.open('clock', { timer: secs }); return `Timer set for ${m[1]} ${m[2]}${+m[1] > 1 && !m[2].endsWith('s') ? 's' : ''}. ⏱`; }
      if ((m = s.match(/remind me to (.+?) in (\d+)\s*(second|sec|minute|min|hour)/))) { const ms = +m[2] * (/^s/.test(m[3]) ? 1000 : /^h/.test(m[3]) ? 3600000 : 60000); setTimeout(() => { Snd.play('alarm'); notify('Reminder from Nova', m[1][0].toUpperCase() + m[1].slice(1), 'nova', { dur: 12000 }); }, ms); return `Okay, I'll remind you to ${m[1]} in ${m[2]} ${m[3]}${+m[2] > 1 ? 's' : ''}.`; }
      if ((m = s.match(/^(?:add|put) (.+?) (?:to|on) (?:my )?(?:list|to ?do|todos?)/))) { const t = Store.get('todos', []); t.unshift({ id: uid(), text: m[1], done: false }); Store.set('todos', t); Bus.emit('todos'); return `Added "${m[1]}" to your To Do list.`; }
      if (/dark mode|dark theme/.test(s)) { S.theme = 'dark'; applySettings(); return 'Dark mode is on. 🌙'; }
      if (/light mode|light theme/.test(s)) { S.theme = 'light'; applySettings(); return 'Light mode is on. ☀️'; }
      if (/wallpaper|background/.test(s)) { nextWallpaper(); return `Wallpaper changed to ${WALLS[S.wallpaper]?.name || 'your picture'}.`; }
      if ((m = s.match(/volume (?:to )?(\d+)/))) { S.volume = clamp(+m[1], 0, 100); applySettings(); osd('vol', S.volume); return `Volume set to ${S.volume}%.`; }
      if (/\bmute\b/.test(s)) { S.sound = false; applySettings(); return 'System sounds are muted.'; }
      if (/unmute|sound on/.test(s)) { S.sound = true; applySettings(); return 'Sounds are back on.'; }
      if (/night light/.test(s)) { S.night = !S.night; applySettings(); return 'Night light ' + (S.night ? 'on.' : 'off.'); }
      if (/focus|do not disturb|dnd/.test(s)) { S.dnd = !S.dnd; applySettings(); return 'Focus mode ' + (S.dnd ? 'on. I\'ll keep notifications quiet.' : 'off.'); }
      if (/joke|funny/.test(s)) return JOKES[Math.floor(Math.random() * JOKES.length)];
      if (/fact/.test(s)) return FACTS[Math.floor(Math.random() * FACTS.length)];
      if (/flip a coin|coin/.test(s)) return Math.random() < .5 ? 'Heads!' : 'Tails!';
      if (/roll (a )?(die|dice)/.test(s)) return '🎲 You rolled a ' + (1 + Math.floor(Math.random() * 6)) + '.';
      if (/battery/.test(s)) return `Battery is at ${Batt.level}%${Batt.charging ? ' and charging' : ''}.`;
      if (/uptime|how long/.test(s)) return `RestaurantOS has been running for ${Math.floor((Date.now() - BOOT_T) / 60000)} minutes.`;
      if (/lock/.test(s)) { setTimeout(lockScreen, 700); return 'Locking your PC. See you soon!'; }
      if (/restart|reboot/.test(s)) { setTimeout(() => restart(), 900); return 'Restarting RestaurantOS…'; }
      if (/shut ?down|turn off/.test(s)) { setTimeout(powerOff, 900); return 'Shutting down. Goodbye!'; }
      if (/thank/.test(s)) return "You're welcome! 😊";
      if (/love you/.test(s)) return "That's sweet. I'm quite fond of you too — you keep my RAM warm.";
      const ex = s.replace(/^(what is|what's|calculate|compute)\s+/, '').replace(/\?$/, '').replace(/x/g, '*');
      if (/^[\d\s+\-*/().%^]+$/.test(ex) && /\d/.test(ex)) { try { return `${ex} = ${calcEval(ex)}`; } catch (e) { } }
      return `I'm not sure about that yet. Try "what can you do?" — or I can search the RestoNet for "${q}".`;
    };
    const send = t => {
      t = (t ?? inp.value).trim(); if (!t) return; inp.value = ''; add(t, 'me'); hist.push(['me', t]);
      const typing = html('<div class="msg bot typing"><i></i><i></i><i></i></div>'); chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;
      setTimeout(() => { typing.remove(); const r = reply(t); add(r, 'bot'); hist.push(['bot', r]); Store.set('novaHist', hist.slice(-40)); Snd.play('pop'); }, 450 + Math.random() * 500);
    };
    if (hist.length) hist.forEach(([who, t]) => add(t, who)); else add(`Hi ${S.user || 'there'}! I'm Nova. Ask me to open apps, set timers, change settings, or just chat.`, 'bot');
    $('.chat-in button', w.body).onclick = () => send();
    inp.onkeydown = e => e.key === 'Enter' && send();
    $$('.sugg button', w.body).forEach(b => b.onclick = () => send(b.textContent));
    setTimeout(() => inp.focus(), 100);
  }
});

/* ---------------- TIPS ---------------- */
defApp({
  id: 'tips', name: 'Tips', glyph: 'tips', colors: ['#ffd166', '#ff7a45'], w: 640, h: 520, minW: 360, cat: 'Utilities', single: true, desc: 'Learn what RestaurantOS can do', kw: 'help guide tutorial welcome',
  run(w) {
    const T = [['rocket', 'Welcome to RestaurantOS', 'A complete desktop in your browser: real windows, a file system, more than twenty apps, a BIOS and even a recovery environment. Here are a few things worth knowing.'],
      ['search', 'Search everything', 'Press Ctrl+K anywhere to search apps, files, settings and actions. Type a sum like 12*8 to get the answer instantly.'],
      ['max', 'Snap windows', 'Drag a window to the left or right edge to fill half the screen, into a corner for a quarter, or to the top to maximize. Alt+Arrow keys do the same.'],
      ['taskview', 'Virtual desktops', 'Open Task view (Alt+V) to create up to six desktops. Switch with Alt+1…4, and right-click a window title to move it.'],
      ['palette', 'Make it yours', 'Settings › Personalization has light and dark themes, accent colors, live wallpapers, and your own photos. Window corners and icon sizes are adjustable too.'],
      ['chat', 'Meet Nova', 'Nova is your assistant. Ask it to open apps, set timers and reminders, add tasks, or change settings in plain language.'],
      ['cpu', 'Go deeper', 'Restart and press DEL to open the BIOS, F12 for the boot menu, or choose Recovery for Startup Repair and Reset. Try "neofetch" in the Terminal.']];
    let i = 0;
    const render = () => {
      const [ic, t, d] = T[i];
      w.body.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;gap:18px" class="oobe-pane"><div class="ai" style="width:96px;height:96px;border-radius:28px;background:linear-gradient(150deg,var(--accent2),var(--accent))">${svg(ic)}</div><h2 style="font-family:var(--f-display);font-weight:600;font-size:24px;margin:0;text-wrap:balance">${t}</h2><p class="muted" style="max-width:46ch;line-height:1.6;margin:0">${d}</p></div>
        <div class="row" style="justify-content:space-between;padding:16px 20px;border-top:1px solid var(--line)"><button class="btn" id="tpB" ${i ? '' : 'disabled'}>Back</button><div class="row" style="gap:6px">${T.map((_, k) => `<i style="width:${k === i ? 20 : 7}px;height:7px;border-radius:4px;background:${k === i ? 'var(--accent)' : 'var(--press)'};transition:.3s;display:block"></i>`).join('')}</div><button class="btn primary" id="tpN">${i === T.length - 1 ? 'Get started' : 'Next'}</button></div>`;
      $('#tpB', w.body).onclick = () => { i--; render(); };
      $('#tpN', w.body).onclick = () => { if (i === T.length - 1) WM.close(w); else { i++; render(); } };
    };
    winKeys(w, e => { if (e.key === 'ArrowRight' && i < T.length - 1) { i++; render(); } if (e.key === 'ArrowLeft' && i) { i--; render(); } });
    render();
  }
});

/* ---------------- CONVERTER (store) ---------------- */
defApp({
  id: 'converter', name: 'Unit Converter', glyph: 'convert', colors: ['#2ec4b6', '#1b6f8a'], w: 520, h: 460, minW: 340, cat: 'Utilities', core: false, desc: 'Length, weight, temperature, data and more', kw: 'units measure convert',
  run(w) {
    const U = { Length: { m: 1, km: 1000, cm: .01, mm: .001, mi: 1609.344, yd: .9144, ft: .3048, in: .0254 }, Weight: { kg: 1, g: .001, mg: 1e-6, t: 1000, lb: .45359237, oz: .028349523 }, Temperature: { '°C': 'c', '°F': 'f', K: 'k' }, Data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: .125 }, Speed: { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, knot: 1.852 }, Time: { s: 1, min: 60, h: 3600, day: 86400, week: 604800, year: 31557600 } };
    let cat = 'Length';
    const conv = (v, a, b) => { if (cat !== 'Temperature') return v * U[cat][a] / U[cat][b]; const c = a === '°C' ? v : a === '°F' ? (v - 32) * 5 / 9 : v - 273.15; return b === '°C' ? c : b === '°F' ? c * 9 / 5 + 32 : c + 273.15; };
    const render = () => {
      const units = Object.keys(U[cat]);
      w.body.innerHTML = `<div class="tabs">${Object.keys(U).map(c => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div><div class="pad" style="display:grid;gap:14px">
        <div class="card"><input class="inp" id="cvA" type="number" value="1" style="font-size:28px;font-family:var(--f-display);border:0;background:none;padding:4px 0" aria-label="From value"><select class="inp" id="cuA" style="width:auto" aria-label="From unit">${units.map(u => `<option>${u}</option>`).join('')}</select></div>
        <div style="text-align:center"><button class="btn sm" id="cvSw">⇅ Swap</button></div>
        <div class="card"><input class="inp" id="cvB" type="number" style="font-size:28px;font-family:var(--f-display);border:0;background:none;padding:4px 0" aria-label="To value"><select class="inp" id="cuB" style="width:auto" aria-label="To unit">${units.map((u, i) => `<option ${i === 1 ? 'selected' : ''}>${u}</option>`).join('')}</select></div></div>`;
      const A = $('#cvA', w.body), Bv = $('#cvB', w.body), ua = $('#cuA', w.body), ub = $('#cuB', w.body);
      const fwd = () => Bv.value = +conv(+A.value, ua.value, ub.value).toPrecision(10); const bwd = () => A.value = +conv(+Bv.value, ub.value, ua.value).toPrecision(10);
      A.oninput = fwd; Bv.oninput = bwd; ua.onchange = ub.onchange = fwd; $('#cvSw', w.body).onclick = () => { const t = ua.value; ua.value = ub.value; ub.value = t; fwd(); }; fwd();
      $$('[data-c]', w.body).forEach(b => b.onclick = () => { cat = b.dataset.c; render(); });
    };
    render();
  }
});

/* ---------------- PIANO (store) ---------------- */
defApp({
  id: 'piano', name: 'Piano', glyph: 'piano', colors: ['#374151', '#111827'], w: 760, h: 400, cat: 'Media', core: false, desc: 'Play and record melodies', kw: 'music keyboard instrument',
  run(w) {
    Snd.init(); const ctx = Snd.ctx; let wave = 'grand', rec = null, recording = false; const held = {};
    const KEYS = 'awsedftgyhujkolp;\''.split(''); const N = 24, base = 60;
    const isBlack = n => [1, 3, 6, 8, 10].includes(n % 12);
    const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const play = (n, vel = .25) => {
      if (!ctx) return; const t = ctx.currentTime, f = midi(base + n); const g = ctx.createGain(); g.connect(ctx.destination); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel * (S.volume / 100), t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (wave === 'grand' ? 2.2 : 1.2));
      const types = wave === 'grand' ? [['triangle', 1, 1], ['sine', 2, .3], ['sine', 3, .1]] : [[wave, 1, 1]];
      types.forEach(([ty, m, v]) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = ty; o.frequency.value = f * m; og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.4); });
      if (recording) rec.push([performance.now() - rec.t0, n]);
      const k = $(`.pk[data-n="${n}"]`, w.body); if (k) { k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 180); }
    };
    let whites = 0, keysHtml = '';
    for (let n = 0; n < N; n++) { if (isBlack(n)) keysHtml += `<div class="pk b" data-n="${n}" style="left:${whites * 44}px">${KEYS[n] ? KEYS[n].toUpperCase() : ''}</div>`; else { keysHtml += `<div class="pk" data-n="${n}">${KEYS[n] ? KEYS[n].toUpperCase() : names[n % 12] + (4 + Math.floor(n / 12))}</div>`; whites++; } }
    w.body.innerHTML = `<div class="app-tb"><select class="inp" style="width:auto;padding:5px 8px" aria-label="Sound">${[['grand', 'Grand piano'], ['sine', 'Soft sine'], ['square', 'Chiptune'], ['sawtooth', 'Synth lead']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select><button class="tbtn" id="pRec">${svg('mic')} Record</button><button class="tbtn" id="pPlay" disabled>${svg('play')} Play back</button><span class="grow"></span><span class="muted" style="font-size:12px">Use your keyboard: A W S E D F T G Y H U J K…</span></div><div class="game-wrap" style="overflow:auto"><div class="piano">${keysHtml}</div></div>`;
    $('select', w.body).onchange = e => wave = e.target.value;
    $$('.pk', w.body).forEach(k => k.onpointerdown = e => { e.preventDefault(); play(+k.dataset.n); });
    $('#pRec', w.body).onclick = e => { recording = !recording; if (recording) { rec = []; rec.t0 = performance.now(); e.currentTarget.classList.add('on'); e.currentTarget.innerHTML = svg('pause') + ' Stop'; } else { e.currentTarget.classList.remove('on'); e.currentTarget.innerHTML = svg('mic') + ' Record'; $('#pPlay', w.body).disabled = !rec.length; } };
    $('#pPlay', w.body).onclick = () => rec && rec.forEach(([t, n]) => setTimeout(() => { const r = recording; recording = false; play(n); recording = r; }, t));
    winKeys(w, e => { if (e.target.closest('input,select') || e.repeat || e.ctrlKey || e.altKey) return; const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0 && i < N) { e.preventDefault(); play(i); } });
  }
});
