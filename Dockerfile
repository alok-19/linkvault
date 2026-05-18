# syntax=docker/dockerfile:1

# Multi-stage build for LinkVault
# Zero build tools required — better-sqlite3 uses prebuilt binaries.
# Designed to work on restricted networks: no registry pings, no npx lookups.

# Stage 1: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Prevent npm from hitting the registry during the build
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Runner
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
