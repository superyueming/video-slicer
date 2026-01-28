import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Upload, Sparkles, Scissors, FileVideo, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [, setLocation] = useLocation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [requirement, setRequirement] = useState("");
  const [asrMethod, setAsrMethod] = useState<"whisper" | "aliyun">("whisper");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadVideoMutation = trpc.video.uploadVideo.useMutation();
  const createJobMutation = trpc.video.createJob.useMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith("video/"));

    if (videoFile) {
      setVideoFile(videoFile);
    } else {
      toast.error("请上传视频文件");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  }, []);

  const handleSubmit = async () => {
    if (!videoFile) {
      toast.error("请先上传视频文件");
      return;
    }

    if (!requirement.trim()) {
      toast.error("请描述您的需求");
      return;
    }

    // 文件大小检查（2GB）
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
    if (videoFile.size > MAX_FILE_SIZE) {
      toast.error(`文件大小超过限制，最大支持2GB`);
      return;
    }

    setIsUploading(true);

    try {
      // 读取文件为Base64（带进度）
      toast.info("正在读取文件...");
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 50); // 读取占总进度50%
            setUploadProgress(percentComplete);
          }
        };
        
        reader.onload = (event) => {
          console.log('FileReader onload triggered', event);
          const result = event.target?.result;
          console.log('FileReader result type:', typeof result, 'length:', result ? (result as string).length : 0);
          
          if (!result || typeof result !== 'string') {
            console.error('Invalid result:', result);
            reject(new Error('文件读取失败：result为空或类型错误'));
            return;
          }
          
          // Data URL 格式: data:video/mp4;base64,XXXXX
          const parts = result.split(',');
          if (parts.length !== 2) {
            console.error('Invalid data URL format:', result.substring(0, 100));
            reject(new Error('Data URL格式错误'));
            return;
          }
          
          const base64 = parts[1];
          if (!base64 || base64.length === 0) {
            console.error('Empty base64 data');
            reject(new Error('Base64数据为空'));
            return;
          }
          
          console.log('Base64 data length:', base64.length);
          setUploadProgress(50);
          resolve(base64);
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('文件读取错误'));
        };
        
        try {
          reader.readAsDataURL(videoFile);
        } catch (error) {
          reject(error);
        }
      });

      // 上传视频
      toast.info("正在上传视频...");
      const uploadResult = await uploadVideoMutation.mutateAsync({
        filename: videoFile.name,
        contentType: videoFile.type,
        fileSize: videoFile.size,
        base64Data,
      });
      
      setUploadProgress(100);

      // 4. 创建处理任务
      toast.info("正在创建处理任务...");
      const jobResult = await createJobMutation.mutateAsync({
        videoUrl: uploadResult.url,
        videoKey: uploadResult.key,
        filename: uploadResult.filename,
        fileSize: uploadResult.fileSize,
        userRequirement: requirement,
        asrMethod,
      });

      toast.success("任务创建成功！");
      setLocation(`/job/${jobResult.jobId}`);
    } catch (error: any) {
      console.error("提交失败:", error);
      
      // 更好的错误提示
      let errorMessage = "提交失败，请重试";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error instanceof ProgressEvent) {
        errorMessage = "网络连接失败，请检查网络后重试";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI驱动的智能剪辑</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI视频智能切片
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            自动识别演讲内容，智能选择精彩片段，一键生成带字幕的短视频
          </p>

          <div className="flex flex-wrap gap-8 justify-center text-sm text-muted-foreground">
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
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center transition-all
                  ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                  ${videoFile ? "bg-accent/30" : ""}
                `}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                
                {videoFile ? (
                  <div className="space-y-2">
                    <FileVideo className="w-12 h-12 mx-auto text-primary" />
                    <p className="font-medium">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                      }}
                      disabled={isUploading}
                    >
                      重新选择
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-lg font-medium">拖拽视频文件到这里</p>
                    <p className="text-sm text-muted-foreground">或点击选择文件</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      支持 MP4, AVI, MOV 等常见格式
                    </p>
                  </div>
                )}
              </div>
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
                disabled={isUploading}
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
                disabled={isUploading}
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

            {/* Upload Progress */}
            {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">上传进度</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full text-lg h-14"
              onClick={handleSubmit}
              disabled={isUploading || !videoFile || !requirement.trim()}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  {uploadProgress > 0 && uploadProgress < 100 ? `上传中 ${uploadProgress}%` : '处理中...'}
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
