import { int, bigint, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Video processing jobs table
 */
export const videoJobs = mysqlTable("video_jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Video info
  originalVideoUrl: text("original_video_url").notNull(),
  originalVideoKey: text("original_video_key").notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  fileSize: int("file_size").notNull(), // bytes
  duration: int("duration"), // seconds
  
  // User requirements
  userRequirement: text("user_requirement").notNull(),
  asrMethod: mysqlEnum("asr_method", ["whisper", "aliyun"]).default("whisper").notNull(),
  
  // Processing status
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  step: mysqlEnum("step", ["uploaded", "audio_extracted", "transcribed", "analyzed", "completed"]).default("uploaded"),
  progress: int("progress").default(0).notNull(), // 0-100
  currentStep: varchar("current_step", { length: 100 }),
  errorMessage: text("error_message"),
  
  // Intermediate results
  audioUrl: text("audio_url"),
  audioKey: text("audio_key"),
  
  // Results
  transcriptUrl: text("transcript_url"),
  transcriptKey: text("transcript_key"),
  finalVideoUrl: text("final_video_url"),
  finalVideoKey: text("final_video_key"),
  subtitleUrl: text("subtitle_url"),
  subtitleKey: text("subtitle_key"),
  
  // AI analysis results
  scriptPrompt: text("script_prompt"), // AI生成的脚本提示词
  overallScript: text("overall_script"), // 基于提示词生成的总体脚本
  contentStructure: json("content_structure").$type<Array<{
    id: number;
    speaker: string;
    topic: string;
    startTime: string;
    endTime: string;
    startSeconds: number;
    endSeconds: number;
    summary: string;
    keywords: string[];
  }>>(), // 内容结构标注
  selectedSegments: json("selected_segments").$type<Array<{
    start: number;
    end: number;
    reason: string;
  }>>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type VideoJob = typeof videoJobs.$inferSelect;
export type InsertVideoJob = typeof videoJobs.$inferInsert;

/**
 * Desktop app version management table
 */
export const appVersions = mysqlTable("app_versions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Version info
  version: varchar("version", { length: 20 }).notNull().unique(), // e.g., "1.2.0"
  minRequiredVersion: varchar("min_required_version", { length: 20 }).notNull(), // Minimum version required to use
  
  // Update control
  forceUpdate: int("force_update").default(0).notNull(), // 1 = force update, 0 = optional
  enabled: int("enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
  
  // Download info
  downloadUrlWindows: text("download_url_windows"),
  downloadUrlMac: text("download_url_mac"),
  downloadUrlLinux: text("download_url_linux"),
  
  // Release notes
  releaseNotes: text("release_notes"),
  releaseDate: timestamp("release_date").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AppVersion = typeof appVersions.$inferSelect;
export type InsertAppVersion = typeof appVersions.$inferInsert;

/**
 * Upload sessions table for chunked upload with resume capability
 */
export const uploadSessions = mysqlTable("upload_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  
  // Upload identification
  uploadId: varchar("upload_id", { length: 64 }).notNull().unique(), // Client-generated UUID
  filename: varchar("filename", { length: 255 }).notNull(),
  fileSize: int("file_size").notNull(), // Total file size in bytes (use int for files < 2GB)
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Chunking info
  chunkSize: int("chunk_size").notNull(), // Size of each chunk in bytes
  totalChunks: int("total_chunks").notNull(),
  uploadedChunks: json("uploaded_chunks").$type<number[]>().notNull(), // Array of uploaded chunk indices
  
  // S3 Multipart Upload
  s3UploadId: varchar("s3_upload_id", { length: 255 }), // S3 multipart upload ID
  s3Key: text("s3_key"), // Target S3 key
  s3Parts: json("s3_parts").$type<Array<{ PartNumber: number; ETag: string }>>(), // S3 part ETags
  
  // Status
  status: mysqlEnum("status", ["uploading", "completed", "failed", "cancelled"]).default("uploading").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100
  errorMessage: text("error_message"),
  
  // Final result
  finalUrl: text("final_url"), // URL after upload completes
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup after 24 hours
});

export type UploadSession = typeof uploadSessions.$inferSelect;
export type InsertUploadSession = typeof uploadSessions.$inferInsert;