# Electron Router Integration Issue - White Screen After New Project

## Date: 2025-07-31

## Issue Summary
After clicking "New Project" button, the app shows a white screen. Debugging revealed that ElectronRouter is not being used despite being integrated in `_app.tsx`.

## Root Cause Analysis

### ✅ **Working Elements:**
- **Preload script**: `electronAPI` is properly exposed to window
- **Hash navigation**: Browser-level hash changes work (`window.location.hash = '#/editor/project/test-123'`)
- **ElectronRouter component**: Exists and is imported in `_app.tsx`

### ❌ **Failing Elements:**
- **ElectronRouter not rendering**: No debug messages from ElectronRouter component
- **Route matching not working**: Hash changes don't trigger React Router routes
- **New Project button**: Click handler not executing (no debug logs)

## Debugging Process

### Console Test Results:
```javascript
// 1. Function existence test
console.log('Testing if handleCreateProject exists...')
// Result: Function not found - indicates React components not rendering

// 2. Hash navigation test  
window.location.hash = '#/editor/project/test-123'
// Result: Hash changes but no route change occurs

// 3. ElectronRouter detection test
document.querySelector('[data-testid="electron-router"]') || 'No ElectronRouter found'
// Result: 'No ElectronRouter found'

// 4. Document title test
document.title
// Result: '' (empty - suggests static HTML loading)
```

### Key Findings:
1. **ElectronRouter exists but isn't being used**
2. **App is still using Next.js routing instead of HashRouter**
3. **Hash navigation works at browser level but not React Router level**
4. **No React component debug messages appearing**

## Current Architecture Analysis

### _app.tsx Configuration:
```typescript
// File: src/pages/_app.tsx (lines 23-44)
export default function App({ Component, pageProps }: AppProps) {
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI

  if (isElectron) {
    // Electron: Use Hash Router
    return (
      <div className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" forcedTheme="dark">
          <TooltipProvider>
            <UrlValidationProvider>
              <StorageProvider>
                <ElectronRouter>
                  <Toaster />
                  <DevelopmentDebug />
                </ElectronRouter>
              </StorageProvider>
            </UrlValidationProvider>
          </TooltipProvider>
        </ThemeProvider>
      </div>
    )
  }
  // ... web fallback
}
```

### ElectronRouter Implementation:
```typescript
// File: src/lib/electron-router.tsx
export function ElectronRouter({ children }: ElectronRouterProps) {
  console.log('🔧 [DEBUG] ElectronRouter rendering...');
  
  useEffect(() => {
    console.log('🔧 [DEBUG] ElectronRouter mounted');
    const handleHashChange = () => {
      console.log('🔄 [DEBUG] Hash changed to:', window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <HashRouter>
      {children}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/editor/project/:projectId" element={<DebugEditorRoute />} />
        {/* ... other routes */}
      </Routes>
    </HashRouter>
  )
}
```

## Potential Root Causes

### 1. **ElectronAPI Detection Issue**
The `isElectron` check might be failing:
- **Build-time vs Runtime**: Check happens at build time instead of runtime
- **electronAPI not available**: Window object or electronAPI not properly exposed
- **Timing issue**: Check happens before electronAPI is available

### 2. **Next.js Static Export Issue**
- **Static HTML loading**: App loads static HTML instead of React app
- **JavaScript not executing**: React hydration not happening
- **Build process**: ElectronRouter code not included in final build

### 3. **Router Integration Issue**
- **Component not mounting**: ElectronRouter renders but doesn't mount
- **Route definitions**: Routes not matching hash patterns
- **Hash format**: Hash Router expects different format than provided

## Next Steps for Resolution

### Immediate Tests Needed:
1. **ElectronAPI Detection Test**:
   ```javascript
   console.log('ElectronAPI check:', {
     hasWindow: typeof window !== 'undefined',
     electronAPI: (window as any).electronAPI,
     isElectron: typeof window !== 'undefined' && (window as any).electronAPI
   });
   ```

2. **React Hydration Test**:
   ```javascript
   // Check if React is running
   console.log('React check:', typeof React !== 'undefined' ? 'React loaded' : 'No React');
   ```

3. **Static vs Dynamic Test**:
   ```javascript
   // Check if we're loading static HTML or dynamic React
   console.log('Page type:', document.querySelector('#__next') ? 'React app' : 'Static HTML');
   ```

### Potential Fixes:

#### Option 1: Fix ElectronAPI Detection
```typescript
// Use more robust detection
const isElectron = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).electronAPI;
};
```

#### Option 2: Force Router on Hash Change
```typescript
// Listen for hash changes and force router update
useEffect(() => {
  const handleHashChange = () => {
    // Force React Router to handle hash change
    window.location.reload();
  };
  window.addEventListener('hashchange', handleHashChange);
}, []);
```

#### Option 3: Use Manual Routing
```typescript
// Replace HashRouter with manual route handling
const [currentRoute, setCurrentRoute] = useState(window.location.hash);

useEffect(() => {
  const handleHashChange = () => setCurrentRoute(window.location.hash);
  window.addEventListener('hashchange', handleHashChange);
}, []);
```

## Files Modified During Debug Implementation:
- `src/pages/projects.tsx` - Added comprehensive navigation debugging
- `src/lib/electron-router.tsx` - Added hash change listeners & debug route
- `src/pages/editor/project/[project_id].tsx` - Added router readiness checks
- `src/pages/_app.tsx` - ElectronRouter integration (existing)

## Expected Resolution:
Once ElectronRouter integration is fixed, the New Project button should:
1. Trigger project creation
2. Navigate to `#/editor/project/[id]` 
3. Show the debug editor route (gray page)
4. Display "🐛 DEBUG: Editor Route Matched!" message

## Status: 
🔍 **Investigation Phase** - Need to determine why ElectronRouter isn't being used despite proper integration in `_app.tsx`.