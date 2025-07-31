/**
 * Electron Debug Trace
 * Comprehensive debugging to trace execution flow
 */

export function initElectronDebugTrace() {
  if (typeof window === 'undefined') return;
  
  const log = (stage: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const message = `🔍 [${timestamp}] [ELECTRON-DEBUG] ${stage}`;
    console.log(message, data || '');
    
    // Also append to DOM for visibility
    try {
      const debugDiv = document.getElementById('electron-debug') || createDebugDiv();
      const entry = document.createElement('div');
      entry.style.cssText = 'padding: 2px 0; font-family: monospace; font-size: 12px;';
      entry.textContent = `${message} ${data ? JSON.stringify(data) : ''}`;
      debugDiv.appendChild(entry);
    } catch (e) {
      // Ignore DOM errors
    }
  };
  
  function createDebugDiv() {
    const div = document.createElement('div');
    div.id = 'electron-debug';
    div.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.9);
      color: #0f0;
      padding: 10px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 999999;
      font-size: 11px;
      border-bottom: 2px solid #0f0;
    `;
    document.body.appendChild(div);
    return div;
  }
  
  // Log initial state
  log('INIT', {
    href: window.location.href,
    hash: window.location.hash,
    pathname: window.location.pathname,
    electronAPI: !!(window as any).electronAPI,
    userAgent: navigator.userAgent
  });
  
  // Monitor hash changes
  window.addEventListener('hashchange', (e) => {
    log('HASH_CHANGE', {
      oldURL: e.oldURL,
      newURL: e.newURL,
      hash: window.location.hash
    });
  });
  
  // Monitor DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      log('DOM_CONTENT_LOADED', {
        readyState: document.readyState,
        bodyChildren: document.body.children.length
      });
    });
  } else {
    log('DOM_ALREADY_LOADED', {
      readyState: document.readyState,
      bodyChildren: document.body.children.length
    });
  }
  
  // Monitor React mounting
  const originalCreateElement = document.createElement;
  let reactRootCreated = false;
  document.createElement = function(...args: any[]) {
    const element = originalCreateElement.apply(document, args as any);
    if (args[0] === 'div' && !reactRootCreated) {
      const stack = new Error().stack || '';
      if (stack.includes('createRoot') || stack.includes('render')) {
        reactRootCreated = true;
        log('REACT_ROOT_CREATED', { tag: args[0] });
      }
    }
    return element;
  } as any;
  
  // Script monitoring removed due to TypeScript issues
  // Will rely on other debugging methods
  
  // Log when this module loads
  log('DEBUG_TRACE_LOADED');
  
  // Export log function for use in other modules
  (window as any).__electronDebugLog = log;
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initElectronDebugTrace();
}