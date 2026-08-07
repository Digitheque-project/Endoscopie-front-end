FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* sont inlinées dans le bundle client pendant `next build` — elles ne
# peuvent plus être changées après coup (contrairement à BACKEND_URL, lu côté serveur au
# démarrage du conteneur, voir docker-compose.yml). Si un .env.local est présent dans le
# contexte de build (cas d'un `docker compose build` local), Next.js le lit directement.
# Sinon (cas d'un build depuis un dépôt Git qui ne committe jamais .env.local, ex. Render),
# ces ARG — remplies par Render depuis les variables d'environnement du service, à
# condition qu'elles y soient définies sous le même nom — prennent le relais : une
# variable déjà présente dans process.env n'est jamais écrasée par .env.local.
ARG NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID
ARG NEXT_PUBLIC_ENDOSCOPIE_CHU_ID
ARG NEXT_PUBLIC_CHU_API_URL
ARG NEXT_PUBLIC_ACCUEIL_API_URL
ARG NEXT_PUBLIC_NOTIFICATION_API_URL
ARG NEXT_PUBLIC_AUTH_GATEWAY_URL
ARG NEXT_PUBLIC_AUTH_ENDOSCOPIE_SERVICE_ID
ARG NEXT_PUBLIC_AUTH_CLIENT_LOGIN_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# BACKEND_URL n'est pas une NEXT_PUBLIC_* (elle n'a jamais besoin d'être inlinée dans le
# bundle client), mais `next.config.ts` la lit au niveau module pour construire la cible du
# rewrite `/api/*` — cette lecture se produit dès `next build` (génération du
# routes-manifest), pas seulement au démarrage du serveur. Fournie uniquement comme variable
# d'environnement du service (donc seulement disponible à l'exécution du conteneur, jamais
# pendant le build), elle est restée figée sur la valeur de secours 127.0.0.1:3333 quoi
# qu'on mette ensuite dans le dashboard Render — d'où le besoin du même traitement ARG que
# les NEXT_PUBLIC_* ci-dessus.
ARG BACKEND_URL
ENV NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID=$NEXT_PUBLIC_ENDOSCOPIE_SERVICE_ID \
    NEXT_PUBLIC_ENDOSCOPIE_CHU_ID=$NEXT_PUBLIC_ENDOSCOPIE_CHU_ID \
    NEXT_PUBLIC_CHU_API_URL=$NEXT_PUBLIC_CHU_API_URL \
    NEXT_PUBLIC_ACCUEIL_API_URL=$NEXT_PUBLIC_ACCUEIL_API_URL \
    NEXT_PUBLIC_NOTIFICATION_API_URL=$NEXT_PUBLIC_NOTIFICATION_API_URL \
    NEXT_PUBLIC_AUTH_GATEWAY_URL=$NEXT_PUBLIC_AUTH_GATEWAY_URL \
    NEXT_PUBLIC_AUTH_ENDOSCOPIE_SERVICE_ID=$NEXT_PUBLIC_AUTH_ENDOSCOPIE_SERVICE_ID \
    NEXT_PUBLIC_AUTH_CLIENT_LOGIN_URL=$NEXT_PUBLIC_AUTH_CLIENT_LOGIN_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    BACKEND_URL=$BACKEND_URL
# DOCKER_BUILD active `output: "standalone"` (voir next.config.ts) — seul ce build en a
# besoin ; le déploiement Render en runtime Node (`next start`) ne doit pas l'activer.
ENV DOCKER_BUILD=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Render attend par défaut le port 10000 pour un service Docker (voir sa doc) — le
# serveur standalone de Next.js écoute sur process.env.PORT (3000 par défaut), d'où un
# 502 permanent sans ceci : Render ne parvenait jamais à joindre le conteneur. Une
# variable PORT fournie par la plateforme au démarrage écraserait quand même cette
# valeur par défaut si besoin.
ENV PORT=10000
# Reporté depuis l'étage builder (voir ARG BACKEND_URL plus haut) — filet de sécurité au
# cas où une variable d'environnement fournie par la plateforme au démarrage du conteneur
# ne serait pas prise en compte de façon fiable pour ce service (observé sur Render). Une
# variable d'environnement réellement injectée à l'exécution écraserait quand même celle-ci.
ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 10000
# Le serveur standalone de Next.js lit HOSTNAME pour savoir sur quelle interface écouter
# (défaut "0.0.0.0" si absent — voir .next/standalone/server.js généré). Or Render (et la
# plupart des plateformes conteneurisées) injecte sa propre variable HOSTNAME égale au nom
# du conteneur, qui écraserait notre "0.0.0.0" si on la définissait seulement via ENV plus
# haut (une variable fournie à l'exécution par la plateforme gagne toujours sur un ENV de
# l'image). Conséquence observée : le process démarre et se dit "Ready", mais n'écoute que
# sur le nom du conteneur, injoignable depuis l'extérieur — 502 permanent malgré un service
# qui se déclare "live". On force donc HOSTNAME juste avant de lancer node, pour la seule
# durée de cette commande, quoi que la plateforme ait mis dans l'environnement du conteneur.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
