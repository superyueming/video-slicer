import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getVideoJob, updateJobProgress } from './videoDb';
import { storagePut } from './storage';
import { extractAudio, transcribeAudio } from "./videoService";
import { generateSRT } from "./srtGenerator";
import type { WhisperResponse } from "./_core/voiceTranscription";
import { splitAudioIntoSegments, mergeTranscriptSegments } from './audioSegmentation';
import { getDb } from './db';
import { videoJobs } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * 步骤1: 提取音频
 */
export async function extractAudioStep(jobId: number): Promise<void> {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error('Job not found');
  
  // 允许重新处理：如果已经完成，先重置状态
  if (job.step !== 'uploaded') {
    console.log(`[ExtractAudio] Re-processing job ${jobId} from step '${job.step}'`);
    // 重置到uploaded状态
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    await db.update(videoJobs)
      .set({ 
        step: 'uploaded',
        progress: 0,
        currentStep: '准备重新处理',
        status: 'pending'
      })
      .where(eq(videoJobs.id, jobId));
  }
  
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `audio-extract-${jobId}-`));
  const tempFiles: string[] = [];
  
  try {
    // 1. 下载视频
    await updateJobProgress(jobId, 10, '正在下载视频...');
    const videoPath = path.join(tempDir, 'input.mp4');
    console.log(`[ExtractAudio] Downloading video from: ${job.originalVideoUrl}`);
    
    const videoResponse = await fetch(job.originalVideoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    console.log(`[ExtractAudio] Downloaded video size: ${videoBuffer.length} bytes`);
    
    await fs.writeFile(videoPath, videoBuffer);
    tempFiles.push(videoPath);
    
    // 2. 提取音频
    await updateJobProgress(jobId, 50, '正在提取音频...');
    const audioPath = path.join(tempDir, 'audio.mp3');  // 改为.mp3
    await extractAudio(videoPath, audioPath);
    tempFiles.push(audioPath);
    
    // 3. 上传音频到S3
    await updateJobProgress(jobId, 80, '正在保存音频...');
    const audioKey = `audio/${job.userId}/${jobId}-audio.mp3`;  // 改为.mp3
    
    // 读取音频文件
    const audioBuffer = await fs.readFile(audioPath);
    const { url: audioUrl } = await storagePut(audioKey, audioBuffer, 'audio/mpeg');  // 改为audio/mpeg
    
    console.log(`[ExtractAudio] Audio uploaded to: ${audioUrl}`);
    
    // 4. 更新数据库
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.update(videoJobs)
      .set({
        audioUrl,
        audioKey,
        step: 'audio_extracted',
        progress: 100,
        currentStep: '音频提取完成',
        status: 'completed',
      })
      .where(eq(videoJobs.id, jobId));
    
    console.log(`[ExtractAudio] Job ${jobId} audio extraction completed`);
    
  } catch (error: any) {
    console.error(`[ExtractAudio] Job ${jobId} failed:`, error);
    
    const db = await getDb();
    if (db) {
      await db.update(videoJobs)
        .set({
          status: 'failed',
          errorMessage: error.message,
          currentStep: '音频提取失败',
        })
        .where(eq(videoJobs.id, jobId));
    }
    
    throw error;
  } finally {
    // 清理临时文件
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err);
      }
    }
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${tempDir}:`, error);
    }
  }
}

/**
 * 步骤2: 转录音频
 */
export async function transcribeAudioStep(jobId: number): Promise<void> {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error('Job not found');
  
  // 允许重新处理：如果已经完成，先重置状态
  if (job.step !== 'audio_extracted') {
    if (job.step === 'transcribed') {
      console.log(`[Transcribe] Re-processing job ${jobId} from step '${job.step}'`);
      // 重置到audio_extracted状态
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.update(videoJobs)
        .set({ 
          step: 'audio_extracted',
          progress: 0,
          currentStep: '准备重新处理',
          status: 'pending'
        })
        .where(eq(videoJobs.id, jobId));
    } else {
      throw new Error(`Invalid step: expected 'audio_extracted', got '${job.step}'`);
    }
  }
  
  if (!job.audioUrl) {
    throw new Error('Audio URL not found');
  }
  
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `transcribe-${jobId}-`));
  const tempFiles: string[] = [];
  
  try {
    // 1. 下载音频
    await updateJobProgress(jobId, 10, '正在下载音频...');
    const audioPath = path.join(tempDir, 'audio.mp3');  // 改为.mp3以匹配实际格式
    
    const audioResponse = await fetch(job.audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    await fs.writeFile(audioPath, audioBuffer);
    tempFiles.push(audioPath);
    
    // 2. 检查音频文件大小，如果超过15MB则分段处理
    const audioStats = await fs.stat(audioPath);
    const audioSizeMB = audioStats.size / (1024 * 1024);
    console.log(`[Transcribe] Audio file size: ${audioSizeMB.toFixed(2)} MB`);
    
    let transcriptText: string;
    
    if (audioSizeMB > 15) {
      // 分段处理
      console.log(`[Transcribe] Audio exceeds 15MB, splitting into segments...`);
      await updateJobProgress(jobId, 20, '音频文件较大，正在分段处理...');
      
      // 切分音频（每段56分钟 = 3360秒）
      const segmentPaths = await splitAudioIntoSegments(audioPath, 3360);
      console.log(`[Transcribe] Split into ${segmentPaths.length} segments`);
      
      // 转录每个片段
      const segmentResults: Array<{ srt: string; duration: number; response: WhisperResponse }> = [];
      for (let i = 0; i < segmentPaths.length; i++) {
        const segmentPath = segmentPaths[i];
        const progress = 20 + Math.floor((i / segmentPaths.length) * 60);
        await updateJobProgress(jobId, progress, `正在转录第 ${i + 1}/${segmentPaths.length} 段...`);
        
        const segmentTranscript = await transcribeAudio(segmentPath);
        const srt = generateSRT(segmentTranscript.segments, i * 3360);
        segmentResults.push({
          srt,
          duration: segmentTranscript.duration,
          response: segmentTranscript
        });
        
        // 清理临时片段文件
        await fs.unlink(segmentPath);
      }
      
      // 合并SRT结果
      transcriptText = segmentResults.map(r => r.srt).join('\n');
      console.log(`[Transcribe] Merged ${segmentResults.length} segment SRT files`);
      
    } else {
      // 直接转录
      await updateJobProgress(jobId, 30, '正在转录音频...');
      const transcript = await transcribeAudio(audioPath);
      transcriptText = generateSRT(transcript.segments);
    }
    
    // 3. 保存SRT字幕文件
    await updateJobProgress(jobId, 80, '正在保存字幕文件...');
    const transcriptPath = path.join(tempDir, 'transcript.srt');
    await fs.writeFile(transcriptPath, transcriptText, 'utf-8');
    tempFiles.push(transcriptPath);
    
    const transcriptKey = `transcripts/${job.userId}/${jobId}-transcript.srt`;
    const transcriptBuffer = await fs.readFile(transcriptPath);
    const { url: transcriptUrl } = await storagePut(transcriptKey, transcriptBuffer, 'text/plain; charset=utf-8');
    
    // 4. 更新数据库
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.update(videoJobs)
      .set({
        transcriptUrl,
        transcriptKey,
        step: 'transcribed',
        progress: 100,
        currentStep: '转录完成',
        status: 'completed',
      })
      .where(eq(videoJobs.id, jobId));
    
    console.log(`[Transcribe] Job ${jobId} transcription completed`);
    
  } catch (error: any) {
    console.error(`[Transcribe] Job ${jobId} failed:`, error);
    
    const db = await getDb();
    if (db) {
      await db.update(videoJobs)
        .set({
          status: 'failed',
          errorMessage: error.message,
          currentStep: '转录失败',
        })
        .where(eq(videoJobs.id, jobId));
    }
    
    throw error;
  } finally {
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err);
      }
    }
    
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${tempDir}:`, error);
    }
  }
}

/**
 * 步骤3: AI内容分析
 */
export async function analyzeContentStep(jobId: number): Promise<void> {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error('Job not found');
  
  // 允许重新处理
  if (job.step !== 'transcribed') {
    if (job.step === 'analyzed') {
      console.log(`[Analyze] Re-processing job ${jobId} from step '${job.step}'`);
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db.update(videoJobs)
        .set({ 
          step: 'transcribed',
          progress: 0,
          currentStep: '准备重新分析',
          status: 'pending'
        })
        .where(eq(videoJobs.id, jobId));
    } else {
      throw new Error(`Invalid step: expected 'transcribed', got '${job.step}'`);
    }
  }
  
  if (!job.transcriptUrl) {
    throw new Error('Transcript URL not found');
  }
  
  try {
    // 1. 下载SRT字幕文件
    await updateJobProgress(jobId, 10, '正在下载字幕文件...');
    const transcriptResponse = await fetch(job.transcriptUrl);
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to download transcript: ${transcriptResponse.status}`);
    }
    
    const srtContent = await transcriptResponse.text();
    console.log(`[Analyze] Downloaded SRT file, length: ${srtContent.length}`);
    
    // 2. 调用AI分析内容
    await updateJobProgress(jobId, 30, '正在AI分析内容...');
    const { invokeLLM } = await import('./_core/llm');
    
    const analysisPrompt = `你是一个视频内容分析专家。请分析以下SRT字幕内容，根据用户需求选择最精彩、最有价值的片段。

用户需求：${job.userRequirement}

SRT字幕内容：
${srtContent}

请选择3-5个最符合用户需求的精彩片段，每个片段长度在30秒到2分钟之间。
对于每个片段，请说明：
1. 开始时间（格式：HH:MM:SS）
2. 结束时间（格式：HH:MM:SS）
3. 选择理由（为什么这个片段符合用户需求）

请以JSON格式返回结果。`;

    const llmResponse = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的视频内容分析助手，擅长从长视频中提取精彩片段。' },
        { role: 'user', content: analysisPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'video_segments',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              segments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start_time: { type: 'string', description: '开始时间 HH:MM:SS' },
                    end_time: { type: 'string', description: '结束时间 HH:MM:SS' },
                    reason: { type: 'string', description: '选择理由' }
                  },
                  required: ['start_time', 'end_time', 'reason'],
                  additionalProperties: false
                }
              }
            },
            required: ['segments'],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = llmResponse.choices[0].message.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected LLM response format');
    }
    const analysisResult = JSON.parse(content);
    console.log(`[Analyze] AI selected ${analysisResult.segments.length} segments`);
    
    // 3. 转换时间格式并保存结果
    await updateJobProgress(jobId, 80, '正在保存分析结果...');
    
    const selectedSegments = analysisResult.segments.map((seg: any) => ({
      start: timeStringToSeconds(seg.start_time),
      end: timeStringToSeconds(seg.end_time),
      reason: seg.reason
    }));
    
    // 4. 更新数据库
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.update(videoJobs)
      .set({
        selectedSegments,
        step: 'analyzed',
        progress: 100,
        currentStep: 'AI分析完成',
        status: 'completed',
      })
      .where(eq(videoJobs.id, jobId));
    
    console.log(`[Analyze] Job ${jobId} analysis completed`);
    
  } catch (error: any) {
    console.error(`[Analyze] Job ${jobId} failed:`, error);
    
    const db = await getDb();
    if (db) {
      await db.update(videoJobs)
        .set({
          status: 'failed',
          errorMessage: error.message,
          currentStep: 'AI分析失败',
        })
        .where(eq(videoJobs.id, jobId));
    }
    
    throw error;
  }
}

/**
 * 将时间字符串（HH:MM:SS）转换为秒数
 */
function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else {
    return Number(timeStr);
  }
}
