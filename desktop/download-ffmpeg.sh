#!/bin/bash

# FFmpeg下载脚本
# 下载各平台的FFmpeg静态编译版本

set -e

RESOURCES_DIR="$(cd "$(dirname "$0")/resources/ffmpeg" && pwd)"

echo "=== FFmpeg下载脚本 ==="
echo "目标目录: $RESOURCES_DIR"
echo ""

# Windows版本
echo "[1/3] 下载Windows版FFmpeg..."
cd "$RESOURCES_DIR/win"
if [ ! -f "ffmpeg.exe" ]; then
  wget -q --show-progress https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip -O ffmpeg-win.zip
  unzip -q ffmpeg-win.zip
  mv ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe .
  mv ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe .
  rm -rf ffmpeg-master-latest-win64-gpl ffmpeg-win.zip
  echo "✓ Windows版下载完成"
else
  echo "✓ Windows版已存在，跳过"
fi

# Mac版本
echo "[2/3] 下载Mac版FFmpeg..."
cd "$RESOURCES_DIR/mac"
if [ ! -f "ffmpeg" ]; then
  wget -q --show-progress https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip -O ffmpeg-mac.zip
  unzip -q ffmpeg-mac.zip
  chmod +x ffmpeg
  rm ffmpeg-mac.zip
  
  wget -q --show-progress https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip -O ffprobe-mac.zip
  unzip -q ffprobe-mac.zip
  chmod +x ffprobe
  rm ffprobe-mac.zip
  echo "✓ Mac版下载完成"
else
  echo "✓ Mac版已存在，跳过"
fi

# Linux版本
echo "[3/3] 下载Linux版FFmpeg..."
cd "$RESOURCES_DIR/linux"
if [ ! -f "ffmpeg" ]; then
  wget -q --show-progress https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -O ffmpeg-linux.tar.xz
  tar -xf ffmpeg-linux.tar.xz
  mv ffmpeg-*-amd64-static/ffmpeg .
  mv ffmpeg-*-amd64-static/ffprobe .
  chmod +x ffmpeg ffprobe
  rm -rf ffmpeg-*-amd64-static ffmpeg-linux.tar.xz
  echo "✓ Linux版下载完成"
else
  echo "✓ Linux版已存在，跳过"
fi

echo ""
echo "=== 下载完成 ==="
echo "文件大小："
du -sh "$RESOURCES_DIR"/*
echo ""
echo "下一步：运行 npm run build 打包应用"
