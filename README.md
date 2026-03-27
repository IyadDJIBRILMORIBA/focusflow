# FocusFlow - Structure Front/Back

Le projet est maintenant organisé en deux dossiers indépendants :

- `front/` : application React + Vite (design inchangé)
- `back/` : API Express TypeScript

## Lancer en local

Prérequis : Node.js 20+

1. Installer les dépendances :
   - `npm run install:all`
2. Configurer les variables :
   - Front: créer `front/.env.local` avec `GEMINI_API_KEY=...`
   - Back: copier `back/.env.example` vers `back/.env`
3. Démarrer dans 2 terminaux :
   - `npm run dev:front`
   - `npm run dev:back`

## Build

- `npm run build:all`

## Docker

- `docker compose up --build`
