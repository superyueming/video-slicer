# FFmpeg 二进制文件

本目录存放各平台的FFmpeg静态编译版本，用于桌面应用的本地视频处理。

## 目录结构

```
ffmpeg/
  win/          # Windows版本
    ffmpeg.exe
    ffprobe.exe
  mac/          # Mac版本
    ffmpeg
    ffprobe
  linux/        # Linux版本
    ffmpeg
    ffprobe
```

## 下载方法

### 自动下载（推荐）

运行根目录的下载脚本：

```bash
cd desktop
./download-ffmpeg.sh
```

脚本会自动下载所有平台的FFmpeg二进制文件。

### 手动下载

如果自动下载失败，可以手动下载：

#### Windows
1. 访问 https://github.com/BtbN/FFmpeg-Builds/releases
2. 下载 `ffmpeg-master-latest-win64-gpl.zip`
3. 解压后将 `ffmpeg.exe` 和 `ffprobe.exe` 放入 `win/` 目录

#### Mac
1. 访问 https://evermeet.cx/ffmpeg/
2. 下载 `ffmpeg` 和 `ffprobe`
3. 放入 `mac/` 目录并添加执行权限：`chmod +x ffmpeg ffprobe`

#### Linux
1. 访问 https://johnvansickle.com/ffmpeg/
2. 下载 `ffmpeg-release-amd64-static.tar.xz`
3. 解压后将 `ffmpeg` 和 `ffprobe` 放入 `linux/` 目录并添加执行权限

## 文件大小

- Windows: ~150MB
- Mac: ~100MB
- Linux: ~120MB

## 版本信息

- FFmpeg版本：最新稳定版（通常是6.x或7.x）
- 编译选项：GPL（包含所有编解码器）

## 注意事项

1. **不要提交到Git**：这些文件很大，已在.gitignore中排除
2. **打包时自动包含**：electron-builder会自动将这些文件打包到应用中
3. **跨平台兼容**：每个平台使用对应的二进制文件
4. **许可证**：FFmpeg使用GPL许可证，确保您的应用符合GPL要求

## 使用方法

在代码中通过`ffmpegPath`获取FFmpeg路径：

```typescript
import { app } from 'electron';
import path from 'path';

const ffmpegPath = app.isPackaged
  ? path.join(process.resourcesPath, 'ffmpeg', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  : path.join(__dirname, '../resources/ffmpeg', 
      process.platform === 'win32' ? 'win/ffmpeg.exe' : 
      process.platform === 'darwin' ? 'mac/ffmpeg' : 
      'linux/ffmpeg');
```

## 故障排除

### 问题：FFmpeg找不到
- 检查文件是否存在于正确的目录
- 检查文件权限（Mac/Linux需要执行权限）
- 检查`app.isPackaged`是否正确判断

### 问题：FFmpeg执行失败
- 检查FFmpeg版本是否兼容
- 检查命令参数是否正确
- 查看FFmpeg的stderr输出获取错误信息

### 问题：打包后文件缺失
- 检查`package.json`中的`extraResources`配置
- 检查`.gitignore`是否意外排除了文件
- 手动检查打包后的`resources`目录
