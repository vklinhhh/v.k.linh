/* My Journey — career milestones told through an auto-playing chess game.
 *
 * To add a milestone, add one object to MILESTONES (keep them in date order).
 * The game spreads every milestone over its moves automatically; the last one
 * always lands on the final checkmate.
 *   type:  'learn' or 'work'
 *   start: 'YYYY' or 'YYYY-MM'      end: same format, or null for "present"
 */
(function () {
  'use strict';

  var MILESTONES = [
    { type: 'learn', start: '2015', end: '2021', title: 'BEng, Logistics & Supply Chain', org: 'VNU · International University', detail: 'Thesis: optimising inventory allocation with time-series demand forecasting. Where the data habit started.' },
    { type: 'work', start: '2020-06', end: '2020-12', title: 'SQL Intern', org: 'Scaleflex', detail: 'My very first SELECT * FROM, mentored by the CTO. Remote.' },
    { type: 'work', start: '2020-12', end: '2022-06', title: 'Network Operator → Senior', org: 'KDDI Corporation', detail: 'Network operations center, promoted to Senior Network Operator.' },
    { type: 'learn', start: '2021-05', end: '2023-12', title: 'Professional Diploma, Data Science & AI', org: 'APTECH Computer Education', detail: 'Graduated with Distinction. Thesis: Vietnamese handwriting recognition with VietOCR (VGG19 + Transformer), 95/100.' },
    { type: 'work', start: '2022-06', end: '2022-11', title: 'Data Analyst', org: 'KAMEREO', detail: 'Strategy & Planning Analytics.' },
    { type: 'work', start: '2022-11', end: '2024-02', title: 'Data Analyst', org: 'TIKI', detail: 'Commercial Business Intelligence.' },
    { type: 'learn', start: '2023-01', end: '2026', title: 'MSc, Artificial Intelligence', org: 'VNUHCM · University of Science', detail: 'Master of Science in AI. Graduated in 2026.' },
    { type: 'work', start: '2024-02', end: '2025-06', title: 'Data Scientist', org: 'XOMAD', detail: 'First role as a Data Scientist: machine learning and deep learning.' },
    { type: 'work', start: '2025-07', end: null, title: 'Data Scientist', org: 'Motorola Solutions', detail: 'Computer vision and large language models. This is where the game stands today.' }
  ];

  /* Morphy vs. Duke Karl of Brunswick & Count Isouard, Paris 1858 ("the Opera Game") */
  var GAME = 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'.split(' ');

  var STEP_MS = 800, HOLD_MS = 2600;
  var GLYPH = { p: '♟︎', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
  var FILES = 'abcdefgh';

  var root = document.getElementById('j-game');
  if (!root || typeof Chess === 'undefined') return;
  var boardEl = document.getElementById('j-board');
  var listEl = document.getElementById('j-list');
  var laneEl = document.getElementById('j-lanes');
  var headEl = document.getElementById('j-head');
  var capEl = document.getElementById('j-caption');
  var playBtn = document.getElementById('j-play');
  var nextBtn = document.getElementById('j-next');
  var replayBtn = document.getElementById('j-replay');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- dates ---------- */
  var NOW = new Date();
  var NOW_Y = NOW.getFullYear() + NOW.getMonth() / 12;
  function y(s) { if (!s) return NOW_Y; var p = String(s).split('-'); return +p[0] + (p[1] ? (+p[1] - 1) / 12 : 0); }
  function label(s) { if (!s) return 'now'; var p = String(s).split('-'); return p[1] ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + p[0] : p[0]; }
  var Y0 = Math.floor(Math.min.apply(null, MILESTONES.map(function (m) { return y(m.start); })));
  var Y1 = Math.ceil(Math.max.apply(null, MILESTONES.map(function (m) { return y(m.end); })) + 0.01);
  function pct(v) { return ((v - Y0) / (Y1 - Y0) * 100).toFixed(2) + '%'; }

  /* ---------- spread milestones over the game's moves ---------- */
  var plies = (function () {
    var probe = new Chess(), info = [];
    GAME.forEach(function (san) { var r = probe.move(san); info.push({ san: r.san, color: r.color, from: r.from, to: r.to, captured: r.captured, check: /[+#]/.test(r.san) }); });
    return info;
  })();
  var LAST = plies.length - 1;
  var at = (function () {
    var n = MILESTONES.length, used = {}, out = [];
    var interesting = function (i) { return plies[i].captured || plies[i].check; };
    for (var k = 0; k < n; k++) {
      var target = n === 1 ? LAST : Math.round(k * LAST / (n - 1));
      var best = target;
      if (k > 0 && k < n - 1) {
        for (var d = 0; d <= 3; d++) {
          var a = target - d, b = target + d;
          if (a > (out[k - 1] || -1) && a < LAST && !used[a] && interesting(a)) { best = a; break; }
          if (b < LAST && !used[b] && interesting(b)) { best = b; break; }
        }
      }
      if (k > 0 && best <= out[k - 1]) best = Math.min(out[k - 1] + 1, LAST);
      used[best] = true; out.push(best);
    }
    return out;
  })();
  var milestoneAt = {}; at.forEach(function (p, i) { milestoneAt[p] = i; });

  /* ---------- build board ---------- */
  var sqEls = {};
  for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
    var name = FILES[f] + (8 - r), el = document.createElement('div');
    el.className = 'j-sq' + ((r + f) % 2 === 0 ? ' l' : '');
    boardEl.appendChild(el); sqEls[name] = el;
  }

  /* ---------- build list + lanes ---------- */
  var itemEls = MILESTONES.map(function (m, i) {
    var li = document.createElement('li');
    li.className = 'j-item ' + m.type;
    li.innerHTML =
      '<button type="button" class="j-item-btn" aria-label="Go to ' + esc(m.title + ', ' + m.org) + '">' +
      '<span class="j-dot" aria-hidden="true"></span>' +
      '<span class="j-when">' + label(m.start) + ' – ' + label(m.end) + '</span>' +
      '<span class="j-title">' + esc(m.title) + '</span>' +
      '<span class="j-org">' + esc(m.org) + '</span>' +
      '<span class="j-detail">' + esc(m.detail) + '</span>' +
      '<span class="j-move" aria-hidden="true"></span>' +
      '</button>';
    li.querySelector('button').addEventListener('click', function () { jumpTo(i); });
    listEl.appendChild(li);
    return li;
  });

  var lanes = { learn: [], work: [] };
  var barEls = MILESTONES.map(function (m, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'j-bar ' + m.type;
    b.style.left = pct(y(m.start));
    b.style.width = 'calc(' + pct(y(m.end) + Y0 - y(m.start) + 0.001) + ' - 2px)';
    b.title = m.title + ' · ' + m.org;
    b.setAttribute('aria-label', m.title + ', ' + m.org + ', ' + label(m.start) + ' to ' + label(m.end));
    b.addEventListener('click', function () { jumpTo(i); });
    /* stack overlapping bars in the same lane */
    var row = 0, list = lanes[m.type];
    while (list.some(function (o) { return o.row === row && y(m.start) < o.end - 0.02; })) row++;
    list.push({ row: row, end: y(m.end) });
    b.style.setProperty('--row', row);
    document.getElementById('j-lane-' + m.type).appendChild(b);
    return b;
  });
  ['learn', 'work'].forEach(function (t) {
    var rows = 1 + Math.max.apply(null, lanes[t].map(function (o) { return o.row; }).concat([0]));
    document.getElementById('j-lane-' + t).style.setProperty('--rows', rows);
  });
  var ticks = document.getElementById('j-ticks');
  for (var yr = Y0; yr <= Y1; yr++) {
    var t = document.createElement('span');
    t.style.left = pct(yr); t.textContent = yr;
    if ((Y1 - Y0) > 8 && (yr - Y0) % 2 === 1 && yr !== Y1) t.className = 'minor';
    else if ((yr - Y0) % 4 !== 0 && yr !== Y1) t.className = 'minor2';
    ticks.appendChild(t);
  }

  /* ---------- playback ---------- */
  var game, ply, active, timer, playing = false, started = false;

  function setPosition(toPly) {
    game = new Chess();
    for (var i = 0; i <= toPly; i++) game.move(GAME[i]);
    ply = toPly;
  }

  function render() {
    var board = game.board(), last = ply >= 0 ? plies[ply] : null;
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
      var name = FILES[f] + (8 - r), p = board[r][f], el = sqEls[name];
      var cls = 'j-sq' + ((r + f) % 2 === 0 ? ' l' : '') + (p && p.color === 'b' ? ' b' : '');
      if (last && (last.from === name || last.to === name)) cls += ' last';
      if (last && last.to === name && ply in milestoneAt) cls += ' hit';
      if (game.in_checkmate() && p && p.type === 'k' && p.color === 'b') cls += ' mate';
      el.className = cls;
      el.innerHTML = p ? '<span>' + GLYPH[p.color === 'w' ? p.type.toUpperCase() : p.type] + '</span>' : '';
    }
    boardEl.setAttribute('aria-label', 'Chess board after ' + (ply + 1) + ' half-moves');
    var reached = -1;
    at.forEach(function (p, i) { if (p <= ply) reached = i; });
    active = reached;
    itemEls.forEach(function (li, i) {
      li.classList.toggle('done', i < reached);
      li.classList.toggle('on', i === reached);
      li.classList.toggle('todo', i > reached);
      li.querySelector('.j-move').textContent = i <= reached ? moveNo(at[i]) + ' ' + plies[at[i]].san : '';
      if (i === reached) li.querySelector('button').setAttribute('aria-current', 'step'); else li.querySelector('button').removeAttribute('aria-current');
    });
    barEls.forEach(function (b, i) { b.classList.toggle('on', i === reached); b.classList.toggle('done', i < reached); });
    var m = reached >= 0 ? MILESTONES[reached] : null;
    headEl.style.left = m ? pct(y(m.start)) : pct(Y0);
    headEl.classList.toggle('show', !!m);
    var move = ply >= 0 ? moveNo(ply) + ' ' + plies[ply].san : 'start';
    capEl.innerHTML = '<span class="j-cap-move">' + move + '</span>' +
      (m ? '<span class="j-cap-ms ' + m.type + '">' + label(m.start) + ' · ' + esc(m.title) + ' · ' + esc(m.org) + '</span>' : '<span class="j-cap-ms">2015 · the opening</span>');
    playBtn.textContent = playing ? '[ ❚❚ pause ]' : '[ ▶ play ]';
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    nextBtn.disabled = ply >= LAST;
  }

  function moveNo(i) { return Math.floor(i / 2) + 1 + (i % 2 === 0 ? '.' : '…'); }

  function tick() {
    clearTimeout(timer);
    if (!playing) return;
    if (ply >= LAST) { playing = false; render(); return; }
    game.move(GAME[ply + 1]); ply++;
    render();
    var hit = ply in milestoneAt;
    if (hit) pulse(milestoneAt[ply]);
    timer = setTimeout(tick, hit ? HOLD_MS : STEP_MS);
  }

  function pulse(i) {
    var li = itemEls[i];
    li.classList.remove('pulse'); void li.offsetWidth; li.classList.add('pulse');
    var box = listEl.closest('.j-list-wrap');
    if (box && box.scrollHeight > box.clientHeight + 4) {
      var top = li.offsetTop - box.clientHeight / 2 + li.offsetHeight / 2;
      box.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function play() {
    if (ply >= LAST) { setPosition(-1); render(); }
    playing = true; render();
    timer = setTimeout(tick, 400);
  }
  function pause() { playing = false; clearTimeout(timer); render(); }
  function jumpTo(i) {
    pause(); started = true;
    setPosition(at[i]); render(); pulse(i);
  }

  playBtn.addEventListener('click', function () { started = true; playing ? pause() : play(); });
  nextBtn.addEventListener('click', function () {
    var next = 0; while (next < at.length && at[next] <= ply) next++;
    if (next < at.length) jumpTo(next);
  });
  replayBtn.addEventListener('click', function () { started = true; pause(); setPosition(-1); render(); play(); });

  /* at rest: the full story is visible. Reduced motion shows the final position. */
  if (reduce) { setPosition(LAST); render(); return; }
  setPosition(-1); render();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; io.disconnect(); play(); }
    }, { threshold: 0.35 });
    io.observe(root);
  } else { started = true; play(); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
