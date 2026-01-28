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
 * 步骤3: AI内容分析（分为三个阶段）
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
    await updateJobProgress(jobId, 5, '正在下载字幕文件...');
    const transcriptResponse = await fetch(job.transcriptUrl);
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to download transcript: ${transcriptResponse.status}`);
    }
    
    const srtContent = await transcriptResponse.text();
    console.log(`[Analyze] Downloaded SRT file, length: ${srtContent.length}`);
    
    const { invokeLLM } = await import('./_core/llm');
    
    // 阶段1: 生成智能提示词
    await updateJobProgress(jobId, 15, '正在生成分析提示词...');
    console.log(`[Analyze] Generating script prompt for job ${jobId}`);
    
    const promptGenerationRequest = `你是一个视频分析专家。请根据用户的需求，生成一个详细的分析提示词，用于指导后续的视频内容分析和片段选择。

用户需求：${job.userRequirement}

请生成一个包含以下元素的分析提示词：

1. **视频类型识别**：判断这是什么类型的视频（会议演讲、教学视频、访谈、Vlog等）

2. **剪辑目标定位**：明确需要提取什么内容（特定人物发言、精华观点合集、教程步骤等）

3. **内容重点方向**：需要关注的内容主题（技术细节、商业策略、案例分享等）

4. **剪辑节奏建议**：
   - 片段时长（例如：30秒/1分钟/3分钟）
   - 片段数量（例如：3-5个精华/完整保留）
   - 转场风格（快速切换/平滑过渡）

5. **目标受众考虑**：针对什么人群（专业人士、普通观众、营销推广）

请以结构化的文本形式返回提示词，不要使用JSON格式。`;

    const promptResponse = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的视频分析专家。' },
        { role: 'user', content: promptGenerationRequest }
      ]
    });
    
    const scriptPrompt = promptResponse.choices[0].message.content;
    if (typeof scriptPrompt !== 'string') {
      throw new Error('Unexpected LLM response format for script prompt');
    }
    console.log(`[Analyze] Generated script prompt, length: ${scriptPrompt.length}`);
    
    // 阶段2: 生成总体脚本
    await updateJobProgress(jobId, 40, '正在生成总体脚本...');
    console.log(`[Analyze] Generating overall script for job ${jobId}`);
    
    const scriptGenerationRequest = `请根据以下分析提示词和字幕内容，生成一个完整的视频内容脚本。

分析提示词：
${scriptPrompt}

SRT字幕内容：
${srtContent}

请生成一个结构化的视频内容脚本，包括：
1. 视频整体概述
2. 主要内容结构（分段描述）
3. 关键信息提取

请以文本形式返回，不要使用JSON格式。`;
    
    const scriptResponse = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的视频内容分析助手。' },
        { role: 'user', content: scriptGenerationRequest }
      ]
    });
    
    const overallScript = scriptResponse.choices[0].message.content;
    if (typeof overallScript !== 'string') {
      throw new Error('Unexpected LLM response format for overall script');
    }
    console.log(`[Analyze] Generated overall script, length: ${overallScript.length}`);
    
    // 阶段3: 选择精彩片段
    await updateJobProgress(jobId, 70, '正在选择精彩片段...');
    console.log(`[Analyze] Selecting segments for job ${jobId}`);
    
    const segmentSelectionRequest = `请根据以下分析提示词和总体脚本，从SRT字幕中选择最精彩的片段。

分析提示词：
${scriptPrompt}

总体脚本：
${overallScript}

SRT字幕内容：
${srtContent}

重要说明：
- SRT格式中的时间戳格式为 "HH:MM:SS,mmm --> HH:MM:SS,mmm"
- 你需要根据字幕内容找到精彩片段的开始和结束时间
- 请使用SRT中实际出现的时间戳，不要编造时间
- 时间格式必须为 HH:MM:SS（例如：00:05:30、01:23:45）

请选择3-5个最符合分析提示词的精彩片段。

示例输出格式：
{
  "segments": [
    {
      "start_time": "00:05:30",
      "end_time": "00:07:15",
      "reason": "这个片段介绍了..."
    }
  ]
}

请以JSON格式返回结果。`;
    
    const segmentResponse = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的视频内容分析助手，擅长从长视频中提取精彩片段。' },
        { role: 'user', content: segmentSelectionRequest }
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
    
    const segmentContent = segmentResponse.choices[0].message.content;
    if (typeof segmentContent !== 'string') {
      throw new Error('Unexpected LLM response format for segments');
    }
    const analysisResult = JSON.parse(segmentContent);
    console.log(`[Analyze] AI selected ${analysisResult.segments.length} segments`);
    
    // 3. 转换时间格式并保存结果
    await updateJobProgress(jobId, 90, '正在保存分析结果...');
    
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
        scriptPrompt,
        overallScript,
        selectedSegments,
        step: 'analyzed',
        progress: 0,  // 重置为0，等待用户手动触发步骤4
        currentStep: 'AI分析完成，等待生成视频',
        status: 'completed',
      })
      .where(eq(videoJobs.id, jobId));
    
    console.log(`[Analyze] Job ${jobId} analysis completed with script prompt and overall script`);
    
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
/**
 * 只生成提示词，不执行分析
 */
export async function generatePromptOnly(jobId: number): Promise<string> {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error('Job not found');
  
  const { invokeLLM } = await import('./_core/llm');
  
  const promptGenerationRequest = `你是一个视频分析专家。请根据用户的需求，生成一个详细的分析提示词，用于指导后续的视频内容分析和片段选择。

用户需求：${job.userRequirement}

请生成一个包含以下元素的分析提示词：

1. **视频类型识别**：判断这是什么类型的视频（会议演讲、教学视频、访谈、Vlog等）

2. **剪辑目标定位**：明确需要提取什么内容（特定人物发言、精华观点合集、教程步骤等）

3. **内容重点方向**：需要关注的内容主题（技术细节、商业策略、案例分享等）

4. **剪辑节奏建议**：
   - 片段时长（例如：30秒/1分钟/3分钟）
   - 片段数量（例如：3-5个精华/完整保留）
   - 转场风格（快速切换/平滑过渡）

5. **目标受众考虑**：针对什么人群（专业人士、普通观众、营销推广）

请以结构化的文本形式返回提示词，不要使用JSON格式。`;

  const promptResponse = await invokeLLM({
    messages: [
      { role: 'system', content: '你是一个专业的视频分析专家。' },
      { role: 'user', content: promptGenerationRequest }
    ]
  });
  
  const scriptPrompt = promptResponse.choices[0].message.content;
  if (typeof scriptPrompt !== 'string') {
    throw new Error('Unexpected LLM response format for script prompt');
  }
  
  // 保存到数据库
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.update(videoJobs)
    .set({ scriptPrompt })
    .where(eq(videoJobs.id, jobId));
  
  return scriptPrompt;
}

/**
 * 使用自定义提示词进行分析
 */
export async function analyzeWithCustomPrompt(
  jobId: number, 
  userRequirement: string, 
  scriptPrompt: string
): Promise<void> {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error('Job not found');
  
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
    const { invokeLLM } = await import('./_core/llm');
    
    // 更新userRequirement
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.update(videoJobs)
      .set({ 
        userRequirement,
        scriptPrompt,
        step: 'transcribed',
        progress: 0,
        status: 'pending'
      })
      .where(eq(videoJobs.id, jobId));
    
    // 阶段2: 生成总体脚本
    await updateJobProgress(jobId, 40, '正在生成总体脚本...');
    console.log(`[Analyze] Generating overall script for job ${jobId}`);
    
    const scriptGenerationRequest = `请根据以下分析提示词和字幕内容，生成一个完整的视频内容脚本。

分析提示词：
${scriptPrompt}

SRT字幕内容：
${srtContent}

请生成一个结构化的视频内容脚本，包括：
1. 视频整体概述
2. 主要内容结构（分段描述）
3. 关键信息提取

请以文本形式返回，不要使用JSON格式。`;
    
    const scriptResponse = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的视频内容分析助手。' },
        { role: 'user', content: scriptGenerationRequest }
      ]
    });
    
    const overallScript = scriptResponse.choices[0].message.content;
    if (typeof overallScript !== 'string') {
      throw new Error('Unexpected LLM response format for overall script');
    }
    console.log(`[Analyze] Generated overall script, length: ${overallScript.length}`);
    
    // 阶段3: 选择精彩片段
    await updateJobProgress(jobId, 70, '正在选择精彩片段...');
    console.log(`[Analyze] Selecting segments for job ${jobId}`);
    
    const segmentSelectionRequest = `请根据以下分析提示词和总体脚本，从SRT字幕中选择最精彩的片段。

分析提示词：
${scriptPrompt}

总体脚本：
${overallScript}

SRT字幕内容：
${srtContent}

重要说明：
- SRT格式中的时间戳格式为 "HH:MM:SS,mmm --> HH:MM:SS,mmm"
- 你需要根据字幕内容找到精彩片段的开始和结束时间
- 请使用SRT中实际出现的时间戳，不要编造时间
- 时间格式必须为 HH:MM:SS（例如：00:05:30、01:23:45）

请选择3-5个最符合分析提示词的精彩片段。

示例输出格式：
{
  "segments": [
    {
      "start_time": "00:05:30",
      "end_time": "00:07:15",
      "reason": "这个片段介绍了..."
    }
  ]
}

请以JSON格式返回结果。`;
    
    const segmentResponse = await invokeLLM({
      messages: [
        { role: 'system', content: '你是一个专业的视频内容分析助手，擅长从长视频中提取精彩片段。' },
        { role: 'user', content: segmentSelectionRequest }
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
    
    const segmentContent = segmentResponse.choices[0].message.content;
    if (typeof segmentContent !== 'string') {
      throw new Error('Unexpected LLM response format for segments');
    }
    const analysisResult = JSON.parse(segmentContent);
    console.log(`[Analyze] AI selected ${analysisResult.segments.length} segments`);
    
    // 3. 转换时间格式并保存结果
    await updateJobProgress(jobId, 90, '正在保存分析结果...');
    
    const selectedSegments = analysisResult.segments.map((seg: any) => ({
      start: timeStringToSeconds(seg.start_time),
      end: timeStringToSeconds(seg.end_time),
      reason: seg.reason
    }));
    
    // 4. 更新数据库
    await db.update(videoJobs)
      .set({
        scriptPrompt,
        overallScript,
        selectedSegments,
        step: 'analyzed',
        progress: 0,
        currentStep: 'AI分析完成，等待生成视频',
        status: 'completed',
      })
      .where(eq(videoJobs.id, jobId));
    
    console.log(`[Analyze] Job ${jobId} analysis completed with custom prompt`);
    
  } catch (error: any) {
    console.error(`[Analyze] Job ${jobId} failed:`, error);
    
    const db = await getDb();
    if (db) {
      await db.update(videoJobs)
        .set({
          status: 'failed',
          errorMessage: error.message,
          currentStep: '分析失败',
        })
        .where(eq(videoJobs.id, jobId));
    }
    
    throw error;
  }
}

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

/**
 * 步骤4: 生成视频片段
 * 根据AI选择的时间戳剪辑视频并拼接成最终视频
 */
export async function generateClipsStep(jobId: number): Promise<void> {
  console.log(`[GenerateClips] Starting for job ${jobId}`);
  
  try {
    // 1. 获取任务信息
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const [job] = await db.select().from(videoJobs).where(eq(videoJobs.id, jobId));
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    // 验证步骤
    if (job.step !== 'analyzed') {
      throw new Error(`Invalid step: expected 'analyzed', got '${job.step}'`);
    }
    
    if (!job.selectedSegments || job.selectedSegments.length === 0) {
      throw new Error('No segments selected for clipping');
    }
    
    // 2. 更新状态为处理中
    await db.update(videoJobs)
      .set({
        status: 'processing',
        progress: 0,
        currentStep: '正在生成视频片段...',
      })
      .where(eq(videoJobs.id, jobId));
    
    // 3. 下载原始视频
    console.log(`[GenerateClips] Downloading video from ${job.originalVideoUrl}`);
    await db.update(videoJobs)
      .set({ progress: 10, currentStep: '正在下载原始视频...' })
      .where(eq(videoJobs.id, jobId));
    
    const crypto = await import('crypto');
    const fs = await import('fs/promises');
    const randomId = crypto.randomBytes(6).toString('base64url');
    const tmpDir = `/tmp/video-job-${jobId}-${randomId}`;
    await fs.mkdir(tmpDir, { recursive: true });
    const videoPath = path.join(tmpDir, 'video.mp4');
    
    // 下载视频文件
    const response = await fetch(job.originalVideoUrl);
    if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
    const downloadedVideoBuffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(videoPath, downloadedVideoBuffer);
    
    // 4. 剪辑视频片段
    console.log(`[GenerateClips] Clipping ${job.selectedSegments.length} segments`);
    await db.update(videoJobs)
      .set({ progress: 30, currentStep: '正在剪辑视频片段...' })
      .where(eq(videoJobs.id, jobId));
    
    const { clipVideos } = await import('./videoService.js');
    const clipPaths = await clipVideos(videoPath, job.selectedSegments);
    
    // 5. 拼接视频片段
    console.log(`[GenerateClips] Concatenating ${clipPaths.length} clips`);
    await db.update(videoJobs)
      .set({ progress: 60, currentStep: '正在拼接视频片段...' })
      .where(eq(videoJobs.id, jobId));
    
    const dir = path.dirname(videoPath);
    const outputPath = path.join(dir, 'final-output.mp4');
    const { concatenateVideos } = await import('./videoService.js');
    await concatenateVideos(clipPaths, outputPath);
    
    // 6. 上传最终视频到S3
    console.log(`[GenerateClips] Uploading final video to S3`);
    await db.update(videoJobs)
      .set({ progress: 80, currentStep: '正在上传最终视频...' })
      .where(eq(videoJobs.id, jobId));
    
    const finalVideoBuffer = await fs.readFile(outputPath);
    const videoKey = `videos/${job.userId || 'anonymous'}/${jobId}-final.mp4`;
    const { url: finalVideoUrl } = await storagePut(videoKey, finalVideoBuffer, 'video/mp4');
    
    // 7. 清理临时文件
    await fs.rm(tmpDir, { recursive: true, force: true });
    
    // 8. 更新数据库
    await db.update(videoJobs)
      .set({
        finalVideoUrl,
        finalVideoKey: videoKey,
        step: 'completed',
        progress: 100,
        currentStep: '视频生成完成',
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(videoJobs.id, jobId));
    
    console.log(`[GenerateClips] Job ${jobId} completed`);
    
  } catch (error: any) {
    console.error(`[GenerateClips] Job ${jobId} failed:`, error);
    
    const db = await getDb();
    if (db) {
      await db.update(videoJobs)
        .set({
          status: 'failed',
          errorMessage: error.message,
          currentStep: '视频生成失败',
        })
        .where(eq(videoJobs.id, jobId));
    }
    
    throw error;
  }
}
