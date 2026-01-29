# GitHub仓库创建和推送指南

本指南将帮助你创建GitHub仓库并推送代码。

---

## 📝 第一步：创建GitHub仓库

### 1.1 访问GitHub创建仓库页面

在浏览器中打开：**https://github.com/new**

### 1.2 填写仓库信息

按照以下信息填写：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Repository name** | `video-slicer` | 仓库名称 |
| **Description** | `AI视频智能切片工具` | 仓库描述（可选） |
| **Visibility** | `Private` 或 `Public` | 私有或公开 |
| **Initialize this repository** | **不要勾选任何选项** | 保持空白 |

**重要提示：**
- ❌ 不要勾选 "Add a README file"
- ❌ 不要勾选 "Add .gitignore"
- ❌ 不要勾选 "Choose a license"

### 1.3 创建仓库

点击页面底部的绿色按钮 **"Create repository"**

### 1.4 记录仓库URL

创建成功后，你会看到一个页面，上面有仓库的URL：

```
https://github.com/superyueming/video-slicer.git
```

**请保持这个页面打开**，稍后会用到上面的命令。

---

## 🚀 第二步：生成GitHub Personal Access Token

### 2.1 访问Token设置页面

在新标签页中打开：**https://github.com/settings/tokens**

### 2.2 创建新Token

1. 点击右上角的 **"Generate new token"** 下拉菜单
2. 选择 **"Generate new token (classic)"**

### 2.3 配置Token

填写以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Note** | `video-slicer-release` | Token的名称 |
| **Expiration** | `No expiration` | 永不过期（或选择其他期限） |
| **Select scopes** | 勾选 `repo` | 完整的仓库访问权限 |

**重要：** 必须勾选 `repo` 这一项，它包含了所有子权限。

### 2.4 生成Token

1. 滚动到页面底部
2. 点击绿色按钮 **"Generate token"**
3. **立即复制Token**（类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

**⚠️ 重要提示：**
- Token只会显示一次，离开页面后将无法再次查看
- 请立即复制并保存到安全的地方
- 不要将Token分享给任何人或提交到代码中

---

## 🔐 第三步：配置GitHub Secrets

### 3.1 访问仓库设置页面

1. 回到你的仓库页面：`https://github.com/superyueming/video-slicer`
2. 点击顶部的 **"Settings"** 标签

### 3.2 进入Secrets配置

1. 在左侧菜单中找到 **"Secrets and variables"**
2. 点击展开，选择 **"Actions"**

### 3.3 添加新Secret

1. 点击右上角的 **"New repository secret"** 按钮
2. 填写以下信息：

| 字段 | 值 |
|------|-----|
| **Name** | `GH_TOKEN` |
| **Secret** | 粘贴刚才复制的Token |

3. 点击 **"Add secret"** 按钮

### 3.4 验证配置

返回到 "Secrets and variables" → "Actions" 页面，你应该看到：

```
Repository secrets
GH_TOKEN  Updated now
```

---

## ✅ 配置完成检查清单

在继续下一步之前，请确认：

- [x] GitHub仓库已创建（`superyueming/video-slicer`）
- [x] GitHub Personal Access Token已生成
- [x] Token已复制并保存
- [x] `GH_TOKEN` Secret已添加到仓库

---

## 📌 下一步

配置完成后，请回到对话中告诉我：**"GitHub仓库和Token已配置完成"**

我会帮你：
1. 初始化Git仓库
2. 推送代码到GitHub
3. 测试GitHub Actions自动构建

---

## 🆘 常见问题

### Q1: 找不到"Generate new token"按钮

**A:** 确保你访问的是：https://github.com/settings/tokens

如果还是找不到，可以尝试：
1. 点击右上角头像
2. 选择 "Settings"
3. 左侧菜单滚动到底部，找到 "Developer settings"
4. 选择 "Personal access tokens" → "Tokens (classic)"

### Q2: Token生成后忘记复制了

**A:** 
1. 返回 https://github.com/settings/tokens
2. 找到刚才创建的Token
3. 点击 "Delete" 删除它
4. 重新创建一个新Token

### Q3: 不确定是否勾选了正确的权限

**A:** 
必须勾选 `repo` 这一项，它会自动包含以下子权限：
- repo:status
- repo_deployment
- public_repo
- repo:invite
- security_events

### Q4: Secrets页面找不到

**A:** 
确保按照以下路径：
1. 仓库首页
2. Settings 标签
3. 左侧菜单：Secrets and variables
4. 点击 Actions

---

## 📚 相关文档

- [GitHub Token文档](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Secrets文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
