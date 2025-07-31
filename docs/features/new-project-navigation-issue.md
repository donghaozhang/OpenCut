# New Project Button Navigation Issue

## Date: 2025-07-31

## Problem Description
When clicking the "New Project" button on the Projects page, it navigates back to the home page instead of creating a new project and staying on the Projects page.

## Console Log Analysis
```
✅ UniversalLink: Using manual hash navigation for href: /projects
🔥 Manual hash navigation to: /projects
```
The navigation TO the projects page works correctly, but the "New Project" button action fails.

## Root Cause
The `handleCreateProject` function in `projects.tsx` uses `router.push()` to navigate to the editor after creating a project:

```typescript
// Line 112 in projects.tsx
router.push(`/editor/project/${encodeURIComponent(projectId)}`);
```

In Electron with Hash Router, this Next.js router navigation doesn't work properly and causes a redirect to home page.

## Files to Check

### 1. Projects Page Component
**File**: `apps/web/src/pages/projects.tsx`
- Look for the "New Project" button implementation
- Check if it uses `href="/"` or similar navigation
- Should use `onClick` handler instead of navigation

### 2. Project Store
**File**: `apps/web/src/stores/project-store.ts`
- Contains `createNewProject()` function
- Should create project without navigation

### 3. UniversalLink Component
**File**: `apps/web/src/components/universal-link.tsx`
- Currently working correctly for navigation
- Issue is with the button action, not UniversalLink

## Expected Behavior
1. User clicks "New Project" button
2. New project is created in store
3. User stays on Projects page
4. New project appears in project list

## Current Behavior
1. User clicks "New Project" button
2. Navigation occurs (possibly to `/` or invalid route)
3. Hash Router redirects to home page
4. Project may or may not be created

## Solution

### Fix: Use Hash Navigation in Electron

In `projects.tsx`, modify the `handleCreateProject` function to use hash navigation in Electron:

```typescript
// Around line 96-119 in projects.tsx
const handleCreateProject = async () => {
  if (isCreatingProject) {
    console.log('🚫 [PROJECT] Creation already in progress, ignoring duplicate click');
    return;
  }
  
  setIsCreatingProject(true);
  console.log('🚀 [PROJECT] Starting project creation...');
  
  try {
    const projectId = await createNewProject("New Project");
    console.log('✅ [PROJECT] Project created, navigating to:', projectId);
    
    // Add small delay to ensure state has stabilized before navigation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if in Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // Use hash navigation for Electron
      window.location.hash = `/editor/project/${encodeURIComponent(projectId)}`;
    } else {
      // Use Next.js router for web
      router.push(`/editor/project/${encodeURIComponent(projectId)}`);
    }
  } catch (error) {
    console.error('❌ [PROJECT] Creation failed:', error);
    throw error; // Re-throw to trigger error boundary
  } finally {
    setIsCreatingProject(false);
  }
};
```

## Implementation Steps

### 1. Find the New Project Button
```bash
# Search for "New Project" button text
grep -r "New Project" apps/web/src/
```

### 2. Check Current Implementation
Look for patterns like:
- `<Link href="/">New Project</Link>`
- `<UniversalLink href="/">New Project</UniversalLink>`
- `router.push('/')`

### 3. Fix the Button
Replace navigation with action:
```typescript
const handleCreateProject = () => {
  // Create project
  const newProject = projectStore.createNewProject();
  
  // Optional: Show success message
  toast.success('Project created!');
  
  // Stay on current page (no navigation)
};
```

## Related Files Summary
- `apps/web/src/pages/projects.tsx` - Projects page with New Project button
- `apps/web/src/stores/project-store.ts` - Project creation logic
- `apps/web/src/components/universal-link.tsx` - Navigation component (working correctly)
- `apps/web/src/lib/electron-router.tsx` - Route definitions

## Testing
After fix:
1. Navigate to Projects page
2. Click "New Project" button
3. Verify: Stay on Projects page
4. Verify: New project appears in list
5. Verify: No navigation to home occurs