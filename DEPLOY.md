# Déployer le frontend (Next.js)

Repo : https://github.com/elieferdinahlowane-afk/-ENDOSCOPIE

Le backend doit déjà être en ligne sur Render (ex. `https://endoscopie-api.onrender.com`).

---

## Option A — Vercel (recommandé pour Next.js)

### 1. Pousser le code sur GitHub

```bash
cd E:\CHU\Endoscopie
git push github main
```

### 2. Créer le projet Vercel

1. [vercel.com/new](https://vercel.com/new) → importer **elieferdinahlowane-afk/-ENDOSCOPIE**
2. **Root Directory** : `endoscopie-front`
3. Framework : **Next.js** (détecté automatiquement)
4. **Build Command** : `npm run build` (par défaut)
5. **Output** : défaut Next.js

### 3. Variables d'environnement (Settings → Environment Variables)

**Méthode simple (recommandée)** — appels directs vers l’API Render :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://endoscopie-api.onrender.com` |

Sur le **backend Render**, ajouter aussi :

| Variable | Valeur |
|----------|--------|
| `FRONTEND_URL` | `https://votre-projet.vercel.app,http://localhost:3000` |

### 4. Déployer

Cliquer **Deploy**. URL finale : `https://votre-projet.vercel.app`

### 5. Vérifier

- Ouvrir l’accueil : le planning et les salles se chargent sans erreur « Failed to fetch »
- Onglet réseau (F12) : requêtes vers `https://endoscopie-api.onrender.com/api/...`

---

## Option B — Render (Web Service Node)

### 1. New + → Web Service

- Repo : **-ENDOSCOPIE**
- **Root Directory** : `endoscopie-front`
- **Runtime** : Node
- **Build Command** : `npm install && npm run build`
- **Start Command** : `npm run start`

### 2. Variables d'environnement

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://endoscopie-api.onrender.com` |
| `NODE_ENV` | `production` |

### 3. Backend CORS

Dans le Web Service **backend** :

```
FRONTEND_URL=https://endoscopie-front.onrender.com,http://localhost:3000
```

(Remplacer par l’URL réelle du front Render.)

---

## Option C — Proxy Next (sans CORS côté navigateur)

Laisser `NEXT_PUBLIC_API_URL` **vide** et définir à la **build** :

| Variable | Valeur |
|----------|--------|
| `BACKEND_URL` | `https://endoscopie-api.onrender.com` |

Les pages appellent `/api/...` ; Next redirige vers le backend (`next.config.ts`).

Sur Vercel, ajouter `BACKEND_URL` pour **Production**, **Preview** et **Development**, puis **redéployer**.

---

## Développement local

```bash
cd endoscopie-front
cp .env.example .env.local
# Éditer .env.local si besoin
npm install
npm run dev
```

Backend local : `cd endoscopie-back && npm run start:dev`

Sans `.env.local`, le proxy pointe vers `http://127.0.0.1:3333`.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Failed to fetch | Backend Render démarré ? `NEXT_PUBLIC_API_URL` correct ? |
| Erreur CORS | Ajouter l’URL du front dans `FRONTEND_URL` sur le backend |
| 404 sur /api | Utiliser `NEXT_PUBLIC_API_URL` ou `BACKEND_URL` + redéployer |
| Build Vercel échoue | Vérifier **Root Directory** = `endoscopie-front` |
| API lente (plan Free) | Premier chargement après veille ≈ 30–60 s |
