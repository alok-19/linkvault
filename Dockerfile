# syntax=docker/dockerfile:1

# Multi-stage build for LinkVault
# Zero build tools required — better-sqlite3 uses prebuilt binaries.
# Requires BuildKit: DOCKER_BUILDKIT=1 or default on Docker Desktop

# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Create data directory for SQLite
RUN mkdir -p /app/data /app/public/thumbs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Ensure data and thumbs directories are writable
RUN chmod -R 777 /app/data /app/public/thumbs

EXPOSE 3000

CMD ["node", "server.js"]
