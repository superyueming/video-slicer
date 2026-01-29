# 更新日志

本文档记录桌面应用的所有版本更新内容。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### 新增
- 配置GitHub Actions自动打包工作流
- 集成electron-updater自动更新
- 创建完整的发布流程文档

---

## [1.0.0] - 2024-01-28

### 新增
- 桌面应用首次发布
- Electron项目结构
- 版本管理API
- 强制更新机制
- 在线验证机制
- 应用图标设计
- 打包配置（Windows/Mac/Linux）
- FFmpeg集成（extractAudio, clipVideo, concatenateVideos）
- 本地视频处理功能
- IPC通信接口
- 本地处理UI页面
- 音频上传和AI分析功能

### 优化
- 优化启动速度
- 改进错误提示

### 已知问题
- 跨平台打包需要对应的操作系统环境
- FFmpeg二进制文件需要手动下载

---

## 版本类型说明

- **新增**: 新功能
- **优化**: 对现有功能的改进
- **修复**: Bug修复
- **变更**: 对现有功能的修改
- **移除**: 移除的功能
- **安全**: 安全相关的修复
- **已知问题**: 当前版本存在的已知问题
