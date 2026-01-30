/**
 * 剪辑管理器
 * 管理本地剪辑结果，包括保存、导出和上传
 */

import { clipVideo, ClipSegment } from './videoClipper';
import * as path from 'path';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';

export interface ClipResult {
  clipPath: string;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  title?: string;
}

export interface ClipManagerOptions {
  outputDir?: string;
  keepOriginal?: boolean;
}

/**
 * 剪辑管理器类
 */
export class ClipManager {
  private outputDir: string;
  private keepOriginal: boolean;
  private clips: Map<string, ClipResult[]> = new Map();

  constructor(options?: ClipManagerOptions) {
    this.outputDir = options?.outputDir || path.join(process.cwd(), 'clips');
    this.keepOriginal = options?.keepOriginal ?? true;
    
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    console.log('[ClipManager] 初始化，输出目录:', this.outputDir);
  }

  /**
   * 保存单个剪辑片段
   */
  async saveClip(
    videoPath: string,
    segment: ClipSegment,
    reEncode?: boolean
  ): Promise<ClipResult> {
    console.log('[ClipManager] 保存剪辑片段:', segment);
    
    // 生成输出路径
    const videoBasename = path.basename(videoPath, path.extname(videoPath));
    const clipFilename = `${videoBasename}_${segment.startTime}-${segment.endTime}${path.extname(videoPath)}`;
    const outputPath = path.join(this.outputDir, clipFilename);
    
    // 剪辑视频
    const clipPath = await clipVideo({
      videoPath,
      segment,
      outputPath,
      reEncode,
    });
    
    // 获取文件信息
    const stats = fs.statSync(clipPath);
    const duration = segment.endTime - segment.startTime;
    
    const result: ClipResult = {
      clipPath,
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration,
      size: stats.size,
      title: segment.title,
    };
    
    // 保存到内存映射
    if (!this.clips.has(videoPath)) {
      this.clips.set(videoPath, []);
    }
    this.clips.get(videoPath)!.push(result);
    
    console.log('[ClipManager] 剪辑完成:', {
      path: clipPath,
      size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
      duration: duration.toFixed(2) + 's',
    });
    
    return result;
  }

  /**
   * 批量保存剪辑片段
   */
  async saveClips(
    videoPath: string,
    segments: ClipSegment[],
    reEncode?: boolean,
    onProgress?: (index: number, total: number) => void
  ): Promise<ClipResult[]> {
    console.log('[ClipManager] 批量保存剪辑片段，数量:', segments.length);
    
    const results: ClipResult[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      onProgress?.(i, segments.length);
      
      const result = await this.saveClip(videoPath, segment, reEncode);
      results.push(result);
    }
    
    onProgress?.(segments.length, segments.length);
    
    console.log('[ClipManager] 批量剪辑完成，总数:', results.length);
    
    return results;
  }

  /**
   * 获取所有剪辑片段
   */
  getAllClips(videoPath: string): ClipResult[] {
    return this.clips.get(videoPath) || [];
  }

  /**
   * 导出剪辑片段到指定位置
   */
  async exportClip(clipPath: string, exportPath: string): Promise<void> {
    console.log('[ClipManager] 导出剪辑片段:', clipPath, '->', exportPath);
    
    if (!fs.existsSync(clipPath)) {
      throw new Error(`剪辑文件不存在: ${clipPath}`);
    }
    
    // 确保导出目录存在
    const exportDir = path.dirname(exportPath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // 复制文件
    await fsExtra.copy(clipPath, exportPath);
    
    console.log('[ClipManager] 导出完成');
  }

  /**
   * 导出所有剪辑片段
   */
  async exportAllClips(videoPath: string, exportDir: string): Promise<string[]> {
    const clips = this.getAllClips(videoPath);
    console.log('[ClipManager] 导出所有剪辑片段，数量:', clips.length);
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const exportedPaths: string[] = [];
    
    for (const clip of clips) {
      const filename = path.basename(clip.clipPath);
      const exportPath = path.join(exportDir, filename);
      await this.exportClip(clip.clipPath, exportPath);
      exportedPaths.push(exportPath);
    }
    
    console.log('[ClipManager] 所有剪辑片段已导出到:', exportDir);
    
    return exportedPaths;
  }

  /**
   * 删除剪辑片段
   */
  async deleteClip(clipPath: string): Promise<void> {
    console.log('[ClipManager] 删除剪辑片段:', clipPath);
    
    if (fs.existsSync(clipPath)) {
      fs.unlinkSync(clipPath);
    }
    
    // 从内存映射中移除
    for (const [videoPath, clips] of this.clips.entries()) {
      const index = clips.findIndex(c => c.clipPath === clipPath);
      if (index !== -1) {
        clips.splice(index, 1);
        break;
      }
    }
    
    console.log('[ClipManager] 删除完成');
  }

  /**
   * 清理所有剪辑片段
   */
  async cleanup(videoPath?: string): Promise<void> {
    if (videoPath) {
      // 清理特定视频的剪辑
      const clips = this.getAllClips(videoPath);
      console.log('[ClipManager] 清理剪辑片段，数量:', clips.length);
      
      for (const clip of clips) {
        await this.deleteClip(clip.clipPath);
      }
      
      this.clips.delete(videoPath);
    } else {
      // 清理所有剪辑
      console.log('[ClipManager] 清理所有剪辑片段');
      
      for (const clips of this.clips.values()) {
        for (const clip of clips) {
          if (fs.existsSync(clip.clipPath)) {
            fs.unlinkSync(clip.clipPath);
          }
        }
      }
      
      this.clips.clear();
    }
    
    console.log('[ClipManager] 清理完成');
  }

  /**
   * 获取统计信息
   */
  getStats(videoPath?: string): {
    totalClips: number;
    totalSize: number;
    totalDuration: number;
  } {
    let clips: ClipResult[];
    
    if (videoPath) {
      clips = this.getAllClips(videoPath);
    } else {
      clips = Array.from(this.clips.values()).flat();
    }
    
    const totalSize = clips.reduce((sum, clip) => sum + clip.size, 0);
    const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);
    
    return {
      totalClips: clips.length,
      totalSize,
      totalDuration,
    };
  }
}
