import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getVideoJob, updateJobProgress } from './videoDb';
import { storagePut } from './storage';
import { extractAudio, transcribeAudio } from './videoService';
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
      const segmentResults: Array<{ text: string; offset: number }> = [];
      for (let i = 0; i < segmentPaths.length; i++) {
        const segmentPath = segmentPaths[i];
        const progress = 20 + Math.floor((i / segmentPaths.length) * 60);
        await updateJobProgress(jobId, progress, `正在转录第 ${i + 1}/${segmentPaths.length} 段...`);
        
        const segmentTranscript = await transcribeAudio(segmentPath);
        segmentResults.push({
          text: segmentTranscript.text,
          offset: i * 3360 // 时间偏移量（秒）
        });
        
        // 清理临时片段文件
        await fs.unlink(segmentPath);
      }
      
      // 合并转录结果
      transcriptText = mergeTranscriptSegments(segmentResults);
      console.log(`[Transcribe] Merged ${segmentResults.length} segment transcripts`);
      
    } else {
      // 直接转录
      await updateJobProgress(jobId, 30, '正在转录音频...');
      const transcript = await transcribeAudio(audioPath);
      transcriptText = transcript.text;
    }
    
    // 3. 保存转录结果
    await updateJobProgress(jobId, 80, '正在保存转录结果...');
    const transcriptPath = path.join(tempDir, 'transcript.txt');
    await fs.writeFile(transcriptPath, transcriptText);
    tempFiles.push(transcriptPath);
    
    const transcriptKey = `transcripts/${job.userId}/${jobId}-transcript.json`;
    const transcriptBuffer = await fs.readFile(transcriptPath);
    const { url: transcriptUrl } = await storagePut(transcriptKey, transcriptBuffer, 'application/json');
    
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
