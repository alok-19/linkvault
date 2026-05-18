# 🏦 LinkVault

> ✨ A comprehensive, privacy-first visual link management platform. Save links from Chrome or Edge with one click, browse them as stunning thumbnail cards, find anything instantly.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| ⚡ **One-click save** | Chrome/Edge extension to save any page instantly |
| 🖼️ **Visual thumbnails** | Auto-fetched OG images with smart fallbacks |
| 🔍 **Smart search** | Full-text search across titles, URLs, descriptions, and tags |
| 📂 **Categories & tags** | Organize links your way |
| 🌙 **Dark mode** | Beautiful light and dark themes |
| 🔒 **Fully local** | No accounts, no cloud, no tracking |
| 📊 **Click tracking** | See which links you use most |

---

## 🚀 Quick Start

### 🐳 Option A: Docker (Recommended — Zero Native Dependencies)

```bash
# Clone the repo
git clone <repo-url>
cd linkvault

# Build and run
docker compose up --build

# Open http://localhost:3000
```

> 💡 Data persists in Docker volumes (`linkvault-data` and `linkvault-thumbs`).
> No build tools (python3, make, g++) are needed — `better-sqlite3` ships prebuilt binaries.

### 📦 Option B: Pre-built Image (No Build Required)

If you have a pre-exported image (e.g., from a CI pipeline or archived distribution):

```bash
# Load the image
docker load < linkvault-docker.tar.gz

# Run it
docker compose up -d
```

### 🐙 Option C: GitHub Container Registry (Instant)

If the project publishes to GHCR:

```bash
docker pull ghcr.io/YOUR_USERNAME/linkvault:latest
docker compose up -d
```

### 💻 Option D: Node.js (Local Development)

#### 📋 Prerequisites

| OS | Required Tools |
|---|---|
| 🍎 **macOS** | `xcode-select --install` (rarely needed) |
| 🐧 **Ubuntu/Debian** | Usually nothing extra needed |
| 🎩 **Fedora/RHEL** | Usually nothing extra needed |
| 🪟 **Windows** | Usually nothing extra needed |
| 🌐 **All** | [Node.js 20+](https://nodejs.org/) |

> 💡 `better-sqlite3` uses **prebuilt binaries** for most platforms. Build tools are only needed as a fallback if a prebuild is missing for your architecture.

#### 🛠️ One-Command Setup

```bash
# macOS / Linux
chmod +x setup.sh
./setup.sh

# Windows (PowerShell)
.\setup.ps1
```

#### 📝 Manual Setup

```bash
# Ensure Node 20+ is active (if using nvm/fnm)
nvm use    # or: fnm use

# Install dependencies
npm install

# Build for production
npm run build

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 🧩 Install the Browser Extension

### Chrome / Edge

1. Open `chrome://extensions` or `edge://extensions`
2. Enable **Developer mode** 🔧
3. Click **Load unpacked** 📦
4. Select the `extension/` folder

### 🎯 Using the Extension

| Action | Method |
|--------|--------|
| 💾 Save current page | Click the **LinkVault icon** in your toolbar |
| 🖱️ Right-click save | Right-click any page → **Save to LinkVault** |
| ⌨️ Keyboard shortcut | `Ctrl+Shift+S` / `Cmd+Shift+S` |
| 🔗 Auto-detect | Extension auto-detects dashboard at `localhost:3000` |

### 🌐 Running on a Different Host or Port?

If your LinkVault instance is not on `localhost:3000` (e.g., Docker on a remote machine, custom port, LAN IP):

1. Click the **⚙️ gear icon** in the extension popup
2. Enter your dashboard URL (e.g., `http://192.168.1.50:3000`)
3. The extension will remember it 💾

---

## 📁 Project Structure

```
linkvault/
├── 📦 extension/              # Chrome + Edge extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html / popup.js
│   ├── background.js
│   └── icons/
├── 📂 src/
│   ├── 🌐 app/                # Next.js App Router
│   │   ├── page.tsx           # Dashboard
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Styles
│   │   └── api/               # API routes
│   ├── 🧩 components/         # React components
│   ├── 🛠️ lib/                # Database, cache, utils
│   ├── 🎣 hooks/              # Custom React hooks
│   └── 📝 types/              # TypeScript types
├── 💾 data/                   # SQLite database (auto-created)
├── 🖼️ public/thumbs/          # Cached fallback thumbnails
├── 🐳 Dockerfile              # Multi-stage production build
├── 📜 docker-compose.yml      # Docker orchestration
├── 🔧 setup.sh                # macOS/Linux setup script
├── 🔧 setup.ps1               # Windows setup script
└── 📚 docs/                   # Architecture & planning docs
```

---

## 🛠️ Tech Stack

| Layer | Technology | Icon |
|-------|------------|------|
| 🎨 Frontend | Next.js 16 + React + TypeScript | ![Next.js](https://img.shields.io/badge/Next.js-black?logo=nextdotjs) |
| 💅 Styling | Tailwind CSS 3 + Framer Motion | ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss) |
| 💾 Database | SQLite (better-sqlite3) with WAL mode | ![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite) |
| 🔎 Full-text search | SQLite FTS5 | 📖 |
| 🎭 Icons | Lucide React | ✨ |
| 🧩 Extension | Manifest V3 (Chrome + Edge) | 🌐 |
| 🖼️ Thumbnails | OG images → generated SVG fallbacks | 📸 |
| 🧪 Testing | Vitest + React Testing Library | 🧪 |

---

## 🔌 API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/links` | 📋 List links (search, filter, sort, paginate) |
| `POST` | `/api/links` | ➕ Add new link |
| `GET` | `/api/links/:id` | 🔍 Get single link |
| `PATCH` | `/api/links/:id` | ✏️ Update link |
| `DELETE` | `/api/links/:id` | 🗑️ Delete link |
| `POST` | `/api/links/:id/click` | 📊 Track click |
| `POST` | `/api/extract-metadata` | 🏷️ Pre-fetch page metadata |
| `POST` | `/api/links/:id/extract-content` | 📄 Extract article content |
| `POST` | `/api/import` | 📥 Import JSON or HTML bookmarks |
| `GET` | `/api/export/json` | 📤 Export as JSON |
| `GET` | `/api/export/csv` | 📤 Export as CSV |
| `GET` | `/api/export/html` | 📤 Export as HTML bookmarks |
| `GET` | `/api/stats` | 📈 Dashboard statistics |
| `GET` | `/api/health` | 💚 Lightweight health check |
| `POST` | `/api/links/health-check` | 🔍 Check all links for broken URLs |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | 🔍 Focus search |
| `n` | ➕ New link modal |
| `Esc` | ❌ Close modal / clear search |
| `?` | ❓ Show keyboard shortcuts help |

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `./data/links.db` | 💾 SQLite database file path |
| `PORT` | `3000` | 🔌 Server port |
| `HOSTNAME` | `0.0.0.0` | 🌐 Server bind address |

---

## 🐛 Troubleshooting

### ❌ `npm install` fails with `node-gyp` errors

**Cause:** Native C++ compilation of `better-sqlite3` is falling back because a prebuilt binary is missing for your platform.

**Fix:**
- 🐳 **All platforms:** Use Docker instead (`docker compose up --build`) — no compilation needed.
- 🍎 **macOS:** `xcode-select --install`
- 🐧 **Ubuntu:** `sudo apt install build-essential python3`
- 🪟 **Windows:** Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++" workload, then `npm config set msvs_version 2022`

### 🔴 Extension shows "Offline"

1. Ensure the dashboard is running (`npm run dev` or `docker compose up`)
2. Click the ⚙️ gear icon in the extension popup and verify the URL
3. Check that your browser can reach the URL directly

### 🔒 SQLite permission denied in Docker

**Cause:** Volume permissions mismatch.

**Fix:**
```bash
# Remove the old volume and recreate
docker compose down
docker volume rm linkvault_linkvault-data
docker compose up --build
```

### 🖼️ Thumbnails not generating

The `public/thumbs/` directory must be writable. It auto-creates on startup, but if running in a restricted environment, ensure write permissions.

---

## 📜 Scripts

```bash
npm run dev        # 🚀 Development server with Turbopack
npm run build      # 🏗️ Production build (outputs .next/standalone)
npm run start      # ▶️ Start production server
npm run lint       # 🔍 ESLint
npm run test       # 🧪 Run Vitest test suite
npm run test:watch # 👁️ Run tests in watch mode
```

---

## License

MIT


