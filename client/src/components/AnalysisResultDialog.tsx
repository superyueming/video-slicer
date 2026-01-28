import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface Segment {
  start: number;
  end: number;
  reason: string;
}

interface AnalysisResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRequirement: string;
  scriptPrompt?: string | null;
  overallScript?: string | null;
  segments: Segment[];
  onSave: (segments: Segment[]) => Promise<void>;
}

// 将秒数转换为 HH:MM:SS 格式
function secondsToTimeString(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 将 HH:MM:SS 格式转换为秒数
function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

export function AnalysisResultDialog({
  open,
  onOpenChange,
  userRequirement,
  scriptPrompt,
  overallScript,
  segments,
  onSave,
}: AnalysisResultDialogProps) {
  const [editedSegments, setEditedSegments] = useState<Segment[]>(segments);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditSegment = (index: number, field: keyof Segment, value: string | number) => {
    const newSegments = [...editedSegments];
    if (field === 'start' || field === 'end') {
      // 如果是时间字段，从字符串转换为秒数
      newSegments[index][field] = typeof value === 'string' ? timeStringToSeconds(value) : value;
    } else {
      newSegments[index][field] = value as string;
    }
    setEditedSegments(newSegments);
  };

  const handleDeleteSegment = (index: number) => {
    const newSegments = editedSegments.filter((_, i) => i !== index);
    setEditedSegments(newSegments);
    toast.success('片段已删除');
  };

  const handleAddSegment = () => {
    const newSegment: Segment = {
      start: 0,
      end: 60,
      reason: '新片段',
    };
    setEditedSegments([...editedSegments, newSegment]);
    setEditingIndex(editedSegments.length);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSegments);
      toast.success('片段列表已更新');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`保存失败: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI分析结果</DialogTitle>
          <DialogDescription>
            查看和编辑AI生成的脚本和片段选择
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 用户需求 */}
          <Card className="p-4">
            <h3 className="font-medium mb-2">用户需求</h3>
            <p className="text-sm text-muted-foreground">{userRequirement}</p>
          </Card>

          {/* 脚本提示词 */}
          {scriptPrompt && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">AI生成的分析提示词</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {scriptPrompt}
              </div>
            </Card>
          )}

          {/* 总体脚本 */}
          {overallScript && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">视频内容脚本</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                {overallScript}
              </div>
            </Card>
          )}

          {/* 片段列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">精选片段 ({editedSegments.length}个)</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddSegment}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加片段
              </Button>
            </div>

            <div className="space-y-3">
              {editedSegments.map((segment, index) => (
                <Card key={index} className="p-4">
                  {editingIndex === index ? (
                    // 编辑模式
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">开始时间 (HH:MM:SS)</label>
                          <Input
                            type="text"
                            value={secondsToTimeString(segment.start)}
                            onChange={(e) => handleEditSegment(index, 'start', e.target.value)}
                            placeholder="00:00:00"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">结束时间 (HH:MM:SS)</label>
                          <Input
                            type="text"
                            value={secondsToTimeString(segment.end)}
                            onChange={(e) => handleEditSegment(index, 'end', e.target.value)}
                            placeholder="00:01:00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">选择理由</label>
                        <Textarea
                          value={segment.reason}
                          onChange={(e) => handleEditSegment(index, 'reason', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setEditingIndex(null)}
                        >
                          完成
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSegment(index)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // 查看模式
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">片段 {index + 1}</Badge>
                          <span className="text-sm font-medium">
                            {secondsToTimeString(segment.start)} - {secondsToTimeString(segment.end)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (时长: {Math.floor((segment.end - segment.start) / 60)}分{(segment.end - segment.start) % 60}秒)
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{segment.reason}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  保存修改
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
