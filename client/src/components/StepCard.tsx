import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

export type StepStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

interface StepCardProps {
  stepNumber: string;
  title: string;
  description: string;
  status: StepStatus;
  children?: ReactNode;
  actions?: ReactNode;
  errorMessage?: string;
}

export default function StepCard({
  stepNumber,
  title,
  description,
  status,
  children,
  actions,
  errorMessage
}: StepCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">已完成</Badge>;
      case 'processing':
        return <Badge variant="secondary">处理中</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'skipped':
        return <Badge variant="outline">已跳过</Badge>;
      default:
        return <Badge variant="outline">等待中</Badge>;
    }
  };

  const isDisabled = status === 'pending' || status === 'processing';

  return (
    <Card className={`${status === 'processing' ? 'border-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getStatusIcon()}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">{stepNumber}</span>
                {getStatusBadge()}
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {(children || actions || errorMessage) && (
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {errorMessage}
            </div>
          )}
          
          {children}
          
          {actions && (
            <div className="flex gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
