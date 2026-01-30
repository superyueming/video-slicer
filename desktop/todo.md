# Desktop App TODO

## 已完成的修复
- [x] 修复uuid包的ES Module错误（降级到v8.3.2）
- [x] 禁用在线验证避免启动阻塞
- [x] 修复spawn node ENOENT错误（改为进程内Express）
- [x] 添加前端页面修复Cannot GET /
- [x] 修复public目录打包问题

## 功能开发
- [x] 分析web版本的功能和页面结构
- [ ] 设计桌面版架构（本地化、SQLite、FFmpeg）
- [x] 实现任务列表页面（tasks.html）
- [ ] 实现视频上传页面（upload.html）
- [ ] 实现任务详情页面（task-detail.html）
- [x] 实现Express API端点（/api/tasks, /api/upload等）
- [x] 实现SQLite数据库存储
- [ ] 实现视频处理逻辑（FFmpeg + AI）
- [ ] 实现结果展示和下载
- [ ] 测试完整流程
- [ ] 创建新版本并发布
