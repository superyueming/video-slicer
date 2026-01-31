var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";
var users, videoJobs, appVersions, uploadSessions;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
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
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    videoJobs = mysqlTable("video_jobs", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull(),
      // Video info
      originalVideoUrl: text("original_video_url").notNull(),
      originalVideoKey: text("original_video_key").notNull(),
      originalFilename: varchar("original_filename", { length: 255 }).notNull(),
      fileSize: int("file_size").notNull(),
      // bytes
      duration: int("duration"),
      // seconds
      // User requirements
      userRequirement: text("user_requirement").notNull(),
      asrMethod: mysqlEnum("asr_method", ["whisper", "aliyun"]).default("whisper").notNull(),
      // Processing status
      status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
      step: mysqlEnum("step", ["uploaded", "audio_extracted", "transcribed", "analyzed", "completed"]).default("uploaded"),
      progress: int("progress").default(0).notNull(),
      // 0-100
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
      scriptPrompt: text("script_prompt"),
      // AI生成的脚本提示词
      overallScript: text("overall_script"),
      // 基于提示词生成的总体脚本
      contentStructure: json("content_structure").$type(),
      // 内容结构标注
      selectedSegments: json("selected_segments").$type(),
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
      completedAt: timestamp("completed_at")
    });
    appVersions = mysqlTable("app_versions", {
      id: int("id").autoincrement().primaryKey(),
      // Version info
      version: varchar("version", { length: 20 }).notNull().unique(),
      // e.g., "1.2.0"
      minRequiredVersion: varchar("min_required_version", { length: 20 }).notNull(),
      // Minimum version required to use
      // Update control
      forceUpdate: int("force_update").default(0).notNull(),
      // 1 = force update, 0 = optional
      enabled: int("enabled").default(1).notNull(),
      // 1 = enabled, 0 = disabled
      // Download info
      downloadUrlWindows: text("download_url_windows"),
      downloadUrlMac: text("download_url_mac"),
      downloadUrlLinux: text("download_url_linux"),
      // Release notes
      releaseNotes: text("release_notes"),
      releaseDate: timestamp("release_date").notNull(),
      // Metadata
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
    });
    uploadSessions = mysqlTable("upload_sessions", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("user_id").notNull(),
      // Upload identification
      uploadId: varchar("upload_id", { length: 64 }).notNull().unique(),
      // Client-generated UUID
      filename: varchar("filename", { length: 255 }).notNull(),
      fileSize: int("file_size").notNull(),
      // Total file size in bytes (use int for files < 2GB)
      mimeType: varchar("mime_type", { length: 100 }),
      // Chunking info
      chunkSize: int("chunk_size").notNull(),
      // Size of each chunk in bytes
      totalChunks: int("total_chunks").notNull(),
      uploadedChunks: json("uploaded_chunks").$type().notNull(),
      // Array of uploaded chunk indices
      // S3 Multipart Upload
      s3UploadId: varchar("s3_upload_id", { length: 255 }),
      // S3 multipart upload ID
      s3Key: text("s3_key"),
      // Target S3 key
      s3Parts: json("s3_parts").$type(),
      // S3 part ETags
      // Status
      status: mysqlEnum("status", ["uploading", "completed", "failed", "cancelled"]).default("uploading").notNull(),
      progress: int("progress").default(0).notNull(),
      // 0-100
      errorMessage: text("error_message"),
      // Final result
      finalUrl: text("final_url"),
      // URL after upload completes
      // Timestamps
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
      expiresAt: timestamp("expires_at").notNull()
      // Auto-cleanup after 24 hours
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  getDb: () => getDb,
  getOrCreateDesktopUser: () => getOrCreateDesktopUser,
  getUserByOpenId: () => getUserByOpenId,
  upsertUser: () => upsertUser
});
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getOrCreateDesktopUser() {
  const DESKTOP_USER_OPEN_ID = "desktop-user";
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot get desktop user: database not available");
  }
  let user = await getUserByOpenId(DESKTOP_USER_OPEN_ID);
  if (!user) {
    await upsertUser({
      openId: DESKTOP_USER_OPEN_ID,
      name: "Desktop User",
      email: null,
      loginMethod: "desktop",
      role: "admin",
      // Desktop user has admin privileges
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    user = await getUserByOpenId(DESKTOP_USER_OPEN_ID);
  }
  if (!user) {
    throw new Error("[Database] Failed to create desktop user");
  }
  return user;
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/videoDb.ts
import { eq as eq2, desc } from "drizzle-orm";
async function createVideoJob(job) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(videoJobs).values(job);
  return Number(result[0].insertId);
}
async function getVideoJob(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(videoJobs).where(eq2(videoJobs.id, id)).limit(1);
  return result[0];
}
async function getUserVideoJobs(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(videoJobs).where(eq2(videoJobs.userId, userId)).orderBy(desc(videoJobs.createdAt));
}
async function updateVideoJob(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(videoJobs).set(updates).where(eq2(videoJobs.id, id));
}
async function updateJobProgress(id, progress, currentStep) {
  await updateVideoJob(id, { progress, currentStep });
}
async function markJobCompleted(id, results) {
  await updateVideoJob(id, {
    status: "completed",
    progress: 100,
    completedAt: /* @__PURE__ */ new Date(),
    ...results
  });
}
async function markJobFailed(id, errorMessage) {
  await updateVideoJob(id, {
    status: "failed",
    errorMessage
  });
}
var init_videoDb = __esm({
  "server/videoDb.ts"() {
    "use strict";
    init_schema();
    init_db();
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storagePut: () => storagePut
});
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
async function buildDownloadUrl(baseUrl, relKey, apiKey) {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey)
  });
  return (await response.json()).url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
async function storageGet(relKey) {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey)
  };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/localStorage.ts
import fs from "fs/promises";
import path from "path";
function getStorageDir() {
  const storageDir = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), "storage");
  return storageDir;
}
async function ensureStorageDir() {
  const storageDir = getStorageDir();
  try {
    await fs.access(storageDir);
  } catch {
    await fs.mkdir(storageDir, { recursive: true });
  }
}
function normalizeKey2(relKey) {
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "");
}
function getFilePath(relKey) {
  const storageDir = getStorageDir();
  const normalizedKey = normalizeKey2(relKey);
  return path.join(storageDir, normalizedKey);
}
function getFileUrl(relKey) {
  const normalizedKey = normalizeKey2(relKey);
  return `/storage/${normalizedKey}`;
}
async function storagePut2(relKey, data, contentType = "application/octet-stream") {
  await ensureStorageDir();
  const key = normalizeKey2(relKey);
  const filePath = getFilePath(key);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  const url = getFileUrl(key);
  return { key, url };
}
var init_localStorage = __esm({
  "server/localStorage.ts"() {
    "use strict";
  }
});

// server/storageAdapter.ts
async function storagePut3(relKey, data, contentType = "application/octet-stream") {
  if (isDesktopMode) {
    return storagePut2(relKey, data, contentType);
  } else {
    return storagePut(relKey, data, contentType);
  }
}
var isDesktopMode;
var init_storageAdapter = __esm({
  "server/storageAdapter.ts"() {
    "use strict";
    init_storage();
    init_localStorage();
    isDesktopMode = process.env.DESKTOP_MODE === "true";
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  invokeLLM: () => invokeLLM
});
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
    assertApiKey = () => {
      if (!ENV.forgeApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
    };
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// server/_core/voiceTranscription.ts
var voiceTranscription_exports = {};
__export(voiceTranscription_exports, {
  transcribeAudio: () => transcribeAudio
});
async function transcribeAudio(options) {
  try {
    if (!ENV.forgeApiUrl) {
      return {
        error: "Voice transcription service is not configured",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_URL is not set"
      };
    }
    if (!ENV.forgeApiKey) {
      return {
        error: "Voice transcription service authentication is missing",
        code: "SERVICE_ERROR",
        details: "BUILT_IN_FORGE_API_KEY is not set"
      };
    }
    let audioBuffer;
    let mimeType;
    try {
      const response2 = await fetch(options.audioUrl);
      if (!response2.ok) {
        return {
          error: "Failed to download audio file",
          code: "INVALID_FORMAT",
          details: `HTTP ${response2.status}: ${response2.statusText}`
        };
      }
      audioBuffer = Buffer.from(await response2.arrayBuffer());
      mimeType = response2.headers.get("content-type") || "audio/mpeg";
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 16) {
        return {
          error: "Audio file exceeds maximum size limit",
          code: "FILE_TOO_LARGE",
          details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 16MB`
        };
      }
    } catch (error) {
      return {
        error: "Failed to fetch audio file",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }
    const formData = new FormData();
    const filename = `audio.${getFileExtension(mimeType)}`;
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append("file", audioBlob, filename);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    const prompt = options.prompt || (options.language ? `Transcribe the user's voice to text, the user's working language is ${getLanguageName(options.language)}` : "Transcribe the user's voice to text");
    formData.append("prompt", prompt);
    const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL(
      "v1/audio/transcriptions",
      baseUrl
    ).toString();
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "Accept-Encoding": "identity"
      },
      body: formData
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        error: "Transcription service request failed",
        code: "TRANSCRIPTION_FAILED",
        details: `${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ""}`
      };
    }
    const whisperResponse = await response.json();
    if (!whisperResponse.text || typeof whisperResponse.text !== "string") {
      return {
        error: "Invalid transcription response",
        code: "SERVICE_ERROR",
        details: "Transcription service returned an invalid response format"
      };
    }
    return whisperResponse;
  } catch (error) {
    return {
      error: "Voice transcription failed",
      code: "SERVICE_ERROR",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}
function getFileExtension(mimeType) {
  const mimeToExt = {
    "audio/webm": "webm",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a"
  };
  return mimeToExt[mimeType] || "audio";
}
function getLanguageName(langCode) {
  const langMap = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "nl": "Dutch",
    "pl": "Polish",
    "tr": "Turkish",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish"
  };
  return langMap[langCode] || langCode;
}
var init_voiceTranscription = __esm({
  "server/_core/voiceTranscription.ts"() {
    "use strict";
    init_env();
  }
});

// server/videoService.ts
var videoService_exports = {};
__export(videoService_exports, {
  analyzeContent: () => analyzeContent,
  burnSubtitles: () => burnSubtitles,
  cleanupTempFiles: () => cleanupTempFiles,
  clipVideos: () => clipVideos,
  concatenateVideos: () => concatenateVideos,
  cutVideoSegment: () => cutVideoSegment,
  extractAudio: () => extractAudio,
  generateSRT: () => generateSRT,
  transcribeAudio: () => transcribeAudio2,
  uploadToS3: () => uploadToS3
});
import { exec } from "child_process";
import { promisify } from "util";
import path2 from "path";
import { fileURLToPath } from "url";
import fs2 from "fs/promises";
async function runPythonCommand(command, ...args) {
  const escapedArgs = args.map((arg) => {
    if (typeof arg === "string" && arg.includes("'")) {
      return `"${arg.replace(/"/g, '\\"')}"`;
    }
    return `'${arg}'`;
  });
  const cmd = `python3.11 ${PYTHON_SCRIPT} ${command} ${escapedArgs.join(" ")}`;
  try {
    const cleanEnv = { ...process.env };
    delete cleanEnv.PYTHONPATH;
    delete cleanEnv.PYTHONHOME;
    delete cleanEnv.VIRTUAL_ENV;
    const { stdout, stderr } = await execAsync(cmd, {
      maxBuffer: 50 * 1024 * 1024,
      env: cleanEnv
    });
    console.log("Python stdout:", stdout);
    if (stderr && !stderr.includes("Warning")) {
      console.error("Python stderr:", stderr);
    }
    const result = JSON.parse(stdout);
    if (!result.success && result.error) {
      console.error("Python script error:", result.error);
    }
    return result;
  } catch (error) {
    console.error("Python command failed:", error);
    throw new Error(`Video processing failed: ${error.message}`);
  }
}
async function extractAudio(videoPath, outputAudioPath) {
  const result = await runPythonCommand("extract_audio", videoPath, outputAudioPath);
  if (!result.success) {
    throw new Error("Failed to extract audio from video");
  }
}
async function transcribeAudio2(audioPath) {
  const { transcribeAudio: transcribeAudioAPI } = await Promise.resolve().then(() => (init_voiceTranscription(), voiceTranscription_exports));
  const { storagePut: storagePut4 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
  const fs10 = await import("fs/promises");
  const audioBuffer = await fs10.readFile(audioPath);
  const audioKey = `temp-audio/${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
  const { url: audioUrl } = await storagePut4(audioKey, audioBuffer, "audio/wav");
  const result = await transcribeAudioAPI({
    audioUrl,
    language: "zh",
    prompt: "\u8BF7\u8F6C\u5F55\u8FD9\u6BB5\u4E2D\u6587\u6F14\u8BB2\u5185\u5BB9"
  });
  if ("error" in result) {
    throw new Error(`Transcription failed: ${result.error}`);
  }
  return result;
}
async function analyzeContent(transcript, userRequirement) {
  let fullText = "";
  for (let i = 0; i < transcript.segments.length; i++) {
    const seg = transcript.segments[i];
    fullText += `[\u7247\u6BB5${i}] ${seg.start.toFixed(1)}s-${seg.end.toFixed(1)}s: ${seg.text.trim()}
`;
  }
  const prompt = `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u5E08\u3002\u8BF7\u5206\u6790\u4EE5\u4E0B\u6F14\u8BB2\u6587\u672C\uFF0C\u6839\u636E\u7528\u6237\u9700\u6C42\u9009\u62E9\u5408\u9002\u7684\u7247\u6BB5\u3002

\u6F14\u8BB2\u6587\u672C\uFF08\u5E26\u65F6\u95F4\u6233\uFF09\uFF1A
${fullText}

\u7528\u6237\u9700\u6C42\uFF1A
${userRequirement}

\u8BF7\u4ED4\u7EC6\u5206\u6790\u6587\u672C\u5185\u5BB9\uFF0C\u9009\u62E9\u6700\u7B26\u5408\u7528\u6237\u9700\u6C42\u7684\u7247\u6BB5\u3002\u4F60\u9700\u8981\uFF1A
1. \u7406\u89E3\u7528\u6237\u7684\u5177\u4F53\u9700\u6C42
2. \u627E\u51FA\u6700\u76F8\u5173\u3001\u6700\u7CBE\u5F69\u7684\u7247\u6BB5
3. \u786E\u4FDD\u9009\u62E9\u7684\u7247\u6BB5\u8BED\u4E49\u5B8C\u6574
4. \u6309\u7167\u5408\u7406\u7684\u987A\u5E8F\u6392\u5217\u7247\u6BB5

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\u7ED3\u679C\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
{
  "selected_segments": [
    {
      "segment_ids": [0, 1, 2],
      "start": 10.5,
      "end": 45.3,
      "reason": "\u8FD9\u6BB5\u5185\u5BB9\u8BB2\u8FF0\u4E86..."
    }
  ],
  "arrangement_reason": "\u6211\u9009\u62E9\u8FD9\u6837\u7684\u987A\u5E8F\u662F\u56E0\u4E3A..."
}

\u6CE8\u610F\uFF1A
- segment_ids\u662F\u8FDE\u7EED\u7247\u6BB5\u7684ID\u5217\u8868
- start\u548Cend\u662F\u8BE5\u7EC4\u7247\u6BB5\u7684\u8D77\u6B62\u65F6\u95F4
- \u53EF\u4EE5\u9009\u62E9\u591A\u7EC4\u7247\u6BB5
- \u786E\u4FDD\u65F6\u95F4\u6233\u51C6\u786E`;
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u5E08\uFF0C\u64C5\u957F\u7406\u89E3\u7528\u6237\u9700\u6C42\u5E76\u9009\u62E9\u6700\u5408\u9002\u7684\u5185\u5BB9\u7247\u6BB5\u3002" },
      { role: "user", content: prompt }
    ],
    max_tokens: 2e3
  });
  const content = response.choices[0].message.content;
  let resultText = typeof content === "string" ? content.trim() : JSON.stringify(content);
  if (resultText.includes("```json")) {
    const jsonStart = resultText.indexOf("```json") + 7;
    const jsonEnd = resultText.indexOf("```", jsonStart);
    resultText = resultText.substring(jsonStart, jsonEnd).trim();
  } else if (resultText.includes("```")) {
    const jsonStart = resultText.indexOf("```") + 3;
    const jsonEnd = resultText.indexOf("```", jsonStart);
    resultText = resultText.substring(jsonStart, jsonEnd).trim();
  }
  const result = JSON.parse(resultText);
  return result.selected_segments;
}
async function cutVideoSegment(videoPath, start, end, outputPath) {
  const result = await runPythonCommand(
    "cut_segment",
    videoPath,
    start.toString(),
    end.toString(),
    outputPath
  );
  if (!result.success) {
    throw new Error("Failed to cut video segment");
  }
}
async function concatenateVideos(videoPaths, outputPath) {
  const result = await runPythonCommand(
    "concatenate",
    JSON.stringify(videoPaths),
    outputPath
  );
  if (!result.success) {
    throw new Error("Failed to concatenate videos");
  }
}
async function generateSRT(segments, transcript, outputPath) {
  const result = await runPythonCommand(
    "generate_srt",
    JSON.stringify(segments),
    JSON.stringify(transcript),
    outputPath
  );
  if (!result.success) {
    throw new Error("Failed to generate SRT");
  }
}
async function burnSubtitles(videoPath, srtPath, outputPath) {
  const result = await runPythonCommand("burn_subtitles", videoPath, srtPath, outputPath);
  if (!result.success) {
    throw new Error("Failed to burn subtitles");
  }
}
async function uploadToS3(filePath, key, contentType) {
  const fileBuffer = await fs2.readFile(filePath);
  const result = await storagePut3(key, fileBuffer, contentType);
  return { url: result.url, key };
}
async function cleanupTempFiles(files) {
  for (const file of files) {
    try {
      await fs2.unlink(file);
    } catch (error) {
      console.warn(`Failed to delete temp file ${file}:`, error);
    }
  }
}
async function clipVideos(videoPath, segments) {
  const clipPaths = [];
  const path11 = await import("path");
  const dir = path11.dirname(videoPath);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const clipPath = path11.join(dir, `clip-${i + 1}.mp4`);
    const duration = seg.end - seg.start;
    const command = `ffmpeg -ss ${seg.start} -i "${videoPath}" -t ${duration} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${clipPath}" -y`;
    console.log(`[ClipVideos] Clipping segment ${i + 1}/${segments.length}: ${seg.start}s - ${seg.end}s`);
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`[ClipVideos] Error clipping segment ${i + 1}:`, stderr);
          reject(new Error(`Failed to clip segment ${i + 1}: ${error.message}`));
        } else {
          exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${clipPath}"`, (probeError, probeStdout) => {
            if (!probeError) {
              const actualDuration = parseFloat(probeStdout.trim());
              console.log(`[ClipVideos] Clip ${i + 1} actual duration: ${actualDuration.toFixed(2)}s (expected: ${duration.toFixed(2)}s)`);
            }
            resolve();
          });
        }
      });
    });
    clipPaths.push(clipPath);
  }
  return clipPaths;
}
var __filename, __dirname, execAsync, PYTHON_SCRIPT;
var init_videoService = __esm({
  "server/videoService.ts"() {
    "use strict";
    init_storageAdapter();
    init_llm();
    __filename = fileURLToPath(import.meta.url);
    __dirname = path2.dirname(__filename);
    execAsync = promisify(exec);
    PYTHON_SCRIPT = path2.join(__dirname, "video_processor.py");
  }
});

// server/srtGenerator.ts
function secondsToSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor(seconds % 1 * 1e3);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
}
function generateSRT2(segments, timeOffset = 0) {
  const srtLines = [];
  segments.forEach((segment, index) => {
    srtLines.push((index + 1).toString());
    const startTime = secondsToSRTTime(segment.start + timeOffset);
    const endTime = secondsToSRTTime(segment.end + timeOffset);
    srtLines.push(`${startTime} --> ${endTime}`);
    srtLines.push(segment.text.trim());
    srtLines.push("");
  });
  return srtLines.join("\n");
}
var init_srtGenerator = __esm({
  "server/srtGenerator.ts"() {
    "use strict";
  }
});

// server/audioSegmentation.ts
import { exec as exec2 } from "child_process";
import { promisify as promisify2 } from "util";
import fs3 from "fs/promises";
import path3 from "path";
async function splitAudioIntoSegments(audioPath, segmentDuration = 3360) {
  const dir = path3.dirname(audioPath);
  const ext = path3.extname(audioPath);
  const basename = path3.basename(audioPath, ext);
  const outputPattern = path3.join(dir, `${basename}-segment-%03d${ext}`);
  const cmd = `ffmpeg -i "${audioPath}" -f segment -segment_time ${segmentDuration} -c copy "${outputPattern}"`;
  try {
    await execAsync2(cmd, { maxBuffer: 50 * 1024 * 1024 });
    const files = await fs3.readdir(dir);
    const segmentFiles = files.filter((f) => f.startsWith(`${basename}-segment-`) && f.endsWith(ext)).map((f) => path3.join(dir, f)).sort();
    console.log(`[AudioSegmentation] Split audio into ${segmentFiles.length} segments`);
    return segmentFiles;
  } catch (error) {
    console.error("[AudioSegmentation] Failed to split audio:", error);
    throw new Error(`Audio segmentation failed: ${error.message}`);
  }
}
var execAsync2;
var init_audioSegmentation = __esm({
  "server/audioSegmentation.ts"() {
    "use strict";
    execAsync2 = promisify2(exec2);
  }
});

// server/stepProcessor.ts
var stepProcessor_exports = {};
__export(stepProcessor_exports, {
  analyzeContentStep: () => analyzeContentStep,
  analyzeWithCustomPrompt: () => analyzeWithCustomPrompt,
  annotateStructureStep: () => annotateStructureStep,
  extractAudioStep: () => extractAudioStep,
  generateClipsStep: () => generateClipsStep,
  generatePromptOnly: () => generatePromptOnly,
  transcribeAudioStep: () => transcribeAudioStep
});
import { promises as fs4 } from "fs";
import path4 from "path";
import os from "os";
import { eq as eq3 } from "drizzle-orm";
async function extractAudioStep(jobId) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.step !== "uploaded") {
    console.log(`[ExtractAudio] Re-processing job ${jobId} from step '${job.step}'`);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      step: "uploaded",
      progress: 0,
      currentStep: "\u51C6\u5907\u91CD\u65B0\u5904\u7406",
      status: "pending"
    }).where(eq3(videoJobs.id, jobId));
  }
  const tempDir = await fs4.mkdtemp(path4.join(os.tmpdir(), `audio-extract-${jobId}-`));
  const tempFiles = [];
  try {
    await updateJobProgress(jobId, 10, "\u6B63\u5728\u4E0B\u8F7D\u89C6\u9891...");
    const videoPath = path4.join(tempDir, "input.mp4");
    console.log(`[ExtractAudio] Downloading video from: ${job.originalVideoUrl}`);
    const videoResponse = await fetch(job.originalVideoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    console.log(`[ExtractAudio] Downloaded video size: ${videoBuffer.length} bytes`);
    await fs4.writeFile(videoPath, videoBuffer);
    tempFiles.push(videoPath);
    await updateJobProgress(jobId, 50, "\u6B63\u5728\u63D0\u53D6\u97F3\u9891...");
    const audioPath = path4.join(tempDir, "audio.mp3");
    await extractAudio(videoPath, audioPath);
    tempFiles.push(audioPath);
    await updateJobProgress(jobId, 80, "\u6B63\u5728\u4FDD\u5B58\u97F3\u9891...");
    const audioKey = `audio/${job.userId}/${jobId}-audio.mp3`;
    const audioBuffer = await fs4.readFile(audioPath);
    const { url: audioUrl } = await storagePut3(audioKey, audioBuffer, "audio/mpeg");
    console.log(`[ExtractAudio] Audio uploaded to: ${audioUrl}`);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      audioUrl,
      audioKey,
      step: "audio_extracted",
      progress: 100,
      currentStep: "\u97F3\u9891\u63D0\u53D6\u5B8C\u6210",
      status: "completed"
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[ExtractAudio] Job ${jobId} audio extraction completed`);
  } catch (error) {
    console.error(`[ExtractAudio] Job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(videoJobs).set({
        status: "failed",
        errorMessage: error.message,
        currentStep: "\u97F3\u9891\u63D0\u53D6\u5931\u8D25"
      }).where(eq3(videoJobs.id, jobId));
    }
    throw error;
  } finally {
    for (const file of tempFiles) {
      try {
        await fs4.unlink(file);
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err);
      }
    }
    try {
      await fs4.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${tempDir}:`, error);
    }
  }
}
async function transcribeAudioStep(jobId) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.step !== "audio_extracted") {
    console.log(`[Transcribe] Re-processing job ${jobId} from step '${job.step}'`);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      step: "audio_extracted",
      progress: 0,
      currentStep: "\u51C6\u5907\u91CD\u65B0\u5904\u7406",
      status: "pending"
    }).where(eq3(videoJobs.id, jobId));
  }
  if (!job.audioUrl) {
    throw new Error("Audio URL not found");
  }
  const tempDir = await fs4.mkdtemp(path4.join(os.tmpdir(), `transcribe-${jobId}-`));
  const tempFiles = [];
  try {
    await updateJobProgress(jobId, 10, "\u6B63\u5728\u4E0B\u8F7D\u97F3\u9891...");
    const audioPath = path4.join(tempDir, "audio.mp3");
    const audioResponse = await fetch(job.audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    await fs4.writeFile(audioPath, audioBuffer);
    tempFiles.push(audioPath);
    const audioStats = await fs4.stat(audioPath);
    const audioSizeMB = audioStats.size / (1024 * 1024);
    console.log(`[Transcribe] Audio file size: ${audioSizeMB.toFixed(2)} MB`);
    let transcriptText;
    if (audioSizeMB > 15) {
      console.log(`[Transcribe] Audio exceeds 15MB, splitting into segments...`);
      await updateJobProgress(jobId, 20, "\u97F3\u9891\u6587\u4EF6\u8F83\u5927\uFF0C\u6B63\u5728\u5206\u6BB5\u5904\u7406...");
      const segmentPaths = await splitAudioIntoSegments(audioPath, 3360);
      console.log(`[Transcribe] Split into ${segmentPaths.length} segments`);
      const segmentResults = [];
      for (let i = 0; i < segmentPaths.length; i++) {
        const segmentPath = segmentPaths[i];
        const progress = 20 + Math.floor(i / segmentPaths.length * 60);
        await updateJobProgress(jobId, progress, `\u6B63\u5728\u8F6C\u5F55\u7B2C ${i + 1}/${segmentPaths.length} \u6BB5...`);
        const segmentTranscript = await transcribeAudio2(segmentPath);
        const srt = generateSRT2(segmentTranscript.segments, i * 3360);
        segmentResults.push({
          srt,
          duration: segmentTranscript.duration,
          response: segmentTranscript
        });
        await fs4.unlink(segmentPath);
      }
      transcriptText = segmentResults.map((r) => r.srt).join("\n");
      console.log(`[Transcribe] Merged ${segmentResults.length} segment SRT files`);
    } else {
      await updateJobProgress(jobId, 30, "\u6B63\u5728\u8F6C\u5F55\u97F3\u9891...");
      const transcript = await transcribeAudio2(audioPath);
      transcriptText = generateSRT2(transcript.segments);
    }
    await updateJobProgress(jobId, 80, "\u6B63\u5728\u4FDD\u5B58\u5B57\u5E55\u6587\u4EF6...");
    const transcriptPath = path4.join(tempDir, "transcript.srt");
    await fs4.writeFile(transcriptPath, transcriptText, "utf-8");
    tempFiles.push(transcriptPath);
    const transcriptKey = `transcripts/${job.userId}/${jobId}-transcript.srt`;
    const transcriptBuffer = await fs4.readFile(transcriptPath);
    const { url: transcriptUrl } = await storagePut3(transcriptKey, transcriptBuffer, "text/plain; charset=utf-8");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      transcriptUrl,
      transcriptKey,
      step: "transcribed",
      progress: 100,
      currentStep: "\u8F6C\u5F55\u5B8C\u6210",
      status: "completed"
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[Transcribe] Job ${jobId} transcription completed`);
  } catch (error) {
    console.error(`[Transcribe] Job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(videoJobs).set({
        status: "failed",
        errorMessage: error.message,
        currentStep: "\u8F6C\u5F55\u5931\u8D25"
      }).where(eq3(videoJobs.id, jobId));
    }
    throw error;
  } finally {
    for (const file of tempFiles) {
      try {
        await fs4.unlink(file);
      } catch (err) {
        console.warn(`Failed to delete temp file ${file}:`, err);
      }
    }
    try {
      await fs4.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${tempDir}:`, error);
    }
  }
}
async function analyzeContentStep(jobId) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.step !== "transcribed") {
    console.log(`[Analyze] Re-processing job ${jobId} from step '${job.step}'`);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      step: "transcribed",
      progress: 0,
      currentStep: "\u51C6\u5907\u91CD\u65B0\u5206\u6790",
      status: "pending"
    }).where(eq3(videoJobs.id, jobId));
  }
  if (!job.transcriptUrl) {
    throw new Error("Transcript URL not found");
  }
  try {
    await updateJobProgress(jobId, 5, "\u6B63\u5728\u4E0B\u8F7D\u5B57\u5E55\u6587\u4EF6...");
    const transcriptResponse = await fetch(job.transcriptUrl);
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to download transcript: ${transcriptResponse.status}`);
    }
    const srtContent = await transcriptResponse.text();
    console.log(`[Analyze] Downloaded SRT file, length: ${srtContent.length}`);
    const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
    await updateJobProgress(jobId, 15, "\u6B63\u5728\u751F\u6210\u5206\u6790\u63D0\u793A\u8BCD...");
    console.log(`[Analyze] Generating script prompt for job ${jobId}`);
    const promptGenerationRequest = `\u4F60\u662F\u4E00\u4E2A\u89C6\u9891\u5206\u6790\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u7528\u6237\u7684\u9700\u6C42\uFF0C\u751F\u6210\u4E00\u4E2A\u8BE6\u7EC6\u7684\u5206\u6790\u63D0\u793A\u8BCD\uFF0C\u7528\u4E8E\u6307\u5BFC\u540E\u7EED\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u548C\u7247\u6BB5\u9009\u62E9\u3002

\u7528\u6237\u9700\u6C42\uFF1A${job.userRequirement}

\u8BF7\u751F\u6210\u4E00\u4E2A\u5305\u542B\u4EE5\u4E0B\u5143\u7D20\u7684\u5206\u6790\u63D0\u793A\u8BCD\uFF1A

1. **\u89C6\u9891\u7C7B\u578B\u8BC6\u522B**\uFF1A\u5224\u65AD\u8FD9\u662F\u4EC0\u4E48\u7C7B\u578B\u7684\u89C6\u9891\uFF08\u4F1A\u8BAE\u6F14\u8BB2\u3001\u6559\u5B66\u89C6\u9891\u3001\u8BBF\u8C08\u3001Vlog\u7B49\uFF09

2. **\u526A\u8F91\u76EE\u6807\u5B9A\u4F4D**\uFF1A\u660E\u786E\u9700\u8981\u63D0\u53D6\u4EC0\u4E48\u5185\u5BB9\uFF08\u7279\u5B9A\u4EBA\u7269\u53D1\u8A00\u3001\u7CBE\u534E\u89C2\u70B9\u5408\u96C6\u3001\u6559\u7A0B\u6B65\u9AA4\u7B49\uFF09

3. **\u5185\u5BB9\u91CD\u70B9\u65B9\u5411**\uFF1A\u9700\u8981\u5173\u6CE8\u7684\u5185\u5BB9\u4E3B\u9898\uFF08\u6280\u672F\u7EC6\u8282\u3001\u5546\u4E1A\u7B56\u7565\u3001\u6848\u4F8B\u5206\u4EAB\u7B49\uFF09

4. **\u526A\u8F91\u8282\u594F\u5EFA\u8BAE**\uFF08\u5FC5\u987B\u660E\u786E\u6307\u5B9A\u5177\u4F53\u6570\u503C\uFF09\uFF1A
   - \u7247\u6BB5\u65F6\u957F\uFF1A\u5FC5\u987B\u660E\u786E\u6307\u5B9A\uFF08\u4F8B\u5982\uFF1A\u6BCF\u4E2A\u7247\u6BB530\u79D2\u3001\u6BCF\u4E2A\u7247\u6BB51-2\u5206\u949F\u3001\u6BCF\u4E2A\u7247\u6BB53-5\u5206\u949F\uFF09
   - \u7247\u6BB5\u6570\u91CF\uFF1A\u5FC5\u987B\u660E\u786E\u6307\u5B9A\uFF08\u4F8B\u5982\uFF1A\u9009\u62E93\u4E2A\u7247\u6BB5\u30015\u4E2A\u7247\u6BB5\u30013-5\u4E2A\u7247\u6BB5\uFF09
   - \u8F6C\u573A\u98CE\u683C\uFF1A\u5FEB\u901F\u5207\u6362/\u5E73\u6ED1\u8FC7\u6E21

5. **\u76EE\u6807\u53D7\u4F17\u8003\u8651**\uFF1A\u9488\u5BF9\u4EC0\u4E48\u4EBA\u7FA4\uFF08\u4E13\u4E1A\u4EBA\u58EB\u3001\u666E\u901A\u89C2\u4F17\u3001\u8425\u9500\u63A8\u5E7F\uFF09

**\u91CD\u8981\u63D0\u9192**\uFF1A
- \u7247\u6BB5\u65F6\u957F\u548C\u6570\u91CF\u5FC5\u987B\u7ED9\u51FA\u5177\u4F53\u6570\u503C\uFF0C\u4E0D\u80FD\u6A21\u7CCA
- \u5982\u679C\u7528\u6237\u9700\u6C42\u4E2D\u6CA1\u6709\u660E\u786E\u6307\u5B9A\uFF0C\u8BF7\u6839\u636E\u89C6\u9891\u7C7B\u578B\u548C\u5185\u5BB9\u7ED9\u51FA\u5408\u7406\u7684\u9ED8\u8BA4\u503C
- \u751F\u6210\u7684\u63D0\u793A\u8BCD\u5C06\u76F4\u63A5\u7528\u4E8EAI\u7247\u6BB5\u9009\u62E9\uFF0C\u5FC5\u987B\u6E05\u6670\u660E\u786E

\u8BF7\u4EE5\u7ED3\u6784\u5316\u7684\u6587\u672C\u5F62\u5F0F\u8FD4\u56DE\u63D0\u793A\u8BCD\uFF0C\u4E0D\u8981\u4F7F\u7528JSON\u683C\u5F0F\u3002`;
    const promptResponse = await invokeLLM2({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5206\u6790\u4E13\u5BB6\u3002" },
        { role: "user", content: promptGenerationRequest }
      ]
    });
    const scriptPrompt = promptResponse.choices[0].message.content;
    if (typeof scriptPrompt !== "string") {
      throw new Error("Unexpected LLM response format for script prompt");
    }
    console.log(`[Analyze] Generated script prompt, length: ${scriptPrompt.length}`);
    await updateJobProgress(jobId, 40, "\u6B63\u5728\u751F\u6210\u603B\u4F53\u811A\u672C...");
    console.log(`[Analyze] Generating overall script for job ${jobId}`);
    console.log(`[Analyze] job.contentStructure:`, JSON.stringify(job.contentStructure));
    let structureInfo = "";
    if (job.contentStructure && Array.isArray(job.contentStructure) && job.contentStructure.length > 0) {
      console.log(`[Analyze] Found ${job.contentStructure.length} structure segments`);
      structureInfo = `

\u5185\u5BB9\u7ED3\u6784\u6807\u6CE8\uFF08AI\u5DF2\u8BC6\u522B\u7684\u89C6\u9891\u7ED3\u6784\uFF09\uFF1A
`;
      job.contentStructure.forEach((seg, index) => {
        structureInfo += `
\u7247\u6BB5${index + 1}:
`;
        structureInfo += `- \u6F14\u8BB2\u8005: ${seg.speaker || "\u672A\u77E5"}
`;
        structureInfo += `- \u4E3B\u9898: ${seg.topic || "\u672A\u77E5"}
`;
        structureInfo += `- \u65F6\u95F4\u8303\u56F4: ${seg.startTime || "00:00:00"} - ${seg.endTime || "00:00:00"}
`;
        structureInfo += `- \u6458\u8981: ${seg.summary || "\u65E0"}
`;
        structureInfo += `- \u5173\u952E\u8BCD: ${Array.isArray(seg.keywords) ? seg.keywords.join(", ") : "\u65E0"}
`;
      });
    }
    const scriptGenerationRequest = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u5206\u6790\u63D0\u793A\u8BCD\u548C\u5B57\u5E55\u5185\u5BB9\uFF0C\u751F\u6210\u4E00\u4E2A\u5B8C\u6574\u7684\u89C6\u9891\u5185\u5BB9\u811A\u672C\u3002

\u5206\u6790\u63D0\u793A\u8BCD\uFF1A
${scriptPrompt}${structureInfo}

SRT\u5B57\u5E55\u5185\u5BB9\uFF1A
${srtContent}

\u8BF7\u751F\u6210\u4E00\u4E2A\u7ED3\u6784\u5316\u7684\u89C6\u9891\u5185\u5BB9\u811A\u672C\uFF0C\u5305\u62EC\uFF1A
1. \u89C6\u9891\u6574\u4F53\u6982\u8FF0
2. \u4E3B\u8981\u5185\u5BB9\u7ED3\u6784\uFF08\u5206\u6BB5\u63CF\u8FF0\uFF09
3. \u5173\u952E\u4FE1\u606F\u63D0\u53D6

\u8BF7\u4EE5\u6587\u672C\u5F62\u5F0F\u8FD4\u56DE\uFF0C\u4E0D\u8981\u4F7F\u7528JSON\u683C\u5F0F\u3002`;
    const scriptResponse = await invokeLLM2({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u52A9\u624B\u3002" },
        { role: "user", content: scriptGenerationRequest }
      ]
    });
    const overallScript = scriptResponse.choices[0].message.content;
    if (typeof overallScript !== "string") {
      throw new Error("Unexpected LLM response format for overall script");
    }
    console.log(`[Analyze] Generated overall script, length: ${overallScript.length}`);
    await updateJobProgress(jobId, 70, "\u6B63\u5728\u9009\u62E9\u7CBE\u5F69\u7247\u6BB5...");
    console.log(`[Analyze] Selecting segments for job ${jobId}`);
    const segmentSelectionRequest = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u5206\u6790\u63D0\u793A\u8BCD\u548C\u603B\u4F53\u811A\u672C\uFF0C\u4ECESRT\u5B57\u5E55\u4E2D\u9009\u62E9\u6700\u7B26\u5408\u8981\u6C42\u7684\u7CBE\u5F69\u7247\u6BB5\u3002

\u5206\u6790\u63D0\u793A\u8BCD\uFF1A
${scriptPrompt}${structureInfo}

\u603B\u4F53\u811A\u672C\uFF1A
${overallScript}

SRT\u5B57\u5E55\u5185\u5BB9\uFF1A
${srtContent}

**\u6838\u5FC3\u8981\u6C42**\uFF1A
1. **\u4E25\u683C\u9075\u5FAA\u7ED3\u6784\u6807\u6CE8\u7EA6\u675F**\uFF1A\u5982\u679C\u4E0A\u9762\u63D0\u4F9B\u4E86\u201C\u89C6\u9891\u5185\u5BB9\u7ED3\u6784\u6807\u6CE8\u201D\uFF0C\u5219**\u5FC5\u987B\u4E14\u53EA\u80FD**\u5728\u6807\u6CE8\u7684\u65F6\u95F4\u8303\u56F4\u5185\u9009\u62E9\u7247\u6BB5\uFF0C\u4E0D\u5F97\u8D85\u51FA\u8BE5\u8303\u56F4
2. **\u4F18\u5148\u4F7F\u7528\u811A\u672C\u4E2D\u6807\u6CE8\u7684\u7247\u6BB5**\uFF1A\u5982\u679C\u603B\u4F53\u811A\u672C\u4E2D\u660E\u786E\u6307\u51FA\u4E86\u7247\u6BB5\u7F16\u53F7\uFF08\u4F8B\u5982\u201C\u7247\u6BB514-15\u201D\u3001\u201C\u7247\u6BB524-27\u201D\uFF09\uFF0C\u5FC5\u987B\u4F18\u5148\u9009\u62E9\u8FD9\u4E9B\u7247\u6BB5
3. **\u7CBE\u786E\u5B9A\u4F4D\u65F6\u95F4\u8303\u56F4**\uFF1A\u6839\u636ESRT\u7F16\u53F7\u627E\u5230\u5BF9\u5E94\u7684\u5B57\u5E55\u5757\uFF0C\u63D0\u53D6\u5B9E\u9645\u7684\u5F00\u59CB\u548C\u7ED3\u675F\u65F6\u95F4
4. **\u9075\u5FAA\u6570\u91CF\u548C\u65F6\u957F\u8981\u6C42**\uFF1A\u4E25\u683C\u6309\u7167\u5206\u6790\u63D0\u793A\u8BCD\u4E2D\u6307\u5B9A\u7684\u7247\u6BB5\u6570\u91CF\u548C\u65F6\u957F\u8981\u6C42

**\u6280\u672F\u8BF4\u660E**\uFF1A
- SRT\u683C\u5F0F\u4E2D\u7684\u65F6\u95F4\u6233\u683C\u5F0F\u4E3A "HH:MM:SS,mmm --> HH:MM:SS,mmm"
- \u8BF7\u4F7F\u7528SRT\u4E2D\u5B9E\u9645\u51FA\u73B0\u7684\u65F6\u95F4\u6233\uFF0C\u4E0D\u8981\u7F16\u9020\u65F6\u95F4
- \u8F93\u51FA\u65F6\u95F4\u683C\u5F0F\u5FC5\u987B\u4E3A HH:MM:SS\uFF08\u4F8B\u5982\uFF1A00:05:30\u300001:23:45\uFF09

**\u793A\u4F8B**\uFF1A
\u5982\u679C\u811A\u672C\u4E2D\u63D0\u5230\u201C\u7247\u6BB514-15\u201D\uFF0C\u5219\u5E94\u8BE5\uFF1A
1. \u5728SRT\u4E2D\u627E\u5230\u7B2C14\u548C15\u53F7\u5B57\u5E55\u5757
2. \u63D0\u53D6\u7B2C14\u53F7\u7684\u5F00\u59CB\u65F6\u95F4\u548C\u7B2C15\u53F7\u7684\u7ED3\u675F\u65F6\u95F4
3. \u5C06\u8FD9\u4E2A\u65F6\u95F4\u8303\u56F4\u4F5C\u4E3A\u4E00\u4E2A\u7247\u6BB5\u8FD4\u56DE

\u793A\u4F8B\u8F93\u51FA\u683C\u5F0F\uFF1A
{
  "segments": [
    {
      "start_time": "00:05:30",
      "end_time": "00:07:15",
      "reason": "\u8FD9\u4E2A\u7247\u6BB5\u4ECB\u7ECD\u4E86..."
    }
  ]
}

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\u7ED3\u679C\u3002`;
    const segmentResponse = await invokeLLM2({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u52A9\u624B\uFF0C\u64C5\u957F\u4ECE\u957F\u89C6\u9891\u4E2D\u63D0\u53D6\u7CBE\u5F69\u7247\u6BB5\u3002" },
        { role: "user", content: segmentSelectionRequest }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_segments",
          strict: true,
          schema: {
            type: "object",
            properties: {
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    start_time: { type: "string", description: "\u5F00\u59CB\u65F6\u95F4 HH:MM:SS" },
                    end_time: { type: "string", description: "\u7ED3\u675F\u65F6\u95F4 HH:MM:SS" },
                    reason: { type: "string", description: "\u9009\u62E9\u7406\u7531" }
                  },
                  required: ["start_time", "end_time", "reason"],
                  additionalProperties: false
                }
              }
            },
            required: ["segments"],
            additionalProperties: false
          }
        }
      }
    });
    const segmentContent = segmentResponse.choices[0].message.content;
    if (typeof segmentContent !== "string") {
      throw new Error("Unexpected LLM response format for segments");
    }
    const analysisResult = JSON.parse(segmentContent);
    console.log(`[Analyze] AI selected ${analysisResult.segments.length} segments`);
    await updateJobProgress(jobId, 90, "\u6B63\u5728\u4FDD\u5B58\u5206\u6790\u7ED3\u679C...");
    const selectedSegments = analysisResult.segments.map((seg) => ({
      start: Math.floor(timeStringToSeconds(seg.start_time)),
      // 开始时间向下取整
      end: Math.ceil(timeStringToSeconds(seg.end_time)),
      // 结束时间向上取整
      reason: seg.reason
    }));
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      scriptPrompt,
      overallScript,
      selectedSegments,
      step: "analyzed",
      progress: 0,
      // 重置为0，等待用户手动触发步骤4
      currentStep: "AI\u5206\u6790\u5B8C\u6210\uFF0C\u7B49\u5F85\u751F\u6210\u89C6\u9891",
      status: "completed"
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[Analyze] Job ${jobId} analysis completed with script prompt and overall script`);
  } catch (error) {
    console.error(`[Analyze] Job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(videoJobs).set({
        status: "failed",
        errorMessage: error.message,
        currentStep: "AI\u5206\u6790\u5931\u8D25"
      }).where(eq3(videoJobs.id, jobId));
    }
    throw error;
  }
}
async function generatePromptOnly(jobId) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
  const promptGenerationRequest = `\u4F60\u662F\u4E00\u4E2A\u89C6\u9891\u5206\u6790\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u7528\u6237\u7684\u9700\u6C42\uFF0C\u751F\u6210\u4E00\u4E2A\u8BE6\u7EC6\u7684\u5206\u6790\u63D0\u793A\u8BCD\uFF0C\u7528\u4E8E\u6307\u5BFC\u540E\u7EED\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u548C\u7247\u6BB5\u9009\u62E9\u3002

\u7528\u6237\u9700\u6C42\uFF1A${job.userRequirement}

\u8BF7\u751F\u6210\u4E00\u4E2A\u5305\u542B\u4EE5\u4E0B\u5143\u7D20\u7684\u5206\u6790\u63D0\u793A\u8BCD\uFF1A

1. **\u89C6\u9891\u7C7B\u578B\u8BC6\u522B**\uFF1A\u5224\u65AD\u8FD9\u662F\u4EC0\u4E48\u7C7B\u578B\u7684\u89C6\u9891\uFF08\u4F1A\u8BAE\u6F14\u8BB2\u3001\u6559\u5B66\u89C6\u9891\u3001\u8BBF\u8C08\u3001Vlog\u7B49\uFF09

2. **\u526A\u8F91\u76EE\u6807\u5B9A\u4F4D**\uFF1A\u660E\u786E\u9700\u8981\u63D0\u53D6\u4EC0\u4E48\u5185\u5BB9\uFF08\u7279\u5B9A\u4EBA\u7269\u53D1\u8A00\u3001\u7CBE\u534E\u89C2\u70B9\u5408\u96C6\u3001\u6559\u7A0B\u6B65\u9AA4\u7B49\uFF09

3. **\u5185\u5BB9\u91CD\u70B9\u65B9\u5411**\uFF1A\u9700\u8981\u5173\u6CE8\u7684\u5185\u5BB9\u4E3B\u9898\uFF08\u6280\u672F\u7EC6\u8282\u3001\u5546\u4E1A\u7B56\u7565\u3001\u6848\u4F8B\u5206\u4EAB\u7B49\uFF09

4. **\u526A\u8F91\u8282\u594F\u5EFA\u8BAE**\uFF08\u5FC5\u987B\u660E\u786E\u6307\u5B9A\u5177\u4F53\u6570\u503C\uFF09\uFF1A
   - \u7247\u6BB5\u65F6\u957F\uFF1A\u5FC5\u987B\u660E\u786E\u6307\u5B9A\uFF08\u4F8B\u5982\uFF1A\u6BCF\u4E2A\u7247\u6BB530\u79D2\u3001\u6BCF\u4E2A\u7247\u6BB51-2\u5206\u949F\u3001\u6BCF\u4E2A\u7247\u6BB53-5\u5206\u949F\uFF09
   - \u7247\u6BB5\u6570\u91CF\uFF1A\u5FC5\u987B\u660E\u786E\u6307\u5B9A\uFF08\u4F8B\u5982\uFF1A\u9009\u62E93\u4E2A\u7247\u6BB5\u30015\u4E2A\u7247\u6BB5\u30013-5\u4E2A\u7247\u6BB5\uFF09
   - \u8F6C\u573A\u98CE\u683C\uFF1A\u5FEB\u901F\u5207\u6362/\u5E73\u6ED1\u8FC7\u6E21

5. **\u76EE\u6807\u53D7\u4F17\u8003\u8651**\uFF1A\u9488\u5BF9\u4EC0\u4E48\u4EBA\u7FA4\uFF08\u4E13\u4E1A\u4EBA\u58EB\u3001\u666E\u901A\u89C2\u4F17\u3001\u8425\u9500\u63A8\u5E7F\uFF09

**\u91CD\u8981\u63D0\u9192**\uFF1A
- \u7247\u6BB5\u65F6\u957F\u548C\u6570\u91CF\u5FC5\u987B\u7ED9\u51FA\u5177\u4F53\u6570\u503C\uFF0C\u4E0D\u80FD\u6A21\u7CCA
- \u5982\u679C\u7528\u6237\u9700\u6C42\u4E2D\u6CA1\u6709\u660E\u786E\u6307\u5B9A\uFF0C\u8BF7\u6839\u636E\u89C6\u9891\u7C7B\u578B\u548C\u5185\u5BB9\u7ED9\u51FA\u5408\u7406\u7684\u9ED8\u8BA4\u503C
- \u751F\u6210\u7684\u63D0\u793A\u8BCD\u5C06\u76F4\u63A5\u7528\u4E8EAI\u7247\u6BB5\u9009\u62E9\uFF0C\u5FC5\u987B\u6E05\u6670\u660E\u786E

\u8BF7\u4EE5\u7ED3\u6784\u5316\u7684\u6587\u672C\u5F62\u5F0F\u8FD4\u56DE\u63D0\u793A\u8BCD\uFF0C\u4E0D\u8981\u4F7F\u7528JSON\u683C\u5F0F\u3002`;
  const promptResponse = await invokeLLM2({
    messages: [
      { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5206\u6790\u4E13\u5BB6\u3002" },
      { role: "user", content: promptGenerationRequest }
    ]
  });
  const scriptPrompt = promptResponse.choices[0].message.content;
  if (typeof scriptPrompt !== "string") {
    throw new Error("Unexpected LLM response format for script prompt");
  }
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(videoJobs).set({ scriptPrompt }).where(eq3(videoJobs.id, jobId));
  return scriptPrompt;
}
async function analyzeWithCustomPrompt(jobId, userRequirement, scriptPrompt) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  if (!job.transcriptUrl) {
    throw new Error("Transcript URL not found");
  }
  try {
    await updateJobProgress(jobId, 10, "\u6B63\u5728\u4E0B\u8F7D\u5B57\u5E55\u6587\u4EF6...");
    const transcriptResponse = await fetch(job.transcriptUrl);
    if (!transcriptResponse.ok) {
      throw new Error(`Failed to download transcript: ${transcriptResponse.status}`);
    }
    const srtContent = await transcriptResponse.text();
    const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      userRequirement,
      scriptPrompt,
      step: "transcribed",
      progress: 0,
      status: "pending"
    }).where(eq3(videoJobs.id, jobId));
    await updateJobProgress(jobId, 40, "\u6B63\u5728\u751F\u6210\u603B\u4F53\u811A\u672C...");
    console.log(`[Analyze] Generating overall script for job ${jobId}`);
    console.log(`[Analyze] job.contentStructure:`, JSON.stringify(job.contentStructure));
    let structureInfo = "";
    if (job.contentStructure && Array.isArray(job.contentStructure) && job.contentStructure.length > 0) {
      console.log(`[Analyze] Found ${job.contentStructure.length} structure segments`);
      structureInfo = `

\u5185\u5BB9\u7ED3\u6784\u6807\u6CE8\uFF08AI\u5DF2\u8BC6\u522B\u7684\u89C6\u9891\u7ED3\u6784\uFF09\uFF1A
`;
      job.contentStructure.forEach((seg, index) => {
        structureInfo += `
\u7247\u6BB5${index + 1}:
`;
        structureInfo += `- \u6F14\u8BB2\u8005: ${seg.speaker || "\u672A\u77E5"}
`;
        structureInfo += `- \u4E3B\u9898: ${seg.topic || "\u672A\u77E5"}
`;
        structureInfo += `- \u65F6\u95F4\u8303\u56F4: ${seg.startTime || "00:00:00"} - ${seg.endTime || "00:00:00"}
`;
        structureInfo += `- \u6458\u8981: ${seg.summary || "\u65E0"}
`;
        structureInfo += `- \u5173\u952E\u8BCD: ${Array.isArray(seg.keywords) ? seg.keywords.join(", ") : "\u65E0"}
`;
      });
    }
    const scriptGenerationRequest = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u5206\u6790\u63D0\u793A\u8BCD\u548C\u5B57\u5E55\u5185\u5BB9\uFF0C\u751F\u6210\u4E00\u4E2A\u5B8C\u6574\u7684\u89C6\u9891\u5185\u5BB9\u811A\u672C\u3002

\u5206\u6790\u63D0\u793A\u8BCD\uFF1A
${scriptPrompt}${structureInfo}

SRT\u5B57\u5E55\u5185\u5BB9\uFF1A
${srtContent}

\u8BF7\u751F\u6210\u4E00\u4E2A\u7ED3\u6784\u5316\u7684\u89C6\u9891\u5185\u5BB9\u811A\u672C\uFF0C\u5305\u62EC\uFF1A
1. \u89C6\u9891\u6574\u4F53\u6982\u8FF0
2. \u4E3B\u8981\u5185\u5BB9\u7ED3\u6784\uFF08\u5206\u6BB5\u63CF\u8FF0\uFF09
3. \u5173\u952E\u4FE1\u606F\u63D0\u53D6

\u8BF7\u4EE5\u6587\u672C\u5F62\u5F0F\u8FD4\u56DE\uFF0C\u4E0D\u8981\u4F7F\u7528JSON\u683C\u5F0F\u3002`;
    const scriptResponse = await invokeLLM2({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u52A9\u624B\u3002" },
        { role: "user", content: scriptGenerationRequest }
      ]
    });
    const overallScript = scriptResponse.choices[0].message.content;
    if (typeof overallScript !== "string") {
      throw new Error("Unexpected LLM response format for overall script");
    }
    console.log(`[Analyze] Generated overall script, length: ${overallScript.length}`);
    await updateJobProgress(jobId, 70, "\u6B63\u5728\u9009\u62E9\u7CBE\u5F69\u7247\u6BB5...");
    console.log(`[Analyze] Selecting segments for job ${jobId}`);
    const segmentSelectionRequest = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u5206\u6790\u63D0\u793A\u8BCD\u548C\u603B\u4F53\u811A\u672C\uFF0C\u4ECE SRT\u5B57\u5E55\u4E2D\u9009\u62E9\u6700\u7B26\u5408\u8981\u6C42\u7684\u7CBE\u5F69\u7247\u6BB5\u3002

\u5206\u6790\u63D0\u793A\u8BCD\uFF1A
${scriptPrompt}${structureInfo}

\u603B\u4F53\u811A\u672C\uFF1A
${overallScript}

SRT\u5B57\u5E55\u5185\u5BB9\uFF1A
${srtContent}

**\u6838\u5FC3\u8981\u6C42**\uFF1A
1. **\u4E25\u683C\u9075\u5FAA\u7ED3\u6784\u6807\u6CE8\u7EA6\u675F**\uFF1A\u5982\u679C\u4E0A\u9762\u63D0\u4F9B\u4E86\u201C\u89C6\u9891\u5185\u5BB9\u7ED3\u6784\u6807\u6CE8\u201D\uFF0C\u5219**\u5FC5\u987B\u4E14\u53EA\u80FD**\u5728\u6807\u6CE8\u7684\u65F6\u95F4\u8303\u56F4\u5185\u9009\u62E9\u7247\u6BB5\uFF0C\u4E0D\u5F97\u8D85\u51FA\u8BE5\u8303\u56F4
2. **\u4F18\u5148\u4F7F\u7528\u811A\u672C\u4E2D\u6807\u6CE8\u7684\u7247\u6BB5**\uFF1A\u5982\u679C\u603B\u4F53\u811A\u672C\u4E2D\u660E\u786E\u6307\u51FA\u4E86\u7247\u6BB5\u7F16\u53F7\uFF08\u4F8B\u5982\u201C\u7247\u6BB514-15\u201D\u3001\u201C\u7247\u6BB524-27\u201D\uFF09\uFF0C\u5FC5\u987B\u4F18\u5148\u9009\u62E9\u8FD9\u4E9B\u7247\u6BB5
3. **\u7CBE\u786E\u5B9A\u4F4D\u65F6\u95F4\u8303\u56F4**\uFF1A\u6839\u636ESRT\u7F16\u53F7\u627E\u5230\u5BF9\u5E94\u7684\u5B57\u5E55\u5757\uFF0C\u63D0\u53D6\u5B9E\u9645\u7684\u5F00\u59CB\u548C\u7ED3\u675F\u65F6\u95F4
4. **\u9075\u5FAA\u6570\u91CF\u548C\u65F6\u957F\u8981\u6C42**\uFF1A\u4E25\u683C\u6309\u7167\u5206\u6790\u63D0\u793A\u8BCD\u4E2D\u6307\u5B9A\u7684\u7247\u6BB5\u6570\u91CF\u548C\u65F6\u957F\u8981\u6C42

**\u6280\u672F\u8BF4\u660E**\uFF1A
- SRT\u683C\u5F0F\u4E2D\u7684\u65F6\u95F4\u6233\u683C\u5F0F\u4E3A "HH:MM:SS,mmm --> HH:MM:SS,mmm"
- \u8BF7\u4F7F\u7528SRT\u4E2D\u5B9E\u9645\u51FA\u73B0\u7684\u65F6\u95F4\u6233\uFF0C\u4E0D\u8981\u7F16\u9020\u65F6\u95F4
- \u8F93\u51FA\u65F6\u95F4\u683C\u5F0F\u5FC5\u987B\u4E3A HH:MM:SS\uFF08\u4F8B\u5982\uFF1A00:05:30\u300001:23:45\uFF09

**\u793A\u4F8B**\uFF1A
\u5982\u679C\u811A\u672C\u4E2D\u63D0\u5230\u201C\u7247\u6BB514-15\u201D\uFF0C\u5219\u5E94\u8BE5\uFF1A
1. \u5728SRT\u4E2D\u627E\u5230\u7B2C14\u548C15\u53F7\u5B57\u5E55\u5757
2. \u63D0\u53D6\u7B2C14\u53F7\u7684\u5F00\u59CB\u65F6\u95F4\u548C\u7B2C15\u53F7\u7684\u7ED3\u675F\u65F6\u95F4
3. \u5C06\u8FD9\u4E2A\u65F6\u95F4\u8303\u56F4\u4F5C\u4E3A\u4E00\u4E2A\u7247\u6BB5\u8FD4\u56DE
\u793A\u4F8B\u8F93\u51FA\u683C\u5F0F\uFF1A
{
  "segments": [
    {
      "start_time": "00:05:30",
      "end_time": "00:07:15",
      "reason": "\u8FD9\u4E2A\u7247\u6BB5\u4ECB\u7ECD\u4E86..."
    }
  ]
}

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\u7ED3\u679C\u3002`;
    const segmentResponse = await invokeLLM2({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u52A9\u624B\uFF0C\u64C5\u957F\u4ECE\u957F\u89C6\u9891\u4E2D\u63D0\u53D6\u7CBE\u5F69\u7247\u6BB5\u3002" },
        { role: "user", content: segmentSelectionRequest }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_segments",
          strict: true,
          schema: {
            type: "object",
            properties: {
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    start_time: { type: "string", description: "\u5F00\u59CB\u65F6\u95F4 HH:MM:SS" },
                    end_time: { type: "string", description: "\u7ED3\u675F\u65F6\u95F4 HH:MM:SS" },
                    reason: { type: "string", description: "\u9009\u62E9\u7406\u7531" }
                  },
                  required: ["start_time", "end_time", "reason"],
                  additionalProperties: false
                }
              }
            },
            required: ["segments"],
            additionalProperties: false
          }
        }
      }
    });
    const segmentContent = segmentResponse.choices[0].message.content;
    if (typeof segmentContent !== "string") {
      throw new Error("Unexpected LLM response format for segments");
    }
    const analysisResult = JSON.parse(segmentContent);
    console.log(`[Analyze] AI selected ${analysisResult.segments.length} segments`);
    await updateJobProgress(jobId, 90, "\u6B63\u5728\u4FDD\u5B58\u5206\u6790\u7ED3\u679C...");
    const selectedSegments = analysisResult.segments.map((seg) => ({
      start: Math.floor(timeStringToSeconds(seg.start_time)),
      // 开始时间向下取整
      end: Math.ceil(timeStringToSeconds(seg.end_time)),
      // 结束时间向上取整
      reason: seg.reason
    }));
    await db.update(videoJobs).set({
      scriptPrompt,
      overallScript,
      selectedSegments,
      step: "analyzed",
      progress: 0,
      currentStep: "AI\u5206\u6790\u5B8C\u6210\uFF0C\u7B49\u5F85\u751F\u6210\u89C6\u9891",
      status: "completed"
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[Analyze] Job ${jobId} analysis completed with custom prompt`);
  } catch (error) {
    console.error(`[Analyze] Job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(videoJobs).set({
        status: "failed",
        errorMessage: error.message,
        currentStep: "\u5206\u6790\u5931\u8D25"
      }).where(eq3(videoJobs.id, jobId));
    }
    throw error;
  }
}
function timeStringToSeconds(timeStr) {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else {
    return Number(timeStr);
  }
}
async function generateClipsStep(jobId) {
  console.log(`[GenerateClips] Starting for job ${jobId}`);
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [job] = await db.select().from(videoJobs).where(eq3(videoJobs.id, jobId));
    if (!job) throw new Error(`Job ${jobId} not found`);
    if (job.step !== "analyzed" && job.step !== "completed") {
      throw new Error(`Invalid step: expected 'analyzed' or 'completed', got '${job.step}'`);
    }
    if (!job.selectedSegments || job.selectedSegments.length === 0) {
      throw new Error("No segments selected for clipping");
    }
    await db.update(videoJobs).set({
      status: "processing",
      progress: 0,
      currentStep: "\u6B63\u5728\u751F\u6210\u89C6\u9891\u7247\u6BB5..."
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[GenerateClips] Downloading video from ${job.originalVideoUrl}`);
    await db.update(videoJobs).set({ progress: 10, currentStep: "\u6B63\u5728\u4E0B\u8F7D\u539F\u59CB\u89C6\u9891..." }).where(eq3(videoJobs.id, jobId));
    const crypto = await import("crypto");
    const fs10 = await import("fs/promises");
    const randomId = crypto.randomBytes(6).toString("base64url");
    const tmpDir = `/tmp/video-job-${jobId}-${randomId}`;
    await fs10.mkdir(tmpDir, { recursive: true });
    const videoPath = path4.join(tmpDir, "video.mp4");
    const response = await fetch(job.originalVideoUrl);
    if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
    const downloadedVideoBuffer = Buffer.from(await response.arrayBuffer());
    await fs10.writeFile(videoPath, downloadedVideoBuffer);
    console.log(`[GenerateClips] Clipping ${job.selectedSegments.length} segments`);
    await db.update(videoJobs).set({ progress: 30, currentStep: "\u6B63\u5728\u526A\u8F91\u89C6\u9891\u7247\u6BB5..." }).where(eq3(videoJobs.id, jobId));
    const { clipVideos: clipVideos2 } = await Promise.resolve().then(() => (init_videoService(), videoService_exports));
    const clipPaths = await clipVideos2(videoPath, job.selectedSegments);
    console.log(`[GenerateClips] Concatenating ${clipPaths.length} clips`);
    await db.update(videoJobs).set({ progress: 60, currentStep: "\u6B63\u5728\u62FC\u63A5\u89C6\u9891\u7247\u6BB5..." }).where(eq3(videoJobs.id, jobId));
    const dir = path4.dirname(videoPath);
    const outputPath = path4.join(dir, "final-output.mp4");
    console.log(`[GenerateClips] Concatenating clips:`, clipPaths);
    const { concatenateVideos: concatenateVideos2 } = await Promise.resolve().then(() => (init_videoService(), videoService_exports));
    await concatenateVideos2(clipPaths, outputPath);
    const { exec: exec3 } = await import("child_process");
    const { promisify: promisify3 } = await import("util");
    const execAsync3 = promisify3(exec3);
    const { stdout } = await execAsync3(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`);
    const finalDuration = parseFloat(stdout.trim());
    console.log(`[GenerateClips] Final video duration: ${finalDuration.toFixed(2)}s (expected: ~${clipPaths.length * 12}s)`);
    console.log(`[GenerateClips] Uploading final video to S3`);
    await db.update(videoJobs).set({ progress: 80, currentStep: "\u6B63\u5728\u4E0A\u4F20\u6700\u7EC8\u89C6\u9891..." }).where(eq3(videoJobs.id, jobId));
    const finalVideoBuffer = await fs10.readFile(outputPath);
    const timestamp2 = Date.now();
    const videoKey = `videos/${job.userId || "anonymous"}/${jobId}-final-${timestamp2}.mp4`;
    const { url: finalVideoUrl } = await storagePut3(videoKey, finalVideoBuffer, "video/mp4");
    console.log(`[GenerateClips] Uploaded to S3: ${videoKey}, URL: ${finalVideoUrl}`);
    await fs10.rm(tmpDir, { recursive: true, force: true });
    await db.update(videoJobs).set({
      finalVideoUrl,
      finalVideoKey: videoKey,
      step: "completed",
      progress: 100,
      currentStep: "\u89C6\u9891\u751F\u6210\u5B8C\u6210",
      status: "completed",
      completedAt: /* @__PURE__ */ new Date()
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[GenerateClips] Job ${jobId} completed`);
  } catch (error) {
    console.error(`[GenerateClips] Job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(videoJobs).set({
        status: "failed",
        errorMessage: error.message,
        currentStep: "\u89C6\u9891\u751F\u6210\u5931\u8D25"
      }).where(eq3(videoJobs.id, jobId));
    }
    throw error;
  }
}
async function annotateStructureStep(jobId) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  if (!job.transcriptUrl) {
    throw new Error("Transcript not found. Please complete step 2 first.");
  }
  try {
    await updateJobProgress(jobId, 10, "\u6B63\u5728\u4E0B\u8F7D\u5B57\u5E55\u6587\u4EF6...");
    const srtResponse = await fetch(job.transcriptUrl);
    if (!srtResponse.ok) {
      throw new Error(`Failed to download transcript: ${srtResponse.status}`);
    }
    const srtContent = await srtResponse.text();
    await updateJobProgress(jobId, 30, "\u6B63\u5728\u5206\u6790\u89C6\u9891\u5185\u5BB9\u7ED3\u6784...");
    const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
    const prompt = `\u4F60\u662F\u4E00\u4E2A\u89C6\u9891\u5185\u5BB9\u7ED3\u6784\u5206\u6790\u4E13\u5BB6\u3002\u8BF7\u5206\u6790\u4EE5\u4E0BSRT\u5B57\u5E55\u6587\u4EF6\uFF0C\u8BC6\u522B\u89C6\u9891\u4E2D\u7684\u7ED3\u6784\u5316\u7247\u6BB5\u3002

SRT\u5B57\u5E55\u5185\u5BB9\uFF1A
\`\`\`
${srtContent}
\`\`\`

\u8BF7\u6309\u7167\u4EE5\u4E0B\u8981\u6C42\u8FDB\u884C\u5206\u6790\uFF1A

1. **\u8BC6\u522B\u6F14\u8BB2\u8005/\u4E3B\u9898\u7247\u6BB5**\uFF1A\u6839\u636E\u5185\u5BB9\u53D8\u5316\u8BC6\u522B\u4E0D\u540C\u7684\u6F14\u8BB2\u8005\u6216\u4E3B\u9898\u6BB5\u843D
2. **\u63D0\u53D6\u65F6\u95F4\u8303\u56F4**\uFF1A\u4ECESRT\u65F6\u95F4\u6233\u4E2D\u63D0\u53D6\u6BCF\u4E2A\u7247\u6BB5\u7684\u5F00\u59CB\u548C\u7ED3\u675F\u65F6\u95F4
3. **\u751F\u6210\u6458\u8981**\uFF1A\u4E3A\u6BCF\u4E2A\u7247\u6BB5\u751F\u6210\u7B80\u77ED\u7684\u5185\u5BB9\u6458\u8981\uFF0820-50\u5B57\uFF09
4. **\u63D0\u53D6\u5173\u952E\u8BCD**\uFF1A\u4E3A\u6BCF\u4E2A\u7247\u6BB5\u63D0\u53D63-5\u4E2A\u5173\u952E\u8BCD

**\u91CD\u8981\u63D0\u793A**\uFF1A
- \u65F6\u95F4\u683C\u5F0F\u5FC5\u987B\u4E25\u683C\u4ECESRT\u4E2D\u63D0\u53D6\uFF0C\u683C\u5F0F\u4E3A"HH:MM:SS"\uFF08\u4F8B\u5982\uFF1A"01:20:59"\uFF09
- startSeconds\u548CendSeconds\u662F\u79D2\u6570\uFF08\u4F8B\u5982\uFF1A4859\uFF09
- \u5982\u679C\u65E0\u6CD5\u786E\u5B9A\u6F14\u8BB2\u8005\u59D3\u540D\uFF0C\u4F7F\u7528"\u6F14\u8BB2\u80051"\u3001"\u6F14\u8BB2\u80052"\u7B49
- \u4E3B\u9898\u5E94\u8BE5\u7B80\u6D01\u660E\u4E86\uFF085-15\u5B57\uFF09

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\u7ED3\u679C\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
\`\`\`json
{
  "segments": [
    {
      "id": 1,
      "speaker": "\u4E3B\u6301\u4EBA",
      "topic": "\u5F00\u573A\u4ECB\u7ECD",
      "startTime": "00:00:00",
      "endTime": "00:02:30",
      "startSeconds": 0,
      "endSeconds": 150,
      "summary": "\u4E3B\u6301\u4EBA\u4ECB\u7ECD\u672C\u6B21\u5CF0\u4F1A\u4E3B\u9898\u548C\u5609\u5BBE\u9635\u5BB9",
      "keywords": ["AI\u5CF0\u4F1A", "\u5609\u5BBE\u4ECB\u7ECD", "\u5F00\u573A"]
    }
  ]
}
\`\`\``;
    const response = await invokeLLM2({
      messages: [
        { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u7ED3\u6784\u5206\u6790\u4E13\u5BB6\uFF0C\u64C5\u957F\u4ECE\u5B57\u5E55\u4E2D\u8BC6\u522B\u6F14\u8BB2\u8005\u3001\u4E3B\u9898\u548C\u65F6\u95F4\u6BB5\u3002" },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_structure",
          strict: true,
          schema: {
            type: "object",
            properties: {
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    speaker: { type: "string" },
                    topic: { type: "string" },
                    startTime: { type: "string" },
                    endTime: { type: "string" },
                    startSeconds: { type: "number" },
                    endSeconds: { type: "number" },
                    summary: { type: "string" },
                    keywords: {
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: ["id", "speaker", "topic", "startTime", "endTime", "startSeconds", "endSeconds", "summary", "keywords"],
                  additionalProperties: false
                }
              }
            },
            required: ["segments"],
            additionalProperties: false
          }
        }
      }
    });
    await updateJobProgress(jobId, 80, "\u6B63\u5728\u4FDD\u5B58\u6807\u6CE8\u7ED3\u679C...");
    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("AI returned empty or invalid content");
    }
    const structureData = JSON.parse(content);
    console.log(`[AnnotateStructure] AI identified ${structureData.segments.length} segments`);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      contentStructure: structureData.segments,
      progress: 100,
      currentStep: "\u5185\u5BB9\u7ED3\u6784\u6807\u6CE8\u5B8C\u6210",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq3(videoJobs.id, jobId));
    console.log(`[AnnotateStructure] Job ${jobId} structure annotation completed`);
  } catch (error) {
    console.error(`[AnnotateStructure] Job ${jobId} failed:`, error);
    const db = await getDb();
    if (db) {
      await db.update(videoJobs).set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error during structure annotation",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(videoJobs.id, jobId));
    }
    throw error;
  }
}
var init_stepProcessor = __esm({
  "server/stepProcessor.ts"() {
    "use strict";
    init_videoDb();
    init_storageAdapter();
    init_videoService();
    init_srtGenerator();
    init_audioSegmentation();
    init_db();
    init_schema();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";
import net from "net";
import path10 from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  if (process.env.DESKTOP_MODE === "true") {
    return;
  }
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/videoRouter.ts
import { z as z2 } from "zod";
import { eq as eq4 } from "drizzle-orm";
init_videoDb();
init_db();
init_schema();
init_storageAdapter();
init_videoService();
import path5 from "path";
import fs5 from "fs/promises";
import os2 from "os";
import { nanoid } from "nanoid";
var videoRouter = router({
  /**
   * 上传视频文件
   */
  uploadVideo: protectedProcedure.input(z2.object({
    filename: z2.string(),
    contentType: z2.string(),
    fileSize: z2.number(),
    base64Data: z2.string()
    // Base64编码的文件数据
  })).mutation(async ({ input, ctx }) => {
    const { filename, contentType, fileSize, base64Data } = input;
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`\u6587\u4EF6\u5927\u5C0F\u8D85\u8FC7\u9650\u5236\uFF08\u6700\u59272GB\uFF09`);
    }
    const fileBuffer = Buffer.from(base64Data, "base64");
    const timestamp2 = Date.now();
    const randomId = nanoid(10);
    const fileKey = `videos/${ctx.user.id}/${timestamp2}-${randomId}-${filename}`;
    const { url } = await storagePut3(fileKey, fileBuffer, contentType);
    return {
      url,
      key: fileKey,
      filename,
      fileSize
    };
  }),
  /**
   * 创建视频处理任务
   */
  createJob: protectedProcedure.input(z2.object({
    videoUrl: z2.string(),
    videoKey: z2.string(),
    filename: z2.string(),
    fileSize: z2.number(),
    userRequirement: z2.string(),
    asrMethod: z2.enum(["whisper", "aliyun"]).default("whisper")
  })).mutation(async ({ input, ctx }) => {
    const jobId = await createVideoJob({
      userId: ctx.user.id,
      originalVideoUrl: input.videoUrl,
      originalVideoKey: input.videoKey,
      originalFilename: input.filename,
      fileSize: input.fileSize,
      userRequirement: input.userRequirement,
      asrMethod: input.asrMethod,
      status: "completed",
      // 上传完成，等待用户手动触发分步处理
      progress: 0
    });
    return { jobId };
  }),
  /**
   * 获取任务状态
   */
  getJob: protectedProcedure.input(z2.object({ jobId: z2.number() })).query(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    return job;
  }),
  /**
   * 获取用户的所有任务
   */
  listJobs: protectedProcedure.query(async ({ ctx }) => {
    return await getUserVideoJobs(ctx.user.id);
  }),
  /**
   * 重启失败的任务
   */
  retryJob: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    if (job.status !== "failed") {
      throw new Error("Only failed jobs can be retried");
    }
    await updateJobProgress(input.jobId, 0, "\u51C6\u5907\u91CD\u65B0\u5904\u7406...");
    await getDb().then(
      (db) => db.update(videoJobs).set({
        status: "pending",
        errorMessage: null,
        currentStep: "\u51C6\u5907\u91CD\u65B0\u5904\u7406..."
      }).where(eq4(videoJobs.id, input.jobId))
    );
    processVideoAsync(input.jobId).catch((error) => {
      console.error(`Job ${input.jobId} retry failed:`, error);
      markJobFailed(input.jobId, error.message);
    });
    return { success: true, jobId: input.jobId };
  }),
  /**
   * 步骤1: 提取音频
   */
  extractAudio: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { extractAudioStep: extractAudioStep2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    extractAudioStep2(input.jobId).catch((error) => {
      console.error(`ExtractAudio ${input.jobId} failed:`, error);
    });
    return { success: true, jobId: input.jobId };
  }),
  /**
   * 步骤2: 转录音频
   */
  transcribeAudio: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { transcribeAudioStep: transcribeAudioStep2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    transcribeAudioStep2(input.jobId).catch((error) => {
      console.error(`TranscribeAudio ${input.jobId} failed:`, error);
    });
    return { success: true, jobId: input.jobId };
  }),
  /**
   * 步骤3: AI内容分析
   */
  analyzeContent: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { analyzeContentStep: analyzeContentStep2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    analyzeContentStep2(input.jobId).catch((error) => {
      console.error(`AnalyzeContent ${input.jobId} failed:`, error);
    });
    return { success: true, jobId: input.jobId };
  }),
  /**
   * 步骤2.5: 内容结构标注
   */
  annotateStructure: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { annotateStructureStep: annotateStructureStep2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    annotateStructureStep2(input.jobId).catch((error) => {
      console.error(`AnnotateStructure ${input.jobId} failed:`, error);
    });
    return { success: true, jobId: input.jobId };
  }),
  /**
   * 生成分析提示词（不执行分析）
   */
  generatePrompt: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { generatePromptOnly: generatePromptOnly2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    const scriptPrompt = await generatePromptOnly2(input.jobId);
    return {
      success: true,
      jobId: input.jobId,
      userRequirement: job.userRequirement,
      scriptPrompt
    };
  }),
  /**
   * 使用指定提示词进行分析
   */
  analyzeWithPrompt: protectedProcedure.input(z2.object({
    jobId: z2.number(),
    userRequirement: z2.string(),
    scriptPrompt: z2.string()
  })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { analyzeWithCustomPrompt: analyzeWithCustomPrompt2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    analyzeWithCustomPrompt2(input.jobId, input.userRequirement, input.scriptPrompt).catch((error) => {
      console.error(`AnalyzeWithPrompt ${input.jobId} failed:`, error);
    });
    return { success: true, jobId: input.jobId };
  }),
  /**
   * 更新片段列表
   */
  updateSegments: protectedProcedure.input(z2.object({
    jobId: z2.number(),
    segments: z2.array(z2.object({
      start: z2.number(),
      end: z2.number(),
      reason: z2.string()
    }))
  })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      selectedSegments: input.segments
    }).where(eq4(videoJobs.id, input.jobId));
    return { success: true };
  }),
  /**
   * 更新内容结构标注
   */
  updateContentStructure: protectedProcedure.input(z2.object({
    jobId: z2.number(),
    contentStructure: z2.array(z2.object({
      id: z2.number(),
      speaker: z2.string(),
      topic: z2.string(),
      startTime: z2.string(),
      endTime: z2.string(),
      startSeconds: z2.number(),
      endSeconds: z2.number(),
      summary: z2.string(),
      keywords: z2.array(z2.string())
    }))
  })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(videoJobs).set({
      contentStructure: input.contentStructure
    }).where(eq4(videoJobs.id, input.jobId));
    return { success: true };
  }),
  /**
   * 步骤4: 生成视频片段
   */
  generateClips: protectedProcedure.input(z2.object({ jobId: z2.number() })).mutation(async ({ input, ctx }) => {
    const job = await getVideoJob(input.jobId);
    if (!job) {
      throw new Error("Job not found");
    }
    if (job.userId !== ctx.user.id) {
      throw new Error("Unauthorized");
    }
    const { generateClipsStep: generateClipsStep2 } = await Promise.resolve().then(() => (init_stepProcessor(), stepProcessor_exports));
    generateClipsStep2(input.jobId).catch((error) => {
      console.error(`GenerateClips ${input.jobId} failed:`, error);
    });
    return { success: true, jobId: input.jobId };
  })
});
async function processVideoAsync(jobId) {
  const job = await getVideoJob(jobId);
  if (!job) throw new Error("Job not found");
  const tempDir = await fs5.mkdtemp(path5.join(os2.tmpdir(), `video-job-${jobId}-`));
  const tempFiles = [];
  try {
    await updateJobProgress(jobId, 5, "\u6B63\u5728\u4E0B\u8F7D\u89C6\u9891...");
    const videoPath = path5.join(tempDir, "input.mp4");
    console.log(`Downloading video from: ${job.originalVideoUrl}`);
    const videoResponse = await fetch(job.originalVideoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    console.log(`Downloaded video size: ${videoBuffer.length} bytes, expected: ${job.fileSize} bytes`);
    if (videoBuffer.length !== job.fileSize) {
      throw new Error(`Video size mismatch: downloaded ${videoBuffer.length} bytes, expected ${job.fileSize} bytes`);
    }
    await fs5.writeFile(videoPath, videoBuffer);
    console.log(`Video saved to: ${videoPath}`);
    tempFiles.push(videoPath);
    await updateJobProgress(jobId, 15, "\u6B63\u5728\u63D0\u53D6\u97F3\u9891...");
    const audioPath = path5.join(tempDir, "audio.wav");
    await extractAudio(videoPath, audioPath);
    tempFiles.push(audioPath);
    await updateJobProgress(jobId, 30, "\u6B63\u5728\u8F6C\u5F55\u97F3\u9891...");
    const transcript = await transcribeAudio2(audioPath);
    const transcriptPath = path5.join(tempDir, "transcript.json");
    await fs5.writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
    tempFiles.push(transcriptPath);
    const transcriptKey = `transcripts/${job.userId}/${jobId}-transcript.json`;
    const { url: transcriptUrl } = await uploadToS3(transcriptPath, transcriptKey, "application/json");
    await updateJobProgress(jobId, 50, "\u6B63\u5728\u5206\u6790\u5185\u5BB9...");
    const selectedSegments = await analyzeContent(transcript, job.userRequirement);
    if (!selectedSegments || selectedSegments.length === 0) {
      throw new Error("AI\u672A\u9009\u62E9\u4EFB\u4F55\u7247\u6BB5");
    }
    await updateJobProgress(jobId, 60, "\u6B63\u5728\u5207\u5272\u89C6\u9891...");
    const segmentPaths = [];
    for (let i = 0; i < selectedSegments.length; i++) {
      const seg = selectedSegments[i];
      const segmentPath = path5.join(tempDir, `segment_${i}.mp4`);
      await cutVideoSegment(videoPath, seg.start, seg.end, segmentPath);
      segmentPaths.push(segmentPath);
      tempFiles.push(segmentPath);
    }
    await updateJobProgress(jobId, 75, "\u6B63\u5728\u62FC\u63A5\u89C6\u9891...");
    const concatenatedPath = path5.join(tempDir, "concatenated.mp4");
    await concatenateVideos(segmentPaths, concatenatedPath);
    tempFiles.push(concatenatedPath);
    await updateJobProgress(jobId, 85, "\u6B63\u5728\u751F\u6210\u5B57\u5E55...");
    const srtPath = path5.join(tempDir, "subtitles.srt");
    await generateSRT(selectedSegments, transcript, srtPath);
    tempFiles.push(srtPath);
    const subtitleKey = `subtitles/${job.userId}/${jobId}-subtitles.srt`;
    const { url: subtitleUrl } = await uploadToS3(srtPath, subtitleKey, "text/plain");
    await updateJobProgress(jobId, 95, "\u6B63\u5728\u70E7\u5F55\u5B57\u5E55...");
    const finalPath = path5.join(tempDir, "final.mp4");
    await burnSubtitles(concatenatedPath, srtPath, finalPath);
    tempFiles.push(finalPath);
    await updateJobProgress(jobId, 98, "\u6B63\u5728\u4E0A\u4F20\u7ED3\u679C...");
    const finalKey = `results/${job.userId}/${jobId}-final.mp4`;
    const { url: finalUrl } = await uploadToS3(finalPath, finalKey, "video/mp4");
    await markJobCompleted(jobId, {
      transcriptUrl,
      transcriptKey,
      finalVideoUrl: finalUrl,
      finalVideoKey: finalKey,
      subtitleUrl,
      subtitleKey,
      selectedSegments
    });
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    await markJobFailed(jobId, error.message);
    throw error;
  } finally {
    await cleanupTempFiles(tempFiles);
    try {
      await fs5.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${tempDir}:`, error);
    }
  }
}

// server/versionRouter.ts
import { z as z3 } from "zod";

// server/versionDb.ts
init_db();
init_schema();
import { desc as desc2, eq as eq5 } from "drizzle-orm";
function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}
async function getLatestVersion() {
  const db = await getDb();
  if (!db) return void 0;
  const versions = await db.select().from(appVersions).where(eq5(appVersions.enabled, 1));
  if (versions.length === 0) return void 0;
  versions.sort((a, b) => compareVersions(b.version, a.version));
  return versions[0];
}
async function getVersionByString(version) {
  const db = await getDb();
  if (!db) return void 0;
  const [result] = await db.select().from(appVersions).where(eq5(appVersions.version, version)).limit(1);
  return result;
}
async function createVersion(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(appVersions).values(data).$returningId();
  const created = await getVersionByString(data.version);
  if (!created) {
    throw new Error("Failed to create version");
  }
  return created;
}
async function updateVersion(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appVersions).set(data).where(eq5(appVersions.id, id));
}
async function getAllVersions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appVersions).orderBy(desc2(appVersions.releaseDate));
}

// server/versionRouter.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
function compareVersions2(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}
var versionRouter = router({
  /**
   * Check for updates (public API for desktop app)
   * Returns latest version info and whether force update is required
   */
  checkUpdate: publicProcedure.input(z3.object({
    currentVersion: z3.string(),
    platform: z3.enum(["windows", "mac", "linux"]).optional()
  })).query(async ({ input }) => {
    const latest = await getLatestVersion();
    if (!latest) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "No version information available"
      });
    }
    const needsUpdate = compareVersions2(input.currentVersion, latest.version) < 0;
    const forceUpdate = compareVersions2(input.currentVersion, latest.minRequiredVersion) < 0;
    let downloadUrl = "";
    if (input.platform === "windows") {
      downloadUrl = latest.downloadUrlWindows || "";
    } else if (input.platform === "mac") {
      downloadUrl = latest.downloadUrlMac || "";
    } else if (input.platform === "linux") {
      downloadUrl = latest.downloadUrlLinux || "";
    }
    return {
      latestVersion: latest.version,
      minRequiredVersion: latest.minRequiredVersion,
      currentVersion: input.currentVersion,
      needsUpdate,
      forceUpdate,
      downloadUrl,
      releaseNotes: latest.releaseNotes || "",
      releaseDate: latest.releaseDate
    };
  }),
  /**
   * Verify online status (desktop app must call this periodically)
   * If this fails, the app should block usage
   */
  verifyOnline: publicProcedure.input(z3.object({
    appVersion: z3.string(),
    deviceId: z3.string().optional()
    // For future license management
  })).query(async ({ input }) => {
    const latest = await getLatestVersion();
    if (!latest) {
      return {
        online: false,
        canUse: false,
        message: "\u65E0\u6CD5\u8FDE\u63A5\u5230\u670D\u52A1\u5668"
      };
    }
    const versionAllowed = compareVersions2(input.appVersion, latest.minRequiredVersion) >= 0;
    return {
      online: true,
      canUse: versionAllowed,
      message: versionAllowed ? "\u5728\u7EBF\u9A8C\u8BC1\u6210\u529F" : `\u7248\u672C\u8FC7\u4F4E\uFF0C\u6700\u4F4E\u8981\u6C42\u7248\u672C ${latest.minRequiredVersion}\uFF0C\u8BF7\u66F4\u65B0\u5E94\u7528`,
      latestVersion: latest.version,
      minRequiredVersion: latest.minRequiredVersion
    };
  }),
  /**
   * Get all versions (admin only)
   */
  listVersions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only admins can access version management"
      });
    }
    return getAllVersions();
  }),
  /**
   * Create new version (admin only)
   */
  createVersion: protectedProcedure.input(z3.object({
    version: z3.string(),
    minRequiredVersion: z3.string(),
    forceUpdate: z3.boolean().default(false),
    downloadUrlWindows: z3.string().optional(),
    downloadUrlMac: z3.string().optional(),
    downloadUrlLinux: z3.string().optional(),
    releaseNotes: z3.string().optional()
  })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only admins can create versions"
      });
    }
    const existing = await getVersionByString(input.version);
    if (existing) {
      throw new TRPCError3({
        code: "CONFLICT",
        message: "Version already exists"
      });
    }
    const newVersion = await createVersion({
      version: input.version,
      minRequiredVersion: input.minRequiredVersion,
      forceUpdate: input.forceUpdate ? 1 : 0,
      enabled: 1,
      downloadUrlWindows: input.downloadUrlWindows || null,
      downloadUrlMac: input.downloadUrlMac || null,
      downloadUrlLinux: input.downloadUrlLinux || null,
      releaseNotes: input.releaseNotes || null,
      releaseDate: /* @__PURE__ */ new Date()
    });
    return newVersion;
  }),
  /**
   * Update version (admin only)
   */
  updateVersion: protectedProcedure.input(z3.object({
    id: z3.number(),
    enabled: z3.boolean().optional(),
    forceUpdate: z3.boolean().optional(),
    downloadUrlWindows: z3.string().optional(),
    downloadUrlMac: z3.string().optional(),
    downloadUrlLinux: z3.string().optional(),
    releaseNotes: z3.string().optional()
  })).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Only admins can update versions"
      });
    }
    const updateData = {};
    if (input.enabled !== void 0) updateData.enabled = input.enabled ? 1 : 0;
    if (input.forceUpdate !== void 0) updateData.forceUpdate = input.forceUpdate ? 1 : 0;
    if (input.downloadUrlWindows !== void 0) updateData.downloadUrlWindows = input.downloadUrlWindows;
    if (input.downloadUrlMac !== void 0) updateData.downloadUrlMac = input.downloadUrlMac;
    if (input.downloadUrlLinux !== void 0) updateData.downloadUrlLinux = input.downloadUrlLinux;
    if (input.releaseNotes !== void 0) updateData.releaseNotes = input.releaseNotes;
    await updateVersion(input.id, updateData);
    return { success: true };
  })
});

// server/uploadRouter.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";

// server/uploadDb.ts
init_schema();
init_db();
import { eq as eq6, lt } from "drizzle-orm";
async function createUploadSession(data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [session] = await db.insert(uploadSessions).values(data).$returningId();
  return session.id;
}
async function getUploadSession(uploadId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [session] = await db.select().from(uploadSessions).where(eq6(uploadSessions.uploadId, uploadId));
  return session || null;
}
async function updateUploadSession(uploadId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(uploadSessions).set(data).where(eq6(uploadSessions.uploadId, uploadId));
}
async function markChunkUploaded(uploadId, chunkIndex, s3Part) {
  const session = await getUploadSession(uploadId);
  if (!session) throw new Error("Upload session not found");
  const uploadedChunks = Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [];
  if (!uploadedChunks.includes(chunkIndex)) {
    uploadedChunks.push(chunkIndex);
  }
  const s3Parts = Array.isArray(session.s3Parts) ? session.s3Parts : [];
  if (s3Part && !s3Parts.find((p) => p.PartNumber === s3Part.PartNumber)) {
    s3Parts.push(s3Part);
  }
  const progress = Math.round(uploadedChunks.length / session.totalChunks * 100);
  await updateUploadSession(uploadId, {
    uploadedChunks,
    s3Parts,
    progress
  });
}
async function completeUploadSession(uploadId, finalUrl) {
  await updateUploadSession(uploadId, {
    status: "completed",
    progress: 100,
    finalUrl
  });
}
async function failUploadSession(uploadId, errorMessage) {
  await updateUploadSession(uploadId, {
    status: "failed",
    errorMessage
  });
}
async function cancelUploadSession(uploadId) {
  await updateUploadSession(uploadId, {
    status: "cancelled"
  });
}

// server/uploadRouter.ts
init_storageAdapter();
import * as fs6 from "fs/promises";
import * as path6 from "path";
import * as os3 from "os";
var CHUNK_SIZE = 5 * 1024 * 1024;
var TEMP_DIR = path6.join(os3.tmpdir(), "video-uploads");
fs6.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);
var uploadRouter = router({
  /**
   * Initialize a chunked upload session
   */
  initUpload: protectedProcedure.input(
    z4.object({
      uploadId: z4.string(),
      // Client-generated UUID
      filename: z4.string(),
      fileSize: z4.number(),
      mimeType: z4.string().optional(),
      chunkSize: z4.number().default(CHUNK_SIZE)
    })
  ).mutation(async ({ ctx, input }) => {
    const totalChunks = Math.ceil(input.fileSize / input.chunkSize);
    const s3Key = `videos/${ctx.user.id}/${input.uploadId}-${input.filename}`;
    const uploadTempDir = path6.join(TEMP_DIR, input.uploadId);
    await fs6.mkdir(uploadTempDir, { recursive: true });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
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
      expiresAt
    });
    return {
      uploadId: input.uploadId,
      totalChunks,
      chunkSize: input.chunkSize
    };
  }),
  /**
   * Upload a single chunk
   */
  uploadChunk: protectedProcedure.input(
    z4.object({
      uploadId: z4.string(),
      chunkIndex: z4.number(),
      chunk: z4.string()
      // Base64 encoded chunk data
    })
  ).mutation(async ({ ctx, input }) => {
    const session = await getUploadSession(input.uploadId);
    if (!session) {
      throw new TRPCError4({
        code: "NOT_FOUND",
        message: "Upload session not found"
      });
    }
    if (session.userId !== ctx.user.id) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Not authorized to upload to this session"
      });
    }
    if (session.status !== "uploading") {
      throw new TRPCError4({
        code: "BAD_REQUEST",
        message: `Upload session is ${session.status}`
      });
    }
    const uploadedChunks = Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [];
    if (uploadedChunks.includes(input.chunkIndex)) {
      return {
        success: true,
        message: "Chunk already uploaded",
        progress: session.progress
      };
    }
    try {
      const chunkBuffer = Buffer.from(input.chunk, "base64");
      const uploadTempDir = path6.join(TEMP_DIR, input.uploadId);
      const chunkPath = path6.join(uploadTempDir, `chunk-${input.chunkIndex}`);
      await fs6.writeFile(chunkPath, chunkBuffer);
      await markChunkUploaded(input.uploadId, input.chunkIndex);
      const updatedSession = await getUploadSession(input.uploadId);
      return {
        success: true,
        progress: updatedSession?.progress || 0
      };
    } catch (error) {
      console.error("[UploadChunk] Error:", error);
      await failUploadSession(input.uploadId, error instanceof Error ? error.message : "Unknown error");
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload chunk"
      });
    }
  }),
  /**
   * Complete the upload
   */
  completeUpload: protectedProcedure.input(
    z4.object({
      uploadId: z4.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const session = await getUploadSession(input.uploadId);
    if (!session) {
      throw new TRPCError4({
        code: "NOT_FOUND",
        message: "Upload session not found"
      });
    }
    if (session.userId !== ctx.user.id) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Not authorized to complete this upload"
      });
    }
    if (session.status !== "uploading") {
      throw new TRPCError4({
        code: "BAD_REQUEST",
        message: `Upload session is ${session.status}`
      });
    }
    const uploadedChunks = Array.isArray(session.uploadedChunks) ? session.uploadedChunks : [];
    if (uploadedChunks.length !== session.totalChunks) {
      throw new TRPCError4({
        code: "BAD_REQUEST",
        message: `Not all chunks uploaded: ${uploadedChunks.length}/${session.totalChunks}`
      });
    }
    try {
      const uploadTempDir = path6.join(TEMP_DIR, input.uploadId);
      const mergedFilePath = path6.join(uploadTempDir, "merged");
      const writeStream = await fs6.open(mergedFilePath, "w");
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path6.join(uploadTempDir, `chunk-${i}`);
        const chunkData = await fs6.readFile(chunkPath);
        await writeStream.write(chunkData);
      }
      await writeStream.close();
      const mergedData = await fs6.readFile(mergedFilePath);
      const { url, key } = await storagePut3(
        session.s3Key,
        mergedData,
        session.mimeType || "video/mp4"
      );
      await fs6.rm(uploadTempDir, { recursive: true, force: true });
      await completeUploadSession(input.uploadId, url);
      return {
        success: true,
        url,
        key
      };
    } catch (error) {
      console.error("[CompleteUpload] Error:", error);
      await failUploadSession(input.uploadId, error instanceof Error ? error.message : "Unknown error");
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete upload"
      });
    }
  }),
  /**
   * Cancel an upload
   */
  cancelUpload: protectedProcedure.input(
    z4.object({
      uploadId: z4.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const session = await getUploadSession(input.uploadId);
    if (!session) {
      throw new TRPCError4({
        code: "NOT_FOUND",
        message: "Upload session not found"
      });
    }
    if (session.userId !== ctx.user.id) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Not authorized to cancel this upload"
      });
    }
    try {
      const uploadTempDir = path6.join(TEMP_DIR, input.uploadId);
      await fs6.rm(uploadTempDir, { recursive: true, force: true });
      await cancelUploadSession(input.uploadId);
      return { success: true };
    } catch (error) {
      console.error("[CancelUpload] Error:", error);
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel upload"
      });
    }
  }),
  /**
   * Get upload session status
   */
  getUploadStatus: protectedProcedure.input(
    z4.object({
      uploadId: z4.string()
    })
  ).query(async ({ ctx, input }) => {
    const session = await getUploadSession(input.uploadId);
    if (!session) {
      throw new TRPCError4({
        code: "NOT_FOUND",
        message: "Upload session not found"
      });
    }
    if (session.userId !== ctx.user.id) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "Not authorized to view this upload"
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
      errorMessage: session.errorMessage
    };
  })
});

// server/localProcessorRouter.ts
import { z as z5 } from "zod";
init_storageAdapter();
import { nanoid as nanoid2 } from "nanoid";
var localProcessorRouter = router({
  /**
   * 上传音频文件
   * 桌面应用提取音频后调用此接口上传
   */
  uploadAudio: protectedProcedure.input(z5.object({
    filename: z5.string(),
    contentType: z5.string(),
    fileSize: z5.number(),
    base64Data: z5.string()
    // Base64编码的音频数据
  })).mutation(async ({ input, ctx }) => {
    const { filename, contentType, fileSize, base64Data } = input;
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`\u97F3\u9891\u6587\u4EF6\u5927\u5C0F\u8D85\u8FC7\u9650\u5236\uFF08\u6700\u5927100MB\uFF09`);
    }
    const fileBuffer = Buffer.from(base64Data, "base64");
    const timestamp2 = Date.now();
    const randomId = nanoid2(10);
    const fileKey = `audio/${ctx.user.id}/${timestamp2}-${randomId}-${filename}`;
    const { url } = await storagePut3(fileKey, fileBuffer, contentType);
    return {
      url,
      key: fileKey,
      filename,
      fileSize
    };
  }),
  /**
   * 转录音频并进行AI分析
   * 一次性完成转录和分析，返回片段列表
   */
  analyzeAudio: protectedProcedure.input(z5.object({
    audioUrl: z5.string(),
    audioKey: z5.string(),
    videoDuration: z5.number(),
    // 视频总时长（秒）
    userRequirement: z5.string(),
    // 用户需求描述
    asrMethod: z5.enum(["whisper", "aliyun"]).default("whisper")
  })).mutation(async ({ input, ctx }) => {
    const { audioUrl, videoDuration, userRequirement, asrMethod } = input;
    try {
      console.log("[LocalProcessor] \u5F00\u59CB\u8F6C\u5F55\u97F3\u9891...");
      const transcriptResult = await transcribeAudioFromUrl(audioUrl, asrMethod);
      const transcript = transcriptResult.text;
      console.log("[LocalProcessor] \u8F6C\u5F55\u5B8C\u6210\uFF0C\u6587\u672C\u957F\u5EA6:", transcript.length);
      console.log("[LocalProcessor] \u5F00\u59CBAI\u5206\u6790...");
      const segments = await analyzeContentFromTranscript(
        transcriptResult,
        userRequirement
      );
      console.log("[LocalProcessor] AI\u5206\u6790\u5B8C\u6210\uFF0C\u7247\u6BB5\u6570\u91CF:", segments.length);
      return {
        success: true,
        transcript,
        segments,
        reasoning: "AI\u5206\u6790\u5B8C\u6210"
      };
    } catch (error) {
      console.error("[LocalProcessor] \u5206\u6790\u5931\u8D25:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }),
  /**
   * 仅转录音频（不进行AI分析）
   * 用于需要查看转录文本的场景
   */
  transcribeOnly: protectedProcedure.input(z5.object({
    audioUrl: z5.string(),
    asrMethod: z5.enum(["whisper", "aliyun"]).default("whisper")
  })).mutation(async ({ input }) => {
    const { audioUrl, asrMethod } = input;
    try {
      console.log("[LocalProcessor] \u5F00\u59CB\u8F6C\u5F55\u97F3\u9891...");
      const result = await transcribeAudioFromUrl(audioUrl, asrMethod);
      return {
        success: true,
        transcript: result.text
      };
    } catch (error) {
      console.error("[LocalProcessor] \u8F6C\u5F55\u5931\u8D25:", error);
      return {
        success: false,
        error: error.message
      };
    }
  })
});
async function transcribeAudioFromUrl(audioUrl, asrMethod) {
  const { transcribeAudio: transcribeAudioAPI } = await Promise.resolve().then(() => (init_voiceTranscription(), voiceTranscription_exports));
  const result = await transcribeAudioAPI({
    audioUrl,
    language: "zh",
    prompt: "\u8BF7\u8F6C\u5F55\u8FD9\u6BB5\u4E2D\u6587\u6F14\u8BB2\u5185\u5BB9"
  });
  if ("error" in result) {
    throw new Error(result.error);
  }
  return result;
}
async function analyzeContentFromTranscript(transcript, userRequirement) {
  const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
  let fullText = "";
  for (let i = 0; i < transcript.segments.length; i++) {
    const seg = transcript.segments[i];
    fullText += `[\u7247\u6BB5${i}] ${seg.start.toFixed(1)}s-${seg.end.toFixed(1)}s: ${seg.text.trim()}
`;
  }
  const prompt = `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u5E08\u3002\u8BF7\u5206\u6790\u4EE5\u4E0B\u6F14\u8BB2\u6587\u672C\uFF0C\u6839\u636E\u7528\u6237\u9700\u6C42\u9009\u62E9\u5408\u9002\u7684\u7247\u6BB5\u3002

\u6F14\u8BB2\u6587\u672C\uFF08\u5E26\u65F6\u95F4\u6233\uFF09\uFF1A
${fullText}

\u7528\u6237\u9700\u6C42\uFF1A
${userRequirement}

\u8BF7\u4ED4\u7EC6\u5206\u6790\u6587\u672C\u5185\u5BB9\uFF0C\u9009\u62E9\u6700\u7B26\u5408\u7528\u6237\u9700\u6C42\u7684\u7247\u6BB5\u3002\u4F60\u9700\u8981\uFF1A
1. \u7406\u89E3\u7528\u6237\u7684\u5177\u4F53\u9700\u6C42
2. \u627E\u51FA\u6700\u76F8\u5173\u3001\u6700\u7CBE\u5F69\u7684\u7247\u6BB5
3. \u786E\u4FDD\u9009\u62E9\u7684\u7247\u6BB5\u8BED\u4E49\u5B8C\u6574
4. \u6309\u7167\u5408\u7406\u7684\u987A\u5E8F\u6392\u5217\u7247\u6BB5

\u8BF7\u4EE5JSON\u683C\u5F0F\u8FD4\u56DE\u7ED3\u679C\uFF0C\u683C\u5F0F\u5982\u4E0B\uFF1A
{
  "selected_segments": [
    {
      "segment_ids": [0, 1, 2],
      "start": 10.5,
      "end": 45.3,
      "reason": "\u8FD9\u6BB5\u5185\u5BB9\u8BB2\u8FF0\u4E86..."
    }
  ],
  "arrangement_reason": "\u6211\u9009\u62E9\u8FD9\u6837\u7684\u987A\u5E8F\u662F\u56E0\u4E3A..."
}

\u6CE8\u610F\uFF1A
- segment_ids\u662F\u8FDE\u7EED\u7247\u6BB5\u7684ID\u5217\u8868
- start\u548Cend\u662F\u8BE5\u7EC4\u7247\u6BB5\u7684\u8D77\u6B62\u65F6\u95F4
- \u53EF\u4EE5\u9009\u62E9\u591A\u7EC4\u7247\u6BB5
- \u786E\u4FDD\u65F6\u95F4\u6233\u51C6\u786E`;
  const response = await invokeLLM2({
    messages: [
      { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u89C6\u9891\u5185\u5BB9\u5206\u6790\u5E08\uFF0C\u64C5\u957F\u7406\u89E3\u7528\u6237\u9700\u6C42\u5E76\u9009\u62E9\u6700\u5408\u9002\u7684\u5185\u5BB9\u7247\u6BB5\u3002" },
      { role: "user", content: prompt }
    ],
    max_tokens: 2e3
  });
  const content = response.choices[0].message.content;
  let resultText = typeof content === "string" ? content.trim() : JSON.stringify(content);
  if (resultText.includes("```json")) {
    const jsonStart = resultText.indexOf("```json") + 7;
    const jsonEnd = resultText.indexOf("```", jsonStart);
    resultText = resultText.substring(jsonStart, jsonEnd).trim();
  } else if (resultText.includes("```")) {
    const jsonStart = resultText.indexOf("```") + 3;
    const jsonEnd = resultText.indexOf("```", jsonStart);
    resultText = resultText.substring(jsonStart, jsonEnd).trim();
  }
  const result = JSON.parse(resultText);
  return result.selected_segments;
}

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  video: videoRouter,
  version: versionRouter,
  upload: uploadRouter,
  localProcessor: localProcessorRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  if (process.env.DESKTOP_MODE === "true") {
    const { getOrCreateDesktopUser: getOrCreateDesktopUser2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    user = await getOrCreateDesktopUser2();
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs8 from "fs";
import { nanoid as nanoid3 } from "nanoid";
import path8 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs7 from "node:fs";
import path7 from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path7.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs7.existsSync(LOG_DIR)) {
    fs7.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs7.existsSync(logPath) || fs7.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs7.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs7.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path7.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs7.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path7.resolve(import.meta.dirname, "client", "src"),
      "@shared": path7.resolve(import.meta.dirname, "shared"),
      "@assets": path7.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path7.resolve(import.meta.dirname),
  root: path7.resolve(import.meta.dirname, "client"),
  publicDir: path7.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path7.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path8.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs8.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid3()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path8.resolve(import.meta.dirname, "../..", "dist", "public") : path8.resolve(import.meta.dirname, "public");
  if (!fs8.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path8.resolve(distPath, "index.html"));
  });
}

// server/uploadRoute.ts
init_storageAdapter();
import express2 from "express";
import multer from "multer";
import fs9 from "fs/promises";
import path9 from "path";
var router2 = express2.Router();
var upload = multer({
  dest: "/tmp/video-uploads",
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
    // 2GB
  }
});
router2.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "\u6CA1\u6709\u4E0A\u4F20\u6587\u4EF6" });
    }
    const file = req.file;
    const userId = req.userId || "anonymous";
    console.log("Received file upload:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });
    const fileBuffer = await fs9.readFile(file.path);
    const timestamp2 = Date.now();
    const originalFilename = file.originalname;
    const ext = path9.extname(originalFilename);
    const basename = path9.basename(originalFilename, ext);
    let safeBasename = basename.toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!safeBasename) {
      safeBasename = "video";
    }
    const safeFilename = `${safeBasename}${ext}`;
    const fileKey = `videos/${userId}/${timestamp2}-${safeFilename}`;
    const { url } = await storagePut3(fileKey, fileBuffer, file.mimetype);
    await fs9.unlink(file.path);
    res.json({
      success: true,
      fileKey,
      url,
      filename: safeFilename,
      // 使用简化后的文件名，与S3键一致
      size: file.size,
      contentType: file.mimetype
    });
  } catch (error) {
    console.error("File upload error:", error);
    if (req.file?.path) {
      try {
        await fs9.unlink(req.file.path);
      } catch (e) {
        console.error("Failed to cleanup temp file:", e);
      }
    }
    res.status(500).json({
      error: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25",
      message: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
    });
  }
});
var uploadRoute_default = router2;

// server/jobProcessor.ts
init_db();
init_schema();
import { eq as eq7 } from "drizzle-orm";
async function processPendingJobs() {
  const db = await getDb();
  if (!db) {
    console.warn("[JobProcessor] Database not available, skipping pending jobs check");
    return;
  }
  try {
    const pendingJobs = await db.select().from(videoJobs).where(eq7(videoJobs.status, "pending"));
    if (pendingJobs.length === 0) {
      console.log("[JobProcessor] No pending jobs found");
      return;
    }
    console.log(`[JobProcessor] Found ${pendingJobs.length} pending jobs, starting processing...`);
    for (const job of pendingJobs) {
      console.log(`[JobProcessor] Starting job ${job.id}: ${job.originalFilename}`);
      processVideoAsync(job.id).catch((error) => {
        console.error(`[JobProcessor] Job ${job.id} failed:`, error);
      });
    }
  } catch (error) {
    console.error("[JobProcessor] Failed to process pending jobs:", error);
  }
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express3();
  const server = createServer(app);
  app.use(express3.json({ limit: "50mb" }));
  app.use(express3.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use("/api", uploadRoute_default);
  if (process.env.DESKTOP_MODE === "true") {
    const storageDir = process.env.LOCAL_STORAGE_DIR || path10.join(process.cwd(), "storage");
    app.use("/storage", express3.static(storageDir));
    console.log("[Desktop Mode] Serving local storage from:", storageDir);
  }
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.timeout = 6e5;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    setTimeout(() => {
      processPendingJobs().catch(console.error);
    }, 2e3);
  });
}
startServer().catch(console.error);
