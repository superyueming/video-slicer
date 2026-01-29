# AI视频智能切片 - 桌面应用完整指南

## 📋 目录

1. [架构概览](#架构概览)
2. [快速开始](#快速开始)
3. [强制更新机制](#强制更新机制)
4. [在线验证机制](#在线验证机制)
5. [发布流程](#发布流程)
6. [常见问题](#常见问题)

---

## 架构概览

### 整体架构

```
桌面应用 (Electron)
├── 主进程 (Main Process)
│   ├── 启动检查
│   │   ├── 版本检查 (UpdateManager)
│   │   └── 在线验证 (OnlineVerifier)
│   ├── 本地服务器 (Express + tRPC)
│   └── 窗口管理
├── 渲染进程 (Renderer Process)
│   └── React前端 (复用Web版)
└── 后端服务
    ├── 版本管理API (Web项目提供)
    ├── 视频处理API
    └── 用户认证API
```

### 核心模块

| 模块 | 文件 | 功能 |
|------|------|------|
| 主进程入口 | `desktop/src/main.ts` | 应用启动、窗口管理、流程控制 |
| 更新管理器 | `desktop/src/updater.ts` | 检查更新、下载安装包、执行更新 |
| 在线验证器 | `desktop/src/onlineVerifier.ts` | 验证在线状态、定期检查、设备ID管理 |
| 服务器启动 | `desktop/src/server.ts` | 启动Express服务器、端口管理 |
| 预加载脚本 | `desktop/src/preload.ts` | 安全地暴露API给渲染进程 |

---

## 快速开始

### 1. 环境要求

- Node.js >= 18
- npm >= 9
- 已完成Web项目的构建

### 2. 安装依赖

```bash
cd desktop
npm install
```

### 3. 配置服务器地址

编辑 `desktop/src/main.ts`，修改服务器URL：

```typescript
const SERVER_URL = 'https://your-production-server.com';
```

### 4. 开发模式运行

```bash
npm run dev
```

### 5. 构建生产版本

```bash
# 构建当前平台
npm run dist

# 构建Windows版本
npm run dist:win

# 构建Mac版本
npm run dist:mac

# 构建Linux版本
npm run dist:linux
```

构建产物位于 `desktop/release/` 目录。

---

## 强制更新机制

### 工作流程

```
应用启动
  ↓
调用版本检查API
  ↓
比较版本号
  ↓
┌─────────────────┐
│ 版本 < 最低版本? │
└─────────────────┘
  ↓ 是           ↓ 否
显示强制更新    检查可选更新
  ↓               ↓
下载安装包      提示用户
  ↓               ↓
自动安装        继续启动
  ↓
重启应用
```

### 版本比较逻辑

使用**语义化版本号**（Semantic Versioning）：

```
1.0.0 < 1.0.1 < 1.1.0 < 2.0.0
```

- **Major**（主版本号）：不兼容的API变更
- **Minor**（次版本号）：向后兼容的功能新增
- **Patch**（修订号）：向后兼容的问题修正

### 强制更新触发条件

```typescript
if (currentVersion < minRequiredVersion) {
  // 强制更新
  forceUpdate = true;
}
```

### 配置强制更新

在Web管理端创建新版本时：

```typescript
// 示例：发布2.0.0版本，强制所有用户更新
{
  version: "2.0.0",
  minRequiredVersion: "2.0.0",  // 低于此版本无法使用
  forceUpdate: true,
  downloadUrl: "https://cdn.example.com/app-2.0.0.exe"
}
```

```typescript
// 示例：发布1.1.0版本，可选更新
{
  version: "1.1.0",
  minRequiredVersion: "1.0.0",  // 仍允许1.0.0使用
  forceUpdate: false,
  downloadUrl: "https://cdn.example.com/app-1.1.0.exe"
}
```

---

## 在线验证机制

### 为什么需要在线验证？

1. **防止盗版**：确保用户使用的是授权版本
2. **版本控制**：随时禁用过期版本
3. **许可管理**：未来可扩展为许可证验证
4. **数据安全**：确保应用连接到正确的服务器

### 验证流程

```
应用启动
  ↓
初次验证
  ↓
┌──────────────┐
│ 验证通过?    │
└──────────────┘
  ↓ 是       ↓ 否
启动应用    显示错误并退出
  ↓
定期验证 (每5分钟)
  ↓
┌──────────────┐
│ 验证失败?    │
└──────────────┘
  ↓ 是
显示错误并关闭应用
```

### 设备ID

每个设备生成唯一ID，存储在：

```
Windows: C:\Users\<用户名>\AppData\Roaming\video-slicer-desktop\device-id.txt
Mac: ~/Library/Application Support/video-slicer-desktop/device-id.txt
Linux: ~/.config/video-slicer-desktop/device-id.txt
```

### 修改验证频率

编辑 `desktop/src/main.ts`：

```typescript
// 修改为10分钟验证一次
onlineVerifier.startPeriodicVerification(10 * 60 * 1000, onFailure);
```

### 离线场景处理

**当前策略：离线则无法使用**

```typescript
if (!verifyResult.online) {
  // 显示错误：无法连接到服务器
  app.quit();
}
```

**未来可选：离线宽限期**

```typescript
// 允许离线使用24小时
const lastOnlineTime = getLastOnlineTime();
const offlineDuration = Date.now() - lastOnlineTime;

if (offlineDuration > 24 * 60 * 60 * 1000) {
  // 超过24小时，禁止使用
  app.quit();
}
```

---

## 发布流程

### 完整发布流程

#### 1. 准备新版本

```bash
# 1.1 修改版本号
# 编辑 desktop/package.json
{
  "version": "1.1.0"
}

# 编辑 desktop/src/main.ts
const APP_VERSION = '1.1.0';

# 1.2 构建Web项目
cd /path/to/video-slicer-web
npm run build

# 1.3 构建桌面应用
cd desktop
npm run dist
```

#### 2. 上传安装包

```bash
# 2.1 找到构建产物
desktop/release/
├── AI视频智能切片 Setup 1.1.0.exe  # Windows
├── AI视频智能切片-1.1.0.dmg         # Mac
└── AI视频智能切片-1.1.0.AppImage    # Linux

# 2.2 上传到S3或CDN
aws s3 cp "AI视频智能切片 Setup 1.1.0.exe" s3://your-bucket/desktop-releases/
aws s3 cp "AI视频智能切片-1.1.0.dmg" s3://your-bucket/desktop-releases/
aws s3 cp "AI视频智能切片-1.1.0.AppImage" s3://your-bucket/desktop-releases/

# 2.3 获取公开URL
https://cdn.example.com/desktop-releases/AI视频智能切片%20Setup%201.1.0.exe
```

#### 3. 在Web管理端创建版本记录

访问管理后台（需要管理员权限），调用API：

```typescript
// 使用tRPC客户端
await trpc.version.createVersion.mutate({
  version: "1.1.0",
  minRequiredVersion: "1.0.0",  // 决定是否强制更新
  forceUpdate: false,            // 可选更新
  downloadUrlWindows: "https://cdn.example.com/desktop-releases/AI视频智能切片%20Setup%201.1.0.exe",
  downloadUrlMac: "https://cdn.example.com/desktop-releases/AI视频智能切片-1.1.0.dmg",
  downloadUrlLinux: "https://cdn.example.com/desktop-releases/AI视频智能切片-1.1.0.AppImage",
  releaseNotes: "修复了视频处理bug，提升了性能",
});
```

#### 4. 测试更新流程

```bash
# 4.1 安装旧版本（如1.0.0）
# 4.2 启动应用
# 4.3 观察更新提示
# 4.4 测试更新下载和安装
```

#### 5. 通知用户

- 发送邮件通知
- 应用内弹窗提示
- 官网发布公告

### 强制更新发布

当需要强制所有用户更新时：

```typescript
await trpc.version.createVersion.mutate({
  version: "2.0.0",
  minRequiredVersion: "2.0.0",  // 强制更新：低于2.0.0无法使用
  forceUpdate: true,
  downloadUrlWindows: "...",
  releaseNotes: "重大更新，修复安全漏洞，必须更新",
});
```

### 版本管理最佳实践

| 场景 | minRequiredVersion | forceUpdate | 说明 |
|------|-------------------|-------------|------|
| 小bug修复 | 保持不变 | false | 可选更新 |
| 新功能 | 保持不变 | false | 可选更新 |
| 安全漏洞 | 设为当前版本 | true | 强制更新 |
| 重大变更 | 设为当前版本 | true | 强制更新 |
| API不兼容 | 设为当前版本 | true | 强制更新 |

---

## 常见问题

### Q1: 如何跳过更新测试？

**开发模式**：注释掉版本检查

```typescript
// desktop/src/main.ts
app.whenReady().then(async () => {
  serverPort = await startServer();
  
  // 注释掉版本检查
  // const canProceed = await checkUpdateAndVerify();
  // if (!canProceed) return;
  
  await createWindow();
});
```

### Q2: 如何禁用在线验证？

```typescript
// desktop/src/main.ts
// 注释掉定期验证
// onlineVerifier.startPeriodicVerification(5 * 60 * 1000, onFailure);
```

### Q3: 更新下载失败怎么办？

**原因可能是：**
1. 网络问题
2. 下载链接失效
3. 文件权限问题

**解决方案：**
- 检查网络连接
- 验证S3/CDN链接可访问
- 检查临时目录权限

### Q4: 如何支持断点续传？

当前实现不支持断点续传。如需支持，可以使用 `electron-updater` 库：

```bash
npm install electron-updater
```

```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
```

### Q5: 如何实现增量更新？

**方案1：使用electron-updater**
- 支持增量更新（delta updates）
- 只下载变更的文件

**方案2：自定义实现**
- 使用bsdiff算法生成补丁
- 下载补丁文件而非完整安装包

### Q6: Mac版本需要签名吗？

**是的**，Mac版本需要代码签名才能正常分发：

```bash
# 配置签名
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password

# 构建并签名
npm run dist:mac
```

### Q7: Windows版本被杀毒软件拦截？

**原因：**未签名的可执行文件会被标记为不安全。

**解决方案：**
1. 购买代码签名证书
2. 配置electron-builder签名

```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"]
  }
}
```

### Q8: 如何实现自动更新服务器？

**方案1：使用GitHub Releases**

```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "video-slicer-desktop"
  }
}
```

**方案2：使用S3**

```json
{
  "publish": {
    "provider": "s3",
    "bucket": "your-bucket",
    "region": "us-east-1"
  }
}
```

**方案3：自建服务器**

需要提供以下文件：
- `latest.yml` (Windows)
- `latest-mac.yml` (Mac)
- `latest-linux.yml` (Linux)
- 安装包文件

### Q9: 如何监控更新成功率？

**添加埋点：**

```typescript
// desktop/src/updater.ts
async downloadAndInstall() {
  try {
    await this.downloadFile(...);
    await this.installUpdate(...);
    
    // 上报成功
    analytics.track('update_success', {
      from: this.currentVersion,
      to: updateInfo.latestVersion,
    });
  } catch (error) {
    // 上报失败
    analytics.track('update_failed', {
      from: this.currentVersion,
      to: updateInfo.latestVersion,
      error: error.message,
    });
  }
}
```

### Q10: 数据库怎么办？

**当前方案：使用远程数据库**
- 桌面应用连接到Web项目的数据库
- 无需本地数据库

**未来方案：本地SQLite**
- 使用SQLite存储本地数据
- 定期同步到远程服务器
- 需要修改`drizzle.config.ts`和数据库连接

---

## 附录

### A. 完整的版本管理API

```typescript
// 检查更新
GET /api/trpc/version.checkUpdate?input={"json":{"currentVersion":"1.0.0","platform":"windows"}}

// 在线验证
GET /api/trpc/version.verifyOnline?input={"json":{"appVersion":"1.0.0","deviceId":"xxx"}}

// 查看所有版本（管理员）
GET /api/trpc/version.listVersions

// 创建新版本（管理员）
POST /api/trpc/version.createVersion
{
  "version": "1.1.0",
  "minRequiredVersion": "1.0.0",
  "forceUpdate": false,
  "downloadUrlWindows": "...",
  "releaseNotes": "..."
}

// 更新版本信息（管理员）
POST /api/trpc/version.updateVersion
{
  "id": 1,
  "enabled": true,
  "forceUpdate": true
}
```

### B. 目录结构

```
video-slicer-web/
├── client/              # React前端
├── server/              # Express后端
├── drizzle/             # 数据库schema
├── shared/              # 共享代码
├── desktop/             # 桌面应用 ⭐
│   ├── src/
│   │   ├── main.ts           # 主进程
│   │   ├── updater.ts        # 更新管理
│   │   ├── onlineVerifier.ts # 在线验证
│   │   ├── server.ts         # 服务器启动
│   │   └── preload.ts        # 预加载脚本
│   ├── build/           # 构建资源
│   ├── dist/            # 编译输出
│   ├── release/         # 打包产物
│   ├── package.json
│   ├── tsconfig.main.json
│   └── README.md
└── DESKTOP_APP_GUIDE.md # 本文档
```

### C. 相关资源

- [Electron官方文档](https://www.electronjs.org/docs)
- [electron-builder文档](https://www.electron.build/)
- [electron-updater文档](https://www.electron.build/auto-update)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

---

**最后更新：2026-01-29**
