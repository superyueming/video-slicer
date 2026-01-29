# 本地打包完整指南

## 📋 前提条件

### 所有平台通用
- Node.js 18+ 已安装
- Git 已安装
- 至少 5GB 可用磁盘空间

### Windows 平台额外要求
- Windows 10/11
- 无需额外工具（electron-builder会自动下载所需工具）

### Mac 平台额外要求
- macOS 10.13+
- Xcode Command Line Tools: `xcode-select --install`

### Linux 平台额外要求
- Ubuntu/Debian: `sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libsecret-1-0`

---

## 🚀 快速开始（推荐）

### 1. 下载项目代码

**方案A：从Manus下载**
1. 在Manus项目管理界面，点击"Code"面板
2. 点击"Download All Files"下载完整项目
3. 解压到本地目录（如 `C:\Projects\video-slicer-web`）

**方案B：使用Git克隆**
```bash
# 如果您已将代码导出到GitHub
git clone https://github.com/your-username/video-slicer-web.git
cd video-slicer-web
```

### 2. 安装依赖

```bash
# 安装Web项目依赖
npm install

# 安装desktop依赖
cd desktop
npm install
cd ..
```

### 3. 构建Web项目

```bash
npm run build
```

这会生成 `dist/` 目录，包含前端静态文件和后端代码。

### 4. 打包桌面应用

**Windows用户：**
```cmd
cd desktop
quick-build.bat
```

**Mac/Linux用户：**
```bash
cd desktop
./quick-build.sh
```

**或者手动打包：**
```bash
cd desktop

# 编译TypeScript
npm run build:main

# 打包当前平台
npm run dist

# 或指定平台
npm run dist:win      # Windows
npm run dist:mac      # Mac
npm run dist:linux    # Linux
```

### 5. 查看打包结果

安装包位于 `desktop/release/` 目录：

- **Windows**: `AI视频智能切片 Setup 1.0.0.exe`
- **Mac**: `AI视频智能切片-1.0.0.dmg`
- **Linux**: `AI视频智能切片-1.0.0.AppImage`

---

## 🔧 详细步骤说明

### 步骤1：准备项目代码

#### 从Manus下载项目

1. 登录Manus项目管理界面
2. 选择"video-slicer-web"项目
3. 点击右侧面板的"Code"标签
4. 点击"Download All Files"按钮
5. 保存zip文件到本地
6. 解压到工作目录（建议路径不含中文和空格）

#### 验证项目结构

解压后应该看到以下目录结构：

```
video-slicer-web/
├── client/           # 前端代码
├── server/           # 后端代码
├── desktop/          # Electron桌面应用
├── drizzle/          # 数据库schema
├── shared/           # 共享代码
├── package.json
└── ...
```

### 步骤2：安装Node.js（如果未安装）

#### Windows

1. 访问 https://nodejs.org/
2. 下载LTS版本（推荐22.x）
3. 运行安装程序，使用默认选项
4. 打开命令提示符，验证安装：
   ```cmd
   node --version
   npm --version
   ```

#### Mac

使用Homebrew安装：
```bash
brew install node@22
```

或从官网下载安装包：https://nodejs.org/

#### Linux

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 步骤3：安装项目依赖

打开终端（Windows用户打开PowerShell或CMD），进入项目目录：

```bash
# 进入项目根目录
cd C:\Projects\video-slicer-web  # Windows示例
# cd ~/Projects/video-slicer-web  # Mac/Linux示例

# 安装Web项目依赖
npm install

# 这会安装所有package.json中列出的依赖
# 可能需要5-10分钟，取决于网络速度
```

安装desktop依赖：

```bash
cd desktop
npm install
cd ..
```

### 步骤4：构建Web项目

```bash
# 在项目根目录执行
npm run build
```

**预期输出：**
```
> vite build && esbuild server/_core/index.ts ...
vite v7.1.9 building for production...
✓ 2600 modules transformed.
✓ built in 6.10s
```

**生成的文件：**
- `dist/public/` - 前端静态文件
- `dist/index.js` - 后端服务器代码

### 步骤5：编译Electron主进程

```bash
cd desktop
npm run build:main
```

这会将TypeScript代码编译为JavaScript，生成 `desktop/dist/` 目录。

### 步骤6：打包应用

#### 使用自动脚本（推荐）

**Windows：**
```cmd
quick-build.bat
```

**Mac/Linux：**
```bash
./quick-build.sh
```

脚本会自动完成所有步骤，并在最后显示打包结果。

#### 手动打包

如果自动脚本失败，可以手动执行：

```bash
# 确保在desktop目录
cd desktop

# 打包当前平台
npm run dist

# 或指定平台
npm run dist:win      # Windows
npm run dist:mac      # Mac  
npm run dist:linux    # Linux
```

**打包时间：**
- 首次打包：5-15分钟（需要下载Electron）
- 后续打包：2-5分钟

**打包过程输出示例：**
```
• electron-builder  version=24.13.3
• loaded configuration  file=package.json
• packaging       platform=win32 arch=x64
• downloading     url=https://github.com/electron/electron/...
• downloaded      duration=1.104s
• building        target=nsis file=release/AI视频智能切片 Setup 1.0.0.exe
• building block map  blockMapFile=release/AI视频智能切片 Setup 1.0.0.exe.blockmap
```

### 步骤7：测试安装包

#### Windows

1. 进入 `desktop/release/` 目录
2. 双击 `AI视频智能切片 Setup 1.0.0.exe`
3. 按照安装向导完成安装
4. 从开始菜单或桌面快捷方式启动应用

**可能遇到的问题：**
- **Windows Defender拦截**：点击"更多信息" → "仍要运行"
- **杀毒软件拦截**：添加到白名单或临时禁用

#### Mac

1. 进入 `desktop/release/` 目录
2. 双击 `AI视频智能切片-1.0.0.dmg`
3. 将应用拖到Applications文件夹
4. 从Launchpad或Applications启动

**可能遇到的问题：**
- **"无法验证开发者"**：右键点击应用 → 选择"打开"
- **或在终端运行**：
  ```bash
  xattr -cr /Applications/AI视频智能切片.app
  ```

#### Linux

```bash
cd desktop/release
chmod +x AI视频智能切片-1.0.0.AppImage
./AI视频智能切片-1.0.0.AppImage
```

---

## 🐛 常见问题排查

### 问题1：npm install失败

**错误信息：** `EACCES: permission denied` 或 `EPERM: operation not permitted`

**解决方案：**
- Windows：以管理员身份运行PowerShell/CMD
- Mac/Linux：不要使用sudo，检查文件夹权限
  ```bash
  sudo chown -R $USER:$USER ~/Projects/video-slicer-web
  ```

### 问题2：npm run build失败

**错误信息：** `Cannot find module 'xxx'`

**解决方案：**
```bash
# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 问题3：打包失败 - "wine is required"

**原因：** 在Linux上打包Windows应用需要Wine

**解决方案：**
- **推荐**：在Windows电脑上打包Windows应用
- **或安装Wine**：
  ```bash
  sudo dpkg --add-architecture i386
  sudo apt-get update
  sudo apt-get install wine64 wine32
  ```

### 问题4：打包失败 - "Cannot find module 'uuid'"

**解决方案：**
```bash
cd desktop
npm install uuid @types/uuid
npm run build:main
npm run dist
```

### 问题5：打包后的应用很大（>200MB）

**原因：** Electron打包了完整的Chromium和Node.js

**这是正常的**。可以通过以下方式优化：
- 已启用asar压缩
- 已排除不必要的文件
- 可以使用7zip进一步压缩安装包（用户侧）

### 问题6：应用启动后显示"无法连接到服务器"

**原因：** 服务器地址配置错误或网络问题

**解决方案：**
1. 检查 `desktop/src/main.ts` 中的 `SERVER_URL`
2. 确保服务器地址可访问
3. 检查防火墙设置

### 问题7：打包时提示图标文件找不到

**解决方案：**
```bash
# 检查图标文件是否存在
ls desktop/build/icon.*

# 如果不存在，从项目根目录重新生成
cd desktop/build
python3 -c "
from PIL import Image
img = Image.open('app-icon-1024.png')
img.resize((512, 512)).save('icon.png')
img.save('icon.ico', format='ICO', sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)])
"
```

---

## 📦 打包配置自定义

### 修改应用名称和版本

编辑 `desktop/package.json`:

```json
{
  "name": "video-slicer-desktop",
  "version": "1.0.0",           // 修改版本号
  "build": {
    "productName": "AI视频智能切片",  // 修改显示名称
    "appId": "com.videoslicer.app"   // 修改应用ID
  }
}
```

**同时修改** `desktop/src/main.ts`:

```typescript
const APP_VERSION = '1.0.0';  // 与package.json保持一致
```

### 修改服务器地址

编辑 `desktop/src/main.ts`:

```typescript
const SERVER_URL = 'https://your-production-domain.com';
```

**重要：** 修改后需要重新编译和打包：

```bash
cd desktop
npm run build:main
npm run dist
```

### 修改窗口大小和样式

编辑 `desktop/src/main.ts`:

```typescript
mainWindow = new BrowserWindow({
  width: 1200,        // 修改宽度
  height: 800,        // 修改高度
  minWidth: 800,      // 最小宽度
  minHeight: 600,     // 最小高度
  // ... 其他配置
});
```

### 添加自定义菜单

编辑 `desktop/src/main.ts`，在 `createWindow()` 函数中添加：

```typescript
import { Menu } from 'electron';

const menu = Menu.buildFromTemplate([
  {
    label: '文件',
    submenu: [
      { label: '新建任务', click: () => { /* ... */ } },
      { type: 'separator' },
      { label: '退出', role: 'quit' }
    ]
  },
  // ... 更多菜单项
]);

Menu.setApplicationMenu(menu);
```

---

## 🚢 发布流程

### 1. 准备发布

- [ ] 更新版本号（package.json和main.ts）
- [ ] 测试所有功能正常工作
- [ ] 准备发布说明（release notes）
- [ ] 确认服务器地址正确

### 2. 打包所有平台

**在Windows电脑上：**
```cmd
cd desktop
npm run dist:win
```

**在Mac电脑上：**
```bash
cd desktop
npm run dist:mac
```

**在Linux电脑上：**
```bash
cd desktop
npm run dist:linux
```

### 3. 上传安装包

将 `desktop/release/` 目录中的安装包上传到：
- CDN/S3存储
- GitHub Releases
- 自己的服务器

### 4. 创建版本记录

在Web管理端创建版本记录（或直接调用API）：

```bash
curl -X POST https://your-server.com/api/trpc/version.createVersion \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.0",
    "minRequiredVersion": "1.0.0",
    "forceUpdate": false,
    "downloadUrlWindows": "https://cdn.example.com/AI视频智能切片-Setup-1.0.0.exe",
    "downloadUrlMac": "https://cdn.example.com/AI视频智能切片-1.0.0.dmg",
    "downloadUrlLinux": "https://cdn.example.com/AI视频智能切片-1.0.0.AppImage",
    "releaseNotes": "首次发布"
  }'
```

### 5. 通知用户

- 发布公告
- 发送邮件通知
- 更新官网下载链接

---

## 📊 打包产物说明

### Windows (NSIS)

**文件：** `AI视频智能切片 Setup 1.0.0.exe`
**大小：** ~150-200MB
**特点：**
- 单文件安装包
- 支持自定义安装目录
- 自动创建桌面快捷方式和开始菜单项
- 支持静默安装：`Setup.exe /S`

### Mac (DMG)

**文件：** `AI视频智能切片-1.0.0.dmg`
**大小：** ~180-250MB
**特点：**
- 磁盘映像格式
- 拖拽安装
- 包含.app应用包

### Linux (AppImage)

**文件：** `AI视频智能切片-1.0.0.AppImage`
**大小：** ~150-200MB
**特点：**
- 单文件可执行
- 无需安装，直接运行
- 需要执行权限：`chmod +x`

---

## 🔐 代码签名（可选但推荐）

### Windows代码签名

**为什么需要：**
- 避免Windows Defender拦截
- 显示发布者信息
- 提升用户信任度

**步骤：**

1. **购买证书**
   - 从DigiCert、Sectigo等CA购买
   - 价格：$200-500/年

2. **配置签名**

编辑 `desktop/package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password"
    }
  }
}
```

或使用环境变量：

```cmd
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=your-password
npm run dist:win
```

### Mac代码签名

**为什么需要：**
- 避免"无法验证开发者"警告
- 通过Gatekeeper检查
- 必须签名才能分发

**步骤：**

1. **加入Apple Developer Program**
   - 费用：$99/年
   - 获取Developer ID证书

2. **配置签名**

```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

3. **公证（Notarization）**

```bash
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
npm run dist:mac
```

---

## 📝 检查清单

打包前确认：

- [ ] Node.js 18+已安装
- [ ] 项目代码已下载到本地
- [ ] Web项目依赖已安装 (`npm install`)
- [ ] desktop依赖已安装 (`cd desktop && npm install`)
- [ ] 图标文件已准备（`desktop/build/icon.*`）
- [ ] 服务器地址已配置（`desktop/src/main.ts`）
- [ ] 版本号已更新（`package.json`和`main.ts`）
- [ ] Web项目已构建 (`npm run build`)
- [ ] TypeScript已编译 (`npm run build:main`)

打包后确认：

- [ ] 安装包已生成在 `desktop/release/`
- [ ] 安装包大小合理（150-250MB）
- [ ] 安装包可以正常安装
- [ ] 应用可以正常启动
- [ ] 版本检查功能正常
- [ ] 在线验证功能正常
- [ ] 视频处理功能正常

---

## 💡 提示和技巧

### 加速打包

1. **使用淘宝镜像**
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm config set electron_mirror https://npmmirror.com/mirrors/electron/
   ```

2. **保留Electron缓存**
   - 首次打包后，Electron会缓存在 `~/.cache/electron/`
   - 不要删除这个目录，后续打包会更快

3. **并行打包多个平台**
   - 如果有多台电脑，可以同时打包
   - Windows打包只能在Windows上进行
   - Mac打包只能在Mac上进行
   - Linux可以在任何平台打包（需要Wine）

### 调试打包问题

1. **查看详细日志**
   ```bash
   npm run dist -- --verbose
   ```

2. **只打包不压缩（测试用）**
   ```bash
   npm run pack
   ```

3. **清理缓存重新打包**
   ```bash
   rm -rf desktop/dist
   rm -rf desktop/release
   npm run build:main
   npm run dist
   ```

### 减小安装包大小

1. **已启用的优化**
   - asar压缩（已默认启用）
   - 排除不必要的文件

2. **可选优化**
   - 使用electron-builder的压缩选项
   - 排除未使用的依赖
   - 使用外部资源（如在线字体）

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**
   - 打包日志：终端输出
   - 应用日志：`%APPDATA%\video-slicer-desktop\logs\` (Windows)

2. **常见问题**
   - 查看本文档的"常见问题排查"章节
   - 查看 `PACKAGING_GUIDE.md`

3. **联系支持**
   - 提交issue到项目仓库
   - 联系技术支持

---

**最后更新：2026-01-29**
