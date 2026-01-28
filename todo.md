# 视频切片工具 TODO

## 核心功能
- [x] 视频上传功能（支持拖拽上传）
- [x] 需求输入表单
- [x] ASR方案选择（Whisper/阿里云）
- [x] 实时处理进度显示
- [x] 视频预览播放器
- [x] 结果下载功能
- [x] 转录文本查看
- [x] 字幕文件下载

## 后端API
- [x] 视频上传接口
- [x] 音频提取功能
- [x] Whisper转录集成
- [x] DeepSeek内容分析
- [x] 视频切片处理
- [x] 视频拼接功能
- [x] 字幕生成和烧录

## 前端界面
- [x] 首页设计（上传区域）
- [x] 处理进度页面
- [x] 结果展示页面
- [x] 响应式布局
- [x] 深色主题配色
- [x] 动画和交互效果

## 优化项
- [ ] 错误处理和提示
- [ ] 文件大小限制提示
- [ ] 处理历史记录
- [ ] 批量处理支持

## Bug修复
- [x] 修复视频上传失败的网络错误（ProgressEvent）

## 大文件上传优化
- [x] 实现S3预签名URL直传支持GB级文件
- [x] 添加上传进度显示
- [ ] 支持断点续传（未来优化）
- [x] 优化上传性能（直传S3）

## 紧急Bug修复
- [x] 修复base64Data为undefined导致上传失败的问题
- [x] 修复“文件读取失败”错误（reader.result为空）
- [x] 彻底解决event.target.result为空的问题
- [x] 深入调查File对象为何导致FileReader返回空字符串（改用FormData上传）

## 任务处理问题
- [x] 调查视频处理任务失败的原因
- [x] 修复处理逻辑错误（subprocess参数冲突）

## 任务重启功能
- [x] 检查数据库中已上传的视频任务
- [x] 实现任务重新处理的API
- [x] 添加前端重启按钮

## 任务处理卡住问题
- [x] 检查任务为何一直停在等待处理状态
- [x] 诊断 processVideoAsync是否被触发
- [x] 修复Python版本问题（改用python3.11）
- [x] 添加自动处理pending状态任务的机制
- [x] 修复Python环境变量冲突（清除PYTHONPATH等）
- [x] 添加详细的错误日志输出
- [x] 发现视频文件损坏问题（moov atom not found）
- [x] 添加视频下载验证
- [ ] 需要重新上传视频测试完整流程

## S3永久链接修复
- [ ] 修改uploadRoute使用storagePut上传并返回永久URL
- [ ] 确保S3 bucket配置为公开读取
- [ ] 测试永久链接的可访问性

## 转录和分步处理优化
- [x] 修改转录输出为SRT格式带时间戳
- [x] 实现步骤3（AI内容分析）的UI显示
- [x] 实现步骤3的后端API和处理逻辑

## JobStatus页面错误修复
- [x] 修复null值调用toFixed()导致的TypeError

## 步骤4（生成视频片段）实现
- [x] 添加步骤4的数据库字段（finalVideoUrl和finalVideoKey）
- [x] 实现视频剪辑和拼接逻辑（clipVideos和concatenateVideos）
- [x] 添加generateClips API endpoint
- [x] 实现步骤4的前端UI和按钮

## 步骤4按钮不显示问题修复
- [x] 诊断问题原因（步骤3完成后progress=100导致按钮条件不满足）
- [x] 修改analyzeContentStep将progress重置为0
- [x] 手动更新任务2的progress为0验证修复
- [x] 测试完整流程确保所有步骤正常工作

## 步骤4视频剪辑失败问题
- [x] 诊断问题原因（AI返回的时间戳为null）
- [x] 检查selectedSegments数据结构
- [x] 修复时间戳解析逻辑
- [x] 改进AI提示词确保返回有效时间戳
- [x] 测试完整的视频剪辑流程

## 视频剪辑时间戳不准确问题
- [ ] 下载SRT字幕文件查看实际时间格式
- [ ] 检查timeStringToSeconds函数的解析逻辑
- [ ] 对比AI返回的时间戳与实际视频内容位置
- [ ] 修复时间戳转换错误
- [ ] 重新测试任务2确保剪辑位置正确

## 步骤3智能脚本生成和片段编辑功能
- [x] 设计数据库schema（添加scriptPrompt、overallScript等字段）
- [x] 实现智能提示词生成器（分析用户需求、视频类型、剪辑节奏）
- [x] 实现总体脚本生成功能（基于生成的提示词）
- [x] 实现片段编辑UI（显示、编辑、删除、添加片段）
- [x] 实现片段编辑API（updateSegments接口）
- [x] 优化步骤3的UI展示（用户需求、提示词、脚本、片段列表）
- [x] 测试完整流程

## 步骤3不能重新处理问题
- [x] 诊断问题原因（数据库schema未正确更新导致查询失败）
- [x] 修复重新处理按钮的显示逻辑（手动添加数据库字段）
- [x] 测试重新处理功能

## 允许每个步骤独立重新处理
- [x] 修改步骤2的按钮逻辑（只要有transcriptUrl就显示重新处理按钮）
- [x] 修改步骤3的按钮逻辑（只要有selectedSegments就显示重新处理按钮）
- [x] 移除调试信息
- [x] 测试所有步骤的重新处理功能

## 任务2重新运行步骤3生成完整分析结果
- [ ] 检查任务2的scriptPrompt和overallScript字段
- [ ] 点击重新处理按钮重新运行步骤3
- [ ] 验证查看结果弹窗显示完整的三阶段内容
- [ ] 测试片段编辑功能

## 步骤3提示词配置功能
- [x] 设计新的工作流程（步骤2完成→配置提示词→开始分析）
- [x] 添加generatePrompt API（只生成提示词，不执行分析）
- [x] 添加analyzeWithPrompt API（使用自定义提示词开始分析）
- [x] 创建PromptConfigDialog组件（显示和编辑需求、提示词）
- [x] 修改步骤3的按钮逻辑（添加“配置分析”按钮）
- [x] 测试完整的配置和分析流程

## 步骤2重新处理没有进度显示问题
- [x] 检查任务2的当前状态和日志
- [x] 诊断为什么重新处理没有进度显示（任务状态为completed，但验证要求audio_extracted）
- [x] 添加实时进度更新机制（已有refetch和轮询机制）
- [x] 修复状态更新逻辑（移除严格状态检查，允许任何状态下重新处理）
- [x] 测试重新处理功能

## 步骤3配置分析按钮不显示问题
- [x] 检查任务2步骤2完成后的状态（step=transcribed, selected_segments=NULL）
- [x] 查看配置分析按钮的显示条件（条件满足）
- [x] 修夏analyzeContentStep的严格状态检查，允许任何状态下重新处理
- [x] 测试配置分析功能

## 配置分析按钮应该任何时候都显示
- [x] 修改配置分析按钮的显示条件（只要有transcriptUrl就显示）
- [x] 测试按钮在不同状态下的显示

## 步骤3配置分析后没有进度显示
- [x] 检查PromptConfigDialog中的analyzeWithPrompt调用
- [x] 检查analyzeWithPrompt API是否正确更新状态
- [x] 修复进度显示逻辑（添加onSuccess回调刷新job数据）
- [x] 测试完整的配置分析流程

## 步骤2.5内容结构标注功能
- [x] 设计数据库schema（添加contentStructure字段存储标注结果）
- [x] 添加annotateStructure API（AI识别视频内容结构）
- [x] 添加updateContentStructure API（更新标注结果）
- [x] 运行pnpm db:push同步数据库schema
- [x] 重启服务器应用schema更改
- [x] 创建StructureAnnotationDialog组件（查看和编辑标注结果）
- [x] 添加annotateStructureMutation到JobStatus页面
- [x] 在步骤2完成后显示“标注内容结构”按钮
- [x] 添加StructureAnnotationDialog弹窗到JobStatus页面
- [x] 修改步骤3的AI分析，使用标注结果提升准确性
  - [x] 修改analyzeContentStep函数，在生成脚本时包含contentStructure信息
  - [x] 修改analyzeWithCustomPrompt函数，在选择片段时包含contentStructure信息
- [ ] 测试完整流程

## 修复步骤3 AI分析错误
- [ ] 诊断"Unexpected token '<'"错误原因
- [ ] 检查服务器日志找到具体错误
- [ ] 修复服务器端代码
- [ ] 测试验证修复
- [ ] 保存checkpoint

## 优化步骤3 AI分析提示词
- [ ] 诊断片段选择与提示词不符的原因
- [ ] 查看generatePromptOnly生成的提示词内容
- [ ] 查看segmentSelectionRequest的提示词内容
- [ ] 优化AI提示词，强调片段长度和数量要求
- [ ] 测试验证优化效果
- [ ] 保存checkpoint

## 步骤3未使用步骤2.5结构标注信息
- [ ] 检查数据库中contentStructure是否正确保存
- [ ] 检查analyzeContentStep是否正确读取contentStructure
- [ ] 检查structureInfo是否正确传递给AI
- [ ] 添加日志输出验证数据流
- [ ] 测试验证修复
- [ ] 保存checkpoint

## 步骤3片段选择不遵循脚本中的片段编号
- [ ] 诊断问题原因（AI在选择片段时没有参考脚本中标注的片段编号）
- [ ] 优化segmentSelectionRequest提示词，强调使用脚本中标注的片段编号
- [ ] 或者修改逻辑，直接从脚本中提取片段编号，不再让AI重新选择
- [ ] 测试验证优化效果
- [ ] 保存checkpoint
