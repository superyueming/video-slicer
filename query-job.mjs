import { getDb } from './server/db.ts';
import { videoJobs } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function queryJob() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      process.exit(1);
    }
    const job = await db.select().from(videoJobs).where(eq(videoJobs.id, 1)).limit(1);
    if (job.length > 0) {
      console.log('Job ID:', job[0].id);
      console.log('Filename:', job[0].originalFilename);
      console.log('Status:', job[0].status);
      console.log('Video URL:', job[0].originalVideoUrl);
      console.log('Video Key:', job[0].originalVideoKey);
      console.log('Error:', job[0].errorMessage);
      console.log('\nURL analysis:');
      console.log('- Is presigned?', job[0].originalVideoUrl.includes('X-Amz-Signature') || job[0].originalVideoUrl.includes('Signature='));
      console.log('- Has query params?', job[0].originalVideoUrl.includes('?'));
    } else {
      console.log('Job not found');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

queryJob();
