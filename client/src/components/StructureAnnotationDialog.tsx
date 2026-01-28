import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ContentSegment {
  id: number;
  speaker: string;
  topic: string;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  summary: string;
  keywords: string[];
}

interface StructureAnnotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  initialStructure?: ContentSegment[];
  onSuccess?: () => void;
}

export function StructureAnnotationDialog({
  open,
  onOpenChange,
  jobId,
  initialStructure,
  onSuccess,
}: StructureAnnotationDialogProps) {
  const [segments, setSegments] = useState<ContentSegment[]>(initialStructure || []);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (initialStructure) {
      setSegments(initialStructure);
    }
  }, [initialStructure]);

  const updateStructureMutation = trpc.video.updateContentStructure.useMutation({
    onSuccess: () => {
      toast.success("标注结果已更新");
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateStructureMutation.mutate({
      jobId,
      contentStructure: segments,
    });
  };

  const handleEditSegment = (id: number, field: keyof ContentSegment, value: any) => {
    setSegments(prev =>
      prev.map(seg =>
        seg.id === id ? { ...seg, [field]: value } : seg
      )
    );
  };

  const handleDeleteSegment = (id: number) => {
    setSegments(prev => prev.filter(seg => seg.id !== id));
  };

  const handleAddSegment = () => {
    const newId = Math.max(...segments.map(s => s.id), 0) + 1;
    setSegments(prev => [
      ...prev,
      {
        id: newId,
        speaker: "新演讲者",
        topic: "新主题",
        startTime: "00:00:00",
        endTime: "00:00:00",
        startSeconds: 0,
        endSeconds: 0,
        summary: "",
        keywords: [],
      },
    ]);
    setEditingId(newId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>内容结构标注</DialogTitle>
          <DialogDescription>
            查看和编辑AI识别的视频内容结构片段
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {segments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无标注结果，请先点击"开始标注"按钮
            </div>
          ) : (
            segments.map((segment) => (
              <div
                key={segment.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">
                    片段 {segment.id}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingId(editingId === segment.id ? null : segment.id)
                      }
                    >
                      {editingId === segment.id ? "收起" : "编辑"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteSegment(segment.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>

                {editingId === segment.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>演讲者</Label>
                        <Input
                          value={segment.speaker}
                          onChange={(e) =>
                            handleEditSegment(segment.id, "speaker", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>主题</Label>
                        <Input
                          value={segment.topic}
                          onChange={(e) =>
                            handleEditSegment(segment.id, "topic", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>开始时间</Label>
                        <Input
                          value={segment.startTime}
                          onChange={(e) =>
                            handleEditSegment(segment.id, "startTime", e.target.value)
                          }
                          placeholder="HH:MM:SS"
                        />
                      </div>
                      <div>
                        <Label>结束时间</Label>
                        <Input
                          value={segment.endTime}
                          onChange={(e) =>
                            handleEditSegment(segment.id, "endTime", e.target.value)
                          }
                          placeholder="HH:MM:SS"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>摘要</Label>
                      <Textarea
                        value={segment.summary}
                        onChange={(e) =>
                          handleEditSegment(segment.id, "summary", e.target.value)
                        }
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>关键词（逗号分隔）</Label>
                      <Input
                        value={segment.keywords.join(", ")}
                        onChange={(e) =>
                          handleEditSegment(
                            segment.id,
                            "keywords",
                            e.target.value.split(",").map(k => k.trim())
                          )
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-muted-foreground">演讲者：</span>
                        <span className="font-medium">{segment.speaker}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">主题：</span>
                        <span className="font-medium">{segment.topic}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">时间：</span>
                      <span className="font-medium">
                        {segment.startTime} - {segment.endTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">摘要：</span>
                      <span>{segment.summary}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">关键词：</span>
                      <span>{segment.keywords.join(", ")}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddSegment}
          >
            + 添加片段
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateStructureMutation.isPending}
          >
            {updateStructureMutation.isPending ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
