import { eq, and, lt } from "drizzle-orm";
import { uploadSessions, type UploadSession, type InsertUploadSession } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a new upload session
 */
export async function createUploadSession(data: Omit<InsertUploadSession, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [session] = await db.insert(uploadSessions).values(data).$returningId();
  return session.id;
}

/**
 * Get upload session by uploadId
 */
export async function getUploadSession(uploadId: string): Promise<UploadSession | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [session] = await db.select().from(uploadSessions).where(eq(uploadSessions.uploadId, uploadId));
  return session || null;
}

/**
 * Update upload session
 */
export async function updateUploadSession(uploadId: string, data: Partial<UploadSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(uploadSessions).set(data).where(eq(uploadSessions.uploadId, uploadId));
}

/**
 * Mark chunk as uploaded
 */
export async function markChunkUploaded(uploadId: string, chunkIndex: number, s3Part?: { PartNumber: number; ETag: string }) {
  const session = await getUploadSession(uploadId);
  if (!session) throw new Error("Upload session not found");

  const uploadedChunks = Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [];
  if (!uploadedChunks.includes(chunkIndex)) {
    uploadedChunks.push(chunkIndex);
  }

  const s3Parts = Array.isArray(session.s3Parts) ? session.s3Parts : [];
  if (s3Part && !s3Parts.find(p => p.PartNumber === s3Part.PartNumber)) {
    s3Parts.push(s3Part);
  }

  const progress = Math.round((uploadedChunks.length / session.totalChunks) * 100);

  await updateUploadSession(uploadId, {
    uploadedChunks,
    s3Parts,
    progress,
  });
}

/**
 * Complete upload session
 */
export async function completeUploadSession(uploadId: string, finalUrl: string) {
  await updateUploadSession(uploadId, {
    status: "completed",
    progress: 100,
    finalUrl,
  });
}

/**
 * Fail upload session
 */
export async function failUploadSession(uploadId: string, errorMessage: string) {
  await updateUploadSession(uploadId, {
    status: "failed",
    errorMessage,
  });
}

/**
 * Cancel upload session
 */
export async function cancelUploadSession(uploadId: string) {
  await updateUploadSession(uploadId, {
    status: "cancelled",
  });
}

/**
 * Clean up expired upload sessions
 */
export async function cleanupExpiredSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const now = new Date();
  const deleted = await db.delete(uploadSessions).where(lt(uploadSessions.expiresAt, now));
  return deleted;
}
