# Archives de Gaélia

Application Next.js pour la nation de la terre : annuaire du serveur, bibliothèque à rayons, recensement, organigramme, décrets, lettres officielles et cahier interne. Chaque porte s'ouvre selon une checklist de droits.

La base est un projet [Neon](https://console.neon.tech). Les images (couvertures, portraits, illustrations) vont dans le Object Storage de la même branche.

## Préparer Neon

1. Crée un projet Neon dans la région **AWS us-east-2**. Le stockage d'objets n'est disponible que là.
2. Copie la chaîne Postgres (`sslmode=require`) dans `DATABASE_URL`.
3. Sur la branche, onglet **Storage**, crée un bucket privé nommé `gaelia`.
4. Crée une credential avec les scopes `storage:read` et `storage:write`. L'endpoint S3 de la branche va dans `NEON_STORAGE_ENDPOINT`.

## Lancer

```bash
cp .env.example .env.local
```

Renseigne `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 32`) et `ADMIN_PASSWORD` (8 caractères minimum). Puis :

```bash
npm run db:push
npm run db:seed
npm run dev
```

Le seed ouvre un gardien technique (`ADMIN_USERNAME`, par défaut `gardien`). Ce compte garde l'accès total, pour ne jamais enfermer les archives. Le Gaelor, lui, est un compte normal : le modèle « Gaelor » coche toutes les portes, et on peut ensuite en retirer.

## Mettre en ligne

Le dépôt se publie sur Vercel depuis GitHub. Un push sur `main` construit et déploie la production. Une pull request publie une preview.

1. Pousse le dépôt sur GitHub.
2. En local : `npx vercel link`. Ça crée le projet Vercel et écrit `.vercel/project.json` (ignoré par git). Dedans : `orgId` et `projectId`. Ne relie pas le dépôt Git dans le tableau de bord Vercel, sinon chaque push partirait deux fois.
3. Dans les réglages du projet, onglet Environment Variables, copie chaque clé de `.env.example` pour **Production** et **Preview**. `DATABASE_URL` est la chaîne pooled. `AUTH_SECRET` et `ADMIN_PASSWORD` sont ceux déjà utilisés en local. Lance `npm run db:push` et `npm run db:seed` une fois contre cette base si elle est encore vide.
4. Dans le dépôt GitHub, Settings → Secrets and variables → Actions, ajoute :
   - `VERCEL_TOKEN` : un token créé sur https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` : `orgId`
   - `VERCEL_PROJECT_ID` : `projectId`
5. Pousse sur `main`. L'action « Vercel » publie le site.

Le schéma et le seed ne partent pas tout seuls à chaque déploiement : ils se lancent à la main, comme en local.

## Droits

La salle du sceau (`/administration`) sert à créer les comptes et à cocher, pour chacun :

- les zones du site (annuaire, bibliothèque, recensement, organigramme, décrets, lettres, cahier interne) ;
- les gestes (écrire, promulguer, tenir le recensement, gérer les accès) ;
- chaque rayon de la bibliothèque, en lecture et en écriture.

Les modèles Citoyen, Archiviste, Chercheur, Scribe, Conseil et Gaelor pré-cochent une liste. Un nouveau rayon n'est visible pour personne tant qu'il n'est pas coché. Les rayons secrets n'apparaissent pas dans la bibliothèque de ceux qui n'y ont pas droit.

Rayons posés au départ : autres nations, entreprises, événements, flore, faune, flore magique, faune magique, artisanat, poisons, recherche, secrets de Gaélia, savoirs de la nation.
