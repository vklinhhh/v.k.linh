/* Terminal theme behaviour — Linh Võ portfolio */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var body = document.body;

    /* active nav link */
    var page = body.getAttribute('data-page');
    if (page) {
      var link = document.querySelector('.t-links a[data-page="' + page + '"]');
      if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'page'); }
    }

    /* mobile menu */
    var nav = document.querySelector('.t-nav');
    var burger = document.querySelector('.t-burger');
    if (nav && burger) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    if (nav) {
      var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* typing effect */
    var typed = document.querySelector('[data-roles]');
    if (typed) {
      var roles = [];
      try { roles = JSON.parse(typed.getAttribute('data-roles')); } catch (e) { roles = []; }
      if (roles.length && !reduce) {
        var i = 0, n = 0, del = false, pause = 0;
        setInterval(function () {
          var r = roles[i];
          if (pause > 0) { pause--; return; }
          if (!del) { n++; if (n >= r.length) { del = true; pause = 24; } }
          else { n--; if (n <= 0) { del = false; i = (i + 1) % roles.length; pause = 5; } }
          typed.textContent = r.slice(0, n);
        }, 70);
      } else if (roles.length) {
        typed.textContent = roles[0];
      }
    }

    /* cursor spotlight + reticle */
    if (finePointer && !reduce && document.querySelector('.t-spot')) {
      var x = -500, y = -500, queued = false;
      window.addEventListener('mousemove', function (e) {
        x = e.clientX; y = e.clientY;
        if (!queued) {
          queued = true;
          requestAnimationFrame(function () {
            doc.style.setProperty('--mx', x + 'px');
            doc.style.setProperty('--my', y + 'px');
            body.classList.add('mouse-on');
            queued = false;
          });
        }
      }, { passive: true });
      document.addEventListener('mouseleave', function () { body.classList.remove('mouse-on'); });
      window.addEventListener('blur', function () { body.classList.remove('mouse-on'); });
    }

    /* reveal on scroll */
    var items = document.querySelectorAll('.t-reveal');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      items.forEach(function (el, k) { el.style.transitionDelay = Math.min(k % 6, 5) * 60 + 'ms'; io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('in'); });
    }

    /* project filter chips */
    var chips = document.querySelectorAll('.t-chip');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        document.querySelectorAll('[data-tags]').forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-tags').split(' ').indexOf(f) !== -1;
          card.classList.toggle('t-hidden', !show);
        });
      });
    });
  });
})();
