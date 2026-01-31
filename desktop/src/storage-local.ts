/**
 * Local file system storage adapter for desktop app
 * Replaces S3 storage with local file system
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Get storage directory
function getStorageDir(): string {
  const storageDir = path.join(app.getPath('userData'), 'storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  return storageDir;
}

/**
 * Store file locally
 * @param relKey Relative key/path for the file
 * @param data File data (Buffer or string)
 * @param contentType MIME type (optional, for compatibility)
 * @returns Object with key and url
 */
export function storagePut(
  relKey: string,
  data: Buffer | string,
  contentType?: string
): { key: string; url: string } {
  const storageDir = getStorageDir();
  const filePath = path.join(storageDir, relKey);
  
  // Create directory if it doesn't exist
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(filePath, data);
  
  console.log(`[Storage] Saved file: ${relKey}`);
  
  return {
    key: relKey,
    url: `file://${filePath}`
  };
}

/**
 * Get file path (for compatibility with S3 presigned URLs)
 * @param relKey Relative key/path for the file
 * @param expiresIn Expiration time in seconds (ignored for local storage)
 * @returns Object with key and url
 */
export function storageGet(
  relKey: string,
  expiresIn?: number
): { key: string; url: string } {
  const storageDir = getStorageDir();
  const filePath = path.join(storageDir, relKey);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${relKey}`);
  }
  
  return {
    key: relKey,
    url: `file://${filePath}`
  };
}

/**
 * Delete file
 * @param relKey Relative key/path for the file
 */
export function storageDelete(relKey: string): void {
  const storageDir = getStorageDir();
  const filePath = path.join(storageDir, relKey);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[Storage] Deleted file: ${relKey}`);
  }
}

/**
 * Check if file exists
 * @param relKey Relative key/path for the file
 */
export function storageExists(relKey: string): boolean {
  const storageDir = getStorageDir();
  const filePath = path.join(storageDir, relKey);
  return fs.existsSync(filePath);
}

/**
 * Get local file path
 * @param relKey Relative key/path for the file
 */
export function getLocalPath(relKey: string): string {
  const storageDir = getStorageDir();
  return path.join(storageDir, relKey);
}
