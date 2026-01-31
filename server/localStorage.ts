// Local file storage adapter for desktop mode
// Replaces S3 storage with local filesystem

import fs from 'fs/promises';
import path from 'path';
import { ENV } from './_core/env';

// Get local storage directory from environment or use default
function getStorageDir(): string {
  const storageDir = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'storage');
  return storageDir;
}

// Ensure storage directory exists
async function ensureStorageDir(): Promise<void> {
  const storageDir = getStorageDir();
  try {
    await fs.access(storageDir);
  } catch {
    await fs.mkdir(storageDir, { recursive: true });
  }
}

// Normalize key to prevent path traversal
function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '').replace(/\.\./g, '');
}

// Get full file path
function getFilePath(relKey: string): string {
  const storageDir = getStorageDir();
  const normalizedKey = normalizeKey(relKey);
  return path.join(storageDir, normalizedKey);
}

// Get public URL for file (for desktop mode, we'll use file:// protocol or serve via HTTP)
function getFileUrl(relKey: string): string {
  const normalizedKey = normalizeKey(relKey);
  // In desktop mode, files are served via /storage/ endpoint
  return `/storage/${normalizedKey}`;
}

/**
 * Upload file to local storage
 * @param relKey - Relative key/path for the file
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type (optional, not used in local storage)
 * @returns Object with key and URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string }> {
  await ensureStorageDir();
  
  const key = normalizeKey(relKey);
  const filePath = getFilePath(key);
  
  // Ensure parent directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  
  // Write file
  const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  
  const url = getFileUrl(key);
  return { key, url };
}

/**
 * Get file URL from local storage
 * @param relKey - Relative key/path for the file
 * @returns Object with key and URL
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = getFilePath(key);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${key}`);
  }
  
  const url = getFileUrl(key);
  return { key, url };
}

/**
 * Delete file from local storage
 * @param relKey - Relative key/path for the file
 */
export async function storageDelete(relKey: string): Promise<void> {
  const filePath = getFilePath(relKey);
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get absolute file path for local storage
 * Useful for FFmpeg and other tools that need direct file access
 * @param relKey - Relative key/path for the file
 * @returns Absolute file path
 */
export function getLocalFilePath(relKey: string): string {
  return getFilePath(relKey);
}
