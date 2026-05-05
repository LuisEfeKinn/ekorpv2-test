# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

# --- deps ---
FROM base AS deps
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# --- build ---
FROM base AS build
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Importante: Declarar ARGs para que Next.js los vea en el 'build'
ARG NEXT_PUBLIC_AWS_AMPLIFY_IDENTITY_POOL_ID
ARG NEXT_PUBLIC_AWS_AMPLIFY_USER_POOL_CLIENT_ID
ARG NEXT_PUBLIC_AWS_AMPLIFY_USER_POOL_ID
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_HOST_API
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_WIDGET_BASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG BUILD_NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_OPTIONS=${BUILD_NODE_OPTIONS}

RUN yarn build

# --- prod-deps ---
FROM base AS prod-deps
RUN corepack enable && corepack prepare yarn@1.22.22 --activate
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# --- runner ---
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache curl && addgroup -S nextjs && adduser -S nextjs -G nextjs

ENV NODE_ENV=production
ENV PORT=8082

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

USER nextjs
EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/" || exit 1

CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0", "-p", "8082"]