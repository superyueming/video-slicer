/**
 * 视频拼接模块
 * 将多个视频片段拼接成一个完整视频
 */

import { executeFFmpeg, FFmpegProgress } from './ffmpeg';
import path from 'path';
import fs from 'fs';

export interface ConcatenateVideosOptions {
  videoPaths: string[];                          // 输入视频路径列表
  outputPath?: string;                           // 输出路径（可选）
  reEncode?: boolean;                            // 是否重新编码（默认false）
  onProgress?: (progress: FFmpegProgress) => void; // 进度回调
}

/**
 * 拼接多个视频
 */
export async function concatenateVideos(options: ConcatenateVideosOptions): Promise<string> {
  const {
    videoPaths,
    outputPath,
    reEncode = false,
    onProgress
  } = options;
  
  if (videoPaths.length === 0) {
    throw new Error('视频路径列表为空');
  }
  
  // 检查所有输入文件是否存在
  for (const videoPath of videoPaths) {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`视频文件不存在: ${videoPath}`);
    }
  }
  
  // 生成输出路径
  const finalOutputPath = outputPath || path.join(
    path.dirname(videoPaths[0]),
    `concatenated_${Date.now()}${path.extname(videoPaths[0])}`
  );
  
  // 如果输出文件已存在，先删除
  if (fs.existsSync(finalOutputPath)) {
    fs.unlinkSync(finalOutputPath);
  }
  
  console.log('[VideoConcatenator] 开始拼接视频');
  console.log('[VideoConcatenator] 输入文件数:', videoPaths.length);
  console.log('[VideoConcatenator] 输出:', finalOutputPath);
  console.log('[VideoConcatenator] 重新编码:', reEncode);
  
  // 创建临时文件列表
  const fileListPath = path.join(path.dirname(finalOutputPath), `filelist_${Date.now()}.txt`);
  const fileListContent = videoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(fileListPath, fileListContent, 'utf-8');
  
  console.log('[VideoConcatenator] 文件列表:', fileListPath);
  
  try {
    // 构建FFmpeg命令
    const args = [
      '-f', 'concat',                       // 使用concat协议
      '-safe', '0',                         // 允许不安全的文件路径
      '-i', fileListPath,                   // 输入文件列表
    ];
    
    if (reEncode) {
      // 重新编码模式
      args.push(
        '-c:v', 'libx264',                  // 视频编码器
        '-preset', 'medium',                // 编码预设
        '-crf', '23',                       // 质量参数
        '-c:a', 'aac',                      // 音频编码器
        '-b:a', '128k'                      // 音频比特率
      );
    } else {
      // 流复制模式（快速）
      args.push('-c', 'copy');
    }
    
    args.push(
      '-y',                                 // 覆盖输出文件
      finalOutputPath                       // 输出文件
    );
    
    // 执行FFmpeg命令
    await executeFFmpeg({
      args,
      onProgress,
      onLog: (message) => {
        if (message.includes('error') || message.includes('Error')) {
          console.error('[VideoConcatenator] FFmpeg错误:', message);
        }
      }
    });
    
    // 检查输出文件是否生成
    if (!fs.existsSync(finalOutputPath)) {
      throw new Error('视频拼接失败：输出文件未生成');
    }
    
    const stats = fs.statSync(finalOutputPath);
    console.log('[VideoConcatenator] 拼接完成，文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    
    return finalOutputPath;
  } finally {
    // 删除临时文件列表
    if (fs.existsSync(fileListPath)) {
      fs.unlinkSync(fileListPath);
      console.log('[VideoConcatenator] 已删除临时文件:', fileListPath);
    }
  }
}
