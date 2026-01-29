/**
 * FFmpeg Wrapper
 * 提供FFmpeg命令执行和进度解析功能
 */

import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * 获取FFmpeg可执行文件路径
 */
export function getFFmpegPath(): string {
  const platform = process.platform;
  const filename = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  
  if (app.isPackaged) {
    // 打包后的路径
    return path.join(process.resourcesPath, 'ffmpeg', filename);
  } else {
    // 开发环境路径
    const platformDir = platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux';
    return path.join(__dirname, '../../resources/ffmpeg', platformDir, filename);
  }
}

/**
 * 获取FFprobe可执行文件路径
 */
export function getFFprobePath(): string {
  const platform = process.platform;
  const filename = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'ffmpeg', filename);
  } else {
    const platformDir = platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux';
    return path.join(__dirname, '../../resources/ffmpeg', platformDir, filename);
  }
}

/**
 * 检查FFmpeg是否可用
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    const ffmpegPath = getFFmpegPath();
    if (!fs.existsSync(ffmpegPath)) {
      console.error('[FFmpeg] 文件不存在:', ffmpegPath);
      return false;
    }
    
    const version = await getFFmpegVersion();
    console.log('[FFmpeg] 版本:', version);
    return true;
  } catch (error) {
    console.error('[FFmpeg] 检查失败:', error);
    return false;
  }
}

/**
 * 获取FFmpeg版本
 */
export async function getFFmpegVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    const process = spawn(ffmpegPath, ['-version']);
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/ffmpeg version ([\d.]+)/);
        resolve(match ? match[1] : 'unknown');
      } else {
        reject(new Error('Failed to get FFmpeg version'));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * FFmpeg进度信息
 */
export interface FFmpegProgress {
  percent: number;      // 进度百分比 (0-100)
  currentTime: number;  // 当前处理时间（秒）
  speed: number;        // 处理速度（倍速）
  fps: number;          // 帧率
}

/**
 * FFmpeg执行选项
 */
export interface FFmpegOptions {
  args: string[];                                    // FFmpeg命令参数
  onProgress?: (progress: FFmpegProgress) => void;   // 进度回调
  onLog?: (message: string) => void;                 // 日志回调
}

/**
 * 执行FFmpeg命令
 */
export async function executeFFmpeg(options: FFmpegOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    const { args, onProgress, onLog } = options;
    
    console.log('[FFmpeg] 执行命令:', ffmpegPath, args.join(' '));
    
    const process = spawn(ffmpegPath, args);
    
    let duration = 0;
    let stderr = '';
    
    // FFmpeg输出到stderr
    process.stderr.on('data', (data) => {
      const message = data.toString();
      stderr += message;
      
      if (onLog) {
        onLog(message);
      }
      
      // 解析总时长
      if (duration === 0) {
        const durationMatch = message.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1]);
          const minutes = parseInt(durationMatch[2]);
          const seconds = parseFloat(durationMatch[3]);
          duration = hours * 3600 + minutes * 60 + seconds;
        }
      }
      
      // 解析进度
      if (duration > 0 && onProgress) {
        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        const speedMatch = message.match(/speed=\s*([\d.]+)x/);
        const fpsMatch = message.match(/fps=\s*([\d.]+)/);
        
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseFloat(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const percent = Math.min(100, (currentTime / duration) * 100);
          
          onProgress({
            percent,
            currentTime,
            speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
            fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
          });
        }
      }
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('[FFmpeg] 执行成功');
        resolve();
      } else {
        console.error('[FFmpeg] 执行失败，退出码:', code);
        console.error('[FFmpeg] 错误输出:', stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      console.error('[FFmpeg] 执行错误:', error);
      reject(error);
    });
  });
}

/**
 * 获取视频信息
 */
export interface VideoInfo {
  duration: number;     // 时长（秒）
  width: number;        // 宽度
  height: number;       // 高度
  fps: number;          // 帧率
  codec: string;        // 编解码器
  bitrate: number;      // 比特率
}

/**
 * 使用FFprobe获取视频信息
 */
export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ffprobePath = getFFprobePath();
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,codec_name,bit_rate',
      '-show_entries', 'format=duration',
      '-of', 'json',
      videoPath
    ];
    
    const process = spawn(ffprobePath, args);
    
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(output);
          const stream = data.streams[0];
          const format = data.format;
          
          // 解析帧率
          const fpsMatch = stream.r_frame_rate.match(/(\d+)\/(\d+)/);
          const fps = fpsMatch ? parseInt(fpsMatch[1]) / parseInt(fpsMatch[2]) : 0;
          
          resolve({
            duration: parseFloat(format.duration) || 0,
            width: stream.width || 0,
            height: stream.height || 0,
            fps,
            codec: stream.codec_name || 'unknown',
            bitrate: parseInt(stream.bit_rate) || 0,
          });
        } catch (error) {
          reject(new Error('Failed to parse video info'));
        }
      } else {
        reject(new Error(`FFprobe exited with code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}
