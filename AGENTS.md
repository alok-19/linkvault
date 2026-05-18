# Agent Notes for LinkVault

## Build & Deployment

### Docker (Recommended for Users)

The project includes a multi-stage `Dockerfile` and `docker-compose.yml`. This is the **zero-friction** path for end users — no Node.js, no build tools, no `node-gyp` compilation needed.

```bash
docker compose up --build
```

**Key details:**
- **Base image:** `node:20-alpine`
- **Builder stage:** installs ALL npm packages (not `--only=production`) because `next build` requires TypeScript, Tailwind, PostCSS, etc.
- **Runner stage:** copies `.next/standalone`, static assets, and `node_modules` (needed for `better-sqlite3` native bindings which can't be bundled).
- **Volumes:** `linkvault-data` (SQLite DB) and `linkvault-thumbs` (cached SVG fallbacks) persist across restarts.
- **Healthcheck:** lightweight `GET /api/health` every 30s.

**If modifying the Dockerfile:**
- Never use `--only=production` in the stage that runs `npm run build`.
- The runner needs `node_modules` because `better-sqlite3` has `.node` native bindings that Next.js standalone can't inline.

### Local Development

**Required Node version:** 20 LTS (see `.nvmrc`). Use `nvm use` or `fnm use` before installing.

**Required native build tools:** `better-sqlite3` compiles C++ bindings. Every developer needs:
- macOS: `xcode-select --install`
- Ubuntu: `build-essential python3`
- Windows: Visual Studio Build Tools + Python 3

**Setup scripts:**
- `setup.sh` — macOS/Linux. Checks Node version, warns about build tools, runs `npm install && npm run build`.
- `setup.ps1` — Windows PowerShell. Same checks, plus MSVC compiler detection.

**Build output:**
- `next.config.js` sets `output: 'standalone'`.
- `npm run build` produces `.next/standalone/` which is what the Docker runner uses.

## Database

- SQLite via `better-sqlite3`.
- Path: `./data/links.db` (override with `DATABASE_PATH` env var).
- WAL mode enabled (`journal_mode = WAL`) for concurrent read/write performance.
- Migrations run automatically on startup via `src/lib/migrations.ts`.
- Schema tracked in `src/migrations/*.sql` files.

## Performance Conventions

### API Routes

- **GET reads** (links, stats): use the in-memory LRU cache (`src/lib/cache.ts`) with 3s TTL.
- **POST writes** (add link): must NOT block on external network calls. Metadata enrichment happens in a background `Promise` after the response is returned. See `src/app/api/links/route.ts` for the `backgroundEnrich` pattern.
- **Thumbnails:** `fetchThumbnail()` is async. It writes SVG files to disk asynchronously. Never call sync `fs` methods in request handlers.

### Extension

- The extension scrapes metadata from the page DOM *before* sending it to the API. This avoids the server needing to fetch the target URL synchronously.
- The extension auto-detects the dashboard by probing `localhost:3000/3001` and `127.0.0.1`.
- Users can override the dashboard URL via the settings gear in the popup.
- `host_permissions` in `manifest.json` includes broad patterns (`http://*/*`, `https://*/*`) so it works on LAN IPs and custom ports out of the box.

## Testing

- Test runner: Vitest.
- Test files: co-located with source (e.g., `src/lib/db.test.ts`).
- Run: `npm run test` or `npm run test:watch`.

## File Permissions to Watch

- `data/` — must be writable (SQLite DB + WAL files).
- `public/thumbs/` — must be writable (generated fallback SVGs).
- In Docker, both are `chmod 777`'d in the Dockerfile and mounted as named volumes.
