// Génère les pages de contenu du site (à propos, pages par métier et par ville, blog), le plan du site et l'index de recherche.
// Le gabarit (en-tête, pied de page, icônes) est lu dans index.html : on ne le maintient qu'à un seul endroit.
//   node tools/build-site.mjs
// Contenu : tools/content/*.mjs · réglages : tools/site.config.json
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { METIERS } from './content/metiers.mjs';
import { VILLES } from './content/villes.mjs';
import { ARTICLES } from './content/blog.mjs';

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
        <div><p class="footer-col-title">Ressources</p><ul><li><a href="/blog/">Le blog</a></li>${ARTICLES.slice(0, 3).map((a) => `<li><a href="/blog/${a.slug}/">${esc(a.title)}</a></li>`).join('')}<li><a href="/a-propos/">À propos</a></li></ul></div>
      </div>
      <!--@footer-cols:end-->`;
if (index.includes('<!--@footer-cols:start-->')) index = index.replace(/<!--@footer-cols:start-->[\s\S]*?<!--@footer-cols:end-->/, cols);
else index = index.replace('<p class="footer-status">', cols + '\n      <p class="footer-status">');
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
function shell({ path, title, desc, type = 'website', jsonld = [], body, noindex = false, search = [] }) {
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
  <script src="/assets/theme-init.js"></script>
${ld}
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
</body>
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
  const photo = existsSync(join(ROOT, 'assets/img/gabin.webp')) ? '<img class="about-photo" src="/assets/img/gabin.webp" width="480" height="480" alt="Portrait de Gabin Lescoat" loading="lazy">' : '<div class="about-photo about-monogram" aria-hidden="true">G</div>';
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
          <li><strong>Un site qui vous appartient.</strong> Pas d’abonnement imposé : l’hébergement est une option que vous pouvez résilier à tout moment.</li>
          <li><strong>Des échanges simples.</strong> Par téléphone, WhatsApp ou e-mail, selon ce qui vous convient.</li>
        </ul>
        <h2>Ce que je ne fais pas</h2>
        <p>Je ne propose pas de boutique en ligne pour le moment. Si votre projet en a besoin, je vous le dis honnêtement dès le premier échange plutôt que de promettre ce que je ne maîtrise pas.</p>
        <h2>Pour juger sur pièces</h2>
        <p>Vous pouvez voir mon travail : mon <a href="https://glsc.fr" rel="noopener">portfolio</a>, mes <a href="https://github.com/gabinlsc" rel="noopener">projets sur GitHub</a>, la <a href="https://games.glsc.fr" rel="noopener">salle de jeux</a> que j’ai développée, et les <a href="/#realisations">démos</a> de cette page. Les deux concepts démo sont des maquettes, pas des projets clients.</p>
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
      <div class="pledge-grid three">
        <article class="pledge"><h3>One-Page Express</h3><p class="price-inline">400 €</p><p>Une page sur mesure, boutons d’appel et WhatsApp, première version en 48 h* après validation du contenu.</p></article>
        <article class="pledge"><h3>Refonte &amp; multi-pages</h3><p class="price-inline">Sur devis</p><p>Moderniser un ancien site ou présenter services, réalisations et tarifs sur plusieurs pages.</p></article>
        <article class="pledge"><h3>Sérénité &amp; Hébergement</h3><p class="price-inline">30 € / mois</p><p>Option facultative : hébergement sécurisé, SSL, sauvegardes et petites modifications. Ou 300 € par an.</p></article>
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
  write(`/creation-site-web/${v.slug}/`, shell({ path: `/creation-site-web/${v.slug}/`, title: `Création de site web à ${v.name}`, desc: `StudioGLSC crée des sites vitrines rapides et adaptés au mobile pour artisans, commerçants et indépendants à ${v.name} (${v.dept}). One-Page Express à 400 €.`, jsonld: [bc.ld, faqLd(faq), { ...orgRef, areaServed: { '@type': 'City', name: v.name, containedInPlace: { '@type': 'AdministrativeArea', name: v.dept } } }], body, search: [v.name, v.dept, 'ville', 'site', 'web'] }));
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

// ---------------------------------------------------------------- plan du site, index de recherche
const fixed = [
  ['/', CFG.date, 'monthly', '1.0'], ['/cgu.html', '2026-09-30', 'yearly', '0.3'], ['/cgv.html', '2026-09-30', 'yearly', '0.3'], ['/mentions-legales.html', '2026-09-30', 'yearly', '0.3'],
];
const prio = (p) => (p === '/blog/' || p === '/sites-pour/' || p === '/creation-site-web/' ? '0.7' : p.startsWith('/blog/') ? '0.6' : '0.8');
const urls = [...fixed.map(([p, d, f, pr]) => ({ p, d, f, pr })), ...registry.map((r) => ({ p: r.path, d: CFG.date, f: 'monthly', pr: prio(r.path) }))];
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url>\n    <loc>${ORIGIN}${u.p}</loc>\n    <lastmod>${u.d}</lastmod>\n    <changefreq>${u.f}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`).join('\n')}\n</urlset>\n`);
const searchable = [{ path: '/', title: 'Accueil', desc: 'Création de sites vitrines, forfaits, réalisations, contact', keywords: 'accueil tarifs devis contact offres' }, { path: '/#offres', title: 'Tarifs et forfaits', desc: 'One-Page Express 400 €, refonte sur devis, hébergement', keywords: 'prix tarif forfait hébergement' }, { path: '/#contact', title: 'Demander un devis', desc: 'Le premier échange est gratuit', keywords: 'contact devis téléphone email' }, { path: '/mentions-legales.html', title: 'Mentions légales', desc: 'Éditeur, hébergeur, données personnelles', keywords: 'légal rgpd cookies' }, { path: '/cgv.html', title: 'Conditions générales de vente', desc: 'Prix, délais, rétractation, garanties', keywords: 'cgv conditions vente' }, ...registry];
mkdirSync(join(ROOT, 'assets'), { recursive: true });
writeFileSync(join(ROOT, 'assets/search-index.json'), JSON.stringify(searchable.map((r) => ({ u: r.path, t: r.title, d: r.desc, k: r.keywords }))));
console.log(`${registry.length} pages générées · plan du site : ${urls.length} adresses · index de recherche : ${searchable.length} entrées`);
