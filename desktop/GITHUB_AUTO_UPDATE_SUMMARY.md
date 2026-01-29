# GitHub自动更新方案配置总结

本文档总结了基于GitHub的桌面应用自动更新方案的配置内容。

---

## 📦 已完成的配置

### 1. GitHub Actions自动打包工作流

**文件：** `.github/workflows/build-desktop.yml`

**功能：**
- ✅ 自动构建Windows/Mac/Linux三个平台的安装包
- ✅ 自动下载FFmpeg二进制文件
- ✅ 自动创建GitHub Release
- ✅ 自动上传安装包到Release

**触发条件：**
- 推送版本标签（如 `v1.0.0`）
- 手动触发（在GitHub Actions页面）

**构建产物：**
- `video-slicer-{version}-setup.exe` (Windows)
- `video-slicer-{version}.dmg` (macOS)
- `video-slicer-{version}.AppImage` (Linux)

---

### 2. electron-updater集成

**文件：** `desktop/src/updater.ts`

**功能：**
- ✅ 从GitHub Releases自动检查更新
- ✅ 自动下载更新包
- ✅ 显示下载进度
- ✅ 自动安装并重启应用
- ✅ 失败时回退到手动下载

**工作流程：**
```
启动应用
  ↓
检查服务器版本信息（判断是否需要更新）
  ↓
使用electron-updater从GitHub下载
  ↓
下载完成后自动安装并重启
  ↓
如果失败，回退到服务器配置的下载链接
```

---

### 3. 版本管理优化

**文件：** `desktop/src/main.ts`

**功能：**
- ✅ 启动时检查更新
- ✅ 支持强制更新（不可跳过）
- ✅ 支持可选更新（用户选择）
- ✅ 显示更新进度
- ✅ 在线验证机制

**更新策略：**
- **强制更新：** 旧版本无法使用，必须更新
- **可选更新：** 提示用户，可以稍后更新

---

### 4. 配置文件更新

**文件：** `desktop/package.json`

**更新内容：**
```json
{
  "scripts": {
    "build:prod": "npm run build:main && electron-builder",
    "publish": "electron-builder --publish always"
  },
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR_GITHUB_USERNAME",
        "repo": "YOUR_REPO_NAME"
      }
    ]
  }
}
```

**需要修改：**
- `owner`: 你的GitHub用户名
- `repo`: 你的仓库名

---

### 5. 文档创建

已创建以下文档：

1. **GITHUB_SETUP.md** - GitHub首次配置指南
   - GitHub Token生成
   - 仓库配置
   - 测试流程

2. **RELEASE_GUIDE.md** - 完整发布流程指南
   - 版本号更新
   - Git标签创建
   - 监控构建
   - 配置服务器
   - 测试更新

3. **CHANGELOG.md** - 版本更新日志
   - 记录每个版本的更新内容
   - 遵循Keep a Changelog规范

4. **GITHUB_AUTO_UPDATE_SUMMARY.md** - 本文档
   - 配置总结
   - 使用说明

---

## 🚀 快速开始

### 首次配置（只需一次）

1. **配置GitHub仓库信息**
   ```bash
   # 编辑 desktop/package.json
   # 修改 publish.owner 和 publish.repo
   ```

2. **生成GitHub Token**
   - 访问：https://github.com/settings/tokens
   - 创建Token，勾选 `repo` 权限
   - 复制Token

3. **配置GitHub Secrets**
   - 进入仓库 Settings → Secrets → Actions
   - 添加 `GH_TOKEN`，值为刚才复制的Token

4. **提交配置**
   ```bash
   git add .
   git commit -m "配置GitHub自动更新"
   git push origin main
   ```

### 发布新版本

1. **更新版本号**
   - 修改 `desktop/package.json` 中的 `version`
   - 修改 `desktop/src/main.ts` 中的 `APP_VERSION`
   - 更新 `desktop/CHANGELOG.md`

2. **创建并推送标签**
   ```bash
   git add .
   git commit -m "chore: release v1.1.0"
   git push origin main
   
   git tag v1.1.0
   git push origin v1.1.0
   ```

3. **等待自动构建**
   - 访问GitHub Actions页面查看进度
   - 构建完成后，Release会自动创建

4. **配置服务器版本管理**
   - 在Web管理后台添加新版本记录
   - 填写GitHub Release的下载链接

5. **测试自动更新**
   - 启动旧版本应用
   - 验证更新提示和下载流程

---

## 📋 配置检查清单

### GitHub配置

- [ ] GitHub仓库已创建
- [ ] 代码已推送到GitHub
- [ ] package.json中的GitHub信息已配置
- [ ] GitHub Token已生成
- [ ] GH_TOKEN已添加到GitHub Secrets

### 本地配置

- [ ] desktop/package.json版本号正确
- [ ] desktop/src/main.ts版本号正确
- [ ] CHANGELOG.md已更新
- [ ] 所有代码已提交

### 测试验证

- [ ] GitHub Actions构建成功
- [ ] Release已自动创建
- [ ] 安装包已上传到Release
- [ ] 服务器版本配置已更新
- [ ] 自动更新功能测试通过

---

## 🔧 常见问题

### Q1: 如何修改GitHub仓库信息？

**A:** 编辑 `desktop/package.json`：
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "你的GitHub用户名",
        "repo": "你的仓库名"
      }
    ]
  }
}
```

### Q2: 如何手动触发构建？

**A:** 
1. 访问GitHub仓库页面
2. 点击 "Actions" 标签
3. 选择 "Build Desktop App"
4. 点击 "Run workflow"

### Q3: 构建失败怎么办？

**A:** 
1. 查看GitHub Actions日志
2. 检查GH_TOKEN是否配置正确
3. 检查package.json配置是否正确
4. 参考RELEASE_GUIDE.md的故障排查部分

### Q4: 如何测试自动更新？

**A:** 
1. 安装旧版本应用
2. 在服务器配置新版本信息
3. 启动应用，应该看到更新提示
4. 点击"立即更新"，验证下载和安装流程

---

## 📚 相关文档

- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - GitHub首次配置详细指南
- [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) - 完整发布流程指南
- [LOCAL_BUILD_GUIDE.md](./LOCAL_BUILD_GUIDE.md) - 本地构建指南
- [DESKTOP_APP_GUIDE.md](./DESKTOP_APP_GUIDE.md) - 桌面应用开发指南

---

## 🎯 下一步

配置完成后，你可以：

1. ✅ 发布第一个版本（参考RELEASE_GUIDE.md）
2. ✅ 测试自动更新功能
3. ✅ 根据需要调整更新策略（强制/可选）
4. ✅ 监控用户更新情况

---

## 💡 最佳实践

1. **版本号规范**
   - 遵循语义化版本（Semantic Versioning）
   - 主版本号.次版本号.修订号

2. **发布频率**
   - Bug修复：及时发布修订版本
   - 新功能：定期发布次版本
   - 重大更新：谨慎发布主版本

3. **更新策略**
   - 重要安全更新：使用强制更新
   - 功能更新：使用可选更新
   - 提供详细的更新说明

4. **测试验证**
   - 每次发布前在测试环境验证
   - 确保自动更新流程正常
   - 收集用户反馈及时修复问题

---

## 📞 获取帮助

如果遇到问题：

1. 查看相关文档
2. 检查GitHub Actions日志
3. 查看应用日志
4. 提交Issue到GitHub仓库
