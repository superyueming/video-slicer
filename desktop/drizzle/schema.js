"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSessions = exports.appVersions = exports.videoJobs = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    /**
     * Surrogate primary key. Auto-incremented numeric value managed by the database.
     * Use this for relations between tables.
     */
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
    openId: (0, mysql_core_1.varchar)("openId", { length: 64 }).notNull().unique(),
    name: (0, mysql_core_1.text)("name"),
    email: (0, mysql_core_1.varchar)("email", { length: 320 }),
    loginMethod: (0, mysql_core_1.varchar)("loginMethod", { length: 64 }),
    role: (0, mysql_core_1.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: (0, mysql_core_1.timestamp)("lastSignedIn").defaultNow().notNull(),
});
/**
 * Video processing jobs table
 */
exports.videoJobs = (0, mysql_core_1.mysqlTable)("video_jobs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    // Video info
    originalVideoUrl: (0, mysql_core_1.text)("original_video_url").notNull(),
    originalVideoKey: (0, mysql_core_1.text)("original_video_key").notNull(),
    originalFilename: (0, mysql_core_1.varchar)("original_filename", { length: 255 }).notNull(),
    fileSize: (0, mysql_core_1.int)("file_size").notNull(), // bytes
    duration: (0, mysql_core_1.int)("duration"), // seconds
    // User requirements
    userRequirement: (0, mysql_core_1.text)("user_requirement").notNull(),
    asrMethod: (0, mysql_core_1.mysqlEnum)("asr_method", ["whisper", "aliyun"]).default("whisper").notNull(),
    // Processing status
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
    step: (0, mysql_core_1.mysqlEnum)("step", ["uploaded", "audio_extracted", "transcribed", "analyzed", "completed"]).default("uploaded"),
    progress: (0, mysql_core_1.int)("progress").default(0).notNull(), // 0-100
    currentStep: (0, mysql_core_1.varchar)("current_step", { length: 100 }),
    errorMessage: (0, mysql_core_1.text)("error_message"),
    // Intermediate results
    audioUrl: (0, mysql_core_1.text)("audio_url"),
    audioKey: (0, mysql_core_1.text)("audio_key"),
    // Results
    transcriptUrl: (0, mysql_core_1.text)("transcript_url"),
    transcriptKey: (0, mysql_core_1.text)("transcript_key"),
    finalVideoUrl: (0, mysql_core_1.text)("final_video_url"),
    finalVideoKey: (0, mysql_core_1.text)("final_video_key"),
    subtitleUrl: (0, mysql_core_1.text)("subtitle_url"),
    subtitleKey: (0, mysql_core_1.text)("subtitle_key"),
    // AI analysis results
    scriptPrompt: (0, mysql_core_1.text)("script_prompt"), // AI生成的脚本提示词
    overallScript: (0, mysql_core_1.text)("overall_script"), // 基于提示词生成的总体脚本
    contentStructure: (0, mysql_core_1.json)("content_structure").$type(), // 内容结构标注
    selectedSegments: (0, mysql_core_1.json)("selected_segments").$type(),
    // Timestamps
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
    completedAt: (0, mysql_core_1.timestamp)("completed_at"),
});
/**
 * Desktop app version management table
 */
exports.appVersions = (0, mysql_core_1.mysqlTable)("app_versions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    // Version info
    version: (0, mysql_core_1.varchar)("version", { length: 20 }).notNull().unique(), // e.g., "1.2.0"
    minRequiredVersion: (0, mysql_core_1.varchar)("min_required_version", { length: 20 }).notNull(), // Minimum version required to use
    // Update control
    forceUpdate: (0, mysql_core_1.int)("force_update").default(0).notNull(), // 1 = force update, 0 = optional
    enabled: (0, mysql_core_1.int)("enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
    // Download info
    downloadUrlWindows: (0, mysql_core_1.text)("download_url_windows"),
    downloadUrlMac: (0, mysql_core_1.text)("download_url_mac"),
    downloadUrlLinux: (0, mysql_core_1.text)("download_url_linux"),
    // Release notes
    releaseNotes: (0, mysql_core_1.text)("release_notes"),
    releaseDate: (0, mysql_core_1.timestamp)("release_date").notNull(),
    // Metadata
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
});
/**
 * Upload sessions table for chunked upload with resume capability
 */
exports.uploadSessions = (0, mysql_core_1.mysqlTable)("upload_sessions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("user_id").notNull(),
    // Upload identification
    uploadId: (0, mysql_core_1.varchar)("upload_id", { length: 64 }).notNull().unique(), // Client-generated UUID
    filename: (0, mysql_core_1.varchar)("filename", { length: 255 }).notNull(),
    fileSize: (0, mysql_core_1.int)("file_size").notNull(), // Total file size in bytes (use int for files < 2GB)
    mimeType: (0, mysql_core_1.varchar)("mime_type", { length: 100 }),
    // Chunking info
    chunkSize: (0, mysql_core_1.int)("chunk_size").notNull(), // Size of each chunk in bytes
    totalChunks: (0, mysql_core_1.int)("total_chunks").notNull(),
    uploadedChunks: (0, mysql_core_1.json)("uploaded_chunks").$type().notNull(), // Array of uploaded chunk indices
    // S3 Multipart Upload
    s3UploadId: (0, mysql_core_1.varchar)("s3_upload_id", { length: 255 }), // S3 multipart upload ID
    s3Key: (0, mysql_core_1.text)("s3_key"), // Target S3 key
    s3Parts: (0, mysql_core_1.json)("s3_parts").$type(), // S3 part ETags
    // Status
    status: (0, mysql_core_1.mysqlEnum)("status", ["uploading", "completed", "failed", "cancelled"]).default("uploading").notNull(),
    progress: (0, mysql_core_1.int)("progress").default(0).notNull(), // 0-100
    errorMessage: (0, mysql_core_1.text)("error_message"),
    // Final result
    finalUrl: (0, mysql_core_1.text)("final_url"), // URL after upload completes
    // Timestamps
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow().notNull(),
    expiresAt: (0, mysql_core_1.timestamp)("expires_at").notNull(), // Auto-cleanup after 24 hours
});
