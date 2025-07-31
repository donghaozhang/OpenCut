#!/bin/bash
# auto-build-electron.sh
# Automated Electron build script for OpenCut

set -e  # Exit on any error

echo "🧹 Cleaning previous builds..."
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"
rm -rf out dist temp-build

echo "🏗️ Building Next.js export..."
npm run export:electron

echo "📦 Creating package structure..."
mkdir -p temp-build
cp -r out/* temp-build/
cp electron/main-prod.js temp-build/main.js
cp electron/preload.js temp-build/
echo '{"name":"opencut-desktop","version":"1.0.0","main":"main.js"}' > temp-build/package.json

echo "🔧 Packaging executable..."
npx electron-packager temp-build "OpenCut Desktop" --platform=win32 --arch=x64 --out=dist --overwrite

echo "⚡ Applying fixes to main.js..."
MAIN_JS_PATH="dist/OpenCut Desktop-win32-x64/resources/app/main.js"

# Fix 1: Add preload script
sed -i 's/webSecurity: false,/webSecurity: false,\n      preload: path.join(__dirname, '\''preload.js'\'')/' "$MAIN_JS_PATH"

# Fix 2: Fix file path from ../out/index.html to index.html
sed -i 's|path.join(__dirname, '\''../out/index.html'\'')|path.join(__dirname, '\''index.html'\'')|g' "$MAIN_JS_PATH"

# Fix 3: Update error message
sed -i 's|../out/index.html|index.html|g' "$MAIN_JS_PATH"

echo "🧹 Cleaning temp files..."
rm -rf temp-build

echo "📂 Opening result folder..."
powershell -Command "Start-Process explorer -ArgumentList 'C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\dist\OpenCut Desktop-win32-x64'" 2>/dev/null || echo "⚠️ Could not auto-open folder. Please navigate manually to:"

echo "✅ Build complete! OpenCut Desktop.exe is ready to test."
echo "📍 Location: C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\dist\OpenCut Desktop-win32-x64\OpenCut Desktop.exe"