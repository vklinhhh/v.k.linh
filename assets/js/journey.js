/* My Journey — career milestones told through an auto-playing chess game.
 *
 * To add a milestone, add one object to MILESTONES (keep them in date order).
 * Milestones pop up on the game's captures; the last one always lands on checkmate.
 *   type:  'learn' or 'work'
 *   start: 'YYYY' or 'YYYY-MM'      end: same format, or null for "present"
 */
(function () {
  'use strict';

  var MILESTONES = [
    { type: 'learn', start: '2015', end: '2021', title: 'BEng, Logistics & Supply Chain', org: 'VNU · International University', detail: 'Thesis on demand forecasting. Where the data habit started.' },
    { type: 'work', start: '2020-06', end: '2020-12', title: 'SQL Intern', org: 'Scaleflex', detail: 'My very first SELECT * FROM.' },
    { type: 'work', start: '2020-12', end: '2022-06', title: 'Network Operator → Senior', org: 'KDDI Corporation', detail: 'Network operations center.' },
    { type: 'learn', start: '2021-05', end: '2023-12', title: 'Diploma, Data Science & AI', org: 'APTECH', detail: 'Distinction. Thesis on Vietnamese handwriting recognition, 95/100.' },
    { type: 'work', start: '2022-06', end: '2022-11', title: 'Data Analyst', org: 'KAMEREO', detail: 'Strategy & Planning Analytics.' },
    { type: 'work', start: '2022-11', end: '2024-02', title: 'Data Analyst', org: 'TIKI', detail: 'Commercial Business Intelligence.' },
    { type: 'learn', start: '2023-01', end: '2026', title: 'MSc, Artificial Intelligence', org: 'VNUHCM · University of Science', detail: 'Graduated in 2026.' },
    { type: 'work', start: '2024-02', end: '2025-06', title: 'Data Scientist', org: 'XOMAD', detail: 'Machine learning and deep learning.' },
    { type: 'work', start: '2025-07', end: null, title: 'Data Scientist', org: 'Motorola Solutions', detail: 'Computer vision and LLMs. Where the game stands today.' }
  ];

  /* Morphy vs. Duke Karl of Brunswick & Count Isouard, Paris 1858 ("the Opera Game") */
  var GAME = 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'.split(' ');

  var STEP_MS = 650, HOLD_MS = 2800;
  var GLYPH = { p: '♟︎', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
  var FILES = 'abcdefgh';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var root = document.getElementById('j-game');
  if (!root || typeof Chess === 'undefined') return;
  var boardEl = document.getElementById('j-board');
  var popEl = document.getElementById('j-pop');
  var railEl = document.getElementById('j-rail');
  var playBtn = document.getElementById('j-play');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function label(s) { if (!s) return 'now'; var p = String(s).split('-'); return p[1] ? MONTHS[+p[1] - 1] + ' ' + p[0] : p[0]; }

  /* ---------- which move shows which milestone ---------- */
  var plies = (function () {
    var probe = new Chess(), out = [];
    GAME.forEach(function (san) { var r = probe.move(san); out.push({ san: r.san, from: r.from, to: r.to, captured: r.captured }); });
    return out;
  })();
  var LAST = plies.length - 1;
  var at = (function () {
    var n = MILESTONES.length;
    var pool = [];
    plies.forEach(function (p, i) { if (p.captured && i < LAST) pool.push(i); });
    if (pool.length < n - 1) { pool = []; for (var i = 0; i < LAST; i++) pool.push(i); }
    var out = [];
    for (var k = 0; k < n - 1; k++) out.push(pool[n - 1 === 1 ? 0 : Math.round(k * (pool.length - 1) / (n - 2))]);
    out.push(LAST);
    return out;
  })();
  var milestoneAt = {};
  at.forEach(function (p, i) { milestoneAt[p] = i; });

  /* ---------- board ---------- */
  var sqEls = {};
  for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
    var el = document.createElement('div');
    el.className = 'j-sq' + ((r + f) % 2 === 0 ? ' l' : '');
    boardEl.appendChild(el);
    sqEls[FILES[f] + (8 - r)] = el;
  }

  /* ---------- year rail ---------- */
  var dots = MILESTONES.map(function (m, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'j-dot ' + m.type;
    b.innerHTML = '<i aria-hidden="true"></i><span>' + String(m.start).slice(0, 4) + '</span>';
    b.setAttribute('aria-label', label(m.start) + ': ' + m.title + ', ' + m.org);
    b.addEventListener('click', function () { jumpTo(i); });
    railEl.appendChild(b);
    return b;
  });

  /* ---------- playback ---------- */
  var game, ply = -1, timer, playing = false, started = false;

  function setPosition(toPly) {
    game = new Chess();
    for (var i = 0; i <= toPly; i++) game.move(GAME[i]);
    ply = toPly;
  }

  function renderBoard() {
    var board = game.board(), last = ply >= 0 ? plies[ply] : null;
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
      var name = FILES[f] + (8 - r), p = board[r][f], el = sqEls[name];
      var cls = 'j-sq' + ((r + f) % 2 === 0 ? ' l' : '') + (p && p.color === 'b' ? ' b' : '');
      if (last && (last.from === name || last.to === name)) cls += ' last';
      if (game.in_checkmate() && p && p.type === 'k' && p.color === 'b') cls += ' mate';
      el.className = cls;
      el.innerHTML = p ? '<span>' + GLYPH[p.color === 'w' ? p.type.toUpperCase() : p.type] + '</span>' : '';
    }
    var reached = -1;
    at.forEach(function (p, i) { if (p <= ply) reached = i; });
    dots.forEach(function (d, i) {
      d.classList.toggle('done', i <= reached);
      d.classList.toggle('on', i === reached);
      if (i === reached) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
    playBtn.textContent = playing ? '❚❚ pause' : (ply >= LAST ? '↺ replay' : '▶ play');
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  /* pop the milestone card next to the square where the capture happened */
  function pop(i) {
    var m = MILESTONES[i], sq = plies[at[i]].to;
    var f = FILES.indexOf(sq[0]), rank = +sq[1];
    var col = (f + 0.5) / 8 * 100, row = (8 - rank + 0.5) / 8 * 100;
    popEl.className = 'j-pop ' + m.type + (f >= 4 ? ' left' : ' right') + (rank <= 3 ? ' up' : '') + (rank >= 5 ? ' below' : ' above');
    popEl.style.setProperty('--x', col + '%');
    popEl.style.setProperty('--y', row + '%');
    popEl.innerHTML =
      '<span class="j-pop-when">' + label(m.start) + ' – ' + label(m.end) + '</span>' +
      '<strong class="j-pop-title">' + esc(m.title) + '</strong>' +
      '<span class="j-pop-org">' + esc(m.org) + '</span>' +
      (m.detail ? '<span class="j-pop-detail">' + esc(m.detail) + '</span>' : '');
    void popEl.offsetWidth;
    popEl.classList.add('show');
    var s = sqEls[sq];
    s.classList.add('hit');
    setTimeout(function () { s.classList.remove('hit'); }, 700);
  }
  function hidePop() { popEl.classList.remove('show'); }

  function tick() {
    clearTimeout(timer);
    if (!playing) return;
    if (ply >= LAST) { playing = false; renderBoard(); return; }
    hidePop();
    game.move(GAME[ply + 1]); ply++;
    renderBoard();
    if (ply in milestoneAt) { pop(milestoneAt[ply]); timer = setTimeout(tick, ply === LAST ? 0 : HOLD_MS); }
    else timer = setTimeout(tick, STEP_MS);
  }

  function play() {
    if (ply >= LAST) { setPosition(-1); hidePop(); }
    playing = true; renderBoard();
    timer = setTimeout(tick, 350);
  }
  function pause() { playing = false; clearTimeout(timer); renderBoard(); }
  function jumpTo(i) { started = true; pause(); setPosition(at[i]); renderBoard(); pop(i); }

  playBtn.addEventListener('click', function () { started = true; playing ? pause() : play(); });

  /* reduced motion: show the final position and the latest milestone */
  if (reduce) { setPosition(LAST); renderBoard(); pop(MILESTONES.length - 1); return; }
  setPosition(-1); renderBoard();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; io.disconnect(); play(); }
    }, { threshold: 0.4 });
    io.observe(boardEl);
  } else { started = true; play(); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
