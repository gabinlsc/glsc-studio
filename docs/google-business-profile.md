# Fiche Google Business Profile — à faire par le propriétaire

Pour une activité locale, la fiche Google (la carte avec avis qui s'affiche dans les recherches) est souvent le premier point de contact.
Elle se crée depuis le compte du propriétaire : le code ne peut pas le faire à sa place.

## Création

1. Aller sur https://business.google.com et se connecter avec le compte Google de l'entreprise.
2. **Nom** : « StudioGLSC » (exactement le nom utilisé partout ailleurs).
3. **Catégorie principale** : « Concepteur de sites Web » (ou la plus proche proposée).
4. **Zone de service** plutôt qu'adresse affichée : Bretagne, puis les villes visées (Rennes, Lorient, Vannes, Quimper, Brest, Saint-Brieuc). N'affichez pas votre domicile si vous ne recevez pas de clients.
5. **Site web** : https://studio.glsc.fr/ · **Téléphone** : le même que sur le site · **Horaires** : les plages où vous répondez.
6. Description (750 caractères max) : reprendre la présentation de la page « À propos », sans promesse que le site ne tient pas.
7. Google demande une **validation** (courrier, appel ou vidéo selon les cas) : prévoir quelques jours.

## Une fois la fiche créée

- Copier l'adresse publique de la fiche dans `tools/site.config.json` (clé `googleBusinessProfile`), puis `node tools/build-site.mjs` : elle est ajoutée aux liens officiels (`sameAs`) des données structurées.
- Demander un avis aux clients satisfaits, sans jamais en acheter ni en rédiger soi-même.
- Garder nom, téléphone et site **identiques** partout (site, fiche, annuaires) : c'est ce qui compte pour le référencement local.
