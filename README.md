# WUT 网上党校 全能助手

[![version](https://img.shields.io/badge/version-1.4.0-green)](https://gitee.com/fieldlu/whut-auto-study-dangxiao)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

武汉理工大学网上党校（`wsdx.whut.edu.cn`）全自动学习 + 云端题库 + AI 答题油猴脚本。

## 功能

### 刷课区
- **始终自动运行**：打开培训班页面即自动开始，无需手动操作
- **全自动学习**：自动扫描课程列表 → 逐个进入 → 断点续播 → 完成后自动跳下一节
- **真人模拟**：10 种随机交互动作（鼠标移动/点击/双击/右键/拖拽/滚轮/悬停/移至视频/选中文字/触屏），每 8~35 秒触发，防挂机检测
- **进度看门狗**：监控 `/api/student/study/progress/save`，2 分钟无更新时三层递进恢复（强制上报 → 暂停重播 → 强刷）
- **视频接管**：自动播放、跳过已看部分、不静音（防反作弊）、断点续播
- **智能进度扫描**：自动跳过已完成课程，只处理 WLXX 模式未完成项
- **完善日志**：面板实时显示播放进度、服务端上报百分比、真人模拟动作、课程完成状态

### 题库区
- **云端题库**：Gitee 托管，自动合并上传、逐题比对查答案
- **三级级联搜索**：本地题库 → 云端批量 → AI 兜底
- **多 Provider AI**：支持 8 家主流大模型：
  - DeepSeek / Kimi / ChatGPT / Claude / Gemini / 智谱GLM / 通义千问 / 自定义(OpenAI兼容)
  - 兼容 OpenAI / Anthropic / Google 三种 API 格式
- **强制自动捕获**：交卷后网络拦截器自动提取正确答案并上传云端
- **网络拦截双引擎**：XHR + Fetch 拦截，自动抓取页面题目入库
- **三步答题流程**：获取答案 → 填充 → 提交

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. [点击安装脚本](https://gitee.com/fieldlu/whut-auto-study-dangxiao/raw/master/WUT%E7%BD%91%E4%B8%8A%E5%85%9A%E6%A0%A1%20%E5%85%A8%E8%83%BD%E5%8A%A9%E6%89%8B.user.js)

## 使用

1. 打开 `wsdx.whut.edu.cn`
2. 进入「我的培训」→ 选择培训班 → 脚本自动开始
3. 右侧面板可折叠/拖拽，查看运行状态
4. 在考试/练习页面：使用左侧题库面板 → 获取答案 → 填充 → 提交

## AI 密钥说明

- **密钥仅保存在本地浏览器**，不会泄露
- 支持 8 个 AI Provider，每位用户独立设置自己的密钥

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 许可证

MIT
