import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * 将音频文件切分为多个片段
 * @param audioPath 原始音频文件路径
 * @param segmentDuration 每段时长（秒），默认3360秒（56分钟）
 * @returns 切分后的音频文件路径数组
 */
export async function splitAudioIntoSegments(
  audioPath: string,
  segmentDuration: number = 3360 // 56分钟
): Promise<string[]> {
  const dir = path.dirname(audioPath);
  const ext = path.extname(audioPath);
  const basename = path.basename(audioPath, ext);
  
  // 使用ffmpeg切分音频
  // -f segment: 启用分段输出
  // -segment_time: 每段时长
  // -c copy: 不重新编码，直接复制（快速）
  const outputPattern = path.join(dir, `${basename}-segment-%03d${ext}`);
  
  const cmd = `ffmpeg -i "${audioPath}" -f segment -segment_time ${segmentDuration} -c copy "${outputPattern}"`;
  
  try {
    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
    
    // 查找生成的所有片段文件
    const files = await fs.readdir(dir);
    const segmentFiles = files
      .filter(f => f.startsWith(`${basename}-segment-`) && f.endsWith(ext))
      .map(f => path.join(dir, f))
      .sort();
    
    console.log(`[AudioSegmentation] Split audio into ${segmentFiles.length} segments`);
    return segmentFiles;
  } catch (error: any) {
    console.error('[AudioSegmentation] Failed to split audio:', error);
    throw new Error(`Audio segmentation failed: ${error.message}`);
  }
}

/**
 * 合并多个转录结果
 * @param segments 每段的转录结果，包含时间偏移量
 * @returns 合并后的完整转录文本
 */
export function mergeTranscriptSegments(
  segments: Array<{ text: string; offset: number }>
): string {
  // 简单合并文本（后续可以改进为合并带时间戳的字幕）
  return segments.map(s => s.text).join('\n\n');
}
