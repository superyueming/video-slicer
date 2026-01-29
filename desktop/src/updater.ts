import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as https from 'https';

interface UpdateInfo {
  latestVersion: string;
  minRequiredVersion: string;
  currentVersion: string;
  needsUpdate: boolean;
  forceUpdate: boolean;
  downloadUrl: string;
  releaseNotes: string;
  releaseDate: Date;
}

/**
 * UpdateManager - 管理应用更新
 * 
 * 工作流程：
 * 1. 启动时检查服务器版本信息（判断是否需要强制更新）
 * 2. 如果需要更新，使用electron-updater从GitHub Releases下载
 * 3. 下载完成后自动安装并重启
 */
export class UpdateManager {
  private currentVersion: string;
  private serverUrl: string;
  private platform: 'windows' | 'mac' | 'linux';
  private mainWindow: BrowserWindow | null = null;

  constructor(currentVersion: string, serverUrl: string) {
    this.currentVersion = currentVersion;
    this.serverUrl = serverUrl;
    
    // Detect platform
    if (process.platform === 'win32') {
      this.platform = 'windows';
    } else if (process.platform === 'darwin') {
      this.platform = 'mac';
    } else {
      this.platform = 'linux';
    }

    // 配置autoUpdater
    this.configureAutoUpdater();
  }

  /**
   * 设置主窗口引用（用于显示更新进度）
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 配置electron-updater
   */
  private configureAutoUpdater() {
    // 禁用自动下载（我们要先检查是否强制更新）
    autoUpdater.autoDownload = false;
    
    // 禁用自动安装（我们要显示进度）
    autoUpdater.autoInstallOnAppQuit = true;

    // 监听更新事件
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[Updater] Update available:', info.version);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[Updater] Update not available:', info.version);
    });

    autoUpdater.on('error', (err) => {
      console.error('[Updater] Error:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      console.log(`[Updater] Download progress: ${percent}%`);
      
      // 发送进度到渲染进程
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-progress', percent);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[Updater] Update downloaded:', info.version);
      
      // 发送下载完成事件
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded');
      }
    });
  }

  /**
   * 从服务器检查版本信息
   * 用于判断是否需要强制更新
   */
  async checkUpdate(): Promise<UpdateInfo> {
    const url = `${this.serverUrl}/api/trpc/version.checkUpdate?input=${encodeURIComponent(JSON.stringify({
      json: {
        currentVersion: this.currentVersion,
        platform: this.platform,
      }
    }))}`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.result?.data?.json) {
              resolve(response.result.data.json);
            } else {
              reject(new Error('Invalid response format'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * 检查并下载更新（使用electron-updater）
   */
  async checkAndDownload(): Promise<UpdateInfo> {
    // 1. 先从服务器检查版本信息
    const updateInfo = await this.checkUpdate();
    
    // 2. 如果需要更新，使用electron-updater检查GitHub Releases
    if (updateInfo.needsUpdate) {
      console.log('[Updater] Checking GitHub Releases for update...');
      
      try {
        // 检查GitHub Releases
        const result = await autoUpdater.checkForUpdates();
        
        if (result && result.updateInfo) {
          console.log('[Updater] GitHub update available:', result.updateInfo.version);
          
          // 开始下载
          await autoUpdater.downloadUpdate();
        }
      } catch (error) {
        console.error('[Updater] Failed to check/download from GitHub:', error);
        // 如果GitHub失败，回退到服务器下载链接
        throw error;
      }
    }
    
    return updateInfo;
  }

  /**
   * 安装已下载的更新并重启
   */
  quitAndInstall() {
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * 手动下载并安装（回退方案，当electron-updater失败时使用）
   */
  async downloadAndInstallManually(downloadUrl: string, onProgress?: (percent: number) => void): Promise<void> {
    const path = require('path');
    const fs = require('fs');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Download installer
    const tempDir = app.getPath('temp');
    const fileName = path.basename(downloadUrl);
    const filePath = path.join(tempDir, fileName);

    await this.downloadFile(downloadUrl, filePath, onProgress);

    // Install based on platform
    if (this.platform === 'windows') {
      // Run NSIS installer
      await execAsync(`"${filePath}" /S`);
      app.quit();
    } else if (this.platform === 'mac') {
      // Mount DMG and copy app
      await execAsync(`hdiutil attach "${filePath}"`);
      app.quit();
    } else {
      // Linux AppImage - just replace the executable
      const appPath = process.execPath;
      fs.copyFileSync(filePath, appPath);
      fs.chmodSync(appPath, '755');
      app.relaunch();
      app.quit();
    }
  }

  private downloadFile(url: string, dest: string, onProgress?: (percent: number) => void): Promise<void> {
    const fs = require('fs');
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      
      https.get(url, (response) => {
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize > 0) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            onProgress(percent);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err: Error) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  }
}
