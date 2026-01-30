@echo off
REM Windows本地构建和测试脚本
REM 用于在推送到GitHub之前本地验证桌面应用

echo ========================================
echo 桌面应用本地构建测试
echo ========================================
echo.

REM 检查Node.js
echo [1/8] 检查Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未安装Node.js
    echo 请从 https://nodejs.org/ 下载并安装Node.js 22.x
    pause
    exit /b 1
)
node --version
echo ✅ Node.js已安装
echo.

REM 检查pnpm
echo [2/8] 检查pnpm...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  未安装pnpm，正在安装...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ❌ 错误: pnpm安装失败
        pause
        exit /b 1
    )
)
pnpm --version
echo ✅ pnpm已安装
echo.

REM 清理旧的构建
echo [3/8] 清理旧的构建...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist release rmdir /s /q release
echo ✅ 清理完成
echo.

REM 安装desktop依赖
echo [4/8] 安装desktop依赖...
call pnpm install --no-frozen-lockfile
if %errorlevel% neq 0 (
    echo ❌ 错误: desktop依赖安装失败
    pause
    exit /b 1
)
echo ✅ desktop依赖安装完成
echo.

REM 安装根目录依赖并构建web项目
echo [5/8] 构建web项目...
cd ..
call pnpm install --no-frozen-lockfile
if %errorlevel% neq 0 (
    echo ❌ 错误: 根目录依赖安装失败
    cd desktop
    pause
    exit /b 1
)
call pnpm run build
if %errorlevel% neq 0 (
    echo ❌ 错误: web项目构建失败
    cd desktop
    pause
    exit /b 1
)
cd desktop
echo ✅ web项目构建完成
echo.

REM 下载FFmpeg
echo [6/8] 下载FFmpeg...
if not exist resources\ffmpeg\win32 mkdir resources\ffmpeg\win32
if not exist resources\ffmpeg\win32\ffmpeg.exe (
    echo 正在下载FFmpeg...
    curl -L https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip -o ffmpeg.zip
    if %errorlevel% neq 0 (
        echo ❌ 错误: FFmpeg下载失败
        pause
        exit /b 1
    )
    echo 正在解压FFmpeg...
    tar -xf ffmpeg.zip --strip-components=1 -C resources\ffmpeg\win32 ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe
    del ffmpeg.zip
    echo ✅ FFmpeg下载完成
) else (
    echo ✅ FFmpeg已存在，跳过下载
)
echo.

REM 构建desktop应用
echo [7/8] 构建desktop应用...
call pnpm run build:prod
if %errorlevel% neq 0 (
    echo ❌ 错误: desktop应用构建失败
    pause
    exit /b 1
)
echo ✅ desktop应用构建完成
echo.

REM 显示构建结果
echo [8/8] 构建结果:
echo.
if exist release (
    dir /b release\*.exe
    echo.
    echo ========================================
    echo ✅ 构建成功！
    echo ========================================
    echo.
    echo 安装包位置: %cd%\release\
    echo.
    echo 下一步:
    echo 1. 在release目录中找到.exe安装包
    echo 2. 双击安装
    echo 3. 测试应用功能
    echo 4. 如果有问题，检查安装目录:
    echo    C:\Users\%USERNAME%\AppData\Local\Programs\video-slicer-desktop\resources\app\
    echo.
) else (
    echo ❌ 错误: release目录不存在
    pause
    exit /b 1
)

pause
