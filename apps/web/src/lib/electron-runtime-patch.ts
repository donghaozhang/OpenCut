/**
 * Electron Runtime Patch
 * 
 * This module patches webpack's chunk loading mechanism to work correctly
 * in Electron's file:// protocol environment.
 */

export function patchElectronRuntime() {
  if (typeof window === 'undefined') return;
  
  // Only apply in Electron environment
  if (!(window as any).electronAPI) return;
  
  console.log('🔧 [ELECTRON-PATCH] Applying runtime patches for chunk loading...');
  
  // Patch webpack's public path if it exists
  if ((window as any).__webpack_public_path__) {
    console.log('🔧 [ELECTRON-PATCH] Original webpack public path:', (window as any).__webpack_public_path__);
    (window as any).__webpack_public_path__ = './';
    console.log('🔧 [ELECTRON-PATCH] Updated webpack public path:', (window as any).__webpack_public_path__);
  }
  
  // Patch webpack require if it exists
  if ((window as any).__webpack_require__) {
    const wr = (window as any).__webpack_require__;
    if (wr.p) {
      console.log('🔧 [ELECTRON-PATCH] Original webpack require.p:', wr.p);
      wr.p = './';
      console.log('🔧 [ELECTRON-PATCH] Updated webpack require.p:', wr.p);
    }
    
    // Patch the chunk loading function if it exists
    if (wr.l) {
      const originalL = wr.l;
      wr.l = function(url: string, done: any, key: any, chunkId: any) {
        // Fix absolute URLs to be relative
        if (url && url.startsWith('/')) {
          const newUrl = '.' + url;
          console.log('🔧 [ELECTRON-PATCH] Rewriting chunk URL:', url, '->', newUrl);
          return originalL.call(this, newUrl, done, key, chunkId);
        }
        return originalL.call(this, url, done, key, chunkId);
      };
    }
  }
  
  // Override document.createElement to intercept script loading
  const originalCreateElement = document.createElement;
  document.createElement = function(...args: any[]) {
    const element = originalCreateElement.apply(document, args as any);
    
    if (args[0] === 'script' && element.setAttribute) {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name: string, value: string) {
        if (name === 'src' && value) {
          // Fix absolute paths in script src
          if (value.startsWith('/_next/')) {
            const newValue = './_next/' + value.slice(7);
            console.log('🔧 [ELECTRON-PATCH] Rewriting script src:', value, '->', newValue);
            return originalSetAttribute.call(this, name, newValue);
          }
          // Fix paths that start with file:///C:/_next
          if (value.includes('file:///') && value.includes('/_next/')) {
            const match = value.match(/file:\/\/\/[^/]+(\/_next\/.+)/);
            if (match) {
              const newValue = '.' + match[1];
              console.log('🔧 [ELECTRON-PATCH] Fixing file:// script src:', value, '->', newValue);
              return originalSetAttribute.call(this, name, newValue);
            }
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    if (args[0] === 'link' && element.setAttribute) {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name: string, value: string) {
        if (name === 'href' && value) {
          // Fix absolute paths in link href
          if (value.startsWith('/_next/')) {
            const newValue = './_next/' + value.slice(7);
            console.log('🔧 [ELECTRON-PATCH] Rewriting link href:', value, '->', newValue);
            return originalSetAttribute.call(this, name, newValue);
          }
          // Fix paths that start with file:///C:/_next
          if (value.includes('file:///') && value.includes('/_next/')) {
            const match = value.match(/file:\/\/\/[^/]+(\/_next\/.+)/);
            if (match) {
              const newValue = '.' + match[1];
              console.log('🔧 [ELECTRON-PATCH] Fixing file:// link href:', value, '->', newValue);
              return originalSetAttribute.call(this, name, newValue);
            }
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  } as any;
  
  console.log('✅ [ELECTRON-PATCH] Runtime patches applied successfully');
}

// Auto-apply patch on import in Electron environment
if (typeof window !== 'undefined' && (window as any).electronAPI) {
  // Apply patch as early as possible
  patchElectronRuntime();
}