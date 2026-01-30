import * as https from 'https';
// Use require for uuid to avoid ES Module issues in Electron
const { v4: uuidv4 } = require('uuid');
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface VerifyResult {
  online: boolean;
  canUse: boolean;
  message: string;
  latestVersion?: string;
  minRequiredVersion?: string;
}

export class OnlineVerifier {
  private appVersion: string;
  private serverUrl: string;
  private deviceId: string;
  private verificationInterval: NodeJS.Timeout | null = null;

  constructor(appVersion: string, serverUrl: string) {
    this.appVersion = appVersion;
    this.serverUrl = serverUrl;
    this.deviceId = this.getOrCreateDeviceId();
  }

  /**
   * Get or create a unique device ID
   */
  private getOrCreateDeviceId(): string {
    const userDataPath = app.getPath('userData');
    const deviceIdPath = path.join(userDataPath, 'device-id.txt');

    try {
      if (fs.existsSync(deviceIdPath)) {
        return fs.readFileSync(deviceIdPath, 'utf-8').trim();
      }
    } catch (error) {
      console.warn('[OnlineVerifier] Failed to read device ID:', error);
    }

    // Create new device ID
    const newDeviceId = uuidv4();
    
    try {
      fs.mkdirSync(userDataPath, { recursive: true });
      fs.writeFileSync(deviceIdPath, newDeviceId, 'utf-8');
    } catch (error) {
      console.warn('[OnlineVerifier] Failed to save device ID:', error);
    }

    return newDeviceId;
  }

  /**
   * Verify online status with server
   */
  async verify(): Promise<VerifyResult> {
    const url = `${this.serverUrl}/api/trpc/version.verifyOnline?input=${encodeURIComponent(JSON.stringify({
      json: {
        appVersion: this.appVersion,
        deviceId: this.deviceId,
      }
    }))}`;

    return new Promise((resolve, reject) => {
      const request = https.get(url, { timeout: 10000 }, (res) => {
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
      });

      request.on('error', (error) => {
        // Network error - return offline status
        resolve({
          online: false,
          canUse: false,
          message: '无法连接到服务器',
        });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({
          online: false,
          canUse: false,
          message: '连接超时',
        });
      });
    });
  }

  /**
   * Start periodic online verification
   * @param intervalMs Verification interval in milliseconds
   * @param onFailure Callback when verification fails
   */
  startPeriodicVerification(intervalMs: number, onFailure: () => void) {
    this.verificationInterval = setInterval(async () => {
      console.log('[OnlineVerifier] Performing periodic verification...');
      
      try {
        const result = await this.verify();
        
        if (!result.canUse) {
          console.error('[OnlineVerifier] Verification failed:', result.message);
          this.stop();
          onFailure();
        } else {
          console.log('[OnlineVerifier] Verification passed');
        }
      } catch (error) {
        console.error('[OnlineVerifier] Verification error:', error);
        this.stop();
        onFailure();
      }
    }, intervalMs);
  }

  /**
   * Stop periodic verification
   */
  stop() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
  }
}
