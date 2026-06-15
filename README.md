# 小雅辅助工具

[![version](https://img.shields.io/badge/version-3.5.5-ff69b4)](https://gitee.com/fieldlu/xy-script-assets)
[![license](https://img.shields.io/badge/license-%E8%87%AA%E5%AE%9A%E4%B9%89-red)](LICENSE)
[![userscript](https://img.shields.io/badge/tampermonkey-v4.19+-brightgreen)](https://www.tampermonkey.net/)

面向小雅平台的浏览器用户脚本，集成视频/文档处理、课件下载、作业导出等常用功能。

**[📦 点我安装](https://scriptcat.org/zh-CN/script-show-page/5881)** · [📋 更新日志](CHANGELOG.md) · [📄 许可证](LICENSE)

---

## 功能

- **视频与文档**：自动完成视频播放与文档阅读任务
- **课件下载**：批量下载课程课件文件到本地，支持搜索过滤与暂停续传
- **作业导出**：将课程作业/测验题目导出为 Word 文档（.docx），含文字与图片
- **讨论区**：批量处理讨论区互动任务
- **任务编排**：跨课程任务编排，支持多种运行策略

---

## 安装

### 前置条件

- 浏览器：Chrome / Edge / Firefox（最新稳定版）
- 扩展：[Tampermonkey](https://www.tampermonkey.net/) v4.19+

### 步骤

1. 安装 Tampermonkey 浏览器扩展
2. 点击上方 **[📦 点我安装]**，Tampermonkey 自动弹出安装页：
   ```
   https://scriptcat.org/zh-CN/script-show-page/5881
   ```
3. 点击「安装」完成

---

## 使用

安装后进入小雅平台，页面右上角出现控制面板，按需使用各功能模块。

---

## 技术栈

- 纯原生 JavaScript，零外部依赖
- 基于 Tampermonkey API 实现跨域请求与本地存储
- 防御式编程，关键路径配备异常保护

---

## 更新历史

### v3.5.5（2026-06-15）

- 新增：作业题目导出为 Word 文档（.docx），含题目文字与图片
- 优化：整体版本维护更新

### v3.5.4（2026-06-12）

- 新增：休眠区/刷课区一键雷达连播，DDL 智能排序
- 修复：情报站本地化，秒开零延迟

> 完整历史请参阅 [CHANGELOG.md](CHANGELOG.md)

---

## 贡献

欢迎通过 [Issue](https://gitee.com/fieldlu/xy-script-assets/issues) 和 [Pull Request](https://gitee.com/fieldlu/xy-script-assets/pulls) 参与贡献。

---

## 隐私与免责

- 不收集任何个人信息
- 不上传数据到第三方服务器
- 所有数据仅存浏览器本地
- 仅供个人学习研究使用
- 严禁用于商业用途

---
