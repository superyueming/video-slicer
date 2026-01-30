# 桌面应用依赖修复完整指南

## 问题历史

### 第一次错误：fs-extra
```
Cannot find module 'fs-extra'
```

### 第二次错误：universalify
```
Cannot find module 'universalify'
```

## 根本原因

`electron-builder` 在打包时不会自动包含所有的子依赖（transitive dependencies）。虽然 `electron-updater` 依赖 `fs-extra`，而 `fs-extra` 又依赖其他模块，但这些子依赖不会被自动打包到最终的应用中。

## 完整解决方案

在 `desktop/package.json` 中显式添加所有需要的依赖：

```json
{
  "dependencies": {
    "@types/uuid": "^10.0.0",
    "electron-updater": "^6.1.7",
    "fs-extra": "^11.2.0",
    "graceful-fs": "^4.2.11",    // fs-extra 的依赖
    "jsonfile": "^6.1.0",        // fs-extra 的依赖
    "universalify": "^2.0.1",    // fs-extra 的依赖
    "uuid": "^13.0.0"
  }
}
```

## 依赖关系图

```
electron-updater
└── fs-extra
    ├── graceful-fs
    ├── jsonfile
    └── universalify
```

## 为什么需要显式声明？

1. **electron-builder 的打包策略**：默认只打包直接依赖，不递归打包所有子依赖
2. **减小包体积**：避免打包不必要的依赖
3. **避免冲突**：不同依赖可能需要不同版本的子依赖

## 如何查找缺失的依赖

### 方法1：查看npm包信息
```bash
npm view fs-extra@11.2.0 dependencies
```

### 方法2：检查node_modules
```bash
ls node_modules/fs-extra/node_modules/
```

### 方法3：分析错误信息
运行应用，查看错误信息中的模块名称

## 验证步骤

### 1. 本地验证（推荐）

在推送到GitHub之前，先在本地测试：

```bash
cd desktop

# 安装依赖
npm install

# 构建应用
npm run build

# 打包（Windows）
npm run dist:win

# 测试打包后的应用
# 安装 release/ 目录中的 .exe 文件
# 运行并检查是否有错误
```

### 2. GitHub Actions构建

1. 推送代码到GitHub
2. 访问 https://github.com/superyueming/video-slicer/actions
3. 查看最新的 "Build Desktop App" 工作流
4. 等待构建完成（约5-10分钟）
5. 下载构建产物（Artifacts）
6. 安装并测试

### 3. 完整测试清单

- [ ] 应用能正常启动
- [ ] 没有 "Cannot find module" 错误
- [ ] 主窗口正常显示
- [ ] 可以选择本地视频文件
- [ ] 文件选择对话框正常工作
- [ ] 可以查看视频信息
- [ ] 本地处理功能正常

## 其他可能缺失的依赖

如果遇到其他 "Cannot find module" 错误，按以下步骤处理：

### 1. 识别缺失的模块
从错误信息中找到模块名称，例如：
```
Error: Cannot find module 'some-module'
```

### 2. 查找模块来源
```bash
# 在项目中搜索该模块的使用
grep -r "some-module" desktop/src/

# 查看是哪个包的依赖
npm ls some-module
```

### 3. 添加到dependencies
```json
{
  "dependencies": {
    "some-module": "^x.x.x"
  }
}
```

### 4. 重新构建和测试

## 常见依赖问题

### electron-updater 相关
- `fs-extra` ✅ 已修复
- `graceful-fs` ✅ 已修复
- `jsonfile` ✅ 已修复
- `universalify` ✅ 已修复

### 其他可能需要的依赖
- `uuid` ✅ 已在dependencies
- `child_process` ✅ Node.js内置
- `fs` ✅ Node.js内置
- `path` ✅ Node.js内置
- `https` ✅ Node.js内置
- `net` ✅ Node.js内置

## 预防措施

### 1. 使用 electron-builder 的 asarUnpack

如果某些依赖仍然有问题，可以在 `package.json` 中配置：

```json
{
  "build": {
    "asarUnpack": [
      "node_modules/fs-extra/**/*",
      "node_modules/graceful-fs/**/*"
    ]
  }
}
```

### 2. 添加依赖检查脚本

在 `desktop/src/main.ts` 中添加启动检查：

```typescript
// 在应用启动时检查关键依赖
const requiredModules = [
  'fs-extra',
  'graceful-fs',
  'jsonfile',
  'universalify',
  'uuid',
  'electron-updater'
];

for (const moduleName of requiredModules) {
  try {
    require(moduleName);
  } catch (error) {
    console.error(`Missing dependency: ${moduleName}`);
    dialog.showErrorBox(
      'Dependency Error',
      `Missing required module: ${moduleName}\n\nPlease reinstall the application.`
    );
    app.quit();
  }
}
```

### 3. 使用 electron-builder 的 files 配置

明确指定要包含的文件：

```json
{
  "build": {
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "resources/**/*"
    ]
  }
}
```

## 构建优化建议

### 1. 减小包体积

只包含必要的依赖：

```json
{
  "build": {
    "files": [
      "dist/**/*",
      "!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!node_modules/*.d.ts",
      "!node_modules/.bin"
    ]
  }
}
```

### 2. 使用 electron-builder 的缓存

```bash
# 清理缓存
npm run clean

# 重新构建
npm run build
npm run dist:win
```

### 3. 检查打包结果

```bash
# 解压 .exe 文件（使用 7-Zip）
# 或者检查 release/win-unpacked/ 目录
# 查看 resources/app.asar 中是否包含所需的依赖

# 使用 asar 工具查看内容
npm install -g asar
asar list release/win-unpacked/resources/app.asar
```

## 相关文档

- [Electron Builder文档](https://www.electron.build/)
- [electron-updater文档](https://www.electron.build/auto-update)
- [fs-extra文档](https://github.com/jprichardson/node-fs-extra)
- [GitHub Actions工作流](.github/workflows/build-desktop.yml)

## 修复历史

- **v5.1.1** (2026-01-29): 添加 `fs-extra` 依赖
- **v5.1.2** (2026-01-29): 添加 `graceful-fs`, `jsonfile`, `universalify` 依赖

## 下一步

1. ✅ 等待GitHub Actions构建完成
2. ⏳ 下载新的安装包
3. ⏳ 测试应用是否能正常启动
4. ⏳ 测试完整的视频处理流程
5. ⏳ 如果还有其他错误，重复上述流程
