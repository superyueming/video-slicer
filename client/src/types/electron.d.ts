/**
 * Electron API类型声明
 * 为桌面应用的window对象提供类型支持
 */

interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}

interface ProcessProgress {
  percent: number;
  currentTime?: number;
  speed?: number;
  fps?: number;
  currentClip?: number;
  totalClips?: number;
}

interface ClipSegment {
  startTime: number;
  endTime: number;
  title?: string;
}

interface Window {
  processorAPI?: {
    checkFFmpegAvailable: () => Promise<boolean>;
    getVideoInfo: (videoPath: string) => Promise<VideoInfo>;
    extractAudio: (videoPath: string, outputPath?: string) => Promise<string>;
    clipVideo: (videoPath: string, segment: ClipSegment, outputPath?: string, reEncode?: boolean) => Promise<string>;
    clipVideoBatch: (videoPath: string, segments: ClipSegment[], outputDir?: string, reEncode?: boolean) => Promise<string[]>;
    concatenateVideos: (videoPaths: string[], outputPath?: string, reEncode?: boolean) => Promise<string>;
    onProgress: (callback: (progress: ProcessProgress) => void) => () => void;
    onLog: (callback: (message: string) => void) => () => void;
  };
  fileAPI?: {
    selectVideoFile: () => Promise<string | null>;
    selectSavePath: (defaultName: string) => Promise<string | null>;
    showItemInFolder: (filePath: string) => Promise<void>;
  };
}
