# Avant la première vente : liste de contrôle

À cocher avant d'envoyer un premier devis ou une première facture.

- [x] Entreprise immatriculée : SIREN 132 216 086 et SIRET 132 216 086 00018 (INSEE, 29/10/2026).
- [x] SIREN, SIRET et adresse du siège (12 rue des Tisserands, 56270 Ploemeur) renseignés dans `mentions-legales.html` et `cgv.html`.
- [ ] Clients professionnels uniquement : le devis doit porter la mention « Le client déclare agir à titre professionnel » avec son SIREN ou RNA, et renvoyer aux CGV (à valider avant signature). Si tu acceptes un jour un particulier, il faudra un médiateur de la consommation (liste officielle de la CECMC) et rétablir les articles consommateurs des CGV.
- [ ] Vérifier dans l'espace IONOS le lieu du centre de données du VPS : le §6.1 des mentions légales annonce un serveur hébergé en France.
- [ ] Modèle de devis et de facture : mentions obligatoires (SIRET, numéro et date, « TVA non applicable, art. 293 B du CGI », pénalités de retard, indemnité forfaitaire de 40 €, mention d'entrepreneur individuel).
- [ ] RGPD : tenir un registre simple des traitements (demandes de devis, suivi client, journaux du serveur) ; accepter le contrat de sous-traitance d'IONOS.
- [ ] Journaux du serveur : vérifier que `/etc/logrotate.d/nginx` couvre `/var/log/nginx/*.log` (rotation d'au plus 35 jours).
- [ ] Assurance responsabilité civile professionnelle (conseillée).
- [ ] Compte bancaire distinct pour l'activité.
