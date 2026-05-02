# Changelog

## v1.3.0 (2026-05-02)

### 新增
- 多 Provider AI 引擎：支持 8 家主流大模型 (DeepSeek/Kimi/ChatGPT/Claude/Gemini/GLM/Qwen/自定义)
- 兼容 OpenAI / Anthropic / Google 三种 API 格式
- Gitee 云端 ai-config.json 存储 Provider 定义和模型列表
- 每 Provider 独立密钥管理（仅本地存储，绝不从云端加载）
- 强制自动捕获正确答案并上传云端（网络拦截器驱动，不可关闭）

### 修复
- Gitee 仓库分支名 main→master（修复云端题库 404 和上传 400 错误）
- gmFetch JSON 解析改写为 text-based（修复 SHA 获取失败）
- 党校学习面板最小化 CSS 选择器（#__whut_panel.collapsed）
- 删除党校学习面板 × 关闭按钮

### 优化
- 题库面板 UI 精简：移除冗余按钮（CSV 导出、高级接口、重复上传/捕获）
- 三级级联搜索逻辑提取为 cascadeSearch() 共享函数
- 删除重复的 startCorrectAnswerWatcher / captureCorrectAnswers
- 移除硬编码 DeepSeek 密钥，改为用户自行配置

## v1.2.0 (2026-04)

- DeepSeek AI 答题集成
- 答案三步流程：获取→填充→提交
- 题库面板 OLED 暗色主题
- 云端题库 qbank.json 合并架构

## v1.1.0

- 全自动视频学习
- 视频断点续播 / 智能跳课
- 看门狗防卡死机制
- 本地题库存储

## v1.0.0

- 初始版本
