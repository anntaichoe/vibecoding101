/* Vibecoding 101 — small, dependency-free behaviours. */
(function () {
  var root = document.documentElement;
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* Theme toggle */
  var toggle = document.getElementById('themeToggle');
  function paint() {
    var dark = root.getAttribute('data-theme') === 'dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.querySelector('.sun').toggleAttribute('hidden', !dark);
    toggle.querySelector('.moon').toggleAttribute('hidden', dark);
  }
  if (toggle) {
    paint();
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('vc101-theme', next);
      paint();
    });
  }

  /* Navigation: side panel (desktop) or menu icon (smaller screens) after scrolling */
  var header = document.querySelector('.topbar');
  var bar = header && header.querySelector('.bar');
  var menu = document.getElementById('menuBtn');
  function closeMenu() {
    if (!bar) return;
    bar.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
  function setScrolled(on) {
    if (on === root.classList.contains('scrolled')) return;
    if (on) {
      header.style.height = header.offsetHeight + 'px';
      root.classList.add('scrolled');
    } else {
      root.classList.remove('scrolled');
      header.style.height = '';
      closeMenu();
    }
  }
  if (bar && menu) {
    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      if (y > 140) setScrolled(true);
      else if (y < 40) setScrolled(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    menu.addEventListener('click', function () {
      var open = bar.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (bar.classList.contains('open') && !bar.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bar.classList.contains('open')) { closeMenu(); menu.focus(); }
    });
  }

  /* Copy buttons */
  document.querySelectorAll('.copy').forEach(function (btn) {
    var label = btn.getAttribute('aria-label');
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.dataset.copy).textContent.trim();
      function done() {
        btn.classList.add('copied');
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.setAttribute('aria-label', label);
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* Tool filter */
  var box = document.getElementById('easyOnly');
  if (box) {
    var items = document.querySelectorAll('#toolGrid li');
    var count = document.getElementById('toolCount');
    var apply = function () {
      var shown = 0;
      items.forEach(function (li) {
        var hide = box.checked && !li.hasAttribute('data-easy');
        li.hidden = hide;
        if (!hide) shown++;
      });
      count.textContent = 'Showing ' + shown + ' of ' + items.length + ' tools';
    };
    box.addEventListener('change', apply);
    apply();
  }

  /* Quizzes: one question per fieldset, immediate explanatory feedback */
  document.querySelectorAll('.q').forEach(function (q) {
    var btn = q.querySelector('.check');
    var fb = q.querySelector('.feedback');
    btn.addEventListener('click', function () {
      var picked = q.querySelector('input:checked');
      fb.className = 'feedback';
      if (!picked) {
        fb.innerHTML = '<strong>Choose an answer first.</strong>';
        return;
      }
      var ok = picked.hasAttribute('data-correct');
      if (ok) fb.classList.add('ok');
      fb.innerHTML = '';
      var head = document.createElement('strong');
      head.textContent = ok ? '✓ Correct.' : '✗ Not quite. Try again.';
      fb.appendChild(head);
      fb.appendChild(document.createTextNode(picked.getAttribute('data-fb')));
    });
  });
})();
