import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
// Direct import instead of dynamic import for Electron static build
import EditorPage from '../pages/editor/project/[project_id]'

export function ElectronEditorWrapper() {
  const { projectId } = useParams<{ projectId: string }>()
  const debugLog = (window as any).__electronDebugLog || console.log;
  
  console.log('🔧 [ELECTRON-WRAPPER] Params from React Router:', { projectId })
  console.log('🔧 [ELECTRON-WRAPPER] Current hash:', window.location.hash)
  debugLog('ELECTRON_EDITOR_WRAPPER_RENDERING', {
    projectId,
    hash: window.location.hash,
    href: window.location.href
  });
  
  useEffect(() => {
    // Inject the project ID into Next.js router query
    if (typeof window !== 'undefined' && projectId) {
      const nextRouter = (window as any).__NEXT_DATA__?.query || {}
      nextRouter.project_id = projectId
      
      // Update the global Next.js data
      if ((window as any).__NEXT_DATA__) {
        (window as any).__NEXT_DATA__.query = {
          ...(window as any).__NEXT_DATA__.query,
          project_id: projectId
        }
      }
      
      console.log('🔧 [ELECTRON-WRAPPER] Updated Next.js query:', (window as any).__NEXT_DATA__?.query)
    }
  }, [projectId])
  
  // Pass project ID as a prop override
  const EditorWithProps = () => {
    try {
      debugLog('EDITOR_WITH_PROPS_RENDERING', { projectId });
      console.log('🎯 [DEBUG] About to render EditorPage component directly...');
      
      // Monkey patch the Next.js router
      const router = require('next/router').useRouter()
      if (router && projectId) {
        router.query = { ...router.query, project_id: projectId }
        router.isReady = true
        console.log('🔧 [DEBUG] Router patched with project_id:', projectId);
      }
      
      console.log('✅ [DEBUG] Rendering EditorPage directly (no dynamic import)');
      
      // Add error boundary for the editor page
      try {
        return (
          <div style={{background: 'green', minHeight: '100vh', padding: '20px'}}>
            <div style={{background: 'yellow', color: 'black', padding: '10px', marginBottom: '20px'}}>
              DEBUG: Direct import EditorPage with project ID: {projectId}
            </div>
            <EditorPage />
          </div>
        );
      } catch (editorError) {
        console.error('❌ [DEBUG] EditorPage render error:', editorError);
        return (
          <div style={{padding: '20px', background: 'orange', color: 'black', minHeight: '100vh'}}>
            <h1>Editor Render Error</h1>
            <p>Error rendering EditorPage: {editorError instanceof Error ? editorError.message : String(editorError)}</p>
            <p>Project ID: {projectId}</p>
            <pre>{editorError instanceof Error ? editorError.stack : 'No stack trace'}</pre>
          </div>
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog('EDITOR_WITH_PROPS_ERROR', { error: errorMessage });
      console.error('❌ [DEBUG] EditorWithProps error:', error);
      return (
        <div style={{padding: '20px', background: 'red', color: 'white', minHeight: '100vh'}}>
          <h1>Editor Error</h1>
          <p>Error: {errorMessage}</p>
          <p>Project ID: {projectId}</p>
          <pre>{error instanceof Error ? error.stack : 'No stack trace'}</pre>
        </div>
      );
    }
  }
  
  if (!projectId) {
    return (
      <div style={{padding: '20px', background: 'orange', color: 'black'}}>
        <h1>No Project ID</h1>
        <p>Project ID is missing from URL</p>
        <p>Current hash: {window.location.hash}</p>
      </div>
    );
  }
  
  return <EditorWithProps />
}