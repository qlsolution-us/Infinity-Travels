/* Infinity Travels - shared behaviour */
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

  /* Homepage search bar -> carries the selection through to packages.html */
  var finder = $('#finderForm');
  if (finder) {
    finder.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('#tf0', finder).value;
      var duration = $('#tf1', finder).value;
      var budget = $('#tf2', finder).value;
      var date = $('#tf3', finder).value;
      var params = new URLSearchParams();
      if (q) params.set('q', q);
      if (duration) params.set('duration', duration);
      if (budget) params.set('budget', budget);
      if (date) params.set('date', date);
      var qs = params.toString();
      window.location.href = 'packages.html' + (qs ? '?' + qs : '');
    });
  }

  /* Packages: filter + sort */
  var grid = $('#pkgGrid');
  if (grid) {
    var cards = $$('.pcard2', grid), cnt = $('#pkgCnt'), none = $('#noRes');
    var activeCategory = 'all';

    function inBudgetRange(price, budget) {
      if (!budget) return true;
      if (budget === 'Under 200,000') return price < 200000;
      if (budget === '200,000–400,000') return price >= 200000 && price <= 400000;
      if (budget === '400,000–700,000') return price >= 400000 && price <= 700000;
      if (budget === '700,000+') return price > 700000;
      return true;
    }
    function inDurationRange(dur, bucket) {
      if (!bucket) return true;
      if (bucket === '3–5 Days') return dur >= 3 && dur <= 5;
      if (bucket === '5–7 Days') return dur >= 5 && dur <= 7;
      if (bucket === '7–10 Days') return dur >= 7 && dur <= 10;
      if (bucket === '10+ Days') return dur >= 10;
      return true;
    }

    function applyFilters() {
      var params = new URLSearchParams(window.location.search);
      var q = (params.get('q') || '').toLowerCase();
      var budget = params.get('budget') || '';
      var duration = params.get('duration') || '';
      cards.forEach(function (c) {
        var matchesCategory = activeCategory === 'all' || c.getAttribute('data-category') === activeCategory;
        var name = (c.querySelector('.pk-name') ? c.querySelector('.pk-name').textContent : '').toLowerCase();
        var matchesQ = !q || name.indexOf(q) !== -1;
        var matchesBudget = inBudgetRange(+c.dataset.price, budget);
        var matchesDuration = inDurationRange(+c.dataset.duration, duration);
        c.classList.toggle('hidden', !(matchesCategory && matchesQ && matchesBudget && matchesDuration));
      });
      var vis = cards.filter(function (c) { return !c.classList.contains('hidden'); }).length;
      if (cnt) cnt.textContent = vis;
      if (none) none.classList.toggle('show', vis === 0);
    }

    $$('.ftag').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.ftag').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        activeCategory = b.getAttribute('data-filter');
        applyFilters();
      });
    });

    /* Apply any destination / budget / duration passed in from the homepage search bar */
    applyFilters();

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

  var WHATSAPP_NUMBER = '94777292589';

  function fieldVal(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  /* Contact / enquiry form -> builds a message and opens WhatsApp with it pre-filled */
  window.handleSub = function (e) {
    e.preventDefault();
    var form = e.target;
    var lines = [
      'New enquiry from infinitytravels.lk',
      'Name: ' + fieldVal(form, 'first_name') + ' ' + fieldVal(form, 'last_name'),
      'Email: ' + fieldVal(form, 'email'),
      'Phone: ' + fieldVal(form, 'phone'),
      fieldVal(form, 'destination') ? 'Destination: ' + fieldVal(form, 'destination') : '',
      fieldVal(form, 'travellers') ? 'Travellers: ' + fieldVal(form, 'travellers') : '',
      fieldVal(form, 'travel_date') ? 'Travel Date: ' + fieldVal(form, 'travel_date') : '',
      fieldVal(form, 'budget') ? 'Budget: ' + fieldVal(form, 'budget') : '',
      fieldVal(form, 'message') ? 'Message: ' + fieldVal(form, 'message') : ''
    ].filter(Boolean);
    var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
    flash('subOk', form);
    window.open(waUrl, '_blank', 'noopener');
  };

  /* Review form -> sends data to Formspree (set the real endpoint in the form's data-formspree attribute) */
  window.handleRev = function (e) {
    e.preventDefault();
    var form = e.target;
    var errBox = document.getElementById('revErr');
    var endpoint = form.getAttribute('data-formspree');
    var rating = form.querySelector('[name="r"]:checked');
    var ratingVal = rating ? rating.value : '';
    var fullName = fieldVal(form, 'full_name');
    var destination = fieldVal(form, 'destination');
    var reviewText = fieldVal(form, 'review');
    var payload = { rating: ratingVal, full_name: fullName, destination: destination, review: reviewText };

    function openWhatsApp() {
      var lines = [
        'New review submitted on infinitytravels.lk',
        'Name: ' + fullName,
        destination ? 'Destination: ' + destination : '',
        ratingVal ? 'Rating: ' + ratingVal + '/5' : '',
        'Review: ' + reviewText
      ].filter(Boolean);
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    }

    if (!endpoint || endpoint.indexOf('REPLACE_WITH_YOUR_FORM_ID') !== -1) {
      /* Formspree endpoint not configured yet - still send the review to WhatsApp */
      flash('revOk', form);
      openWhatsApp();
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.ok) { if (errBox) errBox.classList.remove('show'); flash('revOk', form); }
      else if (errBox) { errBox.classList.add('show'); setTimeout(function () { errBox.classList.remove('show'); }, 7000); }
    }).catch(function () {
      if (errBox) { errBox.classList.add('show'); setTimeout(function () { errBox.classList.remove('show'); }, 7000); }
    }).finally(function () {
      openWhatsApp();
    });
  };
})();
