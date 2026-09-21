/* ------------------------------------------------------------------ *
   Ferrite site — vanilla, no dependencies.
   Nav toggle, scroll-spy, copy buttons, and a ~70-line highlighter.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* ----------------------------- nav ------------------------------ */

  var toggle = document.querySelector('.nav-toggle');
  var nav    = document.getElementById('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close after tapping a link on mobile.
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --------------------------- scroll-spy -------------------------- */

  var links = {};
  Array.prototype.forEach.call(nav ? nav.querySelectorAll('a[href^="#"]') : [], function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });

  var watched = Object.keys(links)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && watched.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });

      // Highest section currently on screen wins.
      var winner = null;
      for (var i = 0; i < watched.length; i++) {
        if (visible[watched[i].id]) { winner = watched[i].id; break; }
      }
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('active', id === winner);
      });
    }, { rootMargin: '-25% 0px -65% 0px' });

    watched.forEach(function (el) { spy.observe(el); });
  }

  /* ------------------------- copy buttons -------------------------- */

  Array.prototype.forEach.call(document.querySelectorAll('pre'), function (pre) {
    var code = pre.querySelector('code');
    if (!code) return;

    var raw = code.textContent;          // captured before highlighting
    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', function () {
      write(raw, function (ok) {
        btn.textContent = ok ? 'Copied' : 'Failed';
        btn.classList.toggle('done', ok);
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('done');
        }, 1500);
      });
    });

    pre.appendChild(btn);
  });

  function write(text, done) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { done(true); })
          .catch(function () { done(fallback(text)); });
        return;
      }
    } catch (e) { /* fall through */ }
    done(fallback(text));
  }

  function fallback(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  /* -------------------------- highlighter --------------------------
     One escaped pass, one regex with alternation, so a match inside a
     comment or string can never be re-wrapped by a later rule.
     Blocks marked `pre.plain` (the ASCII demo output) are left alone.
   ------------------------------------------------------------------ */

  var C_KW = 'typedef|struct|static|const|return|sizeof|if|else|for|while|switch|case|break|enum|union|inline';
  var C_TY = 'void|int|char|float|double|long|short|unsigned|signed|bool|size_t|[A-Z][A-Za-z0-9]*_t|Fe[A-Za-z0-9]+|FERRITE_[A-Z_]+|FE_[A-Z_]+';

  var RULES = {
    c: new RegExp([
      '(&[a-z]+;|&#\\d+;)',                       // 1 pre-escaped entity
      '(/\\*[\\s\\S]*?\\*/|//[^\\n]*)',           // 2 comment
      '("(?:[^"\\\\\\n]|\\\\.)*")',               // 3 string
      '\\b(' + C_KW + ')\\b',                     // 4 keyword
      '\\b(' + C_TY + ')\\b',                     // 5 type
      '\\b(\\d+(?:\\.\\d+)?[fuUlL]?)\\b'          // 6 number
    ].join('|'), 'g'),

    sh: new RegExp([
      '(&[a-z]+;|&#\\d+;)',                       // 1 entity
      '(#[^\\n]*)',                               // 2 comment
      '("(?:[^"\\\\\\n]|\\\\.)*"|\'[^\'\\n]*\')', // 3 string
      '(^|\\s)(-{1,2}[A-Za-z][\\w.=-]*)',         // 4,5 flag
      '(^|\\n)(\\s*)([\\w./-]+)'                  // 6,7,8 leading command
    ].join('|'), 'g')
  };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(text, lang) {
    var re = RULES[lang];
    if (!re) return esc(text);

    return esc(text).replace(re, function (m, ent, cmt, str, a, b, c, d, e) {
      if (ent) return ent;
      if (cmt) return '<span class="tk-cmt">' + cmt + '</span>';
      if (str) return '<span class="tk-str">' + str + '</span>';

      if (lang === 'c') {
        if (a) return '<span class="tk-kw">'  + a + '</span>';
        if (b) return '<span class="tk-typ">' + b + '</span>';
        if (c) return '<span class="tk-num">' + c + '</span>';
        return m;
      }

      // sh: (a = leading space, b = flag) or (c = newline, d = indent, e = command)
      if (b) return a + '<span class="tk-flg">' + b + '</span>';
      if (e) return c + d + '<span class="tk-cmd">' + e + '</span>';
      return m;
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('pre:not(.plain) > code'), function (code) {
    var cls  = code.className || '';
    var hit  = cls.match(/language-(\w+)/);
    if (!hit) return;
    code.innerHTML = highlight(code.textContent, hit[1]);
  });

  /* ------------------------ reveal on scroll ----------------------- */

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!still && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll(
      '.section .container > h2, .section .container > .section-lede, ' +
      '.cards, .table-wrap, .figure, .links, .limits, .pipeline'
    );

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        // Reveal on intersection, but also for anything already scrolled
        // past — an anchor jump skips over sections without ever
        // intersecting them, and they must not stay invisible.
        if (!en.isIntersecting && en.boundingClientRect.top > 0) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(targets, function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }
})();
