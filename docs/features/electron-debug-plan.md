# Electron Debug Plan - New Project White Screen Issue

## Date: 2025-07-31

## Issue Description
After clicking "New Project" button, the screen goes white with no visible errors. Need to add comprehensive debugging to understand the flow.

## TODO Tasks

### High Priority
- [ ] **debug-1**: Add navigation flow debugging to projects.tsx handleCreateProject function with console.log statements
- [ ] **debug-2**: Add hash router debugging to electron-router.tsx with hashchange event listeners  
- [ ] **debug-3**: Add temporary debug route to electron-router.tsx to test basic hash navigation
- [ ] **debug-7**: Test white screen issue by clicking New Project and analyzing DevTools console output

### Medium Priority  
- [ ] **debug-4**: Enable debugLogger integration in projects.tsx for project store debugging
- [ ] **debug-5**: Add editor component debugging to [project_id].tsx with router readiness checks
- [ ] **debug-8**: Verify manual hash navigation works by testing window.location.hash in DevTools

### Low Priority
- [ ] **debug-6**: Add main process debugging to packaged main.js with console-message forwarding

## Current Architecture (Verified)

### Key Files Found:
- ✅ **Router**: `src/lib/electron-router.tsx` - Uses HashRouter with Routes
- ✅ **Projects**: `src/pages/projects.tsx` - Contains handleCreateProject function  
- ✅ **Editor**: `src/pages/editor/project/[project_id].tsx` - Target page component
- ✅ **Store**: `src/stores/project-store.ts` - Has existing debugLogger integration
- ✅ **Preload**: `electron/preload.js` - Exposes electronAPI

### Current Route Structure:
```typescript
// From electron-router.tsx
<Route path="/editor/project/:projectId" element={<EditorPage />} />
```

### Potential Issue:
The navigation uses `/editor/project/${projectId}` but route expects `:projectId` parameter.

## Debug Strategy

### 1. Console Logging Points

#### A. Navigation Flow Debugging (debug-1)
**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\src\pages\projects.tsx`
**Location:** handleCreateProject function (around line 96)
**Action:** Replace existing function with debug version

Add console logs to track the complete navigation process:
```typescript
const handleCreateProject = async () => {
  console.log('🚀 [DEBUG] New Project button clicked');
  
  if (isCreatingProject) {
    console.log('🚫 [DEBUG] Creation already in progress, ignoring duplicate click');
    return;
  }
  
  setIsCreatingProject(true);
  console.log('🏗️ [DEBUG] Starting project creation...');
  
  try {
    console.log('📝 [DEBUG] Calling createNewProject...');
    const projectId = await createNewProject("New Project");
    console.log('✅ [DEBUG] Project created successfully:', projectId);
    
    // Add delay debugging
    console.log('⏳ [DEBUG] Adding 100ms delay before navigation...');
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('⏳ [DEBUG] Delay complete, proceeding to navigation');
    
    // Environment detection debugging
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI;
    console.log('🔍 [DEBUG] Environment check:', {
      hasWindow: typeof window !== 'undefined',
      hasElectronAPI: hasElectronAPI,
      electronAPI: hasElectronAPI ? (window as any).electronAPI : 'not found'
    });
    
    if (hasElectronAPI) {
      const targetHash = `/editor/project/${encodeURIComponent(projectId)}`;
      console.log('🔄 [DEBUG] Using hash navigation for Electron to:', targetHash);
      console.log('🔍 [DEBUG] Current hash before change:', window.location.hash);
      
      window.location.hash = targetHash;
      
      console.log('🔍 [DEBUG] Hash after change:', window.location.hash);
      console.log('🔍 [DEBUG] Full URL after change:', window.location.href);
    } else {
      console.log('🔄 [DEBUG] Using Next.js router for web');
      router.push(`/editor/project/${encodeURIComponent(projectId)}`);
    }
    
    console.log('✅ [DEBUG] Navigation command completed');
  } catch (error) {
    console.error('❌ [DEBUG] Project creation failed:', error);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    throw error;
  } finally {
    console.log('🔄 [DEBUG] Setting isCreatingProject to false');
    setIsCreatingProject(false);
  }
};
```

#### B. Hash Router Debugging (debug-2)
**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\src\lib\electron-router.tsx`
**Location:** ElectronRouter function (around line 18)
**Action:** Add useEffect with hashchange listeners

Add debugging to the Hash Router component:
```typescript
export function ElectronRouter({ children }: ElectronRouterProps) {
  console.log('🔧 [DEBUG] ElectronRouter rendering...');
  
  useEffect(() => {
    console.log('🔧 [DEBUG] ElectronRouter mounted');
    console.log('🔧 [DEBUG] Current location:', window.location.href);
    console.log('🔧 [DEBUG] Current hash:', window.location.hash);
    
    const handleHashChange = () => {
      console.log('🔄 [DEBUG] Hash changed to:', window.location.hash);
      console.log('🔄 [DEBUG] Full URL:', window.location.href);
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
        <Route path="/editor/project/:projectId" element={<EditorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/contributors" element={<ContributorsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/why-not-capcut" element={<WhyNotCapcutPage />} />
      </Routes>
    </HashRouter>
  );
}
```

#### C. Temporary Debug Route (debug-3)
**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\src\lib\electron-router.tsx`
**Location:** Inside Routes component (around line 22)
**Action:** Replace editor route temporarily with debug version

**Add temporary debug route to catch any navigation issues:**
```typescript
// Add this route for debugging
<Route path="/editor/project/:projectId" element={
  <div style={{padding: '20px', fontSize: '18px'}}>
    <h1>🐛 DEBUG: Editor Route Matched!</h1>
    <p>Project ID: {useParams().projectId}</p>
    <p>Current Hash: {window.location.hash}</p>
    <p>Full URL: {window.location.href}</p>
  </div>
} />
```

#### D. Main Process Debugging (debug-6)
**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\dist\OpenCut Desktop-win32-x64\resources\app\main.js`
**Location:** Throughout main.js file
**Action:** Add console logging and console-message forwarding

Add logging to Electron main process:
```javascript
// Add at the top
console.log('🚀 [MAIN] Electron main process starting...');

// In createWindow function
console.log('🪟 [MAIN] Creating window...');
console.log('🔧 [MAIN] Preload script path:', path.join(__dirname, 'preload.js'));

mainWindow.webContents.on('did-start-loading', () => {
  console.log('📥 [MAIN] Page started loading');
});

mainWindow.webContents.on('did-finish-load', () => {
  console.log('✅ [MAIN] Page finished loading');
});

mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
  console.error('❌ [MAIN] Failed to load:', validatedURL);
  console.error('❌ [MAIN] Error:', errorDescription, errorCode);
});

mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
  console.log(`📝 [RENDERER] ${level}: ${message} (${sourceId}:${line})`);
});
```

#### E. Preload Script Debugging
**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\electron\preload.js`
**Location:** Throughout preload.js file
**Action:** Add console logging for electronAPI exposure

Add debugging to preload script:
```javascript
console.log('🔧 [PRELOAD] Preload script starting...');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  debug: {
    log: (message) => console.log(`🐛 [API] ${message}`)
  }
});

console.log('✅ [PRELOAD] electronAPI exposed to window');
```

### 2. Project Store Debugging (debug-4)

**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\src\pages\projects.tsx`
**Location:** Top of file imports and handleCreateProject function
**Action:** Import debugLogger and add logging calls

**The project store already has debugLogger integration!** Just need to enable verbose logging.

**In `src/stores/project-store.ts` - createNewProject function (around line 39):**
The store already uses `debugLogger.log()` calls. To see these logs, add this at the top of projects.tsx:

```typescript
// Add at the top of projects.tsx to enable debug logging
import { debugLogger } from "@/lib/debug-logger";

// Enable verbose logging in handleCreateProject
const handleCreateProject = async () => {
  debugLogger.log('UI', 'NEW_PROJECT_CLICKED', { timestamp: Date.now() });
  
  // ... existing code ...
  
  try {
    debugLogger.log('UI', 'CALLING_CREATE_PROJECT', { name: "New Project" });
    const projectId = await createNewProject("New Project");
    debugLogger.log('UI', 'PROJECT_CREATED', { projectId });
    
    // ... rest of function
  } catch (error) {
    debugLogger.log('UI', 'PROJECT_CREATION_FAILED', { error: error.message });
    throw error;
  }
};
```

### 3. Route Component Debugging (debug-5)

**File:** `C:\Users\zdhpe\Desktop\New folder\OpenCut\apps\web\src\pages\editor\project\[project_id].tsx`
**Location:** Default export function (around line 40)
**Action:** Add console logging and router validation

Add debugging to the editor page component:

**In `src/pages/editor/project/[project_id].tsx` (around line 40):**
The file already has debugLogger integration. Add more verbose logging:

```typescript
// Add at the top of the default export function
export default function EditorPage() {
  console.log('✏️ [EDITOR] Editor page rendering...');
  console.log('✏️ [EDITOR] Current URL:', window.location.href);
  console.log('✏️ [EDITOR] Current hash:', window.location.hash);
  console.log('✏️ [EDITOR] Render count:', ++renderCount);
  
  const router = useRouter();
  console.log('✏️ [EDITOR] Router query:', router.query);
  console.log('✏️ [EDITOR] Router isReady:', router.isReady);
  
  useEffect(() => {
    console.log('✏️ [EDITOR] Editor page mounted');
    console.log('✏️ [EDITOR] Router query on mount:', router.query);
  }, [router.query]);
  
  // Add early return for debugging
  if (!router.isReady) {
    console.log('⏳ [EDITOR] Router not ready, showing loading...');
    return <div style={{padding: '20px', fontSize: '18px'}}>🔄 Router Loading...</div>;
  }
  
  if (!router.query.project_id) {
    console.log('❌ [EDITOR] No project_id in query:', router.query);
    return <div style={{padding: '20px', fontSize: '18px'}}>❌ No Project ID Found</div>;
  }
  
  console.log('✅ [EDITOR] All checks passed, rendering editor...');
  
  // ... rest of component
}
```

## Debug Output Analysis

### Expected Flow
1. `🚀 [DEBUG] New Project button clicked`
2. `🏗️ [DEBUG] Starting project creation...`
3. `📦 [STORE] Creating new project: New Project` (via debugLogger)
4. `✅ [DEBUG] Project created successfully: [ID]`
5. `🔍 [DEBUG] Environment check: {hasElectronAPI: true}`
6. `🔄 [DEBUG] Using hash navigation for Electron to: /editor/project/[ID]`
7. `🔄 [DEBUG] Hash changed to: #/editor/project/[ID]`
8. `✏️ [EDITOR] Editor page rendering...`
9. `✅ [EDITOR] All checks passed, rendering editor...`

### Key Debugging Questions
1. **Is project creation working?** → Look for debugLogger output from project-store
2. **Is hash navigation triggered?** → Look for hash change events
3. **Is the route matching?** → Check if ElectronRouter receives the hash change
4. **Is the editor component mounting?** → Look for editor page render logs
5. **Is Next.js router confusing the hash router?** → Check for router conflicts

### Most Likely Issues
1. **Route Parameter Mismatch**: Hash uses `/editor/project/[ID]` but route expects `:projectId`
2. **Router Conflict**: Next.js router and Hash router conflicting
3. **Component Loading Error**: Editor component failing to render silently
4. **Hash Format Issue**: Hash not properly formatted for React Router

### Immediate Test Strategy
1. **Add simple debug route** first to test hash navigation
2. **Check if ANY route changes work** in hash router
3. **Verify electronAPI detection** is working
4. **Test with manual hash changes** in DevTools console

## Testing Instructions (debug-7 & debug-8)

### debug-7: Test White Screen Issue
1. **Add all debug logging** to the mentioned files
2. **Run the automated build** script: `./auto-build-electron.sh`
3. **Launch the app**: Run `OpenCut Desktop.exe`
4. **Open DevTools**: Press F12 in the Electron app
5. **Click "New Project"** and watch console output
6. **Analyze the flow** to identify where it stops/fails

### debug-8: Manual Hash Navigation Test
1. **Open DevTools** in the running Electron app (F12)
2. **Test manual navigation** in console:
   ```javascript
   // Test basic hash navigation
   window.location.hash = '#/projects'
   
   // Test editor navigation with fake ID
   window.location.hash = '#/editor/project/test-123'
   
   // Check current hash
   console.log('Current hash:', window.location.hash)
   console.log('Full URL:', window.location.href)
   ```
3. **Observe** if routes change and components render
4. **Compare** manual vs automatic navigation behavior

## Implementation Priority

1. **High Priority**: Navigation flow debugging (projects.tsx)
2. **High Priority**: Hash router debugging (electron-router.tsx)  
3. **Medium Priority**: Project store debugging
4. **Medium Priority**: Main process debugging
5. **Low Priority**: Preload script debugging (if electronAPI issues suspected)

This systematic debugging approach will help identify exactly where the white screen issue occurs in the New Project flow.