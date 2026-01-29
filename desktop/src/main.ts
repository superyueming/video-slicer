import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { UpdateManager } from './updater';
import { OnlineVerifier } from './onlineVerifier';
import { startServer } from './server';
import * as processor from './processor';
import * as fs from 'fs';

const APP_VERSION = '1.0.0';
// Production server URL - Update this when deploying
// Current Manus domain (will change on restart, bind custom domain in Settings → Domains for production)
const SERVER_URL = 'https://3000-inad6zubup66m81lcklvw-22d12335.sg1.manus.computer';

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
        // User chose to update - use electron-updater
        try {
          await updateManager.checkAndDownload();
          // 更新下载完成后会自动安装并重启
        } catch (error) {
          console.error('[Startup] Update failed, fallback to manual download:', error);
          // 如果electron-updater失败，回退到手动下载
          await updateManager.downloadAndInstallManually(updateInfo.downloadUrl);
        }
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
      try {
        // 设置主窗口引用，用于发送进度事件
        updateManager.setMainWindow(updateWindow);
        
        // 使用electron-updater下载更新
        await updateManager.checkAndDownload();
        
        // 下载完成后自动安装并重启
      } catch (error) {
        console.error('[ForceUpdate] Update failed, fallback to manual download:', error);
        // 如果electron-updater失败，回退到手动下载
        await updateManager.downloadAndInstallManually(updateInfo.downloadUrl, (progress) => {
          updateWindow.webContents.send('update-progress', progress);
        });
      }
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

// ============================================
// Processor IPC Handlers
// ============================================

// Check FFmpeg availability
ipcMain.handle('processor:checkFFmpeg', async () => {
  try {
    const ffmpegPath = processor.getFFmpegPath();
    return fs.existsSync(ffmpegPath);
  } catch (error) {
    console.error('[Processor] FFmpeg check failed:', error);
    return false;
  }
});

// Get video info
ipcMain.handle('processor:getVideoInfo', async (_event, videoPath: string) => {
  try {
    return await processor.getVideoInfo(videoPath);
  } catch (error: any) {
    console.error('[Processor] Get video info failed:', error);
    throw new Error(`获取视频信息失败: ${error.message}`);
  }
});

// Extract audio
ipcMain.handle('processor:extractAudio', async (_event, videoPath: string, outputPath?: string) => {
  try {
    return await processor.extractAudio({
      videoPath,
      outputPath,
      onProgress: (progress) => {
        mainWindow?.webContents.send('processor:progress', progress);
      },
      onLog: (message) => {
        mainWindow?.webContents.send('processor:log', message);
      }
    });
  } catch (error: any) {
    console.error('[Processor] Extract audio failed:', error);
    throw new Error(`提取音频失败: ${error.message}`);
  }
});

// Clip video
ipcMain.handle('processor:clipVideo', async (_event, videoPath: string, segment: any, outputPath?: string, reEncode?: boolean) => {
  try {
    return await processor.clipVideo({
      videoPath,
      startTime: segment.startTime,
      endTime: segment.endTime,
      outputPath,
      reEncode,
      onProgress: (progress) => {
        mainWindow?.webContents.send('processor:progress', progress);
      },
      onLog: (message) => {
        mainWindow?.webContents.send('processor:log', message);
      }
    });
  } catch (error: any) {
    console.error('[Processor] Clip video failed:', error);
    throw new Error(`剪辑视频失败: ${error.message}`);
  }
});

// Clip video batch
ipcMain.handle('processor:clipVideoBatch', async (_event, videoPath: string, segments: any[], outputDir?: string, reEncode?: boolean) => {
  try {
    const results: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const outputPath = outputDir 
        ? path.join(outputDir, `clip_${i + 1}_${segment.title || ''}.mp4`)
        : undefined;
      
      const result = await processor.clipVideo({
        videoPath,
        startTime: segment.startTime,
        endTime: segment.endTime,
        outputPath,
        reEncode,
        onProgress: (progress) => {
          mainWindow?.webContents.send('processor:progress', {
            ...progress,
            currentClip: i + 1,
            totalClips: segments.length
          });
        },
        onLog: (message) => {
          mainWindow?.webContents.send('processor:log', message);
        }
      });
      results.push(result);
    }
    return results;
  } catch (error: any) {
    console.error('[Processor] Clip video batch failed:', error);
    throw new Error(`批量剪辑视频失败: ${error.message}`);
  }
});

// Concatenate videos
ipcMain.handle('processor:concatenateVideos', async (_event, videoPaths: string[], outputPath?: string, reEncode?: boolean) => {
  try {
    return await processor.concatenateVideos({
      videoPaths,
      outputPath,
      reEncode,
      onProgress: (progress) => {
        mainWindow?.webContents.send('processor:progress', progress);
      }
    });
  } catch (error: any) {
    console.error('[Processor] Concatenate videos failed:', error);
    throw new Error(`拼接视频失败: ${error.message}`);
  }
});

// ============================================
// File Dialog IPC Handlers
// ============================================

// Select video file
ipcMain.handle('file:selectVideo', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'webm'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

// Select save path
ipcMain.handle('file:selectSavePath', async (_event, defaultName: string) => {
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [
      { name: 'Videos', extensions: ['mp4'] },
      { name: 'Audio', extensions: ['mp3', 'wav'] }
    ]
  });
  return result.canceled ? null : result.filePath;
});

// Show item in folder
ipcMain.handle('file:showInFolder', async (_event, filePath: string) => {
  const { shell } = require('electron');
  shell.showItemInFolder(filePath);
});
