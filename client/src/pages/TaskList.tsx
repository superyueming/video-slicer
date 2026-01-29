import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Loader2, Video, Clock, CheckCircle2, XCircle, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function TaskList() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { data: jobs, isLoading } = trpc.video.listJobs.useQuery();

  const getStatusBadge = (status: string, step: string) => {
    if (status === 'failed') {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />失败</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" />完成</Badge>;
    }
    if (status === 'processing') {
      return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />处理中</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />等待中</Badge>;
  };

  const getStepLabel = (step: string) => {
    const stepMap: Record<string, string> = {
      'pending': '等待开始',
      'extracting_audio': '步骤1: 提取音频',
      'transcribing': '步骤2: 转录字幕',
      'annotating_structure': '步骤2.5: 标注结构',
      'analyzing': '步骤3: AI分析',
      'generating_clips': '步骤4: 生成视频',
      'completed': '已完成'
    };
    return stepMap[step] || step;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">视频任务列表</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">管理您的所有视频切片任务</p>
        </div>
        <Button onClick={() => navigate("/upload")} size="default" className="gap-2 w-full sm:w-auto">
          <Upload className="w-4 h-4" />
          上传新视频
        </Button>
      </div>

      {!jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Video className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">还没有任务</h3>
            <p className="text-muted-foreground mb-6">上传您的第一个视频开始使用</p>
            <Button onClick={() => navigate("/upload")} className="gap-2">
              <Upload className="w-4 h-4" />
              上传视频
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/job/${job.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      任务 {job.id}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {job.createdAt && formatDistanceToNow(job.createdAt, {
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </CardDescription>
                  </div>
                  {getStatusBadge(job.status || 'pending', job.step || 'pending')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">当前步骤</span>
                    <span className="font-medium">{getStepLabel(job.step || 'pending')}</span>
                  </div>
                  {job.progress !== null && job.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">进度</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {job.currentStep && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.currentStep}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
