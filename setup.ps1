# LinkVault Setup Script (PowerShell)
# Requires: Node.js 20+, PowerShell 5.1+

$RequiredNode = 20
$ErrorActionPreference = "Stop"

function Write-Info { param($msg) Write-Host "==> $msg" -ForegroundColor Blue }
function Write-Success { param($msg) Write-Host "  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "  $msg" -ForegroundColor Red }

Write-Info "LinkVault Setup"

# Check Node.js
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "Node.js is not installed."
    Write-Host "Please install Node.js $RequiredNode or later:"
    Write-Host "  https://nodejs.org/"
    exit 1
}

$nodeVersion = (& node -v) -replace 'v','' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt $RequiredNode) {
    Write-Error "Node.js v$nodeVersion is too old. Required: v$RequiredNode+"
    exit 1
}

Write-Success "Node.js $(node -v) found"

# Check for build tools (needed for better-sqlite3)
Write-Info "Checking build tools..."
$python = Get-Command python -ErrorAction SilentlyContinue
$python3 = Get-Command python3 -ErrorAction SilentlyContinue
if (-not $python -and -not $python3) {
    Write-Warn "Python not found. better-sqlite3 may fail to compile."
    Write-Host "Install Python and Visual Studio Build Tools:"
    Write-Host "  https://github.com/nodejs/node-gyp#on-windows"
}

# Check for cl.exe (MSVC)
$cl = Get-Command cl -ErrorAction SilentlyContinue
if (-not $cl) {
    Write-Warn "MSVC compiler (cl.exe) not found in PATH."
    Write-Host "If npm install fails with node-gyp errors, install Visual Studio Build Tools:"
    Write-Host "  https://visualstudio.microsoft.com/visual-cpp-build-tools/"
}

# Install dependencies
Write-Info "Installing dependencies..."
npm install

# Build
Write-Info "Building application..."
npm run build

# Create data directories
Write-Info "Setting up data directories..."
New-Item -ItemType Directory -Force -Path data | Out-Null
New-Item -ItemType Directory -Force -Path public/thumbs | Out-Null

Write-Host ""
Write-Success "Setup complete!"
Write-Host ""
Write-Host "Run the dev server:  " -NoNewline; Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host "Open:                " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or run with Docker:  " -NoNewline; Write-Host "docker compose up --build" -ForegroundColor Yellow
Write-Host ""
Write-Host "Install the extension:"
Write-Host "  1. Open chrome://extensions (or edge://extensions)"
Write-Host "  2. Enable Developer mode"
Write-Host "  3. Click Load unpacked"
Write-Host "  4. Select the extension/ folder"
Write-Host ""
