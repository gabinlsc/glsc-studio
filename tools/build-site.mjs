// Génère les pages de contenu du site (à propos, pages par métier et par ville, blog), le plan du site et l'index de recherche.
// Le gabarit (en-tête, pied de page, icônes) est lu dans index.html : on ne le maintient qu'à un seul endroit.
//   node tools/build-site.mjs
// Contenu : tools/content/*.mjs · réglages : tools/site.config.json
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { METIERS } from './content/metiers.mjs';
import { VILLES } from './content/villes.mjs';
import { ARTICLES } from './content/blog.mjs';
import { DEMOS } from './content/demos.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(readFileSync(join(ROOT, 'tools/site.config.json'), 'utf8'));
const ORIGIN = CFG.origin;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const dateFr = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const words = (s) => s.split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------- gabarit lu dans index.html
let index = readFileSync(join(ROOT, 'index.html'), 'utf8');
const grab = (re, what) => { const m = re.exec(index); if (!m) throw new Error(`index.html : ${what} introuvable`); return m[0]; };
const sprite = grab(/<svg class="sprite"[\s\S]*?<\/svg>/, 'sprite d’icônes');

// Colonnes de liens du pied de page : écrites dans index.html (entre deux repères) puis reprises partout.
const cols = `<!--@footer-cols:start-->
      <div class="footer-cols">
        <div><p class="footer-col-title">Sites par métier</p><ul>${METIERS.map((m) => `<li><a href="/sites-pour/${m.slug}/">${esc(m.name)}</a></li>`).join('')}</ul></div>
        <div><p class="footer-col-title">En Bretagne</p><ul>${VILLES.map((v) => `<li><a href="/creation-site-web/${v.slug}/">Site web à ${esc(v.name)}</a></li>`).join('')}</ul></div>
        <div><p class="footer-col-title">Ressources</p><ul><li><a href="/demos/">Démos interactives</a></li><li><a href="/marque/">Kit de marque</a></li><li><a href="/blog/">Le blog</a></li>${ARTICLES.slice(0, 3).map((a) => `<li><a href="/blog/${a.slug}/">${esc(a.title)}</a></li>`).join('')}<li><a href="/a-propos/">À propos</a></li></ul></div>
      </div>
      <!--@footer-cols:end-->`;
if (index.includes('<!--@footer-cols:start-->')) index = index.replace(/<!--@footer-cols:start-->[\s\S]*?<!--@footer-cols:end-->/, cols);
else index = index.replace('<p class="footer-status">', cols + '\n      <p class="footer-status">');
// Cartes de démos et onglets du téléphone : générés depuis tools/content/demos.mjs (entre repères dans index.html).
const demoCard = (d) => `<a class="project reveal" href="/demos/${d.slug}/" aria-label="Ouvrir la démo ${esc(d.sector)} : ${esc(d.name)}">
            <div class="project-shot"><img src="/assets/img/demo-${d.slug}.webp" width="960" height="600" loading="lazy" alt="${esc(d.alt)}"><span class="project-tag">Démo · ${esc(d.sector)}</span></div>
            <div class="project-body"><h3>${esc(d.name)}</h3><p>${esc(d.blurb)}</p><span class="project-link">Voir la démo ${icon('arrow')}</span></div>
          </a>`;
index = index.replace(/<!--@demo-cards:start-->[\s\S]*?<!--@demo-cards:end-->/, `<!--@demo-cards:start-->\n          ${DEMOS.slice(0, 2).map(demoCard).join('\n          ')}\n          <!--@demo-cards:end-->`);
const showcase = `<!--@showcase:start-->
        <div class="showcase reveal" id="showcase" data-device="phone">
          <div class="sc-copy">
            <p class="eyebrow">Essayer en direct</p>
            <h3>Testez une démo comme le ferait un client.</h3>
            <p class="muted">Choisissez un secteur : la démo s’ouvre dans l’appareil de votre choix, et elle est entièrement utilisable.</p>
          </div>
          <div class="sc-list" role="tablist" aria-label="Choisir une démo" aria-orientation="vertical">
            ${DEMOS.map((d, i) => `<button type="button" class="sc-tab" role="tab" id="sc-tab-${i}" aria-selected="${i === 0}" aria-controls="sc-panel" tabindex="${i === 0 ? 0 : -1}" data-demo="/demos/${d.slug}/" data-title="${esc(d.sector)}" data-name="${esc(d.name)}" data-features="${esc(d.features.join('|'))}"><img class="sc-thumb" src="/assets/img/demo-${d.slug}.webp" width="96" height="60" loading="lazy" alt=""><span class="sc-meta"><b>${esc(d.sector)}</b><small>${esc(d.name)}</small></span><span class="sc-num" aria-hidden="true">0${i + 1}</span></button>`).join('\n            ')}
          </div>
          <div class="sc-stage" id="sc-panel" role="tabpanel" aria-labelledby="sc-tab-0">
            <div class="sc-top">
              <div class="sc-switch" role="group" aria-label="Appareil d’aperçu">
                <button type="button" aria-pressed="true" data-device="phone"><svg class="icon" aria-hidden="true"><use href="#i-phone"/></svg> Mobile</button>
                <button type="button" aria-pressed="false" data-device="desktop"><svg class="icon" aria-hidden="true"><use href="#i-monitor"/></svg> Ordinateur</button>
              </div>
              <a class="btn btn-secondary btn-sm" id="demo-open" href="/demos/${DEMOS[0].slug}/" target="_blank" rel="noopener">Plein écran ${icon('arrow')}</a>
            </div>
            <div class="sc-device">
              <div class="sc-frame">
                <div class="sc-chrome" aria-hidden="true"><i></i><i></i><i></i><span id="sc-url">studio.glsc.fr/demos/${DEMOS[0].slug}/</span></div>
                <div class="demo-screen" id="demo-screen"><div class="demo-placeholder"><span class="sc-spin" aria-hidden="true"></span><span>Chargement de la démo…</span></div></div>
              </div>
            </div>
            <ul class="sc-feats" id="sc-feats" aria-label="Ce que contient cette démo">${DEMOS[0].features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          </div>
        </div>
        <!--@showcase:end-->`;
index = index.replace(/<!--@showcase:start-->[\s\S]*?<!--@showcase:end-->/, showcase);
// JSON-LD de l'accueil : liens officiels (dont la fiche Google Business Profile si renseignée) et zones desservies.
const sameAs = [...CFG.sameAs, ...(CFG.googleBusinessProfile ? [CFG.googleBusinessProfile] : [])];
index = index.replace(/"areaServed": (?:"[^"]*"|\[[^\]]*\]),\s*(?:"sameAs": \[[^\]]*\],\s*)?/, `"areaServed": ${JSON.stringify(['Bretagne', ...VILLES.map((v) => v.name)])},\n    "sameAs": ${JSON.stringify(sameAs)},\n    `);
writeFileSync(join(ROOT, 'index.html'), index);

const toSub = (html) => html.replace(/(<a [^>]*?)href="#accueil"/g, '$1href="/"').replace(/(<a [^>]*?)href="#/g, '$1href="/#');
const header = toSub(grab(/<header class="header" id="header">[\s\S]*?<\/header>/, 'en-tête'));
const progress = grab(/<div class="scroll-progress"[\s\S]*?<\/div>/, 'barre de progression');
const footer = toSub(grab(/<footer>[\s\S]*?<\/footer>/, 'pied de page'));

// ---------------------------------------------------------------- squelette d'une page
const registry = []; // pour le plan du site et la recherche
function shell({ path, title, desc, type = 'website', jsonld = [], body, noindex = false, search = [], head = '', scripts = '' }) {
  const url = ORIGIN + path;
  if (!noindex) registry.push({ path, title, desc, keywords: search.join(' ') });
  const ld = jsonld.map((j) => `  <script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', ...j }, null, 2)}\n  </script>`).join('\n');
  return `<!doctype html>
<html lang="fr" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f7f9">
  <title>${esc(title.length + 13 <= 70 ? title + ' · StudioGLSC' : title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}">
  <link rel="canonical" href="${url}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="${type}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="StudioGLSC">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${ORIGIN}/assets/img/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-display-700.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/studio.css">
  <link rel="stylesheet" href="/assets/fx.css">
  <script src="/assets/theme-init.js"></script>
  <script src="/assets/fx.js"></script>
${head}${ld}
</head>
<body>
  ${sprite}
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  ${header}
  ${progress}
  <main id="contenu">
${body}
  </main>
  ${footer}
  <script src="/assets/studio.js" defer></script>
${scripts}</body>
</html>
`;
}

const crumbs = (items) => ({
  html: `<nav class="breadcrumb" aria-label="Fil d’Ariane"><ol>${items.map(([label, href], i) => `<li>${href && i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}</li>`).join('')}</ol></nav>`,
  ld: { '@type': 'BreadcrumbList', itemListElement: items.map(([label, href], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: ORIGIN + (href || '/') })) },
});
const faqLd = (faq) => ({ '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const faqHtml = (faq) => `<div class="faq-list">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const ctaBand = (title = 'Parlons de votre projet', text = 'Le premier échange est gratuit et sans engagement. Je vous réponds directement.') => `
    <section class="section cta-band-wrap"><div class="wrap"><div class="cta-band">
      <div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
      <div class="btn-row"><a class="btn btn-primary" href="/#contact">Demander un devis ${icon('arrow')}</a><a class="btn btn-secondary" href="/#offres">Voir les tarifs</a></div>
    </div></div></section>`;
const orgRef = { '@type': 'ProfessionalService', name: 'StudioGLSC', url: ORIGIN + '/', email: 'pro@glsc.fr', areaServed: 'Bretagne', ...(sameAs.length ? { sameAs } : {}) };

const pageHero = ({ bc, eyebrow, h1, lead, extra = '' }) => `
    <section class="page-hero"><div class="wrap">
      ${bc}
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(h1)}</h1>
      <p class="page-lead">${esc(lead)}</p>
      ${extra}
    </div></section>`;
const heroCtas = '<div class="btn-row"><a class="btn btn-primary" href="/#contact">Demander un devis ' + icon('arrow') + '</a><a class="btn btn-secondary" href="/#offres">Voir les tarifs</a></div>';
const linkCards = (items) => `<div class="link-grid">${items.map(([href, title, text]) => `<a class="link-card" href="${href}"><strong>${esc(title)}</strong><span>${esc(text)}</span><span class="link-more">Lire ${icon('arrow')}</span></a>`).join('')}</div>`;

const write = (path, html) => {
  const dir = join(ROOT, path.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
};
for (const d of ['a-propos', 'sites-pour', 'creation-site-web', 'blog']) rmSync(join(ROOT, d), { recursive: true, force: true });

// ---------------------------------------------------------------- à propos
{
  const bc = crumbs([['Accueil', '/'], ['À propos', '/a-propos/']]);
  // Photo : gabin.webp si elle est dans le dépôt, sinon gabin.jpg (déposée sur le serveur par activate.sh depuis cv.glsc.fr) ; studio.js revient au monogramme si le fichier est absent.
  const photoSrc = existsSync(join(ROOT, 'assets/img/gabin.webp')) ? '/assets/img/gabin.webp' : '/assets/img/gabin.jpg';
  const photo = `<img class="about-photo" src="${photoSrc}" width="480" height="480" alt="Portrait de Gabin Lescoat" loading="lazy" data-fallback="G">`;
  const body = pageHero({ bc: bc.html, eyebrow: 'À propos', h1: 'Vous parlez à la personne qui crée votre site.', lead: 'StudioGLSC est mon studio web indépendant. Je m’appelle Gabin Lescoat et je crée des sites vitrines clairs et rapides pour les artisans, commerçants et indépendants de Bretagne.' }) + `
    <section class="section"><div class="wrap about-grid">
      <div class="prose">
        <h2>Qui je suis</h2>
        <p>Je suis développeur. Je me forme en Bachelor Développement Informatique à Rennes, en alternance, et je consacre mon temps libre à mes propres projets : des jeux multijoueur en temps réel, des outils pour mon serveur, et ce studio.</p>
        <p>Si je crée des sites pour les petites entreprises, c’est parce que beaucoup en ont besoin et que peu ont accès à quelqu’un qui prend le temps de les écouter. Je préfère un échange direct à une plateforme impersonnelle.</p>
        <h2>Comment je travaille</h2>
        <ul class="ticks">
          <li><strong>Un interlocuteur unique.</strong> Je conçois et je réalise moi-même chaque site. Vous n’avez pas à expliquer votre projet à plusieurs personnes.</li>
          <li><strong>Un cadre clair avant de commencer.</strong> Le premier échange est gratuit ; le devis précise le contenu, le prix, les délais et le paiement.</li>
          <li><strong>Un site qui vous appartient.</strong> Pas d’abonnement imposé : l’abonnement Sérénité & Hébergement est une option, à ajouter à un site, que vous pouvez résilier à tout moment.</li>
          <li><strong>Des échanges simples.</strong> Par téléphone, WhatsApp ou e-mail, selon ce qui vous convient.</li>
        </ul>
        <h2>Sites vitrines et boutiques en ligne</h2>
        <p>Je crée des sites vitrines (One-Page Express, multi-pages) et des boutiques en ligne (catalogue, panier, paiement). Si votre projet demande autre chose, je vous le dis honnêtement dès le premier échange plutôt que de promettre ce que je ne maîtrise pas.</p>
        <h2>Pour juger sur pièces</h2>
        <p>Vous pouvez voir mon travail : mon <a href="https://glsc.fr" rel="noopener">portfolio</a>, mes <a href="https://github.com/gabinlsc" rel="noopener">projets sur GitHub</a>, la <a href="https://games.glsc.fr" rel="noopener">salle de jeux</a> que j’ai développée, et les <a href="/#realisations">démos</a> de cette page. Les démos sont des maquettes fictives, pas des projets clients.</p>
      </div>
      <aside class="about-side">${photo}<p class="about-name">Gabin Lescoat</p><p class="muted">Studio web indépendant · Bretagne</p>
        <div class="btn-row"><a class="btn btn-primary" href="/#contact">Me contacter ${icon('arrow')}</a></div></aside>
    </div></section>` + ctaBand();
  write('/a-propos/', shell({ path: '/a-propos/', title: 'À propos de StudioGLSC et de Gabin Lescoat', desc: 'StudioGLSC est le studio web indépendant de Gabin Lescoat : sites vitrines clairs et rapides pour artisans, commerçants et indépendants en Bretagne.', jsonld: [bc.ld, { '@type': 'AboutPage', name: 'À propos de StudioGLSC', url: ORIGIN + '/a-propos/', mainEntity: { '@type': 'Person', name: 'Gabin Lescoat', url: 'https://glsc.fr/', worksFor: orgRef } }], body, search: ['qui', 'gabin', 'lescoat', 'contact', 'studio'] }));
}

// ---------------------------------------------------------------- pages par métier
const metiersIndexLinks = METIERS.map((m) => [`/sites-pour/${m.slug}/`, `Site pour ${m.name.toLowerCase()}`, m.short]);
for (const m of METIERS) {
  const bc = crumbs([['Accueil', '/'], ['Sites par métier', '/sites-pour/'], [m.name, `/sites-pour/${m.slug}/`]]);
  const related = m.related.map((slug) => ARTICLES.find((a) => a.slug === slug) || METIERS.find((x) => x.slug === slug)).filter(Boolean)
    .map((x) => x.lead !== undefined && x.date ? [`/blog/${x.slug}/`, x.title, x.desc] : [`/sites-pour/${x.slug}/`, `Site pour ${x.name.toLowerCase()}`, x.short]);
  const body = pageHero({ bc: bc.html, eyebrow: `Site web · ${m.name}`, h1: m.title, lead: m.lead, extra: heroCtas }) + `
    <section class="section"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Côté client</p><h2>Ce que cherchent vos futurs clients</h2></div></div>
      <ul class="chips-list">${m.searches.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div></section>
    <section class="section band"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Le contenu</p><h2>Ce que votre site doit montrer</h2></div></div>
      <div class="pledge-grid">${m.must.map(([t, p]) => `<article class="pledge"><h3>${esc(t)}</h3><p>${esc(p)}</p></article>`).join('')}</div>
    </div></section>
    <section class="section"><div class="wrap two-col">
      <div><p class="eyebrow">Les pièges</p><h2>Ce qu’il vaut mieux éviter</h2><ul class="cross-list">${m.avoid.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
      <div><p class="eyebrow">Ma proposition</p><h2>Quelle formule choisir ?</h2><p class="muted">${esc(m.fit)}</p>${heroCtas}</div>
    </div></section>
    <section class="section band"><div class="wrap faq-layout">
      <div class="section-head"><div><p class="eyebrow">Questions fréquentes</p><h2>Avant de se lancer</h2></div></div>
      ${faqHtml(m.faq)}
    </div></section>
    <section class="section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">À lire aussi</p><h2>Pour aller plus loin</h2></div></div>${linkCards(related)}</div></section>` + ctaBand();
  write(`/sites-pour/${m.slug}/`, shell({ path: `/sites-pour/${m.slug}/`, title: m.title, desc: m.desc, jsonld: [bc.ld, faqLd(m.faq), { '@type': 'Service', name: m.title, serviceType: 'Création de site vitrine', provider: orgRef, areaServed: 'Bretagne', offers: { '@type': 'Offer', name: 'One-Page Express', price: '400', priceCurrency: 'EUR' } }], body, search: [m.name, m.short, 'site', 'web', 'devis'] }));
}
{
  const bc = crumbs([['Accueil', '/'], ['Sites par métier', '/sites-pour/']]);
  const body = pageHero({ bc: bc.html, eyebrow: 'Sites par métier', h1: 'Un site pensé pour votre activité', lead: 'Chaque métier a ses besoins : urgence, réservation, saisonnalité, confiance. Choisissez le vôtre pour voir ce qu’un site doit contenir.' }) + `<section class="section"><div class="wrap">${linkCards(metiersIndexLinks)}</div></section>` + ctaBand();
  write('/sites-pour/', shell({ path: '/sites-pour/', title: 'Sites vitrines par métier', desc: 'Sites vitrines pour artisans, commerçants, restaurateurs, professionnels de santé, salons de beauté et associations en Bretagne.', jsonld: [bc.ld], body, search: ['métier', 'activité', 'secteur'] }));
}

// ---------------------------------------------------------------- pages par ville
for (const v of VILLES) {
  const bc = crumbs([['Accueil', '/'], ['Création de site web', '/creation-site-web/'], [v.name, `/creation-site-web/${v.slug}/`]]);
  const common = [['Combien de temps faut-il pour avoir mon site ?', 'Pour la formule One-Page Express, la première version est présentée sous 48 h après réception des contenus et validation du périmètre. Les refontes et sites multi-pages sont chiffrés sur devis.'], ['Le site m’appartient-il ?', 'Oui. Au paiement intégral, vous devenez propriétaire de la conception graphique et du contenu créé pour vous, et les codes sources vous sont cédés. Aucun abonnement n’est imposé.']];
  const faq = [v.faq, ...common];
  const others = VILLES.filter((o) => o.slug !== v.slug);
  const body = pageHero({ bc: bc.html, eyebrow: `${v.name} · ${v.dept}`, h1: `Création de site web à ${v.name}`, lead: v.intro, extra: heroCtas }) + `
    <section class="section"><div class="wrap two-col">
      <div><p class="eyebrow">Pour qui</p><h2>Les activités que j’accompagne à ${esc(v.name)}</h2><ul class="ticks">${v.sectors.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><p class="eyebrow">Le contexte local</p><h2>Un site adapté à votre quartier</h2><p class="muted">${esc(v.local)}</p></div>
    </div></section>
    <section class="section band"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Tarifs</p><h2>Un prix clair, annoncé avant de commencer</h2></div><p>Le devis est gratuit et sans engagement. Les prix sont TTC (TVA non applicable).</p></div>
      <div class="pledge-grid four">
        <article class="pledge"><h3>One-Page Express</h3><p class="price-inline">550 €</p><p>Une page sur mesure, boutons d’appel et WhatsApp, première version en 48 h* après validation du contenu.</p></article>
        <article class="pledge"><h3>Refonte &amp; multi-pages</h3><p class="price-inline">Dès 750 €</p><p>Sur devis. Moderniser un ancien site ou présenter services, réalisations et tarifs sur plusieurs pages.</p></article>
        <article class="pledge"><h3>E-commerce</h3><p class="price-inline">Dès 950 €</p><p>Sur devis. Catalogue de produits, panier, commande et paiement en ligne sécurisé.</p></article>
        <article class="pledge"><h3>Abonnement Sérénité</h3><p class="price-inline">50 € / mois</p><p>Option, à ajouter à un site : hébergement sécurisé, SSL, sauvegardes et petites modifications. Ou 500 € par an.</p></article>
      </div>
      <p class="price-note">* Délai indicatif après réception des contenus et validation du périmètre.</p>
    </div></section>
    <section class="section"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Comment ça se passe</p><h2>Simple, par téléphone ou par écrit</h2></div><p>Je travaille avec vous par téléphone, WhatsApp ou e-mail, selon ce qui vous convient.</p></div>
      <div class="steps"><article class="step"><span class="step-num">01</span><h3>On fait le point</h3><p>Un premier échange gratuit pour comprendre votre activité et vos priorités.</p></article><article class="step"><span class="step-num">02</span><h3>Je vous envoie un devis</h3><p>Il précise le contenu, le budget, les délais et les conditions.</p></article><article class="step"><span class="step-num">03</span><h3>Je crée et on ajuste</h3><p>Vous découvrez la première version, vous me faites vos retours, puis nous préparons la mise en ligne.</p></article></div>
    </div></section>
    <section class="section band"><div class="wrap faq-layout"><div class="section-head"><div><p class="eyebrow">Questions fréquentes</p><h2>À ${esc(v.name)}, on me demande souvent</h2></div></div>${faqHtml(faq)}</div></section>
    <section class="section"><div class="wrap"><div class="section-head"><div><p class="eyebrow">Autres zones</p><h2>Je travaille dans toute la Bretagne</h2></div></div>
      <ul class="chips-list">${others.map((o) => `<li><a href="/creation-site-web/${o.slug}/">${esc(o.name)}</a></li>`).join('')}</ul>
      <p class="muted mt">Vous cherchez un site pour votre métier ? <a class="inline-link" href="/sites-pour/">Voir les sites par métier</a>.</p></div></section>` + ctaBand(`Un site pour votre activité à ${v.name} ?`);
  write(`/creation-site-web/${v.slug}/`, shell({ path: `/creation-site-web/${v.slug}/`, title: `Création de site web à ${v.name}`, desc: `StudioGLSC crée des sites vitrines et boutiques en ligne pour artisans, commerçants et indépendants à ${v.name}. One-Page Express 550 €, e-commerce dès 950 €.`, jsonld: [bc.ld, faqLd(faq), { ...orgRef, areaServed: { '@type': 'City', name: v.name, containedInPlace: { '@type': 'AdministrativeArea', name: v.dept } } }], body, search: [v.name, v.dept, 'ville', 'site', 'web'] }));
}
{
  const bc = crumbs([['Accueil', '/'], ['Création de site web', '/creation-site-web/']]);
  const body = pageHero({ bc: bc.html, eyebrow: 'En Bretagne', h1: 'Création de site web en Bretagne', lead: 'StudioGLSC crée des sites vitrines pour les artisans, commerçants et indépendants de Bretagne. Choisissez votre ville.' }) + `<section class="section"><div class="wrap">${linkCards(VILLES.map((v) => [`/creation-site-web/${v.slug}/`, `Site web à ${v.name}`, v.intro]))}</div></section>` + ctaBand();
  write('/creation-site-web/', shell({ path: '/creation-site-web/', title: 'Création de site web en Bretagne', desc: 'Sites vitrines pour artisans, commerçants et indépendants à Rennes, Lorient, Vannes, Quimper, Brest et Saint-Brieuc.', jsonld: [bc.ld], body, search: ['bretagne', 'ville', 'zone'] }));
}

// ---------------------------------------------------------------- blog
const readTime = (a) => Math.max(1, Math.round(words([a.lead, ...a.sections.flatMap((s) => [s.h, ...(s.p || []), ...(s.ul || [])])].join(' ')) / 200));
{
  const bc = crumbs([['Accueil', '/'], ['Blog', '/blog/']]);
  const body = pageHero({ bc: bc.html, eyebrow: 'Le blog', h1: 'Conseils pour votre site web', lead: 'Des explications simples pour les artisans, commerçants et indépendants : budget, contenu, mentions légales, vitesse.' }) + `<section class="section"><div class="wrap"><div class="link-grid">${ARTICLES.map((a) => `<a class="link-card" href="/blog/${a.slug}/"><span class="tag">${esc(a.tag)}</span><strong>${esc(a.title)}</strong><span>${esc(a.desc)}</span><span class="meta">${dateFr(a.date)} · ${readTime(a)} min de lecture</span></a>`).join('')}</div></div></section>` + ctaBand();
  write('/blog/', shell({ path: '/blog/', title: 'Blog : conseils pour votre site web', desc: 'Budget, contenu, mentions légales, vitesse : des conseils simples pour les artisans, commerçants et indépendants qui veulent un site efficace.', jsonld: [bc.ld, { '@type': 'Blog', name: 'Le blog de StudioGLSC', url: ORIGIN + '/blog/' }], body, search: ['blog', 'conseils', 'article'] }));
}
for (const a of ARTICLES) {
  const bc = crumbs([['Accueil', '/'], ['Blog', '/blog/'], [a.title, `/blog/${a.slug}/`]]);
  const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const toc = a.sections.length >= 4 ? `<nav class="toc-inline" aria-label="Sommaire"><p>Dans cet article</p><ol>${a.sections.map((s) => `<li><a href="#${slugify(s.h)}">${esc(s.h)}</a></li>`).join('')}</ol></nav>` : '';
  const relatedItems = a.related.map((slug) => METIERS.find((x) => x.slug === slug) ? (() => { const m = METIERS.find((x) => x.slug === slug); return [`/sites-pour/${m.slug}/`, `Site pour ${m.name.toLowerCase()}`, m.short]; })() : (() => { const o = ARTICLES.find((x) => x.slug === slug); return [`/blog/${o.slug}/`, o.title, o.desc]; })());
  const body = `
    <article class="section article"><div class="wrap narrow">
      ${bc.html}
      <p class="eyebrow">${esc(a.tag)}</p>
      <h1>${esc(a.title)}</h1>
      <p class="article-meta">${dateFr(a.date)} · ${readTime(a)} min de lecture · Par Gabin Lescoat</p>
      <p class="page-lead">${esc(a.lead)}</p>
      ${toc}
      <div class="prose">
        ${a.sections.map((s) => `<h2 id="${slugify(s.h)}">${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${esc(p)}</p>`).join('')}${s.ul ? `<ul class="ticks">${s.ul.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}`).join('\n        ')}
      </div>
    </div></article>
    <section class="section band"><div class="wrap"><div class="section-head"><div><p class="eyebrow">À lire aussi</p><h2>Pour aller plus loin</h2></div></div>${linkCards(relatedItems)}</div></section>` + ctaBand();
  write(`/blog/${a.slug}/`, shell({ path: `/blog/${a.slug}/`, title: a.title, desc: a.desc, type: 'article', jsonld: [bc.ld, { '@type': 'Article', headline: a.title, description: a.desc, datePublished: a.date, dateModified: a.date, inLanguage: 'fr-FR', author: { '@type': 'Person', name: 'Gabin Lescoat', url: 'https://glsc.fr/' }, publisher: orgRef, mainEntityOfPage: ORIGIN + `/blog/${a.slug}/`, image: ORIGIN + '/assets/img/og.png' }], body, search: [a.tag, a.title, 'article', 'conseil'] }));
}


const GPATH = readFileSync(join(ROOT, 'assets/favicon.svg'), 'utf8').split('<path d="')[1].split('"')[0];
const ZIP_SIZE = (() => { try { return Math.round(statSync(join(ROOT, 'assets/brand/studioglsc-kit-de-marque.zip')).size / 1024) + ' Ko'; } catch { return ''; } })();
const WORD_PATH = ''; // le logotype de la figure « zone de protection » est volontairement omis : seul le monogramme est coté
// ---------------------------------------------------------------- galerie des démos
{
  const bc = crumbs([['Accueil', '/'], ['Démos', '/demos/']]);
  const body = pageHero({ bc: bc.html, eyebrow: 'Démos interactives', h1: 'Six exemples de sites, à essayer vous-même', lead: 'Chaque démo est un site complet et fictif, avec sa propre identité et ses fonctions : carte, réservation, calendrier, billetterie, estimation. Elles montrent ce qu’un site peut faire pour votre métier.', extra: heroCtas }) + `
    <section class="section"><div class="wrap">
      <div class="project-grid">${DEMOS.map(demoCard).join('\n')}</div>
      <ul class="chips-list demo-notes"><li>Établissements, noms, prix et avis entièrement fictifs</li><li>Aucune donnée n’est envoyée : les formulaires sont simulés</li><li>Aucun service tiers : polices et visuels hébergés sur le site</li><li>Utilisables au clavier, sur mobile et avec réduction des animations</li></ul>
    </div></section>
    <section class="section band"><div class="wrap two-col">
      <div><p class="eyebrow">Et pour vous ?</p><h2>Une démo n’est pas votre site</h2><p class="muted">Ces pages servent à montrer le niveau de finition et les fonctions possibles. Votre site reprend votre identité, vos textes et vos vraies informations, avec uniquement ce qui sert votre activité.</p></div>
      <div><p class="eyebrow">Par métier</p><h2>Voir les sites par activité</h2><ul class="ticks">${DEMOS.map((d) => `<li>${esc(d.sector)} : ${esc(d.features.join(', ').toLowerCase())}</li>`).join('')}</ul>${heroCtas}</div>
    </div></section>` + ctaBand();
  write('/demos/', shell({ path: '/demos/', title: 'Démos de sites web par métier', desc: 'Six démos interactives de sites vitrines : restaurant, coiffeur, photographe, gîte, club, artisan du bâtiment. Carte, réservation, calendrier, billetterie, estimation.', jsonld: [bc.ld], body, search: ['démo', 'exemples', 'réalisations', 'restaurant', 'coiffeur', 'photographe', 'gîte', 'club', 'artisan'] }));
}

// ---------------------------------------------------------------- centre de marque (/marque/)
{
  const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
  const badge = (r) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA texte large' : 'à éviter');
  const COLORS = [
    ['Bleu StudioGLSC', '#2447D6', 'Couleur principale', 'Boutons, liens, monogramme, accents.', '#FFFFFF', 'main'],
    ['Bleu profond', '#1B37B0', 'Survol et états actifs', 'Quand un élément bleu est survolé ou pressé.', '#FFFFFF', ''],
    ['Bleu pâle', '#E9EEFE', 'Fond doux', 'Pastilles, icônes, zones mises en avant.', '#0B1220', ''],
    ['Encre', '#0B1220', 'Texte et fonds sombres', 'Titres, texte courant, scène de contact.', '#FFFFFF', ''],
    ['Gris texte', '#566074', 'Texte secondaire', 'Légendes, descriptions, informations discrètes.', '#FFFFFF', ''],
    ['Filet', '#E1E5ED', 'Séparateurs', 'Bordures de cartes, lignes, grilles.', '#0B1220', ''],
    ['Fond', '#F6F7F9', 'Arrière-plan de page', 'Fond général du site en thème clair.', '#0B1220', ''],
    ['Surface', '#FFFFFF', 'Cartes et formulaires', 'Éléments posés sur le fond.', '#0B1220', ''],
    ['Vert confirmation', '#107A57', 'Réussite et disponibilité', 'Validations, pastille « en ligne », WhatsApp.', '#FFFFFF', ''],
    ['Bleu clair', '#8AA4FF', 'Accent sur fond sombre', 'Remplace le bleu principal en thème sombre.', '#0A0F1C', 'dark'],
  ];
  const swatch = ([name, hex, role, use, on, kind]) => `<li class="bk-sw reveal"><button type="button" class="bk-sw-chip" data-copy="${hex}" data-copied="Couleur copiée" aria-label="Copier ${esc(name)} ${hex}"><span class="bk-sw-fill" data-bg="${hex}" data-fg="${on}"><b>${esc(name)}</b><span>Copier ${hex}</span></span></button><dl class="bk-sw-meta"><div><dt>HEX</dt><dd>${hex}</dd></div><div><dt>RVB</dt><dd>${rgb(hex)}</dd></div><div><dt>Rôle</dt><dd>${esc(role)}</dd></div></dl><p class="muted">${esc(use)}</p><p class="bk-ct">Texte ${on === '#FFFFFF' ? 'blanc' : 'sombre'} dessus : <b>${ratio(hex, on).toFixed(1)}:1</b> · ${badge(ratio(hex, on))}</p></li>`;
  const logoCards = [
    ['studioglsc-logo.svg', 'studioglsc-logo-2400.png', 'Logo horizontal', 'Fond clair', 'light'],
    ['studioglsc-logo-fond-sombre.svg', 'studioglsc-logo-fond-sombre-2400.png', 'Logo, fond sombre', 'Fond sombre', 'dark'],
    ['studioglsc-monogramme.svg', 'studioglsc-monogramme-1024.png', 'Monogramme', 'Réseaux, favicon, applications', 'light'],
    ['studioglsc-monogramme-blanc.svg', null, 'Monogramme blanc', 'Fond bleu ou photo sombre', 'blue'],
    ['studioglsc-lettre-bleu.svg', null, 'Lettre G seule', 'Très petits formats, tampon', 'light'],
    ['studioglsc-logo-noir.svg', null, 'Logo noir', 'Impression en une couleur', 'light'],
  ];
  const logoCard = ([svg, png, name, use, bg]) => `<li class="bk-logo reveal"><div class="bk-stage ${bg}" data-bg="${bg}"><img src="/assets/brand/${svg}" alt="${esc(name)}" loading="lazy"></div><div class="bk-logo-meta"><div><h3>${esc(name)}</h3><p class="muted">${esc(use)}</p></div><div class="bk-dl"><a href="/assets/brand/${svg}" download>SVG</a>${png ? `<a href="/assets/brand/${png}" download>PNG</a>` : ''}</div></div></li>`;
  const dos = [
    ['Garder les proportions', 'Le monogramme est un carré : on le redimensionne sans le déformer.', 'ok', ''],
    ['Laisser respirer', 'Une marge égale à la moitié de la hauteur du monogramme, au minimum.', 'ok', ''],
    ['Respecter les couleurs', 'Bleu et blanc, ou les variantes noir et blanc fournies.', 'ok', ''],
  ];
  const donts = [
    ['Étirer ou écraser', 'stretch'], ['Faire pivoter', 'rotate'], ['Changer les couleurs', 'recolor'], ['Ajouter une ombre ou un halo', 'shadow'], ['Mettre sur un fond chargé', 'busy'], ['Redessiner le G', 'redraw'],
  ];
  const tones = [
    ['Clair', 'On dit ce qu’on fait, avec des mots simples.', 'Nous mettons en œuvre une solution digitale omnicanale.', 'Je crée votre site et il fonctionne sur téléphone.'],
    ['Direct', 'Une phrase, une idée. Le prix et le délai d’abord.', 'Nos tarifs sont disponibles sur demande après étude.', 'One-Page Express : 550 €, première version en 48 h.'],
    ['Humain', 'On parle à une personne, pas à un « utilisateur ».', 'Les utilisateurs peuvent contacter notre équipe.', 'Vous m’écrivez, je vous réponds moi-même.'],
    ['Honnête', 'On n’invente ni références, ni garanties.', 'Plus de 500 clients satisfaits.', 'Studio indépendant, quelques projets, un suivi de près.'],
  ];
  const body = `
    <section class="brand-hero"><div class="wrap bk-hero-grid">
      <div>
        <p class="eyebrow">Centre de marque</p>
        <h1>Une identité simple, <span class="accent">reconnaissable en un coup d’œil.</span></h1>
        <p class="hero-lead">Logos, couleurs, typographie et règles d’usage de StudioGLSC. Tout ce qu’il faut pour représenter le studio avec cohérence : sur un site, une carte de visite, un réseau social ou un document partenaire.</p>
        <div class="btn-row"><a class="btn btn-primary" href="/assets/brand/studioglsc-kit-de-marque.zip" download>Télécharger le kit complet ${icon('arrow')}</a><a class="btn btn-secondary" href="#logo">Voir les logos</a></div>
        <p class="hero-note">Kit .zip : SVG, PNG, palette CSS et règles essentielles · ${ZIP_SIZE}</p>
      </div>
      <div class="bk-hero-art" aria-hidden="true">
        <div class="bk-orbit o1"></div><div class="bk-orbit o2"></div>
        <svg class="bk-hero-mark" viewBox="0 0 64 64"><rect class="bk-sq" width="64" height="64" rx="16" fill="#2447D6"/><path class="bk-g-draw" pathLength="1" d="${GPATH}" /></svg>
        <span class="bk-tag t1">#2447D6</span><span class="bk-tag t2">Inter Display 700</span><span class="bk-tag t3">rayon 25 %</span>
      </div>
    </div></section>

    <nav class="bk-nav" aria-label="Sections du centre de marque"><div class="wrap"><a href="#logo">Logo</a><a href="#zone">Construction</a><a href="#erreurs">À éviter</a><a href="#couleurs">Couleurs</a><a href="#typo">Typographie</a><a href="#interface">Interface</a><a href="#ton">Ton</a><a href="#reseaux">Réseaux</a><a href="#kit">Kit</a></div></nav>

    <section class="section" id="logo"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Le logo</p><h2>Un monogramme, un logotype, <span class="accent">six usages.</span></h2></div><p>Le G blanc sur carré bleu est la signature du studio. Choisissez la version qui convient au fond sur lequel elle sera posée.</p></div>
      <div class="bk-bg-switch" role="group" aria-label="Aperçu sur fond"><span>Aperçu sur fond :</span><button type="button" aria-pressed="false" data-bgset="light">Clair</button><button type="button" aria-pressed="false" data-bgset="dark">Sombre</button><button type="button" aria-pressed="false" data-bgset="blue">Bleu</button><button type="button" aria-pressed="false" data-bgset="check">Transparent</button><button type="button" aria-pressed="true" data-bgset="auto">Par défaut</button></div>
      <ul class="bk-logo-grid">${logoCards.map(logoCard).join('')}</ul>
    </div></section>

    <section class="section band" id="zone"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Construction</p><h2>Zone de protection et <span class="accent">taille minimale.</span></h2></div><p>Un logo se lit mieux quand il a de la place. Ces repères évitent qu’il soit collé à un texte, une image ou un bord.</p></div>
      <div class="bk-anatomy">
        <figure class="bk-fig reveal"><svg viewBox="0 0 520 300" role="img" aria-label="Zone de protection autour du logo : une demi-hauteur du monogramme de chaque côté"><rect class="bk-clear" x="30" y="30" width="460" height="240" rx="6"/><g transform="translate(110 118)"><rect width="64" height="64" rx="16" fill="#2447D6"/><path d="${GPATH}" fill="#fff"/><path d="${WORD_PATH}" fill="#0B1220" transform="translate(0 0)"/></g><g class="bk-dim"><path d="M30 150h80M410 150h80"/><path d="M270 30v88M270 182v88"/></g><text x="70" y="140" text-anchor="middle">½ h</text><text x="450" y="140" text-anchor="middle">½ h</text><text x="290" y="82">½ h</text><text x="290" y="238">½ h</text></svg><figcaption>Laissez autour du logo un espace libre égal à <b>la moitié de la hauteur du monogramme</b>.</figcaption></figure>
        <figure class="bk-fig reveal" data-d="120"><div class="bk-sizes"><div><img src="/assets/brand/studioglsc-monogramme.svg" alt="" width="24" height="24"><span>24 px</span></div><div><img src="/assets/brand/studioglsc-monogramme.svg" alt="" width="48" height="48"><span>48 px</span></div><div><img src="/assets/brand/studioglsc-monogramme.svg" alt="" width="96" height="96"><span>96 px</span></div><div class="wide"><img src="/assets/brand/studioglsc-logo.svg" alt="" width="120" height="28"><span>120 px</span></div></div><figcaption>Tailles minimales : <b>24 px</b> pour le monogramme, <b>120 px</b> de large pour le logo horizontal, <b>8 mm</b> à l’impression.</figcaption></figure>
      </div>
    </div></section>

    <section class="section" id="erreurs"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Bon usage</p><h2>Ce qu’il faut faire, <span class="accent">et éviter.</span></h2></div><p>Un logo déformé ou recoloré perd sa force. Voici les principales erreurs.</p></div>
      <ul class="bk-dos">${dos.map(([t, d]) => `<li class="bk-do reveal"><span class="bk-ico ok" aria-hidden="true">${icon('check')}</span><h3>${esc(t)}</h3><p class="muted">${esc(d)}</p></li>`).join('')}</ul>
      <ul class="bk-donts">${donts.map(([t, k], i) => `<li class="bk-dont reveal" data-d="${i * 60}"><div class="bk-bad ${k}"><img src="/assets/brand/studioglsc-monogramme.svg" alt="" width="72" height="72" loading="lazy"></div><p><span class="bk-ico no" aria-hidden="true">×</span> ${esc(t)}</p></li>`).join('')}</ul>
    </div></section>

    <section class="section band" id="couleurs"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Couleurs</p><h2>Bleu profond, blanc, <span class="accent">et rien de plus.</span></h2></div><p>Une palette sobre, pensée pour la lisibilité. Cliquez sur une couleur pour copier son code. Les rapports de contraste suivent les règles d’accessibilité WCAG.</p></div>
      <div class="bk-ratio reveal" aria-hidden="true"><span class="r1">Bleu 60 %</span><span class="r2">Blanc et fonds 30 %</span><span class="r3">Encre 10 %</span></div>
      <ul class="bk-sw-grid">${COLORS.map(swatch).join('')}</ul>
    </div></section>

    <section class="section" id="typo"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Typographie</p><h2>Inter, en deux <span class="accent">rôles.</span></h2></div><p>Inter Display 700 pour les titres, Inter 400, 500 et 600 pour les textes. Polices libres (licence SIL OFL), hébergées sur le site.</p></div>
      <div class="bk-type">
        <div class="bk-specimen reveal"><p class="bk-spec-label">Titres · Inter Display 700</p><p class="bk-spec-big" id="type-demo" contenteditable="true" spellcheck="false" role="textbox" aria-label="Modifier le texte d’essai" aria-multiline="false">Un site web à votre image.</p><p class="bk-hint">Cliquez sur le texte pour essayer le vôtre.</p><div class="bk-glyphs" aria-hidden="true">Aa Bb Cc Dd Ee Ff Gg 0123456789 € % &amp; ?</div></div>
        <div class="bk-scale reveal" data-d="100">
          <div><span class="bk-l">Titre 1</span><p class="s1">Un prix clair.</p></div>
          <div><span class="bk-l">Titre 2</span><p class="s2">Votre site vous appartient.</p></div>
          <div><span class="bk-l">Titre 3</span><p class="s3">Première version en 48 h</p></div>
          <div><span class="bk-l">Texte · Inter 400</span><p class="s4">Clair, rapide et pensé pour que vos clients trouvent facilement l’essentiel.</p></div>
          <div><span class="bk-l">Étiquette · Inter 600</span><p class="s5">Échange gratuit</p></div>
        </div>
      </div>
    </div></section>

    <section class="section band" id="interface"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Interface</p><h2>Les éléments, <span class="accent">tels qu’ils s’affichent.</span></h2></div><p>Ces composants sont ceux du site : coins arrondis généreux, ombres douces, un seul bleu pour guider l’œil.</p></div>
      <div class="bk-ui">
        <div class="bk-ui-card reveal"><p class="bk-spec-label">Boutons</p><div class="btn-row"><a class="btn btn-primary" href="#interface">Principal</a><a class="btn btn-secondary" href="#interface">Secondaire</a><a class="btn btn-wa" href="#interface">WhatsApp</a></div></div>
        <div class="bk-ui-card reveal" data-d="60"><p class="bk-spec-label">Pastille et badge</p><p class="pill"><i aria-hidden="true"></i> Studio web indépendant</p> <span class="badge">Recommandé</span></div>
        <div class="bk-ui-card reveal" data-d="120"><p class="bk-spec-label">Rayons</p><div class="bk-radii"><span data-r="10"></span><span data-r="16"></span><span data-r="24"></span><span data-r="999"></span></div><p class="muted">10 · 16 · 24 px · pastille</p></div>
        <div class="bk-ui-card reveal" data-d="180"><p class="bk-spec-label">Carte de service</p><article class="service"><span class="service-icon" aria-hidden="true">${icon('monitor')}</span><h3>Site vitrine</h3><p>Une présentation claire de votre activité.</p></article></div>
      </div>
    </div></section>

    <section class="section" id="ton"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Voix</p><h2>On parle comme on <span class="accent">travaille.</span></h2></div><p>Le ton de StudioGLSC est celui d’un indépendant : simple, précis et sincère. Quatre principes, avec un exemple pour chacun.</p></div>
      <ul class="bk-tone">${tones.map(([t, d, no, yes], i) => `<li class="bk-tone-card reveal" data-d="${i * 70}"><h3>${esc(t)}</h3><p class="muted">${esc(d)}</p><p class="bk-no"><span aria-hidden="true">×</span>${esc(no)}</p><p class="bk-yes"><span aria-hidden="true">✓</span>${esc(yes)}</p></li>`).join('')}</ul>
    </div></section>

    <section class="section band" id="reseaux"><div class="wrap">
      <div class="section-head"><div><p class="eyebrow">Réseaux et partage</p><h2>Prêt à publier, <span class="accent">à la bonne taille.</span></h2></div><p>Avatar carré, bannière et image de partage : chacun est livré aux dimensions des plateformes courantes.</p></div>
      <ul class="bk-social">
        <li class="reveal"><div class="bk-soc-img av"><img src="/assets/brand/studioglsc-avatar-1080.png" alt="Avatar StudioGLSC" width="180" height="180" loading="lazy"></div><h3>Avatar</h3><p class="muted">1080 × 1080 px. Le G reste dans la zone sûre quand la plateforme le recadre en rond.</p><div class="bk-dl"><a href="/assets/brand/studioglsc-avatar-1080.png" download>PNG</a></div></li>
        <li class="reveal" data-d="80"><div class="bk-soc-img wide"><img src="/assets/brand/studioglsc-banniere-1500x500.png" alt="Bannière StudioGLSC" width="300" height="100" loading="lazy"></div><h3>Bannière</h3><p class="muted">1500 × 500 px. LinkedIn, X, YouTube : recadrez selon la plateforme.</p><div class="bk-dl"><a href="/assets/brand/studioglsc-banniere-1500x500.png" download>PNG</a></div></li>
        <li class="reveal" data-d="160"><div class="bk-soc-img wide"><img src="/assets/img/og.png" alt="Image de partage StudioGLSC" width="300" height="158" loading="lazy"></div><h3>Image de partage</h3><p class="muted">1200 × 630 px. Affichée quand un lien du site est partagé.</p><div class="bk-dl"><a href="/assets/img/og.png" download>PNG</a></div></li>
      </ul>
      <div class="bk-boiler reveal">
        <div><h3>Présentation courte</h3><p id="boiler">StudioGLSC est le studio web indépendant de Gabin Lescoat, en Bretagne. Il crée des sites vitrines clairs et rapides pour les artisans, commerçants et indépendants : première version en 48 h, paiement ponctuel, et vous restez propriétaire de votre site.</p></div>
        <button type="button" class="btn btn-secondary" data-copy="StudioGLSC est le studio web indépendant de Gabin Lescoat, en Bretagne. Il crée des sites vitrines clairs et rapides pour les artisans, commerçants et indépendants : première version en 48 h, paiement ponctuel, et vous restez propriétaire de votre site." data-copied="Texte copié">Copier le texte</button>
      </div>
    </div></section>

    <section class="section" id="kit"><div class="wrap"><div class="bk-kit reveal">
      <div><p class="eyebrow">Le kit complet</p><h2>Tout dans <span class="accent">un seul fichier.</span></h2><p class="hero-lead">Logos en SVG et PNG, palette CSS, avatar, bannière, image de partage et rappel des règles. ${ZIP_SIZE}.</p><ul class="bk-contents"><li>10 logos vectoriels (SVG)</li><li>8 images (PNG)</li><li>Variables CSS de la palette</li><li>Mémo des règles d’usage</li></ul></div>
      <div class="bk-kit-cta"><a class="btn btn-primary btn-big" href="/assets/brand/studioglsc-kit-de-marque.zip" download>Télécharger le kit ${icon('arrow')}</a><p class="muted">Une question sur l’utilisation de la marque ? <a href="mailto:pro@glsc.fr?subject=Utilisation%20de%20la%20marque%20StudioGLSC">pro@glsc.fr</a></p></div>
    </div></div></section>` + ctaBand('Un projet de site web ?', 'Le premier échange est gratuit et sans engagement.');
  write('/marque/', shell({ path: '/marque/', title: 'Centre de marque : logo, couleurs, typographie', desc: 'Le kit de marque StudioGLSC : logos en SVG et PNG, palette de couleurs, typographie, règles d’usage et ton éditorial. Téléchargez le kit complet.', body, noindex: true, head: '  <link rel="stylesheet" href="/assets/brand.css">\n', scripts: '  <script src="/assets/brand.js" defer></script>\n' }));
}
// ---------------------------------------------------------------- plan du site, index de recherche
const fixed = [
  ['/', CFG.date, 'monthly', '1.0'], ['/cgu.html', '2026-09-30', 'yearly', '0.3'], ['/cgv.html', '2026-09-30', 'yearly', '0.3'], ['/mentions-legales.html', '2026-09-30', 'yearly', '0.3'],
];
const prio = (p) => (p === '/blog/' || p === '/sites-pour/' || p === '/creation-site-web/' || p === '/demos/' ? '0.7' : p.startsWith('/blog/') ? '0.6' : '0.8');
const urls = [...fixed.map(([p, d, f, pr]) => ({ p, d, f, pr })), ...registry.map((r) => ({ p: r.path, d: CFG.date, f: 'monthly', pr: prio(r.path) }))];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${ORIGIN}${u.p}</loc>\n    <lastmod>${u.d}</lastmod>\n    <changefreq>${u.f}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`).join('\n')}\n</urlset>\n`);
const searchable = [{ path: '/', title: 'Accueil', desc: 'Création de sites vitrines, forfaits, réalisations, contact', keywords: 'accueil tarifs devis contact offres' }, { path: '/#offres', title: 'Tarifs et forfaits', desc: 'One-Page Express 550 €, multi-pages dès 750 €, e-commerce dès 950 €, abonnement 50 €/mois', keywords: 'prix tarif forfait hébergement' }, { path: '/#contact', title: 'Demander un devis', desc: 'Le premier échange est gratuit', keywords: 'contact devis téléphone email' }, { path: '/mentions-legales.html', title: 'Mentions légales', desc: 'Éditeur, hébergeur, données personnelles', keywords: 'légal rgpd cookies' }, { path: '/cgv.html', title: 'Conditions générales de vente', desc: 'Prix, délais, rétractation, garanties', keywords: 'cgv conditions vente' }, ...registry];
mkdirSync(join(ROOT, 'assets'), { recursive: true });
writeFileSync(join(ROOT, 'assets/search-index.json'), JSON.stringify(searchable.map((r) => ({ u: r.path, t: r.title, d: r.desc, k: r.keywords }))));
console.log(`${registry.length} pages générées · plan du site : ${urls.length} adresses · index de recherche : ${searchable.length} entrées`);
