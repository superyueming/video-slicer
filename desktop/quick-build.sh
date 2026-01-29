#!/bin/bash

# 快速打包脚本 - AI视频智能切片桌面应用

set -e  # 遇到错误立即退出

echo "========================================="
echo "  AI视频智能切片 - 桌面应用打包脚本"
echo "========================================="
echo ""

# 检查是否在desktop目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在desktop目录下运行此脚本"
    exit 1
fi

# 步骤1：构建Web项目
echo "📦 步骤1/4: 构建Web项目..."
cd ..
if [ ! -d "node_modules" ]; then
    echo "   安装Web项目依赖..."
    npm install
fi
npm run build
echo "✅ Web项目构建完成"
echo ""

# 步骤2：安装desktop依赖
echo "📦 步骤2/4: 安装desktop依赖..."
cd desktop
if [ ! -d "node_modules" ]; then
    npm install
fi
echo "✅ desktop依赖安装完成"
echo ""

# 步骤3：编译TypeScript
echo "🔨 步骤3/4: 编译TypeScript..."
npm run build:main
echo "✅ TypeScript编译完成"
echo ""

# 步骤4：打包应用
echo "📦 步骤4/4: 打包应用..."

# 检查是否提供了平台参数
PLATFORM="${1:-current}"

case "$PLATFORM" in
    "win"|"windows")
        echo "   打包Windows版本..."
        npm run dist:win
        ;;
    "mac"|"macos")
        echo "   打包Mac版本..."
        npm run dist:mac
        ;;
    "linux")
        echo "   打包Linux版本..."
        npm run dist:linux
        ;;
    "all")
        echo "   打包所有平台..."
        npm run dist
        ;;
    *)
        echo "   打包当前平台..."
        npm run dist
        ;;
esac

echo ""
echo "========================================="
echo "✅ 打包完成！"
echo "========================================="
echo ""
echo "📁 安装包位置: desktop/release/"
echo ""
ls -lh release/ 2>/dev/null || echo "   (未找到release目录，可能打包失败)"
echo ""
echo "🚀 下一步："
echo "   1. 测试安装包"
echo "   2. 上传到CDN/S3"
echo "   3. 在Web管理端创建版本记录"
echo ""
