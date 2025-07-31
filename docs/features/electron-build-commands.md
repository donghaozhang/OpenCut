# Electron Build Commands - Manual Hash Navigation

## Complete Build Process (Working)

### Step 1: Build Next.js Static Export
```bash
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"
bun run build
```

### Step 2: Fix Paths for Electron
```bash
node scripts/fix-electron-paths-robust.js
```

### Step 3: Update electron-dist with Latest Build
```bash
cp -r out electron-dist/out
```

### Step 4: Package with electron-packager
```bash
npx electron-packager electron-dist "OpenCut Manual Hash Navigation" --platform=win32 --arch=x64 --out=dist --overwrite
```

## Quick Test Commands

### Test Development Build
```bash
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"
npx electron electron-dist/main.js
```

### Test Packaged Build
```bash
# Navigate to:
# C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\dist\OpenCut Manual Hash Navigation-win32-x64\
# Run: OpenCut Manual Hash Navigation.exe
```

## Alternative Build Method (if electron-packager fails)

### Using npm scripts
```bash
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"
npm run electron:pack
```

### Using electron-builder
```bash
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"
npx electron-builder --dir
```

## Build Output

**Success**: Creates executable at:
```
C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\dist\OpenCut Manual Hash Navigation-win32-x64\OpenCut Manual Hash Navigation.exe
```

**Features**:
- ✅ Manual hash navigation (`window.location.hash`)
- ✅ Working Projects button navigation
- ✅ Fresh app bundle with latest fixes
- ✅ Debug console messages for troubleshooting

## Build Status
- **Date**: 2025-07-31
- **Status**: ✅ WORKING
- **Navigation**: Manual hash navigation implemented
- **App Bundle**: `_app-baf66a4eacabccba.js`