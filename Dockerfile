FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# .env.local fournit les variables NEXT_PUBLIC_* — Next.js les lit et les inline dans
# le bundle client pendant `next build` ; elles ne peuvent plus être changées après coup
# (contrairement à BACKEND_URL, lu côté serveur au démarrage du conteneur, voir docker-compose.yml).
# DOCKER_BUILD active `output: "standalone"` (voir next.config.ts) — seul ce build en a
# besoin ; le déploiement Render (`next start`) ne doit pas l'activer.
ENV DOCKER_BUILD=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
