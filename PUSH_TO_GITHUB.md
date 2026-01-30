# 如何推送最新代码到GitHub并创建Release

## 问题说明

当前有两个重要的commit包含修复代码，但还没有推送到GitHub：

1. `20bf775` - Checkpoint: 彻底解决桌面应用依赖问题
2. `d6facf4` - Checkpoint: 修复pnpm符号链接导致的依赖缺失问题 ⭐ **最重要的修复**

**关键修复内容**（在`d6facf4`中）：
- 修改了`.github/workflows/build-desktop.yml`
- 将desktop目录的依赖安装从`pnpm`改为`npm`
- 解决了pnpm符号链接导致electron-builder无法正确打包依赖的问题

## 方案1：手动推送（推荐）

### 步骤1：在本地推送代码

在您的**本地Windows电脑**上（不是在Manus沙箱中）：

```bash
# 1. 克隆仓库（如果还没有）
git clone https://github.com/superyueming/video-slicer.git
cd video-slicer

# 2. 拉取Manus的最新代码
git pull origin main

# 3. 推送到GitHub
git push github main

# 4. 推送tag
git push github v1.0.3
```

### 步骤2：在GitHub上创建Release

1. 访问 https://github.com/superyueming/video-slicer/releases
2. 点击"Draft a new release"
3. 在"Choose a tag"中选择 `v1.0.3`
4. 填写Release标题：`v1.0.3 - 修复pnpm符号链接问题`
5. 填写描述：
   ```markdown
   ## 🔧 修复内容
   - 修改GitHub Actions配置，在desktop目录使用npm而不是pnpm
   - 解决pnpm符号链接导致的依赖缺失问题
   - 应用现在应该能正常启动，不再出现"Cannot find module"错误
   
   ## 📝 技术细节
   pnpm使用符号链接管理依赖，electron-builder无法正确处理这些符号链接。
   改用npm后，所有依赖的实际文件都在node_modules中，打包时能被正确复制。
   
   详见：desktop/PNPM_SYMLINK_FIX.md
   ```
6. 点击"Publish release"

## 方案2：直接在GitHub上操作（更简单）

如果您不想在本地操作，可以：

### 步骤1：下载修复的文件

从Manus下载这个文件：
- `.github/workflows/build-desktop.yml`

### 步骤2：在GitHub网页上编辑

1. 访问 https://github.com/superyueming/video-slicer/blob/main/.github/workflows/build-desktop.yml
2. 点击右上角的"Edit"（铅笔图标）
3. 找到第53-54行：
   ```yaml
   - name: Install desktop dependencies
     run: cd desktop && pnpm install --no-frozen-lockfile
   ```
4. 替换为：
   ```yaml
   - name: Install desktop dependencies
     run: |
       cd desktop
       # Use npm instead of pnpm to avoid symlink issues with electron-builder
       npm install
   ```
5. 填写commit信息：`fix: use npm instead of pnpm for desktop dependencies`
6. 点击"Commit changes"

### 步骤3：创建Release

1. 访问 https://github.com/superyueming/video-slicer/releases
2. 点击"Draft a new release"
3. 在"Choose a tag"中输入 `v1.0.3`
4. **确保Target选择的是main分支的最新commit**
5. 填写Release信息（同方案1）
6. 点击"Publish release"

## 验证

构建完成后（约5-10分钟）：

1. 下载新的安装包
2. 安装并运行
3. 应用应该能正常启动，不再出现"Cannot find module 'ms'"错误
4. 可以检查安装目录：
   ```
   C:\Users\super_yue_ming\AppData\Local\Programs\video-slicer-desktop\resources\app\node_modules\ms\
   ```
   应该包含实际的文件（index.js, package.json等），而不是符号链接

## 如果还有问题

如果v1.0.3仍然有问题，请：

1. 检查GitHub Actions的构建日志
2. 确认"Install desktop dependencies"步骤使用的是`npm install`而不是`pnpm install`
3. 检查构建日志中是否有npm的输出

## 相关文档

- `desktop/PNPM_SYMLINK_FIX.md` - 详细的问题分析
- `desktop/DEPENDENCY_SOLUTION_SUMMARY.md` - 完整的解决方案总结
