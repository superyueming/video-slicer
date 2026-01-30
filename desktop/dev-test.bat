@echo off
REM 快速开发测试脚本 - 不打包，直接运行
REM 用于快速测试代码修改，无需等待打包

echo ========================================
echo 桌面应用开发模式
echo ========================================
echo.

REM 检查依赖是否已安装
if not exist node_modules (
    echo [1/3] 安装desktop依赖...
    call pnpm install --no-frozen-lockfile
    if %errorlevel% neq 0 (
        echo ❌ 错误: 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
) else (
    echo [1/3] ✅ 依赖已安装
    echo.
)

REM 检查web项目是否已构建
if not exist ..\dist (
    echo [2/3] 构建web项目...
    cd ..
    call pnpm install --no-frozen-lockfile
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
) else (
    echo [2/3] ✅ web项目已构建
    echo.
)

REM 构建desktop TypeScript代码
echo [3/3] 构建desktop代码...
call pnpm run build
if %errorlevel% neq 0 (
    echo ❌ 错误: desktop代码构建失败
    pause
    exit /b 1
)
echo ✅ desktop代码构建完成
echo.

REM 启动应用
echo ========================================
echo 🚀 启动应用...
echo ========================================
echo.
echo 提示: 
echo - 应用将在开发模式下运行
echo - 可以看到详细的控制台输出
echo - 按Ctrl+C停止应用
echo - 修改代码后需要重新运行此脚本
echo.

call pnpm run start

pause
