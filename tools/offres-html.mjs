// HTML des offres (accueil) généré depuis tools/content/offres.mjs : section #offres, estimateur, FAQ, choix du besoin du formulaire, données JSON-LD.
import { GAMMES, PACK, OPTIONS, SERENITE, PARRAINAGE, RATE_H, PAGES, PRODUITS, eur, T, packValue, packSaving } from './content/offres.mjs';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ic = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const li = (t) => `<li>${ic('check')}${esc(t)}</li>`;
const opt = (id) => OPTIONS.find((o) => o.id === id);
const priceTag = (g) => `<p class="price">${g.from ? '<small>dès</small> ' : ''}${eur(g.price)}</p>`;

export function offresSection() {
  const cards = GAMMES.map((g, i) => `
          <article class="price-card reveal${i === 0 ? '' : ''}" data-d="${i * 80}">
            <span class="badge">${esc(g.badge)}</span>
            <h3>${esc(g.name)}</h3>
            ${priceTag(g)}${g.quote ? '\n            <p class="price-quote">Sur devis</p>' : ''}
            <p class="price-desc">${esc(g.pitch)}</p>
            <ul class="check-list">${g.includes.map(li).join('')}</ul>
            ${g.quote ? `<a class="btn btn-secondary" href="#estimate" data-pick="${g.id}">${esc(g.cta)} ${ic('arrow')}</a>` : `<a class="btn btn-primary" href="#contact" data-choose="${esc(g.service)}">${esc(g.cta)} ${ic('arrow')}</a>`}
          </article>`).join('');
  const packLines = PACK.contains.map((id) => id === 'express' ? [GAMMES[0].name + ' · une page, 48 h*', GAMMES[0].price] : [opt(id).name, opt(id).price]);
  const pack = `
        <article class="pack reveal">
          <div class="pack-main">
            <span class="badge">${esc(PACK.badge)}</span>
            <h3>${esc(PACK.name)}</h3>
            <p class="pack-lead">${esc(PACK.pitch)}</p>
            <p class="pack-price"><strong>${eur(PACK.price)}</strong><span>au lieu de <s>${eur(packValue())}</s> · vous économisez ${eur(packSaving())}</span></p>
            <a class="btn btn-primary" href="#contact" data-choose="${esc(PACK.service)}">${esc(PACK.cta)} ${ic('arrow')}</a>
          </div>
          <ul class="pack-list" aria-label="Contenu du Pack Lancement">${packLines.map(([n, p]) => `<li>${ic('check')}<span>${esc(n)}</span><em>${eur(p)}</em></li>`).join('')}<li class="pack-total"><span>Valeur à l’unité</span><em>${eur(packValue())}</em></li></ul>
        </article>`;
  const options = `
        <div class="opts reveal">
          <div class="opts-head"><h3>Ajoutez ce qu’il vous faut</h3><p class="muted">Des options à la carte, pour compléter n’importe quel site StudioGLSC.</p></div>
          <ul class="opts-grid">${OPTIONS.map((o) => `<li><strong>${esc(o.name)}</strong><span class="opt-price">${eur(o.price)}</span><p class="muted">${esc(o.desc)}</p></li>`).join('')}</ul>
        </div>`;
  const plans = SERENITE.map((s, i) => `
          <article class="plan reveal${s.id === 'plus' ? ' featured' : ''}" data-d="${i * 80}">
            <span class="badge${s.id === 'plus' ? '' : ' flat'}">${esc(s.badge)}</span>
            <h4>Sérénité ${esc(s.name)}</h4>
            <p class="plan-price"><strong>${eur(s.month)}</strong><span> / mois</span></p>
            <p class="plan-year">ou ${eur(s.year)} / an · 2 mois offerts</p>
            <p class="muted">${esc(s.pitch)}</p>
            <ul class="check-list">${s.includes.map(li).join('')}</ul>
          </article>`).join('');
  const serenite = `
        <div class="serenite" id="serenite">
          <div class="section-sub reveal"><span class="badge flat">Option · à ajouter à un site</span><h3>Sérénité : votre site entre de bonnes mains</h3><p>Hébergement, sécurité et accompagnement au quotidien. L’abonnement se choisit en complément d’un site créé par StudioGLSC : il ne se souscrit pas seul. Sans engagement de durée, résiliable à tout moment.</p></div>
          <div class="plans">${plans}
          </div>
        </div>`;
  const parrain = `
        <article class="referral reveal">
          <div><span class="badge flat">Parrainage</span><h3>Un client content ? Faites-le savoir, on vous remercie.</h3><p>Vous recommandez StudioGLSC à un professionnel autour de vous : il bénéficie de ${eur(PARRAINAGE.filleul)} de remise sur la création de son site, et vous recevez ${eur(PARRAINAGE.parrain)} de crédit sur votre prochaine facture une fois son site payé.</p></div>
          <a class="btn btn-secondary" href="#contact" data-choose="Autre demande">Parrainer un proche ${ic('arrow')}</a>
        </article>`;
  // Comparateur
  const Y = '<td class="yes">' + ic('check') + '<span class="sr-only">Oui</span></td>', N = '<td class="no">' + ic('minus') + '<span class="sr-only">Non</span></td>';
  const row = (label, cells) => `<tr><th scope="row">${label}</th>${cells.map((c) => (c === true ? Y : c === false ? N : `<td>${c}</td>`)).join('')}</tr>`;
  const g = GAMMES;
  const compare = `
        <div class="compare reveal">
          <div class="compare-head"><h3>Comparer les formules</h3><p class="muted">Ce que comprend chaque formule, d’un coup d’œil.</p></div>
          <div class="table-wrap" tabindex="0" role="region" aria-label="Tableau comparatif des formules (défilable)">
            <table>
              <thead><tr><th scope="col"><span class="sr-only">Critère</span></th><th scope="col">${esc(g[0].name)}</th><th scope="col">${esc(PACK.name)}<small>le plus choisi</small></th><th scope="col">${esc(g[1].name)}</th><th scope="col">${esc(g[2].name)}</th></tr></thead>
              <tbody>
                ${row('Prix', [`<strong>${eur(g[0].price)}</strong>`, `<strong>${eur(PACK.price)}</strong>`, `<strong>Dès ${eur(g[1].price)}</strong><small>sur devis</small>`, `<strong>Dès ${eur(g[2].price)}</strong><small>sur devis</small>`])}
                ${row('Pages', ['Une page', 'Une page', 'De 2 à 10 pages', 'Boutique + pages'])}
                ${row('Première version en 48 h*', [true, true, 'Selon le devis', 'Selon le devis'])}
                ${row('Design sur mesure, mobile et ordinateur', [true, true, true, true])}
                ${row('Formulaire, boutons Appel direct et WhatsApp', [true, true, true, true])}
                ${row('Référencement local et vitesse de chargement', [false, true, true, true])}
                ${row('Fiche Google Business Profile', [false, true, true, false])}
                ${row('Kit réseaux sociaux', [false, true, false, false])}
                ${row('Retouche de vos photos', [false, '10 photos', true, false])}
                ${row('Catalogue, panier et paiement en ligne', [false, false, false, true])}
                ${row('Tours de retouches inclus', ['2', '2', '3', '3'])}
                ${row('Abonnement Sérénité (option)', ['Au choix', 'Au choix', 'Au choix', 'Au choix'])}
              </tbody>
            </table>
          </div>
        </div>`;
  // Estimateur : quatre étapes à gauche, résumé fixe à droite
  const seg = (name, list) => `<div class="seg">${list.map((t, i) => `<label class="choice"><input type="radio" name="${name}" value="${i}"${i === 0 ? ' checked' : ''}><span>${esc(t[2][0].toUpperCase() + t[2].slice(1))}</span></label>`).join('')}</div>`;
  const hide = { google: 'pack vitrine', reseaux: 'pack', photos: 'pack vitrine', page: 'express pack boutique' };
  const card = (v, name, price, sub, badge, checked) => `<label class="choice est-card"><input type="radio" name="est-site" value="${v}"${checked ? ' checked' : ''}><span>${badge ? `<em class="est-tag">${badge}</em>` : ''}<strong>${esc(name)}</strong><b>${price}</b><small>${esc(sub)}</small></span></label>`;
  const estimate = `
        <form class="estimate est reveal" id="estimate" aria-labelledby="estimate-title" onsubmit="return false">
          <div class="estimate-head"><span class="eyebrow">Estimation</span><h3 id="estimate-title">Combien ça coûte pour moi ?</h3><p class="muted">Composez votre projet : le total se met à jour tout de suite.</p></div>
          <div class="est-layout">
            <div class="est-steps">
              <fieldset class="est-step"><legend><i>1</i>Votre projet</legend>
                <div class="est-cards">
                  ${card('express', g[0].name, eur(g[0].price), 'Une page, première version en 48 h', '', true)}
                  ${card('pack', PACK.name, eur(PACK.price), 'Site + fiche Google + visuels', 'Le plus choisi', false)}
                  ${card('vitrine', g[1].name, 'dès ' + eur(g[1].price), 'Plusieurs pages, sur devis', '', false)}
                  ${card('boutique', g[2].name, 'dès ' + eur(g[2].price), 'Vendre en ligne, sur devis', '', false)}
                </div>
              </fieldset>
              <fieldset class="est-step est-sub" data-for="vitrine" hidden><legend><i>↳</i>Nombre de pages</legend>
                ${seg('est-pages', PAGES)}
              </fieldset>
              <fieldset class="est-step est-sub" data-for="boutique" hidden><legend><i>↳</i>Taille de la boutique</legend>
                ${seg('est-prod', PRODUITS)}
              </fieldset>
              <fieldset class="est-step"><legend><i>2</i>Options à la carte</legend>
                <div class="est-chips">
                  ${OPTIONS.map((o) => `<label class="choice est-chip" data-hide-for="${hide[o.id]}"><input type="checkbox" name="est-opt" value="${o.id}"><span>${esc(o.name)}<b>+ ${eur(o.price)}</b></span></label>`).join('\n                  ')}
                </div>
                <p class="est-none muted" hidden>Rien à ajouter ici : ces options sont déjà incluses dans votre formule.</p>
              </fieldset>
              <fieldset class="est-step"><legend><i>3</i>Abonnement Sérénité <small>(option)</small></legend>
                <div class="est-plans">
                  <label class="choice est-plan"><input type="radio" name="est-plan" value="none" checked><span><strong>Aucun</strong><small>Je gère l’hébergement</small></span></label>
                  ${SERENITE.map((s) => `<label class="choice est-plan"><input type="radio" name="est-plan" value="${s.id}"><span><strong>${esc(s.name)}</strong><small>${eur(s.month)} / mois</small></span></label>`).join('\n                  ')}
                </div>
                <fieldset class="est-bill" data-for-plan hidden><legend class="sr-only">Facturation de l’abonnement</legend>
                  <div class="seg">
                    <label class="choice"><input type="radio" name="est-bill" value="month" checked><span>Au mois</span></label>
                    <label class="choice"><input type="radio" name="est-bill" value="year"><span>À l’année · 2 mois offerts</span></label>
                  </div>
                </fieldset>
                <p class="estimate-hint">L’abonnement s’ajoute à un site : il ne se prend pas seul.</p>
              </fieldset>
              <fieldset class="est-step"><legend><i>4</i>Parrainage</legend>
                <label class="choice est-ref"><input type="checkbox" name="est-ref"><span><strong>Un client StudioGLSC m’a recommandé</strong><small>− ${eur(PARRAINAGE.filleul)} sur la création de mon site</small></span></label>
              </fieldset>
            </div>
            <aside class="est-sum estimate-result" aria-live="polite">
              <p class="estimate-label" id="est-label">Votre première année</p>
              <p class="estimate-total" id="est-total">${eur(g[0].price)}</p>
              <ul class="estimate-lines" id="est-lines"></ul>
              <p class="estimate-note" id="est-note">Prix TTC : TVA non applicable (franchise en base, article 293 B du CGI). Estimation indicative, le devis fait foi.</p>
              <button type="button" class="btn btn-primary" id="est-cta">Demander ce devis ${ic('arrow')}</button>
              <p class="est-reassure">Devis gratuit, sans engagement</p>
            </aside>
          </div>
        </form>`;
  return `<!--@offres:start-->
    <section id="offres" class="section band">
      <div class="wrap">
        <div class="section-head reveal"><div><p class="eyebrow">Des offres sans engagement imposé</p><h2>Un prix clair.<br>Votre site vous appartient.</h2></div><p>Un site pour démarrer, un pack pour être trouvé dès le premier jour, un site complet ou une boutique. L’abonnement et les options restent un choix, jamais une obligation.</p></div>
        <p class="pricing-label reveal">Pour démarrer · tout en un</p>${pack}
        <p class="pricing-label reveal">Création du site · paiement ponctuel</p>
        <div class="price-grid">${cards}
        </div>${options}
        <p class="pricing-label reveal">Après la mise en ligne · abonnement</p>${serenite}${parrain}${compare}${estimate}
        <div class="timeline reveal" aria-label="Les étapes de livraison en 48 heures">
          <div class="timeline-step"><strong>Nous cadrons le projet</strong><span>Vous m’envoyez les textes, photos et informations ; nous validons ensemble le périmètre.</span></div>
          <div class="timeline-step"><strong>Je crée la page</strong><span>Les 48 heures démarrent quand tous les éléments sont reçus et le projet cadré.</span></div>
          <div class="timeline-step"><strong>Vous découvrez le site</strong><span>Je vous présente la première version dans ce délai pour recueillir vos retours.</span></div>
        </div>
        <p class="price-note reveal">* Délai indicatif après réception des contenus et validation du périmètre, pour les formules Express et Pack Lancement. La mise en ligne est préparée avec vous après validation du rendu. Les abonnements Sérénité sont des options, à ajouter à un site ; aucun abonnement n’est imposé pour la création. Les modifications hors forfait sont facturées ${eur(RATE_H)} de l’heure. Les projets Vitrine et Boutique sont chiffrés sur devis, à partir de ${eur(GAMMES[1].price)} et de ${eur(GAMMES[2].price)}. Prix TTC, TVA non applicable (art. 293 B du CGI).</p>
      </div>
    </section>
    <!--@offres:end-->`;
}

export function faqItems() {
  const s = SERENITE;
  return [
    [`Que comprend la formule Express à ${T.express} ?`, 'Une page conçue sur mesure pour présenter votre activité, ses informations essentielles et des moyens de contact directs (appel, WhatsApp, formulaire). Le périmètre précis est confirmé ensemble avant de commencer.'],
    [`Qu’est-ce que le Pack Lancement à ${T.pack} ?`, `Votre site Express, votre fiche Google Business Profile optimisée, un kit réseaux sociaux (avatar, bannière, trois visuels) et la retouche de 10 photos, en un seul achat. Pris séparément, cela fait ${T.packValue} : vous économisez ${T.packSaving}.`],
    ['Quand commencent les 48 heures ?', 'Après réception des textes, photos et informations nécessaires, et une fois le périmètre du projet validé. Le délai annoncé concerne la présentation de la première version des formules Express et Pack Lancement.'],
    ['Est-ce que le site m’appartient ?', `Oui. La création n’impose pas d’abonnement. Vous pouvez choisir un abonnement Sérénité (de ${T.sMin} à ${eur(s[2].month)} par mois), ou organiser l’hébergement séparément.`],
    ['Qu’est-ce que je dois fournir ?', 'Les textes, vos coordonnées, les photos que vous souhaitez utiliser et les informations sur vos services. Nous faisons le point ensemble avant le démarrage.'],
    ['Proposez-vous des boutiques en ligne ?', `Oui. La formule Boutique démarre à ${T.boutique} sur devis : catalogue de produits, panier, commande et paiement en ligne. Le prix dépend du nombre de produits et des options ; le devis le précise avant tout démarrage.`],
    ['Quelle différence entre les trois abonnements Sérénité ?', `Essentiel (${eur(s[0].month)} / mois) garde votre site en ligne, sécurisé et sauvegardé. Plus (${eur(s[1].month)} / mois) ajoute 1 h de modifications par mois et un rapport de visites. Croissance (${eur(s[2].month)} / mois) ajoute 3 h de modifications par mois, une page ou un article par trimestre et un suivi du référencement local. Payés à l’année, ils offrent deux mois.`],
    ['Puis-je prendre uniquement l’abonnement ?', 'Non : les abonnements Sérénité sont des options qui s’ajoutent à un site créé par StudioGLSC. Ils se résilient à tout moment.'],
    ['Comment fonctionne le parrainage ?', `Si vous recommandez StudioGLSC à un professionnel, il bénéficie de ${T.filleul} de remise sur la création de son site. Une fois son site payé, vous recevez ${T.parrain} de crédit sur votre prochaine facture (jusqu’à ${PARRAINAGE.max} parrainages).`],
    ['Comment demander un devis pour un projet plus complet ?', 'Décrivez votre besoin dans le formulaire de contact. Pour une vitrine de plusieurs pages ou une boutique en ligne, le contenu et le prix sont précisés dans un devis avant tout démarrage.'],
  ];
}
export const faqHtml = () => `<!--@faq:start-->
          ${faqItems().map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n          ')}
          <!--@faq:end-->`;

export const formServices = () => `<!--@services:start-->
              <div class="choice-grid one">
                <label class="choice"><input type="radio" name="service" value="Express" required><span><strong>Express</strong><small>Une page, ${T.express}</small></span></label>
                <label class="choice"><input type="radio" name="service" value="Pack Lancement"><span><strong>Pack Lancement</strong><small>Site + fiche Google + visuels, ${T.pack}</small></span></label>
                <label class="choice"><input type="radio" name="service" value="Vitrine"><span><strong>Vitrine</strong><small>Refonte ou plusieurs pages, dès ${T.vitrine}, sur devis</small></span></label>
                <label class="choice"><input type="radio" name="service" value="Boutique en ligne"><span><strong>Boutique en ligne</strong><small>Dès ${T.boutique}, sur devis</small></span></label>
                <label class="choice"><input type="radio" name="service" value="Abonnement Sérénité"><span><strong>Abonnement Sérénité (avec un site)</strong><small>De ${T.sMin} à ${eur(SERENITE[2].month)} / mois</small></span></label>
                <label class="choice"><input type="radio" name="service" value="Autre demande"><span><strong>Autre demande</strong><small>On en parle, parrainage compris</small></span></label>
              </div>
              <!--@services:end-->`;

export const jsonldOffers = () => `"makesOffer": [
      { "@type": "Offer", "name": "Express", "price": "${GAMMES[0].price}", "priceCurrency": "EUR", "description": "Site d’une page conçu sur mesure, première version sous 48 h après validation du contenu." },
      { "@type": "Offer", "name": "Pack Lancement", "price": "${PACK.price}", "priceCurrency": "EUR", "description": "Site Express, fiche Google Business Profile, kit réseaux sociaux et retouche de 10 photos." },
      { "@type": "Offer", "name": "Site vitrine multi-pages", "priceSpecification": { "@type": "PriceSpecification", "minPrice": "${GAMMES[1].price}", "priceCurrency": "EUR" }, "description": "Sur devis, à partir de ${eur(GAMMES[1].price)}." },
      { "@type": "Offer", "name": "Boutique en ligne", "priceSpecification": { "@type": "PriceSpecification", "minPrice": "${GAMMES[2].price}", "priceCurrency": "EUR" }, "description": "Catalogue, panier et paiement en ligne. Sur devis, à partir de ${eur(GAMMES[2].price)}." },
      { "@type": "Offer", "name": "Abonnement Sérénité", "priceSpecification": { "@type": "PriceSpecification", "minPrice": "${SERENITE[0].month}", "priceCurrency": "EUR", "unitText": "MON" }, "description": "Option, en complément d’un site créé par StudioGLSC : hébergement sécurisé, SSL, sauvegardes, puis modifications et suivi. De ${eur(SERENITE[0].month)} à ${eur(SERENITE[2].month)} par mois." }
    ]`;

// ---- CGV : articles 3 (prestations et prix) et 10 (abonnements) générés depuis les mêmes données
const nb = (s) => String(s).replace(/\u00a0/g, '&nbsp;');
const e = (n) => nb(eur(n));
export function cgvPrestations() {
  const g = GAMMES;
  const rows = [
    [`<strong>${g[0].name}</strong>`, 'Une page : présentation de l\'activité, coordonnées, formulaire de contact relié à la messagerie du client, boutons d\'appel et de messagerie instantanée, design sur mesure adapté au mobile et à l\'ordinateur, deux tours de retouches.', `${e(g[0].price)}<br><span class="art">forfait, TVA non applicable</span>`],
    [`<strong>${PACK.name}</strong>`, `Site ${g[0].name} (une page) et trois options&nbsp;: fiche Google Business Profile optimisée, kit réseaux sociaux (avatar, bannière, trois visuels) et retouche de 10 photos. Deux tours de retouches.`, `${e(PACK.price)}<br><span class="art">forfait, au lieu de ${e(packValue())} à l'unité</span>`],
    [`<strong>${g[1].name}</strong>`, 'Refonte d\'un site existant ou création d\'un site de plusieurs pages (jusqu\'à 10)&nbsp;: pages Services, Réalisations, Tarifs, optimisation du référencement local et de la vitesse de chargement, fiche Google Business Profile optimisée, retouche des photos fournies, trois tours de retouches.', `À partir de ${e(g[1].price)}<br><span class="art">sur devis</span>`],
    [`<strong>${g[2].name}</strong>`, 'Création d\'une boutique en ligne&nbsp;: catalogue de produits, panier, commande et paiement en ligne sécurisé, pages produits adaptées au mobile, saisie des 10 premiers produits, prise en main, trois tours de retouches. Le nombre de produits et les options sont précisés au devis.', `À partir de ${e(g[2].price)}<br><span class="art">sur devis</span>`],
  ];
  const optRows = OPTIONS.map((o) => `<tr><td><strong>${o.name}</strong></td><td>${o.desc}</td><td>${e(o.price)}</td></tr>`).join('\n              ');
  return `<!--@cgv-prestations:start-->
          <table>
            <thead>
              <tr><th>Offre</th><th>Contenu</th><th>Prix</th></tr>
            </thead>
            <tbody>
              ${rows.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
          <h3>3.1. Options à la carte</h3>
          <p>Les options suivantes peuvent être ajoutées à un site créé par StudioGLSC, à l'unité et sur devis ou par simple e-mail&nbsp;:</p>
          <table>
            <thead>
              <tr><th>Option</th><th>Contenu</th><th>Prix</th></tr>
            </thead>
            <tbody>
              ${optRows}
            </tbody>
          </table>
          <h3>3.2. Abonnements Sérénité</h3>
          <p>Les abonnements Sérénité sont décrits à l'article 10. Trois formules sont proposées&nbsp;: ${SERENITE.map((s) => `${s.name} (${e(s.month)}/mois ou ${e(s.year)}/an)`).join(', ')}.</p>
          <h3>3.3. Parrainage</h3>
          <p>Un client de StudioGLSC qui recommande les services à un professionnel (le «&nbsp;filleul&nbsp;») fait bénéficier ce dernier d'une remise de ${e(PARRAINAGE.filleul)} sur le prix de création de son site. Une fois le site du filleul intégralement payé, le client à l'origine de la recommandation (le «&nbsp;parrain&nbsp;») reçoit un crédit de ${e(PARRAINAGE.parrain)}, déduit de sa prochaine facture. Conditions&nbsp;: le filleul doit nommer son parrain avant la validation du devis&nbsp;; la remise et le crédit ne sont ni cumulables avec une autre remise, ni remboursables en espèces&nbsp;; un même client peut bénéficier de ${PARRAINAGE.max} crédits de parrainage au maximum&nbsp;; le parrain et le filleul doivent être deux personnes distinctes, sans lien d'intérêt direct.</p>
          <div class="legal-note">
            <p><strong>Bon à savoir.</strong> Les abonnements sont des options au choix du client&nbsp;: la création d'un site n'impose aucun abonnement, et un abonnement ne peut pas être souscrit seul, mais uniquement en complément d'un site créé par StudioGLSC. Pour les offres «&nbsp;${g[1].name}&nbsp;» et «&nbsp;${g[2].name}&nbsp;», les montants indiqués sont des prix de départ&nbsp;: le prix définitif est fixé par le devis. Le délai de 48&nbsp;h, applicable aux formules ${g[0].name} et ${PACK.name}, est précisé à l'article 6 des présentes conditions.</p>
            <p><strong>Boutique en ligne.</strong> Pour l'offre «&nbsp;${g[2].name}&nbsp;», le client reste l'éditeur de sa boutique et le vendeur de ses produits&nbsp;: il lui appartient de rédiger ses propres conditions générales de vente et mentions légales, et de respecter ses obligations de vendeur à distance. StudioGLSC fournit l'outil et peut conseiller le client, sans se substituer à lui.</p>
          </div>
          <!--@cgv-prestations:end-->`;
}
export function cgvSerenite() {
  const rows = SERENITE.map((s) => `<tr><td><strong>Sérénité ${s.name}</strong></td><td>${s.includes.join('<br>')}</td><td>${e(s.month)}/mois<br>ou ${e(s.year)}/an</td></tr>`).join('\n              ');
  return `<!--@cgv-serenite:start-->
          <p>Les abonnements Sérénité sont des options facultatives, sans engagement de durée, qui se souscrivent en complément d'un site créé par StudioGLSC et non de façon isolée. Chaque formule comprend l'hébergement du site, le certificat SSL et les sauvegardes régulières&nbsp;; les formules Plus et Croissance y ajoutent des heures de modifications et un accompagnement, selon le tableau ci-dessous.</p>
          <table>
            <thead>
              <tr><th>Formule</th><th>Contenu</th><th>Prix</th></tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <ul>
            <li><strong>Durée</strong>&nbsp;: renouvellement mensuel, ou paiement annuel avec deux mois offerts (soit 10 mois facturés pour 12).</li>
            <li><strong>Heures de modifications</strong>&nbsp;: les heures incluses (1&nbsp;h pour Plus, 3&nbsp;h pour Croissance) sont valables pour le mois en cours et ne sont ni reportables ni remboursables. Toute heure supplémentaire, et toute modification avec la formule Essentiel, est facturée ${e(RATE_H)} de l'heure après accord du client.</li>
            <li><strong>Délai de réponse</strong>&nbsp;: sous 24&nbsp;heures ouvrées pour les formules Plus et Croissance&nbsp;; sans délai garanti pour la formule Essentiel.</li>
            <li><strong>Changement de formule</strong>&nbsp;: à tout moment, pour la période suivante, par e-mail.</li>
            <li><strong>Résiliation</strong>&nbsp;: à tout moment, par e-mail, sans frais et sans délai de préavis, au terme de la période déjà payée.</li>
            <li><strong>Remboursement</strong>&nbsp;: la période payée non consommée est remboursée au prorata sur demande écrite.</li>
            <li><strong>Perte de données</strong>&nbsp;: la responsabilité de StudioGLSC est limitée à la restauration de la dernière sauvegarde disponible à la date de l'incident. Il appartient au client de conserver ses propres copies de ses contenus.</li>
            <li><strong>Suspension</strong>&nbsp;: en cas de non-paiement, le site peut être suspendu après mise en demeure restée sans effet pendant 8 jours.</li>
          </ul>
          <!--@cgv-serenite:end-->`;
}
