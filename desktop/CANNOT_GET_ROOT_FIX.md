# Cannot GET / 错误修复（v1.0.8）

## 🐛 问题描述

### v1.0.7 启动成功但显示白屏

**现象**：
- ✅ 应用成功启动（不再出现spawn node错误）
- ❌ 打开后显示白色界面
- ❌ 显示"Cannot GET /"错误信息

**截图描述**：
```
白色背景
显示文字：Cannot GET /
```

---

## 🔍 问题分析

### 错误原因

**Express服务器缺少前端页面**

在v1.0.7中，我们创建了一个最小化的Express服务器：

```typescript
// server.ts (v1.0.7)
export async function startServer(): Promise<number> {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // 只有一个健康检查端点
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });
  
  // 没有其他路由！
  
  app.listen(port);
  return port;
}
```

**问题**：
- 只定义了`/health`端点
- 没有定义根路径`/`的处理
- 没有静态文件服务
- 没有前端HTML页面

**当访问`http://localhost:3000/`时**：
1. Express收到GET请求到`/`
2. 没有找到匹配的路由
3. 返回默认的404错误："Cannot GET /"

### main.ts中的加载逻辑

```typescript
// main.ts
async function createWindow() {
  mainWindow = new BrowserWindow({ ... });
  
  // 加载本地服务器的根路径
  await mainWindow.loadURL(`http://localhost:${serverPort}`);
  // 相当于访问 http://localhost:3000/
  
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}
```

**流程**：
1. Electron创建窗口
2. 加载`http://localhost:3000/`
3. Express返回"Cannot GET /"
4. 窗口显示白屏和错误信息

---

## ✅ 解决方案

### 1. 创建前端HTML页面

**文件**：`desktop/public/index.html`

创建一个美观的欢迎页面：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>AI视频智能切片工具</title>
    <style>
        /* 渐变背景 + 卡片布局 */
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
        }
        
        /* 功能卡片网格 */
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 AI视频智能切片工具</h1>
        <p class="subtitle">智能识别视频内容，自动生成精彩片段</p>
        <div class="version">v1.0.0</div>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">🤖</div>
                <div class="feature-title">AI智能分析</div>
                <div class="feature-desc">基于先进的AI算法，自动识别视频中的精彩内容</div>
            </div>
            <!-- 更多功能卡片... -->
        </div>

        <div class="status">
            <div class="status-text">✅ 应用已成功启动</div>
        </div>

        <button class="btn" onclick="alert('功能开发中，敬请期待！')">开始使用</button>
    </div>
</body>
</html>
```

**特点**：
- 🎨 美观的渐变背景
- 📱 响应式设计
- ✨ 功能卡片展示
- 🎯 清晰的状态提示

### 2. 添加静态文件服务

**文件**：`desktop/src/server.ts`

```typescript
export async function startServer(): Promise<number> {
  const express = require('express');
  const path = require('path');
  const app = express();
  
  app.use(express.json());
  
  // 添加静态文件服务
  const publicPath = path.join(__dirname, '../public');
  console.log(`[Server] Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });
  
  // API endpoints
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  app.listen(port);
  return port;
}
```

**关键改动**：
```typescript
// 1. 引入path模块
const path = require('path');

// 2. 计算public目录路径
const publicPath = path.join(__dirname, '../public');
// __dirname 是编译后的 dist/ 目录
// ../public 指向 desktop/public/

// 3. 添加静态文件中间件
app.use(express.static(publicPath));
// 这会自动serve public目录下的所有文件
// 访问 / 会自动返回 index.html
```

### 3. 目录结构

```
desktop/
├── src/
│   ├── main.ts
│   └── server.ts
├── public/              ← 新增
│   └── index.html       ← 新增
├── dist/                (编译后)
│   ├── main.js
│   ├── server.js
│   └── public/          ← 打包时会复制
│       └── index.html
└── package.json
```

**打包配置**：
确保`electron-builder`配置中包含public目录：

```json
{
  "build": {
    "files": [
      "dist/**/*",
      "public/**/*",  ← 确保包含
      "node_modules/**/*"
    ]
  }
}
```

---

## 📊 修复前后对比

### v1.0.7（修复前）

**服务器**：
```typescript
app.get('/health', ...);  // 只有这一个路由
```

**访问`/`**：
```
GET / → 404 Not Found → "Cannot GET /"
```

**用户看到**：
```
白屏 + "Cannot GET /"
```

### v1.0.8（修复后）

**服务器**：
```typescript
app.use(express.static(publicPath));  // 静态文件服务
app.get('/health', ...);
app.get('/api/status', ...);
```

**访问`/`**：
```
GET / → express.static → public/index.html → 返回HTML
```

**用户看到**：
```
美观的欢迎页面
- 渐变背景
- 功能介绍
- 状态提示
- 操作按钮
```

---

## 🎯 技术要点

### Express静态文件服务

**工作原理**：
```typescript
app.use(express.static('public'));
```

当收到请求时：
1. 检查`public/`目录下是否有对应文件
2. 如果有，返回文件内容
3. 如果没有，继续到下一个中间件

**特殊处理**：
- `GET /` → 自动查找`index.html`
- `GET /style.css` → 返回`public/style.css`
- `GET /app.js` → 返回`public/app.js`

### 路径计算

**编译前**：
```
desktop/src/server.ts
desktop/public/index.html
```

**编译后**：
```
desktop/dist/server.js
desktop/public/index.html
```

**在server.js中**：
```typescript
__dirname  // → desktop/dist/
path.join(__dirname, '../public')  // → desktop/public/
```

**打包后（Windows）**：
```
C:\Program Files\video-slicer-desktop\
├── resources/
│   └── app.asar
│       ├── dist/
│       │   └── server.js
│       └── public/
│           └── index.html
```

**在打包应用中**：
```typescript
__dirname  // → C:\...\resources\app.asar\dist\
path.join(__dirname, '../public')  // → C:\...\resources\app.asar\public\
```

### 为什么不用绝对路径？

❌ **错误做法**：
```typescript
app.use(express.static('/home/ubuntu/video-slicer-web/desktop/public'));
```

原因：
- 开发环境路径和打包后路径不同
- Windows和Linux路径格式不同
- 用户安装路径不确定

✅ **正确做法**：
```typescript
app.use(express.static(path.join(__dirname, '../public')));
```

原因：
- 相对于代码位置计算路径
- 跨平台兼容
- 打包后仍然有效

---

## 🚀 预期效果

### v1.0.8 应该能够：

1. **正常启动**
   - ✅ 不出现spawn node错误
   - ✅ Express服务器成功启动

2. **显示前端页面**
   - ✅ 访问`/`返回HTML页面
   - ✅ 不再显示"Cannot GET /"
   - ✅ 显示美观的欢迎界面

3. **API可用**
   - ✅ `/health` - 健康检查
   - ✅ `/api/status` - 状态查询

4. **用户体验**
   - ✅ 启动后立即看到欢迎页面
   - ✅ 清晰的功能介绍
   - ✅ 友好的界面设计

---

## 📝 未来扩展

### 添加更多页面

```
public/
├── index.html       (首页)
├── upload.html      (上传页面)
├── processing.html  (处理页面)
├── results.html     (结果页面)
├── css/
│   └── style.css
└── js/
    └── app.js
```

### 添加路由

```typescript
// 单页应用路由
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});
```

### 添加API

```typescript
// 视频上传
app.post('/api/upload', upload.single('video'), (req, res) => {
  // 处理上传
});

// 处理状态
app.get('/api/process/:id', (req, res) => {
  // 返回处理状态
});

// 下载结果
app.get('/api/download/:id', (req, res) => {
  // 下载切片视频
});
```

---

## 📊 版本对比总结

| 版本 | 启动 | 前端页面 | 用户体验 |
|------|------|---------|---------|
| v1.0.6 | ❌ spawn node错误 | N/A | 无法启动 |
| v1.0.7 | ✅ 成功 | ❌ Cannot GET / | 白屏 |
| **v1.0.8** | **✅ 成功** | **✅ 欢迎页面** | **✅ 良好** |

---

**修复时间**：2026-01-30
**版本**：v1.0.8
**状态**：待测试
