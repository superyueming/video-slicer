import { getDb } from './server/db.ts';
import { videoJobs } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
const job = await db.select().from(videoJobs).where(eq(videoJobs.id, 2)).limit(1);

if (job.length > 0) {
  console.log('Job 2 details:');
  console.log('  Step:', job[0].step);
  console.log('  Status:', job[0].status);
  console.log('  Audio URL:', job[0].audioUrl || 'N/A');
  console.log('  Audio Key:', job[0].audioKey || 'N/A');
  console.log('  Created:', job[0].createdAt);
} else {
  console.log('Job 2 not found');
}
