import { app } from 'electron';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

export class UpdateManager {
  private currentVersion: string;
  private serverUrl: string;
  private platform: 'windows' | 'mac' | 'linux';

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
  }

  /**
   * Check for updates from server
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
   * Download and install update
   */
  async downloadAndInstall(onProgress?: (percent: number) => void): Promise<void> {
    const updateInfo = await this.checkUpdate();
    
    if (!updateInfo.downloadUrl) {
      throw new Error('No download URL available');
    }

    // Download installer
    const tempDir = app.getPath('temp');
    const fileName = path.basename(updateInfo.downloadUrl);
    const filePath = path.join(tempDir, fileName);

    await this.downloadFile(updateInfo.downloadUrl, filePath, onProgress);

    // Install based on platform
    await this.installUpdate(filePath);
  }

  private downloadFile(url: string, dest: string, onProgress?: (percent: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      
      https.get(url, (response) => {
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.on('data', (chunk) => {
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
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  }

  private async installUpdate(filePath: string): Promise<void> {
    if (this.platform === 'windows') {
      // Run NSIS installer
      await execAsync(`"${filePath}" /S`);
      app.quit();
    } else if (this.platform === 'mac') {
      // Mount DMG and copy app
      await execAsync(`hdiutil attach "${filePath}"`);
      // Copy app to Applications
      // ... (implementation depends on DMG structure)
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
}
