import { eq, desc } from "drizzle-orm";
import { videoJobs, InsertVideoJob, VideoJob } from "../drizzle/schema";
import { getDb } from "./db";

export async function createVideoJob(job: InsertVideoJob): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(videoJobs).values(job);
  return Number(result[0].insertId);
}

export async function getVideoJob(id: number): Promise<VideoJob | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(videoJobs).where(eq(videoJobs.id, id)).limit(1);
  return result[0];
}

export async function getUserVideoJobs(userId: number): Promise<VideoJob[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(videoJobs)
    .where(eq(videoJobs.userId, userId))
    .orderBy(desc(videoJobs.createdAt));
}

export async function updateVideoJob(
  id: number,
  updates: Partial<Omit<VideoJob, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(videoJobs).set(updates).where(eq(videoJobs.id, id));
}

export async function updateJobProgress(
  id: number,
  progress: number,
  currentStep: string
): Promise<void> {
  await updateVideoJob(id, { progress, currentStep });
}

export async function markJobCompleted(
  id: number,
  results: {
    transcriptUrl: string;
    transcriptKey: string;
    finalVideoUrl: string;
    finalVideoKey: string;
    subtitleUrl: string;
    subtitleKey: string;
    selectedSegments: Array<{ start: number; end: number; reason: string }>;
  }
): Promise<void> {
  await updateVideoJob(id, {
    status: 'completed',
    progress: 100,
    completedAt: new Date(),
    ...results,
  });
}

export async function markJobFailed(id: number, errorMessage: string): Promise<void> {
  await updateVideoJob(id, {
    status: 'failed',
    errorMessage,
  });
}
