# TenderPilot AI — site pilote public

Site de démonstration statique pour PME électricité / CVC, **non ouvert à la vente**.

## Publication gratuite avec GitHub Pages

- Créer un dépôt **public** `tenderpilot-ai-site` sous le compte GitHub autorisé.
- Ajouter les fichiers de ce dossier, en conservant l'arborescence `docs/`.
- Dans **Settings → Pages → Build and deployment**, choisir **Deploy from a branch** puis `main` et `/docs`.
- L'URL apparaît dans Settings → Pages lorsque le déploiement est réellement terminé.

Le site est entièrement statique : aucun paiement, aucun formulaire distant, aucun suivi publicitaire.
L'espace « rapport-démo » contient des exemples **fictifs** explicitement indiqués.
La page publique `docs/offres.html` consulte l’API ouverte du BOAMP à chaque visite pour le profil CVC en Moselle. Elle sélectionne les avis à échéance future et vérifie les avis liés. Une panne de la source est signalée à l’écran. L’ancien lien partagé redirige vers la veille et le rapport éditorial reste consultable dans les archives.

**Ne pas ajouter à ce dépôt** : CRM, fichiers de prospection, adresses e-mail de prospects, clefs SMTP, données client, fichiers des rapports confidentiels ou toute automatisation de diffusion de données clients.

## Structure

- `docs/index.html` : page d'accueil
- `docs/rapport-demo.html` : interface fictive
- `docs/profil-client.html` : configurateur local, aucun upload
- `docs/offres.html` et `docs/veille-boamp.mjs` : veille publique CVC en Moselle
- `docs/rapports_reels/` : archive éditoriale et redirection des anciens liens
- `.github/workflows/site-check.yml` : vérification statique du site avant publication

## Informations juridiques

Ce projet n'est pas une activité commerciale déclarée. Les mentions légales et procédures RGPD d'une activité ouverte au public devront être définies avant une commercialisation effective. Ne pas présenter les essais locaux comme un SaaS en production.
