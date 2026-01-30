@echo off
REM 依赖检查脚本
REM 用于验证所有必需的依赖是否已安装

echo ========================================
echo 依赖检查工具
echo ========================================
echo.

REM 检查关键依赖
set MISSING=0

echo 检查关键依赖...
echo.

REM 检查electron-updater
node -e "try { require('electron-updater'); console.log('✅ electron-updater'); } catch(e) { console.log('❌ electron-updater'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查fs-extra
node -e "try { require('fs-extra'); console.log('✅ fs-extra'); } catch(e) { console.log('❌ fs-extra'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查uuid
node -e "try { require('uuid'); console.log('✅ uuid'); } catch(e) { console.log('❌ uuid'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查builder-util-runtime
node -e "try { require('builder-util-runtime'); console.log('✅ builder-util-runtime'); } catch(e) { console.log('❌ builder-util-runtime'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查debug
node -e "try { require('debug'); console.log('✅ debug'); } catch(e) { console.log('❌ debug'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查ms
node -e "try { require('ms'); console.log('✅ ms'); } catch(e) { console.log('❌ ms'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查js-yaml
node -e "try { require('js-yaml'); console.log('✅ js-yaml'); } catch(e) { console.log('❌ js-yaml'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

REM 检查semver
node -e "try { require('semver'); console.log('✅ semver'); } catch(e) { console.log('❌ semver'); process.exit(1); }" 2>nul
if %errorlevel% neq 0 set MISSING=1

echo.

if %MISSING% equ 0 (
    echo ========================================
    echo ✅ 所有依赖都已正确安装！
    echo ========================================
    echo.
    echo 您可以安全地构建应用了。
    echo 运行: test-build-windows.bat
) else (
    echo ========================================
    echo ❌ 有依赖缺失！
    echo ========================================
    echo.
    echo 请运行以下命令安装依赖:
    echo   pnpm install
    echo.
    echo 然后重新运行此脚本检查。
)

echo.
pause
