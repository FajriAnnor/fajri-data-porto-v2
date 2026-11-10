/* Fajri — portfolio. Hydration, floating nav, reveal-on-scroll, contact form, intro loader. */
(function () {
  'use strict';

  var root = document.documentElement;
  var site = window.SITE || {};

  /* ---------- Visitor counter (one call per page load) ---------- */

  // Resolves to an integer, or null on any failure. Never rejects.
  // The request is NOT aborted: if the server is slow it still finishes, so the visit is
  // counted once and the cookies are stored. Only the loader stops waiting (see below).
  function fetchVisitorNumber() {
    return fetch('/api/visit', { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { return data && Number.isInteger(data.count) ? data.count : null; })
      .catch(function () { return null; });
  }

  // For the loader: the number, or null once LOADER.countWaitMax ms have passed without an answer.
  function withinMs(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (resolve) { setTimeout(function () { resolve(null); }, ms); })
    ]);
  }

  /* ---------- Apply values from content.js on top of the HTML defaults ---------- */

  function hydrate() {
    var links = site.links || {};
    document.querySelectorAll('[data-link]').forEach(function (el) {
      var url = links[el.dataset.link];
      if (url) el.setAttribute('href', url);
    });

    var stats = site.stats || {};
    document.querySelectorAll('[data-stat]').forEach(function (el) {
      var path = el.dataset.stat.split('.');
      var value = stats[path[0]] && stats[path[0]][path[1]];
      if (value) el.textContent = value;
    });

    // Dates are only rendered when provided.
    var dates = site.dates || {};
    document.querySelectorAll('[data-dates]').forEach(function (el) {
      var value = dates[el.dataset.dates];
      if (value) {
        el.textContent = value;
        el.hidden = false;
      }
    });
  }

  /* ---------- Navigation: mobile menu + current-section highlight ---------- */

  function initNav() {
    var nav = document.getElementById('nav');
    var toggle = document.getElementById('navToggle');
    var list = document.getElementById('navList');
    if (!nav || !toggle || !list) return;

    function setOpen(open, returnFocus) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      if (!open && returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    list.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      setOpen(false);
      // the indicator moves right away instead of waiting for the scroll to arrive
      if (byId[link.getAttribute('href').slice(1)] === link) { setActive(link); lockScrollSync(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, true);
    });
    // Close when focus or a click leaves the nav.
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });
    nav.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
    });

    // Chromium only: the glass also bends what is behind it (SVG filter in index.html).
    // Other engines keep the plain blur glass.
    try {
      var brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
      var isChromium = brands.some(function (b) { return /Chromium/i.test(b.brand); });
      if (isChromium && window.CSS && CSS.supports('backdrop-filter', 'url(#liquid-glass)')) {
        nav.classList.add('nav--liquid');
      }
    } catch (err) { /* keep the plain glass */ }

    // Current section = the one crossing the middle of the viewport. A single dark pill
    // (the indicator) slides behind the matching link.
    var links = Array.prototype.slice.call(list.querySelectorAll('a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    var indicator = document.getElementById('navIndicator');
    var desktop = window.matchMedia('(min-width: 768px)');
    var active = null;
    var syncLocked = false;
    var lockTimer = 0;

    function placeIndicator() {
      if (!indicator || !active || !desktop.matches) return;
      var navBox = nav.getBoundingClientRect();
      var box = active.getBoundingClientRect();
      // Left and right are set separately so CSS can move the leading edge first.
      indicator.style.left = (box.left - navBox.left - nav.clientLeft) + 'px';
      indicator.style.right = (navBox.right - box.right - nav.clientLeft) + 'px';
      indicator.classList.add('is-visible');
    }

    function setActive(link) {
      if (!link || link === active) return;
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      link.setAttribute('aria-current', 'location');
      if (active && indicator) indicator.dataset.dir = links.indexOf(link) > links.indexOf(active) ? 'right' : 'left';
      active = link;
      placeIndicator();
    }

    // After a click, ignore the observer until the smooth scroll has finished,
    // so the indicator does not wander through the sections in between.
    function lockScrollSync() {
      syncLocked = true;
      clearTimeout(lockTimer);
      function release() {
        syncLocked = false;
        clearTimeout(lockTimer);
        window.removeEventListener('scrollend', release);
      }
      window.addEventListener('scrollend', release);
      lockTimer = setTimeout(release, 1200);
    }

    if (indicator) nav.classList.add('nav--has-indicator');
    var resizeFrame = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(placeIndicator);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeIndicator);

    setActive(links[0]);
    if (!('IntersectionObserver' in window)) return;

    var firstReport = true;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !syncLocked) setActive(byId[entry.target.id]);
      });
      if (firstReport && indicator) {
        // the first placement is instant; only later moves animate
        firstReport = false;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { indicator.classList.add('is-ready'); });
        });
      }
    }, { rootMargin: '-45% 0px -54% 0px' });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* ---------- Contact form ---------- */

  function initContactForm() {
    var form = document.getElementById('contactForm');
    var submit = document.getElementById('formSubmit');
    var status = document.getElementById('formStatus');
    if (!form || !submit || !status) return;

    var KEYS = ['name', 'email', 'message'];
    var fields = {};
    var errorEls = {};
    KEYS.forEach(function (k) {
      fields[k] = form.elements[k];
      errorEls[k] = document.getElementById('f-' + k + '-err');
    });

    // Same rules as the server (lib/contact.js).
    var TEXT = {
      name: 'Please enter your name (up to 100 characters).',
      email: 'Please enter a valid email address.',
      message: 'Your message should be between 10 and 2000 characters.'
    };
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Drops control characters (keeps tabs and line breaks) and trims.
    function clean(value) {
      return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    }

    function validate(v) {
      var errors = {};
      if (!v.name || v.name.length > 100) errors.name = TEXT.name;
      if (!EMAIL_RE.test(v.email) || v.email.length > 200) errors.email = TEXT.email;
      if (v.message.length < 10 || v.message.length > 2000) errors.message = TEXT.message;
      return errors;
    }

    function showErrors(errors) {
      KEYS.forEach(function (k) {
        if (errors[k]) {
          errorEls[k].textContent = errors[k];
          errorEls[k].hidden = false;
          fields[k].setAttribute('aria-invalid', 'true');
        } else {
          errorEls[k].textContent = '';
          errorEls[k].hidden = true;
          fields[k].removeAttribute('aria-invalid');
        }
      });
    }

    function focusFirstError(errors) {
      for (var i = 0; i < KEYS.length; i++) {
        if (errors[KEYS[i]]) { fields[KEYS[i]].focus(); return; }
      }
    }

    function setStatus(node) {
      status.textContent = '';
      if (!node) return;
      var p = document.createElement('p');
      p.className = 'form__msg';
      p.appendChild(node);
      status.appendChild(p);
    }

    function setSending(sending) {
      submit.disabled = sending;
      submit.textContent = sending ? 'Sending...' : 'Send message';
    }

    function showSuccess() {
      form.reset();
      showErrors({});
      setStatus(document.createTextNode("Thanks, your message is in. I'll reply by email."));
    }

    function showFailure() {
      var frag = document.createDocumentFragment();
      frag.appendChild(document.createTextNode('Something went wrong. Please email me directly at '));
      var a = document.createElement('a');
      a.className = 'text-link';
      a.href = (site.links && site.links.email) || 'mailto:fajriaanr@gmail.com';
      a.textContent = 'fajriaanr@gmail.com';
      frag.appendChild(a);
      frag.appendChild(document.createTextNode('.'));
      setStatus(frag);
    }

    // Typing clears that field's error.
    KEYS.forEach(function (k) {
      fields[k].addEventListener('input', function () {
        if (fields[k].getAttribute('aria-invalid') === 'true') {
          errorEls[k].textContent = '';
          errorEls[k].hidden = true;
          fields[k].removeAttribute('aria-invalid');
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.disabled) return;

      var values = { name: clean(fields.name.value), email: clean(fields.email.value), message: clean(fields.message.value) };
      var errors = validate(values);
      showErrors(errors);
      if (Object.keys(errors).length) {
        setStatus(null);
        focusFirstError(errors);
        return;
      }

      setStatus(null);
      setSending(true);
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.message,
          website: form.elements.website ? form.elements.website.value : '',
          t: Math.round(performance.now()) // ms since page load; the server ignores answers sent too fast
        })
      })
        .then(function (res) {
          return res.json().catch(function () { return null; }).then(function (data) { return { res: res, data: data }; });
        })
        .then(function (out) {
          if (out.res.ok && out.data && out.data.ok === true) {
            showSuccess(); // only after a real 2xx answer
          } else if (out.res.status === 400 && out.data && out.data.errors) {
            showErrors(out.data.errors);
            focusFirstError(out.data.errors);
          } else {
            showFailure();
          }
        })
        .catch(showFailure)
        .then(function () { setSending(false); });
    });
  }

  /* ---------- Reveal on scroll ---------- */

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Intro loader (about 2.7 s, skippable, shows on every page load) ----------
     "Fajri" starts as random glyphs and each letter locks into the right one, left to right.
     Then the existing line fades in and the whole overlay fades out. */

  // ALL loader timings live here (milliseconds, counted from the moment the loader starts).
  var LOADER = {
    word: 'Fajri',
    startDelay: 150,      // nothing is shown until then
    scrambleEnd: 1750,    // the last letter is locked by then
    lockStagger: 280,     // gap between two letters locking; the first one locks at
                          //   scrambleEnd - (letters - 1) * lockStagger  (= 630 with the defaults)
    lockJitter: 40,       // random extra ms before a letter locks (the last letter is never later than scrambleEnd)
    lineFadeIn: 1000,     // earliest moment the "A little hello ..." line fades in
    holdUntil: 2350,      // the overlay starts fading out here
    fadeOut: 350,         // overlay fade-out; total = holdUntil + fadeOut (about 2.7 s)
    skipFade: 150,        // fade-out length when the visitor skips (click, tap or any key)
    glyphInterval: 45,    // how often the still-scrambling letters change glyph
    countWaitMax: 1500,   // how long to wait for /api/visit before the line is shown without the number
    glyphs: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+=?<>/'
  };

  function loaderMark(name) {
    try { performance.mark('loader:' + name); } catch (e) { /* marks are only for measuring */ }
  }

  function initLoader(visitorNumber) {
    var overlay = document.getElementById('loader');
    if (!overlay) return;
    if (!root.classList.contains('loader-on')) { overlay.remove(); return; }

    var wordBox = document.getElementById('loaderWord');
    var line = document.getElementById('loaderLine');
    var letters = Array.from(LOADER.word);
    var last = letters.length - 1;
    var timers = [];
    var rafId = 0;
    var done = false;
    var leaving = false;
    var t0 = performance.now();
    loaderMark('start');

    // One fixed-width slot per letter (an invisible copy of the final letter sizes it),
    // so the word never changes width while the glyphs churn.
    wordBox.textContent = '';
    var slots = letters.map(function (ch) {
      var slot = document.createElement('span');
      var ghost = document.createElement('span');
      var glyph = document.createElement('span');
      slot.className = 'loader__ch';
      ghost.className = 'loader__ghost';
      ghost.textContent = ch;
      glyph.className = 'loader__glyph';
      slot.appendChild(ghost);
      slot.appendChild(glyph);
      wordBox.appendChild(slot);
      return { el: slot, glyph: glyph, locked: false };
    });

    function later(fn, atMs) {   // run fn atMs after the loader started
      timers.push(setTimeout(fn, Math.max(0, atMs - (performance.now() - t0))));
    }

    // Each slot only churns through glyphs that are not much wider than its own letter, so a
    // narrow "i" never gets a wide "W" painted over its neighbours. Measured in the loader's font.
    var allGlyphs = Array.from(LOADER.glyphs);
    function buildPools() {
      var probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap';
      var nodes = allGlyphs.map(function (g) {
        var n = document.createElement('span');
        n.style.display = 'inline-block';
        n.textContent = g;
        probe.appendChild(n);
        return n;
      });
      wordBox.appendChild(probe);
      var widths = nodes.map(function (n) { return n.getBoundingClientRect().width; });
      var byWidth = allGlyphs.map(function (g, k) { return { g: g, w: widths[k] }; }).sort(function (a, b) { return a.w - b.w; });
      slots.forEach(function (s) {
        var max = s.el.getBoundingClientRect().width * 1.3;
        var pool = byWidth.filter(function (x) { return x.w <= max; });
        s.pool = (pool.length >= 6 ? pool : byWidth.slice(0, 6)).map(function (x) { return x.g; });
      });
      wordBox.removeChild(probe);
    }

    var lastShuffle = 0;
    function churn(now) {
      rafId = requestAnimationFrame(churn);
      if (now - lastShuffle < LOADER.glyphInterval) return;
      lastShuffle = now;
      slots.forEach(function (s) {
        if (s.locked) return;
        var next;
        do { next = s.pool[Math.floor(Math.random() * s.pool.length)]; } while (next === s.glyph.textContent && s.pool.length > 1);
        s.glyph.textContent = next;
      });
    }

    function lock(i) {
      var s = slots[i];
      s.locked = true;
      s.glyph.textContent = letters[i];
      s.el.classList.add('is-locked');
      loaderMark('lock' + i);
      if (i === last) cancelAnimationFrame(rafId);
    }

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafId);
      document.removeEventListener('pointerdown', skip);
      document.removeEventListener('keydown', skip);
      overlay.remove();
      root.classList.remove('loader-on');
      loaderMark('end');
    }

    function fade(ms) {
      leaving = true;
      loaderMark('fade-start');
      overlay.style.transitionDuration = ms + 'ms';
      overlay.classList.add('is-leaving');
      timers.push(setTimeout(finish, ms));
    }

    // Any click, tap or key skips the intro: quick fade, then removed. A second press during the fade removes it at once.
    function skip() {
      if (done) return;
      if (leaving) { finish(); return; }
      timers.forEach(clearTimeout);
      timers = [];
      cancelAnimationFrame(rafId);
      fade(LOADER.skipFade);
    }
    document.addEventListener('pointerdown', skip);
    document.addEventListener('keydown', skip);

    // Glyph churn starts after startDelay; the letters lock left to right, the last one at scrambleEnd.
    later(function () { buildPools(); rafId = requestAnimationFrame(churn); }, LOADER.startDelay);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!done && slots[0].pool) buildPools(); });
    var firstLock = LOADER.scrambleEnd - last * LOADER.lockStagger;
    letters.forEach(function (ch, i) {
      var jitter = i === last ? 0 : Math.random() * LOADER.lockJitter;
      later(function () { lock(i); }, firstLock + i * LOADER.lockStagger + jitter);
    });

    // The line appears at lineFadeIn, or as soon as the visitor number is known (at most countWaitMax),
    // whichever is later. Its text is final when it fades in, so nothing jumps afterwards.
    later(function () {
      visitorNumber.then(function (n) {
        if (done || leaving) return;
        line.textContent = n === null
          ? 'A little hello. Glad you stopped by.'
          : 'A little hello to visitor #' + n + '. Glad you stopped by.';
        line.classList.add('is-shown');
        loaderMark('line');
      });
    }, LOADER.lineFadeIn);

    later(function () { fade(LOADER.fadeOut); }, LOADER.holdUntil);
  }

  /* ---------- About: "Currently learning" cards from content.js ---------- */

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Replaces the no-JS copy in index.html. An entry with `issuer` and/or `url` gets a footer row.
  function renderLearning() {
    var list = document.getElementById('learningList');
    var items = site.learning;
    if (!list || !Array.isArray(items) || !items.length) return;

    list.textContent = '';
    items.forEach(function (item) {
      if (!item || !item.title) return;
      var card = make('li', 'lcard');
      var body = make('div', 'lcard__body');
      body.appendChild(make('p', 'lcard__status', item.status || ''));
      body.appendChild(make('p', 'lcard__title', item.title));
      card.appendChild(body);

      if (item.issuer || item.url) {
        var footer = make('div', 'lcard__footer');
        footer.appendChild(make('span', '', item.issuer || ''));
        if (item.url) {
          var view = make('a', 'lcard__view', 'View');
          view.href = item.url;
          view.target = '_blank';
          view.rel = 'noopener noreferrer';
          view.appendChild(make('span', 'sr-only', ' (opens in new tab)'));
          footer.appendChild(view);
        }
        card.appendChild(footer);
      }
      list.appendChild(card);
    });
  }

  /* ---------- Hero name: scroll slice effect ---------- */

  // While the page scrolls, the big name splits into 5 horizontal strips that slide sideways
  // by different amounts. The real <h1> stays in place (only its ink turns transparent), the
  // strips are aria-hidden copies. Only transform, clip-path and opacity change; nothing in
  // the scroll path reads layout. Off for reduced motion, below 768px and without JS.
  function initHeroSlice() {
    var wrap = document.getElementById('heroNameWrap');
    var hero = document.getElementById('home');
    var heading = wrap && wrap.querySelector('h1');
    if (!wrap || !hero || !heading || !('IntersectionObserver' in window)) return;

    var BANDS = 5;
    var EDGE = [0, 9, -11, 8, -10, 0];   // px: the cut between two bands is slightly angled
    var holder = make('div', 'hero__slices');
    holder.setAttribute('aria-hidden', 'true');
    var slices = [];
    for (var i = 0; i < BANDS; i++) {
      var slice = make('span', 'hero__slice', heading.textContent);
      var topL = i === 0 ? '-30%' : 'calc(' + (i * 20) + '% - 0.5px)';
      var topR = i === 0 ? '-30%' : 'calc(' + (i * 20) + '% + ' + (EDGE[i] - 0.5) + 'px)';
      var botL = i === BANDS - 1 ? '130%' : 'calc(' + ((i + 1) * 20) + '% + 0.5px)';
      var botR = i === BANDS - 1 ? '130%' : 'calc(' + ((i + 1) * 20) + '% + ' + (EDGE[i + 1] + 0.5) + 'px)';
      slice.style.clipPath = 'polygon(-10% ' + topL + ', 110% ' + topR + ', 110% ' + botR + ', -10% ' + botL + ')';
      holder.appendChild(slice);
      slices.push(slice);
    }
    wrap.appendChild(holder);

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var narrow = window.matchMedia('(max-width: 767px)');
    var range = 1;          // scroll distance for the full effect: 60% of the hero height
    var heroInView = true;
    var listening = false;
    var lastP = -1;
    var latestY = 0;
    var frame = 0;

    function measure() { range = Math.max(1, hero.offsetHeight * 0.6); }   // not called while scrolling

    function render(p) {
      if (p <= 0) {
        wrap.classList.remove('is-sliced');
        slices.forEach(function (s) { s.style.opacity = '0'; s.style.transform = ''; });
        return;
      }
      wrap.classList.add('is-sliced');
      var fade = (1 - p * 0.9).toFixed(3);
      slices.forEach(function (s, idx) {
        var dir = idx % 2 ? 1 : -1;
        var dx = dir * p * (24 + idx * 14);
        s.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,0,0) skewX(' + (dir * p * 4).toFixed(2) + 'deg)';
        s.style.opacity = fade;
      });
    }

    function update() {
      frame = 0;
      var p = Math.min(1, Math.max(0, latestY / range));
      if (p === lastP) return;
      lastP = p;
      render(p);
    }

    function onScroll() {
      latestY = window.scrollY;
      if (!frame) frame = requestAnimationFrame(update);
    }

    function start() {
      if (!listening) {
        listening = true;
        window.addEventListener('scroll', onScroll, { passive: true });
      }
      onScroll();   // always re-apply the current position
    }

    function stop() {
      if (!listening) return;
      listening = false;
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      frame = 0;
    }

    // Decides whether the effect runs right now; when it must not, the name is plain and static.
    function sync() {
      if (!reduce.matches && !narrow.matches) {
        measure();
        if (heroInView) start();
      } else {
        stop();
        lastP = -1;
        render(0);
      }
    }

    new IntersectionObserver(function (entries) {
      heroInView = entries[entries.length - 1].isIntersecting;
      if (heroInView) sync(); else stop();
    }, { threshold: 0 }).observe(hero);

    var resizeFrame = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(function () { lastP = -1; sync(); });
    });
    reduce.addEventListener('change', sync);
    narrow.addEventListener('change', sync);
    window.addEventListener('load', function () { lastP = -1; sync(); });   // scroll position restored after a reload
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastP = -1; sync(); });
    render(0);
    sync();
  }

  /* ---------- Init ---------- */

  var visitor = withinMs(fetchVisitorNumber(), LOADER.countWaitMax);   // the request itself counts the visit, even if the loader is skipped
  hydrate();
  renderLearning();
  initNav();
  initContactForm();
  initReveal();
  initHeroSlice();
  initLoader(visitor);
})();
