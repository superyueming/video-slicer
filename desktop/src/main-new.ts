import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let serverPort: number = 3000;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the web app
  await mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('[Startup] Application started successfully');
}

app.whenReady().then(async () => {
  console.log('[Startup] Electron app ready');
  
  // Start the server (imported from server/_core/index.ts)
  try {
    // Import and start the web server
    const serverModule = await import('./server/_core/index');
    console.log('[Startup] Server started');
    
    // Create window
    await createWindow();
  } catch (error) {
    console.error('[Startup] Failed to start:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
