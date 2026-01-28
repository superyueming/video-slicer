import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("video.uploadVideo", () => {
  it("should accept files up to 2GB", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建一个小的测试数据
    const testData = Buffer.from("test video data").toString('base64');

    const result = await caller.video.uploadVideo({
      filename: "test-video.mp4",
      contentType: "video/mp4",
      fileSize: 100 * 1024 * 1024, // 100MB
      base64Data: testData,
    });

    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("key");
    expect(result.filename).toBe("test-video.mp4");
    expect(result.fileSize).toBe(100 * 1024 * 1024);
    expect(result.key).toContain("videos/1/");
    expect(result.key).toContain("test-video.mp4");
  });

  it("should reject files larger than 2GB", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.video.uploadVideo({
        filename: "huge-video.mp4",
        contentType: "video/mp4",
        fileSize: 3 * 1024 * 1024 * 1024, // 3GB
        base64Data: "dGVzdA==",
      })
    ).rejects.toThrow("文件大小超过限制");
  });

  it("should accept 1.2GB file (typical conference video)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testData = Buffer.from("conference video data").toString('base64');

    const result = await caller.video.uploadVideo({
      filename: "conference-2024.mp4",
      contentType: "video/mp4",
      fileSize: 1.2 * 1024 * 1024 * 1024, // 1.2GB
      base64Data: testData,
    });

    expect(result).toHaveProperty("url");
    expect(result.fileSize).toBe(1.2 * 1024 * 1024 * 1024);
  });
});
