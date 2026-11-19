/* Infinity Travels — shared behaviour */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: solid state after scrolling */
  var header = $('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile navigation */
  var btn = $('#menuBtn'), mnav = $('#mobNav');
  function setNav(open) {
    if (!btn || !mnav) return;
    mnav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('noscroll', open);
    if (header) header.classList.toggle('menu-open', open);
  }
  if (btn && mnav) {
    btn.addEventListener('click', function () { setNav(!mnav.classList.contains('open')); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  }

  /* Reveal on scroll */
  var rv = $$('.rv,.rvl,.rvr');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
      });
    }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('on'); }); }

  /* Counters */
  function count(el) {
    var t = +el.getAttribute('data-t'), dur = 2000, s = performance.now();
    function tick(n) {
      var p = Math.min((n - s) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(e * t).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var stats = $('.stats-s');
  if (stats && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { $$('.cnt').forEach(function (c) { reduce ? (c.textContent = (+c.getAttribute('data-t')).toLocaleString()) : count(c); }); so.disconnect(); }
    }, { threshold: .3 });
    so.observe(stats);
  } else { $$('.cnt').forEach(function (c) { c.textContent = (+c.getAttribute('data-t')).toLocaleString(); }); }

  /* Hero destination carousel */
  var slides = $$('.hslide'), picks = $$('.hp');
  if (slides.length && picks.length) {
    var cur = 0, timer, DUR = 6500;
    document.documentElement.style.setProperty('--dur', DUR + 'ms');
    var show = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
      picks.forEach(function (p, k) {
        p.classList.toggle('on', k === cur);
        var tb = $('.hp-t', p); if (tb) tb.setAttribute('aria-pressed', k === cur);
        var bar = $('.hp-bar', p); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
    };
    var play = function () { if (reduce) return; clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, DUR); };
    picks.forEach(function (p, k) { var tb = $('.hp-t', p); if (tb) tb.addEventListener('click', function () { show(k); play(); }); });
    var pk = $('.hpick');
    if (pk) { pk.addEventListener('mouseenter', function () { clearInterval(timer); }); pk.addEventListener('mouseleave', play); }
    show(0); play();
  }

  /* Destination panels */
  var dests = $$('.dest');
  dests.forEach(function (d) {
    var on = function () { dests.forEach(function (x) { x.classList.toggle('on', x === d); }); };
    d.addEventListener('mouseenter', on);
    d.addEventListener('focus', on);
  });

  /* FAQ accordion */
  $$('.fq').forEach(function (q) {
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', function () {
      var item = q.parentElement, open = item.classList.contains('open');
      $$('.fitem').forEach(function (f) { f.classList.remove('open'); $('.fq', f).setAttribute('aria-expanded', 'false'); });
      if (!open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* Packages: filter + sort */
  var grid = $('#pkgGrid');
  if (grid) {
    var cards = $$('.pcard2', grid), cnt = $('#pkgCnt'), none = $('#noRes');
    $$('.ftag').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.ftag').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var f = b.getAttribute('data-filter');
        cards.forEach(function (c) { c.classList.toggle('hidden', f !== 'all' && c.getAttribute('data-category') !== f); });
        var vis = cards.filter(function (c) { return !c.classList.contains('hidden'); }).length;
        cnt.textContent = vis; none.classList.toggle('show', vis === 0);
      });
    });
    var sel = $('#sortSel');
    if (sel) sel.addEventListener('change', function () {
      var arr = cards.slice(), v = this.value;
      if (v === 'price-low') arr.sort(function (a, b) { return +a.dataset.price - +b.dataset.price; });
      else if (v === 'price-high') arr.sort(function (a, b) { return +b.dataset.price - +a.dataset.price; });
      else if (v === 'duration-short') arr.sort(function (a, b) { return +a.dataset.duration - +b.dataset.duration; });
      arr.forEach(function (c) { grid.insertBefore(c, none); });
    });
  }

  /* Form confirmations (kept from the original site) */
  function flash(id, form) {
    var ok = document.getElementById(id); if (!ok) return;
    ok.classList.add('show'); if (form) form.reset();
    setTimeout(function () { ok.classList.remove('show'); }, 7000);
  }
  window.handleSub = function (e) { e.preventDefault(); flash('subOk', e.target); };
  window.handleRev = function (e) { e.preventDefault(); flash('revOk', e.target); };
})();
