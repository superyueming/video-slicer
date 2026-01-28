import { getDb } from './db';
import { videoJobs } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { processVideoAsync } from './videoRouter';

/**
 * 启动时检查并处理pending状态的任务
 */
export async function processPendingJobs() {
  const db = await getDb();
  if (!db) {
    console.warn('[JobProcessor] Database not available, skipping pending jobs check');
    return;
  }

  try {
    // 查找所有pending状态的任务
    const pendingJobs = await db
      .select()
      .from(videoJobs)
      .where(eq(videoJobs.status, 'pending'));

    if (pendingJobs.length === 0) {
      console.log('[JobProcessor] No pending jobs found');
      return;
    }

    console.log(`[JobProcessor] Found ${pendingJobs.length} pending jobs, starting processing...`);

    // 逐个处理任务
    for (const job of pendingJobs) {
      console.log(`[JobProcessor] Starting job ${job.id}: ${job.originalFilename}`);
      
      // 异步处理，不阻塞
      processVideoAsync(job.id).catch((error: Error) => {
        console.error(`[JobProcessor] Job ${job.id} failed:`, error);
      });
    }
  } catch (error) {
    console.error('[JobProcessor] Failed to process pending jobs:', error);
  }
}

/**
 * 定期检查pending任务（可选）
 */
export function startJobProcessor(intervalMs: number = 60000) {
  console.log(`[JobProcessor] Starting job processor with ${intervalMs}ms interval`);
  
  // 立即执行一次
  processPendingJobs();
  
  // 定期检查
  const interval = setInterval(() => {
    processPendingJobs();
  }, intervalMs);
  
  return () => clearInterval(interval);
}
