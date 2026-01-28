import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

interface PromptConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  initialRequirement: string;
  initialPrompt?: string;
  onSuccess?: () => void;
}

export function PromptConfigDialog({
  open,
  onOpenChange,
  jobId,
  initialRequirement,
  initialPrompt,
  onSuccess
}: PromptConfigDialogProps) {
  const [userRequirement, setUserRequirement] = useState(initialRequirement);
  const [scriptPrompt, setScriptPrompt] = useState(initialPrompt || '');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const generatePromptMutation = trpc.video.generatePrompt.useMutation();
  const analyzeWithPromptMutation = trpc.video.analyzeWithPrompt.useMutation();

  useEffect(() => {
    setUserRequirement(initialRequirement);
    setScriptPrompt(initialPrompt || '');
  }, [initialRequirement, initialPrompt, open]);

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const result = await generatePromptMutation.mutateAsync({ jobId });
      setScriptPrompt(result.scriptPrompt);
    } catch (error) {
      console.error('生成提示词失败:', error);
      alert('生成提示词失败，请重试');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!scriptPrompt.trim()) {
      alert('请先生成或输入分析提示词');
      return;
    }

    try {
      await analyzeWithPromptMutation.mutateAsync({
        jobId,
        userRequirement,
        scriptPrompt
      });
      onOpenChange(false);
      onSuccess?.(); // 刷新job数据
    } catch (error) {
      console.error('开始分析失败:', error);
      alert('开始分析失败，请重试');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>配置AI分析</DialogTitle>
          <DialogDescription>
            查看和修改用户需求及AI生成的分析提示词
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 用户需求 */}
          <div className="space-y-2">
            <Label htmlFor="userRequirement">用户需求</Label>
            <Textarea
              id="userRequirement"
              value={userRequirement}
              onChange={(e) => setUserRequirement(e.target.value)}
              placeholder="请描述您的视频剪辑需求..."
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              描述您希望从视频中提取什么内容，例如：特定人物的演讲、关键观点合集等
            </p>
          </div>

          {/* AI生成的提示词 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="scriptPrompt">AI分析提示词</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGeneratePrompt}
                disabled={isGeneratingPrompt || !userRequirement.trim()}
              >
              {isGeneratingPrompt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>生成提示词</>
              )}
              </Button>
            </div>
            <Textarea
              id="scriptPrompt"
              value={scriptPrompt}
              onChange={(e) => setScriptPrompt(e.target.value)}
              placeholder="点击'生成提示词'按钮，AI将根据您的需求生成详细的分析提示词..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              AI将根据这个提示词进行视频内容分析和片段选择。您可以直接编辑提示词来调整分析方向。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleStartAnalysis}
              disabled={analyzeWithPromptMutation.isPending || !scriptPrompt.trim()}
            >
              {analyzeWithPromptMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  开始分析...
                </>
              ) : (
                <>开始分析</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
