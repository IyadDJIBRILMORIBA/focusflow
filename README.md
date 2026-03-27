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
