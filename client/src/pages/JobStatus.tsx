import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download, 
  FileText, 
  Video,
  Home,
  FileVideo
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function JobStatus() {
  const [, params] = useRoute("/job/:id");
  const [, setLocation] = useLocation();
  const jobId = params?.id ? parseInt(params.id) : 0;

  const { data: job, isLoading, refetch } = trpc.video.getJob.useQuery(
    { jobId },
    { 
      enabled: jobId > 0,
      refetchInterval: (query) => {
        // 如果任务还在处理中，每2秒刷新一次
        const data = query.state.data;
        if (data && (data.status === 'pending' || data.status === 'processing')) {
          return 2000;
        }
        // 如果正在执行某个步骤（progress < 100），也要轮询
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
  
  const analyzeContentMutation = trpc.video.analyzeContent.useMutation({
    onSuccess: () => {
      toast.success('开始AI分析...');
      refetch();
    },
    onError: (error) => {
      toast.error(`分析失败: ${error.message}`);
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
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="p-8 glass-effect">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-center text-muted-foreground">加载中...</p>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
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
        return <CheckCircle2 className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-destructive" />;
      default:
        return <Loader2 className="w-16 h-16 animate-spin text-primary" />;
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

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container py-16">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Status Card */}
          <Card className="p-8 glass-effect text-center">
            <div className="mb-6">{getStatusIcon()}</div>
            
            <h1 className="text-3xl font-bold mb-2">{getStatusText()}</h1>
            
            {job.currentStep && (
              <p className="text-muted-foreground mb-6">{job.currentStep}</p>
            )}

            {job.status === 'failed' && job.errorMessage && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive text-sm text-left">
                <p className="font-semibold mb-1">错误信息：</p>
                <p className="whitespace-pre-wrap">{job.errorMessage}</p>
              </div>
            )}
            
            {job.status === 'failed' && (
              <Button 
                onClick={handleRetry} 
                disabled={retryMutation.isPending}
                className="mt-6"
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
            
            {(job.status === 'pending' || job.status === 'processing') && (
              <div className="space-y-2">
                <Progress value={job.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{job.progress}%</p>
              </div>
            )}

            {job.status === 'failed' && job.errorMessage && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{job.errorMessage}</p>
              </div>
            )}
          </Card>

          {/* Step Actions */}
          {(
            <Card className="p-6 glass-effect">
              <h2 className="text-lg font-semibold mb-4">分步处理</h2>
              <div className="space-y-3">
                <div className="space-y-2 p-3 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">步骤1: 提取音频</p>
                      <p className="text-sm text-muted-foreground">
                        {job.step === 'uploaded' && job.progress === 0 && '待处理'}
                        {job.step === 'uploaded' && job.progress > 0 && job.progress < 100 && job.currentStep}
                        {job.step !== 'uploaded' && '✅ 已完成'}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                    </div>
                  </div>
                  {job.step === 'uploaded' && job.progress > 0 && job.progress < 100 && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{job.progress}%</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 p-3 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">步骤2: 转录音频</p>
                      <p className="text-sm text-muted-foreground">
                        {job.step === 'audio_extracted' && job.progress === 0 && '待处理'}
                        {job.step === 'audio_extracted' && job.progress > 0 && job.progress < 100 && job.currentStep}
                        {job.step === 'transcribed' && '✅ 已完成'}
                        {job.step === 'uploaded' && '待处理'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {job.step === 'audio_extracted' && job.progress === 0 && (
                        <Button
                          size="sm"
                          onClick={() => transcribeAudioMutation.mutate({ jobId })}
                          disabled={transcribeAudioMutation.isPending}
                        >
                          {transcribeAudioMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            '开始处理'
                          )}
                        </Button>
                      )}
                      {(job.step === 'transcribed' || (job.step === 'audio_extracted' && job.progress > 0)) && (
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
                    </div>
                  </div>
                  {job.step === 'audio_extracted' && job.progress > 0 && job.progress < 100 && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{job.progress}%</p>
                    </div>
                  )}
                </div>
                
                {/* 步骤3: AI内容分析 */}
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">步骤3: AI内容分析</h3>
                    {job.step === 'analyzed' && (
                      <Badge variant="default">已完成</Badge>
                    )}
                    {job.step === 'transcribed' && job.progress === 0 && (
                      <Badge variant="secondary">待处理</Badge>
                    )}
                    {job.step === 'transcribed' && job.progress > 0 && job.progress < 100 && (
                      <Badge variant="default">处理中</Badge>
                    )}
                  </div>
                  
                  {/* 进度条 */}
                  {job.step === 'transcribed' && job.progress > 0 && job.progress < 100 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{job.currentStep}</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}
                  
                  {/* 按钮 */}
                  <div className="flex gap-2">
                    {/* 开始处理按钮 */}
                    {job.step === 'transcribed' && job.progress === 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          analyzeContentMutation.mutate({ jobId: job.id });
                        }}
                        disabled={analyzeContentMutation.isPending}
                      >
                        {analyzeContentMutation.isPending ? '处理中...' : '开始处理'}
                      </Button>
                    )}
                    
                    {/* 重新处理按钮 */}
                    {(job.step === 'analyzed' || (job.step === 'transcribed' && job.progress > 0)) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          analyzeContentMutation.mutate({ jobId: job.id });
                        }}
                        disabled={analyzeContentMutation.isPending}
                      >
                        {analyzeContentMutation.isPending ? '处理中...' : '重新处理'}
                      </Button>
                    )}
                    
                    {/* 查看结果按钮 */}
                    {job.step === 'analyzed' && job.selectedSegments && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // TODO: 显示分析结果弹窗
                          alert(`已选择 ${job.selectedSegments?.length || 0} 个精彩片段`);
                        }}
                      >
                        查看结果 ({job.selectedSegments.length}个片段)
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                  <div>
                    <p className="font-medium">步骤4: 生成视频</p>
                    <p className="text-sm text-muted-foreground">待实现</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Video Info */}
          <Card className="p-6 glass-effect">
            <h2 className="text-lg font-semibold mb-4">视频信息</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">文件名：</span>
                <span className="font-medium">{job.originalFilename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">文件大小：</span>
                <span className="font-medium">
                  {(job.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">识别方式：</span>
                <span className="font-medium">
                  {job.asrMethod === 'whisper' ? 'Whisper' : '阿里云ASR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间：</span>
                <span className="font-medium">
                  {new Date(job.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          </Card>

          {/* User Requirement */}
          <Card className="p-6 glass-effect">
            <h2 className="text-lg font-semibold mb-4">处理需求</h2>
            <p className="text-sm text-muted-foreground">{job.userRequirement}</p>
          </Card>

          {/* Results */}
          {job.status === 'completed' && (
            <Card className="p-6 glass-effect">
              <h2 className="text-lg font-semibold mb-4">处理结果</h2>
              
              {/* Video Player */}
              {job.finalVideoUrl && (
                <div className="mb-6">
                  <video
                    src={job.finalVideoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Selected Segments */}
              {job.selectedSegments && job.selectedSegments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">AI选择的片段</h3>
                  <div className="space-y-2">
                    {job.selectedSegments.map((seg, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-accent/30 text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">片段 {idx + 1}</span>
                          <span className="text-muted-foreground">
                            {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                          </span>
                        </div>
                        <p className="text-muted-foreground">{seg.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {job.finalVideoUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => job.finalVideoUrl && window.open(job.finalVideoUrl, '_blank')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    下载视频
                  </Button>
                )}
                
                {job.subtitleUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => job.subtitleUrl && window.open(job.subtitleUrl, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    下载字幕
                  </Button>
                )}
                
                {job.transcriptUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => job.transcriptUrl && window.open(job.transcriptUrl, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    下载文本
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setLocation("/jobs")}
            >
              <FileVideo className="w-4 h-4 mr-2" />
              我的任务
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
