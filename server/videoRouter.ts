import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { protectedProcedure, router, publicProcedure } from './_core/trpc';
import { createVideoJob, getUserVideoJobs, getVideoJob, updateJobProgress, markJobCompleted, markJobFailed } from './videoDb';
import { getDb } from './db';
import { videoJobs } from '../drizzle/schema';
import { storagePut } from './storageAdapter';
import { getPresignedUploadUrl, confirmUpload } from './storagePresigned';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { nanoid } from 'nanoid';
import { 
  extractAudio, 
  transcribeAudio, 
  analyzeContent, 
  cutVideoSegment, 
  concatenateVideos, 
  generateSRT, 
  burnSubtitles, 
  uploadToS3,
  cleanupTempFiles 
} from './videoService';

export const videoRouter = router({
  /**
   * 上传视频文件
   */
  uploadVideo: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
      fileSize: z.number(),
      base64Data: z.string(), // Base64编码的文件数据
    }))
    .mutation(async ({ input, ctx }) => {
      const { filename, contentType, fileSize, base64Data } = input;
      
      // 文件大小限制（2GB，考虑Base64编码开销）
      const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error(`文件大小超过限制（最大2GB）`);
      }
      
      // 解码Base64数据
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // 生成S3存储键
      const timestamp = Date.now();
      const randomId = nanoid(10);
      const fileKey = `videos/${ctx.user.id}/${timestamp}-${randomId}-${filename}`;
      
      // 上传到S3
      const { url } = await storagePut(fileKey, fileBuffer, contentType);
      
      return {
        url,
        key: fileKey,
        filename,
        fileSize,
      };
    }),
  
  /**
   * 创建视频处理任务
   */
  createJob: protectedProcedure
    .input(z.object({
      videoUrl: z.string(),
      videoKey: z.string(),
      filename: z.string(),
      fileSize: z.number(),
      userRequirement: z.string(),
      asrMethod: z.enum(['whisper', 'aliyun']).default('whisper'),
    }))
    .mutation(async ({ input, ctx }) => {
      const jobId = await createVideoJob({
        userId: ctx.user.id,
        originalVideoUrl: input.videoUrl,
        originalVideoKey: input.videoKey,
        originalFilename: input.filename,
        fileSize: input.fileSize,
        userRequirement: input.userRequirement,
        asrMethod: input.asrMethod,
        status: 'completed', // 上传完成，等待用户手动触发分步处理
        progress: 0,
      });
      
      // 不再自动处理，由用户在任务详情页手动触发每个步骤
      
      return { jobId };
    }),
  
  /**
   * 获取任务状态
   */
  getJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .query(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      return job;
    }),
  
  /**
   * 获取用户的所有任务
   */
  listJobs: protectedProcedure
    .query(async ({ ctx }) => {
      return await getUserVideoJobs(ctx.user.id);
    }),
  
  /**
   * 重启失败的任务
   */
  retryJob: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      if (job.status !== 'failed') {
        throw new Error('Only failed jobs can be retried');
      }
      
      // 重置任务状态
      await updateJobProgress(input.jobId, 0, '准备重新处理...');
      await getDb().then(db => db!.update(videoJobs)
        .set({ 
          status: 'pending',
          errorMessage: null,
          currentStep: '准备重新处理...',
        })
        .where(eq(videoJobs.id, input.jobId))
      );
      
      // 异步处理视频（不阻塞响应）
      processVideoAsync(input.jobId).catch(error => {
        console.error(`Job ${input.jobId} retry failed:`, error);
        markJobFailed(input.jobId, error.message);
      });
      
      return { success: true, jobId: input.jobId };
    }),
  
  /**
   * 步骤1: 提取音频
   */
  extractAudio: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行音频提取
      const { extractAudioStep } = await import('./stepProcessor');
      
      // 异步执行（不阻塞响应）
      extractAudioStep(input.jobId).catch(error => {
        console.error(`ExtractAudio ${input.jobId} failed:`, error);
      });
      
      return { success: true, jobId: input.jobId };
    }),
  
  /**
   * 步骤2: 转录音频
   */
  transcribeAudio: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行转录
      const { transcribeAudioStep } = await import('./stepProcessor');
      
      // 异步执行（不阻塞响应）
      transcribeAudioStep(input.jobId).catch(error => {
        console.error(`TranscribeAudio ${input.jobId} failed:`, error);
      });
      
      return { success: true, jobId: input.jobId };
    }),
  
  /**
   * 步骤3: AI内容分析
   */
  analyzeContent: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行AI分析
      const { analyzeContentStep } = await import('./stepProcessor');
      
      // 异步执行（不阻塞响应）
      analyzeContentStep(input.jobId).catch(error => {
        console.error(`AnalyzeContent ${input.jobId} failed:`, error);
      });
      
      return { success: true, jobId: input.jobId };
    }),
  
  /**
   * 步骤2.5: 内容结构标注
   */
  annotateStructure: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行结构标注
      const { annotateStructureStep } = await import('./stepProcessor');
      
      // 异步执行（不阻塞响应）
      annotateStructureStep(input.jobId).catch(error => {
        console.error(`AnnotateStructure ${input.jobId} failed:`, error);
      });
      
      return { success: true, jobId: input.jobId };
    }),
  
  /**
   * 生成分析提示词（不执行分析）
   */
  generatePrompt: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行提示词生成
      const { generatePromptOnly } = await import('./stepProcessor');
      
      const scriptPrompt = await generatePromptOnly(input.jobId);
      
      return { 
        success: true, 
        jobId: input.jobId,
        userRequirement: job.userRequirement,
        scriptPrompt 
      };
    }),
  
  /**
   * 使用指定提示词进行分析
   */
  analyzeWithPrompt: protectedProcedure
    .input(z.object({ 
      jobId: z.number(),
      userRequirement: z.string(),
      scriptPrompt: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行AI分析
      const { analyzeWithCustomPrompt } = await import('./stepProcessor');
      
      // 异步执行（不阻塞响应）
      analyzeWithCustomPrompt(input.jobId, input.userRequirement, input.scriptPrompt).catch(error => {
        console.error(`AnalyzeWithPrompt ${input.jobId} failed:`, error);
      });
      
      return { success: true, jobId: input.jobId };
    }),
  
  /**
   * 更新片段列表
   */
  updateSegments: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      segments: z.array(z.object({
        start: z.number(),
        end: z.number(),
        reason: z.string(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 更新数据库
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.update(videoJobs)
        .set({
          selectedSegments: input.segments,
        })
        .where(eq(videoJobs.id, input.jobId));
      
      return { success: true };
    }),
  
  /**
   * 更新内容结构标注
   */
  updateContentStructure: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      contentStructure: z.array(z.object({
        id: z.number(),
        speaker: z.string(),
        topic: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        startSeconds: z.number(),
        endSeconds: z.number(),
        summary: z.string(),
        keywords: z.array(z.string()),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 更新数据库
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.update(videoJobs)
        .set({
          contentStructure: input.contentStructure,
        })
        .where(eq(videoJobs.id, input.jobId));
      
      return { success: true };
    }),
  
  /**
   * 步骤4: 生成视频片段
   */
  generateClips: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const job = await getVideoJob(input.jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (job.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // 导入并执行视频生成
      const { generateClipsStep } = await import('./stepProcessor');
      
      // 异步执行（不阻塞响应）
      generateClipsStep(input.jobId).catch(error => {
        console.error(`GenerateClips ${input.jobId} failed:`, error);
      });
      
      return { success: true, jobId: input.jobId };
    }),
});

/**
 * 异步处理视频任务
 */
export async function processVideoAsync(jobId: number): Promise<void> {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error('Job not found');
  
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `video-job-${jobId}-`));
  const tempFiles: string[] = [];
  
  try {
    // 1. 下载视频
    await updateJobProgress(jobId, 5, '正在下载视频...');
    const videoPath = path.join(tempDir, 'input.mp4');
    console.log(`Downloading video from: ${job.originalVideoUrl}`);
    const videoResponse = await fetch(job.originalVideoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    console.log(`Downloaded video size: ${videoBuffer.length} bytes, expected: ${job.fileSize} bytes`);
    if (videoBuffer.length !== job.fileSize) {
      throw new Error(`Video size mismatch: downloaded ${videoBuffer.length} bytes, expected ${job.fileSize} bytes`);
    }
    await fs.writeFile(videoPath, videoBuffer);
    console.log(`Video saved to: ${videoPath}`);
    tempFiles.push(videoPath);
    
    // 2. 提取音频
    await updateJobProgress(jobId, 15, '正在提取音频...');
    const audioPath = path.join(tempDir, 'audio.wav');
    await extractAudio(videoPath, audioPath);
    tempFiles.push(audioPath);
    
    // 3. 转录音频
    await updateJobProgress(jobId, 30, '正在转录音频...');
    const transcript = await transcribeAudio(audioPath);
    
    // 保存转录结果
    const transcriptPath = path.join(tempDir, 'transcript.json');
    await fs.writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
    tempFiles.push(transcriptPath);
    
    const transcriptKey = `transcripts/${job.userId}/${jobId}-transcript.json`;
    const { url: transcriptUrl } = await uploadToS3(transcriptPath, transcriptKey, 'application/json');
    
    // 4. AI分析内容
    await updateJobProgress(jobId, 50, '正在分析内容...');
    const selectedSegments = await analyzeContent(transcript, job.userRequirement);
    
    if (!selectedSegments || selectedSegments.length === 0) {
      throw new Error('AI未选择任何片段');
    }
    
    // 5. 切割视频片段
    await updateJobProgress(jobId, 60, '正在切割视频...');
    const segmentPaths: string[] = [];
    for (let i = 0; i < selectedSegments.length; i++) {
      const seg = selectedSegments[i];
      const segmentPath = path.join(tempDir, `segment_${i}.mp4`);
      await cutVideoSegment(videoPath, seg.start, seg.end, segmentPath);
      segmentPaths.push(segmentPath);
      tempFiles.push(segmentPath);
    }
    
    // 6. 拼接视频
    await updateJobProgress(jobId, 75, '正在拼接视频...');
    const concatenatedPath = path.join(tempDir, 'concatenated.mp4');
    await concatenateVideos(segmentPaths, concatenatedPath);
    tempFiles.push(concatenatedPath);
    
    // 7. 生成字幕
    await updateJobProgress(jobId, 85, '正在生成字幕...');
    const srtPath = path.join(tempDir, 'subtitles.srt');
    await generateSRT(selectedSegments, transcript, srtPath);
    tempFiles.push(srtPath);
    
    // 上传字幕
    const subtitleKey = `subtitles/${job.userId}/${jobId}-subtitles.srt`;
    const { url: subtitleUrl } = await uploadToS3(srtPath, subtitleKey, 'text/plain');
    
    // 8. 烧录字幕
    await updateJobProgress(jobId, 95, '正在烧录字幕...');
    const finalPath = path.join(tempDir, 'final.mp4');
    await burnSubtitles(concatenatedPath, srtPath, finalPath);
    tempFiles.push(finalPath);
    
    // 9. 上传最终视频
    await updateJobProgress(jobId, 98, '正在上传结果...');
    const finalKey = `results/${job.userId}/${jobId}-final.mp4`;
    const { url: finalUrl } = await uploadToS3(finalPath, finalKey, 'video/mp4');
    
    // 10. 标记完成
    await markJobCompleted(jobId, {
      transcriptUrl,
      transcriptKey,
      finalVideoUrl: finalUrl,
      finalVideoKey: finalKey,
      subtitleUrl,
      subtitleKey,
      selectedSegments,
    });
    
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);
    await markJobFailed(jobId, error.message);
    throw error;
  } finally {
    // 清理临时文件
    await cleanupTempFiles(tempFiles);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${tempDir}:`, error);
    }
  }
}
