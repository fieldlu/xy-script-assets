# ⚡ 小雅辅助工具 — Cyberpunk 强化版 ✨

[![version](https://img.shields.io/badge/version-3.4.1-pink)](https://gitee.com/fieldlu/xy-script-assets)
[![license](https://img.shields.io/badge/license-自定义-red)](LICENSE)

> 「主人～今天的学习任务就交给小雅吧！(｡･ω･｡)ﾉ♡」

基于 `ai-augmented.com` 平台的全自动学习助手油猴脚本。赛博朋克二次元风格，让枯燥的刷课变得像打游戏一样～💖

## 🌟 启动画面

- 🎬 **冷启动专属赛博朋克 HUD 动画**：星空、光环、菱形粒子、六边形装饰、扫描线、脉冲波 —— 新标签页打开才触发，刷新不打扰
- 🎨 紫/青/玫瑰三色霓虹配色，毛玻璃卡片 + HUD 四角装饰

## 🎀 功能一览

### 📺 刷课引擎 — 全自动托管
- 🎬 视频/文档智能连播挂机，自动跳课，主人安心摸鱼就好～
- 🧠 **智能跳转优化**：同课程按 node_id 顺序跳、跨课程优先清完一门再下一门
- 🛡️ 防休眠 + **💓 后台保活看门狗**（每 10s 巡检，心跳缺口超 75s 自动补发）
- 🕵️ 深度伪装反检测（视界欺骗、暴力音轨剥离、鼠标/键盘模拟）
- 📅 计划调度中心跨课编排
- ⚡ 全局任务雷达一键秒交 + 批量提交
- 🔄 **雷达 API 缓存去重**（3s TTL），减少重复请求

### ⚠️ 学时注入（高危 · 谨慎使用）
- 🎛️ 红色警告面板 + 二次确认弹窗 + 风险说明
- ⏱️ 默认 30 分钟，最大 300 分钟，自动拆分心跳包
- 💻 控制台快捷命令：`xyInjectDuration(30)` / `xyStopInject()` / `xyKeepaliveStatus()`
- 📊 实时进度条，支持随时中断，失败自动重试

### 💬 讨论区
- 👍 抓包批量点赞 / 自定义回复
- 🔍 DOM 智能扫描 + 搜索过滤

### 📥 课件
- 📦 课件批量下载

## 🔧 安装指南

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. [✨ 点我安装小雅辅助工具 ✨](https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js)

## 📋 更新日志

详见 [CHANGELOG.md](CHANGELOG.md) ～小雅每次成长都会记录在那里哦！

## 📜 许可证

**仅供个人查看与传播使用。**
- 禁止修改、复制、衍生代码
- 禁止售卖或用于商业用途
- 禁止代刷、代挂等第三方盈利行为

详见 [LICENSE](LICENSE)
