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

  /* ---------- zoom dialog (one at a time, created on open, removed on close) ---------- */

  var zoom = null;

  function openZoom(win, opener) {
    if (zoom || !HAS_DIALOG) return;
    var label = titleOf(win);
    var clone = win.cloneNode(true);
    clone.removeAttribute('aria-labelledby');
    clone.removeAttribute('style');
    clone.removeAttribute('inert');
    clone.removeAttribute('hidden');
    clone.classList.remove('is-min', 'is-gone', 'is-anim');
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
        b.addEventListener('click', function () { dlg.close(); });
        dots.appendChild(b);
      });
    }
    dlg.appendChild(clone);

    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('zoom-lock');
      if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
      zoom = null;
      if (opener && document.contains(opener)) opener.focus();
    });

    zoom = dlg;
    document.body.appendChild(dlg);
    document.documentElement.classList.add('zoom-lock');
    try { dlg.showModal(); } catch (err) {
      document.documentElement.classList.remove('zoom-lock');
      dlg.remove();
      zoom = null;
    }
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
