/**
 * 音频提取模块
 * 从视频中提取音频为WAV格式
 */

import { executeFFmpeg, FFmpegProgress } from './ffmpeg';
import path from 'path';
import fs from 'fs';

export interface ExtractAudioOptions {
  videoPath: string;                             // 输入视频路径
  outputPath?: string;                           // 输出音频路径（可选，默认为同目录下的.wav文件）
  sampleRate?: number;                           // 采样率（默认16000Hz，适合语音识别）
  channels?: number;                             // 声道数（默认1，单声道）
  onProgress?: (progress: FFmpegProgress) => void; // 进度回调
  onLog?: (message: string) => void;             // 日志回调
}

/**
 * 从视频中提取音频
 */
export async function extractAudio(options: ExtractAudioOptions): Promise<string> {
  const {
    videoPath,
    outputPath,
    sampleRate = 16000,
    channels = 1,
    onProgress,
    onLog
  } = options;
  
  // 检查输入文件是否存在
  if (!fs.existsSync(videoPath)) {
    throw new Error(`视频文件不存在: ${videoPath}`);
  }
  
  // 生成输出路径
  const finalOutputPath = outputPath || path.join(
    path.dirname(videoPath),
    path.basename(videoPath, path.extname(videoPath)) + '.wav'
  );
  
  // 如果输出文件已存在，先删除
  if (fs.existsSync(finalOutputPath)) {
    fs.unlinkSync(finalOutputPath);
  }
  
  console.log('[AudioExtractor] 开始提取音频');
  console.log('[AudioExtractor] 输入:', videoPath);
  console.log('[AudioExtractor] 输出:', finalOutputPath);
  console.log('[AudioExtractor] 采样率:', sampleRate, 'Hz');
  console.log('[AudioExtractor] 声道数:', channels);
  
  // 构建FFmpeg命令
  const args = [
    '-i', videoPath,                    // 输入文件
    '-vn',                              // 不处理视频
    '-acodec', 'pcm_s16le',             // 音频编码器：16位PCM
    '-ar', sampleRate.toString(),       // 采样率
    '-ac', channels.toString(),         // 声道数
    '-y',                               // 覆盖输出文件
    finalOutputPath                     // 输出文件
  ];
  
  // 执行FFmpeg命令
  await executeFFmpeg({
    args,
    onProgress,
    onLog: (message) => {
      // 可以在这里添加日志处理
      if (message.includes('error') || message.includes('Error')) {
        console.error('[AudioExtractor] FFmpeg错误:', message);
      }
    }
  });
  
  // 检查输出文件是否生成
  if (!fs.existsSync(finalOutputPath)) {
    throw new Error('音频提取失败：输出文件未生成');
  }
  
  const stats = fs.statSync(finalOutputPath);
  console.log('[AudioExtractor] 提取完成，文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  
  return finalOutputPath;
}

/**
 * 批量提取音频
 */
export async function extractAudioBatch(
  videoPaths: string[],
  onProgress?: (index: number, total: number, progress: FFmpegProgress) => void
): Promise<string[]> {
  const outputPaths: string[] = [];
  
  for (let i = 0; i < videoPaths.length; i++) {
    const videoPath = videoPaths[i];
    console.log(`[AudioExtractor] 批量提取 ${i + 1}/${videoPaths.length}: ${videoPath}`);
    
    const audioPath = await extractAudio({
      videoPath,
      onProgress: (progress) => {
        if (onProgress) {
          onProgress(i, videoPaths.length, progress);
        }
      }
    });
    
    outputPaths.push(audioPath);
  }
  
  return outputPaths;
}
