/* Fajri — portfolio. Hydration, floating nav, reveal-on-scroll, intro loader. */
(function () {
  'use strict';

  var root = document.documentElement;
  var site = window.SITE || {};

  /* ---------- Visitor counter (one call per page load) ---------- */

  // Resolves to an integer, or null on any failure. Never rejects.
  // The request is NOT aborted: if the server is slow it still finishes, so the visit is
  // counted once and the cookies are stored. Only the loader stops waiting (see below).
  function fetchVisitorNumber() {
    return fetch('/api/visit', { cache: 'no-store', credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { return data && Number.isInteger(data.count) ? data.count : null; })
      .catch(function () { return null; });
  }

  // For the loader: the number, or null once 800 ms have passed without an answer.
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
      if (e.target.closest('a')) setOpen(false);
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

    // Highlight the section crossing the middle of the viewport.
    var links = Array.prototype.slice.call(list.querySelectorAll('a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var active = byId[entry.target.id];
        if (active) active.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-45% 0px -54% 0px' });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
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

  /* ---------- Intro loader (≈1.5 s, skippable, once per session) ---------- */

  var GLYPHS = '!<>-_\\/[]{}=+*^?#%&0123456789';
  var SCRAMBLE_MS = 850;   // time until the word is fully resolved
  var LEAVE_AT_MS = 1200;  // when the fade-out starts
  var FADE_MS = 300;       // fade-out length → total ≈ 1.5 s

  // Scrambles random glyphs and resolves left to right into `finalText`.
  function scramble(el, finalText, duration, onFrame) {
    var chars = Array.from(finalText);
    var start = performance.now();
    var lastShuffle = 0;
    var current = chars.map(function () { return ''; });

    function frame(now) {
      var elapsed = now - start;
      if (now - lastShuffle > 45 || elapsed >= duration) {
        lastShuffle = now;
        current = chars.map(function (ch, i) {
          return elapsed >= duration * (i + 1) / chars.length
            ? ch
            : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        });
        el.textContent = current.join('');
      }
      if (elapsed < duration) onFrame(requestAnimationFrame(frame));
    }
    onFrame(requestAnimationFrame(frame));
  }

  function initLoader(visitorNumber) {
    var overlay = document.getElementById('loader');
    if (!overlay) return;
    if (!root.classList.contains('loader-on')) { overlay.remove(); return; }

    var word = document.getElementById('loaderWord');
    var line = document.getElementById('loaderLine');
    var timers = [];
    var rafId = 0;
    var done = false;

    try { sessionStorage.setItem('loaderSeen', '1'); } catch (e) { /* storage blocked */ }

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafId);
      document.removeEventListener('pointerdown', finish);
      document.removeEventListener('keydown', finish);
      overlay.remove();
      root.classList.remove('loader-on');
    }

    function leave() {
      overlay.classList.add('is-leaving');
      timers.push(setTimeout(finish, FADE_MS));
    }

    // Any click, tap or key skips the intro immediately.
    document.addEventListener('pointerdown', finish);
    document.addEventListener('keydown', finish);

    // Keep the box width stable while glyphs change.
    word.parentNode.style.minWidth = word.parentNode.offsetWidth + 'px';

    scramble(word, 'Fajri', SCRAMBLE_MS, function (id) { rafId = id; });

    // visitorNumber settles within 800 ms (see withinMs), before the scramble ends.
    timers.push(setTimeout(function () {
      visitorNumber.then(function (n) {
        if (done) return;
        line.textContent = n === null
          ? 'A little hello. Glad you stopped by.'
          : 'A little hello to visitor #' + n + '. Glad you stopped by.';
        line.classList.add('is-shown');
      });
    }, SCRAMBLE_MS));
    timers.push(setTimeout(leave, LEAVE_AT_MS));
  }

  /* ---------- Init ---------- */

  var visitor = withinMs(fetchVisitorNumber(), 800);   // the request itself counts the visit, even if the loader is skipped
  hydrate();
  initNav();
  initReveal();
  initLoader(visitor);
})();
