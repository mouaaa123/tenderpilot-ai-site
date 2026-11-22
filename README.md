# TenderPilot AI — site pilote public

Site de démonstration statique pour PME électricité / CVC, **non ouvert à la vente**.

## Publication gratuite avec GitHub Pages

- Créer un dépôt **public** `tenderpilot-ai-site` sous le compte GitHub autorisé.
- Ajouter les fichiers de ce dossier, en conservant l'arborescence `docs/`.
- Dans **Settings → Pages → Build and deployment**, choisir **Deploy from a branch** puis `main` et `/docs`.
- L'URL apparaît dans Settings → Pages lorsque le déploiement est réellement terminé.

Le site est entièrement statique : aucun paiement, aucun formulaire distant, aucun suivi publicitaire.
L'espace « rapport-démo » contient des exemples **fictifs** explicitement indiqués.
Le rapport daté du 22 novembre 2026 est un **instantané éditorial**, pas un flux temps réel : les échéances et rectificatifs doivent être vérifiés sur les sources officielles.

**Ne pas ajouter à ce dépôt** : CRM, fichiers de prospection, adresses e-mail de prospects, clefs SMTP, données client, fichiers des rapports confidentiels ou toute automatisation de diffusion de données clients.

## Structure

- `docs/index.html` : page d'accueil
- `docs/rapport-demo.html` : interface fictive
- `docs/profil-client.html` : configurateur local, aucun upload
- `docs/rapports_reels/` : rapport éditorial daté (public)
- `.github/workflows/site-check.yml` : vérification statique du site avant publication

## Informations juridiques

Ce projet n'est pas une activité commerciale déclarée. Les mentions légales et procédures RGPD d'une activité ouverte au public devront être définies avant une commercialisation effective. Ne pas présenter les essais locaux comme un SaaS en production.
