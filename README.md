# Ravito

Les traces GPX du ravito du dimanche : une carte de toutes les sorties, le détail de chaque trace (carte, profil altimétrique, stats), le téléchargement du GPX, et des likes.

- **Front** : React 19 + Vite, React Router, TanStack Query, Leaflet (`client/`)
- **API** : Node.js + Express 5, en JavaScript (`server/`)
- **Base** : PostgreSQL (lancée avec Docker)

## Démarrage rapide

Il faut **Node.js 20+** et **Docker Desktop**.

```bash
npm install                          # installe front + API (workspaces npm)
cp server/.env.example server/.env   # puis choisis une ADMIN_TOKEN
npm run db:up                        # lance Postgres (docker compose)
npm run db:migrate                   # crée les tables
npm run db:seed                      # (facultatif) ajoute une trace d'exemple
npm run dev                          # API sur :3001 + front sur http://localhost:5173
```

Pour ajouter des traces : **Admin** en haut à droite, colle la valeur de `ADMIN_TOKEN`, puis **+ Ajouter une trace** et dépose un `.gpx`. Distance, dénivelé, altitudes et profil sont calculés automatiquement.

## Mise en ligne

Render (app) + Neon (Postgres), gratuits, avec un redéploiement automatique à chaque push sur `master` : voir **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

En production, l'API sert aussi le front compilé (`client/dist`) : un seul service, une seule adresse.

## Fonctionnalités

| | |
|---|---|
| Accueil | Liste des traces + carte de toutes les traces (survol synchronisé), recherche, filtre par activité, tri (récentes, plus likées, plus courtes, nom). Les filtres sont dans l'URL. |
| Trace | Carte (départ/arrivée), stats, profil altimétrique interactif (le point suit sur la carte), téléchargement du GPX d'origine, like. |
| Likes | Un like par trace et par navigateur (identifiant anonyme), mise à jour instantanée (optimiste). |
| Admin | Ajouter (upload GPX), modifier nom/activité/description, supprimer. Protégé par la clé `ADMIN_TOKEN`. |

## Structure

```
client/                       front React
  src/
    api/                      appels HTTP + hooks React Query (une ressource = un fichier)
    components/               composants réutilisables (cartes, profil, like, UI)
    features/                 logique par domaine (admin, formulaire de trace)
    pages/                    une page = une route
    lib/                      utilitaires (format, activités, identifiant visiteur…)
    styles/global.css         thème (variables CSS) et styles
server/                       API Express
  src/
    app.js                    assemblage des middlewares et routes
    config.js                 variables d'environnement (validées au démarrage)
    db/                       pool Postgres + migrations SQL
    lib/gpx.js                lecture GPX, distance, dénivelé
    middleware/               auth admin, identifiant visiteur, erreurs
    modules/<domaine>/        routes → service → repository (SQL)
  test/                       tests (node:test + supertest)
docker-compose.yml            Postgres 17 (+ base de test)
```

## API

Toutes les réponses sont en JSON ; les erreurs ont la forme `{ "error": { "message", "code", "details?" } }`.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/api/traces?q=&activity=&sort=&limit=&offset=` | public | Liste paginée (`items`, `total`) avec aperçu du tracé |
| GET | `/api/traces/:id` | public | Détail, avec la géométrie complète |
| GET | `/api/traces/:id/gpx` | public | Fichier GPX d'origine |
| POST | `/api/traces` | admin | multipart : `gpx` (fichier), `activity`, `name?`, `description?` |
| PATCH | `/api/traces/:id` | admin | JSON : `name?`, `activity?`, `description?` |
| DELETE | `/api/traces/:id` | admin | Supprime la trace et ses likes |
| PUT | `/api/traces/:id/like` | visiteur | Like (idempotent) → `{ likeCount, liked }` |
| DELETE | `/api/traces/:id/like` | visiteur | Retire le like |
| GET | `/api/meta` | public | Activités disponibles |
| GET | `/api/health` | public | Santé de l'API et de la base |

- **admin** : en-tête `Authorization: Bearer <ADMIN_TOKEN>`
- **visiteur** : en-tête `X-Voter-Id: <uuid>` (généré et gardé par le navigateur)

## Tests

```bash
npm test
```

Tests unitaires du parseur GPX + tests d'intégration de l'API sur la base `ravito_test` (créée automatiquement par `docker compose`, adresse dans `TEST_DATABASE_URL`). Cette base est vidée à chaque lancement.

## Faire évoluer

- **Changer le schéma** : ajoute `server/src/db/migrations/002_xxx.sql` puis `npm run db:migrate`. Ne modifie jamais une migration déjà appliquée.
- **Nouvelle ressource** (ex. commentaires) : un dossier `server/src/modules/comments/` (routes, repository) branché dans `app.js`, et un `client/src/api/comments.js` avec ses hooks.
- **Nouvelle activité** : ajoute-la dans `server/src/lib/activities.js` et `client/src/lib/activities.js`.
- **Comptes utilisateurs** : remplacer `middleware/auth.js` (clé admin) et `X-Voter-Id` par une vraie session ; la table `trace_likes` passera de `voter_id` à `user_id`.

## Limites connues

- Les likes sont anonymes : un visiteur motivé peut liker plusieurs fois en vidant son navigateur. Suffisant pour un groupe.
- La clé admin est unique et partagée. À remplacer par des comptes si plusieurs personnes gèrent les traces.
- Les fonds de carte viennent des serveurs OpenStreetMap, prévus pour un usage léger.
