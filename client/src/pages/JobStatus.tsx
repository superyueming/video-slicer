import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
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
  FileVideo
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function JobStatus() {
  const [, params] = useRoute("/job/:id");
  const [, setLocation] = useLocation();
  const jobId = params?.id ? parseInt(params.id) : 0;

  const { data: job, isLoading, refetch } = trpc.video.getJob.useQuery(
    { jobId },
    { 
      enabled: jobId > 0,
      refetchInterval: (query) => {
        // 如果任务还在处理中，每3秒刷新一次
        const data = query.state.data;
        if (data && (data.status === 'pending' || data.status === 'processing')) {
          return 3000;
        }
        return false;
      }
    }
  );

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
