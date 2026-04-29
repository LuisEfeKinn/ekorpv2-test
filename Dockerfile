# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

# Some npm packages (and Next/SWC) may require glibc compatibility
RUN apk add --no-cache libc6-compat

# --- deps (all deps for build) ---
FROM base AS deps

# Enable Yarn (this repo uses Yarn classic)
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# --- build ---
FROM base AS build

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN yarn build

# --- prod-deps (runtime deps only) ---
FROM base AS prod-deps

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# --- runner ---
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl && addgroup -S nextjs && adduser -S nextjs -G nextjs

ENV NODE_ENV=production
ENV PORT=8082

# Only copy what we need at runtime
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

USER nextjs

EXPOSE 8082

# Prefer the built-in liveness route if it exists; fallback to /
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/liveness-check" || curl -fsS "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "8082"]
