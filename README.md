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
| `legal.css`, `mentions-legales.html`, `cgu.html`, `cgv.html` | pages légales |
| `club-demo.html`, `btp-demo.html` | concepts démo (ils chargent encore Google Fonts et Tailwind depuis un CDN, ce que les mentions légales indiquent) |
| `404.html` | page d'erreur |

Le numéro de téléphone public se règle en haut de `assets/studio.js` (`CONTACT_PHONE`).

## Régénérer les images et les polices

`python3 tools/build-assets.py fonts | thumbs <dossier de captures> | brand` (Pillow, fonttools, brotli ; les captures des démos sont faites avec Chromium). Le site, lui, n'a besoin d'aucun outil.
