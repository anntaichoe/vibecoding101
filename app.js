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
    toggle.querySelector('.label').textContent = dark ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.querySelector('.sun').hidden = !dark;
    toggle.querySelector('.moon').hidden = dark;
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

  /* Copy buttons */
  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = document.getElementById(btn.dataset.copy).textContent.trim();
      function done() {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1800);
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

  /* DIY progress checklist */
  var checks = document.querySelectorAll('.done input');
  if (checks.length) {
    var bar = document.getElementById('progressBar');
    var text = document.getElementById('progressText');
    var saved = {};
    try { saved = JSON.parse(store('vc101-diy') || '{}') || {}; } catch (e) { saved = {}; }
    var update = function () {
      var n = 0;
      checks.forEach(function (c) { if (c.checked) n++; saved[c.id] = c.checked; });
      bar.value = n;
      text.textContent = n === checks.length ? 'All ' + n + ' steps done. Nice work.' : n + ' of ' + checks.length + ' steps done';
      store('vc101-diy', JSON.stringify(saved));
    };
    checks.forEach(function (c) {
      if (saved[c.id]) c.checked = true;
      c.addEventListener('change', update);
    });
    update();
  }
})();
