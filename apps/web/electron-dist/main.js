const { app, BrowserWindow, protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Register custom protocol for serving local files
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
      partition: 'nopersist', // Force fresh cache
    },
    show: true,
    center: true,
    alwaysOnTop: true // Temporarily make it always on top to ensure visibility
  });

  // Set up protocol handler for app://
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6); // Remove 'app://'
    const filePath = path.join(__dirname, 'out', url);
    callback({ path: filePath });
  });

  // Load the index.html from the built output
  const indexPath = path.join(__dirname, 'out/index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Loading production build from:', indexPath);
    await mainWindow.loadFile(indexPath);
  } else {
    console.error('❌ Production build not found at:', indexPath);
    console.log('💡 Run "bun run export:electron" first to build the app');
    await mainWindow.loadURL(`data:text/html,<h1>Build not found</h1><p>Run: bun run export:electron</p>`);
  }

  console.log('🚀 OpenCut Desktop window created');

  // Intercept failed requests and fix paths for chunks and assets
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const { url } = details;
    
    // Fix chunk loading URLs that have wrong paths
    if (url.includes('/_next/static/chunks/') && !url.includes('/out/_next/')) {
      const fixedUrl = url.replace('file:///C:/_next/', `file:///${__dirname.replace(/\\/g, '/')}/out/_next/`);
      console.log('🔧 Fixing chunk URL:', url, '->', fixedUrl);
      callback({ redirectURL: fixedUrl });
      return;
    }
    
    // Fix other _next assets
    if (url.includes('/_next/') && !url.includes('/out/_next/') && url.startsWith('file:///C:/')) {
      const fixedUrl = url.replace('file:///C:/_next/', `file:///${__dirname.replace(/\\/g, '/')}/out/_next/`);
      console.log('🔧 Fixing asset URL:', url, '->', fixedUrl);
      callback({ redirectURL: fixedUrl });
      return;
    }
    
    // Fix root-level assets (landing-page-bg.png, logo.svg, etc.)
    if (url.startsWith('file:///C:/') && !url.includes('/out/') && !url.includes('/_next/')) {
      // Extract the filename from the URL
      const filename = url.replace('file:///C:/', '');
      const fixedUrl = `file:///${__dirname.replace(/\\/g, '/')}/out/${filename}`;
      console.log('🔧 Fixing root asset:', url, '->', fixedUrl);
      callback({ redirectURL: fixedUrl });
      return;
    }
    
    // Fix editor page assets
    if (url.startsWith('file:///C:/editor/') && !url.includes('/out/')) {
      const assetPath = url.replace('file:///C:/editor/', '');
      const fixedUrl = `file:///${__dirname.replace(/\\/g, '/')}/out/_next/static/${assetPath}`;
      console.log('🔧 Fixing editor asset:', url, '->', fixedUrl);
      callback({ redirectURL: fixedUrl });
      return;
    }
    
    callback({});
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`❌ Failed to load: ${validatedURL}`);
    console.error(`Error: ${errorDescription} (${errorCode})`);
    
    // Hash Router handles all routing client-side
    // Only redirect non-hash URLs back to index.html
    if (validatedURL.includes('file://') && 
        !validatedURL.includes('index.html') && 
        !validatedURL.includes('#')) {
      console.log('🔄 Hash Router: Redirecting to index.html for client-side routing');
      mainWindow.loadFile(indexPath);
    } else if (validatedURL.includes('#')) {
      console.log('🔄 Hash Router: Allowing hash URL navigation:', validatedURL);
    }
  });

  // Handle navigation events for client-side routing
  mainWindow.webContents.on('will-navigate', (event, url) => {
    console.log('🧭 Navigation attempt to:', url);
    
    // Allow external URLs (open in default browser)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
      return;
    }
    
    // Hash URLs should be handled by Hash Router, not main process
    if (url.includes('#')) {
      console.log('🔄 Hash Router: Hash URL detected, letting client handle:', url);
      return; // Let Hash Router handle hash navigation
    }
    
    // Non-hash URLs - let it fail and handle in did-fail-load
    console.log('🔄 Allowing navigation to fail, will handle in did-fail-load');
  });

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});