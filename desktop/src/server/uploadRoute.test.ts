import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

/**
 * 测试文件名编码逻辑
 */
describe('Upload Route - Filename Encoding', () => {
  it('should convert Chinese characters to safe ASCII', () => {
    const originalFilename = '营销+出海大会.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!safeBasename) safeBasename = 'video';
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('video.mp4');  // 全中文转换为默认名
    expect(safeFilename).not.toContain('营');
    expect(safeFilename).not.toContain('%');
  });

  it('should handle spaces in filename', () => {
    const originalFilename = 'my video file.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!safeBasename) safeBasename = 'video';
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('my-video-file.mp4');
    expect(safeFilename).not.toContain(' ');
  });

  it('should preserve extension correctly', () => {
    const originalFilename = '测试视频.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!safeBasename) safeBasename = 'video';
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('video.mp4');
    expect(safeFilename).toMatch(/\.mp4$/);
  });

  it('should handle special characters', () => {
    const originalFilename = 'video@#$%^&*().mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!safeBasename) safeBasename = 'video';
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('video.mp4');
    expect(safeFilename).not.toContain('@');
    expect(safeFilename).not.toContain('%');
    expect(safeFilename).toMatch(/\.mp4$/);
  });

  it('should handle English filename without changes', () => {
    const originalFilename = 'conference-video.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!safeBasename) safeBasename = 'video';
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('conference-video.mp4');
  });

  it('should generate valid S3 key with safe filename', () => {
    const userId = 'anonymous';
    const timestamp = Date.now();
    const originalFilename = '营销+出海大会.mp4';
    
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    let safeBasename = basename
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!safeBasename) safeBasename = 'video';
    const safeFilename = `${safeBasename}${ext}`;
    
    const fileKey = `videos/${userId}/${timestamp}-${safeFilename}`;
    
    expect(fileKey).toMatch(/^videos\/anonymous\/\d+-video\.mp4$/);
    expect(fileKey).not.toContain('营');
    expect(fileKey).not.toContain('%');
  });
});
