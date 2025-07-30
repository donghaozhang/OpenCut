const { app, BrowserWindow, protocol } = require('electron');
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
    },
    show: true,
    center: true,
    alwaysOnTop: true // Temporarily make it always on top to ensure visibility
  });

  // Set up protocol handler for app://
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6); // Remove 'app://'
    const filePath = path.join(__dirname, '../out', url);
    callback({ path: filePath });
  });

  // Load the index.html from the built output
  const indexPath = path.join(__dirname, '../out/index.html');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Loading production build from:', indexPath);
    await mainWindow.loadFile(indexPath);
  } else {
    console.error('❌ Production build not found at:', indexPath);
    console.log('💡 Run "bun run export:electron" first to build the app');
    await mainWindow.loadURL(`data:text/html,<h1>Build not found</h1><p>Run: bun run export:electron</p>`);
  }

  console.log('🚀 OpenCut Desktop window created');

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`❌ Failed to load: ${validatedURL}`);
    console.error(`Error: ${errorDescription} (${errorCode})`);
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