@echo off
REM 快速打包脚本 - AI视频智能切片桌面应用 (Windows)

echo =========================================
echo   AI视频智能切片 - 桌面应用打包脚本
echo =========================================
echo.

REM 检查是否在desktop目录
if not exist "package.json" (
    echo ❌ 错误：请在desktop目录下运行此脚本
    pause
    exit /b 1
)

REM 步骤1：构建Web项目
echo 📦 步骤1/4: 构建Web项目...
cd ..
if not exist "node_modules" (
    echo    安装Web项目依赖...
    call npm install
)
call npm run build
if errorlevel 1 (
    echo ❌ Web项目构建失败
    pause
    exit /b 1
)
echo ✅ Web项目构建完成
echo.

REM 步骤2：安装desktop依赖
echo 📦 步骤2/4: 安装desktop依赖...
cd desktop
if not exist "node_modules" (
    call npm install
)
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ desktop依赖安装完成
echo.

REM 步骤3：编译TypeScript
echo 🔨 步骤3/4: 编译TypeScript...
call npm run build:main
if errorlevel 1 (
    echo ❌ TypeScript编译失败
    pause
    exit /b 1
)
echo ✅ TypeScript编译完成
echo.

REM 步骤4：打包应用
echo 📦 步骤4/4: 打包应用...
if "%1"=="mac" (
    echo    打包Mac版本...
    call npm run dist:mac
) else if "%1"=="linux" (
    echo    打包Linux版本...
    call npm run dist:linux
) else if "%1"=="all" (
    echo    打包所有平台...
    call npm run dist
) else (
    echo    打包Windows版本...
    call npm run dist:win
)

if errorlevel 1 (
    echo ❌ 打包失败
    pause
    exit /b 1
)

echo.
echo =========================================
echo ✅ 打包完成！
echo =========================================
echo.
echo 📁 安装包位置: desktop\release\
echo.
dir /B release 2>nul
echo.
echo 🚀 下一步：
echo    1. 测试安装包
echo    2. 上传到CDN/S3
echo    3. 在Web管理端创建版本记录
echo.
pause
