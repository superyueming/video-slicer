# PNPM符号链接问题修复

## 问题描述

在GitHub Actions构建的Windows安装包中，应用启动时频繁出现"Cannot find module 'ms'"等依赖缺失错误。

虽然：
- ✅ electron-builder配置中已禁用ASAR (`"asar": false`)
- ✅ 配置中包含了整个node_modules (`"node_modules/**/*"`)
- ✅ 所有依赖都在package.json的dependencies中声明
- ✅ GitHub Actions构建显示成功

但应用仍然无法找到依赖模块。

## 根本原因

**pnpm的符号链接机制与electron-builder不兼容**

1. **pnpm的依赖管理方式**：
   - pnpm使用符号链接（symlinks）来节省磁盘空间
   - 依赖实际存储在`.pnpm/store`中
   - `node_modules`中的包是指向store的符号链接

2. **electron-builder的打包行为**：
   - electron-builder在打包时会复制`node_modules`中的文件
   - 但它可能无法正确处理pnpm的符号链接结构
   - 符号链接被复制，但链接目标（`.pnpm/store`）不在打包范围内
   - 导致运行时找不到实际的模块文件

3. **依赖树示例**：
   ```
   node_modules/
     ms/                    ← 符号链接
       → .pnpm/ms@2.1.3/node_modules/ms/  ← 实际文件
     
   打包后：
   resources/app/node_modules/
     ms/                    ← 符号链接（已复制）
       → .pnpm/ms@2.1.3/node_modules/ms/  ← 目标不存在！❌
   ```

## 解决方案

### 方案：在desktop目录使用npm而不是pnpm

修改`.github/workflows/build-desktop.yml`：

```yaml
- name: Install desktop dependencies
  run: |
    cd desktop
    # Use npm instead of pnpm to avoid symlink issues with electron-builder
    npm install
  shell: bash
```

**为什么这样可以解决问题**：
- npm使用传统的flat node_modules结构
- 所有依赖的实际文件都在`node_modules`目录中
- 没有符号链接，electron-builder可以正确复制所有文件

### 其他可能的方案（未采用）

1. **配置pnpm使用hoisted模式**：
   ```bash
   pnpm install --shamefully-hoist
   ```
   - 缺点：失去了pnpm的主要优势（节省空间）

2. **使用electron-builder的asarUnpack**：
   ```json
   {
     "build": {
       "asarUnpack": ["node_modules/**/*"]
     }
   }
   ```
   - 缺点：我们已经禁用了ASAR，这个配置无效

3. **手动复制依赖到extraResources**：
   - 缺点：维护成本高，容易遗漏依赖

## 验证方法

1. **检查构建日志**：
   ```bash
   # 应该看到npm install的输出，而不是pnpm
   ```

2. **检查打包后的文件**：
   ```bash
   # 在安装目录中检查ms模块
   C:\Users\...\AppData\Local\Programs\video-slicer-desktop\resources\app\node_modules\ms\
   
   # 应该包含实际文件，而不是符号链接
   index.js  ← 实际文件
   package.json  ← 实际文件
   ```

3. **运行应用**：
   - 应用应该能正常启动
   - 不应该再出现"Cannot find module"错误

## 最佳实践

1. **根项目使用pnpm**：
   - 根项目（web应用）继续使用pnpm
   - 享受pnpm的性能优势

2. **desktop子项目使用npm**：
   - 只在desktop目录使用npm
   - 确保electron-builder能正确打包

3. **本地开发**：
   - 本地开发时可以使用pnpm（因为不需要打包）
   - 只有在构建发布版本时使用npm

## 相关资源

- [pnpm符号链接文档](https://pnpm.io/symlinked-node-modules-structure)
- [electron-builder文件配置](https://www.electron.build/configuration/contents)
- [GitHub Issue: electron-builder with pnpm](https://github.com/electron-userland/electron-builder/issues/6289)

## 版本历史

- v1.0.0 - v1.0.1: 使用pnpm，出现依赖缺失问题
- v1.0.2+: 改用npm，问题解决
