/* Chargé en tête de page (bloquant, 1 ligne utile) : applique le thème avant l'affichage pour éviter un éclair clair/sombre. */
document.documentElement.classList.add('js');
try {
  var saved = localStorage.getItem('studioglsc-theme');
  document.documentElement.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch (e) { document.documentElement.dataset.theme = 'light'; }
