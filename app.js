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

  /* Core concepts: three sequential flashcard sets, with a list view */
  var cc = document.getElementById('concepts');
  if (cc) {
    var list = cc.querySelector('.cc-list');
    var sets = [];
    list.querySelectorAll('h4').forEach(function (h) {
      var dl = h.nextElementSibling;
      var cards = [];
      dl.querySelectorAll('.concept').forEach(function (row) {
        var dd = row.querySelector('dd');
        var like = dd.querySelector('.like');
        var tree = dd.querySelector('.tree');
        cards.push({
          term: row.querySelector('dt').innerHTML,
          def: dd.querySelector('p').innerHTML,
          like: like ? like.innerHTML : '',
          tree: tree ? tree.outerHTML : ''
        });
      });
      sets.push({ name: h.textContent, cards: cards });
    });

    var h3 = cc.querySelector('h3');
    var head = document.createElement('div');
    head.className = 'cc-head';
    h3.parentNode.insertBefore(head, h3);
    head.appendChild(h3);
    var toggle = document.createElement('div');
    toggle.className = 'cc-toggle';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'View');
    toggle.innerHTML = '<button type="button" data-view="cards" aria-pressed="true">Flashcards</button><button type="button" data-view="list" aria-pressed="false">List view</button>';
    head.appendChild(toggle);

    var chevL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var chevR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    var view = document.createElement('div');
    view.className = 'cc-cards';
    view.innerHTML =
      '<ol class="cc-flow">' + sets.map(function (s, i) {
        return '<li><button type="button" class="cc-set" data-set="' + i + '" aria-pressed="false"><span class="k">Set ' + (i + 1) + '</span><span class="t">' + s.name + '</span><span class="c">' + s.cards.length + ' cards</span></button></li>';
      }).join('') + '</ol>' +
      '<div class="flashcard" role="button" tabindex="0">' +
        '<div class="fc-inner">' +
          '<div class="fc-face fc-front"><p class="fc-label">Term</p><p class="fc-term"></p><p class="fc-hint">Click to flip</p></div>' +
          '<div class="fc-face fc-back" aria-hidden="true"><p class="fc-label">Definition</p><p class="fc-def"></p><p class="like"></p><div class="fc-tree"></div><p class="fc-hint">Click to see the term</p></div>' +
        '</div>' +
      '</div>' +
      '<div class="fc-nav"><button type="button" class="fc-btn" data-step="-1" aria-label="Previous card">' + chevL + '</button><p class="fc-count" role="status"></p><button type="button" class="fc-btn" data-step="1" aria-label="Next card">' + chevR + '</button></div>';
    cc.insertBefore(view, list);
    list.hidden = true;

    var card = view.querySelector('.flashcard');
    var front = view.querySelector('.fc-front');
    var back = view.querySelector('.fc-back');
    var si = 0, ci = 0, flipped = false;
    var draw = function () {
      var c = sets[si].cards[ci];
      view.querySelectorAll('.cc-set').forEach(function (b, i) { b.setAttribute('aria-pressed', i === si ? 'true' : 'false'); });
      front.querySelector('.fc-term').innerHTML = c.term;
      back.querySelector('.fc-def').innerHTML = c.def;
      var like = back.querySelector('.like');
      like.innerHTML = c.like;
      like.hidden = !c.like;
      back.querySelector('.fc-tree').innerHTML = c.tree;
      card.classList.toggle('flipped', flipped);
      front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
      back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
      view.querySelector('.fc-count').textContent = 'Card ' + (ci + 1) + ' of ' + sets[si].cards.length + ' \u00b7 ' + sets[si].name + (flipped ? ' \u00b7 definition' : '');
    };
    var flip = function () { flipped = !flipped; draw(); };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    view.querySelectorAll('.cc-set').forEach(function (b) {
      b.addEventListener('click', function () { si = +b.dataset.set; ci = 0; flipped = false; draw(); });
    });
    view.querySelectorAll('.fc-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var step = +b.dataset.step;
        ci += step;
        if (ci >= sets[si].cards.length) { si = (si + 1) % sets.length; ci = 0; }
        if (ci < 0) { si = (si - 1 + sets.length) % sets.length; ci = sets[si].cards.length - 1; }
        flipped = false;
        draw();
      });
    });
    toggle.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var showList = b.dataset.view === 'list';
        list.hidden = !showList;
        view.hidden = showList;
        toggle.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
    });
    draw();
  }

  /* Example pop-up: open demos in a dialog instead of a new page */
  var demo = document.getElementById('demo');
  if (demo && demo.showModal) {
    var frame = document.getElementById('demo-frame');
    var demoTitle = document.getElementById('demo-title');
    var demoOpen = document.getElementById('demo-open');
    document.querySelectorAll('a[data-demo]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        demoTitle.textContent = link.dataset.demo;
        frame.title = link.dataset.demo;
        frame.src = link.href;
        demoOpen.href = link.href;
        demo.showModal();
      });
    });
    document.getElementById('demo-close').addEventListener('click', function () { demo.close(); });
    demo.addEventListener('click', function (e) { if (e.target === demo) demo.close(); });
    demo.addEventListener('close', function () { frame.src = 'about:blank'; });
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
