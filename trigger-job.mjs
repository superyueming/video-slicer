import { processVideoJob } from './server/videoService.ts';

const jobId = parseInt(process.argv[2] || '1');

console.log(`Triggering job ${jobId}...`);

processVideoJob(jobId)
  .then(() => {
    console.log('Job processing started successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to start job:', error.message);
    process.exit(1);
  });
