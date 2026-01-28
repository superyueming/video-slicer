import { getDb } from './server/db.ts';
import { videoJobs } from './drizzle/schema.ts';
import { desc } from 'drizzle-orm';

const db = await getDb();
const jobs = await db.select().from(videoJobs).orderBy(desc(videoJobs.id)).limit(3);

console.log('Latest jobs:');
jobs.forEach(job => {
  console.log(`\nJob ${job.id}:`);
  console.log(`  Step: ${job.step}`);
  console.log(`  Audio URL: ${job.audioUrl || 'N/A'}`);
  console.log(`  Audio Key: ${job.audioKey || 'N/A'}`);
});
