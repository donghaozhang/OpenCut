const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic electron detection
  isElectron: true,
  
  // Platform info
  platform: process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // File system operations (if needed in the future)
  openFile: () => ipcRenderer.invoke('dialog-open-file'),
  saveFile: (data) => ipcRenderer.invoke('dialog-save-file', data),
  
  // Navigation (for debugging)
  navigate: (path) => ipcRenderer.invoke('navigate', path),
  
  // Development
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
})

console.log('🔧 Preload script loaded - electronAPI exposed to window')