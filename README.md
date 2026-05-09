# ⚡ 小雅辅助工具 <img src="https://img.shields.io/badge/version-3.4.6-ff69b4?style=flat-square" align="right">

[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgitee.com%2Ffieldlu%2Fxy-script-assets%2Fraw%2Fmain%2Fnotice_new.json&query=%24.title&style=flat-square&label=release&color=%23ec4899)](https://gitee.com/fieldlu/xy-script-assets)
[![license](https://img.shields.io/badge/license-%E8%87%AA%E5%AE%9A%E4%B9%89-red?style=flat-square)](LICENSE)
[![platform](https://img.shields.io/badge/platform-ai--augmented.com-8b5cf6?style=flat-square)]()
[![script](https://img.shields.io/badge/script-Tampermonkey-10b981?style=flat-square)](https://scriptcat.org/zh-CN/script-show-page/5881)

<br>

> 🎀 **「主人～今天的刷课任务就交给小雅辅助工具吧！(｡･ω･｡)ﾉ♡」**
>
> 专为 **小雅平台**（`ai-augmented.com`）打造的全自动学习助手油猴脚本。
> 赛博朋克 × 二次元风格 × 军工级稳定性 —— 让刷课变成一件优雅的事。

<br>

---

## ✨ 为什么选小雅辅助工具？

<table>
<tr>
<td width="50%">

### 🎮 全自动托管
视频/文档智能连播，自动跳课，无人值守。切后台不掉线，回来自动补时。

</td>
<td width="50%">

### 🛡️ 深度伪装
鼠标轨迹模拟、键盘随机敲击、视界欺骗、暴力音轨剥离 —— 像真人一样自然。

</td>
</tr>
<tr>
<td>

### 📅 计划调度中心
跨课程自定义编排，每课独立设定策略（连播/刷时/无限），定时启停，自动化流水线。

</td>
<td>

### ⚡ 全局任务雷达
一键扫描全网未完成任务，秒级批量提交。文档/视频分拣，智能跳过已完成项。

</td>
</tr>
<tr>
<td>

### 📥 课件批量下载
搜索过滤 + 进度条可视化 + 暂停/终止 + 加密链接自动解密。Token 鉴权，下载不失败。

</td>
<td>

### 💬 讨论区自动化
抓包批量点赞 + 自定义回复模板。DOM 智能扫描，一键清空讨论任务。

</td>
</tr>
</table>

---

## 🔥 v3.4.6 最新更新

> **时长注入引擎全面修复** —— 此前因函数未定义，该功能一直不可用。现已修复 6 处 Bug 并加强。

| 修复 | 说明 |
|------|------|
| 🐛 致命 | `_origSendRecordRequest` 未定义 → 注入功能完全不可用 → **已修复** |
| 🔒 并发锁 | 注入期间自动 `isRecordSending` 抢占，阻止心跳重复发包 |
| 🔄 防节流 | 看门狗定时器重建改用持久化引擎，切后台不掉线 |
| 🛡️ 安全限 | 300 分钟单次上限 + `activeZone` 校验 + `try-finally` 锁释放 |
| 🧪 测试脚本 | 新增 `inject-test.js`，支持 `--dry` 干跑模式验证注入逻辑 |

<details>
<summary>📋 v3.4.5 下载区进化（点击展开）</summary>

- 下载引擎全面修复：Token 鉴权 + 加密链接 DES 自动解密
- 下载区搜索框：实时过滤，全选智能适配
- 下载区进度条：批量下载实时百分比，绿紫渐变
- 下载区暂停/终止：AbortController 中断 fetch，已下载不丢失

</details>

<details>
<summary>📋 v3.4.4 持久化定时器（点击展开）</summary>

- 7 个关键定时器全部升级为防后台节流版本
- 浏览器切后台/最小化后切回前台，自动补偿错过的计时和心跳
- `visibilitychange` 事件监听，前台恢复触发即时补偿

</details>

---

## 🚀 快速安装

### 第一步：安装油猴扩展
前往 [Tampermonkey 官网](https://www.tampermonkey.net/) 安装浏览器扩展（支持 Chrome / Edge / Firefox）

### 第二步：安装小雅辅助工具

<p align="center">
  <a href="https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js">
    <img src="https://img.shields.io/badge/✨%20点我安装%20小雅辅助工具-ec4899?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" height="48">
  </a>
</p>

或手动复制安装地址：
```
https://gitee.com/fieldlu/xy-script-assets/raw/main/小雅辅助工具%20.user.js
```

> 💡 安装后油猴自动检测更新，脚本每次升级你都能第一时间收到！

---

## 🎀 完整功能地图

```
小雅辅助工具 v3.4.6
│
├─ 🎬 启动画面 ─── 赛博朋克 HUD 动画（冷启动专属，刷新跳过）
│
├─ 📺 刷课引擎 ─── 全自动托管
│   ├─ 视频/文档智能连播，自动跳课
│   ├─ 智能跳转：同课程顺序跳、跨课程清完一门再下一门
│   ├─ 跳转失败指数退避（5s→10s→20s→40s→80s→10min）
│   └─ 雷达 API 缓存去重（3s TTL）+ 并发请求合并
│
├─ 💓 后台保活 ─── 永不掉线
│   ├─ 看门狗每 10s 巡检，心跳缺口超 75s 自动补发
│   ├─ 持久化定时器防浏览器节流（7 个关键定时器全部升级）
│   └─ 切前台自动补偿：实时计时 + 心跳包全部补齐
│
├─ ⏱️ 学时注入 ─── 紧急补救（高危面板）
│   ├─ 三重防护：面板默认折叠 + 二次确认弹窗 + 数字匹配验证
│   ├─ 并发锁：注入期间自动阻止心跳，防止双倍上报
│   ├─ 安全限制：300 分钟单次上限 + activeZone 校验
│   ├─ 实时进度条 + 随时中断 + 失败包自动跳过
│   └─ 控制台：xyInjectDuration(60) / xyStopInject() / xyKeepaliveStatus()
│
├─ 🕵️ 深度伪装 ─── 反检测
│   ├─ 鼠标轨迹模拟（贝塞尔曲线，随机速度）
│   ├─ 键盘随机敲击（Tab/方向键/空格）
│   ├─ 视界欺骗（滚动 jitter）
│   └─ 暴力音轨剥离（硬件静音注入）
│
├─ 📅 计划调度中心 ─── 跨课编排
│   ├─ 拖拽排序 + 每课独立策略
│   ├─ 三种模式：达标连播 / 刷固定时长 / 无限循环
│   └─ 定时启停（到达时间自动开始/停止并刷新）
│
├─ ⚡ 全局任务雷达 ─── 一键秒交
│   ├─ 扫描全网未完成任务（视频 + 文档分拣）
│   ├─ 秒级批量提交 + 智能跳过已完成
│   └─ 倒计时排序，优先处理临近截止任务
│
├─ 📥 课件下载 ─── v3.4.5 全面进化
│   ├─ 搜索框实时过滤 + 全选智能适配
│   ├─ 进度条可视化 + 绿紫渐变
│   ├─ 暂停/终止 + 已下载不丢失
│   └─ Token 鉴权 + 加密链接 DES 自动解密
│
├─ 💬 讨论区 ─── 自动化
│   ├─ 抓包批量点赞
│   ├─ 自定义回复模板
│   └─ DOM 智能扫描 + 搜索过滤
│
└─ 🎨 界面 ─── 赛博朋克二次元
    ├─ 紫/青/玫瑰三色霓虹配色
    ├─ 毛玻璃卡片 + HUD 四角装饰
    ├─ 紧凑可折叠面板 + 深/浅色自动切换
    └─ 情报站滚动公告 + 实时日志终端
```

---

## 🧪 开发测试

```bash
# 克隆仓库
git clone https://gitee.com/fieldlu/xy-script-assets.git

# 运行注入引擎独立测试
XY_GROUP_ID="12345" XY_RESOURCE_ID="67890" XY_TOKEN="t" \
  node inject-test.js 5 --dry --verbose

# 参数说明
#   5           → 注入 5 分钟
#   --dry       → 干跑模式（不发真实网络请求）
#   --verbose   → 打印每包详情
```

---

## 🔒 隐私与免责

### 我们承诺
- ❌ **不收集** 任何个人信息（账号、密码、手机号等）
- ❌ **不上传** 数据到第三方服务器
- ❌ **不使用** 统计埋点、广告 SDK
- ✅ 所有数据仅存浏览器本地（`GM_setValue` / `sessionStorage`）
- ✅ 网络请求仅用于与 `ai-augmented.com` 正常交互

### 风险告知
- ⚠️ 本脚本仅供**个人学习研究**使用
- ⚠️ 使用可能违反目标平台用户协议
- ⚠️ 作者不对账号异常、课程数据丢失等后果负责
- ⚠️ **严禁**代刷、代挂、售卖等商业用途

详见 [LICENSE](LICENSE) · [CHANGELOG](CHANGELOG.md)

---

<p align="center">
  <sub>Made with 💖 for 小雅平台 · 主人要好好加油哦～ (｡･ω･｡)ﾉ♡</sub>
</p>
