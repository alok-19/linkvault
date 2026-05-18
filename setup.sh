#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REQUIRED_NODE="20"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==> LinkVault Setup${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js ${REQUIRED_NODE} or later:"
    echo "  https://nodejs.org/"
    echo "  Or use a version manager: nvm, fnm, volta"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt "$REQUIRED_NODE" ]; then
    echo -e "${RED}Error: Node.js v${NODE_VERSION} is too old. Required: v${REQUIRED_NODE}+${NC}"
    exit 1
fi

echo -e "${GREEN}  Node.js $(node -v) found${NC}"

# Check for build tools (needed for better-sqlite3 native compilation)
echo -e "${BLUE}==> Checking build tools...${NC}"
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${YELLOW}Warning: Python not found. better-sqlite3 may fail to compile.${NC}"
    echo "Install Python 3:"
    echo "  macOS:   xcode-select --install"
    echo "  Ubuntu:  sudo apt install python3 build-essential"
    echo "  Fedora:  sudo dnf install python3 gcc-c++ make"
fi

# Check for C++ compiler
if ! command -v g++ &> /dev/null && ! command -v clang++ &> /dev/null; then
    echo -e "${YELLOW}Warning: C++ compiler not found. better-sqlite3 may fail to compile.${NC}"
    echo "Install build tools:"
    echo "  macOS:   xcode-select --install"
    echo "  Ubuntu:  sudo apt install build-essential"
    echo "  Fedora:  sudo dnf install gcc-c++ make"
fi

# Install dependencies
echo -e "${BLUE}==> Installing dependencies...${NC}"
npm install

# Build
echo -e "${BLUE}==> Building application...${NC}"
npm run build

# Create data directories
echo -e "${BLUE}==> Setting up data directories...${NC}"
mkdir -p data public/thumbs

echo ""
echo -e "${GREEN}==> Setup complete!${NC}"
echo ""
echo "Run the dev server:  ${YELLOW}npm run dev${NC}"
echo "Open:                ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "Or run with Docker:  ${YELLOW}docker compose up --build${NC}"
echo ""
echo "Install the extension:"
echo "  1. Open chrome://extensions (or edge://extensions)"
echo "  2. Enable Developer mode"
echo "  3. Click Load unpacked"
echo "  4. Select the ${YELLOW}extension/${NC} folder"
echo ""
