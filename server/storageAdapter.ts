// Unified storage adapter that switches between S3 and local storage
// based on DESKTOP_MODE environment variable

import * as s3Storage from './storage';
import * as localStorage from './localStorage';

const isDesktopMode = process.env.DESKTOP_MODE === 'true';

/**
 * Upload file to storage (S3 or local filesystem)
 * @param relKey - Relative key/path for the file
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type
 * @returns Object with key and URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string }> {
  if (isDesktopMode) {
    return localStorage.storagePut(relKey, data, contentType);
  } else {
    return s3Storage.storagePut(relKey, data, contentType);
  }
}

/**
 * Get file URL from storage
 * @param relKey - Relative key/path for the file
 * @returns Object with key and URL
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  if (isDesktopMode) {
    return localStorage.storageGet(relKey);
  } else {
    return s3Storage.storageGet(relKey);
  }
}

/**
 * Delete file from storage
 * @param relKey - Relative key/path for the file
 */
export async function storageDelete(relKey: string): Promise<void> {
  if (isDesktopMode) {
    return localStorage.storageDelete(relKey);
  } else {
    // S3 storage doesn't have a delete function, implement if needed
    throw new Error('Delete not implemented for S3 storage');
  }
}

/**
 * Get absolute local file path (only available in desktop mode)
 * Useful for FFmpeg and other tools that need direct file access
 * @param relKey - Relative key/path for the file
 * @returns Absolute file path
 */
export function getLocalFilePath(relKey: string): string {
  if (!isDesktopMode) {
    throw new Error('getLocalFilePath is only available in desktop mode');
  }
  return localStorage.getLocalFilePath(relKey);
}
