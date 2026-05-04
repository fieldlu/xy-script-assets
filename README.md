# 小雅辅助工具 + WUT 网上党校 全能助手

[![小雅](https://img.shields.io/badge/小雅-v3.4.0-green)](https://gitee.com/fieldlu/xy-script-assets)
[![WUT](https://img.shields.io/badge/WUT-1.4.1-blue)](https://gitee.com/fieldlu/xy-script-assets)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

一套面向高校在线学习平台的 Tampermonkey 油猴脚本集。

---

## 小雅辅助工具（v3.4.0）

基于 `ai-augmented.com` 平台的全自动学习助手。

### 功能

**刷课引擎**
- 视频/文档智能连播挂机，自动跳课
- 防休眠 + 后台保活看门狗（10s 巡检，心跳缺口超 75s 自动补发）
- 深度伪装反检测（视界欺骗、暴力音轨剥离、鼠标模拟）
- 计划调度中心跨课编排
- 全局任务雷达一键秒交

**时长注入（v3.4.0 新增）**
- UI 面板输入分钟数，自动拆分为合理心跳包序列发送
- 控制台快捷命令：`xyInjectDuration(120)` / `xyStopInject()` / `xyKeepaliveStatus()`
- 实时进度条，支持随时中断

**讨论区**
- 抓包批量点赞/自定义回复
- 智能语料库

**课件**
- 课件批量下载

### 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. [点击安装 小雅辅助工具](https://gitee.com/fieldlu/xy-script-assets/raw/master/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20(1).user.js)

---

## WUT 网上党校 全能助手（v1.4.1）

基于 `wsdx.whut.edu.cn` 平台的全自动学习 + 云端题库 + AI 答题脚本。

### 刷课区
- **始终自动运行**：打开培训班页面即自动开始
- **全自动学习**：自动扫描课程列表 → 逐个进入 → 断点续播 → 完成后自动跳下一节
- **真人模拟**：10 种随机交互动作（鼠标移动/点击/双击/右键/拖拽/滚轮/悬停/移至视频/选中文字/触屏），每 8~35 秒触发
- **进度看门狗**：监控 `/api/student/study/progress/save`，2 分钟无更新时三层递进恢复
- **视频接管**：自动播放、跳过已看部分、不静音（防反作弊）、断点续播

### 题库区
- **云端题库**：Gitee 托管，自动合并上传、逐题比对查答案
- **三级级联搜索**：本地题库 → 云端批量 → AI 兜底
- **多 Provider AI**：支持 DeepSeek / Kimi / ChatGPT / Claude / Gemini / 智谱GLM / 通义千问 / 自定义
- **强制自动捕获**：交卷后网络拦截器自动提取正确答案并上传云端
- **三步答题流程**：获取答案 → 填充 → 提交

### 安装

[点击安装 WUT 全能助手](https://gitee.com/fieldlu/xy-script-assets/raw/master/WUT%E7%BD%91%E4%B8%8A%E5%85%9A%E6%A0%A1%20%E5%85%A8%E8%83%BD%E5%8A%A9%E6%89%8B.user.js)

---

## AI 密钥说明

- **密钥仅保存在本地浏览器**，不会泄露
- 支持 8 个 AI Provider，每位用户独立设置自己的密钥

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 许可证

MIT
