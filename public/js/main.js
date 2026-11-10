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
  initContactForm();
  initReveal();
  initLoader(visitor);
})();
