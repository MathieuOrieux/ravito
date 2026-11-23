# Mettre Ravito en ligne (gratuit)

L'app tourne sur **Render** (un seul service : l'API sert aussi le front) avec une base Postgres chez **Neon**. Les deux sont gratuits, sans date d'expiration.

Compte environ 15 minutes la première fois. Ensuite, **chaque push sur `master` redéploie automatiquement**.

## 1. Créer la base chez Neon

1. Crée un compte sur [neon.tech](https://neon.tech) (connexion avec GitHub possible).
2. **Create project** : nom `ravito`, Postgres 17, région **AWS Europe Central (Frankfurt)** (proche de Render Frankfurt).
3. Sur la page du projet, bouton **Connect** : copie la *connection string*. Elle ressemble à :
   ```
   postgresql://neondb_owner:xxxxx@ep-xxx-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Garde-la pour l'étape 2. C'est un secret : ne la mets jamais dans le code.

Les tables sont créées automatiquement au premier démarrage de l'app.

## 2. Déployer chez Render

1. Crée un compte sur [render.com](https://render.com) avec ton compte GitHub, et autorise l'accès au dépôt `ravito`.
2. **New → Blueprint**, choisis le dépôt `MathieuOrieux/ravito`. Render lit le fichier `render.yaml`.
3. Render demande la valeur de **`DATABASE_URL`** : colle la connection string Neon.
4. **Apply**. Le premier build prend 2 à 4 minutes.
5. L'adresse du site s'affiche en haut du service, du type `https://ravito-xxxx.onrender.com`.

## 3. Récupérer la clé admin et ajouter les traces

1. Dans Render, service `ravito` → **Environment** : la valeur de **`ADMIN_TOKEN`** a été générée automatiquement. Copie-la (garde-la pour toi).
2. Sur le site, clique **Admin**, colle la clé, puis **+ Ajouter une trace** pour déposer les fichiers GPX.

C'est prêt : envoie l'adresse du site à ton ami. Il pourra voir les traces, télécharger les GPX et liker. Seuls ceux qui ont la clé admin peuvent ajouter, modifier ou supprimer.

## À savoir

- **Mise en veille** : en gratuit, Render endort l'app après 15 minutes sans visite. La visite suivante prend environ 30 secondes, puis tout est normal.
- **Mises à jour** : `git push` sur `master` → Render recompile et redéploie tout seul. Les nouvelles migrations SQL sont appliquées au démarrage (`MIGRATE_ON_START=true`).
- **Changer la clé admin** : modifie `ADMIN_TOKEN` dans Render → Environment (16 caractères minimum), le service redémarre.
- **Sauvegardes** : Neon garde un historique de restauration de quelques heures en gratuit. Pour une copie complète : `pg_dump "<connection string>" > sauvegarde.sql`.
- **Nom de domaine** : Render → Settings → Custom Domains, si tu veux une adresse à toi plus tard.

## Tester le mode production en local

```bash
npm run build
```
Puis, avec ta base locale (PowerShell) :
```powershell
$env:NODE_ENV="production"; $env:MIGRATE_ON_START="true"; $env:ADMIN_TOKEN="une-cle-de-16-caracteres-min"; npm start
```
Le site complet (front + API) est alors sur http://localhost:3001.
