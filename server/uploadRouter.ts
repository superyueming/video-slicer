import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createUploadSession,
  getUploadSession,
  markChunkUploaded,
  completeUploadSession,
  failUploadSession,
  cancelUploadSession,
} from "./uploadDb";
import { storagePut } from "./storageAdapter";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const TEMP_DIR = path.join(os.tmpdir(), "video-uploads");

// Ensure temp directory exists
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

export const uploadRouter = router({
  /**
   * Initialize a chunked upload session
   */
  initUpload: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(), // Client-generated UUID
        filename: z.string(),
        fileSize: z.number(),
        mimeType: z.string().optional(),
        chunkSize: z.number().default(CHUNK_SIZE),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const totalChunks = Math.ceil(input.fileSize / input.chunkSize);
      const s3Key = `videos/${ctx.user.id}/${input.uploadId}-${input.filename}`;

      // Create temp directory for this upload
      const uploadTempDir = path.join(TEMP_DIR, input.uploadId);
      await fs.mkdir(uploadTempDir, { recursive: true });

      // Create upload session in database
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await createUploadSession({
        userId: ctx.user.id,
        uploadId: input.uploadId,
        filename: input.filename,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        chunkSize: input.chunkSize,
        totalChunks,
        uploadedChunks: [],
        s3Key,
        status: "uploading",
        progress: 0,
        expiresAt,
      });

      return {
        uploadId: input.uploadId,
        totalChunks,
        chunkSize: input.chunkSize,
      };
    }),

  /**
   * Upload a single chunk
   */
  uploadChunk: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        chunkIndex: z.number(),
        chunk: z.string(), // Base64 encoded chunk data
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getUploadSession(input.uploadId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to upload to this session",
        });
      }

      if (session.status !== "uploading") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Upload session is ${session.status}`,
        });
      }

      // Check if chunk already uploaded
      const uploadedChunks = Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [];
      if (uploadedChunks.includes(input.chunkIndex)) {
        return {
          success: true,
          message: "Chunk already uploaded",
          progress: session.progress,
        };
      }

      try {
        // Decode base64 chunk data
        const chunkBuffer = Buffer.from(input.chunk, "base64");

        // Save chunk to temp file
        const uploadTempDir = path.join(TEMP_DIR, input.uploadId);
        const chunkPath = path.join(uploadTempDir, `chunk-${input.chunkIndex}`);
        await fs.writeFile(chunkPath, chunkBuffer);

        // Mark chunk as uploaded
        await markChunkUploaded(input.uploadId, input.chunkIndex);

        const updatedSession = await getUploadSession(input.uploadId);
        return {
          success: true,
          progress: updatedSession?.progress || 0,
        };
      } catch (error) {
        console.error("[UploadChunk] Error:", error);
        await failUploadSession(input.uploadId, error instanceof Error ? error.message : "Unknown error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload chunk",
        });
      }
    }),

  /**
   * Complete the upload
   */
  completeUpload: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getUploadSession(input.uploadId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to complete this upload",
        });
      }

      if (session.status !== "uploading") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Upload session is ${session.status}`,
        });
      }

      const uploadedChunks = Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [];
      if (uploadedChunks.length !== session.totalChunks) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Not all chunks uploaded: ${uploadedChunks.length}/${session.totalChunks}`,
        });
      }

      try {
        // Merge all chunks
        const uploadTempDir = path.join(TEMP_DIR, input.uploadId);
        const mergedFilePath = path.join(uploadTempDir, "merged");
        const writeStream = await fs.open(mergedFilePath, "w");

        for (let i = 0; i < session.totalChunks; i++) {
          const chunkPath = path.join(uploadTempDir, `chunk-${i}`);
          const chunkData = await fs.readFile(chunkPath);
          await writeStream.write(chunkData);
        }

        await writeStream.close();

        // Upload merged file to storage
        const mergedData = await fs.readFile(mergedFilePath);
        const { url, key } = await storagePut(
          session.s3Key!,
          mergedData,
          session.mimeType || "video/mp4"
        );

        // Clean up temp files
        await fs.rm(uploadTempDir, { recursive: true, force: true });

        // Mark session as completed
        await completeUploadSession(input.uploadId, url);

        return {
          success: true,
          url,
          key,
        };
      } catch (error) {
        console.error("[CompleteUpload] Error:", error);
        await failUploadSession(input.uploadId, error instanceof Error ? error.message : "Unknown error");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete upload",
        });
      }
    }),

  /**
   * Cancel an upload
   */
  cancelUpload: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await getUploadSession(input.uploadId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to cancel this upload",
        });
      }

      try {
        // Clean up temp files
        const uploadTempDir = path.join(TEMP_DIR, input.uploadId);
        await fs.rm(uploadTempDir, { recursive: true, force: true });

        // Mark session as cancelled
        await cancelUploadSession(input.uploadId);

        return { success: true };
      } catch (error) {
        console.error("[CancelUpload] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel upload",
        });
      }
    }),

  /**
   * Get upload session status
   */
  getUploadStatus: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const session = await getUploadSession(input.uploadId);
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Upload session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this upload",
        });
      }

      return {
        uploadId: session.uploadId,
        filename: session.filename,
        fileSize: session.fileSize,
        totalChunks: session.totalChunks,
        uploadedChunks: Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [],
        status: session.status,
        progress: session.progress,
        finalUrl: session.finalUrl,
        errorMessage: session.errorMessage,
      };
    }),
});
