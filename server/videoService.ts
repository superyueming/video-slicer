import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { storagePut } from './storage';
import { invokeLLM } from './_core/llm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const PYTHON_SCRIPT = path.join(__dirname, 'video_processor.py');

import type { WhisperResponse, WhisperSegment } from './_core/voiceTranscription';

// 使用Whisper API的原生类型
type TranscriptSegment = WhisperSegment;
type TranscriptResult = WhisperResponse;

interface SelectedSegment {
  start: number;
  end: number;
  reason: string;
}

/**
 * 调用Python脚本执行视频处理命令
 */
async function runPythonCommand(command: string, ...args: string[]): Promise<any> {
  const escapedArgs = args.map(arg => {
    // 对参数进行转义，防止命令注入
    if (typeof arg === 'string' && arg.includes("'")) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return `'${arg}'`;
  });
  
  const cmd = `python3.11 ${PYTHON_SCRIPT} ${command} ${escapedArgs.join(' ')}`;
  
  try {
    // 清除Python环境变量，避免加载错误的Python库
    const cleanEnv = { ...process.env };
    delete cleanEnv.PYTHONPATH;
    delete cleanEnv.PYTHONHOME;
    delete cleanEnv.VIRTUAL_ENV;
    
    const { stdout, stderr } = await execAsync(cmd, { 
      maxBuffer: 50 * 1024 * 1024,
      env: cleanEnv
    });
    
    console.log('Python stdout:', stdout);
    if (stderr && !stderr.includes('Warning')) {
      console.error('Python stderr:', stderr);
    }
    
    const result = JSON.parse(stdout);
    if (!result.success && result.error) {
      console.error('Python script error:', result.error);
    }
    return result;
  } catch (error: any) {
    console.error('Python command failed:', error);
    throw new Error(`Video processing failed: ${error.message}`);
  }
}

/**
 * 从视频提取音频
 */
export async function extractAudio(videoPath: string, outputAudioPath: string): Promise<void> {
  const result = await runPythonCommand('extract_audio', videoPath, outputAudioPath);
  if (!result.success) {
    throw new Error('Failed to extract audio from video');
  }
}

/**
 * 使用Whisper转录音频（使用在线API避免内存不足）
 */
export async function transcribeAudio(audioPath: string): Promise<TranscriptResult> {
  // 导入内置的voiceTranscription helper
  const { transcribeAudio: transcribeAudioAPI } = await import('./_core/voiceTranscription');
  const { storagePut } = await import('./storage');
  const fs = await import('fs/promises');
  
  // 1. 上传音频文件到S3获取URL
  const audioBuffer = await fs.readFile(audioPath);
  const audioKey = `temp-audio/${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
  const { url: audioUrl } = await storagePut(audioKey, audioBuffer, 'audio/wav');
  
  // 2. 调用在线Whisper API
  const result = await transcribeAudioAPI({
    audioUrl,
    language: 'zh',
    prompt: '请转录这段中文演讲内容'
  });
  
  // 3. 检查是否有错误
  if ('error' in result) {
    throw new Error(`Transcription failed: ${result.error}`);
  }
  
  // 4. 返回结果（格式已经兼容）
  return result as TranscriptResult;
}

/**
 * 使用DeepSeek分析内容并选择片段
 */
export async function analyzeContent(
  transcript: TranscriptResult,
  userRequirement: string
): Promise<SelectedSegment[]> {
  // 构建完整文本
  let fullText = '';
  for (let i = 0; i < transcript.segments.length; i++) {
    const seg = transcript.segments[i];
    fullText += `[片段${i}] ${seg.start.toFixed(1)}s-${seg.end.toFixed(1)}s: ${seg.text.trim()}\n`;
  }
  
  const prompt = `你是一个专业的视频内容分析师。请分析以下演讲文本，根据用户需求选择合适的片段。

演讲文本（带时间戳）：
${fullText}

用户需求：
${userRequirement}

请仔细分析文本内容，选择最符合用户需求的片段。你需要：
1. 理解用户的具体需求
2. 找出最相关、最精彩的片段
3. 确保选择的片段语义完整
4. 按照合理的顺序排列片段

请以JSON格式返回结果，格式如下：
{
  "selected_segments": [
    {
      "segment_ids": [0, 1, 2],
      "start": 10.5,
      "end": 45.3,
      "reason": "这段内容讲述了..."
    }
  ],
  "arrangement_reason": "我选择这样的顺序是因为..."
}

注意：
- segment_ids是连续片段的ID列表
- start和end是该组片段的起止时间
- 可以选择多组片段
- 确保时间戳准确`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: '你是一个专业的视频内容分析师，擅长理解用户需求并选择最合适的内容片段。' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
  });
  
  const content = response.choices[0].message.content;
  let resultText = typeof content === 'string' ? content.trim() : JSON.stringify(content);
  
  // 提取JSON部分
  if (resultText.includes('```json')) {
    const jsonStart = resultText.indexOf('```json') + 7;
    const jsonEnd = resultText.indexOf('```', jsonStart);
    resultText = resultText.substring(jsonStart, jsonEnd).trim();
  } else if (resultText.includes('```')) {
    const jsonStart = resultText.indexOf('```') + 3;
    const jsonEnd = resultText.indexOf('```', jsonStart);
    resultText = resultText.substring(jsonStart, jsonEnd).trim();
  }
  
  const result = JSON.parse(resultText);
  return result.selected_segments;
}

/**
 * 切割视频片段
 */
export async function cutVideoSegment(
  videoPath: string,
  start: number,
  end: number,
  outputPath: string
): Promise<void> {
  const result = await runPythonCommand(
    'cut_segment',
    videoPath,
    start.toString(),
    end.toString(),
    outputPath
  );
  if (!result.success) {
    throw new Error('Failed to cut video segment');
  }
}

/**
 * 拼接多个视频
 */
export async function concatenateVideos(videoPaths: string[], outputPath: string): Promise<void> {
  const result = await runPythonCommand(
    'concatenate',
    JSON.stringify(videoPaths),
    outputPath
  );
  if (!result.success) {
    throw new Error('Failed to concatenate videos');
  }
}

/**
 * 生成SRT字幕文件
 */
export async function generateSRT(
  segments: SelectedSegment[],
  transcript: TranscriptResult,
  outputPath: string
): Promise<void> {
  const result = await runPythonCommand(
    'generate_srt',
    JSON.stringify(segments),
    JSON.stringify(transcript),
    outputPath
  );
  if (!result.success) {
    throw new Error('Failed to generate SRT');
  }
}

/**
 * 烧录字幕到视频
 */
export async function burnSubtitles(
  videoPath: string,
  srtPath: string,
  outputPath: string
): Promise<void> {
  const result = await runPythonCommand('burn_subtitles', videoPath, srtPath, outputPath);
  if (!result.success) {
    throw new Error('Failed to burn subtitles');
  }
}

/**
 * 上传文件到S3
 */
export async function uploadToS3(
  filePath: string,
  key: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const fileBuffer = await fs.readFile(filePath);
  const result = await storagePut(key, fileBuffer, contentType);
  return { url: result.url, key };
}

/**
 * 清理临时文件
 */
export async function cleanupTempFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (error) {
      console.warn(`Failed to delete temp file ${file}:`, error);
    }
  }
}
