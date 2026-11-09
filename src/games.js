/* =====================================================================
   Apps (3/3): Games — Snake, Minesweeper, 2048, Tic-Tac-Toe,
   Breakout, Memory Match
   ===================================================================== */
function gameOver(w, title, sub, again) {
  const o = html(`<div class="game-over"><div><h2>${esc(title)}</h2><p style="opacity:.85;margin:0 0 16px">${sub}</p><button class="btn primary">Play again</button></div></div>`);
  $('.game-wrap', w.body).appendChild(o); o.querySelector('button').onclick = () => { o.remove(); again(); }; o.querySelector('button').focus();
}
const hiScore = (k, v) => { const best = Store.get('hi:' + k, 0); if (v > best) { Store.set('hi:' + k, v); return v; } return best; };

/* ---------------- SNAKE ---------------- */
defApp({
  id: 'snake', name: 'Snake', glyph: 'snake', colors: ['#3ddc97', '#15803d'], w: 520, h: 600, minW: 360, cat: 'Games', core: false, desc: 'Classic snake with speed levels', kw: 'game arcade',
  run(w) {
    const N = 20; let snake, dir, nd, food, score, timer, speed, paused, alive, bonus;
    w.body.innerHTML = `<div class="game-wrap"><div class="game-hud"><span>Score <b class="sc">0</b></span><span>Best <b class="hs">${Store.get('hi:snake', 0)}</b></span><span class="muted">Arrows / WASD · Space to pause</span></div><canvas width="400" height="400" style="border-radius:12px;max-width:100%;touch-action:none"></canvas><div class="row"><button class="btn sm" data-d="ArrowLeft">←</button><button class="btn sm" data-d="ArrowUp">↑</button><button class="btn sm" data-d="ArrowDown">↓</button><button class="btn sm" data-d="ArrowRight">→</button></div></div>`;
    const cv = $('canvas', w.body), x = cv.getContext('2d'), C = 400 / N;
    const place = () => { let p; do p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; while (snake.some(s => s.x === p.x && s.y === p.y)); return p; };
    const reset = () => { snake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }]; dir = nd = { x: 1, y: 0 }; score = 0; speed = 130; paused = false; alive = true; food = place(); bonus = null; $('.sc', w.body).textContent = 0; clearInterval(timer); timer = setInterval(tick, speed); draw(); };
    const tick = () => {
      if (paused || !alive) return; dir = nd;
      const h = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N };
      if (snake.some(s => s.x === h.x && s.y === h.y)) { alive = false; Snd.play('lose'); clearInterval(timer); const b = hiScore('snake', score); $('.hs', w.body).textContent = b; gameOver(w, 'Game over', `Score ${score} · Best ${b}`, reset); return; }
      snake.unshift(h);
      if (h.x === food.x && h.y === food.y) { score += 10; Snd.play('eat'); food = place(); if (score % 50 === 0) { speed = Math.max(55, speed - 12); clearInterval(timer); timer = setInterval(tick, speed); bonus = { ...place(), t: 40 }; } }
      else if (bonus && h.x === bonus.x && h.y === bonus.y) { score += 30; Snd.play('success'); bonus = null; }
      else snake.pop();
      if (bonus && --bonus.t <= 0) bonus = null;
      $('.sc', w.body).textContent = score; draw();
    };
    const draw = () => {
      x.fillStyle = '#0d1a12'; x.fillRect(0, 0, 400, 400);
      x.fillStyle = 'rgba(255,255,255,.03)'; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if ((i + j) % 2) x.fillRect(i * C, j * C, C, C);
      x.fillStyle = '#ff5d6c'; x.beginPath(); x.arc(food.x * C + C / 2, food.y * C + C / 2, C / 2.4, 0, 7); x.fill();
      if (bonus) { x.fillStyle = '#ffd166'; x.beginPath(); x.arc(bonus.x * C + C / 2, bonus.y * C + C / 2, C / 2.2 + Math.sin(Date.now() / 100) * 2, 0, 7); x.fill(); }
      snake.forEach((s, i) => { x.fillStyle = i ? `hsl(150,70%,${55 - i / snake.length * 25}%)` : '#7dffb8'; x.beginPath(); x.roundRect ? x.roundRect(s.x * C + 1, s.y * C + 1, C - 2, C - 2, 5) : x.rect(s.x * C + 1, s.y * C + 1, C - 2, C - 2); x.fill(); });
      if (paused) { x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(0, 0, 400, 400); x.fillStyle = '#fff'; x.font = '600 28px Unbounded'; x.textAlign = 'center'; x.fillText('Paused', 200, 210); x.textAlign = 'start'; }
    };
    const steer = k => { const m = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[k]; if (m && (m[0] !== -dir.x || m[1] !== -dir.y)) { nd = { x: m[0], y: m[1] }; return true; } };
    winKeys(w, e => { if (e.key === ' ') { paused = !paused; draw(); e.preventDefault(); } else if (steer(e.key.length === 1 ? e.key.toLowerCase() : e.key)) e.preventDefault(); });
    $$('[data-d]', w.body).forEach(b => b.onclick = () => steer(b.dataset.d));
    let ts; cv.ontouchstart = e => ts = e.touches[0]; cv.ontouchend = e => { const t = e.changedTouches[0], dx = t.clientX - ts.clientX, dy = t.clientY - ts.clientY; steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp')); };
    w.on('close', () => clearInterval(timer));
    reset();
  }
});

/* ---------------- MINESWEEPER ---------------- */
defApp({
  id: 'minesweeper', name: 'Minesweeper', glyph: 'bomb', colors: ['#6b7280', '#1f2937'], w: 560, h: 620, minW: 340, cat: 'Games', core: false, desc: 'Clear the field without hitting a mine', kw: 'game puzzle mines',
  run(w) {
    const LV = { Easy: [9, 9, 10], Medium: [14, 14, 30], Hard: [16, 20, 55] }; let lv = 'Easy', R, Cc, M, grid, first, over, flags, t0, tmr;
    const COL = ['', '#4cc9f0', '#3ddc97', '#ff5d6c', '#c77dff', '#ff7a45', '#2ec4b6', '#e9eef3', '#9aa6b2'];
    const reset = () => {
      [R, Cc, M] = LV[lv]; grid = Array.from({ length: R * Cc }, () => ({ m: false, o: false, f: false, n: 0 })); first = true; over = false; flags = 0; clearInterval(tmr); t0 = 0;
      w.body.innerHTML = `<div class="game-wrap"><div class="game-hud"><select class="inp" style="width:auto;padding:4px 8px" aria-label="Difficulty">${Object.keys(LV).map(l => `<option ${l === lv ? 'selected' : ''}>${l}</option>`).join('')}</select><span>💣 <b class="mf">${M}</b></span><span>⏱ <b class="tm">0</b></span><button class="btn sm" id="msR">New game</button></div><div class="ms-grid" style="grid-template-columns:repeat(${Cc},28px)">${grid.map((_, i) => `<div class="ms-c" data-i="${i}"></div>`).join('')}</div><div class="muted" style="font-size:12px">Right-click (or long-press) to flag · Best ${lv}: ${Store.get('hi:ms' + lv, 0) ? Store.get('hi:ms' + lv) + 's' : '—'}</div></div>`;
      $('select', w.body).onchange = e => { lv = e.target.value; const s = { Easy: [380, 520], Medium: [520, 640], Hard: [660, 700] }[lv]; w.el.style.width = s[0] + 'px'; w.el.style.height = Math.min(s[1], innerHeight - 70) + 'px'; reset(); };
      $('#msR', w.body).onclick = reset;
      $$('.ms-c', w.body).forEach(c => { const i = +c.dataset.i; c.onclick = () => open(i); c.oncontextmenu = e => { e.preventDefault(); flag(i); }; let lt; c.ontouchstart = () => lt = setTimeout(() => { flag(i); lt = null; }, 450); c.ontouchend = e => { if (lt) clearTimeout(lt); else e.preventDefault(); }; });
    };
    const nb = i => { const r = Math.floor(i / Cc), c = i % Cc, out = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < Cc) out.push(rr * Cc + cc); } return out; };
    const seed = safe => { const ban = new Set([safe, ...nb(safe)]); let k = 0; while (k < M) { const i = Math.floor(Math.random() * R * Cc); if (!grid[i].m && !ban.has(i)) { grid[i].m = true; k++; } } grid.forEach((g, i) => g.n = nb(i).filter(j => grid[j].m).length); t0 = Date.now(); tmr = setInterval(() => { const e = $('.tm', w.body); if (e) e.textContent = Math.floor((Date.now() - t0) / 1000); }, 500); };
    const paint = i => { const g = grid[i], c = $(`[data-i="${i}"]`, w.body); if (!c) return; c.className = 'ms-c' + (g.o ? ' o' : '') + (g.boom ? ' boom' : ''); c.textContent = g.o ? (g.m ? '💣' : g.n || '') : g.f ? '🚩' : ''; c.style.color = COL[g.n] || ''; };
    const open = i => {
      if (over) return; const g = grid[i]; if (g.f || g.o) return; if (first) { first = false; seed(i); }
      if (g.m) { over = true; g.boom = true; clearInterval(tmr); grid.forEach((x, j) => { if (x.m) x.o = true; paint(j); }); Snd.play('lose'); gameOver(w, 'Boom!', 'You hit a mine.', reset); return; }
      const st = [i]; while (st.length) { const k = st.pop(), x = grid[k]; if (x.o || x.f) continue; x.o = true; paint(k); if (!x.n) nb(k).forEach(j => !grid[j].o && st.push(j)); }
      Snd.play('click');
      if (grid.filter(x => !x.o).length === M) { over = true; clearInterval(tmr); const s = Math.floor((Date.now() - t0) / 1000); const best = Store.get('hi:ms' + lv, 0); if (!best || s < best) Store.set('hi:ms' + lv, s); Snd.play('success'); gameOver(w, 'You win! 🎉', `Cleared ${lv} in ${s}s${!best || s < best ? ' — new record!' : ''}`, reset); }
    };
    const flag = i => { const g = grid[i]; if (over || g.o) return; g.f = !g.f; flags += g.f ? 1 : -1; $('.mf', w.body).textContent = M - flags; paint(i); Snd.play('toggle'); };
    w.on('close', () => clearInterval(tmr));
    reset();
  }
});

/* ---------------- 2048 ---------------- */
defApp({
  id: 'g2048', name: '2048', glyph: 'grid', colors: ['#f4a261', '#c2410c'], w: 440, h: 580, minW: 380, cat: 'Games', core: false, desc: 'Slide tiles and reach 2048', kw: 'game puzzle numbers',
  run(w) {
    const COL = { 2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#fff'], 16: ['#f59563', '#fff'], 32: ['#f67c5f', '#fff'], 64: ['#f65e3b', '#fff'], 128: ['#edcf72', '#fff'], 256: ['#edcc61', '#fff'], 512: ['#edc850', '#fff'], 1024: ['#edc53f', '#fff'], 2048: ['#edc22e', '#fff'] };
    let b, score, won, tiles, idc = 0;
    w.body.innerHTML = `<div class="game-wrap"><div class="game-hud"><span>Score <b class="sc">0</b></span><span>Best <b class="hs">${Store.get('hi:2048', 0)}</b></span><button class="btn sm" id="gR">New game</button></div><div class="g2048">${'<div class="cell"></div>'.repeat(16)}</div><div class="muted" style="font-size:12px">Arrow keys or swipe</div></div>`;
    const board = $('.g2048', w.body);
    const add = () => { const e = []; b.forEach((v, i) => !v && e.push(i)); if (!e.length) return; const i = e[Math.floor(Math.random() * e.length)]; b[i] = { v: Math.random() < .9 ? 2 : 4, id: ++idc, nw: true }; };
    const draw = () => {
      const seen = new Set();
      b.forEach((t, i) => { if (!t) return; seen.add(t.id); let el = board.querySelector(`[data-id="${t.id}"]`); if (!el) { el = html(`<div class="tile" data-id="${t.id}"></div>`); board.appendChild(el); } const [bg, fg] = COL[t.v] || ['#3c3a32', '#fff']; el.style.background = bg; el.style.color = fg; el.style.fontSize = t.v >= 1024 ? '20px' : t.v >= 128 ? '23px' : '26px'; el.textContent = t.v; el.style.left = 8 + (i % 4) * 80 + 'px'; el.style.top = 8 + Math.floor(i / 4) * 80 + 'px'; if (t.mg) { el.animate([{ transform: 'scale(1.2)' }, { transform: 'scale(1)' }], 150); t.mg = false; } });
      board.querySelectorAll('.tile').forEach(el => !seen.has(+el.dataset.id) && el.remove());
      $('.sc', w.body).textContent = score; $('.hs', w.body).textContent = hiScore('2048', score);
    };
    const reset = () => { b = Array(16).fill(null); score = 0; won = false; board.querySelectorAll('.tile').forEach(e => e.remove()); add(); add(); draw(); };
    const move = d => {
      let moved = false; const lines = [];
      for (let k = 0; k < 4; k++) { const idx = []; for (let j = 0; j < 4; j++) idx.push(d === 'L' ? k * 4 + j : d === 'R' ? k * 4 + 3 - j : d === 'U' ? j * 4 + k : (3 - j) * 4 + k); lines.push(idx); }
      lines.forEach(idx => {
        const row = idx.map(i => b[i]).filter(Boolean); const out = [];
        for (let i = 0; i < row.length; i++) { if (row[i + 1] && row[i].v === row[i + 1].v) { const v = row[i].v * 2; out.push({ v, id: row[i + 1].id, mg: true }); score += v; if (v === 2048 && !won) { won = true; setTimeout(() => gameOver(w, 'You made 2048! 🏆', 'Keep going for a higher score.', () => { }), 300); } i++; } else out.push(row[i]); }
        idx.forEach((i, j) => { const n = out[j] || null; if ((b[i] && b[i].id) !== (n && n.id)) moved = true; b[i] = n; });
      });
      if (!moved) return; Snd.play('pop'); add(); draw();
      const canMove = b.some((t, i) => !t || (i % 4 < 3 && b[i + 1] && b[i + 1].v === t.v) || (i < 12 && b[i + 4] && b[i + 4].v === t.v));
      if (!canMove) { Snd.play('lose'); gameOver(w, 'No more moves', `Final score ${score}`, reset); }
    };
    winKeys(w, e => { const m = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' }[e.key]; if (m) { e.preventDefault(); move(m); } });
    let ts; board.onpointerdown = e => ts = [e.clientX, e.clientY]; board.onpointerup = e => { if (!ts) return; const dx = e.clientX - ts[0], dy = e.clientY - ts[1]; if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); ts = null; };
    $('#gR', w.body).onclick = reset;
    reset();
  }
});

/* ---------------- TIC-TAC-TOE ---------------- */
defApp({
  id: 'ttt', name: 'Tic-Tac-Toe', glyph: 'ttt', colors: ['#ff4d6d', '#7b61ff'], w: 420, h: 520, minW: 340, cat: 'Games', core: false, desc: 'Beat the unbeatable CPU, or play a friend', kw: 'game noughts crosses',
  run(w) {
    let b, turn, over, mode = 'cpu', sc = Store.get('tttScore', { x: 0, o: 0, d: 0 });
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const win = bb => { for (const l of L) if (bb[l[0]] && bb[l[0]] === bb[l[1]] && bb[l[1]] === bb[l[2]]) return l; return null; };
    const mm = (bb, p) => { const wl = win(bb); if (wl) return { s: bb[wl[0]] === 'O' ? 10 : -10 }; if (bb.every(Boolean)) return { s: 0 }; let best = { s: p === 'O' ? -99 : 99 }; bb.forEach((v, i) => { if (v) return; bb[i] = p; const r = mm(bb, p === 'O' ? 'X' : 'O'); bb[i] = null; if (p === 'O' ? r.s > best.s : r.s < best.s) best = { s: r.s, i }; }); return best; };
    const render = (wl) => {
      w.body.innerHTML = `<div class="game-wrap"><div class="game-hud"><span style="color:var(--accent)">X <b>${sc.x}</b></span><span>Draw <b>${sc.d}</b></span><span style="color:var(--tide)">O <b>${sc.o}</b></span></div><div class="tabs" style="border:0"><button data-m="cpu" class="${mode === 'cpu' ? 'on' : ''}">vs CPU</button><button data-m="pvp" class="${mode === 'pvp' ? 'on' : ''}">2 players</button></div>
        <div class="ttt">${b.map((v, i) => `<button data-i="${i}" class="${v ? v.toLowerCase() : ''} ${wl && wl.includes(i) ? 'win' : ''}" aria-label="Cell ${i + 1}">${v || ''}</button>`).join('')}</div><div class="muted st" style="font-size:13px">${over ? '' : (turn === 'X' ? 'Your move (X)' : mode === 'cpu' ? 'CPU is thinking…' : 'O to move')}</div><button class="btn sm" id="tR">New round</button></div>`;
      $$('[data-i]', w.body).forEach(c => c.onclick = () => play(+c.dataset.i));
      $$('[data-m]', w.body).forEach(c => c.onclick = () => { mode = c.dataset.m; reset(); });
      $('#tR', w.body).onclick = reset;
    };
    const end = () => { const wl = win(b); if (wl || b.every(Boolean)) { over = true; const r = wl ? b[wl[0]] : null; if (r === 'X') sc.x++; else if (r === 'O') sc.o++; else sc.d++; Store.set('tttScore', sc); render(wl); $('.st', w.body).textContent = r ? (mode === 'cpu' ? (r === 'X' ? 'You win! 🎉' : 'CPU wins.') : r + ' wins!') : "It's a draw."; Snd.play(r === 'X' || (r && mode === 'pvp') ? 'success' : r ? 'lose' : 'pop'); return true; } return false; };
    const play = i => {
      if (over || b[i] || (mode === 'cpu' && turn === 'O')) return; b[i] = turn; Snd.play('click'); turn = turn === 'X' ? 'O' : 'X'; render(); if (end()) return;
      if (mode === 'cpu') setTimeout(() => { const m = Math.random() < .15 ? { i: b.map((v, k) => v ? -1 : k).filter(k => k >= 0)[0] } : mm(b.slice(), 'O'); b[m.i] = 'O'; turn = 'X'; render(); end(); }, 450);
    };
    const reset = () => { b = Array(9).fill(null); turn = 'X'; over = false; render(); };
    reset();
  }
});

/* ---------------- BREAKOUT ---------------- */
defApp({
  id: 'breakout', name: 'Breakout', glyph: 'brick', colors: ['#4cc9f0', '#7b61ff'], w: 620, h: 560, minW: 420, cat: 'Games', core: false, desc: 'Smash every brick with the ball', kw: 'game arcade bricks arkanoid',
  run(w) {
    const W = 560, H = 440; let pad, ball, bricks, score, lives, level, raf, state;
    w.body.innerHTML = `<div class="game-wrap"><div class="game-hud"><span>Score <b class="sc">0</b></span><span>Lives <b class="lv">3</b></span><span>Level <b class="lvl">1</b></span><span>Best <b class="hs">${Store.get('hi:breakout', 0)}</b></span></div><canvas width="${W}" height="${H}" style="border-radius:12px;max-width:100%;cursor:none;touch-action:none"></canvas><div class="muted" style="font-size:12px">Move the mouse or ← → · Click or Space to launch</div></div>`;
    const cv = $('canvas', w.body), x = cv.getContext('2d');
    const build = () => { bricks = []; const rows = 4 + Math.min(level, 4); for (let r = 0; r < rows; r++) for (let c = 0; c < 10; c++) bricks.push({ x: 10 + c * 54, y: 40 + r * 22, w: 50, h: 18, hp: r < level - 1 ? 2 : 1, c: `hsl(${r * 35 + 10},80%,60%)` }); };
    const resetBall = () => { ball = { x: pad.x + pad.w / 2, y: H - 40, vx: 0, vy: 0, r: 7 }; state = 'ready'; };
    const reset = () => { pad = { x: W / 2 - 45, w: 90 }; score = 0; lives = 3; level = 1; build(); resetBall(); hud(); };
    const hud = () => { $('.sc', w.body).textContent = score; $('.lv', w.body).textContent = lives; $('.lvl', w.body).textContent = level; $('.hs', w.body).textContent = hiScore('breakout', score); };
    const launch = () => { if (state !== 'ready') return; const sp = 4.5 + level * .6; ball.vx = sp * (Math.random() < .5 ? -.6 : .6); ball.vy = -sp; state = 'play'; };
    const keys = {};
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (keys.ArrowLeft) pad.x -= 8; if (keys.ArrowRight) pad.x += 8; pad.x = clamp(pad.x, 0, W - pad.w);
      if (state === 'ready') { ball.x = pad.x + pad.w / 2; ball.y = H - 40; }
      if (state === 'play') {
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < ball.r || ball.x > W - ball.r) { ball.vx *= -1; ball.x = clamp(ball.x, ball.r, W - ball.r); }
        if (ball.y < ball.r) { ball.vy *= -1; ball.y = ball.r; }
        if (ball.y > H - 30 - ball.r && ball.y < H - 18 && ball.x > pad.x - 4 && ball.x < pad.x + pad.w + 4 && ball.vy > 0) { const hit = (ball.x - (pad.x + pad.w / 2)) / (pad.w / 2); const sp = Math.hypot(ball.vx, ball.vy); ball.vx = sp * Math.sin(hit * 1.05); ball.vy = -sp * Math.cos(hit * 1.05); Snd.play('click'); }
        if (ball.y > H + 20) { lives--; hud(); Snd.play('error'); if (lives <= 0) { state = 'over'; Snd.play('lose'); gameOver(w, 'Game over', `Score ${score} · reached level ${level}`, reset); } else resetBall(); }
        for (const b of bricks) { if (b.hp <= 0) continue; if (ball.x > b.x - ball.r && ball.x < b.x + b.w + ball.r && ball.y > b.y - ball.r && ball.y < b.y + b.h + ball.r) { b.hp--; score += 10; hud(); Snd.play('eat'); const ox = Math.min(ball.x - b.x + ball.r, b.x + b.w - ball.x + ball.r), oy = Math.min(ball.y - b.y + ball.r, b.y + b.h - ball.y + ball.r); ox < oy ? ball.vx *= -1 : ball.vy *= -1; break; } }
        if (bricks.every(b => b.hp <= 0)) { level++; Snd.play('success'); build(); resetBall(); hud(); }
      }
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1325'); g.addColorStop(1, '#1a0f2e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      bricks.forEach(b => { if (b.hp <= 0) return; x.fillStyle = b.c; x.globalAlpha = b.hp > 1 ? 1 : .85; x.fillRect(b.x, b.y, b.w, b.h); x.globalAlpha = 1; if (b.hp > 1) { x.strokeStyle = '#fff'; x.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3); } });
      x.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#ff7a45'; x.fillRect(pad.x, H - 28, pad.w, 10);
      x.shadowColor = '#fff'; x.shadowBlur = 12; x.fillStyle = '#fff'; x.beginPath(); x.arc(ball.x, ball.y, ball.r, 0, 7); x.fill(); x.shadowBlur = 0;
      if (state === 'ready') { x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '14px Outfit'; x.textAlign = 'center'; x.fillText('Click or press Space to launch', W / 2, H / 2 + 60); x.textAlign = 'start'; }
    };
    cv.onpointermove = e => { const r = cv.getBoundingClientRect(); pad.x = (e.clientX - r.left) * W / r.width - pad.w / 2; };
    cv.onclick = launch;
    winKeys(w, e => { if (e.key === ' ') { e.preventDefault(); launch(); } if (e.key.startsWith('Arrow')) { keys[e.key] = true; e.preventDefault(); } });
    const ku = e => keys[e.key] = false; document.addEventListener('keyup', ku);
    w.on('close', () => { cancelAnimationFrame(raf); document.removeEventListener('keyup', ku); });
    reset(); loop();
  }
});

/* ---------------- MEMORY MATCH ---------------- */
defApp({
  id: 'memory', name: 'Memory Match', glyph: 'cards', colors: ['#ff7a45', '#ff4d6d'], w: 440, h: 540, minW: 360, cat: 'Games', core: false, desc: 'Flip cards and find all the pairs', kw: 'game cards concentration',
  run(w) {
    const SYM = ['heart', 'star', 'bolt', 'rocket', 'diamond', 'music', 'moon', 'leaf'];
    let cards, open, moves, matched, lock, t0;
    const reset = () => {
      cards = [...SYM, ...SYM].map(s => ({ s, f: false, m: false })).sort(() => Math.random() - .5); open = []; moves = 0; matched = 0; lock = false; t0 = Date.now();
      w.body.innerHTML = `<div class="game-wrap"><div class="game-hud"><span>Moves <b class="mv">0</b></span><span>Pairs <b class="pr">0</b>/8</span><span>Best <b>${Store.get('hi:memory', 0) || '—'}</b></span></div><div class="mem-grid">${cards.map((c, i) => `<div class="mem-c" data-i="${i}" tabindex="0" role="button" aria-label="Card"><div class="bk"></div><div class="fr">${svg(c.s)}</div></div>`).join('')}</div><button class="btn sm" id="mR">Shuffle</button></div>`;
      $$('.mem-c', w.body).forEach(el => { el.onclick = () => flip(+el.dataset.i); el.onkeydown = e => e.key === 'Enter' && flip(+el.dataset.i); });
      $('#mR', w.body).onclick = reset;
    };
    const flip = i => {
      const c = cards[i]; if (lock || c.f || c.m) return; c.f = true; $(`[data-i="${i}"]`, w.body).classList.add('f'); Snd.play('click'); open.push(i);
      if (open.length === 2) {
        moves++; $('.mv', w.body).textContent = moves; const [a, b] = open;
        if (cards[a].s === cards[b].s) { cards[a].m = cards[b].m = true; matched++; open = []; $('.pr', w.body).textContent = matched; [a, b].forEach(k => $(`[data-i="${k}"]`, w.body).classList.add('m')); Snd.play('success');
          if (matched === 8) { const best = Store.get('hi:memory', 0); if (!best || moves < best) Store.set('hi:memory', moves); setTimeout(() => gameOver(w, 'All pairs found! 🎉', `${moves} moves in ${Math.round((Date.now() - t0) / 1000)}s${!best || moves < best ? ' — new best!' : ''}`, reset), 500); } }
        else { lock = true; setTimeout(() => { [a, b].forEach(k => { cards[k].f = false; $(`[data-i="${k}"]`, w.body)?.classList.remove('f'); }); open = []; lock = false; }, 800); }
      }
    };
    reset();
  }
});
