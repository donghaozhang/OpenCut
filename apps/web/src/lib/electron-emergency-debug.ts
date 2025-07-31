/**
 * Emergency Debug - Add to HTML head to diagnose loading issues
 */

console.log('🚨 [EMERGENCY-DEBUG] Script loaded!');

// Add visual indicator immediately
const debugDiv = document.createElement('div');
debugDiv.id = 'emergency-debug';
debugDiv.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: red;
  color: white;
  padding: 10px;
  z-index: 999999;
  font-family: monospace;
  font-size: 14px;
`;
debugDiv.innerHTML = '🚨 EMERGENCY DEBUG: JS Loading...';
document.body.appendChild(debugDiv);

// Check if React is available
setTimeout(() => {
  const React = (window as any).React;
  const hasReact = !!React;
  const hasNext = !!(window as any).__NEXT_DATA__;
  const hasElectron = !!(window as any).electronAPI;
  
  debugDiv.innerHTML = `
    🚨 EMERGENCY DEBUG:<br>
    React: ${hasReact ? '✅' : '❌'}<br>
    Next.js: ${hasNext ? '✅' : '❌'}<br>
    Electron: ${hasElectron ? '✅' : '❌'}<br>
    Scripts loaded: ${document.scripts.length}<br>
    Body children: ${document.body.children.length}
  `;
  
  console.log('🚨 [EMERGENCY-DEBUG] Status:', {
    hasReact,
    hasNext,
    hasElectron,
    scriptsCount: document.scripts.length,
    bodyChildren: document.body.children.length,
    url: window.location.href
  });
}, 1000);

export {};