import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  FileVideo
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function JobList() {
  const [, setLocation] = useLocation();
  const { data: jobs, isLoading } = trpc.video.listJobs.useQuery();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            已完成
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            失败
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            处理中
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            等待中
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">我的任务</h1>
              <p className="text-muted-foreground">查看所有视频处理任务</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setLocation("/")}>
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
              <Button onClick={() => setLocation("/")}>
                <Plus className="w-4 h-4 mr-2" />
                新建任务
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card className="p-8 glass-effect text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && (!jobs || jobs.length === 0) && (
            <Card className="p-12 glass-effect text-center">
              <FileVideo className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">还没有任务</h2>
              <p className="text-muted-foreground mb-6">
                创建您的第一个视频切片任务
              </p>
              <Button onClick={() => setLocation("/")}>
                <Plus className="w-4 h-4 mr-2" />
                创建任务
              </Button>
            </Card>
          )}

          {/* Job List */}
          {!isLoading && jobs && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-6 glass-effect hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/job/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {job.originalFilename}
                        </h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.userRequirement}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">文件大小</span>
                      <p className="font-medium">
                        {(job.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">识别方式</span>
                      <p className="font-medium">
                        {job.asrMethod === 'whisper' ? 'Whisper' : '阿里云'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">进度</span>
                      <p className="font-medium">{job.progress}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">创建时间</span>
                      <p className="font-medium">
                        {new Date(job.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  {job.currentStep && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        {job.currentStep}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
