/* Pages légales : bascule de thème, année du pied de page et sommaire généré à partir des titres. */
(function () {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('#theme-toggle');
  const themeIcon = document.querySelector('#theme-icon');
  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('studioglsc-theme', theme); } catch {}
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0a0f1c' : '#f6f7f9';
    themeIcon.textContent = theme === 'dark' ? '☼' : '☾';
    themeButton.setAttribute('aria-label', theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre');
  }
  setTheme(root.dataset.theme || 'light');
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const legalBody = document.querySelector('.legal-body');
  const tocList = document.querySelector('[data-toc]');
  const headings = legalBody ? [...legalBody.querySelectorAll('h2[id]')] : [];
  if (tocList && headings.length) {
    headings.forEach(heading => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      item.append(link);
      tocList.append(item);
    });
  } else if (tocList) {
    const toc = document.querySelector('.toc');
    if (toc) toc.remove();
  }

  const remaining = [...document.querySelectorAll('.todo')].map(el => el.textContent.trim());
  if (remaining.length) console.warn('[StudioGLSC] Champs à compléter avant la mise en ligne :', remaining);

})();
