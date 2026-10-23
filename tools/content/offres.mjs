// Source unique de l'offre StudioGLSC : gammes, Pack Lancement, abonnements Sérénité, options, parrainage.
// Tout ce qui parle de prix ou de contenu d'une offre (accueil, estimateur, comparateur, FAQ, pages métiers et villes, blog, CGV, vidéos…) est généré ou relu depuis ce fichier.
// Pour changer un prix : le modifier ici, lancer `node tools/build-site.mjs`, puis refaire les films (`promo/`) s'ils citent ce prix.
const NB = ' ';
export const eur = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB) + NB + '€';

// --- Création de site (paiement ponctuel)
export const GAMMES = [
  {
    id: 'express', name: 'Express', service: 'Express', price: 590, from: false, quote: false, badge: 'Pour démarrer',
    pitch: 'Une page qui présente votre activité et déclenche l’appel ou la demande de devis.',
    includes: ['Première version en 48 h*', 'Design sur mesure, mobile et ordinateur', 'Formulaire vers votre boîte mail', 'Boutons Appel direct et WhatsApp', '2 tours de retouches inclus', '100 % propriétaire de votre site'],
    cta: 'Choisir Express', pageNote: 'Une page',
  },
  {
    id: 'vitrine', name: 'Vitrine', service: 'Vitrine', price: 990, from: true, quote: true, badge: 'Le site complet',
    pitch: 'Plusieurs pages pour présenter vos services, vos réalisations et vos tarifs, ou moderniser un site existant.',
    includes: ['Jusqu’à 10 pages (services, réalisations, tarifs, contact…)', 'Référencement local et vitesse optimisés', 'Fiche Google Business Profile optimisée', 'Retouche de vos photos', '3 tours de retouches inclus', 'Mise en ligne accompagnée'],
    cta: 'Estimer ma vitrine', pageNote: 'De 2 à 10 pages',
  },
  {
    id: 'boutique', name: 'Boutique', service: 'Boutique en ligne', price: 1490, from: true, quote: true, badge: 'Vendre en ligne',
    pitch: 'Une boutique pour présenter vos produits, prendre les commandes et encaisser en ligne.',
    includes: ['Catalogue de produits et catégories', 'Panier, commande et paiement en ligne sécurisé', 'Saisie de vos 10 premiers produits', 'Pages produits optimisées pour le mobile', 'Prise en main et accompagnement', '3 tours de retouches inclus'],
    cta: 'Estimer ma boutique', pageNote: 'Boutique en ligne',
  },
];
// Fourchettes de départ (sur devis) selon l'ampleur : [bas, haut | null, libellé]
export const PAGES = [[990, 1190, '2 à 3 pages'], [1190, 1490, '4 à 6 pages'], [1490, 1990, '7 à 10 pages']];
export const PRODUITS = [[1490, 1890, 'jusqu’à 10 produits'], [1890, 2590, '11 à 50 produits'], [2590, null, 'plus de 50 produits']];

// --- Options à la carte (s'ajoutent à un site StudioGLSC)
export const OPTIONS = [
  { id: 'google', name: 'Fiche Google Business Profile', price: 150, desc: 'Création ou optimisation de votre fiche : catégories, horaires, photos, description, premier post.' },
  { id: 'reseaux', name: 'Kit réseaux sociaux', price: 90, desc: 'Avatar, bannière et trois visuels de lancement aux couleurs de votre site.' },
  { id: 'photos', name: 'Retouche photo', price: 60, desc: 'Jusqu’à 10 photos recadrées, corrigées et allégées pour le web.' },
  { id: 'page', name: 'Page supplémentaire', price: 120, desc: 'Une page de plus sur un site Vitrine, rédaction mise en forme comprise.' },
];
const opt = (id) => OPTIONS.find((o) => o.id === id);

// --- Pack Lancement : Express + trois options, à prix réduit
export const PACK = {
  id: 'pack', name: 'Pack Lancement', service: 'Pack Lancement', price: 790, badge: 'Le plus choisi',
  pitch: 'Tout pour être trouvé dès le premier jour : votre site Express, votre fiche Google et vos visuels, en un seul achat.',
  contains: ['express', 'google', 'reseaux', 'photos'],
  includes: ['Site Express en 48 h*', 'Fiche Google Business Profile optimisée', 'Kit réseaux sociaux (avatar, bannière, 3 visuels)', 'Retouche de 10 photos', '2 tours de retouches inclus'],
  cta: 'Choisir le Pack Lancement',
};
export const packValue = () => GAMMES[0].price + PACK.contains.filter((x) => x !== 'express').reduce((s, id) => s + opt(id).price, 0);
export const packSaving = () => packValue() - PACK.price;

// --- Abonnements Sérénité (option, uniquement avec un site créé par StudioGLSC)
export const SERENITE = [
  { id: 'essentiel', name: 'Essentiel', month: 29, year: 290, badge: 'Tranquillité', pitch: 'Votre site en ligne, sécurisé et sauvegardé.', hours: 0,
    includes: ['Hébergement sécurisé et certificat SSL', 'Sauvegardes régulières', 'Surveillance de la disponibilité', 'Mises à jour techniques', 'Modifications au tarif de 45 € / h'] },
  { id: 'plus', name: 'Plus', month: 59, year: 590, badge: 'Le plus choisi', pitch: 'Votre site vit : vos changements sont faits pour vous.', hours: 1,
    includes: ['Tout l’Essentiel', '1 h de modifications de contenu par mois', 'Rapport mensuel de visites (sans cookies)', 'Réponse sous 24 h ouvrées'] },
  { id: 'croissance', name: 'Croissance', month: 99, year: 990, badge: 'Pour progresser', pitch: 'Votre site progresse : contenu, visibilité locale et suivi.', hours: 3,
    includes: ['Tout le Plus', '3 h de modifications par mois', 'Une page ou un article publié par trimestre', 'Suivi du référencement local', 'Point de suivi de 30 min chaque trimestre'] },
];
export const RATE_H = 45; // tarif horaire des modifications hors forfait

// --- Parrainage
export const PARRAINAGE = { filleul: 50, parrain: 50, max: 5 };

// --- Chaînes réutilisées dans les textes
export const T = {
  g: (i) => GAMMES[i],
  from: (g) => (g.from ? 'dès ' : '') + eur(g.price),
  express: eur(GAMMES[0].price), vitrine: eur(GAMMES[1].price), boutique: eur(GAMMES[2].price),
  pack: eur(PACK.price), packValue: eur(packValue()), packSaving: eur(packSaving()),
  sMin: eur(SERENITE[0].month), filleul: eur(PARRAINAGE.filleul), parrain: eur(PARRAINAGE.parrain),
  yearGift: (s) => eur(s.month * 12 - s.year),
};
export const SERVICES = [...GAMMES.map((g) => g.service), PACK.service, 'Abonnement Sérénité', 'Autre demande'];

// --- Données exposées au navigateur (assets/offres.js) : estimateur
export const clientData = () => ({
  express: GAMMES[0].price, pack: PACK.price, vitrine: PAGES, boutique: PRODUITS,
  options: Object.fromEntries(OPTIONS.map((o) => [o.id, { name: o.name, price: o.price }])), packContains: PACK.contains,
  serenite: Object.fromEntries(SERENITE.map((s) => [s.id, { name: s.name, month: s.month, year: s.year }])),
  filleul: PARRAINAGE.filleul, parrain: PARRAINAGE.parrain,
});
