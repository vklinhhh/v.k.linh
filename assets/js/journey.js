/* My Journey — career milestones told through an auto-playing chess game,
 * written to a git-style graph as the game goes.
 *
 * To add a milestone, add one object to MILESTONES (keep them in date order).
 * Milestones land on the game's captures; the last one always lands on checkmate.
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

  var STEP_MS = 650, HOLD_MS = 2600, FLY_AT = 1500;
  var GLYPH = { p: '♟︎', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚', P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔' };
  var FILES = 'abcdefgh';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var root = document.getElementById('j-game');
  if (!root || typeof Chess === 'undefined') return;
  var boardEl = document.getElementById('j-board');
  var popEl = document.getElementById('j-pop');
  var logEl = document.getElementById('j-log');
  var headEl = document.getElementById('j-headline');
  var playBtn = document.getElementById('j-play');
  var graphEl = logEl.parentNode, wrapEl = boardEl.closest('.j-wrap');

  /* the graph is exactly as tall as the board column; the log scrolls inside it */
  function fitGraph() {
    graphEl.style.height = window.innerWidth > 900 && wrapEl ? wrapEl.offsetHeight + 'px' : '';
  }
  fitGraph();
  window.addEventListener('resize', fitGraph);
  function scrollLogTo(row) {
    if (!row || row.hidden) return;
    var top = row.offsetTop;
    var target = Math.max(0, top + row.offsetHeight - logEl.clientHeight + 8);
    if (top < logEl.scrollTop) target = top;
    logEl.scrollTop = target;
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function label(s) { if (!s) return 'now'; var p = String(s).split('-'); return p[1] ? MONTHS[+p[1] - 1] + ' ' + p[0] : p[0]; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ('0000000' + (h >>> 0).toString(16)).slice(-7); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- which move writes which milestone ---------- */
  var plies = (function () {
    var probe = new Chess(), out = [];
    GAME.forEach(function (san) { var r = probe.move(san); out.push({ san: r.san, from: r.from, to: r.to, captured: r.captured }); });
    return out;
  })();
  var LAST = plies.length - 1;
  var at = (function () {
    var n = MILESTONES.length, pool = [], out = [];
    plies.forEach(function (p, i) { if (p.captured && i < LAST) pool.push(i); });
    if (pool.length < n - 1) { pool = []; for (var i = 0; i < LAST; i++) pool.push(i); }
    for (var k = 0; k < n - 1; k++) out.push(pool[n - 1 === 1 ? 0 : Math.round(k * (pool.length - 1) / (n - 2))]);
    out.push(LAST);
    return out;
  })();
  var milestoneAt = {};
  at.forEach(function (p, i) { milestoneAt[p] = i; });
  function moveName(i) { return Math.floor(i / 2) + 1 + (i % 2 ? '… ' : '. ') + plies[i].san; }

  /* ---------- board ---------- */
  var sqEls = {};
  for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
    var el = document.createElement('div');
    el.className = 'j-sq' + ((r + f) % 2 === 0 ? ' l' : '');
    boardEl.appendChild(el);
    sqEls[FILES[f] + (8 - r)] = el;
  }

  /* ---------- git graph: one row per milestone, hidden until written ---------- */
  var firstOfType = {};
  MILESTONES.forEach(function (m, i) { if (!(m.type in firstOfType)) firstOfType[m.type] = i; });
  var rows = MILESTONES.map(function (m, i) {
    var row = document.createElement('li');
    row.className = 'j-row ' + m.type;
    row.hidden = true;
    var lanes = ['learn', 'work'].map(function (t) {
      var started = i >= firstOfType[t];
      var first = i === firstOfType[t];
      return '<span class="j-lane ' + t + (started ? ' live' : '') + (first ? ' first' : '') + '">' + (m.type === t ? '<i></i>' : '') + '</span>';
    }).join('');
    row.innerHTML = lanes +
      '<button type="button" class="j-commit">' +
      '<span class="j-meta"><b>' + hash(m.title + m.org + m.start) + '</b> · ' + label(m.start) + ' – ' + label(m.end) + ' · <span class="j-move"></span></span>' +
      '<span class="j-title">' + esc(m.title) + '</span>' +
      '<span class="j-org">' + esc(m.org) + '</span>' +
      (m.detail ? '<span class="j-detail">' + esc(m.detail) + '</span>' : '') +
      '</button>';
    row.querySelector('.j-move').textContent = moveName(at[i]);
    row.querySelector('.j-commit').addEventListener('click', function () { jumpTo(i); });
    logEl.appendChild(row);
    return row;
  });

  function showRows(upTo, newest) {
    rows.forEach(function (row, i) {
      row.hidden = i > upTo;
      row.classList.toggle('head', i === newest);
      if (i === newest) row.querySelector('.j-commit').setAttribute('aria-current', 'step');
      else row.querySelector('.j-commit').removeAttribute('aria-current');
    });
    if (newest >= 0) scrollLogTo(rows[newest]);
    headEl.innerHTML = upTo >= MILESTONES.length - 1
      ? 'HEAD → <b>now</b>'
      : 'HEAD → next capture<span class="t-cursor" aria-hidden="true"></span>';
  }

  /* ---------- playback ---------- */
  var game, ply = -1, timer, flyTimer, playing = false, started = false, written = -1;

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
      if (el.classList.contains('hit')) cls += ' hit';
      el.className = cls;
      el.innerHTML = p ? '<span>' + GLYPH[p.color === 'w' ? p.type.toUpperCase() : p.type] + '</span>' : '';
    }
    playBtn.textContent = playing ? '❚❚ pause' : (ply >= LAST ? '↺ replay' : '▶ play');
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  }

  /* pop the milestone beside the capture square */
  function pop(i) {
    var m = MILESTONES[i], sq = plies[at[i]].to;
    var f = FILES.indexOf(sq[0]), rank = +sq[1];
    popEl.className = 'j-pop ' + m.type + (f >= 4 ? ' left' : ' right') + (rank <= 3 ? ' up' : '') + (rank >= 5 ? ' below' : ' above');
    popEl.style.setProperty('--x', ((f + 0.5) / 8 * 100) + '%');
    popEl.style.setProperty('--y', ((8 - rank + 0.5) / 8 * 100) + '%');
    popEl.innerHTML =
      '<span class="j-pop-when">' + label(m.start) + ' – ' + label(m.end) + '</span>' +
      '<strong class="j-pop-title">' + esc(m.title) + '</strong>' +
      '<span class="j-pop-org">' + esc(m.org) + '</span>';
    void popEl.offsetWidth;
    popEl.classList.add('show');
    var s = sqEls[sq];
    s.classList.add('hit');
    setTimeout(function () { s.classList.remove('hit'); }, 900);
  }
  function hidePop() { popEl.classList.remove('show'); }

  /* write milestone i to the graph; fly the pop-up across when it is showing */
  function write(i, fly) {
    if (i <= written) return;
    written = i;
    showRows(i, i);
    var row = rows[i];
    if (!fly || reduce || !popEl.classList.contains('show')) { land(row); hidePop(); return; }
    row.classList.add('pending');
    var from = popEl.getBoundingClientRect(), to = row.querySelector('.j-commit').getBoundingClientRect();
    var ghost = popEl.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.className = popEl.className + ' j-fly';
    ghost.style.cssText = 'position:fixed;left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;margin:0;transform:none;opacity:1;';
    document.body.appendChild(ghost);
    hidePop();
    requestAnimationFrame(function () {
      ghost.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + Math.min(1.4, to.width / from.width) + ',1)';
      ghost.style.opacity = '0';
    });
    setTimeout(function () { ghost.remove(); row.classList.remove('pending'); land(row); }, 650);
  }
  function land(row) {
    row.classList.remove('landed'); void row.offsetWidth; row.classList.add('landed');
  }

  function tick() {
    clearTimeout(timer);
    if (!playing) return;
    if (ply >= LAST) { playing = false; renderBoard(); return; }
    hidePop();
    game.move(GAME[ply + 1]); ply++;
    renderBoard();
    if (ply in milestoneAt) {
      var mi = milestoneAt[ply];
      pop(mi);
      clearTimeout(flyTimer);
      flyTimer = setTimeout(function () { write(mi, true); }, FLY_AT);
      timer = setTimeout(tick, ply === LAST ? 0 : HOLD_MS);
    } else {
      timer = setTimeout(tick, STEP_MS);
    }
  }

  function reached() { var d = -1; at.forEach(function (p, k) { if (p <= ply) d = k; }); return d; }

  function play() {
    if (ply >= LAST) { setPosition(-1); hidePop(); written = -1; showRows(-1, -1); }
    else if (reached() > written) { written = reached(); showRows(written, written); }
    playing = true; renderBoard();
    timer = setTimeout(tick, 350);
  }
  function pause() { playing = false; clearTimeout(timer); renderBoard(); }
  function jumpTo(i) {
    started = true; pause(); clearTimeout(flyTimer);
    setPosition(at[i]); renderBoard();
    written = i; showRows(i, i); land(rows[i]); pop(i);
  }

  playBtn.addEventListener('click', function () { started = true; playing ? pause() : play(); });

  /* reduced motion: the finished game with every milestone written */
  if (reduce) { setPosition(LAST); renderBoard(); written = MILESTONES.length - 1; showRows(written, written); return; }
  setPosition(-1); renderBoard(); showRows(-1, -1);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; io.disconnect(); play(); }
    }, { threshold: 0.4 });
    io.observe(boardEl);
  } else { started = true; play(); }
})();
