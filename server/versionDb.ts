import { getDb } from "./db";
import { appVersions, type AppVersion, type InsertAppVersion } from "../drizzle/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Compare two semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  
  return 0;
}

/**
 * Get the latest enabled app version (by version number, not release date)
 */
export async function getLatestVersion(): Promise<AppVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const versions = await db
    .select()
    .from(appVersions)
    .where(eq(appVersions.enabled, 1));
  
  if (versions.length === 0) return undefined;
  
  // Sort by version number (semantic versioning)
  versions.sort((a, b) => compareVersions(b.version, a.version));
  
  return versions[0];
}

/**
 * Get version by version string
 */
export async function getVersionByString(version: string): Promise<AppVersion | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const [result] = await db
    .select()
    .from(appVersions)
    .where(eq(appVersions.version, version))
    .limit(1);
  
  return result;
}

/**
 * Create a new version
 */
export async function createVersion(data: InsertAppVersion): Promise<AppVersion> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(appVersions).values(data).$returningId();
  const created = await getVersionByString(data.version);
  if (!created) {
    throw new Error("Failed to create version");
  }
  return created;
}

/**
 * Update version
 */
export async function updateVersion(id: number, data: Partial<InsertAppVersion>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(appVersions).set(data).where(eq(appVersions.id, id));
}

/**
 * Get all versions (for admin panel)
 */
export async function getAllVersions(): Promise<AppVersion[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(appVersions).orderBy(desc(appVersions.releaseDate));
}
