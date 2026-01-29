import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload脚本
 * 在渲染进程中暴露安全的IPC接口
 */

// 视频信息类型
export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

// 处理进度类型
export interface ProcessProgress {
  percent: number;
  currentTime: number;
  speed: number;
  fps: number;
}

// 剪辑片段类型
export interface ClipSegment {
  startTime: number;
  endTime: number;
  title?: string;
}

// Processor API
contextBridge.exposeInMainWorld('processorAPI', {
  // 检查FFmpeg是否可用
  checkFFmpegAvailable: () => ipcRenderer.invoke('processor:checkFFmpeg'),
  
  // 获取视频信息
  getVideoInfo: (videoPath: string) => 
    ipcRenderer.invoke('processor:getVideoInfo', videoPath),
  
  // 提取音频
  extractAudio: (videoPath: string, outputPath?: string) =>
    ipcRenderer.invoke('processor:extractAudio', videoPath, outputPath),
  
  // 剪辑视频
  clipVideo: (videoPath: string, segment: ClipSegment, outputPath?: string, reEncode?: boolean) =>
    ipcRenderer.invoke('processor:clipVideo', videoPath, segment, outputPath, reEncode),
  
  // 批量剪辑视频
  clipVideoBatch: (videoPath: string, segments: ClipSegment[], outputDir?: string, reEncode?: boolean) =>
    ipcRenderer.invoke('processor:clipVideoBatch', videoPath, segments, outputDir, reEncode),
  
  // 拼接视频
  concatenateVideos: (videoPaths: string[], outputPath?: string, reEncode?: boolean) =>
    ipcRenderer.invoke('processor:concatenateVideos', videoPaths, outputPath, reEncode),
  
  // 监听处理进度
  onProgress: (callback: (progress: ProcessProgress) => void) => {
    const subscription = (_event: any, progress: ProcessProgress) => callback(progress);
    ipcRenderer.on('processor:progress', subscription);
    return () => ipcRenderer.removeListener('processor:progress', subscription);
  },
  
  // 监听处理日志
  onLog: (callback: (message: string) => void) => {
    const subscription = (_event: any, message: string) => callback(message);
    ipcRenderer.on('processor:log', subscription);
    return () => ipcRenderer.removeListener('processor:log', subscription);
  }
});

// 文件选择API
contextBridge.exposeInMainWorld('fileAPI', {
  // 选择视频文件
  selectVideoFile: () => ipcRenderer.invoke('file:selectVideo'),
  
  // 选择保存路径
  selectSavePath: (defaultName: string) => ipcRenderer.invoke('file:selectSavePath', defaultName),
  
  // 打开文件所在目录
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('file:showInFolder', filePath)
});

// 类型声明（供TypeScript使用）
declare global {
  interface Window {
    processorAPI: {
      checkFFmpegAvailable: () => Promise<boolean>;
      getVideoInfo: (videoPath: string) => Promise<VideoInfo>;
      extractAudio: (videoPath: string, outputPath?: string) => Promise<string>;
      clipVideo: (videoPath: string, segment: ClipSegment, outputPath?: string, reEncode?: boolean) => Promise<string>;
      clipVideoBatch: (videoPath: string, segments: ClipSegment[], outputDir?: string, reEncode?: boolean) => Promise<string[]>;
      concatenateVideos: (videoPaths: string[], outputPath?: string, reEncode?: boolean) => Promise<string>;
      onProgress: (callback: (progress: ProcessProgress) => void) => () => void;
      onLog: (callback: (message: string) => void) => () => void;
    };
    fileAPI: {
      selectVideoFile: () => Promise<string | null>;
      selectSavePath: (defaultName: string) => Promise<string | null>;
      showItemInFolder: (filePath: string) => Promise<void>;
    };
  }
}
