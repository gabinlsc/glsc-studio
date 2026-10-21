/* Page 404 : recherche locale dans l'index des pages (aucune requête externe). Propose d'abord les pages proches de l'adresse demandée. */
(function () {
  'use strict';
  var form = document.getElementById('nf-search'), input = document.getElementById('nf-q'), out = document.getElementById('nf-results'), hint = document.getElementById('nf-hint');
  var pages = [];
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  // Chaque mot trouvé rapporte des points (titre > mots-clés > reste) : on classe les pages qui en contiennent le plus.
  function score(page, words) {
    var title = norm(page.t), keys = norm(page.k), hay = norm(page.t + ' ' + page.d + ' ' + page.k + ' ' + page.u), total = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (title.indexOf(w) !== -1) total += 5;
      if (keys.indexOf(w) !== -1) total += 3;
      if (hay.indexOf(w) !== -1) total += 1;
    }
    return total;
  }
  function render(list) {
    out.textContent = '';
    list.slice(0, 6).forEach(function (p) {
      var a = document.createElement('a'); a.href = p.u;
      var t = document.createElement('strong'); t.textContent = p.t;
      var d = document.createElement('span'); d.textContent = p.d;
      a.append(t, d); out.append(a);
    });
  }
  function search(q, silent) {
    var words = norm(q).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; });
    if (!words.length) { out.textContent = ''; return []; }
    var found = pages.map(function (p) { return { p: p, s: score(p, words) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.p; });
    render(found);
    hint.textContent = found.length || silent ? '' : 'Aucune page ne correspond. Essayez un autre mot, ou retournez à l’accueil.';
    return found;
  }
  fetch('/assets/search-index.json').then(function (r) { return r.json(); }).then(function (data) {
    pages = data; form.hidden = false;
    var guess = decodeURIComponent(location.pathname).replace(/\.html?$/, '').replace(/[\/_-]+/g, ' ').trim();
    if (guess && search(guess, true).length) hint.textContent = 'Vous cherchiez peut-être :';
    input.addEventListener('input', function () { search(input.value); });
  }).catch(function () { /* sans index, la page reste utilisable avec ses deux boutons */ });
})();
