// S3预签名URL上传辅助函数
import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * 获取S3预签名上传URL
 * @param relKey 相对路径键
 * @param contentType 文件MIME类型
 * @returns 预签名URL和文件键
 */
export async function getPresignedUploadUrl(
  relKey: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  
  // 调用Manus存储API获取预签名URL
  const presignApiUrl = new URL(
    "v1/storage/presignedUploadUrl",
    ensureTrailingSlash(baseUrl)
  );
  presignApiUrl.searchParams.set("path", key);
  presignApiUrl.searchParams.set("contentType", contentType);
  
  const response = await fetch(presignApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Failed to get presigned URL (${response.status} ${response.statusText}): ${message}`
    );
  }

  const result = await response.json();
  
  return {
    uploadUrl: result.uploadUrl,
    key,
    publicUrl: result.publicUrl || result.url,
  };
}

/**
 * 确认上传完成（可选，用于验证）
 */
export async function confirmUpload(relKey: string): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  
  // 获取下载URL作为确认
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", key);
  
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });

  if (!response.ok) {
    throw new Error(`Failed to confirm upload: ${response.statusText}`);
  }

  const result = await response.json();
  
  return {
    key,
    url: result.url,
  };
}
