/* Fajri — portfolio. Working window controls for the Mac-style windows (progressive enhancement).
   Red = close (reopen chip), yellow = minimize, green = zoom (native <dialog>). Nothing is persisted. */
(function () {
  'use strict';

  var wins = document.querySelectorAll('.window');
  if (!wins.length) return;

  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HAS_DIALOG = typeof HTMLDialogElement === 'function';
  var MIN_MS = 260;
  var CLOSE_MS = 250;
  var seq = 0;

  var GLYPH = {
    red: '<path d="M3.6 3.6l4.8 4.8M8.4 3.6l-4.8 4.8"/>',
    yellow: '<path d="M3.2 6h5.6"/>',
    green: '<path d="M6 3.2v5.6M3.2 6h5.6"/>'
  };

  function titleOf(win) {
    var el = win.querySelector('.window__title, .card__title');
    if (!el) return 'window';
    var t = '';
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) t += n.textContent;
    return t.replace(/\s+/g, ' ').trim() || 'window';
  }

  function dot(kind, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot dot--' + kind;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true" focusable="false">' + GLYPH[kind] + '</svg>';
    return b;
  }

  /* ---------- height animation helper (interruptible; token guards stale callbacks) ---------- */

  function currentHeight(win) { return parseFloat(getComputedStyle(win).height) || win.offsetHeight; }

  // Natural height of the window as it would be laid out right now (stretch included).
  function naturalHeight(win) {
    var keep = win.style.height, tr = win.style.transition;
    win.style.transition = 'none';
    win.style.height = '';
    var h = win.offsetHeight;
    win.style.height = keep;
    void win.offsetHeight;
    win.style.transition = tr;
    return h;
  }

  function animate(win, from, to, ms, enter, done) {
    var token = ++win._token;
    win.classList.add('is-anim');
    win.style.transition = 'none';
    win.style.height = from + 'px';
    void win.offsetHeight;
    win.style.transition = '';
    if (enter) enter();
    win.style.height = to + 'px';
    var finished = false;
    function end() {
      if (finished || token !== win._token) return;
      finished = true;
      win.removeEventListener('transitionend', onEnd);
      win.style.height = '';
      win.classList.remove('is-anim');
      done();
    }
    function onEnd(e) { if (e.target === win && e.propertyName === 'height') end(); }
    win.addEventListener('transitionend', onEnd);
    setTimeout(end, ms + 90);
  }

  /* ---------- zoom dialog (one at a time, created on open, removed on close) ----------
     Opens by growing from the original window's rectangle and closes by shrinking back to it (FLIP).
     Only transform, clip-path and opacity are animated, with a uniform scale (text is never stretched):
     the frame is scaled by width and cropped to the origin height with clip-path, the body fades. */

  var zoom = null;               // { dlg, win, opener, state, anims, token, timer, animated }
  var OPEN_MS = 300, CLOSE_MS = 260, BACKDROP_MS = 240, FALLBACK_MS = 450;
  var OPEN_EASE = 'cubic-bezier(.2,.9,.25,1.05)';
  var CLOSE_EASE = 'cubic-bezier(.4,0,1,1)';

  function visibleRect(win) {
    var r = win.getBoundingClientRect();
    var ok = !win.hidden && r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 &&
      r.top < window.innerHeight && r.left < window.innerWidth;
    return ok ? r : null;
  }

  // Animation state for the dialog box f (un-animated rect) placed over the original window's rectangle.
  function originState(win, f, radius, measured) {
    var full = 'inset(0px 0px 0px 0px round ' + radius + 'px)';
    var o = measured === undefined ? visibleRect(win) : measured;
    if (!o) {                    // original off-screen or hidden: shrink + fade in place
      var k = 0.9;
      return { transform: 'translate(' + (f.width * (1 - k) / 2) + 'px,' + (f.height * (1 - k) / 2) + 'px) scale(' + k + ')', clipPath: full, opacity: 0 };
    }
    // one uniform scale that covers the origin on both axes; clip-path crops the frame to the origin's exact size
    var s = Math.max(o.width / f.width, o.height / f.height);
    return {
      transform: 'translate(' + (o.left - f.left) + 'px,' + (o.top - f.top) + 'px) scale(' + s + ')',
      clipPath: 'inset(0px ' + Math.max(0, f.width - o.width / s).toFixed(2) + 'px ' + Math.max(0, f.height - o.height / s).toFixed(2) + 'px 0px round ' + radius + 'px)',
      opacity: 1
    };
  }

  function cancelAnims(z) {
    clearTimeout(z.timer);
    z.token++;
    (z.anims || []).forEach(function (a) { try { a.cancel(); } catch (e) {} });
    z.anims = [];
  }

  // Runs frame + backdrop + body fade together; onEnd fires once, via 'finished' or the fallback timer.
  function runZoom(z, opening, from, to, backdrop, bodyFrom, onEnd) {
    var dlg = z.dlg, token = ++z.token, dur = opening ? OPEN_MS : CLOSE_MS;
    var bodyEl = dlg.querySelector('.window__body');
    var anims = [dlg.animate([from, to], { duration: dur, easing: opening ? OPEN_EASE : CLOSE_EASE, fill: 'both' })];
    try {
      anims.push(dlg.animate([{ opacity: backdrop[0] }, { opacity: backdrop[1] }],
        { duration: opening ? BACKDROP_MS : CLOSE_MS, easing: opening ? 'ease-out' : 'ease-in', fill: 'both', pseudoElement: '::backdrop' }));
    } catch (e) { /* no pseudo-element animation support: the backdrop just appears / disappears */ }
    if (bodyEl) {
      anims.push(bodyEl.animate(opening
        ? [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 1, offset: 1 }]
        : [{ opacity: bodyFrom, offset: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 0, offset: 1 }],
        { duration: dur, easing: 'linear', fill: 'both' }));
    }
    z.anims = anims;
    var done = false;
    function end() {
      if (done || token !== z.token) return;
      done = true;
      clearTimeout(z.timer);
      onEnd();
    }
    Promise.all(anims.map(function (a) { return a.finished; })).then(end, function () {});
    z.timer = setTimeout(end, FALLBACK_MS);
  }

  function finalizeZoom(z) {     // runs however the dialog ends (also a native, non-cancelable Esc)
    if (zoom !== z) return;
    cancelAnims(z);
    document.documentElement.classList.remove('zoom-lock');
    z.win.classList.remove('is-zoom-origin');     // visible again before focus returns to its green button
    if (z.dlg.parentNode) z.dlg.parentNode.removeChild(z.dlg);
    zoom = null;
    if (z.opener && document.contains(z.opener)) z.opener.focus();
  }

  function closeZoom() {
    var z = zoom;
    if (!z || z.state === 'closing') return;
    var dlg = z.dlg;
    if (!z.animated || reduceMq.matches || !dlg.open) { if (dlg.open) dlg.close(); else finalizeZoom(z); return; }
    z.state = 'closing';
    var cs = getComputedStyle(dlg), bodyEl = dlg.querySelector('.window__body');
    var radius = parseFloat(cs.borderTopLeftRadius) || 0;
    var full = 'inset(0px 0px 0px 0px round ' + radius + 'px)';
    // current visual state (an opening animation may still be running): the close starts exactly there
    var from = { transform: cs.transform, clipPath: cs.clipPath === 'none' ? full : cs.clipPath, opacity: cs.opacity };
    var bodyFrom = bodyEl ? getComputedStyle(bodyEl).opacity : 1;
    var bd = parseFloat(getComputedStyle(dlg, '::backdrop').opacity);
    cancelAnims(z);
    dlg.style.overflow = 'hidden';
    var to = originState(z.win, dlg.getBoundingClientRect(), radius);
    runZoom(z, false, from, to, [isNaN(bd) ? 1 : bd, 0], bodyFrom, function () {
      if (dlg.open) dlg.close(); else finalizeZoom(z);     // 'close' event -> finalizeZoom
    });
  }

  function openZoom(win, opener) {
    if (zoom || !HAS_DIALOG) return;
    var label = titleOf(win);
    var clone = win.cloneNode(true);
    clone.removeAttribute('aria-labelledby');
    clone.removeAttribute('style');
    clone.removeAttribute('inert');
    clone.removeAttribute('hidden');
    clone.classList.remove('is-min', 'is-gone', 'is-anim', 'is-zoom-origin');
    clone.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    var body = clone.querySelector('.window__body');
    if (body) { body.removeAttribute('hidden'); body.removeAttribute('inert'); body.removeAttribute('aria-hidden'); }

    var dlg = document.createElement('dialog');
    dlg.className = 'zoom';
    var heading = clone.querySelector('.window__title, .card__title');
    if (heading) { heading.id = 'zoom-title'; dlg.setAttribute('aria-labelledby', 'zoom-title'); }
    else dlg.setAttribute('aria-label', label);

    var dots = clone.querySelector('.window__dots');
    if (dots) {
      dots.textContent = '';
      ['red', 'yellow', 'green'].forEach(function (k) {
        var b = dot(k, 'Close zoomed ' + label);
        b.addEventListener('click', closeZoom);
        dots.appendChild(b);
      });
    }
    dlg.appendChild(clone);

    var z = { dlg: dlg, win: win, opener: opener, state: 'opening', anims: [], token: 0, timer: 0, animated: false };

    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeZoom();
    });
    dlg.addEventListener('cancel', function (e) {      // Esc: run the closing animation instead of closing at once
      if (e.cancelable) { e.preventDefault(); closeZoom(); }
    });
    dlg.addEventListener('close', function () { finalizeZoom(z); });

    var origin0 = visibleRect(win);                    // what the user sees right now, before the scroll lock can change layout
    zoom = z;
    document.body.appendChild(dlg);
    document.documentElement.classList.add('zoom-lock');
    try { dlg.showModal(); } catch (err) {
      document.documentElement.classList.remove('zoom-lock');
      dlg.remove();
      zoom = null;
      return;
    }
    win.classList.add('is-zoom-origin');               // hidden visually, layout stays

    if (reduceMq.matches || typeof dlg.animate !== 'function') { z.state = 'open'; return; }
    z.animated = true;
    var radius = parseFloat(getComputedStyle(dlg).borderTopLeftRadius) || 0;
    var from = originState(win, dlg.getBoundingClientRect(), radius, origin0);   // measured before any animation exists
    var full = 'inset(0px 0px 0px 0px round ' + radius + 'px)';
    dlg.style.overflow = 'hidden';
    runZoom(z, true, from, { transform: 'none', clipPath: full, opacity: 1 }, [0, 1], 0, function () {
      cancelAnims(z);
      dlg.style.overflow = '';
      if (z.state === 'opening') z.state = 'open';
    });
  }

  /* ---------- per-window controller ---------- */

  function enhance(win, index) {
    var label = titleOf(win);
    var bar = win.querySelector('.window__bar');
    var dots = win.querySelector('.window__dots');
    var body = win.querySelector('.window__body');
    if (!bar || !dots || !body) return;

    win._token = 0;
    var state = 'open';          // open | closing | closed | opening
    var minimized = false;

    body.id = 'win-body-' + (++seq);

    // The bar was aria-hidden as a whole; only the address pill stays decorative now.
    bar.removeAttribute('aria-hidden');
    var addr = bar.querySelector('.window__address');
    if (addr) addr.setAttribute('aria-hidden', 'true');

    var red = dot('red', 'Close ' + label);
    var yellow = dot('yellow', 'Minimize ' + label);
    var green = dot('green', 'Zoom ' + label);
    yellow.setAttribute('aria-expanded', 'true');
    yellow.setAttribute('aria-controls', body.id);
    dots.textContent = '';
    dots.appendChild(red);
    dots.appendChild(yellow);
    if (HAS_DIALOG) dots.appendChild(green);
    else { var d = document.createElement('i'); d.className = 'dot--green'; d.style.cssText = 'display:block;width:12px;height:12px;border-radius:50%'; d.setAttribute('aria-hidden', 'true'); dots.appendChild(d); }

    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'window-chip';
    chip.hidden = true;
    chip.innerHTML = '<span class="window-chip__dot" aria-hidden="true"></span>';
    chip.appendChild(document.createTextNode('Reopen ' + label));
    win.after(chip);

    function setMinState(min) {
      minimized = min;
      yellow.setAttribute('aria-expanded', String(!min));
      if (min) { body.inert = true; body.setAttribute('aria-hidden', 'true'); }
      else { body.inert = false; body.removeAttribute('aria-hidden'); }
    }

    /* yellow: minimize / expand */
    yellow.addEventListener('click', function () {
      if (state !== 'open') return;
      var from = currentHeight(win);
      var bar_h = bar.offsetHeight + 2;           // title bar + 1px borders
      if (!minimized) {
        setMinState(true);
        win.classList.add('is-min');
        if (reduceMq.matches) { body.hidden = true; return; }
        animate(win, from, bar_h, MIN_MS, null, function () { if (minimized) body.hidden = true; });
      } else {
        setMinState(false);
        body.hidden = false;
        win.classList.remove('is-min');
        if (reduceMq.matches) return;
        var to = naturalHeight(win);
        animate(win, from, to, MIN_MS, null, function () {});
      }
    });

    /* green: zoom */
    green.addEventListener('click', function () { if (state === 'open') openZoom(win, green); });

    /* red: close -> chip; chip: reopen */
    red.addEventListener('click', function () {
      if (state !== 'open') return;
      state = 'closing';
      win.inert = true;
      function finish() {
        if (minimized) body.hidden = true;     // a minimize animation may have been cut short by this close
        win.hidden = true;
        win.style.height = '';
        state = 'closed';
        chip.hidden = false;
        chip.focus();
      }
      if (reduceMq.matches) { win.classList.add('is-gone'); finish(); return; }
      animate(win, currentHeight(win), 0, CLOSE_MS, function () { win.classList.add('is-gone'); }, finish);
    });

    chip.addEventListener('click', function () {
      if (state !== 'closed') return;
      state = 'opening';
      chip.hidden = true;
      win.hidden = false;
      win.inert = false;
      function finish() {
        win.classList.remove('is-gone');
        state = 'open';
        red.focus();
      }
      if (reduceMq.matches) { finish(); return; }
      var to = naturalHeight(win);
      animate(win, 0, to, CLOSE_MS, function () { win.classList.remove('is-gone'); }, finish);
    });
  }

  Array.prototype.forEach.call(wins, enhance);
})();
