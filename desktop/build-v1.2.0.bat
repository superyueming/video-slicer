@echo off
REM Build script for v1.2.0 - Desktop app with complete web version

echo ==========================================
echo Building Desktop App v1.2.0
echo ==========================================

REM Step 1: Build web version
echo.
echo [1/5] Building web version...
cd ..
call pnpm run build
if errorlevel 1 (
    echo Error: Web build failed
    exit /b 1
)

REM Step 2: Copy web build to desktop
echo.
echo [2/5] Copying web build to desktop...
cd desktop
if exist web-dist rmdir /s /q web-dist
xcopy /E /I /Y ..\dist web-dist
echo √ Web build copied to desktop\web-dist\

REM Step 3: Build desktop TypeScript
echo.
echo [3/5] Building desktop TypeScript...
call npm run build:main
if errorlevel 1 (
    echo Error: Desktop TypeScript build failed
    exit /b 1
)
echo √ Desktop TypeScript compiled

REM Step 4: Check FFmpeg
echo.
echo [4/5] Checking FFmpeg...
if not exist "resources\ffmpeg\win" (
    echo FFmpeg not found. Please run download-ffmpeg.bat first
    echo Skipping FFmpeg check for now...
) else (
    echo √ FFmpeg found
)

REM Step 5: Package desktop app
echo.
echo [5/5] Packaging desktop app...
call npm run dist:win
if errorlevel 1 (
    echo Error: Packaging failed
    exit /b 1
)

echo.
echo ==========================================
echo √ Build complete!
echo ==========================================
echo.
echo Installation package location:
echo   desktop\release\
echo.
echo Next steps:
echo   1. Test the installation package
echo   2. Install MySQL and create database
echo   3. Configure .env file with DATABASE_URL
echo   4. Run the application
echo.

pause
