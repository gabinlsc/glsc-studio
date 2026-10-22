/* Page de suivi de projet : le lien secret est dans le fragment de l'adresse (jamais envoyé au serveur dans l'URL, absent des journaux).
   Tout le texte est inséré comme texte, jamais comme HTML. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var token = location.hash.slice(1);
  var MAX = 8 * 1024 * 1024;
  var busy = false;

  function show(id) { ['#state-loading', '#state-error', '#project'].forEach(function (s) { $(s).hidden = s !== id; }); }
  function fail(text) { $('#error-text').textContent = text; show('#state-error'); }
  function size(n) { return n < 1024 ? n + ' o' : n < 1048576 ? Math.round(n / 1024) + ' Ko' : (n / 1048576).toFixed(1).replace('.', ',') + ' Mo'; }
  function date(ts) { return new Date(ts * 1000).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function api(path, body, headers, raw) {
    return fetch('/api' + path, { method: 'POST', headers: Object.assign(raw ? {} : { 'Content-Type': 'application/json' }, headers || {}), body: raw ? body : JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Une erreur est survenue (' + r.status + ').'); e.status = r.status; throw e; } return j; }); });
  }

  function render(p) {
    document.title = p.title + ' · Suivi · StudioGLSC';
    $('#p-title').textContent = p.title;
    $('#p-client').textContent = p.client;
    var steps = $('#p-steps'); steps.textContent = '';
    p.steps.forEach(function (s) {
      var li = el('li', 'p-step ' + s.state);
      li.append(el('span', 'p-dot'), el('span', 'p-label', s.label));
      if (s.state === 'current') li.setAttribute('aria-current', 'step');
      var hint = el('span', 'sr-only', s.state === 'done' ? ' (terminée)' : s.state === 'current' ? ' (en cours)' : ' (à venir)');
      li.append(hint); steps.append(li);
    });
    $('#p-done').hidden = p.status !== 'done';
    var thread = $('#thread'); thread.textContent = '';
    if (!p.messages.length) thread.append(el('p', 'muted', 'Aucun message pour l’instant. Écrivez-moi ci-dessous si vous avez une question.'));
    p.messages.forEach(function (m) {
      var b = el('div', 'bubble ' + (m.from === 'client' ? 'client' : 'studio'));
      b.append(el('small', 'muted', (m.from === 'client' ? 'Vous' : 'Gabin') + ' · ' + date(m.at)), el('p', 'pre-wrap', m.text));
      thread.append(b);
    });
    var list = $('#files'); list.textContent = '';
    p.files.forEach(function (f) { var li = el('li'); li.append(el('span', 'f-name', f.name), el('small', 'muted', size(f.size) + ' · ' + date(f.at))); list.append(li); });
    show('#project');
  }

  function load() {
    return api('/project', { token: token }).then(function (r) { render(r.project); }).catch(function (e) {
      fail(e.status === 404 ? 'Ce lien est introuvable ou n’est plus valable. Vérifiez qu’il est complet, ou demandez-en un nouveau.' : 'Impossible de charger le suivi pour le moment. Réessayez dans un instant.');
    });
  }

  if (!/^[0-9a-f]{32}$/.test(token)) { fail('Le lien est incomplet : il doit se terminer par une longue suite de lettres et de chiffres. Copiez-le en entier.'); return; }
  load();
  setInterval(function () { if (!document.hidden && !busy) api('/project', { token: token }).then(function (r) { render(r.project); }).catch(function () { /* on réessaie au prochain tour */ }); }, 90000);

  $('#msg-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var box = $('#msg-text'), text = box.value.trim(), status = $('#msg-status');
    if (!text) { status.textContent = 'Écrivez un message avant d’envoyer.'; return; }
    $('#msg-send').disabled = true; status.textContent = 'Envoi…'; busy = true;
    api('/project/message', { token: token, text: text }).then(function (r) { box.value = ''; status.textContent = 'Message envoyé ✓'; render(r.project); })
      .catch(function (err) { status.textContent = err.message; })
      .then(function () { $('#msg-send').disabled = false; busy = false; });
  });

  function upload(files) {
    var list = Array.prototype.slice.call(files), status = $('#up-status'), done = 0, failed = [];
    if (!list.length) return;
    busy = true;
    (function next() {
      var f = list.shift();
      if (!f) { busy = false; status.textContent = done ? done + ' fichier' + (done > 1 ? 's' : '') + ' envoyé' + (done > 1 ? 's' : '') + ' ✓' + (failed.length ? ' · ' + failed.join(' · ') : '') : failed.join(' · '); return; }
      if (f.size > MAX) { failed.push('« ' + f.name + ' » dépasse 8 Mo'); return next(); }
      status.textContent = 'Envoi de « ' + f.name + ' »…';
      api('/project/upload', f, { 'X-Project-Token': token, 'X-File-Name': encodeURIComponent(f.name), 'Content-Type': 'application/octet-stream' }, true)
        .then(function (r) { done++; render(r.project); }).catch(function (err) { failed.push('« ' + f.name + ' » : ' + err.message); }).then(next);
    })();
  }
  $('#file-input').addEventListener('change', function (e) { upload(e.target.files); e.target.value = ''; });
  var drop = document.querySelector('.drop');
  ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { upload(e.dataTransfer.files); });
})();
