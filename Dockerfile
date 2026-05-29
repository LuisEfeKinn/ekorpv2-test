# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

# --- deps ---
FROM base AS deps
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --store-dir /pnpm/store

# --- build ---
FROM base AS build
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

COPY --from=deps /app/node_modules ./node_modules
# Next.js resuelve NEXT_PUBLIC_* durante el build, por eso el .env debe estar disponible en esta etapa.
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_BUILD_STANDALONE=true
ENV NEXT_BUILD_STANDALONE=${NEXT_BUILD_STANDALONE}
ARG BUILD_NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_OPTIONS=${BUILD_NODE_OPTIONS}

RUN pnpm build

# --- runner ---
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache curl && addgroup -S nextjs && adduser -S nextjs -G nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8082
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=nextjs:nextjs /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/liveness-check" >/dev/null || curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

CMD ["node", "server.js"]