import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

/**
 * 测试文件名编码逻辑
 */
describe('Upload Route - Filename Encoding', () => {
  it('should encode Chinese characters in filename', () => {
    const originalFilename = '营销+出海大会.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const safeBasename = encodeURIComponent(basename).replace(/%20/g, '-');
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('%E8%90%A5%E9%94%80%2B%E5%87%BA%E6%B5%B7%E5%A4%A7%E4%BC%9A.mp4');
    expect(safeFilename).not.toContain('营');
    expect(safeFilename).not.toContain('销');
  });

  it('should handle spaces in filename', () => {
    const originalFilename = 'my video file.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const safeBasename = encodeURIComponent(basename).replace(/%20/g, '-');
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('my-video-file.mp4');
    expect(safeFilename).not.toContain('%20');
    expect(safeFilename).not.toContain(' ');
  });

  it('should preserve extension correctly', () => {
    const originalFilename = '测试视频.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const safeBasename = encodeURIComponent(basename).replace(/%20/g, '-');
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toMatch(/\.mp4$/);
  });

  it('should handle special characters', () => {
    const originalFilename = 'video@#$%^&*().mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const safeBasename = encodeURIComponent(basename).replace(/%20/g, '-');
    const safeFilename = `${safeBasename}${ext}`;
    
    // encodeURIComponent should encode special characters
    expect(safeFilename).toContain('%');
    expect(safeFilename).toMatch(/\.mp4$/);
  });

  it('should handle English filename without encoding', () => {
    const originalFilename = 'conference-video.mp4';
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const safeBasename = encodeURIComponent(basename).replace(/%20/g, '-');
    const safeFilename = `${safeBasename}${ext}`;
    
    expect(safeFilename).toBe('conference-video.mp4');
  });

  it('should generate valid S3 key with encoded filename', () => {
    const userId = 'anonymous';
    const timestamp = Date.now();
    const randomId = 'testId123';
    const originalFilename = '营销+出海大会.mp4';
    
    const ext = path.extname(originalFilename);
    const basename = path.basename(originalFilename, ext);
    const safeBasename = encodeURIComponent(basename).replace(/%20/g, '-');
    const safeFilename = `${safeBasename}${ext}`;
    
    const fileKey = `videos/${userId}/${timestamp}-${randomId}-${safeFilename}`;
    
    expect(fileKey).toMatch(/^videos\/anonymous\/\d+-testId123-%E8%90%A5%E9%94%80%2B%E5%87%BA%E6%B5%B7%E5%A4%A7%E4%BC%9A\.mp4$/);
    expect(fileKey).not.toContain('营');
  });
});
