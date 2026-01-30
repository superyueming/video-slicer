# 本地视频处理方案设计

## 问题分析

### 当前架构的问题

**现有流程**：
```
用户电脑                     云端服务器
   |                            |
   | 1. 选择视频文件（2GB）      |
   |--------------------------->|
   |    上传整个视频             |
   |                            | 2. 提取音频
   |                            | 3. AI分析音频
   |<---------------------------|
   |    返回切片时间点           |
   | 4. 本地剪辑视频             |
```

**问题**：
- ❌ 上传2GB视频需要很长时间（10Mbps网速需要约27分钟）
- ❌ 云端存储成本高
- ❌ 云端带宽消耗大
- ❌ 用户体验差（等待时间长）

### 优化后的架构

**新流程**：
```
用户电脑                     云端服务器
   |                            |
   | 1. 选择视频文件（2GB）      |
   | 2. 本地提取音频（5MB）      |
   |--------------------------->|
   |    只上传音频文件           |
   |                            | 3. AI分析音频
   |<---------------------------|
   |    返回切片时间点           |
   | 4. 本地剪辑视频             |
   | 5. (可选)上传剪辑片段       |
```

**优势**：
- ✅ 上传5MB音频只需约4秒（10Mbps网速）
- ✅ 节省云端存储成本（5MB vs 2GB = 400倍）
- ✅ 节省云端带宽（5MB vs 2GB = 400倍）
- ✅ 用户体验好（等待时间短）
- ✅ 视频文件不离开本地（隐私保护）

## 技术实现

### 已有的本地处理能力

桌面应用已经具备以下能力：

1. **音频提取** (`desktop/src/processor/audioExtractor.ts`)
   ```typescript
   extractAudio(videoPath, outputPath, options?)
   ```

2. **视频剪辑** (`desktop/src/processor/videoClipper.ts`)
   ```typescript
   clipVideo(options: ClipVideoOptions)
   clipVideoBatch(videoPath, segments, outputDir?)
   ```

3. **视频拼接** (`desktop/src/processor/videoConcatenator.ts`)
   ```typescript
   concatenateVideos(videoPaths, outputPath, options?)
   ```

### 需要实现的功能

#### 1. 本地处理工作流

创建一个统一的本地处理工作流：

```typescript
// desktop/src/processor/localWorkflow.ts

export interface LocalProcessingResult {
  audioPath: string;
  audioSize: number;
  videoPath: string;
  videoSize: number;
  videoDuration: number;
}

/**
 * 本地处理工作流
 * 1. 提取音频
 * 2. 返回音频路径供上传
 */
export async function processVideoLocally(
  videoPath: string,
  onProgress?: (step: string, progress: number) => void
): Promise<LocalProcessingResult> {
  // 1. 检查视频文件
  // 2. 提取音频
  // 3. 获取视频信息
  // 4. 返回结果
}
```

#### 2. 仅上传音频的API

修改服务器端API，支持只上传音频：

```typescript
// server/routers.ts

export const videoRouter = router({
  // 新增：只上传音频用于分析
  uploadAudioForAnalysis: protectedProcedure
    .input(z.object({
      audioData: z.string(), // base64编码的音频
      originalVideoFilename: z.string(),
      videoDuration: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. 保存音频到S3
      // 2. 创建分析任务
      // 3. 返回任务ID
    }),
  
  // 现有的上传整个视频的API保留（向后兼容）
  uploadVideo: protectedProcedure
    .input(...)
    .mutation(...),
});
```

#### 3. 本地剪辑结果管理

```typescript
// desktop/src/processor/clipManager.ts

export interface ClipResult {
  clipPath: string;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
}

/**
 * 管理本地剪辑结果
 */
export class ClipManager {
  // 保存剪辑片段
  async saveClip(videoPath: string, segment: ClipSegment): Promise<ClipResult>
  
  // 获取所有剪辑片段
  async getAllClips(videoPath: string): Promise<ClipResult[]>
  
  // 导出剪辑片段
  async exportClip(clipPath: string, exportPath: string): Promise<void>
  
  // 上传剪辑片段到云端（可选）
  async uploadClip(clipPath: string): Promise<string>
}
```

## 实现步骤

### 阶段1：本地音频提取和上传

**目标**：实现本地提取音频并只上传音频

**步骤**：
1. ✅ 创建 `localWorkflow.ts` - 本地处理工作流
2. ✅ 修改桌面应用UI - 添加"本地处理模式"选项
3. ✅ 创建新的API端点 - `uploadAudioForAnalysis`
4. ✅ 测试音频提取和上传

**预期结果**：
- 用户选择视频后，自动在本地提取音频
- 只上传音频文件到云端
- 上传时间从27分钟减少到4秒

### 阶段2：本地视频剪辑

**目标**：接收AI分析结果后，在本地剪辑视频

**步骤**：
1. ✅ 创建 `clipManager.ts` - 剪辑结果管理
2. ✅ 修改桌面应用UI - 显示剪辑进度
3. ✅ 实现批量剪辑功能
4. ✅ 测试剪辑功能

**预期结果**：
- 收到AI分析结果后，自动在本地剪辑视频
- 显示剪辑进度
- 生成的剪辑片段保存在本地

### 阶段3：可选的云端上传

**目标**：用户可以选择性地上传剪辑片段到云端

**步骤**：
1. ✅ 添加"上传到云端"按钮
2. ✅ 实现选择性上传功能
3. ✅ 显示上传进度
4. ✅ 测试上传功能

**预期结果**：
- 用户可以选择上传哪些剪辑片段
- 只上传需要的片段（通常几百MB）
- 不上传原始视频（几GB）

## 数据流对比

### 现有数据流

```
步骤                  数据量      时间（10Mbps）
1. 上传视频           2GB         ~27分钟
2. 云端提取音频       0           ~1分钟
3. 云端AI分析         0           ~2分钟
4. 下载分析结果       1KB         <1秒
5. 本地剪辑           0           ~2分钟
-------------------------------------------
总计                  2GB         ~32分钟
```

### 优化后数据流

```
步骤                  数据量      时间（10Mbps）
1. 本地提取音频       0           ~30秒
2. 上传音频           5MB         ~4秒
3. 云端AI分析         0           ~2分钟
4. 下载分析结果       1KB         <1秒
5. 本地剪辑           0           ~2分钟
6. (可选)上传片段     100MB       ~1分钟
-------------------------------------------
总计                  5-105MB     ~5-10分钟
```

**节省**：
- 时间：从32分钟减少到5-10分钟（节省70-85%）
- 上传数据：从2GB减少到5-105MB（节省95-99.75%）
- 云端存储：从2GB减少到5MB（节省99.75%）

## 用户体验改进

### 现有体验

```
[用户选择视频] → [漫长的上传等待...] → [AI分析] → [剪辑]
                  ^^^^^^^^^^^^^^^^^^^^
                  用户体验差的部分
```

### 优化后体验

```
[用户选择视频] → [快速提取音频] → [快速上传] → [AI分析] → [本地剪辑]
                  ^^^^^^^^^^^^^^   ^^^^^^^^^^
                  几乎无感知        4秒完成
```

## 成本分析

### 云端成本

假设每天处理100个视频：

**现有方案**：
- 存储：100 × 2GB = 200GB/天
- 带宽：100 × 2GB = 200GB/天
- 月成本：约 $100-200（存储+带宽）

**优化方案**：
- 存储：100 × 5MB = 500MB/天
- 带宽：100 × 5MB = 500MB/天
- 月成本：约 $0.5-1（存储+带宽）

**节省**：99%的云端成本

### 用户成本

**现有方案**：
- 上传流量：2GB/视频
- 移动网络用户：约$2-5/GB = $4-10/视频

**优化方案**：
- 上传流量：5MB/视频
- 移动网络用户：约$0.01-0.025/视频

**节省**：99.75%的用户流量成本

## 隐私保护

### 现有方案
- ❌ 完整视频上传到云端
- ❌ 视频内容可能包含敏感信息
- ❌ 用户担心隐私泄露

### 优化方案
- ✅ 视频文件不离开本地
- ✅ 只上传音频（通常不包含敏感画面）
- ✅ 用户更放心使用

## 技术挑战

### 1. FFmpeg依赖

**问题**：桌面应用需要打包FFmpeg

**解决方案**：
- ✅ 已在 `.github/workflows/build-desktop.yml` 中配置
- ✅ 自动下载并打包FFmpeg
- ✅ 跨平台支持（Windows/Mac/Linux）

### 2. 音频格式

**问题**：不同视频格式的音频编码不同

**解决方案**：
- 统一转换为 WAV 或 MP3 格式
- 使用 FFmpeg 自动处理
- 服务器端支持多种音频格式

### 3. 进度反馈

**问题**：本地处理需要显示进度

**解决方案**：
- FFmpeg 提供进度回调
- 实时更新UI进度条
- 显示当前处理步骤

### 4. 错误处理

**问题**：本地处理可能失败

**解决方案**：
- 详细的错误日志
- 友好的错误提示
- 降级方案（如果本地处理失败，回退到上传整个视频）

## 兼容性

### 向后兼容

保留现有的"上传整个视频"功能：
- 老用户可以继续使用
- 作为降级方案
- 某些场景可能需要（如云端剪辑）

### 用户选择

提供两种模式：
1. **本地处理模式**（推荐）
   - 本地提取音频
   - 只上传音频
   - 本地剪辑

2. **云端处理模式**（传统）
   - 上传整个视频
   - 云端提取音频
   - 云端剪辑

## 实现优先级

### P0（必须实现）
- [x] 本地音频提取
- [ ] 只上传音频的API
- [ ] 本地视频剪辑
- [ ] 基本的进度显示

### P1（重要）
- [ ] 剪辑结果管理
- [ ] 详细的进度显示
- [ ] 错误处理和重试
- [ ] 用户模式选择

### P2（可选）
- [ ] 选择性上传剪辑片段
- [ ] 批量处理多个视频
- [ ] 高级剪辑选项
- [ ] 性能优化

## 测试计划

### 单元测试
- [ ] 音频提取功能
- [ ] 视频剪辑功能
- [ ] 文件上传功能
- [ ] 进度回调功能

### 集成测试
- [ ] 完整的本地处理流程
- [ ] API交互测试
- [ ] 错误场景测试

### 性能测试
- [ ] 不同大小视频的处理时间
- [ ] 内存使用情况
- [ ] 并发处理能力

### 用户测试
- [ ] 用户体验测试
- [ ] 界面友好性测试
- [ ] 错误提示清晰度测试

## 文档

需要更新的文档：
- [ ] 用户使用指南
- [ ] API文档
- [ ] 开发者文档
- [ ] 故障排查指南

## 总结

本地处理方案可以：
- ✅ 节省70-85%的时间
- ✅ 节省95-99.75%的上传数据
- ✅ 节省99%的云端成本
- ✅ 节省99.75%的用户流量成本
- ✅ 提供更好的隐私保护
- ✅ 改善用户体验

**下一步**：开始实现阶段1 - 本地音频提取和上传
