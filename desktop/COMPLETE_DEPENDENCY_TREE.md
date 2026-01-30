# 桌面应用完整依赖树

## 问题总结

在Windows安装包中遇到了一系列"Cannot find module"错误：
1. ❌ `fs-extra`
2. ❌ `universalify`
3. ❌ `builder-util-runtime`

## 根本原因

`electron-builder` 不会自动打包所有的传递依赖（transitive dependencies）。即使 `electron-updater` 在 `dependencies` 中，它的子依赖也不会被自动包含。

## 完整解决方案

### electron-updater@6.1.7 完整依赖树

```
electron-updater@6.1.7
├── builder-util-runtime@9.2.3
│   ├── debug@^4.3.4
│   └── sax@^1.2.4
├── fs-extra@^10.1.0 (我们使用 ^11.2.0)
│   ├── graceful-fs@^4.2.0
│   ├── jsonfile@^6.0.1
│   └── universalify@^2.0.0
├── js-yaml@^4.1.0
├── lazy-val@^1.0.5
├── lodash.escaperegexp@^4.1.2
├── lodash.isequal@^4.5.0
├── semver@^7.3.8
└── tiny-typed-emitter@^2.1.0
```

### 最终的 package.json dependencies

```json
{
  "dependencies": {
    "@types/uuid": "^10.0.0",
    "builder-util-runtime": "9.2.3",
    "debug": "^4.3.4",
    "electron-updater": "^6.1.7",
    "fs-extra": "^11.2.0",
    "graceful-fs": "^4.2.11",
    "js-yaml": "^4.1.0",
    "jsonfile": "^6.1.0",
    "lazy-val": "^1.0.5",
    "lodash.escaperegexp": "^4.1.2",
    "lodash.isequal": "^4.5.0",
    "sax": "^1.2.4",
    "semver": "^7.3.8",
    "tiny-typed-emitter": "^2.1.0",
    "universalify": "^2.0.1",
    "uuid": "^13.0.0"
  }
}
```

## 依赖说明

### 核心依赖
- **electron-updater**: 自动更新功能
- **uuid**: 生成唯一设备ID

### electron-updater 的直接依赖
- **builder-util-runtime**: electron-builder 的运行时工具
- **fs-extra**: 增强的文件系统操作
- **js-yaml**: YAML 解析（用于更新配置）
- **lazy-val**: 延迟计算值
- **lodash.escaperegexp**: 正则表达式转义
- **lodash.isequal**: 深度相等比较
- **semver**: 语义化版本比较
- **tiny-typed-emitter**: 类型安全的事件发射器

### 二级依赖（子依赖的依赖）
- **debug**: 调试日志（builder-util-runtime 的依赖）
- **sax**: XML 解析器（builder-util-runtime 的依赖）
- **graceful-fs**: 优雅的文件系统操作（fs-extra 的依赖）
- **jsonfile**: JSON 文件读写（fs-extra 的依赖）
- **universalify**: Promise 化工具（fs-extra 的依赖）

## 如何查找依赖

### 方法1：使用 npm view
```bash
# 查看包的直接依赖
npm view electron-updater@6.1.7 dependencies

# 查看包的所有信息
npm view electron-updater@6.1.7

# 递归查看子依赖
npm view builder-util-runtime@9.2.3 dependencies
npm view fs-extra@11.2.0 dependencies
```

### 方法2：使用 npm ls
```bash
# 在已安装的项目中查看依赖树
cd desktop
npm install
npm ls electron-updater
```

### 方法3：查看 package-lock.json
```bash
# 查看锁定文件中的依赖关系
cat desktop/package-lock.json | grep -A 10 "electron-updater"
```

## 验证步骤

### 1. 本地验证（推荐）

```bash
cd desktop

# 清理旧的依赖
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 构建应用
npm run build

# 打包
npm run dist:win  # Windows
npm run dist:mac  # Mac
npm run dist:linux  # Linux

# 测试打包后的应用
# 查看 release/ 目录
ls -lh release/
```

### 2. 检查打包内容

```bash
# 解压 app.asar 查看内容
npm install -g asar

# 列出 asar 中的所有文件
asar list release/win-unpacked/resources/app.asar

# 提取 asar 内容
asar extract release/win-unpacked/resources/app.asar extracted/

# 检查是否包含所需的依赖
ls extracted/node_modules/
```

### 3. GitHub Actions 构建

1. 推送代码到 GitHub
2. 访问 https://github.com/superyueming/video-slicer/actions
3. 等待构建完成（约5-10分钟）
4. 下载 Artifacts 中的安装包
5. 安装并测试

## 测试清单

安装新的安装包后，请验证：

- [ ] 应用能正常启动，没有任何错误对话框
- [ ] 主窗口正常显示
- [ ] 可以打开文件选择对话框
- [ ] 可以选择本地视频文件
- [ ] 可以查看视频信息
- [ ] 可以提取音频
- [ ] 可以上传音频到服务器
- [ ] 可以接收AI分析结果
- [ ] 可以剪辑视频
- [ ] 可以下载生成的视频
- [ ] 自动更新功能正常（如果配置了）

## 为什么需要显式声明所有依赖？

### electron-builder 的打包策略

1. **默认行为**: 只打包 `dependencies` 中的直接依赖
2. **原因**: 
   - 减小包体积
   - 避免版本冲突
   - 提高打包速度
3. **问题**: 某些运行时需要的子依赖可能被遗漏

### 何时需要显式声明

- ✅ 运行时需要 `require()` 的模块
- ✅ 动态加载的模块
- ✅ 被 `electron-builder` 排除的模块
- ❌ Node.js 内置模块（如 `fs`, `path`, `http`）
- ❌ 仅在开发时使用的工具（应放在 `devDependencies`）

## 预防措施

### 1. 添加依赖检查脚本

在 `desktop/src/main.ts` 中添加：

```typescript
import { app, dialog } from 'electron';

// 检查关键依赖
const REQUIRED_MODULES = [
  'electron-updater',
  'fs-extra',
  'uuid',
  'builder-util-runtime',
  'js-yaml',
  'semver'
];

function checkDependencies() {
  const missing: string[] = [];
  
  for (const moduleName of REQUIRED_MODULES) {
    try {
      require(moduleName);
    } catch (error) {
      missing.push(moduleName);
    }
  }
  
  if (missing.length > 0) {
    dialog.showErrorBox(
      'Missing Dependencies',
      `The following required modules are missing:\n\n${missing.join('\n')}\n\nPlease reinstall the application.`
    );
    app.quit();
    return false;
  }
  
  return true;
}

// 在应用启动时调用
app.whenReady().then(() => {
  if (!checkDependencies()) {
    return;
  }
  
  // ... 其他启动代码
});
```

### 2. 使用 electron-builder 配置

在 `package.json` 中添加：

```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "node_modules/ffmpeg/**/*"
    ],
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "resources/**/*",
      "!node_modules/*/{CHANGELOG.md,README.md,readme.md}",
      "!node_modules/*/{test,__tests__,tests}",
      "!node_modules/*/{example,examples}",
      "!node_modules/*.d.ts"
    ]
  }
}
```

### 3. 本地测试流程

创建 `desktop/test-build.sh`:

```bash
#!/bin/bash

echo "🧹 Cleaning..."
rm -rf node_modules package-lock.json dist release

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build

echo "📦 Packaging..."
npm run dist:win

echo "✅ Build complete!"
echo "📂 Check release/ directory for the installer"
ls -lh release/
```

## 常见问题

### Q: 为什么不使用 `npm install --production`？
A: `--production` 会排除 `devDependencies`，但不会自动包含所有运行时需要的子依赖。

### Q: 可以使用 `bundleDependencies` 吗？
A: 可以，但 `bundleDependencies` 会将依赖打包到 tarball 中，不适合 Electron 应用。

### Q: 如何减小包体积？
A: 
1. 只包含必要的依赖
2. 使用 `files` 配置排除不需要的文件
3. 使用 `asar` 压缩
4. 考虑使用更小的替代包

### Q: 还会有其他缺失的依赖吗？
A: 理论上不会了，因为我们已经包含了 `electron-updater` 的完整依赖树。如果还有问题，按照本文档的方法查找并添加。

## 相关资源

- [electron-builder 文档](https://www.electron.build/)
- [electron-updater 文档](https://www.electron.build/auto-update)
- [npm dependencies 文档](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#dependencies)
- [GitHub Actions 工作流](.github/workflows/build-desktop.yml)

## 修复历史

| 版本 | 日期 | 修复内容 |
|------|------|----------|
| v5.1.1 | 2026-01-29 | 添加 `fs-extra` |
| v5.1.2 | 2026-01-29 | 添加 `graceful-fs`, `jsonfile`, `universalify` |
| v5.1.3 | 2026-01-29 | 添加所有 `electron-updater` 的依赖（共13个包） |

## 总结

通过显式声明 `electron-updater` 的所有依赖，我们确保了：

✅ 所有运行时需要的模块都被打包
✅ 应用可以在没有 node_modules 的环境中运行
✅ 避免了"Cannot find module"错误
✅ 提供了完整的依赖树文档供未来参考

这个解决方案应该能彻底解决桌面应用的依赖问题。
