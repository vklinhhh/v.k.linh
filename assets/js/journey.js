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
  var roadEl = document.getElementById('j-road');
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

  /* ---------- road: every milestone has a slot; learning above, work below ---------- */
  roadEl.style.setProperty('--n', MILESTONES.length);
  var upEl = roadEl.querySelector('.j-up'), downEl = roadEl.querySelector('.j-down'), bandEl = roadEl.querySelector('.j-band');
  var prevBySide = {};
  var slots = MILESTONES.map(function (m, i) {
    var up = m.type === 'learn';
    var prev = prevBySide[m.type];
    var level = prev && i - prev.i <= 1 && prev.level === 0 ? 1 : 0;
    prevBySide[m.type] = { i: i, level: level };

    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'j-dot ' + m.type;
    dot.setAttribute('aria-label', label(m.start) + ': ' + m.title + ', ' + m.org);
    dot.addEventListener('click', function () { jumpTo(i); });
    bandEl.appendChild(dot);

    var stem = document.createElement('span');
    stem.className = 'j-stem ' + m.type;
    var card = document.createElement('div');
    card.className = 'j-rc ' + m.type;
    card.innerHTML = '<span class="j-rc-when">' + label(m.start) + ' – ' + label(m.end) + '</span>' +
      '<strong class="j-rc-title">' + esc(m.title) + '</strong><span class="j-rc-org">' + esc(m.org) + '</span>';
    card.addEventListener('click', function () { jumpTo(i); });
    (up ? upEl : downEl).appendChild(stem);
    (up ? upEl : downEl).appendChild(card);
    return { dot: dot, stem: stem, card: card, up: up, level: level };
  });

  function layoutRoad() {
    var W = bandEl.clientWidth, n = slots.length;
    var cw0 = Math.round(Math.max(120, Math.min(180, W / n * 1.5)));
    slots.forEach(function (s) { s.card.style.width = cw0 + 'px'; });
    var cardH = 0;
    slots.forEach(function (s) { cardH = Math.max(cardH, s.card.offsetHeight); });
    var LEVEL = cardH + 12, STEM = 18;
    var maxUp = 0, maxDown = 0;
    slots.forEach(function (s, i) {
      var x = (i + 0.5) / n * W;
      var cw = s.card.offsetWidth;
      s.dot.style.left = x + 'px';
      s.stem.style.left = x + 'px';
      s.card.style.left = Math.max(0, Math.min(W - cw, x - cw / 2)) + 'px';
      var off = STEM + s.level * LEVEL;
      s.stem.style.height = off + 'px';
      if (s.up) { s.stem.style.bottom = '0'; s.card.style.bottom = off + 'px'; maxUp = Math.max(maxUp, off + cardH); }
      else { s.stem.style.top = '0'; s.card.style.top = off + 'px'; maxDown = Math.max(maxDown, off + cardH); }
    });
    upEl.style.height = maxUp + 'px';
    downEl.style.height = maxDown + 'px';
  }
  layoutRoad();
  window.addEventListener('resize', layoutRoad);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutRoad);
  var dots = slots.map(function (s) { return s.dot; });

  /* write a milestone onto the road; optionally fly the pop-up card down to its slot */
  function record(i, fly) {
    var s = slots[i];
    if (s.card.classList.contains('on')) return;
    if (!fly || reduce || !popEl.classList.contains('show')) { light(i); return; }
    var from = popEl.getBoundingClientRect(), to = s.card.getBoundingClientRect();
    var ghost = popEl.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.className = popEl.className + ' j-fly';
    ghost.style.cssText = 'position:fixed;left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;margin:0;transform:none;opacity:1;';
    document.body.appendChild(ghost);
    hidePop();
    requestAnimationFrame(function () {
      var sx = to.width / from.width;
      ghost.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + sx + ')';
      ghost.style.opacity = '0.2';
    });
    setTimeout(function () { ghost.remove(); light(i); }, 720);
  }
  function light(i) {
    var c = slots[i].card;
    c.classList.add('on'); slots[i].stem.classList.add('on');
    c.classList.remove('landed'); void c.offsetWidth; c.classList.add('landed');
    if (roadEl.scrollWidth > roadEl.clientWidth + 4) {
      roadEl.scrollTo({ left: Math.max(0, c.offsetLeft - roadEl.clientWidth / 2 + c.offsetWidth / 2), behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function setRecorded(upTo) {
    slots.forEach(function (s, i) {
      s.card.classList.toggle('on', i <= upTo); s.stem.classList.toggle('on', i <= upTo); s.card.classList.remove('landed');
    });
  }

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
    if (ply in milestoneAt) {
      var mi = milestoneAt[ply];
      pop(mi);
      if (ply === LAST) { setTimeout(function () { light(mi); }, 600); timer = setTimeout(tick, 0); }
      else { setTimeout(function () { if (playing) record(mi, true); }, HOLD_MS - 900); timer = setTimeout(tick, HOLD_MS); }
    }
    else timer = setTimeout(tick, STEP_MS);
  }

  function play() {
    if (ply >= LAST) { setPosition(-1); hidePop(); setRecorded(-1); }
    else { var done = -1; at.forEach(function (p, k) { if (p <= ply) done = k; }); slots.forEach(function (s, k) { if (k <= done && !s.card.classList.contains('on')) light(k); }); }
    playing = true; renderBoard();
    timer = setTimeout(tick, 350);
  }
  function pause() { playing = false; clearTimeout(timer); renderBoard(); }
  function jumpTo(i) { started = true; pause(); setPosition(at[i]); renderBoard(); setRecorded(i); pop(i); }

  playBtn.addEventListener('click', function () { started = true; playing ? pause() : play(); });

  /* reduced motion: show the final position and the latest milestone */
  if (reduce) { setPosition(LAST); renderBoard(); setRecorded(MILESTONES.length - 1); pop(MILESTONES.length - 1); return; }
  setPosition(-1); renderBoard();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; io.disconnect(); play(); }
    }, { threshold: 0.4 });
    io.observe(boardEl);
  } else { started = true; play(); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
