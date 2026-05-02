# Changelog

## 1.4.0 (2026-05-02)

### 新增
- **始终自动运行**：移除开始/暂停按钮，打开页面即自动开始学习
- **真人模拟增强**：从 4 种动作扩展到 10 种（鼠标移动/点击/双击/右键/拖拽/滚轮/悬停/移至视频/选中文字/触屏），间隔从 25~90s 缩短到 8~35s
- **进度看门狗**：监控 `/api/student/study/progress/save` 接口，2 分钟无进度更新时自动三层递进恢复：
  - L1：强制调用 API 上报
  - L2：再次上报 + 暂停重播视频
  - L3：强制刷新页面
- **进度上报监控**：拦截 fetch 和 XMLHttpRequest，实时显示服务端返回的进度百分比
- **完善日志**：运行日志增加蓝色 "🎭 真人模拟" 类型和灰色 "⏱ 播放里程碑" 类型

### 修复
- **视频静音导致不计时**：`video.muted` 从 `true` 改为 `false`，避免触发平台反作弊静音检测
- **视频播放事件日志**：增加 `play`/`pause`/`seeking` 事件日志，方便排查

### 优化
- 视频每 30 秒记录一次播放进度里程碑
- 进度上报日志带课程 ID 前缀，进度 ≥90% 变绿色

## 1.3.0 (2026-05-02)

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

## 1.2.0 (2026-04)

- DeepSeek AI 答题集成
- 答案三步流程：获取→填充→提交
- 题库面板 OLED 暗色主题
- 云端题库 qbank.json 合并架构

## 1.1.0

- 全自动视频学习
- 视频断点续播 / 智能跳课
- 看门狗防卡死机制
- 本地题库存储

## 1.0.0

- 初始版本：自动学习 + 基础题库
