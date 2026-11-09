/* =====================================================================
   Apps (1/3): Files, Notepad, Terminal, Calculator, Settings, Browser
   ===================================================================== */
function pickFile(title = 'Open', filter = () => true) {
  return new Promise(res => {
    const files = FS.walk('/').filter(f => !f.dir && !f.path.startsWith('/Trash') && filter(f));
    const back = html(`<div class="modal-back"><div class="modal glass" style="width:min(520px,calc(100vw - 32px))"><h3>${esc(title)}</h3><div class="sm-list" style="max-height:50vh;overflow:auto;margin:10px -6px">${files.map((f, i) => `<button class="sm-row" data-i="${i}">${fileIcon(f.name)}<div style="min-width:0"><div>${esc(f.name)}</div><small>${esc(f.path)}</small></div></button>`).join('') || '<div class="muted" style="padding:10px">No matching files.</div>'}</div><div class="acts"><button class="btn" data-x>Cancel</button></div></div></div>`);
    $('#os').appendChild(back);
    back.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { back.remove(); res(files[+b.dataset.i].path); });
    back.querySelector('[data-x]').onclick = () => { back.remove(); res(null); };
    back.onpointerdown = e => { if (e.target === back) { back.remove(); res(null); } };
  });
}
function onWin(w, ev, fn) { Bus.on(ev, fn); w.on('close', () => Bus.off(ev, fn)); }
function winKeys(w, fn) { const h = e => { if (WM.active === w && STAGE === 'os' && !$('.modal-back') && !$('#spot.open')) fn(e); }; document.addEventListener('keydown', h); w.on('close', () => document.removeEventListener('keydown', h)); }

/* ---------------- FILES ---------------- */
defApp({
  id: 'files', name: 'Files', glyph: 'files', colors: ['#ffd36e', '#f08a20'], w: 900, h: 580, cat: 'System', desc: 'Browse and manage your files', kw: 'explorer folder finder',
  run(w, args) {
    let path = args.path || '/', hist = [path], hi = 0, view = Store.get('fxView', 'grid'), sel = null, q = '';
    w.onArgs = a => a.path && go(a.path);
    w.body.innerHTML = `<div class="app-tb">
      <button class="tbtn" data-a="back" title="Back">${svg('back')}</button><button class="tbtn" data-a="fwd" title="Forward">${svg('fwd')}</button><button class="tbtn" data-a="up" title="Up">${svg('up')}</button>
      <div class="fx-path"></div><input class="fx-search" placeholder="Search" aria-label="Search files">
      <button class="tbtn" data-a="newf" title="New folder">${svg('newfolder')}</button><button class="tbtn" data-a="newt" title="New file">${svg('newfile')}</button>
      <button class="tbtn" data-a="import" title="Import from your computer">${svg('download')}</button>
      <button class="tbtn" data-a="view" title="Change view">${svg('list')}</button></div>
      <div class="split"><nav class="side"></nav><div class="scroll grow fx-main" tabindex="0" style="flex:1"></div></div><div class="statusbar"></div><input type="file" multiple hidden>`;
    const side = $('.side', w.body), main = $('.fx-main', w.body), crumbs = $('.fx-path', w.body), status = $('.statusbar', w.body), fin = $('input[type=file]', w.body);
    const places = [['/', 'Home', 'home'], ['/Desktop', 'Desktop', 'display'], ['/Documents', 'Documents', 'doc'], ['/Pictures', 'Pictures', 'image'], ['/Music', 'Music', 'music'], ['/Downloads', 'Downloads', 'download'], ['/Trash', 'Recycle Bin', 'trash']];
    const go = (p, push = true) => { if (!FS.node(p) || FS.node(p).t !== 'd') return; path = p; sel = null; q = ''; $('.fx-search', w.body).value = ''; if (push) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; } render(); };
    const render = () => {
      side.innerHTML = '<div class="sh">Places</div>' + places.map(([p, n, ic]) => `<button data-p="${p}" class="${path === p ? 'on' : ''}">${svg(ic)}<span>${n}</span></button>`).join('') + `<div class="sh">Storage</div><div style="padding:4px 10px;font-size:12px" class="muted">RestoDrive (C:)<div class="meter" style="margin-top:6px;height:6px"><i style="width:${Math.min(100, Store.size() / 50000)}%;background:var(--accent)"></i></div>${fmtSize(Store.size())} of 5 MB</div>`;
      $$('[data-p]', side).forEach(b => b.onclick = () => go(b.dataset.p));
      const parts = FS.parts(path);
      crumbs.innerHTML = `<button data-c="/">Home</button>` + parts.map((s, i) => `<span class="muted">›</span><button data-c="/${parts.slice(0, i + 1).join('/')}">${esc(s === 'Trash' && i === 0 ? 'Recycle Bin' : s)}</button>`).join('');
      $$('[data-c]', crumbs).forEach(b => b.onclick = () => go(b.dataset.c));
      let items = q ? FS.walk(path).filter(e => e.name.toLowerCase().includes(q.toLowerCase())) : FS.list(path);
      const inTrash = path.startsWith('/Trash');
      w.setTitle((parts.length ? (parts[parts.length - 1] === 'Trash' ? 'Recycle Bin' : parts[parts.length - 1]) : 'Home') + ' — Files');
      if (!items.length) main.innerHTML = `<div class="empty">${svg(inTrash ? 'trash' : 'folder')}<b>${q ? 'No results' : inTrash ? 'Recycle Bin is empty' : 'This folder is empty'}</b><span>${q ? 'Try a different search.' : inTrash ? '' : 'Right-click to create a file or folder, or drop files here from your computer.'}</span></div>`;
      else main.innerHTML = `<div class="${view === 'grid' ? 'fx-grid' : 'fx-list'}">${items.map(e => { const img = !e.dir && /^data:image/.test(e.node.d || ''); return `<div class="fx-item ${sel === e.path ? 'sel' : ''}" data-path="${esc(e.path)}" tabindex="0">${img ? `<img src="${e.node.d}" alt="">` : fileIcon(e.name, e.dir)}<span>${esc(e.name)}</span>${view === 'list' ? `<span class="meta">${e.dir ? FS.list(e.path).length + ' items' : fmtSize(FS.size(e.node))} · ${new Date(e.node.m).toLocaleDateString()}</span>` : ''}</div>`; }).join('')}</div>`;
      status.innerHTML = `<span>${items.length} items</span>${sel ? `<span>Selected: ${esc(FS.parts(sel).pop())} (${fmtSize(FS.size(FS.node(sel)))})</span>` : ''}${inTrash && items.length ? '<span style="margin-left:auto"><a href="#" id="fxEmpty" style="color:var(--accent)">Empty Recycle Bin</a></span>' : ''}`;
      $('#fxEmpty', status)?.addEventListener('click', e => { e.preventDefault(); emptyTrash(); });
      $$('.fx-item', main).forEach(it => {
        it.onclick = () => { sel = it.dataset.path; $$('.fx-item', main).forEach(x => x.classList.toggle('sel', x === it)); status.children[1] ? status.children[1].textContent = 'Selected: ' + FS.parts(sel).pop() : render(); };
        it.ondblclick = () => { const p = it.dataset.path; FS.node(p)?.t === 'd' ? go(p) : openPath(p); };
        it.onkeydown = e => { if (e.key === 'Enter') it.ondblclick(); };
        it.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); sel = it.dataset.path; itemMenu(e, sel); };
      });
      $('[data-a=back]', w.body).disabled = hi <= 0; $('[data-a=fwd]', w.body).disabled = hi >= hist.length - 1; $('[data-a=up]', w.body).disabled = path === '/';
    };
    const itemMenu = (e, p) => {
      const n = FS.node(p), inTrash = p.startsWith('/Trash/');
      Ctx.show(e.clientX, e.clientY, inTrash ? [
        { label: 'Restore', icon: 'restart', action: () => FS.restore(p) },
        { label: 'Delete permanently', icon: 'trash', action: async () => { if (await UI.confirm('Delete permanently?', `"${esc(FS.parts(p).pop())}" will be gone for good.`, 'Delete', true)) { FS.remove(p, true); Snd.play('trash'); } } }
      ] : [
        { label: 'Open', icon: 'open', action: () => n.t === 'd' ? go(p) : openPath(p) },
        n.t === 'f' ? { label: 'Open with Notepad', icon: 'doc', action: () => WM.open('notepad', { path: p }) } : null,
        n.t === 'f' && /^data:image/.test(n.d) ? { label: 'Set as wallpaper', icon: 'image', action: () => setCustomWallpaper(n.d) } : null,
        '-',
        { label: 'Cut', icon: 'cut', kbd: 'Ctrl+X', action: () => CLIP = { path: p, mode: 'cut' } },
        { label: 'Copy', icon: 'copy', kbd: 'Ctrl+C', action: () => CLIP = { path: p, mode: 'copy' } },
        { label: 'Rename', icon: 'edit', kbd: 'F2', action: () => renamePath(p) },
        { label: 'Send to Desktop', icon: 'display', action: () => FS.move(p, '/Desktop', true) },
        { label: 'Delete', icon: 'trash', kbd: 'Del', action: () => { FS.remove(p); Snd.play('trash'); } },
        '-',
        { label: 'Properties', icon: 'info', action: () => showProps(p) }
      ]);
    };
    main.oncontextmenu = e => { if (e.target.closest('.fx-item')) return; e.preventDefault(); Ctx.show(e.clientX, e.clientY, path.startsWith('/Trash') ? [{ label: 'Empty Recycle Bin', icon: 'trash', action: emptyTrash }] : [
      { label: 'New folder', icon: 'newfolder', action: () => act('newf') }, { label: 'New text document', icon: 'newfile', action: () => act('newt') },
      { label: 'Paste', icon: 'paste', disabled: !CLIP, action: () => pasteInto(path) }, '-',
      { label: 'Open in Terminal', icon: 'terminal', action: () => WM.open('terminal', { cwd: path }) }, { label: 'Refresh', icon: 'refresh', action: render }]); };
    main.onclick = e => { if (!e.target.closest('.fx-item')) { sel = null; $$('.fx-item', main).forEach(x => x.classList.remove('sel')); } };
    main.addEventListener('dragover', e => e.preventDefault());
    main.addEventListener('drop', e => { e.preventDefault(); importFiles(e.dataTransfer.files, path === '/' ? '/Documents' : path); });
    main.onkeydown = e => {
      if (e.target.closest('input')) return;
      if (e.key === 'Delete' && sel) { FS.remove(sel); Snd.play('trash'); }
      if (e.key === 'F2' && sel) renamePath(sel);
      if (e.key === 'Backspace') act('up');
      if (e.ctrlKey && e.key === 'c' && sel) CLIP = { path: sel, mode: 'copy' };
      if (e.ctrlKey && e.key === 'x' && sel) CLIP = { path: sel, mode: 'cut' };
      if (e.ctrlKey && e.key === 'v') pasteInto(path);
    };
    const act = async a => {
      if (a === 'back' && hi > 0) go(hist[--hi], false);
      if (a === 'fwd' && hi < hist.length - 1) go(hist[++hi], false);
      if (a === 'up' && path !== '/') go(FS.norm('..', path));
      if (a === 'view') { view = view === 'grid' ? 'list' : 'grid'; Store.set('fxView', view); render(); }
      if (a === 'import') fin.click();
      const base = path === '/' ? '/Documents' : path;
      if (a === 'newf') { const n = await UI.prompt('New folder', 'Name the folder:', FS.uniq(base, 'New folder')); if (n && !FS.mkdir(base + '/' + n)) UI.alert("Can't create folder", 'That name is already used here.'); }
      if (a === 'newt') { const n = await UI.prompt('New text document', 'Name the file:', FS.uniq(base, 'New document.txt')); if (n) FS.write(base + '/' + n, ''); }
    };
    fin.onchange = () => { importFiles(fin.files, path === '/' ? '/Documents' : path); fin.value = ''; };
    $$('[data-a]', w.body).forEach(b => b.onclick = () => act(b.dataset.a));
    $('.fx-search', w.body).oninput = e => { q = e.target.value.trim(); render(); };
    onWin(w, 'fs', render);
    render();
  }
});
function setCustomWallpaper(dataUrl) {
  const img = new Image(); img.onload = () => {
    const sc = Math.min(1, 1920 / img.width); const c = document.createElement('canvas'); c.width = img.width * sc; c.height = img.height * sc; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const d = c.toDataURL('image/jpeg', .82);
    if (!Store.set('customWp', d)) { notify("Wallpaper too large", "Your browser storage is full, so the picture is used for this session only.", 'settings'); }
    CUSTOM_WP = d; S.wallpaper = 'custom'; Wall.cur = null; applySettings(); notify('Wallpaper changed', 'Your picture is now the desktop background.', 'settings');
  }; img.src = dataUrl;
}

/* ---------------- NOTEPAD ---------------- */
function mdRender(s) {
  let h = esc(s);
  h = h.replace(/```([\s\S]*?)```/g, (_, c) => `<pre style="background:var(--field);padding:10px;border-radius:8px;overflow:auto">${c}</pre>`)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1 style="font-family:var(--f-display)">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/`(.+?)`/g, '<code style="background:var(--field);padding:1px 5px;border-radius:4px">$1</code>')
    .replace(/^[-*] (.*)$/gm, '<li>$1</li>').replace(/^&gt; (.*)$/gm, '<blockquote style="border-left:3px solid var(--accent);margin:0;padding-left:12px;color:var(--fg2)">$1</blockquote>')
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent)">$1</a>').replace(/\n/g, '<br>');
  return h;
}
defApp({
  id: 'notepad', name: 'Notepad', glyph: 'doc', colors: ['#5cc8ff', '#2563eb'], w: 720, h: 520, cat: 'Productivity', desc: 'Write and edit text and Markdown', kw: 'text editor write markdown',
  run(w, args) {
    let path = args.path || null, dirty = false, wrap = Store.get('npWrap', true), size = Store.get('npSize', 15), preview = false;
    w.body.innerHTML = `<div class="app-tb">
      <button class="tbtn" data-a="new" title="New">${svg('newfile')}</button><button class="tbtn" data-a="open" title="Open (Ctrl+O)">${svg('open')}</button><button class="tbtn" data-a="save" title="Save (Ctrl+S)">${svg('save')}</button><button class="tbtn" data-a="saveas">Save as</button><span class="sep"></span>
      <button class="tbtn" data-a="wrap" title="Word wrap">Wrap</button><button class="tbtn" data-a="smaller" title="Smaller text">A−</button><button class="tbtn" data-a="bigger" title="Larger text">A+</button>
      <button class="tbtn" data-a="time" title="Insert date and time">${svg('clock')}</button><button class="tbtn" data-a="md" title="Markdown preview">${svg('eye')}</button></div>
      <textarea class="plain" spellcheck="false" aria-label="Document text"></textarea><div class="scroll md-prev" style="flex:1;padding:16px 22px;line-height:1.6;display:none"></div><div class="statusbar"><span class="st-pos"></span><span class="st-cnt"></span><span class="st-file" style="margin-left:auto"></span></div>`;
    const ta = $('textarea', w.body), prev = $('.md-prev', w.body);
    const name = () => path ? FS.parts(path).pop() : 'Untitled';
    const upd = () => {
      w.setTitle((dirty ? '• ' : '') + name() + ' — Notepad');
      const v = ta.value, pos = ta.selectionStart, before = v.slice(0, pos).split('\n');
      $('.st-pos', w.body).textContent = `Ln ${before.length}, Col ${before[before.length - 1].length + 1}`;
      $('.st-cnt', w.body).textContent = `${(v.match(/\S+/g) || []).length} words · ${v.length} characters`;
      $('.st-file', w.body).textContent = path || 'Not saved';
      ta.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'; ta.style.fontSize = size + 'px'; ta.style.fontFamily = path && /\.(js|css|json|html)$/.test(path) ? 'var(--f-mono)' : '';
      $('[data-a=wrap]', w.body).classList.toggle('on', wrap); $('[data-a=md]', w.body).classList.toggle('on', preview);
    };
    const load = p => { const d = FS.read(p); if (d == null) return; path = p; ta.value = d; dirty = false; upd(); preview = /\.md$/.test(p) && preview; };
    const save = async (as) => {
      if (!path || as) { const p = await UI.prompt('Save as', 'Where should this be saved?', path || '/Documents/' + FS.uniq('/Documents', 'Untitled.txt')); if (!p) return false; path = FS.norm(p); }
      if (!FS.write(path, ta.value)) { UI.alert("Couldn't save", 'Check that the folder exists and the name is valid.'); return false; }
      dirty = false; addRecent(path); upd(); return true;
    };
    w.beforeClose = async () => { if (!dirty || !ta.value) return true; const r = await UI.dialog({ title: 'Save changes?', msg: `Do you want to save changes to ${esc(name())}?`, buttons: [{ label: 'Cancel', value: 0 }, { label: "Don't save", value: 1 }, { label: 'Save', primary: true, value: 2 }] }); if (r === 2) return await save(); return r === 1; };
    w.onArgs = a => a.path && load(a.path);
    const act = async a => {
      if (a === 'new') { if (await w.beforeClose()) { path = null; ta.value = ''; dirty = false; upd(); } }
      if (a === 'open') { const p = await pickFile('Open a file', f => !/^data:/.test(f.node.d || '')); if (p) load(p); }
      if (a === 'save') save(); if (a === 'saveas') save(true);
      if (a === 'wrap') { wrap = !wrap; Store.set('npWrap', wrap); }
      if (a === 'smaller') size = Math.max(10, size - 1); if (a === 'bigger') size = Math.min(32, size + 1); Store.set('npSize', size);
      if (a === 'time') { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end'); dirty = true; }
      if (a === 'md') { preview = !preview; prev.innerHTML = mdRender(ta.value); prev.style.display = preview ? 'block' : 'none'; ta.style.display = preview ? 'none' : ''; }
      upd();
    };
    $$('[data-a]', w.body).forEach(b => b.onclick = () => act(b.dataset.a));
    ta.oninput = () => { dirty = true; upd(); };
    ta.onkeyup = ta.onclick = upd;
    ta.onkeydown = e => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); act('open'); }
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); dirty = true; }
    };
    if (path) load(path); else upd();
    if (path && /\.md$/.test(path)) act('md');
    setTimeout(() => ta.focus(), 100);
  }
});

/* ---------------- TERMINAL ---------------- */
const FORTUNES = ['You will find a hidden feature today. Try "matrix".', 'A clean desktop is a clear mind.', 'The bug is not in the code. It is in the assumptions.', 'Fortune favors the commit with tests.', 'Today is a good day to try the BIOS. Restart and press DEL.', 'Ctrl+K finds everything. Even this fortune.'];
defApp({
  id: 'terminal', name: 'Terminal', glyph: 'terminal', colors: ['#3a4250', '#11151a'], w: 760, h: 480, cat: 'System', desc: 'Command line for power users', kw: 'console shell bash cmd',
  run(w, args) {
    let cwd = args.cwd || '/'; const hist = Store.get('termHist', []); let hi = hist.length;
    w.body.innerHTML = `<div class="term"><div class="out"></div><div class="inrow"><span class="pp"></span><input spellcheck="false" autocomplete="off" aria-label="Command"></div></div>`;
    const term = $('.term', w.body), out = $('.out', w.body), inp = $('input', w.body), pp = $('.pp', w.body);
    const user = (S.user || 'user').toLowerCase().replace(/\s+/g, '');
    const prompt = () => `<span class="ok">${esc(user)}@${esc(S.device.toLowerCase())}</span>:<span class="pth">${esc(cwd === '/' ? '~' : '~' + cwd)}</span><span class="pr">$</span>`;
    const print = (s, cls = '') => { const d = document.createElement('div'); d.className = 'ln ' + cls; d.innerHTML = s; out.appendChild(d); term.scrollTop = term.scrollHeight; };
    const P = s => print(esc(s));
    const setP = () => pp.innerHTML = prompt();
    const res = p => FS.norm(p, cwd);
    const C = {
      help: () => print(`<span class="yl">RestaurantOS Terminal — available commands</span>
<span class="pr">Files</span>    ls [-l] [dir] · cd dir · pwd · cat file · tree · mkdir dir · touch file · rm [-r] path · mv src dir · cp src dir · edit file · open path|app
<span class="pr">System</span>   whoami · hostname · uname [-a] · uptime · date · cal · neofetch · apps · ps · kill app · history · clear · exit
<span class="pr">Settings</span> theme dark|light · accent #hex · wallpaper [name] · volume 0-100 · notify text
<span class="pr">Power</span>    lock · reboot · bios · shutdown · sleep
<span class="pr">Fun</span>      calc expr · echo text [&gt; file] · fortune · cowsay text · weather · matrix · ping host · sudo · crash`),
      clear: () => out.innerHTML = '',
      pwd: () => P(cwd),
      whoami: () => P(user), hostname: () => P(S.device),
      uname: a => P(a[0] === '-a' ? `RestaurantOS ${S.device} 1.0.0-revival #1 SMP PREEMPT ${new Date().getFullYear()} x86_64 RestoTech Quantum X9 GNU/RestaurantOS` : 'RestaurantOS'),
      date: () => P(new Date().toString()),
      uptime: () => { const m = Math.floor((Date.now() - BOOT_T) / 60000); P(`up ${Math.floor(m / 60)}h ${m % 60}m, 1 user, load average: ${(Math.random() * 1.5).toFixed(2)}, ${(Math.random()).toFixed(2)}, ${(Math.random() * .5).toFixed(2)}`); },
      cal: () => { const c = miniCal(0); P(c.title); P(c.html.replace(/<div class="dn">(.*?)<\/div>/g, '$1 ').replace(/<div class="([^"]*)">(\d+)<\/div>/g, (_, cl, n) => (cl.includes('o') ? '  ' : String(n).padStart(2)) + ' ').replace(/(.{21})/g, '$1\n')); },
      ls: a => {
        const long = a[0] === '-l'; const target = res(long ? a[1] || '.' : a[0] || '.'); const n = FS.node(target);
        if (!n) return print(`ls: cannot access '${esc(a.join(' '))}': No such file or directory`, 'er');
        if (n.t === 'f') return P(FS.parts(target).pop());
        const L = FS.list(target); if (!L.length) return;
        print(long ? L.map(e => `${e.dir ? 'd' : '-'}rw-r--r--  ${esc(user)}  ${String(FS.size(e.node)).padStart(7)}  ${new Date(e.node.m).toLocaleDateString()}  ${e.dir ? `<span class="pth">${esc(e.name)}/</span>` : esc(e.name)}`).join('\n') : L.map(e => e.dir ? `<span class="pth">${esc(e.name)}/</span>` : esc(e.name)).join('   '));
      },
      cd: a => { const t = res(a[0] || '/'); const n = FS.node(t); if (!n || n.t !== 'd') return print(`cd: ${esc(a[0])}: No such directory`, 'er'); cwd = t; },
      cat: a => { if (!a[0]) return print('cat: missing file operand', 'er'); const d = FS.read(res(a[0])); d == null ? print(`cat: ${esc(a[0])}: No such file`, 'er') : P(/^data:/.test(d) ? '[binary image data]' : d); },
      tree: a => { const t = res(a[0] || '.'); const walk = (p, pre) => FS.list(p).forEach((e, i, arr) => { const last = i === arr.length - 1; print(esc(pre + (last ? '└── ' : '├── ')) + (e.dir ? `<span class="pth">${esc(e.name)}</span>` : esc(e.name))); if (e.dir) walk(e.path, pre + (last ? '    ' : '│   ')); }); print('<span class="pth">.</span>'); walk(t, ''); },
      mkdir: a => a[0] ? (FS.mkdir(res(a[0])) || print(`mkdir: cannot create '${esc(a[0])}'`, 'er')) : print('mkdir: missing operand', 'er'),
      touch: a => a[0] ? (FS.exists(res(a[0])) || FS.write(res(a[0]), '')) : print('touch: missing operand', 'er'),
      rm: a => { const r = a[0] === '-r' || a[0] === '-rf'; const t = r ? a[1] : a[0]; if (!t) return print('rm: missing operand', 'er'); const n = FS.node(res(t)); if (!n) return print(`rm: cannot remove '${esc(t)}': No such file`, 'er'); if (n.t === 'd' && !r) return print(`rm: cannot remove '${esc(t)}': Is a directory (use rm -r)`, 'er'); FS.remove(res(t)); print('Moved to Recycle Bin.', 'dm'); },
      mv: a => a.length < 2 ? print('usage: mv source directory', 'er') : (FS.move(res(a[0]), res(a[1])) || print('mv: failed', 'er')),
      cp: a => a.length < 2 ? print('usage: cp source directory', 'er') : (FS.move(res(a[0]), res(a[1]), true) || print('cp: failed', 'er')),
      edit: a => { const p = res(a[0] || 'untitled.txt'); if (!FS.exists(p)) FS.write(p, ''); WM.open('notepad', { path: p }); },
      open: a => { const x = a.join(' '); if (!x) return print('usage: open <app or path>', 'er'); const app = Object.values(APPS).find(p => p.id === x.toLowerCase() || p.name.toLowerCase() === x.toLowerCase()); if (app) return WM.open(app.id); FS.exists(res(x)) ? openPath(res(x)) : print(`open: '${esc(x)}' not found`, 'er'); },
      apps: () => print(installedApps().map(a => `<span class="pr">${a.id.padEnd(12)}</span>${esc(a.name)}`).join('\n')),
      ps: () => print(`  PID  NAME\n    1  resto-kernel\n   42  compositor\n   77  audio-service\n${WM.wins.map((x, i) => `${String(1000 + i).padStart(5)}  ${esc(x.app.id)}  (${esc(x.title)})`).join('\n')}`),
      kill: a => { const ws = WM.wins.filter(x => x.app.id === a[0] && x !== w); if (!ws.length) return print(`kill: no process '${esc(a[0] || '')}'`, 'er'); ws.forEach(x => WM.close(x, true)); P(`Terminated ${ws.length} window(s).`); },
      history: () => P(hist.map((h, i) => String(i + 1).padStart(4) + '  ' + h).join('\n')),
      echo: (a, raw) => { const m = raw.match(/^echo\s+(.*?)\s*(>>?)\s*(\S+)$/); if (m) { const p = res(m[3]); const prev = m[2] === '>>' ? (FS.read(p) || '') + '\n' : ''; FS.write(p, prev + m[1].replace(/^["']|["']$/g, '')) || print('echo: cannot write', 'er'); } else P(raw.slice(5).replace(/^["']|["']$/g, '')); },
      theme: a => { if (!['dark', 'light', 'auto'].includes(a[0])) return print('usage: theme dark|light|auto', 'er'); S.theme = a[0]; applySettings(); print('Theme set to ' + a[0], 'ok'); },
      accent: a => { if (!/^#[0-9a-f]{3,6}$/i.test(a[0] || '')) return print('usage: accent #ff7a45', 'er'); S.accent = a[0]; applySettings(); print('Accent updated', 'ok'); },
      wallpaper: a => { if (!a[0]) return P('Available: ' + Object.keys(WALLS).join(', ')); if (!WALLS[a[0]]) return print('Unknown wallpaper', 'er'); S.wallpaper = a[0]; applySettings(); print('Wallpaper set to ' + WALLS[a[0]].name, 'ok'); },
      volume: a => { const v = +a[0]; if (isNaN(v)) return P('Volume: ' + S.volume); S.volume = clamp(v, 0, 100); applySettings(); osd('vol', S.volume); },
      notify: a => notify('Terminal', a.join(' ') || 'Hello from the terminal!', 'terminal'),
      calc: a => { try { const v = calcEval(a.join(' ')); print(String(v), 'ok'); } catch (e) { print('calc: invalid expression', 'er'); } },
      fortune: () => P(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]),
      cowsay: a => { const t = a.join(' ') || 'Moo!'; P(` ${'_'.repeat(t.length + 2)}\n< ${t} >\n ${'-'.repeat(t.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`); },
      weather: () => { const n = Weather.now(); print(`<span class="yl">${esc(S.city)}</span>  ${n.temp}°C  ${n.cond}\nHigh ${n.hi}° · Low ${n.lo}° · Rain ${n.rain}% · Wind ${n.wind} km/h · Humidity ${n.hum}%`); },
      ping: async a => { const h = a[0] || 'restaurantos.dev'; if (!S.wifi || S.airplane) return print(`ping: ${esc(h)}: Network is unreachable`, 'er'); P(`PING ${h} (104.21.${Math.floor(rand(1, 255))}.${Math.floor(rand(1, 255))}): 56 data bytes`); for (let i = 0; i < 4; i++) { await sleep(500); P(`64 bytes: icmp_seq=${i} ttl=56 time=${rand(8, 30).toFixed(1)} ms`); } P('--- 4 packets transmitted, 4 received, 0% packet loss ---'); },
      sudo: () => print('[sudo] password for ' + esc(user) + ': \nNice try. This incident will be reported to Nova. 🙂', 'yl'),
      neofetch: () => {
        const up = Math.floor((Date.now() - BOOT_T) / 60000);
        const logo = ['    ████      ██', '    ██ ██     ██', '    ██  ██    ██', '    ██   ██   ██', '    ██    ██  ██', '    ██     ██ ██', '    ██      ████', '', '', ''];
        const info = [`<span class="pr">${esc(user)}</span>@<span class="pr">${esc(S.device.toLowerCase())}</span>`, '─'.repeat(22), `<span class="pr">OS</span>: RestaurantOS ${osv()} x86_64`, `<span class="pr">Kernel</span>: 1.0.0-revival`, `<span class="pr">Uptime</span>: ${up} mins`, `<span class="pr">Shell</span>: rsh 2.1`, `<span class="pr">Resolution</span>: ${screen.width}x${screen.height}`, `<span class="pr">Theme</span>: ${S.theme} · ${S.accent}`, `<span class="pr">CPU</span>: Quantum X9 (32) @ ${B.oc ? '5.8' : '5.2'}GHz`, `<span class="pr">Memory</span>: ${(2.1 + WM.wins.length * .3).toFixed(1)}GiB / 32GiB`];
        print(logo.map((l, i) => `<span style="color:var(--accent)">${l.padEnd(20)}</span>${info[i] || ''}`).join('\n') + '\n' + ['#ff5d6c', '#ffc857', '#3ddc97', '#2ec4b6', '#4cc9f0', '#c77dff', '#ff7a45', '#e9eef3'].map(c => `<span style="background:${c}">   </span>`).join(''));
      },
      matrix: () => {
        const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;cursor:pointer'; w.body.style.position = 'relative'; w.body.appendChild(c);
        const x = c.getContext('2d'); c.width = w.body.clientWidth; c.height = w.body.clientHeight; const cols = Math.floor(c.width / 14); const ys = Array(cols).fill(0);
        let alive = true; const stop = () => { alive = false; c.remove(); inp.focus(); }; c.onclick = stop; setTimeout(stop, 8000);
        const f = () => { if (!alive) return; x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#3ddc97'; x.font = '14px monospace'; ys.forEach((y, i) => { x.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), i * 14, y); ys[i] = y > c.height && Math.random() > .975 ? 0 : y + 14; }); requestAnimationFrame(f); }; f();
      },
      lock: () => lockScreen(), reboot: () => restart(), bios: () => restart(true), shutdown: () => powerOff(), sleep: () => sleepPC(),
      crash: () => { print('Triggering kernel panic…', 'er'); setTimeout(() => bsod('MANUALLY_INITIATED_CRASH'), 900); },
      exit: () => WM.close(w)
    };
    const run = async raw => {
      raw = raw.trim(); print(prompt() + ' ' + esc(raw));
      if (!raw) return;
      hist.push(raw); Store.set('termHist', hist.slice(-100)); hi = hist.length;
      const [cmd, ...a] = raw.split(/\s+/);
      if (C[cmd]) { try { await C[cmd](a, raw); } catch (e) { print(esc(e.message), 'er'); } }
      else if (/^[\d\s+\-*/().%^]+$/.test(raw)) { try { print(String(calcEval(raw)), 'ok'); } catch (e) { print('Syntax error', 'er'); } }
      else print(`rsh: command not found: ${esc(cmd)}. Type <span class="yl">help</span> for a list.`, 'er');
      setP();
    };
    inp.onkeydown = e => {
      if (e.key === 'Enter') { const v = inp.value; inp.value = ''; run(v); }
      else if (e.key === 'ArrowUp') { if (hi > 0) inp.value = hist[--hi]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); }
      else if (e.key === 'Tab') {
        e.preventDefault(); const parts = inp.value.split(' '); const last = parts.pop();
        let opts;
        if (!parts.length) opts = Object.keys(C).filter(c => c.startsWith(last));
        else { const dir = last.includes('/') ? last.slice(0, last.lastIndexOf('/') + 1) : ''; const base = last.slice(dir.length); opts = FS.list(res(dir || '.')).filter(x => x.name.startsWith(base)).map(x => dir + x.name + (x.dir ? '/' : '')); }
        if (opts.length === 1) inp.value = [...parts, opts[0]].join(' ') + (parts.length ? '' : ' ');
        else if (opts.length > 1) { print(prompt() + ' ' + esc(inp.value)); P(opts.join('   ')); }
      }
      else if (e.ctrlKey && e.key === 'l') { e.preventDefault(); out.innerHTML = ''; }
      else if (e.ctrlKey && e.key === 'c') { print(prompt() + ' ' + esc(inp.value) + '^C'); inp.value = ''; }
    };
    term.onclick = () => { if (!getSelection().toString()) inp.focus(); };
    print(`<span class="yl">RestaurantOS ${osv()}</span> — rsh 2.1  <span class="dm">(type "help" for commands)</span>`);
    setP(); w.onFocus = () => setTimeout(() => inp.focus(), 0); setTimeout(() => inp.focus(), 100);
    if (args.cmd) run(args.cmd);
  }
});

/* ---------------- CALCULATOR ---------------- */
function calcEval(src) {
  let e = String(src).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**').replace(/π/g, '(PI)').replace(/√/g, 'sqrt').replace(/(\d+(\.\d+)?)%/g, '($1/100)').replace(/(\d)!/g, 'fact($1)');
  e = e.replace(/\bln\(/g, 'log(').replace(/\blog\(/g, (m, i, s) => s.slice(i - 1, i) === 'l' ? m : 'LOG10(');
  const ids = e.match(/[A-Za-z_]+/g) || [];
  const ok = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'log', 'LOG10', 'PI', 'E', 'abs', 'fact', 'exp'];
  if (ids.some(i => !ok.includes(i))) throw new Error('bad');
  const fact = n => { n = Math.round(n); if (n < 0 || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const v = Function('sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'log', 'LOG10', 'PI', 'E', 'abs', 'fact', 'exp', '"use strict";return (' + e + ')')(Math.sin, Math.cos, Math.tan, Math.asin, Math.acos, Math.atan, Math.sqrt, Math.log, Math.log10, Math.PI, Math.E, Math.abs, fact, Math.exp);
  if (typeof v !== 'number' || isNaN(v)) throw new Error('nan');
  return +v.toPrecision(12);
}
defApp({
  id: 'calc', name: 'Calculator', glyph: 'calc', colors: ['#ffb38a', '#ff7a45'], w: 340, h: 520, minW: 300, cat: 'Utilities', desc: 'Standard and scientific calculator', kw: 'math',
  run(w) {
    let expr = '', last = '', sci = false; const hist = [];
    const std = [['C', 'fn'], ['(', 'fn'], [')', 'fn'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['⌫', 'fn'], ['0'], ['.'], ['=', 'eq']];
    const sciK = [['sin(', 'fn'], ['cos(', 'fn'], ['tan(', 'fn'], ['^', 'fn'], ['√(', 'fn'], ['ln(', 'fn'], ['log(', 'fn'], ['π', 'fn'], ['%', 'fn'], ['!', 'fn']];
    const render = () => {
      w.body.innerHTML = `<div class="app-tb"><button class="tbtn ${!sci ? 'on' : ''}" data-m="0">Standard</button><button class="tbtn ${sci ? 'on' : ''}" data-m="1">Scientific</button><span class="grow"></span><button class="tbtn" data-h title="History">${svg('clock')}</button></div>
      <div class="calc ${sci ? 'sci' : ''}"><div class="calc-disp"><div class="ex">${esc(last)}</div><div class="val">${esc(expr || '0')}</div></div>
      <div class="calc-keys">${(sci ? interleave() : std).map(([k, c]) => `<button class="${c || ''}" data-k="${esc(k)}">${esc(k.replace('(', '') || k)}</button>`).join('')}</div></div>`;
      $$('[data-m]', w.body).forEach(b => b.onclick = () => { sci = b.dataset.m === '1'; if (sci && parseFloat(w.el.style.width) < 440) w.el.style.width = '440px'; render(); });
      $$('[data-k]', w.body).forEach(b => b.onclick = () => press(b.dataset.k));
      $('[data-h]', w.body).onclick = () => UI.alert('History', hist.length ? hist.slice(-10).reverse().map(h => esc(h)).join('<br>') : 'No calculations yet.');
    };
    const interleave = () => [...sciK.slice(0, 5), ...std.flatMap((k, i) => i % 4 === 0 ? [sciK[5 + i / 4], k] : [k])];
    const disp = () => { $('.val', w.body).textContent = expr || '0'; $('.ex', w.body).textContent = last; };
    const press = k => {
      Snd.play('click');
      if (k === 'C') { expr = ''; last = ''; }
      else if (k === '⌫') expr = expr.slice(0, -1);
      else if (k === '=') { try { const v = calcEval(expr); hist.push(expr + ' = ' + v); last = expr + ' ='; expr = String(v); } catch (e) { last = expr; expr = 'Error'; Snd.play('error'); setTimeout(() => { if (expr === 'Error') { expr = ''; disp(); } }, 900); } }
      else { if (expr === 'Error') expr = ''; expr += k; }
      disp();
    };
    winKeys(w, e => {
      if (e.target.closest('input,textarea')) return;
      const m = { Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', '*': '×', '/': '÷', '-': '−' }; const k = m[e.key] || (/^[\d.+()%^!]$/.test(e.key) ? e.key : null);
      if (k) { e.preventDefault(); press(k); }
    });
    render();
  }
});

/* ---------------- SETTINGS ---------------- */
defApp({
  id: 'settings', name: 'Settings', glyph: 'settings', colors: ['#8b95a1', '#4b5563'], w: 980, h: 640, cat: 'System', single: true, desc: 'Personalize and control RestaurantOS', kw: 'control panel preferences options',
  run(w, args) {
    let page = args.page || 'home';
    w.onArgs = a => { if (a.page) { page = a.page; render(); } };
    const NAV = [['home', 'Home', 'home'], ['display', 'Display', 'display'], ['sound', 'Sound', 'vol'], ['personal', 'Personalization', 'palette'], ['accounts', 'Accounts', 'user'], ['time', 'Time & language', 'clock'], ['notifs', 'Notifications', 'bell'], ['power', 'Power & battery', 'bolt'], ['storage', 'Storage', 'storage'], ['apps', 'Apps', 'apps'], ['privacy', 'Privacy & security', 'shield'], ['access', 'Accessibility', 'access'], ['update', 'RestaurantOS Updates', 'update'], ['about', 'About', 'info']];
    w.body.innerHTML = `<div class="split"><nav class="side"></nav><div class="scroll grow set-main" style="flex:1"></div></div>`;
    const side = $('.side', w.body), main = $('.set-main', w.body);
    const tog = (key, title, desc, icon, obj = S) => `<div class="set-row"><div class="lbl">${svg(icon)}<div><div>${title}</div>${desc ? `<small>${desc}</small>` : ''}</div></div><input type="checkbox" class="sw-t" data-t="${key}" ${(obj === S ? S[key] : S.privacy[key]) ? 'checked' : ''} aria-label="${title}" ${obj !== S ? 'data-priv="1"' : ''}></div>`;
    const rng = (key, title, desc, icon, min, max, step = 1) => `<div class="set-row"><div class="lbl">${svg(icon)}<div><div>${title}</div>${desc ? `<small>${desc}</small>` : ''}</div></div><div class="row" style="min-width:min(260px,40%)"><input type="range" data-r="${key}" min="${min}" max="${max}" step="${step}" value="${S[key]}" aria-label="${title}"><span class="muted" style="width:36px;text-align:right;font-variant-numeric:tabular-nums" data-rv="${key}">${S[key]}</span></div></div>`;
    const sel = (key, title, desc, icon, opts) => `<div class="set-row"><div class="lbl">${svg(icon)}<div><div>${title}</div>${desc ? `<small>${desc}</small>` : ''}</div></div><select class="inp" data-s="${key}" aria-label="${title}">${opts.map(([v, l]) => `<option value="${v}" ${String(S[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    const P = {
      home: () => `<div class="set-hero">${avatarEl()}<div><div class="h1" style="margin:0">${esc(S.user || 'User')}</div><div class="muted">${esc(S.device)} · RestaurantOS ${osv()}</div></div></div>
        <div class="store-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
          ${[['personal', 'palette', 'Personalization', 'Theme, accent and wallpaper'], ['display', 'display', 'Display', `Brightness ${S.brightness}%${S.night ? ' · Night light on' : ''}`], ['sound', 'vol', 'Sound', `Volume ${S.volume}%`], ['update', 'update', 'RestaurantOS Updates', IS2() ? "You're up to date" : 'RestaurantOS 2.0 is available'], ['storage', 'storage', 'Storage', fmtSize(Store.size()) + ' used'], ['accounts', 'user', 'Accounts', S.pass ? 'Password protected' : 'No password set']].map(([p, ic, t, d]) => `<button class="store-card" data-go="${p}" style="text-align:left;color:var(--fg);cursor:pointer"><div class="ai" style="width:40px;height:40px;background:linear-gradient(150deg,var(--accent2),var(--accent))">${svg(ic)}</div><div><h4>${t}</h4><p style="margin:2px 0 0">${d}</p></div></button>`).join('')}</div>`,
      display: () => `<div class="h1">Display</div>
        ${rng('brightness', 'Brightness', 'Dims the whole screen', 'sun', 20, 100)}
        ${tog('night', 'Night light', 'Warmer colors that are easier on your eyes at night', 'moon')}
        ${sel('fontScale', 'Text size', 'Size of text in apps and menus', 'text', [[90, 'Small (90%)'], [100, 'Default (100%)'], [110, 'Large (110%)'], [125, 'Larger (125%)']])}
        ${rng('iconSize', 'Desktop icon size', '', 'grid', 70, 140, 10)}
        ${rng('radius', 'Window corner radius', 'From square to very round', 'max', 0, 24)}
        <div class="h2">Screen</div><div class="card kv" style="display:grid"><dt>Resolution</dt><dd>${screen.width} × ${screen.height}</dd><dt>Viewport</dt><dd>${innerWidth} × ${innerHeight}</dd><dt>Pixel ratio</dt><dd>${devicePixelRatio}×</dd><dt>Refresh rate</dt><dd id="fpsV">measuring…</dd></div>`,
      sound: () => `<div class="h1">Sound</div>${tog('sound', 'System sounds', 'Startup chime, clicks, notifications and alerts', 'vol')}${rng('volume', 'Master volume', '', 'vol', 0, 100)}
        <div class="h2">Sound test</div><div class="row">${['startup', 'notify', 'open', 'close', 'error', 'success', 'unlock', 'alarm', 'shutdown'].map(s => `<button class="btn sm" data-snd="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>
        <p class="muted" style="font-size:12px;margin-top:14px">Every RestaurantOS sound is synthesized live with the Web Audio API.</p>`,
      personal: () => `<div class="h1">Personalization</div><div class="preview-desk" style="background:${Wall.css()};background-size:cover"><div class="pw"></div><div class="pt"></div></div>
        <div class="h2">Theme</div><div class="choice-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['dark', 'Dark', '#11161b,#232b33'], ['light', 'Light', '#f3f5f7,#d9dfe5'], ['auto', 'Match system', '#11161b 50%,#f3f5f7 50%']].map(([v, l, g]) => `<button class="choice ${S.theme === v ? 'on' : ''}" data-theme="${v}" style="color:var(--fg)"><div class="sw" style="height:44px;background:linear-gradient(135deg,${g})"></div><b>${l}</b></button>`).join('')}</div>
        <div class="h2">Accent color</div><div class="row">${['#ff7a45', '#ff4d6d', '#c77dff', '#7b61ff', '#4cc9f0', '#2ec4b6', '#3ddc97', '#ffd166', '#f4a261', '#e5e5e5'].map(a => `<button class="swatch ${S.accent === a ? 'on' : ''}" data-acc="${a}" style="background:${a}" aria-label="Accent ${a}"></button>`).join('')}<label class="btn sm" style="position:relative">Custom<input type="color" value="${S.accent}" data-accc style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>
        <div class="h2">Wallpaper</div><div class="wp-grid">${Object.entries(WALLS).map(([k, v]) => `<div class="wp-thumb ${S.wallpaper === k ? 'on' : ''}" data-wp="${k}" style="background:${v.css}" tabindex="0"><span>${v.name}</span></div>`).join('')}${CUSTOM_WP ? `<div class="wp-thumb ${S.wallpaper === 'custom' ? 'on' : ''}" data-wp="custom" style="background:url(${CUSTOM_WP}) center/cover"><span>Your picture</span></div>` : ''}<label class="wp-thumb" style="display:grid;place-items:center;border:2px dashed var(--line);color:var(--fg2);font-size:12px;text-align:center">Browse photos…<input type="file" accept="image/*" hidden data-wpup></label></div>
        <div class="h2">Effects &amp; taskbar</div>${tog('glass', 'Transparency effects', 'Frosted glass behind windows and menus', 'eye')}${sel('tbAlign', 'Taskbar alignment', '', 'sort', [['center', 'Center'], ['left', 'Left']])}`,
      accounts: () => `<div class="h1">Accounts</div><div class="set-hero">${avatarEl()}<div><b style="font-size:18px">${esc(S.user)}</b><div class="muted">Local account · Administrator</div></div></div>
        <div class="h2">Your info</div><div class="set-row"><div class="lbl">${svg('user')}<div>Display name</div></div><div class="row"><input class="inp" id="acName" value="${esc(S.user)}" maxlength="24" style="width:200px"><button class="btn sm" id="acNameS">Save</button></div></div>
        <div class="set-row"><div class="lbl">${svg('palette')}<div>Avatar color</div></div><div class="avatar-grid">${AVATARS.map((_, i) => `<button style="border:0;background:none;padding:0" data-av="${i}">${avatarEl(i === S.avatar ? 'on' : '', i).replace('class="av', 'style="width:36px;height:36px;font-size:14px" class="av')}</button>`).join('')}</div></div>
        <div class="h2">Sign-in options</div><div class="card"><div class="row" style="align-items:end">${S.pass ? '<div class="field grow" style="margin:0"><label for="acOld">Current password</label><input class="inp" type="password" id="acOld"></div>' : ''}<div class="field grow" style="margin:0"><label for="acNew">New password</label><input class="inp" type="password" id="acNew" placeholder="Leave empty to remove"></div><div class="field grow" style="margin:0"><label for="acHint">Hint</label><input class="inp" id="acHint" value="${esc(S.hint)}"></div><button class="btn primary" id="acPw">${S.pass ? 'Change' : 'Set password'}</button></div><small class="muted" id="acMsg"></small></div>
        ${tog('lockOnWake', 'Require sign-in after sleep or screensaver', 'Only applies when a password is set', 'lock')}
        <div class="row" style="margin-top:14px"><button class="btn" id="acLock">${svg('lock')} Lock now</button><button class="btn" id="acOut">${svg('signout')} Sign out</button></div>`,
      time: () => `<div class="h1">Time &amp; language</div><div class="card" style="margin-bottom:14px"><div class="big-num" id="tNow">${fmtTime()}</div><div class="muted">${fmtDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${Intl.DateTimeFormat().resolvedOptions().timeZone}</div></div>
        ${tog('h24', '24-hour clock', 'Show 14:00 instead of 2:00 PM', 'clock')}${tog('secs', 'Show seconds in the taskbar', '', 'clock')}
        ${sel('city', 'Weather location', 'Used by Weather, widgets and the lock screen', 'weather', ['New York', 'London', 'Berlin', 'Warsaw', 'Paris', 'Madrid', 'Rome', 'Tokyo', 'Toronto', 'Sydney', 'São Paulo', 'Mumbai'].map(c => [c, c]))}
        ${sel('lang', 'Display language', '', 'globe', ['English (US)', 'English (UK)', 'Deutsch', 'Español', 'Français', 'Italiano', 'Polski', 'Português', '日本語'].map(c => [c, c]))}
        ${sel('kb', 'Keyboard layout', '', 'grid', ['US', 'UK', 'German (QWERTZ)', 'French (AZERTY)', 'Polish (Programmer)', 'Spanish', 'Japanese'].map(c => [c, c]))}`,
      notifs: () => `<div class="h1">Notifications</div>${tog('dnd', 'Focus (Do not disturb)', 'Hide pop-up notifications. They still collect in the notification center.', 'belloff')}
        <div class="row" style="margin-top:12px"><button class="btn" id="nTest">${svg('bell')} Send a test notification</button><button class="btn" id="nClear">Clear all (${NOTIFS.length})</button></div>`,
      power: () => `<div class="h1">Power &amp; battery</div><div class="card row" style="margin-bottom:14px;gap:20px"><div class="big-num">${Batt.level}%</div><div><b>${Batt.charging ? 'Charging' : 'On battery'}</b><div class="muted" style="font-size:13px">${Batt.real ? 'Reported by your device' : 'Simulated battery'} · about ${Math.round(Batt.level * (S.saver ? 7 : 4.5))} min left</div></div><div class="grow meter" style="height:12px"><i style="width:${Batt.level}%;background:${Batt.level < 20 ? 'var(--bad)' : 'var(--good)'}"></i></div></div>
        ${tog('saver', 'Battery saver', 'Slows live wallpapers and background activity', 'leaf')}
        ${sel('screensaver', 'Screensaver after', '', 'moon', [[0, 'Never'], [1, '1 minute'], [2, '2 minutes'], [5, '5 minutes'], [10, '10 minutes'], [15, '15 minutes']])}
        ${sel('ssStyle', 'Screensaver style', '', 'image', [['aurora', 'Ribbons'], ['stars', 'Warp stars'], ['clock', 'Floating clock']])}
        <div class="row" style="margin-top:12px"><button class="btn" id="pvSS">Preview screensaver</button><button class="btn" id="pSleep">${svg('moon')} Sleep</button><button class="btn" id="pRestart">${svg('restart')} Restart</button><button class="btn" id="pOff">${svg('power')} Shut down</button></div>`,
      storage: () => { const tot = 5 * 1048576, used = Store.size(), fsz = (JSON.stringify(FS.root) || '').length * 2, wp = (CUSTOM_WP || '').length * 2, other = Math.max(0, used - fsz - wp), trash = FS.size(FS.node('/Trash')) * 2;
        return `<div class="h1">Storage</div><div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><b>RestoDrive (C:)</b><span class="muted">${fmtSize(used)} used of ${fmtSize(tot)}</span></div><div class="meter" style="height:14px"><i style="width:${fsz / tot * 100}%;background:var(--accent)"></i><i style="width:${wp / tot * 100}%;background:var(--tide)"></i><i style="width:${other / tot * 100}%;background:#c77dff"></i></div>
          <div class="row" style="margin-top:12px;font-size:12px;gap:18px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--accent)"></i> Files ${fmtSize(fsz)}</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--tide)"></i> Wallpaper ${fmtSize(wp)}</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#c77dff"></i> Apps &amp; settings ${fmtSize(other)}</span></div></div>
          <div class="h2">Clean up</div><div class="set-row"><div class="lbl">${svg('trash')}<div><div>Recycle Bin</div><small>${fmtSize(trash)} in ${FS.list('/Trash').length} items</small></div></div><button class="btn sm" id="stTrash">Empty</button></div>
          <div class="set-row"><div class="lbl">${svg('clock')}<div><div>Recent files and terminal history</div></div></div><button class="btn sm" id="stRecent">Clear</button></div>
          ${CUSTOM_WP ? `<div class="set-row"><div class="lbl">${svg('image')}<div><div>Custom wallpaper</div><small>${fmtSize(wp)}</small></div></div><button class="btn sm" id="stWp">Remove</button></div>` : ''}
          <p class="muted" style="font-size:12px">RestaurantOS stores everything in this browser's local storage.</p>`; },
      apps: () => `<div class="h1">Apps</div><div class="row" style="margin-bottom:12px"><button class="btn" id="apStore">${svg('store')} Get more apps in RestoStore</button></div>
        <table class="tbl"><thead><tr><th>App</th><th>Category</th><th>Start with RestaurantOS</th><th></th></tr></thead><tbody>${installedApps().map(a => `<tr><td><div class="row" style="flex-wrap:nowrap">${appIcon(a.id).replace('class="ai', 'style="width:26px;height:26px;border-radius:7px" class="ai')}${esc(a.name)}</div></td><td class="muted">${a.cat}</td><td><input type="checkbox" class="sw-t" data-start="${a.id}" ${S.startupApps.includes(a.id) ? 'checked' : ''} aria-label="Start ${esc(a.name)} with RestaurantOS"></td><td>${a.core ? '<span class="chip">System</span>' : `<button class="btn sm" data-un="${a.id}">Uninstall</button>`}</td></tr>`).join('')}</tbody></table>`,
      privacy: () => `<div class="h1">Privacy &amp; security</div>${tog('location', 'Location', 'Weather and Clock use your selected city', 'globe', 'p')}${tog('findDevice', 'Find my device', '', 'search', 'p')}${tog('diag', 'Diagnostic data', 'Nothing ever leaves this browser', 'taskmgr', 'p')}${tog('tailored', 'Tailored experiences', '', 'star', 'p')}
        <div class="h2">Device security</div><div class="card kv" style="display:grid"><dt>Secure Boot</dt><dd>${B.secureBoot ? '<span class="chip good">On</span>' : '<span class="chip warn">Off</span>'}</dd><dt>TPM 2.0</dt><dd>${B.tpm ? '<span class="chip good">Ready</span>' : '<span class="chip warn">Disabled</span>'}</dd><dt>Sign-in</dt><dd>${S.pass ? '<span class="chip good">Password</span>' : '<span class="chip warn">No password</span>'}</dd><dt>RestoDefender</dt><dd><span class="chip good">No threats</span> <a href="#" id="pvScan" style="color:var(--accent);margin-left:8px">Quick scan</a></dd></div>`,
      access: () => `<div class="h1">Accessibility</div>${tog('anim', 'Animation effects', 'Turn off to reduce motion across RestaurantOS', 'eye')}${tog('glass', 'Transparency effects', 'Turn off for solid, higher-contrast surfaces', 'contrast')}${sel('fontScale', 'Text size', '', 'text', [[90, '90%'], [100, '100%'], [110, '110%'], [125, '125%']])}${rng('iconSize', 'Desktop icon size', '', 'grid', 70, 140, 10)}
        <div class="h2">Keyboard shortcuts</div><div class="card kv" style="display:grid">${[['Ctrl+K', 'Search everything'], ['Alt+S', 'Start menu'], ['Alt+`', 'Switch windows'], ['Alt+V', 'Task view'], ['Alt+1…4', 'Switch desktop'], ['Alt+←/→/↑', 'Snap / maximize'], ['Alt+W', 'Close window'], ['Alt+M', 'Minimize'], ['Alt+D', 'Show desktop'], ['Alt+T / E / I / B', 'Terminal / Files / Settings / Browser'], ['Alt+A / N / G', 'Quick settings / Notifications / Widgets'], ['Alt+L', 'Lock']].map(([k, d]) => `<dt><span class="kbd">${k}</span></dt><dd>${d}</dd>`).join('')}</div>`,
      update: () => updatePageHTML(),
      about: () => `<div class="h1">About</div><div class="card row" style="gap:18px;margin-bottom:14px"><div style="width:64px">${NLOGO}</div><div class="grow"><div style="font-family:var(--f-display);font-size:20px">RestaurantOS ${osv()}</div><div class="muted">${IS2() ? 'Build 26.11 "Bistro"' : 'Build 26.10 "Phoenix"'} · © 2026 RestoTech</div></div><button class="btn sm" id="abRename">Rename PC</button></div>
        <div class="h2">Device specifications</div><div class="card kv" style="display:grid"><dt>Device name</dt><dd>${esc(S.device)}</dd><dt>Processor</dt><dd>RestoTech Quantum X9 @ ${B.oc ? '5.80 GHz (overclocked)' : '5.20 GHz'} · 16 cores</dd><dt>Installed RAM</dt><dd>32.0 GB DDR5-6400</dd><dt>Graphics</dt><dd>RestoForce RTX 9090 24 GB</dd><dt>Storage</dt><dd>RestoDrive Pro 2 TB NVMe</dd><dt>Firmware</dt><dd>RestoTech UEFI 4.20.1 · Secure Boot ${B.secureBoot ? 'on' : 'off'}</dd><dt>Host browser</dt><dd style="word-break:break-word">${esc(navigator.userAgent.split(') ').pop())}</dd><dt>CPU threads (real)</dt><dd>${navigator.hardwareConcurrency || '?'}</dd></div>
        <div class="row" style="margin-top:14px"><button class="btn" id="abBios">${svg('cpu')} Restart to BIOS</button><button class="btn" id="abRec">${svg('settings')} Recovery</button><button class="btn danger" id="abReset">${svg('restart')} Reset this PC</button></div>`
    };
    const render = () => {
      side.innerHTML = `<div style="padding:8px 10px 12px;display:flex;gap:10px;align-items:center">${avatarEl().replace('class="av', 'style="width:36px;height:36px;font-size:14px;flex:none" class="av')}<span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:600">${esc(S.user)}</span></div>` + NAV.map(([p, n, ic]) => `<button data-p="${p}" class="${page === p ? 'on' : ''}">${svg(ic)}<span>${n}</span></button>`).join('');
      $$('[data-p]', side).forEach(b => b.onclick = () => { page = b.dataset.p; render(); });
      main.innerHTML = `<div class="pad">${P[page]()}</div>`; main.scrollTop = 0; try { settingsV2(page, main.firstElementChild, render); } catch (e) { console.error(e); }
      wire();
    };
    const wire = () => {
      $$('[data-go]', main).forEach(b => b.onclick = () => { page = b.dataset.go; render(); });
      $$('[data-t]', main).forEach(c => c.onchange = () => { if (c.dataset.priv) S.privacy[c.dataset.t] = c.checked; else S[c.dataset.t] = c.checked; Snd.play('toggle'); applySettings(); });
      $$('[data-r]', main).forEach(r => { const set = () => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); set(); r.oninput = () => { S[r.dataset.r] = +r.value; $(`[data-rv="${r.dataset.r}"]`, main).textContent = r.value; set(); applySettings(); }; });
      $$('[data-s]', main).forEach(s => s.onchange = () => { const v = s.value; S[s.dataset.s] = isNaN(+v) || v === '' ? v : +v; applySettings(); if (s.dataset.s === 'kb') Taskbar.build(); });
      $$('[data-snd]', main).forEach(b => b.onclick = () => Snd.play(b.dataset.snd));
      $$('[data-theme]', main).forEach(b => b.onclick = () => { S.theme = b.dataset.theme; applySettings(); render(); });
      $$('[data-acc]', main).forEach(b => b.onclick = () => { S.accent = b.dataset.acc; applySettings(); render(); });
      $('[data-accc]', main)?.addEventListener('change', e => { S.accent = e.target.value; applySettings(); render(); });
      $$('[data-wp]', main).forEach(b => { b.onclick = () => { S.wallpaper = b.dataset.wp; applySettings(); render(); }; b.onkeydown = e => e.key === 'Enter' && b.onclick(); });
      $('[data-wpup]', main)?.addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setCustomWallpaper(r.result); setTimeout(render, 400); }; r.readAsDataURL(f); });
      $$('[data-av]', main).forEach(b => b.onclick = () => { S.avatar = +b.dataset.av; saveS(); render(); });
      const on = (id, f) => { const e = $('#' + id, main); if (e) e.onclick = f; };
      on('acNameS', () => { const v = $('#acName', main).value.trim(); if (v) { S.user = v; saveS(); render(); notify('Name updated', 'You are now signed in as ' + v + '.', 'settings'); } });
      on('acPw', () => { const old = $('#acOld', main), nw = $('#acNew', main).value, msg = $('#acMsg', main); if (S.pass && old.value !== S.pass) { msg.textContent = 'Current password is incorrect.'; msg.style.color = 'var(--bad)'; Snd.play('error'); return; } S.pass = nw; S.hint = $('#acHint', main).value; saveS(); Snd.play('success'); render(); notify('Sign-in updated', nw ? 'Your password was changed.' : 'Password removed. Anyone can sign in.', 'settings'); });
      on('acLock', lockScreen); on('acOut', signOut);
      on('nTest', () => notify('Test notification', 'Notifications are working. Click me to open Settings.', 'settings')); on('nClear', () => { NOTIFS = []; Store.set('notifs', []); render(); });
      on('pvSS', () => startSS()); on('pSleep', sleepPC); on('pRestart', () => restart()); on('pOff', powerOff);
      on('stTrash', async () => { await emptyTrash(); render(); }); on('stRecent', () => { RECENT = []; Store.set('recent', []); Store.set('termHist', []); notify('Cleared', 'Recent files and terminal history were removed.', 'settings'); });
      on('stWp', () => { CUSTOM_WP = null; Store.del('customWp'); if (S.wallpaper === 'custom') S.wallpaper = 'ember'; applySettings(); render(); });
      on('apStore', () => WM.open('store'));
      $$('[data-start]', main).forEach(c => c.onchange = () => { S.startupApps = c.checked ? [...S.startupApps, c.dataset.start] : S.startupApps.filter(x => x !== c.dataset.start); saveS(); });
      $$('[data-un]', main).forEach(b => b.onclick = () => uninstallApp(b.dataset.un));
      on('pvScan', async e => { e?.preventDefault?.(); const el = $('#pvScan', main); for (let i = 0; i <= 100; i += 5) { el.textContent = `Scanning… ${i}%`; await sleep(60); } el.textContent = 'Scan complete — 0 threats'; notify('RestoDefender', `Quick scan finished. ${FS.walk('/').length} items scanned, no threats found.`, 'settings'); });
      wireUpdatePage(main, render);
      on('abRename', async () => { const n = await UI.prompt('Rename your PC', 'Use letters, numbers and hyphens.', S.device); if (n && /^[\w-]{1,15}$/.test(n)) { S.device = n.toUpperCase(); saveS(); render(); } else if (n) UI.alert('Invalid name', 'Use up to 15 letters, numbers or hyphens.'); });
      on('abBios', () => restart(true)); on('abRec', async () => { await shutdownScreen('Restarting'); openRecovery(); });
      on('abReset', async () => { if (await UI.confirm('Reset this PC?', 'All files, settings and apps will be removed and RestaurantOS Setup will start again. This cannot be undone.', 'Reset', true)) { await shutdownScreen('Resetting this PC'); factoryReset(); } });
      if (page === 'display') { let n = 0, t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else { const el = $('#fpsV', main); if (el) el.textContent = n + ' Hz (measured)'; } }; requestAnimationFrame(f); }
    };
    const tickT = () => { const t = $('#tNow', main); if (t) t.textContent = fmtTime(); };
    onWin(w, 'tick', tickT); onWin(w, 'apps', () => page === 'apps' && render());
    render();
  }
});

/* ---------------- BROWSER ---------------- */
const WIKI = {
  RestaurantOS: ['RestaurantOS', 'RestaurantOS 1.0 is a desktop operating system that runs entirely inside a web browser. It includes a firmware setup utility, a guided setup experience, a compositing window manager with snapping and virtual desktops, and more than twenty built-in apps.', ['Release: October 2026 (Build 26.10 "Phoenix")', 'Kernel: 1.0.0-revival', 'Shell: rsh 2.1', 'File system: RestoFS (browser local storage)']],
  BIOS: ['RestoTech UEFI', 'The RestoTech UEFI firmware runs before RestaurantOS. Press DEL or F2 during the power-on self test to open Setup, or F12 for the Boot Menu. Settings such as Fast Boot, overclocking and the boot animation change how RestaurantOS behaves.', ['Main, Advanced, Boot, Security and Exit screens', 'Boot order with USB and PXE fallbacks', 'Recovery environment with Startup Repair and Reset']],
  Shortcuts: ['Keyboard shortcuts', 'RestaurantOS is designed to be driven from the keyboard as well as the mouse.', ['Ctrl+K — search', 'Alt+` — switch windows', 'Alt+V — task view', 'Alt+←/→ — snap windows', 'Alt+L — lock']]
};
defApp({
  id: 'browser', name: 'Resto Browser', glyph: 'browser', colors: ['#4cc9f0', '#2ec4b6'], w: 980, h: 640, cat: 'Internet', desc: 'Browse the RestoNet', kw: 'web internet chrome edge firefox safari',
  run(w, args) {
    const tabs = []; let cur = 0; const bms = Store.get('bookmarks', [['Home', 'resto://home'], ['RestaurantOS Wiki', 'resto://wiki/RestaurantOS'], ['News', 'resto://news'], ['Games', 'resto://games'], ['Wikipedia', 'https://wikipedia.org']]);
    let histAll = Store.get('brHist', []);
    w.body.innerHTML = `<div class="br-tabs"></div><div class="br-bar"><button class="tbtn" data-a="back">${svg('back')}</button><button class="tbtn" data-a="fwd">${svg('fwd')}</button><button class="tbtn" data-a="reload">${svg('refresh')}</button><button class="tbtn" data-a="home">${svg('home')}</button><input class="br-url" aria-label="Address"><button class="tbtn" data-a="star" title="Bookmark">${svg('star')}</button></div><div class="br-bm"></div><div class="br-page"></div>`;
    const tabsEl = $('.br-tabs', w.body), url = $('.br-url', w.body), page = $('.br-page', w.body), bmEl = $('.br-bm', w.body);
    const newTab = (u = 'resto://home') => { tabs.push({ hist: [], hi: -1, title: 'New tab' }); cur = tabs.length - 1; nav(u); };
    const T = () => tabs[cur];
    const norm = u => { u = u.trim(); if (/^resto:\/\//.test(u) || /^https?:\/\//.test(u)) return u; if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(u)) return 'https://' + u; return 'resto://search?q=' + encodeURIComponent(u); };
    const nav = (u, push = true) => { u = norm(u); const t = T(); if (push) { t.hist = t.hist.slice(0, t.hi + 1); t.hist.push(u); t.hi = t.hist.length - 1; histAll = [{ u, t: Date.now() }, ...histAll].slice(0, 50); Store.set('brHist', histAll); } load(u); };
    const load = u => {
      url.value = u.startsWith('resto://home') ? '' : u; page.scrollTop = 0;
      page.innerHTML = '<div style="height:3px;background:var(--accent);width:0;transition:width .4s" id="brLoad"></div>';
      requestAnimationFrame(() => { const l = $('#brLoad', page); if (l) l.style.width = '80%'; });
      setTimeout(() => render(u), 220);
    };
    const link = (u, t) => `<a data-u="${esc(u)}">${esc(t)}</a>`;
    const render = u => {
      let title = u, h = '';
      const [, route, rest] = u.match(/^resto:\/\/([^/?]+)\/?(.*)$/) || [];
      if (route === 'home') {
        title = 'New tab';
        h = `<div class="br-home"><h1>Resto<b>Search</b></h1><input class="br-search" placeholder="Search the RestoNet or type an address" aria-label="Search"><div class="br-dial">${[['W', 'Wiki', 'resto://wiki/RestaurantOS', '#ff7a45'], ['N', 'News', 'resto://news', '#2ec4b6'], ['G', 'Games', 'resto://games', '#c77dff'], ['H', 'History', 'resto://history', '#4cc9f0'], ['B', 'BIOS guide', 'resto://wiki/BIOS', '#ffd166'], ['K', 'Shortcuts', 'resto://wiki/Shortcuts', '#3ddc97'], ['?', 'About', 'resto://about', '#ff4d6d'], ['↗', 'Wikipedia', 'https://wikipedia.org', '#6b7280']].map(([i, n, l, c]) => `<button data-u="${l}"><i style="background:${c}">${i}</i>${n}</button>`).join('')}</div><div class="muted" style="font-size:12px">${fmtDate()} · ${Weather.now().temp}° in ${esc(S.city)}</div></div>`;
      } else if (route === 'wiki') {
        const k = decodeURIComponent(rest) || 'RestaurantOS'; const a = WIKI[k];
        title = (a ? a[0] : k) + ' — RestoPedia';
        h = a ? `<div class="br-doc"><div class="muted" style="font-size:12px">RestoPedia, the free encyclopedia</div><h1>${a[0]}</h1><p>${a[1]}</p><ul>${a[2].map(x => `<li>${esc(x)}</li>`).join('')}</ul><p>See also: ${Object.keys(WIKI).filter(x => x !== k).map(x => link('resto://wiki/' + x, WIKI[x][0])).join(' · ')}</p></div>` : `<div class="br-doc"><h1>${esc(k)}</h1><p>RestoPedia does not have an article with this exact name. ${link('resto://search?q=' + encodeURIComponent(k), 'Search for it')} instead.</p></div>`;
      } else if (route === 'news') {
        title = 'RestoNews';
        h = `<div class="br-doc"><h1>RestoNews</h1>${[['RestaurantOS 1.0 released', 'The rebuilt desktop ships with live wallpapers, virtual desktops, snap layouts and a full BIOS.'], ['RestoStore crosses 10 apps', 'Breakout, Memory, Piano and Unit Converter join the catalog this week.'], ['Weather in ' + S.city, `Expect ${Weather.day(1).cond.toLowerCase()} tomorrow with a high of ${Weather.day(1).hi}°.`], ['Tip of the week', 'Press Alt+` to cycle through your open windows without touching the mouse.']].map(([t, d]) => `<div class="br-res"><h3 style="margin:0 0 4px">${esc(t)}</h3><div class="muted">${esc(d)}</div></div>`).join('')}</div>`;
      } else if (route === 'games') {
        title = 'Games';
        h = `<div class="br-doc"><h1>Games on RestaurantOS</h1><div class="store-grid">${['snake', 'minesweeper', 'g2048', 'ttt', 'breakout', 'memory'].filter(id => APPS[id]).map(id => `<div class="store-card">${appIcon(id)}<div><h4>${APPS[id].name}</h4><p>${APPS[id].desc}</p><button class="btn sm primary" data-app="${id}">${isInstalled(id) ? 'Play' : 'Get in RestoStore'}</button></div></div>`).join('')}</div></div>`;
      } else if (route === 'history') {
        title = 'History';
        h = `<div class="br-doc"><h1>History</h1>${histAll.length ? histAll.map(x => `<div class="br-res">${link(x.u, x.u)}<br><small class="muted">${new Date(x.t).toLocaleString()}</small></div>`).join('') : '<p class="muted">No history yet.</p>'}<p><button class="btn sm" id="brClr">Clear history</button></p></div>`;
      } else if (route === 'about') {
        title = 'About Resto Browser';
        h = `<div class="br-doc"><h1>Resto Browser</h1><p>Version 1.0 for RestaurantOS. Resto Browser shows pages from the RestoNet (addresses that start with <code>resto://</code>). Pages on the public internet open in your real browser.</p></div>`;
      } else if (route === 'search') {
        const q = decodeURIComponent((rest.match(/q=([^&]*)/) || [])[1] || '').replace(/\+/g, ' ');
        title = q + ' — RestoSearch'; const ql = q.toLowerCase();
        const hits = [...Object.entries(WIKI).filter(([k, v]) => (k + v[0] + v[1]).toLowerCase().includes(ql)).map(([k, v]) => ['resto://wiki/' + k, v[0], v[1].slice(0, 140) + '…']), ...installedApps().filter(a => a.name.toLowerCase().includes(ql)).map(a => ['app:' + a.id, a.name + ' — RestaurantOS app', a.desc])];
        h = `<div class="br-doc"><input class="br-search" value="${esc(q)}" aria-label="Search"><p class="muted" style="font-size:12px">About ${hits.length} RestoNet results</p>${hits.map(([u, t, d]) => `<div class="br-res">${u.startsWith('app:') ? `<a data-app="${u.slice(4)}">${esc(t)}</a>` : link(u, t)}<br><small>${esc(u.startsWith('app:') ? 'nikos://apps/' + u.slice(4) : u)}</small><div class="muted">${esc(d)}</div></div>`).join('')}
          <div class="br-res"><a href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">Search the real web for "${esc(q)}" ↗</a><br><small>Opens in your browser</small></div></div>`;
      } else if (/^https?:/.test(u)) {
        title = u.replace(/^https?:\/\//, '').split('/')[0];
        h = `<div class="br-doc" style="text-align:center;padding-top:80px"><div class="ai" style="width:64px;height:64px;margin:0 auto 18px;background:linear-gradient(150deg,#4cc9f0,#2ec4b6)">${svg('globe')}</div><h1 style="font-size:24px">${esc(title)} opens outside RestaurantOS</h1><p class="muted">Public websites can't be displayed inside the RestaurantOS sandbox. Open it in a new tab of your real browser instead.</p><p><a class="btn primary" href="${esc(u)}" target="_blank" rel="noopener" style="text-decoration:none">Open ${esc(title)} ↗</a></p></div>`;
      } else { title = 'Not found'; h = `<div class="br-doc"><h1>Hmm, can't reach this page</h1><p class="muted">${esc(u)} doesn't exist on the RestoNet. Try ${link('resto://home', 'the home page')}.</p></div>`; }
      page.innerHTML = h; T().title = title; renderTabs(); w.setTitle(title + ' — Resto Browser');
      $$('[data-u]', page).forEach(a => a.onclick = () => nav(a.dataset.u));
      $$('[data-app]', page).forEach(a => a.onclick = () => isInstalled(a.dataset.app) ? WM.open(a.dataset.app) : WM.open('store', { q: APPS[a.dataset.app].name }));
      const s = $('.br-search', page); if (s) { s.onkeydown = e => e.key === 'Enter' && s.value.trim() && nav(s.value); if (route === 'home') setTimeout(() => s.focus(), 50); }
      $('#brClr', page)?.addEventListener('click', () => { histAll = []; Store.set('brHist', []); nav('resto://history', false); });
      $('[data-a=star]', w.body).classList.toggle('on', bms.some(b => b[1] === u));
    };
    const renderTabs = () => {
      tabsEl.innerHTML = tabs.map((t, i) => `<div class="br-tab ${i === cur ? 'on' : ''}" data-i="${i}"><span>${esc(t.title)}</span><button data-x="${i}" aria-label="Close tab">✕</button></div>`).join('') + `<button class="tbtn" data-new title="New tab">${svg('plus')}</button>`;
      $$('.br-tab', tabsEl).forEach(t => t.onclick = e => { if (e.target.closest('[data-x]')) return; cur = +t.dataset.i; load(T().hist[T().hi]); });
      $$('[data-x]', tabsEl).forEach(b => b.onclick = () => { tabs.splice(+b.dataset.x, 1); if (!tabs.length) return WM.close(w); cur = Math.min(cur, tabs.length - 1); load(T().hist[T().hi]); });
      $('[data-new]', tabsEl).onclick = () => newTab();
      bmEl.innerHTML = bms.map(([n, u]) => `<button data-u="${esc(u)}">${esc(n)}</button>`).join('');
      $$('[data-u]', bmEl).forEach(b => b.onclick = () => nav(b.dataset.u));
    };
    $$('[data-a]', w.body).forEach(b => b.onclick = () => {
      const t = T(), a = b.dataset.a;
      if (a === 'back' && t.hi > 0) load(t.hist[--t.hi]);
      if (a === 'fwd' && t.hi < t.hist.length - 1) load(t.hist[++t.hi]);
      if (a === 'reload') load(t.hist[t.hi]);
      if (a === 'home') nav('resto://home');
      if (a === 'star') { const u = t.hist[t.hi]; const i = bms.findIndex(x => x[1] === u); if (i >= 0) bms.splice(i, 1); else bms.push([t.title.slice(0, 20), u]); Store.set('bookmarks', bms); renderTabs(); b.classList.toggle('on', i < 0); }
    });
    url.onkeydown = e => { if (e.key === 'Enter' && url.value.trim()) nav(url.value); };
    url.onfocus = () => url.select();
    w.onArgs = a => { if (a.q) newTab('resto://search?q=' + encodeURIComponent(a.q)); if (a.url) newTab(a.url); };
    newTab(args.q ? 'resto://search?q=' + encodeURIComponent(args.q) : args.url || 'resto://home');
  }
});
