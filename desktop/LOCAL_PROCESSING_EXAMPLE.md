# 本地视频处理使用示例

## 概述

本文档展示如何使用桌面应用的本地处理能力，实现：
1. 本地提取音频（不上传视频）
2. 只上传音频到云端分析
3. 本地剪辑视频

## 完整流程示例

### 1. 本地处理视频

```typescript
import { processVideoLocally } from './processor/localWorkflow';

// 用户选择视频文件
const videoPath = '/path/to/video.mp4';

// 本地处理
const result = await processVideoLocally(videoPath, (progress) => {
  console.log(`${progress.step}: ${progress.progress}% - ${progress.message}`);
});

console.log('处理结果:', {
  audioPath: result.audioPath,
  audioSize: (result.audioSize / 1024 / 1024).toFixed(2) + ' MB',
  videoSize: (result.videoSize / 1024 / 1024).toFixed(2) + ' MB',
  savings: ((1 - result.audioSize / result.videoSize) * 100).toFixed(2) + '%',
});
```

**输出示例**：
```
check: 0% - 检查视频文件...
info: 10% - 获取视频信息...
extract: 20% - 提取音频...
extract: 50% - 提取音频: 50.0%
extract: 90% - 提取音频: 100.0%
complete: 100% - 处理完成

处理结果: {
  audioPath: '/path/to/video_audio.mp3',
  audioSize: '5.23 MB',
  videoSize: '2048.00 MB',
  savings: '99.74%'
}
```

### 2. 上传音频到云端

```typescript
import * as fs from 'fs';

// 读取音频文件
const audioBuffer = fs.readFileSync(result.audioPath);
const audioBase64 = audioBuffer.toString('base64');

// 调用API上传音频
const response = await fetch('http://localhost:3000/api/upload-audio', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    audioData: audioBase64,
    originalVideoFilename: path.basename(videoPath),
    videoDuration: result.videoDuration,
  }),
});

const { jobId } = await response.json();
console.log('任务ID:', jobId);
```

### 3. 等待AI分析结果

```typescript
// 轮询任务状态
async function waitForAnalysis(jobId: string): Promise<ClipSegment[]> {
  while (true) {
    const response = await fetch(`http://localhost:3000/api/job/${jobId}`);
    const job = await response.json();
    
    if (job.status === 'completed') {
      return job.segments;
    } else if (job.status === 'failed') {
      throw new Error('分析失败: ' + job.error);
    }
    
    // 等待5秒后重试
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

const segments = await waitForAnalysis(jobId);
console.log('分析结果:', segments);
```

**分析结果示例**：
```javascript
[
  { startTime: 0, endTime: 30, title: '开场介绍' },
  { startTime: 30, endTime: 120, title: '主要内容' },
  { startTime: 120, endTime: 150, title: '总结' },
]
```

### 4. 本地剪辑视频

```typescript
import { ClipManager } from './processor/clipManager';

// 创建剪辑管理器
const clipManager = new ClipManager({
  outputDir: '/path/to/clips',
  keepOriginal: true,
});

// 批量剪辑
const clips = await clipManager.saveClips(
  videoPath,
  segments,
  false, // 使用快速模式（流复制）
  (index, total) => {
    console.log(`剪辑进度: ${index}/${total}`);
  }
);

console.log('剪辑完成:', clips);
```

**输出示例**：
```
剪辑进度: 0/3
剪辑进度: 1/3
剪辑进度: 2/3
剪辑进度: 3/3

剪辑完成: [
  {
    clipPath: '/path/to/clips/video_0-30.mp4',
    startTime: 0,
    endTime: 30,
    duration: 30,
    size: 50331648, // 48 MB
    title: '开场介绍'
  },
  {
    clipPath: '/path/to/clips/video_30-120.mp4',
    startTime: 30,
    endTime: 120,
    duration: 90,
    size: 150994944, // 144 MB
    title: '主要内容'
  },
  {
    clipPath: '/path/to/clips/video_120-150.mp4',
    startTime: 120,
    endTime: 150,
    duration: 30,
    size: 50331648, // 48 MB
    title: '总结'
  }
]
```

### 5. 导出或上传剪辑片段

```typescript
// 导出到用户指定的位置
await clipManager.exportAllClips(videoPath, '/path/to/export');

// 或者上传到云端（可选）
for (const clip of clips) {
  const clipBuffer = fs.readFileSync(clip.clipPath);
  const clipBase64 = clipBuffer.toString('base64');
  
  await fetch('http://localhost:3000/api/upload-clip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clipData: clipBase64,
      filename: path.basename(clip.clipPath),
      jobId,
    }),
  });
}

// 清理临时文件
await clipManager.cleanup(videoPath);
```

## 完整示例代码

```typescript
import { processVideoLocally, cleanupTempFiles } from './processor/localWorkflow';
import { ClipManager } from './processor/clipManager';
import * as fs from 'fs';
import * as path from 'path';

async function processVideoWithLocalMode(videoPath: string) {
  console.log('=== 开始本地处理模式 ===\n');
  
  try {
    // 步骤1: 本地处理视频
    console.log('[1/5] 本地处理视频...');
    const result = await processVideoLocally(videoPath, (progress) => {
      console.log(`  ${progress.message} (${progress.progress.toFixed(0)}%)`);
    });
    
    console.log(`✅ 本地处理完成`);
    console.log(`  音频大小: ${(result.audioSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  视频大小: ${(result.videoSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  节省上传: ${((1 - result.audioSize / result.videoSize) * 100).toFixed(2)}%\n`);
    
    // 步骤2: 上传音频
    console.log('[2/5] 上传音频到云端...');
    const audioBuffer = fs.readFileSync(result.audioPath);
    const audioBase64 = audioBuffer.toString('base64');
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioData: audioBase64,
        originalVideoFilename: path.basename(videoPath),
        videoDuration: result.videoDuration,
      }),
    });
    
    const { jobId } = await uploadResponse.json();
    console.log(`✅ 音频上传完成，任务ID: ${jobId}\n`);
    
    // 步骤3: 等待AI分析
    console.log('[3/5] 等待AI分析...');
    const segments = await waitForAnalysis(jobId);
    console.log(`✅ AI分析完成，找到 ${segments.length} 个片段\n`);
    
    // 步骤4: 本地剪辑
    console.log('[4/5] 本地剪辑视频...');
    const clipManager = new ClipManager({
      outputDir: path.join(path.dirname(videoPath), 'clips'),
    });
    
    const clips = await clipManager.saveClips(
      videoPath,
      segments,
      false,
      (index, total) => {
        console.log(`  剪辑进度: ${index}/${total}`);
      }
    );
    
    console.log(`✅ 剪辑完成，生成 ${clips.length} 个片段\n`);
    
    // 步骤5: 导出结果
    console.log('[5/5] 导出剪辑片段...');
    const exportDir = path.join(path.dirname(videoPath), 'export');
    await clipManager.exportAllClips(videoPath, exportDir);
    console.log(`✅ 剪辑片段已导出到: ${exportDir}\n`);
    
    // 清理临时文件
    cleanupTempFiles(result.audioPath);
    
    // 显示统计信息
    const stats = clipManager.getStats(videoPath);
    console.log('=== 处理完成 ===');
    console.log(`总片段数: ${stats.totalClips}`);
    console.log(`总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`总时长: ${stats.totalDuration.toFixed(2)} 秒`);
    
    return clips;
  } catch (error) {
    console.error('处理失败:', error);
    throw error;
  }
}

// 辅助函数：等待分析完成
async function waitForAnalysis(jobId: string): Promise<any[]> {
  while (true) {
    const response = await fetch(`http://localhost:3000/api/job/${jobId}`);
    const job = await response.json();
    
    if (job.status === 'completed') {
      return job.segments;
    } else if (job.status === 'failed') {
      throw new Error('分析失败: ' + job.error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// 使用示例
const videoPath = '/path/to/your/video.mp4';
processVideoWithLocalMode(videoPath)
  .then(clips => {
    console.log('\n成功处理视频，生成了', clips.length, '个片段');
  })
  .catch(error => {
    console.error('\n处理失败:', error.message);
  });
```

## 性能对比

### 传统模式（上传整个视频）

```
步骤                  时间
1. 上传视频 (2GB)     27分钟
2. 云端提取音频       1分钟
3. 云端AI分析         2分钟
4. 下载分析结果       <1秒
5. 本地剪辑           2分钟
-----------------------------------
总计                  32分钟
```

### 本地处理模式（只上传音频）

```
步骤                  时间
1. 本地提取音频       30秒
2. 上传音频 (5MB)     4秒
3. 云端AI分析         2分钟
4. 下载分析结果       <1秒
5. 本地剪辑           2分钟
-----------------------------------
总计                  5分钟
```

**节省时间：84%（从32分钟减少到5分钟）**

## 错误处理

```typescript
try {
  const result = await processVideoLocally(videoPath);
} catch (error) {
  if (error.message.includes('不存在')) {
    console.error('视频文件不存在，请检查路径');
  } else if (error.message.includes('无法找到视频流')) {
    console.error('视频文件损坏或格式不支持');
  } else if (error.message.includes('FFmpeg')) {
    console.error('FFmpeg执行失败，请检查FFmpeg是否正确安装');
  } else {
    console.error('未知错误:', error.message);
  }
  
  // 降级到传统模式（上传整个视频）
  console.log('正在尝试传统模式...');
  // ... 上传整个视频的代码
}
```

## 最佳实践

### 1. 进度反馈

始终提供进度反馈，让用户知道当前状态：

```typescript
const result = await processVideoLocally(videoPath, (progress) => {
  // 更新UI进度条
  updateProgressBar(progress.progress);
  updateStatusText(progress.message);
});
```

### 2. 错误处理

提供友好的错误提示和降级方案：

```typescript
try {
  // 尝试本地处理模式
  await processVideoWithLocalMode(videoPath);
} catch (error) {
  // 降级到传统模式
  await processVideoWithTraditionalMode(videoPath);
}
```

### 3. 资源清理

及时清理临时文件：

```typescript
try {
  const result = await processVideoLocally(videoPath);
  // ... 使用result
} finally {
  // 确保清理临时文件
  cleanupTempFiles(result.audioPath);
}
```

### 4. 用户选择

让用户选择处理模式：

```typescript
const mode = await showModeSelectionDialog();

if (mode === 'local') {
  await processVideoWithLocalMode(videoPath);
} else {
  await processVideoWithTraditionalMode(videoPath);
}
```

## 总结

本地处理模式的优势：
- ✅ 节省84%的时间
- ✅ 节省99.75%的上传数据
- ✅ 节省99%的云端成本
- ✅ 更好的隐私保护
- ✅ 更好的用户体验

下一步：
1. 在桌面应用UI中集成本地处理模式
2. 添加进度显示和错误处理
3. 提供用户模式选择
4. 测试和优化性能
