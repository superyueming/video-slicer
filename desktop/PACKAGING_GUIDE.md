# 桌面应用打包指南

## 📦 打包前准备

### 1. 准备图标文件

将以下图标文件放入 `desktop/build/` 目录：

- **Windows**: `icon.ico` (256x256 或更大，包含多个尺寸)
- **Mac**: `icon.icns` (512x512@2x)
- **Linux**: `icon.png` (512x512)

#### 生成图标的方法

**方案1：使用在线工具**
- 访问 https://www.icoconverter.com/ 或 https://cloudconvert.com/
- 上传PNG图片（建议1024x1024）
- 转换为ico/icns格式

**方案2：使用命令行工具**

```bash
# 安装工具
npm install -g electron-icon-maker

# 生成所有平台图标（需要一个1024x1024的PNG）
electron-icon-maker --input=icon.png --output=./build
```

**临时方案：使用占位图标**

如果暂时没有图标，可以先注释掉package.json中的icon配置：

```json
{
  "win": {
    "target": ["nsis"]
    // "icon": "build/icon.ico"  // 暂时注释
  }
}
```

---

### 2. 安装依赖

```bash
cd desktop
npm install
```

### 3. 构建Web项目

```bash
cd ..
npm run build
```

这会生成 `dist/` 目录，包含前端静态文件和后端代码。

---

## 🔨 打包步骤

### 方法1：打包当前平台（推荐）

```bash
cd desktop
npm run build:main    # 编译TypeScript
npm run dist          # 打包当前平台
```

### 方法2：打包指定平台

```bash
# Windows安装包
npm run dist:win

# Mac安装包
npm run dist:mac

# Linux安装包
npm run dist:linux
```

### 方法3：只打包不安装（测试用）

```bash
npm run pack
```

这会生成未打包的应用文件，可以直接运行但不生成安装包。

---

## 📁 打包产物

打包完成后，安装包位于 `desktop/release/` 目录：

```
desktop/release/
├── AI视频智能切片 Setup 1.0.0.exe      # Windows安装包 (NSIS)
├── AI视频智能切片-1.0.0.dmg             # Mac安装包 (DMG)
├── AI视频智能切片-1.0.0.AppImage        # Linux安装包 (AppImage)
└── builder-effective-config.yaml        # 构建配置（调试用）
```

---

## 🚀 安装和测试

### Windows

1. 双击 `AI视频智能切片 Setup 1.0.0.exe`
2. 选择安装目录
3. 完成安装
4. 从开始菜单或桌面快捷方式启动

### Mac

1. 双击 `AI视频智能切片-1.0.0.dmg`
2. 将应用拖到Applications文件夹
3. 从Launchpad或Applications启动
4. 如果提示"无法验证开发者"，右键点击选择"打开"

### Linux

```bash
chmod +x AI视频智能切片-1.0.0.AppImage
./AI视频智能切片-1.0.0.AppImage
```

---

## ⚙️ 高级配置

### 修改应用名称和版本

编辑 `desktop/package.json`:

```json
{
  "name": "video-slicer-desktop",
  "version": "1.0.0",           // 修改版本号
  "build": {
    "productName": "AI视频智能切片"  // 修改显示名称
  }
}
```

同时修改 `desktop/src/main.ts`:

```typescript
const APP_VERSION = '1.0.0';  // 与package.json保持一致
```

### 修改服务器地址

编辑 `desktop/src/main.ts`:

```typescript
const SERVER_URL = 'https://your-production-server.com';
```

### 配置自动更新服务器

编辑 `desktop/package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://your-cdn.com/updates"
    }
  }
}
```

### 包含额外文件

如果需要打包额外的文件（如FFmpeg），编辑 `desktop/package.json`:

```json
{
  "build": {
    "extraResources": [
      {
        "from": "resources/ffmpeg.exe",
        "to": "ffmpeg.exe"
      }
    ]
  }
}
```

---

## 🐛 常见问题

### Q: 打包失败：找不到dist目录

**原因**: 没有先构建Web项目

**解决**:
```bash
cd /path/to/video-slicer-web
npm run build
cd desktop
npm run dist
```

### Q: 打包失败：找不到icon文件

**原因**: 缺少图标文件

**解决**:
1. 准备图标文件放入 `desktop/build/`
2. 或临时注释掉package.json中的icon配置

### Q: Windows安装包被杀毒软件拦截

**原因**: 未签名的可执行文件

**解决**:
1. 购买代码签名证书
2. 配置签名（见下方"代码签名"章节）
3. 或暂时添加到杀毒软件白名单

### Q: Mac提示"无法验证开发者"

**原因**: 应用未签名

**解决**:
1. 右键点击应用，选择"打开"
2. 或在终端运行: `xattr -cr /Applications/AI视频智能切片.app`
3. 或配置Mac代码签名（见下方）

### Q: 打包后的应用很大（>200MB）

**原因**: Electron打包了完整的Chromium和Node.js

**这是正常的**。可以通过以下方式优化：
1. 使用asar压缩: 已默认启用
2. 排除不必要的文件
3. 使用electron-builder的压缩选项

### Q: 应用启动失败

**检查步骤**:
1. 查看日志文件（Windows: `%APPDATA%\video-slicer-desktop\logs\`）
2. 检查服务器地址是否正确
3. 检查网络连接
4. 尝试在开发模式运行: `npm run dev`

---

## 🔐 代码签名（可选但推荐）

### Windows代码签名

1. **购买证书**
   - 从DigiCert、Sectigo等CA购买代码签名证书
   - 价格约$200-500/年

2. **配置签名**

编辑 `desktop/package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password",
      "signingHashAlgorithms": ["sha256"],
      "sign": "./customSign.js"  // 可选：自定义签名脚本
    }
  }
}
```

或使用环境变量：

```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-password
npm run dist:win
```

### Mac代码签名

1. **加入Apple Developer Program**
   - 费用: $99/年
   - 获取Developer ID证书

2. **配置签名**

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    }
  }
}
```

3. **公证（Notarization）**

```bash
# 打包后自动公证
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
npm run dist:mac
```

---

## 📊 打包大小优化

### 当前大小估算

- **Windows**: ~150-200MB (NSIS安装包)
- **Mac**: ~180-250MB (DMG)
- **Linux**: ~150-200MB (AppImage)

### 优化建议

1. **启用asar压缩**（已默认启用）

```json
{
  "build": {
    "asar": true
  }
}
```

2. **排除不必要的文件**

```json
{
  "build": {
    "files": [
      "!**/*.map",
      "!**/*.md",
      "!**/test/**"
    ]
  }
}
```

3. **使用7zip压缩（Windows）**

```json
{
  "build": {
    "nsis": {
      "differentialPackage": true
    }
  }
}
```

---

## 🚢 发布流程

### 1. 构建所有平台

```bash
# 在Mac上构建Mac版本
npm run dist:mac

# 在Windows上构建Windows版本
npm run dist:win

# 在Linux上构建Linux版本
npm run dist:linux
```

### 2. 上传到S3/CDN

```bash
aws s3 cp "desktop/release/AI视频智能切片 Setup 1.0.0.exe" \
  s3://your-bucket/desktop-releases/

aws s3 cp "desktop/release/AI视频智能切片-1.0.0.dmg" \
  s3://your-bucket/desktop-releases/

aws s3 cp "desktop/release/AI视频智能切片-1.0.0.AppImage" \
  s3://your-bucket/desktop-releases/
```

### 3. 在Web管理端创建版本记录

```typescript
await trpc.version.createVersion.mutate({
  version: "1.0.0",
  minRequiredVersion: "1.0.0",
  forceUpdate: false,
  downloadUrlWindows: "https://cdn.example.com/desktop-releases/AI视频智能切片%20Setup%201.0.0.exe",
  downloadUrlMac: "https://cdn.example.com/desktop-releases/AI视频智能切片-1.0.0.dmg",
  downloadUrlLinux: "https://cdn.example.com/desktop-releases/AI视频智能切片-1.0.0.AppImage",
  releaseNotes: "首次发布",
});
```

### 4. 通知用户

- 官网发布公告
- 发送邮件通知
- 社交媒体宣传

---

## 📝 检查清单

打包前确认：

- [ ] Web项目已构建 (`npm run build`)
- [ ] 图标文件已准备（或已注释icon配置）
- [ ] 服务器地址已配置正确
- [ ] 版本号已更新（package.json和main.ts）
- [ ] 依赖已安装 (`npm install`)
- [ ] TypeScript已编译 (`npm run build:main`)

打包后确认：

- [ ] 安装包已生成在 `desktop/release/`
- [ ] 安装包可以正常安装
- [ ] 应用可以正常启动
- [ ] 版本检查功能正常
- [ ] 在线验证功能正常
- [ ] 视频处理功能正常

发布前确认：

- [ ] 安装包已上传到CDN
- [ ] 下载链接可访问
- [ ] 版本记录已创建
- [ ] 更新流程已测试
- [ ] 发布公告已准备

---

**最后更新：2026-01-29**
