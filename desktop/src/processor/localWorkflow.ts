/**
 * 本地视频处理工作流
 * 实现完整的本地处理流程，避免上传大文件到云端
 */

import { extractAudio } from './audioExtractor';
import { getFFmpegPath } from './ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LocalProcessingResult {
  audioPath: string;
  audioSize: number;
  videoPath: string;
  videoSize: number;
  videoDuration: number;
  videoWidth: number;
  videoHeight: number;
  videoCodec: string;
  audioCodec: string;
}

export interface LocalProcessingProgress {
  step: string;
  progress: number; // 0-100
  message: string;
}

/**
 * 获取视频信息
 */
async function getVideoInfo(videoPath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec: string;
}> {
  const ffmpegPath = getFFmpegPath();
  const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
  
  // 使用ffprobe获取视频信息
  const { stdout } = await execAsync(
    `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${videoPath}"`
  );
  
  const info = JSON.parse(stdout);
  
  // 查找视频流和音频流
  const videoStream = info.streams.find((s: any) => s.codec_type === 'video');
  const audioStream = info.streams.find((s: any) => s.codec_type === 'audio');
  
  if (!videoStream) {
    throw new Error('无法找到视频流');
  }
  
  return {
    duration: parseFloat(info.format.duration),
    width: videoStream.width,
    height: videoStream.height,
    videoCodec: videoStream.codec_name,
    audioCodec: audioStream ? audioStream.codec_name : 'none',
  };
}

/**
 * 本地处理工作流
 * 1. 检查视频文件
 * 2. 提取音频
 * 3. 获取视频信息
 * 4. 返回结果
 */
export async function processVideoLocally(
  videoPath: string,
  onProgress?: (progress: LocalProcessingProgress) => void
): Promise<LocalProcessingResult> {
  console.log('[LocalWorkflow] 开始本地处理:', videoPath);
  
  // 步骤1: 检查视频文件
  onProgress?.({
    step: 'check',
    progress: 0,
    message: '检查视频文件...',
  });
  
  if (!fs.existsSync(videoPath)) {
    throw new Error(`视频文件不存在: ${videoPath}`);
  }
  
  const videoStats = fs.statSync(videoPath);
  const videoSize = videoStats.size;
  
  console.log('[LocalWorkflow] 视频文件大小:', (videoSize / 1024 / 1024).toFixed(2), 'MB');
  
  // 步骤2: 获取视频信息
  onProgress?.({
    step: 'info',
    progress: 10,
    message: '获取视频信息...',
  });
  
  const videoInfo = await getVideoInfo(videoPath);
  
  console.log('[LocalWorkflow] 视频信息:', {
    duration: videoInfo.duration.toFixed(2) + 's',
    resolution: `${videoInfo.width}x${videoInfo.height}`,
    videoCodec: videoInfo.videoCodec,
    audioCodec: videoInfo.audioCodec,
  });
  
  // 步骤3: 提取音频
  onProgress?.({
    step: 'extract',
    progress: 20,
    message: '提取音频...',
  });
  
  // 生成音频输出路径
  const audioOutputPath = path.join(
    path.dirname(videoPath),
    `${path.basename(videoPath, path.extname(videoPath))}_audio.mp3`
  );
  
  // 提取音频
  const audioPath = await extractAudio(videoPath, audioOutputPath, {
    format: 'mp3',
    sampleRate: 16000, // 16kHz适合语音识别
    channels: 1,       // 单声道
    bitrate: '64k',    // 低比特率，减小文件大小
    onProgress: (ffmpegProgress) => {
      onProgress?.({
        step: 'extract',
        progress: 20 + (ffmpegProgress.percent || 0) * 0.7, // 20-90%
        message: `提取音频: ${(ffmpegProgress.percent || 0).toFixed(1)}%`,
      });
    },
  });
  
  const audioStats = fs.statSync(audioPath);
  const audioSize = audioStats.size;
  
  console.log('[LocalWorkflow] 音频文件大小:', (audioSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('[LocalWorkflow] 压缩比:', ((1 - audioSize / videoSize) * 100).toFixed(2) + '%');
  
  // 步骤4: 完成
  onProgress?.({
    step: 'complete',
    progress: 100,
    message: '处理完成',
  });
  
  const result: LocalProcessingResult = {
    audioPath,
    audioSize,
    videoPath,
    videoSize,
    videoDuration: videoInfo.duration,
    videoWidth: videoInfo.width,
    videoHeight: videoInfo.height,
    videoCodec: videoInfo.videoCodec,
    audioCodec: videoInfo.audioCodec,
  };
  
  console.log('[LocalWorkflow] 本地处理完成:', {
    audioSize: (audioSize / 1024 / 1024).toFixed(2) + ' MB',
    videoSize: (videoSize / 1024 / 1024).toFixed(2) + ' MB',
    savings: ((1 - audioSize / videoSize) * 100).toFixed(2) + '%',
  });
  
  return result;
}

/**
 * 清理临时文件
 */
export function cleanupTempFiles(audioPath: string): void {
  try {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log('[LocalWorkflow] 已清理临时音频文件:', audioPath);
    }
  } catch (error) {
    console.error('[LocalWorkflow] 清理临时文件失败:', error);
  }
}
