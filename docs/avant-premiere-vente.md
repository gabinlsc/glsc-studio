# Avant la première vente : liste de contrôle

À cocher avant d'envoyer un premier devis ou une première facture.

- [ ] Entreprise immatriculée : SIREN et SIRET reçus.
- [ ] Remplacer « En cours d'immatriculation » et l'adresse du siège dans `mentions-legales.html`, `cgv.html` et le pied de page (chercher la classe `todo`).
- [ ] Médiateur de la consommation : adhérer à un médiateur de la liste officielle de la CECMC (obligatoire pour vendre à des particuliers), puis publier son nom et ses coordonnées à l'article 13 des CGV. Si tous les clients sont des professionnels, adapter les CGV et retirer les articles consommateurs.
- [ ] Vérifier dans l'espace IONOS le lieu du centre de données du VPS : le §6.1 des mentions légales annonce un serveur hébergé en France.
- [ ] Modèle de devis et de facture : mentions obligatoires (SIRET, numéro et date, « TVA non applicable, art. 293 B du CGI », pénalités de retard, indemnité forfaitaire de 40 €, mention d'entrepreneur individuel).
- [ ] RGPD : tenir un registre simple des traitements (demandes de devis, suivi client, journaux du serveur) ; accepter le contrat de sous-traitance d'IONOS.
- [ ] Journaux du serveur : vérifier que `/etc/logrotate.d/nginx` couvre `/var/log/nginx/*.log` (rotation d'au plus 35 jours).
- [ ] Assurance responsabilité civile professionnelle (conseillée).
- [ ] Compte bancaire distinct pour l'activité.
