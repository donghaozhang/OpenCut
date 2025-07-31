# Working Electron Build Commands

## Date: 2025-07-31

## Successfully Working Build Process

### Complete Build Commands (Working)
```bash
# 1. Navigate to web app directory
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"

# 2. Build Next.js static export with Electron optimizations
npm run export:electron

# 3. Create minimal package structure
mkdir -p temp-build && cp -r out/* temp-build/ && cp electron/main-prod.js temp-build/main.js && cp electron/preload.js temp-build/ && echo '{"name":"opencut-desktop","version":"1.0.0","main":"main.js"}' > temp-build/package.json

# 4. Package into Windows executable
npx electron-packager temp-build "OpenCut Fixed New Project" --platform=win32 --arch=x64 --out=dist --overwrite

# 5. Clean up temporary build folder
rm -rf temp-build
```

## Key Issues Fixed in This Build

### 1. New Project Navigation Fix
**Problem**: "New Project" button navigated to home page instead of editor
**Solution**: Added Electron-specific hash navigation in `projects.tsx` (lines 112-119):

```typescript
// Check if in Electron environment
if (typeof window !== 'undefined' && (window as any).electronAPI) {
  // Use hash navigation for Electron
  window.location.hash = `/editor/project/${encodeURIComponent(projectId)}`;
} else {
  // Use Next.js router for web
  router.push(`/editor/project/${encodeURIComponent(projectId)}`);
}
```

### 2. Main Process Configuration Fix
**Problem**: Packaged app missing preload script and wrong file paths
**Solution**: Manual fixes to `main.js` in packaged app:

- **Added preload script**: `preload: path.join(__dirname, 'preload.js')`
- **Fixed file path**: Changed from `../out/index.html` to `index.html`

## Final Build Location
```
C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\dist\OpenCut Fixed New Project-win32-x64\
├── OpenCut Fixed New Project.exe  ← Main executable
└── resources/
    └── app/
        ├── main.js          ← Fixed main process file
        ├── preload.js       ← Exposes electronAPI
        ├── index.html       ← Entry point
        └── _next/           ← Built assets
```

## Critical Success Factors

### 1. Preload Script Required
The packaged app MUST include the preload script to expose `electronAPI`:
```javascript
preload: path.join(__dirname, 'preload.js')
```

### 2. Hash Navigation Detection
The New Project fix relies on detecting `window.electronAPI` to use hash navigation instead of Next.js router.

### 3. File Path Correction
Packaged electron apps have files in same directory as main.js, not `../out/`.

## Testing Verification
✅ **Navigation Working**: Projects → New Project → Editor (no home page redirect)
✅ **Hash Router**: Manual hash navigation functional 
✅ **ElectronAPI**: Window object properly exposes electronAPI
✅ **Build Process**: Clean build from source to executable

## Commands That Work
- **Build**: `npm run export:electron`
- **Package**: `npx electron-packager temp-build "OpenCut Fixed New Project" --platform=win32 --arch=x64 --out=dist --overwrite`
- **Test**: Run the `.exe` file directly

## Commands to Avoid
- ❌ `npx electron-builder` (fails with dependency issues)
- ❌ Using `main.js` instead of `main-prod.js` as base (missing production optimizations)
- ❌ Building without temp structure (includes unnecessary dev dependencies)

## Build Time
- **Total**: ~2-3 minutes
- **Export**: ~30 seconds
- **Package**: ~2 minutes
- **Manual fixes**: ~30 seconds

## Automated Build Script Plan

### Proposed Automation Steps
1. **Clean existing builds**: Delete `out/` and `dist/` directories
2. **Build fresh**: Run `npm run export:electron` 
3. **Package automatically**: Run the complete packaging sequence
4. **Apply fixes**: Automatically fix main.js paths and preload script
5. **Open result**: Launch Windows Explorer to show the final executable

### Script Structure
```bash
#!/bin/bash
# auto-build-electron.sh

echo "🧹 Cleaning previous builds..."
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

echo "⚡ Applying fixes..."
# Fix main.js preload and path issues automatically

echo "🧹 Cleaning temp files..."
rm -rf temp-build

echo "📂 Opening result folder..."
explorer "dist/OpenCut Desktop-win32-x64"

echo "✅ Build complete!"
```

### Benefits
- **One command build**: Run script and get working executable
- **Consistent results**: Same process every time
- **No manual fixes**: Automate the main.js path/preload fixes
- **Instant testing**: Automatically opens folder for immediate testing
- **Clean builds**: Always starts fresh to avoid cache issues

### Usage
```bash
cd "C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web"
./auto-build-electron.sh
```

### Time Savings
- **Manual process**: 3-5 minutes with multiple commands
- **Automated process**: 2-3 minutes with single command
- **Error reduction**: No missed steps or manual fix mistakes