import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  getLatestVersion, 
  getAllVersions, 
  createVersion, 
  updateVersion,
  getVersionByString 
} from "./versionDb";
import { TRPCError } from "@trpc/server";

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

export const versionRouter = router({
  /**
   * Check for updates (public API for desktop app)
   * Returns latest version info and whether force update is required
   */
  checkUpdate: publicProcedure
    .input(z.object({
      currentVersion: z.string(),
      platform: z.enum(["windows", "mac", "linux"]).optional(),
    }))
    .query(async ({ input }) => {
      const latest = await getLatestVersion();
      
      if (!latest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No version information available",
        });
      }
      
      // Compare versions
      const needsUpdate = compareVersions(input.currentVersion, latest.version) < 0;
      const forceUpdate = compareVersions(input.currentVersion, latest.minRequiredVersion) < 0;
      
      // Select download URL based on platform
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
        releaseDate: latest.releaseDate,
      };
    }),
  
  /**
   * Verify online status (desktop app must call this periodically)
   * If this fails, the app should block usage
   */
  verifyOnline: publicProcedure
    .input(z.object({
      appVersion: z.string(),
      deviceId: z.string().optional(), // For future license management
    }))
    .query(async ({ input }) => {
      const latest = await getLatestVersion();
      
      if (!latest) {
        return {
          online: false,
          canUse: false,
          message: "无法连接到服务器",
        };
      }
      
      // Check if version is allowed
      const versionAllowed = compareVersions(input.appVersion, latest.minRequiredVersion) >= 0;
      
      return {
        online: true,
        canUse: versionAllowed,
        message: versionAllowed 
          ? "在线验证成功" 
          : `版本过低，最低要求版本 ${latest.minRequiredVersion}，请更新应用`,
        latestVersion: latest.version,
        minRequiredVersion: latest.minRequiredVersion,
      };
    }),
  
  /**
   * Get all versions (admin only)
   */
  listVersions: protectedProcedure
    .query(async ({ ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access version management",
        });
      }
      
      return getAllVersions();
    }),
  
  /**
   * Create new version (admin only)
   */
  createVersion: protectedProcedure
    .input(z.object({
      version: z.string(),
      minRequiredVersion: z.string(),
      forceUpdate: z.boolean().default(false),
      downloadUrlWindows: z.string().optional(),
      downloadUrlMac: z.string().optional(),
      downloadUrlLinux: z.string().optional(),
      releaseNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create versions",
        });
      }
      
      // Check if version already exists
      const existing = await getVersionByString(input.version);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Version already exists",
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
        releaseDate: new Date(),
      });
      
      return newVersion;
    }),
  
  /**
   * Update version (admin only)
   */
  updateVersion: protectedProcedure
    .input(z.object({
      id: z.number(),
      enabled: z.boolean().optional(),
      forceUpdate: z.boolean().optional(),
      downloadUrlWindows: z.string().optional(),
      downloadUrlMac: z.string().optional(),
      downloadUrlLinux: z.string().optional(),
      releaseNotes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update versions",
        });
      }
      
      const updateData: any = {};
      if (input.enabled !== undefined) updateData.enabled = input.enabled ? 1 : 0;
      if (input.forceUpdate !== undefined) updateData.forceUpdate = input.forceUpdate ? 1 : 0;
      if (input.downloadUrlWindows !== undefined) updateData.downloadUrlWindows = input.downloadUrlWindows;
      if (input.downloadUrlMac !== undefined) updateData.downloadUrlMac = input.downloadUrlMac;
      if (input.downloadUrlLinux !== undefined) updateData.downloadUrlLinux = input.downloadUrlLinux;
      if (input.releaseNotes !== undefined) updateData.releaseNotes = input.releaseNotes;
      
      await updateVersion(input.id, updateData);
      
      return { success: true };
    }),
});
