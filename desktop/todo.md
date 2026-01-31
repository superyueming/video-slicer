# Desktop App TODO

## 已完成的修复
- [x] 修复uuid包的ES Module错误（降级到v8.3.2）
- [x] 禁用在线验证避免启动阻塞
- [x] 修复spawn node ENOENT错误（改为进程内Express）
- [x] 添加前端页面修复Cannot GET /
- [x] 修复public目录打包问题

## v1.1.0 已完成
- [x] 分析web版本的功能和页面结构
- [x] 实现任务列表页面（tasks.html）
- [x] 实现视频选择页面（select-video.html）
- [x] 实现Express API端点（/api/tasks）
- [x] 实现SQLite数据库存储

## v1.2.0 开发任务（Desktop = Web完整版包装器 + MySQL）
- [x] 创建本地文件存储适配器（替代S3）
- [x] 在web版server中添加DESKTOP_MODE环境变量支持
- [x] 修改OAuth逻辑：desktop模式下跳过认证
- [x] 修改desktop的main.ts启动web版服务器
- [x] 复制web版构建产物到desktop/public
- [x] 安装web版的所有依赖到desktop/package.json
- [x] 创建desktop环境变量配置文件
- [x] 添加MySQL安装和配置说明文档
- [ ] 测试完整流程（选择视频→处理→查看结果）
- [ ] 创建v1.2.0并发布
