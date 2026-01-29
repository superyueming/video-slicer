# 桌面应用本地处理架构设计

## 概述

将视频处理从云端迁移到本地，减少服务器负担，提升用户体验，保护隐私。

---

## 架构对比

### 当前云端处理流程
```
用户 → 上传视频(GB级) → 服务器 → 提取音频 → 转录 → AI分析 → 剪辑拼接 → 下载结果
问题：上传慢、服务器成本高、隐私风险
```

### 新的本地处理流程
```
用户 → 选择本地视频 → 本地提取音频 → 上传音频(MB级) → 服务器转录+AI分析 → 
下载分析结果 → 本地剪辑拼接 → 预览/导出
优势：无需上传大文件、处理快、隐私保护、服务器成本低
```

---

## 技术方案

### 1. FFmpeg集成

**打包方式：**
- Windows: `ffmpeg.exe` + `ffprobe.exe`
- Mac: `ffmpeg` + `ffprobe` (通用二进制)
- Linux: `ffmpeg` + `ffprobe` (静态编译)

**存放位置：**
```
desktop/
  resources/
    ffmpeg/
      win/
        ffmpeg.exe
        ffprobe.exe
      mac/
        ffmpeg
        ffprobe
      linux/
        ffmpeg
        ffprobe
```

**electron-builder配置：**
```json
{
  "extraResources": [
    {
      "from": "resources/ffmpeg/${os}",
      "to": "ffmpeg",
      "filter": ["**/*"]
    }
  ]
}
```

**运行时路径：**
```typescript
import { app } from 'electron';
import path from 'path';

const ffmpegPath = app.isPackaged
  ? path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg')
  : path.join(__dirname, '../resources/ffmpeg', process.platform === 'win32' ? 'win/ffmpeg.exe' : 'mac/ffmpeg');
```

---

### 2. 本地处理模块

**模块结构：**
```
desktop/src/
  processor/
    ffmpeg.ts          # FFmpeg wrapper
    audioExtractor.ts  # 音频提取
    videoClipper.ts    # 视频剪辑
    videoConcatenator.ts # 视频拼接
    index.ts           # 统一导出
```

**核心功能：**

#### 2.1 音频提取
```typescript
// desktop/src/processor/audioExtractor.ts
export async function extractAudio(
  videoPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  // 使用FFmpeg提取音频为WAV格式
  // ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav
}
```

#### 2.2 视频剪辑
```typescript
// desktop/src/processor/videoClipper.ts
export async function clipVideo(
  videoPath: string,
  startTime: number,
  endTime: number,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  // 使用FFmpeg剪辑视频
  // ffmpeg -i input.mp4 -ss START -to END -c copy output.mp4
}
```

#### 2.3 视频拼接
```typescript
// desktop/src/processor/videoConcatenator.ts
export async function concatenateVideos(
  videoPaths: string[],
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  // 使用FFmpeg拼接视频
  // ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4
}
```

---

### 3. 工作流程设计

#### 模式1：完全本地处理（推荐）
```
1. 用户选择本地视频文件
2. 本地提取音频（extractAudio）
3. 上传音频到服务器（~10MB）
4. 服务器转录音频（Whisper API）
5. 服务器AI分析内容（DeepSeek API）
6. 下载分析结果（JSON，~100KB）
7. 本地根据分析结果剪辑视频（clipVideo）
8. 本地拼接视频片段（concatenateVideos）
9. 预览/导出最终视频
```

#### 模式2：混合处理（兼容模式）
```
1. 用户上传视频到服务器（使用断点续传）
2. 服务器处理（保留原有逻辑）
3. 下载最终结果
```

---

### 4. API设计

#### 4.1 本地模式新增API

**上传音频文件：**
```typescript
// POST /api/trpc/job.uploadAudio
{
  audioFile: File,
  filename: string,
  duration: number
}
→ { audioUrl: string, audioKey: string }
```

**创建本地处理任务：**
```typescript
// POST /api/trpc/job.createLocalJob
{
  audioUrl: string,
  audioKey: string,
  filename: string,
  duration: number,
  userRequirement: string,
  asrMethod: 'whisper' | 'aliyun'
}
→ { jobId: number }
```

**下载分析结果：**
```typescript
// GET /api/trpc/job.getAnalysisResult
{ jobId: number }
→ {
  segments: Array<{
    index: number,
    title: string,
    startTime: number,
    endTime: number,
    reason: string
  }>
}
```

#### 4.2 保留原有API（云端模式）
- `job.create` - 创建云端处理任务
- `job.getStatus` - 查询任务状态
- 其他现有API保持不变

---

### 5. 用户界面设计

#### 5.1 设置页面
```
处理模式选择：
○ 本地处理（推荐）- 快速、隐私、节省流量
○ 云端处理 - 兼容模式，适合低配置电脑
```

#### 5.2 本地处理界面
```
[选择视频文件]
↓
正在提取音频... 30%
↓
正在上传音频... 50%
↓
正在转录和分析... 70%
↓
正在剪辑视频... 90%
↓
完成！[预览] [导出]
```

---

## 实施计划

### 第一阶段：FFmpeg集成（1-2天）
1. 下载FFmpeg静态编译版本
2. 配置electron-builder打包
3. 创建FFmpeg wrapper
4. 测试基本功能

### 第二阶段：本地处理模块（2-3天）
1. 实现音频提取
2. 实现视频剪辑
3. 实现视频拼接
4. 添加进度回调

### 第三阶段：API和UI（2-3天）
1. 添加本地模式API
2. 创建设置页面
3. 实现本地处理UI
4. 集成完整流程

### 第四阶段：测试和优化（1-2天）
1. 测试不同视频格式
2. 优化FFmpeg参数
3. 性能测试和优化
4. 用户体验优化

---

## 技术难点和解决方案

### 1. FFmpeg路径问题
**问题：** 开发环境和打包后的FFmpeg路径不同
**解决：** 使用`app.isPackaged`判断，动态获取路径

### 2. 进度回调
**问题：** FFmpeg输出解析复杂
**解决：** 解析FFmpeg的stderr输出，提取进度信息

### 3. 跨平台兼容性
**问题：** 不同平台FFmpeg命令可能有差异
**解决：** 使用跨平台的命令参数，测试覆盖三大平台

### 4. 大文件处理
**问题：** 大视频文件可能导致内存溢出
**解决：** 使用流式处理，不将整个文件加载到内存

---

## 性能对比

### 云端处理（当前）
- 上传1GB视频：~10分钟（100Mbps网络）
- 服务器处理：~5分钟
- 下载结果：~2分钟
- **总计：~17分钟**

### 本地处理（新方案）
- 提取音频：~30秒
- 上传音频10MB：~5秒
- 服务器转录+分析：~3分钟
- 下载分析结果：~1秒
- 本地剪辑拼接：~1分钟
- **总计：~5分钟**

**性能提升：70%**

---

## 成本对比

### 云端处理
- 带宽成本：$0.10/GB × 2（上传+下载）= $0.20/任务
- 存储成本：$0.02/GB/月
- 计算成本：$0.05/任务
- **总计：~$0.27/任务**

### 本地处理
- 带宽成本：$0.10/GB × 0.01（只上传音频）= $0.001/任务
- 存储成本：$0.02/GB/月 × 0.01 = $0.0002/月
- 计算成本：$0.02/任务（只转录+AI）
- **总计：~$0.02/任务**

**成本降低：92%**

---

## 下一步

1. 下载FFmpeg静态编译版本
2. 创建`desktop/src/processor`目录
3. 实现FFmpeg wrapper
4. 测试音频提取功能
