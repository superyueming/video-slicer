@echo off
echo ========================================
echo 一键修复并发布 v1.0.3
echo ========================================
echo.

REM 检查是否在正确的目录
if not exist ".github\workflows\build-desktop.yml" (
    echo 错误：请在项目根目录运行此脚本
    pause
    exit /b 1
)

echo [1/5] 修改 GitHub Actions 配置文件...
echo.

REM 备份原文件
copy ".github\workflows\build-desktop.yml" ".github\workflows\build-desktop.yml.backup" >nul

REM 使用PowerShell替换文件内容
powershell -Command "(Get-Content '.github\workflows\build-desktop.yml') -replace 'run: cd desktop && pnpm install --no-frozen-lockfile', 'run: |\n          cd desktop\n          # Use npm instead of pnpm to avoid symlink issues with electron-builder\n          npm install' | Set-Content '.github\workflows\build-desktop.yml'"

echo 配置文件已修改
echo.

echo [2/5] 提交更改...
git add .github\workflows\build-desktop.yml
git commit -m "fix: use npm instead of pnpm for desktop dependencies to avoid symlink issues"
echo.

echo [3/5] 推送到 GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo 错误：推送失败，请检查您的 GitHub 认证
    echo 您可能需要先运行: gh auth login
    pause
    exit /b 1
)
echo.

echo [4/5] 创建并推送 tag v1.0.3...
git tag v1.0.3
git push origin v1.0.3
if errorlevel 1 (
    echo.
    echo 错误：推送 tag 失败
    pause
    exit /b 1
)
echo.

echo [5/5] 完成！
echo.
echo ========================================
echo 修复已完成！
echo ========================================
echo.
echo 接下来：
echo 1. GitHub Actions 将自动开始构建（约 5-10 分钟）
echo 2. 访问 https://github.com/superyueming/video-slicer/actions 查看构建进度
echo 3. 构建完成后，访问 https://github.com/superyueming/video-slicer/releases
echo 4. 下载 v1.0.3 的安装包进行测试
echo.
echo 如果构建失败，请检查 Actions 日志中的错误信息
echo.
pause
