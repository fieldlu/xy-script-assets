---
title: "⚡ 小雅辅助工具 — 小雅平台全自动学习助手"
slug: xiaoya-assistant
summary: "专为小雅平台打造的赛博朋克二次元风全自动刷课脚本，视频/文档连播、学时注入、课件下载、任务秒交，军工级稳定性，切后台不掉线。"
description: "小雅辅助工具是一款基于 Tampermonkey 的全自动学习助手油猴脚本，专为小雅平台（ai-augmented.com）打造。集刷课引擎、后台保活、学时注入、深度伪装、计划调度、任务雷达、课件下载、讨论区自动化于一体。赛博朋克 × 二次元风格界面，让枯燥的刷课变得像打游戏一样。"
---

<p align="center">
  <img src="https://img.shields.io/badge/version-3.4.6-ff69b4?style=for-the-badge" alt="version">
  <img src="https://img.shields.io/badge/license-%E8%87%AA%E5%AE%9A%E4%B9%89-red?style=for-the-badge" alt="license">
  <img src="https://img.shields.io/badge/platform-%E5%B0%8F%E9%9B%85%E5%B9%B3%E5%8F%B0-8b5cf6?style=for-the-badge" alt="platform">
  <img src="https://img.shields.io/badge/script-Tampermonkey-10b981?style=for-the-badge" alt="script">
</p>

<br>

<p align="center">
  <sub style="font-size: 14px; color: #94a3b8;">专为小雅平台（ai-augmented.com）打造 · 赛博朋克 × 二次元 · 军工级稳定性</sub>
</p>

<br>

---

<br>

> <p align="center" style="font-size: 18px;">🎀 <strong>「主人～今天的刷课任务就交给小雅辅助工具吧！(｡･ω･｡)ﾉ♡」</strong></p>

<br>

<p align="center">
  <a href="https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js">
    <img src="https://img.shields.io/badge/✨%20点我安装%20小雅辅助工具-ec4899?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" height="56">
  </a>
</p>

<br>

---

<br>

## ✨ 为什么选小雅辅助工具？

<br>

<table>
<tr>
<td width="50%" align="center">

### 🎮 全自动托管

视频/文档智能连播，自动跳课，**无人值守**。

切后台不掉线，回来自动补时。

</td>
<td width="50%" align="center">

### 🛡️ 深度伪装

鼠标轨迹模拟、键盘随机敲击、

视界欺骗、暴力音轨剥离。

—— **像真人一样自然**。

</td>
</tr>
<tr>
<td align="center">

### 📅 计划调度中心

跨课程自定义编排，每课独立策略

连播 / 刷时 / 无限 · **定时启停**

</td>
<td align="center">

### ⚡ 全局任务雷达

一键扫描全网未完成任务

秒级批量提交 · **智能分拣**

</td>
</tr>
<tr>
<td align="center">

### 📥 课件批量下载

搜索过滤 + 进度条 + 暂停/终止

加密链接自动解密 · **下载零失败**

</td>
<td align="center">

### 💬 讨论区自动化

抓包批量点赞 + 自定义回复

DOM 智能扫描 · **一键清空**

</td>
</tr>
</table>

<br>

---

<br>

## 🔥 v3.4.6 最新更新

> **时长注入引擎全面修复** — 此前因函数未定义，该功能一直不可用。现已修复 **6 处 Bug** 并全面加强。

<br>

| 级别 | 修复内容 |
|:--:|------|
| 🐛 **致命** | `_origSendRecordRequest` 未定义 → 注入功能完全不可用 → **已修复** |
| 🔒 **并发锁** | 注入期间自动抢占 `isRecordSending`，**阻止心跳重复发包** |
| 🔄 **防节流** | 看门狗定时器重建改用**持久化引擎**，切后台不掉线 |
| 🛡️ **安全限** | **300 分钟**单次上限 + `activeZone` 校验 + `try-finally` 锁释放 |
| 🧪 **测试** | 新增 `inject-test.js`，支持 `--dry` 干跑模式验证 |

<br>

<details>
<summary><strong>📋 v3.4.5 下载区进化（点击展开）</strong></summary>
<br>

- 下载引擎全面修复：**Token 鉴权** + 加密链接 DES 自动解密
- 下载区搜索框：实时过滤，全选智能适配
- 下载区进度条：批量下载实时百分比，**绿紫渐变可视化**
- 下载区暂停/终止：AbortController 中断 fetch，已下载不丢失

</details>

<details>
<summary><strong>📋 v3.4.4 持久化定时器（点击展开）</strong></summary>
<br>

- **7 个关键定时器**全部升级为防后台节流版本
- 浏览器切后台/最小化后切回，**自动补偿**错过的计时和心跳
- `visibilitychange` 事件监听，前台恢复触发即时补偿

</details>

<br>

---

<br>

## 🚀 快速安装

<br>

### ① 安装油猴扩展

前往 [Tampermonkey 官网](https://www.tampermonkey.net/) 安装浏览器扩展
<p align="center">
  <sub>支持 <strong>Chrome</strong> · <strong>Edge</strong> · <strong>Firefox</strong> · <strong>Safari</strong></sub>
</p>

<br>

### ② 安装小雅辅助工具

<p align="center">
  <a href="https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js">
    <img src="https://img.shields.io/badge/✨%20一键安装%20小雅辅助工具-ec4899?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" height="56">
  </a>
</p>

<p align="center">
  <sub>或手动复制安装地址：</sub>
</p>

<p align="center">
  <code>https://gitee.com/fieldlu/xy-script-assets/raw/main/小雅辅助工具%20.user.js</code>
</p>

> <p align="center">💡 安装后油猴自动检测更新，<strong>脚本每次升级你都能第一时间收到！</strong></p>

<br>

---

<br>

## 🎀 完整功能地图

<br>

```
                           ╔══════════════════════════════╗
                           ║   小雅辅助工具  v3.4.6      ║
                           ╚══════════════════════════════╝
                                      │
       ┌─────────┬─────────┬─────────┼─────────┬─────────┬─────────┐
       │         │         │         │         │         │         │
     🎬 启动    📺 刷课   💓 保活   ⏱️ 注入   🕵️ 伪装   📅 调度   ⚡ 雷达
     画面      引擎      引擎      引擎      引擎      中心      任务
       │         │         │         │         │         │         │
       ▼         ▼         ▼         ▼         ▼         ▼         ▼
   HUD动画   智能连播   10s巡检   三重防护   鼠标轨迹   跨课编排   一键秒交
  冷启动专属  自动跳课   永不掉线   二次确认   键盘模拟   每课独立   智能分拣
  刷新跳过   指数退避   自动补偿   随时中断   视界欺骗   定时启停   批量提交
             缓存去重   7定时器    进度条    音轨剥离              倒计时排
       │         │         │         │         │         │         │
       └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
                                      │
                          ┌───────────┼───────────┐
                          │           │           │
                        📥 下载     💬 讨论     🎨 界面
                          │           │           │
                          ▼           ▼           ▼
                      搜索过滤    批量点赞    霓虹配色
                      进度条     自定义回复   毛玻璃HUD
                      暂停终止    DOM扫描     折叠面板
                      加密解密    一键清空    日夜切换
```

<br>

---

<br>

## 🔒 隐私与免责

<br>

### ✅ 我们承诺

| 承诺 | 说明 |
|:--:|------|
| 🔐 **零收集** | 不收集任何个人信息（账号、密码、手机号等） |
| 📵 **零上传** | 不上传数据到第三方服务器 |
| 🚫 **零追踪** | 不使用统计埋点、广告 SDK |
| 💾 **纯本地** | 所有数据仅存浏览器本地（`GM_setValue` / `sessionStorage`） |
| 🌐 **仅平台** | 网络请求仅用于与 `ai-augmented.com` 正常交互 |

<br>

### ⚠️ 风险告知

> - ⚠️ 本脚本仅供**个人学习研究**使用
> - ⚠️ 使用可能违反目标平台用户协议
> - ⚠️ 作者不对账号异常、课程数据丢失等后果负责
> - ⚠️ **严禁**代刷、代挂、售卖等商业用途

<br>

<p align="center">
  <sub>详见 <a href="LICENSE"><strong>LICENSE</strong></a> · <a href="CHANGELOG.md"><strong>CHANGELOG</strong></a></sub>
</p>

<br>

---

<br>

<p align="center">
  <sub style="font-size: 13px;">Made with 💖 for <strong>小雅平台</strong></sub>
</p>
<p align="center">
  <sub style="font-size: 13px;">主人要好好加油哦～ (｡･ω･｡)ﾉ♡</sub>
</p>

<br>
