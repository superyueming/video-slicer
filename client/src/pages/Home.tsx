import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Scissors, FileVideo, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChunkedUploader } from "@/components/ChunkedUploader";

export default function Home() {
  const [, setLocation] = useLocation();
  const [uploadedVideo, setUploadedVideo] = useState<{ url: string; key: string; filename: string } | null>(null);
  const [requirement, setRequirement] = useState("");
  const [asrMethod, setAsrMethod] = useState<"whisper" | "aliyun">("whisper");
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  const createJobMutation = trpc.video.createJob.useMutation();

  const handleUploadComplete = useCallback((result: { url: string; key: string; filename: string }) => {
    setUploadedVideo(result);
    toast.success("视频上传成功！");
  }, []);

  const handleUploadError = useCallback((error: Error) => {
    toast.error(`上传失败：${error.message}`);
  }, []);

  const handleSubmit = async () => {
    if (!uploadedVideo) {
      toast.error("请先上传视频文件");
      return;
    }

    if (!requirement.trim()) {
      toast.error("请描述您的需求");
      return;
    }

    setIsCreatingJob(true);

    try {
      toast.info("正在创建任务...");

      const job = await createJobMutation.mutateAsync({
        videoUrl: uploadedVideo.url,
        videoKey: uploadedVideo.key,
        filename: uploadedVideo.filename,
        fileSize: 0, // Will be updated by backend
        userRequirement: requirement.trim(),
        asrMethod,
      });

      toast.success("任务创建成功！正在处理中...");
      setLocation(`/job/${job.jobId}`);
    } catch (error) {
      console.error("[Submit] Error:", error);
      toast.error(error instanceof Error ? error.message : "创建任务失败");
    } finally {
      setIsCreatingJob(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent px-4">
            AI视频智能切片工具
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            自动识别演讲内容，智能选择精彩片段，一键生成带字幕的短视频
          </p>

          <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 justify-center text-xs sm:text-sm text-muted-foreground px-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>自动语音识别</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI内容分析</span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" />
              <span>智能剪辑拼接</span>
            </div>
            <div className="flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-primary" />
              <span>自动字幕生成</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <Card className="max-w-3xl mx-auto p-8 glass-effect">
          <div className="space-y-8">
            {/* Upload Area */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">上传视频</Label>
              <ChunkedUploader
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                accept="video/*"
                maxSize={2 * 1024 * 1024 * 1024} // 2GB
              />
              {uploadedVideo && (
                <div className="mt-4 p-4 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    ✓ 已上传: {uploadedVideo.filename}
                  </p>
                </div>
              )}
            </div>

            {/* Requirement Input */}
            <div>
              <Label htmlFor="requirement" className="text-lg font-semibold mb-4 block">
                您的需求
              </Label>
              <Textarea
                id="requirement"
                placeholder="例如：提取关于AI技术的精彩片段，按照逻辑顺序排列"
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                className="min-h-[120px] resize-none"
                disabled={isCreatingJob}
              />
              <p className="text-sm text-muted-foreground mt-2">
                描述您想要的视频片段类型，AI会根据您的需求智能选择内容
              </p>
            </div>

            {/* ASR Method Selection */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">语音识别方式</Label>
              <RadioGroup
                value={asrMethod}
                onValueChange={(value) => setAsrMethod(value as "whisper" | "aliyun")}
                disabled={isCreatingJob}
              >
                <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="whisper" id="whisper" />
                  <Label htmlFor="whisper" className="flex-1 cursor-pointer">
                    <div className="font-medium">Whisper（推荐）</div>
                    <div className="text-sm text-muted-foreground">
                      免费使用，准确度高，适合测试和偶尔使用
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="aliyun" id="aliyun" />
                  <Label htmlFor="aliyun" className="flex-1 cursor-pointer">
                    <div className="font-medium">阿里云ASR</div>
                    <div className="text-sm text-muted-foreground">
                      处理速度快，对中文支持更好，适合批量处理
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full text-lg h-14"
              onClick={handleSubmit}
              disabled={isCreatingJob || !uploadedVideo || !requirement.trim()}
            >
              {isCreatingJob ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  创建任务中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  开始智能剪辑
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          <Card className="p-6 glass-effect">
            <Zap className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">快速处理</h3>
            <p className="text-sm text-muted-foreground">
              自动提取音频、识别内容、分析片段，全程自动化处理
            </p>
          </Card>
          
          <Card className="p-6 glass-effect">
            <Sparkles className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI智能分析</h3>
            <p className="text-sm text-muted-foreground">
              使用DeepSeek AI理解您的需求，精准选择最相关的内容片段
            </p>
          </Card>
          
          <Card className="p-6 glass-effect">
            <FileVideo className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">一键生成</h3>
            <p className="text-sm text-muted-foreground">
              自动剪辑、拼接、添加字幕，生成可直接分发的短视频
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
