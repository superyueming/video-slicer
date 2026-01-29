/**
 * 视频剪辑模块
 * 根据时间戳剪辑视频片段
 */

import { executeFFmpeg, FFmpegProgress } from './ffmpeg';
import path from 'path';
import fs from 'fs';

export interface ClipSegment {
  startTime: number;  // 开始时间（秒）
  endTime: number;    // 结束时间（秒）
  title?: string;     // 片段标题（可选）
}

export interface ClipVideoOptions {
  videoPath: string;                             // 输入视频路径
  segment: ClipSegment;                          // 剪辑片段
  outputPath?: string;                           // 输出路径（可选）
  reEncode?: boolean;                            // 是否重新编码（默认false，使用流复制）
  onProgress?: (progress: FFmpegProgress) => void; // 进度回调
}

/**
 * 剪辑单个视频片段
 */
export async function clipVideo(options: ClipVideoOptions): Promise<string> {
  const {
    videoPath,
    segment,
    outputPath,
    reEncode = false,
    onProgress
  } = options;
  
  // 检查输入文件是否存在
  if (!fs.existsSync(videoPath)) {
    throw new Error(`视频文件不存在: ${videoPath}`);
  }
  
  // 生成输出路径
  const finalOutputPath = outputPath || path.join(
    path.dirname(videoPath),
    `${path.basename(videoPath, path.extname(videoPath))}_clip_${segment.startTime}-${segment.endTime}${path.extname(videoPath)}`
  );
  
  // 如果输出文件已存在，先删除
  if (fs.existsSync(finalOutputPath)) {
    fs.unlinkSync(finalOutputPath);
  }
  
  console.log('[VideoClipper] 开始剪辑视频');
  console.log('[VideoClipper] 输入:', videoPath);
  console.log('[VideoClipper] 输出:', finalOutputPath);
  console.log('[VideoClipper] 时间范围:', `${segment.startTime}s - ${segment.endTime}s`);
  console.log('[VideoClipper] 重新编码:', reEncode);
  
  // 构建FFmpeg命令
  const args = [
    '-i', videoPath,                        // 输入文件
    '-ss', segment.startTime.toString(),    // 开始时间
    '-to', segment.endTime.toString(),      // 结束时间
  ];
  
  if (reEncode) {
    // 重新编码模式（更准确，但慢）
    args.push(
      '-c:v', 'libx264',                    // 视频编码器
      '-preset', 'medium',                  // 编码预设
      '-crf', '23',                         // 质量参数
      '-c:a', 'aac',                        // 音频编码器
      '-b:a', '128k'                        // 音频比特率
    );
  } else {
    // 流复制模式（快速，但可能不精确）
    args.push('-c', 'copy');
  }
  
  args.push(
    '-y',                                   // 覆盖输出文件
    finalOutputPath                         // 输出文件
  );
  
  // 执行FFmpeg命令
  await executeFFmpeg({
    args,
    onProgress,
    onLog: (message) => {
      if (message.includes('error') || message.includes('Error')) {
        console.error('[VideoClipper] FFmpeg错误:', message);
      }
    }
  });
  
  // 检查输出文件是否生成
  if (!fs.existsSync(finalOutputPath)) {
    throw new Error('视频剪辑失败：输出文件未生成');
  }
  
  const stats = fs.statSync(finalOutputPath);
  console.log('[VideoClipper] 剪辑完成，文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  
  return finalOutputPath;
}

/**
 * 批量剪辑视频片段
 */
export async function clipVideoBatch(
  videoPath: string,
  segments: ClipSegment[],
  outputDir?: string,
  reEncode?: boolean,
  onProgress?: (index: number, total: number, progress: FFmpegProgress) => void
): Promise<string[]> {
  const outputPaths: string[] = [];
  const finalOutputDir = outputDir || path.dirname(videoPath);
  
  // 确保输出目录存在
  if (!fs.existsSync(finalOutputDir)) {
    fs.mkdirSync(finalOutputDir, { recursive: true });
  }
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    console.log(`[VideoClipper] 批量剪辑 ${i + 1}/${segments.length}: ${segment.startTime}s - ${segment.endTime}s`);
    
    const outputPath = path.join(
      finalOutputDir,
      `clip_${i + 1}_${segment.startTime}-${segment.endTime}${path.extname(videoPath)}`
    );
    
    const clippedPath = await clipVideo({
      videoPath,
      segment,
      outputPath,
      reEncode,
      onProgress: (progress) => {
        if (onProgress) {
          onProgress(i, segments.length, progress);
        }
      }
    });
    
    outputPaths.push(clippedPath);
  }
  
  return outputPaths;
}
