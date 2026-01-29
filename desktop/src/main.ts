import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import { UpdateManager } from './updater';
import { OnlineVerifier } from './onlineVerifier';
import { startServer } from './server';

const APP_VERSION = '1.0.0';
const SERVER_URL = 'https://your-server.com'; // Replace with your actual server URL

let mainWindow: BrowserWindow | null = null;
let updateManager: UpdateManager | null = null;
let onlineVerifier: OnlineVerifier | null = null;
let serverPort: number = 3000;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false, // Don't show until ready
  });

  // Load the local server
  await mainWindow.loadURL(`http://localhost:${serverPort}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

async function checkUpdateAndVerify(): Promise<boolean> {
  try {
    // 1. Check for updates
    console.log('[Startup] Checking for updates...');
    updateManager = new UpdateManager(APP_VERSION, SERVER_URL);
    
    const updateInfo = await updateManager.checkUpdate();
    
    if (updateInfo.forceUpdate) {
      // Force update required - block app usage
      console.log('[Startup] Force update required');
      await showForceUpdateDialog(updateInfo);
      return false;
    }
    
    if (updateInfo.needsUpdate && !updateInfo.forceUpdate) {
      // Optional update available
      console.log('[Startup] Optional update available');
      const userChoice = await dialog.showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: `发现新版本 ${updateInfo.latestVersion}，是否立即更新？`,
        detail: updateInfo.releaseNotes,
        buttons: ['稍后更新', '立即更新'],
        defaultId: 1,
        cancelId: 0,
      });
      
      if (userChoice.response === 1) {
        // User chose to update
        await updateManager.downloadAndInstall();
        return false;
      }
    }
    
    // 2. Verify online status
    console.log('[Startup] Verifying online status...');
    onlineVerifier = new OnlineVerifier(APP_VERSION, SERVER_URL);
    
    const verifyResult = await onlineVerifier.verify();
    
    if (!verifyResult.canUse) {
      // Cannot use - show error and exit
      console.log('[Startup] Cannot use app:', verifyResult.message);
      await dialog.showMessageBox({
        type: 'error',
        title: '无法使用',
        message: verifyResult.message,
        detail: verifyResult.online 
          ? '请更新到最新版本后再使用' 
          : '请检查网络连接后重试',
        buttons: ['退出'],
      });
      return false;
    }
    
    console.log('[Startup] Verification passed');
    
    // Start periodic online verification (every 5 minutes)
    onlineVerifier.startPeriodicVerification(5 * 60 * 1000, () => {
      // On verification failure, show error and close app
      dialog.showMessageBox({
        type: 'error',
        title: '在线验证失败',
        message: '无法连接到服务器，应用将关闭',
        buttons: ['确定'],
      }).then(() => {
        app.quit();
      });
    });
    
    return true;
  } catch (error: any) {
    console.error('[Startup] Error during check:', error);
    
    // Network error - allow app to start but show warning
    const userChoice = await dialog.showMessageBox({
      type: 'warning',
      title: '网络错误',
      message: '无法连接到服务器进行版本检查',
      detail: '应用可能无法正常工作，是否继续？',
      buttons: ['退出', '继续'],
      defaultId: 0,
      cancelId: 0,
    });
    
    return userChoice.response === 1;
  }
}

async function showForceUpdateDialog(updateInfo: any) {
  const updateWindow = new BrowserWindow({
    width: 500,
    height: 300,
    closable: false,
    minimizable: false,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Create a simple HTML page for force update
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
        }
        h1 { margin-bottom: 20px; }
        p { margin: 10px 0; opacity: 0.9; }
        button {
          margin-top: 30px;
          padding: 12px 40px;
          font-size: 16px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        button:hover { transform: scale(1.05); }
        .progress {
          width: 300px;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          margin-top: 20px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: white;
          width: 0%;
          transition: width 0.3s;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔄 必须更新</h1>
        <p>检测到新版本 ${updateInfo.latestVersion}</p>
        <p>当前版本 ${APP_VERSION} 已过期，必须更新后才能继续使用</p>
        <div class="progress" id="progress" style="display:none;">
          <div class="progress-bar" id="progressBar"></div>
        </div>
        <p id="status"></p>
        <button onclick="startUpdate()">立即更新</button>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        
        function startUpdate() {
          document.getElementById('progress').style.display = 'block';
          document.getElementById('status').textContent = '正在下载更新...';
          ipcRenderer.send('start-update');
        }
        
        ipcRenderer.on('update-progress', (event, percent) => {
          document.getElementById('progressBar').style.width = percent + '%';
        });
        
        ipcRenderer.on('update-downloaded', () => {
          document.getElementById('status').textContent = '下载完成，正在安装...';
        });
      </script>
    </body>
    </html>
  `;

  updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  // Handle update start
  updateWindow.webContents.on('ipc-message', async (event, channel) => {
    if (channel === 'start-update' && updateManager) {
      await updateManager.downloadAndInstall((progress) => {
        updateWindow.webContents.send('update-progress', progress);
      });
      updateWindow.webContents.send('update-downloaded');
    }
  });
}

app.whenReady().then(async () => {
  try {
    // 1. Start local server
    console.log('[Startup] Starting local server...');
    serverPort = await startServer();
    console.log(`[Startup] Server started on port ${serverPort}`);
    
    // 2. Check update and verify online
    const canProceed = await checkUpdateAndVerify();
    
    if (!canProceed) {
      console.log('[Startup] Cannot proceed, exiting...');
      app.quit();
      return;
    }
    
    // 3. Create main window
    console.log('[Startup] Creating main window...');
    await createWindow();
    
  } catch (error) {
    console.error('[Startup] Fatal error:', error);
    dialog.showErrorBox('启动失败', '应用启动失败，请重试');
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

app.on('will-quit', () => {
  // Stop online verification
  if (onlineVerifier) {
    onlineVerifier.stop();
  }
});
