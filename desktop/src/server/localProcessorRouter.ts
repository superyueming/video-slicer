import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { storagePut } from './storage';
import { nanoid } from 'nanoid';
import type { WhisperResponse } from './_core/voiceTranscription';

// 分析结果片段类型
interface AnalysisSegment {
  start: number;
  end: number;
  reason: string;
  segment_ids?: number[];
}

/**
 * 本地处理专用路由
 * 用于桌面应用的本地视频处理工作流
 * 
 * 工作流：
 * 1. 桌面应用在本地提取音频
 * 2. 上传音频到云端（uploadAudio）
 * 3. 云端转录音频（transcribeAudio）
 * 4. 云端AI分析内容（analyzeContent）
 * 5. 返回分析结果（片段列表）
 * 6. 桌面应用在本地剪辑和拼接视频
 */
export const localProcessorRouter = router({
  /**
   * 上传音频文件
   * 桌面应用提取音频后调用此接口上传
   */
  uploadAudio: protectedProcedure
    .input(z.object({
      filename: z.string(),
      contentType: z.string(),
      fileSize: z.number(),
      base64Data: z.string(), // Base64编码的音频数据
    }))
    .mutation(async ({ input, ctx }) => {
      const { filename, contentType, fileSize, base64Data } = input;
      
      // 文件大小限制（100MB，音频文件通常较小）
      const MAX_FILE_SIZE = 100 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error(`音频文件大小超过限制（最大100MB）`);
      }
      
      // 解码Base64数据
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // 生成S3存储键
      const timestamp = Date.now();
      const randomId = nanoid(10);
      const fileKey = `audio/${ctx.user.id}/${timestamp}-${randomId}-${filename}`;
      
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
   * 转录音频并进行AI分析
   * 一次性完成转录和分析，返回片段列表
   */
  analyzeAudio: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      audioKey: z.string(),
      videoDuration: z.number(), // 视频总时长（秒）
      userRequirement: z.string(), // 用户需求描述
      asrMethod: z.enum(['whisper', 'aliyun']).default('whisper'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { audioUrl, videoDuration, userRequirement, asrMethod } = input;
      
      try {
        // 步骤1: 转录音频
        console.log('[LocalProcessor] 开始转录音频...');
        const transcriptResult = await transcribeAudioFromUrl(audioUrl, asrMethod);
        
        const transcript = transcriptResult.text;
        console.log('[LocalProcessor] 转录完成，文本长度:', transcript.length);
        
        // 步骤2: AI分析内容
        console.log('[LocalProcessor] 开始AI分析...');
        const segments = await analyzeContentFromTranscript(
          transcriptResult,
          userRequirement
        );
        
        console.log('[LocalProcessor] AI分析完成，片段数量:', segments.length);
        
        // 返回分析结果
        return {
          success: true,
          transcript,
          segments,
          reasoning: 'AI分析完成',
        };
      } catch (error: any) {
        console.error('[LocalProcessor] 分析失败:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
  
  /**
   * 仅转录音频（不进行AI分析）
   * 用于需要查看转录文本的场景
   */
  transcribeOnly: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      asrMethod: z.enum(['whisper', 'aliyun']).default('whisper'),
    }))
    .mutation(async ({ input }) => {
      const { audioUrl, asrMethod } = input;
      
      try {
        console.log('[LocalProcessor] 开始转录音频...');
        const result = await transcribeAudioFromUrl(audioUrl, asrMethod);
        
        return {
          success: true,
          transcript: result.text,
        };
      } catch (error: any) {
        console.error('[LocalProcessor] 转录失败:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});

/**
 * 从URL转录音频
 */
async function transcribeAudioFromUrl(
  audioUrl: string,
  asrMethod: 'whisper' | 'aliyun'
): Promise<WhisperResponse> {
  // 导入内置的voiceTranscription helper
  const { transcribeAudio: transcribeAudioAPI } = await import('./_core/voiceTranscription');
  
  // 调用在线Whisper API
  const result = await transcribeAudioAPI({
    audioUrl,
    language: 'zh',
    prompt: '请转录这段中文演讲内容'
  });
  
  // 检查是否是错误响应
  if ('error' in result) {
    throw new Error(result.error);
  }
  
  return result;
}

/**
 * 从转录结果分析内容
 */
async function analyzeContentFromTranscript(
  transcript: WhisperResponse,
  userRequirement: string
): Promise<AnalysisSegment[]> {
  const { invokeLLM } = await import('./_core/llm');
  
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
