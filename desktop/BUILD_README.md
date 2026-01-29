# 🚀 快速打包指南

## 最简单的方法（推荐）

### Windows用户

```cmd
cd desktop
quick-build.bat
```

### Mac/Linux用户

```bash
cd desktop
./quick-build.sh
```

脚本会自动完成所有步骤，打包完成后安装包位于 `desktop/release/` 目录。

---

## 手动打包步骤

如果自动脚本失败，可以手动执行以下步骤：

### 1. 构建Web项目

```bash
cd /path/to/video-slicer-web
npm install          # 首次需要
npm run build
```

### 2. 安装desktop依赖

```bash
cd desktop
npm install
```

### 3. 编译TypeScript

```bash
npm run build:main
```

### 4. 打包应用

```bash
# 打包当前平台
npm run dist

# 或指定平台
npm run dist:win      # Windows
npm run dist:mac      # Mac
npm run dist:linux    # Linux
```

---

## ⚠️ 打包前注意事项

### 必须准备图标文件

将图标文件放入 `desktop/build/` 目录：

- Windows: `icon.ico` (256x256或更大)
- Mac: `icon.icns` (512x512@2x)
- Linux: `icon.png` (512x512)

**如果没有图标**，临时解决方案：

编辑 `desktop/package.json`，注释掉icon配置：

```json
{
  "win": {
    "target": ["nsis"]
    // "icon": "build/icon.ico"  ← 注释这行
  },
  "mac": {
    "target": ["dmg"]
    // "icon": "build/icon.icns"  ← 注释这行
  },
  "linux": {
    "target": ["AppImage"]
    // "icon": "build/icon.png"  ← 注释这行
  }
}
```

### 修改服务器地址

编辑 `desktop/src/main.ts`：

```typescript
const SERVER_URL = 'https://your-production-server.com';  // 改为你的服务器地址
```

---

## 📦 打包产物

打包完成后，在 `desktop/release/` 目录找到：

- **Windows**: `AI视频智能切片 Setup 1.0.0.exe` (~150-200MB)
- **Mac**: `AI视频智能切片-1.0.0.dmg` (~180-250MB)
- **Linux**: `AI视频智能切片-1.0.0.AppImage` (~150-200MB)

---

## 🧪 测试安装包

### Windows
双击 `.exe` 文件安装

### Mac
双击 `.dmg` 文件，拖到Applications

### Linux
```bash
chmod +x AI视频智能切片-1.0.0.AppImage
./AI视频智能切片-1.0.0.AppImage
```

---

## 🐛 常见问题

### 打包失败：找不到dist目录

**解决**：先构建Web项目
```bash
cd ..
npm run build
cd desktop
npm run dist
```

### 打包失败：找不到icon文件

**解决**：
1. 准备图标文件放入 `desktop/build/`
2. 或注释掉package.json中的icon配置（见上方）

### Windows安装包被杀毒软件拦截

**原因**：未签名的可执行文件

**临时解决**：添加到杀毒软件白名单

**长期解决**：购买代码签名证书并配置签名

### Mac提示"无法验证开发者"

**解决**：右键点击应用，选择"打开"

---

## 📚 更多信息

- 完整打包指南：查看 `PACKAGING_GUIDE.md`
- 桌面应用开发：查看 `README.md`
- 发布流程：查看 `../DESKTOP_APP_GUIDE.md`

---

**快速链接：**
- [PACKAGING_GUIDE.md](./PACKAGING_GUIDE.md) - 详细打包指南
- [README.md](./README.md) - 开发指南
- [../DESKTOP_APP_GUIDE.md](../DESKTOP_APP_GUIDE.md) - 完整文档
