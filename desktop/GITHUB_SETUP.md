# GitHub自动更新配置指南

本文档说明如何配置基于GitHub的自动更新系统。

## 前置条件

1. ✅ GitHub账号
2. ✅ 项目已推送到GitHub仓库
3. ✅ 已安装Git和Node.js

---

## 第一步：配置GitHub仓库信息

### 1. 修改 `desktop/package.json`

找到 `publish` 配置项，修改为你的GitHub信息：

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

**示例：**
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "zhangsan",
        "repo": "video-slicer"
      }
    ]
  }
}
```

---

## 第二步：生成GitHub Personal Access Token

### 1. 访问GitHub Token设置页面

打开：https://github.com/settings/tokens

### 2. 创建新Token

- 点击 "Generate new token" → "Generate new token (classic)"
- **Note**: 填写 `video-slicer-release`
- **Expiration**: 选择 `No expiration`（或根据需要选择）
- **Scopes**: 勾选 `repo`（完整的仓库访问权限）

### 3. 生成并复制Token

- 点击 "Generate token"
- **重要：立即复制Token，离开页面后将无法再次查看**

### 4. 配置GitHub Secrets

在你的GitHub仓库中配置Token：

1. 进入仓库页面
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. **Name**: `GH_TOKEN`
5. **Value**: 粘贴刚才复制的Token
6. 点击 "Add secret"

---

## 第三步：测试GitHub Actions

### 1. 推送代码触发构建

```bash
# 提交所有更改
git add .
git commit -m "配置GitHub自动更新"
git push origin main
```

### 2. 手动触发构建（测试）

1. 进入GitHub仓库页面
2. 点击 "Actions" 标签
3. 选择 "Build Desktop App" 工作流
4. 点击 "Run workflow" → "Run workflow"

### 3. 查看构建结果

- 构建成功后，会在 "Actions" 页面看到绿色✅
- 构建产物（安装包）会上传到 "Artifacts"

---

## 第四步：发布第一个版本

### 1. 创建版本标签

```bash
# 创建版本标签（例如 v1.0.0）
git tag v1.0.0

# 推送标签到GitHub
git push origin v1.0.0
```

### 2. 自动构建和发布

- 推送标签后，GitHub Actions会自动：
  1. 构建Windows/Mac/Linux安装包
  2. 创建GitHub Release
  3. 上传安装包到Release

### 3. 查看Release

1. 进入GitHub仓库页面
2. 点击右侧 "Releases"
3. 应该看到新创建的 `v1.0.0` Release
4. 下载链接示例：
   ```
   https://github.com/你的用户名/仓库名/releases/download/v1.0.0/video-slicer-1.0.0-setup.exe
   ```

---

## 第五步：配置服务器版本管理

### 1. 在Web管理后台添加版本记录

访问你的Web应用管理后台，添加版本配置：

- **版本号**: `1.0.0`
- **最低要求版本**: `1.0.0`
- **平台**: Windows/Mac/Linux
- **下载链接**: GitHub Release下载链接
- **发布说明**: 版本更新内容

### 2. 测试自动更新

1. 打开桌面应用（旧版本）
2. 应用启动时会检查更新
3. 如果有新版本，会提示更新
4. 点击"立即更新"，应用会自动下载并安装

---

## 常见问题

### Q1: GitHub Actions构建失败

**可能原因：**
- GH_TOKEN未配置或权限不足
- package.json中的GitHub信息错误
- FFmpeg下载失败（网络问题）

**解决方法：**
1. 检查GitHub Secrets中的GH_TOKEN
2. 检查package.json中的owner和repo
3. 查看Actions日志定位具体错误

### Q2: electron-updater下载失败

**可能原因：**
- GitHub Release文件未正确上传
- 网络连接问题
- 文件名格式不匹配

**解决方法：**
1. 检查GitHub Release中的文件
2. 确保文件名格式正确（例如：`video-slicer-1.0.0-setup.exe`）
3. 应用会自动回退到手动下载（从服务器配置的downloadUrl）

### Q3: 如何发布新版本？

**步骤：**
1. 修改 `desktop/package.json` 中的 `version`
2. 提交代码：`git commit -am "Release v1.1.0"`
3. 创建标签：`git tag v1.1.0`
4. 推送标签：`git push origin v1.1.0`
5. GitHub Actions自动构建并发布
6. 在Web后台添加新版本记录

---

## 版本号规范

遵循语义化版本（Semantic Versioning）：

- **主版本号（Major）**: 不兼容的API修改
- **次版本号（Minor）**: 向下兼容的功能性新增
- **修订号（Patch）**: 向下兼容的问题修正

**示例：**
- `1.0.0` → 首次发布
- `1.0.1` → Bug修复
- `1.1.0` → 新增功能
- `2.0.0` → 重大更新（可能不兼容旧版本）

---

## 自动更新工作流程图

```
用户启动应用
    ↓
检查服务器版本信息
    ↓
是否需要更新？
    ├─ 否 → 正常启动
    └─ 是 → 是否强制更新？
        ├─ 否 → 提示用户选择
        │   ├─ 稍后更新 → 正常启动
        │   └─ 立即更新 → 下载安装
        └─ 是 → 强制下载安装
            ↓
        使用electron-updater从GitHub下载
            ↓
        下载失败？
            ├─ 否 → 自动安装并重启
            └─ 是 → 回退到服务器下载链接
                ↓
            手动下载并安装
```

---

## 相关文档

- [Electron Builder文档](https://www.electron.build/)
- [electron-updater文档](https://www.electron.build/auto-update)
- [GitHub Actions文档](https://docs.github.com/en/actions)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
