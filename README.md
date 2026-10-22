# glsc-studio

Site de **StudioGLSC** — https://studio.glsc.fr/ — studio web indépendant de Gabin Lescoat (sites vitrines en Bretagne).

Site statique, sans framework ni ressource externe : une page d'accueil, deux démos, les pages légales et la page 404.

| Fichier | Rôle |
| --- | --- |
| `index.html` | page d'accueil (services, forfaits, réalisations, méthode, FAQ, contact) |
| `assets/studio.css` | feuille de style unique (thèmes clair et sombre) |
| `assets/studio.js` | thème, menu mobile, animations, formulaire (prépare un e-mail, rien n'est enregistré), liens téléphone et WhatsApp |
| `assets/fonts/` | Inter, hébergée sur le site (sous-ensemble latin, woff2) |
| `assets/img/` | vignettes des réalisations (webp) et image de partage |
| `a-propos/`, `sites-pour/`, `creation-site-web/`, `blog/` | pages de contenu **générées** par `node tools/build-site.mjs` (ne pas les modifier à la main) |
| `tools/content/*.mjs`, `tools/site.config.json` | le texte de ces pages et les réglages (liens officiels, fiche Google) |
| `assets/search-index.json` | index de la recherche de la page 404 (généré) |
| `legal.css`, `mentions-legales.html`, `cgu.html`, `cgv.html` | pages légales |
| `demos/<démo>/` | six démos interactives (restaurant, coiffeur, photographe, gîte, club, artisan) : une page, un `style.css`, un `app.js` chacune, socle commun dans `demos/shared/`, polices dans `demos/fonts/`. Aucune ressource externe |
| `club-demo.html`, `btp-demo.html` | anciennes adresses des démos, redirigent vers `/demos/club/` et `/demos/btp/` |
| `demos/index.html` | galerie des démos (générée par `tools/build-site.mjs` depuis `tools/content/demos.mjs`) |
| `404.html` | page d'erreur |

## Réglages (haut de `assets/studio.js`)

| Constante | Rôle |
| --- | --- |
| `CONTACT_PHONE` | numéro public (liens « Appeler » et WhatsApp) |
| `BOOKING_URL` | lien de prise de rendez-vous (Cal.com, Calendly…) ; vide : le bouton propose d'écrire pour convenir d'un créneau |
| `REPLY_DELAY` | délai annoncé après l'envoi, par exemple `sous 24 h ouvrées` ; vide : aucune promesse de délai |
| `CONTACT_ENDPOINT` | adresse du service qui reçoit les demandes ; vide : le formulaire prépare un e-mail dans la messagerie du visiteur |

Le formulaire pose trois questions (activité, besoin, délai) puis demande les coordonnées. Les engagements affichés sur la page reprennent les CGV : si les CGV changent, la section « Mes engagements » (`#engagements`) et l'estimation (`#estimate`) doivent suivre. La ligne de statut du pied de page (« immatriculation en cours ») est à mettre à jour avec le SIREN.

## Déployer

Sur le serveur, en root : `curl -fsSL https://raw.githubusercontent.com/gabinlsc/glsc-studio/main/deploy.sh | sudo bash` (ajouter `-s -- <branche>` pour une autre branche). Le script lit le dossier du site dans nginx, sauvegarde l'existant dans `/var/backups/glsc`, vérifie que le site répond et revient en arrière sinon.

## Pages de contenu et référencement

`node tools/build-site.mjs` régénère : à propos, une page par métier, une page par ville, le blog, le plan du site (`sitemap.xml`), l'index de recherche et les colonnes de liens du pied de page (dans `index.html`, entre les repères `@footer-cols`). L'en-tête, le pied de page et les icônes viennent d'`index.html` : on ne les maintient qu'à un seul endroit.
`node tools/check-links.mjs` vérifie les liens internes, les ancres et les icônes de toutes les pages.
Pour la fiche Google, voir `docs/google-business-profile.md`.

## Vérifications

`npm ci --ignore-scripts` puis :

| Commande | Ce qu'elle contrôle |
| --- | --- |
| `npm run check` | pages générées à jour, liens et ancres, référencement (titres, descriptions, canoniques, JSON-LD), budget de poids |
| `npm test` | parcours dans Chromium (formulaire, estimation, démos, 404), politique CSP de production, accessibilité (axe-core) |
| `npm run lighthouse` | scores Lighthouse mobile ≥ 90 (performance) et ≥ 95 (accessibilité, bonnes pratiques, SEO) |

Le tout tourne aussi sur chaque PR (`.github/workflows/check.yml`). Si Chromium n'est pas celui de Playwright, indiquer son chemin dans `CHROMIUM_PATH`.

## Sécurité du serveur

`deploy/studio-security.conf` contient les en-têtes (CSP stricte, HSTS, Permissions-Policy…) et les règles de cache. `deploy.sh` l'installe dans `/etc/nginx/snippets/` et indique la ligne à ajouter dans le bloc `server` de nginx (`include snippets/studio-security.conf;`) : il ne modifie jamais la configuration nginx tout seul.

## Régénérer les images et les polices

`python3 tools/build-assets.py fonts | thumbs <dossier de captures> | brand` (Pillow, fonttools, brotli ; les captures des démos sont faites avec Chromium). Le site, lui, n'a besoin d'aucun outil.

## Démos

- Contenu de la liste : `tools/content/demos.mjs`. La galerie `/demos/`, les cartes et les onglets de l'accueil sont régénérés par `node tools/build-site.mjs`.
- Visuels : `python3 tools/build-demo-images.py` (paysages et affiches illustrés, sans banque d'images ni photo) ; vignettes : `CHROMIUM_PATH=… node tools/build-demo-thumbs.mjs`.
- Chaque démo est fictive, `noindex`, sans requête externe ni script en ligne (elle passe sous la CSP de production) ; ses formulaires sont simulés.
- Tests : `tests/demos.mjs` (parcours de chaque démo), `tests/csp.mjs` et `tests/a11y.mjs` (toutes les démos).
