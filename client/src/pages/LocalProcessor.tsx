import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FolderOpen, Play, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/**
 * 本地视频处理页面（桌面应用专用）
 * 
 * 功能：
 * 1. 选择本地视频文件
 * 2. 提取音频
 * 3. 上传音频到云端进行AI分析
 * 4. 根据AI结果在本地剪辑视频
 * 5. 在本地拼接视频
 * 6. 导出最终结果
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

export default function LocalProcessor() {
  
  // 状态管理
  const [isElectron, setIsElectron] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [segments, setSegments] = useState<ClipSegment[]>([]);
  const [clipPaths, setClipPaths] = useState<string[]>([]);
  const [finalVideoPath, setFinalVideoPath] = useState<string | null>(null);
  
  // 处理状态
  const [currentStep, setCurrentStep] = useState(0); // 0: 选择视频, 1: 提取音频, 2: AI分析, 3: 剪辑, 4: 拼接
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  // 检查是否在Electron环境中
  useEffect(() => {
    const checkElectron = () => {
      if (typeof window !== 'undefined' && window.processorAPI) {
        setIsElectron(true);
      }
    };
    checkElectron();
  }, []);

  // 监听处理进度
  useEffect(() => {
    if (!isElectron || !window.processorAPI) return;

    const unsubProgress = window.processorAPI.onProgress((prog: ProcessProgress) => {
      setProgress(prog.percent);
      if (prog.currentClip && prog.totalClips) {
        setStatusMessage(`正在处理第 ${prog.currentClip}/${prog.totalClips} 个片段...`);
      }
    });

    const unsubLog = window.processorAPI.onLog((message: string) => {
      setLogs(prev => [...prev.slice(-50), message]); // 保留最近50条日志
    });

    return () => {
      unsubProgress();
      unsubLog();
    };
  }, [isElectron]);

  // 选择视频文件
  const handleSelectVideo = async () => {
    if (!window.fileAPI) return;
    
    try {
      const path = await window.fileAPI!.selectVideoFile();
      if (!path) return;

      setVideoPath(path);
      setStatusMessage('正在获取视频信息...');
      
      // 获取视频信息
      const info = await window.processorAPI!.getVideoInfo(path);
      setVideoInfo(info);
      setCurrentStep(1);
      
      toast.success('视频已选择', {
        description: `时长: ${Math.round(info.duration)}秒, 分辨率: ${info.width}x${info.height}`,
      });
    } catch (error: any) {
      toast.error('获取视频信息失败', {
        description: error.message,
      });
    }
  };

  // 提取音频
  const handleExtractAudio = async () => {
    if (!videoPath) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('正在提取音频...');
    
    try {
      const audioPath = await window.processorAPI!.extractAudio(videoPath);
      setAudioPath(audioPath);
      setCurrentStep(2);
      
      toast.success('音频提取成功', {
        description: '现在可以上传音频进行AI分析',
      });
    } catch (error: any) {
      toast.error('音频提取失败', {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // 上传音频并进行AI分析（调用云端API）
  const handleAnalyzeAudio = async () => {
    if (!audioPath || !videoInfo) return;
    
    setIsProcessing(true);
    setStatusMessage('正在上传音频到云端...');
    
    try {
      // 1. 读取音频文件
      const fs = require('fs');
      const audioBuffer = fs.readFileSync(audioPath);
      const base64Data = audioBuffer.toString('base64');
      const filename = audioPath.split('/').pop() || 'audio.mp3';
      
      // 2. 上传音频到云端
      setStatusMessage('正在上传音频...');
      const uploadMutation = trpc.localProcessor.uploadAudio.useMutation();
      const uploadResult = await uploadMutation.mutateAsync({
        filename,
        contentType: 'audio/mpeg',
        fileSize: audioBuffer.length,
        base64Data,
      });
      
      // 3. 调用AI分析API
      setStatusMessage('正在进行AI分析...');
      const analysisMutation = trpc.localProcessor.analyzeAudio.useMutation();
      const analysisResult = await analysisMutation.mutateAsync({
        audioUrl: uploadResult.url,
        audioKey: uploadResult.key,
        videoDuration: videoInfo.duration,
        userRequirement: '请选择最精彩、最有价值的片段，适合分享到社交媒体',
        asrMethod: 'whisper',
      });
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'AI分析失败');
      }
      
      // 4. 转换片段格式
      const convertedSegments: ClipSegment[] = (analysisResult.segments || []).map((seg: any) => ({
        startTime: seg.start,
        endTime: seg.end,
        title: seg.reason,
      }));
      
      setSegments(convertedSegments);
      setCurrentStep(3);
      
      toast.success('AI分析完成', {
        description: `识别到 ${convertedSegments.length} 个精彩片段`,
      });
    } catch (error: any) {
      toast.error('AI分析失败', {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 批量剪辑视频
  const handleClipVideos = async () => {
    if (!videoPath || segments.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('正在剪辑视频...');
    
    try {
      const clips = await window.processorAPI!.clipVideoBatch(
        videoPath,
        segments,
        undefined, // 使用默认输出目录
        false // 不重新编码（快速模式）
      );
      
      setClipPaths(clips);
      setCurrentStep(4);
      
      toast.success('视频剪辑完成', {
        description: `已生成 ${clips.length} 个视频片段`,
      });
    } catch (error: any) {
      toast.error('视频剪辑失败', {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // 拼接视频
  const handleConcatenateVideos = async () => {
    if (clipPaths.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('正在拼接视频...');
    
    try {
      const finalPath = await window.processorAPI!.concatenateVideos(
        clipPaths,
        undefined, // 使用默认输出路径
        true // 重新编码确保兼容性
      );
      
      setFinalVideoPath(finalPath);
      setCurrentStep(5);
      
      toast.success('视频拼接完成', {
        description: '最终视频已生成',
      });
    } catch (error: any) {
      toast.error('视频拼接失败', {
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // 打开文件所在目录
  const handleShowInFolder = (filePath: string) => {
    window.fileAPI!.showItemInFolder(filePath);
  };

  // 重置所有状态
  const handleReset = () => {
    setVideoPath(null);
    setVideoInfo(null);
    setAudioPath(null);
    setSegments([]);
    setClipPaths([]);
    setFinalVideoPath(null);
    setCurrentStep(0);
    setProgress(0);
    setStatusMessage('');
    setLogs([]);
  };

  // 如果不在Electron环境中，显示提示
  if (!isElectron) {
    return (
      <div className="container mx-auto py-16">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-2">仅限桌面应用</h2>
          <p className="text-muted-foreground">
            本地视频处理功能仅在桌面应用中可用。
            <br />
            请下载并安装桌面版应用以使用此功能。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">本地视频处理</h1>
        <p className="text-muted-foreground">
          在本地处理视频，仅上传音频进行AI分析，节省带宽和时间
        </p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['选择视频', '提取音频', 'AI分析', '剪辑视频', '拼接视频', '完成'].map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              <span className="text-xs mt-2 text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 步骤0: 选择视频 */}
      {currentStep === 0 && (
        <Card className="p-8 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">选择视频文件</h3>
          <p className="text-muted-foreground mb-6">
            选择一个本地视频文件开始处理
          </p>
          <Button onClick={handleSelectVideo} size="lg">
            <FolderOpen className="w-4 h-4 mr-2" />
            选择视频
          </Button>
        </Card>
      )}

      {/* 步骤1: 提取音频 */}
      {currentStep === 1 && videoPath && videoInfo && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">视频信息</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-muted-foreground">文件路径:</span>
              <p className="font-mono text-sm truncate">{videoPath}</p>
            </div>
            <div>
              <span className="text-muted-foreground">时长:</span>
              <p>{Math.round(videoInfo.duration)}秒</p>
            </div>
            <div>
              <span className="text-muted-foreground">分辨率:</span>
              <p>{videoInfo.width}x{videoInfo.height}</p>
            </div>
            <div>
              <span className="text-muted-foreground">帧率:</span>
              <p>{videoInfo.fps} FPS</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleExtractAudio} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提取中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  提取音频
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重新选择
            </Button>
          </div>
          
          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* 步骤2: AI分析 */}
      {currentStep === 2 && audioPath && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">AI分析</h3>
          <p className="text-muted-foreground mb-4">
            音频已提取完成，现在上传到云端进行AI分析
          </p>
          <div className="mb-6">
            <span className="text-muted-foreground">音频文件:</span>
            <p className="font-mono text-sm truncate">{audioPath}</p>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleAnalyzeAudio} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  开始AI分析
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => handleShowInFolder(audioPath)}>
              打开文件夹
            </Button>
          </div>
        </Card>
      )}

      {/* 步骤3: 剪辑视频 */}
      {currentStep === 3 && segments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">AI分析结果</h3>
          <p className="text-muted-foreground mb-4">
            识别到 {segments.length} 个精彩片段，现在开始剪辑
          </p>
          
          <div className="space-y-2 mb-6">
            {segments.map((seg, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <span className="font-semibold">{seg.title || `片段 ${index + 1}`}</span>
                  <span className="text-sm text-muted-foreground ml-4">
                    {seg.startTime}s - {seg.endTime}s ({seg.endTime - seg.startTime}s)
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <Button onClick={handleClipVideos} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                剪辑中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                开始剪辑
              </>
            )}
          </Button>
          
          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* 步骤4: 拼接视频 */}
      {currentStep === 4 && clipPaths.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">视频剪辑完成</h3>
          <p className="text-muted-foreground mb-4">
            已生成 {clipPaths.length} 个视频片段，现在拼接成最终视频
          </p>
          
          <Button onClick={handleConcatenateVideos} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                拼接中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                拼接视频
              </>
            )}
          </Button>
          
          {isProcessing && (
            <div className="mt-4">
              <Progress value={progress} className="mb-2" />
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          )}
        </Card>
      )}

      {/* 步骤5: 完成 */}
      {currentStep === 5 && finalVideoPath && (
        <Card className="p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-2xl font-semibold mb-2">处理完成！</h3>
          <p className="text-muted-foreground mb-6">
            最终视频已生成
          </p>
          
          <div className="mb-6">
            <span className="text-muted-foreground">文件位置:</span>
            <p className="font-mono text-sm truncate">{finalVideoPath}</p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={() => handleShowInFolder(finalVideoPath)}>
              <Download className="w-4 h-4 mr-2" />
              打开文件夹
            </Button>
            <Button variant="outline" onClick={handleReset}>
              处理新视频
            </Button>
          </div>
        </Card>
      )}

      {/* 日志输出（开发调试用） */}
      {logs.length > 0 && (
        <Card className="mt-8 p-4">
          <h4 className="text-sm font-semibold mb-2">处理日志</h4>
          <div className="bg-muted rounded p-2 max-h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <p key={index} className="text-xs font-mono">{log}</p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
