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

## Régénérer les images et les polices

`python3 tools/build-assets.py fonts | thumbs <dossier de captures> | brand` (Pillow, fonttools, brotli ; les captures des démos sont faites avec Chromium). Le site, lui, n'a besoin d'aucun outil.
