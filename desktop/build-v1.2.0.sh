#!/bin/bash

# Build script for v1.2.0 - Desktop app with complete web version

set -e

echo "=========================================="
echo "Building Desktop App v1.2.0"
echo "=========================================="

# Step 1: Build web version
echo ""
echo "[1/5] Building web version..."
cd ..
pnpm run build

# Step 2: Copy web build to desktop
echo ""
echo "[2/5] Copying web build to desktop..."
cd desktop
rm -rf web-dist
cp -r ../dist web-dist
echo "✓ Web build copied to desktop/web-dist/"

# Step 3: Build desktop TypeScript
echo ""
echo "[3/5] Building desktop TypeScript..."
npm run build:main
echo "✓ Desktop TypeScript compiled"

# Step 4: Download FFmpeg (if not exists)
echo ""
echo "[4/5] Checking FFmpeg..."
if [ ! -d "resources/ffmpeg/win" ]; then
  echo "FFmpeg not found. Please run download-ffmpeg.sh first"
  echo "Skipping FFmpeg check for now..."
else
  echo "✓ FFmpeg found"
fi

# Step 5: Package desktop app
echo ""
echo "[5/5] Packaging desktop app..."
npm run dist:win

echo ""
echo "=========================================="
echo "✓ Build complete!"
echo "=========================================="
echo ""
echo "Installation package location:"
echo "  desktop/release/"
echo ""
echo "Next steps:"
echo "  1. Test the installation package"
echo "  2. Install MySQL and create database"
echo "  3. Configure .env file with DATABASE_URL"
echo "  4. Run the application"
echo ""
