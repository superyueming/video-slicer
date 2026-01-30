# 桌面应用本地测试快速开始

## 最简单的方式（3步）

### 1. 下载代码

```cmd
git clone https://github.com/superyueming/video-slicer.git
cd video-slicer\desktop
```

### 2. 运行测试脚本

```cmd
test-build-windows.bat
```

### 3. 安装并测试

在 `release` 目录找到安装包，双击安装。

---

## 快速测试（不打包）

如果只想快速测试代码修改：

```cmd
cd desktop
dev-test.bat
```

应用会直接启动，无需等待打包。

---

## 检查依赖

如果遇到"Cannot find module"错误：

```cmd
cd desktop
check-dependencies.bat
```

---

## 需要帮助？

查看完整文档：[LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md)

---

## 前置要求

- ✅ Node.js 22.x
- ✅ pnpm（会自动安装）
- ✅ Windows 10/11

就这么简单！🎉
