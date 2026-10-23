// Pages par ville : chacune a son propre contexte local. Le studio est en Bretagne ; les échanges se font par
// téléphone, WhatsApp ou e-mail (rien n'est promis sur des déplacements).
export const VILLES = [
  {
    slug: 'rennes', name: 'Rennes', dept: 'Ille-et-Vilaine',
    intro: 'Rennes concentre commerces de centre-ville, artisans de la métropole, professions libérales et une vie étudiante qui alimente cafés, librairies et services du quotidien.',
    sectors: ['Commerces du centre-ville et des quartiers', 'Artisans de la métropole rennaise', 'Professions libérales et cabinets', 'Cafés, restaurants et traiteurs'],
    local: 'Dans une grande ville, la concurrence en ligne est plus dense : un site clair, rapide et bien référencé localement fait la différence face à des dizaines d’acteurs voisins. Une page qui indique votre quartier, vos horaires et un moyen de vous joindre en un geste répond à ce que cherchent les habitants et les étudiants qui découvrent la ville.',
    faq: ['Mon activité est dans la métropole rennaise, pas en centre-ville : est-ce pris en compte ?', 'Oui. Le site mentionne les communes que vous desservez, ce qui aide aussi les recherches du type « votre métier + commune ».'],
  },
  {
    slug: 'lorient', name: 'Lorient', dept: 'Morbihan',
    intro: 'Lorient vit au rythme de sa rade, de son port et de ses événements : le Festival Interceltique en été, la Cité de la voile, une vie nocturne et des artisans très présents sur le bassin.',
    sectors: ['Artisans du bâtiment du pays de Lorient', 'Restauration et tourisme autour de la rade', 'Commerces de proximité', 'Vie nocturne et événements'],
    local: 'Avec une activité très marquée par les saisons et les événements, un site qui affiche clairement les périodes d’ouverture et les horaires évite des appels inutiles. Mes deux concepts démo, Club56 pour la vie nocturne et Breizh Étanchéité pour un artisan du Morbihan, ont été imaginés pour des activités comme celles du bassin lorientais ; ce sont des maquettes, pas des projets clients.',
    faq: ['Mon activité est saisonnière : comment est-ce géré ?', 'On prévoit un encart de dates d’ouverture et un message clair hors saison. Les mises à jour sont faites sur demande, ou incluses dans les abonnements Sérénité Plus et Croissance (heures de modifications chaque mois).'],
  },
  {
    slug: 'vannes', name: 'Vannes', dept: 'Morbihan',
    intro: 'Vannes allie un centre historique très fréquenté, le golfe du Morbihan et une économie portée par le tourisme, la restauration et les métiers du bâtiment.',
    sectors: ['Restaurants et crêperies du centre historique', 'Hébergements et locations saisonnières', 'Artisans et entreprises du bâtiment', 'Commerces de proximité'],
    local: 'Une grande part de la clientèle est de passage ou en vacances : elle cherche d’abord ce qui est ouvert, près d’elle, maintenant. Un site qui donne l’adresse, les horaires et un bouton d’itinéraire sur mobile est ici plus utile qu’un long discours.',
    faq: ['Ma clientèle est surtout touristique, quelle différence pour le site ?', 'On met en avant les informations pratiques (ouverture, accès, langues parlées si besoin) et un chargement très rapide sur mobile.'],
  },
  {
    slug: 'quimper', name: 'Quimper', dept: 'Finistère',
    intro: 'Quimper, capitale de la Cornouaille, mêle centre historique commerçant, artisanat, faïence et un grand rendez-vous estival avec le Festival de Cornouaille.',
    sectors: ['Commerçants du centre historique', 'Artisans d’art et créateurs', 'Restauration et crêperies', 'Associations culturelles et clubs'],
    local: 'Les commerçants et artisans d’art gagnent à montrer leur savoir-faire en photo : un site qui raconte une fabrication ou un produit donne envie de pousser la porte. Pour les associations, un calendrier lisible des activités et des événements fait gagner du temps à tous.',
    faq: ['Je suis créateur ou artisan d’art : puis-je présenter mes pièces ?', 'Oui, avec une sélection de photos de qualité. Si vous souhaitez vendre en ligne, la formule Boutique (dès {{boutique}}, sur devis) ajoute catalogue, panier et paiement sécurisé.'],
  },
  {
    slug: 'brest', name: 'Brest', dept: 'Finistère',
    intro: 'Brest, tournée vers sa rade, regroupe commerces, services, artisans et activités liées à la mer, au port et à l’enseignement supérieur.',
    sectors: ['Artisans et entreprises de service de la métropole', 'Commerces de quartier', 'Activités liées à la mer et au nautisme', 'Restauration et cafés'],
    local: 'Dans une agglomération étendue, préciser sa zone d’intervention est essentiel : les internautes cherchent « près de chez moi ». Un site qui liste les quartiers et communes desservis, avec un téléphone cliquable, répond à ce réflexe. Pour les activités nautiques, une page claire sur les périodes, les tarifs et les conditions de réservation évite les mauvaises surprises.',
    faq: ['Mon activité est liée au nautisme, quelles informations mettre ?', 'Périodes d’activité, tarifs, matériel fourni, conditions météo et modalités de réservation : tout ce qui évite un appel pour une question simple.'],
  },
  {
    slug: 'saint-brieuc', name: 'Saint-Brieuc', dept: 'Côtes-d’Armor',
    intro: 'Saint-Brieuc, préfecture des Côtes-d’Armor, s’ouvre sur la baie et sur un tissu de commerces, d’artisans et de professions de santé et de services.',
    sectors: ['Commerces de proximité', 'Artisans du bâtiment et des services', 'Professionnels de santé et de bien-être', 'Associations et clubs sportifs'],
    local: 'Autour de la baie comme dans l’agglomération, beaucoup de petites structures n’ont pas de site à jour : en avoir un simple et soigné est déjà un avantage. Pour un professionnel de santé ou de bien-être, une page sobre expliquant l’activité, l’accès et la prise de rendez-vous rassure tout de suite.',
    faq: ['Je suis seul(e) et je n’ai jamais eu de site : par où commencer ?', 'Par la page unique : activité, coordonnées, quelques photos et un moyen de vous joindre. Le premier échange est gratuit et sans engagement pour cadrer l’essentiel.'],
  },
];
