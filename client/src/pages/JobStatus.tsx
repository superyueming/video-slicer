import { useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download, 
  FileText, 
  Video,
  Home,
  FileVideo,
  RefreshCw
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AnalysisResultDialog } from '@/components/AnalysisResultDialog';
import { PromptConfigDialog } from '@/components/PromptConfigDialog';
import { StructureAnnotationDialog } from '@/components/StructureAnnotationDialog';
import StepCard, { StepStatus } from '@/components/StepCard';
import { useState } from "react";

export default function JobStatus() {
  const [, params] = useRoute("/job/:id");
  const [, setLocation] = useLocation();
  const jobId = params?.id ? parseInt(params.id) : 0;
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showPromptConfigDialog, setShowPromptConfigDialog] = useState(false);
  const [showStructureDialog, setShowStructureDialog] = useState(false);

  const { data: job, isLoading, refetch } = trpc.video.getJob.useQuery(
    { jobId },
    { 
      enabled: jobId > 0,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data && (data.status === 'pending' || data.status === 'processing')) {
          return 2000;
        }
        if (data && data.progress > 0 && data.progress < 100) {
          return 2000;
        }
        return false;
      }
    }
  );
  
  const retryMutation = trpc.video.retryJob.useMutation({
    onSuccess: () => {
      toast.success('任务已重新启动，正在处理...');
      refetch();
    },
    onError: (error) => {
      toast.error(`重启失败: ${error.message}`);
    },
  });
  
  const extractAudioMutation = trpc.video.extractAudio.useMutation({
    onSuccess: () => {
      toast.success('开始提取音频...');
      refetch();
    },
    onError: (error) => {
      toast.error(`提取失败: ${error.message}`);
    },
  });
  
  const transcribeAudioMutation = trpc.video.transcribeAudio.useMutation({
    onSuccess: () => {
      toast.success('开始转录音频...');
      refetch();
    },
    onError: (error) => {
      toast.error(`转录失败: ${error.message}`);
    },
  });
  
  const annotateStructureMutation = trpc.video.annotateStructure.useMutation({
    onSuccess: () => {
      toast.success('开始标注内容结构...');
      refetch();
    },
    onError: (error) => {
      toast.error(`标注失败: ${error.message}`);
    },
  });
  
  const analyzeContentMutation = trpc.video.analyzeContent.useMutation({
    onSuccess: () => {
      toast.success('开始AI分析...');
      refetch();
    },
    onError: (error) => {
      toast.error(`分析失败: ${error.message}`);
    },
  });
  
  const generateClipsMutation = trpc.video.generateClips.useMutation({
    onSuccess: () => {
      toast.success('开始生成视频片段...');
      refetch();
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });
  
  const updateSegmentsMutation = trpc.video.updateSegments.useMutation({
    onSuccess: () => {
      toast.success('片段列表已更新');
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });
  
  const handleRetry = () => {
    if (job?.status === 'failed') {
      retryMutation.mutate({ jobId });
    }
  };

  useEffect(() => {
    if (job?.status === 'completed') {
      toast.success("视频处理完成！");
    } else if (job?.status === 'failed') {
      toast.error("视频处理失败");
    }
  }, [job?.status]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 glass-effect">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-center text-muted-foreground">加载中...</p>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 glass-effect text-center">
          <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">任务不存在</h2>
          <Button onClick={() => setLocation("/")} className="mt-4">
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />;
      case 'failed':
        return <XCircle className="w-12 h-12 text-destructive" />;
      default:
        return <Loader2 className="w-12 h-12 animate-spin text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'completed':
        return '处理完成';
      case 'failed':
        return '处理失败';
      case 'processing':
        return '正在处理';
      default:
        return '等待处理';
    }
  };

  // 计算各步骤状态
  const getStep1Status = (): StepStatus => {
    if (job.step === 'uploaded' && job.progress > 0 && job.progress < 100) return 'processing';
    if (job.step === 'uploaded' && job.progress === 0) return 'pending';
    return 'completed';
  };

  const getStep2Status = (): StepStatus => {
    if (job.step === 'audio_extracted' && job.progress > 0 && job.progress < 100) return 'processing';
    if (job.step === 'audio_extracted' && job.progress === 0) return 'pending';
    if (job.step && ['transcribed', 'analyzed', 'completed'].includes(job.step)) return 'completed';
    return 'pending';
  };

  const getStep25Status = (): StepStatus => {
    if (job.contentStructure) return 'completed';
    return 'pending';
  };

  const getStep3Status = (): StepStatus => {
    if (job.step === 'transcribed' && job.progress > 0 && job.progress < 100) return 'processing';
    if (job.step === 'transcribed' && job.progress === 0) return 'pending';
    if (job.step && ['analyzed', 'completed'].includes(job.step)) return 'completed';
    return 'pending';
  };

  const getStep4Status = (): StepStatus => {
    if (job.step === 'analyzed' && job.progress > 0 && job.progress < 100) return 'processing';
    if (job.step === 'analyzed' && job.progress === 0) return 'pending';
    if (job.step === 'completed') return 'completed';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 面包屑导航 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">任务列表</Link>
            <span>/</span>
            <span className="text-foreground">任务 {jobId}</span>
          </div>

          {/* 紧凑的状态栏 */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h1 className="text-lg font-semibold">{getStatusText()}</h1>
                {job.currentStep && (
                  <p className="text-sm text-muted-foreground">{job.currentStep || ''}</p>
                )}
              </div>
            </div>
            
            {(job.status === 'pending' || job.status === 'processing') && (
              <div className="flex items-center gap-3 min-w-[200px]">
                <Progress value={job.progress} className="h-2" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">{job.progress}%</span>
              </div>
            )}
            
            {job.status === 'failed' && (
              <Button 
                onClick={handleRetry} 
                disabled={retryMutation.isPending}
                size="sm"
              >
                {retryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    重启中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新处理
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 错误信息 */}
          {job.status === 'failed' && job.errorMessage && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="font-semibold text-sm text-destructive mb-1">错误信息：</p>
              <p className="text-sm text-destructive whitespace-pre-wrap">{job.errorMessage}</p>
            </div>
          )}

          {/* 步骤0: 上传信息 */}
          <StepCard
            stepNumber="步骤 0"
            title="视频信息"
            status="completed"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">文件大小：</span>
                <span className="font-medium">{(job.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-muted-foreground">视频时长：</span>
                <span className="font-medium">{job.duration ? `${Math.floor(job.duration / 60)}分${Math.floor(job.duration % 60)}秒` : '未知'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">创建时间：</span>
                <span className="font-medium">{new Date(job.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">视频文件：</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(job.originalVideoUrl, '_blank')}
                  className="h-7 text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  下载
                </Button>
              </div>
            </div>
          </StepCard>

          {/* 步骤1: 提取音频 */}
          <StepCard
            stepNumber="步骤 1"
            title="提取音频"
            status={getStep1Status()}
            progress={job.step === 'uploaded' && job.progress > 0 ? job.progress : undefined}
            actions={
              <>
                {job.step === 'uploaded' && job.progress === 0 && (
                  <Button
                    size="sm"
                    onClick={() => extractAudioMutation.mutate({ jobId })}
                    disabled={extractAudioMutation.isPending}
                  >
                    {extractAudioMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      '开始处理'
                    )}
                  </Button>
                )}
                {(job.step !== 'uploaded' || (job.step === 'uploaded' && job.progress > 0)) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => extractAudioMutation.mutate({ jobId })}
                    disabled={extractAudioMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新处理
                  </Button>
                )}
                {job.audioUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(job.audioUrl!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载音频
                  </Button>
                )}
              </>
            }
          />

          {/* 步骤2: 转录音频 */}
          <StepCard
            stepNumber="步骤 2"
            title="转录音频"
            status={getStep2Status()}
            progress={job.step === 'audio_extracted' && job.progress > 0 ? job.progress : undefined}
            actions={
              <>
                {job.transcriptUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => transcribeAudioMutation.mutate({ jobId })}
                    disabled={transcribeAudioMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新处理
                  </Button>
                )}
                {job.transcriptUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(job.transcriptUrl!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载字幕
                  </Button>
                )}
              </>
            }
          />

          {/* 步骤2.5: 内容结构标注 */}
          <StepCard
            stepNumber="步骤 2.5"
            title="内容结构标注"
            status={getStep25Status()}
            actions={
              <>
                {job.transcriptUrl && (
                  <Button
                    size="sm"
                    onClick={() => annotateStructureMutation.mutate({ jobId })}
                    disabled={annotateStructureMutation.isPending}
                  >
                    {annotateStructureMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        标注中...
                      </>
                    ) : (
                      job.contentStructure ? '重新标注' : '开始标注'
                    )}
                  </Button>
                )}
                {job.contentStructure && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStructureDialog(true)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    查看结构
                  </Button>
                )}
              </>
            }
          />

          {/* 步骤3: AI内容分析 */}
          <StepCard
            stepNumber="步骤 3"
            title="AI内容分析"
            status={getStep3Status()}
            progress={job.step === 'transcribed' && job.progress > 0 ? job.progress : undefined}
            actions={
              <>
                {job.transcriptUrl && (
                  <Button
                    size="sm"
                    onClick={() => setShowPromptConfigDialog(true)}
                  >
                    配置分析
                  </Button>
                )}
                {job.selectedSegments && job.selectedSegments.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPromptConfigDialog(true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新处理
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAnalysisDialog(true)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      查看结果 ({job.selectedSegments.length}个片段)
                    </Button>
                  </>
                )}
              </>
            }
          />

          {/* 步骤4: 生成视频片段 */}
          <StepCard
            stepNumber="步骤 4"
            title="生成视频片段"
            status={getStep4Status()}
            progress={job.step === 'completed' && job.progress === 100 ? undefined : job.progress}
            actions={
              <>
                {job.step === 'analyzed' && job.progress === 0 && (
                  <Button
                    size="sm"
                    onClick={() => generateClipsMutation.mutate({ jobId })}
                    disabled={generateClipsMutation.isPending}
                  >
                    {generateClipsMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      '开始处理'
                    )}
                  </Button>
                )}
                {(job.step === 'completed' || (job.step === 'analyzed' && job.progress > 0)) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateClipsMutation.mutate({ jobId })}
                    disabled={generateClipsMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新处理
                  </Button>
                )}
                {job.finalVideoUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(job.finalVideoUrl!, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载视频
                  </Button>
                )}
              </>
            }
          >
            {job.finalVideoUrl && job.step === 'completed' && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border bg-card">
                  <video
                    controls
                    className="w-full"
                    src={job.finalVideoUrl}
                  >
                    您的浏览器不支持视频播放。
                  </video>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>✅ 视频已生成完成，可以在线预览或下载</p>
                </div>
              </div>
            )}
          </StepCard>
        </div>
      </div>

      {/* 对话框 */}
      {showAnalysisDialog && job.selectedSegments && (
        <AnalysisResultDialog
          open={showAnalysisDialog}
          onOpenChange={setShowAnalysisDialog}
          userRequirement={job.userRequirement || ''}
          segments={job.selectedSegments}
          overallScript={job.overallScript || ''}
          onSave={async (segments) => {
            updateSegmentsMutation.mutate({ jobId, segments });
            setShowAnalysisDialog(false);
          }}
        />
      )}

      {showPromptConfigDialog && (
        <PromptConfigDialog
          open={showPromptConfigDialog}
          onOpenChange={setShowPromptConfigDialog}
          jobId={jobId}
          initialRequirement={job.userRequirement || ''}
          initialPrompt={job.scriptPrompt || undefined}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {showStructureDialog && job.contentStructure && (
        <StructureAnnotationDialog
          open={showStructureDialog}
          onOpenChange={setShowStructureDialog}
          jobId={jobId}
          initialStructure={job.contentStructure}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
