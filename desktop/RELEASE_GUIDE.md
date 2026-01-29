# 桌面应用发布流程指南

本文档详细说明如何发布新版本的桌面应用，包括版本管理、构建、发布和更新的完整流程。

---

## 📋 发布前检查清单

在发布新版本之前，请确保完成以下检查：

- [ ] 所有功能已开发完成并测试通过
- [ ] 代码已提交到Git仓库
- [ ] 更新日志（CHANGELOG.md）已更新
- [ ] 版本号已确定（遵循语义化版本规范）
- [ ] GitHub仓库配置正确（参考GITHUB_SETUP.md）
- [ ] GH_TOKEN已配置到GitHub Secrets

---

## 🚀 发布流程

### 步骤1：更新版本号

#### 1.1 修改 `desktop/package.json`

```json
{
  "name": "video-slicer-desktop",
  "version": "1.1.0",  // 修改这里
  ...
}
```

#### 1.2 修改 `desktop/src/main.ts`

```typescript
const APP_VERSION = '1.1.0';  // 修改这里
```

#### 1.3 更新CHANGELOG.md

在 `desktop/CHANGELOG.md` 中添加新版本的更新内容：

```markdown
## [1.1.0] - 2024-01-29

### 新增
- 添加本地视频处理功能
- 集成FFmpeg本地剪辑

### 优化
- 优化UI响应速度
- 改进错误提示

### 修复
- 修复视频上传失败的问题
```

---

### 步骤2：提交代码

```bash
# 添加所有更改
git add .

# 提交（使用语义化提交信息）
git commit -m "chore: release v1.1.0"

# 推送到远程仓库
git push origin main
```

---

### 步骤3：创建Git标签

```bash
# 创建带注释的标签
git tag -a v1.1.0 -m "Release version 1.1.0"

# 推送标签到远程仓库
git push origin v1.1.0
```

**重要：** 推送标签后，GitHub Actions会自动触发构建流程。

---

### 步骤4：监控自动构建

#### 4.1 查看GitHub Actions

1. 访问GitHub仓库页面
2. 点击 "Actions" 标签
3. 找到最新的 "Build Desktop App" 工作流
4. 查看构建进度

#### 4.2 构建过程

GitHub Actions会自动完成以下步骤：

1. **检出代码** - 拉取最新代码
2. **安装依赖** - 安装Node.js和pnpm
3. **构建Web项目** - 运行 `pnpm run build`
4. **下载FFmpeg** - 下载各平台的FFmpeg二进制文件
5. **构建桌面应用** - 使用electron-builder打包
6. **上传构建产物** - 上传到GitHub Artifacts
7. **创建Release** - 自动创建GitHub Release
8. **上传安装包** - 上传安装包到Release

#### 4.3 预计构建时间

- Windows: ~10分钟
- macOS: ~15分钟
- Linux: ~8分钟

---

### 步骤5：验证GitHub Release

#### 5.1 检查Release页面

1. 访问GitHub仓库页面
2. 点击右侧 "Releases"
3. 应该看到新创建的Release（如 `v1.1.0`）

#### 5.2 验证安装包

确保以下文件已上传：

- ✅ `video-slicer-1.1.0-setup.exe` (Windows)
- ✅ `video-slicer-1.1.0.dmg` (macOS)
- ✅ `video-slicer-1.1.0.AppImage` (Linux)

#### 5.3 获取下载链接

下载链接格式：
```
https://github.com/你的用户名/仓库名/releases/download/v1.1.0/video-slicer-1.1.0-setup.exe
```

---

### 步骤6：配置服务器版本管理

#### 6.1 访问Web管理后台

访问你的Web应用管理后台（需要管理员权限）。

#### 6.2 添加新版本记录

在版本管理页面添加新版本配置：

**Windows版本：**
- 版本号: `1.1.0`
- 最低要求版本: `1.0.0`（或根据兼容性设置）
- 平台: `windows`
- 下载链接: `https://github.com/你的用户名/仓库名/releases/download/v1.1.0/video-slicer-1.1.0-setup.exe`
- 发布说明: 复制CHANGELOG.md中的内容
- 是否强制更新: 根据需要选择

**macOS版本：**
- 版本号: `1.1.0`
- 最低要求版本: `1.0.0`
- 平台: `mac`
- 下载链接: `https://github.com/你的用户名/仓库名/releases/download/v1.1.0/video-slicer-1.1.0.dmg`
- 发布说明: 同上
- 是否强制更新: 同上

**Linux版本：**
- 版本号: `1.1.0`
- 最低要求版本: `1.0.0`
- 平台: `linux`
- 下载链接: `https://github.com/你的用户名/仓库名/releases/download/v1.1.0/video-slicer-1.1.0.AppImage`
- 发布说明: 同上
- 是否强制更新: 同上

---

### 步骤7：测试自动更新

#### 7.1 安装旧版本

在测试机器上安装旧版本的应用（如 v1.0.0）。

#### 7.2 启动应用测试

1. 启动应用
2. 应用会自动检查更新
3. 应该看到更新提示：
   ```
   发现新版本 1.1.0，是否立即更新？
   ```

#### 7.3 测试更新流程

点击"立即更新"，验证以下流程：

1. ✅ 开始下载更新
2. ✅ 显示下载进度
3. ✅ 下载完成后自动安装
4. ✅ 应用自动重启
5. ✅ 重启后版本号正确

#### 7.4 测试强制更新

如果配置了强制更新：

1. 旧版本应用启动时会显示强制更新对话框
2. 对话框不可关闭
3. 必须点击"立即更新"才能继续使用

---

## 📦 手动构建（本地测试）

如果需要在本地测试构建，可以使用以下命令：

### Windows

```bash
cd desktop
pnpm install
pnpm run build:prod
```

生成的安装包位于：`desktop/release/video-slicer-1.1.0-setup.exe`

### macOS

```bash
cd desktop
pnpm install
pnpm run build:prod
```

生成的安装包位于：`desktop/release/video-slicer-1.1.0.dmg`

### Linux

```bash
cd desktop
pnpm install
pnpm run build:prod
```

生成的安装包位于：`desktop/release/video-slicer-1.1.0.AppImage`

---

## 🔧 故障排查

### 问题1：GitHub Actions构建失败

**症状：** Actions页面显示红色❌

**排查步骤：**
1. 点击失败的工作流查看详细日志
2. 检查错误信息
3. 常见原因：
   - GH_TOKEN未配置或权限不足
   - package.json配置错误
   - FFmpeg下载失败（网络问题）
   - 依赖安装失败

**解决方法：**
- 检查GitHub Secrets中的GH_TOKEN
- 验证package.json中的GitHub配置
- 重新运行工作流

### 问题2：Release未自动创建

**症状：** 构建成功但没有创建Release

**排查步骤：**
1. 检查是否推送了标签（`git push origin v1.1.0`）
2. 检查标签格式是否正确（必须是 `v*.*.*` 格式）
3. 检查GH_TOKEN权限

**解决方法：**
- 确保标签格式正确
- 重新推送标签：`git push origin v1.1.0 --force`

### 问题3：electron-updater下载失败

**症状：** 应用提示更新失败

**排查步骤：**
1. 检查GitHub Release中的文件是否存在
2. 检查文件名格式是否正确
3. 检查网络连接

**解决方法：**
- 应用会自动回退到服务器配置的downloadUrl
- 确保服务器配置的下载链接可访问

### 问题4：更新后应用无法启动

**症状：** 更新完成后应用闪退或无响应

**排查步骤：**
1. 检查版本兼容性
2. 检查数据库迁移是否正确
3. 查看应用日志

**解决方法：**
- 回滚到旧版本
- 修复兼容性问题后重新发布

---

## 📊 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

### 格式：`主版本号.次版本号.修订号`

- **主版本号（Major）**: 不兼容的API修改
  - 示例：`1.0.0` → `2.0.0`
  - 场景：重大架构调整、不兼容的功能变更

- **次版本号（Minor）**: 向下兼容的功能性新增
  - 示例：`1.0.0` → `1.1.0`
  - 场景：新增功能、优化改进

- **修订号（Patch）**: 向下兼容的问题修正
  - 示例：`1.0.0` → `1.0.1`
  - 场景：Bug修复、小改进

### 版本号示例

| 版本号 | 说明 | 场景 |
|--------|------|------|
| 1.0.0 | 首次正式发布 | 产品上线 |
| 1.0.1 | Bug修复 | 修复视频上传失败 |
| 1.1.0 | 新增功能 | 添加本地处理功能 |
| 1.1.1 | Bug修复 | 修复本地处理崩溃 |
| 2.0.0 | 重大更新 | 全新UI设计，不兼容旧版本 |

---

## 🔄 回滚版本

如果新版本出现严重问题，需要回滚：

### 方法1：修改服务器配置

在Web管理后台修改版本配置，将最新版本改回旧版本。

### 方法2：发布修复版本

1. 修复问题
2. 发布新的修订版本（如 `1.1.1`）
3. 配置为强制更新

### 方法3：删除GitHub Release

1. 访问GitHub Releases页面
2. 删除有问题的Release
3. 用户将无法下载该版本

---

## 📝 发布检查表

发布新版本时，请按照以下检查表逐项确认：

### 发布前

- [ ] 功能开发完成
- [ ] 所有测试通过
- [ ] 代码已提交到Git
- [ ] 版本号已更新（package.json + main.ts）
- [ ] CHANGELOG.md已更新
- [ ] GitHub配置正确

### 发布中

- [ ] Git标签已创建并推送
- [ ] GitHub Actions构建成功
- [ ] Release已自动创建
- [ ] 所有平台的安装包已上传

### 发布后

- [ ] 服务器版本配置已更新
- [ ] 自动更新功能测试通过
- [ ] 强制更新功能测试通过（如适用）
- [ ] 用户反馈正常

---

## 📚 相关文档

- [GitHub配置指南](./GITHUB_SETUP.md) - 首次配置GitHub自动更新
- [本地打包指南](./LOCAL_BUILD_GUIDE.md) - 本地构建和测试
- [桌面应用开发指南](./DESKTOP_APP_GUIDE.md) - 完整开发文档

---

## 🆘 获取帮助

如果遇到问题，可以：

1. 查看GitHub Actions日志
2. 查看应用日志（位于用户数据目录）
3. 参考相关文档
4. 提交Issue到GitHub仓库
