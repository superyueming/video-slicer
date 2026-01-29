# AI视频智能切片 - 桌面应用

基于Electron的桌面应用版本，支持强制更新和在线验证机制。

## 功能特性

### 🔄 强制更新机制
- 启动时自动检查版本
- 低于最低要求版本时强制更新
- 可选更新提示
- 自动下载和安装更新

### 🌐 在线验证
- 定期验证在线状态（每5分钟）
- 离线或版本过低时阻止使用
- 设备ID唯一标识

### 🖥️ 本地服务器
- 内嵌Express服务器
- 自动查找可用端口
- 完整的后端功能

## 开发

### 安装依赖

```bash
cd desktop
npm install
```

### 开发模式

```bash
npm run dev
```

这会同时启动：
- Electron主进程（监听TypeScript变化）
- Web开发服务器（父目录的npm run dev）

### 构建

```bash
# 构建所有平台
npm run dist

# 只构建Windows
npm run dist:win

# 只构建Mac
npm run dist:mac

# 只构建Linux
npm run dist:linux
```

构建产物在 `desktop/release` 目录。

## 配置

### 修改服务器地址

编辑 `src/main.ts`：

```typescript
const SERVER_URL = 'https://your-server.com'; // 改为你的服务器地址
```

### 修改版本号

编辑 `package.json` 和 `src/main.ts`：

```json
{
  "version": "1.0.0"
}
```

```typescript
const APP_VERSION = '1.0.0';
```

### 配置自动更新服务器

编辑 `package.json` 的 `build.publish`：

```json
{
  "publish": {
    "provider": "generic",
    "url": "https://your-server.com/updates"
  }
}
```

## 发布流程

1. **构建新版本**
   ```bash
   npm run dist
   ```

2. **上传安装包到服务器**
   - Windows: `release/AI视频智能切片 Setup 1.0.0.exe`
   - Mac: `release/AI视频智能切片-1.0.0.dmg`
   - Linux: `release/AI视频智能切片-1.0.0.AppImage`

3. **在Web管理端创建新版本**
   - 访问管理后台
   - 创建新版本记录
   - 填写版本号、下载链接、发布说明
   - 设置最低要求版本（控制强制更新）

4. **用户自动更新**
   - 用户启动应用时自动检查更新
   - 低于最低版本时强制更新
   - 否则提示可选更新

## 目录结构

```
desktop/
├── src/
│   ├── main.ts           # Electron主进程入口
│   ├── updater.ts        # 更新管理器
│   ├── onlineVerifier.ts # 在线验证器
│   ├── server.ts         # 本地服务器启动
│   └── preload.ts        # 预加载脚本
├── build/                # 构建资源（图标等）
├── dist/                 # TypeScript编译输出
├── release/              # 打包输出
├── package.json          # 项目配置
├── tsconfig.main.json    # TypeScript配置
└── README.md             # 本文档
```

## 注意事项

1. **数据库**：桌面版使用与Web版相同的远程数据库，不需要本地数据库
2. **文件存储**：视频文件仍然上传到S3，不存储在本地
3. **网络依赖**：应用需要网络连接才能使用（在线验证）
4. **版本管理**：通过Web端的版本管理API控制更新

## 常见问题

### Q: 如何跳过强制更新测试？
A: 在开发模式下，可以临时注释掉 `main.ts` 中的 `checkUpdateAndVerify()` 调用。

### Q: 如何禁用在线验证？
A: 注释掉 `main.ts` 中的 `onlineVerifier.startPeriodicVerification()` 调用。

### Q: 如何修改验证频率？
A: 修改 `main.ts` 中的验证间隔：
```typescript
onlineVerifier.startPeriodicVerification(5 * 60 * 1000, ...); // 5分钟
```

### Q: 构建失败怎么办？
A: 确保：
1. 父目录的Web项目已经构建（`npm run build`）
2. 所有依赖已安装
3. Node.js版本 >= 18

## 许可证

MIT
