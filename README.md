# 小雅辅助工具

[![version](https://img.shields.io/badge/version-3.4.0-green)](https://gitee.com/fieldlu/xy-script-assets)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

基于 `ai-augmented.com` 平台的全自动学习助手油猴脚本。

## 功能

### 刷课引擎
- 视频/文档智能连播挂机，自动跳课
- 防休眠 + **后台保活看门狗**（v3.4.0 新增，10s 巡检，心跳缺口超 75s 自动补发，定时器丢失自动重建）
- 深度伪装反检测（视界欺骗、暴力音轨剥离、鼠标模拟）
- 计划调度中心跨课编排
- 全局任务雷达一键秒交

### 时长注入（v3.4.0 新增）
- UI 面板输入分钟数 → 自动拆分为合理心跳包序列发送
- 控制台快捷命令：`xyInjectDuration(120)` / `xyStopInject()` / `xyKeepaliveStatus()`
- 实时进度条，支持随时中断
- 每包 1.5s 间隔，失败自动重试（指数退避，最多 3 次）

### 讨论区
- 抓包批量点赞/自定义回复
- 智能语料库

### 课件
- 课件批量下载

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. [点击安装脚本](https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20(1).user.js)

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 许可证

MIT
