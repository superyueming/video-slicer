import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

export type StepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

interface StepCardProps {
  stepNumber: string;
  title: string;
  status: StepStatus;
  progress?: number;
  children?: ReactNode;
  actions?: ReactNode;
  errorMessage?: string;
}

export default function StepCard({
  stepNumber,
  title,
  status,
  progress,
  children,
  actions,
  errorMessage
}: StepCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600">已完成</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600">处理中</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'skipped':
        return <Badge variant="outline">已跳过</Badge>;
      default:
        return <Badge variant="outline">等待中</Badge>;
    }
  };

  return (
    <Card className={`border ${status === 'processing' ? 'border-primary' : 'border-border'}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          {/* 左侧：图标 + 标题 */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-0.5 flex-shrink-0">{getStatusIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">{stepNumber}</span>
                {getStatusBadge()}
              </div>
              <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            </div>
          </div>
          
          {/* 右侧/底部：按钮组 */}
          {actions && (
            <div className="flex gap-2 flex-wrap sm:flex-shrink-0 sm:justify-end">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      
      {(progress !== undefined || children || errorMessage) && (
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {errorMessage}
            </div>
          )}
          
          {progress !== undefined && progress > 0 && progress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>处理进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {children}
        </CardContent>
      )}
    </Card>
  );
}
