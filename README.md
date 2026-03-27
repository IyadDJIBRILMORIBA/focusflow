# FocusFlow

Architecture actuelle :

- `front/` : React + Vite
- `back/` : Laravel API (Sanctum)
- `db` : MySQL (Docker)
- `back-node/` : ancien backend Node conservé en backup

## Pourquoi ce changement

Le backend localStorage ne permettait pas une synchronisation fiable multi-appareil.
Désormais, l'authentification et les données (profil + tâches) sont persistées en base SQL via API sécurisée.

## Configuration locale (sans Docker)

Prérequis : Node.js 20+, PHP 8.3+, Composer, MySQL.

1. Installer les dépendances :

- `npm run install:front`
- `npm run install:back`

2. Configurer les variables :

- `cp front/.env.example front/.env.local`
- `cp back/.env.example back/.env`

3. Dans `back/.env`, adapter la base MySQL si nécessaire.

4. Migrer la base :

- `cd back && php artisan migrate`

5. Lancer les services :

- `npm run dev:back`
- `npm run dev:front`

Frontend : `http://localhost:3000`  
API Laravel : `http://localhost:4000/api`

## Configuration Docker

- `docker compose up --build`

Services exposés :

- Front : `http://localhost:3000`
- API : `http://localhost:4000/api`
- MySQL : `localhost:3307`

## Déploiement backend sur Render

Le repo contient un blueprint Render : `render.yaml`.

### Option A — Blueprint (recommandé)

1. Push sur GitHub (`masters`).
2. Sur Render : **New +** → **Blueprint**.
3. Sélectionne ce repo.
4. Render va créer :
	- un web service `focusflow-back` (Docker sur `back/`)
	- une base PostgreSQL `focusflow-db`.
5. Dans le service `focusflow-back`, renseigne :
	- `APP_URL` = URL publique Render du backend (ex: `https://focusflow-back.onrender.com`)
	- `FRONTEND_URL` = URL publique du frontend (ex: `https://focusflow-front.vercel.app`)
6. Déploie.

Le backend sera exposé sur :

- `https://<render-backend>/api/health`
- `https://<render-backend>/api/auth/register`

### Option B — Service manuel

Si tu crées le service manuellement, garde ces variables min:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY` (secret)
- `DB_CONNECTION=pgsql`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `SESSION_DRIVER=database`
- `CACHE_STORE=database`
- `QUEUE_CONNECTION=database`

## Frontend en production

Dans l'environnement du frontend, configure :

- `VITE_API_URL=https://<render-backend>/api`

Puis redéploie le frontend.

## Endpoints principaux

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/{taskId}`
- `DELETE /api/tasks/{taskId}`
- `DELETE /api/account`
