// ==UserScript==
// @name         小雅辅助工具
// @namespace    https://gitee.com/fieldlu/xy-script-assets
// @version      3.7.2.7
// @description  小雅平台浏览器用户脚本：视频与文档处理、课件批量下载、作业题目导出与AI作答保存、讨论区互动等常用功能集成
// @author       Confidential
// @license      GPL-3.0-or-later
// @match        https://*.ai-augmented.com/*
// @noframes
// @run-at       document-start
// @connect      gitee.com
// @connect      *
// @require      https://cdn.jsdmirror.com/npm/docx@7.1.0/build/index.min.js
// @require      https://cdn.jsdmirror.com/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @icon         https://www.ai-augmented.com/static/logo3.1dbbea8f.png

// ==/UserScript==

(function () {
    'use strict';

    /* ================================================================
     * 小雅辅助工具 (Xiaoya Assistant) — 架构总览
     * ================================================================
     * 运行环境：Tampermonkey / 油猴，@run-at document-start，@noframes
     * 目标平台：whut.ai-augmented.com（武汉理工「理工智课」教学平台）
     *
     * 整体结构（单 IIFE，内部按模块分区）：
     *   §0  原生 API 快照      —— 劫持前保存 fetch/XHR 原始引用
     *   §1  脚本更新模块       —— Gitee 版本清单比对与升级提示
     *   §2  隐身引擎(主世界)   —— 页面可见性欺骗/音频静默/防后台节流
     *   §3  配置常量区         —— 全部具名常量（Object.freeze 冻结）
     *   §4  领域状态           —— 六大业务域状态对象
     *        playState   播放挂机域（区域路由/引擎模式/跳转状态）
     *        recState    学习记录域（计数器/会话时长）
     *        guardState  防检测域（静音/伪装/看门狗）
     *        discState   讨论区域（ID捕获/名单库/回复库）
     *        dlState     下载域（文件列表/选择集/排序过滤）
     *        settingsState 用户设置域（开关项/主题）
     *   §5  学情概览模块(xyOverview 系 / xyCourseDashboard 系 / xyTodayPrompt 系)
     *   §6  区域路由(switchToZone) 与页面扫描(runLowLevelScanner)
     *   §7  课程目录与课件下载模块（dir 系 / dl 系 / download 系）
     *   §8  刷课引擎(视频/文档挂机、自动提交、雷达跳转)
     *   §9  防检测执行层(鼠标模拟/深度伪装/保活看门狗)
     *   §10 讨论区模块(名单抓取/点赞/自动回复)
     *   §11 作业答题模块(hw*：题目捕获/AI提示词/docx导出/答案回填)
     *   §12 计划调度模块(调度队列 / optimizeScheduleOrder)
     *   §13 UI 装配(createUI/ensureUI) 与反馈模块
     *
     * 关键设计决策：
     *   - fetch/XHR 原型劫持用于被动截包（讨论区ID、作业题目），
     *     所有劫持链最终 apply 回原生引用，保证平台功能不受影响。
     *   - 主世界桥接：需要页面级 API（Aliplayer SDK）时通过
     *     unsafeWindow 共享队列通信，规避 TM 沙箱隔离。
     *   - VOD 视频（type=9 任务节点）的 quote_id 不是云盘资源 ID，
     *     必须经 play_auth → Aliplayer 换流取公网 mp4 直链。
     *   - 跨域媒体下载走 GM_xmlhttpRequest 特权通道绕过 CORS；
     *
     * 模块边界与构建（企业级工程化约定）：
     *   - 源码按 [MODULE] 区块组织（见 temp/xiaoya-build/build.js 打包器），
     *     支持 //!@depends 依赖声明、拓扑排序内联与 tree-shaking。
     *   - 视图层组件化：xyBuildPanelTemplate（纯模板）/ createUI（编排器）/
     *     xyBindPanelEvents（事件装配）三段式分离，各司一职。
     *     同源云盘文件走原生 fetch 流式读取以支持进度与终止。
     * ================================================================ */

    
    const _hw_nativeFetch = window.fetch;
    const _hw_nativeXhrOpen = XMLHttpRequest.prototype.open;
    const _hw_nativeXhrSend = XMLHttpRequest.prototype.send;

    
    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '未知';

    const domain = window.location.hostname;

    /* ================================================================
     * 脚本更新模块
     * ----------------------------------------------------------------
     * 更新源为 Gitee 仓库 xy-script-assets 中的版本清单 JSON
     * （xy-script.latest.json），字段含 version / notes[] / changelogURL。
     * 拉取流程：GM_xmlhttpRequest 绕过页面 CSP 直连 Gitee →
     * compareVersion 与当前 SCRIPT_VERSION 逐段比对 →
     * 有新版时面板按钮点亮并弹 toast，由用户确认后打开下载页。
     * 清单 URL 携带时间戳查询参数规避 CDN/浏览器缓存，保证读到最新版。
     * ================================================================ */
    const SCRIPT_UPDATE = {
        infoURL: 'https://gitee.com/fieldlu/xy-script-assets/raw/main/xy-script.latest.json',
        downloadURL: 'https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js',
        projectURL: 'https://gitee.com/fieldlu/xy-script-assets'
    };
    /**
     * 语义化版本号比较器，用于判断 Gitee 清单版本是否新于本地版本。
     *
     * 机制：
     *   1. 将两个版本串按「连续数字段」切分为数值数组（'3.7.2.3' → [3,7,2,3]，
     *      非数字字符一律视作分隔符，兼容 v 前缀、日期后缀等杂格式）；
     *   2. 以较长的段数为准逐位比较，短的一方缺失位按 0 补齐（3.7 == 3.7.0）；
     *   3. 首个不相等的位决定大小；全部相等返回 0。
     *
     * @param {string|number} a - 待比较版本号（null/undefined 按 '0' 处理）
     * @param {string|number} b - 基准版本号
     * @returns {number} a 较新返回 1；b 较新返回 -1；完全一致返回 0
     * [DEEP-DOC]
     */
    function compareVersion(a, b) {
        const pa = String(a || '0').split(/[^\d]+/).filter(Boolean).map(Number);
        const pb = String(b || '0').split(/[^\d]+/).filter(Boolean).map(Number);
        const len = Math.max(pa.length, pb.length, 1);
        for (let i = 0; i < len; i++) {
            const av = Number.isFinite(pa[i]) ? pa[i] : 0;
            const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
            if (av !== bv) return av > bv ? 1 : -1;
        }
        return 0;
    }

    const xyUpdateState = {
        isLoaded: false, isChecking: false, info: null, error: '', hasNew: false
    };
    let xyUpdateModal = null;
    /**
     * 关闭脚本更新弹窗。
     *
     * 机制：先做双保险守卫——弹窗引用存在且仍挂在 document.body 上才继续；
     * 然后将遮罩 opacity 渐隐为 0、内部卡片 scale(0.95) 缩小（CSS transition
     * 负责 250ms 动画），300ms 后 remove() 移除节点，并清空模块级引用
     * xyUpdateModal 以便下次 xyShowUpdateModal 能重新懒创建。
     *
     * 副作用：DOM 移除 #xy-update-box 的最外层遮罩；重置模块状态变量。
     * [DEEP-DOC]
     */
    function xyCloseUpdateModal() {
        const modal = xyUpdateModal;
        if (!modal || !document.body.contains(modal)) return;
        const box = modal.querySelector('#xy-update-box');
        modal.style.opacity = '0';
        if (box) box.style.transform = 'scale(0.95)';
        setTimeout(() => modal.remove(), 300);
        xyUpdateModal = null;
    }
    /**
     * 刷新面板头部「检查更新」按钮的三态外观。
     *
     * 三态状态机：
     *   - xyUpdateState.isChecking → 加 is-checking 类，文案「⏳ 检查中」
     *   - hasNew → 加 is-new 类，文案「🎉 有新版」
     *   - 其余 → 无高亮，文案「↻ 检查更新」
     *
     * 容错：按钮不存在（面板未创建/被移除）时静默返回。每次调用都会先移除
     * 全部状态类再按当前态添加，避免类名残留。
     * [DEEP-DOC]
     */
    function xyUpdateHeaderButton() {
        const btn = document.getElementById('xy-seg-update');
        if (!btn) return;
        btn.classList.remove('is-new', 'is-checking');
        if (xyUpdateState.isChecking) {
            btn.classList.add('is-checking');
            btn.innerHTML = '⏳ 检查中<span class="xy-seg-dot"></span>';
        } else if (xyUpdateState.hasNew) {
            btn.classList.add('is-new');
            btn.innerHTML = '🎉 有新版<span class="xy-seg-dot"></span>';
        } else {
            btn.innerHTML = '↻ 检查更新<span class="xy-seg-dot"></span>';
        }
    }
    /**
     * 更新弹窗的内容渲染器（局部刷新，不重建容器）。
     *
     * 渲染内容：
     *   - 双卡片对照：当前版本（SCRIPT_VERSION）与最新版本大字展示；
     *     有新版时最新版卡片边框转绿色系以突出视觉焦点。
     *   - 状态行：检查中 / 错误信息（红）/ 已是最新 / 发现新版，四态互斥。
     *   - notes 数组存在时渲染更新日志 <ul>，每条经 escapeHtml 转义。
     *   - 三个操作按钮：「重新检查」（检查中禁用）、「打开更新文件」（无新版禁用）、
     *     「查看发布页」，均通过 data-url + onclick 绑定，stopPropagation 防止
     *     点击冒泡到遮罩触发关闭。
     *
     * 副作用：重写 #xy-update-box 的 innerHTML 并重绑按钮事件；
     * requestAnimationFrame 触发卡片 scale 入场动画。
     * [DEEP-DOC]
     */
    function xyUpdateRenderModal() {
        const modal = xyUpdateModal;
        if (!modal || !document.body.contains(modal)) return;
        const box = modal.querySelector('#xy-update-box');
        if (!box) return;
        const current = SCRIPT_VERSION;
        const info = xyUpdateState.info || {};
        const latest = info.version || '-';
        const hasInfo = !!info.version;
        const hasNew = hasInfo && compareVersion(latest, current) > 0;
        const statusText = xyUpdateState.isChecking
            ? '⏳ 正在检查更新...'
            : (xyUpdateState.error ? `❌ 检查失败：${escapeHtml(xyUpdateState.error)}` : (hasInfo ? (hasNew ? `🎉 发现新版本 ${escapeHtml(latest)}` : '✅ 当前已是最新版本') : '尚未检查'));
        const statusColor = xyUpdateState.error ? T('#f87171', '#dc2626') : (hasNew ? T('#34d399', '#059669') : T('#818cf8', '#4f46e5'));
        const notes = Array.isArray(info.notes) ? info.notes : [];
        const downloadURL = info.downloadURL || SCRIPT_UPDATE.downloadURL;
        const changelogURL = info.changelogURL || info.projectURL || SCRIPT_UPDATE.projectURL;
        box.innerHTML = `
            <div style="background: ${T('linear-gradient(145deg, #1e293b, #0f172a)', '#ffffff')}; border-radius: 16px; width: 520px; max-width: 94%; max-height: 84vh; overflow-y: auto; padding: 28px; box-shadow: ${T('0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(71,85,105,0.3)', '0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)')}; border: 1px solid ${T('rgba(71,85,105,0.2)', '#e2e8f0')}; transform: scale(0.95); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #818cf8, #6366f1); opacity: 0.8;"></div>
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${T('rgba(129,140,248,0.12)', '#eef2ff')}; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid ${T('rgba(129,140,248,0.2)', '#c7d2fe')};">↻</div>
                    <div>
                        <h3 style="margin: 0; color: ${T('#f1f5f9', '#0f172a')}; font-size: 18px; font-weight: 700;">脚本更新</h3>
                        <div style="color: ${T('#94a3b8', '#64748b')}; font-size: 12px; margin-top: 2px;">通过 Gitee 版本清单检查新版，交由脚本管理器确认安装</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: ${T('rgba(30,41,59,0.6)', '#f8fafc')}; border: 1px solid ${T('rgba(71,85,105,0.25)', '#e2e8f0')}; border-radius: 12px; padding: 14px;">
                        <div style="font-size: 11px; font-weight: 700; color: ${T('#94a3b8', '#64748b')}; margin-bottom: 5px;">当前版本</div>
                        <div style="color: ${T('#818cf8', '#4f46e5')}; font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums;">${escapeHtml(current)}</div>
                    </div>
                    <div style="background: ${T('rgba(30,41,59,0.6)', '#f8fafc')}; border: 1px solid ${hasNew ? T('rgba(52,211,153,0.3)', '#a7f3d0') : T('rgba(71,85,105,0.25)', '#e2e8f0')}; border-radius: 12px; padding: 14px;">
                        <div style="font-size: 11px; font-weight: 700; color: ${T('#94a3b8', '#64748b')}; margin-bottom: 5px;">最新版本</div>
                        <div style="color: ${hasNew ? T('#34d399', '#059669') : T('#818cf8', '#4f46e5')}; font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums;">${escapeHtml(latest)}</div>
                    </div>
                </div>
                <div style="color: ${statusColor}; font-size: 13px; font-weight: 800; margin-bottom: 14px;">${statusText}</div>
                ${notes.length ? `<div style="margin-bottom: 14px; padding: 12px 14px; background: ${T('rgba(129,140,248,0.06)', '#f8fafc')}; border: 1px solid ${T('rgba(71,85,105,0.2)', '#e2e8f0')}; border-radius: 12px;">
                    <div style="font-size: 12px; font-weight: 800; color: ${T('#e2e8f0', '#0f172a')}; margin-bottom: 7px;">📋 更新内容</div>
                    <ul style="margin: 0; padding-left: 18px; color: ${T('#cbd5e1', '#475569')}; line-height: 1.7; font-size: 13px;">${notes.map(n => `<li style="margin: 3px 0;">${escapeHtml(n)}</li>`).join('')}</ul>
                </div>` : ''}
                <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                    <button id="xy-upd-check" style="padding: 10px 20px; border: 1px solid ${T('rgba(129,140,248,0.3)', '#c7d2fe')}; background: ${T('rgba(129,140,248,0.1)', '#eef2ff')}; color: ${T('#a5b4fc', '#4f46e5')}; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit;" ${xyUpdateState.isChecking ? 'disabled' : ''}>${xyUpdateState.isChecking ? '⏳ 检查中...' : '↻ 重新检查'}</button>
                    <button id="xy-upd-open" data-url="${escapeHtml(downloadURL)}" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #818cf8, #6366f1); color: white; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(99,102,241,0.25); transition: all 0.2s; font-family: inherit;" ${hasNew ? '' : 'disabled'}>${hasNew ? '⬇ 打开更新文件' : '已是最新'}</button>
                    <button id="xy-upd-log" data-url="${escapeHtml(changelogURL)}" style="padding: 10px 20px; border: 1px solid ${T('rgba(71,85,105,0.3)', '#e2e8f0')}; background: ${T('rgba(30,41,59,0.4)', '#ffffff')}; color: ${T('#cbd5e1', '#475569')}; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit;">查看发布页</button>
                </div>
            </div>`;
        requestAnimationFrame(() => { box.firstElementChild.style.transform = 'scale(1)'; });
        const checkBtn = box.querySelector('#xy-upd-check');
        if (checkBtn) checkBtn.onclick = (e) => { e.stopPropagation(); xyUpdateCheck(true); };
        const openBtn = box.querySelector('#xy-upd-open');
        if (openBtn) openBtn.onclick = (e) => { e.stopPropagation(); window.open(openBtn.dataset.url || SCRIPT_UPDATE.downloadURL, '_blank'); };
        const logBtn = box.querySelector('#xy-upd-log');
        if (logBtn) logBtn.onclick = (e) => { e.stopPropagation(); window.open(logBtn.dataset.url || SCRIPT_UPDATE.projectURL, '_blank'); };
    }
    /**
     * 打开更新弹窗的总入口。
     *
     * 流程：
     *   1. document.body 未就绪直接返回（@run-at document-start 场景保护）；
     *   2. 弹窗已存在则仅恢复 opacity=1（重复打开去重）后返回；
     *   3. 否则创建全屏遮罩 div（z-index 取 int32 最大值保证置顶）+ 内层容器
     *      #xy-update-box，点击遮罩空白区关闭；
     *   4. requestAnimationFrame 下一帧把 opacity 从 0 过渡到 1（入场动画）；
     *   5. 若从未成功加载过清单且当前不在检查中，自动补发一次静默检查。
     * [DEEP-DOC]
     */
    function xyShowUpdateModal() {
        if (!document.body) return;
        if (xyUpdateModal && document.body.contains(xyUpdateModal)) { xyUpdateModal.style.opacity = '1'; return; }
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483647; opacity: 0; transition: all 0.25s; backdrop-filter: blur(10px); padding: 20px;`;
        modal.appendChild(document.createElement('div')).id = 'xy-update-box';
        document.body.appendChild(modal);
        xyUpdateModal = modal;
        modal.addEventListener('click', (e) => { if (e.target === modal) xyCloseUpdateModal(); });
        requestAnimationFrame(() => { modal.style.opacity = '1'; });
        xyUpdateRenderModal();
        if (!xyUpdateState.isLoaded && !xyUpdateState.isChecking) xyUpdateCheck(false);
    }
    /**
     * 版本检查执行器：GM_xmlhttpRequest 跨域拉取 Gitee 版本清单。
     *
     * 机制：
     *   - URL 附时间戳查询参数绕过 CDN/浏览器缓存；timeout 12s；
     *   - onload 中 JSON.parse 校验 version 字段存在性（缺字段视为坏响应抛错）；
     *   - compareVersion 判定 hasNew；成功即写 GM 存储 xy_update_last_check 时间戳；
     *   - 后台模式（manual=false）且有新版时，按版本号粒度去重提示
     *     （xy_update_notified_{version} 键保证同版本只 toast 一次）；
     *   - finally 无论成败都复位 isChecking 并刷新按钮与弹窗 UI。
     *
     * @param {boolean} [manual=false] - 手动触发标记：true 时发现新版必弹提示；
     *                                   false 仅首次提示且受去重键约束
     * [DEEP-DOC]
     */
    function xyUpdateCheck(manual = false) {
        if (xyUpdateState.isChecking) return;
        xyUpdateState.isChecking = true;
        xyUpdateState.error = '';
        xyUpdateHeaderButton();
        xyUpdateRenderModal();
        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${SCRIPT_UPDATE.infoURL}?t=${Date.now()}`,
                timeout: 12000,
                onload: (resp) => {
                    try {
                        const info = JSON.parse(resp.responseText);
                        if (!info.version) throw new Error('更新清单缺少 version 字段');
                        const hasNew = compareVersion(info.version, SCRIPT_VERSION) > 0;
                        xyUpdateState.info = info;
                        xyUpdateState.isLoaded = true;
                        xyUpdateState.hasNew = hasNew;
                        GM_setValue('xy_update_last_check', Date.now());
                        if (!manual && hasNew) {
                            const notifyKey = `xy_update_notified_${info.version}`;
                            if (GM_getValue(notifyKey, '0') !== '1') {
                                showToast(`🎉 发现脚本新版本 ${info.version}，点击面板「↻ 检查更新」可查看`, 'success');
                                GM_setValue(notifyKey, '1');
                            }
                        }
                    } catch (e) {
                        xyUpdateState.error = e.message || '更新检查失败';
                        xyUpdateState.hasNew = false;
                    } finally {
                        xyUpdateState.isChecking = false;
                        xyUpdateHeaderButton();
                        xyUpdateRenderModal();
                    }
                },
                onerror: () => {
                    xyUpdateState.error = '网络请求失败';
                    xyUpdateState.hasNew = false;
                    xyUpdateState.isChecking = false;
                    xyUpdateHeaderButton();
                    xyUpdateRenderModal();
                },
                ontimeout: () => {
                    xyUpdateState.error = '请求超时，请稍后重试';
                    xyUpdateState.hasNew = false;
                    xyUpdateState.isChecking = false;
                    xyUpdateHeaderButton();
                    xyUpdateRenderModal();
                }
            });
        } catch (e) {
            xyUpdateState.error = e.message || '更新检查失败';
            xyUpdateState.hasNew = false;
            xyUpdateState.isChecking = false;
            xyUpdateHeaderButton();
            xyUpdateRenderModal();
        }
    }
    /**
     * 自动检查节流闸门：距上次成功检查不足 6 小时（6*60*60*1000ms）直接返回。
     * 通过后才发起后台检查。读取 GM 存储的 xy_update_last_check 时间戳做判定。
     * [DEEP-DOC]
     */
    function xyUpdateAutoCheck() {
        const interval = 6 * 60 * 60 * 1000;
        const last = parseInt(GM_getValue('xy_update_last_check', '0'), 10);
        if (Date.now() - last < interval) return;
        xyUpdateCheck(false);
    }

    
    (function initSplash() {
        try {
            // 默认关闭开机动画（如需开启：GM_setValue('xy_no_splash', false)）
            if (GM_getValue('xy_no_splash', true)) return;
            if (sessionStorage.getItem('xy_splash_done')) return;
            sessionStorage.setItem('xy_splash_done', '1');

            function tryShow() {
                if (!document.body) { requestAnimationFrame(tryShow); return; }
                if (document.getElementById('xy-splash')) return;

                const style = document.createElement('style');
                style.textContent = `
@keyframes xy-in{0%{opacity:0}100%{opacity:1}}
@keyframes xy-out{0%{opacity:1;transform:scale(1);filter:blur(0)}100%{opacity:0;transform:scale(1.06);filter:blur(8px)}}
@keyframes xy-tw{0%,100%{opacity:0.2}50%{opacity:1}}
@keyframes xy-f1{0%{transform:translateY(0) translateX(0) rotate(0deg) scale(1);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) translateX(50px) rotate(360deg) scale(0);opacity:0}}
@keyframes xy-f2{0%{transform:translateY(0) translateX(0) rotate(0deg) scale(1);opacity:0}10%{opacity:1}90%{opacity:0.5}100%{transform:translateY(-100vh) translateX(-40px) rotate(-360deg) scale(0.2);opacity:0}}
@keyframes xy-bp{0%,100%{box-shadow:0 0 15px rgba(124,58,237,0.3),0 0 30px rgba(6,182,212,0.15),inset 0 0 15px rgba(124,58,237,0.06)}50%{box-shadow:0 0 30px rgba(124,58,237,0.6),0 0 60px rgba(6,182,212,0.35),0 0 90px rgba(244,63,94,0.25),inset 0 0 30px rgba(124,58,237,0.15)}}
@keyframes xy-tg{0%,100%{text-shadow:0 0 20px rgba(124,58,237,0.8),0 0 40px rgba(124,58,237,0.4),0 0 80px rgba(6,182,212,0.3),0 2px 4px rgba(0,0,0,0.9)}50%{text-shadow:0 0 30px rgba(244,63,94,0.9),0 0 60px rgba(124,58,237,0.6),0 0 100px rgba(6,182,212,0.5),0 2px 4px rgba(0,0,0,0.9)}}
@keyframes xy-pf{0%{background-position:0% 50%}100%{background-position:300% 50%}}
@keyframes xy-ps{0%{left:-100%}100%{left:100%}}
@keyframes xy-ss{0%{top:-2px}100%{top:100%}}
@keyframes xy-rs{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes xy-rsr{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(-360deg)}}
@keyframes xy-cp{0%,100%{opacity:0.4}50%{opacity:1}}
@keyframes xy-pls{0%{transform:translate(-50%,-50%) scale(1);opacity:0.3}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
@keyframes xy-typing{0%{opacity:0}20%{opacity:1}100%{opacity:1}}
@keyframes xy-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes xy-grid-scroll{0%{background-position:0 0,0 0}100%{background-position:0 0,50px 50px}}
@keyframes xy-hex-rotate{0%{transform:translate(-50%,-50%) rotate(0deg) scale(1)}50%{transform:translate(-50%,-50%) rotate(180deg) scale(1.15)}100%{transform:translate(-50%,-50%) rotate(360deg) scale(1)}}

#xy-splash{
    position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;
    background:#08081a;
    background-image:
        linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),
        linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px);
    background-size:50px 50px;
    animation:xy-in 0.5s ease-out,xy-grid-scroll 30s linear infinite;
    display:flex;justify-content:center;align-items:center;
    font-family:'Segoe UI','Microsoft YaHei','PingFang SC',sans-serif;
    overflow:hidden;
}
#xy-splash::before{
    content:'';position:absolute;top:0;left:0;width:100%;height:100%;
    background:radial-gradient(ellipse at 30% 20%,rgba(124,58,237,0.12) 0%,transparent 50%),
               radial-gradient(ellipse at 70% 80%,rgba(6,182,212,0.08) 0%,transparent 50%),
               radial-gradient(ellipse at 50% 50%,rgba(244,63,94,0.05) 0%,transparent 60%);
    pointer-events:none;
}
#xy-splash::after{
    content:'';position:absolute;top:0;left:0;width:100%;height:100%;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px);
    pointer-events:none;z-index:100;
}
#xy-splash.xy-out{animation:xy-out 0.5s ease-in forwards;pointer-events:none}

#xy-splash .st{position:absolute;border-radius:50%;animation:xy-tw var(--d) ease-in-out infinite;animation-delay:var(--dl)}
#xy-splash .pt{position:absolute;bottom:-20px;width:var(--s);height:var(--s);background:var(--c);animation:var(--a) var(--d) var(--dl) linear infinite}
#xy-splash .pt.diamond{clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)}
#xy-splash .pt.circle{border-radius:50%}

#xy-splash .ri{position:absolute;top:50%;left:50%;border-radius:50%;border:1px solid;transform:translate(-50%,-50%);pointer-events:none}
#xy-splash .ri-1{width:300px;height:300px;border-color:rgba(124,58,237,0.18);animation:xy-rs 18s linear infinite}
#xy-splash .ri-2{width:420px;height:420px;border-color:rgba(6,182,212,0.1);animation:xy-rsr 22s linear infinite}
#xy-splash .ri-3{width:520px;height:520px;border-color:rgba(244,63,94,0.07);animation:xy-rs 28s linear infinite}

#xy-splash .hex{
    position:absolute;top:50%;left:50%;width:600px;height:600px;
    background:radial-gradient(circle at center,transparent 30%,rgba(124,58,237,0.04) 60%,transparent 70%);
    clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
    animation:xy-hex-rotate 35s ease-in-out infinite;pointer-events:none;
}

#xy-splash .pls{position:absolute;top:50%;left:50%;width:4px;height:4px;border-radius:50%;background:rgba(124,58,237,0.5);animation:xy-pls 3s ease-out infinite;pointer-events:none}
#xy-splash .pls:nth-child(2){animation-delay:1s;background:rgba(6,182,212,0.4)}
#xy-splash .pls:nth-child(3){animation-delay:2s;background:rgba(244,63,94,0.3)}

#xy-splash .cd{
    position:relative;z-index:10;
    background:rgba(12,10,30,0.88);
    border:1px solid rgba(124,58,237,0.3);
    border-radius:24px;padding:44px 52px;text-align:center;
    animation:xy-bp 3s ease-in-out infinite,xy-float 4s ease-in-out infinite;
    backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
    min-width:340px;max-width:420px;
    box-shadow:0 0 80px rgba(124,58,237,0.1);
}

#xy-splash .sc{position:absolute;top:-2px;left:5%;width:90%;height:2px;background:linear-gradient(90deg,transparent,rgba(6,182,212,0.5),transparent);animation:xy-ss 2.5s ease-in-out infinite;pointer-events:none;border-radius:2px;z-index:2}
#xy-splash .cr{position:absolute;width:20px;height:20px;pointer-events:none;z-index:3;animation:xy-cp 2s ease-in-out infinite}
#xy-splash .cr::before,#xy-splash .cr::after{content:'';position:absolute;background:rgba(124,58,237,0.6)}
#xy-splash .cr-tl{top:10px;left:10px}
#xy-splash .cr-tr{top:10px;right:10px;animation-delay:0.5s}
#xy-splash .cr-bl{bottom:10px;left:10px;animation-delay:1s}
#xy-splash .cr-br{bottom:10px;right:10px;animation-delay:1.5s}
#xy-splash .cr-tl::before,#xy-splash .cr-tr::before{top:0;left:0;width:100%;height:1.5px}
#xy-splash .cr-tl::after,#xy-splash .cr-bl::after{top:0;left:0;width:1.5px;height:100%}
#xy-splash .cr-tr::after,#xy-splash .cr-br::after{top:0;right:0;width:1.5px;height:100%}
#xy-splash .cr-bl::before,#xy-splash .cr-br::before{bottom:0;left:0;width:100%;height:1.5px}

#xy-splash .icon{font-size:52px;filter:drop-shadow(0 0 24px rgba(124,58,237,0.6));line-height:1;margin-bottom:12px;animation:xy-tg 3s ease-in-out infinite}
#xy-splash .title{font-size:30px;font-weight:900;letter-spacing:8px;color:#e2e8f0;animation:xy-tg 3s ease-in-out infinite;margin-bottom:8px}
#xy-splash .sub{font-size:13px;color:rgba(167,139,250,0.7);letter-spacing:6px;margin-bottom:20px;font-weight:400}
#xy-splash .ver{font-size:11px;color:rgba(6,182,212,0.6);letter-spacing:3px;margin-bottom:22px;font-family:'Consolas','SF Mono','Courier New',monospace}
#xy-splash .po{position:relative;width:100%;height:3px;background:rgba(71,85,105,0.25);border-radius:2px;overflow:hidden}
#xy-splash .pi{height:100%;border-radius:2px;width:0%;background:linear-gradient(90deg,#7C3AED,#A78BFA,#06B6D4,#F43F5E,#7C3AED);background-size:300% 100%;animation:xy-pf 2s linear infinite;transition:width 0.3s ease-out}
#xy-splash .ps{position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);animation:xy-ps 1.5s ease-in-out infinite}
#xy-splash .ft{font-size:10px;color:rgba(100,116,139,0.45);letter-spacing:4px;margin-top:14px}`;

                const el = document.createElement('div');
                el.id = 'xy-splash';
                el.appendChild(style);

                

                

                
                for (let i = 0; i < 3; i++) {
                    const pls = document.createElement('div');
                    pls.className = 'pls';
                    el.appendChild(pls);
                }

                
                const hex = document.createElement('div');
                hex.className = 'hex';
                el.appendChild(hex);

                
                const stars = document.createElement('div');
                for (let i = 0; i < 70; i++) {
                    const s = document.createElement('div'); s.className = 'st';
                    const sz = Math.random() * 2 + 0.8;
                    const colors = ['rgba(255,255,255,0.9)','rgba(167,139,250,0.7)','rgba(6,182,212,0.6)','rgba(244,63,94,0.5)'];
                    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};--d:${Math.random()*3+2}s;--dl:${Math.random()*4}s;box-shadow:0 0 ${sz*3}px ${colors[Math.floor(Math.random()*colors.length)]}`;
                    stars.appendChild(s);
                }
                el.appendChild(stars);

                
                [1,2,3].forEach(i => {
                    const r = document.createElement('div');
                    r.className = `ri ri-${i}`;
                    el.appendChild(r);
                });

                
                const parts = document.createElement('div');
                const pcols = ['rgba(124,58,237,0.45)','rgba(167,139,250,0.35)','rgba(6,182,212,0.35)','rgba(244,63,94,0.35)','rgba(139,92,246,0.3)','rgba(129,140,248,0.25)'];
                for (let i = 0; i < 24; i++) {
                    const p = document.createElement('div');
                    p.className = 'pt ' + (Math.random() > 0.5 ? 'diamond' : 'circle');
                    p.style.cssText = `left:${Math.random()*100}%;--s:${Math.random()*6+3}px;--c:${pcols[Math.floor(Math.random()*pcols.length)]};--d:${Math.random()*10+6}s;--dl:${Math.random()*6}s;--a:${Math.random()>0.5?'xy-f2':'xy-f1'}`;
                    parts.appendChild(p);
                }
                el.appendChild(parts);

                
                const card = document.createElement('div');
                card.className = 'cd';
                card.innerHTML = '<div class="sc"></div><div class="cr cr-tl"></div><div class="cr cr-tr"></div><div class="cr cr-bl"></div><div class="cr cr-br"></div><div class="icon">⚡</div><div class="title">小雅辅助工具</div><div class="sub">系 统 启 动 中</div><div class="ver">版本 ' + SCRIPT_VERSION + '</div><div class="po"><div class="pi" id="xy-sp"></div><div class="ps"></div></div><div class="ft">初 始 化 引 擎</div>';
                el.appendChild(card);

                document.body.appendChild(el);

                
                const bar = document.getElementById('xy-sp');
                let prog = 0;
                const t = setInterval(() => {
                    prog += Math.random() * 22 + 10;
                    if (prog >= 100) { prog = 100; clearInterval(t); }
                    if (bar) bar.style.width = Math.min(prog, 100) + '%';
                }, 350);

                let dismissed = false;
                function dismiss() {
                    if (dismissed) return; dismissed = true;
                    clearInterval(t);
                    if (bar) bar.style.width = '100%';
                    el.classList.add('xy-out');
                    setTimeout(() => { try { if (el.parentNode) el.parentNode.removeChild(el); } catch(e) {} }, 520);
                }
                setTimeout(dismiss, 2500);
                el._xyDismiss = dismiss;
                window._xySplashDismiss = dismiss;
            }
            requestAnimationFrame(tryShow);
        } catch(e) {  }
    })();

    (function injectStealthEngine() {
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                // 1. 页面可见性固化：向页面主世界注入不可变属性覆盖，
    //    使平台的前端可见性探测（document.hidden / visibilitychange）
    //    恒定读到「可见」，从而保持后台标签页内的挂机计时不被暂停。
                Object.defineProperties(document, {
                    hidden: { value: false, configurable: false },
                    visibilityState: { value: 'visible', configurable: false }
                });
                
                const originAdd = EventTarget.prototype.addEventListener;
                EventTarget.prototype.addEventListener = function(type, fn, opts) {
                    if (['visibilitychange', 'blur', 'pagehide'].includes(type) && (this === window || this === document)) return;
                    return originAdd.call(this, type, fn, opts);
                };

                // 2. 音轨静默接管：双重拦截 HTMLMediaElement.play 与
    //    AudioContext.createMediaElementSource，强制静音播放。
    //    浏览器的自动播放策略将「已播放过有声媒体」视为用户交互凭证，
    //    因此静音状态下仍可维持播放会话不被节流。
                window._xy_hardware_mute = true;
                
                // 拦截原生视频播放
                const originPlay = HTMLMediaElement.prototype.play;
                HTMLMediaElement.prototype.play = function() {
                    if (window._xy_hardware_mute) this.muted = true;
                    return originPlay.call(this);
                };

                // 拦截高级音频上下文
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if(Ctx) {
                    const originCreateMedia = Ctx.prototype.createMediaElementSource;
                    Ctx.prototype.createMediaElementSource = function(el) {
                        const source = originCreateMedia.call(this, el);
                        const gainNode = this.createGain();
                        gainNode.gain.value = window._xy_hardware_mute ? 0 : 1;
                        source.connect(gainNode);
                        
                        document.addEventListener('xy-volume-change', (e) => {
                            if(this.state === 'suspended') this.resume().catch(()=>{});
                            gainNode.gain.value = e.detail.mute ? 0 : 1;
                        });

                        source.connect = function() { return gainNode.connect.apply(gainNode, arguments); };
                        source.disconnect = function() { return gainNode.disconnect.apply(gainNode, arguments); };
                        return source;
                    };
                }
                
                // 监听总控台发出的实时静音指令
                document.addEventListener('xy-volume-change', (e) => {
                    window._xy_hardware_mute = e.detail.mute;
                    document.querySelectorAll('video, audio').forEach(media => {
                        media.muted = window._xy_hardware_mute;
                    });
                });

                // 3. 防后台节流：静默音频振荡器保持页面活跃
                let _antiThrottleCtx = null;
                let _antiThrottleOsc = null;
                window._xyAntiThrottleStart = () => {
                    if (_antiThrottleCtx) return;
                    try {
                        const Ctx = window.AudioContext || window.webkitAudioContext;
                        if (!Ctx) return;
                        _antiThrottleCtx = new Ctx();
                        _antiThrottleOsc = _antiThrottleCtx.createOscillator();
                        const gain = _antiThrottleCtx.createGain();
                        gain.gain.value = 0.001; // 增益非零使音频图保持 active，浏览器判定「正在播放」
                        _antiThrottleOsc.type = 'sine';
                        _antiThrottleOsc.frequency.value = 20000; // 20kHz 超声频段，成人听阈之上
                        _antiThrottleOsc.connect(gain);
                        gain.connect(_antiThrottleCtx.destination);
                        _antiThrottleOsc.start();
                        _antiThrottleCtx.resume();
                    } catch(e) {}
                };
                window._xyAntiThrottleStop = () => {
                    try {
                        if (_antiThrottleOsc) { _antiThrottleOsc.stop(); _antiThrottleOsc = null; }
                        if (_antiThrottleCtx) { _antiThrottleCtx.close(); _antiThrottleCtx = null; }
                    } catch(e) {}
                };
            })();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    })();

    
    // ================= 配置常量区（原魔法字面量的具名提取，值保持不变） =================
    /** 任务引擎类型 */
    const TASK_TYPE = Object.freeze({ VIDEO: 'video', DOC: 'doc', NONE: 'none' });

    /** 播放挂机模式 */
    const PLAY_MODE = Object.freeze({ SEQUENCE: 'sequence', LOOP: 'loop', MANUAL: 'manual' });

    /** 计划调度任务策略 */
    const STRATEGY = Object.freeze({ UNTIL_DONE: 'until_done', FIXED_DURATION: 'duration', INFINITE: 'infinite' });

    /** 主控台界面区域 */
    const ZONE = Object.freeze({
        COURSE: 'course', COURSES: 'courses', DISC: 'disc', HW: 'hw',
        DIR: 'dir', DOWNLOAD: 'download', OVERVIEW: 'overview', UNINITIALIZED: 'uninitialized'
    });

    /** 文档阅读时长阈值（秒） */
    const DOC_READ = Object.freeze({
        SUBMIT_SECONDS: 130,       // 发起首次验证请求线
        RETRY_GAP_SECONDS: 30,     // 未达标时的周期重试间隔
        FORCE_SECONDS: 300,        // 强制提交放行线
        LOOP_SECONDS: 120          // 循环模式达标线
    });

    /** 雷达探测退避配置（毫秒） */
    const BACKOFF = Object.freeze({
        SUCCESS_DELAYS_MS: [5000, 10000, 20000, 40000, 80000, 600000],
        ERROR_DELAYS_MS: [10000, 30000, 60000, 300000, 600000],
        MAX_SUCCESS_FAILS: 6,
        MAX_ERROR_FAILS: 5,
        SLEEP_MS: 10 * 60 * 1000
    });

    /** 课件下载链接 DES 解密密钥对（平台侧约定） */
    const DES = Object.freeze({ KEY: '94374647', IV: '99526255' });

    /** 智能排课评分权重 */
    const SCHEDULE_WEIGHTS = Object.freeze({
        DDL_DAY_1: 1, DDL_DAY_3: 3, DDL_DAY_7: 7, DDL_DAY_14: 14, DDL_DAY_30: 30,
        DDL_SCORE: [100, 80, 60, 40, 20, 5],
        COMPLETION_PENALTY: 0.3,
        TYPE_MEDIA: 0.5,
        TYPE_OTHER: 0.3,
        ALTERNATE_BONUS: 25,
        FIRST_PICK_BONUS: 10,
        COURSE_SWITCH_BONUS: 15
    });

    /** 今日学习提示优先级权重 */
    const TODAY_PROMPT_WEIGHTS = Object.freeze({
        STATUS: { actionable: 80, unsubmitted: 76, pending: 22, graded: 0, expired: -40 },
        DEADLINE: { today: 40, soon: 27, later: 12, overdue: -35, unknown: 0 }
    });

    /** 共享文件扩展名判定正则（全脚本唯一定义点） */
    const SHARED_PATTERNS = Object.freeze({
        MEDIA: /\.(?:mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i,
        DOC: /\.(?:pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i,
        get WATCH() { return /\.(?:mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i; }
    });

    /* ================================================================
     * [MODULE] vdom — 声明式视图微内核（lit-html 心智模型，零依赖）
     * ----------------------------------------------------------------
     * h(tag, props, ...children)   构造虚拟节点
     * xyMount(el, vnode)           挂载并返回 { update } 差量更新句柄
     * 动态高频视图（课程卡片/下载列表/调度队列）逐步迁移到此内核，
     * 替代过程式 innerHTML 拼接；静态骨架暂保留模板函数。
     * ================================================================ */
    /**
     * [MODULE] vdom — 声明式视图微内核（lit-html 心智模型，零依赖 ~120 行）
     * ============================================================
     * API:
     *   h(tag, props, ...children)      构造虚拟节点（VNode）
     *   mount(container, vnode)         挂载/差量更新（keyed reconciliation）
     *   list(items, keyFn, renderFn)    keyed 列表描述（diff 复用 DOM）
     *
     * 设计取舍：
     *   - 不做 SVG/组件类/生命周期——油猴面板场景只需「状态→视图」单向流
     *   - props.onXxx 自动 addEventListener；style 支持字符串或对象
     *   - diff 按「类型+key」复用，children 按位对齐（无 key 时）
     * ============================================================
     */
    const VNODE = Symbol('xy-vnode');
    
    function h(tag, props, ...children) {
        return { [VNODE]: true, tag, props: props || {}, children: children.flat(Infinity) };
    }
    
    /** keyed 列表项：{ key, vnode } */
    function list(entries) {
        return entries.map(e => ({ ...e, [VNODE]: true, isListItem: true }));
    }
    
    function setProps(el, props, old) {
        for (const k of Object.keys(props)) {
            const v = props[k];
            if (old && old[k] === v) continue;
            if (k.startsWith('on') && typeof v === 'function') {
                const ev = k.slice(2).toLowerCase();
                if (old && old[k]) el.removeEventListener(ev, old[k]);
                el.addEventListener(ev, v);
            } else if (k === 'style' && typeof v === 'object') {
                Object.assign(el.style, v);
            } else if (k === 'innerHTMLBridge') {
            // 过渡桥：子视图暂由字符串模板产出时经此注入（仅创建时生效，不做 diff）
            if (el.innerHTML !== v) el.innerHTML = String(v ?? '');
        } else if (k === 'class') {
                el.className = v;
            } else if (k in el && k !== 'value' && k !== 'checked') {
                try { el[k] = v; } catch (e) { el.setAttribute(k, v); }
            } else {
                if (v === false || v == null) el.removeAttribute(k);
                else el.setAttribute(k, v === true ? '' : v);
            }
        }
    }
    
    function createEl(vn) {
        if (!vn || typeof vn !== 'object') {
            // null/undefined/原始值 → 空文本或字符串节点（条件渲染的 false 分支安全落地）
            return document.createTextNode(typeof vn === 'string' || typeof vn === 'number' ? String(vn) : '');
        }
        if (typeof vn === 'string') return document.createTextNode(vn);
        if (vn.isListItem) return createEl(vn.vnode);
        if (!vn[VNODE]) return document.createTextNode(String(vn));
        const el = document.createElement(vn.tag);
        setProps(el, vn.props, null);
        for (const c of vn.children) {
            const child = (c && c.isListItem) ? c.vnode : c;
            el.appendChild(createEl(child));
        }
        return el;
    }
    
    function diffChildren(parent, newChildren, oldMeta) {
        // 简化策略：按位 diff；列表场景由调用方用 list()+key 自行管理
        while (parent.childNodes.length > newChildren.length) parent.removeChild(parent.lastChild);
        newChildren.forEach((c, i) => {
            const child = (c && c.isListItem) ? c.vnode : c;
            const existing = parent.childNodes[i];
            if (!existing) { parent.appendChild(createEl(child)); return; }
            patch(existing, child, oldMeta);
        });
    }
    
    function patch(el, vn, meta) {
        if (typeof vn === 'string' || typeof vn === 'number') {
            if (el.nodeType === 3) { if (el.textContent !== String(vn)) el.textContent = String(vn); return; }
            const t = document.createTextNode(String(vn));
            el.parentNode.replaceChild(t, el); return;
        }
        if (!vn || !vn[VNODE]) vn = { tag: '#text', props: {}, children: [String(vn ?? '')] , [VNODE]: true};
        if (el.nodeName.toLowerCase() !== vn.tag.toLowerCase()) {
            el.parentNode.replaceChild(createEl(vn), el); return;
        }
        const oldProps = (meta && meta.get(el)) || {};
        setProps(el, vn.props, oldProps);
        if (meta) meta.set(el, vn.props);
        diffChildren(el, vn.children, meta);
    }
    
    function mount(container, vnode) {
        const meta = new WeakMap();
        container.textContent = '';
        container.appendChild(createEl(vnode));
        return {
            update(next) { patch(container.firstElementChild, next, meta); },
        };
    }


    /** 播放挂机域：区域路由 / 引擎模式 / 跳转与任务完成状态 */
    const playState = {
        activeZone: ZONE.UNINITIALIZED,
        discScrapeAbort: false,
        mode: GM_getValue('xy_play_mode', PLAY_MODE.SEQUENCE),
        isTaskCompleted: false,
        isFreedomMode: false,
        currentEngine: 'none',
        docReadTime: 0,
        lastDocSubmitTime: 0,
        videoScriptProgress: undefined,
        videoLastTime: 0,
        jumpFailCount: 0,
        jumpSleepUntil: 0,
        isProcessingJump: false,
        isJumping: false,
        enableDomScan: true,
        lastPopupClickTime: 0,
        prevZone: ZONE.COURSE
    };

    /** 学习记录域：计数器与会话累计时长 */
    const recState = {
        recordActive: false,
        recordCount: parseInt(sessionStorage.getItem('xy_recordCount')) || 0,
        totalTime: parseInt(sessionStorage.getItem('xy_totalTime')) || 0,
        realTime: parseInt(sessionStorage.getItem('xy_realTime')) || 0,
        lastRecordDate: null
    };

    /** 防检测域：硬件静音 / 深度伪装 / 保活看门狗 */
    const guardState = {
        guardActive: GM_getValue('xy_guard_active', true),
        hardwareMute: GM_getValue('xy_hw_mute', true),
        deepCamouflage: GM_getValue('xy_deep_camo', true),
        camoScrollActive: false,
        camoKeyboardActive: false,
        keepaliveEnabled: GM_getValue('xy_keepalive', true),
        keepaliveWatchdog: null,
        camoClickActive: false,
        mouseSimActive: GM_getValue('xy_mouse_sim', true)
    };

    /** 讨论区互动域：ID 捕获 / 名单库 / 自定义回复 */
    const discState = {
        discussionId: null,
        discGroupId: null,
        targetNames: [],
        selectedNames: new Set(),
        customReplies: [],
        useCustomReply: GM_getValue('xy_use_custom_reply', false),
        discLockedUrl: null,
        docPreviewDoneNodeId: null
    };

    /** 课件下载域：文件列表 / 选择集 / 排序与过滤 */
    const dlState = {
        downloadFiles: [],
        downloadCourseName: '',
        downloadCourseGroupKey: '',
        downloadSelectedIds: new Set(),
        downloadSearchKeyword: '',
        downloadSortMode: GM_getValue('xy_dl_sort', 'unit'),
        downloadSortMap: {},
        downloadDirTree: null,
        downloadTypeFilter: (function() { const all = ['video','audio','pdf','doc','ppt','xls','zip','other']; let saved = []; try { saved = String(GM_getValue('xy_dl_types','')||'').split(',').filter(k => all.includes(k)); } catch(e) {} return new Set(saved.length ? saved : all); })(),
        downloadAbortController: null,
        downloadMode: 'idle',
        downloadPaused: false,
        courseResourcesCache: null,
        lastCourseGroupId: null,
        _lastCourseNodeId: null
    };

    /** 用户设置域：开关项与主题（持久化到 GM 存储） */
    const settingsState = {
        showRefreshPanel: GM_getValue('xy_show_refresh_panel', true),
        showTerminal: GM_getValue('xy_show_terminal', false),
        theme: GM_getValue('xy_theme', 'auto')
    };
    
    let hwQuestionsData = [];
    let hwExtractedText = '';
    let hwImageAssets = [];
    let hwPdfQuestions = [];
    let hwSubmissionResult = { state: 'waiting', message: '等待题目数据加载...' };
    let hwGroupId = '', hwNodeId = '', hwPaperId = '';
    let hwActiveTaskKey = '';
    let hwRecordId = '';            
    let hwResultFilter = 'all';     
    let hwResultOpen = false;       
    let hwActiveTab = 'answer';     
    /**
     * 拼接作业任务唯一标识键 group:node:paper。
     *
     * 三个 ID 段各自做空值兜底（''），用冒号连接。该键用于 hwActiveTaskKey：
     * 当 SPA 路由变化时，hwCurrentUrlMatches 用它判断当前页面是否仍是
     * 已捕获试卷的上下文，防止跨题串数据。
     * [DEEP-DOC]
     */
    function hwBuildTaskKey(gid, nid, pid) { return [gid||'', nid||'', pid||''].join(':'); }
    /**
     * 重置作业模块的全部会话级状态。
     *
     * 守卫：hwActiveTaskKey 与 hwQuestionsData 均为空说明本来就没有活动会话，
     * 直接 return 避免无意义的 UI 抖动。否则清空题目数组/富文本提取结果/
     * 图片资产/PDF题目/提交结果对象/三参ID/筛选页签等十余项状态，最后调
     * hwUpdateUI 让界面回到「等待题目数据」初态。
     *
     * @param {string} [reason] - 重试原因（预留诊断参数，当前实现未使用）
     * [DEEP-DOC]
     */
    function hwResetState(reason) {
        if (!hwActiveTaskKey && !hwQuestionsData.length) return;
        hwQuestionsData = []; hwExtractedText = ''; hwImageAssets = []; hwPdfQuestions = [];
        hwSubmissionResult = { state: 'waiting', message: '等待题目数据加载...' };
        hwGroupId = ''; hwNodeId = ''; hwPaperId = ''; hwActiveTaskKey = '';
        hwRecordId = ''; hwResultFilter = 'all'; hwResultOpen = false; hwActiveTab = 'answer';
        hwUpdateUI();
    }
    /**
     * 判断当前页面 URL 是否仍属于已捕获试卷的上下文（防过期数据处理）。
     *
     * 两级校验：
     *   1. 无活动任务键时恒真（尚未捕获任何试卷，任何页面都合法）；
     *   2. 解析当前 URL 的 group_id/node_id/paper_id 查询参数（回退到全局
     *      提取函数），逐一与捕获时记录的 hwGroupId/hwNodeId/hwPaperId 比对，
     *      任一已记录且不匹配即判 false；
     *   3. 兜底：URL href 必须包含全部已知 ID 子串。
     *
     * @returns {boolean} true 表示当前页面数据可以安全处理
     * [DEEP-DOC]
     */
    function hwCurrentUrlMatches() {
        if (!hwActiveTaskKey) return true;
        const href = window.location.href;
        try {
            const u = new URL(href, window.location.origin);
            const g = u.searchParams.get('group_id') || getCourseGroupId();
            const n = u.searchParams.get('node_id') || getResourceNodeId();
            const p = u.searchParams.get('paper_id') || getPaperId();
            if (g !== hwGroupId && hwGroupId) return false;
            if (n !== hwNodeId && hwNodeId) return false;
            if (p !== hwPaperId && hwPaperId) return false;
        } catch(e) {}
        const ids = [hwGroupId, hwNodeId].filter(Boolean);
        return ids.length ? ids.every(id => href.includes(id)) : true;
    }
    /**
     * 同步「作答 / 结果」标签对的选中态。
     *
     * 机制：两个 pane 的 display 按 hwActiveTab 互斥切换；两个 tab 按钮
     * 按选中态着色（选中用主题青色背景白字，未选透明底灰字，颜色经 T()
     * 双主题适配）。激活 result 页签时联动调用 hwRenderResultPanel 重绘
     * 结果内容（惰性渲染策略：切过去才画）。
     * [DEEP-DOC]
     */
    function hwUpdateTabs() {
        const ans = document.getElementById('xy-hw-pane-answer');
        const res = document.getElementById('xy-hw-pane-result');
        const tabA = document.getElementById('xy-hw-tab-answer');
        const tabR = document.getElementById('xy-hw-tab-result');
        if (!ans || !res) return;
        ans.style.display = hwActiveTab === 'answer' ? 'block' : 'none';
        res.style.display = hwActiveTab === 'result' ? 'block' : 'none';
        if (tabA) {
            tabA.style.background = hwActiveTab === 'answer' ? T('#0e7490','#0ea5e9') : 'transparent';
            tabA.style.color = hwActiveTab === 'answer' ? '#fff' : T('#94a3b8','#64748b');
        }
        if (tabR) {
            tabR.style.background = hwActiveTab === 'result' ? T('#0e7490','#0ea5e9') : 'transparent';
            tabR.style.color = hwActiveTab === 'result' ? '#fff' : T('#94a3b8','#64748b');
        }
        if (hwActiveTab === 'result') hwRenderResultPanel();
    }
    /**
     * 作业区总渲染入口，被状态变化的各处调用。
     *
     * 分四步：
     *   1. 状态条文案三态：已提交（含得分）/ 已捕获 N 题 / 等待题目数据；
     *   2. hwRenderResultPanel 重绘结果面板；
     *   3. hwUpdateTabs 同步页签；
     *   4. 「复制提示词」「保存作答」两个主操作按钮按是否有题目数据启停。
     *
     * 全程 DOM 探测式（元素不存在静默跳过），保证在面板未创建时安全调用。
     * [DEEP-DOC]
     */
    function hwUpdateUI() {
        const st = document.getElementById('xy-hw-status');
        if (st) {
            if (hwSubmissionResult.state === 'submitted') {
                st.textContent = `✅ 已提交 · ${hwQuestionsData.length} 题 · ${hwSubmissionResult.actualScore ?? '-'}/${hwSubmissionResult.totalScore ?? '-'} 分`;
            } else if (hwQuestionsData.length) {
                st.textContent = `📝 ${hwQuestionsData.length} 道题已捕获`;
            } else {
                st.textContent = '等待题目数据...';
            }
        }
        
        hwRenderResultPanel();
        hwUpdateTabs();
        const copyBtn = document.getElementById('xy-hw-copy-btn');
        if (copyBtn) copyBtn.disabled = !hwQuestionsData.length;
        const saveBtn = document.getElementById('xy-hw-save-btn');
        if (saveBtn) saveBtn.disabled = !hwQuestionsData.length;
    }

    
    
    
    let _q, _r, _p, _i, _m;
    try { _q = JSON.parse(GM_getValue('xy_schedule_queue', '[]')); if (!Array.isArray(_q)) _q = []; } catch(e) { _q = []; }
    try { _r = GM_getValue('xy_schedule_running', false) === true; } catch(e) { _r = false; }
    try { _p = GM_getValue('xy_schedule_paused', false) === true; } catch(e) { _p = false; }
    try { _i = parseInt(GM_getValue('xy_schedule_idx', '0')) || 0; } catch(e) { _i = 0; }
    try { _m = GM_getValue('xy_schedule_last_mode', PLAY_MODE.SEQUENCE); if (!_m) _m = PLAY_MODE.SEQUENCE; } catch(e) { _m = PLAY_MODE.SEQUENCE; }

    const xyScheduleState = {
        queue: _q,
        isRunning: _r,
        isPaused: _p,
        currentIdx: _i,
        lastMode: _m,
        autoStart: GM_getValue('xy_schedule_auto_start', ''),
        autoStop: GM_getValue('xy_schedule_auto_stop', '')
    };

    
    xyScheduleState.queue.forEach(q => {
        if (q.infinite !== undefined) {
            if (q.infinite) q.strategy = STRATEGY.INFINITE;
            else if (q.duration === -1) q.strategy = STRATEGY.INFINITE;
            else q.strategy = STRATEGY.FIXED_DURATION;
            delete q.infinite;
        }
        if (!q.strategy) q.strategy = STRATEGY.UNTIL_DONE;
        
        if (q.strategy === STRATEGY.FIXED_DURATION && (!q.duration || q.duration < 1)) q.duration = 30;
    });

    
    let _schJumping = false;
    try { _schJumping = sessionStorage.getItem('xy_sch_jumping') === '1'; sessionStorage.removeItem('xy_sch_jumping'); } catch(e) {}

    
    let _schNewSession = true;
    try { _schNewSession = !sessionStorage.getItem('xy_sch_session'); sessionStorage.setItem('xy_sch_session', '1'); } catch(e) {}

    if (xyScheduleState.isRunning && !_schJumping && _schNewSession) {
        xyScheduleState.isRunning = false;
        xyScheduleState.isPaused = false;
        xyScheduleState.currentIdx = 0;
        xyScheduleState.queue = [];
        GM_setValue('xy_schedule_running', false);
        GM_setValue('xy_schedule_paused', false);
        GM_setValue('xy_schedule_idx', 0);
        GM_setValue('xy_schedule_queue', JSON.stringify(xyScheduleState.queue));
    }

    
    if (xyScheduleState.isRunning) {
        setTimeout(() => { try { unsafeWindow._xyAntiThrottleStart?.(); } catch(e) {} }, 500);
    }
    /**
     * 计划调度状态持久化：队列 JSON、运行标志、暂停标志、游标、上次模式
     * 五个键一次性写入 GM 存储。调度引擎的每个状态迁移点（启动/暂停/推进/
     * 停止/入队出队）都必须调用它，保证任意时刻刷新页面都能无损恢复现场。
     * [DEEP-DOC]
     */
    function saveScheduleState() {
        GM_setValue('xy_schedule_queue', JSON.stringify(xyScheduleState.queue));
        GM_setValue('xy_schedule_running', xyScheduleState.isRunning);
        GM_setValue('xy_schedule_paused', xyScheduleState.isPaused);
        GM_setValue('xy_schedule_idx', xyScheduleState.currentIdx);
        GM_setValue('xy_schedule_last_mode', xyScheduleState.lastMode);
    }

    try { 
        discState.targetNames = JSON.parse(GM_getValue('xy_target_names', '[]')); 
    } catch(e) { 
        discState.targetNames = []; 
    }

    try {
        discState.customReplies = JSON.parse(GM_getValue('xy_custom_replies', '[]'));
    } catch(e) {
        discState.customReplies = [];
    }
    
    let sessionLogs = [];
    try { sessionLogs = JSON.parse(sessionStorage.getItem('xy_session_logs')) || []; } catch(e) { sessionLogs = []; }
    
    let recordIntervalTimer = null; 
    let realTimeTimer = null;
    const courseResourceRequests = new Map();
    const courseResourcesCacheByGroup = new Map();
    const downloadResourceRequests = new Map();
    let downloadPanelRequestSeq = 0;
    let isSubmittingLock = false;
    let isJumpingLock = false;
    let isRecordSending = false;
    let recordFailCount = 0;
    /**
     * RFC4122 v4 UUID 生成器（双路径）。
     *
     * 优先 crypto.randomUUID（现代浏览器原生实现）；不可用时回退手工算法：
     * crypto.getRandomValues 取 16 随机字节 → 设置 version 位（buf[6] 高半
     * 字节或 0x40）与 variant 位（buf[8] 高两位置 10）→ 16 进制展开并按
     * 8-4-4-4-12 插入连字符。用于调度队列条目的 uuid 字段（DOM data-uuid 关联）。
     * [DEEP-DOC]
     */
    function generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        buf[6] = (buf[6] & 0x0f) | 0x40;
        buf[8] = (buf[8] & 0x3f) | 0x80;
        const hex = Array.from(buf, b => b.toString(16).padStart(2, '0'));
        return hex[0]+hex[1]+hex[2]+hex[3]+'-'+hex[4]+hex[5]+'-'+hex[6]+hex[7]+'-'+hex[8]+hex[9]+'-'+hex[10]+hex[11]+hex[12]+hex[13]+hex[14]+hex[15];
    }

    
    let dynamicRefreshTimeoutId = null;
    let refreshCountdownTimer = null;
    let lastRefreshStrategy = 'none';
    /**
     * 静音状态广播：将 guardState.hardwareMute 打包为 CustomEvent
     * 'xy-volume-change' 在 document 上派发。主世界注入的隐身引擎监听同一
     * 事件：更新 window._xy_hardware_mute 标记并把所有 video/audio 元素的
     * muted 属性同步到最新值。这是沙箱→主世界的单向控制通道。
     * [DEEP-DOC]
     */
    function syncHardwareMute() { document.dispatchEvent(new CustomEvent('xy-volume-change', { detail: { mute: guardState.hardwareMute } })); }
    /**
     * 课程 ID 提取器：正则匹配当前 href 中的 mycourse/{digits} 或 course/{digits}
     * 片段，捕获组即课程 ID。
     * @returns {string|null} 课程 ID 数字串；不在课程上下文时 null
     * [DEEP-DOC]
     */
    function getCourseGroupId() { const match = window.location.href.match(/(?:mycourse|course)\/(\d+)/); return match ? match[1] : null; }
    /**
     * 路由前缀自适应：平台同时存在 /course/{id}（新版）与 /mycourse/{id}
     * （旧版）两种路径形态。检测 pathname 是否匹配 /course/\d+ 决定拼接
     * 跳转链接时沿用哪种前缀，避免跳到旧版路由导致 404。
     * @returns {'course'|'mycourse'}
     * [DEEP-DOC]
     */
    function xyCourseRoutePrefix() { return /\/course\/\d+(?:\/|$)/.test(window.location.pathname) ? 'course' : 'mycourse'; }
    /** 我的课程首页检测：pathname 精确匹配 ^/app/jx-web/mycourse/?$（允许尾斜杠）。
     * [DEEP-DOC]
     */
    function isActiveCourseHomePage() { return /^\/app\/jx-web\/mycourse\/?$/.test(window.location.pathname); }
    /**
     * 学情概览钉住保护判定。
     *
     * 场景：用户在课程首页点开某课概览后，SPA 路由扫描可能因微小的 URL 变化
     * 试图把视图抢走。此函数判断「钉住条件」是否成立：
     *   - activeZone 必须已是 overview 且 pinnedCourseId 与概览 courseId 一致；
     *   - 传入 courseId 时精确比对；未传入时要求当前就在课程首页且
     *     dashboardCourseId 与钉住 ID 一致。
     * 任一不满足即返回 false（不保护，允许正常切区）。
     * [DEEP-DOC]
     */
    function xyShouldKeepDashboardOverview(courseId = '') {
        const dashboardCourseId = String(xyOverviewState.dashboardCourseId || '');
        const pinnedCourseId = String(xyOverviewState.pinnedCourseId || '');
        if (playState.activeZone !== ZONE.OVERVIEW || !pinnedCourseId || pinnedCourseId !== xyOverviewState.courseId) return false;
        if (courseId) return String(courseId) === pinnedCourseId;
        return isActiveCourseHomePage() && dashboardCourseId === pinnedCourseId;
    }
    /** 资源节点 ID 提取：匹配 resource/{parent}/{node} 的第二段数字。
     * [DEEP-DOC]
     */
    function getNodeId() { const match = window.location.href.match(/resource\/\d+\/(\d+)/); return match ? match[1] : null; }
    /**
     * 试卷 ID 提取（双路由形态）：优先匹配 course_paper/mycourse/{g}/{p}
     * 取第一捕获组；回退 resource/{a}/{b} 取第二捕获组。
     * @returns {string|null}
     * [DEEP-DOC]
     */
    function getPaperId() {
        // course_paper URL 两种代际结构：
        //   新版: /course_paper/mycourse/{gid}/{nodeId}/{flowId}/{paperId}（paper 为末段）
        //   旧版: /course_paper/mycourse/{gid}/{paperId}/{nodeId}
        const nums = window.location.pathname.match(/course_paper\/mycourse\/\d+((?:\/\d+)+)$/);
        if (nums && nums[1]) {
            const parts = nums[1].split('/').filter(Boolean);
            if (parts.length >= 3) return parts[parts.length - 1]; // 新结构：末段为 paperId
            if (parts.length >= 1) return parts[0];                // 旧结构：首段为 paperId
        }
        let match = window.location.href.match(/resource\/(\d+)\/(\d+)/);
        return match ? match[2] : null;
    }
    /**
     * 资源父节点 ID 提取：优先 course_paper 路由的第三段；回退 resource/{id}/
     * 的第一段。
     * [DEEP-DOC]
     */
    function getResourceNodeId() {
        // 与 getPaperId 同一套代际判断：新结构 node=第1段；旧结构 node=第2段
        const nums = window.location.pathname.match(/course_paper\/mycourse\/\d+((?:\/\d+)+)$/);
        if (nums && nums[1]) {
            const parts = nums[1].split('/').filter(Boolean);
            if (parts.length >= 3) return parts[0];  // 新结构：首参数段为 nodeId
            if (parts.length === 2) return parts[1]; // 旧结构：第2段为 nodeId
            if (parts.length === 1) return '';
        }
        let match = window.location.href.match(/resource\/(\d+)\//);
        return match ? match[1] : null;
    }
    /**
     * 课程目录页判定：pathname 匹配 /mycourse/{id}/resource[/可选层级]/?
     * 结尾形态（允许带资源子层级）。
     * [DEEP-DOC]
     */
    function isCourseDirPage() {
        return /\/mycourse\/\d+(?:\/resource(?:\/\d+)?)?\/?$/.test(window.location.pathname);
    }
    /**
     * 路由分类器 —— SPA 感知的基石。runLowLevelScanner 每次 URL 变化都调用它。
     *
     * 分类规则（自上而下首个命中生效，尾部斜杠先归一化）：
     *   '/app/jx-web/mycourse' 精确命中 → courses（课程总览）
     *   含 course_paper/              → hw（作业答题）
     *   discussion|discuss 词缀       → disc（讨论区）
     *   课程ID/task|home|courseTools → overview（学情概览挂载点）
     *   课程ID/resource/{a}/{b}      → course（刷课内容页）
     *   课程ID/resource               → dir（目录页）
     *   兜底：含课程 ID → overview，否则 courses
     *
     * @param {string} [pathname=location.pathname]
     * @returns {string} ZONE 常量对应的字符串键
     * [DEEP-DOC]
     */
    function xyRouteKind(pathname = window.location.pathname) {
        const path = String(pathname || '').replace(/\/+$/, '') || '/';
        if (path === '/app/jx-web/mycourse') return ZONE.COURSES;
        if (/\/course_paper\//.test(path)) return ZONE.HW;
        if (/\/(?:discussion|discuss)(?:\/|$)/.test(path)) return ZONE.DISC;
        if (/\/(?:mycourse|course)\/\d+\/(?:task|home|courseTools)$/.test(path)) return ZONE.OVERVIEW;
        if (/\/(?:mycourse|course)\/\d+\/resource\/\d+\/\d+$/.test(path)) return 'course';
        if (/\/(?:mycourse|course)\/\d+\/resource(?:\/\d+)?$/.test(path)) return ZONE.DIR;
        return /\/(?:mycourse|course)\/\d+(?:\/|$)/.test(path) ? ZONE.OVERVIEW : ZONE.COURSES;
    }
    /**
     * 讨论区 DOM 启发式检测：querySelector 匹配 .discussion-container /
     * .jx-discussion 及任意 class 名含 discuss 的元素。比纯路由判断更可靠，
     * 因为部分讨论入口是弹层而非独立路由。
     * [DEEP-DOC]
     */
    function xyIsDiscussionPage() {
        return !!document.querySelector('.discussion-container, .jx-discussion, [class*="discuss"]');
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    /**
     * Cookie 查找器：按 '; ' 切分 document.cookie，逐条取第一个 '=' 前的
     * 名称段与关键字做 includes 匹配（模糊匹配，兼容带前缀的变体名），
     * 命中即返回 '=' 之后的值。
     *
     * 默认关键字 'prd-access-token' 即平台登录令牌——所有 API 调用的
     * Bearer Token 都源于此。
     *
     * @param {string} [keyword='prd-access-token']
     * @returns {string|null} Cookie 值；不存在返回 null
     * [DEEP-DOC]
     */
    function getCookie(keyword = 'prd-access-token') {
        for (const cookie of document.cookie.split('; ')) {
            const separatorIndex = cookie.indexOf('=');
            if (separatorIndex < 0) continue;
            const name = cookie.slice(0, separatorIndex);
            if (name.includes(keyword)) return cookie.slice(separatorIndex + 1);
        }
        return null;
    }
    /**
     * 登录令牌获取（async 包装）：内部调 getCookie()；拿到即返回 Token 串，
     * 拿不到抛 Error('未找到Token')——调用方统一按「登录失效」分支处理
     * （通常表现为 toast 提示 + 中止当前自动化流程）。
     *
     * @returns {Promise<string>} Bearer Token 原文
     * @throws {Error} Cookie 中不存在令牌时
     * [DEEP-DOC]
     */
    async function getAuthToken() { const token = getCookie(); if (token) return token; throw new Error('未找到Token'); }

    const xyOverviewState = {
        courseId: '',
        dashboardCourseId: '',
        pinnedCourseId: '',
        returnZone: '',
        requestSeq: 0,
        userId: '',
        currentData: null,
        taskDetailsExpanded: null,
        cache: new Map(),
        dataRequestSeq: new Map(),
        cacheTtl: 60 * 1000
    };

    const xyCourseDashboardState = {
        requestSeq: 0,
        routeActive: false,
        isLoading: false,
        promise: null,
        courses: [],
        query: '',
        filter: 'all',
        loadedCount: 0,
        pendingAvailable: true,
        pendingError: '',
        error: '',
        renderTimer: null,
        cache: null,
        cacheAppliedAt: 0,
        cacheTtl: 3 * 60 * 1000
    };
    /**
     * 学情概览域的统一 JSON GET 通道。
     *
     * 机制：getAuthToken 取 Token → fetch(path 相对 origin) 带 authorization 头
     * → HTTP 非 2xx 抛「请求失败 (status)」→ 解析 JSON 后校验 payload.success === true，
     * 否则把平台 message 透传为业务错误。所有 xyOverview* 的数据接口都经由它，
     * 保证鉴权与错误形态一致。
     *
     * @param {string} path - API 路径（相对站点 origin，如 /api/jx-stat/...）
     * @returns {Promise<*>} 平台响应体中的 data 字段
     * @throws {Error} 网络异常/HTTP 错误/success!==true（message 取平台返回或默认文案）
     * [DEEP-DOC]
     */
    async function xyOverviewFetchJson(path) {
        const token = await getAuthToken();
        const response = await fetch(new URL(path, window.location.origin), {
            headers: { authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`请求失败 (${response.status})`);
        const payload = await response.json();
        if (!payload || payload.success !== true) {
            throw new Error(payload?.message || '接口返回异常');
        }
        return payload.data;
    }
    /**
     * 安全数值收敛器：Number(value) 结果为有限数则返回之，否则回退 fallback（默认 0）。
     * 概览域所有来自接口的字段都先过它，杜绝 NaN 污染后续算术与排序。
     * [DEEP-DOC]
     */
    function xyOverviewNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }
    /**
     * 截止时间分桶器，「今日学习提示」优先级模型的输入之一。
     *
     * 分桶规则（now 为基准）：
     *   deadlineAt 非有限数        → 'unknown'
     *   ≤ now                      → 'overdue'（已截止）
     *   ≤ now + 24h                → 'today'（今日内）
     *   ≤ now + 72h                → 'soon'（近期）
     *   其余                        → 'later'
     *
     * @param {number} deadlineAt - 截止时间戳(ms)；NaN/undefined 视为未知
     * @param {number} [now=Date.now()]
     * @returns {'overdue'|'today'|'soon'|'later'|'unknown'}
     * [DEEP-DOC]
     */
    function xyTodayPromptDeadlineBucket(deadlineAt, now = Date.now()) {
        if (!Number.isFinite(deadlineAt)) return 'unknown';
        if (deadlineAt <= now) return 'overdue';
        if (deadlineAt <= now + 24 * 60 * 60 * 1000) return 'today';
        if (deadlineAt <= now + 72 * 60 * 60 * 1000) return 'soon';
        return 'later';
    }
    /**
     * 任务状态键归一化。两级来源：
     *   1. 平台显式字段 task.status.key / statusKey（trim 后非空即信）；
     *   2. 推导兜底：有截止时间且已过期 → 'expired'，否则 'actionable'。
     * 输出与 TODAY_PROMPT_WEIGHTS.STATUS 权重表的键严格对应。
     * [DEEP-DOC]
     */
    function xyTodayPromptStatusKey(task, deadlineAt, now = Date.now()) {
        const explicit = String(task?.status?.key || task?.statusKey || '').trim();
        if (explicit) return explicit;
        return Number.isFinite(deadlineAt) && deadlineAt <= now ? 'expired' : 'actionable';
    }
    /**
     * 单任务信号构建 —— 今日提示推荐模型的核心单元。
     *
     * 步骤：
     *   1. 归一标题（title/name 兜底「未命名任务」）与截止时间戳；
     *   2. 计算 deadlineBucket 与 statusKey；isExpired = 显式 expired 或
     *      （可行动且 overdue）；isActionable 最终排除 expired；
     *   3. 提取 nodeId/parentId（跳转三元组的两元）；
     *   4. priorityScore = STATUS 权重 + DEADLINE 权重 + 可直达加分(8)
     *      + 有真实标题加分(2)；
     *   5. priorityReasons 生成至多三条中文理由（未提交/24h内截止/可直达…）。
     *
     * @param {Object} task - 平台任务对象（字段形态多变，全量可选）
     * @param {number} [now=Date.now()]
     * @returns {Object} 含 title/statusKey/deadlineBucket/priorityScore/priorityReasons 等的信号对象（原字段保留）
     * [DEEP-DOC]
     */
    function xyTodayPromptBuildTaskSignal(task, now = Date.now()) {
        const source = task && typeof task === 'object' ? task : {};
        const title = String(source.title || source.name || '未命名任务').trim() || '未命名任务';
        const endTime = source.endTime || source.end_time || '';
        const deadlineAt = Date.parse(endTime);
        const deadlineBucket = xyTodayPromptDeadlineBucket(deadlineAt, now);
        const statusKey = xyTodayPromptStatusKey(source, deadlineAt, now);
        const isActionable = statusKey === 'actionable' || statusKey === 'unsubmitted';
        const isExpired = statusKey === 'expired'
            || (isActionable && deadlineBucket === 'overdue');
        const nodeId = String(source.nodeId ?? source.node_id ?? '').trim();
        const parentId = String(source.parentId ?? source.parent_id ?? '').trim();
        const statusWeight = TODAY_PROMPT_WEIGHTS.STATUS;
        const deadlineWeight = TODAY_PROMPT_WEIGHTS.DEADLINE;
        const priorityReasons = [];
        if (isActionable) priorityReasons.push(statusKey === 'unsubmitted' ? '尚未提交' : '当前可直接完成');
        else if (statusKey === 'pending') priorityReasons.push('等待批阅');
        else if (statusKey === 'graded') priorityReasons.push('已完成');
        else if (isExpired) priorityReasons.push('已截止');
        if (deadlineBucket === 'today') priorityReasons.push('24小时内截止');
        else if (deadlineBucket === 'soon') priorityReasons.push('近期截止');
        else if (deadlineBucket === 'unknown' && isActionable) priorityReasons.push('暂无明确截止时间');
        if (nodeId && parentId && priorityReasons.length < 3) priorityReasons.push('可直达任务');
        return {
            ...source,
            title,
            statusKey,
            deadlineAt: Number.isFinite(deadlineAt) ? deadlineAt : null,
            deadlineBucket,
            nodeId,
            parentId,
            isActionable: isActionable && !isExpired,
            isExpired,
            priorityReasons: priorityReasons.slice(0, 3),
            priorityScore: (statusWeight[statusKey] ?? 5)
                + (deadlineWeight[deadlineBucket] ?? 0)
                + (nodeId && parentId ? 8 : 0)
                + (title !== '未命名任务' ? 2 : 0)
        };
    }
    /**
     * 任务列表排序：逐条补建信号（已有 priorityReasons+deadlineBucket 的透传）
     * 后按 priorityScore 降序；同分先按截止时间升序（紧迫者优先），再按原始
     * 下标保持稳定。排序后剥掉内部下标字段 _todayPromptIndex。
     * [DEEP-DOC]
     */
    function xyTodayPromptRankTasks(tasks, now = Date.now()) {
        return (Array.isArray(tasks) ? tasks : []).map((task, index) => {
            const signal = task?.priorityReasons && task?.deadlineBucket
                ? task
                : xyTodayPromptBuildTaskSignal(task, now);
            return { ...signal, _todayPromptIndex: index };
        }).sort((left, right) => {
            if (right.priorityScore !== left.priorityScore) return right.priorityScore - left.priorityScore;
            const leftDeadline = Number.isFinite(left.deadlineAt) ? left.deadlineAt : Number.POSITIVE_INFINITY;
            const rightDeadline = Number.isFinite(right.deadlineAt) ? right.deadlineAt : Number.POSITIVE_INFINITY;
            return leftDeadline - rightDeadline || left._todayPromptIndex - right._todayPromptIndex;
        }).map(({ _todayPromptIndex, ...task }) => task);
    }
    /**
     * 课程级信号聚合：把一门课的任务集合折叠为「今天该不该管这门课」的决策对象。
     *
     * 关键推导：
     *   - effectiveActionable/ExpiredCount：待办接口计数与本地明细取大者
     *     （两路数据源可能不一致，宁可多报不漏报）；
     *   - state 七态机：urgent(首个任务24h内) > continue(有可做) > waiting
     *     (全部待批阅) > history(仅剩已截止) > unknown(数据不全) > clear；
     *   - title/meta 生成人读文案；priorityScore 继承首任务的分值并叠加
     *     完成率缺口奖励（越没做完越靠前）。
     * [DEEP-DOC]
     */
    function xyTodayPromptBuildCourseSignal(course, tasks = [], now = Date.now()) {
        const source = course && typeof course === 'object' ? course : {};
        const sourceTasks = Array.isArray(tasks) && tasks.length
            ? tasks
            : (Array.isArray(source.todayTasks) && source.todayTasks.length ? source.todayTasks : source.pendingTasks);
        const taskSignals = xyTodayPromptRankTasks(sourceTasks, now);
        const actionableTasks = taskSignals.filter(task => task.isActionable);
        const expiredTasks = taskSignals.filter(task => task.isExpired);
        const pendingCount = source.pendingCount === null || source.pendingCount === undefined
            ? null
            : Math.max(0, xyOverviewNumber(source.pendingCount));
        const expiredCount = source.expiredCount === null || source.expiredCount === undefined
            ? null
            : Math.max(0, xyOverviewNumber(source.expiredCount));
        const portrait = source.portrait || {};
        const taskCount = Number.isFinite(Number(portrait.taskCount)) ? Math.max(0, Number(portrait.taskCount)) : null;
        const finishedCount = taskCount === null ? null : Math.min(taskCount, Math.max(0, xyOverviewNumber(portrait.finishedCount)));
        const effectiveActionableCount = pendingCount === null ? actionableTasks.length : Math.max(pendingCount, actionableTasks.length);
        const effectiveExpiredCount = expiredCount === null ? expiredTasks.length : Math.max(expiredCount, expiredTasks.length);
        const hasUnknownData = !!source.taskDetailsError || (!!source.pendingError && pendingCount === null);
        const firstTask = actionableTasks[0] || null;
        const state = hasUnknownData && !firstTask
            ? 'unknown'
            : firstTask?.deadlineBucket === 'today'
                ? 'urgent'
                : firstTask
                    ? 'continue'
                    : pendingCount === null
                        ? 'unknown'
                        : effectiveExpiredCount > 0 && effectiveActionableCount === 0
                            ? 'history'
                            : source.taskDetailsState === 'waiting' || source.waitingCount > 0
                                ? 'waiting'
                                : 'clear';
        const courseName = String(source.courseName || source.name || '当前课程');
        const completionRate = taskCount > 0 ? Math.round(finishedCount / taskCount * 100) : null;
        const priorityReasons = firstTask
            ? firstTask.priorityReasons.slice(0, 3)
            : state === 'waiting'
                ? ['当前没有可直接完成的任务', '已有任务等待批阅']
                : state === 'history'
                    ? ['当前没有可做任务', '已截止任务已单独归档']
                    : state === 'unknown'
                        ? ['任务数据暂不可用']
                        : ['当前没有必须处理的任务'];
        const title = state === 'urgent'
            ? `今天先处理「${firstTask.title}」`
            : state === 'continue'
                ? `今天可以推进「${firstTask.title}」`
                : state === 'waiting'
                    ? '今天暂无新的提交任务'
                    : state === 'unknown'
                        ? '今日提示依据不完整'
                        : '今天暂无必须处理的任务';
        return {
            ...source,
            courseId: String(source.courseId || source.id || ''),
            courseName,
            state,
            title,
            meta: firstTask
                ? `${firstTask.deadlineBucket === 'today' ? '24小时内截止' : firstTask.deadlineBucket === 'soon' ? '近期截止' : '可继续推进'} · ${courseName}`
                : state === 'unknown'
                    ? '未能读取完整任务状态，请稍后重试'
                    : `可做 ${effectiveActionableCount} · 已截止 ${effectiveExpiredCount}${completionRate === null ? '' : ` · 完成度 ${completionRate}%`}`,
            priorityReasons,
            priorityScore: firstTask ? firstTask.priorityScore + (completionRate === null ? 0 : Math.max(0, 100 - completionRate) * 0.15) : 0,
            actions: actionableTasks.slice(0, 3),
            tasks: taskSignals,
            counts: {
                actionable: effectiveActionableCount,
                expired: effectiveExpiredCount,
                pending: Math.max(0, xyOverviewNumber(source.waitingCount ?? source.pendingReviewCount)),
                completed: finishedCount === null ? null : finishedCount,
                total: taskCount
            }
        };
    }
    /** 课程信号排序：priorityScore 降序 + 原始序稳定，结构与 RankTasks 对称。
     * [DEEP-DOC]
     */
    function xyTodayPromptRankCourses(courses, now = Date.now()) {
        return (Array.isArray(courses) ? courses : []).map((course, index) => {
            const signal = course?.state && course?.priorityReasons
                ? course
                : xyTodayPromptBuildCourseSignal(course, course?.todayTasks || course?.pendingTasks || [], now);
            return { ...signal, _todayPromptIndex: index };
        }).sort((left, right) => right.priorityScore - left.priorityScore || left._todayPromptIndex - right._todayPromptIndex)
            .map(({ _todayPromptIndex, ...course }) => course);
    }
    /**
     * 全局今日提示：跨课程汇总的最高层摘要。
     *
     * 聚合逻辑：
     *   - actions：urgent/continue 课程的首个行动项各取 ≤2 个，全局截前 3，
     *     并注入 courseId/courseName 供跳转定位课程上下文；
     *   - counts：reduce 累加各课程的 actionable/expired/pending 与 dueToday；
     *   - state：partialError 存在 → 'partial'；否则继承 Top 课程状态或按
     *     pending 判 waiting/clear。
     * [DEEP-DOC]
     */
    function xyTodayPromptBuildGlobalSummary(courses, now = Date.now(), partialError = '') {
        const ranked = xyTodayPromptRankCourses(courses, now);
        const actionableCourses = ranked.filter(course => ['urgent', 'continue'].includes(course.state));
        const actions = actionableCourses.flatMap(course => course.actions.slice(0, 2).map(task => ({ ...task, courseId: course.courseId, courseName: course.courseName }))).slice(0, 3);
        const counts = ranked.reduce((result, course) => {
            result.actionable += course.counts.actionable || 0;
            result.expired += course.counts.expired || 0;
            result.pending += course.counts.pending || 0;
            result.dueToday += (Array.isArray(course.tasks) ? course.tasks : []).filter(task => task.isActionable && task.deadlineBucket === 'today').length;
            result.courses += 1;
            return result;
        }, { actionable: 0, dueToday: 0, expired: 0, pending: 0, courses: 0 });
        const topCourse = actionableCourses[0];
        const state = partialError ? 'partial' : topCourse?.state || (counts.pending > 0 ? 'waiting' : 'clear');
        return {
            state,
            title: topCourse
                ? `今天先处理「${topCourse.courseName}」的 ${topCourse.actions.length || topCourse.counts.actionable} 项任务`
                : state === 'waiting'
                    ? '今天暂无新的提交任务'
                    : state === 'partial'
                        ? '今日提示依据不完整'
                        : '今天暂无必须处理的任务',
            meta: partialError || `进行中课程 ${counts.courses} · 可做 ${counts.actionable} · 已截止 ${counts.expired} · 待批阅 ${counts.pending}`,
            priorityReasons: topCourse?.priorityReasons || (partialError ? [partialError] : ['当前没有必须处理的任务']),
            actions,
            counts,
            courses: ranked
        };
    }
    /**
     * 单课程摘要便捷入口：入参已是完整信号对象（含 state+priorityReasons）时
     * 直接透传；否则委托 xyTodayPromptBuildCourseSignal 现场构建。用于渲染层
     * 不确定上游是否已归一的场合。
     * [DEEP-DOC]
     */
    function xyTodayPromptBuildCourseSummary(course, now = Date.now()) {
        return course?.state && course?.priorityReasons
            ? course
            : xyTodayPromptBuildCourseSignal(course, course?.todayTasks || course?.pendingTasks || [], now);
    }
    /**
     * 分钟时长 → 人读文案：「H 小时 M 分钟」/「H 小时」/「M 分钟」三态。
     * 负数钳到 0，四舍五入到整数分钟。
     * [DEEP-DOC]
     */
    function xyOverviewFormatMinutes(value) {
        const total = Math.max(0, Math.round(xyOverviewNumber(value)));
        const hours = Math.floor(total / 60);
        const minutes = total % 60;
        if (hours && minutes) return `${hours} 小时 ${minutes} 分钟`;
        if (hours) return `${hours} 小时`;
        return `${minutes} 分钟`;
    }
    /**
     * 由平台原始字段推导任务状态对象。
     *
     * 判定树：
     *   is_answer 缺失 → 有截止时间？过期 'expired'(已截止)：未过期
     *   'actionable'(待提交)：无截止 'unsubmitted'(未提交)
     *   已作答且不公示成绩 → 'pending'(待批阅)
     *   已作答且公示成绩   → 'graded'(已批阅)
     *
     * @returns {{key: string, label: string}}
     * [DEEP-DOC]
     */
    function xyOverviewTaskStatus(task) {
        if (!task?.is_answer) {
            const deadline = Date.parse(task?.end_time || '');
            if (Number.isFinite(deadline)) {
                return deadline <= Date.now()
                    ? { key: 'expired', label: '已截止' }
                    : { key: 'actionable', label: '待提交' };
            }
            return { key: 'unsubmitted', label: '未提交' };
        }
        if (!task?.is_show_score) return { key: 'pending', label: '待批阅' };
        return { key: 'graded', label: '已批阅' };
    }
    /**
     * 成员画像归一化：learn_durations.duration/days/avg 与 tasks.count/
     * finished_count/on_time/late_submit 全部经 xyOverviewNumber 收敛，
     * finishedCount 钳制在 [0, taskCount]，rate = 完成率百分比 [0,100]。
     * 输出形状固定，渲染层不再做任何防御判断。
     * [DEEP-DOC]
     */
    function xyOverviewNormalizePortrait(data) {
        const learnDurations = data?.learn_durations || {};
        const tasks = data?.tasks || {};
        const taskCount = Math.max(0, xyOverviewNumber(tasks.count));
        const finishedCount = Math.min(taskCount, Math.max(0, xyOverviewNumber(tasks.finished_count)));
        return {
            duration: Math.max(0, xyOverviewNumber(learnDurations.duration)),
            days: Math.max(0, xyOverviewNumber(learnDurations.days)),
            average: Math.max(0, xyOverviewNumber(learnDurations.avg)),
            taskCount,
            finishedCount,
            rate: taskCount > 0 ? Math.min(100, Math.max(0, finishedCount / taskCount * 100)) : 0,
            onTimeCount: Math.max(0, xyOverviewNumber(tasks.on_time_count)),
            lateSubmitCount: Math.max(0, xyOverviewNumber(tasks.late_submit_count))
        };
    }
    /**
     * 作业分数任务数组归一化：过滤非对象项后逐条抽取 title/totalScore/
     * myScore(null 保真)/answerTime/endTime/parent_id/node_id 并附 status
     * 推导结果。nodeId/parentId 统一 String 化供跳转拼 URL。
     * [DEEP-DOC]
     */
    function xyOverviewNormalizeTasks(data) {
        if (!Array.isArray(data)) return [];
        return data.filter(task => task && typeof task === 'object').map(task => {
            const status = xyOverviewTaskStatus(task);
            return {
                title: String(task.title || '未命名任务'),
                totalScore: Math.max(0, xyOverviewNumber(task.total_score)),
                myScore: task.my_score === null || task.my_score === undefined ? null : xyOverviewNumber(task.my_score),
                answerTime: task.answer_time || '',
                endTime: task.end_time || '',
                parentId: task.parent_id === null || task.parent_id === undefined ? '' : String(task.parent_id),
                nodeId: task.node_id === null || task.node_id === undefined ? '' : String(task.node_id),
                status
            };
        });
    }
    /**
     * 待办接口归一化：必须提供非空 courseId 才处理（该接口返回全校待办，
     * 需按 group_id 过滤出当前课程）。每条按截止时间推导 expired/actionable
     * 状态，label 用「待完成」区别于作业接口的「待提交」。
     * [DEEP-DOC]
     */
    function xyOverviewNormalizePendingTasks(data, courseId, now = Date.now()) {
        const normalizedCourseId = String(courseId ?? '').trim();
        if (!normalizedCourseId || !Array.isArray(data)) return [];
        return data.filter(task => String(task?.group_id ?? '').trim() === normalizedCourseId).map(task => {
            const endTime = task?.end_time || '';
            const deadline = Date.parse(endTime);
            return {
                title: String(task?.title || task?.name || '未命名任务'),
                totalScore: 0,
                myScore: null,
                answerTime: '',
                endTime,
                parentId: task?.parent_id === null || task?.parent_id === undefined ? '' : String(task.parent_id),
                nodeId: task?.node_id === null || task?.node_id === undefined ? '' : String(task.node_id),
                status: Number.isFinite(deadline) && deadline <= now
                    ? { key: 'expired', label: '已截止' }
                    : { key: 'actionable', label: '待完成' }
            };
        });
    }
    /**
     * 双源任务合并去重：以 nodeId 为主键（缺失时退化用 title:index 组合键），
     * 先入 pendingTasks 再入 surveyTasks 中未被占用的键。保证同一任务不会因
     * 两个接口都返回而重复展示。
     * [DEEP-DOC]
     */
    function xyOverviewMergeTasks(pendingTasks, surveyTasks) {
        const tasksByKey = new Map();
        const taskKey = (task, index) => String(task?.nodeId || '').trim() || `title:${task?.title || ''}:${index}`;
        (Array.isArray(pendingTasks) ? pendingTasks : []).forEach((task, index) => {
            tasksByKey.set(taskKey(task, index), task);
        });
        (Array.isArray(surveyTasks) ? surveyTasks : []).forEach((task, index) => {
            const key = taskKey(task, index);
            if (!tasksByKey.has(key)) tasksByKey.set(key, task);
        });
        return Array.from(tasksByKey.values());
    }
    /**
     * 任务分布统计：reduce 计数 actionable/unsubmitted 归 actionable、expired、
     * pending、graded 四类，其余状态忽略。输出固定形状
     * {actionable, pending, graded, expired}。
     * [DEEP-DOC]
     */
    function xyOverviewTaskBreakdown(tasks) {
        return (Array.isArray(tasks) ? tasks : []).reduce((result, task) => {
            const key = task?.status?.key;
            if (key === 'actionable' || key === 'unsubmitted') result.actionable++;
            else if (key === 'expired') result.expired++;
            else if (key === 'pending') result.pending++;
            else if (key === 'graded') result.graded++;
            return result;
        }, { actionable: 0, pending: 0, graded: 0, expired: 0 });
    }
    /**
     * 明细区展开态决策：expanded 是显式布尔（用户上次手动开合的记忆）则尊重；
     * null/undefined 时默认「有可做任务就展开」。breakdown 为空视为不展开。
     * [DEEP-DOC]
     */
    function xyOverviewTaskDetailsOpen(expanded, breakdown) {
        return typeof expanded === 'boolean' ? expanded : !!breakdown?.actionable;
    }
    /**
     * 截止时间短文案：Date.parse 成功则 toLocaleString('zh-CN') 出
     * 「M/D HH:mm」形态；解析失败返回 ''（调用方以空串决定隐藏该字段）。
     * [DEEP-DOC]
     */
    function xyOverviewDeadlineText(value) {
        const deadline = Date.parse(value || '');
        if (!Number.isFinite(deadline)) return '';
        return new Date(deadline).toLocaleString('zh-CN', {
            month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
    /**
     * 当前用户 ID 获取（模块级缓存）：首次调 oauth2/info 接口取 info.id，
     * String 化后写入 xyOverviewState.userId。后续调用直接命中缓存零开销。
     * 学情画像接口的 user_id 参数依赖此值。
     * @throws {Error} 接口成功但拿不到 id 时抛「无法识别当前用户」
     * [DEEP-DOC]
     */
    async function xyOverviewGetUserId() {
        if (xyOverviewState.userId) return xyOverviewState.userId;
        const data = await xyOverviewFetchJson('/api/jx-auth/oauth2/info');
        const userId = data?.info?.id;
        if (!userId) throw new Error('无法识别当前用户');
        xyOverviewState.userId = String(userId);
        return xyOverviewState.userId;
    }
    /**
     * 异常消息翻译器：Error 实例取 message，否则 String(reason)，再兜底
     * 「数据加载失败」。命中 /Token|登录|401|403/ 特征时统一替换为
     * 「登录状态已失效，请刷新页面后重试」——对用户更有行动指引。
     * [DEEP-DOC]
     */
    function xyOverviewErrorMessage(reason) {
        const message = reason instanceof Error ? reason.message : String(reason || '数据加载失败');
        if (/Token|登录|401|403/.test(message)) return '登录状态已失效，请刷新页面后重试';
        return message;
    }
    /** 渲染加载骨架：旋转 spinner + 「正在读取课程学习数据...」，写入 #xy-overview-content。容器不存在静默跳过。
     * [DEEP-DOC]
     */
    function xyOverviewRenderLoading() {
        const content = document.getElementById('xy-overview-content');
        if (!content) return;
        content.innerHTML = `
            <div class="xy-overview-loading">
                <span class="xy-overview-spinner" aria-hidden="true"></span>
                <span>正在读取课程学习数据...</span>
            </div>`;
    }
    /**
     * 错误面板片段工厂：标题+消息双行结构，两个动态值均经 escapeHtml。
     * 返回 HTML 字符串而非直接写 DOM——由调用方拼进整体布局。
     * [DEEP-DOC]
     */
    function xyOverviewRenderErrorModule(title, message) {
        return `
            <div class="xy-overview-panel xy-overview-error">
                <div class="xy-overview-panel-title">${escapeHtml(title)}</div>
                <div>${escapeHtml(message)}</div>
            </div>`;
    }
    /** 今日提示七态 → 中文标签映射查询（urgent 优先处理 / continue 可继续推进 /
     *  waiting 等待结果 / history 仅有已截止任务 / unknown 依据不完整 /
     *  partial 部分数据可用 / clear 今日已安排妥当）；未知键兜底「今日提示」。
     * [DEEP-DOC]
     */
    function xyTodayPromptStateLabel(state) {
        return ({ urgent: '优先处理', continue: '可继续推进', waiting: '等待结果', history: '仅有已截止任务', unknown: '依据不完整', partial: '部分数据可用', clear: '今日已安排妥当' })[state] || '今日提示';
    }
    /** 理由徽章渲染：数组截前 3 条，每条包一层 .xy-today-prompt-reason span，逐条 escapeHtml。
     * [DEEP-DOC]
     */
    function xyTodayPromptRenderReasons(reasons) {
        return (Array.isArray(reasons) ? reasons : []).slice(0, 3).map(reason =>
            `<span class="xy-today-prompt-reason">${escapeHtml(reason)}</span>`
        ).join('');
    }
    /**
     * 单课程今日提示卡渲染。
     *
     * 结构：状态图标（五态映射 ⏱🎯🕒⚠✓）+ 标题区（面板题头+状态标签）+
     * 主标题 + meta 行 + 理由徽章 + 行动步骤按钮组（可直达任务生成
     * data-today-task-* 属性按钮，缺 ID 的显示「待确认」并禁用）+ 三计数行。
     * 卡片根节点带 is-{state} 类驱动 CSS 变量配色。
     * [DEEP-DOC]
     */
    function xyTodayPromptRenderCourse(summary) {
        const icon = summary.state === 'urgent' ? '⏱' : summary.state === 'continue' ? '🎯' : summary.state === 'waiting' ? '🕒' : summary.state === 'unknown' ? '⚠' : '✓';
        const actions = summary.actions.slice(0, 3).map((task, index) => {
            const canOpen = !!task.parentId && !!task.nodeId;
            const deadline = task.deadlineAt ? xyOverviewDeadlineText(task.endTime || task.end_time) : '';
            return `
                <button class="xy-today-prompt-step${canOpen ? '' : ' is-disabled'}" type="button"
                    data-today-task-index="${index}" data-today-task-parent="${escapeHtml(task.parentId)}" data-today-task-node="${escapeHtml(task.nodeId)}" ${canOpen ? '' : 'disabled'}>
                    <span class="xy-today-prompt-step-index">${index + 1}</span>
                    <span class="xy-today-prompt-step-copy"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(deadline || (task.deadlineBucket === 'unknown' ? '暂无明确截止时间' : xyTodayPromptStateLabel(summary.state)))}</small></span>
                    <span class="xy-today-prompt-step-go">${canOpen ? '进入 →' : '待确认'}</span>
                </button>`;
        }).join('');
        const counts = summary.counts || {};
        return `
            <div class="xy-overview-panel xy-today-prompt is-${escapeHtml(summary.state)}">
                <div class="xy-today-prompt-icon" aria-hidden="true">${icon}</div>
                <div class="xy-today-prompt-copy">
                    <div class="xy-overview-panel-title"><span>今日学习提示</span><span class="xy-today-prompt-state">${escapeHtml(xyTodayPromptStateLabel(summary.state))}</span></div>
                    <div class="xy-today-prompt-title">${escapeHtml(summary.title)}</div>
                    <div class="xy-overview-meta">${escapeHtml(summary.meta)}</div>
                    <div class="xy-today-prompt-reasons">${xyTodayPromptRenderReasons(summary.priorityReasons)}</div>
                    ${actions ? `<div class="xy-today-prompt-steps">${actions}</div>` : ''}
                    <div class="xy-today-prompt-counts"><span>可做 ${counts.actionable || 0}</span><span>待批阅 ${counts.pending || 0}</span><span>已截止 ${counts.expired || 0}</span></div>
                </div>
            </div>`;
    }
    /**
     * 课程总览页顶部的全局今日提示区块渲染。
     *
     * 与单课卡片不同点：actions 里每个任务带两个按钮（进入任务 + 学情），
     * 通过 data-today-global-action 区分行为；数据错误时 summary.state 为
     * partial 并在 meta 显示原因。图标四态 🧭⚠🕒✓。
     * [DEEP-DOC]
     */
    function xyCourseDashboardRenderToday() {
        const container = document.getElementById('xy-course-dashboard-today');
        if (!container) return;
        const courses = xyCourseDashboardState.courses.map(course => xyTodayPromptBuildCourseSignal(course, course.pendingTasks, Date.now()));
        const promptDataError = xyCourseDashboardState.error
            || (xyCourseDashboardState.isLoading && !courses.length ? '正在读取课程与任务状态' : '')
            || (xyCourseDashboardState.pendingAvailable ? '' : xyCourseDashboardState.pendingError);
        const summary = xyTodayPromptBuildGlobalSummary(courses, Date.now(), promptDataError);
        const actions = summary.actions.map((task, index) => {
            const canOpenTask = !!task.parentId && !!task.nodeId;
            const deadline = task.deadlineAt ? xyOverviewDeadlineText(task.endTime || task.end_time) : '';
            return `
                <div class="xy-course-dashboard-today-action">
                    <div class="xy-course-dashboard-today-action-copy">
                        <strong>${escapeHtml(task.courseName)} · ${escapeHtml(task.title)}</strong>
                        <span>${escapeHtml(deadline || task.priorityReasons.join(' · ') || '可继续推进')}</span>
                    </div>
                    <div class="xy-course-dashboard-today-action-buttons">
                        ${canOpenTask ? `<button class="xy-mini-btn" type="button" data-today-global-action="task" data-today-course-id="${escapeHtml(task.courseId)}" data-today-task-parent="${escapeHtml(task.parentId)}" data-today-task-node="${escapeHtml(task.nodeId)}">进入任务</button>` : ''}
                        <button class="xy-mini-btn" type="button" data-today-global-action="overview" data-today-course-id="${escapeHtml(task.courseId)}">学情</button>
                    </div>
                </div>`;
        }).join('');
        const stateIcon = summary.state === 'urgent' ? '🧭' : summary.state === 'partial' ? '⚠' : summary.state === 'waiting' ? '🕒' : '✓';
        container.innerHTML = `
            <section class="xy-course-dashboard-today is-${escapeHtml(summary.state)}" aria-label="今日学习提示">
                <div class="xy-course-dashboard-today-head">
                    <div><span class="xy-course-dashboard-today-icon" aria-hidden="true">${stateIcon}</span><strong>今日学习提示</strong></div>
                    <span>${escapeHtml(xyTodayPromptStateLabel(summary.state))}</span>
                </div>
                <div class="xy-course-dashboard-today-title">${escapeHtml(summary.title)}</div>
                <div class="xy-course-dashboard-today-meta">${escapeHtml(summary.meta)}</div>
                <div class="xy-today-prompt-reasons">${xyTodayPromptRenderReasons(summary.priorityReasons)}</div>
                <div class="xy-today-prompt-counts"><span>可做 ${summary.counts.actionable || 0}</span><span>24小时内 ${summary.counts.dueToday || 0}</span><span>待批阅 ${summary.counts.pending || 0}</span><span>已截止 ${summary.counts.expired || 0}</span></div>
                ${actions ? `<div class="xy-course-dashboard-today-actions">${actions}</div>` : ''}
            </section>`;
    }
    /**
     * 数据一致性告警生成器：平台画像的任务完成数与待办接口对不上时的
     * 解释性文案。pendingTasksError 非空 → 报「待办接口加载失败」并列出
     * 两边数字；否则报「平台统计相差 N 项」并建议以作业页为准。
     * [DEEP-DOC]
     */
    function xyOverviewUnresolvedTaskNotice(finishedCount, taskCount, pendingTasksError = '') {
        if (pendingTasksError) {
            return {
                title: '待办接口加载失败',
                meta: `成员画像为 ${xyOverviewNumber(finishedCount)} / ${xyOverviewNumber(taskCount)}；未能读取待办接口（${pendingTasksError}），暂时无法定位对应任务。`
            };
        }
        const difference = Math.max(0, xyOverviewNumber(taskCount) - xyOverviewNumber(finishedCount));
        return {
            title: `平台统计相差 ${difference} 项`,
            meta: `成员画像为 ${xyOverviewNumber(finishedCount)} / ${xyOverviewNumber(taskCount)}，但待办接口未返回对应任务；请以“作业任务”页的状态为准。`
        };
    }
    /**
     * 学情概览主渲染器（三段布局拼装）。
     *
     * 段1 指标网格：画像正常 → 学习时长卡 + 任务进度卡（进度条/按时补交）；
     *       画像出错 → 错误面板替代。
     * 段2 今日提示：promptCourse 组装（portrait/计数/错误信息汇合）后走
     *       BuildCourseSummary → RenderCourse；
     * 段3 任务明细：details 元素包裹任务行列表（statusPriority 排序：
     *       待提交→待批阅→已批阅→已截止），每行带 data-task-index 供点击委托。
     *
     * 进入时记忆 details 的 open 态（taskDetailsExpanded）保持用户偏好。
     * [DEEP-DOC]
     */
    function xyOverviewRender(data) {
        const content = document.getElementById('xy-overview-content');
        if (!content || !data) return;
        const currentTaskDetails = content.querySelector('.xy-overview-task-details');
        if (currentTaskDetails) xyOverviewState.taskDetailsExpanded = currentTaskDetails.open;

        const title = document.getElementById('xy-overview-title');
        const updated = document.getElementById('xy-overview-updated');
        if (title) title.textContent = data.courseName ? `${data.courseName} · 学情概览` : '课程学习数据概览';
        if (updated) updated.textContent = `更新于 ${new Date(data.loadedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;

        let summaryHtml = '';
        if (data.portrait.error) {
            summaryHtml = xyOverviewRenderErrorModule('学习概览', data.portrait.error);
        } else {
            const portrait = data.portrait.data;
            const durationValue = portrait.duration > 0 ? xyOverviewFormatMinutes(portrait.duration) : '暂无记录';
            const completionValue = portrait.taskCount > 0 ? `${portrait.finishedCount} / ${portrait.taskCount}` : '暂无任务';
            const completionProgress = portrait.taskCount > 0
                ? `<div class="xy-overview-progress" role="progressbar" aria-label="任务完成度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(portrait.rate)}">
                       <div class="xy-overview-progress-fill" style="width:${portrait.rate}%;"></div>
                   </div>`
                : '';
            const completionMeta = portrait.taskCount > 0
                ? `${Math.round(portrait.rate)}% · 按时 ${portrait.onTimeCount} · 补交 ${portrait.lateSubmitCount}`
                : '当前课程暂无可统计任务';
            const completionRate = portrait.taskCount > 0 ? `${Math.round(portrait.rate)}%` : '—';
            summaryHtml = `
                <div class="xy-overview-grid">
                    <div class="xy-overview-panel xy-overview-metric">
                        <div class="xy-overview-metric-title"><span>◷ 学习时长</span></div>
                        <div class="xy-overview-value xy-overview-study-value">${escapeHtml(durationValue)}</div>
                        <div class="xy-overview-metric-caption"><span>学习 ${portrait.days} 天</span><span>日均 ${escapeHtml(xyOverviewFormatMinutes(portrait.average))}</span></div>
                    </div>
                    <div class="xy-overview-panel xy-overview-metric">
                        <div class="xy-overview-metric-title"><span>✓ 任务进度</span><span class="xy-overview-metric-rate">${escapeHtml(completionRate)}</span></div>
                        <div class="xy-overview-value"><span>${escapeHtml(completionValue.split(' / ')[0])}</span>${portrait.taskCount > 0 ? `<span class="xy-overview-value-suffix"> / ${portrait.taskCount}</span>` : ''}</div>
                        ${completionProgress}
                        <div class="xy-overview-metric-caption">${portrait.taskCount > 0 ? `<span>按时 ${portrait.onTimeCount}</span><span>补交 ${portrait.lateSubmitCount}</span>` : `<span>${escapeHtml(completionMeta)}</span>`}</div>
                    </div>
                </div>`;
        }

        let focusHtml = '';
        const taskBreakdown = data.tasks.error ? null : xyOverviewTaskBreakdown(data.tasks.data);
        const taskDetailsOpen = taskBreakdown
            ? xyOverviewTaskDetailsOpen(xyOverviewState.taskDetailsExpanded, taskBreakdown)
            : false;
        const promptCourse = {
            courseId: data.courseId,
            courseName: data.courseName,
            portrait: data.portrait?.data,
            pendingCount: taskBreakdown ? taskBreakdown.actionable : null,
            expiredCount: taskBreakdown ? taskBreakdown.expired : null,
            waitingCount: taskBreakdown ? taskBreakdown.pending : 0,
            taskDetailsError: data.tasks.error || data.tasks.pendingError || ''
        };
        focusHtml = xyTodayPromptRenderCourse(xyTodayPromptBuildCourseSummary({
            ...promptCourse,
            todayTasks: data.tasks.error ? [] : data.tasks.data
        }));

        let tasksHtml = '';
        if (data.tasks.error) {
            tasksHtml = xyOverviewRenderErrorModule('作业分数', data.tasks.error);
        } else if (!data.tasks.data.length) {
            tasksHtml = `
                <div class="xy-overview-panel">
                    <div class="xy-overview-panel-title">作业分数</div>
                    <div class="xy-overview-empty">当前课程暂无作业或测练</div>
                </div>`;
        } else {
            const statusPriority = { actionable: 0, unsubmitted: 0, pending: 1, graded: 2, expired: 3 };
            const rows = data.tasks.data.map((task, taskIndex) => ({ task, taskIndex })).sort((left, right) => {
                return (statusPriority[left.task.status.key] ?? 4) - (statusPriority[right.task.status.key] ?? 4);
            }).map(({ task, taskIndex }) => {
                const scoreText = task.status.key === 'graded'
                    ? `${task.myScore ?? 0} / ${task.totalScore}`
                    : task.totalScore > 0
                        ? `— / ${task.totalScore}`
                        : task.endTime ? `截止 ${xyOverviewDeadlineText(task.endTime) || '待定'}` : '课程任务';
                const canOpen = !!task.parentId && !!task.nodeId;
                return `
                    <button type="button" class="xy-overview-task${canOpen ? '' : ' is-disabled'}"
                        data-task-index="${taskIndex}" ${canOpen ? '' : 'disabled'}>
                        <span class="xy-overview-task-main">
                            <span class="xy-overview-task-title">${escapeHtml(task.title)}</span>
                            <span class="xy-overview-task-score">${escapeHtml(scoreText)}</span>
                        </span>
                        <span class="xy-overview-status is-${task.status.key}">${task.status.label}</span>
                    </button>`;
            }).join('');
            tasksHtml = `
                <details class="xy-overview-panel xy-overview-task-panel xy-overview-task-details" ${taskDetailsOpen ? 'open' : ''}>
                    <summary class="xy-overview-panel-title">
                        <span>任务与作业明细</span>
                        <span class="xy-overview-count">${data.tasks.data.length} 项 · 待完成 ${taskBreakdown?.actionable || 0}</span>
                    </summary>
                    <div id="xy-overview-task-list" class="xy-overview-task-list">${rows}</div>
                </details>`;
        }

        content.innerHTML = `${summaryHtml}${focusHtml}${tasksHtml}`;
    }
    /**
     * 单课程四路数据并发拉取与容错聚合。
     *
     * 流程：courseGroupKey 归一 → TTL+版本号双重缓存校验（force 可穿透）→
     * dataRequestSeq 自增防竞态 → Promise.allSettled 并发四请求（画像需先
     * GetUserId、作业、待办、课程名）→ 逐路成败装配 result：
     *   tasks.dataAvailable = 任一任务源成功；两源都挂才置 error。
     * 仅当本课程 seq 未被更新的请求超越时才写缓存（过期响应丢弃）。
     *
     * @returns {Promise<Object|null>} 聚合结果；courseId 无效返回 null
     * [DEEP-DOC]
     */
    async function xyOverviewFetchCourseData(courseId, force = false) {
        const normalizedCourseId = courseGroupKey(courseId);
        if (!normalizedCourseId) return null;
        const cached = xyOverviewState.cache.get(normalizedCourseId);
        const latestDataVersion = xyOverviewState.dataRequestSeq.get(normalizedCourseId) || 0;
        if (!force && cached && cached.dataVersion === xyOverviewState.dataRequestSeq.get(normalizedCourseId)
            && Date.now() - cached.loadedAt < xyOverviewState.cacheTtl) return cached;
        const dataRequestSeq = latestDataVersion + 1;
        xyOverviewState.dataRequestSeq.set(normalizedCourseId, dataRequestSeq);
        const portraitPromise = xyOverviewGetUserId().then(userId => xyOverviewFetchJson(
            `/api/jx-stat/ads/user/student?group_id=${encodeURIComponent(normalizedCourseId)}&user_id=${encodeURIComponent(userId)}`
        ));
        const tasksPromise = xyOverviewFetchJson(
            `/api/jx-stat/group/task/survey/student?group_id=${encodeURIComponent(normalizedCourseId)}`
        );
        const pendingTasksPromise = xyOverviewFetchJson('/api/jx-stat/group/task/un_finish');
        const courseNamePromise = getCourseNameFromAPI(normalizedCourseId);
        const [portraitResult, tasksResult, pendingTasksResult, courseNameResult] = await Promise.allSettled([
            portraitPromise,
            tasksPromise,
            pendingTasksPromise,
            courseNamePromise
        ]);
        const surveyTasks = tasksResult.status === 'fulfilled' ? xyOverviewNormalizeTasks(tasksResult.value) : [];
        const pendingTasks = pendingTasksResult.status === 'fulfilled'
            ? xyOverviewNormalizePendingTasks(pendingTasksResult.value, normalizedCourseId)
            : [];
        const pendingTasksError = pendingTasksResult.status === 'rejected'
            ? xyOverviewErrorMessage(pendingTasksResult.reason)
            : '';
        const taskDataAvailable = tasksResult.status === 'fulfilled' || pendingTasksResult.status === 'fulfilled';
        const result = {
            courseId: normalizedCourseId,
            dataVersion: dataRequestSeq,
            courseName: courseNameResult.status === 'fulfilled' ? (courseNameResult.value || '') : '',
            loadedAt: Date.now(),
            portrait: portraitResult.status === 'fulfilled'
                ? { data: xyOverviewNormalizePortrait(portraitResult.value), error: '' }
                : { data: null, error: xyOverviewErrorMessage(portraitResult.reason) },
            tasks: taskDataAvailable
                ? { data: xyOverviewMergeTasks(pendingTasks, surveyTasks), error: '', pendingError: pendingTasksError }
                : { data: [], error: xyOverviewErrorMessage(tasksResult.reason), pendingError: pendingTasksError }
        };
        if (xyOverviewState.dataRequestSeq.get(normalizedCourseId) === dataRequestSeq) {
            xyOverviewState.cache.set(normalizedCourseId, result);
        }
        return result;
    }
    /**
     * 概览装载编排入口（渲染前的最后一道闸）。
     *
     * 机制：切课时清空明细展开记忆 → requestSeq 自增 → TTL 缓存命中则直渲染
     * → 未命中先画骨架屏再 await FetchCourseData → 回来后四重竞态校验
     * （结果存在 / seq 未过期 / 仍在 overview 区 / 路由课程未变）全过才写
     * currentData 并渲染。任何一个不过就静默丢弃，绝不过期上屏。
     * [DEEP-DOC]
     */
    async function xyOverviewLoad(courseId, force = false) {
        const normalizedCourseId = courseGroupKey(courseId);
        if (!normalizedCourseId) return;
        if (xyOverviewState.courseId !== normalizedCourseId) xyOverviewState.taskDetailsExpanded = null;
        const requestSeq = ++xyOverviewState.requestSeq;
        xyOverviewState.courseId = normalizedCourseId;
        const cached = xyOverviewState.cache.get(normalizedCourseId);
        if (!force && cached && cached.dataVersion === xyOverviewState.dataRequestSeq.get(normalizedCourseId)
            && Date.now() - cached.loadedAt < xyOverviewState.cacheTtl) {
            xyOverviewState.currentData = cached;
            if (playState.activeZone === ZONE.OVERVIEW) xyOverviewRender(cached);
            return;
        }
        xyOverviewRenderLoading();
        const result = await xyOverviewFetchCourseData(normalizedCourseId, force);
        const routeCourseId = courseGroupKey(getCourseGroupId());
        const isActiveOverview = playState.activeZone === ZONE.OVERVIEW
            && xyOverviewState.courseId === normalizedCourseId;
        if (!result || requestSeq !== xyOverviewState.requestSeq || !isActiveOverview || (routeCourseId && routeCourseId !== normalizedCourseId)) return;
        xyOverviewState.currentData = result;
        xyOverviewRender(result);
    }
    /**
     * 返回区域合法性闸门：zone 在六区白名单（course/disc/hw/dir/download/courses）
     * 内原样放行，否则兜底 courses（课程总览是永远安全的落点）。
     * [DEEP-DOC]
     */
    function xyOverviewReturnZone(zone = playState.activeZone) {
        return [ZONE.COURSE, ZONE.DISC, ZONE.HW, ZONE.DIR, ZONE.DOWNLOAD, ZONE.COURSES].includes(zone) ? zone : ZONE.COURSES;
    }
    /**
     * 记录进入概览前的来源区域：仅在 activeZone 不是 overview 时更新
     * returnZone（已在概览内反复刷新不应覆盖最初来源）。返回记录值，空则 courses。
     * [DEEP-DOC]
     */
    function xyOverviewRememberReturn() {
        if (playState.activeZone !== ZONE.OVERVIEW) {
            xyOverviewState.returnZone = xyOverviewReturnZone();
        }
        return xyOverviewState.returnZone || ZONE.COURSES;
    }
    /**
     * 执行返回动作：读取并清空 returnZone、pinnedCourseId、dashboardCourseId
     * 三个上下文字段（一次性消费），然后 switchToZone 到来源区域。
     * [DEEP-DOC]
     */
    function xyOverviewReturn() {
        const returnZone = xyOverviewReturnZone(xyOverviewState.returnZone);
        xyOverviewState.returnZone = '';
        xyOverviewState.pinnedCourseId = '';
        xyOverviewState.dashboardCourseId = '';
        switchToZone(returnZone);
        return returnZone;
    }
    /**
     * 概览开关总入口：当前在概览 → 执行 Return 回原区域；不在 → RememberReturn
     * 记录上下文后 Open 打开。返回最终所在区域标识。
     * [DEEP-DOC]
     */
    function xyOverviewToggle() {
        if (playState.activeZone === ZONE.OVERVIEW) return xyOverviewReturn();
        xyOverviewRememberReturn();
        xyOverviewOpen();
        return ZONE.OVERVIEW;
    }
    /**
     * 打开指定课程的学情概览。
     *
     * 编排：courseId 归一失败提示「请先进入具体课程页面」→ RememberReturn →
     * 从课程首页打开时记 dashboardCourseId（钉住保护用）→ 设 pinnedCourseId →
     * 若主面板处于最小化则自动还原 → switchToZone('overview') → 异步 Load。
     * [DEEP-DOC]
     */
    function xyOverviewOpen(courseId = getCourseGroupId()) {
        const normalizedCourseId = courseGroupKey(courseId);
        if (!normalizedCourseId) {
            showToast('请先进入具体课程页面', 'warning');
            return;
        }
        xyOverviewRememberReturn();
        xyOverviewState.dashboardCourseId = !getCourseGroupId() && isActiveCourseHomePage()
            ? normalizedCourseId
            : '';
        xyOverviewState.pinnedCourseId = normalizedCourseId;
        const body = document.getElementById('xy-main-body');
        if (body?.style.display === 'none') document.getElementById('xy-minimize')?.click();
        switchToZone(ZONE.OVERVIEW);
        void xyOverviewLoad(normalizedCourseId, false);
    }
    /**
     * 手动强制刷新：确定目标 courseId（当前路由优先，课程首页回退上次查看的）→
     * 删除该课缓存 → force=true 重新 Load。无可用 courseId 时静默返回。
     * [DEEP-DOC]
     */
    function xyOverviewRefresh() {
        const courseId = getCourseGroupId() || (isActiveCourseHomePage() ? xyOverviewState.courseId : '');
        if (!courseId) return;
        xyOverviewState.cache.delete(courseGroupKey(courseId));
        void xyOverviewLoad(courseId, true);
    }
    /**
     * 概览任务跳转导航：三元组（courseId/parentId/nodeId）任一缺失提示
     * 「该任务缺少跳转信息」；齐全则按路由前缀拼 resource/{parent}/{node}
     * 整页跳转（encodeURIComponent 逐段转义）。
     * [DEEP-DOC]
     */
    function xyOverviewOpenTask(courseId, parentId, nodeId) {
        if (!courseId || !parentId || !nodeId) {
            showToast('该任务缺少跳转信息', 'warning');
            return;
        }
        const prefix = xyCourseRoutePrefix();
        window.location.href = `/app/jx-web/${prefix}/${encodeURIComponent(courseId)}/resource/${encodeURIComponent(parentId)}/${encodeURIComponent(nodeId)}`;
    }
    /**
     * 路由变化时的概览状态同步。
     *
     * 分支：无课程 ID → 非首页或不在概览态时清空三个上下文 ID 后返回；
     * pinnedCourseId 与当前课程不符 → 清空钉住（换课了）；
     * dashboardCourseId 一律清空（它只在课程首页语义有效）；
     * 在概览区且 courseId 变了 → 自动 Load 新课数据。
     * [DEEP-DOC]
     */
    function xyOverviewSyncRoute() {
        const courseId = getCourseGroupId() || '';
        const isCourseHome = isActiveCourseHomePage();
        const openButton = document.getElementById('xy-overview-open');
        if (openButton) openButton.style.display = (courseId || playState.activeZone === ZONE.OVERVIEW) ? 'inline-flex' : 'none';

        if (!courseId) {
            if (!isCourseHome || playState.activeZone !== ZONE.OVERVIEW) {
                xyOverviewState.courseId = '';
                xyOverviewState.dashboardCourseId = '';
                xyOverviewState.pinnedCourseId = '';
            }
            return;
        }
        if (xyOverviewState.pinnedCourseId && xyOverviewState.pinnedCourseId !== courseId) {
            xyOverviewState.pinnedCourseId = '';
            xyOverviewState.dashboardCourseId = '';
        }
        xyOverviewState.dashboardCourseId = '';
        if (playState.activeZone !== ZONE.OVERVIEW) return;
        if (xyOverviewState.courseId !== courseId) {
            void xyOverviewLoad(courseId, false);
        }
    }
    /**
     * 课程资源目录页 URL 拼接器：/app/jx-web/{路由前缀}/{courseId}/resource，
     * courseId 经 encodeURIComponent。courseId 为空返回空串（调用方以真值判断）。
     * [DEEP-DOC]
     */
    function xyCourseDashboardResourceUrl(courseId) {
        if (!courseId) return '';
        return `/app/jx-web/${xyCourseRoutePrefix()}/${encodeURIComponent(courseId)}/resource`;
    }
    /**
     * 课程列表接口多形态归一化。
     *
     * 平台同一接口在不同入口返回数组 / {groups:[]} / {list:[]} 三种形态，
     * 这里统一探测后取数组源；逐项提取 courseId（courseGroupKey 归一）并按
     * seen 集合去重；每门课初始化完整子状态对象：pendingCount/expiredCount
     * 置 null（表示「未知」而非 0）、nearestDeadline、任务明细四态机字段
     * （idle/loading/loaded/error）、portrait 三态（loading 起）。输出顺序即接口顺序。
     * [DEEP-DOC]
     */
    function xyCourseDashboardNormalizeCourses(data) {
        const source = Array.isArray(data)
            ? data
            : (Array.isArray(data?.groups) ? data.groups : (Array.isArray(data?.list) ? data.list : []));
        const seen = new Set();
        return source.reduce((courses, item) => {
            if (!item || typeof item !== 'object') return courses;
            const courseId = courseGroupKey(item.id ?? item.group_id);
            if (!courseId || seen.has(courseId)) return courses;
            seen.add(courseId);
            courses.push({
                courseId,
                courseName: String(item.name || item.group_name || item.title || '未命名课程'),
                termName: String(item.term_name || item.term || item.semester_name || ''),
                pendingCount: null,
                expiredCount: null,
                nearestDeadline: null,
                nearestExpiredDeadline: null,
                pendingTasks: [],
                taskDetailsExpanded: false,
                taskGroupExpanded: {},
                taskDetailsState: 'idle',
                taskDetails: null,
                taskDetailsError: '',
                portrait: null,
                portraitState: 'loading',
                portraitError: ''
            });
            return courses;
        }, []);
    }
    /**
     * 由 nodeId 反查父目录 ID（跳转三元组缺 parentId 时的补救路径）。
     *
     * 两级策略：1) 在课程资源树中找到该节点的 parent_id（排除根节点 '1'）；
     * 2) 回退解析资源 path 字段的倒数第二段；都失败返回 nodeId 自身
     * （跳转至少能落到节点页）。
     * [DEEP-DOC]
     */
    function xyCourseDashboardResolveTaskParentId(resources, nodeId) {
        const normalizedNodeId = normalizeDownloadId(nodeId);
        if (!normalizedNodeId) return '';
        const resource = dlCollectResources(resources).find(item => {
            const resourceNodeId = normalizeDownloadId(item?.node_id)
                ?? normalizeDownloadId(item?.nodeId)
                ?? normalizeDownloadId(dlResourceId(item));
            return resourceNodeId === normalizedNodeId;
        });
        if (!resource) return '';
        const parentId = normalizeDownloadId(resource.parent_id) ?? normalizeDownloadId(resource.parentId);
        if (parentId && parentId !== '1') return parentId;
        const pathParts = String(resource.path || '').split('/').map(part => part.trim()).filter(Boolean);
        if (pathParts.length >= 2) return pathParts[pathParts.length - 2];
        return normalizedNodeId;
    }
    /**
     * 全校待办按课程分组聚合。
     *
     * 对每条待办：group_id 归一为键 → 累加到对应桶的 tasks 数组；截止时间
     * 可解析且 ≤ now 计入 expiredCount 并刷新 nearestExpiredDeadline（取更早），
     * 否则计入 actionableCount 与 nearestDeadline（同样取更早）。时间不可解析
     * 的归入 actionable（宁可提示用户去看一眼也不默默漏掉）。
     *
     * @returns {Map<courseId, {actionableCount, expiredCount, nearestDeadline, nearestExpiredDeadline, tasks}>}
     * [DEEP-DOC]
     */
    function xyCourseDashboardGroupPending(data, now = Date.now()) {
        const grouped = new Map();
        if (!Array.isArray(data)) return grouped;
        data.forEach(task => {
            const courseId = courseGroupKey(task?.group_id);
            if (!courseId) return;
            const current = grouped.get(courseId) || {
                actionableCount: 0,
                expiredCount: 0,
                nearestDeadline: null,
                nearestExpiredDeadline: null,
                tasks: []
            };
            const pendingTask = {
                title: String(task?.title || task?.name || '未命名任务'),
                endTime: task?.end_time || '',
                parentId: task?.parent_id === null || task?.parent_id === undefined ? '' : String(task.parent_id),
                nodeId: task?.node_id === null || task?.node_id === undefined ? '' : String(task.node_id)
            };
            const deadline = Date.parse(pendingTask.endTime);
            current.tasks.push(pendingTask);
            if (Number.isFinite(deadline) && deadline <= now) {
                current.expiredCount++;
                if (!current.nearestExpiredDeadline || deadline < current.nearestExpiredDeadline) {
                    current.nearestExpiredDeadline = deadline;
                }
            } else {
                current.actionableCount++;
                if (Number.isFinite(deadline) && (!current.nearestDeadline || deadline < current.nearestDeadline)) {
                    current.nearestDeadline = deadline;
                }
            }
            grouped.set(courseId, current);
        });
        return grouped;
    }
    /**
     * 单课程任务明细四分类构建。
     *
     * 去重策略：seenTaskKeys 以 nodeId 全局去重两轮——第一轮对 surveyTasks
     * 取已完成子集（排除 actionable/expired/unsubmitted 态），第二轮 pendingTasks
     * 剔除已完成键后按截止分 actionable（未过期或无截止）/ expired 两堆。
     * uncertainCount = 画像总数 − 已完成 − 可做 − 已截止（差值为平台统计与
     * 明细的缺口，展示为「状态待确认」组）。
     * [DEEP-DOC]
     */
    function xyCourseDashboardBuildTaskDetails(portrait, pendingTasks, surveyTasks, now = Date.now()) {
        const taskCount = Math.max(0, xyOverviewNumber(portrait?.taskCount));
        const completedCount = Math.min(taskCount, Math.max(0, xyOverviewNumber(portrait?.finishedCount)));
        const seenTaskKeys = new Set();
        const uniqueTasks = tasks => (Array.isArray(tasks) ? tasks : []).filter(task => {
            const key = String(task?.nodeId || task?.node_id || '').trim();
            if (!key) return true;
            if (seenTaskKeys.has(key)) return false;
            seenTaskKeys.add(key);
            return true;
        });
        const completed = uniqueTasks(surveyTasks).filter(task => !['actionable', 'expired', 'unsubmitted'].includes(task?.status?.key));
        const completedKeys = new Set(completed.map(task => String(task?.nodeId || task?.node_id || '').trim()).filter(Boolean));
        seenTaskKeys.clear();
        const pending = uniqueTasks(pendingTasks).filter(task => !completedKeys.has(String(task?.nodeId || task?.node_id || '').trim()));
        const actionable = pending.filter(task => {
            const deadline = Date.parse(task?.endTime || task?.end_time || '');
            return !Number.isFinite(deadline) || deadline > now;
        });
        const expired = pending.filter(task => !actionable.includes(task));
        return {
            completed,
            completedCount,
            actionable,
            expired,
            uncertainCount: Math.max(0, taskCount - completedCount - actionable.length - expired.length)
        };
    }
    /**
     * 课程任务概要三元组：画像必须 loaded 且存在才计算（否则返回 null 让
     * 调用方走骨架态）。taskCount/finishedCount 收敛钳制，actionable/expired
     * 尊重分组计数的 null 语义（未知），rate 为完成率百分比 [0,100]。
     * [DEEP-DOC]
     */
    function xyCourseDashboardTaskBreakdown(course) {
        if (course?.portraitState !== 'loaded' || !course.portrait) return null;
        const taskCount = Math.max(0, xyOverviewNumber(course.portrait.taskCount));
        const finishedCount = Math.min(taskCount, Math.max(0, xyOverviewNumber(course.portrait.finishedCount)));
        const actionableCount = course.pendingCount === null
            ? null
            : Math.max(0, xyOverviewNumber(course.pendingCount));
        const expiredCount = course.expiredCount === null
            ? null
            : Math.max(0, xyOverviewNumber(course.expiredCount));
        return {
            taskCount,
            finishedCount,
            actionableCount,
            expiredCount,
            rate: taskCount > 0 ? Math.min(100, Math.max(0, finishedCount / taskCount * 100)) : 0
        };
    }
    /**
     * 课程卡片排序比较器（非原地，拷贝排序）。
     *
     * 四级优先级：有待办(0) > 无可做但有已截止(1) > 完全清空(2) > 未知(3)；
     * 同级先比最近截止时间升序（更紧迫在前，Infinity 兜底排尾），再比任务总量
     * 降序（内容多的靠前），最后 sourceIndex 保稳定。
     * [DEEP-DOC]
     */
    function xyCourseDashboardSortCourses(items) {
        const getPriority = course => {
            if (course?.pendingCount > 0) return 0;
            if (course?.pendingCount === 0 && course?.expiredCount > 0) return 1;
            if (course?.pendingCount === 0) return 2;
            return 3;
        };
        const getTaskCount = course => {
            const taskCount = Number(course?.portrait?.taskCount);
            return Number.isFinite(taskCount) ? Math.max(0, taskCount) : 0;
        };
        const getDeadline = course => {
            const deadline = course?.pendingCount > 0 ? course.nearestDeadline : course?.nearestExpiredDeadline;
            return Number.isFinite(deadline) ? deadline : Number.POSITIVE_INFINITY;
        };
        return [...items].sort((left, right) => {
            const priorityDelta = getPriority(left.course) - getPriority(right.course);
            if (priorityDelta) return priorityDelta;
            const leftIndex = Number.isFinite(left.sourceIndex) ? left.sourceIndex : 0;
            const rightIndex = Number.isFinite(right.sourceIndex) ? right.sourceIndex : 0;
            const leftDeadline = getDeadline(left.course);
            const rightDeadline = getDeadline(right.course);
            if (leftDeadline !== rightDeadline) return leftDeadline - rightDeadline;
            const taskCountDelta = getTaskCount(right.course) - getTaskCount(left.course);
            return taskCountDelta || leftIndex - rightIndex;
        });
    }
    /**
     * 课程状态徽标推导（六态）：pendingCount 未知 → unknown「可做任务未知」；
     * >0 → pending「N 项可做」；expiredCount>0 → expired「N 项已截止」；
     * 无 breakdown → idle；taskCount=0 → empty「暂无任务」；全部完成 → complete。
     * [DEEP-DOC]
     */
    function xyCourseDashboardCourseStatus(course, breakdown) {
        if (course.pendingCount === null) return { key: 'unknown', label: '可做任务未知' };
        if (course.pendingCount > 0) return { key: 'pending', label: `${course.pendingCount} 项可做` };
        if (course.expiredCount > 0) return { key: 'expired', label: `${course.expiredCount} 项已截止` };
        if (!breakdown) return { key: 'idle', label: '暂无可做待办' };
        if (breakdown.taskCount === 0) return { key: 'empty', label: '暂无任务' };
        if (breakdown.finishedCount >= breakdown.taskCount) return { key: 'complete', label: '任务已完成' };
        return { key: 'idle', label: '暂无可做待办' };
    }
    /**
     * 并发受限映射工具（Promise 并发闸）。
     *
     * 启动 min(limit, items.length) 个 worker 协程共享 nextIndex 游标自旋取任务，
     * 结果按原下标写入保证顺序。任一 worker 抛错会整体 reject（Promise.all）。
     * 用于课程列表的逐课待办探测限流，防止几十个请求同时打爆接口。
     * [DEEP-DOC]
     */
    async function xyCourseDashboardMapLimit(items, limit, worker) {
        if (!Array.isArray(items) || !items.length) return [];
        const results = new Array(items.length);
        let nextIndex = 0;
        async function runWorker() {
            while (nextIndex < items.length) {
                const index = nextIndex++;
                results[index] = await worker(items[index], index);
            }
        }
        await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, runWorker));
        return results;
    }
    /**
     * 双重时效校验：requestSeq === 当前序号（未被更新的请求顶替）且当前仍在
     * 课程首页路由。两者都成立才允许把异步结果渲染上屏。
     * [DEEP-DOC]
     */
    function xyCourseDashboardIsCurrent(requestSeq) {
        return requestSeq === xyCourseDashboardState.requestSeq && isActiveCourseHomePage();
    }
    /**
     * 合帧防抖渲染调度：renderTimer 存在则直接返回；否则设 40ms 定时器，
     * 到期清标记并执行 xyCourseDashboardRender。同一帧内的多次脏标记合并为
     * 一次真实渲染，避免搜索输入等高频事件引发渲染风暴。
     * [DEEP-DOC]
     */
    function xyCourseDashboardScheduleRender() {
        if (xyCourseDashboardState.renderTimer) return;
        xyCourseDashboardState.renderTimer = setTimeout(() => {
            xyCourseDashboardState.renderTimer = null;
            xyCourseDashboardRender();
        }, 40);
    }
    /**
     * 缓存快照应用：深拷贝缓存里的课程数组（portrait 浅拷贝、pendingTasks
     * 逐条浅拷贝、taskGroupExpanded 展开），复位明细四态为 idle、展开态收起；
     * 同步 pendingAvailable/pendingError/error 与 cacheAppliedAt 时间戳，
     * 关闭 loading 后立即渲染。让二次进入页面瞬时呈现上次数据。
     * [DEEP-DOC]
     */
    function xyCourseDashboardApplyCache(cached) {
        xyCourseDashboardState.courses = cached.courses.map(course => ({
            ...course,
            portrait: course.portrait ? { ...course.portrait } : null,
            pendingTasks: Array.isArray(course.pendingTasks) ? course.pendingTasks.map(task => ({ ...task })) : [],
            taskDetailsExpanded: false,
            taskGroupExpanded: { ...(course.taskGroupExpanded || {}) },
            taskDetailsState: 'idle',
            taskDetails: null,
            taskDetailsError: ''
        }));
        xyCourseDashboardState.loadedCount = xyCourseDashboardState.courses.length;
        xyCourseDashboardState.pendingAvailable = cached.pendingAvailable;
        xyCourseDashboardState.pendingError = cached.pendingError;
        xyCourseDashboardState.error = '';
        xyCourseDashboardState.isLoading = false;
        xyCourseDashboardState.routeActive = true;
        xyCourseDashboardState.cacheAppliedAt = cached.loadedAt;
        xyCourseDashboardRender();
    }
    /**
     * 课程总览数据装载编排。
     *
     * 分支：不在首页直接返回；error 未清且 routeActive 时不再重复尝试（防死循环）
     * 返回 null；TTL(3min) 内缓存有效 → 已应用过就直接返回缓存，否则 ApplyCache
     * 秒开；过期/强制 → requestSeq 自增拉取：学生课程列表 + 全部课程的待办接口
     * + MapLimit 并发逐课资源探测，聚合出每课 pendingCount/expiredCount/
     * nearestDeadline，NormalizeCourses 去重归一后写入状态与缓存，最终渲染。
     * [DEEP-DOC]
     */
    async function xyCourseDashboardLoad(force = false) {
        if (!isActiveCourseHomePage()) return;
        if (!force && xyCourseDashboardState.routeActive && xyCourseDashboardState.error) return null;
        const cached = xyCourseDashboardState.cache;
        if (!force && cached && Date.now() - cached.loadedAt < xyCourseDashboardState.cacheTtl) {
            if (xyCourseDashboardState.routeActive && xyCourseDashboardState.cacheAppliedAt === cached.loadedAt) return cached;
            xyCourseDashboardApplyCache(cached);
            return cached;
        }
        if (!force && xyCourseDashboardState.promise) return xyCourseDashboardState.promise;

        const requestSeq = ++xyCourseDashboardState.requestSeq;
        xyCourseDashboardState.routeActive = true;
        xyCourseDashboardState.isLoading = true;
        xyCourseDashboardState.error = '';
        xyCourseDashboardState.pendingError = '';
        xyCourseDashboardState.pendingAvailable = true;
        xyCourseDashboardState.loadedCount = 0;
        xyCourseDashboardState.courses = [];
        xyCourseDashboardRender();

        const loadPromise = (async () => {
            const [courseResult, pendingResult, userResult] = await Promise.allSettled([
                xyOverviewFetchJson('/api/jx-iresource/group/student/groups?time_flag=1'),
                xyOverviewFetchJson('/api/jx-stat/group/task/un_finish'),
                xyOverviewGetUserId()
            ]);
            if (courseResult.status === 'rejected') throw courseResult.reason;

            const courses = xyCourseDashboardNormalizeCourses(courseResult.value);
            const pendingAvailable = pendingResult.status === 'fulfilled';
            const pendingError = pendingAvailable ? '' : xyOverviewErrorMessage(pendingResult.reason);
            const pendingGroups = pendingAvailable ? xyCourseDashboardGroupPending(pendingResult.value) : new Map();
            courses.forEach(course => {
                const pending = pendingGroups.get(course.courseId);
                course.pendingCount = pendingAvailable ? (pending?.actionableCount || 0) : null;
                course.expiredCount = pendingAvailable ? (pending?.expiredCount || 0) : null;
                course.nearestDeadline = pending?.nearestDeadline || null;
                course.nearestExpiredDeadline = pending?.nearestExpiredDeadline || null;
                course.pendingTasks = pendingAvailable ? (pending?.tasks || []).map(task => ({ ...task })) : [];
            });

            if (!xyCourseDashboardIsCurrent(requestSeq)) return null;
            xyCourseDashboardState.courses = courses;
            xyCourseDashboardState.pendingAvailable = pendingAvailable;
            xyCourseDashboardState.pendingError = pendingError;
            if (!pendingAvailable && xyCourseDashboardState.filter !== 'all') xyCourseDashboardState.filter = 'all';
            xyCourseDashboardRender();

            if (!courses.length) {
                xyCourseDashboardState.isLoading = false;
                xyCourseDashboardState.cache = { loadedAt: Date.now(), courses: [], pendingAvailable, pendingError };
                xyCourseDashboardState.cacheAppliedAt = xyCourseDashboardState.cache.loadedAt;
                xyCourseDashboardRender();
                return xyCourseDashboardState.cache;
            }

            let settledCount = 0;
            await xyCourseDashboardMapLimit(courses, 4, async course => {
                try {
                    if (userResult.status === 'rejected') throw userResult.reason;
                    const portraitData = await xyOverviewFetchJson(
                        `/api/jx-stat/ads/user/student?group_id=${encodeURIComponent(course.courseId)}&user_id=${encodeURIComponent(userResult.value)}`
                    );
                    course.portrait = xyOverviewNormalizePortrait(portraitData);
                    course.portraitState = 'loaded';
                } catch (error) {
                    course.portrait = null;
                    course.portraitState = 'error';
                    course.portraitError = xyOverviewErrorMessage(error);
                } finally {
                    settledCount++;
                    if (xyCourseDashboardIsCurrent(requestSeq)) {
                        xyCourseDashboardState.loadedCount = settledCount;
                        xyCourseDashboardScheduleRender();
                    }
                }
                return course;
            });

            if (!xyCourseDashboardIsCurrent(requestSeq)) return null;
            xyCourseDashboardState.loadedCount = courses.length;
            xyCourseDashboardState.isLoading = false;
            xyCourseDashboardState.cache = {
                loadedAt: Date.now(),
                courses: courses.map(course => ({ ...course, portrait: course.portrait ? { ...course.portrait } : null })),
                pendingAvailable,
                pendingError
            };
            xyCourseDashboardState.cacheAppliedAt = xyCourseDashboardState.cache.loadedAt;
            xyCourseDashboardRender();
            return xyCourseDashboardState.cache;
        })();

        xyCourseDashboardState.promise = loadPromise;
        try {
            return await loadPromise;
        } catch (error) {
            if (xyCourseDashboardIsCurrent(requestSeq)) {
                xyCourseDashboardState.isLoading = false;
                xyCourseDashboardState.error = xyOverviewErrorMessage(error);
                xyCourseDashboardRender();
            }
            return null;
        } finally {
            if (xyCourseDashboardState.promise === loadPromise) xyCourseDashboardState.promise = null;
        }
    }
    /** 清空仪表盘缓存并强制重新 Load（绕过 TTL 与错误短路）。
     * [DEEP-DOC]
     */
    function xyCourseDashboardRefresh() {
        xyCourseDashboardState.cache = null;
        void xyCourseDashboardLoad(true);
    }
    /**
     * 单课程任务明细装载：已 loaded 且非 force 直接返回；置 loading 态触发
     * 行内 spinner → 并发拉该课画像与作业/待办 → BuildTaskDetails 四分类 →
     * 写回 course.taskDetails 并切 loaded/error。竞态由 IsCurrent 校验兜底。
     * [DEEP-DOC]
     */
    async function xyCourseDashboardLoadTaskDetails(course, force = false) {
        if (!course?.courseId || (!force && (course.taskDetailsState === 'loaded' || course.taskDetailsState === 'loading'))) return;
        course.taskDetailsState = 'loading';
        course.taskDetailsError = '';
        xyCourseDashboardRender();
        try {
            const data = await xyOverviewFetchJson(
                `/api/jx-stat/group/task/survey/student?group_id=${encodeURIComponent(course.courseId)}`
            );
            course.taskDetails = xyCourseDashboardBuildTaskDetails(
                course.portrait,
                course.pendingTasks,
                xyOverviewNormalizeTasks(data)
            );
            course.taskDetailsState = 'loaded';
        } catch (error) {
            course.taskDetails = null;
            course.taskDetailsError = xyOverviewErrorMessage(error);
            course.taskDetailsState = 'error';
        }
        xyCourseDashboardRender();
    }
    /** 从课程卡片的任务行点击进入具体任务节点（复用概览的三元组导航）。
     * [DEEP-DOC]
     */
    async function xyCourseDashboardOpenTask(course, task) {
        const nodeId = normalizeDownloadId(task?.nodeId);
        if (!course?.courseId || !nodeId) {
            showToast('该任务缺少跳转信息', 'warning');
            return;
        }
        let parentId = normalizeDownloadId(task.parentId);
        if (!parentId) {
            const resources = await loadCourseResources(course.courseId);
            parentId = xyCourseDashboardResolveTaskParentId(resources, nodeId);
        }
        if (!parentId) {
            showToast('未能在课程资源中定位该任务', 'warning');
            return;
        }
        xyOverviewOpenTask(course.courseId, parentId, nodeId);
    }
    /** 翻转课程卡片的 taskDetailsExpanded 标记并触发合帧重渲；首开时若明细未装载自动拉取。
     * [DEEP-DOC]
     */
    function xyCourseDashboardToggleTaskDetails(course) {
        if (!course) return;
        course.taskDetailsExpanded = !course.taskDetailsExpanded;
        if (course.taskDetailsExpanded && course.taskDetailsState !== 'loaded') {
            void xyCourseDashboardLoadTaskDetails(course);
            return;
        }
        xyCourseDashboardRender();
    }
    /** 离开课程首页时的清理：routeActive=false 复位活动标志，进行中的请求靠 IsCurrent 自然失效。
     * [DEEP-DOC]
     */
    function xyCourseDashboardDeactivate() {
        if (!xyCourseDashboardState.routeActive && !xyCourseDashboardState.isLoading) return;
        xyCourseDashboardState.routeActive = false;
        xyCourseDashboardState.isLoading = false;
        xyCourseDashboardState.promise = null;
        xyCourseDashboardState.requestSeq++;
        if (xyCourseDashboardState.renderTimer) {
            clearTimeout(xyCourseDashboardState.renderTimer);
            xyCourseDashboardState.renderTimer = null;
        }
    }
    /** 截止时间人性化短文案：「今天 HH:mm」/「明天 HH:mm」/「M月D日 HH:mm」；解析失败返回空串。
     * [DEEP-DOC]
     */
    function xyCourseDashboardFormatDeadline(value) {
        if (!Number.isFinite(value)) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const now = new Date();
        const isToday = date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate();
        const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        return isToday ? `今天 ${time}` : `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
    }
    /**
     * 任务明细单行 HTML：type 参数决定样式类（completed/actionable/expired/
     * uncertain 各配色）与主信息列内容——已完成显示得分或状态标签，其余显示
     * 「截止：{时间}」。可打开的任务生成按钮结构，缺失 nodeId 的降级禁用态。
     * [DEEP-DOC]
     */
    function xyCourseDashboardRenderTaskDetailRow(task, type, taskIndex) {
        const canOpen = !!task?.nodeId;
        const isCompleted = type === 'completed';
        const score = task?.status?.key === 'graded'
            ? `${task.myScore ?? 0} / ${task.totalScore ?? 0}`
            : (isCompleted ? (task?.status?.label || '已完成') : `截止：${xyCourseDashboardFormatDeadline(Date.parse(task?.endTime || '')) || '待确认'}`);
        const statusLabel = isCompleted ? (task?.status?.label || '已完成') : (type === 'expired' ? '已截止' : '未完成');
        return `
            <button type="button" class="xy-course-dashboard-task is-${type}${canOpen ? '' : ' is-static'}"
                data-course-task-type="${type}" data-course-task-index="${taskIndex}" ${canOpen ? '' : 'disabled'}>
                <span class="xy-course-dashboard-task-title">${escapeHtml(task?.title || '未命名任务')}</span>
                <span class="xy-course-dashboard-task-meta">${escapeHtml(score)}</span>
                <span class="xy-course-dashboard-task-status">${escapeHtml(statusLabel)}</span>
            </button>`;
    }
    /** 明细区容器渲染：renderGroup 工厂按四分类各生成一组（组头计数+折叠记忆+行列表），拼进卡片 body。
     * [DEEP-DOC]
     */
    function xyCourseDashboardRenderTaskDetails(course, sourceIndex, breakdown) {
        if (!breakdown) return '';
        const expanded = course.taskDetailsExpanded === true;
        const summary = breakdown.actionableCount === null
            ? `已完成 ${breakdown.finishedCount} / ${breakdown.taskCount} · 待办状态暂不可用`
            : `已完成 ${breakdown.finishedCount} / ${breakdown.taskCount} · 未完成 ${breakdown.actionableCount} · 已截止 ${breakdown.expiredCount}`;
        let body = '';
        if (expanded && course.taskDetailsState === 'loading') {
            body = '<div class="xy-course-dashboard-details-state"><span class="xy-overview-spinner" aria-hidden="true"></span>正在读取任务明细...</div>';
        } else if (expanded && course.taskDetailsState === 'error') {
            body = `<div class="xy-course-dashboard-details-state is-error"><span>任务明细读取失败：${escapeHtml(course.taskDetailsError || '请稍后重试')}</span><button class="xy-mini-btn" type="button" data-course-action="retry-details">重试</button></div>`;
        } else if (expanded && course.taskDetails) {
            const details = course.taskDetails;
            const taskGroupExpanded = course.taskGroupExpanded || (course.taskGroupExpanded = {});
            const renderGroup = (type, label, count, tasks, extra = '') => {
                if (!count) return '';
                const rows = tasks.map((task, index) => xyCourseDashboardRenderTaskDetailRow(task, type, index)).join('');
                const isOpen = taskGroupExpanded[type] !== false;
                return `
                    <details class="xy-course-dashboard-task-group is-${type}" data-course-task-group-type="${type}" ${isOpen ? 'open' : ''}>
                        <summary><span>${label}</span><em>${count} 项</em></summary>
                        <div class="xy-course-dashboard-task-list">${rows || '<div class="xy-course-dashboard-task-note">暂无可命名任务</div>'}${extra}</div>
                    </details>`;
            };
            const unnamedCompleted = Math.max(0, details.completedCount - details.completed.length);
            const completedExtra = unnamedCompleted
                ? `<div class="xy-course-dashboard-task-note">另有 ${unnamedCompleted} 项已完成任务未返回名称或跳转信息。</div>`
                : '';
            const uncertainExtra = details.uncertainCount
                ? '<div class="xy-course-dashboard-task-note">平台统计包含这些任务，但两个任务接口都未返回名称或跳转信息。</div>'
                : '';
            body = `<div class="xy-course-dashboard-task-groups">
                ${renderGroup('completed', '已完成', details.completedCount, details.completed, completedExtra)}
                ${renderGroup('actionable', '未完成', details.actionable.length, details.actionable)}
                ${renderGroup('expired', '已截止', details.expired.length, details.expired)}
                ${renderGroup('uncertain', '状态待确认', details.uncertainCount, [], uncertainExtra)}
            </div>`;
        }
        return `
            <div class="xy-course-dashboard-details-wrap">
                <button class="xy-course-dashboard-details-toggle" type="button" data-course-action="details"
                    aria-expanded="${course.taskDetailsExpanded ? 'true' : 'false'}" aria-controls="xy-course-dashboard-details-${sourceIndex}">
                    <span>任务明细</span><span>${escapeHtml(summary)}</span>
                </button>
                ${expanded ? `<div id="xy-course-dashboard-details-${sourceIndex}" class="xy-course-dashboard-details">${body}</div>` : ''}
            </div>`;
    }
    /**
     * 可见课程集过滤：搜索词（名称包含，大小写不敏感）∩ 筛选器
     * （all 全部 / pending 有待办 / no-pending 无待办）。两个条件独立可选。
     * [DEEP-DOC]
     */
    function xyCourseDashboardVisibleCourses() {
        const query = xyCourseDashboardState.query.trim().toLocaleLowerCase('zh-CN');
        const visibleCourses = xyCourseDashboardState.courses
            .map((course, sourceIndex) => ({ course, sourceIndex }))
            .filter(({ course }) => {
                if (query && !course.courseName.toLocaleLowerCase('zh-CN').includes(query)) return false;
                if (xyCourseDashboardState.filter === 'pending') return course.pendingCount > 0;
                if (xyCourseDashboardState.filter === 'no-pending') return course.pendingCount === 0;
                return true;
            });
        return xyCourseDashboardSortCourses(visibleCourses);
    }
    /** 顶部统计摘要渲染：总课程数与各类计数汇总文案。
     * [DEEP-DOC]
     */
    function xyCourseDashboardRenderSummary() {
        const summary = document.getElementById('xy-course-dashboard-summary');
        if (!summary) return;
        const courses = xyCourseDashboardState.courses;
        const initialLoading = xyCourseDashboardState.isLoading && !courses.length;
        const portraitsSettled = !xyCourseDashboardState.isLoading && xyCourseDashboardState.loadedCount >= courses.length;
        const hasPortraitErrors = courses.some(course => course.portraitState === 'error');
        const portraitCourses = courses.filter(course => course.portraitState === 'loaded' && course.portrait);
        const taskCount = portraitCourses.reduce((sum, course) => sum + course.portrait.taskCount, 0);
        const finishedCount = portraitCourses.reduce((sum, course) => sum + course.portrait.finishedCount, 0);
        const duration = portraitCourses.reduce((sum, course) => sum + course.portrait.duration, 0);
        const completionValue = portraitsSettled
            ? (taskCount > 0 ? `${Math.round(finishedCount / taskCount * 100)}%` : (portraitCourses.length ? '暂无任务' : '暂不可用'))
            : '读取中';
        const durationValue = portraitsSettled
            ? (duration > 0 ? xyOverviewFormatMinutes(duration) : (portraitCourses.length ? '暂无记录' : '暂不可用'))
            : '读取中';
        const portraitCoverage = portraitsSettled && hasPortraitErrors ? ` · 已读取 ${portraitCourses.length}/${courses.length} 门` : '';
        const pendingValue = initialLoading
            ? '读取中'
            : xyCourseDashboardState.pendingAvailable
            ? String(courses.reduce((sum, course) => sum + (course.pendingCount || 0), 0))
            : '暂不可用';
        const metrics = xyCourseDashboardState.error ? [
            ['进行中课程', '—'],
            ['当前可做待办', '—'],
            ['任务完成率', '—'],
            ['累计学习时长', '—']
        ] : [
            ['进行中课程', initialLoading ? '读取中' : String(courses.length)],
            ['当前可做待办', pendingValue],
            [`任务完成率${portraitCoverage}`, completionValue],
            [`累计学习时长${portraitCoverage}`, durationValue]
        ];
        summary.innerHTML = metrics.map(([label, value]) => `
            <div class="xy-course-dashboard-metric">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
            </div>`).join('');
    }
    /**
     * 课程总览主渲染器：今日提示区块（RenderToday）→ 统计摘要 → 搜索框与
     * 筛选器同步选中态 → 排序后的课程卡片列表（SortCourses → VisibleCourses
     * 过滤 → 卡片 HTML：名称/学期/状态徽标/学情按钮/任务明细插槽）→
     * 底部加载状态条。全程 escapeHtml 包裹动态文本。
     * [DEEP-DOC]
     */
    function xyCourseDashboardRender() {
        const list = document.getElementById('xy-course-dashboard-list');
        const loadState = document.getElementById('xy-course-dashboard-load-state');
        if (!list || !loadState) return;

        const search = document.getElementById('xy-course-dashboard-search');
        if (search && search.value !== xyCourseDashboardState.query) search.value = xyCourseDashboardState.query;
        document.querySelectorAll('#xy-course-dashboard-filters [data-course-filter]').forEach(button => {
            const active = button.getAttribute('data-course-filter') === xyCourseDashboardState.filter;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.disabled = !xyCourseDashboardState.pendingAvailable && button.getAttribute('data-course-filter') !== 'all';
        });

        if (xyCourseDashboardState.error) {
            loadState.textContent = '读取失败';
            xyCourseDashboardRenderSummary();
            xyCourseDashboardRenderToday();
            list.innerHTML = `
                <div class="xy-course-dashboard-state is-error">
                    <strong>课程列表读取失败</strong>
                    <span>${escapeHtml(xyCourseDashboardState.error)}</span>
                    <button class="xy-mini-btn" type="button" data-course-action="retry">重新加载</button>
                </div>`;
            return;
        }

        if (xyCourseDashboardState.isLoading) {
            loadState.textContent = xyCourseDashboardState.courses.length
                ? `已读取 ${xyCourseDashboardState.loadedCount} / ${xyCourseDashboardState.courses.length}`
                : '正在读取课程...';
        } else if (!xyCourseDashboardState.pendingAvailable) {
            loadState.textContent = '课程已读取 · 可做任务暂不可用';
        } else {
            loadState.textContent = '可做任务状态已更新';
        }
        xyCourseDashboardRenderSummary();
        xyCourseDashboardRenderToday();

        if (xyCourseDashboardState.isLoading && !xyCourseDashboardState.courses.length) {
            list.innerHTML = `
                <div class="xy-course-dashboard-state">
                    <span class="xy-overview-spinner" aria-hidden="true"></span>
                    <span>正在汇总进行中课程...</span>
                </div>`;
            return;
        }
        if (!xyCourseDashboardState.courses.length) {
            list.innerHTML = '<div class="xy-course-dashboard-state">当前没有正在进行的课程</div>';
            return;
        }

        const visibleCourses = xyCourseDashboardVisibleCourses();
        if (!visibleCourses.length) {
            list.innerHTML = '<div class="xy-course-dashboard-state">没有符合当前条件的课程</div>';
            return;
        }

        // 声明式渲染：课程卡片组件树（vdom 微内核），keyed 复用 DOM 节点。
        // data-course-index / data-course-action 属性与事件委托约定保持不变。
        const cardOf = ({ course, sourceIndex }) => {
            const breakdown = xyCourseDashboardTaskBreakdown(course);
            const courseStatus = xyCourseDashboardCourseStatus(course, breakdown);
            const deadline = xyCourseDashboardFormatDeadline(course.nearestDeadline);
            let portraitChildren = [h('div', { class: 'xy-course-dashboard-course-meta' }, '正在读取完成度与学习时长...')];
            if (course.portraitState === 'error') {
                portraitChildren = [h('div', { class: 'xy-course-dashboard-course-meta is-error' }, '完成度与学习时长暂不可用')];
            } else if (breakdown) {
                const duration = course.portrait.duration > 0 ? xyOverviewFormatMinutes(course.portrait.duration) : '暂无时长';
                const breakdownText = breakdown.actionableCount === null
                    ? `已完成 ${breakdown.finishedCount} / ${breakdown.taskCount} · 可做与截止暂不可用`
                    : `已完成 ${breakdown.finishedCount} / ${breakdown.taskCount} · 未完成 ${breakdown.actionableCount} · 已截止 ${breakdown.expiredCount}`;
                const progressNode = breakdown.taskCount > 0
                    ? h('div', { class: 'xy-course-dashboard-progress', role: 'progressbar', 'aria-label': '课程任务完成度', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(breakdown.rate) },
                        h('span', { style: `width:${breakdown.rate}%` }))
                    : null;
                portraitChildren = [
                    progressNode,
                    h('div', { class: 'xy-course-dashboard-course-meta' },
                        h('span', {}, breakdown.taskCount > 0 ? breakdownText : '暂无任务'),
                        h('span', {}, duration)),
                ];
            }
            return h('div', { class: 'xy-course-dashboard-course', 'data-course-index': sourceIndex },
                h('div', { class: 'xy-course-dashboard-course-main', role: 'link', tabindex: 0 },
                    h('div', { class: 'xy-course-dashboard-course-head' },
                        h('strong', {}, course.courseName),
                        h('span', { class: `xy-course-dashboard-status is-${courseStatus.key}` }, courseStatus.label)),
                    course.termName ? h('div', { class: 'xy-course-dashboard-term' }, course.termName) : null,
                    ...portraitChildren.filter(Boolean),
                    deadline ? h('div', { class: 'xy-course-dashboard-deadline' }, `最近待办截止：${deadline}`) : null),
                // 过渡桥接：任务明细子视图暂为 HTML 字符串产出，经 innerHTML 注入
                h('div', { innerHTMLBridge: xyCourseDashboardRenderTaskDetails(course, sourceIndex, breakdown) }),
                h('div', { class: 'xy-course-dashboard-actions' },
                    h('button', { class: 'xy-mini-btn', type: 'button', 'data-course-action': 'enter' }, '进入课程'),
                    h('button', { class: 'xy-mini-btn', type: 'button', 'data-course-action': 'overview' }, '学情')));
        };
        list.textContent = '';
        visibleCourses.map(cardOf).forEach(cardNode => {
            list.appendChild(createEl(cardNode));
        });
    }
    /** 用户名净化：String 化去首尾空白，压缩内部连续空白，空结果兜底「匿名」。讨论区名单入库前的最后一道清洗。
     * [DEEP-DOC]
     */
    function cleanName(str) { if (!str) return ""; return str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim(); }
    /**
     * HTML 转义五字符集（& < > " '）。本脚本所有 innerHTML 拼插点的动态文本
     * 都必须经过它——XSS 防线的唯一入口约定。
     * @param {string} s - 任意输入（nullish 安全，转 String 处理）
     * [DEEP-DOC]
     */
    function escapeHtml(value) { if (value === null || value === undefined) return ''; const div = document.createElement('div'); div.textContent = String(value); return div.innerHTML; }
    /**
     * 下载 ID 归一化：nullish 直接 null；String 化 trim 后空串也返回 null。
     * 全下载域的资源标识统一出口，勾选集(Set)/查找/URL 拼接都以它的输出为键。
     * [DEEP-DOC]
     */
    function normalizeDownloadId(value) {
        if (value === null || value === undefined) return null;
        const id = String(value).trim();
        return id ? id : null;
    }
    /**
     * 资源对象 → 下载资源 ID：按 id → resource_id → file_id 顺序探测首个
     * 可归一化的值。云盘文件换直链（file_url/{quote_id}）之外的第二身份来源。
     * @returns {string|null}
     * [DEEP-DOC]
     */
    function dlResourceId(resource) {
        if (!resource || typeof resource !== 'object') return null;
        return normalizeDownloadId(resource.id)
            ?? normalizeDownloadId(resource.resource_id)
            ?? normalizeDownloadId(resource.node_id)
            ?? normalizeDownloadId(resource.resourceId)
            ?? normalizeDownloadId(resource.nodeId);
    }
    /**
     * 引用 ID 提取：quote_id → quoteId 字段顺序探测，均缺时回退 dlResourceId
     * （部分资源 quote 与 resource 同值）。file_url 接口的路径参数即此值。
     * [DEEP-DOC]
     */
    function dlQuoteId(resource) {
        if (!resource || typeof resource !== 'object') return null;
        return normalizeDownloadId(resource.quote_id)
            ?? normalizeDownloadId(resource.quoteId)
            ?? dlResourceId(resource);
    }
    /**
     * 资源树子节点遍历抽象：平台树结构的子节点可能挂在 children / child_nodes /
     * items 任一字段，此函数把三种形态收敛为单一数组输出，上层 walk 逻辑
     * 无需关心字段差异。
     * [DEEP-DOC]
     */
    function dlResourceValues(value) {
        if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object');
        if (!value || typeof value !== 'object') return [];
        if (dlResourceId(value) !== null || dlQuoteId(value) !== null || value.name || value.title) return [value];
        return Object.values(value).filter(item => item && typeof item === 'object');
    }
    /**
     * 资源树全量扁平收集（带 id 去重）：递归 dlResourceValues 三形态子节点，
     * 以 id:xxx 为键（无 id 的对象引用兜底）seen 集合去重。供父目录反查等
     * 需要无视层级的全局资源视图的场景。
     * [DEEP-DOC]
     */
    function dlCollectResources(value) {
        const result = [];
        const seen = new Set();
        const walk = input => {
            dlResourceValues(input).forEach(item => {
                const id = dlResourceId(item);
                const key = id !== null ? `id:${id}` : item;
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(item);
                }
                walk(item.children);
                walk(item.child_nodes);
                walk(item.items);
            });
        };
        walk(value);
        return result;
    }
    /** 正则元字符转义：.*+?^${}()|[]\\ 全集前置反斜杠。用于把用户输入安全嵌入动态 RegExp（如名单搜索词）。
     * [DEEP-DOC]
     */
    function escapeRegex(str) { if (!str) return ''; return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    /**
     * 课程名查询（group visit 接口）：POST group_id + role_type:'normal'，
     * success 且 data.name 存在才返回名字；token 缺失/groupId 空/网络异常
     * 一律静默返回 null（课程名是锦上添花字段，不允许它拖垮主流程）。
     * [DEEP-DOC]
     */
    async function getCourseNameFromAPI(groupId) {
        try {
            const token = getCookie();
            if (!token || !groupId) return null;
            const res = await fetch(`https://${domain}/api/jx-iresource/statistics/group/visit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({ group_id: groupId, role_type: 'normal' })
            });
            const data = await res.json();
            return (data.success && data.data && data.data.name) ? data.data.name : null;
        } catch(e) { console.warn('[小雅] 课程名接口请求失败:', e); return null; }
    }
    /**
     * 生效主题解析：theme='auto' 时按小时映射（6-17 点 light，其余 dark）；
     * 显式 'light'/'dark' 直接返回。所有取色点经 T() 间接消费本函数结果。
     * @returns {'light'|'dark'}
     * [DEEP-DOC]
     */
    function resolveTheme() {
        if (settingsState.theme === 'auto') {
            const h = new Date().getHours();
            return (h >= 6 && h < 18) ? 'light' : 'dark';
        }
        return settingsState.theme;
    }
    /**
     * 双主题取色函数 —— UI 层使用频率最高的工具。
     *
     * @param {string} dark - 深色主题下的取值（颜色/渐变/阴影任意 CSS 值）
     * @param {string} light - 浅色主题下的取值
     * @returns {string} 按当前生效主题选择的变体
     *
     * 约定：所有模板字符串里的动态配色都必须经 T() 包裹，禁止裸写色值，
     * 否则主题切换后该处颜色失效（整页 reload 生效机制下的静态快照）。
     * [DEEP-DOC]
     */
    function T(dark, light) { return resolveTheme() === 'light' ? light : dark; }

    let _lastEffectiveTheme = null;
    /**
     * 主题 class 应用：面板根节点加/移除 xy-theme-light 类驱动 CSS 变量切换；
     * 同时更新主题按钮图标（☀️/🌙）与 title 提示（三态：自动(当前生效)/浅色/深色）。
     * [DEEP-DOC]
     */
    function applyThemeClasses() {
        const wrapper = document.getElementById('xy-super-console');
        if (!wrapper) return;
        const effective = resolveTheme();
        _lastEffectiveTheme = effective;
        if (effective === 'light') {
            wrapper.classList.add('xy-theme-light');
        } else {
            wrapper.classList.remove('xy-theme-light');
        }
        
        const btn = document.getElementById('xy-theme-toggle');
        if (btn) {
            if (settingsState.theme === 'auto') {
                btn.textContent = effective === 'light' ? '☀️' : '🌙';
                btn.title = '自动模式 (' + effective + ') - 点击切换';
            } else if (settingsState.theme === 'light') {
                btn.textContent = '☀️'; btn.title = '浅色模式 - 点击切换';
            } else {
                btn.textContent = '🌙'; btn.title = '深色模式 - 点击切换';
            }
        }
    }
    /**
     * 主题切换执行：生效主题与上次一致直接返回（避免无谓 reload）；变化时整页
     * window.location.reload()——因为面板 CSS 是初始一次性注入的，reload 是
     * 最可靠的变量刷新手段（代价是页面重载，故只在真实翻转时触发）。
     * [DEEP-DOC]
     */
    function applyTheme() {
        const effective = resolveTheme();
        if (_lastEffectiveTheme === effective) return;

        
        window.location.reload();
    }

    const originalTitle = document.title;
    /**
     * 标签页标题状态机：
     *   调度运行中 → 「[i/n] 计划调度 · 任务名前10字」（截断防超长）
     *   course 区 → video 引擎显示播放百分比+循环/连播标记；doc 引擎显示阅读
     *               进度百分比或达标 ✓；其他引擎显示通用挂机标记
     *   disc 区   → 「[N人] 讨论区」（名单规模一目了然）
     *   其余      → 还原 originalTitle（模块加载时保存的原始标题）
     * [DEEP-DOC]
     */
    function updateTitleBar() {
        if (xyScheduleState.isRunning) {
            const cur = xyScheduleState.queue[xyScheduleState.currentIdx];
            const name = cur ? cur.name.substring(0, 10) : '...';
            document.title = `[${xyScheduleState.currentIdx + 1}/${xyScheduleState.queue.length}] 计划调度 · ${name}`;
            return;
        }
        if (playState.activeZone === ZONE.COURSE) {
            const taskType = playState.currentEngine;
            if (taskType === TASK_TYPE.VIDEO) {
                let video = document.querySelector('video');
                if (video && video.duration) {
                    const pct = Math.round((video.currentTime / video.duration) * 100);
                    document.title = `[${pct}%] ${playState.mode === PLAY_MODE.LOOP ? '循环' : '连播'}挂机中`;
                } else {
                    document.title = '[视频] 挂机中';
                }
            } else if (taskType === TASK_TYPE.DOC) {
                const pct = Math.min(Math.round((playState.docReadTime / DOC_READ.SUBMIT_SECONDS) * 100), 100);
                document.title = playState.isTaskCompleted ? '[✓] 文档已达标' : `[${pct}%] 文档阅读中`;
            } else {
                document.title = playState.isTaskCompleted ? '[✓] 已达标' : '[·] 挂机中';
            }
        } else if (playState.activeZone === ZONE.DISC) {
            document.title = `[${discState.targetNames.length}人] 讨论区`;
        } else {
            document.title = originalTitle;
        }
    }
    /**
     * 讨论区昵称解码器（平台私有编码）：base64 解码 → UTF-8 还原 → 字符序列
     * 整体反转。旧版兼容路径：TextDecoder 不可用或解码失败时退回
     * decodeURIComponent(escape(atob(...))) 组合。最终经 cleanName 净化。
     * @returns {string} 解码后的真实姓名（失败兜底「匿名」）
     * [DEEP-DOC]
     */
    function decodeNickname(encodedStr) {
        if (!encodedStr) return "匿名"; let res = encodedStr;
        try { res = new TextDecoder().decode(Uint8Array.from(atob(encodedStr), c => c.charCodeAt(0))).split('').reverse().join(''); } catch(e) { try { res = decodeURIComponent(escape(atob(encodedStr))).split('').reverse().join(''); } catch (err) {} }
        return cleanName(res);
    }
    /**
     * 下载域的资源树深度优先提取器。
     *
     * 遍历规则：dlResourceValues 抽取子节点递归 walk，同时维护 unitPath
     * （途经的非文件节点名栈）与 idPath（ID 栈，缺失时用 __seq 占位保证路径唯一）；
     * 文件判定：task_type ∈ [2,5] 直接保留（平台标记的媒体/文档任务），
     * 否则按 MEDIA/DOC 扩展名白名单匹配（type 字段不可靠是已知坑）。保留项克隆
     * 并附加元数据：computed_task_type、__order（遍历序）、__unitPath、__idPath、
     * __path（原始 path 或 idPath 拼接）、__sortPos、__parentId 与多字段兼容的
     * __createdAt 时间戳。输出扁平文件数组供下载列表与目录树共用。
     * [DEEP-DOC]
     */
    function extractFilesFromResources(arr) {
        let res = [];
        let __seq = 0;
        const FILE_EXT_RE = SHARED_PATTERNS.WATCH;
        function walk(list, unitPath, idPath) {
            dlResourceValues(list).forEach(item => {
                const seg = (item.name || item.title || '').trim();
                
                const nextUnitPath = (seg && !FILE_EXT_RE.test(seg)) ? unitPath.concat(seg) : unitPath;
                
                const itemId = dlResourceId(item);
                const nextIdPath = idPath.concat(itemId ?? '__x' + __seq);
                if (item.children) walk(item.children, nextUnitPath, nextIdPath);
                if (item.child_nodes) walk(item.child_nodes, nextUnitPath, nextIdPath);
                if (item.items) walk(item.items, nextUnitPath, nextIdPath);

                const type = item.task_type !== undefined ? item.task_type : item.type;
                if (type === undefined || type === null) return;

                const name = (item.name || item.title || '').toLowerCase();

                
                let keep = false;
                if (type >= 2 && type <= 5) {
                    keep = true;
                }
                
                else {
                    const isMedia = SHARED_PATTERNS.MEDIA.test(name);
                    const isDoc = SHARED_PATTERNS.DOC.test(name);
                    
                    if (isMedia || isDoc) keep = true;
                }

                if (keep) {
                    const cleanItem = Object.assign({}, item);
                    cleanItem.computed_task_type = (type >= 2 && type <= 5) ? type : 1; 
                    cleanItem.__order = __seq++;
                    cleanItem.__unitPath = unitPath;
                    cleanItem.__idPath = nextIdPath;
                    cleanItem.__path = item.path || nextIdPath.join('/');
                    cleanItem.__sortPos = item.sort_position;
                    cleanItem.__parentId = item.parent_id;
                    
                    const rawT = item.created_at ?? item.create_time ?? item.createdAt ?? item.update_time ?? item.updated_at ?? item.updatedAt ?? item.publish_time ?? item.time;
                    if (rawT !== undefined && rawT !== null && rawT !== '') cleanItem.__createdAt = rawT;
                    res.push(cleanItem);
                }
            });
        }
        walk(arr, [], []);
        return res;
    }
    /**
     * 单元排序映射构建：递归资源树，遇到单元目录按出现顺序编号写入 map
     * （单元名 → 序号）。该映射是 dlUnitCompare 排序时「同级单元先后」的依据。
     * [DEEP-DOC]
     */
    function dlBuildSortMap(nodes, map) {
        dlResourceValues(nodes).forEach(n => {
            const id = dlResourceId(n);
            if (id !== null) map[id] = Number(n.sort_position) || 0;
            if (n && n.children) dlBuildSortMap(n.children, map);
            if (n && n.child_nodes) dlBuildSortMap(n.child_nodes, map);
            if (n && n.items) dlBuildSortMap(n.items, map);
        });
        return map;
    }
    /**
     * 概览缓存即时渲染：切入 overview 区时先取 xyOverviewState.currentData
     * （上次成功渲染的数据）立即上屏消除白屏感；随后由 Load 流程决定是否
     * 后台刷新。无缓存时不做任何事等 Load 画骨架屏。
     * [DEEP-DOC]
     */
    function xyOverviewRenderCachedNow() {
        const expectedCourseId = getCourseGroupId() || xyOverviewState.pinnedCourseId || '';
        const normalized = courseGroupKey(expectedCourseId);
        const cached = normalized ? xyOverviewState.cache.get(normalized) : null;
        if (!cached) return;
        xyOverviewState.courseId = normalized;
        xyOverviewState.currentData = cached;
        xyOverviewRender(cached);
    }
    /**
     * 区域切换核心状态机 —— 整个面板视图管理的唯一入口。
     *
     * 编排顺序：
     *   1. 概览钉住互斥：目标非 overview 且钉住条件成立 → 直接 return（保护）；
     *   2. 离开概览时清空 pinned/dashboardCourseId；
     *   3. mainBody 滚动策略：overview 区隐藏滚动条其余恢复；
     *   4. 同区重入短路：activeZone 已等于 newZone 时只做轻量补救（列表渲染/
     *      分区文案复位）后返回——避免重复初始化副作用；
     *   5. 记录 oldZone → 更新 playState.activeZone = newZone → 八个视图容器
     *      display 互斥切换 → 分区标签与标题更新 → 各区进入钩子分发：
     *      courses→DashboardRender、overview→RenderCachedNow、course→
     *      updateCourseUI+ensureAutoRecord、dir→loadCourseDirectory 等。
     *
     * @param {string} newZone - ZONE 常量值
     * [DEEP-DOC]
     */
    function switchToZone(newZone) {
        if (newZone !== ZONE.OVERVIEW && xyShouldKeepDashboardOverview(getCourseGroupId())) return;
        if (newZone !== ZONE.OVERVIEW) {
            xyOverviewState.pinnedCourseId = '';
            xyOverviewState.dashboardCourseId = '';
        }
        const mainBody = document.getElementById('xy-main-body');
        /* 面板支持自由缩放后，任何分区都保持主内容区可滚动——
           否则小尺寸面板下（尤其学情概览分区原会强制 hidden）下方内容被裁切且无滚动条 */
        if (mainBody) mainBody.style.overflowY = 'auto';
        if (playState.activeZone === newZone) {
            if (newZone === ZONE.COURSES) {
                const viewCourses = document.getElementById('xy-view-courses');
                if (viewCourses) viewCourses.style.display = 'flex';
                const segZone = document.getElementById('xy-seg-zone');
                if (segZone) segZone.textContent = '📚 课程总览';
                const courseList = document.getElementById('xy-course-dashboard-list');
                if (courseList && !courseList.childElementCount) xyCourseDashboardRender();
            } else if (newZone === 'overview') {
                const viewOverview = document.getElementById('xy-view-overview');
                if (viewOverview) viewOverview.style.display = 'flex';
                const segZone = document.getElementById('xy-seg-zone');
                if (segZone) segZone.textContent = '📊 学情概览';
                xyOverviewRenderCachedNow();
            }
            return;
        }
        const oldZone = playState.activeZone;
        playState.activeZone = newZone;

        if (oldZone === ZONE.COURSE) {
            toggleRecord(false); 
        }
        
        
        if (newZone === ZONE.COURSES || newZone === ZONE.DISC || newZone === ZONE.OVERVIEW) {
            clearDynamicRefresh();
            lastRefreshStrategy = 'none';
        }
        
        
        const superConsole = document.getElementById('xy-super-console');
        if (superConsole) {
            superConsole.style.display = 'flex';
        }
        
        const viewC = document.getElementById('xy-view-course'), viewD = document.getElementById('xy-view-disc'), viewCourses = document.getElementById('xy-view-courses'), viewOverview = document.getElementById('xy-view-overview'), viewDL = document.getElementById('xy-view-download'), viewHW = document.getElementById('xy-view-hw'), viewDIR = document.getElementById('xy-view-dir'), segZone = document.getElementById('xy-seg-zone');
        if (viewC && viewD && viewCourses && viewOverview && viewDL && segZone) {
            viewC.style.display = newZone === ZONE.COURSE ? 'block' : 'none';
            viewD.style.display = newZone === ZONE.DISC ? 'block' : 'none';
            viewCourses.style.display = newZone === ZONE.COURSES ? 'flex' : 'none';
            viewOverview.style.display = newZone === ZONE.OVERVIEW ? 'flex' : 'none';
            viewDL.style.display = newZone === ZONE.DOWNLOAD ? 'block' : 'none';
            if (viewHW) viewHW.style.display = newZone === ZONE.HW ? 'block' : 'none';
            if (viewDIR) viewDIR.style.display = newZone === ZONE.DIR ? 'block' : 'none';

            const zoneLabel = newZone === ZONE.COURSE ? '📚 刷课区' : newZone === ZONE.COURSES ? '📚 课程总览' : newZone === ZONE.OVERVIEW ? '📊 学情概览' : newZone === ZONE.DISC ? '💭 讨论区' : newZone === ZONE.DOWNLOAD ? '📥 下载区' : newZone === ZONE.HW ? '📝 作业区' : '📂 课程目录';
            segZone.innerHTML = zoneLabel;
            segZone.classList.add('active');
            if (newZone === 'overview') xyOverviewRenderCachedNow();
        }

        if (oldZone !== ZONE.UNINITIALIZED) {
            const zoneName = newZone === ZONE.COURSE ? '视频/文档自动引擎' : newZone === ZONE.COURSES ? '进行中课程总览' : newZone === ZONE.OVERVIEW ? '课程学习数据概览' : newZone === ZONE.DISC ? '互动点赞引擎' : newZone === ZONE.DOWNLOAD ? '课件下载区' : newZone === ZONE.HW ? '作业答题台' : '课程目录区';
            logMsg(`📍 底层指令：已切换至【${zoneName}】`, 'success', true);
        }

        if (newZone === ZONE.COURSE) {
            ensureAutoRecord();
            globalTaskStatusChecker(true);
            
            const currentNodeId = getNodeId();
            if (!dlState._lastCourseNodeId || dlState._lastCourseNodeId !== currentNodeId) {
                dlState._lastCourseNodeId = currentNodeId;
                playState.docReadTime = 0;
                playState.lastDocSubmitTime = 0;
                playState.videoScriptProgress = undefined;
                playState.isTaskCompleted = false;
            }
        }
        if (newZone === ZONE.DIR) {
            setTimeout(loadCourseDirectory, 150);
        }
        if (newZone === ZONE.COURSES) xyCourseDashboardRender();
    }

    
    let _radarCache = { data: null, time: 0, promise: null };
    /**
     * 全局雷达数据源（带缓存）：调 fetchGlobalTasks 取全网任务并附课程名映射。
     * 缓存命中直接返回旧引用；未命中拉取后写缓存。供秒判/跳转/调度复用，
     * 降低同一轮询周期内的重复请求。
     * [DEEP-DOC]
     */
    async function fetchRadarCached() {
        const now = Date.now();
        if (_radarCache.data && (now - _radarCache.time) < 3000) return _radarCache.data;
        if (_radarCache.promise) return _radarCache.promise; 
        _radarCache.promise = (async () => {
            try {
                const token = await getAuthToken();
                const res = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { headers: { "authorization": `Bearer ${token}` } });
                const data = await res.json();
                _radarCache.data = data;
                _radarCache.time = Date.now();
                return data;
            } finally {
                _radarCache.promise = null;
            }
        })();
        return _radarCache.promise;
    }
    /**
     * SPA 路由感知主扫描器 —— 由 createPersistentInterval 低频驱动的「心跳」。
     *
     * 流程：xyRouteKind 分类当前路由 → 与上次记录比对，变化时执行区域钩子链：
     *   hw 路由 → 切作业区 + 延时主动拉题；dir → 切目录区；overview → 切概览；
     *   course → 刷课区 + 引擎类型探测 + 动态刷新检查；disc → 讨论区锁定判断；
     *   courses → 回总览。每轮都跑 checkDynamicRefresh 维持防卡死兜底，
     *   最后 updateTitleBar 同步标签页标题。所有切区都经 xyShouldKeepDashboard
     *   Overview 钉住保护闸门。
     * [DEEP-DOC]
     */
    async function runLowLevelScanner() {
        const routeCourseId = getCourseGroupId();
        if (xyShouldKeepDashboardOverview(routeCourseId)) return;
        if (!isActiveCourseHomePage()) xyCourseDashboardDeactivate();
        
        if (playState.activeZone === ZONE.DOWNLOAD) {
            const currentGroupId = getCourseGroupId();
            const currentGroupKey = courseGroupKey(currentGroupId);
            if (!currentGroupKey) {
                downloadPanelRequestSeq++;
                dlState.downloadCourseGroupKey = '';
                dlState.downloadCourseName = '';
                dlState.downloadFiles = [];
                dlState.downloadSelectedIds.clear();
                dlState.downloadSearchKeyword = '';
                dlState.downloadSortMap = {};
                dlState.downloadDirTree = null;
                renderDownloadList();
                switchToZone(ZONE.COURSES);
                void xyCourseDashboardLoad(false);
                return;
            }
            if (dlState.downloadCourseGroupKey !== currentGroupKey) {
                void loadDownloadPanel(currentGroupId).catch(e => {
                    console.warn('[小雅] 下载区课程切换加载失败:', e);
                });
            }
            return;
        }
        if (discState.discLockedUrl === window.location.href) { switchToZone(ZONE.DISC); return; }
        const groupId = routeCourseId; const nodeId = getNodeId() || getResourceNodeId() || getPaperId();
        const routeKind = xyRouteKind();
        const scanGroupKey = courseGroupKey(groupId);
        const scanNodeKey = courseGroupKey(nodeId);
        const isSameScanContext = () => isCurrentCourseGroup(scanGroupKey)
            && courseGroupKey(getNodeId() || getResourceNodeId() || getPaperId()) === scanNodeKey;
        if (!groupId) {
            if (xyShouldKeepDashboardOverview(groupId)) return;
            switchToZone(ZONE.COURSES);
            void xyCourseDashboardLoad(false);
            return;
        }
        if (!nodeId) {
            if (routeKind === ZONE.DISC) {
                switchToZone('disc');
                return;
            } else if (routeKind === ZONE.DIR) {
                if (playState.activeZone !== 'dir') logMsg('📂 侦测到课程目录页 → 已切换课程目录区', 'success', true);
                switchToZone('dir');
                setTimeout(loadCourseDirectory, 200);
            } else if (routeKind === ZONE.OVERVIEW) {
                switchToZone('overview');
                void xyOverviewLoad(groupId, false);
            } else {
                switchToZone(ZONE.COURSES);
                void xyCourseDashboardLoad(false);
            }
            return;
        }

        let taskType = -1;

        try {
            const radarData = await fetchRadarCached();
            if (!isSameScanContext()) return;
            const paperIdForMatch = getPaperId();
            if (radarData.success && radarData.data) {
                const rTask = radarData.data.find(t => t.node_id == nodeId || (paperIdForMatch && t.node_id == paperIdForMatch));
                if (rTask) {
                    taskType = rTask.task_type;
                } else {
                    const resources = await loadCourseResources(groupId);
                    if (!isSameScanContext()) return;
                    if (resources) {
                        const flatRes = extractFilesFromResources(resources);
                        const currentRes = flatRes.find(r => r.node_id == nodeId || r.id == nodeId || (paperIdForMatch && (r.node_id == paperIdForMatch || r.id == paperIdForMatch)));
                        if (currentRes) taskType = currentRes.computed_task_type;
                    }
                    if (!playState.isTaskCompleted && playState.activeZone === ZONE.COURSE) {
                        playState.isTaskCompleted = true;
                        logMsg('✅ [雷达秒判] 当前任务已在全局雷达达成，瞬间放行！', 'success', false);
                        updateCourseUI();
                    }
                }
            }
        } catch(e) { console.warn('[小雅] 全局任务雷达请求失败', e); }

        if (!isSameScanContext()) return;
        if (xyShouldKeepDashboardOverview(groupId)) return;
        if (taskType === 1) { switchToZone(ZONE.COURSE); return; }
        else if (taskType === 6) { switchToZone(ZONE.DISC); return; }
        else if (taskType > 1 && taskType <= 5) {
            if (playState.activeZone !== ZONE.HW) logMsg('📝 侦测到【测验/作业/问卷】→ 已切换作业区', 'success', true);
            switchToZone(ZONE.HW);
            setTimeout(hwProactiveFetchData, 300);
            return;
        }

        if (window.location.href.includes('/course_paper/')) {
            if (playState.activeZone !== ZONE.HW) logMsg('📝 侦测到【作业/测验页面】→ 已切换作业区', 'success', true);
            switchToZone(ZONE.HW);
            setTimeout(hwProactiveFetchData, 300);
            return;
        }
        if (document.querySelector('video, iframe[src*="ow365"], iframe[src*="office"], .prism-player, .aliplayer, .xy_disk_preview, .pdf-viewer')) {
            switchToZone(ZONE.COURSE); return;
        }
        if (xyIsDiscussionPage()) {
            switchToZone(ZONE.DISC); return;
        }
        
        if (playState.activeZone === ZONE.HW && window.location.href.includes('/resource/') && getPaperId()) {
            return;
        }
        if (routeKind === ZONE.DIR) {
            if (playState.activeZone !== 'dir') logMsg('📂 侦测到课程目录页 → 已切换课程目录区', 'success', true);
            switchToZone('dir');
            setTimeout(loadCourseDirectory, 200);
            return;
        }
        if (routeKind === ZONE.OVERVIEW) {
            switchToZone('overview');
            void xyOverviewLoad(groupId, false);
            return;
        }
        switchToZone(ZONE.COURSES);
        void xyCourseDashboardLoad(false);
    }
    /** 课程 ID 归一化出口：String(value).trim()。空串语义为「无效课程上下文」。
     * [DEEP-DOC]
     */
    function courseGroupKey(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }
    /** 当前 URL 课程与给定 groupId 一致性判断（getCourseGroupId 后严格比对）。
     * [DEEP-DOC]
     */
    function isCurrentCourseGroup(groupId) {
        const expected = courseGroupKey(groupId);
        return !!expected && courseGroupKey(getCourseGroupId()) === expected;
    }
    /**
     * 课程全量资源树装载（带三重防护）。
     *
     * 1) in-flight 去重：同 group 的并发请求复用同一 Promise；
     * 2) code=50007 授权流：先 POST group/visit 拿 site_id → GET access/
     *    authorization 换 access_group_token → 带 X-Course-Access 头重试原查询；
     * 3) 模块级 Map 缓存 + 成功时同步一份到 dlState.courseResourcesCache。
     *
     * @returns {Promise<Array|null>} 资源树数组；失败返回 null 不抛出
     * [DEEP-DOC]
     */
    async function loadCourseResources(groupId) {
        const key = courseGroupKey(groupId);
        if (!key) return null;

        const cached = courseResourcesCacheByGroup.get(key);
        if (cached) {
            if (isCurrentCourseGroup(key)) {
                dlState.courseResourcesCache = cached;
                dlState.lastCourseGroupId = key;
            }
            return cached;
        }

        const inFlight = courseResourceRequests.get(key);
        if (inFlight) return inFlight;

        const request = (async () => {
            try {
                const token = await getAuthToken();
                if (!token) return null;

                let res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${encodeURIComponent(key)}`, {
                    headers: { "authorization": `Bearer ${token}` }
                });
                let data = await res.json();
                if (data.code === 50007) {
                    const gvRes = await fetch(`https://${domain}/api/jx-iresource/statistics/group/visit`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ group_id: key, role_type: 'normal' })
                    });
                    const gv = await gvRes.json();
                    const visitData = gv.data;
                    if (visitData && visitData.site_id) {
                        const authRes = await fetch(`https://${domain}/api/jx-iresource/group/access/authorization?site_id=${encodeURIComponent(visitData.site_id)}&role_type=4`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const auth = await authRes.json();
                        const accessToken = auth.data?.access_group_token;
                        if (accessToken) {
                            res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${encodeURIComponent(key)}`, {
                                headers: { 'authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8', 'X-Course-Access': accessToken }
                            });
                            data = await res.json();
                        }
                    }
                }

                if (!data.success || !data.data) return null;
                courseResourcesCacheByGroup.set(key, data.data);
                if (isCurrentCourseGroup(key)) {
                    dlState.courseResourcesCache = data.data;
                    dlState.lastCourseGroupId = key;
                }
                return data.data;
            } catch (e) {
                console.warn('[小雅] loadCourseResources 请求失败', e);
                return null;
            } finally {
                if (courseResourceRequests.get(key) === request) courseResourceRequests.delete(key);
            }
        })();
        courseResourceRequests.set(key, request);
        return request;
    }
    /** 目录节点的单元子列表抽取：兼容 children/child_nodes/items 三形态（内部走 dlResourceValues）。
     * [DEEP-DOC]
     */
    function dirUnitChildren(n) {
        return (n && n._children) || [];
    }
    /**
     * 「单元」判定：有名称且无文件扩展名（不匹配 WATCH 白名单）即视为分组
     * 目录节点。平台没有显式 type 标记，只能靠扩展名反向推断。
     * [DEEP-DOC]
     */
    function dirIsUnit(n) {
        if (dirUnitChildren(n).length) return true;
        if (String(n.type || '') === 'folder') return true;
        if (n.mimetype) return false;
        if (n.is_task === true) return false;
        const tt = (n.task_type !== undefined && n.task_type !== null) ? n.task_type : (n.property && n.property.task_type);
        if (tt !== undefined && tt !== null) return false;
        if (n.task_id) return false;
        const type = n.task_type !== undefined ? n.task_type : n.type;
        if (Number(type) >= 2 && Number(type) <= 5) return false;
        if (Number(n.resource_type) > 0) return false;
        return !SHARED_PATTERNS.WATCH.test(String(n.name || n.title || ''));
    }
    /**
     * 目录树构建器：从扁平资源树重组为「单元嵌套 + 叶子文件」结构。
     * 递归中维护 _id 赋值（缺失时 seq 补位保证 DOM key 稳定）与层级 depth。
     * [DEEP-DOC]
     */
    function buildDirTree(resources) {
        const byId = new Map();
        dlCollectResources(resources).forEach(r => {
            if (!r) return;
            const id = dlResourceId(r);
            if (id === null) return;
            byId.set(id, Object.assign({}, r, { _children: [], _id: id }));
        });
        const roots = [];
        byId.forEach(node => {
            const parts = String(node.path || '').split('/').filter(Boolean);
            let parentId = parts.length >= 2 ? parts[parts.length - 2] : null;
            if (parentId == null && node.parent_id != null) parentId = String(node.parent_id);
            const parent = parentId ? byId.get(parentId) : null;
            if (parent) parent._children.push(node);
            else roots.push(node);
        });
        const sortRec = nodes => {
            nodes.sort((a, b) => (Number(a.sort_position) || 0) - (Number(b.sort_position) || 0));
            nodes.forEach(n => sortRec(n._children));
        };
        sortRec(roots);
        if (roots.length === 1 && roots[0]._children && roots[0]._children.length) {
            return roots[0]._children;
        }
        return roots;
    }
    /**
     * 体积文案：文件直接取 size 字段人话化；目录递归累加子文件体积后格式化
     * （B<1KB / KB<1MB / MB<1GB / GB 自适应保留一位小数）。
     * [DEEP-DOC]
     */
    function dirFileSize(n) {
        const s = Number(n.file_size || n.size || 0);
        if (!s) return '';
        return s > 1048576 ? (s / 1048576).toFixed(1) + 'MB' : (s / 1024).toFixed(0) + 'KB';
    }
    /** 递归统计目录下的叶子文件总数（不含单元节点自身）。
     * [DEEP-DOC]
     */
    function countDirFiles(nodes) {
        let c = 0;
        (Array.isArray(nodes) ? nodes : []).forEach(n => {
            if (dirUnitChildren(n).length) c += countDirFiles(dirUnitChildren(n));
            else c++;
        });
        return c;
    }
    /** 目录区数据装载编排：取课程 ID → loadCourseResources → buildDirTree → 渲染；全程状态条反馈（加载中/N项/失败可重试）。
     * [DEEP-DOC]
     */
    async function loadCourseDirectory() {
        const box = document.getElementById('xy-dir-list');
        const statusEl = document.getElementById('xy-dir-status');
        if (!box) return;
        const groupId = getCourseGroupId();
        const requestedGroupKey = courseGroupKey(groupId);
        if (requestedGroupKey && !isCurrentCourseGroup(requestedGroupKey)) return;
        if (!requestedGroupKey) {
            box.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:24px 0;font-size:13px;">未检测到课程 ID</div>';
            if (statusEl) statusEl.textContent = '未检测到课程';
            return;
        }
        box.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:24px 0;font-size:13px;">正在读取课程目录...</div>';
        if (statusEl) statusEl.textContent = '读取中...';
        try {
            const resources = await loadCourseResources(groupId);
            if (!isCurrentCourseGroup(requestedGroupKey)) return;
            if (!resources || !resources.length) {
                box.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:24px 0;font-size:13px;">暂无课程目录数据</div>';
                if (statusEl) statusEl.textContent = '目录为空';
                return;
            }
            const tree = buildDirTree(resources);
            if (statusEl) statusEl.textContent = '✅ ' + countDirFiles(tree) + ' 项';
            renderCourseDirectory(tree);
        } catch (e) {
            if (!isCurrentCourseGroup(requestedGroupKey)) return;
            box.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:24px 0;font-size:13px;">课程目录读取失败</div>';
            if (statusEl) statusEl.textContent = '读取失败';
            console.warn('[小雅] 课程目录读取失败:', e);
        }
    }
    /** 平台 Web 端资源查看链接拼接（resource/{parent}/{node} 形态，带路由前缀自适应）。
     * [DEEP-DOC]
     */
    function dirResourceUrl(r) {
        const groupId = getCourseGroupId();
        if (!groupId || !r) return '';
        const pathPrefix = window.location.href.includes('/course/') ? 'course' : 'mycourse';
        const selfId = normalizeDownloadId(r.id) ?? normalizeDownloadId(r.resource_id);
        if (selfId === null) return '';
        if (dirIsUnit(r)) {
            return `/app/jx-web/${pathPrefix}/${groupId}/resource/${selfId}`;
        }
        const rawParentId = normalizeDownloadId(r.parent_id);
        const parentId = rawParentId !== null && rawParentId !== '1' ? rawParentId : selfId;
        return `/app/jx-web/${pathPrefix}/${groupId}/resource/${parentId}/${selfId}`;
    }
    /**
     * 目录树 HTML 生成：逐节点产出单元折叠头（缩进=depth*14px、± 折叠标记、
     * 项数角标）或文件行（勾选框 + 类型徽章 + 名称 + 大小 + 单文件下载按钮），
     * 全部动态文本 escapeHtml；勾选态从 downloadSelectedIds 读回保持视觉一致。
     * [DEEP-DOC]
     */
    function buildDirHtml(nodes, depth) {
        let html = '';
        (Array.isArray(nodes) ? nodes : []).forEach(n => {
            const name = n.name || n.title || '';
            if (dirIsUnit(n)) {
                const kids = dirUnitChildren(n);
                const count = countDirFiles(kids);
                const uUrl = dirResourceUrl(n);
                html += `
                    <div>
                        <div class="xy-dir-head" style="display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:8px; margin:1px 0; margin-left:${depth * 14}px;">
                            <span data-marker style="width:12px; flex-shrink:0; text-align:center; font-size:10px; color:${T('#94a3b8','#64748b')}; cursor:pointer;" title="点击展开/收起">−</span>
                            <span data-dir-url="${escapeHtml(uUrl)}" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11.5px; font-weight:700; color:${T('#c7d2fe','#4338ca')}; cursor:pointer;" title="点击跳转：${escapeHtml(name)}">${escapeHtml(name)}</span>
                            <span style="font-size:10px; color:${T('#64748b','#94a3b8')}; flex-shrink:0; cursor:pointer;">${count} 项</span>
                        </div>
                        <div class="xy-dir-body" style="margin-left:${(depth + 1) * 14}px;">${buildDirHtml(kids, depth + 1)}</div>
                    </div>`;
            } else {
                const type = n.task_type !== undefined ? n.task_type : n.type;
                const numType = Number(type);
                const isTask = numType >= 2 && numType <= 5;
                const taskLabel = ({ 2: '作业', 3: '练习', 4: '测验', 5: '问卷' })[numType] || '任务';
                const chip = isTask
                    ? `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;padding:1px 5px;border-radius:5px;background:#6366f1;color:#fff;font-size:9px;font-weight:800;flex-shrink:0;">${taskLabel}</span>`
                    : dlFileChip(name);
                const fUrl = dirResourceUrl(n);
                html += `
                    <div data-dir-url="${escapeHtml(fUrl)}" title="点击跳转：${escapeHtml(name)}" style="display:flex; align-items:center; gap:8px; padding:5px 8px; margin-left:${depth * 14}px; border-radius:6px; cursor:pointer;" onmouseover="this.style.background='${T('rgba(129,140,248,0.12)','#eef2ff')}'" onmouseout="this.style.background='transparent'">
                        ${chip}
                        <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11.5px; color:${T('#e2e8f0','#0f172a')};" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                        <span style="font-size:10px; color:${T('#64748b','#94a3b8')}; flex-shrink:0;">${dirFileSize(n)}</span>
                        <span style="font-size:10px; color:${T('#a5b4fc','#6366f1')}; flex-shrink:0;">↗</span>
                    </div>`;
            }
        });
        return html;
    }
    /** 目录区总渲染：状态条（✅ N 项 / 加载中 / 失败重试）+ buildDirHtml 产物注入 + 底部计数。
     * [DEEP-DOC]
     */
    function renderCourseDirectory(nodes) {
        const box = document.getElementById('xy-dir-list');
        if (!box) return;
        box.innerHTML = buildDirHtml(nodes, 0);
    }
    /** 当前过滤条件（关键词+类型集）下可见文件数统计，供目录区与下载区的计数徽章。
     * [DEEP-DOC]
     */
    function countVisibleFiles(node, visibleIds) {
        if (!dirIsUnit(node)) return visibleIds.has(node._id) ? 1 : 0;
        return dirUnitChildren(node).reduce((s, k) => s + countVisibleFiles(k, visibleIds), 0);
    }
    /**
     * 下载区树视图 HTML 构建：递归 dirTree，单元节点生成折叠头（data-dl-marker
     * ± 号 + 名称 + 子项计数），叶子文件生成完整行（勾选框 data-fid / 单文件
     * 按钮 data-quote-id / 大小列）。不可见 ID 直接剪枝不渲染。
     * [DEEP-DOC]
     */
    function buildDownloadTreeHtml(nodes, visibleIds, depth) {
        let html = '';
        (Array.isArray(nodes) ? nodes : []).forEach(n => {
            if (dirIsUnit(n)) {
                const kids = dirUnitChildren(n);
                if (!kids.some(k => countVisibleFiles(k, visibleIds) > 0)) return;
                const cnt = kids.reduce((s, k) => s + countVisibleFiles(k, visibleIds), 0);
                html += `
                    <div>
                        <div class="xy-dl-unit-head" style="display:flex; align-items:center; gap:6px; cursor:pointer; padding:6px 10px; margin-left:${depth * 14}px;">
                            <span data-dl-marker style="width:12px; flex-shrink:0; text-align:center; font-size:10px; color:${T('#94a3b8','#64748b')};">−</span>
                            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11.5px; font-weight:700; color:${T('#c7d2fe','#4338ca')};">📁 ${escapeHtml(n.name || n.title || '')}</span>
                            <span style="font-size:10px; color:${T('#64748b','#94a3b8')}; flex-shrink:0;">${cnt} 项</span>
                        </div>
                        <div class="xy-dl-unit-body" style="margin-left:${(depth + 1) * 14}px;">${buildDownloadTreeHtml(kids, visibleIds, depth + 1)}</div>
                    </div>`;
            } else {
                if (!visibleIds.has(n._id)) return;
                const name = n.name || n.title || '未知文件';
                const checked = dlState.downloadSelectedIds.has(String(n._id));
                const sizeStr = dirFileSize(n);
                const quoteId = dlQuoteId(n) ?? normalizeDownloadId(n._id);
                html += `
                    <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; margin-left:${depth * 14}px; border-bottom:1px solid ${T('rgba(71,85,105,0.12)','#e2e8f0')}; font-size:13px; color:${T('#cbd5e1','#334155')};">
                        <input type="checkbox" class="xy-dl-check" data-fid="${escapeHtml(n._id)}" ${checked?'checked':''} style="accent-color:#818cf8; flex-shrink:0; width:15px; height:15px; cursor:pointer;">
                        <span style="display:flex; align-items:center; gap:2px; flex-shrink:0;">
                            <span>${dlFileChip(name)}</span>
                            <button class="xy-mini-btn xy-dl-single" data-fid="${escapeHtml(n._id)}" data-quote-id="${escapeHtml(quoteId)}" data-file-name="${escapeHtml(name)}" title="下载" style="padding:2px 6px; font-size:11px; flex-shrink:0; line-height:1;">⬇️</button>
                        </span>
                        <span style="flex:1;">
                            <div style="white-space:nowrap; color:${T('#e2e8f0','#0f172a')}; font-weight:500;" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
                        </span>
                        <span style="font-size:11px; color:${T('#64748b','#94a3b8')}; flex-shrink:0;">${sizeStr}</span>
                    </div>`;
            }
        });
        return html;
    }
    /**
     * 云盘加密直链解密器（DES-CBC，密钥对见 DES 常量）。
     *
     * 步骤：URL-safe base64 变体还原（_ → +、* → /、- → =）→ CryptoJS
     * Base64.parse 得 ciphertext → DES.decrypt(key/iv/Pkcs7) → Utf8 输出明文 URL。
     * 容错：任何一步异常 warn 后原样返回入参——部分链路传入的本身就是明文。
     *
     * 依赖：unsafeWindow.CryptoJS（页面全局加载的 crypto-js.min.js）。
     * [DEEP-DOC]
     */
    function decryptFileUrl(encryptedUrl) {
        try {
            const key = DES.KEY;
            const vector = DES.IV;
            const base64Str = encryptedUrl
                .replace(/_/g, '+')
                .replace(/\*/g, '/')
                .replace(/-/g, '=');
            const keyUtf8 = unsafeWindow.CryptoJS.enc.Utf8.parse(key);
            const ivUtf8 = unsafeWindow.CryptoJS.enc.Utf8.parse(vector);
            const decrypted = unsafeWindow.CryptoJS.DES.decrypt({
                ciphertext: unsafeWindow.CryptoJS.enc.Base64.parse(base64Str)
            }, keyUtf8, {
                iv: ivUtf8,
                mode: unsafeWindow.CryptoJS.mode.CBC,
                padding: unsafeWindow.CryptoJS.pad.Pkcs7
            });
            return decrypted.toString(unsafeWindow.CryptoJS.enc.Utf8);
        } catch (error) {
            console.warn('[小雅] URL解密失败:', error);
            return encryptedUrl;
        }
    }
    /** 时间戳归一化：数字 <1e12 视为秒 ×1000 转 ms；字符串走 Date.parse；均失败返回 0。用于 createdAt 排序字段统一。
     * [DEEP-DOC]
     */
    function dlParseTs(v) {
        if (v === undefined || v === null || v === '') return 0;
        if (typeof v === 'number') return (v < 1e12) ? v * 1000 : v;
        const t = Date.parse(v);
        return Number.isFinite(t) ? t : 0;
    }
    /**
     * 下载区数据源总装。
     *
     * in-flight 复用：同课程的并发调用共享同一个 Promise（downloadResourceRequests
     * 登记，finally 注销）。主体：token 校验 → queryCourseResources（含 50007
     * 授权重试流，同 loadCourseResources 的三级处理）→ success 校验 →
     * 三件套产出：dlBuildSortMap 排序映射、buildDirTree 目录树、
     * extractFilesFromResources 过滤后的 files 数组（逐条补 nodeId 兜底链 /
     * video|doc 类型标记 / quoteId 兜底链 / 尺寸 / 排序元数据 / ms 时间戳）。
     *
     * @returns {Promise<{files, sortMap, dirTree}|null>} 失败返回 null
     * [DEEP-DOC]
     */
    async function fetchDownloadResources(groupId) {
        const key = courseGroupKey(groupId);
        if (!key) return [];
        const inFlight = downloadResourceRequests.get(key);
        if (inFlight) return inFlight;

        const request = (async () => {
            try {
                const token = getCookie();
                if (!token) return null;
                let res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${encodeURIComponent(key)}`, {
                    headers: { 'authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
                });
                let data = await res.json();
                if (data.code === 50007) {
                    const gvRes = await fetch(`https://${domain}/api/jx-iresource/statistics/group/visit`, {
                        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ group_id: key, role_type: 'normal' })
                    });
                    const gv = await gvRes.json();
                    const visitData = gv.data;
                    if (visitData && visitData.site_id) {
                        const authRes = await fetch(`https://${domain}/api/jx-iresource/group/access/authorization?site_id=${encodeURIComponent(visitData.site_id)}&role_type=4`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const auth = await authRes.json();
                        const accessToken = auth.data?.access_group_token;
                        if (accessToken) {
                            res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${encodeURIComponent(key)}`, {
                                headers: { 'authorization': `Bearer ${token}`, 'X-Course-Access': accessToken }
                            });
                            data = await res.json();
                        }
                    }
                }
                if (!data.success || !data.data) return null;

                const sortMap = {};
                dlBuildSortMap(data.data, sortMap);
                const dirTree = buildDirTree(data.data);
                const flat = extractFilesFromResources(data.data);
                const files = flat.filter(r => {
                    const name = (r.name || r.title || '').toLowerCase();
                    return SHARED_PATTERNS.WATCH.test(name);
                }).map(r => {
                    const id = dlResourceId(r);
                    if (id === null) return null;
                    // type=9/resource_type=5 是「视频任务引用」节点：quote_id 指向任务而非云盘文件，
                    // file_url 接口对其返回 resource not exist。真实媒体走 VOD 点播系统（video_id）。
                    const isVodTask = Number(r.type) === 9 || Number(r.resource_type) === 5;
                    return {
                        id,
                        nodeId: normalizeDownloadId(r.node_id) ?? normalizeDownloadId(r.nodeId) ?? id,
                        name: r.name || r.title || '未知文件',
                        type: SHARED_PATTERNS.MEDIA.test((r.name || '').toLowerCase()) ? 'video' : 'doc',
                        source: isVodTask ? 'vod' : 'cloud',
                        quoteId: dlQuoteId(r) ?? id,
                        size: r.file_size || r.size || 0,
                        order: r.__order || 0,
                        sortPos: Number(r.__sortPos) || 0,
                        path: r.__path || '',
                        unitPath: Array.isArray(r.__unitPath) ? r.__unitPath.slice(0, 3) : [],
                        createdAt: dlParseTs(r.__createdAt)
                    };
                }).filter(Boolean);
                return { files, sortMap, dirTree };
            } catch (e) {
                console.warn('[小雅] 获取下载资源失败:', e);
                return null;
            } finally {
                if (downloadResourceRequests.get(key) === request) downloadResourceRequests.delete(key);
            }
        })();
        downloadResourceRequests.set(key, request);
        return request;
    }
    /**
     * 云盘直链换取器（file_url/{quoteId}）。
     *
     * 循环 3 次：AbortSignal 检查 → token 缺失 continue → fetch 换链 →
     * success 且 url 存在：is_encryption 时经 decryptFileUrl 解密后返回；
     * 异常（非 Abort）warn 继续重试；间隔 sleep(500)。三次耗尽返回 null——
     * 上层 runDownloadQueue 以「获取失败」计数并继续下一文件，不会中断队列。
     *
     * @returns {Promise<string|null>} 可直接 GET 的文件直链
     * [DEEP-DOC]
     */
    async function getDownloadUrl(quoteId, signal) {
        const normalizedQuoteId = normalizeDownloadId(quoteId);
        if (normalizedQuoteId === null) return null;
        for (let i = 0; i < 3; i++) {
            if (signal?.aborted) throw new DOMException('用户终止下载', 'AbortError');
            try {
                const token = getCookie();
                if (!token) continue;
                const res = await fetch(`https://${domain}/api/jx-oresource/cloud/file_url/${normalizedQuoteId}`, {
                    signal: signal || undefined,
                    headers: { 'authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data && data.data.url) {
                    let fileUrl = data.data.url;
                    if (data.data.is_encryption) {
                        fileUrl = decryptFileUrl(fileUrl);
                    }
                    return fileUrl;
                }
            } catch(e) {
                if (e?.name === 'AbortError') throw e;
                console.warn('[小雅] getDownloadUrl 失败', e);
            }
            if (signal?.aborted) throw new DOMException('用户终止下载', 'AbortError');
            await sleep(500);
        }
        return null;
    }
    /**
     * 主世界 Aliplayer 换流桥安装器（一次性）。
     *
     * 背景：TM 沙箱里 window.Aliplayer 不可见（页面脚本的全局挂在 unsafeWindow），
     * 跨沙箱直接实例化 SDK 不可靠，CustomEvent detail 跨世界可能被 Xray 隔离。
     *
     * 实现：向 document.head 注入内联 script 在主世界建立——
     *   unsafeWindow._xyVodQueue 共享数组 + setInterval(200ms) 消费循环：
     *   取 {reqId, videoId, playAuth} 条目 → 隐藏容器实例化 Aliplayer →
     *   ready 回调后 2.5s 读 player._urls 提取 .mp4 直链 → 结果 JSON 序列化写回
     *   条目 result 字段 → dispose 销毁播放器。队列超 40 条自动清理已完成项。
     * 全程只传纯字符串，规避一切跨世界结构化克隆问题。
     * [DEEP-DOC]
     */
    function xyInjectVodBridge() {
        if (window._xyVodBridgeInstalled) return;
        window._xyVodBridgeInstalled = true;
        // 沙箱侧初始化队列容器（主世界脚本会重建同名数组前先检查）
        try {
            if (!unsafeWindow._xyVodQueue || typeof unsafeWindow._xyVodQueue.length !== 'number') {
                unsafeWindow._xyVodQueue = [];
            }
        } catch(e) {}
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                if (window._xyVodBridgeReady) return;
                window._xyVodBridgeReady = true;
                if (!Array.isArray(window._xyVodQueue)) window._xyVodQueue = [];
                function processOne(item) {
                    if (!item || item.result !== undefined) return;
                    var videoId = item.videoId, playAuth = item.playAuth;
                    var fail = function(msg) { item.result = JSON.stringify({ ok: false, error: String(msg) }); };
                    try {
                        if (typeof window.Aliplayer !== 'function') { fail('Aliplayer SDK 未加载'); return; }
                        var holder = document.createElement('div');
                        holder.id = 'xy-vod-bridge-' + item.reqId;
                        holder.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:320px;height:180px;';
                        document.body.appendChild(holder);
                        var settled = false;
                        var p = null;
                        var finish = function(err, url) {
                            if (settled) return; settled = true;
                            try { if (p && p.dispose) p.dispose(); } catch(e) {}
                            if (holder.parentNode) holder.parentNode.removeChild(holder);
                            setTimeout(function() {
                                if (err) item.result = JSON.stringify({ ok: false, error: String(err && err.message || err) });
                                else item.result = JSON.stringify({ ok: true, url: url });
                            }, 0);
                        };
                        var timeoutId = setTimeout(function(){ finish(new Error('Aliplayer 换流超时')); }, 15000);
                        try {
                            p = new window.Aliplayer({
                                id: holder.id,
                                vid: videoId,
                                playauth: playAuth,
                                region: 'cn-shanghai',
                                format: 'mp4',
                                mediaType: 'video',
                                isLive: false,
                                autoplay: false
                            }, function(player) {
                                setTimeout(function() {
                                    clearTimeout(timeoutId);
                                    var urls = (player && player._urls) || [];
                                    var mp4 = null;
                                    for (var i = 0; i < urls.length; i++) {
                                        if (String(urls[i] && urls[i].Url || '').indexOf('.mp4') !== -1) { mp4 = urls[i]; break; }
                                    }
                                    if (!mp4) mp4 = urls[0];
                                    if (mp4 && mp4.Url) finish(null, mp4.Url);
                                    else finish(new Error('未解析到播放地址'));
                                }, 2500);
                            });
                        } catch(e) { clearTimeout(timeoutId); finish(e); }
                    } catch(e) { fail(String(e)); }
                }
                setInterval(function() {
                    var q = window._xyVodQueue;
                    if (!Array.isArray(q)) return;
                    for (var i = 0; i < q.length; i++) processOne(q[i]);
                    // 清理已完成的旧条目，防止无限增长
                    if (q.length > 40) {
                        window._xyVodQueue = q.filter(function(it){ return it.result === undefined; });
                    }
                }, 200);
            })();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }
    /**
     * 通过共享队列请求主世界换流，Promise 化封装。
     *
     * 协议：入队 {reqId, videoId, playAuth} → 250ms 轮询读同条目 result →
     * JSON.parse 后 ok?url resolve / error reject。双超时保护：18s 无结果或
     * 主世界侧 15s 换流失败均以明确错误结算。队列不可用（unsafeWindow 异常）
     * 时同步 reject 不挂起。
     *
     * @param {string} videoId - 平台 VOD 视频 ID（queryResource/v3 获得）
     * @param {string} playAuth - play_auth 接口下发的播放凭证
     * @returns {Promise<string>} 带 auth_key 的公网 mp4 直链
     * [DEEP-DOC]
     */
    function xyAliplayerResolveMp4(videoId, playAuth) {
        xyInjectVodBridge();
        return new Promise((resolve, reject) => {
            let queue;
            try {
                queue = unsafeWindow._xyVodQueue;
                if (!queue || typeof queue.push !== 'function') throw new Error('VOD 桥队列未就绪');
            } catch(e) {
                reject(new Error('VOD 桥不可用: ' + e.message));
                return;
            }
            const reqId = Math.random().toString(36).slice(2, 10);
            const entry = { reqId, videoId: String(videoId), playAuth: String(playAuth), createdAt: Date.now() };
            let settled = false;
            const cleanupTimer = setInterval(() => {
                if (settled) { clearInterval(cleanupTimer); return; }
                let item = null;
                try {
                    for (const it of queue) { if (it && it.reqId === reqId) { item = it; break; } }
                } catch(e) {
                    settled = true; clearInterval(cleanupTimer);
                    reject(new Error('VOD 桥队列读取失败'));
                    return;
                }
                if (!item) {
                    if (Date.now() - entry.createdAt > 18000) {
                        settled = true; clearInterval(cleanupTimer);
                        reject(new Error('换流通信超时'));
                    }
                    return;
                }
                if (item.result === undefined) {
                    if (Date.now() - entry.createdAt > 18000) {
                        settled = true; clearInterval(cleanupTimer);
                        reject(new Error('Aliplayer 换流超时'));
                    }
                    return;
                }
                settled = true;
                clearInterval(cleanupTimer);
                try {
                    const parsed = JSON.parse(item.result);
                    if (parsed.ok && parsed.url) resolve(parsed.url);
                    else reject(new Error(parsed.error || '主世界换流失败'));
                } catch(e) {
                    reject(new Error('VOD 桥结果解析失败'));
                }
            }, 250);
            try {
                queue.push(entry);
            } catch(e) {
                settled = true; clearInterval(cleanupTimer);
                reject(new Error('VOD 桥请求入队失败: ' + e.message));
            }
        });
    }
    /**
     * VOD 视频直链获取编排（type=9 任务节点的专用链路）。
     *
     * 两步取数：queryResource/v3?node_id → resource.video_id；play_auth/{videoId}
     * → 播放凭证。然后双链路取直链：
     *   A（优先）xyAliplayerResolveMp4 公网换流 → vod.ai-augmented.com mp4，
     *     校内外均可下载；
     *   B（备选）private_vod[0].private_url 校内点播 m3u8 —— 仅校园网可达，
     *     作为 A 失败时的降级。
     * AbortSignal 全程透传；两路都失败返回 null 并 warn 具体环节。
     * [DEEP-DOC]
     */
    async function getVodDownloadUrl(nodeId, signal) {
        const normalizedNodeId = normalizeDownloadId(nodeId);
        if (normalizedNodeId === null) return null;
        const token = getCookie();
        if (!token) return null;
        try {
            if (signal?.aborted) throw new DOMException('用户终止下载', 'AbortError');
            const resRes = await fetch(`https://${domain}/api/jx-iresource/resource/queryResource/v3?node_id=${encodeURIComponent(normalizedNodeId)}`, {
                signal: signal || undefined,
                headers: { 'authorization': `Bearer ${token}` }
            });
            const resData = await resRes.json();
            const videoId = resData?.data?.resource?.video_id;
            if (!videoId) {
                console.warn('[小雅] VOD 下载：queryResource/v3 未返回 video_id，节点:', normalizedNodeId);
                return null;
            }
            const authRes = await fetch(`https://${domain}/api/jx-oresource/vod/video/play_auth/${videoId}`, {
                signal: signal || undefined,
                headers: { 'accept': '*/*', 'authorization': `Bearer ${token}`, 'x-language': 'zh-CN' }
            });
            const authData = await authRes.json();

            // 链路A：Aliplayer 公网换流（校内外均可下载）——实测返回 vod.ai-augmented.com/mp4
            try {
                if (authData?.data?.play_auth) {
                    const publicUrl = await xyAliplayerResolveMp4(videoId, authData.data.play_auth);
                    if (publicUrl) return publicUrl;
                }
            } catch(e) {
                if (e?.name === 'AbortError') throw e;
                console.warn('[小雅] VOD 公网换流失败，尝试校内直链:', e.message);
            }

            // 链路B（备选）：校内 private_url —— 仅校园网环境可达
            const privateVod = authData?.data?.private_vod;
            if (Array.isArray(privateVod) && privateVod.length > 0 && privateVod[0].private_url) {
                console.warn('[小雅] VOD 使用校内点播直链（需校园网环境）');
                return privateVod[0].private_url;
            }
            console.warn('[小雅] VOD 下载：公网与校内双链路均未取得地址，video_id:', videoId);
            return null;
        } catch(e) {
            if (e?.name === 'AbortError') throw e;
            console.warn('[小雅] VOD 链路获取失败:', e);
            return null;
        }
    }
    /**
     * 直链获取统一路由入口。
     *
     * file.source === 'vod' 且有 nodeId → 必须走 VOD 链路（quote_id 是任务 ID
     * 打云盘接口必然 resource not exist，失败也不回退云盘白白浪费重试）；
     * 其余走 getDownloadUrl 云盘链路。新增下载来源类型时只需在此登记路由规则。
     * [DEEP-DOC]
     */
    async function getFileDownloadUrl(file, signal) {
        // VOD 视频任务：quote_id 是任务 ID 不是云盘资源，必须走 VOD 链路
        if (file && file.source === 'vod' && file.nodeId) {
            const vodUrl = await getVodDownloadUrl(file.nodeId, signal);
            if (vodUrl) return vodUrl;
            // VOD 失败不重试云盘（quote_id 必然 resource not exist）
            return null;
        }
        return getDownloadUrl(file ? file.quoteId : null, signal);
    }
    /**
     * 下载文件名消毒：split(/[\\/])/ 取末段防路径穿越 → 替换 Windows 非法字符集
     * 与控制字符为下划线 → trim → 纯点号名兜底 → 截长 180 字符。空结果兜底
     * 「下载文件」。a[download] 属性的唯一入口。
     * [DEEP-DOC]
     */
    function xySanitizeDownloadFilename(filename) {
        const baseName = String(filename ?? '').split(/[\\/]/).pop() || '';
        const safeName = baseName
            .replace(/[<>:"|?*\u0000-\u001F]/g, '_')
            .trim()
            .replace(/^\.+$/, '');
        return safeName ? safeName.slice(0, 180) : '下载文件';
    }
    /**
     * GM_xmlhttpRequest 特权下载通道 —— CORS 无关紧要的全量下载实现。
     *
     * 适用：跨域媒体直链（vod.ai-augmented.com 等，响应无 Access-Control-
     * Allow-Origin，页面 fetch 无法读取响应体）。GM 特权请求绕过同源策略。
     *
     * 机制：responseType:'arraybuffer' 全量接收（onprogress 上报 loaded/total
     * 进度）→ onload 校验 2xx → Blob 包装（Content-Type 或默认 video/mp4）→
     * objectURL + a[download] 触发保存 → 5s 后 revoke。abortHandler 监听外部
     * signal，触发时 reqObj.abort() 并以 AbortError 结算。
     *
     * 权衡：无流式落盘，大文件占内存；换来的是零 CORS 配置依赖。
     * [DEEP-DOC]
     */
    function gmDownloadFile(url, filename, signal, onProgress) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'function') {
                reject(new Error('GM_xmlhttpRequest 不可用'));
                return;
            }
            let settled = false;
            let reqObj = null;
            const finish = (err, ok) => {
                if (settled) return;
                settled = true;
                if (signal) signal.removeEventListener('abort', abortHandler);
                setTimeout(() => err ? reject(err) : resolve(ok), 0);
            };
            const abortHandler = () => {
                try { if (reqObj && reqObj.abort) reqObj.abort(); } catch(e) {}
                finish(new DOMException('用户终止下载', 'AbortError'));
            };
            if (signal) {
                if (signal.aborted) { finish(new DOMException('用户终止下载', 'AbortError')); return; }
                signal.addEventListener('abort', abortHandler, { once: true });
            }
            try {
                reqObj = GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    responseType: 'arraybuffer',
                    onprogress: (e) => {
                        if (settled || !e) return;
                        if (typeof onProgress === 'function') {
                            const totalBytes = e.total || e.totalLength || 0;
                            const receivedBytes = e.loaded || e.loadedBytes || 0;
                            const percent = totalBytes > 0 ? receivedBytes / totalBytes * 100 : null;
                            onProgress({ receivedBytes, totalBytes, percent });
                        }
                    },
                    onload: (resp) => {
                        if (settled) return;
                        if (resp.status >= 200 && resp.status < 300 && resp.response) {
                            let mime = 'video/mp4';
                            try { mime = resp.getResponseHeader('Content-Type') || mime; } catch(e) {}
                            const blob = new Blob([resp.response], { type: mime });
                            const objectUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = objectUrl;
                            a.download = xySanitizeDownloadFilename(filename);
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
                            finish(null, true);
                        } else {
                            finish(new Error(`HTTP ${resp.status}`));
                        }
                    },
                    onerror: () => finish(new TypeError('Failed to fetch')),
                    ontimeout: () => finish(new Error('下载超时')),
                });
            } catch(e) {
                finish(e);
            }
        });
    }
    /**
     * 跨域媒体判定（下载通道路由依据）：解析 URL 后两个条件同时满足才走 GM
     * 通道——origin ≠ 页面 origin 且 pathname+search 匹配 .mp4/.m3u8/.ts 后缀。
     * 同源云盘文件（oss 代理路径等）留在原生 fetch 流式通道享受进度与低内存。
     * [DEEP-DOC]
     */
    function xyIsCrossOriginMedia(url) {
        try {
            const u = new URL(String(url), window.location.origin);
            // 同源云盘文件走原 fetch 流式链路；其余媒体域名（vod.* 等）走 GM 通道
            return u.origin !== window.location.origin && /\.(mp4|m3u8|ts)([?#]|$)/i.test(u.pathname + u.search);
        } catch(e) {
            return false;
        }
    }
    /**
     * 文件落盘分发器（下载链路的最后一跳）。
     *
     * 路由规则 xyIsCrossOriginMedia(url)：
     *   true  → gmDownloadFile 特权通道（跨域媒体，绕 CORS）；
     *   false → 原生 fetch 流式通道：带 Bearer Token GET → ReadableStream 逐块
     *           读取实时进度 → Blob 拼装 → objectURL + a[download] 触发保存 →
     *           5s 后 revoke（过早 revoke 会取消保存）。支持 signal 终止（reader
     *           cancel + AbortError 结算）与 Content-Range 总长解析的进度计算。
     * [DEEP-DOC]
     */
    function downloadFile(url, filename, signal, onProgress) {
        // 跨域媒体直链：页面 fetch 会被 CORS 拦截，改走 GM_xmlhttpRequest 特权通道
        if (xyIsCrossOriginMedia(url)) {
            return gmDownloadFile(url, filename, signal, onProgress);
        }
        return new Promise((resolve, reject) => {
            const token = getCookie();
            let settled = false;
            let reader = null;
            const cleanup = () => {
                if (signal) signal.removeEventListener('abort', abortHandler);
            };
            const fail = error => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(error);
            };
            const abortHandler = () => {
                if (reader && typeof reader.cancel === 'function') {
                    Promise.resolve(reader.cancel()).catch(() => {});
                }
                fail(new DOMException('用户终止下载', 'AbortError'));
            };
            if (!token) {
                fail(new Error('登录凭证已失效，请刷新页面后重试'));
                return;
            }
            const ensureActive = () => {
                if (settled) return false;
                if (signal?.aborted) {
                    abortHandler();
                    return false;
                }
                return true;
            };
            if (signal) {
                if (signal.aborted) { abortHandler(); return; }
                signal.addEventListener('abort', abortHandler, { once: true });
            }

            (async () => {
                try {
                    const res = await fetch(url, {
                        signal: signal || undefined,
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);

                    const contentLength = Number(res.headers?.get?.('Content-Length')) || 0;
                    const contentRange = res.headers?.get?.('Content-Range') || '';
                    const rangeMatch = /\/([0-9]+)$/.exec(contentRange);
                    const rangeTotal = rangeMatch ? Number(rangeMatch[1]) : 0;
                    const totalBytes = contentLength || rangeTotal;
                    let receivedBytes = 0;
                    let blob;
                    if (res.body && typeof res.body.getReader === 'function') {
                        reader = res.body.getReader();
                        const chunks = [];
                        while (true) {
                            const result = await reader.read();
                            if (result.done) break;
                            if (!result.value) continue;
                            chunks.push(result.value);
                            receivedBytes += result.value.byteLength ?? result.value.length ?? 0;
                            if (typeof onProgress === 'function') {
                                const percent = totalBytes > 0 ? receivedBytes / totalBytes * 100 : null;
                                onProgress({ receivedBytes, totalBytes, percent });
                            }
                        }
                        if (!ensureActive()) return;
                        blob = new Blob(chunks, { type: res.headers?.get?.('Content-Type') || 'application/octet-stream' });
                    } else {
                        blob = await res.blob();
                        receivedBytes = blob.size || 0;
                        if (typeof onProgress === 'function') {
                            onProgress({ receivedBytes, totalBytes: totalBytes || receivedBytes, percent: 100 });
                        }
                    }

                    if (typeof onProgress === 'function') {
                        onProgress({ receivedBytes, totalBytes, percent: totalBytes > 0 ? 100 : null });
                    }
                    if (!ensureActive()) return;
                    const objectUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = xySanitizeDownloadFilename(filename);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    // 不能在 a.click() 后立即释放，部分浏览器会因此取消实际保存。
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
                    if (!settled) {
                        settled = true;
                        cleanup();
                        resolve(true);
                    }
                } catch (error) {
                    fail(error);
                }
            })();
        });
    }
    /** 字节量三段格式化：<1KB 显示 B；KB/MB 一位小数；≥1GB 两位小数。Number 强转兜底非法输入为 0B。
     * [DEEP-DOC]
     */
    function formatDownloadBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
        return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    /**
     * 下载进度区渲染：total<=0 时整体隐藏；否则显示完成计数、当前文件名、
     * 百分比条宽与字节明细（receivedBytes/totalBytes 经 formatDownloadBytes）。
     * 参数全部可选，缺省项保留上一次的 DOM 值不做覆写。
     * [DEEP-DOC]
     */
    function updateDownloadProgress(done, total, currentName, currentPercent, currentBytes, currentTotalBytes) {
        const wrap = document.getElementById('xy-dl-progress-wrap');
        const bar = document.getElementById('xy-dl-progress-bar');
        const state = document.getElementById('xy-dl-progress-state');
        const count = document.getElementById('xy-dl-progress-count');
        const percent = document.getElementById('xy-dl-progress-percent');
        const file = document.getElementById('xy-dl-progress-file');
        const detail = document.getElementById('xy-dl-progress-detail');
        if (!wrap) return;
        if (total <= 0) {
            wrap.style.display = 'none';
            return;
        }

        const batchPercent = Math.max(0, Math.min(done / total * 100, 100));
        const hasFileProgress = Number.isFinite(currentPercent);
        const filePercent = hasFileProgress ? Math.max(0, Math.min(currentPercent, 100)) : 0;
        const visiblePercent = hasFileProgress ? filePercent : batchPercent;
        const visiblePercentText = String(Math.round(visiblePercent)) + '%';
        const stateText = done >= total ? '已完成' : currentName ? '下载中' : done > 0 ? '准备下一项' : '准备中';
        wrap.style.display = 'block';
        if (bar) bar.style.width = String(visiblePercent.toFixed(0)) + '%';
        if (state) state.textContent = stateText;
        if (count) count.textContent = String(done) + '/' + String(total);
        if (percent) percent.textContent = hasFileProgress ? '文件 ' + visiblePercentText : '批量 ' + visiblePercentText;
        if (file) {
            file.textContent = currentName || '等待选择文件…';
            file.title = currentName || '';
            file.style.display = currentName ? 'block' : 'none';
        }
        if (detail) {
            const received = Number(currentBytes) || 0;
            const totalBytes = Number(currentTotalBytes) || 0;
            detail.textContent = received > 0
                ? '已接收 ' + formatDownloadBytes(received) + (totalBytes > 0 ? ' / ' + formatDownloadBytes(totalBytes) : '')
                : currentName ? '正在连接文件服务器…' : done >= total ? '本批次已完成' : '等待开始…';
            detail.title = detail.textContent;
        }
    }
    /**
     * 下载区按钮组状态同步（单一事实来源模式）：downloading 控制「批量下载」
     * 显隐与「停止」可用；canPause 进一步控制「暂停」可见性。所有入口（单文件/
     * 批量/终止/异常清理）都经此函数收敛按钮状态，杜绝多处手写导致的错乱。
     * [DEEP-DOC]
     */
    function setDownloadButtonsState(downloading, paused) {
        const batchBtn = document.getElementById('xy-dl-batch-download');
        const stopBtn = document.getElementById('xy-dl-stop');
        const pauseBtn = document.getElementById('xy-dl-pause');
        if (batchBtn) { batchBtn.style.display = downloading ? 'none' : ''; batchBtn.disabled = false; }
        if (stopBtn) stopBtn.style.display = downloading ? '' : 'none';
        if (pauseBtn) {
            const canPause = dlState.downloadMode === 'batch';
            pauseBtn.style.display = downloading && canPause ? '' : 'none';
            pauseBtn.textContent = paused ? '▶️ 继续' : '⏸️ 暂停';
        }
    }
    /**
     * 用户终止入口：读当前 downloadMode 决定日志文案（单文件/批量），
     * abort controller.signal 触发后整条队列在下一个检查点抛 AbortError 收场，
     * finally 统一归位。幂等：controller 已 null 时安全空操作。
     * [DEEP-DOC]
     */
    function stopBatchDownload() {
        const mode = dlState.downloadMode;
        const controller = dlState.downloadAbortController;
        if (!controller) return;
        controller.abort();
        dlState.downloadPaused = false;
        logMsg(mode === 'single' ? '⏹️ 用户终止了单文件下载' : '⏹️ 用户终止了批量下载', 'info', true);
    }
    /**
     * 下载队列执行器 —— 单文件与批量共用的核心引擎。
     *
     * 主循环逐文件：暂停门（while paused + signal 双检查）→ getFileDownloadUrl
     * 取直链 → 成功交 downloadFile 流式/特权落盘（onProgress 透传进度回调）
     * → done++ 记「已下载」日志；url 为空记「获取失败」（VOD 场景附转码提示）；
     * 抛错记「下载失败」（错误分类提示：网络不可达区分 m3u8 校园网场景/HTTP 码）。
     * AbortError 向上穿透由外层 catch 统计已完成的数量。文件间 sleep(500)
     * 礼貌间隔。finally：controller 解绑、mode 归 idle、按钮全量复位、进度条
     * 3 秒后隐藏。
     *
     * @param {Array<{name, quoteId?, source?, nodeId?}>} files
     * @param {'single'|'batch'} mode
     * @param {HTMLElement} [activeButton] - 触发按钮（执行期间置 ⏳ 并禁用）
     * [DEEP-DOC]
     */
    async function runDownloadQueue(files, mode, activeButton = null) {
        const queue = Array.isArray(files) ? files.filter(file => file && file.name) : [];
        if (queue.length === 0) return;
        if (dlState.downloadAbortController) {
            showToast('已有下载任务进行中，请等待完成或先终止当前任务', 'warning');
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;
        const originalButtonText = activeButton ? activeButton.textContent : '';
        const total = queue.length;
        let done = 0;
        let failed = 0;
        dlState.downloadAbortController = controller;
        dlState.downloadMode = mode;
        dlState.downloadPaused = false;
        if (activeButton) {
            activeButton.disabled = true;
            activeButton.textContent = '⏳';
        }
        setDownloadButtonsState(true, false);
        updateDownloadProgress(0, total);

        try {
            for (const file of queue) {
                if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');
                while (dlState.downloadPaused && !signal.aborted) await sleep(300);
                if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');

                updateDownloadProgress(done + failed, total);
                let lastProgress = { receivedBytes: 0, totalBytes: 0, percent: null };
                let fileSucceeded = false;
                let url = null;
                try {
                    url = await getFileDownloadUrl(file, signal);
                    if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');
                    if (!url) {
                        failed++;
                        const vodHint = file.source === 'vod' ? '（VOD视频未转码或不可直链，请先在播放页打开一次该视频）' : '';
                        logMsg('❌ 获取失败: ' + file.name + vodHint, 'error', true);
                    } else {
                        await downloadFile(url, file.name, signal, progress => {
                            lastProgress = progress;
                            updateDownloadProgress(done + failed, total, file.name, progress.percent, progress.receivedBytes, progress.totalBytes);
                        });
                        done++;
                        fileSucceeded = true;
                        logMsg('📥 已下载: ' + file.name, 'success', true);
                    }
                } catch (error) {
                    if (error?.name === 'AbortError') throw error;
                    failed++;
                    // 可诊断错误分类：网络不可达 / HTTP 状态错 / 其他
                    const isNetworkFail = error instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(String(error?.message || ''));
                    const httpMatch = /HTTP (\d+)/.exec(String(error?.message || ''));
                    let hint = '';
                    if (isNetworkFail) {
                        hint = url && /\.m3u8/i.test(url)
                            ? '（视频流服务器不可达：校内点播源需校园网/VPN 环境）'
                            : '（网络不可达，请检查网络连接）';
                    } else if (httpMatch) {
                        hint = `（服务器返回 ${httpMatch[1]}）`;
                    }
                    console.warn('[小雅] 下载失败详情:', file.name, url ? String(url).slice(0, 120) : '(no-url)', error);
                    logMsg('❌ 下载失败: ' + file.name + hint, 'error', true);
                }

                if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');
                updateDownloadProgress(done + failed, total, file.name, fileSucceeded ? 100 : lastProgress.percent, lastProgress.receivedBytes, lastProgress.totalBytes);
                if (done + failed < total && !dlState.downloadPaused) await sleep(500);
            }
            showToast('下载完成: ' + done + '/' + total + ' 个文件' + (failed > 0 ? ' (' + failed + ' 个失败)' : ''), 'success');
        } catch (error) {
            if (error?.name === 'AbortError') {
                updateDownloadProgress(done + failed, total);
                showToast('下载已终止: ' + done + '/' + total + ' 个文件', 'warning');
            } else {
                console.warn('[小雅] 下载任务失败:', error);
                showToast(error?.message || '文件下载失败', 'error');
            }
        } finally {
            if (dlState.downloadAbortController === controller) dlState.downloadAbortController = null;
            dlState.downloadMode = 'idle';
            dlState.downloadPaused = false;
            setDownloadButtonsState(false, false);
            const btn = document.getElementById('xy-dl-batch-download');
            if (btn) btn.innerText = '⬇️ 下载选中';
            if (activeButton) {
                activeButton.disabled = false;
                activeButton.textContent = originalButtonText;
            }
            setTimeout(() => updateDownloadProgress(-1, 0), 3000);
        }
    }
    /**
     * 批量下载入口：downloadFiles 按 normalizeDownloadId(id) ∈ 勾选集过滤出
     * selected；空集提示「请先勾选要下载的文件」；否则整体交给 runDownloadQueue
     * 以 batch 模式执行。
     * [DEEP-DOC]
     */
    async function batchDownloadSelected() {
        const selected = dlState.downloadFiles.filter(f => {
            const id = normalizeDownloadId(f.id);
            return id !== null && dlState.downloadSelectedIds.has(id);
        });
        if (selected.length === 0) { showToast('请先勾选要下载的文件', 'warning'); return; }
        await runDownloadQueue(selected, 'batch');
    }

    const DL_TYPES = [
        { key: 'video', label: '视频' },
        { key: 'audio', label: '音频' },
        { key: 'pdf', label: 'PDF' },
        { key: 'doc', label: 'Word' },
        { key: 'ppt', label: 'PPT' },
        { key: 'xls', label: 'Excel' },
        { key: 'zip', label: '压缩' },
        { key: 'other', label: '其他' }
    ];
    /**
     * 扩展名 → 类型键分类器：MP4 族→video、MP3 族→audio、PDF→pdf、
     * DOC/WPS/TXT→doc、PPT 族→ppt、XLS/CSV→xls、ZIP/RAR/7Z→zip，兜底 other。
     * 输出键与 DL_TYPES 及 downloadTypeFilter 的成员严格对应。
     * [DEEP-DOC]
     */
    function dlFileType(name) {
        const m = String(name || '').match(/\.([A-Za-z0-9]+)$/);
        const ext = m ? m[1].toUpperCase() : '';
        if (/^(MP4|AVI|MOV|WMV|FLV|MKV|M3U8|WEBM)$/.test(ext)) return 'video';
        if (/^(MP3|WAV|AAC)$/.test(ext)) return 'audio';
        if (ext === 'PDF') return 'pdf';
        if (/^(DOC|DOCX|WPS|TXT)$/.test(ext)) return 'doc';
        if (/^(PPT|PPTX)$/.test(ext)) return 'ppt';
        if (/^(XLS|XLSX|CSV)$/.test(ext)) return 'xls';
        if (/^(ZIP|RAR|7Z)$/.test(ext)) return 'zip';
        return 'other';
    }
    /** 文件类型彩色小徽章 HTML（按扩展名配色，固定宽度防抖动）。
     * [DEEP-DOC]
     */
    function dlFileChip(name) {
        const m = String(name || '').match(/\.([A-Za-z0-9]+)$/);
        const ext = m ? m[1].toUpperCase() : 'FILE';
        let bg = '#64748b';
        if (/^(MP4|AVI|MOV|WMV|FLV|MKV|M3U8|WEBM)$/.test(ext)) bg = '#7c3aed';
        else if (/^(MP3|WAV|AAC)$/.test(ext)) bg = '#db2777';
        else if (ext === 'PDF') bg = '#dc2626';
        else if (/^(DOC|DOCX|WPS)$/.test(ext)) bg = '#2563eb';
        else if (ext === 'TXT') bg = '#6b7280';
        else if (/^(PPT|PPTX)$/.test(ext)) bg = '#ea580c';
        else if (/^(XLS|XLSX|CSV)$/.test(ext)) bg = '#16a34a';
        else if (/^(ZIP|RAR|7Z)$/.test(ext)) bg = '#a16207';
        return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;padding:1px 5px;border-radius:5px;background:${bg};color:#fff;font-size:9px;font-weight:800;letter-spacing:.5px;line-height:1.7;flex-shrink:0;">${ext}</span>`;
    }
    /**
     * 下载列表排序比较器：path 按 '/' 分段逐级比较——每段查 sortMap 的单元序号；
     * 公共前缀比完后短者在前；最终以遍历序 order 定 tie-break。保证「单元内
     * 文件紧跟单元头」的自然阅读顺序。
     * [DEEP-DOC]
     */
    function dlUnitCompare(a, b) {
        const sortMap = dlState.downloadSortMap || {};
        const ap = String(a.path || '').split('/').filter(Boolean);
        const bp = String(b.path || '').split('/').filter(Boolean);
        const minLen = Math.min(ap.length, bp.length);
        for (let i = 0; i < minLen; i++) {
            if (ap[i] !== bp[i]) return (sortMap[ap[i]] || 0) - (sortMap[bp[i]] || 0);
        }
        if (ap.length !== bp.length) return ap.length - bp.length;
        return (a.order || 0) - (b.order || 0);
    }
    /**
     * 单文件下载点击处理。
     *
     * 数据恢复双保险：优先按钮 data-quote-id（列表刷新前快照，避免状态映射
     * 短暂不一致），回退按 fid 在 downloadFiles 里匹配 id/nodeId/quoteId 反查。
     * VOD 节点（source='vod'）构造携带 nodeId 的任务对象进队列走 VOD 链路；
     * 普通文件 quoteId 为 null 时提示「找不到下载资源编号」并中止。
     * preventDefault + stopPropagation 阻断行内其他点击行为。
     * [DEEP-DOC]
     */
    async function handleSingleDownloadClick(event, singleButton) {
        if (!singleButton) return;
        event.preventDefault();
        event.stopPropagation();

        const fid = normalizeDownloadId(singleButton.getAttribute('data-fid'));
        const file = fid === null ? null : dlState.downloadFiles.find(f => [f.id, f.nodeId, f.quoteId]
            .some(value => normalizeDownloadId(value) === fid));
        // 优先使用按钮生成时绑定的值，避免列表刷新后状态映射短暂不一致。
        const quoteId = normalizeDownloadId(singleButton.getAttribute('data-quote-id'))
            ?? (file ? dlQuoteId(file) : null);
        const fileName = singleButton.getAttribute('data-file-name') || file?.name || '未知文件';
        // VOD 视频任务：quote_id 是任务 ID，云盘接口必然拒绝，走 VOD 链路
        if (file && file.source === 'vod') {
            await runDownloadQueue([{ id: file.id, nodeId: file.nodeId, quoteId, name: fileName, source: 'vod' }], 'single', singleButton);
            return;
        }
        if (quoteId === null) {
            console.warn('[小雅] 单文件下载缺少 quote_id:', { fid, fileName, button: singleButton });
            showToast('找不到下载资源编号，请刷新下载列表', 'error');
            return;
        }

        await runDownloadQueue([{ id: fid, quoteId, name: fileName }], 'single', singleButton);
    }
    /** 为容器内全部 .xy-dl-single 按钮绑定 onclick（void 化异步处理防 unhandled rejection）。列表每次 renderDownloadList 后必须重绑（innerHTML 重建丢失监听）。
     * [DEEP-DOC]
     */
    function bindDownloadButtons(container) {
        if (!container) return;
        container.querySelectorAll('.xy-dl-single').forEach(button => {
            button.onclick = event => { void handleSingleDownloadClick(event, button); };
        });
    }
    /**
     * 下载文件列表主渲染管线。
     *
     * 空列表早退（0 个文件文案）；否则四段流水线：类型集 + 关键词双重过滤 →
     * downloadSortMode 选择排序器（name_asc/desc localeCompare zh-Hans-CN、
     * time_asc/desc 按 createdAt、默认 dlUnitCompare）→ 行 HTML 拼装（勾选态
     * 回显/搜索高亮省略）→ 写入 DOM 并 bindDownloadButtons 重绑。头部同步
     * 「N 个文件 (已过滤)」计数。
     * [DEEP-DOC]
     */
    function renderDownloadList() {
        const listDiv = document.getElementById('xy-dl-file-list');
        if (!listDiv) return;
        if (dlState.downloadFiles.length === 0) {
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">暂无课件资源</div>`;
            const countEl = document.getElementById('xy-dl-file-count');
            if (countEl) countEl.textContent = '0 个文件';
            return;
        }
        const keyword = (dlState.downloadSearchKeyword || '').toLowerCase().trim();
        const typeSet = dlState.downloadTypeFilter;
        const filtered = dlState.downloadFiles.filter(f => {
            if (typeSet && typeSet.size > 0 && !typeSet.has(dlFileType(f.name))) return false;
            return !keyword || f.name.toLowerCase().includes(keyword);
        });
        
        const mode = dlState.downloadSortMode;
        filtered.sort((a, b) => {
            if (mode === 'name_asc') return String(a.name).localeCompare(String(b.name), 'zh-Hans-CN');
            if (mode === 'name_desc') return String(b.name).localeCompare(String(a.name), 'zh-Hans-CN');
            if (mode === 'time_desc') return (b.createdAt || 0) - (a.createdAt || 0) || dlUnitCompare(a, b);
            if (mode === 'time_asc') return (a.createdAt || 0) - (b.createdAt || 0) || dlUnitCompare(a, b);
            return dlUnitCompare(a, b);
        });
        const countEl = document.getElementById('xy-dl-file-count');
        const typeFiltered = typeSet && typeSet.size < DL_TYPES.length;
        if (countEl) countEl.textContent = filtered.length + ' 个文件' + ((keyword || typeFiltered) ? ' (已过滤)' : '');
        if (filtered.length === 0) {
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">📭 无匹配文件</div>`;
            return;
        }
        if (mode === 'unit' && dlState.downloadDirTree && dlState.downloadDirTree.length) {
            const visibleIds = new Set(filtered.map(f => String(f.id)));
            let treeHtml = buildDownloadTreeHtml(dlState.downloadDirTree, visibleIds, 0);
            if (!treeHtml) treeHtml = `<div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">📭 无匹配文件</div>`;
            listDiv.innerHTML = treeHtml;
            bindDownloadButtons(listDiv);
            return;
        }
        const showUnit = mode === 'unit';
        const showTime = mode === 'time_desc' || mode === 'time_asc';
        let html = '';
        filtered.forEach(f => {
            const checked = dlState.downloadSelectedIds.has(String(f.id));
            const icon = dlFileChip(f.name);
            const sizeStr = f.size ? (f.size > 1048576 ? (f.size/1048576).toFixed(1)+'MB' : (f.size/1024).toFixed(0)+'KB') : '';
            const unitLabel = showUnit && Array.isArray(f.unitPath) && f.unitPath.length ? f.unitPath.join(' › ') : '';
            const timeStr = showTime && f.createdAt ? new Date(f.createdAt).toLocaleDateString('zh-CN') : '';
            const metaLine = unitLabel || timeStr;
            const quoteId = dlQuoteId(f) ?? normalizeDownloadId(f.quoteId) ?? normalizeDownloadId(f.id);
            html += `
                <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-bottom:1px solid ${T('rgba(71,85,105,0.12)','#e2e8f0')}; font-size:13px; color:${T('#cbd5e1','#334155')};">
                    <input type="checkbox" class="xy-dl-check" data-fid="${escapeHtml(f.id)}" ${checked?'checked':''} style="accent-color:#818cf8; flex-shrink:0; width:15px; height:15px; cursor:pointer;">
                    <span style="display:flex; align-items:center; gap:2px; flex-shrink:0;">
                        <span>${icon}</span>
                        <button class="xy-mini-btn xy-dl-single" data-fid="${escapeHtml(f.id)}" data-quote-id="${escapeHtml(quoteId)}" data-file-name="${escapeHtml(f.name)}" title="下载" style="padding:2px 6px; font-size:11px; flex-shrink:0; line-height:1;">⬇️</button>
                    </span>
                    <span style="flex:1;">
                        <div style="white-space:nowrap; color:${T('#e2e8f0','#0f172a')}; font-weight:500;" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
                        ${metaLine ? `<div style="font-size:10px; color:${T('#64748b','#94a3b8')}; white-space:nowrap;" title="${escapeHtml(metaLine)}">${escapeHtml(metaLine)}</div>` : ''}
                    </span>
                    <span style="font-size:11px; color:${T('#64748b','#94a3b8')}; flex-shrink:0;">${sizeStr}</span>
                </div>`;
        });
        listDiv.innerHTML = html;
        bindDownloadButtons(listDiv);
    }
    /**
     * 下载面板数据装载编排：isCurrentPanelRequest 序号防竞态 → 课程名与资源
     * 数据并发拉取 → 成功写 dlState 五件套（files/sortMap/dirTree/courseName/
     * courseGroupKey）并清空勾选集 → renderDownloadList；异常分支置错误状态条
     * 提示可点击刷新重试。面板序号不匹配的结果静默丢弃。
     * [DEEP-DOC]
     */
    async function loadDownloadPanel(groupId) {
        const requestId = ++downloadPanelRequestSeq;
        const statusEl = document.getElementById('xy-dl-status');
        const nameEl = document.getElementById('xy-dl-course-name');
        const requestedGroupKey = courseGroupKey(groupId);
        if (requestedGroupKey && !isCurrentCourseGroup(requestedGroupKey)) return;
        const isCurrentPanelRequest = () => requestId === downloadPanelRequestSeq
            && isCurrentCourseGroup(requestedGroupKey);
        dlState.downloadCourseGroupKey = requestedGroupKey;
        dlState.downloadCourseName = '';
        dlState.downloadSortMap = {};
        dlState.downloadDirTree = null;
        if (statusEl) statusEl.innerHTML = `<span style="color:${T('#a5b4fc','#3730a3')};">📡 正在加载课件资源...</span>`;
        if (nameEl) nameEl.textContent = '📦 课件资源';

        dlState.downloadFiles = [];
        dlState.downloadSelectedIds.clear();
        dlState.downloadSearchKeyword = '';
        const searchInput = document.getElementById('xy-dl-search');
        if (searchInput) searchInput.value = '';
        renderDownloadList();

        if (!groupId) {
            if (statusEl) statusEl.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">⚠️ 未检测到课程 ID，请进入课程页面后重试</span>`;
            return;
        }

        try {
            const apiName = await getCourseNameFromAPI(groupId);
            if (!isCurrentPanelRequest()) return;
            dlState.downloadCourseName = apiName || '课件资源';
            if (nameEl) nameEl.textContent = '📦 ' + dlState.downloadCourseName;

            const resourceResult = await fetchDownloadResources(groupId);
            if (!isCurrentPanelRequest()) return;
            if (resourceResult === null) {
                dlState.downloadCourseGroupKey = '';
                dlState.downloadCourseName = '';
                dlState.downloadFiles = [];
                dlState.downloadSortMap = {};
                dlState.downloadDirTree = null;
                if (statusEl) statusEl.innerHTML = `<span style="color:${T('#f87171','#b91c1c')};">⚠️ 课件资源加载失败，可点击刷新重试</span>`;
                renderDownloadList();
                return;
            }
            dlState.downloadSortMap = resourceResult.sortMap;
            dlState.downloadDirTree = resourceResult.dirTree;
            dlState.downloadFiles = resourceResult.files;
            if (statusEl) {
                statusEl.innerHTML = resourceResult.files.length > 0
                    ? `<span style="color:${T('#34d399','#065f46')};">✅ 已加载 ${resourceResult.files.length} 个课件文件</span>`
                    : `<span style="color:${T('#94a3b8','#64748b')};">📭 当前课程无可下载的课件</span>`;
            }
            renderDownloadList();
        } catch (e) {
            if (!isCurrentPanelRequest()) return;
            dlState.downloadCourseGroupKey = '';
            dlState.downloadCourseName = '';
            dlState.downloadFiles = [];
            dlState.downloadSortMap = {};
            dlState.downloadDirTree = null;
            if (statusEl) statusEl.innerHTML = `<span style="color:${T('#f87171','#b91c1c')};">⚠️ 课件资源加载异常，可点击刷新重试</span>`;
            renderDownloadList();
            console.warn('[小雅] 下载区面板加载失败:', e);
        }
    }
    /**
     * 进入下载区编排：不在下载区时把当前区记入 prevZone（返回按钮的落点）→
     * getCourseGroupId 取课程上下文 → switchToZone(ZONE.DOWNLOAD) →
     * 异步 loadDownloadPanel(groupId)，异常 warn 不打断 UI。
     * [DEEP-DOC]
     */
    function enterDownloadZone() {
        if (playState.activeZone !== ZONE.DOWNLOAD) playState.prevZone = playState.activeZone;
        const groupId = getCourseGroupId();
        switchToZone(ZONE.DOWNLOAD);
        void loadDownloadPanel(groupId).catch(e => {
            console.warn('[小雅] 下载区加载失败:', e);
        });
    }
    /**
     * 任务 → 资源 ID 反查：resource_id 直取；缺失时 loadCourseResources 拉
     * 课程资源树，extractFilesFromResources 展平后按 node_id/id 匹配目标节点
     * 取其资源 ID。全程 try-catch 包裹（树拉取失败不致命），最终兜底 task.id
     * ——宁可跳到近似位置也不让连播断链。
     * [DEEP-DOC]
     */
    async function getTaskResourceId(task) {
        if (task.resource_id) return task.resource_id;
        try {
            const resources = await loadCourseResources(task.group_id);
            if (resources) {
                const flatRes = extractFilesFromResources(resources);
                const rInfo = flatRes.find(r => r.node_id == task.node_id || r.id == task.node_id);
                if (rInfo) return (rInfo.id || rInfo.resource_id);
            }
        } catch(e) { console.warn('[小雅] 获取任务资源ID失败:', task && task.node_id, e); }
        return task.id; 
    }
    /**
     * 阻断式确认弹窗工厂：全屏遮罩 + 渐入卡片（红色警示头部 + 消息区 +
     * 「我知道了」按钮）。onConfirm 在弹窗关闭动画后回调。遮罩点击空白关闭。
     * 用于不可逆操作前的确认（如越级解锁警告）。
     * [DEEP-DOC]
     */
    function xyShowModal(title, message, onConfirm = null) {
        if (!document.body) return;
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483647; opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px); padding: 20px;`;
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="background: ${T('linear-gradient(145deg, #1e293b, #0f172a)','#ffffff')}; border-radius: 16px; min-width: 380px; max-width: 90%; padding: 28px; box-shadow: ${T('0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(71,85,105,0.3)','0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)')}; border: 1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; transform: scale(0.95); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #f87171, #fb923c); opacity: 0.8;"></div>
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${T('rgba(248,113,113,0.12)','#fee2e2')}; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid ${T('rgba(248,113,113,0.2)','#fecaca')};">⚠️</div>
                    <h3 style="margin: 0; color: ${T('#f1f5f9','#0f172a')}; font-size: 18px; font-weight: 700;">${title}</h3>
                </div>
                <div style="color: ${T('#cbd5e1','#475569')}; line-height: 1.7; margin-bottom: 24px; font-size: 14px; background: ${T('rgba(248,113,113,0.05)','#fef2f2')}; padding: 18px; border-radius: 10px; border: 1px solid ${T('rgba(248,113,113,0.1)','#fecaca')};">${message}</div>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="modal-confirm" style="padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #f87171, #ef4444); color: white; box-shadow: 0 4px 12px rgba(239,68,68,0.25); transition: all 0.2s;">我知道了</button>
                </div>
            </div>`;
        modal.appendChild(content); document.body.appendChild(modal);
        requestAnimationFrame(() => { modal.style.opacity = '1'; content.firstElementChild.style.transform = 'scale(1)'; });
        const closeModal = () => { modal.style.opacity = '0'; content.firstElementChild.style.transform = 'scale(0.95)'; setTimeout(() => modal.remove(), 300); };
        content.querySelector('.modal-confirm').onclick = () => { closeModal(); if(onConfirm) onConfirm(); };
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
    /**
     * 轻提示浮层：body 右下角堆叠，四类型配色映射（success 绿/warning 黄/
     * error 红/info 灰），入场 translateY 弹性动画，2600ms 后淡出移除。
     * document.body 未就绪时静默丢弃（启动期保护）。
     * [DEEP-DOC]
     */
    function showToast(msg, type = 'info') {
        
        if (!document.body) {
            setTimeout(() => showToast(msg, type), 500);
            return;
        }
        
        const colors = { success: { bg: T('rgba(15,23,42,0.95)','#ffffff'), icon: '🎉', accent: '#34d399', border: T('rgba(52,211,153,0.25)','#a7f3d0'), text: T('#e2e8f0','#0f172a') }, warning: { bg: T('rgba(15,23,42,0.95)','#ffffff'), icon: '⚠️', accent: '#fbbf24', border: T('rgba(251,191,36,0.25)','#fde68a'), text: T('#e2e8f0','#0f172a') }, error: { bg: T('rgba(15,23,42,0.95)','#ffffff'), icon: '❌', accent: '#f87171', border: T('rgba(248,113,113,0.25)','#fecaca'), text: T('#e2e8f0','#0f172a') }, info: { bg: T('rgba(15,23,42,0.95)','#ffffff'), icon: 'ℹ️', accent: '#818cf8', border: T('rgba(129,140,248,0.25)','#c7d2fe'), text: T('#e2e8f0','#0f172a') } };
        const currentType = colors[type] || colors.info;
        let container = document.getElementById('xy-toast-box');
        if (!container) { container = document.createElement('div'); container.id = 'xy-toast-box'; container.style.cssText = `position:fixed; top:32px; left:50%; transform:translateX(-50%); z-index:9999999; display:flex; flex-direction:column; gap:16px; pointer-events:none;`; document.body.appendChild(container); }
        const toast = document.createElement('div');
        toast.style.cssText = `background:${currentType.bg}; color:${currentType.text}; padding:14px 22px; border-radius:10px; font-weight:600; font-size:14px; box-shadow:${T('0 12px 30px rgba(0,0,0,0.4)','0 8px 24px rgba(0,0,0,0.08)')}, 0 0 0 1px ${currentType.border}; transition:all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); opacity:0; transform:translateY(-30px) scale(0.9); backdrop-filter: ${T('blur(12px)','none')}; display:flex; align-items:center; overflow:hidden; position:relative;`;
        toast.innerHTML = `<span style="margin-right:10px; font-size:18px;">${currentType.icon}</span><span style="flex:1; z-index:1; line-height: 1.4;">${escapeHtml(msg)}</span><div style="position:absolute; bottom:0; left:0; height:3px; background:${currentType.accent}; width:100%; transform-origin:left; animation: xy-toast-progress 3s linear forwards; opacity: 0.5;"></div>`;
        container.appendChild(toast);
        if(!document.getElementById('xy-toast-style')) { const style = document.createElement('style'); style.id = 'xy-toast-style'; style.innerHTML = `@keyframes xy-toast-progress{from{transform:scaleX(1)}to{transform:scaleX(0)}}@keyframes xy-spin{to{transform:rotate(360deg)}}@keyframes xy-indeterminate{0%{transform:translateX(-100%)}50%{transform:translateX(150%)}100%{transform:translateX(350%)}}`; document.head.appendChild(style); }
        requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0) scale(1)'; });
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px) scale(0.9)'; setTimeout(() => toast.remove(), 400); }, 3000);
    }
    /**
     * 统一日志管线 —— 全脚本的诊断信息出口。
     *
     * 双写：终端面板 DOM 追加行（带时间戳与类型配色）+ sessionStorage 环形
     * 持久化（xy_session_logs，JSON 上限截断）。echo 参数控制是否同步打页面
     * console（默认关键日志才打，避免刷屏）。silent 类型仅入库不上屏。
     * [DEEP-DOC]
     */
    function logMsg(msg, type = 'info', isSilent = false) {
        const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#38bdf8', silent: '#94a3b8' };
        const color = isSilent ? colors.silent : (colors[type] || colors.info);
        const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
        const logStr = `[${time}] ${msg}`;
        sessionLogs.push({ text: logStr, color: color });
        if (sessionLogs.length > 80) sessionLogs.shift();
        
        
        try { sessionStorage.setItem('xy_session_logs', JSON.stringify(sessionLogs)); } catch (e) {}
        
        // 追加到终端视图（若已渲染）
        const logBox = document.getElementById('xy-activity-log');
        if (logBox) {
            const el = document.createElement('div'); el.style.color = color; el.style.marginBottom = '4px'; el.style.lineHeight = '1.5'; el.innerText = logStr; logBox.appendChild(el);
            logBox.scrollTop = logBox.scrollHeight;
            if (logBox.children.length > 80) logBox.removeChild(logBox.firstChild);
        }

        if (!isSilent && (type === 'success' || type === 'error' || type === 'warning' || type === 'info')) showToast(msg, type);
    }
    /**
     * 强化点击：优先 element.click()；抛错或元素不可点击时回退构造
     * MouseEvent('click', {bubbles, cancelable, view}) 手动派发——穿透部分
     * 前端框架对原生 click 的拦截层。用于自动化流程中的按钮触发。
     * [DEEP-DOC]
     */
    function robustClick(el) {
        if (!el) return;
        try { const opts = { bubbles: true, cancelable: true, view: window }; el.dispatchEvent(new MouseEvent('pointerdown', opts)); el.dispatchEvent(new MouseEvent('click', opts)); el.click(); } catch (e) { el.click(); }
    }
    /**
     * 动态防卡死刷新注册器：先清旧定时器再设新的 setTimeout(ms) 到点 reload。
     * 附带 reason 写入 sessionStorage（xy_reload_reason）供重载后诊断。
     * 同一策略键重复注册以最新一次为准。
     * [DEEP-DOC]
     */
    function scheduleDynamicRefresh(delayMs, reason) {
        if (dynamicRefreshTimeoutId) clearTimeout(dynamicRefreshTimeoutId);
        if (refreshCountdownTimer) clearInterval(refreshCountdownTimer);
        
        const targetTime = Date.now() + delayMs;
        logMsg(`🔄 动态重载调度：已设定 ${Math.round(delayMs/60000)} 分钟后刷新 (${reason})`, 'silent', true);
        
        const updateVisuals = () => {
            const statusEl = document.getElementById('xy-refresh-status');
            if (statusEl) {
                const leftMs = targetTime - Date.now();
                if (leftMs > 0) {
                    const m = Math.floor(leftMs / 60000);
                    const s = Math.floor((leftMs % 60000) / 1000).toString().padStart(2, '0');
                    statusEl.innerText = `即将重载: ${m}分 ${s}秒 (${reason})`;
                } else {
                    statusEl.innerText = `正在执行重载...`;
                }
            }
        };
        updateVisuals();
        refreshCountdownTimer = setInterval(updateVisuals, 1000);

        dynamicRefreshTimeoutId = setTimeout(() => {
            logMsg(`🔄 触发动态定时重载...`, 'info', false);
            window.location.reload();
        }, delayMs);
    }
    /** 清除动态刷新定时器、lastRefreshStrategy 复位为 'none'，并移除挂起的 timeout 句柄。
     * [DEEP-DOC]
     */
    function clearDynamicRefresh() {
        let cleared = false;
        if (dynamicRefreshTimeoutId) {
            clearTimeout(dynamicRefreshTimeoutId);
            dynamicRefreshTimeoutId = null;
            cleared = true;
        }
        if (refreshCountdownTimer) {
            clearInterval(refreshCountdownTimer);
            refreshCountdownTimer = null;
            cleared = true;
        }
        
        lastRefreshStrategy = 'none';
        
        const statusEl = document.getElementById('xy-refresh-status');
        if (statusEl && statusEl.innerText !== '目前无重载任务') {
            statusEl.innerText = '目前无重载任务';
        }
        
        if (cleared) {
            logMsg(`🛑 动态重载已在当前区域彻底挂起并强停`, 'silent', true);
        }
    }
    /**
     * 刷新策略决策器（每扫描周期调用）：
     *   loop 模式：>1h 长视频按时长×1.2 注册一次性刷新；普通视频/文档按
     *     15min 周期防卡死；达标后切 sequence_completed 策略。
     *   sequence 模式：已达标或休眠中 → 10min 探测刷新；doc 引擎挂机中 →
     *     15min 防卡死；其余清除刷新。
     * manual 模式整体跳过。所有周期常量内联于分支中，改动需同步 BACKOFF 注释。
     * [DEEP-DOC]
     */
    function checkDynamicRefresh() {
        
        if (playState.activeZone !== ZONE.COURSE || playState.mode === PLAY_MODE.MANUAL) {
            if (lastRefreshStrategy !== 'none' || dynamicRefreshTimeoutId) { 
                clearDynamicRefresh(); 
            }
            return;
        }

        const currentTaskType = playState.currentEngine;

        if (playState.mode === PLAY_MODE.LOOP) {
            if (currentTaskType === TASK_TYPE.DOC) {
                if (lastRefreshStrategy !== 'loop_doc') {
                    lastRefreshStrategy = 'loop_doc';
                    scheduleDynamicRefresh(15 * 60 * 1000, `文档挂机防卡死`);
                }
            } else {
                let video = document.querySelector('video');
                if (!video) {
                    const iframes = document.querySelectorAll('iframe');
                    for (let i = 0; i < iframes.length; i++) {
                        try { if (iframes[i].contentDocument) video = iframes[i].contentDocument.querySelector('video'); } catch(e){}
                        if (video) break;
                    }
                }
                if (video && video.duration >= 3600) {
                    const strategyKey = `loop_video_${video.duration}`;
                    if (lastRefreshStrategy !== strategyKey) {
                        lastRefreshStrategy = strategyKey;
                        scheduleDynamicRefresh(1.2 * video.duration * 1000, `安全循环>1h长视频`);
                    }
                } else {
                    if (lastRefreshStrategy !== 'none' && !lastRefreshStrategy.startsWith('loop_video_')) {
                        clearDynamicRefresh(); 
                    } else if (lastRefreshStrategy.startsWith('loop_video_') && video && video.duration < 3600) {
                        clearDynamicRefresh(); 
                    }
                }
            }
        } else if (playState.mode === PLAY_MODE.SEQUENCE) {
            if (playState.isTaskCompleted || Date.now() < playState.jumpSleepUntil) {
                if (lastRefreshStrategy !== 'sequence_completed') {
                    lastRefreshStrategy = 'sequence_completed';
                    scheduleDynamicRefresh(10 * 60 * 1000, `连播状态休眠探测`);
                }
            } else if (currentTaskType === TASK_TYPE.DOC) {
                if (lastRefreshStrategy !== 'sequence_doc') {
                    lastRefreshStrategy = 'sequence_doc';
                    scheduleDynamicRefresh(15 * 60 * 1000, `文档挂机防卡死`);
                }
            } else {
                if (lastRefreshStrategy !== 'none') {
                    clearDynamicRefresh(); 
                }
            }
        }
    }
    /**
     * DOM 启发式扫人：querySelectorAll 匹配 class 含 name/author/nick 及
     * .reply-user 的元素；文本过滤规则——长度 2-15、无换行无等号、命中黑名单
     * 词表（回复/评论/作者等功能词）或含课程作业类关键词的剔除；幸存文本经
     * cleanName 净化去重后返回数组。作为网络抓包名单的补充来源。
     * [DEEP-DOC]
     */
    function scanDomForUserNames() {
        let names = [];
        try {
            const els = document.querySelectorAll('[class*="name"], [class*="author"], [class*="nick"], .reply-user');
            els.forEach(el => {
                const cName = (typeof el.className === 'string' ? el.className : '').toLowerCase();
                if (cName.includes('course') || cName.includes('group') || cName.includes('title') || 
                    cName.includes('task') || cName.includes('file') || cName.includes('nav') || 
                    cName.includes('logo') || cName.includes('menu')) {
                    return;
                }

                let txt = el.innerText ? el.innerText.trim() : '';
                if (txt && txt.length > 1 && txt.length <= 15 && !txt.includes('\n') && !txt.includes('=')) {
                    if (!/^(回复|评论|作者|楼主|老师|助教|管理员|匿名|刚刚|今天|昨天|分享|赞|查看|更多|展开|全部|时间|我的|首页|取消|确定|保存|上传|下载|关闭)$/.test(txt) && !/(课程|作业|考试|测验|班级|任务|讨论区)/.test(txt)) {
                        names.push(cleanName(txt));
                    }
                }
            });
        } catch(e) {}
        return names;
    }
    /**
     * 讨论区身份捕获事件派发：did/gid 双非空且与现值不同才派发
     * 'xy-disc-captured'（detail 携带双 ID）并更新 discState。幂等设计：
     * 同一讨论区的重复捕获不重复广播，避免下游名单库被误清空。
     * [DEEP-DOC]
     */
    function dispatchCaptureEvent(did, gid) {
        if (did && gid && (discState.discussionId !== did || discState.discGroupId !== gid)) {
            discState.discussionId = did; discState.discGroupId = gid;
            window.dispatchEvent(new CustomEvent('xy-disc-captured', { detail: { did, gid } }));
        }
    }
    /**
     * 截包评论列表处理：逐条 decodeNickname 解码真实姓名（排除「匿名」与含
     * '=' 的坏解码），增量并入 targetNames（includes 去重）；有新增时持久化
     * GM + 重渲名单列表 + 讨论区激活态下打「捕获 N 位新用户」日志。
     * [DEEP-DOC]
     */
    function processDiscussionList(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const newNames = [];
        list.forEach(item => { const realName = decodeNickname(item.nickname); if (realName && realName !== "匿名" && !realName.includes("=")) newNames.push(realName); });
        
        if (newNames.length > 0) {
            const beforeCount = discState.targetNames.length;
            let added = false;
            newNames.forEach(n => {
                if(!discState.targetNames.includes(n)) {
                    discState.targetNames.push(n);
                    added = true;
                }
            });
            if (added) {
                GM_setValue('xy_target_names', JSON.stringify(discState.targetNames));
                renderTargetList(document.getElementById('xy-name-search')?.value || '');
                if(playState.activeZone === ZONE.DISC) logMsg(`📄 网络包捕获 ${discState.targetNames.length - beforeCount} 位新用户`, 'info', true);
            }
        }
    }

    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0]; let shouldProcess = false;
        try {
            if (typeof url === 'string' && (url.includes('/api/jx-iresource/discussion/queryDiscussion') || url.includes('/api/jx-iresource/discussion/queryPoint'))) {
                const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);
                const did = urlObj.searchParams.get('discussion_id'); const gid = urlObj.searchParams.get('group_id');
                if(did && gid) dispatchCaptureEvent(did, gid);
                shouldProcess = true;
            }
        } catch(e) {}

        const response = await originalFetch.apply(this, args);
        if (shouldProcess) {
            try {
                const clonedResponse = response.clone(); const data = await clonedResponse.json();
                if (data.success && data.data) {
                    let list = null;
                    if (Array.isArray(data.data.list)) list = data.data.list; else if (Array.isArray(data.data.records)) list = data.data.records; else if (Array.isArray(data.data.points)) list = data.data.points; else if (Array.isArray(data.data)) list = data.data;
                    if (list) processDiscussionList(list);
                }
            } catch(e) { console.warn('[小雅] 讨论列表响应解析失败(fetch):', e); }
        }
        return response;
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) { this._xy_current_url = url; this._xy_should_process = false; return originalXhrOpen.apply(this, arguments); };

    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        const xhr = this;
        try {
            const url = xhr._xy_current_url;
            if (typeof url === 'string' && (url.includes('/api/jx-iresource/discussion/queryDiscussion') || url.includes('/api/jx-iresource/discussion/queryPoint'))) {
                const urlObj = new URL(url.startsWith('http') ? url : window.location.origin + url);
                const did = urlObj.searchParams.get('discussion_id'); const gid = urlObj.searchParams.get('group_id');
                if(did && gid) dispatchCaptureEvent(did, gid);
                xhr._xy_should_process = true;
            }
        } catch(e) {}

        xhr.addEventListener('load', function() {
            if (!xhr._xy_should_process) return;
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.success && data.data) {
                    let list = null;
                    if (Array.isArray(data.data.list)) list = data.data.list; else if (Array.isArray(data.data.records)) list = data.data.records; else if (Array.isArray(data.data.points)) list = data.data.points; else if (Array.isArray(data.data)) list = data.data;
                    if (list) processDiscussionList(list);
                }
            } catch(e) { console.warn('[小雅] 讨论列表响应解析失败(xhr):', e); }
        });
        return originalXhrSend.apply(this, arguments);
    };
    /**
     * 作业请求参数抽取：URL 对象的 group_id/node_id/paper_id 查询参数逐一
     * 回填 hw 模块三参状态（空值保留原值）。fetch 与 XHR 两条劫持链都汇入此处。
     * [DEEP-DOC]
     */
    function hwCaptureParams(rawUrl) {
        try {
            const urlObj = new URL(rawUrl, window.location.origin);
            hwGroupId = urlObj.searchParams.get('group_id') || hwGroupId;
            hwNodeId = urlObj.searchParams.get('node_id') || hwNodeId;
            hwPaperId = urlObj.searchParams.get('paper_id') || hwPaperId;
        } catch(e) { console.warn('[小雅辅助] 无法解析作业请求参数', e); }
    }

    (function() {
        
        const _prevFetch = window.fetch;
        window.fetch = async function(input, init) {
            const rawUrl = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
            if (rawUrl && rawUrl.includes('/queryStuPaper/v2')) {
                // 同时兼容旧 quiz/ 前缀与新 survey/course/ 前缀的试卷接口
                const response = await _hw_nativeFetch.apply(this, arguments);
                // 参数学习后置 + 仅采信成功响应：防止主动拉取的 404 探测自我污染参数缓存
                if (response.ok) {
                    console.log('[小雅辅助·作业区] 已捕获 fetch 题目数据包(200)');
                    hwCaptureParams(rawUrl);
                }
                try {
                    const cloned = response.clone();
                    let data;
                    try { data = await cloned.json(); } catch(e) { data = JSON.parse(await cloned.text()); }
                    if (data && data.data && data.data.questions) hwProcessPaperData(data);
                } catch(e) { console.error('[小雅辅助·作业区] fetch 数据解包失败', e); }
                return response;
            }
            return _prevFetch.apply(this, arguments);
        };

        
        const _prevXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._hw_url = typeof url === 'string' ? url : String(url);
            return _prevXhrOpen.apply(this, [method, url, ...rest]);
        };

        
        const _prevXhrSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...rest) {
            const self = this;
            if (self._hw_url && self._hw_url.includes('/queryStuPaper/v2')) {
                self.addEventListener('load', function() {
                    // 参数学习后置 + 仅采信成功响应（与 fetch 劫持器同策略）
                    if (self.status === 200) {
                        console.log('[小雅辅助·作业区] 已捕获 XHR 题目数据包(200)');
                        hwCaptureParams(self._hw_url);
                    }
                });
                self.addEventListener('load', function() {
                    try {
                        let data;
                        if (self.responseType === 'blob' && self.response) {
                            self.response.text().then(text => {
                                const parsed = JSON.parse(text);
                                if (parsed && parsed.data && parsed.data.questions) hwProcessPaperData(parsed);
                            }).catch(e => console.error('[小雅辅助·作业区] blob→text 解包失败', e));
                            return;
                        }
                        if (self.responseType === 'json' && self.response) data = self.response;
                        else if ((self.responseType === '' || self.responseType === 'text') && self.responseText) data = JSON.parse(self.responseText);
                        if (data && data.data && data.data.questions) hwProcessPaperData(data);
                    } catch(e) { console.error('[小雅辅助·作业区] XHR 解包失败', e); }
                });
                return _hw_nativeXhrSend.apply(this, rest);
            }
            return _prevXhrSend.apply(this, rest);
        };
    })();

    window.addEventListener('xy-disc-captured', (e) => {
        if (xyShouldKeepDashboardOverview(getCourseGroupId())) return;
        discState.discLockedUrl = window.location.href; 
        if (playState.activeZone !== ZONE.DISC) { 
            logMsg(`🎯 抓包拦截：零延迟识别讨论区网络流！`, 'success', false); 
            switchToZone('disc'); 
        }
        
        logMsg('🔄 检测到新讨论区，自动清空旧名单并开启全量采集...', 'info');
        discState.targetNames = [];
        discState.selectedNames.clear();
        GM_setValue('xy_target_names', JSON.stringify([]));
        renderTargetList(document.getElementById('xy-name-search')?.value || '');
        
        setTimeout(() => {
            fetchCurrentUsers();
        }, 800);

        updateDiscUI(); 
    });
    /**
     * 当前页任务类型精确判定（async 因需探测 iframe）。
     *
     * 判定顺序：主文档 video/.prism-player/.aliplayer → video；遍历 iframe：
     * src 含 player/video/aliplayer → video；contentDocument 可访问且内部有
     * video → video（跨域 iframe 抛错被 catch 吞掉继续下一个）；兜底 doc。
     * @returns {Promise<'video'|'doc'>}
     * [DEEP-DOC]
     */
    async function getTaskTypeAccurate() {
        if (document.querySelector('video') || document.querySelector('.prism-player') || document.querySelector('.aliplayer')) return TASK_TYPE.VIDEO;
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            const src = iframes[i].src || ''; if (src.includes('player') || src.includes('video') || src.includes('aliplayer')) return TASK_TYPE.VIDEO;
            try { if (iframes[i].contentDocument && iframes[i].contentDocument.querySelector('video')) return TASK_TYPE.VIDEO; } catch(e) {}
        }
        return TASK_TYPE.DOC;
    }
    /**
     * 任务完成验证提交器（挂机引擎的核心出口）。
     *
     * 组装当前课程/节点的完成上报请求发往平台接口，解析响应判定 success。
     * 调用方分布：循环模式播完即交、sequence 定时器达标强交、快速击破手动触发。
     * @returns {Promise<boolean>} 平台确认成功与否
     * [DEEP-DOC]
     */
    async function autoSubmitCurrentTask(silent = false) {
        if (isSubmittingLock) return false;
        isSubmittingLock = true;
        try {
            const token = await getAuthToken(); const groupId = getCourseGroupId(); const nodeId = getNodeId(); if (!groupId || !nodeId) return false;
            
            let taskId = null;
            const radarData = await fetchRadarCached();
            if (radarData && radarData.success && radarData.data) {
                const rTask = radarData.data.find(t => t.node_id == nodeId);
                if (rTask && rTask.finish !== 2) {
                    taskId = rTask.task_id || rTask.id;
                } else if (!rTask || rTask.finish === 2) {
                    if (!silent) logMsg('✅ [雷达] 任务已在后台完成，无需再提交！', 'success', false);
                    return true; 
                }
            }
            
            if (!taskId) {
                const resources = await loadCourseResources(groupId);
                if (resources) {
                    const flatRes = extractFilesFromResources(resources);
                    const currentRes = flatRes.find(r => r.node_id == nodeId || r.id == nodeId); 
                    if (currentRes) taskId = currentRes.task_id || currentRes.id;
                }
            }

            if (!taskId) return false;
            
            const finishRes = await fetch(`https://${domain}/api/jx-iresource/resource/finishActivity`, { 
                method: "POST", 
                headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, 
                body: JSON.stringify({ group_id: groupId, node_id: nodeId, task_id: taskId }) 
            });
            const finishData = await finishRes.json();
            
            if (finishData.success === true || finishData.code === 200 || finishData.code === 0) {
                if (!silent) { logMsg('✅ [API] 任务时长达标，后端已成功确认！', 'success', false); }
                return true;
            } else {
                if (!silent) logMsg(`⚠️ 时长验证未通过，等待下一次提交心跳...`, 'warning', true);
                return false;
            }
        } catch(e) { 
            if (!silent) logMsg(`❌ 任务提交请求异常`, 'error', true); 
        } finally {
            isSubmittingLock = false;
        }
        return false;
    }
    /**
     * 连播跳转下一任务编排（指数退避宿主）。
     *
     * 成功路径：雷达锁定未完成任务 → getTaskResourceId 补全三元组 →
     * jumpFailCount 归零 → 500ms 后整页跳转 resource/{res}/{node}，5s 后解除
     * isJumpingLock 兜底。失败路径：failCount++ 按 SUCCESS_DELAYS_MS 梯度延迟
     * 解锁重试；连续 6 次进入深度休眠（jumpSleepUntil = now+10min）并复位计数。
     * 异常路径独立退避表 ERROR_DELAYS_MS，5 次休眠。两套阈值均在 BACKOFF 常量。
     * [DEEP-DOC]
     */
    async function tryJumpToNext() {
        if (isJumpingLock) return; 
        if (Date.now() < playState.jumpSleepUntil) return; 
        if (xyScheduleState.isRunning) return; 

        isJumpingLock = true;
        
        try {
            const currentGroupId = getCourseGroupId(); 
            const currentNodeId = getNodeId(); 
            
            logMsg('🔄 正在通过【全局雷达】匹配下一项自主观看任务...', 'info', false);
            
            _radarCache.time = 0; 
            const unfinishData = await fetchRadarCached();
            const unfinishTasks = (unfinishData && unfinishData.success && unfinishData.data) ? unfinishData.data : [];
            const now = new Date();
            
            const watchTasks = unfinishTasks.filter(t => {
                if (t.task_type !== 1) return false; 
                if (t.finish === 2) return false; 
                if (t.node_id == currentNodeId) return false; 
                if (t.start_time && new Date(t.start_time) > now) return false; 
                return true;
            });
            
            let targetTask = null;
            if (watchTasks.length > 0) {
                let courseTasks = watchTasks.filter(t => t.group_id == currentGroupId);
                if (courseTasks.length > 0) {
                    
                    courseTasks.sort((a, b) => (parseInt(a.node_id) || 0) - (parseInt(b.node_id) || 0));
                    
                    targetTask = courseTasks.find(t => (parseInt(t.node_id) || 0) > (parseInt(currentNodeId) || 0)) || courseTasks[0];
                } else {
                    
                    const courseCountMap = {};
                    watchTasks.forEach(t => { courseCountMap[t.group_id] = (courseCountMap[t.group_id] || 0) + 1; });
                    watchTasks.sort((a, b) => (courseCountMap[b.group_id] - courseCountMap[a.group_id]) || ((parseInt(a.node_id) || 0) - (parseInt(b.node_id) || 0)));
                    targetTask = watchTasks[0];
                }
            }

            if (targetTask) {
                const resId = await getTaskResourceId(targetTask);

                logMsg(`⏭️ 雷达锁定目标：${targetTask.name}，执行跨节点跳转！`, 'success', false);

                const pathPrefix = window.location.href.includes('/course/') ? 'course' : 'mycourse';

                playState.jumpFailCount = 0; 
                setTimeout(() => { 
                    window.location.href = `/app/jx-web/${pathPrefix}/${targetTask.group_id}/resource/${resId}/${targetTask.node_id}`; 
                }, 500);
                
                setTimeout(() => { isJumpingLock = false; }, 5000);
                return;
            }
            
            playState.jumpFailCount++;
            const failCount = playState.jumpFailCount;
            
            const delays = BACKOFF.SUCCESS_DELAYS_MS;
            const delay = delays[Math.min(failCount - 1, delays.length - 1)];

            if (failCount >= BACKOFF.MAX_SUCCESS_FAILS) {
                 logMsg('⏳ 连续6次探测无新任务，引擎进入休眠模式，10分钟后重载...', 'warning', false);
                 playState.jumpSleepUntil = Date.now() + BACKOFF.SLEEP_MS;
                 playState.jumpFailCount = 0;
                 updateCourseUI();
                 isJumpingLock = false;
            } else {
                 const waitSec = Math.round(delay / 1000);
                 logMsg(`⏳ 探测无新任务，${waitSec}秒后重试 (第${failCount}次，指数退避)...`, 'warning', false);
                 setTimeout(() => { isJumpingLock = false; }, delay);
            }

        } catch(e) {
            playState.jumpFailCount++;
            const failCount = playState.jumpFailCount;
            const delays = BACKOFF.ERROR_DELAYS_MS;
            const delay = delays[Math.min(failCount - 1, delays.length - 1)];

            if (failCount >= BACKOFF.MAX_ERROR_FAILS) {
                 logMsg('⏳ 网络探测连续5次异常，进入深度休眠，10分钟后重新探测...', 'warning', false);
                 playState.jumpSleepUntil = Date.now() + BACKOFF.SLEEP_MS;
                 playState.jumpFailCount = 0;
                 updateCourseUI();
                 isJumpingLock = false;
            } else {
                 logMsg(`雷达连通异常，${Math.round(delay/1000)}秒后重试 (第${failCount}次)...`, 'error', false);
                 setTimeout(() => { isJumpingLock = false; }, delay);
            }
        }
    }

    let lastTaskCheck = 0;
    /**
     * 全局达成秒判器（6s 节流 + force 穿透）：拉雷达缓存查当前 node 是否仍在
     * 未完成清单——不在说明别处已完成（多端同步场景），立即置 isTaskCompleted
     * 放行并尝试跳转，省去本地重复挂机。
     * [DEEP-DOC]
     */
    async function globalTaskStatusChecker(forceCheck = false) {
        if (playState.mode === PLAY_MODE.MANUAL && !forceCheck) return;
        const groupId = getCourseGroupId(); const nodeId = getNodeId();
        if (!groupId || !nodeId || (Date.now() - lastTaskCheck < 6000 && !forceCheck)) return;
        lastTaskCheck = Date.now();
        
        try {
            const data = await fetchRadarCached();
            if (data && data.success && data.data) {
                const isStillUnfinished = data.data.filter(t => t.task_type === 1).some(t => t.node_id == nodeId);
                if (!isStillUnfinished) {
                    if (!playState.isTaskCompleted) {
                        playState.isTaskCompleted = true; updateCourseUI(); await autoSubmitCurrentTask(true);
                        logMsg('✅ [雷达] 当前任务已在全局雷达达成！', 'success', false);
                    }
                } else { 
                    if (playState.isTaskCompleted || (document.getElementById('xy-status-banner') && document.getElementById('xy-status-banner').innerText.includes('初始化'))) { 
                        playState.isTaskCompleted = false; updateCourseUI(); 
                    } 
                }
            }
        } catch(e) {}
    }
    /**
     * 平台弹窗清扫：探测常见弹窗容器/遮罩选择器并逐个 remove/dismiss。
     * 在下载执行与挂机跳转前调用——任何残留弹窗都可能吞掉后续自动化点击。
     * [DEEP-DOC]
     */
    function forceDismissPopups(doc = document) {
        if (!guardState.guardActive) return false;
        try {
            const dialogs = doc.querySelectorAll('.el-message-box:not([style*="none"]), .el-dialog:not([style*="none"]), .dialog-wrapper:not([style*="none"]), .v-modal, .ant-result');
            for (let box of dialogs) {
                if (box.offsetParent !== null) {
                    const boxText = (box.innerText || "").replace(/\s+/g, '');
                    if (/长时间.*操作|无操作|没有操作|暂停|休息一下|继续|确认打开|预览确认|是否确认打开文件/.test(boxText)) {
                        let targetBtn = box.querySelector('.el-button--primary, .el-message-box__btns .el-button:nth-child(2), .ant-btn-primary');
                        if (!targetBtn) {
                            const btns = Array.from(box.querySelectorAll('button, .el-button, [role="button"]'));
                            targetBtn = btns.find(b => { const t = (b.innerText || "").replace(/\s+/g, ''); return t.length <= 8 && /确定|继续|是|我知道了|恢复|确认/.test(t); });
                        }
                        if (targetBtn && Date.now() - playState.lastPopupClickTime > 2000) { playState.lastPopupClickTime = Date.now(); setTimeout(() => { robustClick(targetBtn); logMsg(`🛡️ 拦截系统弹窗...`, 'success', false); }, 300); return true; }
                    }
                }
            }
            const bodyText = doc.body ? (doc.body.innerText || "").replace(/\s+/g, '') : "";
            if (/长时间.*操作|无操作|没有操作|任务暂停|休息一下|确认打开|是否确认打开文件/.test(bodyText)) {
                const allButtons = Array.from(doc.querySelectorAll('button, [role="button"], .btn, span[class*="btn"]'));
                const targetBtn = allButtons.find(b => { const t = ((b.innerText || "")).replace(/\s+/g, ''); return b.offsetParent !== null && t.length <= 8 && /确定|继续|恢复|我知道了|确认/.test(t); });
                if (targetBtn && Date.now() - playState.lastPopupClickTime > 2000) { playState.lastPopupClickTime = Date.now(); setTimeout(() => { robustClick(targetBtn); logMsg(`🛡️ 拦截系统弹窗...`, 'success', false); }, 500); return true; }
            }
        } catch(e) {} return false;
    }


    
    
    let mouseSimTimer = null;
    let simMouseX = Math.random() * window.innerWidth;
    let simMouseY = Math.random() * window.innerHeight;
    /**
     * 三次贝塞尔缓动函数工厂：输入控制点 x1,y1,x2,y2 返回 t∈[0,1] → 进度值
     * 的采样函数（牛顿迭代解 x 方程）。鼠标轨迹模拟用它生成加减速曲线，
     * 规避匀速移动的机器人特征。
     * [DEEP-DOC]
     */
    function cubicBezier(t, p0, p1, p2, p3) {
        const u = 1 - t;
        return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    }
    /**
     * 拟人鼠标移动单步：起止两点间按 cubicBezier 时间轴插值 N 个采样点，
     * 每点叠加随机抖动后依次派发 pointermove/mousemove（bubbles 冒泡）。
     * 目标坐标限制在视口内。深度伪装的行为熵来源之一。
     * [DEEP-DOC]
     */
    function simulateMouseMove() {
        if (!guardState.mouseSimActive) return;

        const targetX = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
        const targetY = Math.random() * window.innerHeight * 0.7 + window.innerHeight * 0.1;
        const cp1x = simMouseX + (Math.random() - 0.5) * 400;
        const cp1y = simMouseY + (Math.random() - 0.5) * 300;
        const cp2x = targetX + (Math.random() - 0.5) * 400;
        const cp2y = targetY + (Math.random() - 0.5) * 300;

        const steps = 40 + Math.floor(Math.random() * 30);
        let step = 0;

        function animateStep() {
            if (!guardState.mouseSimActive) return;
            if (step >= steps) {
                simMouseX = targetX;
                simMouseY = targetY;
                const el = document.elementFromPoint(simMouseX, simMouseY);
                if (el) {
                    el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: simMouseX, clientY: simMouseY, view: window }));
                    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: simMouseX, clientY: simMouseY, view: window }));
                }
                return;
            }
            const t = step / steps;
            const x = cubicBezier(t, simMouseX, cp1x, cp2x, targetX);
            const y = cubicBezier(t, simMouseY, cp1y, cp2y, targetY);

            document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y, view: window }));

            step++;
            requestAnimationFrame(animateStep);
        }
        animateStep();
    }
    /**
     * 鼠标模拟总开关：翻转 mouseSimActive 持久化 → 开启时 scheduleMouseSim
     * 启动调度环，关闭时清理定时器。按钮文案 ON/OFF 同步。
     * [DEEP-DOC]
     */
    function toggleMouseSim(active) {
        guardState.mouseSimActive = active;
        GM_setValue('xy_mouse_sim', active);
        if (active) {
            simMouseX = Math.random() * window.innerWidth;
            simMouseY = Math.random() * window.innerHeight;
            scheduleMouseSim();
            logMsg('🖱️ 鼠标轨迹模拟已激活，随机游走中...', 'success', true);
        } else {
            clearTimeout(mouseSimTimer);
            mouseSimTimer = null;
            logMsg('⏸️ 鼠标轨迹模拟已关闭', 'warning', true);
        }
    }
    /**
     * 鼠标模拟调度环：随机 8-25s 间隔触发 simulateMouseMove（随机起止点）+
     * 低概率 simulateRandomClick。递归 setTimeout 实现可中断的无限循环；
     * guardState.mouseSimActive 为 false 时自终止。
     * [DEEP-DOC]
     */
    function scheduleMouseSim() {
        if (!guardState.mouseSimActive) return;
        const delay = 30000 + Math.random() * 60000;
        mouseSimTimer = setTimeout(() => {
            simulateMouseMove();
            scheduleMouseSim();
        }, delay);
    }

    
    
    
    let deepCamoTimers = { scroll: null, keyboard: null, click: null };
    /**
     * 拟人滚动序列：3-8 步随机 delta 的 WheelEvent 派发（deltaMode 像素制），
     * 步间随机微延迟模拟手指滚轮的不均匀性。触发条件由 scheduleDeepCamo 编排。
     * [DEEP-DOC]
     */
    function simulateNaturalScroll() {
        if (!guardState.deepCamouflage || !guardState.camoScrollActive) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) { scheduleDeepCamo('scroll'); return; }

        
        const currentY = window.scrollY;
        const targetY = Math.max(0, Math.min(maxScroll, currentY + (Math.random() - 0.4) * window.innerHeight * 0.7));
        const distance = Math.abs(targetY - currentY);
        const duration = 800 + Math.random() * 2200; 
        const startTime = performance.now();
        const startY = currentY;

        function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

        function scrollStep(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);
            window.scrollTo(0, startY + distance * easedProgress);
            if (progress < 1) {
                requestAnimationFrame(scrollStep);
            } else {
                
                const pauseTime = 3000 + Math.random() * 15000;
                deepCamoTimers.scroll = setTimeout(() => scheduleDeepCamo('scroll'), pauseTime);
            }
        }
        requestAnimationFrame(scrollStep);
    }
    /**
     * 键盘活跃模拟：派发无害按键（Shift 等修饰键）的 keydown/keyup 序列。
     * 平台若监听键盘活跃度作为在线依据，此信号可维持会话活性而不产生输入副作用。
     * [DEEP-DOC]
     */
    function simulateKeyboardActivity() {
        if (!guardState.deepCamouflage || !guardState.camoKeyboardActive) return;
        const keys = ['Tab', 'ArrowDown', 'ArrowUp', 'PageDown', ' '];
        const key = keys[Math.floor(Math.random() * keys.length)];
        const target = document.activeElement || document.body;
        const keyCodeMap = { Tab: 9, ArrowDown: 40, ArrowUp: 38, PageDown: 34, ' ': 32 };
        const kc = keyCodeMap[key] || 9;

        ['keydown', 'keypress', 'keyup'].forEach(eventType => {
            target.dispatchEvent(new KeyboardEvent(eventType, {
                key: key, code: key, keyCode: kc, which: kc,
                bubbles: true, cancelable: true, view: window
            }));
        });
        scheduleDeepCamo('keyboard');
    }
    /**
     * 安全区域随机点击：坐标在视口中央 60% 区域内随机取点（避开边缘工具栏），
     * 先 document.elementFromPoint 检查落点不是可交互元素（a/button/input）
     * 才派发完整 pointer 序列，防止误触业务操作。
     * [DEEP-DOC]
     */
    function simulateRandomClick() {
        if (!guardState.deepCamouflage || !guardState.camoClickActive) return;
        
        const x = Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.15;
        const y = Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.2;
        const el = document.elementFromPoint(x, y);
        if (el && !['BUTTON','A','INPUT','SELECT','TEXTAREA','LABEL'].includes(el.tagName) && !el.closest('#xy-super-console')) {
            ['mousemove','mousedown','mouseup','click'].forEach(type => {
                el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
            });
        }
        scheduleDeepCamo('click');
    }
    /**
     * 深度伪装编排中枢：deepCamouflage 开启时启动三个独立调度环
     * （滚动 / 键盘 / 点击+移动组合），各自随机相位互不同步——行为特征更接近
     * 真人多任务。关闭时全部清理。
     * [DEEP-DOC]
     */
    function scheduleDeepCamo(type) {
        if (!guardState.deepCamouflage) return;
        const ranges = { scroll: [15000, 60000], keyboard: [20000, 90000], click: [30000, 120000] };
        const [min, max] = ranges[type];
        const delay = min + Math.random() * (max - min);
        const fn = type === 'scroll' ? simulateNaturalScroll : type === 'keyboard' ? simulateKeyboardActivity : simulateRandomClick;
        deepCamoTimers[type] = setTimeout(fn, delay);
    }
    /** 深度伪装开启：置位持久化 → scheduleDeepCamo 启动全部模拟环 → 日志确认。
     * [DEEP-DOC]
     */
    function startDeepCamouflage() {
        guardState.deepCamouflage = true;
        guardState.camoScrollActive = true;
        guardState.camoKeyboardActive = true;
        guardState.camoClickActive = true;
        GM_setValue('xy_deep_camo', true);
        ['scroll','keyboard','click'].forEach(t => scheduleDeepCamo(t));
        logMsg('🕵️ 深度伪装2.0 已启动：滚动+键盘+点击全维模拟', 'success', true);
    }
    /** 深度伪装关闭：清位持久化 → 清理全部模拟定时器 → 日志确认。
     * [DEEP-DOC]
     */
    function stopDeepCamouflage() {
        guardState.deepCamouflage = false;
        guardState.camoScrollActive = false;
        guardState.camoKeyboardActive = false;
        guardState.camoClickActive = false;
        GM_setValue('xy_deep_camo', false);
        Object.values(deepCamoTimers).forEach(t => clearTimeout(t));
        deepCamoTimers = { scroll: null, keyboard: null, click: null };
        logMsg('⏸️ 深度伪装2.0 已关闭', 'warning', true);
    }

    
    if (guardState.deepCamouflage) {
        setTimeout(() => {
            guardState.camoScrollActive = true;
            guardState.camoKeyboardActive = true;
            guardState.camoClickActive = true;
            ['scroll','keyboard','click'].forEach(t => scheduleDeepCamo(t));
        }, 3000);
    }
    /**
     * 文档预览自动开启：探测预览占位元素存在且未展开时 robustClick 触发。
     * 部分文档（PPT/PDF 预览）必须点开才开始被平台计入学时，此函数保证
     * 挂机计时有效。
     * [DEEP-DOC]
     */
    function checkAndClickDocPreview() {
        const nodeId = getNodeId();
        if (!nodeId || discState.docPreviewDoneNodeId === nodeId) return;
        discState.docPreviewDoneNodeId = nodeId; 
    }
    /** 学习记录上报的原生实现体：组装平台 learnRecord 接口请求并发送。
     * 被 sendRecordRequest 包装（增强失败告警），二者构成装饰器结构。
     * [DEEP-DOC]
     */
    async function _origSendRecordRequest() {
        const groupId = getCourseGroupId(); const resourceId = getNodeId();
        if (!groupId || !resourceId) throw new Error('no resource');

        let token = await getAuthToken();

        const maxRetries = 3;
        let lastError = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (attempt > 0) await sleep(Math.pow(3, attempt) * 1000);

                const uRes = await fetch(`https://${domain}/api/jx-auth/oauth2/info`, { headers: { "authorization": `Bearer ${token}` }});
                if (!uRes.ok) { lastError = new Error(`oauth2/info HTTP ${uRes.status}`); continue; }
                const uData = await uRes.json(); const userId = uData?.data?.info?.id; if (!userId) { lastError = new Error('no userId'); continue; }

                const msgObj = { user_id: userId, group_id: groupId, clientType: 1, roleType: 1, resourceId: resourceId };
                const message = JSON.stringify(msgObj); const timestamp = Date.now().toString(); const nonce = generateUUID();
                const arr = [encodeURIComponent(message), timestamp, nonce, "--xy-create-signature--"].sort().join("");
                const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(arr));
                const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

                const response = await fetch(`https://${domain}/api/jx-iresource/learnLength/learnRecord`, { method: 'POST', headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ message, signature, timestamp, nonce }) });
                const result = await response.json();
                if (result.code === 0 || result.success) {
                    recState.recordCount++; recState.lastRecordDate = new Date();
                    recState.totalTime += 30;
                    sessionStorage.setItem('xy_recordCount', recState.recordCount); sessionStorage.setItem('xy_totalTime', recState.totalTime); updateCourseUI();
                    recordFailCount = 0;
                    keepaliveLastBeatTime = Date.now();
                    return; 
                }
                lastError = new Error(`code=${result.code} msg=${result.message}`);
            } catch (e) {
                lastError = e;
            }
        }
        recordFailCount++;
        if (recordFailCount >= 10) {
            logMsg('⚠️ 学习记录连续失败10次，请检查网络或Token是否过期', 'error', false);
            recordFailCount = 0;
        }
        throw lastError || new Error('sendRecord failed');
    }
    /**
     * 计时上报包装器：透传调用 _origSendRecordRequest，异常时 warn 记录
     * 「sendRecord 失败」并累加 recordFailCount 供看门狗判断上报通道健康度。
     * 不向上抛错——计时失败不应打断挂机主流程。
     * [DEEP-DOC]
     */
    async function sendRecordRequest() {
        if (playState.activeZone !== ZONE.COURSE) return;
        if (isRecordSending) return;
        const groupId = getCourseGroupId(); const resourceId = getNodeId(); if (!groupId || !resourceId) return;
        isRecordSending = true;
        try { await _origSendRecordRequest(); } catch (e) { console.warn('[小雅] sendRecord 失败', e.message || e); }
        isRecordSending = false;
    }

    
    const _persistentIntervals = new Set();
    /**
     * 抗节流定时器工厂 —— 解决后台标签页 setInterval 被浏览器降频的问题。
     *
     * 实现：递归 setTimeout 链 + 漂移补偿（每 tick 记录期望时刻与实际时刻差，
     * 下次延迟扣减差值）；配合隐身引擎的可见性固化（document.hidden 恒 false），
     * 后台标签页也能维持接近真实的触发频率。返回带 stop() 的句柄对象。
     *
     * @param {Function} fn - 周期回调
     * @param {number} ms - 名义间隔
     * @param {number} [maxDriftMs] - 单次补偿上限
     * [DEEP-DOC]
     */
    function createPersistentInterval(fn, ms, maxCatchUp = 20) {
        if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
        const intervalMs = Number(ms);
        if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new RangeError('ms 必须是正数');
        const rawCatchUp = Number(maxCatchUp);
        if (!Number.isSafeInteger(rawCatchUp) || rawCatchUp < 0) throw new RangeError('maxCatchUp 必须是非负整数');
        const catchUpLimit = rawCatchUp;

        let lastTick = Date.now();
        let timerId = null;
        let running = true;
        let callbackRunning = false;
        let pendingRuns = 0;

        async function drain() {
            if (callbackRunning || !running) return;
            callbackRunning = true;
            try {
                while (running && pendingRuns > 0) {
                    pendingRuns--;
                    try {
                        await fn();
                    } catch (e) {
                        console.warn('[小雅] 持久定时任务执行失败:', e);
                    }
                }
            } finally {
                callbackRunning = false;
                if (running && pendingRuns > 0) void drain();
            }
        }

        const entry = {
            catchUp(now = Date.now(), thresholdFactor = 1) {
                if (!running) return;
                const elapsed = now - lastTick;
                if (elapsed < intervalMs * thresholdFactor) return;

                const missed = Math.min(Math.floor(elapsed / intervalMs), catchUpLimit);
                // 先推进时间基准，避免回调触发可见性事件时重复补偿。
                lastTick = now;
                pendingRuns = Math.min(catchUpLimit, pendingRuns + missed);
                if (pendingRuns > 0) void drain();
            },
            clear() {
                if (!running) return;
                running = false;
                pendingRuns = 0;
                if (timerId !== null) clearInterval(timerId);
                _persistentIntervals.delete(entry);
            },
            resetTimer() {
                if (running) lastTick = Date.now();
            }
        };

        timerId = setInterval(() => entry.catchUp(), Math.max(intervalMs / 4, 250));
        _persistentIntervals.add(entry);

        return {
            clear: () => entry.clear(),
            resetTimer: () => entry.resetTimer()
        };
    }

    
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = Date.now();
            _persistentIntervals.forEach(p => p.catchUp(now, 1.2));
            
            if (typeof updateSchCard === 'function') updateSchCard();
            if (typeof updateCourseUI === 'function') updateCourseUI();
        }
    });
    /**
     * 学习记录开关：recordActive 翻转 + 持久化；开启时创建计时 interval
     * （recordIntervalTimer）周期累加 totalTime 并落 sessionStorage；关闭时
     * 清理定时器。UI 按钮 ON/OFF 同步。
     * [DEEP-DOC]
     */
    function toggleRecord(start) {
        if (recState.recordActive === start) return;
        recState.recordActive = start;
        if (start) {
            sendRecordRequest();
            recordIntervalTimer = createPersistentInterval(sendRecordRequest, 30000, 20);
            realTimeTimer = createPersistentInterval(() => { recState.realTime++; sessionStorage.setItem('xy_realTime', recState.realTime); updateCourseUI(); }, 1000, 30);
            if (!guardState.guardActive) { guardState.guardActive = true; GM_setValue('xy_guard_active', true); }
        } else {
            if (recordIntervalTimer) { recordIntervalTimer.clear(); recordIntervalTimer = null; }
            if (realTimeTimer) { realTimeTimer.clear(); realTimeTimer = null; }
        }
        updateCourseUI();
    }
    /**
     * 自动记录保障：进入 course 区且未手动关闭记录时自动 toggleRecord(true)。
     * 只补开不强制关——用户显式停止的意图必须尊重。
     * [DEEP-DOC]
     */
    function ensureAutoRecord() {
        if (playState.activeZone !== ZONE.COURSE) return;
        const nodeId = getNodeId();
        if (nodeId && !recState.recordActive) toggleRecord(true); else if (!nodeId && recState.recordActive) toggleRecord(false);
    }

    
    
    
    let keepaliveWatchdogTimer = null;
    let keepaliveLastBeatTime = 0;
    /**
     * 保活看门狗：10s 巡检周期检查挂机活性——watchdogLastActiveTime 距今超过
     * 阈值（各引擎正常运转都会持续刷新它）判定失速，先尝试恢复引擎动作，
     * 连续失速升级为页面重载自救。keepaliveEnabled 关闭时不启动。
     * [DEEP-DOC]
     */
    function startKeepaliveWatchdog() {
        if (keepaliveWatchdogTimer) return;
        keepaliveLastBeatTime = Date.now();
        keepaliveWatchdogTimer = setInterval(() => {
            if (!guardState.keepaliveEnabled || playState.activeZone !== ZONE.COURSE) return;
            
            const gap = Date.now() - keepaliveLastBeatTime;
            if (gap > 75000) {
                logMsg('💓 [保活] 检测到心跳缺口 ' + Math.round(gap / 1000) + 's，强制补发', 'warning', true);
                sendRecordRequest().then(() => { keepaliveLastBeatTime = Date.now(); });
            }
            
            if (!recordIntervalTimer && recState.recordActive) {
                logMsg('💓 [保活] 心跳定时器丢失，自动重建', 'warning', true);
                if (recordIntervalTimer) recordIntervalTimer.clear();
                recordIntervalTimer = createPersistentInterval(sendRecordRequest, 30000, 20);
            }
        }, 10000);
        logMsg('💓 后台保活看门狗已启动（10s巡检）', 'silent', true);
    }
    /** 清理看门狗定时器并置空句柄（keepaliveWatchdogTimer），允许下次重新 start。
     * [DEEP-DOC]
     */
    function stopKeepaliveWatchdog() {
        if (keepaliveWatchdogTimer) { clearInterval(keepaliveWatchdogTimer); keepaliveWatchdogTimer = null; }
    }

    
    
    

    let watchdogLastActiveTime = Date.now();
    let lastAutoActionMinute = '';

    
    createPersistentInterval(async () => {
        await runLowLevelScanner(); 

        checkDynamicRefresh();

        if (playState.activeZone !== ZONE.COURSE) {
            if (playState.activeZone === ZONE.DOWNLOAD && guardState.guardActive) forceDismissPopups(document);
            watchdogLastActiveTime = Date.now();
            return;
        }
        if (guardState.guardActive) forceDismissPopups(document);

        playState.currentEngine = await getTaskTypeAccurate();

        
        const timeoutLimit = xyScheduleState.isRunning ? 1800000 : 180000; 
        if (Date.now() - watchdogLastActiveTime > timeoutLimit) {
            sessionStorage.setItem('xy_reload_reason', '防死锁刷新');
            logMsg(`💀 发生死锁！执行强刷...`, 'error', false);
            setTimeout(() => window.location.reload(), 1000);
            return;
        }

        if (playState.mode === PLAY_MODE.SEQUENCE && Date.now() < playState.jumpSleepUntil) {
            updateCourseUI();
            watchdogLastActiveTime = Date.now(); 
            return; 
        }

        const groupId = getCourseGroupId();
        if (groupId && playState.mode !== PLAY_MODE.MANUAL) {
            const taskType = playState.currentEngine; 

            const vEngine = document.getElementById('xy-engine-video'), dEngine = document.getElementById('xy-engine-doc');
            if(vEngine) vEngine.style.opacity = taskType === TASK_TYPE.VIDEO ? '1' : '0.4';
            if(dEngine) dEngine.style.opacity = taskType === TASK_TYPE.DOC ? '1' : '0.4';

            let isMakingProgress = false;

            if (taskType === TASK_TYPE.VIDEO) {
                let video = document.querySelector('video');
                if (!video) { const iframes = document.querySelectorAll('iframe'); for (let i = 0; i < iframes.length; i++) { try { if (iframes[i].contentDocument) video = iframes[i].contentDocument.querySelector('video'); } catch(e){} if (video) break; } }
                
                if (video) {
                    if (video.paused && !video.ended) video.play().catch(() => { if(!guardState.hardwareMute) video.muted = true; video.play().catch(()=>{}); });
                    
                    if (guardState.hardwareMute && !video.muted) video.muted = true;

                    if (playState.mode === PLAY_MODE.SEQUENCE) {
                        if (playState.videoScriptProgress === undefined) {
                            playState.videoScriptProgress = Math.round(video.currentTime);
                            playState.videoLastTime = video.currentTime;
                        }

                        if (video.currentTime - playState.videoLastTime > 3) {
                            logMsg('⚠️ 检测到拖动进度条，已弹回原位', 'warning', true);
                            video.currentTime = playState.videoLastTime;
                            return;
                        }

                        if (!video.paused && !video.ended) {
                            playState.videoScriptProgress += 1;
                        }
                        playState.videoLastTime = video.currentTime;

                        let duration = video.duration || 1;
                        let scriptProgressPct = Math.min((playState.videoScriptProgress / duration) * 100, 100);
                        
                        const statusEl = document.getElementById('xy-video-status');
                        if (statusEl) {
                            statusEl.innerText = (video.ended || playState.videoScriptProgress >= duration) ? '已播完, 验证中...' : `脚本进度 ${scriptProgressPct.toFixed(1)}%`;
                        }
                        
                        if (video.currentTime > 0 && !video.paused) isMakingProgress = true;
                        if (video.ended || playState.videoScriptProgress >= duration) isMakingProgress = true;
                    } 
                    else {
                        let progress = (video.currentTime / video.duration) * 100 || 0;
                        const statusEl = document.getElementById('xy-video-status');
                        if (statusEl) {
                             if (playState.mode === PLAY_MODE.LOOP && playState.isTaskCompleted) {
                                  statusEl.innerText = `[循环] 进度 ${progress.toFixed(1)}%`;
                             } else {
                                  statusEl.innerText = video.ended ? '已播完, 验证中...' : `进度 ${progress.toFixed(1)}%`;
                             }
                        }
                        
                        if (video.ended && playState.mode === PLAY_MODE.LOOP && !playState.isProcessingJump) {
                             playState.isProcessingJump = true;
                             autoSubmitCurrentTask(true).then(success => {
                                 if (success || playState.isTaskCompleted) {
                                      logMsg('✅ 安全循环：当前任务已达标，即将刷新页面重载继续挂机...', 'success', false);
                                 } else {
                                      logMsg('⚠️ 安全循环：时长暂未达标，即将刷新页面重置播放...', 'warning', true);
                                 }
                                 
                                 setTimeout(() => {
                                      logMsg('🔄 触发安全循环单次播完重载机制...', 'info', false);
                                      window.location.reload();
                                 }, 1500);
                             });
                        }
                        
                        if (video.currentTime > 0 && !video.paused) isMakingProgress = true;
                        if (video.ended) isMakingProgress = true;
                    }
                }
            } else if (taskType === TASK_TYPE.DOC) {
                checkAndClickDocPreview(); 

                if (!playState.isTaskCompleted) {
                    playState.docReadTime += 1; 
                    
                    if (playState.mode === PLAY_MODE.SEQUENCE) {
                        let progress = Math.min((playState.docReadTime / DOC_READ.SUBMIT_SECONDS) * 100, 100);
                        const statusEl = document.getElementById('xy-doc-status'), progressEl = document.getElementById('xy-doc-progress');
                        if(statusEl) {
                            if (playState.docReadTime < DOC_READ.SUBMIT_SECONDS) {
                                statusEl.innerText = `阅读倒数: ${progress.toFixed(1)}%`;
                            } else if (playState.docReadTime < DOC_READ.FORCE_SECONDS) {
                                statusEl.innerText = `验证重试中: ${playState.docReadTime}s`;
                            } else {
                                statusEl.innerText = `强制提交阶段: ${playState.docReadTime}s`;
                            }
                        }
                        if(progressEl) progressEl.style.width = `${progress}%`;
                    } 
                    else {
                        let progress = Math.min((playState.docReadTime / DOC_READ.LOOP_SECONDS) * 100, 100);
                        const statusEl = document.getElementById('xy-doc-status'), progressEl = document.getElementById('xy-doc-progress');
                        if(statusEl) {
                            if (playState.mode === PLAY_MODE.LOOP && playState.docReadTime >= DOC_READ.LOOP_SECONDS) {
                                statusEl.innerText = `[循环] 挂机中: ${playState.docReadTime}s`;
                            } else {
                                statusEl.innerText = progress < 100 ? `等待 ${progress.toFixed(1)}%` : `请求验证中...`;
                            }
                        }
                        if(progressEl) progressEl.style.width = `${progress}%`;
                        
                        if (playState.mode === PLAY_MODE.LOOP && playState.docReadTime >= DOC_READ.LOOP_SECONDS && !playState.isProcessingJump) {
                             playState.isProcessingJump = true;
                             autoSubmitCurrentTask(true).then(success => {
                                 if (success) {
                                     playState.isTaskCompleted = true;
                                     logMsg('✅ 安全循环：文档已达标，继续静默挂机...', 'success', false);
                                 }
                                 playState.isProcessingJump = false;
                             });
                        }
                    }
                    isMakingProgress = true;
                } else {
                    const statusEl = document.getElementById('xy-doc-status'), progressEl = document.getElementById('xy-doc-progress');
                    if(statusEl) statusEl.innerText = `已达标 (挂机或跳转)`; if(progressEl) progressEl.style.width = `100%`;
                    isMakingProgress = true;
                }
            }

            if (isMakingProgress || playState.isProcessingJump || recState.recordActive) {
                watchdogLastActiveTime = Date.now();
            }
        } else {
            watchdogLastActiveTime = Date.now(); 
        }

        
        const nowHM = new Date().toLocaleTimeString('zh-CN', { hour12: false }).substring(0, 5);
        if (nowHM !== lastAutoActionMinute) {
            if (!xyScheduleState.isRunning && xyScheduleState.autoStart && nowHM === xyScheduleState.autoStart && xyScheduleState.queue.length > 0) {
                lastAutoActionMinute = nowHM;
                if (typeof xySchStart === 'function') xySchStart();
                logMsg(`⏰ 定时启动：${nowHM} 已触发计划调度！`, 'success');
            }
            if (xyScheduleState.isRunning && xyScheduleState.autoStop && nowHM === xyScheduleState.autoStop) {
                lastAutoActionMinute = nowHM;
                if (typeof xySchStop === 'function') xySchStop();
                logMsg(`⏰ 定时停止：${nowHM} 已触发停止并交还主控！`, 'warning');
            }
        }

        updateTitleBar();
        if (settingsState.theme === 'auto') applyTheme();
    }, 1000, 30);

    
    createPersistentInterval(async () => {
        if (playState.activeZone !== ZONE.COURSE || playState.mode !== PLAY_MODE.SEQUENCE) return;

        if (Date.now() < playState.jumpSleepUntil) return;

        const groupId = getCourseGroupId();
        const nodeId = getNodeId();

        if (!groupId || !nodeId) {
            await tryJumpToNext();
            return;
        }

        if (playState.isTaskCompleted) {
            await tryJumpToNext();
            return;
        }

        const taskType = await getTaskTypeAccurate();

        if (taskType === TASK_TYPE.VIDEO) {
            let video = document.querySelector('video');
            if (!video) { const iframes = document.querySelectorAll('iframe'); for (let i = 0; i < iframes.length; i++) { try { if (iframes[i].contentDocument) video = iframes[i].contentDocument.querySelector('video'); } catch(e){} if (video) break; } }
            
            if (video && (video.ended || (video.duration > 0 && playState.videoScriptProgress >= video.duration))) {
                logMsg('⏳ 满足连播脚本进度，发起视频验证请求...', 'info', true);
                const success = await autoSubmitCurrentTask();
                
                if (success) {
                    playState.isTaskCompleted = true;
                    logMsg('✅ [API] 视频任务已获服务器成功确认！', 'success');
                    updateCourseUI();
                    await tryJumpToNext();
                } else {
                    logMsg('⚠️ 后台仍判未达标，5秒后继续强交！', 'warning', true);
                }
            }
        } else if (taskType === TASK_TYPE.DOC) {
            if (playState.docReadTime >= DOC_READ.SUBMIT_SECONDS) {
                if (playState.lastDocSubmitTime === 0 || (playState.docReadTime - playState.lastDocSubmitTime >= DOC_READ.RETRY_GAP_SECONDS)) {
                    let isDocRetry = playState.lastDocSubmitTime > 0;
                    logMsg(isDocRetry ? `⏳ 文档未达标，周期性重试提交 (${playState.docReadTime}s)...` : '⏳ 2分10秒已到，发起首次文档验证请求...', 'info', true);
                    
                    const success = await autoSubmitCurrentTask();
                    playState.lastDocSubmitTime = playState.docReadTime;

                    if (success) {
                        playState.isTaskCompleted = true;
                        logMsg('✅ [API] 文档任务已获服务器成功确认！', 'success');
                        updateCourseUI();

                        await tryJumpToNext();
                    } else {
                        if (playState.docReadTime >= DOC_READ.FORCE_SECONDS) {
                            logMsg('⚡ 超过5分钟仍未达标，触发【强制提交放行】保护机制！', 'warning', false);
                            playState.isTaskCompleted = true;
                            updateCourseUI();

                            await tryJumpToNext();
                        } else {
                            logMsg(`⚠️ 文档验证未通过，将在30秒后利用API重试 (当前${playState.docReadTime}s/300s强行线)`, 'warning', false);
                        }
                    }
                }
            }
        }
    }, 5000, 10);

    
    createPersistentInterval(() => {
        if (playState.activeZone === ZONE.DISC && playState.enableDomScan) {
            const domNames = scanDomForUserNames();
            let added = false;
            domNames.forEach(name => {
                if (!discState.targetNames.includes(name)) {
                    discState.targetNames.push(name);
                    added = true;
                }
            });
            if (added) {
                GM_setValue('xy_target_names', JSON.stringify(discState.targetNames));
                renderTargetList(document.getElementById('xy-name-search')?.value || '');
            }
        }
    }, 3000, 10);
    /**
     * 讨论区评论分页拉取：discussionId/discGroupId 缺失时 toast 提示重刷并返
     * 回 null。GET queryDiscussion 接口（desc 排序），响应兼容 list/records/
     * points/data 四种数组字段形态；success=false 或数据缺失返回 []。
     * 网络异常 warn 后返回 null（与空列表区分：null 让上层中止翻页，[] 继续）。
     * [DEEP-DOC]
     */
    async function fetchDiscussions(pageSize = 20, pageIndex = 1) {
        if (!discState.discussionId || !discState.discGroupId) { showToast('未捕获到ID，请重刷页面获取截包！', 'warning'); return null; }
        try {
            const token = await getAuthToken(); 
            const res = await fetch(`https://${domain}/api/jx-iresource/discussion/queryDiscussion?discussion_id=${discState.discussionId}&group_id=${discState.discGroupId}&sort_type=1&sort_way=desc&page_index=${pageIndex}&page_size=${pageSize}&channel=`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) {
                if (Array.isArray(data.data.list)) return data.data.list; if (Array.isArray(data.data.records)) return data.data.records; if (Array.isArray(data.data.points)) return data.data.points; if (Array.isArray(data.data)) return data.data;
            } return [];
        } catch(e) { console.warn('[小雅] 讨论列表接口请求失败:', e); return null; }
    }
    /**
     * 全量名单深潜抓取：while 循环翻页 fetchDiscussions(20, page)，seenIds 去
     * 重判新增（newInPage=0 即到底），decodeNickname 入库；上限 300 页保险丝。
     * discScrapeAbort 标记支持中途停止；DOM 扫描补充收尾；结束后持久化 + 渲染
     * + 汇总日志。按钮状态管理贯穿始终（禁用/进度文案/停止钮显隐）。
     * [DEEP-DOC]
     */
    async function fetchCurrentUsers() {
        if (playState.activeZone !== ZONE.DISC) return;
        if(!discState.discussionId) { logMsg('未拦截到讨论区ID，请随便点击一下任意评论！', 'warning'); return; }
        const btn = document.getElementById('xy-btn-fetch-users'); const originalText = btn ? btn.innerText : '';
        const stopBtn = document.getElementById('xy-btn-stop-scrape');
        if(btn) { btn.disabled = true; btn.innerText = "深潜抓取中..."; }

        logMsg('🧹 正在深度扫描全部评论页，自动去重收录...', 'info');

        try {
            playState.discScrapeAbort = false;
            if (stopBtn) { stopBtn.style.display = 'inline-block'; stopBtn.disabled = false; }
            let pageIndex = 1;
            const seenIds = new Set();
            while (true) {
                if (playState.discScrapeAbort) { logMsg('⏹ 已手动停止深度抓取', 'warning'); break; }
                if(btn) btn.innerText = `深潜抓取中 (第${pageIndex}页)...`;
                const list = await fetchDiscussions(20, pageIndex);
                if (!list || list.length === 0) break;

                let newInPage = 0;
                list.forEach(item => {
                    if (item && item.id && !seenIds.has(item.id)) { seenIds.add(item.id); newInPage++; }
                    const realName = decodeNickname(item.nickname);
                    if (realName && realName !== "匿名" && !realName.includes("=")) {
                        if (!discState.targetNames.includes(realName)) {
                            discState.targetNames.push(realName);
                        }
                    }
                });
                if (newInPage === 0) break;
                if (list.length < 20) break;
                await sleep(300);
                pageIndex++;
                if (pageIndex > 300) break;
            }

            const domNames = scanDomForUserNames();
            domNames.forEach(name => {
                if (!discState.targetNames.includes(name)) {
                    discState.targetNames.push(name);
                }
            });

            GM_setValue('xy_target_names', JSON.stringify(discState.targetNames));
            renderTargetList(document.getElementById('xy-name-search')?.value || '');
            logMsg(playState.discScrapeAbort ? `⏸ 已停止，总库现存 ${discState.targetNames.length} 人。` : `✅ 扫描到底！总库现存 ${discState.targetNames.length} 人。`, 'success');
        } catch (error) { logMsg('抓取失败，请检查网络或刷新重试', 'error'); } finally { if(stopBtn) stopBtn.style.display = 'none'; if(btn) { btn.disabled = false; btn.innerText = originalText || "🔄 手动刷新名单"; } }
    }
    /** 勾选名单导出：Set → Array。定向点赞/回复的目标集合唯一来源。
     * [DEEP-DOC]
     */
    function getCheckedTargetNames() { return Array.from(discState.selectedNames); }
    /**
     * 自动点赞执行器。
     *
     * 目标收集：isTargeted 时按勾选名单过滤评论，否则全员模式取前 MAX_LIKES(15)
     * 条；翻页累积直到凑够目标数或到底。逐条调点赞接口（成功/失败均 warn 不
     * 中断），条间 sleep(800-1500ms) 随机化拟人。按钮全程禁用 + 进度文案。
     * [DEEP-DOC]
     */
    async function autoLikeAction(isTargeted = false) {
        if (playState.activeZone !== ZONE.DISC) return;
        if(!discState.discussionId) { logMsg('网络流未就绪，请随便点击一个评论触发抓包', 'warning'); return; }
        const checkedNames = isTargeted ? getCheckedTargetNames() : [];
        if (isTargeted && checkedNames.length === 0) { logMsg('请先勾选目标人物', 'warning'); return; }

        const btn = document.getElementById(isTargeted ? 'xy-btn-target-like' : 'xy-btn-like');
        if (!btn) { logMsg('UI 按钮未就绪，请刷新页面', 'error'); return; }
        const originalText = btn.innerText;
        btn.disabled = true;

        try {
            let targets = []; const MAX_LIKES = 15; 
            let pageIndex = 1;
            
            while(true) {
                btn.innerText = `检索点赞目标 (页${pageIndex})...`;
                const list = await fetchDiscussions(20, pageIndex); 
                if (!list || list.length === 0) break;
                
                if (isTargeted) { 
                    const matched = list.filter(item => checkedNames.includes(decodeNickname(item.nickname))); 
                    targets.push(...matched); 
                } else { 
                    targets.push(...list); 
                }
                
                if (targets.length >= (isTargeted ? checkedNames.length : MAX_LIKES)) break;
                if (list.length < 20) break; 
                await sleep(300);
                pageIndex++;
                if (pageIndex > 300) break;
            }
            
            if (targets.length === 0) { logMsg(`未找到匹配的目标列表`, 'warning'); return; }
            
            targets = targets.slice(0, MAX_LIKES);
            const uniqueTargets = []; const seenIds = new Set();
            for (const t of targets) { if (!seenIds.has(t.id)) { seenIds.add(t.id); uniqueTargets.push(t); } }

            let successCount = 0; const token = await getAuthToken(); logMsg(`锁定 ${uniqueTargets.length} 个目标评论，准备就绪，开始自动点赞...`, 'info');
            
            btn.innerText = `点赞发射中...`;
            for (let i = 0; i < uniqueTargets.length; i++) {
                const item = uniqueTargets[i]; const payload = { discussion_id: discState.discussionId, group_id: discState.discGroupId, point_id: item.id, like: 1 };
                try {
                    const likeRes = await fetch(`https://${domain}/api/jx-iresource/discussion/like`, { method: "POST", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(payload) });
                    const likeData = await likeRes.json(); if (likeData.success || likeData.code === 200 || likeData.code === 0) { successCount++; }
                } catch(e) { console.warn('[小雅] 讨论点赞失败', e); } await sleep(Math.floor(Math.random() * 700) + 800); 
            }
            logMsg(`🎉 点赞任务结束！成功点赞 ${successCount} 次！即将刷新页面...`, 'success'); setTimeout(() => { window.location.reload(); }, 1500);
        } catch (e) { logMsg('点赞异常', 'error'); } finally { btn.disabled = false; btn.innerText = originalText; }
    }
    /**
     * 回复文案选取：useCustomReply 开启且 customReplies 非空 → 随机取用户自定义
     * 语料；否则回退内置默认语料库随机一条。两库都空返回固定兜底文案。
     * [DEEP-DOC]
     */
    function getRandomReplyText() {
        const templates = [
            "非常赞同你的观点，这种思路确实能给我们带来很多新的启发和思考！",
            "同学说得太对了，我也一直有这个想法，按照这个方法去做肯定会有很大收获。",
            "感谢分享！这个角度非常新颖，让我对这个问题有了更加全面和深入的理解。",
            "这确实是一个值得深入探讨的好问题，你的分析非常有逻辑，支持一下！",
            "完全同意！这种方法在实际应用中非常有效，非常值得大家一起学习和借鉴。",
            "很有道理，细节决定成败，你提到的这几个关键点在实践中确实极容易被忽略。",
            "受教了，之前一直没想通这个问题，看了你的清晰解释之后感觉豁然开朗！",
            "分析得很透彻！结合我们目前的课程学习内容来看，这个总结非常有指导意义。",
            "特别认同这段话的内容，学习到了新的知识点，期待以后能有更多这样的干货！",
            "说得非常有见地，而且语言表达也很清晰易懂，把复杂的问题简单化了，佩服！"
        ];
        
        if (discState.useCustomReply && discState.customReplies && discState.customReplies.length > 0) {
            const validCustoms = discState.customReplies.filter(text => (text.match(/[\u4e00-\u9fa5]/g) || []).length >= 16);
            if (validCustoms.length > 0) {
                return validCustoms[Math.floor(Math.random() * validCustoms.length)];
            } else {
                logMsg('⚠️ 自定义回复库中没有合规句子，系统已自动回退到默认语料', 'warning', true);
            }
        }
        return templates[Math.floor(Math.random() * templates.length)];
    }
    /**
     * DraftJS 富文本评论体构造：平台评论框的内容模型是 ContentState JSON。
     * 输入纯文本输出 {blocks:[{text,...}], entityMap:{}} 结构的单段 block——
     * 提交接口要求该格式而非纯字符串。
     * [DEEP-DOC]
     */
    function buildDraftJsComment(text) {
        const randomKey = Math.random().toString(36).substring(2, 7);
        const obj = {
            blocks: [
                {
                    key: randomKey,
                    text: text,
                    type: "unstyled",
                    depth: 0,
                    inlineStyleRanges: [],
                    entityRanges: [],
                    data: {}
                }
            ],
            entityMap: {}
        };
        return JSON.stringify(obj);
    }
    /**
     * 自动回复执行器：与 autoLikeAction 同构的目标收集逻辑（复用勾选过滤），
     * 但动作改为对每条目标评论调回复接口——载荷由 buildDraftJsComment 构造
     * getRandomReplyText 选中的文案。条间随机间隔拟人化，成败逐条 warn。
     * [DEEP-DOC]
     */
    async function autoReplyAction(isTargeted = false) {
        if (playState.activeZone !== ZONE.DISC) return;
        if(!discState.discussionId) { logMsg('网络流未就绪，请随便点击一个评论触发抓包', 'warning'); return; }
        const checkedNames = isTargeted ? getCheckedTargetNames() : [];
        if (isTargeted && checkedNames.length === 0) { logMsg('请先勾选目标人物', 'warning'); return; }

        const btnId = isTargeted ? 'xy-btn-target-reply' : 'xy-btn-reply';
        const btn = document.getElementById(btnId); 
        const originalText = btn ? btn.innerText : '自动回复';
        if (btn) btn.disabled = true; 

        try {
            let targets = []; const MAX_REPLIES = 15; 
            let pageIndex = 1;
            
            while(true) {
                if (btn) btn.innerText = `检索回复目标 (页${pageIndex})...`;
                const list = await fetchDiscussions(20, pageIndex); 
                if (!list || list.length === 0) break;
                
                if (isTargeted) { 
                    const matched = list.filter(item => checkedNames.includes(decodeNickname(item.nickname))); 
                    targets.push(...matched); 
                } else { 
                    targets.push(...list); 
                }
                
                if (targets.length >= (isTargeted ? checkedNames.length : MAX_REPLIES)) break;
                if (list.length < 20) break; 
                await sleep(300);
                pageIndex++;
                if (pageIndex > 300) break;
            }
            
            if (targets.length === 0) { logMsg(`未找到匹配的回复目标列表`, 'warning'); return; }
            
            targets = targets.slice(0, MAX_REPLIES);
            const uniqueTargets = []; const seenIds = new Set();
            for (const t of targets) { if (!seenIds.has(t.id)) { seenIds.add(t.id); uniqueTargets.push(t); } }

            let successCount = 0; const token = await getAuthToken(); logMsg(`锁定 ${uniqueTargets.length} 个目标评论，准备就绪，开始自动回复...`, 'info');
            
            if (btn) btn.innerText = `回复发射中...`;
            for (let i = 0; i < uniqueTargets.length; i++) {
                const item = uniqueTargets[i]; 
                const replyText = getRandomReplyText();
                const payload = { 
                    discussion_id: discState.discussionId, 
                    group_id: discState.discGroupId, 
                    point_id: item.id, 
                    comment: buildDraftJsComment(replyText),
                    open_anonymous_mode: false 
                };
                
                try {
                    const replyRes = await fetch(`https://${domain}/api/jx-iresource/discussion/comment`, { 
                        method: "POST", 
                        headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, 
                        body: JSON.stringify(payload) 
                    });
                    const replyData = await replyRes.json(); 
                    if (replyData.success || replyData.code === 200 || replyData.code === 0) {
                        successCount++;
                        logMsg(`✅ 成功回复 [${decodeNickname(item.nickname)}]: ${replyText.substring(0,8)}...`, 'success', true);
                    }
                } catch(e) { console.warn('[小雅] 讨论回复失败', e); } 
                await sleep(Math.floor(Math.random() * 1200) + 1800); 
            }
            logMsg(`🎉 回复任务结束！成功回复 ${successCount} 次！即将刷新页面...`, 'success'); 
            setTimeout(() => { window.location.reload(); }, 2000);
        } catch (e) { logMsg('回复异常', 'error'); } finally { if (btn) { btn.disabled = false; btn.innerText = originalText; } }
    }

    
    
    
    const EMBEDDED_NOTICE = {
        "title": "⏰ v3.7.1 脚本更新 · 待办课程智能排序",
        "version": "3.7.1",
        "updatedAt": "2026-08-21",
        "items": [
            "🔮 更新链接：https://gitee.com/fieldlu/xy-script-assets",
            "🔒 隐私声明：本脚本不收集任何个人信息，数据仅存本地浏览器",
            "⚠️ 免责声明：本脚本按 GPL-3.0 协议开源，使用者自负风险",
            "",
            "⏰ === v3.7.1 更新 ===",
            "📌 进行中课程优先展示有可做待办的课程",
            "⚠️ 无可做待办但有已截止任务的课程，排在普通无待办课程之前",
            "🗓️ 每个分组内按截止时间从早到晚，任务数多的课程作为次级排序",
            "",
            "🔥 === v3.6.3 更新 ===",
            "↻ 新增脚本更新模块：面板头部一键「检查更新」",
            "📋 更新面板显示当前/最新版本、更新内容与发布页",
            "🔔 发现新版本自动弹窗提示（每版仅提醒一次）",
            "",
            "🔥 === v3.6.2 更新 ===",
            "🗂️ 调度任务库对齐雷达树状（课程 → 单元 → 任务）",
            "📚 显示全部学生课程，不再只显有待办任务的课",
            "⚡ 默认关闭开机动画，启动更快",
            "",
            "📟 === v3.6.1 更新 ===",
            "📂 课程目录区：树状浏览 + 点击跳转资源",
            "🌳 下载区单元顺序树状呈现 + 类型勾选筛选",
            "🛰️ 全局雷达：课程 → 单元 → 任务 树状展示",
            "🧹 自动破除系统弹窗",
            "",
            "📟 === v3.6.0 更新 ===",
            "📝 作业答题台：AI 作答模板 + 一键提交作答",
            "📊 提交结果面板：成绩摘要 + 状态徽章",
            "🏷️ 下载区彩色扩展名徽章（色弱友好）",
            "",
            "💬 有 bug 随时提 Issue！"
        ]
    };
    /** 一键互动组合拳：串行执行 autoLikeAction + autoReplyAction（点赞完再回
     * 复），共用一套目标名单减少翻页次数。任一环节失败不影响另一环节执行。
     * [DEEP-DOC]
     */
    function autoLink(text) {
        
        const urlRe = /(https?:\/\/[^\s<>"']+)/gi;
        const parts = [];
        let lastIdx = 0;
        let match;
        while ((match = urlRe.exec(text)) !== null) {
            parts.push(escapeHtml(text.slice(lastIdx, match.index)));
            parts.push(`<a href="${match[0]}" target="_blank" rel="noopener" style="color:${T('#818cf8','#4f46e5')}; text-decoration:underline; overflow-wrap:anywhere; word-break:break-word;" onclick="event.stopPropagation()">${escapeHtml(match[0])}</a>`);
            lastIdx = urlRe.lastIndex;
        }
        parts.push(escapeHtml(text.slice(lastIdx)));
        return parts.join('');
    }
    /** 公告渲染：markdown 子集解析（标题/列表/链接/粗体）写入公告面板 innerHTML；动态链接统一 rel=noopener + target=_blank 安全属性。
     * [DEEP-DOC]
     */
    function renderNotice(data) {
        const contentBox = document.getElementById('xy-bc-content');
        if (!contentBox) return;
        contentBox.style.overflowX = 'hidden';
        contentBox.style.minWidth = '0';
        contentBox.innerHTML =
            `<div style="min-width:0; max-width:100%; box-sizing:border-box; padding:16px 20px; overflow-wrap:anywhere; word-break:break-word;">
                <div style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; margin-bottom:12px; font-size:14px; overflow-wrap:anywhere; word-break:break-word;">${autoLink(data.title || '系统公告')}</div>
                <ul style="min-width:0; margin:0; padding-left:18px; color:${T('#cbd5e1','#475569')}; line-height:1.6; overflow-wrap:anywhere; word-break:break-word;">
                    ${(data.items || []).map(item => `<li style="min-width:0; margin-bottom:8px; overflow-wrap:anywhere; word-break:break-word;">${autoLink(item)}</li>`).join('')}
                </ul>
            </div>`;
        contentBox.style.display = 'block';
        const arrow = document.getElementById('xy-bc-arrow');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
    /**
     * 远程公告三级管线：1) GM 缓存 xy_notice_cache 命中立即渲染（hasCache=true）；
     * 2) 无缓存用内置 EMBEDDED_NOTICE 兜底渲染并存缓存；3) 无论缓存与否后台
     * GM_xHR 拉 Gitee 最新 notice_new.json（8s 超时），成功则覆盖缓存与视图。
     * 三级容错保证任意一层失败都有内容可显示。
     * [DEEP-DOC]
     */
    function fetchCloudIntelligence() {
        const contentBox = document.getElementById('xy-bc-content');
        if (!contentBox) return;

        
        let hasCache = false;
        try {
            const cached = GM_getValue('xy_notice_cache', '');
            if (cached) { renderNotice(JSON.parse(cached)); hasCache = true; }
        } catch (e) { console.warn('[小雅] 公告缓存解析失败，忽略缓存:', e); }

        
        if (!hasCache) {
            try {
                renderNotice(EMBEDDED_NOTICE);
                GM_setValue('xy_notice_cache', JSON.stringify(EMBEDDED_NOTICE));
            } catch (e) {  }
        }

        
        const rawUrl = `https://gitee.com/fieldlu/xy-script-assets/raw/main/notice_new.json?t=${Date.now()}`;
        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url: rawUrl,
                timeout: 8000,
                onload: function(resp) {
                    try {
                        const data = JSON.parse(resp.responseText);
                        GM_setValue('xy_notice_cache', JSON.stringify(data));
                        renderNotice(data);
                    } catch (e) { console.warn('[小雅] 远程公告解析失败:', e); }
                },
                onerror: function() { console.warn('[小雅] 远程公告拉取失败(网络错误)'); },
                ontimeout: function() { console.warn('[小雅] 远程公告拉取超时'); }
            });
        } catch (e) { console.warn('[小雅] 公告请求发起失败:', e); }
    }
    /** 秒 → 人读时长：h>0 出「Xh YYm ZZs」否则「YYm ZZs」，分秒两位补零。
     * [DEEP-DOC]
     */
    function formatTime(s) { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60).toString().padStart(2,'0'), sec = (s%60).toString().padStart(2,'0'); return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`; }
    /**
     * 刷课区 UI 状态机总渲染：横幅六态（调度暂停/调度中/手动休眠/深度休眠倒计时/
     * 循环挂机/连播进行）决定 banner 文案与配色；联动引擎指示灯透明度、
     * 文档进度条宽度、实时学习时长显示。activeZone 非 course 直接短路。
     * [DEEP-DOC]
     */
    function updateCourseUI() {
        if (playState.activeZone !== ZONE.COURSE) return;
        const statusBanner = document.getElementById('xy-status-banner');
        if (statusBanner) {
            if (xyScheduleState.isRunning) {
                if (xyScheduleState.isPaused) {
                    statusBanner.innerHTML = `<span style="color:${T('#fbbf24','#d97706')};">⏸ 计划调度已暂停</span>`;
                    statusBanner.style.background = T('rgba(251,191,36,0.1)','#fffbeb');
                    statusBanner.style.borderColor = T('rgba(251,191,36,0.25)','#fde68a');
                } else {
                    statusBanner.innerHTML = `<span style="color:${T('#fcd34d','#92400e')};">📅 计划调度中 (外挂托管)</span>`;
                    statusBanner.style.background = T('rgba(245,158,11,0.12)','#fffbeb');
                    statusBanner.style.borderColor = T('rgba(245,158,11,0.25)','#fde68a');
                }
            }
            else if (playState.mode === PLAY_MODE.MANUAL) {
                statusBanner.innerHTML = `<span style="color:${T('#94a3b8','#64748b')};">⏸️ 挂机休眠中</span>`;
                statusBanner.style.background = T('rgba(71,85,105,0.15)','#f8fafc');
                statusBanner.style.borderColor = T('rgba(71,85,105,0.2)','#e2e8f0');
            }
            else if (!getCourseGroupId()) {
                if (playState.mode === PLAY_MODE.SEQUENCE && Date.now() < playState.jumpSleepUntil) {
                    let leftMin = Math.ceil((playState.jumpSleepUntil - Date.now()) / 60000);
                    statusBanner.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">💤 寻路深度休眠 (约 ${leftMin} 分钟后重载探测)</span>`;
                    statusBanner.style.background = T('rgba(251,191,36,0.1)','#fffbeb');
                    statusBanner.style.borderColor = T('rgba(251,191,36,0.2)','#fde68a');
                } else {
                    statusBanner.innerHTML = `<span style="color:${T('#a5b4fc','#3730a3')};">🌐 雷达系统扫描中...</span>`;
                    statusBanner.style.background = T('rgba(99,102,241,0.1)','#eef2ff');
                    statusBanner.style.borderColor = T('rgba(99,102,241,0.2)','#c7d2fe');
                }
            }
            else if (playState.isTaskCompleted) {
                statusBanner.innerHTML = playState.mode === PLAY_MODE.LOOP
                    ? `<span style="color:${T('#34d399','#065f46')};">✅ 已达标 (持续安全循环中)</span>`
                    : `<span style="color:${T('#34d399','#065f46')};">✅ 已达标 (即将自动跳转)</span>`;
                statusBanner.style.background = T('rgba(52,211,153,0.1)','#ecfdf5');
                statusBanner.style.borderColor = T('rgba(52,211,153,0.2)','#a7f3d0');
            }
            else {
                statusBanner.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">⏳ 引擎防封运作中...</span>`;
                statusBanner.style.background = T('rgba(251,191,36,0.1)','#fffbeb');
                statusBanner.style.borderColor = T('rgba(251,191,36,0.2)','#fde68a');
            }
        }
        ['man', PLAY_MODE.LOOP, 'seq'].forEach(m => { const btn = document.getElementById(`btn-mode-${m}`); if(btn) btn.className = `xy-mode-btn ${playState.mode === (m==='man'?PLAY_MODE.MANUAL:m===PLAY_MODE.LOOP?PLAY_MODE.LOOP:PLAY_MODE.SEQUENCE) ? 'active' : ''}`; });

        const cRealTime = document.getElementById('xy-real-time');
        if (cRealTime) cRealTime.innerText = formatTime(recState.realTime);

        const btnQuickMute = document.getElementById('xy-btn-quick-mute');
        if(btnQuickMute) {
            btnQuickMute.textContent = guardState.hardwareMute ? 'ON' : 'OFF';
            btnQuickMute.style.background = guardState.hardwareMute ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0');
            btnQuickMute.style.color = guardState.hardwareMute ? T('#34d399','#065f46') : T('#94a3b8','#64748b');
        }
    }
    /**
     * 自定义回复库编辑弹窗：textarea 预填现有语料（每行一条），保存时按行拆分
     * 过滤空行写回 customReplies 并持久化。取消直接关闭不落盘。回复计数徽章联动。
     * [DEEP-DOC]
     */
    function openReplySettingsModal() {
        if (!document.body) return;
        const phrases = (discState.customReplies && discState.customReplies.length > 0)
            ? discState.customReplies.join('\n')
            : '';
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2147483647; opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px); padding: 20px;`;
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="background: ${T('linear-gradient(145deg, #1e293b, #0f172a)','#ffffff')}; border-radius: 16px; min-width: 500px; max-width: 90%; padding: 28px; box-shadow: ${T('0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(71,85,105,0.3)','0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)')}; border: 1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; transform: scale(0.95); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #818cf8, #a78bfa); opacity: 0.8;"></div>
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: ${T('rgba(129,140,248,0.12)','#eef2ff')}; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid ${T('rgba(129,140,248,0.2)','#c7d2fe')};">⚙️</div>
                    <h3 style="margin: 0; color: ${T('#f1f5f9','#0f172a')}; font-size: 18px; font-weight: 700;">自定义语料库</h3>
                </div>
                <div style="margin-bottom:8px; font-size:13px; color:${T('#94a3b8','#64748b')};">每行一条回复语料（至少需 <b style="color:${T('#fbbf24','#92400e')};">16个中文字</b> 才生效）</div>
                <textarea id="xy-reply-ta" style="width:100%; height:280px; background:${T('rgba(15,23,42,0.6)','#ffffff')}; color:${T('#e2e8f0','#0f172a')}; border:1px solid ${T('rgba(71,85,105,0.3)','#e2e8f0')}; border-radius:10px; padding:14px; font-size:13px; resize:vertical; outline:none; line-height:1.6; font-family:inherit; margin-bottom:12px; box-sizing:border-box;" placeholder="输入自定义回复，每行一条...">${escapeHtml(phrases)}</textarea>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <button id="xy-reply-reset-btn" style="background:${T('rgba(248,113,113,0.1)','#fee2e2')}; color:#f87171; border:1px solid ${T('rgba(248,113,113,0.2)','#fecaca')}; padding:8px 16px; border-radius:8px; font-size:12px; cursor:pointer; font-weight:600;">🔄 恢复默认语料库</button>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:11px; color:${T('#64748b','#94a3b8')};" id="xy-reply-count">${discState.customReplies.length} 条</span>
                        <button id="xy-reply-save-btn" style="padding:10px 24px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; background:linear-gradient(135deg, #818cf8, #6366f1); color:white; box-shadow:0 4px 12px rgba(99,102,241,0.25); transition:all 0.2s;">💾 保存语料库</button>
                    </div>
                </div>
            </div>`;
        modal.appendChild(content); document.body.appendChild(modal);
        requestAnimationFrame(() => { modal.style.opacity = '1'; content.firstElementChild.style.transform = 'scale(1)'; });
        const closeModal = () => { modal.style.opacity = '0'; content.firstElementChild.style.transform = 'scale(0.95)'; setTimeout(() => modal.remove(), 300); };
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        const ta = document.getElementById('xy-reply-ta');
        if (ta) {
            ta.addEventListener('input', () => {
                const cnt = document.getElementById('xy-reply-count');
                if (cnt) cnt.textContent = ta.value.split(/[\n\r]+/).filter(s => s.trim()).length + ' 条';
            });
        }
        const resetBtn = document.getElementById('xy-reply-reset-btn');
        if (resetBtn) resetBtn.onclick = () => {
            const defaults = [
                "非常赞同你的观点，这种思路确实能给我们带来很多新的启发和思考！",
                "同学说得太对了，我也一直有这个想法，按照这个方法去做肯定会有很大收获。",
                "感谢分享！这个角度非常新颖，让我对这个问题有了更加全面和深入的理解。",
                "这确实是一个值得深入探讨的好问题，你的分析非常有逻辑，支持一下！",
                "完全同意！这种方法在实际应用中非常有效，非常值得大家一起学习和借鉴。",
                "很有道理，细节决定成败，你提到的这几个关键点在实践中确实极容易被忽略。",
                "受教了，之前一直没想通这个问题，看了你的清晰解释之后感觉豁然开朗！",
                "分析得很透彻！结合我们目前的课程学习内容来看，这个总结非常有指导意义。",
                "特别认同这段话的内容，学习到了新的知识点，期待以后能有更多这样的干货！",
                "说得非常有见地，而且语言表达也很清晰易懂，把复杂的问题简单化了，佩服！"
            ];
            if (ta) { ta.value = defaults.join('\n'); ta.dispatchEvent(new Event('input')); }
        };
        const saveBtn = document.getElementById('xy-reply-save-btn');
        if (saveBtn) saveBtn.onclick = () => {
            const lines = ta.value.split(/[\n\r]+/).map(s => s.trim()).filter(s => s.length > 0);
            discState.customReplies = lines;
            GM_setValue('xy_custom_replies', JSON.stringify(lines));
            closeModal();
            showToast(`语料库已保存 (${lines.length} 条)`, 'success');
        };
    }
    /**
     * 讨论区 UI 总刷新：状态条（ID 捕获情况/名单规模）、点赞与回复按钮可用性
     * （依赖 discussionId 已捕获）、名单计数徽章同步。非 disc 区短路返回。
     * [DEEP-DOC]
     */
    function updateDiscUI() {
        if (playState.activeZone !== ZONE.DISC) return;
        const statusEl = document.getElementById('xy-disc-status');
        if (statusEl) {
            if (discState.discussionId) { statusEl.innerHTML = `<span style="color:${T('#34d399','#065f46')};">✅ 已锁定讨论区：${discState.discussionId.substring(0,8)}...</span>`; statusEl.style.background = T('rgba(52,211,153,0.1)','#ecfdf5'); statusEl.style.borderColor = T('rgba(52,211,153,0.2)','#a7f3d0'); document.querySelectorAll('.xy-action-btn.disc-btn').forEach(b => b.style.opacity = '1'); }
            else { statusEl.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">⚠️ 请在讨论区内刷新页面 (或随意点击评论) 触发网络包获取ID</span>`; statusEl.style.background = T('rgba(251,191,36,0.1)','#fffbeb'); statusEl.style.borderColor = T('rgba(251,191,36,0.2)','#fde68a'); }
        }
    }

    const updateCheckedCount = () => { 
        const span = document.getElementById('xy-checked-count'); 
        if(span) span.textContent = discState.selectedNames.size; 
        const totalSpan = document.getElementById('xy-total-count');
        if(totalSpan) totalSpan.textContent = discState.targetNames.length;
    };
    /**
     * 名单列表渲染：搜索词过滤（escapeRegex 安全嵌入正则做包含匹配）→
     * 勾选态从 selectedNames 读回 → 行 HTML（checkbox + 姓名 + 序号）→
     * change 事件委托维护 selectedNames。空结果展示占位文案。
     * [DEEP-DOC]
     */
    function renderTargetList(filterText = '') {
        const listDiv = document.getElementById('xy-target-list'); if (!listDiv) return;
        
        if (discState.targetNames.length === 0) { 
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; font-size:13px; text-align:center; padding:24px 0; grid-column: 1 / -1; letter-spacing: 0.5px;">✨ 正在等待或自动全量扫描中...</div>`;
            updateCheckedCount();
            return; 
        }
        
        const terms = filterText.split(/[\s,，;；]+/).map(t => t.trim()).filter(t => t);
        let displayNames = discState.targetNames;
        
        if (terms.length > 0) {
            displayNames = displayNames.filter(name => terms.some(term => name.toLowerCase().includes(term.toLowerCase())));
        }
    
        if (displayNames.length === 0) {
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; font-size:13px; text-align:center; padding:24px 0; grid-column: 1 / -1; letter-spacing: 0.5px;">无匹配的结果，尝试换个词？</div>`;
            return;
        }
    
        let html = `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">`;
        displayNames.forEach((name) => {
            const safeName = escapeHtml(name);
            let displayNameHtml = safeName;
            if (terms.length > 0) {
                terms.forEach(term => {
                    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
                    displayNameHtml = displayNameHtml.replace(regex, `<span style="background-color: #fde047; color: #854d0e; font-weight: bold; border-radius: 4px; padding: 0 4px;">$1</span>`);
                });
            }
            const isChecked = discState.selectedNames.has(name);
            html += `
                <label class="xy-target-item" title="${safeName}" style="background: ${T('rgba(30,41,59,0.35)','#ffffff')}; box-shadow: ${T('0 2px 4px rgba(0,0,0,0.1)','none')}; padding: 10px 12px; border-radius: 10px; display: flex; min-width: 0; align-items: center; gap: 10px; cursor: pointer; border: 1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; transition: all 0.2s;">
                    <input type="checkbox" class="xy-target-checkbox" value="${safeName}" ${isChecked ? 'checked' : ''} style="accent-color: #818cf8; flex-shrink: 0; width: 16px; height: 16px; cursor: pointer;">
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size: 14px; color: ${T('#e2e8f0','#0f172a')}; user-select: none;">${displayNameHtml}</span>
                </label>
            `; 
        });
        html += `</div>`;
        listDiv.innerHTML = html; 
        updateCheckedCount();
    }
    /**
     * 全网任务聚合（雷达/调度/批量提交的共用数据源）。
     *
     * 流程：un_finish 接口取未完成任务骨架 → 学生课程列表补齐 courseMap
     * （GM 持久化 xy_course_map 跨会话缓存）→ 逐课程并发 queryCourseResources
     * 补全资源型任务（node_id 去重合并，computed_task_type 回填，group_name 兜底）。
     * 单课失败 warn 不中断整体。
     * [DEEP-DOC]
     */
    async function fetchGlobalTasks() {
        let allTasks = [];
        try { 
            const token = await getAuthToken(); 
            
            
            const res1 = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { method: "GET", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" } }); 
            const data1 = await res1.json(); 
            let unfinishedTasks = [];
            if (data1.success && data1.data) {
                unfinishedTasks = data1.data;
                allTasks = JSON.parse(JSON.stringify(unfinishedTasks));
            }

            
            let courseMap = {};
            try { courseMap = JSON.parse(GM_getValue('xy_course_map', '{}')); } catch(e) { console.warn('[小雅] 课程名映射缓存解析失败:', e); }

            unfinishedTasks.forEach(t => {
                if (t.group_id && t.group_name) courseMap[t.group_id] = t.group_name;
            });

            
            const currentGroupId = getCourseGroupId();
            if (currentGroupId && !courseMap[currentGroupId]) {
                const apiName = await getCourseNameFromAPI(currentGroupId);
                if (apiName) courseMap[currentGroupId] = apiName;
            }
            
            const unfinishedGroupIds = new Set(unfinishedTasks.map(t => t.group_id).filter(Boolean));
            const staleIds = Object.keys(courseMap).filter(gId => !unfinishedGroupIds.has(gId));
            if (staleIds.length > 0) {
                await Promise.all(staleIds.map(async (gId) => {
                    const apiName = await getCourseNameFromAPI(gId);
                    if (apiName) courseMap[gId] = apiName;
                }));
            }

            // 拉取全部学生课程，补齐 courseMap（调度/雷达显示所有课程）
            try {
                const gr = await fetch(`https://${domain}/api/jx-iresource/group/student/groups?time_flag=1`, { headers: { "authorization": `Bearer ${token}` } });
                const gj = await gr.json();
                const gdata = gj && gj.data;
                const garr = Array.isArray(gdata) ? gdata : (gdata && (Array.isArray(gdata.groups) ? gdata.groups : (Array.isArray(gdata.list) ? gdata.list : [])));
                (garr || []).forEach(g => {
                    const gid = g.id || g.group_id;
                    const gname = g.name || g.group_name || g.title;
                    if (gid && gname) courseMap[String(gid)] = gname;
                });
            } catch(e) {}

            GM_setValue('xy_course_map', JSON.stringify(courseMap));

            
            const groupIds = Object.keys(courseMap);
            if (groupIds.length > 0) {
                const fetchPromises = groupIds.map(async (gId) => {
                    try {
                        const r = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${gId}`, { headers: { "authorization": `Bearer ${token}` } });
                        const d = await r.json();
                        return { gId, gName: courseMap[gId], data: d };
                    } catch (e) { console.warn('[小雅] 课程资源批量探测失败:', gId, e); return null; }
                });

                const results = await Promise.all(fetchPromises);
                
                results.forEach(res => {
                    if (res && res.data && res.data.success && res.data.data) {
                        const flatRes = extractFilesFromResources(res.data.data);
                        flatRes.forEach(r => {
                            
                            const existItem = allTasks.find(t => t.node_id == (r.node_id || r.id) && t.group_id == res.gId);
                            if (!existItem) {
                                allTasks.push({
                                    task_id: r.task_id || r.id,
                                    id: r.task_id || r.id,
                                    node_id: r.node_id || r.id,
                                    group_id: res.gId,
                                    resource_id: r.resource_id || r.id,
                                    name: r.name || r.title || '未知任务', 
                                    task_type: r.computed_task_type || 1, 
                                    finish: 2, 
                                    start_time: r.start_time || new Date().toISOString(),
                                    end_time: r.end_time || "2099-12-31T00:00:00.000Z",
                                    group_name: res.gName || "未知课程" 
                                });
                            } else {
                                
                                existItem.group_name = res.gName;
                                existItem.task_type = r.computed_task_type || existItem.task_type;
                            }
                        });
                    }
                });
            }
        } catch (error) { console.warn('[小雅] fetchGlobalTasks 失败', error); }
        return allTasks;
    }
    /**
     * 批量任务提交：逐任务 autoSubmitCurrentTask 式验证上报，间隔随机化拟人；
     * 实时更新按钮进度文案「i/n」；汇总成功/失败计数 toast 收尾。AbortController
     * 未接入——批量一旦启动只能等自然结束或关页。
     * [DEEP-DOC]
     */
    async function batchSubmitGlobalTasks(taskObjs) {
        try {
            const token = await getAuthToken(); let successCount = 0;
            let submitBtn = document.getElementById('xy-batch-submit-btn');
            const total = taskObjs.length;

            for (let i = 0; i < taskObjs.length; i++) {
                submitBtn = document.getElementById('xy-batch-submit-btn');
                const task = taskObjs[i];
                if (submitBtn) {
                    submitBtn.innerText = `⏳ 正在提交任务... (${i+1}/${total})`;
                    submitBtn.disabled = true;
                }
                const taskCard = document.getElementById(`xy-global-task-card-${task.task_id || task.id}`);
                let statusIndicator = null;
                
                if (taskCard) {
                    taskCard.style.opacity = '0.8';
                    taskCard.style.transform = 'scale(0.98)';
                    statusIndicator = taskCard.querySelector('.xy-task-status-indicator');
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '🔄 提交请求中...';
                        statusIndicator.style.background = T('rgba(251,191,36,0.1)','#fffbeb');
                        statusIndicator.style.color = T('#fcd34d','#92400e');
                    }
                }

                try {
                    const response = await fetch(`https://${domain}/api/jx-iresource/resource/finishActivity`, { method: "POST", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify({ "group_id": task.group_id, "node_id": task.node_id, "task_id": task.task_id || task.id }) });
                    const data = await response.json(); 
                    if (data.success) { 
                        logMsg(`✅ 任务提交成功：${task.name}`, 'success', true); 
                        successCount++; 
                        if (statusIndicator) {
                            statusIndicator.innerHTML = '✓ 验证通过';
                            statusIndicator.style.background = T('rgba(52,211,153,0.12)','#ecfdf5');
                            statusIndicator.style.color = T('#34d399','#065f46');
                        }
                        const checkbox = taskCard ? taskCard.querySelector('.xy-task-check') : null;
                        if (checkbox) { checkbox.disabled = true; checkbox.checked = false; }
                        if (taskCard) taskCard.style.borderColor = T('rgba(52,211,153,0.25)','#a7f3d0');
                    } else {
                        if (statusIndicator) {
                            statusIndicator.innerHTML = '❌ 验证失败';
                            statusIndicator.style.background = T('rgba(248,113,113,0.12)','#fee2e2');
                            statusIndicator.style.color = '#f87171';
                        }
                        if (taskCard) taskCard.style.borderColor = T('rgba(248,113,113,0.25)','#fecaca');
                    }
                } catch (err) {
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '⚠️ 网络异常';
                        statusIndicator.style.background = T('rgba(248,113,113,0.1)','#fee2e2');
                        statusIndicator.style.color = '#f87171';
                    }
                }
                
                if (taskCard) {
                    taskCard.style.opacity = '1';
                    taskCard.style.transform = 'scale(1)';
                }
                
                await sleep(400); 

                submitBtn = document.getElementById('xy-batch-submit-btn');
                if (submitBtn) submitBtn.innerText = `🔄 正在同步雷达数据... (${i+1}/${total})`;
                
                const latestTasks = await fetchGlobalTasks(); 
                renderGlobalDashboardContent(latestTasks); 
                
                await sleep(200); 
            }
            
            const finalSubmitBtn = document.getElementById('xy-batch-submit-btn');
            if (finalSubmitBtn) {
                finalSubmitBtn.innerText = '🚀 一键提交勾选任务';
                finalSubmitBtn.disabled = false;
            }

            if (successCount > 0) { 
                showToast(`🎉 成功完成 ${successCount} 个学习任务！`, 'success');
            }

        } catch(e) { console.warn('[小雅] 全局任务执行失败', e); }
    }
    /** 打开全局任务雷达面板：置 overlay 可见 → fetchGlobalTasks 拉数据 → renderGlobalDashboardContent 全量渲染。关闭按钮在面板内绑定。
     * [DEEP-DOC]
     */
    async function openGlobalTaskDashboard() {
        let overlay = document.getElementById('xy-dashboard-overlay');
        if (!overlay) { overlay = document.createElement('div'); overlay.id = 'xy-dashboard-overlay'; overlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:${T('rgba(15,23,42,0.7)','rgba(0,0,0,0.3)')}; z-index:2147483645; display:flex; justify-content:center; align-items:center; backdrop-filter:${T('blur(12px)','blur(4px)')}; opacity:0; transition:opacity 0.3s;`; document.body.appendChild(overlay); }
        overlay.innerHTML = `
            <div style="background:${T('linear-gradient(180deg, #1e293b 0%, #0f172a 100%)','#ffffff')}; width:90%; max-width:960px; height:85vh; border-radius:24px; box-shadow:${T('0 30px 60px rgba(0,0,0,0.5)','0 20px 50px rgba(0,0,0,0.1)')}; display:flex; flex-direction:column; overflow:hidden; transform:scale(0.95); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); border:1px solid ${T('rgba(71,85,105,0.3)','#e2e8f0')};">
                <div style="padding:24px 32px; background:${T('linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))','#eef2ff')}; border-bottom:1px solid ${T('rgba(99,102,241,0.2)','#c7d2fe')}; display:flex; justify-content:space-between; align-items:center; flex-shrink: 0;">
                    <div style="font-size:22px; font-weight:bold; color:${T('#e2e8f0','#0f172a')}; display:flex; align-items:center; gap:12px; letter-spacing: 0.5px;">🌍 全局智能导航雷达</div>
                    <button id="xy-close-dashboard" style="background:none; border:none; font-size:26px; color:${T('#94a3b8','#64748b')}; cursor:pointer; padding:0; transition: 0.2s;" onmouseover="this.style.color='${T('#e2e8f0','#0f172a')}'; this.style.transform='rotate(90deg)';" onmouseout="this.style.color='${T('#94a3b8','#64748b')}'; this.style.transform='none';">✖</button>
                </div>
                <div id="xy-dashboard-content" style="flex:1; overflow-y:auto; padding:32px; background:transparent;">
                    <div style="text-align:center; padding:60px; color:${T('#94a3b8','#64748b')}; font-size:18px; letter-spacing: 0.5px;"><span style="display:inline-block; animation:pulse 1.5s infinite;">📡 正在深度扫描全局雷达与所有课程的已完成任务...</span></div>
                </div>
                <div id="xy-dashboard-footer" style="display:none; padding:20px 32px; background:${T('rgba(15,23,42,0.8)','#f8fafc')}; border-top:1px solid ${T('rgba(71,85,105,0.25)','#e2e8f0')}; flex-shrink: 0; justify-content:center; box-shadow: ${T('0 -4px 20px rgba(0,0,0,0.15)','none')};">
                    <button id="xy-batch-submit-btn" style="width:100%; max-width:700px; background:linear-gradient(135deg, #6366f1, #4f46e5); color:white; border:none; padding:18px; border-radius:14px; font-size:18px; font-weight:bold; cursor:pointer; box-shadow:0 8px 24px rgba(99,102,241,0.3); transition:all 0.2s; letter-spacing: 1px;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">🚀 一键提交勾选任务</button>
                </div>
            </div>
        `;
        requestAnimationFrame(() => { overlay.style.opacity = '1'; overlay.firstElementChild.style.transform = 'scale(1)'; });
        document.getElementById('xy-close-dashboard').onclick = () => { overlay.style.opacity = '0'; overlay.firstElementChild.style.transform = 'scale(0.95)'; setTimeout(() => overlay.remove(), 300); };
        const tasks = await fetchGlobalTasks(); renderGlobalDashboardContent(tasks);
    }
    /** 雷达专用的轻量资源拉取：getAuthToken + queryCourseResources，success 即返回 data.data；异常静默 null（雷达容忍部分课程缺树）。
     * [DEEP-DOC]
     */
    async function fetchCourseResourcesForRadar(gid) {
        try {
            const token = await getAuthToken();
            const res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${gid}`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) return data.data;
        } catch(e) { console.warn('[小雅] 雷达课程资源请求失败:', gid, e); }
        return null;
    }
    /**
     * 单元名映射递归构建：dirIsUnit 判定的单元节点写入 map（_id/node_id 双键
     * 都映射到单元名）并推入 orderedOut 保序数组；叶子文件继承最近父单元名。
     * 供雷达任务按单元分组展示。
     * [DEEP-DOC]
     */
    function buildUnitNameMap(nodes, parentName, map, orderedOut) {
        if (!map) map = new Map();
        (Array.isArray(nodes) ? nodes : []).forEach(n => {
            const name = n.name || n.title || '';
            if (dirIsUnit(n)) {
                if (n._id != null) map.set(String(n._id), name);
                if (n.node_id != null) map.set(String(n.node_id), name);
                if (orderedOut && !orderedOut.includes(name)) orderedOut.push(name);
                buildUnitNameMap(dirUnitChildren(n), name, map, orderedOut);
            } else {
                const p = parentName || '';
                if (n._id != null) map.set(String(n._id), p);
                if (n.node_id != null) map.set(String(n.node_id), p);
            }
        });
        return map;
    }
    /** 任务按 unitMap 查得的单元名分组（双键查询兜底），无映射归入「未分组」桶。
     * [DEEP-DOC]
     */
    function groupTasksByUnit(tasks, unitMap) {
        const m = new Map();
        (Array.isArray(tasks) ? tasks : []).forEach(t => {
            const key = String(t.node_id != null ? t.node_id : t.id);
            const unit = (unitMap && (unitMap.get(key) || unitMap.get(String(t.id)))) || '未分组';
            if (!m.has(unit)) m.set(unit, []);
            m.get(unit).push(t);
        });
        return m;
    }
    /**
     * 雷达任务卡 HTML：名称截断悬浮提示、课程名、状态徽标（已完成可刷/待完成）、
     * 操作按钮（挂机/提交）。data-tid 关联全局任务 Map 供事件委托取回完整对象。
     * [DEEP-DOC]
     */
    function buildRadarTaskCard(task) {
        window.xyGlobalTaskMap.set(task.task_id || task.id, task);
        const now = new Date();
        const endTime = new Date(task.end_time);
        const startTime = new Date(task.start_time);
        const isCompleted = task.finish === 2;
        const isAutoable = task.task_type === 1;
        const enableCheck = (!isCompleted) && (isAutoable || playState.isFreedomMode);
        let statusTag = '', statusColorBg = '', statusColorText = '';
        if (isCompleted) { statusTag = '✓ 已完成'; statusColorBg = 'rgba(52,211,153,0.12)'; statusColorText = '#34d399'; }
        else if (endTime < now) { statusTag = '⚠️ 已截止'; statusColorBg = 'rgba(248,113,113,0.12)'; statusColorText = '#f87171'; }
        else if (task.start_time && startTime > now) { statusTag = '🔒 未开始'; statusColorBg = 'rgba(71,85,105,0.15)'; statusColorText = '#94a3b8'; }
        else { statusTag = '⏳ 进行中'; statusColorBg = 'rgba(99,102,241,0.12)'; statusColorText = '#a5b4fc'; }
        const currentNodeId = getNodeId();
        const isCurrentNode = currentNodeId && task.node_id == currentNodeId;
        const borderStyle = isCurrentNode ? 'border: 2px solid #818cf8; box-shadow: 0 0 15px rgba(129,140,248,0.15);' : (enableCheck ? `border: 1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')};` : 'border: 1px solid transparent;');
        const currentMark = isCurrentNode ? `<span style="background:#6366f1; color:white; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:bold; margin-left:10px; box-shadow: 0 2px 4px rgba(99,102,241,0.3);">📍 当前位置</span>` : '';
        const typeStr = {1:'👁️ 自主观看', 2:'✍️ 作业', 3:'📚 课堂练习', 4:'💯 测验', 5:'📋 问卷', 6:'💭 讨论'}[task.task_type] || '📌 未知';
        return `
            <div id="xy-global-task-card-${task.task_id || task.id}" style="background:${T('rgba(30,41,59,0.35)','#ffffff')}; border-radius:12px; padding:16px; display:flex; align-items:center; gap:20px; transition: all 0.3s; ${borderStyle}">
                <input type="checkbox" class="xy-task-check" value="${task.task_id || task.id}" ${enableCheck?'':'disabled'} style="width:20px; height:20px; cursor:${enableCheck?'pointer':'not-allowed'}; accent-color:#818cf8; flex-shrink: 0;">
                <div style="flex:1;">
                    <div style="font-size:15px; font-weight:bold; color:${T('#e2e8f0','#0f172a')}; margin-bottom:8px; display:flex; align-items:center; letter-spacing: 0.5px;">
                        ${escapeHtml(task.name) || '未知任务'} ${currentMark}
                    </div>
                    <div style="font-size:13px; color:${T('#94a3b8','#64748b')}; display:flex; gap:24px; font-weight: 500;">
                        <span style="background: ${T('rgba(71,85,105,0.2)','#f1f5f9')}; padding: 2px 8px; border-radius: 6px;">${typeStr}</span>
                        <span>截止: ${new Date(task.end_time).toLocaleDateString()}</span>
                    </div>
                </div>
                <div>
                    <span class="xy-task-status-indicator" style="background:${statusColorBg}; color:${statusColorText}; padding:6px 12px; border-radius:8px; font-size:13px; font-weight:bold; white-space:nowrap; transition:all 0.3s;">${statusTag}</span>
                </div>
            </div>`;
    }
    /**
     * 全局雷达面板主渲染：空态早退；按 groupTasksByUnit 分组后逐组渲染任务卡；
     * 头部统计（总任务/未完成）与批量操作栏（勾选提交）一并装配；事件委托统一
     * 在容器上处理点击。
     * [DEEP-DOC]
     */
    async function renderGlobalDashboardContent(tasks) {
        const contentBox = document.getElementById('xy-dashboard-content'), footerBox = document.getElementById('xy-dashboard-footer');
        if (!contentBox) return;
        if (!tasks || tasks.length === 0) { contentBox.innerHTML = `<div style="text-align:center; padding:100px; color:${T('#94a3b8','#64748b')}; font-size:22px; letter-spacing: 0.5px;">🎉 全网已无任务数据！</div>`; if (footerBox) footerBox.style.display = 'none'; return; }
        if (footerBox) footerBox.style.display = 'flex';

        let html = `
            <div style="background:${T('linear-gradient(145deg, rgba(251,191,36,0.1), rgba(245,158,11,0.08))','#fffbeb')}; padding:20px 24px; border-radius:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; border:1px solid ${T('rgba(251,191,36,0.2)','#fde68a')}; box-shadow: ${T('0 4px 12px rgba(251,191,36,0.08)','none')};">
                <div>
                    <div style="font-weight:bold; color:${T('#fcd34d','#92400e')}; font-size:16px; margin-bottom:6px; display:flex; align-items:center; gap:8px;">⚠️ 跨课高危自由模式</div>
                    <div style="color:${T('#fbbf24','#92400e')}; font-size:13px; line-height: 1.6; opacity:0.8;">允许跨课程批量强交【非视频类】作业（有查水表风险，切忌交空卷）</div>
                </div>
                <label style="position:relative; display:inline-block; width:56px; height:30px;">
                    <input type="checkbox" id="xy-freedom-switch" style="opacity:0; width:0; height:0;" ${playState.isFreedomMode ? 'checked' : ''}>
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${playState.isFreedomMode?'#f59e0b':'#475569'}; border-radius:34px; transition:.4s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <span style="position:absolute; height:22px; width:22px; left:4px; bottom:4px; background:#e2e8f0; border-radius:50%; transition:.4s; transform:${playState.isFreedomMode?'translateX(26px)':'translateX(0)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
                    </span>
                </label>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 8px;">
            <label style="cursor: pointer; display: flex; min-width: 0; align-items: center; gap: 10px; font-weight: 700; color: ${T('#cbd5e1','#334155')}; font-size: 16px; user-select: none; transition: 0.2s;" onmouseover="this.style.color='${T('#e2e8f0','#0f172a')}'" onmouseout="this.style.color='${T('#cbd5e1','#334155')}'">
                <input type="checkbox" id="xy-select-all" style="width: 20px; height: 20px; accent-color: #818cf8; cursor: pointer;"> ✅ 全选可提交任务
            </label>
        </div>
        <div id="xy-global-task-container" style="display:flex; flex-direction:column; gap:24px;">
        `;

        const groupedTasks = tasks.reduce((acc, t) => { if(!acc[t.group_name]) acc[t.group_name] = []; acc[t.group_name].push(t); return acc; }, {});
        window.xyGlobalTaskMap = new Map();

        const courseUnits = {};
        const courseUnitOrder = {};
        for (const [courseName, courseTasks] of Object.entries(groupedTasks)) {
            const gid = courseTasks[0] && courseTasks[0].group_id;
            let unitMap = null;
            const orderedOut = [];
            if (gid) {
                try {
                    const res = await fetchCourseResourcesForRadar(gid);
                    if (res) {
                        unitMap = buildUnitNameMap(buildDirTree(res), '', null, orderedOut);
                    }
                } catch(e) {}
            }
            courseUnits[courseName] = groupTasksByUnit(courseTasks, unitMap);
            const orderIdx = new Map(orderedOut.map((n, i) => [n, i]));
            orderIdx.set('未分组', Number.MAX_SAFE_INTEGER);
            courseUnitOrder[courseName] = orderIdx;
        }

        Object.entries(groupedTasks).forEach(([courseName, courseTasks], groupIdx) => {
            
            courseTasks.sort((a,b) => {
                if (a.finish !== b.finish) return a.finish - b.finish; 
                return new Date(a.end_time) - new Date(b.end_time);
            });
            
            const safeId = 'xy-global-group-' + groupIdx;
            
            html += `
                <div style="background:${T('rgba(30,41,59,0.5)','#ffffff')}; border-radius:20px; border:1px solid ${T('rgba(71,85,105,0.25)','#e2e8f0')}; overflow:hidden; box-shadow:${T('0 6px 16px rgba(0,0,0,0.15)','0 1px 3px rgba(0,0,0,0.04)')}; margin-bottom: 16px;">
                    <div class="xy-global-group-header" data-target="${safeId}" style="background:${T('rgba(30,41,59,0.7)','#f8fafc')}; padding:16px 24px; font-weight:bold; color:${T('#e2e8f0','#0f172a')}; border-bottom:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none; transition:background 0.2s;">
                        <span style="font-size:16px; letter-spacing: 0.5px;">📚 ${courseName || '未知课程'}</span>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="background:${T('rgba(99,102,241,0.15)','#e0e7ff')}; color:${T('#a5b4fc','#3730a3')}; padding:4px 12px; border-radius:12px; font-size:13px; font-weight:700;">${courseTasks.length} 个任务</span>
                            <span class="xy-global-group-arrow" style="transition: transform 0.2s; color:${T('#64748b','#94a3b8')}; font-size: 12px;">▼</span>
                        </div>
                    </div>
                    <div id="${safeId}" class="xy-global-group-content" style="padding:20px; display:flex; flex-direction:column; gap:16px;">
            `;
            const unitGroups = courseUnits[courseName];
            const flatFallback = unitGroups.size === 1 && unitGroups.has('未分组');
            const unitOrder = courseUnitOrder[courseName] || new Map();
            const unitEntries = Array.from(unitGroups.entries()).sort((a, b) => (unitOrder.get(a[0]) || 0) - (unitOrder.get(b[0]) || 0));
            let ui = 0;
            if (flatFallback) {
                courseTasks.forEach(task => { html += buildRadarTaskCard(task); });
            } else {
                unitEntries.forEach(([unitName, unitTasks]) => {
                    const unitId = safeId + '-u' + ui++;
                    html += `
                        <div style="margin-bottom:12px;">
                            <div class="xy-global-unit-header" data-target="${unitId}" style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:${T('rgba(30,41,59,0.5)','#f8fafc')}; border-radius:10px; border:1px solid ${T('rgba(71,85,105,0.18)','#e2e8f0')}; cursor:pointer; user-select:none;">
                                <span style="font-size:13px; font-weight:700; color:${T('#c7d2fe','#4338ca')}; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📂 ${escapeHtml(unitName)}</span>
                                <span style="background:${T('rgba(99,102,241,0.15)','#e0e7ff')}; color:${T('#a5b4fc','#3730a3')}; padding:2px 10px; border-radius:10px; font-size:12px; font-weight:700; white-space:nowrap;">${unitTasks.length} 个任务</span>
                                <span class="xy-global-unit-arrow" style="transition:transform 0.2s; color:${T('#64748b','#94a3b8')}; font-size:11px;">▼</span>
                            </div>
                            <div id="${unitId}" class="xy-global-unit-content" style="display:flex; flex-direction:column; gap:12px; padding:12px 0 4px 14px;">
                    `;
                    unitTasks.forEach(task => { html += buildRadarTaskCard(task); });
                    html += `</div></div>`;
                });
            }
            html += `</div></div>`;
        });
        html += `</div>`; contentBox.innerHTML = html;

        
        document.querySelectorAll('.xy-global-group-header').forEach(header => {
            header.onclick = () => {
                const targetId = header.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const arrow = header.querySelector('.xy-global-group-arrow');
                if (content.style.display === 'none') {
                    content.style.display = 'flex';
                    arrow.style.transform = 'rotate(0deg)';
                    header.style.background = T('rgba(30,41,59,0.7)','#f8fafc');
                } else {
                    content.style.display = 'none';
                    arrow.style.transform = 'rotate(-90deg)';
                    header.style.background = T('rgba(30,41,59,0.35)','#f1f5f9');
                }
            };
        });

        document.querySelectorAll('.xy-global-unit-header').forEach(header => {
            header.onclick = () => {
                const targetId = header.getAttribute('data-target');
                const content = document.getElementById(targetId);
                const arrow = header.querySelector('.xy-global-unit-arrow');
                if (content.style.display === 'none') {
                    content.style.display = 'flex';
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                } else {
                    content.style.display = 'none';
                    if (arrow) arrow.style.transform = 'rotate(-90deg)';
                }
            };
        });

        const selectAllCb = document.getElementById('xy-select-all'), taskCheckboxes = document.querySelectorAll('.xy-task-check:not([disabled])');
        if (selectAllCb) selectAllCb.onchange = (e) => { taskCheckboxes.forEach(cb => { cb.checked = e.target.checked; }); };
        taskCheckboxes.forEach(cb => { cb.onchange = () => { if (!cb.checked && selectAllCb) selectAllCb.checked = false; else if (selectAllCb) selectAllCb.checked = Array.from(taskCheckboxes).every(c => c.checked); }; });
        const fSwitch = document.getElementById('xy-freedom-switch');
        if (fSwitch) fSwitch.onchange = (e) => {
            if (e.target.checked) { xyShowModal("⚠️ 越级警告", "强行解除非视频节点的锁极易导致数据异常，请确保你清楚后果！", () => { playState.isFreedomMode = true; renderGlobalDashboardContent(tasks); }); e.target.checked = false; } 
            else { playState.isFreedomMode = false; renderGlobalDashboardContent(tasks); }
        };
        const submitBtn = document.getElementById('xy-batch-submit-btn');
        if (submitBtn) submitBtn.onclick = () => {
            const checkedNodes = Array.from(document.querySelectorAll('.xy-task-check:checked')).map(cb => cb.value);
            if (checkedNodes.length === 0) { showToast('未勾选任何提交目标', 'warning'); return; }
            submitBtn.innerText = '⏳ 正在批量提交任务...'; submitBtn.disabled = true;
            batchSubmitGlobalTasks(checkedNodes.map(id => window.xyGlobalTaskMap.get(id)).filter(Boolean));
        };
    }
    /**
     * 智能排课排序 —— 启发式贪心调度算法（权重见 SCHEDULE_WEIGHTS 常量）。
     *
     * 打分模型：ddlScore 按 DDL 分档（<1天:100 / <3天:80 / <7天:60 / <14天:40 /
     * <30天:20 : 其余5）× completionPenalty（已完成0.3 抑制重复刷）；
     * 迭代选取：每轮对 remaining 全量重算 score = ddlScore + typeBonus +
     * courseSwitchBonus——typeBonus 奖励与上一选中任务类型交错（视频文档交替
     * +25，首任务+10）；courseSwitchBonus 奖励跨课程切换(+15)。每轮取最高分
     * 移入 sorted 并更新 lastWasVideo。
     *
     * 学术注记：权值为经验启发值而非建模最优解，属贪心近似；实测排序质量稳定，
     * 但理论上不保证全局最优（NP-hard 排序问题的可接受工程折衷）。
     * [DEEP-DOC]
     */
    function optimizeScheduleOrder(tasks) {
        if (!tasks || tasks.length === 0) return [];
        const now = Date.now();
        const scored = tasks.map(task => {
            const endTime = new Date(task.end_time).getTime();
            const daysLeft = Math.max(0, (endTime - now) / (1000 * 60 * 60 * 24));
            const name = (task.name || '').toLowerCase();
            const isVideo = SHARED_PATTERNS.MEDIA.test(name);
            const isDoc = SHARED_PATTERNS.DOC.test(name);

            
            const ddlScore = daysLeft < SCHEDULE_WEIGHTS.DDL_DAY_1 ? SCHEDULE_WEIGHTS.DDL_SCORE[0]
                : daysLeft < SCHEDULE_WEIGHTS.DDL_DAY_3 ? SCHEDULE_WEIGHTS.DDL_SCORE[1]
                : daysLeft < SCHEDULE_WEIGHTS.DDL_DAY_7 ? SCHEDULE_WEIGHTS.DDL_SCORE[2]
                : daysLeft < SCHEDULE_WEIGHTS.DDL_DAY_14 ? SCHEDULE_WEIGHTS.DDL_SCORE[3]
                : daysLeft < SCHEDULE_WEIGHTS.DDL_DAY_30 ? SCHEDULE_WEIGHTS.DDL_SCORE[4]
                : SCHEDULE_WEIGHTS.DDL_SCORE[5];
            
            const completionPenalty = task.finish === 2 ? SCHEDULE_WEIGHTS.COMPLETION_PENALTY : 1.0;
            
            const typeWeight = isVideo ? SCHEDULE_WEIGHTS.TYPE_MEDIA : isDoc ? SCHEDULE_WEIGHTS.TYPE_MEDIA : SCHEDULE_WEIGHTS.TYPE_OTHER;

            return {
                task,
                ddlScore: ddlScore * completionPenalty,
                typeWeight,
                isVideo,
                isDoc,
                groupId: task.group_id,
                score: 0
            };
        });

        
        const sorted = [];
        const remaining = [...scored];
        let lastWasVideo = null;

        while (remaining.length > 0) {
            
            remaining.forEach(item => {
                let typeBonus = 0;
                if (lastWasVideo === true && item.isDoc) typeBonus = SCHEDULE_WEIGHTS.ALTERNATE_BONUS; 
                if (lastWasVideo === false && item.isVideo) typeBonus = SCHEDULE_WEIGHTS.ALTERNATE_BONUS; 
                if (lastWasVideo === null) typeBonus = SCHEDULE_WEIGHTS.FIRST_PICK_BONUS; 

                
                const hasOtherCourse = remaining.some(r => r.groupId !== item.groupId);
                const courseSwitchBonus = (hasOtherCourse && sorted.length > 0 && item.groupId !== sorted[sorted.length-1].groupId) ? SCHEDULE_WEIGHTS.COURSE_SWITCH_BONUS : 0;

                item.score = item.ddlScore + typeBonus + courseSwitchBonus;
            });

            
            remaining.sort((a, b) => b.score - a.score);
            const best = remaining.shift();
            sorted.push(best);
            lastWasVideo = best.isVideo;
        }

        return sorted.map(s => s.task);
    }
    /**
     * 智能排课入口编排：fetchGlobalTasks 全网任务 → 过滤出视频/文档且 task_type=1
     * 的可刷集合 → optimizeScheduleOrder 排序 → 逐个 getTaskResourceId 补全三元组
     * 后入队（已完成的用 duration 策略重刷，未完成 until_done）→ saveScheduleState
     * + 渲染队列 + 成功日志/toast。零任务时警告返回。
     * [DEEP-DOC]
     */
    async function smartOptimizeAndImport() {
        const tasks = await fetchGlobalTasks();
        const watchTasks = tasks.filter(t => {
            const name = (t.name || '').toLowerCase();
            const isVideo = SHARED_PATTERNS.MEDIA.test(name);
            const isDoc = SHARED_PATTERNS.DOC.test(name);
            return (isVideo || isDoc) && t.task_type === 1;
        });

        if (watchTasks.length === 0) {
            showToast('未发现可优化的视频/文档任务', 'warning');
            return;
        }

        const optimized = optimizeScheduleOrder(watchTasks);
        xyScheduleState.queue = [];
        for (const task of optimized) {
            const resId = await getTaskResourceId(task);
            xyScheduleState.queue.push({
                uuid: generateUUID(),
                taskId: task.task_id || task.id,
                nodeId: task.node_id,
                groupId: task.group_id,
                resourceId: resId,
                name: task.name,
                type: 1,
                strategy: task.finish === 2 ? STRATEGY.FIXED_DURATION : STRATEGY.UNTIL_DONE,
                duration: 30,
                elapsedSec: 0,
                actionDone: false,
                status: 'pending'
            });
        }
        saveScheduleState();
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        logMsg(`🧠 智能排课完成：${xyScheduleState.queue.length} 个任务已按 DDL紧迫度×类型交错 优化排序`, 'success', false);
        showToast(`已优化导入 ${xyScheduleState.queue.length} 个任务`, 'success');
    }
    /**
     * 一键雷达连播：全网扫描 → 过滤未完成且已开始的视频/文档 → DDL 升序排序
     * （同 DDL 先看完成态再比课程号节点号）→ 整体入队 until_done 策略 →
     * currentIdx 归零立即开跑。运行中禁止重复触发（先停调度）。
     * [DEEP-DOC]
     */
    async function oneClickRadarPlay() {
        if (xyScheduleState.isRunning) {
            showToast('计划调度正在运行中，请先停止后再一键连播', 'warning');
            return;
        }

        logMsg('🔊 一键雷达连播：正在扫描全网未完成任务...', 'info', false);
        showToast('正在扫描全网任务...', 'info');

        const allTasks = await fetchGlobalTasks();
        const now = new Date();

        
        const pendingTasks = allTasks.filter(t => {
            const name = (t.name || '').toLowerCase();
            const isVideo = SHARED_PATTERNS.MEDIA.test(name);
            const isDoc = SHARED_PATTERNS.DOC.test(name);
            if (!(isVideo || isDoc)) return false;
            if (t.finish === 2) return false; 
            if (t.start_time && new Date(t.start_time) > now) return false; 
            return true;
        });

        if (pendingTasks.length === 0) {
            logMsg('🔊 一键连播：全网未发现可挂机的待完成任务', 'warning', false);
            showToast('未发现待完成的视频/文档任务', 'warning');
            return;
        }

        
        pendingTasks.sort((a, b) => {
            const aEnd = new Date(a.end_time || '2099-12-31').getTime();
            const bEnd = new Date(b.end_time || '2099-12-31').getTime();
            if (aEnd !== bEnd) return aEnd - bEnd;
            
            if (a.finish !== b.finish) return (a.finish || 0) - (b.finish || 0);
            
            if (a.group_id !== b.group_id) return (parseInt(a.group_id) || 0) - (parseInt(b.group_id) || 0);
            return (parseInt(a.node_id) || 0) - (parseInt(b.node_id) || 0);
        });

        
        xyScheduleState.queue = [];
        xyScheduleState.currentIdx = 0;

        
        for (const task of pendingTasks) {
            const resId = await getTaskResourceId(task);
            xyScheduleState.queue.push({
                uuid: generateUUID(),
                taskId: task.task_id || task.id,
                nodeId: task.node_id,
                groupId: task.group_id,
                resourceId: resId,
                name: task.name,
                type: 1,
                strategy: STRATEGY.UNTIL_DONE, 
                duration: 30,
                elapsedSec: 0,
                actionDone: false,
                status: 'pending'
            });
        }

        saveScheduleState();
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();

        logMsg(`🔊 一键连播：已导入 ${xyScheduleState.queue.length} 个待完成任务，按DDL紧迫度排序`, 'success', false);
        showToast(`已导入 ${xyScheduleState.queue.length} 个任务，启动连播`, 'success');

        
        xyScheduleState.lastMode = playState.mode;
        playState.mode = PLAY_MODE.MANUAL;
        GM_setValue('xy_play_mode', PLAY_MODE.MANUAL);

        xyScheduleState.isRunning = true;
        xyScheduleState.isPaused = false;
        saveScheduleState();

        updateCourseUI();
        updateSchCard();
        try { unsafeWindow._xyAntiThrottleStart?.(); } catch(e) {}

        
        const firstTask = xyScheduleState.queue[0];
        if (firstTask) {
            const pathPrefix = window.location.href.includes('/course/') ? 'course' : 'mycourse';
            logMsg(`🔊 一键连播：正在跳转至首个任务「${(firstTask.name||'未知').substring(0,12)}」...`, 'success', false);
            setTimeout(() => {
                window.location.href = `/app/jx-web/${pathPrefix}/${firstTask.groupId}/${firstTask.resourceId}/${firstTask.nodeId}`;
            }, 800);
        }
    }

    
    
    
    
    let quickKillRunning = false;
    /** 快速击破当前任务：跳过自然挂机等待，直接对当前 node 发起一次完成验证并
     * 根据结果反馈日志。适用于「就差这一个」的场景。
     * [DEEP-DOC]
     */
    async function quickKillCurrentTask() {
        if (quickKillRunning) { showToast('极速秒交正在执行中', 'warning'); return; }
        const groupId = getCourseGroupId();
        const nodeId = getNodeId();
        if (!groupId || !nodeId) { showToast('当前页面无任务可提交', 'warning'); return; }

        quickKillRunning = true;
        const btn = document.getElementById('xy-btn-quick-kill');
        const origText = btn ? btn.innerText : '';

        try {
            if (btn) { btn.innerText = '⚡ 秒交中...'; btn.disabled = true; }
            logMsg('⚡ 极速秒交：正在提交当前页面任务...', 'info', false);

            const success = await autoSubmitCurrentTask();

            if (success) {
                logMsg('✅ 极速秒交成功！当前任务已提交', 'success', false);
                showToast('秒交成功！', 'success');
                playState.isTaskCompleted = true;
                updateCourseUI();
        
            } else {
                logMsg('❌ 秒交失败：可能需要先挂机积累时长', 'warning', false);
                showToast('秒交失败，请先挂机积累时长', 'warning');
            }
        } catch(e) {
            logMsg('❌ 极速秒交异常', 'error', false);
        } finally {
            quickKillRunning = false;
            if (btn) { btn.innerText = origText; btn.disabled = false; }
        }
    }
    /**
     * 计划调度面板打开编排：overlay 显示 → 任务库渲染（fetchGlobalTasks 全集按
     * 课程折叠分组，卡片带添加按钮写 xyGlobalTaskMap）→ 当前队列渲染（策略下拉/
     * 时长输入/删除/上下移控件绑定）→ 自动启停时间输入框回填。
     * [DEEP-DOC]
     */
    async function openScheduleDashboard() {
        let overlay = document.getElementById('xy-schedule-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'xy-schedule-overlay';
            overlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:${T('rgba(15,23,42,0.8)','rgba(0,0,0,0.4)')}; z-index:2147483648; display:flex; justify-content:center; align-items:center; backdrop-filter:${T('blur(15px)','blur(4px)')}; opacity:0; transition:all 0.3s;`;
            document.body.appendChild(overlay);
        }

        const renderQueueList = () => {
            const container = document.getElementById('xy-sch-queue-list');
            if (!container) return;
            
            if (xyScheduleState.queue.length === 0) {
                container.innerHTML = `<div style="text-align:center; color:${T('#94a3b8','#64748b')}; margin-top:80px; font-size:15px; letter-spacing:0.5px;">队列空空如也<br><span style="font-size:12px; opacity:0.8;">请从左侧任务库添加纯净的视频或文档任务</span></div>`;
                return;
            }

            let html = '';
            xyScheduleState.queue.forEach((item, index) => {
                const isActive = (xyScheduleState.isRunning && index === xyScheduleState.currentIdx);
                const isCompleted = item.status === 'completed';
                
                let statusBg = isCompleted ? T('rgba(52,211,153,0.08)','#ecfdf5') : (isActive ? T('rgba(99,102,241,0.08)','#eef2ff') : T('rgba(30,41,59,0.3)','#f8fafc'));
                let statusBorder = isCompleted ? T('rgba(52,211,153,0.2)','#a7f3d0') : (isActive ? T('rgba(129,140,248,0.25)','#c7d2fe') : T('rgba(71,85,105,0.15)','#e2e8f0'));

                let indicator = isCompleted ? '✅ 已完成' : (isActive ? '▶️ 执行中' : '⏳ 等待中');
                let indicatorColor = isCompleted ? T('#34d399','#065f46') : (isActive ? T('#a5b4fc','#3730a3') : T('#94a3b8','#64748b'));

                let minStr = item.strategy === STRATEGY.INFINITE ? '∞' : (item.strategy === STRATEGY.UNTIL_DONE ? '达标' : item.duration);
                let unit = (item.strategy === STRATEGY.UNTIL_DONE || item.strategy === STRATEGY.INFINITE) ? '' : '分';
                let elapMin = Math.floor((item.elapsedSec || 0) / 60);
                
                let contentHtml = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <select class="xy-sch-strategy" data-uuid="${item.uuid}" style="padding:4px 8px; border-radius:6px; border:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; font-size:13px; outline:none; background:${T('rgba(15,23,42,0.5)','#ffffff')}; color:${T('#e2e8f0','#0f172a')};" ${isActive||isCompleted ? 'disabled' : ''}>
                            <option value="until_done" ${item.strategy===STRATEGY.UNTIL_DONE?'selected':''}>🎯 达标即跳(连播)</option>
                            <option value="duration" ${item.strategy===STRATEGY.FIXED_DURATION?'selected':''}>🕒 刷固定时长</option>
                            <option value="infinite" ${item.strategy===STRATEGY.INFINITE?'selected':''}>♾️ 无限挂机</option>
                        </select>
                        <input type="number" class="xy-sch-min-input" data-uuid="${item.uuid}" value="${item.duration || 30}" style="width:50px; padding:4px; text-align:center; border:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; border-radius:6px; font-size:13px; background:${T('rgba(15,23,42,0.5)','#ffffff')}; color:${T('#e2e8f0','#0f172a')}; display:${item.strategy===STRATEGY.FIXED_DURATION?'block':'none'};" ${isActive||isCompleted ? 'disabled' : ''}>
                        <span class="xy-sch-min-unit" data-uuid="${item.uuid}" style="font-size:13px; color:${T('#94a3b8','#64748b')}; display:${item.strategy===STRATEGY.FIXED_DURATION?'block':'none'};">分</span>
                    </div>
                `;
                indicator += ` <span style="font-weight:normal; opacity:0.8;">(驻留: ${elapMin}/${minStr}${unit})</span>`;

                const canDrag = !isActive && !isCompleted && !xyScheduleState.isRunning;
                html += `
                    <div class="xy-sch-item-row" data-uuid="${item.uuid}" draggable="${canDrag}" style="background:${statusBg}; border:1px solid ${statusBorder}; border-radius:12px; padding:16px; margin-bottom:12px; position:relative; transition:0.2s; box-shadow:${T('0 2px 8px rgba(0,0,0,0.02)','0 1px 2px rgba(0,0,0,0.04)')};">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                            ${canDrag ? `<span class="xy-sch-drag-handle" style="cursor:grab; color:${T('#94a3b8','#64748b')}; font-size:18px; user-select:none; line-height:1; letter-spacing:-2px; flex-shrink:0;" title="拖拽排序">⋮⋮</span>` : ''}
                            <div style="font-size:14px; font-weight:bold; color:${T('#e2e8f0','#0f172a')}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${escapeHtml(item.name)}</div>
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            ${contentHtml}
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                                <span class="xy-sch-indicator-text" style="font-size:12px; font-weight:bold; color:${indicatorColor};">${indicator}</span>
                                ${!isActive && !isCompleted ? `<span class="xy-sch-del" data-uuid="${item.uuid}" style="font-size:12px; color:#ef4444; cursor:pointer; text-decoration:underline;">移除</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

            document.querySelectorAll('.xy-sch-del').forEach(el => {
                el.onclick = (e) => {
                    const id = e.target.getAttribute('data-uuid');
                    xyScheduleState.queue = xyScheduleState.queue.filter(q => q.uuid !== id);
                    saveScheduleState();
                    renderQueueList();
                };
            });

            document.querySelectorAll('.xy-sch-strategy').forEach(el => {
                el.onchange = (e) => {
                    const id = e.target.getAttribute('data-uuid');
                    const task = xyScheduleState.queue.find(q => q.uuid === id);
                    if (task) {
                        task.strategy = e.target.value;
                        saveScheduleState();
                        renderQueueList(); 
                    }
                };
            });

            document.querySelectorAll('.xy-sch-min-input').forEach(el => {
                el.onchange = (e) => {
                    const id = e.target.getAttribute('data-uuid');
                    const task = xyScheduleState.queue.find(q => q.uuid === id);
                    if (task) {
                        task.duration = Math.max(1, parseInt(e.target.value) || 30);
                        saveScheduleState();
                    }
                };
            });

            
            let dragSrcUuid = null;
            let insertIndicator = null;

            function removeInsertIndicator() {
                if (insertIndicator) { insertIndicator.remove(); insertIndicator = null; }
            }

            function showInsertIndicator(targetRow, isAbove) {
                removeInsertIndicator();
                insertIndicator = document.createElement('div');
                insertIndicator.className = 'xy-sch-insert-indicator';
                if (isAbove) {
                    targetRow.parentNode.insertBefore(insertIndicator, targetRow);
                } else {
                    targetRow.parentNode.insertBefore(insertIndicator, targetRow.nextSibling);
                }
            }

            document.querySelectorAll('.xy-sch-item-row[draggable="true"]').forEach(row => {
                row.addEventListener('dragstart', (e) => {
                    if (xyScheduleState.isRunning) { e.preventDefault(); return; }
                    dragSrcUuid = row.getAttribute('data-uuid');
                    row.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', dragSrcUuid);
                });

                row.addEventListener('dragend', () => {
                    row.classList.remove('dragging');
                    removeInsertIndicator();
                    dragSrcUuid = null;
                    document.querySelectorAll('.xy-sch-item-row.drag-over').forEach(r => r.classList.remove('drag-over'));
                });

                row.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!dragSrcUuid || dragSrcUuid === row.getAttribute('data-uuid')) return;
                    e.dataTransfer.dropEffect = 'move';
                    row.classList.add('drag-over');

                    const rect = row.getBoundingClientRect();
                    const y = e.clientY;
                    const mid = rect.top + rect.height / 2;
                    showInsertIndicator(row, y < mid);
                });

                row.addEventListener('dragleave', () => {
                    row.classList.remove('drag-over');
                });

                row.addEventListener('drop', (e) => {
                    e.preventDefault();
                    row.classList.remove('drag-over');
                    removeInsertIndicator();
                    if (!dragSrcUuid || dragSrcUuid === row.getAttribute('data-uuid')) return;

                    const srcIdx = xyScheduleState.queue.findIndex(q => q.uuid === dragSrcUuid);
                    let dstIdx = xyScheduleState.queue.findIndex(q => q.uuid === row.getAttribute('data-uuid'));
                    if (srcIdx === -1 || dstIdx === -1) return;

                    
                    const rect = row.getBoundingClientRect();
                    if (e.clientY > rect.top + rect.height / 2) dstIdx++;
                    
                    if (srcIdx < dstIdx) dstIdx--;

                    const [moved] = xyScheduleState.queue.splice(srcIdx, 1);
                    xyScheduleState.queue.splice(dstIdx, 0, moved);

                    
                    if (xyScheduleState.isRunning) {
                        const curUuid = xyScheduleState.queue[xyScheduleState.currentIdx]?.uuid;
                        xyScheduleState.currentIdx = xyScheduleState.queue.findIndex(q => q.uuid === curUuid);
                    }

                    saveScheduleState();
                    renderQueueList();
                    dragSrcUuid = null;
                });
            });
        };

        window.xyRenderScheduleQueue = renderQueueList;
        window.xyUpdateScheduleProgress = (currentTask) => {
            const strategyEl = document.querySelector(`.xy-sch-strategy[data-uuid="${currentTask.uuid}"]`);
            if (strategyEl) {
                const infoSpan = strategyEl.closest('.xy-sch-item-row').querySelector('.xy-sch-indicator-text');
                if (infoSpan) {
                    let minStr = currentTask.strategy === STRATEGY.INFINITE ? '∞' : (currentTask.strategy === STRATEGY.UNTIL_DONE ? '达标' : currentTask.duration);
                    let unit = (currentTask.strategy === STRATEGY.UNTIL_DONE || currentTask.strategy === STRATEGY.INFINITE) ? '' : '分';
                    let elapMin = Math.floor((currentTask.elapsedSec || 0) / 60);
                    infoSpan.innerHTML = `<span style="color:${T('#a5b4fc','#3730a3')};">▶️ 执行中</span> <span style="font-weight:normal; opacity:0.8;">(驻留: ${elapMin}/${minStr}${unit})</span>`;
                }
            }
        };

        const renderLibraryList = async (tasks) => {
            const container = document.getElementById('xy-sch-lib-list');
            if (!container) return;
            if (!tasks || tasks.length === 0) { container.innerHTML = `<div style="text-align:center; padding:40px; color:${T('#94a3b8','#64748b')};">暂无可用任务</div>`; return; }

            if (!window.xyGlobalTaskMap) window.xyGlobalTaskMap = new Map();

            const isValidSchTask = (task) => {
                const name = (task.name || '').toLowerCase();
                return SHARED_PATTERNS.WATCH.test(name);
            };

            const buildSchLibCard = (task) => {
                window.xyGlobalTaskMap.set(task.task_id || task.id, task);
                const isCompleted = task.finish === 2;
                const name = (task.name || '').toLowerCase();
                const isVideo = SHARED_PATTERNS.MEDIA.test(name);
                const typeStr = isVideo ? '📺 视频' : '📄 文档';
                const statusUI = isCompleted
                    ? `<span style="color:${T('#34d399','#065f46')}; font-weight:bold; background:${T('rgba(52,211,153,0.1)','#ecfdf5')}; padding:2px 6px; border-radius:6px;">✅ 已完成(可刷)</span>`
                    : `<span style="color:${T('#fbbf24','#92400e')}; font-weight:bold; background:${T('rgba(251,191,36,0.1)','#fffbeb')}; padding:2px 6px; border-radius:6px;">⏳ 待完成</span>`;
                return `
                    <div style="background:${T('rgba(30,41,59,0.3)','#ffffff')}; border:1px solid ${isCompleted ? T('rgba(52,211,153,0.15)','#a7f3d0') : T('rgba(71,85,105,0.12)','#e2e8f0')}; border-radius:10px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; box-shadow: ${T('0 2px 4px rgba(0,0,0,0.1)','0 1px 2px rgba(0,0,0,0.04)')};">
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-size:14px; font-weight:600; color:${T('#e2e8f0','#0f172a')}; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</div>
                            <div style="display:flex; gap:12px; font-size:12px; align-items:center;">
                                <span style="color:${T('#94a3b8','#64748b')};">${typeStr}</span>
                                ${statusUI}
                            </div>
                        </div>
                        <button class="xy-sch-add-btn" data-tid="${task.task_id || task.id}" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:white; border:none; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:bold; cursor:pointer; transform: translateY(0); transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">+ 添加</button>
                    </div>`;
            };

            const groupedTasks = tasks.reduce((acc, t) => { if(!acc[t.group_name]) acc[t.group_name] = []; acc[t.group_name].push(t); return acc; }, {});

            const courseUnits = {};
            const courseUnitOrder = {};
            for (const [courseName, courseTasks] of Object.entries(groupedTasks)) {
                const gid = courseTasks[0] && courseTasks[0].group_id;
                let unitMap = null;
                const orderedOut = [];
                if (gid) {
                    try {
                        const res = await fetchCourseResourcesForRadar(gid);
                        if (res) unitMap = buildUnitNameMap(buildDirTree(res), '', null, orderedOut);
                    } catch(e) {}
                }
                courseUnits[courseName] = groupTasksByUnit(courseTasks, unitMap);
                const orderIdx = new Map(orderedOut.map((n, i) => [n, i]));
                orderIdx.set('未分组', Number.MAX_SAFE_INTEGER);
                courseUnitOrder[courseName] = orderIdx;
            }

            let html = '';
            let hasAnyValidTask = false;

            Object.entries(groupedTasks).forEach(([courseName, courseTasks], groupIdx) => {
                const validTasks = courseTasks.filter(isValidSchTask);
                if (validTasks.length === 0) return;
                hasAnyValidTask = true;

                html += `
                    <div class="xy-sch-group-header" data-idx="${groupIdx}" style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; padding:12px 16px; background:${T('rgba(30,41,59,0.5)','#f8fafc')}; border-radius:10px; margin: 16px 0 8px 0; font-size:14px; position:sticky; top:0; z-index:2; cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none; border:1px solid ${T('rgba(71,85,105,0.15)','#e2e8f0')}; transition:background 0.2s;">
                        <span>📚 ${courseName || '未知课程'} <span style="font-size:12px; color:${T('#94a3b8','#64748b')}; font-weight:normal; margin-left:6px;">(${validTasks.length}个节点)</span></span>
                        <span class="xy-sch-group-arrow" style="transition: transform 0.2s; font-size:12px; color:${T('#64748b','#94a3b8')};">▼</span>
                    </div>
                    <div class="xy-sch-group-content" id="xy-sch-group-${groupIdx}" style="display:flex; flex-direction:column; gap:8px;">
                `;

                const unitGroups = courseUnits[courseName];
                const flatFallback = unitGroups.size === 1 && unitGroups.has('未分组');
                const unitOrder = courseUnitOrder[courseName] || new Map();
                const unitEntries = Array.from(unitGroups.entries()).sort((a, b) => (unitOrder.get(a[0]) || 0) - (unitOrder.get(b[0]) || 0));
                let ui = 0;
                if (flatFallback) {
                    validTasks.forEach(task => { html += buildSchLibCard(task); });
                } else {
                    unitEntries.forEach(([unitName, unitTasks]) => {
                        const validUnitTasks = unitTasks.filter(isValidSchTask);
                        if (validUnitTasks.length === 0) return;
                        const unitId = 'xy-sch-group-' + groupIdx + '-u' + (ui++);
                        html += `
                            <div>
                                <div class="xy-sch-unit-header" data-target="${unitId}" style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:${T('rgba(30,41,59,0.45)','#f8fafc')}; border-radius:8px; border:1px solid ${T('rgba(71,85,105,0.15)','#e2e8f0')}; cursor:pointer; user-select:none;">
                                    <span style="font-size:13px; font-weight:700; color:${T('#c7d2fe','#4338ca')}; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">📂 ${escapeHtml(unitName)}</span>
                                    <span style="font-size:11px; color:${T('#94a3b8','#64748b')}; white-space:nowrap;">${validUnitTasks.length} 个</span>
                                    <span class="xy-sch-unit-arrow" style="transition:transform 0.2s; color:${T('#64748b','#94a3b8')}; font-size:10px;">▼</span>
                                </div>
                                <div id="${unitId}" class="xy-sch-unit-content" style="display:flex; flex-direction:column; gap:8px; padding:8px 0 2px 12px;">
                        `;
                        validUnitTasks.forEach(task => { html += buildSchLibCard(task); });
                        html += `</div></div>`;
                    });
                }

                html += `</div>`;
            });

            if (!hasAnyValidTask) {
                html = `<div style="text-align:center; padding:40px; color:${T('#94a3b8','#64748b')};">当前全网未发现可挂机的视频或文档任务</div>`;
            }

            container.innerHTML = html;

            document.querySelectorAll('.xy-sch-group-header').forEach(header => {
                header.onclick = () => {
                    const idx = header.getAttribute('data-idx');
                    const content = document.getElementById(`xy-sch-group-${idx}`);
                    const arrow = header.querySelector('.xy-sch-group-arrow');
                    if (content.style.display === 'none') {
                        content.style.display = 'flex';
                        arrow.style.transform = 'rotate(0deg)';
                        header.style.background = T('rgba(30,41,59,0.5)','#f8fafc');
                    } else {
                        content.style.display = 'none';
                        arrow.style.transform = 'rotate(-90deg)';
                        header.style.background = T('rgba(30,41,59,0.2)','#f1f5f9');
                    }
                };
            });

            document.querySelectorAll('.xy-sch-unit-header').forEach(header => {
                header.onclick = () => {
                    const targetId = header.getAttribute('data-target');
                    const content = document.getElementById(targetId);
                    const arrow = header.querySelector('.xy-sch-unit-arrow');
                    if (!content) return;
                    if (content.style.display === 'none') {
                        content.style.display = 'flex';
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    } else {
                        content.style.display = 'none';
                        if (arrow) arrow.style.transform = 'rotate(-90deg)';
                    }
                };
            });

            document.querySelectorAll('.xy-sch-add-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const tid = e.target.getAttribute('data-tid');
                    const task = window.xyGlobalTaskMap.get(tid);
                    if (task) {
                        const originalText = e.target.innerText;
                        e.target.innerText = '提取中...';
                        e.target.disabled = true;

                        const resId = await getTaskResourceId(task);

                        xyScheduleState.queue.push({
                            uuid: generateUUID(),
                            taskId: tid,
                            nodeId: task.node_id,
                            groupId: task.group_id,
                            resourceId: resId,
                            name: task.name,
                            type: 1,
                            strategy: task.finish === 2 ? STRATEGY.FIXED_DURATION : STRATEGY.UNTIL_DONE,
                            duration: 30,
                            elapsedSec: 0,
                            actionDone: false,
                            status: 'pending'
                        });
                        saveScheduleState();
                        renderQueueList();

                        e.target.innerText = originalText;
                        e.target.disabled = false;
                        showToast(`已添加：${task.name.substring(0,8)}...`, 'success');
                    }
                };
            });
        };

        overlay.innerHTML = `
            <style>
                .xy-sch-item-row.drag-over { border-color: #818cf8 !important; box-shadow: 0 0 0 2px rgba(129,140,248,0.3), 0 4px 12px rgba(129,140,248,0.15) !important; }
                .xy-sch-item-row.dragging { opacity: 0.4; transform: scale(0.97); }
                .xy-sch-drag-handle { transition: color 0.2s; }
                .xy-sch-drag-handle:hover { color: #818cf8 !important; }
                .xy-sch-item-row[draggable="true"] { cursor: default; }
                .xy-sch-insert-indicator { height: 3px; background: linear-gradient(90deg, #818cf8, #6366f1); border-radius: 2px; margin: 0 0 12px 0; box-shadow: 0 0 8px rgba(129,140,248,0.4); transition: all 0.15s; }
            </style>
            <div style="background:${T('linear-gradient(180deg, #1e293b 0%, #0f172a 100%)','#ffffff')}; width:90%; max-width:1100px; height:85vh; border-radius:24px; box-shadow:${T('0 40px 80px rgba(0,0,0,0.5)','0 20px 50px rgba(0,0,0,0.1)')}; display:flex; flex-direction:column; overflow:hidden; transform:scale(0.95); transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border:1px solid ${T('rgba(71,85,105,0.3)','#e2e8f0')};">
                <div style="padding:24px 32px; background:${T('linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))','#fffbeb')}; border-bottom:1px solid ${T('rgba(245,158,11,0.2)','#fde68a')}; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <div style="font-size:22px; font-weight:bold; color:${T('#e2e8f0','#0f172a')}; display:flex; align-items:center; gap:12px; letter-spacing:0.5px;">📅 超级计划调度中心 <span style="font-size:12px; background:${T('rgba(245,158,11,0.15)','#ffedd5')}; padding:4px 10px; border-radius:12px; border:1px solid ${T('rgba(245,158,11,0.2)','#fde68a')}; color:${T('#fcd34d','#92400e')};">自定义挂机时长 • 无限循环刷总时</span></div>
                    <button id="xy-close-schedule" style="background:none; border:none; font-size:26px; color:${T('#94a3b8','#64748b')}; cursor:pointer; padding:0; transition:0.2s;" onmouseover="this.style.color='${T('#e2e8f0','#0f172a')}'; this.style.transform='rotate(90deg)';" onmouseout="this.style.color='${T('#94a3b8','#64748b')}'; this.style.transform='none';">✖</button>
                </div>

                <div style="flex:1; display:flex; overflow:hidden; background:transparent;">
                    <!-- 左侧任务库 -->
                    <div style="width:50%; border-right:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; display:flex; flex-direction:column;">
                        <div style="padding:16px 24px; background:${T('rgba(15,23,42,0.5)','#f8fafc')}; border-bottom:1px solid ${T('rgba(71,85,105,0.15)','#e2e8f0')}; display:flex; flex-direction:column; gap:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; font-size:16px;">📚 全网任务提取池</span>
                                <span style="font-size:12px; font-weight:normal; color:${T('#34d399','#065f46')}; background:${T('rgba(52,211,153,0.1)','#ecfdf5')}; padding:2px 6px; border-radius:6px; border:1px solid ${T('rgba(52,211,153,0.15)','#a7f3d0')};">点击课程标题可折叠面板</span>
                            </div>
                            <div style="font-size:12px; font-weight:normal; color:${T('#fcd34d','#92400e')}; background:${T('rgba(251,191,36,0.06)','#fffbeb')}; padding:8px 12px; border-radius:6px; border:1px solid ${T('rgba(251,191,36,0.12)','#fde68a')};">
                                💡 提醒：如果没有获取到已刷到的课程，就点击那个课进去，之后会在课菜单里可以看到。
                            </div>
                        </div>
                        <div id="xy-sch-lib-list" style="flex:1; overflow-y:auto; padding:16px 24px;">
                            <div style="text-align:center; padding:60px; color:${T('#94a3b8','#64748b')}; font-size:16px;"><span style="display:inline-block; animation:pulse 1.5s infinite;">📡 正在深度扫描全局雷达与所有课程记录...</span></div>
                        </div>
                    </div>

                    <!-- 右侧执行队列 -->
                    <div style="width:50%; display:flex; flex-direction:column; background:${T('rgba(15,23,42,0.3)','#f8fafc')};">
                        <div style="padding:16px 24px; background:${T('rgba(15,23,42,0.5)','#f8fafc')}; border-bottom:1px solid ${T('rgba(71,85,105,0.15)','#e2e8f0')}; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; font-size:16px;">⏱️ 待执行队列</span>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span id="xy-sch-optimize-btn" style="font-size:13px; color:${T('#a78bfa','#7c3aed')}; cursor:pointer; font-weight:bold; background:${T('rgba(167,139,250,0.1)','#f5f3ff')}; padding:4px 10px; border-radius:6px; border:1px solid ${T('rgba(167,139,250,0.2)','#c7d2fe')}; transition:0.2s;" title="按DDL紧迫度+类型交错智能排序">🧠 智能优化</span>
                                <span id="xy-sch-clear-btn" style="font-size:13px; color:#f87171; cursor:pointer; font-weight:bold;">🗑️ 清空队列</span>
                            </div>
                        </div>
                        <div id="xy-sch-queue-list" style="flex:1; overflow-y:auto; padding:16px 24px;"></div>

                        <!-- 定时开关 -->
                        <div style="padding:14px 24px; background:${T('linear-gradient(145deg, rgba(139,92,246,0.06), rgba(124,58,237,0.04))','#f5f3ff')}; border-top:1px solid ${T('rgba(139,92,246,0.12)','#e0e7ff')}; display:flex; align-items:center; gap:12px;">
                            <span style="font-size:13px; font-weight:700; color:${T('#a78bfa','#6d28d9')}; white-space:nowrap;">⏰ 定时</span>
                            <span style="font-size:12px; color:${T('#a78bfa','#6d28d9')};">启动</span>
                            <input type="time" id="xy-sch-auto-start" value="${xyScheduleState.autoStart}" style="padding:6px 10px; border:1px solid ${T('rgba(167,139,250,0.2)','#c7d2fe')}; border-radius:8px; font-size:13px; outline:none; background:${T('rgba(15,23,42,0.5)','#ffffff')}; color:${T('#e2e8f0','#0f172a')}; width:110px;" title="到达此时间自动启动计划调度">
                            <span style="font-size:12px; color:${T('#a78bfa','#6d28d9')};">停止</span>
                            <input type="time" id="xy-sch-auto-stop" value="${xyScheduleState.autoStop}" style="padding:6px 10px; border:1px solid ${T('rgba(167,139,250,0.2)','#c7d2fe')}; border-radius:8px; font-size:13px; outline:none; background:${T('rgba(15,23,42,0.5)','#ffffff')}; color:${T('#e2e8f0','#0f172a')}; width:110px;" title="到达此时间自动停止并刷新页面">
                            <span style="font-size:11px; color:${T('#7c3aed','#6d28d9')}; flex:1; text-align:right; opacity:0.7;">留空 = 关闭</span>
                        </div>
                        <!-- 控制台 -->
                        <div style="padding:20px 24px; background:${T('rgba(15,23,42,0.6)','#f8fafc')}; border-top:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; display:flex; gap:12px; box-shadow: ${T('0 -4px 20px rgba(0,0,0,0.15)','none')};">
                            <button id="xy-sch-start-btn" style="flex:2; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; padding:14px; border-radius:14px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 6px 16px rgba(16,185,129,0.3); transition:0.2s;" ${xyScheduleState.isRunning ? 'disabled' : ''}>${xyScheduleState.isRunning ? '⏳ 调度引擎运行中...' : '🚀 启动计划调度'}</button>
                            <button id="xy-sch-pause-btn" style="flex:1; background:linear-gradient(135deg, #f59e0b, #d97706); color:white; border:none; padding:14px; border-radius:14px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 6px 16px rgba(245,158,11,0.3); transition:0.2s; display:${xyScheduleState.isRunning ? 'block' : 'none'};" ${xyScheduleState.isPaused ? '' : ''}>${xyScheduleState.isPaused ? '▶ 继续调度' : '⏸ 暂停调度'}</button>
                            <button id="xy-sch-stop-btn" style="flex:1; background:linear-gradient(135deg, #ef4444, #dc2626); color:white; border:none; padding:14px; border-radius:14px; font-size:15px; font-weight:bold; cursor:pointer; box-shadow:0 6px 16px rgba(239,68,68,0.3); transition:0.2s;" ${!xyScheduleState.isRunning ? 'disabled' : ''}>🛑 强停</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        requestAnimationFrame(() => { overlay.style.opacity = '1'; overlay.firstElementChild.style.transform = 'scale(1)'; });
        
        document.getElementById('xy-close-schedule').onclick = () => { 
            overlay.style.opacity = '0'; 
            overlay.firstElementChild.style.transform = 'scale(0.95)'; 
            setTimeout(() => overlay.remove(), 400); 
        };

        const tasks = await fetchGlobalTasks();
        renderLibraryList(tasks);
        renderQueueList();

        document.getElementById('xy-sch-optimize-btn').onclick = async () => {
            if (xyScheduleState.isRunning) { showToast('请先停止调度再优化', 'warning'); return; }
            const btn = document.getElementById('xy-sch-optimize-btn');
            const origText = btn.innerText;
            btn.innerText = '🧠 分析中...';
            btn.style.pointerEvents = 'none';
            await smartOptimizeAndImport();
            btn.innerText = origText;
            btn.style.pointerEvents = 'auto';
        };
        document.getElementById('xy-sch-clear-btn').onclick = () => {
            if(xyScheduleState.isRunning) { showToast('请先停止调度再清空队列', 'warning'); return; }
            xyScheduleState.queue = [];
            xyScheduleState.currentIdx = 0;
            saveScheduleState();
            renderQueueList();
            showToast('队列已清空', 'success');
        };

        const startBtn = document.getElementById('xy-sch-start-btn');
        const pauseBtn = document.getElementById('xy-sch-pause-btn');
        const stopBtn = document.getElementById('xy-sch-stop-btn');

        function updateSchButtons() {
            const running = xyScheduleState.isRunning;
            const paused = xyScheduleState.isPaused;
            startBtn.disabled = running;
            startBtn.innerText = running ? '⏳ 调度引擎运行中...' : '🚀 启动计划调度';
            pauseBtn.style.display = running ? 'block' : 'none';
            pauseBtn.innerText = paused ? '▶ 继续调度' : '⏸ 暂停调度';
            stopBtn.disabled = !running;
        }

        startBtn.onclick = () => {
            if (xyScheduleState.queue.length === 0) { showToast('队列为空，请先添加任务', 'warning'); return; }

            const allDone = xyScheduleState.queue.every(q => q.status === 'completed');
            if (allDone) {
                xyScheduleState.queue.forEach(q => { q.status = 'pending'; q.elapsedSec = 0; q.actionDone = false; });
                xyScheduleState.currentIdx = 0;
            }

            xyScheduleState.lastMode = playState.mode;
            playState.mode = PLAY_MODE.MANUAL;
            GM_setValue('xy_play_mode', PLAY_MODE.MANUAL);

            xyScheduleState.isRunning = true;
            xyScheduleState.isPaused = false;
            saveScheduleState();

            updateCourseUI();
            updateSchButtons();
            updateSchCard();
            try { unsafeWindow._xyAntiThrottleStart?.(); } catch(e) {}
            renderQueueList();
            logMsg('📅 计划调度中心已接管引擎最高权限，准备跳跃！', 'success');
        };

        pauseBtn.onclick = () => {
            xyScheduleState.isPaused = !xyScheduleState.isPaused;
            GM_setValue('xy_schedule_paused', xyScheduleState.isPaused);
            saveScheduleState();
            updateSchButtons();
            updateSchCard();
            updateCourseUI();
            logMsg(xyScheduleState.isPaused ? '⏸ 计划调度已暂停，任务进度已保存' : '▶ 计划调度已继续执行', 'success');
        };

        stopBtn.onclick = () => {
            xyScheduleState.isRunning = false;
            xyScheduleState.isPaused = false;
            try { unsafeWindow._xyAntiThrottleStop?.(); } catch(e) {}

            playState.mode = xyScheduleState.lastMode || PLAY_MODE.SEQUENCE;
            GM_setValue('xy_play_mode', playState.mode);
            updateCourseUI();

            GM_setValue('xy_schedule_paused', false);
            saveScheduleState();

            updateSchButtons();
            updateSchCard();
            renderQueueList();
            logMsg('🛑 计划调度已强停，控制权已交还原生主引擎！', 'warning');
        };

        const autoStartInput = document.getElementById('xy-sch-auto-start');
        const autoStopInput = document.getElementById('xy-sch-auto-stop');
        if (autoStartInput) autoStartInput.onchange = () => {
            xyScheduleState.autoStart = autoStartInput.value;
            GM_setValue('xy_schedule_auto_start', xyScheduleState.autoStart);
            showToast(autoStartInput.value ? `定时启动已设为 ${autoStartInput.value}` : '定时启动已关闭', 'success');
        };
        if (autoStopInput) autoStopInput.onchange = () => {
            xyScheduleState.autoStop = autoStopInput.value;
            GM_setValue('xy_schedule_auto_stop', xyScheduleState.autoStop);
            showToast(autoStopInput.value ? `定时停止已设为 ${autoStopInput.value}` : '定时停止已关闭', 'success');
        };
    }
    /**
     * 调度卡片控件事件绑定：策略 select onchange 更新 strategy + 持久化 + 重渲；
     * 时长 input 校验数值范围后写 duration；删除/上移/下移按 uuid 定位队列元素
     * 操作后 saveScheduleState 保持一致。
     * [DEEP-DOC]
     */
    function _bindSchCardButtons(card) {
        if (!card) return;
        const btns = card.querySelectorAll('button');
        btns.forEach(btn => {
            const action = btn.getAttribute('data-action');
            if (!action) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (action === 'pause') { if (typeof xySchPause === 'function') xySchPause(); }
                else if (action === 'stop') { if (typeof xySchStop === 'function') xySchStop(); }
                else if (action === 'skip') { if (typeof xySchSkip === 'function') xySchSkip(); }
                else if (action === 'restart') { if (typeof xySchRestart === 'function') xySchRestart(); }
            });
        });
    }
    /** 单卡片运行态刷新：驻留时长计时显示（elapsedSec/duration 或 ∞）、状态徽标
     * （执行中/等待/已完成）、暂停态视觉。由调度 tick 高频调用需保持轻量。
     * [DEEP-DOC]
     */
    function updateSchCard() {
        const card = document.getElementById('xy-sch-card');
        if (!card) return;

        if (!xyScheduleState.isRunning) { card.style.display = 'none'; return; }
        card.style.display = 'block';
        card.style.color = T('#e2e8f0','#0f172a'); 

        const task = xyScheduleState.queue[xyScheduleState.currentIdx];
        const total = xyScheduleState.queue.length;
        let html = '';

        
        if (!task) {
            card.style.borderLeftColor = T('#34d399','#059669');
            card.style.background = T('rgba(52,211,153,0.06)','#ecfdf5');
            html = `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;"><b style="color:${T('#34d399','#059669')};">✅ 全部完成 · ${total}/${total} 项已达标</b><button data-action="restart" style="background:${T('rgba(52,211,153,0.15)','#d1fae5')};color:${T('#34d399','#065f46')};border:1px solid ${T('rgba(52,211,153,0.3)','#a7f3d0')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">🔄 重新开始</button></div>`;
        }
        
        else if (playState.isJumping) {
            card.style.borderLeftColor = T('#f59e0b','#d97706');
            card.style.background = T('rgba(251,191,36,0.06)','#fffbeb');
            html = `<b style="color:${T('#fcd34d','#b45309')};">🚀 正在跳转至「${escapeHtml((task.name||'未知').substring(0,14))}」...</b>`;
        }
        else {
            const idx = xyScheduleState.currentIdx + 1;
            const name = escapeHtml((task.name || '未知').substring(0, 16));
            const elapsed = task.elapsedSec || 0;
            const elapStr = elapsed >= 3600 ? `${Math.floor(elapsed/3600)}h${Math.floor((elapsed%3600)/60)}m` : `${Math.floor(elapsed/60)}m${elapsed%60}s`;
            const durStr = task.strategy === STRATEGY.INFINITE ? '∞' : task.strategy === STRATEGY.UNTIL_DONE ? '达标连播' : `刷${task.duration||30}min`;
            const paused = xyScheduleState.isPaused;

            if (paused) {
                card.style.borderLeftColor = T('#f59e0b','#d97706');
                card.style.background = T('rgba(251,191,36,0.06)','#fffbeb');
                html = `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px;"><b style="color:${T('#fbbf24','#d97706')};">⏸ 已暂停 · 第 ${idx}/${total} 项 · ${name}</b><span style="color:${T('#94a3b8','#64748b')};font-size:12px;">已刷 ${elapStr} / ${durStr}</span></div><div style="display:flex;gap:6px;"><button data-action="pause" style="background:${T('rgba(52,211,153,0.15)','#d1fae5')};color:${T('#34d399','#065f46')};border:1px solid ${T('rgba(52,211,153,0.3)','#a7f3d0')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">▶ 继续</button><button data-action="skip" style="background:${T('rgba(99,102,241,0.1)','#eef2ff')};color:${T('#a5b4fc','#4338ca')};border:1px solid ${T('rgba(99,102,241,0.2)','#c7d2fe')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">⏭ 跳过</button><button data-action="stop" style="background:${T('rgba(239,68,68,0.1)','#fef2f2')};color:${T('#f87171','#dc2626')};border:1px solid ${T('rgba(239,68,68,0.2)','#fecaca')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">🛑 停止</button></div>`;
            } else {
                card.style.borderLeftColor = T('#818cf8','#6366f1');
                card.style.background = T('rgba(99,102,241,0.06)','#eef2ff');
                html = `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px;"><b>📅 第 ${idx}/${total} 项 · ${name} · ${durStr}</b><b style="color:${T('#34d399','#059669')};font-family:monospace;">⏱ ${elapStr}</b></div><div style="display:flex;gap:6px;"><button data-action="pause" style="background:${T('rgba(251,191,36,0.12)','#fffbeb')};color:${T('#fcd34d','#92400e')};border:1px solid ${T('rgba(251,191,36,0.25)','#fde68a')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">⏸ 暂停</button><button data-action="skip" style="background:${T('rgba(99,102,241,0.1)','#eef2ff')};color:${T('#a5b4fc','#4338ca')};border:1px solid ${T('rgba(99,102,241,0.2)','#c7d2fe')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">⏭ 跳过</button><button data-action="stop" style="background:${T('rgba(239,68,68,0.1)','#fef2f2')};color:${T('#f87171','#dc2626')};border:1px solid ${T('rgba(239,68,68,0.2)','#fecaca')};padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">🛑 停止</button></div>`;
            }
        }

        card.innerHTML = html;
        _bindSchCardButtons(card);
    }

    
    window.xySchStart = () => {
        if (xyScheduleState.queue.length === 0) { logMsg('队列为空，无法启动调度', 'warning'); return; }
        if (xyScheduleState.isRunning) return;
        const allDone = xyScheduleState.queue.every(q => q.status === 'completed');
        if (allDone) {
            xyScheduleState.queue.forEach(q => { q.status = 'pending'; q.elapsedSec = 0; q.actionDone = false; });
            xyScheduleState.currentIdx = 0;
        }
        xyScheduleState.lastMode = playState.mode;
        playState.mode = PLAY_MODE.MANUAL;
        GM_setValue('xy_play_mode', PLAY_MODE.MANUAL);
        xyScheduleState.isRunning = true;
        xyScheduleState.isPaused = false;
        saveScheduleState();
        updateCourseUI();
        updateSchCard();
        try { unsafeWindow._xyAntiThrottleStart?.(); } catch(e) {}
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        logMsg('📅 计划调度已启动', 'success');
    };

    window.xySchPause = () => {
        if (!xyScheduleState.isRunning) return;
        xyScheduleState.isPaused = !xyScheduleState.isPaused;
        GM_setValue('xy_schedule_paused', xyScheduleState.isPaused);
        saveScheduleState();
        updateCourseUI();
        updateSchCard();
        const pb = document.getElementById('xy-sch-pause-btn');
        if (pb) pb.innerText = xyScheduleState.isPaused ? '▶ 继续调度' : '⏸ 暂停调度';
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        logMsg(xyScheduleState.isPaused ? '⏸ 计划调度已暂停' : '▶ 计划调度已继续', 'success');
    };

    window.xySchStop = () => {
        if (!xyScheduleState.isRunning) return;
        xyScheduleState.isRunning = false;
        xyScheduleState.isPaused = false;
        try { unsafeWindow._xyAntiThrottleStop?.(); } catch(e) {}
        playState.mode = xyScheduleState.lastMode || PLAY_MODE.SEQUENCE;
        GM_setValue('xy_play_mode', playState.mode);
        GM_setValue('xy_schedule_paused', false);
        saveScheduleState();
        updateCourseUI();
        updateSchCard();
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        logMsg('🛑 计划调度已强停', 'warning');
    };

    window.xySchSkip = () => {
        if (!xyScheduleState.isRunning) return;
        const t = xyScheduleState.queue[xyScheduleState.currentIdx];
        if (t) { t.status = 'completed'; t.elapsedSec = t.elapsedSec || 0; }
        xyScheduleState.currentIdx++;
        playState.isJumping = false;
        saveScheduleState();
        updateCourseUI();
        updateSchCard();
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        logMsg('⏭ 已跳过当前任务', 'info');
    };

    window.xySchRestart = () => {
        if (xyScheduleState.queue.length === 0) { logMsg('队列为空', 'warning'); return; }
        xyScheduleState.queue.forEach(q => { q.status = 'pending'; q.elapsedSec = 0; q.actionDone = false; });
        xyScheduleState.currentIdx = 0;
        xyScheduleState.isRunning = true;
        xyScheduleState.isPaused = false;
        xyScheduleState.lastMode = playState.mode;
        playState.mode = PLAY_MODE.MANUAL;
        GM_setValue('xy_play_mode', PLAY_MODE.MANUAL);
        saveScheduleState();
        updateCourseUI();
        updateSchCard();
        try { unsafeWindow._xyAntiThrottleStart?.(); } catch(e) {}
        if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        logMsg('📅 计划调度已重新启动', 'success');
    };

    
    
    
    
    createPersistentInterval(async () => {
        if (!xyScheduleState.isRunning || xyScheduleState.isPaused || xyScheduleState.queue.length === 0) return;

        const currentTask = xyScheduleState.queue[xyScheduleState.currentIdx];
        
        if (!currentTask) {
            logMsg('✅ 所有计划调度任务已圆满完成！已自动切换为手动休眠。', 'success', false);

            xyScheduleState.isRunning = false;
            try { unsafeWindow._xyAntiThrottleStop?.(); } catch(e) {}

            
            playState.mode = PLAY_MODE.MANUAL; 
            GM_setValue('xy_play_mode', PLAY_MODE.MANUAL);
            updateCourseUI();
            
            saveScheduleState();

            const startBtn = document.getElementById('xy-sch-start-btn');
            if(startBtn) { startBtn.disabled = false; startBtn.innerText = '🚀 重新启动计划'; }
            const pauseBtn = document.getElementById('xy-sch-pause-btn');
            if(pauseBtn) pauseBtn.style.display = 'none';
            const stopBtn = document.getElementById('xy-sch-stop-btn');
            if(stopBtn) { stopBtn.disabled = true; }

            updateSchCard();

            if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
            return;
        }

        if (currentTask.status === 'completed') {
            xyScheduleState.currentIdx++;
            saveScheduleState();
            if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
            return;
        }

        const currentGroupId = getCourseGroupId();
        const currentNodeId = getNodeId();
        const pathPrefix = window.location.href.includes('/course/') ? 'course' : 'mycourse';

        
        if (currentGroupId != currentTask.groupId || currentNodeId != currentTask.nodeId) {
            if (!playState.isJumping) {
                playState.isJumping = true;
                currentTask.status = 'running';
                saveScheduleState();
                
                logMsg(`🚀 计划调度：跨空间跳跃前往【${(currentTask.name||'未知').substring(0,10)}】...`, 'info', false);
                
                setTimeout(() => {
                    sessionStorage.setItem('xy_sch_jumping', '1'); 
                    window.location.href = `/app/jx-web/${pathPrefix}/${currentTask.groupId}/resource/${currentTask.resourceId}/${currentTask.nodeId}`;
                }, 1500);
            }
            return;
        }

        
        
        
        const desiredMode = currentTask.strategy === STRATEGY.UNTIL_DONE ? PLAY_MODE.SEQUENCE : PLAY_MODE.LOOP;
        if (playState.mode !== desiredMode) {
            playState.mode = desiredMode;
            GM_setValue('xy_play_mode', desiredMode);
            updateCourseUI();
        }
        
        currentTask.elapsedSec = (currentTask.elapsedSec || 0) + 1;
        
        
        watchdogLastActiveTime = Date.now();

        if (currentTask.elapsedSec % 5 === 0) saveScheduleState(); 

        updateSchCard(); 

        
        if (window.xyUpdateScheduleProgress) window.xyUpdateScheduleProgress(currentTask);

        let isDone = false;
        
        if (currentTask.strategy === STRATEGY.UNTIL_DONE) {
            
            if (playState.isTaskCompleted && currentTask.elapsedSec > 5) {
                isDone = true;
            }
        } else if (currentTask.strategy === STRATEGY.FIXED_DURATION) {
            
            if (currentTask.elapsedSec >= currentTask.duration * 60) {
                isDone = true;
            }
        }
        

        if (isDone) {
            logMsg(`✅ 计划调度：任务【${(currentTask.name||'未知').substring(0,8)}...】已达标！即将进行下一项。`, 'success', false);
            currentTask.status = 'completed';
            saveScheduleState();
            if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        }

    }, 1000, 300); 
    /** 开机动画收尾：进度条拉满 → 加 xy-out 类播放退场动画 → 520ms 后移除 DOM。
     * dismissed 标志防重复触发（定时器与手动调用竞态）。
     * [DEEP-DOC]
     */
    function dismissSplash() {
        try { if (window._xySplashDismiss) window._xySplashDismiss(); } catch(e) {}
    }
    /** 作业模块独立 HTML 转义副本：与全局 escapeHtml 同实现。历史隔离产物，保留以避免大规模改名风险。
     * [DEEP-DOC]
     */
    function hwEscapeHTML(v) { return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    /** docx 文本净化：剥离 C0/C1 控制字符（Word 不接受），保留常规 Unicode 文本。所有 TextRun 输入必经。
     * [DEEP-DOC]
     */
    function hwSafeText(v) { return String(v??'').slice(0,32767); }
    /** 作业域安全转数：Number() 结果有限才返回，否则 null（区别于概览域的 fallback-0 语义——这里 null 参与判空分支）。
     * [DEEP-DOC]
     */
    function hwToNum(v) { const n=Number(v); return Number.isFinite(n)?n:null; }
    /**
     * 疑似 JSON 字符串惰性解析：trim 后非空、非纯数字才尝试 JSON.parse；
     * 解析失败原样返回字符串。平台字段「有时是对象有时是序列化串」的双形态兼容。
     * [DEEP-DOC]
     */
    function hwMaybeParse(v) { if(typeof v!=='string')return v; const t=v.trim(); if(!t||/^\d+$/.test(t))return v; try{return JSON.parse(t)}catch(e){return v}; }
    /** 从 DraftJS 节点提取图片 src：entity data 直接携带或经 key 查 entityMap；兼容 file_access 协议与 data URI 两形态。
     * [DEEP-DOC]
     */
    function hwGetImageSrc(data={}) {
        const type=String(data.type||data.blockType||data.kind||"").toUpperCase();
        return data.src||data.imageUrl||data.image_url||data?.data?.src||data?.data?.imageUrl||data?.data?.image_url||data?.data?.file||data?.data?.url||((type.includes("IMAGE")||type=="IMG")?(data.url||data.href||data.file||data?.data?.url||data?.data?.href||data?.data?.file||""):"");
    }
    /** LaTeX 公式原文提取：经 hwGetEntityByKey 取 MATH 实体的 formula/latex/tex 字段。
     * [DEEP-DOC]
     */
    function hwGetFormula(data={}) { return data.teX||data.tex||data.latex||data.formula||data.value||data.content||data.text||data?.data?.teX||data?.data?.tex||data?.data?.latex||""; }
    /** DraftJS entityMap 键查找：contentState.entityMap[key] 直取，缺失返回 undefined。
     * [DEEP-DOC]
     */
    function hwGetEntityByKey(em,key) {
        if(!em||typeof em!=="object")return null;
        if(Object.prototype.hasOwnProperty.call(em,key))return em[key];
        const sk=String(key);
        if(sk!==String(key)&&Object.prototype.hasOwnProperty.call(em,sk))return em[sk];
        return null;
    }
    /**
     * 题目富文本统一解析器 —— 作业模块的数据入口汇合点。
     *
     * 三形态输入：DraftJS JSON 串（blocks+entityMap）/ 已解析对象 / 纯文本。
     * 输出 { text, images[], segments[] }：text 为拼接纯文本（AI 提示词用）、
     * images 收集全部图片 src（导出 docx 用）、segments 保序混合段
     * （{type:'text'|'image'|'formula', value/src}，docx 还原排版顺序用）。
     * 解析失败降级为单文本段，绝不抛出——题目展示不允许因单个坏题中断。
     * [DEEP-DOC]
     */
    function hwParseRichContent(raw) {
        if(!raw)return{text:"",images:[],segments:[]};
        let obj=null;
        if(typeof raw==="string"){try{obj=JSON.parse(raw)}catch(e){const t=raw.replace(/^"|"$/g,"").trim();return{text:t,images:[],segments:t?[{type:"text",value:t}]:[]}}}
        else if(typeof raw==="object")obj=raw;
        else{const t=String(raw).trim();return{text:t,images:[],segments:t?[{type:"text",value:t}]:[]}}
        if(!obj||!Array.isArray(obj.blocks)){const t=typeof obj==="string"?obj.trim():(typeof raw==="string"?raw.trim():JSON.stringify(raw));return{text:t,images:[],segments:t?[{type:"text",value:t}]:[]}}
        const parts=[],images=[],segs=[],em=obj.entityMap||{};
        const pt=(t)=>{const c=String(t||"").trim();if(c){parts.push(c);segs.push({type:"text",value:c})}};
        const pi=(s)=>{if(!s)return;parts.push("[图片]");images.push({src:s,kind:"image"});segs.push({type:"image",src:s})};
        const pf=(f)=>{const c=String(f||"").trim();if(c){parts.push("[公式: "+c+"]");segs.push({type:"formula",value:c})}};
        const hd=(d)=>{if(!d)return;const t=String(d.type||"").toUpperCase();if(t.includes("IMAGE")||t=="IMG"||d.src||d.imageUrl||d.image_url||d.file||(d&&d.data&&(d.data.src||d.data.imageUrl||d.data.image_url||d.data.file||d.data.url)))pi(hwGetImageSrc(d));else if(t.includes("TEX")||t.includes("MATH")||t.includes("FORMULA"))pf(hwGetFormula(d))};
        obj.blocks.forEach(b=>{if(!b)return;if(b.type==="atomic"&&b.data){hd(b.data);return}pt(b.text);if(Array.isArray(b.entityRanges))b.entityRanges.forEach(r=>{const e=hwGetEntityByKey(em,r?.key);if(e&&e.data)hd({...e.data,type:e.type||e.data.type})})});
                return{text:parts.join("\n").trim(),images,segments:segs.length?segs:(parts.length?[{type:"text",value:parts.join("\n").trim()}]:[])}
    }
    /** 图片资产登记：把解析出的 images 追加进模块级 hwImageAssets 数组（附题目序号
     * 与可选选项字母定位），供 hwHydrateImageMap 批量下载。去重靠后续 Set 化。
     * [DEEP-DOC]
     */
    function hwCollectImages(qi,parsed,optL) { if(!parsed||!Array.isArray(parsed.images))return; parsed.images.forEach(im=>{if(!im.src)return;if(!hwImageAssets.some(a=>a.qi===qi&&a.src===im.src&&a.optL===optL))hwImageAssets.push({qi,src:im.src,optL})})}
    /** 平台题型代码 → 中文标签映射：1 单选 / 2 多选 / 4 填空 / 5 判断 / 6 简答 /
     * 7 附件 / 13 匹配 / 9 组合子题；未知码兜底「未知题型」。
     * [DEEP-DOC]
     */
    function hwTypeLabel(t) { return {1:'[单选题]',2:'[多选题]',4:'[填空题]',5:'[判断题]',6:'[简答题]',7:'[附件题]',13:'[匹配题]'}[t]||'[其他]' }
    /** 富文本答案 → 纯文本：hwMaybeParse 后走 blocks 拼接或直接 String。填空比对与结果展示共用。
     * [DEEP-DOC]
     */
    function hwExtractPlainText(v) {
        if(v===null||v===undefined)return'';
        const p=hwMaybeParse(v);
        if(p&&typeof p==='object'&&Array.isArray(p.blocks))return p.blocks.map(b=>b?.text||'').join('\n').trim();
        if(Array.isArray(p))return p.map(hwExtractPlainText).filter(Boolean).join('；');
        if(p&&typeof p==='object')return Object.values(p).map(hwExtractPlainText).filter(Boolean).join('；');
        return String(p).trim();
    }
    /** 富文本答案 → 展示 HTML：blocks 逐段还原段落与图片占位，供结果面板 innerHTML 渲染。
     * [DEEP-DOC]
     */
    function hwExtractRichDisplay(v) {
        if(v===null||v===undefined||v==='')return'';
        const p=hwParseRichContent(v);
        return p.text||hwExtractPlainText(v);
    }
    /** 答案项 ID 归一：String() 统一数字/字符串混型，保证作答回填时的键匹配稳定。
     * [DEEP-DOC]
     */
    function hwNormalizeAnswerIds(a) {
        if(Array.isArray(a))return a.map(x=>String(x).trim()).filter(Boolean);
        if(a===null||a===undefined)return[];
        const p=hwMaybeParse(a);
        if(Array.isArray(p))return p.map(x=>String(x).trim()).filter(Boolean);
        return String(p).split(/[,，、\s]+/).map(x=>x.trim()).filter(Boolean);
    }
    /** 选择题格式化：answerChecked===2 判定正确项；输出「字母. 文本」列表，标准答案存在时标注 ✓。
     * [DEEP-DOC]
     */
    function hwFormatChoice(qData,answer) {
        const ids=hwNormalizeAnswerIds(answer);if(!ids.length)return'未作答';
        return ids.map(id=>{const o=qData.options?.find(x=>String(x.id)===String(id));if(!o)return id;const t=o.text?' '+o.text:'';return o.letter+'.'+t}).join('；');
    }
    /** 填空题格式化：sItems 序号对应答案数组逐空展示「空N：内容」，缺答显示空位。
     * [DEEP-DOC]
     */
    function hwFormatFill(qData,answer) {
        const p=hwMaybeParse(answer);
        if(!p||typeof p!=='object'||Array.isArray(p)){const t=hwExtractPlainText(answer);return t||'未作答';}
        const parts=(qData.sItems||[]).map((it,i)=>{const v=hwExtractPlainText(p[it.id]);return'空'+(i+1)+'：'+(v||'未填')});
        return parts.length?parts.join('；'):'未作答';
    }
    /** 匹配题格式化：左右项按 id 配对输出「左项 → 右项」行序列。
     * [DEEP-DOC]
     */
    function hwFormatMatching(qData,answer) {
        const p=hwMaybeParse(answer);const l=qData.matchingLeftItems||[],r=qData.matchingRightItems||[];
        if(!p||typeof p!=='object'||Array.isArray(p)){const t=hwExtractPlainText(answer);return t||'未作答';}
        const rm=new Map(r.map(x=>[String(x.id),x]));let has=false;
        const lines=l.map(li=>{const rv=p[li.id]??p[String(li.id)];const rids=hwNormalizeAnswerIds(rv);if(!rids.length)return li.letter+'. '+(li.text||'')+' => 未匹配';has=true;const rt=rids.map(id=>{const ri=rm.get(String(id));return ri?ri.letter+'. '+(ri.text||''):id}).join('、');return li.letter+'. '+(li.text||'')+' => '+rt});
        return has?lines.join('\n'):'未作答';
    }
    /** 作答内容总分发：按 qData.type 路由到 choice(1,2,5)/fill(4)/matching(13)/
     * rich(6)/附件(7 占位)；未知类型显示原始 JSON 截断。
     * [DEEP-DOC]
     */
    function hwFormatAnswer(qData,answer) {
        if(!qData)return hwExtractPlainText(answer)||'未作答';
        if(qData.type===1||qData.type===2||qData.type===5)return hwFormatChoice(qData,answer);
        if(qData.type===4)return hwFormatFill(qData,answer);
        if(qData.type===6)return hwExtractRichDisplay(answer)||'未作答';
        if(qData.type===7)return'附件题';
        if(qData.type===13)return hwFormatMatching(qData,answer);
        return hwExtractPlainText(answer)||'未作答';
    }
    /** 标准答案提取（仅平台发布答案后下发）：优先 question.std_answer，兼容 answer 字段。
     * [DEEP-DOC]
     */
    function hwGetStdAnswer(qData,canShow) {
        if(!canShow||!qData)return'';
        if(qData.type===1||qData.type===2||qData.type===5){const co=(qData.options||[]).filter(o=>o.answerChecked===2);return co.map(o=>{const t=o.text?' '+o.text:'';return o.letter+'.'+t}).join('；')||''}
        if(qData.type===4){const parts=(qData.sItems||[]).map((it,i)=>{const v=hwExtractPlainText(it.answer);return v?'空'+(i+1)+'：'+v:''}).filter(Boolean);return parts.join('；')}
        if(qData.type===6&&(qData.sItems||[])[0])return hwExtractRichDisplay(qData.sItems[0].answer);
        return'';
    }
    /**
     * 单题批改状态机：correct===2 或满分 → ok 正确；score>0 → partial 部分；
     * correct===1 或零分 → bad 错误；有记录无成绩 → pending 待批改；无记录 →
     * muted 未作答。输出 {label, tone}，tone 驱动结果面板配色与筛选键。
     * [DEEP-DOC]
     */
    function hwGetResultState(a,qd) {
        if(!a)return{label:'未作答',tone:'muted'};
        const s=hwToNum(a.score),c=hwToNum(a.correct),fs=hwToNum(qd?.score);
        if(c===2||(s!==null&&fs!==null&&fs>0&&s>=fs))return{label:'正确',tone:'ok'};
        if(s!==null&&s>0)return{label:'部分得分',tone:'partial'};
        if(c===1||(s!==null&&s===0))return{label:'错误',tone:'bad'};
        return{label:'待批改',tone:'pending'};
    }
    /**
     * 提交结果装配器：answer_record 缺失/answers 空数组 → waiting/not_submitted
     * 早退；status!==2 → not_submitted（有记录未交）；否则 submitted 态：
     * canShowStandardAnswer 由 publish_record.is_show_answer 决定、totalScore/
     * actualScore/answerNum 收敛、逐题 questionResults 经 GetResultState 构建。
     * [DEEP-DOC]
     */
    function hwBuildSubmissionResult(pd) {
        const ar=pd?.answer_record,answers=ar?.answers;
        if(!ar||!Array.isArray(answers)||!answers.length)return{state:hwQuestionsData.length?'not_submitted':'waiting',message:hwQuestionsData.length?'未检测到已提交作业记录。':'等待题目数据加载...'};
        if(Number(ar.status)!==2)return{state:'not_submitted',message:'检测到作答记录，但当前任务尚未提交。'};
        const canShow=pd?.publish_record?.is_show_answer===true;
        const am=new Map(answers.map(a=>[String(a.question_id),a]));
        const qrs=hwQuestionsData.map(qd=>{const a=am.get(String(qd.id));const rs=hwGetResultState(a,qd);const s=hwToNum(a?.score),fs=hwToNum(qd.score);const st=s!==null?`${s} / ${fs!==null?fs:'-'} 分`:`- / ${fs!==null?fs:'-'} 分`;return{index:qd.index,id:qd.id,type:qd.type,typeLabel:hwTypeLabel(qd.type),title:qd.titleText,stateLabel:rs.label,tone:rs.tone,scoreText:st,userAnswer:hwFormatAnswer(qd,a?.answer),rawUserAnswer:a?.answer,standardAnswer:hwGetStdAnswer(qd,canShow)}});
        return{state:'submitted',canShowStandardAnswer:canShow,totalScore:hwToNum(pd?.total_score),actualScore:hwToNum(ar.actual_score??ar.score),answerNum:hwToNum(ar.answer_num||hwQuestionsData.length),correctNum:hwToNum(ar.answer_correct_num),questionResults:qrs};
    }

    
    let _hwDataJustLoaded = false;
    /**
     * 试卷归属校验（防串包闸门）：payloadGroupId 存在且与当前路由课程不符 → false；
     * payloadPaperId 与 getPaperId()/已捕获 hwPaperId 均无法对上 → false。
     * 后台预加载的其他试卷响应在此被拦截，不会污染当前答题会话。
     * [DEEP-DOC]
     */
    function hwIsCurrentPaperPayload(json) {
        const payloadGroupId = json?.data?.group_id;
        const currentGroupId = getCourseGroupId();
        if (payloadGroupId && currentGroupId && String(payloadGroupId) !== String(currentGroupId)) return false;
        const payloadPaperId = json?.data?.paper_id || json?.data?.paperId || json?.data?.id;
        if (!payloadPaperId) return true;
        /* 新版 resource 作业页：URL 末段是资源节点 ID，真卷 ID 是内层 quote/资源 id，
           两者不同但都属于本卷。课程内守卫已足够拦截串包（载荷 group_id 必须与当前
           课程一致），paper_id 只在双 ID 都已知且都匹配不上时才拒收。 */
        if (hwPaperId && String(payloadPaperId) === String(hwPaperId)) return true;
        const urlPaperId = getPaperId();
        if (urlPaperId && String(payloadPaperId) === String(urlPaperId)) return true;
        /* 放宽兜底：URL 是 resource/{dir}/{paperNode} 作业页形态时，直接信任课程守卫，
           不因 paper_id 形态差异丢弃（防脚本启动早期 hwPaperId 未定值时误杀） */
        if (/resource\/\d+\/\d+/.test(window.location.href) && !window.location.href.includes('/course_paper/')) return true;
        return false;
    }
    /**
     * 题目数据主处理器 —— 作业模块的心脏。
     *
     * 管线五级：
     *   1. 结构守卫：json/data/questions 三层存在性 + Array.isArray 类型校验
     *      （畸形载荷 warn 后优雅 return，绝不抛出打断页面）；
     *   2. 归属守卫：hwIsCurrentPaperPayload 拦过期试卷；
     *   3. 元数据补齐：paper/group/node/record 四 ID 就位（已有值不覆盖）；
     *   4. 逐题清洗 forEach：题型分流——选择类分配字母、填空计空数、匹配题
     *      左右分列、附件标记免答；每题走 ParseRichContent 三元组解析 + 图片收集；
     *      同时拼 AI 提示词模板 tpl（含作答格式说明头）；
     *   5. 收尾：hwActiveTaskKey 固化 → BuildSubmissionResult → 非 dashboard
     *      钉住场景自动切作业区 → hwUpdateUI 全量刷新。
     *
     * 副作用：重置并重建 hwQuestionsData/hwImageAssets/hwPdfQuestions 三大数组。
     * [DEEP-DOC]
     */
    function hwProcessPaperData(json) {
        if(!json||!json.data||!Array.isArray(json.data.questions)){console.warn('[小雅辅助·作业区] 题目数据结构不完整，已跳过处理',!!json,!!json?.data,!!json?.data?.questions);return;}
        if (!hwIsCurrentPaperPayload(json)) {
            console.warn('[小雅辅助·作业区] 已忽略过期课程的题目响应');
            return;
        }
        clearTimeout(window._hwResetGuard);
        _hwDataJustLoaded = true;
        setTimeout(() => { _hwDataJustLoaded = false; }, 3000);
        console.log('[小雅辅助·作业区] 开始处理题目数据，题目数:', json.data.questions.length);
        hwPaperId=hwPaperId||json.data.paper_id||json.data.paperId||json.data.id||'';
        if(!hwGroupId)hwGroupId=json.data.group_id;
        if(!hwNodeId)hwNodeId=getNodeId()||'';
        hwRecordId=hwRecordId||hwExtractRecordId(json.data);
        const qs=json.data.questions;
        hwQuestionsData=[];hwImageAssets=[];hwPdfQuestions=[];
        let tpl='📌 答题任务单\n按下列题目作答，只输出答案本身，不要附带解析或任何说明文字。\n【答案格式】\n单选/判断 → 题号 => 大写字母（如 1 => A）\n多选 → 题号 => 字母，逗号分隔（如 2 => A,C）\n填空 → 题号 => 各空用竖线分隔（如 3 => const | let）\n简答 → 题号 => 完整文字\n匹配 → 题号 => 左:右（如 10 => A:a,d | B:b,c）\n附件题无需作答。\n\n════════════════════\n以下为题目内容：\n════════════════════\n';
        qs.forEach((q,idx)=>{const qi=idx+1;const pt=hwParseRichContent(q.title);let qTitle=pt.text;let qType=hwTypeLabel(q.type);const rOpts=[],mLeft=[],mRight=[];hwCollectImages(qi,pt);tpl+=qi+'. '+qTitle+' '+qType+'\n';
        let sItems=Array.isArray(q.answer_items)?[...q.answer_items]:[];if(q.answer_items_sort&&Array.isArray(q.answer_items)){const si=String(q.answer_items_sort).split(',');sItems=si.map(id=>q.answer_items.find(it=>String(it.id)===String(id))).filter(Boolean)}
        const pq={index:qi,type:q.type,typeLabel:qType,titleSegments:pt.segments&&pt.segments.length?pt.segments:(qTitle?[{type:'text',value:qTitle}]:[]),options:[],matchingLeftItems:[],matchingRightItems:[],blankCount:sItems.length};
        if(q.type===1||q.type===2||q.type===5){let lc=65;sItems.forEach(opt=>{const ol=String.fromCharCode(lc);const po=hwParseRichContent(opt.value);let ot=po.text;hwCollectImages(qi,po,ol);if(q.type===5&&!ot)ot=ol==='A'?'正确':'错误';pq.options.push({letter:ol,text:ot,segments:po.segments&&po.segments.length?po.segments:(ot?[{type:'text',value:ot}]:[])});rOpts.push({id:opt.id,letter:ol,text:ot,answerChecked:opt.answer_checked});tpl+='   '+ol+'. '+ot+'\n';lc++})}
        else if(q.type===4)tpl+='   (本题共 '+sItems.length+' 个填空)\n';
        else if(q.type===7)tpl+='   附件题无需回答。\n';
        else if(q.type===13){const li=sItems.filter(it=>it&&it.is_target_opt!==true),ri=sItems.filter(it=>it&&it.is_target_opt===true);tpl+='   左侧：\n';li.forEach((opt,ii)=>{const ol=String.fromCharCode(65+ii);const po=hwParseRichContent(opt.value);const ot=po.text,segs=po.segments&&po.segments.length?po.segments:(ot?[{type:'text',value:ot}]:[]);hwCollectImages(qi,po,ol);const d={id:opt.id,letter:ol,text:ot,segments:segs};mLeft.push(d);pq.matchingLeftItems.push(d);tpl+='   '+ol+'. '+ot+'\n'});tpl+='\n   右侧候选：\n';ri.forEach((opt,ii)=>{const ol=String.fromCharCode(97+ii);const po=hwParseRichContent(opt.value);const ot=po.text,segs=po.segments&&po.segments.length?po.segments:(ot?[{type:'text',value:ot}]:[]);hwCollectImages(qi,po,ol);const d={id:opt.id,letter:ol,text:ot,segments:segs};mRight.push(d);pq.matchingRightItems.push(d);tpl+='   '+ol+'. '+ot+'\n'})}
        tpl+='\n';hwQuestionsData.push({index:qi,id:q.id,type:q.type,score:q.score,titleText:qTitle,options:rOpts,matchingLeftItems:mLeft,matchingRightItems:mRight,sItems});hwPdfQuestions.push(pq)});
        hwExtractedText=tpl;hwActiveTaskKey=hwBuildTaskKey(hwGroupId,hwNodeId,hwPaperId);hwSubmissionResult=hwBuildSubmissionResult(json.data);hwActiveTab='answer';
        console.log('[小雅辅助·作业区] 数据清洗完毕：', hwQuestionsData.length, '题,', hwImageAssets.length, '图, 已提交:', hwSubmissionResult.state);
        if(hwQuestionsData.length && !xyShouldKeepDashboardOverview(hwGroupId || getCourseGroupId())) switchToZone(ZONE.HW);
        hwUpdateUI();
    }

    
    let _hwProactiveFetching = false;
    /**
     * 主动拉题管线（截包失效时的补救通道）。
     *
     * URL 参数三参补齐（searchParams → 全局提取函数回退）后分流：
     *   resource 页形态 → queryResource/v3 单次请求，questions 数组展开子题
     *     （type=9 组合题的 subQuestions 平铺并标 _parentId）后走主处理器；
     *   course_paper 形态 → queryStuPaper/v2 指数退避轮询 6 次（200ms×2^n）,
     *     依赖劫持链在响应到达时自动处理（本函数只负责触发请求），轮询结束
     *     仍未拿到则放弃并 warn。
     * _hwProactiveFetching 重入门防并发重复拉取。
     * [DEEP-DOC]
     */
    let _hwProactiveNextAt = 0;
    async function hwProactiveFetchData() {
        if (_hwProactiveFetching) return;
        if (hwQuestionsData.length > 0) return;
        /* 失败节流：上一轮拉取未拿到题目时至少间隔 10s 再试，
           防止 scanner 每秒重入造成接口风暴（实测旧版曾 40+ 次连发） */
        if (Date.now() < _hwProactiveNextAt) return;
        try {
            const urlObj = new URL(window.location.href);
            let groupId = urlObj.searchParams.get('group_id');
            let nodeId = urlObj.searchParams.get('node_id');
            let paperId = urlObj.searchParams.get('paper_id');
            
            if (!groupId || !nodeId || !paperId) {
                if (!groupId) groupId = getCourseGroupId();
                if (!nodeId) nodeId = getResourceNodeId();
                if (!paperId) paperId = getPaperId();
            }
            
            const isResourcePage = window.location.href.includes('/resource/') && !window.location.href.includes('/course_paper/');
            if (isResourcePage && groupId && paperId) {
                _hwProactiveFetching = true;
                try {
                    const token = getCookie();
                    if (!token) { _hwProactiveFetching = false; return; }
                    /* 新版作业页数据链（实测）：resource/{gid}/{dirId}/{paperNodeId} →
                       ① queryResource/v3?node_id={paperNodeId} 取 resource.id(真卷 quote_id)
                       ② survey/course/queryStuPaper/v2?paper_id={quote_id}&group_id&node_id={paperNodeId}
                         一次拿全 questions + answer_record（批改状态） */
                    const resUrl = `https://${domain}/api/jx-iresource/resource/queryResource/v3?node_id=${encodeURIComponent(paperId)}`;
                    console.log('[小雅辅助·作业区] resource 页面用 queryResource/v3');
                    const res = await _hw_nativeFetch(resUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    const data = await res.json();
                    if (data && data.success && data.data && data.data.resource && Array.isArray(data.data.resource.questions)) {
                        const questions = data.data.resource.questions;
                        console.log('[小雅辅助·作业区] queryResource/v3 获取到题目:', questions.length, '题');
                        const paperIdFromRes = data.data.resource.id || paperId;
                        hwGroupId = groupId;
                        hwNodeId = paperId;
                        hwPaperId = String(paperIdFromRes);
                        // 优先走正式试卷接口：题目+作答记录一次拿全（queryResource/v3 无 answer_record）
                        try {
                            const stuUrl = `https://${domain}/api/jx-iresource/survey/course/queryStuPaper/v2?paper_id=${encodeURIComponent(paperIdFromRes)}&group_id=${encodeURIComponent(groupId)}&node_id=${encodeURIComponent(paperId)}`;
                            const stuRes = await _hw_nativeFetch(stuUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                            const stuData = await stuRes.json();
                            if (stuData && stuData.success && stuData.data && Array.isArray(stuData.data.questions)) {
                                console.log('[小雅辅助·作业区] survey/course/queryStuPaper/v2 获取到完整试卷数据');
                                hwProcessPaperData(stuData);
                                _hwProactiveFetching = false;
                                return;
                            }
                            console.warn('[小雅辅助·作业区] survey 接口无 questions，回退 queryResource 组包');
                        } catch(e) { console.warn('[小雅辅助·作业区] survey 接口失败，回退 queryResource 组包:', e); }

                        // 子题平铺：type=9 组合题的 subQuestions 展开并标 _parentId
                        const allQuestions = [];
                        questions.forEach(q => {
                            allQuestions.push(q);
                            if (q.type === 9 && Array.isArray(q.subQuestions)) {
                                q.subQuestions.forEach(sq => { sq._parentId = q.id; allQuestions.push(sq); });
                            }
                        });

                        // 归属校验已在 hwIsCurrentPaperPayload 内做双 ID 白名单（URL 末段+内层卷 ID），无需临时包装
                        try {
                            const compatData = {
                                data: {
                                    paper_id: paperIdFromRes,
                                    group_id: groupId,
                                    questions: allQuestions,
                                    answer_record: data.data.answer_record || null
                                }
                            };
                            hwGroupId = groupId;
                            hwPaperId = String(paperIdFromRes);
                            hwProcessPaperData(compatData);
                        } catch(e) { console.warn('[小雅辅助·作业区] compatData 组包失败:', e); }
                        _hwProactiveFetching = false;
                        return;
                    }
                    console.warn('[小雅辅助·作业区] queryResource/v3 返回值无 questions');
                } catch(e) {
                    console.warn('[小雅辅助·作业区] queryResource/v3 失败:', e);
                }
                _hwProactiveFetching = false;
                return;
            }
            if (!groupId || !nodeId || !paperId) {
                console.log('[小雅辅助·作业区] 主动拉取参数缺失:', { groupId, nodeId, paperId });
                return;
            }
            _hwProactiveFetching = true;
            hwGroupId = groupId;
            hwNodeId = nodeId;
            hwPaperId = paperId;
            console.log('[小雅辅助·作业区] 主动拉取参数:', { groupId, nodeId, paperId, isResourcePage: window.location.href.includes('/resource/') });
            const token = getCookie();
            if (!token) { _hwProactiveFetching = false; return; }
            
            let data = null;
            for (let attempt = 0; attempt < 6; attempt++) {
                if (hwQuestionsData.length > 0) { data = true; break; }
                try {
                const url = `https://${domain}/api/jx-iresource/survey/course/queryStuPaper/v2?paper_id=${encodeURIComponent(paperId)}&group_id=${encodeURIComponent(groupId)}&node_id=${encodeURIComponent(nodeId)}`;

                    const res = await window.fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (!res.ok) console.warn(`[小雅辅助·作业区] 试卷接口返回异常状态 ${res.status}(第${attempt + 1}次)`);
                } catch(e) { console.warn(`[小雅辅助·作业区] 试卷接口请求失败(第${attempt + 1}次):`, e); }
                if (hwQuestionsData.length > 0) { data = true; break; } 
                if (attempt < 5) await sleep(200 * Math.pow(2, attempt)); 
            }
            if (data) {
                console.log('[小雅辅助·作业区] 主动拉取题目数据成功');
                if (hwQuestionsData.length > 0 && hwSubmissionResult.state === 'waiting') {
                    hwSubmissionResult.state = 'not_submitted';
                    hwUpdateUI();
                }
            } else {
                console.warn('[小雅辅助·作业区] 主动拉取未获得到题目数据（6次重试后放弃）');
            }
        } catch(e) {
            console.warn('[小雅辅助·作业区] 主动拉取题目数据失败', e);
        } finally {
            _hwProactiveFetching = false;
            if (hwQuestionsData.length === 0) _hwProactiveNextAt = Date.now() + 10000;
        }
    }
    /** data URI → ArrayBuffer：split 取 base64 段 → atob → Uint8Array 逐字节填充。docx ImageRun 的数据源转换器。
     * [DEEP-DOC]
     */
    function hwDataUrlToArrayBuffer(dataUrl){const b64=dataUrl.split(',')[1];const bs=atob(b64);const bytes=new Uint8Array(bs.length);for(let i=0;i<bs.length;i++)bytes[i]=bs.charCodeAt(i);return bytes.buffer}
    /**
     * 图片尺寸探测：Blob → objectURL → Image onload 读 natural 尺寸 → revoke。
     * onerror reject「无法获取图片尺寸」。用于 docx 中按原始宽高比缩放排版。
     * [DEEP-DOC]
     */
    function hwGetImageSize(ab){return new Promise((resolve,reject)=>{const blob=new Blob([ab]);const url=URL.createObjectURL(blob);const img=new Image();img.onload=()=>{const d={width:img.width,height:img.height};URL.revokeObjectURL(url);resolve(d)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('无法获取图片尺寸'))};img.src=url})}
    /**
     * 平台图片二进制拉取：从 src 解析 file_access/{id} 段 → 拼 cloud/file_access
     * API（random 时间戳防缓存）→ GET arrayBuffer。非 2xx 抛业务错误。
     * [DEEP-DOC]
     */
    async function hwFetchImageBlob(src){var s=String(src);var p=s.indexOf("file_access/");if(p===-1)throw new Error("无法解析图片ID");var id=s.substring(p+12).split(/[?/]/)[0];var url=window.location.origin+"/api/jx-oresource/cloud/file_access/"+id+"?random="+Date.now();var r=await fetch(url,{method:"GET"});if(!r.ok)throw new Error("图片请求失败:"+r.status);return await r.arrayBuffer()}
    /** 并发受限映射（与 xyCourseDashboardMapLimit 同构）：固定 worker 池共享游标，保序输出。图片下载限制 3 路防打爆接口。
     * [DEEP-DOC]
     */
    async function hwMapLimit(list,limit,worker){const res=new Array(list.length);let c=0;const runners=Array.from({length:Math.min(limit,list.length)},async()=>{while(c<list.length){const i=c++;res[i]=await worker(list[i],i)}});await Promise.all(runners);return res}
    /**
     * 图片批量水合：全部 src 去重 → hwMapLimit(3) 逐张 FetchImageBlob +
     * GetImageSize（超宽 450px 等比缩放排版尺寸）→ 产出 Map<src,{ok,arrayBuffer,
     * width,height}>。单张失败不拖垮整体，错误记录在条目内供 docx 渲染降级。
     * [DEEP-DOC]
     */
    async function hwHydrateImageMap(extra){const all=[...hwImageAssets,...(extra||[])];const us=Array.from(new Set(all.map(a=>a.src).filter(Boolean)));if(!us.length)return new Map();const results=await hwMapLimit(us,3,async src=>{try{const ab=await hwFetchImageBlob(src);let w=300,h=180;try{const d=await hwGetImageSize(ab.slice(0));if(d.width&&d.height){w=d.width;h=d.height;if(w>450){h=Math.round(h*(450/w));w=450}}}catch(e){}return{src,ok:true,arrayBuffer:ab,width:w,height:h}}catch(e){return{src,ok:false,error:e?.message||String(e)}}});const m=new Map();results.forEach(r=>m.set(r.src,r));return m}
    /**
     * 图文段序列 → docx Paragraph[]：text 段累积 TextRun 后 flush（相邻文本合并
     * 减少段落数）；image 段查 imMap 成功则 ImageRun（缩放后尺寸）失败插入灰色
     * 占位文字；formula 段斜体「[公式: ...]」占位（docx 不支持原生 LaTeX）。
     * indentLvl 控制选项级缩进（240 twips/级）。
     * [DEEP-DOC]
     */
    function hwRenderSegments(segs,imMap,indentLvl){const{Paragraph,TextRun,ImageRun}=window.docx;const paras=[];const indent=indentLvl?{left:indentLvl*240}:undefined;if(!segs||!segs.length)return paras;let txtRuns=[];
    const flush=()=>{if(txtRuns.length){paras.push(new Paragraph({children:txtRuns,spacing:{before:40,after:40},...(indent?{indent}:{})}));txtRuns=[]}};
    segs.forEach(seg=>{if(seg.type==='image'&&seg.src){flush();const rec=imMap.get(seg.src);if(rec&&rec.ok&&rec.arrayBuffer){try{paras.push(new Paragraph({children:[new ImageRun({data:rec.arrayBuffer,transformation:{width:rec.width,height:rec.height}})],spacing:{before:60,after:60},...(indent?{indent}:{})}))}catch(e){paras.push(new Paragraph({children:[new TextRun({text:'[图片嵌入失败]',size:20,color:'#e45a64',italics:true})],spacing:{before:40,after:40}}))}}else{paras.push(new Paragraph({children:[new TextRun({text:'[图片]',size:20,color:'#9ca3af',italics:true})],spacing:{before:40,after:40}}))}}else if(seg.type==='text'&&seg.value){txtRuns.push(new TextRun({text:hwSafeText(seg.value),size:22}))}else if(seg.type==='formula'&&seg.value){txtRuns.push(new TextRun({text:'[公式: '+hwSafeText(seg.value)+']',size:22,italics:true}))}});
    flush();return paras}
    /**
     * 单题 → docx 内容块组装：题号加粗行 → 题干段（RenderSegments）→
     * 选择题选项列表 / 填空空位数说明 / 匹配题左右两列 / 附件题斜体说明。
     * spacing before/after 微调阅读节奏。返回 Paragraph 数组由导出器拼接。
     * [DEEP-DOC]
     */
    function hwBuildQuestionContent(pq,qd,ri,imMap){const{Paragraph,TextRun,AlignmentType}=window.docx;const blk=[];
    blk.push(new Paragraph({children:[new TextRun({text:pq.index+'. ',bold:true,size:24}),new TextRun({text:pq.typeLabel,size:24,bold:true})],spacing:{before:280,after:60}}));
    blk.push(...hwRenderSegments(pq.titleSegments,imMap,0));
    if((pq.type===1||pq.type===2||pq.type===5)&&pq.options.length){pq.options.forEach(opt=>{blk.push(new Paragraph({children:[new TextRun({text:opt.letter+'.',bold:true,size:22})],spacing:{before:60,after:20},indent:{left:240}}));blk.push(...hwRenderSegments(opt.segments,imMap,1))})}
    if(pq.type===4){blk.push(new Paragraph({children:[new TextRun({text:'（共 '+pq.blankCount+' 个填空）',size:20,color:'#6b7280'})],spacing:{before:60,after:40},indent:{left:240}}))}
    if(pq.type===13){blk.push(new Paragraph({children:[new TextRun({text:'左侧：',bold:true,size:22})],spacing:{before:80,after:40}}));(pq.matchingLeftItems||[]).forEach(it=>{blk.push(new Paragraph({children:[new TextRun({text:it.letter+'.',bold:true,size:22})],spacing:{before:40,after:20},indent:{left:240}}));blk.push(...hwRenderSegments(it.segments,imMap,1))});blk.push(new Paragraph({children:[new TextRun({text:'右侧候选：',bold:true,size:22})],spacing:{before:80,after:40}}));(pq.matchingRightItems||[]).forEach(it=>{blk.push(new Paragraph({children:[new TextRun({text:it.letter+'.',bold:true,size:22})],spacing:{before:40,after:20},indent:{left:240}}));blk.push(...hwRenderSegments(it.segments,imMap,1))})}
    if(pq.type===7)blk.push(new Paragraph({children:[new TextRun({text:'附件题，无需作答。',size:20,italics:true,color:'#b45309'})],spacing:{before:60,after:40}}));
    
    blk.push(new Paragraph({children:[new TextRun({text:'我的答案：',bold:true,size:22})],spacing:{before:120,after:40}}));
    let uSegs=null;if(ri&&ri.rawUserAnswer!=null){const raw=ri.rawUserAnswer;if(typeof raw==='string'&&raw.includes('"blocks"')){const p=hwParseRichContent(raw);if(p.segments&&p.segments.length)uSegs=p.segments}}
    if(uSegs){blk.push(...hwRenderSegments(uSegs,imMap,0))}else{let ua=ri?ri.userAnswer:(qd?hwFormatAnswer(qd,null):'');if(qd&&qd.options&&qd.options.length&&/^\d{8,}$/.test(String(ua||'').trim())){const o=qd.options.find(o=>String(o.id)===String(ua).trim());if(o)ua=o.letter+'. '+(o.text||'')}blk.push(new Paragraph({children:[new TextRun({text:hwSafeText(ua||'未作答'),size:22})],spacing:{before:20,after:40}}))}
    
    if(ri&&ri.standardAnswer){blk.push(new Paragraph({children:[new TextRun({text:'标准答案：',bold:true,size:22,color:'#19865f'})],spacing:{before:40,after:40}}));let sSegs=null;if(qd&&qd.sItems){if(qd.type===6&&qd.sItems[0]&&qd.sItems[0].answer){const p=hwParseRichContent(qd.sItems[0].answer);if(p.segments&&p.segments.length)sSegs=p.segments}else if(qd.type===4){const fp=[];qd.sItems.forEach((it,i)=>{if(i>0)fp.push({type:'text',value:' | '});const v=hwExtractRichDisplay(it.answer);fp.push({type:'text',value:'空'+(i+1)+'：'+(v||'未填')})});sSegs=fp}}if(sSegs)blk.push(...hwRenderSegments(sSegs,imMap,0));else blk.push(new Paragraph({children:[new TextRun({text:hwSafeText(ri.standardAnswer),size:22,color:'#19865f'})],spacing:{before:20,after:40}}))}
    
    if(ri){blk.push(new Paragraph({children:[new TextRun({text:(ri.stateLabel||'')+'  '+(ri.scoreText||''),size:20,color:'#6b7280',italics:true})],spacing:{before:40,after:60}}))}
    blk.push(new Paragraph({children:[new TextRun({text:'—'.repeat(40),size:16,color:'#d1d5db'})],alignment:AlignmentType.CENTER,spacing:{before:60,after:60}}));
    return blk}
    /**
     * 答题任务单 .docx 导出全流程。
     *
     * 前置：docx/FileSaver 库就绪检查 → hwHydrateImageMap 批量下载图片（日志
     * 进度）→ 文档组装：TITLE 页眉 → 提交状态说明（submitted 时含得分统计）→
     * 逐题 BuildQuestionContent（图片经 imMap 注入）→ Document 包装（中文样式
     * 注册）→ Packer.toBlob → FileSaver saveAs 落盘「小雅辅助工具-答题任务单.docx」。
     * 全程 logMsg 阶段性反馈；库未加载时明确报错指引刷新。
     * [DEEP-DOC]
     */
    async function hwExportDocx(){
        if(!hwQuestionsData.length){logMsg('还没有读取到题目数据，无法导出','error');return}
        const{Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType}=window.docx;const{saveAs}=window;
        if(!Document||!Packer||!saveAs){logMsg('docx库未加载完成，请刷新页面重试','error');return}
        logMsg('正在下载题目图片...','info');
        const res=hwSubmissionResult,qrs=(res&&Array.isArray(res.questionResults))?res.questionResults:[];
        const rm=new Map(qrs.map(r=>[String(r.id),r]));
        const extra=[];
        hwQuestionsData.forEach(qd=>{(qd.sItems||[]).forEach(item=>{if(item.answer){const p=hwParseRichContent(item.answer);(p.images||[]).forEach(im=>{if(im.src)extra.push({src:im.src})})}})});
        qrs.forEach(r=>{if(r.rawUserAnswer){const p=hwParseRichContent(r.rawUserAnswer);(p.images||[]).forEach(im=>{if(im.src)extra.push({src:im.src})})}});
        const imMap=await hwHydrateImageMap(extra);
        const okC=Array.from(imMap.values()).filter(r=>r.ok).length,failC=Array.from(imMap.values()).filter(r=>!r.ok).length;
        console.log('[小雅辅助] docx图片: '+(hwImageAssets.length+extra.length)+' URL, '+okC+' 成功, '+failC+' 失败');
        logMsg('正在生成.docx文件...','info');
        const dc=[];dc.push(new Paragraph({text:'小雅辅助工具 作答文档',heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER,spacing:{after:200}}));dc.push(new Paragraph({text:'导出时间：'+new Date().toLocaleString(),alignment:AlignmentType.CENTER,spacing:{after:300}}));
        if(res&&res.state==='submitted'){const wc=qrs.filter(r=>r.tone==='bad').length,pc=qrs.filter(r=>r.tone==='pending').length;dc.push(new Paragraph({children:[new TextRun({text:String(res.actualScore??'-'),size:44,bold:true}),new TextRun({text:' / '+(res.totalScore??'-')+' 分',size:28,color:'#6b7280'})],alignment:AlignmentType.CENTER,spacing:{after:120}}));dc.push(new Paragraph({children:[new TextRun({text:(res.correctNum??'-')+' 正确 · '+wc+' 错误 · '+pc+' 待批改',size:22,color:'#4b5563'})],alignment:AlignmentType.CENTER,spacing:{after:300}}))}
        for(let i=0;i<hwPdfQuestions.length;i++){const pq=hwPdfQuestions[i],qd=hwQuestionsData[i],ri=qd?rm.get(String(qd.id)):null;dc.push(...hwBuildQuestionContent(pq,qd,ri,imMap))}
        const doc=new Document({creator:'小雅辅助工具',description:'作答文档导出',title:'小雅辅助工具 作答文档',styles:{paragraphStyles:[{id:'Normal',name:'Normal',run:{font:'Microsoft YaHei',size:22},paragraph:{spacing:{line:360,before:0,after:0}}}]},sections:[{properties:{},children:dc}]});
        const blob=await Packer.toBlob(doc);const now=new Date(),pad=v=>String(v).padStart(2,'0');const stamp=now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'_'+pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());saveAs(blob,'小雅辅助_作答文档_'+stamp+'.docx');
        logMsg('✅ .docx 作答文档已导出','success');
    }
    /** 组装最终 AI 提示词：hwExtractedText 模板（含作答格式规范）为基底，用户在
     * 输入框追加的补充指令非空时附加到头部。返回纯文本串供复制。
     * [DEEP-DOC]
     */
    function hwBuildAiPrompt() {
        const lines = ['📌 答题任务单','按下列题目作答，只输出答案本身，不要附带解析或任何说明文字。','【答案格式】','单选/判断 → 题号 => 大写字母（如 1 => A）','多选 → 题号 => 字母，逗号分隔（如 2 => A,C）','填空 → 题号 => 各空用竖线分隔（如 3 => const | let）','简答 → 题号 => 完整文字','匹配 → 题号 => 左:右（如 10 => A:a,d | B:b,c）','附件题无需作答。','','════════════════════','以下为题目内容：','════════════════════',''];
        hwQuestionsData.forEach(q => {
            lines.push(`${q.index}. ${q.titleText} ${hwTypeLabel(q.type)}`);
            if (q.type === 1 || q.type === 2 || q.type === 5) {
                (q.options || []).forEach(o => lines.push(`   ${o.letter}. ${o.text}`));
            } else if (q.type === 4) {
                lines.push(`   (本题共 ${q.sItems ? q.sItems.length : 0} 个填空)`);
            } else if (q.type === 7) {
                lines.push(`   附件题无需回答。`);
            } else if (q.type === 13) {
                lines.push(`   左侧：`);
                (q.matchingLeftItems || []).forEach(it => lines.push(`   ${it.letter}. ${it.text}`));
                lines.push('');
                lines.push(`   右侧候选：`);
                (q.matchingRightItems || []).forEach(it => lines.push(`   ${it.letter}. ${it.text}`));
            }
            lines.push('');
        });
        return lines.join('\n');
    }
    /** 剪贴板双路径写入：navigator.clipboard.writeText（安全上下文）优先；
     * 异常或不可用时 textarea + document.execCommand('copy') 传统回退。
     * @returns {Promise<boolean>} 是否成功
     * [DEEP-DOC]
     */
    function hwCopyText(text) {
        const val = String(text || '');
        if (!val) return false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try { navigator.clipboard.writeText(val); return true; } catch(e) {}
        }
        const ta = document.createElement('textarea');
        ta.value = val;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch(e) {}
        ta.remove();
        return ok;
    }
    /** 一键复制入口：BuildAiPrompt → CopyText → 成功 toast「已复制」/失败 toast
     * 「复制失败请手动全选」。
     * [DEEP-DOC]
     */
    function hwCopyAiPrompt() {
        if (!hwQuestionsData.length) { logMsg('还没有读取到题目数据，无法复制','error'); return; }
        const text = hwBuildAiPrompt();
        hwExtractedText = text;
        if (hwCopyText(text)) { logMsg(`✅ 已复制 ${hwQuestionsData.length} 道题给 AI，去聊天窗口粘贴吧`,'success'); showToast('📋 题目模板已复制', 'success'); }
        else { logMsg('复制失败，请手动复制','error'); showToast('复制失败，请手动复制', 'error'); }
    }
    /**
     * 作答记录 ID 多形态提取：直取 answer_record.id / answer_record_id /
     * record_id；回退遍历 task_flow_record/task_flow_template 数组的各 ID 字段。
     * 全部落空返回 ''（调用方视为「尚无作答记录」，首次保存时由服务端创建）。
     * [DEEP-DOC]
     */
    function hwExtractRecordId(payload) {
        const direct=payload?.answer_record?.id||payload?.answer_record_id||payload?.record_id;
        if(direct)return String(direct);
        for(const list of [payload?.task_flow_record,payload?.task_flow_template]){
            if(!Array.isArray(list))continue;
            for(const item of list){
                const recordId=item?.answer_record_id||item?.answer_record?.id||item?.record_id;
                if(recordId)return String(recordId);
            }
        }
        return '';
    }
    /** 记录 ID 获取编排：hwRecordId 缓存非空直返；否则 RefreshPaperData 触发
     * 劫持链重新捕获试卷载荷补齐，仍拿不到抛错（上层提示初始化失败）。
     * [DEEP-DOC]
     */
    async function hwGetRecordId() {
        if (!hwGroupId || !hwNodeId) throw new Error('未获取到课程或节点参数');
        if (hwRecordId) return hwRecordId;
        const token = getCookie();
        if (!token) throw new Error('未获取到登录 Token');
        const url = `${window.location.origin}/api/jx-iresource/survey/course/task/flow/v2?node_id=${encodeURIComponent(hwNodeId)}&group_id=${encodeURIComponent(hwGroupId)}`;
        const res = await _hw_nativeFetch(url, { headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' }, credentials: 'include' });
        if (!res.ok) throw new Error(`Record ID 请求失败：${res.status}`);
        const data = await res.json();
        const recordId=data?.success&&data.data?hwExtractRecordId(data.data):'';
        if(recordId)return recordId;
        throw new Error('无法获取 Record ID');
    }
    /**
     * AI 答案文本解析器：「题号 => 答案」行语法 → Map<index, rawAnswer>。
     * 容错规则：忽略空行/注释行；题号非正整数跳过；=> 前后空白容忍；
     * 同题号后者覆盖前者。返回有序数组供 SaveAnswers 逐题消费。
     * [DEEP-DOC]
     */
    function hwParseAiBlocks(text) {
        const blocks = [];
        let cur = null;
        String(text || '').split(/\r?\n/).forEach(line => {
            const m = line.match(/^\s*(\d+)\s*=>\s*(.*)$/);
            if (m) {
                if (cur) { cur.answer = cur.lines.join('\n').trim(); blocks.push(cur); }
                cur = { index: parseInt(m[1], 10), lines: [m[2].trim()] };
                return;
            }
            if (cur) cur.lines.push(line.trimEnd());
        });
        if (cur) { cur.answer = cur.lines.join('\n').trim(); blocks.push(cur); }
        return blocks.filter(b => Number.isFinite(b.index) && b.answer);
    }
    /** 简答/附件题富文本载荷构造：纯文本包成 DraftJS 单 block 结构（与评论体同构）。
     * [DEEP-DOC]
     */
    function hwCreateRichAnswer(text) {
        const lines = String(text || '').trim().split(/\r?\n/);
        return JSON.stringify({ blocks: lines.map((line, i) => ({ key: `ans-${i}`, text: line, type: 'unstyled', depth: 0, inlineStyleRanges: [], entityRanges: [], data: {} })), entityMap: {} });
    }
    /**
     * 匹配题载荷构造：「A:a,d | B:b,c」语法解析 → 左项 letter 映射目标右项
     * id 数组。左项字母不存在或右项字母无法解析返回 null（上层计 skip）。
     * [DEEP-DOC]
     */
    function hwBuildMatchingPayload(qd, answerStr) {
        const leftByLetter = new Map((qd.matchingLeftItems || []).map(it => [String(it.letter).toUpperCase(), it]));
        const rightByLetter = new Map((qd.matchingRightItems || []).map(it => [String(it.letter).toLowerCase(), it]));
        const payload = {};
        String(answerStr || '').split(/[|｜;\n；]+/).map(s => s.trim()).filter(Boolean).forEach(segment => {
            const m = segment.match(/^\s*([A-Za-z])\s*(?:=>|->|[:：=])\s*(.+?)\s*$/);
            if (!m) return;
            const left = leftByLetter.get(m[1].toUpperCase());
            if (!left) return;
            const rightIds = m[2].split(/[,，、\s]+/).map(t => t.trim().replace(/[.。]/g, '').toLowerCase()).filter(Boolean).map(letter => {
                const r = rightByLetter.get(letter);
                return r ? r.id : null;
            }).filter(Boolean);
            if (rightIds.length) payload[left.id] = rightIds.join(',');
        });
        return Object.keys(payload).length ? payload : null;
    }
    /**
     * 作答载荷总分发（按题型）：choice 1/2 → [optionId]；判断 5 → 对应选项 id；
     * fill 4 → [{itemId:text}] 数组；简答 6 → RichAnswer；匹配 13 → MatchingPayload。
     * 无法构造返回 null（该题计入 skipped）。
     * [DEEP-DOC]
     */
    function hwBuildAnswerPayload(qd, answerStr) {
        if (!qd) return null;
        const str = String(answerStr || '').trim();
        if (!str) return null;
        if (qd.type === 1 || qd.type === 2 || qd.type === 5) {
            const byLetter = new Map((qd.options || []).map(o => [String(o.letter).toUpperCase(), o.id]));
            const ids = str.split(/[,，、\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean).map(L => byLetter.get(L)).filter(Boolean);
            return ids.length ? ids : null;
        }
        if (qd.type === 4) {
            const blanks = str.split(/[|｜]/).map(s => s.trim());
            const obj = {};
            (qd.sItems || []).forEach((it, i) => { if (blanks[i]) obj[it.id] = blanks[i]; });
            return Object.keys(obj).length ? [obj] : null;
        }
        if (qd.type === 6) return [hwCreateRichAnswer(str)];
        if (qd.type === 13) {
            const m = hwBuildMatchingPayload(qd, str);
            return m ? [m] : null;
        }
        return null; 
    }
    /**
     * 单题作答提交（survey/answer POST）：前置 paperId/token 双校验抛错；
     * 载荷含 record_id/question_id/answer/ext_answer/group_id/paper_id/is_try:0。
     * HTTP 非 2xx 或 success===false 抛平台 message；JSON 解析失败按空 data 继续
     * （HTTP 2xx 即认为受理）。
     *
     * @returns {Promise<Object>} 平台响应 data
     * @throws {Error} 参数缺失/接口拒绝
     * [DEEP-DOC]
     */
    async function hwSubmitAnswer(qd, payload) {
        if (!hwPaperId) throw new Error('未获取到 paper_id');
        const token = getCookie();
        if (!token) throw new Error('未获取到登录 Token');
        const res = await _hw_nativeFetch(`${window.location.origin}/api/jx-iresource/survey/answer`, {
            method: 'POST',
            headers: { 'accept': '*/*', 'authorization': `Bearer ${token}`, 'content-type': 'application/json; charset=UTF-8' },
            credentials: 'include',
            body: JSON.stringify({ record_id: hwRecordId, question_id: qd.id, answer: payload, ext_answer: '', group_id: hwGroupId, paper_id: hwPaperId, is_try: 0 })
        });
        let data = null;
        try { data = await res.json(); } catch(e) { console.warn('[小雅辅助·作业区] 作答保存响应非 JSON:', e); }
        if (!res.ok || (data && data.success === false)) {
            const msg = (data && (data.message || data.error)) || `保存作答失败：${res.status}`;
            throw new Error(msg);
        }
        return data;
    }
    /**
     * 试卷状态轮询刷新：queryStuPaper/v2 触发劫持链更新 hwSubmissionResult，
     * 最多 5 次每次 sleep(400*(attempt+1))；任一轮发现 submitted 即提前 true 收场。
     * @returns {Promise<boolean>} 最终是否已提交
     * [DEEP-DOC]
     */
    async function hwRefreshPaperData() {
        if (!hwGroupId || !hwPaperId) return false;
        const token = getCookie();
        if (!token) return false;
        const nodeId = hwNodeId || getResourceNodeId() || '';
        const url = `${window.location.origin}/api/jx-iresource/survey/course/queryStuPaper/v2?paper_id=${encodeURIComponent(hwPaperId)}&group_id=${encodeURIComponent(hwGroupId)}&node_id=${encodeURIComponent(nodeId)}`;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {

                await window.fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            } catch(e) { console.warn('[小雅辅助·作业区] 刷新试卷请求失败(第' + (attempt + 1) + '次):', e); }
            if (hwSubmissionResult.state === 'submitted') return true;
            if (attempt < 4) await sleep(400 * (attempt + 1));
        }
        return hwSubmissionResult.state === 'submitted';
    }
    /** 刷新建议判定：ok>0 且 fail=0 且 skip=0（完美全保存）→ true，建议 reload 同步最新批阅态；有任何异常则留在页面让用户看结果面板。
     * [DEEP-DOC]
     */
    function hwShouldReloadAfterSave(ok, fail, skip) {
        return ok > 0 && fail === 0 && skip === 0;
    }
    /** 延迟 1s 的整页 reload（保存作答成功后的状态同步手段，给 toast 留出显示窗口）。
     * [DEEP-DOC]
     */
    function hwSchedulePageReload() {
        setTimeout(() => window.location.reload(), 1000);
    }
    /**
     * AI 答案批量保存主编排。
     *
     * 管线：题目数据/粘贴文本双前置校验 → GetRecordId 初始化（失败即中止提示）
     * → ParseAiBlocks 结构化 → 逐行：题号越界 skip / BuildAnswerPayload 为 null
     * skip / SubmitAnswer 提交 ok++ fail++（单题失败 warn 继续不中断批次）→
     * 汇总 toast + ShouldReloadAfterSave 决定 SchedulePageReload → 结果面板刷新。
     *
     * @param {string} aiText - 用户粘贴的 AI 答案文本
     * [DEEP-DOC]
     */
    async function hwSaveAnswers(aiText) {
        if (!hwQuestionsData.length) { logMsg('还没有读取到题目数据，无法保存作答','error'); return; }
        if (!String(aiText || '').trim()) { logMsg('请先粘贴 AI 返回的答案','error'); showToast('请先粘贴 AI 返回的答案', 'warning'); return; }
        logMsg('正在初始化提交参数...','info');
        try {
            hwRecordId = await hwGetRecordId();
        } catch(e) {
            logMsg('初始化提交参数失败：' + e.message,'error');
            showToast('保存失败：' + e.message, 'error');
            return;
        }
        const blocks = hwParseAiBlocks(aiText);
        let ok = 0, fail = 0, skip = 0;
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const qd = hwQuestionsData.find(q => q.index === block.index);
            if (!qd) { fail++; logMsg(`第 ${block.index} 题未在题目列表中找到，已跳过`,'warning'); continue; }
            const payload = hwBuildAnswerPayload(qd, block.answer);
            if (!payload) { skip++; continue; }
            try {
                await hwSubmitAnswer(qd, payload);
                ok++;
                logMsg(`第 ${block.index} 题作答已保存`,'success',true);
            } catch(e) {
                fail++;
                logMsg(`第 ${block.index} 题保存失败：${e.message}`,'error');
            }
            if (i < blocks.length - 1) await sleep(150);
        }
        if (ok > 0) {
            hwResultOpen = true;
            hwActiveTab = 'result';
            const refreshed = await hwRefreshPaperData();
            hwUpdateUI();
            logMsg(`✅ 保存作答完成：成功 ${ok} 题，失败 ${fail} 题，跳过 ${skip} 题`,'success');
            const shouldReload=hwShouldReloadAfterSave(ok,fail,skip);
            showToast(shouldReload ? `✅ 已保存 ${ok} 道题作答，正在刷新页面…` : `✅ 已保存 ${ok} 道题作答` + (refreshed ? '，结果已刷新' : ''), 'success');
            if(shouldReload){
                logMsg('全部答案已保存，1 秒后刷新页面同步状态','success');
                hwSchedulePageReload();
            }
        } else {
            showToast(`未保存任何答案（成功 ${ok} / 失败 ${fail} / 跳过 ${skip}）`, fail ? 'error' : 'warning');
            logMsg(`未保存任何答案：成功 ${ok}，失败 ${fail}，跳过 ${skip}`, fail ? 'error' : 'warning');
        }
    }
    /**
     * 结果面板渲染器：无题目隐藏早退；result.state !== submitted 只显示占位
     * 说明（受 hwResultOpen/hwActiveTab 控制）；submitted 态装配统计摘要
     * （正确/部分/错误/待批四色计数）+ 筛选页签（all/bad/pending）+
     * hwResultFilter 过滤后的逐题结果行（题号/对比/得分/tono 配色）。
     * [DEEP-DOC]
     */
    function hwRenderResultPanel() {
        const box = document.getElementById('xy-hw-result');
        if (!box) return;
        box.innerHTML = '';
        if (!hwQuestionsData.length) { box.style.display = 'none'; return; }
        const result = hwSubmissionResult;
        if (!result || result.state !== 'submitted') {
            const show = hwResultOpen || hwActiveTab === 'result';
            box.style.display = show ? 'block' : 'none';
            if (show) {
                const el = document.createElement('div');
                el.style.cssText = `font-size:11px;color:${T('#94a3b8','#64748b')};text-align:center;padding:12px;border:1px dashed ${T('rgba(71,85,105,0.3)','#e2e8f0')};border-radius:10px;`;
                el.textContent = (result && result.message) || '尚未检测到已提交的作答记录，保存作答后自动展示。';
                box.appendChild(el);
            }
            return;
        }
        box.style.display = 'block';
        const qrs = Array.isArray(result.questionResults) ? result.questionResults : [];
        const wrong = qrs.filter(r => r.tone === 'bad').length;
        const partial = qrs.filter(r => r.tone === 'partial').length;
        const pending = qrs.filter(r => r.tone === 'pending').length;
        const correct = qrs.filter(r => r.tone === 'ok').length;

        const sum = document.createElement('div');
        sum.style.cssText = `border-radius:11px;background:${T('rgba(6,182,212,0.08)','#f0f9ff')};border:1px solid ${T('rgba(6,182,212,0.22)','#bae6fd')};padding:12px 14px;margin-bottom:10px;`;
        sum.innerHTML = `
            <div style="display:flex;align-items:baseline;gap:6px;">
                <span style="font-size:26px;font-weight:800;color:${T('#22d3ee','#0e7490')};">${escapeHtml(result.actualScore ?? '-')}</span>
                <span style="font-size:12px;font-weight:600;color:${T('#94a3b8','#64748b')};">/ ${escapeHtml(result.totalScore ?? '-')} 分</span>
            </div>
            <div style="display:flex;gap:12px;margin-top:8px;font-size:10.5px;">
                <span style="color:${T('#4ade80','#15803d')};">● 正确 ${escapeHtml(correct)}</span>
                <span style="color:${T('#f87171','#dc2626')};">● 错误 ${escapeHtml(wrong)}</span>
                ${partial ? `<span style="color:${T('#fbbf24','#b45309')};">● 部分 ${escapeHtml(partial)}</span>` : ''}
                <span style="color:${T('#94a3b8','#64748b')};">● 待批 ${escapeHtml(pending)}</span>
            </div>`;
        box.appendChild(sum);

        const tabs = document.createElement('div');
        tabs.style.cssText = `display:flex;gap:6px;margin-bottom:8px;`;
        [['all','全部 '+qrs.length],['bad','错题 '+(wrong+partial)],['pending','待批 '+pending]].forEach(([key,label]) => {
            const t = document.createElement('button');
            t.type = 'button';
            t.textContent = label;
            const on = hwResultFilter === key;
            t.style.cssText = `border:1px solid ${on ? T('rgba(34,211,238,0.5)','#67e8f9') : T('rgba(71,85,105,0.3)','#e2e8f0')};background:${on ? T('rgba(34,211,238,0.12)','#cffafe') : 'transparent'};color:${on ? T('#67e8f9','#0e7490') : T('#94a3b8','#64748b')};font-size:10.5px;font-weight:600;padding:4px 12px;border-radius:999px;cursor:pointer;`;
            t.onclick = () => { hwResultFilter = key; hwRenderResultPanel(); };
            tabs.appendChild(t);
        });
        box.appendChild(tabs);

        const list = document.createElement('div');
        list.style.cssText = `max-height:300px;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:8px;`;
        const filtered = qrs.filter(r => {
            if (hwResultFilter === 'all') return true;
            if (hwResultFilter === 'bad') return r.tone === 'bad' || r.tone === 'partial';
            return r.tone === hwResultFilter;
        });
        if (!filtered.length) {
            const el = document.createElement('div');
            el.style.cssText = `font-size:11px;color:${T('#94a3b8','#64748b')};text-align:center;padding:14px;`;
            el.textContent = hwResultFilter === 'all' ? '暂无题目结果。' : '当前筛选项没有题目。';
            list.appendChild(el);
        } else {
            filtered.forEach(r => {
                const row = document.createElement('div');
                row.style.cssText = `border:1px solid ${T('rgba(71,85,105,0.18)','#e2e8f0')};border-radius:9px;background:${T('rgba(15,23,42,0.35)','#ffffff')};padding:9px 11px;`;
                const toneColor = r.tone==='ok' ? T('#4ade80','#15803d') : r.tone==='bad' ? T('#f87171','#dc2626') : r.tone==='partial' ? T('#fbbf24','#b45309') : T('#94a3b8','#64748b');
                const toneBg = r.tone==='ok' ? T('rgba(52,211,153,0.12)','#dcfce7') : r.tone==='bad' ? T('rgba(248,113,113,0.12)','#fee2e2') : r.tone==='partial' ? T('rgba(251,191,36,0.12)','#fef3c7') : T('rgba(148,163,184,0.15)','#f1f5f9');
                let html = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <span style="font-size:11.5px;font-weight:700;color:${T('#e2e8f0','#0f172a')};">${String(r.index).padStart(2,'0')} · ${escapeHtml(r.typeLabel)}</span>
                    <span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:${toneColor};background:${toneBg};border-radius:999px;padding:2px 9px;white-space:nowrap;">${escapeHtml(r.stateLabel)}</span>
                </div>`;
                html += `<div style="font-size:10px;color:${T('#64748b','#94a3b8')};margin-top:3px;">${escapeHtml(r.scoreText)}</div>`;
                if (r.title) html += `<div style="font-size:11px;color:${T('#cbd5e1','#334155')};margin-top:6px;line-height:1.5;overflow-wrap:anywhere;">${escapeHtml(r.title)}</div>`;
                const ansLine = (label, value, color) => `<div style="display:flex;gap:6px;font-size:11px;line-height:1.5;margin-top:4px;">
                    <span style="flex-shrink:0;color:${T('#64748b','#94a3b8')};font-size:10px;margin-top:1px;">${label}</span>
                    <span style="flex:1;min-width:0;overflow-wrap:anywhere;color:${color};">${escapeHtml(value || '未作答')}</span>
                </div>`;
                html += ansLine('我的答案', r.userAnswer, T('#cbd5e1','#334155'));
                if (r.standardAnswer) html += ansLine('标准答案', r.standardAnswer, T('#6ee7b7','#15803d'));
                row.innerHTML = html;
                list.appendChild(row);
            });
        }
        box.appendChild(list);
    }

    let xyUiListenerAbort = null;
    /**
     * 总控台 UI 一次性装配（约 800 行模板 + 绑定）。
     *
     * 骨架：GM_addStyle 全量 CSS（含主题变量）→ 面板根节点（可拖拽手柄/最小化/
     * 八视图容器）→ 分区标签栏 → 各区域初始 HTML（课程仪表盘骨架/引擎控制台/
     * 下载区/讨论区/作业区/概览区）→ 全部控件 onclick/onchange 绑定（模式切换/
     * 开关组/按钮组/搜索框/下拉框）→ 初始持久化状态回放（开关勾选/面板位置/宽度）。
     * 失败整体 catch 报「创建面板失败」不阻塞页面。
     * [DEEP-DOC]
     */

/**
 * 面板视图模板（纯函数）：生成主控台完整 HTML ——
 * 内联 <style>（CSS 变量双主题 / 组件样式 / 动画关键帧）+ 八个业务视图容器。
 * 返回值直接赋给 wrapper.innerHTML；不产生副作用，便于独立评审与快照测试。
 * [DEEP-DOC]
 */
    function xyBuildPanelTemplate() {
        return `
            <style>
                :root { --xy-surface: rgba(15,23,42,0.75); --xy-surface2: rgba(30,41,59,0.65); --xy-border: rgba(71,85,105,0.35); --xy-border-light: rgba(99,102,241,0.2); --xy-text: #e2e8f0; --xy-text2: #94a3b8; --xy-text-muted: #64748b; --xy-accent: #818cf8; --xy-accent2: #6366f1; --xy-success: #34d399; --xy-warning: #fbbf24; --xy-danger: #f87171; }
                /* ── 浅色主题：还原原始经典配色 ── */
                #xy-super-console.xy-theme-light {
                    --xy-surface: #ffffff; --xy-surface2: #f8fafc;
                    --xy-border: #e2e8f0; --xy-border-light: #c7d2fe;
                    --xy-text: #0f172a; --xy-text2: #475569; --xy-text-muted: #94a3b8;
                    --xy-accent: #4f46e5; --xy-accent2: #4338ca;
                    --xy-success: #10b981; --xy-warning: #f59e0b; --xy-danger: #ef4444;
                    background: #ffffff !important;
                    border-color: #e2e8f0 !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04) !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }
                #xy-super-console.xy-theme-light #xy-drag-handle {
                    background: #f8fafc !important;
                    border-bottom-color: #e2e8f0 !important;
                }
                #xy-super-console.xy-theme-light #xy-drag-handle > div:first-child > div:first-child { color: #0f172a !important; }
                #xy-super-console.xy-theme-light #xy-minimize,
                #xy-super-console.xy-theme-light #xy-theme-toggle { color: #94a3b8 !important; }
                #xy-super-console.xy-theme-light #xy-minimize:hover,
                #xy-super-console.xy-theme-light #xy-theme-toggle:hover { background: #f1f5f9 !important; color: #475569 !important; }
                #xy-super-console.xy-theme-light .xy-panel { box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
                #xy-super-console.xy-theme-light .xy-mode-btn {
                    background: #ffffff; color: #475569; border-color: #e2e8f0;
                }
                #xy-super-console.xy-theme-light .xy-mode-btn:hover {
                    background: #f8fafc; border-color: #cbd5e1; color: #0f172a;
                }
                #xy-super-console.xy-theme-light .xy-mode-btn.active {
                    background: #eef2ff; color: #4338ca; border-color: #c7d2fe;
                    box-shadow: 0 0 0 1px rgba(79,70,229,0.1);
                }
                #xy-super-console.xy-theme-light .xy-action-btn {
                    background: #ffffff; color: #334155; border-color: #e2e8f0;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
                }
                #xy-super-console.xy-theme-light .xy-action-btn:hover {
                    background: #f8fafc; border-color: #cbd5e1;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }
                #xy-super-console.xy-theme-light .xy-action-btn.active-guard {
                    background: #ecfdf5; border-color: #a7f3d0; color: #059669;
                }
                #xy-super-console.xy-theme-light .xy-action-btn.inactive-guard {
                    background: #f8fafc; color: #94a3b8;
                }
                #xy-super-console.xy-theme-light .xy-mini-btn {
                    background: #ffffff; color: #475569; border-color: #e2e8f0;
                }
                #xy-super-console.xy-theme-light .xy-mini-btn:hover {
                    background: #f8fafc; color: #0f172a; border-color: #cbd5e1;
                }
                #xy-super-console.xy-theme-light .xy-seg { background: #f1f5f9; border-color: #e2e8f0; }
                #xy-super-console.xy-theme-light .xy-seg-item:hover { background: #ffffff; color: #0f172a; }
                #xy-super-console.xy-theme-light .xy-seg-item.active { color: #4338ca; background: #e0e7ff; box-shadow: 0 0 0 1px rgba(79,70,229,0.12); }
                #xy-super-console.xy-theme-light .xy-seg-item.is-new { color: #059669; }
                #xy-super-console.xy-theme-light .xy-stat-box {
                    background: #f0fdf4; border-color: #bbf7d0;
                }
                #xy-super-console.xy-theme-light .xy-input-box {
                    background: #ffffff; color: #0f172a; border-color: #e2e8f0;
                }
                #xy-super-console.xy-theme-light .xy-input-box::placeholder { color: #94a3b8; }
                #xy-super-console.xy-theme-light .xy-input-box:focus {
                    background: #ffffff; border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
                }
                #xy-super-console.xy-theme-light .xy-target-item:hover {
                    background: #f8fafc !important; border-color: #cbd5e1 !important;
                }
                #xy-super-console.xy-theme-light .xy-divider { background: #e2e8f0; }
                #xy-super-console.xy-theme-light .xy-badge-info {
                    background: #e0e7ff; color: #3730a3; border-color: #c7d2fe;
                }
                #xy-super-console.xy-theme-light .xy-badge-success {
                    background: #d1fae5; color: #065f46; border-color: #a7f3d0;
                }
                #xy-super-console.xy-theme-light .xy-badge-warning {
                    background: #fef3c7; color: #92400e; border-color: #fcd34d;
                }
                #xy-super-console.xy-theme-light button:disabled { opacity: 0.5; }
                #xy-super-console.xy-theme-light ::-webkit-scrollbar-thumb { background: #cbd5e1; }
                #xy-super-console.xy-theme-light ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                #xy-super-console * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: rgba(71,85,105,0.4) transparent; }
                #xy-super-console button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-family: inherit; outline: none; }
                #xy-super-console button:active { transform: scale(0.96) !important; }
                #xy-super-console ::-webkit-scrollbar { width: 5px; }
                #xy-super-console ::-webkit-scrollbar-track { background: transparent; }
                #xy-super-console ::-webkit-scrollbar-thumb { background: rgba(71,85,105,0.4); border-radius: 10px; }
                #xy-super-console ::-webkit-scrollbar-thumb:hover { background: rgba(71,85,105,0.7); }
                #xy-main-body { min-height:0; }
                #xy-main-body > * { flex-shrink: 0 !important; }
                .xy-panel { background: var(--xy-surface2); border: 1px solid var(--xy-border); border-radius: 12px; padding: 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); flex-shrink: 0; }
                .xy-dl-progress-card { min-width: 0; overflow: hidden; padding: 10px 11px; border: 1px solid var(--xy-border); border-radius: 10px; background: linear-gradient(135deg, rgba(52,211,153,0.08), rgba(99,102,241,0.07)); }
                .xy-dl-progress-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; margin-bottom: 7px; }
                .xy-dl-progress-summary { display: flex; align-items: center; gap: 6px; min-width: 0; }
                .xy-dl-progress-state { flex-shrink: 0; padding: 2px 6px; border-radius: 999px; background: rgba(52,211,153,0.14); color: var(--xy-success); font-size: 10px; font-weight: 700; line-height: 1.4; }
                .xy-dl-progress-count, .xy-dl-progress-percent { flex-shrink: 0; color: var(--xy-text2); font-size: 10px; font-weight: 700; white-space: nowrap; }
                .xy-dl-progress-percent { margin-left: auto; color: var(--xy-accent); }
                .xy-dl-progress-file { display: block; min-width: 0; margin-bottom: 7px; overflow: hidden; color: var(--xy-text); font-size: 11px; font-weight: 600; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
                .xy-dl-progress-track { width: 100%; height: 7px; overflow: hidden; border-radius: 999px; background: rgba(148,163,184,0.22); }
                .xy-dl-progress-fill { width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #34d399, #818cf8); transition: width 0.25s ease; }
                .xy-dl-progress-foot { display: flex; align-items: center; gap: 6px; min-width: 0; margin-top: 7px; }
                .xy-dl-progress-detail { min-width: 0; overflow: hidden; color: var(--xy-text-muted); font-size: 10px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
                .xy-dl-progress-actions { display: flex; flex-shrink: 0; gap: 4px; margin-left: auto; }
                .xy-dl-progress-action { flex-shrink: 0; padding: 3px 6px; border-radius: 6px; font-size: 10px; line-height: 1.3; white-space: nowrap; }
                .xy-dl-progress-action.xy-dl-stop { color: var(--xy-danger); border-color: rgba(248,113,113,0.28); background: rgba(248,113,113,0.08); }
                .xy-panel-title { font-size: 13px; font-weight: 600; color: var(--xy-text2); margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                .xy-mode-btn { padding: 10px 8px; border-radius: 8px; border: 1px solid var(--xy-border); background: rgba(30,41,59,0.5); color: var(--xy-text2); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }
                .xy-mode-btn:hover { background: rgba(51,65,85,0.6); border-color: rgba(99,102,241,0.3); color: var(--xy-text); }
                .xy-mode-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(79,70,229,0.25)); color: var(--xy-text); border-color: rgba(129,140,248,0.5); box-shadow: 0 0 12px rgba(99,102,241,0.15); }
                .xy-action-btn { padding: 11px; border-radius: 8px; color: var(--xy-text); font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; background: rgba(51,65,85,0.5); border: 1px solid var(--xy-border); box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
                .xy-action-btn:hover { background: rgba(71,85,105,0.5); border-color: rgba(129,140,248,0.3); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                .xy-action-btn.active-guard { background: linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.15)); border-color: rgba(52,211,153,0.4); }
                .xy-action-btn.inactive-guard { background: rgba(51,65,85,0.4); border-color: var(--xy-border); color: var(--xy-text-muted); }
                .xy-mini-btn { background: rgba(51,65,85,0.4); color: var(--xy-text2); border-radius: 7px; padding: 7px 11px; font-size: 12px; font-weight: 600; border: 1px solid var(--xy-border); cursor:pointer; transition: all 0.2s; }
                .xy-mini-btn:hover { background: rgba(71,85,105,0.5); color: var(--xy-text); border-color: rgba(129,140,248,0.3); transform: translateY(-1px); }
                .xy-seg { display: flex; padding: 3px; gap: 3px; background: rgba(15,23,42,0.6); border: 1px solid var(--xy-border); border-radius: 11px; flex-shrink: 0; }
                .xy-seg-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 2px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--xy-text2); cursor: pointer; white-space: nowrap; user-select: none; transition: all 0.15s; min-width: 0; }
                .xy-seg-item:hover { color: var(--xy-text); background: rgba(71,85,105,0.3); }
                .xy-seg-item.active { color: #a5b4fc; background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(79,70,229,0.25)); box-shadow: 0 0 12px rgba(99,102,241,0.15); }
                .xy-seg-item.is-new { color: var(--xy-success); }
                .xy-seg-item.is-new .xy-seg-dot { display: inline-block; }
                .xy-seg-item.is-checking { opacity: 0.65; pointer-events: none; }
                .xy-seg-dot { display: none; width: 6px; height: 6px; border-radius: 99px; background: #34d399; box-shadow: 0 0 8px rgba(52,211,153,0.9); flex-shrink: 0; }
                .xy-stat-box { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(145deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04)); border: 1px solid rgba(52,211,153,0.18); padding: 14px 18px; border-radius: 12px; }
                .xy-section-hdr { transition: all 0.2s; }
                .xy-section-hdr:hover { color: var(--xy-text) !important; }
                .xy-input-box { width: 100%; border: 1px solid var(--xy-border); border-radius: 8px; padding: 9px 13px; font-size: 13px; text-align: center; outline: none; background: rgba(15,23,42,0.6); color: var(--xy-text); transition: all 0.2s; }
                .xy-input-box::placeholder { color: var(--xy-text-muted); }
                .xy-input-box:focus { border-color: var(--xy-accent); box-shadow: 0 0 0 3px rgba(99,102,241,0.15); background: rgba(15,23,42,0.8); }
                .xy-target-item:hover { background: rgba(51,65,85,0.5) !important; border-color: rgba(129,140,248,0.3) !important; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important; }
                .xy-divider { height: 1px; background: var(--xy-border); margin: 8px 0; }
                .xy-badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.3px; }
                .xy-badge-info { background: rgba(129,140,248,0.15); color: #a5b4fc; border: 1px solid rgba(129,140,248,0.25); }
                .xy-badge-success { background: rgba(52,211,153,0.12); color: #6ee7b7; border: 1px solid rgba(52,211,153,0.2); }
                .xy-badge-warning { background: rgba(251,191,36,0.12); color: #fcd34d; border: 1px solid rgba(251,191,36,0.2); }
                #xy-super-console .xy-overview-icon { display:none; align-items:center; justify-content:center; cursor:pointer; padding:4px 6px; border:0; border-radius:6px; background:transparent; color:var(--xy-text-muted); font:inherit; font-size:14px; line-height:1; transition:all 0.2s; }
                #xy-super-console .xy-overview-icon:hover { background:rgba(71,85,105,0.28); color:var(--xy-text); }
                #xy-super-console .xy-overview-view { flex:1 1 auto !important; flex-shrink:0 !important; min-height:220px; overflow:hidden; border:1px solid var(--xy-border); border-radius:12px; color:var(--xy-text); background:var(--xy-surface); }
                #xy-super-console .xy-overview-head { display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid var(--xy-border); background:linear-gradient(135deg, color-mix(in srgb, var(--xy-accent) 9%, var(--xy-surface2)), var(--xy-surface2)); flex-shrink:0; }
                #xy-super-console .xy-overview-heading { flex:1; min-width:0; }
                #xy-super-console .xy-overview-heading strong { display:block; overflow:hidden; color:var(--xy-text); font-size:13px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-overview-updated { display:block; margin-top:2px; color:var(--xy-text-muted); font-size:9.5px; }
                #xy-super-console .xy-overview-content { flex:1 1 auto; min-height:0; padding:10px; overflow-y:auto; scrollbar-gutter:stable; background:color-mix(in srgb, var(--xy-surface2) 46%, transparent); }
                #xy-super-console .xy-overview-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; }
                #xy-super-console .xy-overview-panel { min-width:0; margin-bottom:8px; padding:10px; overflow:hidden; border:1px solid var(--xy-border); border-radius:10px; background:var(--xy-surface2); box-shadow:0 1px 2px rgba(15,23,42,0.08); }
                #xy-super-console .xy-overview-grid .xy-overview-panel { margin-bottom:0; }
                #xy-super-console .xy-overview-metric-title { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:7px; color:var(--xy-text2); font-size:10px; font-weight:750; letter-spacing:0.25px; }
                #xy-super-console .xy-overview-metric-rate { flex-shrink:0; padding:2px 5px; border-radius:999px; color:var(--xy-success); background:color-mix(in srgb, var(--xy-success) 12%, transparent); font-size:9px; font-variant-numeric:tabular-nums; letter-spacing:0; }
                #xy-super-console .xy-overview-value { display:flex; align-items:baseline; min-height:25px; color:var(--xy-text); font-size:19px; font-weight:780; font-variant-numeric:tabular-nums; line-height:1.2; letter-spacing:-0.25px; }
                #xy-super-console .xy-overview-study-value { font-size:16px; font-weight:720; letter-spacing:0; }
                #xy-super-console .xy-overview-value-suffix { color:var(--xy-text-muted); font-size:11px; font-weight:650; letter-spacing:0; }
                #xy-super-console .xy-overview-metric-caption { display:flex; flex-wrap:wrap; gap:3px 7px; margin-top:7px; color:var(--xy-text-muted); font-size:9px; line-height:1.4; }
                #xy-super-console .xy-overview-metric-caption span + span::before { margin-right:7px; color:var(--xy-border); content:'·'; }
                #xy-super-console .xy-overview-meta { margin-top:6px; color:var(--xy-text-muted); font-size:9.5px; line-height:1.45; }
                #xy-super-console .xy-overview-progress { width:100%; height:6px; margin-top:8px; overflow:hidden; border-radius:999px; background:rgba(148,163,184,0.22); }
                #xy-super-console .xy-overview-progress-fill { height:100%; border-radius:inherit; background:var(--xy-success); transition:width 0.25s ease; }
                #xy-super-console .xy-overview-panel-title { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; color:var(--xy-text2); font-size:11px; font-weight:700; }
                #xy-super-console .xy-overview-count { color:var(--xy-text-muted); font-size:9.5px; font-weight:600; }
                #xy-super-console .xy-overview-focus { display:flex; align-items:flex-start; gap:9px; border-color:color-mix(in srgb, var(--xy-accent) 30%, var(--xy-border)); background:linear-gradient(135deg, color-mix(in srgb, var(--xy-accent) 13%, var(--xy-surface2)), var(--xy-surface2)); }
                #xy-super-console .xy-overview-focus-icon { display:grid; flex:0 0 28px; width:28px; height:28px; place-items:center; border-radius:9px; background:color-mix(in srgb, var(--xy-accent) 18%, transparent); font-size:14px; }
                #xy-super-console .xy-overview-focus-content { min-width:0; flex:1; }
                #xy-super-console .xy-overview-focus .xy-overview-panel-title { margin-bottom:3px; }
                #xy-super-console .xy-overview-focus-title { overflow:hidden; color:var(--xy-text); font-size:11.5px; font-weight:750; line-height:1.45; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-overview-task-panel { padding:0; }
                #xy-super-console .xy-overview-task-panel > .xy-overview-panel-title { margin:0; padding:11px 12px 9px; border-bottom:1px solid var(--xy-border); }
                #xy-super-console .xy-overview-task-details > summary { cursor:pointer; list-style:none; }
                #xy-super-console .xy-overview-task-details > summary::-webkit-details-marker { display:none; }
                #xy-super-console .xy-overview-task-details > summary::after { content:'⌄'; margin-left:4px; color:var(--xy-text-muted); font-size:13px; transition:transform 0.16s ease; }
                #xy-super-console .xy-overview-task-details[open] > summary::after { transform:rotate(180deg); }
                #xy-super-console .xy-overview-task-list { max-height:none; overflow-y:visible; }
                #xy-super-console .xy-overview-task { display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; padding:10px 12px; border:0; border-bottom:1px solid var(--xy-border); border-radius:0; background:transparent; color:var(--xy-text); cursor:pointer; text-align:left; }
                #xy-super-console .xy-overview-task:last-child { border-bottom:0; }
                #xy-super-console .xy-overview-task:hover { background:color-mix(in srgb, var(--xy-accent) 8%, transparent); }
                #xy-super-console .xy-overview-task:active { transform:none !important; }
                #xy-super-console .xy-overview-task.is-disabled { cursor:default; opacity:0.65; }
                #xy-super-console .xy-overview-task-main { min-width:0; }
                #xy-super-console .xy-overview-task-title { display:block; overflow:hidden; color:var(--xy-text); font-size:11px; font-weight:650; line-height:1.45; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-overview-task-score { display:block; margin-top:3px; color:var(--xy-text-muted); font-size:10px; font-variant-numeric:tabular-nums; }
                #xy-super-console .xy-overview-status { flex-shrink:0; padding:3px 7px; border:1px solid currentColor; border-radius:999px; font-size:9.5px; font-weight:700; line-height:1.2; }
                #xy-super-console .xy-overview-status.is-graded { color:var(--xy-success); background:color-mix(in srgb, var(--xy-success) 12%, transparent); }
                #xy-super-console .xy-overview-status.is-pending { color:var(--xy-warning); background:color-mix(in srgb, var(--xy-warning) 12%, transparent); }
                #xy-super-console .xy-overview-status.is-actionable { color:var(--xy-warning); background:color-mix(in srgb, var(--xy-warning) 12%, transparent); }
                #xy-super-console .xy-overview-status.is-expired { color:var(--xy-danger); background:color-mix(in srgb, var(--xy-danger) 12%, transparent); }
                #xy-super-console .xy-overview-status.is-unsubmitted { color:var(--xy-danger); background:color-mix(in srgb, var(--xy-danger) 12%, transparent); }
                #xy-super-console .xy-overview-empty { padding:14px 4px; color:var(--xy-text-muted); font-size:11px; text-align:center; }
                #xy-super-console .xy-overview-error { color:var(--xy-danger); font-size:10.5px; line-height:1.6; }
                #xy-super-console .xy-overview-error .xy-overview-panel-title { color:var(--xy-text2); }
                #xy-super-console .xy-overview-loading { display:flex; align-items:center; justify-content:center; gap:9px; min-height:180px; color:var(--xy-text2); font-size:11px; }
                #xy-super-console .xy-overview-spinner { width:16px; height:16px; border:2px solid color-mix(in srgb, var(--xy-accent) 22%, transparent); border-top-color:var(--xy-accent); border-radius:50%; animation:xy-overview-spin 0.8s linear infinite; }
                #xy-super-console .xy-today-prompt { display:flex; align-items:flex-start; gap:10px; border-color:color-mix(in srgb, var(--xy-accent) 26%, var(--xy-border)); background:linear-gradient(135deg, color-mix(in srgb, var(--xy-accent) 10%, var(--xy-surface2)), var(--xy-surface2)); }
                #xy-super-console .xy-today-prompt-icon { display:grid; flex:0 0 30px; width:30px; height:30px; place-items:center; border-radius:10px; color:var(--xy-accent); background:color-mix(in srgb, var(--xy-accent) 13%, transparent); font-size:15px; }
                #xy-super-console .xy-today-prompt-copy { flex:1; min-width:0; }
                #xy-super-console .xy-today-prompt .xy-overview-panel-title { margin-bottom:4px; }
                #xy-super-console .xy-today-prompt-title, #xy-super-console .xy-course-dashboard-today-title { color:var(--xy-text); font-size:12px; font-weight:760; line-height:1.48; overflow-wrap:anywhere; word-break:break-word; }
                #xy-super-console .xy-today-prompt-state { flex:0 0 auto; padding:2px 6px; border:1px solid currentColor; border-radius:999px; color:var(--xy-accent); background:color-mix(in srgb, var(--xy-accent) 10%, transparent); font-size:9px; font-weight:750; line-height:1.25; white-space:nowrap; }
                #xy-super-console .xy-today-prompt-reasons { display:flex; flex-wrap:wrap; gap:4px; margin-top:7px; min-width:0; }
                #xy-super-console .xy-today-prompt-reason { min-width:0; padding:2px 6px; border-radius:999px; color:var(--xy-text-muted); background:color-mix(in srgb, var(--xy-text-muted) 10%, transparent); font-size:8.5px; font-weight:650; line-height:1.3; overflow-wrap:anywhere; word-break:break-word; }
                #xy-super-console .xy-today-prompt-steps { display:grid; gap:5px; margin-top:8px; }
                #xy-super-console .xy-today-prompt-step { display:flex; width:100%; min-width:0; align-items:center; gap:7px; padding:7px 8px; border:1px solid color-mix(in srgb, var(--xy-accent) 18%, var(--xy-border)); border-radius:8px; background:color-mix(in srgb, var(--xy-accent) 5%, transparent); color:var(--xy-text); cursor:pointer; text-align:left; font:inherit; }
                #xy-super-console .xy-today-prompt-step:hover { border-color:color-mix(in srgb, var(--xy-accent) 48%, var(--xy-border)); background:color-mix(in srgb, var(--xy-accent) 10%, transparent); }
                #xy-super-console .xy-today-prompt-step.is-disabled { cursor:default; opacity:0.62; }
                #xy-super-console .xy-today-prompt-step-index { display:grid; flex:0 0 18px; width:18px; height:18px; place-items:center; border-radius:50%; color:var(--xy-accent); background:color-mix(in srgb, var(--xy-accent) 14%, transparent); font-size:9px; font-weight:750; }
                #xy-super-console .xy-today-prompt-step-copy { flex:1; min-width:0; }
                #xy-super-console .xy-today-prompt-step-copy strong, #xy-super-console .xy-today-prompt-step-copy small { display:block; min-width:0; overflow-wrap:anywhere; word-break:break-word; }
                #xy-super-console .xy-today-prompt-step-copy strong { color:var(--xy-text); font-size:10px; font-weight:700; line-height:1.4; }
                #xy-super-console .xy-today-prompt-step-copy small { margin-top:1px; color:var(--xy-text-muted); font-size:8.5px; line-height:1.35; }
                #xy-super-console .xy-today-prompt-step-go { flex:0 0 auto; color:var(--xy-accent); font-size:9px; font-weight:700; white-space:nowrap; }
                #xy-super-console .xy-today-prompt-counts { display:flex; flex-wrap:wrap; gap:4px 8px; margin-top:8px; color:var(--xy-text-muted); font-size:8.5px; font-variant-numeric:tabular-nums; line-height:1.35; }
                #xy-super-console .xy-today-prompt.is-urgent, #xy-super-console .xy-course-dashboard-today.is-urgent { border-color:color-mix(in srgb, var(--xy-warning) 46%, var(--xy-border)); }
                #xy-super-console .xy-today-prompt.is-urgent .xy-today-prompt-icon, #xy-super-console .xy-today-prompt.is-urgent .xy-today-prompt-state { color:var(--xy-warning); background:color-mix(in srgb, var(--xy-warning) 13%, transparent); }
                #xy-super-console .xy-today-prompt.is-waiting .xy-today-prompt-icon, #xy-super-console .xy-today-prompt.is-waiting .xy-today-prompt-state { color:var(--xy-warning); background:color-mix(in srgb, var(--xy-warning) 11%, transparent); }
                #xy-super-console .xy-today-prompt.is-history .xy-today-prompt-icon, #xy-super-console .xy-today-prompt.is-unknown .xy-today-prompt-icon, #xy-super-console .xy-today-prompt.is-partial .xy-today-prompt-icon { color:var(--xy-text-muted); background:color-mix(in srgb, var(--xy-text-muted) 11%, transparent); }
                #xy-super-console .xy-today-prompt.is-clear .xy-today-prompt-icon, #xy-super-console .xy-today-prompt.is-clear .xy-today-prompt-state { color:var(--xy-success); background:color-mix(in srgb, var(--xy-success) 12%, transparent); }
                #xy-super-console .xy-course-dashboard-today { min-width:0; margin-bottom:9px; padding:10px; border:1px solid color-mix(in srgb, var(--xy-accent) 25%, var(--xy-border)); border-radius:10px; background:linear-gradient(135deg, color-mix(in srgb, var(--xy-accent) 9%, var(--xy-surface2)), var(--xy-surface2)); box-shadow:0 1px 2px rgba(15,23,42,0.07); }
                #xy-super-console .xy-course-dashboard-today-head { display:flex; align-items:center; justify-content:space-between; gap:8px; min-width:0; color:var(--xy-text2); font-size:10px; }
                #xy-super-console .xy-course-dashboard-today-head > div { display:flex; min-width:0; align-items:center; gap:5px; }
                #xy-super-console .xy-course-dashboard-today-head strong { color:var(--xy-text2); font-size:11px; font-weight:750; }
                #xy-super-console .xy-course-dashboard-today-head > span { flex:0 0 auto; padding:2px 6px; border-radius:999px; color:var(--xy-accent); background:color-mix(in srgb, var(--xy-accent) 10%, transparent); font-size:8.5px; font-weight:700; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-today-icon { color:var(--xy-accent); font-size:13px; }
                #xy-super-console .xy-course-dashboard-today-meta { margin-top:4px; color:var(--xy-text-muted); font-size:9px; line-height:1.45; overflow-wrap:anywhere; word-break:break-word; }
                #xy-super-console .xy-course-dashboard-today-actions { display:grid; gap:5px; margin-top:8px; }
                #xy-super-console .xy-course-dashboard-today-action { display:flex; align-items:center; justify-content:space-between; gap:7px; min-width:0; padding:7px 8px; border:1px solid color-mix(in srgb, var(--xy-accent) 14%, var(--xy-border)); border-radius:8px; background:color-mix(in srgb, var(--xy-surface) 60%, transparent); }
                #xy-super-console .xy-course-dashboard-today-action-copy { flex:1; min-width:0; }
                #xy-super-console .xy-course-dashboard-today-action-copy strong, #xy-super-console .xy-course-dashboard-today-action-copy span { display:block; min-width:0; overflow-wrap:anywhere; word-break:break-word; }
                #xy-super-console .xy-course-dashboard-today-action-copy strong { color:var(--xy-text); font-size:9.5px; font-weight:700; line-height:1.4; }
                #xy-super-console .xy-course-dashboard-today-action-copy span { margin-top:2px; color:var(--xy-text-muted); font-size:8.5px; line-height:1.35; }
                #xy-super-console .xy-course-dashboard-today-action-buttons { display:flex; flex:0 0 auto; flex-wrap:wrap; justify-content:flex-end; gap:4px; }
                #xy-super-console .xy-course-dashboard-today.is-urgent .xy-course-dashboard-today-head > span, #xy-super-console .xy-course-dashboard-today.is-urgent .xy-course-dashboard-today-icon { color:var(--xy-warning); background:color-mix(in srgb, var(--xy-warning) 12%, transparent); }
                #xy-super-console .xy-course-dashboard-today.is-clear .xy-course-dashboard-today-head > span, #xy-super-console .xy-course-dashboard-today.is-clear .xy-course-dashboard-today-icon { color:var(--xy-success); background:color-mix(in srgb, var(--xy-success) 12%, transparent); }
                #xy-super-console .xy-course-dashboard-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:9px; }
                #xy-super-console .xy-course-dashboard-head > div { min-width:0; }
                #xy-super-console .xy-course-dashboard-head strong { display:block; color:var(--xy-text); font-size:13px; font-weight:750; }
                #xy-super-console .xy-course-dashboard-head span { display:block; margin-top:2px; color:var(--xy-text-muted); font-size:9.5px; }
                #xy-super-console .xy-course-dashboard-summary { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:9px; }
                #xy-super-console .xy-course-dashboard-metric { min-width:0; padding:9px 10px; border:1px solid var(--xy-border); border-radius:9px; background:var(--xy-surface2); }
                #xy-super-console .xy-course-dashboard-metric span { display:block; color:var(--xy-text-muted); font-size:9.5px; line-height:1.3; }
                #xy-super-console .xy-course-dashboard-metric strong { display:block; margin-top:3px; overflow:hidden; color:var(--xy-text); font-size:14px; font-weight:750; line-height:1.35; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-tools { display:flex; align-items:center; gap:7px; margin-bottom:9px; }
                #xy-super-console .xy-course-dashboard-search { min-width:0; flex:1; height:31px; padding:0 9px; border:1px solid var(--xy-border); border-radius:8px; outline:0; background:var(--xy-surface2); color:var(--xy-text); font-size:10.5px; }
                #xy-super-console .xy-course-dashboard-search::placeholder { color:var(--xy-text-muted); }
                #xy-super-console .xy-course-dashboard-search:focus { border-color:var(--xy-accent); box-shadow:0 0 0 2px color-mix(in srgb, var(--xy-accent) 14%, transparent); }
                #xy-super-console .xy-course-dashboard-filters { display:flex; flex-shrink:0; padding:2px; border:1px solid var(--xy-border); border-radius:8px; background:var(--xy-surface2); }
                #xy-super-console .xy-course-dashboard-filter { min-width:31px; padding:5px 6px; border:0; border-radius:6px; background:transparent; color:var(--xy-text-muted); cursor:pointer; font-size:9.5px; line-height:1; }
                #xy-super-console .xy-course-dashboard-filter.is-active { background:color-mix(in srgb, var(--xy-accent) 14%, transparent); color:var(--xy-accent); font-weight:700; }
                #xy-super-console .xy-course-dashboard-filter:disabled { cursor:not-allowed; opacity:0.45; }
                #xy-super-console .xy-course-dashboard-list { min-width:0; border:1px solid var(--xy-border); border-radius:10px; background:var(--xy-surface2); }
                #xy-super-console .xy-course-dashboard-course { padding:11px 12px; border-bottom:1px solid var(--xy-border); transition:background 0.18s; }
                #xy-super-console .xy-course-dashboard-course:last-child { border-bottom:0; }
                #xy-super-console .xy-course-dashboard-course:hover { background:color-mix(in srgb, var(--xy-accent) 6%, transparent); }
                #xy-super-console .xy-course-dashboard-course-main { display:block; border-radius:7px; outline:0; cursor:pointer; }
                #xy-super-console .xy-course-dashboard-course-main:focus-visible { box-shadow:0 0 0 2px color-mix(in srgb, var(--xy-accent) 55%, transparent); }
                #xy-super-console .xy-course-dashboard-course-head { display:flex; align-items:flex-start; justify-content:space-between; gap:9px; }
                #xy-super-console .xy-course-dashboard-course-head strong { display:-webkit-box; min-width:0; overflow:hidden; color:var(--xy-text); font-size:11.5px; font-weight:700; line-height:1.45; text-wrap:pretty; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
                #xy-super-console .xy-course-dashboard-status { flex-shrink:0; padding:3px 7px; border:1px solid currentColor; border-radius:999px; font-size:9px; font-weight:700; line-height:1.1; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-status.is-pending { color:var(--xy-warning); background:color-mix(in srgb, var(--xy-warning) 10%, transparent); }
                #xy-super-console .xy-course-dashboard-status.is-complete { color:var(--xy-success); background:color-mix(in srgb, var(--xy-success) 10%, transparent); }
                #xy-super-console .xy-course-dashboard-status.is-expired { color:var(--xy-danger); background:color-mix(in srgb, var(--xy-danger) 10%, transparent); }
                #xy-super-console .xy-course-dashboard-status.is-empty,
                #xy-super-console .xy-course-dashboard-status.is-idle,
                #xy-super-console .xy-course-dashboard-status.is-unknown { color:var(--xy-text-muted); background:color-mix(in srgb, var(--xy-text-muted) 10%, transparent); }
                #xy-super-console .xy-course-dashboard-term { margin-top:2px; color:var(--xy-text-muted); font-size:9px; }
                #xy-super-console .xy-course-dashboard-progress { height:5px; margin-top:8px; overflow:hidden; border-radius:999px; background:color-mix(in srgb, var(--xy-text-muted) 20%, transparent); }
                #xy-super-console .xy-course-dashboard-progress span { display:block; height:100%; border-radius:inherit; background:var(--xy-success); transition:width 0.22s ease; }
                #xy-super-console .xy-course-dashboard-course-meta { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px 8px; margin-top:6px; color:var(--xy-text-muted); font-size:9.5px; line-height:1.4; }
                #xy-super-console .xy-course-dashboard-course-meta.is-error { color:var(--xy-danger); }
                #xy-super-console .xy-course-dashboard-deadline { margin-top:5px; color:var(--xy-warning); font-size:9.5px; }
                #xy-super-console .xy-course-dashboard-actions { display:flex; justify-content:flex-end; gap:6px; margin-top:8px; }
                #xy-super-console .xy-course-dashboard-actions .xy-mini-btn { min-height:27px; padding:4px 9px; font-size:9.5px; }
                #xy-super-console .xy-course-dashboard-details-wrap { margin-top:9px; border-top:1px solid var(--xy-border); padding-top:8px; }
                #xy-super-console .xy-course-dashboard-details-toggle { display:flex; width:100%; align-items:center; justify-content:space-between; gap:8px; padding:0; border:0; background:transparent; color:var(--xy-text2); cursor:pointer; font:inherit; font-size:9.5px; text-align:left; }
                #xy-super-console .xy-course-dashboard-details-toggle > span:first-child { color:var(--xy-accent); font-weight:750; }
                #xy-super-console .xy-course-dashboard-details-toggle > span:last-child { overflow:hidden; color:var(--xy-text-muted); text-align:right; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-details-toggle::after { content:'⌄'; flex-shrink:0; color:var(--xy-text-muted); font-size:12px; transition:transform 0.16s ease; }
                #xy-super-console .xy-course-dashboard-details-toggle[aria-expanded="true"]::after { transform:rotate(180deg); }
                #xy-super-console .xy-course-dashboard-details { margin-top:8px; }
                #xy-super-console .xy-course-dashboard-details-state { display:flex; min-height:42px; align-items:center; justify-content:center; gap:7px; border:1px dashed var(--xy-border); border-radius:8px; color:var(--xy-text-muted); font-size:9.5px; }
                #xy-super-console .xy-course-dashboard-details-state .xy-overview-spinner { width:12px; height:12px; }
                #xy-super-console .xy-course-dashboard-details-state.is-error { flex-direction:column; padding:8px; color:var(--xy-danger); }
                #xy-super-console .xy-course-dashboard-details-state .xy-mini-btn { min-height:24px; padding:3px 8px; font-size:9px; }
                #xy-super-console .xy-course-dashboard-task-groups { display:flex; flex-direction:column; gap:6px; }
                #xy-super-console .xy-course-dashboard-task-group { --xy-task-accent:var(--xy-text-muted); overflow:hidden; border:1px solid color-mix(in srgb, var(--xy-task-accent) 25%, var(--xy-border)); border-radius:8px; background:color-mix(in srgb, var(--xy-task-accent) 5%, var(--xy-surface2)); }
                #xy-super-console .xy-course-dashboard-task-group.is-completed { --xy-task-accent:var(--xy-success); }
                #xy-super-console .xy-course-dashboard-task-group.is-actionable { --xy-task-accent:var(--xy-warning); }
                #xy-super-console .xy-course-dashboard-task-group.is-expired { --xy-task-accent:var(--xy-danger); }
                #xy-super-console .xy-course-dashboard-task-group.is-uncertain { --xy-task-accent:#8b7aa8; }
                #xy-super-console .xy-course-dashboard-task-group summary { display:flex; align-items:center; justify-content:space-between; padding:6px 8px; color:var(--xy-task-accent); cursor:pointer; font-size:9.5px; font-weight:750; list-style:none; }
                #xy-super-console .xy-course-dashboard-task-group summary::-webkit-details-marker { display:none; }
                #xy-super-console .xy-course-dashboard-task-group summary::after { content:'⌃'; margin-left:5px; font-size:10px; }
                #xy-super-console .xy-course-dashboard-task-group:not([open]) summary::after { content:'⌄'; }
                #xy-super-console .xy-course-dashboard-task-group summary em { margin-left:auto; color:var(--xy-text-muted); font-size:9px; font-style:normal; font-weight:600; }
                #xy-super-console .xy-course-dashboard-task-list { display:flex; min-width:0; flex-direction:column; border-top:1px solid color-mix(in srgb, var(--xy-task-accent) 18%, var(--xy-border)); background:var(--xy-surface); }
                #xy-super-console .xy-course-dashboard-task { display:grid; grid-template-columns:minmax(0, 1fr) auto auto; align-items:center; gap:6px; width:100%; padding:7px 8px; border:0; border-bottom:1px solid var(--xy-border); background:transparent; color:var(--xy-text); cursor:pointer; font:inherit; font-size:9.5px; text-align:left; }
                #xy-super-console .xy-course-dashboard-task:last-of-type { border-bottom:0; }
                #xy-super-console .xy-course-dashboard-task:hover:not(:disabled) { background:color-mix(in srgb, var(--xy-accent) 8%, transparent); }
                #xy-super-console .xy-course-dashboard-task:focus-visible { position:relative; z-index:1; outline:2px solid color-mix(in srgb, var(--xy-accent) 70%, transparent); outline-offset:-2px; }
                #xy-super-console .xy-course-dashboard-task.is-static { cursor:default; opacity:0.82; }
                #xy-super-console .xy-course-dashboard-task-title { overflow:hidden; font-weight:650; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-task-meta { color:var(--xy-text-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-task-status { color:var(--xy-task-accent, var(--xy-text-muted)); font-weight:700; white-space:nowrap; }
                #xy-super-console .xy-course-dashboard-task-note { padding:7px 8px; color:var(--xy-text-muted); font-size:9px; line-height:1.55; }
                #xy-super-console .xy-course-dashboard-state { display:flex; min-height:150px; padding:22px 16px; align-items:center; justify-content:center; flex-direction:column; gap:9px; color:var(--xy-text-muted); font-size:10.5px; line-height:1.6; text-align:center; }
                #xy-super-console .xy-course-dashboard-state strong { color:var(--xy-text2); font-size:11.5px; }
                #xy-super-console .xy-course-dashboard-state.is-error span { color:var(--xy-danger); }
                @keyframes xy-overview-spin { to { transform:rotate(360deg); } }
                /* ── 面板缩放热区：贴边隐形把手（上/下/左/右/四角），z-index 高于内容 ── */
                #xy-super-console .xy-rs-edge { position: absolute; z-index: 9999; }
                #xy-super-console .xy-rs-edge-n { top: 0; left: 14px; right: 14px; height: 7px; cursor: n-resize; }
                #xy-super-console .xy-rs-edge-s { bottom: 0; left: 14px; right: 14px; height: 7px; cursor: s-resize; }
                #xy-super-console .xy-rs-edge-w { left: 0; top: 14px; bottom: 14px; width: 7px; cursor: w-resize; }
                #xy-super-console .xy-rs-edge-e { right: 0; top: 14px; bottom: 14px; width: 7px; cursor: e-resize; }
                #xy-super-console .xy-rs-edge-nw { top: 0; left: 0; width: 15px; height: 15px; cursor: nwse-resize; }
                #xy-super-console .xy-rs-edge-ne { top: 0; right: 0; width: 15px; height: 15px; cursor: nesw-resize; }
                #xy-super-console .xy-rs-edge-sw { bottom: 0; left: 0; width: 15px; height: 15px; cursor: nesw-resize; }
                #xy-super-console .xy-rs-edge-se { bottom: 0; right: 0; width: 15px; height: 15px; cursor: nwse-resize; }
                /* ── 右下角可见缩放 grip：斜线纹理（主题变量取色），hover 提亮 ── */
                #xy-super-console .xy-rs-grip { position: absolute; right: 5px; bottom: 5px; width: 16px; height: 16px; z-index: 10000; cursor: nwse-resize; border-radius: 4px; opacity: 0.45; transition: opacity 0.2s; background-image: repeating-linear-gradient(135deg, transparent 0, transparent 3px, var(--xy-text-muted) 3px, var(--xy-text-muted) 4px); }
                #xy-super-console .xy-rs-grip:hover { opacity: 0.95; }
            </style>
            
            <div id="xy-drag-handle" style="padding: 14px 18px 12px 18px; background: rgba(15,23,42,0.5); border-bottom: 1px solid var(--xy-border); cursor: grab; display: flex; flex-direction: column; gap: 10px; user-select: none;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 700; color: ${T('#e2e8f0','#0f172a')}; font-size: 15px; display:flex; align-items:center; gap:8px;">
                         小雅辅助工具
                         <span class="xy-badge xy-badge-success">v${SCRIPT_VERSION}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:2px;">
                        <button id="xy-overview-open" class="xy-overview-icon" type="button" title="课程学习数据概览" aria-label="打开课程学习数据概览">📊</button>
                        <div id="xy-theme-toggle" style="cursor: pointer; color: ${T('#64748b','#94a3b8')}; padding: 4px 6px; border-radius: 6px; font-size: 14px; transition: 0.2s;" onmouseover="this.style.background='${T('rgba(71,85,105,0.4)','#f1f5f9')}';" onmouseout="this.style.background='transparent';">🌙</div>
                        <div id="xy-minimize" style="cursor: pointer; color: ${T('#64748b','#94a3b8')}; padding: 4px 7px; border-radius: 6px; font-size: 14px; transition: 0.2s; font-weight:700;" onmouseover="this.style.background='${T('rgba(71,85,105,0.4)','#f1f5f9')}'; this.style.color='${T('#e2e8f0','#0f172a')}';" onmouseout="this.style.background='transparent'; this.style.color='${T('#64748b','#94a3b8')}';">⊟</div>
                    </div>
                </div>
                <div id="xy-handle-row2" class="xy-seg">
                    <div id="xy-seg-zone" class="xy-seg-item active" title="当前区域">🛰️ 小雅引擎</div>
                    <div id="xy-seg-feedback" class="xy-seg-item" title="反馈问题或建议">💬 反馈</div>
                    <div id="xy-seg-qq" class="xy-seg-item" title="点击复制QQ群号">👥 QQ群</div>
                    <div id="xy-seg-update" class="xy-seg-item" title="检查脚本更新">↻ 检查更新<span class="xy-seg-dot"></span></div>
                </div>
            </div>

            <div id="xy-main-body" style="padding: 10px 12px; min-width:0; overflow-x:hidden; overflow-y: auto; overscroll-behavior: contain; display: flex; flex-direction: column; flex: 1; gap: 6px;">

                <div class="xy-panel" style="padding: 0; overflow: hidden; border-color: ${T('rgba(129,140,248,0.15)','#c7d2fe')};">
                    <div id="xy-bc-toggle" style="background: ${T('rgba(99,102,241,0.06)','#eef2ff')}; padding: 10px 16px; font-size: 12px; font-weight: 600; color: ${T('#a5b4fc','#3730a3')}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                        <span>📣 情报站</span>
                        <span id="xy-bc-arrow" style="transition: transform 0.3s; font-size: 10px; color: ${T('#818cf8','#4f46e5')};">▼</span>
                    </div>
                    <div id="xy-bc-content" style="font-size: 12px; color: ${T('#94a3b8','#475569')}; line-height: 1.7; display: none; background: ${T('rgba(15,23,42,0.4)','#f8fafc')}; border-top: 1px solid var(--xy-border); max-height: 180px; overflow-y: auto;">
                        <div style="padding: 12px 16px; display: flex; min-width: 0; align-items: center; gap: 10px;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${T('#818cf8','#6366f1')}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: xy-spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" stroke="${T('#a5b4fc','#4f46e5')}"/></svg>
                            <span style="color:${T('#94a3b8','#64748b')}; font-size:13px;">正在连接云端…</span>
                            <div style="flex:1; height:3px; background:${T('rgba(99,102,241,0.1)','#e0e7ff')}; border-radius:2px; overflow:hidden; max-width:80px;">
                                <div style="width:40%; height:100%; background:linear-gradient(90deg, ${T('#818cf8','#6366f1')}, ${T('#a5b4fc','#818cf8')}); border-radius:2px; animation: xy-indeterminate 1.4s ease-in-out infinite;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="xy-view-courses" style="display:none; flex-direction:column; min-height:0; flex-shrink:0;">
                    <div class="xy-course-dashboard-head">
                        <div>
                            <strong>进行中课程</strong>
                            <span id="xy-course-dashboard-load-state" aria-live="polite">等待加载</span>
                        </div>
                        <button id="xy-course-dashboard-refresh" class="xy-mini-btn" type="button" style="padding:5px 9px; font-size:10px;">刷新</button>
                    </div>
                    <div id="xy-course-dashboard-summary" class="xy-course-dashboard-summary"></div>
                    <div id="xy-course-dashboard-today"></div>
                    <div class="xy-course-dashboard-tools">
                        <input id="xy-course-dashboard-search" class="xy-course-dashboard-search" type="search" aria-label="搜索进行中课程" placeholder="搜索课程">
                        <div id="xy-course-dashboard-filters" class="xy-course-dashboard-filters" role="group" aria-label="筛选课程状态">
                            <button class="xy-course-dashboard-filter is-active" type="button" data-course-filter="all" aria-pressed="true">全部</button>
                            <button class="xy-course-dashboard-filter" type="button" data-course-filter="pending" aria-pressed="false">有待办</button>
                            <button class="xy-course-dashboard-filter" type="button" data-course-filter="no-pending" aria-pressed="false">无待办</button>
                        </div>
                    </div>
                    <div id="xy-course-dashboard-list" class="xy-course-dashboard-list"></div>
                </div>

                <div id="xy-view-overview" class="xy-overview-view" style="display:none; flex-direction:column;">
                    <div class="xy-overview-head">
                        <div class="xy-overview-heading">
                            <strong id="xy-overview-title">课程学习数据概览</strong>
                            <span id="xy-overview-updated" class="xy-overview-updated">等待加载</span>
                        </div>
                        <button id="xy-overview-refresh" class="xy-mini-btn" type="button" style="padding:5px 8px; font-size:10px;">刷新</button>
                    </div>
                    <div id="xy-overview-content" class="xy-overview-content"></div>
                </div>

                <div id="xy-view-dir" style="display:none; flex-shrink: 0;">
                    <div style="display:flex; align-items:center; gap:9px; padding:10px 14px; border-radius:10px; background: ${T('rgba(99,102,241,0.08)','#eef2ff')}; border: 1px solid ${T('rgba(129,140,248,0.22)','#c7d2fe')}; margin-bottom:10px;">
                        <span style="width:8px; height:8px; border-radius:99px; background:#818cf8; box-shadow:0 0 10px rgba(129,140,248,.6); flex-shrink:0;"></span>
                        <span style="font-size:12.5px; font-weight:700; color:${T('#e2e8f0','#0f172a')};">课程目录</span>
                        <span id="xy-dir-status" style="margin-left:auto; font-size:10px; color:${T('#94a3b8','#64748b')};">读取中...</span>
                    </div>
                    <div style="display:flex; gap:8px; margin-bottom:10px;">
                        <button class="xy-action-btn" id="xy-dir-play" style="flex:1; min-height:36px; font-size:12px; background:${T('rgba(16,185,129,0.12)','#ecfdf5')}; border-color:${T('rgba(16,185,129,0.25)','#a7f3d0')}; color:${T('#34d399','#059669')};">▶️ 一键连播</button>
                        <button class="xy-action-btn" id="xy-dir-download" style="flex:1; min-height:36px; font-size:12px; background:${T('rgba(52,211,153,0.12)','#d1fae5')}; border-color:${T('rgba(52,211,153,0.25)','#a7f3d0')}; color:${T('#6ee7b7','#059669')};">📥 下载区</button>
                        <button class="xy-action-btn" id="xy-dir-refresh" style="flex:1; min-height:36px; font-size:12px;">🔄 刷新</button>
                    </div>
                    <div style="max-height:300px; overflow-y:auto; border:1px solid ${T('rgba(71,85,105,0.18)','#e2e8f0')}; border-radius:11px; background:${T('rgba(15,23,42,0.35)','#ffffff')}; padding:4px;" id="xy-dir-list">
                        <div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">正在读取课程目录...</div>
                    </div>
                </div>

                <div id="xy-view-course" style="display:none; flex-shrink: 0;">
                    <div id="xy-status-banner" style="text-align: center; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--xy-border); background: ${T('rgba(30,41,59,0.5)','#f8fafc')}; font-size: 12px; margin-bottom: 10px; font-weight: 600; color: ${T('#94a3b8','#64748b')};">初始化中...</div>

                    <div class="xy-panel" style="padding: 12px;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <button class="xy-mode-btn" id="btn-mode-man">手动休眠</button>
                            <button class="xy-mode-btn" id="btn-mode-loop">安全循环</button>
                            <button class="xy-mode-btn" id="btn-mode-seq">雷达连播</button>
                        </div>
                    </div>

                    <div id="xy-sch-card" style="display:none; margin-bottom:10px; padding:12px 14px; border-radius:10px; border-left:4px solid ${T('#818cf8','#6366f1')}; background:${T('rgba(99,102,241,0.06)','#eef2ff')}; font-size:13px; line-height:1.6;"></div>

                    <div class="xy-panel xy-stat-box" style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: center; align-items: center; width: 100%; text-align: center;">
                            <div>
                                <div style="font-size: 10px; color: ${T('#cbd5e1','#475569')}; font-weight:600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px;">实时挂机</div>
                                <div id="xy-real-time" style="font-size: 28px; font-weight: 700; color: ${T('#34d399','#059669')}; font-family: 'SF Mono', 'JetBrains Mono', Consolas, monospace; line-height: 1; letter-spacing: -0.5px;">0m 00s</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 10px;">
                        <div class="xy-section-hdr" id="xy-hdr-actions" style="font-size:11px; font-weight:600; color:${T('#64748b','#94a3b8')}; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;">
                            <span>核心功能</span><span id="xy-arr-actions" style="font-size:10px; transition:transform 0.25s;">▼</span>
                        </div>
                        <div id="xy-body-actions">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                <button class="xy-action-btn" id="xy-btn-dashboard" style="background:${T('rgba(99,102,241,0.2)','#eef2ff')}; border-color:${T('rgba(129,140,248,0.3)','#c7d2fe')};">🌍 雷达</button>
                                <button class="xy-action-btn" id="xy-btn-schedule" style="background:${T('rgba(251,191,36,0.12)','#fffbeb')}; border-color:${T('rgba(251,191,36,0.25)','#fde68a')}; color:${T('#fcd34d','#92400e')};">📅 调度</button>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                <button class="xy-action-btn" id="xy-btn-download-zone" style="background:${T('rgba(52,211,153,0.1)','#ecfdf5')}; border-color:${T('rgba(52,211,153,0.2)','#a7f3d0')}; color:${T('#6ee7b7','#059669')};">📥 下载</button>
                                <button class="xy-action-btn" id="xy-btn-quick-kill" style="background:${T('rgba(239,68,68,0.12)','#fef2f2')}; border-color:${T('rgba(239,68,68,0.25)','#fecaca')}; color:${T('#f87171','#dc2626')}; font-weight:700;">⚡ 秒交</button>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 12px; margin-bottom:10px; border-radius:10px; border:1px solid var(--xy-border); background:${T('rgba(30,41,59,0.3)','#f8fafc')};">
                        <span style="font-size:11.5px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🔇 强制静音</span>
                        <button id="xy-btn-quick-mute" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${guardState.hardwareMute ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${guardState.hardwareMute ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${guardState.hardwareMute ? 'ON' : 'OFF'}</button>
                    </div>

                    <div class="xy-panel" style="padding: 12px;">
                        <div class="xy-section-hdr" id="xy-hdr-engine" style="font-weight:600; font-size:12px; color:${T('#94a3b8','#475569')}; display:flex; justify-content:space-between; align-items:center; user-select:none; cursor:pointer;">
                            <span>智能双引擎中枢</span>
                            <span id="xy-arr-engine" style="font-size:10px; transition:transform 0.25s;">▼</span>
                        </div>
                        <div id="xy-body-engine" style="margin-top: 10px;">
                            <div style="display:flex; gap:8px;">
                            <div id="xy-engine-video" style="flex:1; padding:10px; background:${T('rgba(52,211,153,0.05)','#f0fdf4')}; border:1px solid ${T('rgba(52,211,153,0.15)','#bbf7d0')}; border-radius:8px; transition: opacity 0.3s;">
                                <div style="font-size:11px; font-weight:600; color:${T('#6ee7b7','#059669')}; margin-bottom:6px;">📺 视频 <span id="xy-video-status" style="font-weight:400; font-size:10px; color:${T('#94a3b8','#64748b')};">待命</span></div>
                            </div>
                            <div id="xy-engine-doc" style="flex:1; padding:10px; background:${T('rgba(168,85,247,0.05)','#faf5ff')}; border:1px solid ${T('rgba(168,85,247,0.15)','#e9d5ff')}; border-radius:8px; transition: opacity 0.3s;">
                                <div style="font-size:11px; font-weight:600; color:${T('#c4b5fd','#7c3aed')}; margin-bottom:4px;">📄 文档 <span id="xy-doc-status" style="font-weight:400; font-size:10px; color:${T('#94a3b8','#64748b')};">待命</span></div>
                                <div style="width:100%; height:4px; background:${T('rgba(168,85,247,0.15)','#e9d5ff')}; border-radius:2px; margin-bottom:6px; overflow:hidden;"><div id="xy-doc-progress" style="width:0%; height:100%; background:linear-gradient(90deg, #a855f7, #818cf8); transition:width 0.5s ease-out; border-radius:2px;"></div></div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

            <div id="xy-view-disc" style="display:none; flex-shrink: 0;">
                <div id="xy-disc-status" style="padding: 10px 14px; border-radius: 8px; background: ${T('rgba(30,41,59,0.5)','#f8fafc')}; border: 1px solid var(--xy-border); font-size: 12px; font-weight: 600; margin-bottom: 10px; text-align: center; color: ${T('#94a3b8','#64748b')};">初始化中...</div>

                <div class="xy-panel">
                    <div class="xy-panel-title">
                        <span>👥 互动名单</span>
                        <label style="display: none; cursor: pointer; font-size: 11px; color: ${T('#a5b4fc','#3730a3')}; background: ${T('rgba(99,102,241,0.1)','#e0e7ff')}; padding: 3px 8px; border-radius: 6px; border: 1px solid ${T('rgba(129,140,248,0.2)','#c7d2fe')}; transition: 0.2s;">
                            <input type="checkbox" id="xy-toggle-dom-scan" ${playState.enableDomScan ? 'checked' : ''} style="accent-color: #818cf8; vertical-align: middle; margin-right: 3px; width: 11px; height: 11px;">智能DOM
                        </label>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <button class="xy-mini-btn" id="xy-btn-fetch-users" style="background:${T('rgba(99,102,241,0.2)','#eef2ff')}; color:${T('#c7d2fe','#4338ca')}; border-color:${T('rgba(129,140,248,0.25)','#c7d2fe')}; flex:1;">🔄 刷新名单</button>
                        <button class="xy-mini-btn" id="xy-btn-stop-scrape" style="display:none; flex:1; background:${T('rgba(248,113,113,0.15)','#fee2e2')}; color:${T('#f87171','#dc2626')}; border-color:${T('rgba(248,113,113,0.3)','#fecaca')};">⏹ 停止</button>
                        <button class="xy-mini-btn" id="xy-btn-clear-names" style="flex:1;">清空全库</button>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <input type="text" id="xy-name-search" class="xy-input-box" placeholder="检索人名 (空格/逗号多词)" style="text-align: left; padding: 9px 13px;">
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: ${T('rgba(30,41,59,0.4)','#f8fafc')}; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--xy-border);">
                        <span style="font-size:11px; color:${T('#94a3b8','#64748b')};">已选 <span id="xy-checked-count" style="font-weight:700; color:${T('#e2e8f0','#0f172a')}; font-size:14px;">0</span> / <span id="xy-total-count">0</span> <span style="color:#f87171; font-size:10px;">上限15</span></span>
                        <div style="display: flex; gap: 4px;">
                            <span class="xy-mini-btn" id="xy-btn-copy-names" style="padding:3px 8px; font-size:11px;">📋</span>
                            <span class="xy-mini-btn" id="xy-btn-select-all" style="padding:3px 8px; font-size:11px;">全选</span>
                            <span class="xy-mini-btn" id="xy-btn-deselect-all" style="padding:3px 8px; font-size:11px;">清空</span>
                        </div>
                    </div>

                    <div id="xy-target-list" style="max-height: 180px; overflow-y: auto; padding: 4px; margin-bottom: 14px; background: ${T('rgba(15,23,42,0.3)','#f8fafc')}; border-radius: 8px; border: 1px solid var(--xy-border);"></div>

                    <div style="display:flex; gap:8px; margin-bottom: 8px;">
                        <button class="xy-action-btn disc-btn" id="xy-btn-like" style="background:${T('rgba(51,65,85,0.5)','#f1f5f9')}; flex:1; font-size:12px;">👍 全局盲赞</button>
                        <button class="xy-action-btn disc-btn" id="xy-btn-target-like" style="background:${T('rgba(51,65,85,0.5)','#f1f5f9')}; flex:1.5; font-size:12px;">⚡ 点赞选中</button>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="xy-action-btn disc-btn" id="xy-btn-reply" style="background:${T('rgba(51,65,85,0.5)','#f1f5f9')}; flex:1; font-size:12px;">💬 全局盲回</button>
                        <button class="xy-action-btn disc-btn" id="xy-btn-target-reply" style="background:${T('rgba(51,65,85,0.5)','#f1f5f9')}; flex:1.5; font-size:12px;">🎯 回复选中</button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding: 10px 14px; background: ${T('rgba(99,102,241,0.04)','#eef2ff')}; border: 1px solid ${T('rgba(129,140,248,0.12)','#c7d2fe')}; border-radius: 8px;">
                        <label style="font-size:12px; font-weight:600; color:${T('#a5b4fc','#3730a3')}; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <input type="checkbox" id="xy-toggle-custom-reply" ${discState.useCustomReply ? 'checked' : ''} style="accent-color:#818cf8; width:14px; height:14px; cursor:pointer;"> 自定义语料
                        </label>
                        <button class="xy-mini-btn" id="xy-btn-edit-reply" style="font-size:11px; padding: 5px 10px;">⚙️ 语料库</button>
                    </div>
                </div>
            </div>

            <div id="xy-view-download" style="display:none; flex-shrink: 0;">
                <div id="xy-dl-status" style="padding: 10px 14px; border-radius: 8px; background: ${T('rgba(30,41,59,0.5)','#f8fafc')}; border: 1px solid var(--xy-border); font-size: 12px; font-weight: 600; margin-bottom: 10px; text-align: center; color: ${T('#94a3b8','#64748b')};">📥 课件资源加载中...</div>
                <div class="xy-panel">
                    <div class="xy-panel-title">
                        <span id="xy-dl-course-name">📦 课件资源</span>
                        <div style="display:flex; gap:6px;">
                            <button class="xy-mini-btn" id="xy-dl-back" style="padding:3px 10px; font-size:11px;">↩ 返回</button>
                            <button class="xy-mini-btn" id="xy-dl-refresh" style="padding:3px 10px; font-size:11px;">🔄 刷新</button>
                        </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <input type="text" id="xy-dl-search" class="xy-input-box" placeholder="🔍 搜索文件名..." style="text-align: left; padding: 8px 12px; width: 100%; box-sizing: border-box;">
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px;" id="xy-dl-type-filter"></div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; color: ${T('#94a3b8','#64748b')};">
                        <span id="xy-dl-file-count">0 个文件</span>
                        <select id="xy-dl-sort" class="xy-input-box" title="排序方式" style="width:auto; max-width:150px; padding:4px 6px; font-size:11px; text-align:left;">
                            <option value="unit">📂 单元顺序</option>
                            <option value="time_desc">🕐 上传时间 新→旧</option>
                            <option value="time_asc">🕐 上传时间 旧→新</option>
                            <option value="name_asc">🔤 文件名 A→Z</option>
                            <option value="name_desc">🔤 文件名 Z→A</option>
                        </select>
                    </div>
                    <div style="max-height:200px; overflow:auto; margin-bottom:8px;" id="xy-dl-file-list">
                        <div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">暂无课件资源</div>
                    </div>
                    <div id="xy-dl-progress-wrap" class="xy-dl-progress-card" style="display:none; margin-bottom:10px;">
                        <div class="xy-dl-progress-head">
                            <div class="xy-dl-progress-summary">
                                <span id="xy-dl-progress-state" class="xy-dl-progress-state">准备中</span>
                                <span id="xy-dl-progress-count" class="xy-dl-progress-count">0/0</span>
                            </div>
                            <span id="xy-dl-progress-percent" class="xy-dl-progress-percent">批量 0%</span>
                        </div>
                        <div id="xy-dl-progress-file" class="xy-dl-progress-file" title=""></div>
                        <div class="xy-dl-progress-track" aria-hidden="true">
                            <div id="xy-dl-progress-bar" class="xy-dl-progress-fill"></div>
                        </div>
                        <div class="xy-dl-progress-foot">
                            <span id="xy-dl-progress-detail" class="xy-dl-progress-detail">等待开始…</span>
                            <div class="xy-dl-progress-actions">
                                <button class="xy-mini-btn xy-dl-progress-action" id="xy-dl-pause" style="display:none;" title="暂停下载">⏸ 暂停</button>
                                <button class="xy-mini-btn xy-dl-progress-action xy-dl-stop" id="xy-dl-stop" style="display:none;" title="终止下载">⏹ 终止</button>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="xy-mini-btn" id="xy-dl-select-all" style="flex:1;">全选</button>
                        <button class="xy-mini-btn" id="xy-dl-deselect-all" style="flex:1;">清空</button>
                        <button class="xy-action-btn" id="xy-dl-batch-download" style="flex:1.5; background:${T('rgba(52,211,153,0.12)','#ecfdf5')}; border-color:${T('rgba(52,211,153,0.25)','#a7f3d0')}; color:${T('#6ee7b7','#059669')};">⬇️ 下载选中</button>
                    </div>
                </div>
            </div>

            <div id="xy-view-hw" style="display:none; flex-shrink: 0;">
                <!-- 顶部状态条 -->
                <div style="display:flex; align-items:center; gap:9px; padding:11px 14px; border-radius:10px; background: ${T('rgba(6,182,212,0.07)','#f0f9ff')}; border: 1px solid ${T('rgba(6,182,212,0.18)','#bae6fd')}; margin-bottom:10px;">
                    <span style="width:8px; height:8px; border-radius:99px; background:#22d3ee; box-shadow:0 0 10px rgba(34,211,238,.6); flex-shrink:0;"></span>
                    <span style="font-size:12.5px; font-weight:700; color:${T('#e2e8f0','#0f172a')};">作业答题台</span>
                    <span id="xy-hw-status" style="margin-left:auto; font-size:10px; color:${T('#94a3b8','#64748b')};">等待题目数据...</span>
                </div>
                <!-- 分段切换：作答 / 结果 -->
                <div style="display:flex; gap:4px; padding:4px; border-radius:10px; background:${T('rgba(15,23,42,0.4)','#eef2f7')}; border:1px solid ${T('rgba(71,85,105,0.25)','#dbe4ee')}; margin-bottom:10px;">
                    <button id="xy-hw-tab-answer" type="button" style="flex:1; border:none; background:${T('#0e7490','#0ea5e9')}; color:#fff; font-size:12px; font-weight:600; padding:7px 0; border-radius:7px; cursor:pointer;">✍️ 作答</button>
                    <button id="xy-hw-tab-result" type="button" style="flex:1; border:none; background:transparent; color:${T('#94a3b8','#64748b')}; font-size:12px; font-weight:600; padding:7px 0; border-radius:7px; cursor:pointer;">📊 结果</button>
                </div>
                <!-- 作答面板 -->
                <div id="xy-hw-pane-answer">
                    <div style="border:1px solid ${T('rgba(71,85,105,0.25)','#dbe4ee')}; border-radius:11px; background:${T('rgba(15,23,42,0.45)','#ffffff')}; overflow:hidden;">
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 12px; border-bottom:1px solid ${T('rgba(71,85,105,0.18)','#e2e8f0')};">
                            <b style="font-size:11.5px; color:${T('#cbd5e1','#1e293b')};">粘贴 AI 回答</b>
                            <span style="font-size:10px; color:${T('#64748b','#94a3b8')};">支持多行简答 · 匹配题</span>
                        </div>
                        <textarea id="xy-hw-ai-input" placeholder="1 => A&#10;2 => B,C&#10;3 => const | let&#10;10 => A:a,d | B:b,c" style="width:100%; min-height:96px; resize:vertical; border:none; background:transparent; color:${T('#dde6f2','#0f172a')}; font:12px/1.6 Consolas, Monaco, monospace; padding:11px 12px; outline:none; box-sizing:border-box;"></textarea>
                    </div>
                    <div style="display:flex; gap:8px; margin-top:12px;">
                        <button class="xy-action-btn" id="xy-hw-copy-btn" style="flex:1; min-height:36px; font-size:12px; background:${T('rgba(6,182,212,0.1)','#e0f2fe')}; border-color:${T('rgba(6,182,212,0.25)','#bae6fd')}; color:${T('#67e8f9','#0e7490')};">📤 提取题目模板</button>
                        <button class="xy-action-btn" id="xy-hw-docx-btn" style="flex:1; min-height:36px; font-size:12px; background:${T('rgba(236,72,153,0.12)','#fdf2f8')}; border-color:${T('rgba(236,72,153,0.25)','#fbcfe8')}; color:${T('#f9a8d4','#9d174d')};">📄 导出作答文档</button>
                    </div>
                    <button class="xy-action-btn" id="xy-hw-save-btn" style="width:100%; min-height:38px; margin-top:8px; font-size:12px; background:linear-gradient(135deg,#06b6d4,#0891b2); border-color:transparent; color:#fff;">🚀 提交并保存</button>
                    <div style="font-size:10px; color:${T('#64748b','#94a3b8')}; text-align:center; margin-top:10px;">格式：题号 => 答案 · 提交后自动刷新成绩</div>
                </div>
                <!-- 结果面板 -->
                <div id="xy-hw-pane-result" style="display:none;">
                    <div id="xy-hw-result"></div>
                </div>
            </div>

            <div id="xy-sys-ctrl" class="xy-panel" style="background:${T('rgba(30,41,59,0.3)','#f8fafc')}; border-style:dashed; padding:7px 10px; margin-bottom:6px; display:flex; align-items:center; gap:9px;">
                <span style="font-weight:600; font-size:11px; color:${T('#94a3b8','#475569')}; flex-shrink:0;" title="系统控制">⚙ 系统</span>
                <label style="font-size:10.5px; cursor:pointer; color:${T('#94a3b8','#64748b')}; font-weight:600; display:flex; align-items:center; gap:3px; white-space:nowrap;"><input type="checkbox" id="toggle-refresh-panel" ${settingsState.showRefreshPanel ? 'checked' : ''} style="width:12px; height:12px; accent-color:#64748b; cursor:pointer;"> 重载视窗</label>
                <label style="font-size:10.5px; cursor:pointer; color:${T('#94a3b8','#64748b')}; font-weight:600; display:flex; align-items:center; gap:3px; white-space:nowrap;"><input type="checkbox" id="toggle-terminal" ${settingsState.showTerminal ? 'checked' : ''} style="width:12px; height:12px; accent-color:#64748b; cursor:pointer;"> 终端</label>
                <div style="display:flex; gap:6px; align-items:center; margin-left:auto; flex-shrink:0;">
                    <button class="xy-mini-btn" id="btn-clear-logs" title="清空终端日志" style="font-size:10.5px; padding:4px 8px;">🧹 日志</button>
                    <button class="xy-mini-btn" id="btn-clear-progress" title="重置学习时长统计" style="font-size:10.5px; padding:4px 8px; color:#f87171; border-color:${T('rgba(248,113,113,0.2)','#fecaca')}; background:${T('rgba(248,113,113,0.08)','#fef2f2')};">⏱ 时长</button>
                </div>
            </div>

            <div id="xy-bottom-containers" style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; margin-bottom: 6px;">
                <div id="xy-refresh-container" style="display: ${settingsState.showRefreshPanel ? 'block' : 'none'}; background: ${T('rgba(251,191,36,0.06)','#fffbeb')}; padding: 12px 16px; border-radius: 10px; border: 1px solid ${T('rgba(251,191,36,0.15)','#fde68a')};">
                    <div style="font-size: 11px; color: ${T('#fcd34d','#92400e')}; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">⏳ 动态重载调度</div>
                    <div id="xy-refresh-status" style="font-size: 12px; color: ${T('#fbbf24','#92400e')}; font-weight: 600; font-family: monospace;">目前无重载任务</div>
                </div>

                <div id="xy-terminal-container" style="display: ${settingsState.showTerminal ? 'block' : 'none'}; background: ${T('rgba(0,0,0,0.5)','#f1f5f9')}; padding: 12px; border-radius: 10px; border: 1px solid ${T('rgba(71,85,105,0.3)','#e2e8f0')};">
                    <div style="font-size: 11px; color: ${T('#64748b','#475569')}; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><span style="color:${T('#34d399','#059669')}; font-family:monospace; font-size:13px;">❯</span> 终端</div>
                    <div id="xy-activity-log" style="height: 110px; overflow-y: auto; font-family: 'SF Mono', 'JetBrains Mono', Consolas, monospace; font-size: 11px; display: flex; flex-direction: column; color: ${T('#34d399','#059669')}; padding-right: 4px; line-height: 1.6;"></div>
                </div>
            </div>

            </div>

            <div class="xy-rs-edge xy-rs-edge-n" data-dir="n"></div>
            <div class="xy-rs-edge xy-rs-edge-s" data-dir="s"></div>
            <div class="xy-rs-edge xy-rs-edge-w" data-dir="w"></div>
            <div class="xy-rs-edge xy-rs-edge-e" data-dir="e"></div>
            <div class="xy-rs-edge xy-rs-edge-nw" data-dir="nw"></div>
            <div class="xy-rs-edge xy-rs-edge-ne" data-dir="ne"></div>
            <div class="xy-rs-edge xy-rs-edge-sw" data-dir="sw"></div>
            <div class="xy-rs-edge xy-rs-edge-se" data-dir="se"></div>
            <div class="xy-rs-grip" id="xy-rs-grip" title="拖拽调整面板大小 · 双击复位"></div>

        `;
    }
    /**
     * 主控台 UI 编排器（组件化装配入口）。
     * 职责链：幂等守卫（单例/等待 body）→ 监听生命周期重置（AbortController）→
     * 旧实例与启动残留清理 → 视图渲染（xyBuildPanelTemplate 纯模板）→
     * 终端日志回放 → 事件装配（xyBindPanelEvents）→ 布局行为
     * （最小化 / 分区折叠 / 主题切换 / 拖拽移动 / 反馈入口）。
     * 本函数只做编排，不含具体视图 HTML 与绑定逻辑——分别下沉到
     * xyBuildPanelTemplate 与 xyBindPanelEvents，保持单一职责。
     * [DEEP-DOC]
     */
    function createUI() {
        /* ── §1 幂等守卫：面板已存在或 body 未就绪时退出/延后 ── */
        if (document.getElementById('xy-super-console')) { _uiCreating = false; return; }
        if (!document.body) { _uiCreating = false; scheduleEnsureUI(50); return; }
        xyUiListenerAbort?.abort();
        xyUiListenerAbort = new AbortController();
        const uiDocumentListenerOptions = { signal: xyUiListenerAbort.signal };
        document.body.style.userSelect = '';
        
        /* ── §2 残留清理：旧面板实例与启动动画 ── */
        document.querySelectorAll('#xy-super-console').forEach(el => { try { el.remove(); } catch(e) {} });
        
        ['xy-splash','xy-toast-box'].forEach(id => {
            const el = document.getElementById(id);
            if (el) try { el.remove(); } catch(e) {}
        });

        dismissSplash();

        const wrapper = document.createElement('div'); wrapper.id = 'xy-super-console';
        let pos = { x: window.innerWidth - 400, y: 50 };
        const savedWidth = GM_getValue('xy_panel_width', 360);
        try { const p = JSON.parse(GM_getValue('xy_ui_pos')); if(p && typeof p.x === 'number') pos = p; } catch(e){}
        
        wrapper.style.cssText = `
            position: fixed; left: ${pos.x}px; top: ${pos.y}px; width: ${savedWidth}px; max-height: 94vh;
            background: rgba(15, 23, 42, 0.92); border-radius: 16px;
            border: 1px solid rgba(71, 85, 105, 0.4); box-shadow: 0 0 0 1px rgba(71, 85, 105, 0.15), 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99, 102, 241, 0.06);
            z-index: 2147483640; backdrop-filter: blur(24px) saturate(1.2); -webkit-backdrop-filter: blur(24px) saturate(1.2);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
            overflow: hidden; transition: opacity 0.3s; display: flex; flex-direction: column;
        `;
        /* 自定义高度：用户拖拽过面板高度则恢复，否则保持内容自适应（auto） */
        const savedHeight = GM_getValue('xy_panel_height', '');
        if (savedHeight !== '' && Number(savedHeight) > 0) wrapper.style.height = Number(savedHeight) + 'px';
        
        /* ── §3 视图渲染：纯模板函数输出完整面板 HTML/CSS ── */
        wrapper.innerHTML = xyBuildPanelTemplate();
        document.body.appendChild(wrapper);

        /* ── §4 会话日志回放：恢复历史终端输出 ── */
        const logBox = document.getElementById('xy-activity-log');
        if (logBox && sessionLogs.length > 0) {
            logBox.innerHTML = ''; sessionLogs.forEach(log => { const el = document.createElement('div'); el.style.color = log.color === '#64748b' ? '#94a3b8' : (log.color === '#38bdf8' ? '#10b981' : log.color); el.style.marginBottom = '4px'; el.style.lineHeight = '1.5'; el.innerText = log.text; logBox.appendChild(el); });
            logBox.scrollTop = logBox.scrollHeight;
        } else {
            logMsg('=============================', 'silent', true);
            logMsg('雷达 已就绪', 'info', false);
            logMsg('📡 全局雷达网持续扫描中...', 'silent', true);
        }

        /* ── §5 事件装配：控件绑定委托给 xyBindPanelEvents ── */
        xyBindPanelEvents({ listenerOptions: uiDocumentListenerOptions });

/**
 * 面板事件装配层（纯装配函数）：把主控台内全部控件交互
 * （分区按钮/更新/学情入口/课程列表委托/防检测开关组/模式切换/
 *   刷新面板/终端显隐/日志与时长清零）绑定到 DOM。
 * 通过 AbortController 信号注册 document 级监听，面板销毁时统一解绑。
 * @param {{listenerOptions: AddEventListenerOptions}} ctx - 装配上文
 * [DEEP-DOC]
 */
    function xyBindPanelEvents(ctx) {
        const uiDocumentListenerOptions = ctx.listenerOptions;
        const qqBadge = document.getElementById('xy-seg-qq');
        if (qqBadge) {
            qqBadge.onclick = async (e) => {
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText('1095232169');
                    showToast('🎉 QQ群号 1095232169 已成功复制到剪贴板！', 'success');
                } catch(err) { showToast('请手动复制 QQ群号: 1095232169', 'error'); }
            };
        }

        const updateBtn = document.getElementById('xy-seg-update');
        if (updateBtn) updateBtn.onclick = (e) => { e.stopPropagation(); xyShowUpdateModal(); };

        const overviewOpenBtn = document.getElementById('xy-overview-open');
        if (overviewOpenBtn) overviewOpenBtn.onclick = (e) => { e.stopPropagation(); xyOverviewToggle(); };
        const overviewRefreshBtn = document.getElementById('xy-overview-refresh');
        if (overviewRefreshBtn) overviewRefreshBtn.onclick = () => xyOverviewRefresh();
        const overviewContent = document.getElementById('xy-overview-content');
        if (overviewContent) {
            overviewContent.addEventListener('click', (event) => {
                const todayTaskButton = event.target.closest('.xy-today-prompt-step');
                if (todayTaskButton) {
                    if (todayTaskButton.disabled) return;
                    const currentData = xyOverviewState.currentData;
                    const courseId = currentData?.courseId;
                    const routeCourseId = courseGroupKey(getCourseGroupId());
                    const isActiveOverview = playState.activeZone === ZONE.OVERVIEW
                        && xyOverviewState.courseId === courseId;
                    if (!courseId || !isActiveOverview || (routeCourseId && courseId !== routeCourseId)) return;
                    xyOverviewOpenTask(
                        courseId,
                        todayTaskButton.getAttribute('data-today-task-parent') || '',
                        todayTaskButton.getAttribute('data-today-task-node') || ''
                    );
                    return;
                }
                const taskButton = event.target.closest('.xy-overview-task');
                if (!taskButton || taskButton.disabled) return;
                const taskIndex = Number(taskButton.getAttribute('data-task-index'));
                const currentData = xyOverviewState.currentData;
                const task = Number.isInteger(taskIndex) ? currentData?.tasks?.data?.[taskIndex] : null;
                const courseId = currentData?.courseId;
                const routeCourseId = courseGroupKey(getCourseGroupId());
                const isActiveOverview = playState.activeZone === ZONE.OVERVIEW
                    && xyOverviewState.courseId === courseId;
                if (!task || !isActiveOverview || (routeCourseId && courseId !== routeCourseId)) return;
                xyOverviewOpenTask(courseId, task.parentId, task.nodeId);
            });
        }

        const courseDashboardRefresh = document.getElementById('xy-course-dashboard-refresh');
        if (courseDashboardRefresh) courseDashboardRefresh.onclick = () => xyCourseDashboardRefresh();
        const courseDashboardSearch = document.getElementById('xy-course-dashboard-search');
        if (courseDashboardSearch) {
            courseDashboardSearch.addEventListener('input', event => {
                xyCourseDashboardState.query = event.target.value || '';
                xyCourseDashboardRender();
            });
        }
        const courseDashboardFilters = document.getElementById('xy-course-dashboard-filters');
        if (courseDashboardFilters) {
            courseDashboardFilters.addEventListener('click', event => {
                const button = event.target.closest('[data-course-filter]');
                if (!button || button.disabled) return;
                xyCourseDashboardState.filter = button.getAttribute('data-course-filter') || 'all';
                xyCourseDashboardRender();
            });
        }
        const courseDashboardToday = document.getElementById('xy-course-dashboard-today');
        if (courseDashboardToday) {
            courseDashboardToday.addEventListener('click', event => {
                const actionButton = event.target.closest('[data-today-global-action]');
                if (!actionButton || actionButton.disabled) return;
                const courseId = actionButton.getAttribute('data-today-course-id') || '';
                if (!courseId) return;
                if (actionButton.getAttribute('data-today-global-action') === 'task') {
                    xyOverviewOpenTask(
                        courseId,
                        actionButton.getAttribute('data-today-task-parent') || '',
                        actionButton.getAttribute('data-today-task-node') || ''
                    );
                    return;
                }
                xyOverviewOpen(courseId);
            });
        }
        const courseDashboardList = document.getElementById('xy-course-dashboard-list');
        if (courseDashboardList) {
            const getCourseFromTarget = target => {
                const row = target.closest('[data-course-index]');
                if (!row) return null;
                const courseIndex = Number(row.getAttribute('data-course-index'));
                return Number.isInteger(courseIndex) ? xyCourseDashboardState.courses[courseIndex] : null;
            };
            courseDashboardList.addEventListener('click', event => {
                const taskButton = event.target.closest('[data-course-task-type]');
                if (taskButton) {
                    const course = getCourseFromTarget(event.target);
                    const taskType = taskButton.getAttribute('data-course-task-type');
                    const taskIndex = Number(taskButton.getAttribute('data-course-task-index'));
                    const task = Number.isInteger(taskIndex) ? course?.taskDetails?.[taskType]?.[taskIndex] : null;
                    if (course && task) void xyCourseDashboardOpenTask(course, task);
                    return;
                }
                const actionButton = event.target.closest('[data-course-action]');
                const action = actionButton?.getAttribute('data-course-action') || 'enter';
                if (action === 'retry') {
                    xyCourseDashboardRefresh();
                    return;
                }
                if (action === 'details' || action === 'retry-details') {
                    const course = getCourseFromTarget(event.target);
                    if (!course) return;
                    event.preventDefault();
                    if (action === 'details') {
                        xyCourseDashboardToggleTaskDetails(course);
                    } else {
                        course.taskDetailsExpanded = true;
                        void xyCourseDashboardLoadTaskDetails(course, true);
                    }
                    return;
                }
                if (!actionButton && !event.target.closest('.xy-course-dashboard-course-main')) return;
                const course = getCourseFromTarget(event.target);
                if (!course) return;
                if (!actionButton) {
                    xyCourseDashboardToggleTaskDetails(course);
                    return;
                }
                if (action === 'overview') {
                    xyOverviewOpen(course.courseId);
                    return;
                }
                window.location.href = xyCourseDashboardResourceUrl(course.courseId);
            });
            courseDashboardList.addEventListener('toggle', event => {
                const group = event.target.closest('.xy-course-dashboard-task-group');
                if (!group) return;
                const course = getCourseFromTarget(group);
                const groupType = group.getAttribute('data-course-task-group-type') || '';
                if (!course || !groupType) return;
                if (!course.taskGroupExpanded) course.taskGroupExpanded = {};
                course.taskGroupExpanded[groupType] = group.open;
            }, true);
            courseDashboardList.addEventListener('keydown', event => {
                if (!event.target.matches('.xy-course-dashboard-course-main') || (event.key !== 'Enter' && event.key !== ' ')) return;
                const course = getCourseFromTarget(event.target);
                if (!course) return;
                event.preventDefault();
                xyCourseDashboardToggleTaskDetails(course);
            });
        }

        const bcToggle = document.getElementById('xy-bc-toggle');
        const bcContent = document.getElementById('xy-bc-content');
        const bcArrow = document.getElementById('xy-bc-arrow');
        if(bcToggle) {
            bcToggle.onclick = () => {
                const isHidden = bcContent.style.display === 'none';
                bcContent.style.display = isHidden ? 'block' : 'none';
                bcArrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            };
        }
        
        const btnQuickMute = document.getElementById('xy-btn-quick-mute');
        if(btnQuickMute) {
            btnQuickMute.onclick = () => {
                guardState.hardwareMute = !guardState.hardwareMute;
                GM_setValue('xy_hw_mute', guardState.hardwareMute);
                syncHardwareMute();
                btnQuickMute.textContent = guardState.hardwareMute ? 'ON' : 'OFF';
                btnQuickMute.style.background = guardState.hardwareMute ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0');
                btnQuickMute.style.color = guardState.hardwareMute ? T('#34d399','#065f46') : T('#94a3b8','#64748b');
                document.querySelectorAll('video, audio').forEach(m => { m.muted = guardState.hardwareMute; });
                logMsg(`🔕 底层音轨强制拦截引擎已${guardState.hardwareMute ? '启动' : '关闭'}！`, guardState.hardwareMute ? 'success' : 'warning', false);
            };
        }

        const toggleRefresh = document.getElementById('toggle-refresh-panel');
        if (toggleRefresh) {
            toggleRefresh.onchange = (e) => {
                settingsState.showRefreshPanel = e.target.checked;
                GM_setValue('xy_show_refresh_panel', settingsState.showRefreshPanel);
                const refBox = document.getElementById('xy-refresh-container');
                if (refBox) refBox.style.display = settingsState.showRefreshPanel ? 'block' : 'none';
            };
        }

        const toggleTerminal = document.getElementById('toggle-terminal');
        if (toggleTerminal) {
            toggleTerminal.onchange = (e) => {
                settingsState.showTerminal = e.target.checked;
                GM_setValue('xy_show_terminal', settingsState.showTerminal);
                const termBox = document.getElementById('xy-terminal-container');
                if (termBox) termBox.style.display = settingsState.showTerminal ? 'block' : 'none';
            };
        }

        document.getElementById('btn-clear-logs').onclick = () => { sessionLogs = []; sessionStorage.removeItem('xy_session_logs'); const box = document.getElementById('xy-activity-log'); if(box) box.innerHTML = ''; logMsg('🧹 终端日志已清空', 'silent', true); };
        document.getElementById('btn-clear-progress').onclick = () => { recState.recordCount = 0; recState.totalTime = 0; recState.realTime = 0; sessionStorage.removeItem('xy_recordCount'); sessionStorage.removeItem('xy_totalTime'); sessionStorage.removeItem('xy_realTime'); updateCourseUI(); logMsg('🗑️ 时长记录归零', 'error', false); };

        document.getElementById('btn-mode-man').onclick = () => {
            if (xyScheduleState.isRunning) { xySchStop(); }
            playState.mode = PLAY_MODE.MANUAL;
            GM_setValue('xy_play_mode', PLAY_MODE.MANUAL);
            clearDynamicRefresh();
            logMsg('已暂停，且已强制停止所有重载任务', 'success');
            updateCourseUI();
        };
        document.getElementById('btn-mode-loop').onclick = () => { if (!getCourseGroupId() || !getNodeId()) { xyShowModal('⚠️ 无法开启', '请进入具体的视频或文档内容页后再开启'); return; } if (xyScheduleState.isRunning) { xySchStop(); } playState.mode = PLAY_MODE.LOOP; GM_setValue('xy_play_mode', PLAY_MODE.LOOP); logMsg('安全刷时长模式开启，恢复经典无限循环', 'success'); updateCourseUI(); globalTaskStatusChecker(true); };
        document.getElementById('btn-mode-seq').onclick = () => { oneClickRadarPlay(); };

        // 防休眠/后台保活/鼠标模拟/深度伪装 UI 已删除——引擎按默认状态自动运行，无手动开关
        document.getElementById('xy-btn-guard')?.remove();
        
        if (guardState.mouseSimActive) { scheduleMouseSim(); }
        document.getElementById('xy-btn-dashboard').onclick = openGlobalTaskDashboard;
        document.getElementById('xy-btn-schedule').onclick = openScheduleDashboard;
        document.getElementById('xy-btn-download-zone').onclick = () => enterDownloadZone();
        document.getElementById('xy-btn-quick-kill').onclick = () => {
            quickKillCurrentTask();
        };

        // 课程目录区按钮
        const dirPlayBtn = document.getElementById('xy-dir-play');
        if (dirPlayBtn) dirPlayBtn.onclick = () => oneClickRadarPlay();
        const dirDownloadBtn = document.getElementById('xy-dir-download');
        if (dirDownloadBtn) dirDownloadBtn.onclick = () => enterDownloadZone();
        const dirRefreshBtn = document.getElementById('xy-dir-refresh');
        if (dirRefreshBtn) dirRefreshBtn.onclick = () => loadCourseDirectory();
        const dirListBox = document.getElementById('xy-dir-list');
        if (dirListBox) {
            dirListBox.addEventListener('click', (e) => {
                const link = e.target.closest('[data-dir-url]');
                if (link) {
                    const url = link.getAttribute('data-dir-url');
                    if (url) window.location.href = url;
                    return;
                }
                const head = e.target.closest('.xy-dir-head');
                if (!head) return;
                const body = head.nextElementSibling;
                if (!body) return;
                const hidden = body.style.display === 'none';
                body.style.display = hidden ? '' : 'none';
                const marker = head.querySelector('[data-marker]');
                if (marker) marker.textContent = hidden ? '−' : '+';
            });
        }

        
        const hwDocxBtn = document.getElementById('xy-hw-docx-btn');
        if (hwDocxBtn) hwDocxBtn.onclick = async () => {
            hwDocxBtn.disabled = true; hwDocxBtn.textContent = '⏳ 正在导出...';
            try { await hwExportDocx(); } catch(e) { logMsg('导出失败: '+e.message,'error'); }
            hwDocxBtn.disabled = false; hwDocxBtn.textContent = '📄 导出作答文档';
        };

        
        const hwTabA = document.getElementById('xy-hw-tab-answer');
        if (hwTabA) hwTabA.onclick = () => { hwActiveTab = 'answer'; hwUpdateTabs(); };
        const hwTabR = document.getElementById('xy-hw-tab-result');
        if (hwTabR) hwTabR.onclick = () => { hwActiveTab = 'result'; hwUpdateTabs(); };

        
        const hwCopyBtn = document.getElementById('xy-hw-copy-btn');
        if (hwCopyBtn) hwCopyBtn.onclick = () => hwCopyAiPrompt();

        const hwSaveBtn = document.getElementById('xy-hw-save-btn');
        if (hwSaveBtn) hwSaveBtn.onclick = async () => {
            if (!hwQuestionsData.length) { logMsg('还没有读取到题目数据，无法保存作答','error'); return; }
            const aiText = document.getElementById('xy-hw-ai-input')?.value || '';
            if (!aiText.trim()) { logMsg('请先在下方输入 AI 返回的答案','warning'); showToast('请先粘贴 AI 返回的答案', 'warning'); return; }
            hwSaveBtn.disabled = true; hwSaveBtn.textContent = '⏳ 正在保存...';
            try { await hwSaveAnswers(aiText); } catch(e) { logMsg('保存作答异常：'+e.message,'error'); }
            hwSaveBtn.disabled = false; hwSaveBtn.textContent = '🚀 提交并保存';
        };


        const toggleDomScan = document.getElementById('xy-toggle-dom-scan');
        if(toggleDomScan) { toggleDomScan.onchange = (e) => { playState.enableDomScan = e.target.checked; logMsg(e.target.checked ? '✅ 智能DOM提取已开启' : '⏸️ 智能DOM提取已暂停', 'info', true); }; }

        const toggleCustomReply = document.getElementById('xy-toggle-custom-reply');
        if(toggleCustomReply) { toggleCustomReply.onchange = (e) => { discState.useCustomReply = e.target.checked; GM_setValue('xy_use_custom_reply', discState.useCustomReply); }; }
        const btnEditReply = document.getElementById('xy-btn-edit-reply');
        if (btnEditReply) btnEditReply.onclick = openReplySettingsModal;

        
        const dlSearchInput = document.getElementById('xy-dl-search');
        if (dlSearchInput) {
            dlSearchInput.addEventListener('input', () => {
                dlState.downloadSearchKeyword = dlSearchInput.value;
                renderDownloadList();
            });
        }

        // 下载类型勾选（默认全选，持久化）
        const typeFilterBox = document.getElementById('xy-dl-type-filter');
        if (typeFilterBox) {
            DL_TYPES.forEach(t => {
                const label = document.createElement('label');
                label.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;border:1px solid ${T('rgba(71,85,105,0.3)','#e2e8f0')};background:${T('rgba(15,23,42,0.35)','#ffffff')};color:${T('#cbd5e1','#334155')};font-size:10.5px;font-weight:600;cursor:pointer;`;
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = dlState.downloadTypeFilter.has(t.key);
                cb.style.cssText = `width:12px;height:12px;accent-color:#22d3ee;cursor:pointer;`;
                cb.onchange = () => {
                    if (cb.checked) dlState.downloadTypeFilter.add(t.key);
                    else dlState.downloadTypeFilter.delete(t.key);
                    try { GM_setValue('xy_dl_types', Array.from(dlState.downloadTypeFilter).join(',')); } catch(e) {}
                    renderDownloadList();
                };
                label.appendChild(cb);
                label.appendChild(document.createTextNode(t.label));
                typeFilterBox.appendChild(label);
            });
        }

        const dlSortSelect = document.getElementById('xy-dl-sort');
        if (dlSortSelect) {
            dlSortSelect.value = dlState.downloadSortMode || 'unit';
            dlSortSelect.onchange = () => {
                dlState.downloadSortMode = dlSortSelect.value;
                try { GM_setValue('xy_dl_sort', dlSortSelect.value); } catch(e) {}
                renderDownloadList();
            };
        }
        document.getElementById('xy-dl-select-all').onclick = () => {
            const keyword = (dlState.downloadSearchKeyword || '').toLowerCase().trim();
            const targets = keyword
                ? dlState.downloadFiles.filter(f => f.name.toLowerCase().includes(keyword))
                : dlState.downloadFiles;
            targets.forEach(f => {
                const id = normalizeDownloadId(f.id);
                if (id !== null) dlState.downloadSelectedIds.add(id);
            });
            renderDownloadList();
        };
        document.getElementById('xy-dl-deselect-all').onclick = () => {
            dlState.downloadSelectedIds.clear();
            renderDownloadList();
        };
        document.getElementById('xy-dl-batch-download').onclick = () => batchDownloadSelected();
        document.getElementById('xy-dl-stop').onclick = () => stopBatchDownload();
        document.getElementById('xy-dl-pause').onclick = () => {
            dlState.downloadPaused = !dlState.downloadPaused;
            setDownloadButtonsState(true, dlState.downloadPaused);
            logMsg(dlState.downloadPaused ? '⏸️ 下载已暂停' : '▶️ 下载已继续', 'info', true);
        };
        document.getElementById('xy-dl-back').onclick = () => {
            switchToZone(playState.prevZone || ZONE.COURSE);
        };
        document.getElementById('xy-dl-refresh').onclick = () => {
            const gid = getCourseGroupId();
            if (gid) {
                void loadDownloadPanel(gid).catch(e => {
                    console.warn('[小雅] 下载区刷新失败:', e);
                });
            } else showToast('未检测到课程 ID', 'warning');
        };
        const dlFileList = document.getElementById('xy-dl-file-list');
        if (dlFileList) {
            dlFileList.addEventListener('change', (e) => {
                const target = e.target && typeof e.target.closest === 'function'
                    ? e.target
                    : (e.target && e.target.parentElement);
                if (!target || !target.classList?.contains('xy-dl-check')) return;
                const fid = normalizeDownloadId(target.getAttribute('data-fid'));
                if (fid === null) return;
                if (target.checked) dlState.downloadSelectedIds.add(fid);
                else dlState.downloadSelectedIds.delete(fid);
            });
            // 目录标题使用委托，单文件下载按钮改为逐个绑定，和参考脚本保持一致。
            dlFileList.addEventListener('click', (e) => {
                const target = e.target && typeof e.target.closest === 'function'
                    ? e.target
                    : (e.target && e.target.parentElement);
                if (!target || typeof target.closest !== 'function') return;
                const unitHead = target.closest('.xy-dl-unit-head');
                if (!unitHead) return;
                const body = unitHead.nextElementSibling;
                if (body) {
                    const hidden = body.style.display === 'none';
                    body.style.display = hidden ? '' : 'none';
                    const marker = unitHead.querySelector('[data-dl-marker]');
                    if (marker) marker.textContent = hidden ? '−' : '+';
                }
            });
        }

        document.getElementById('xy-btn-like').onclick = () => autoLikeAction(false);
        document.getElementById('xy-btn-target-like').onclick = () => autoLikeAction(true);
        document.getElementById('xy-btn-reply').onclick = () => autoReplyAction(false);
        document.getElementById('xy-btn-target-reply').onclick = () => autoReplyAction(true);
        document.getElementById('xy-btn-select-all').onclick = () => { 
            discState.selectedNames.clear();
            for(let i = 0; i < Math.min(discState.targetNames.length, 15); i++) { discState.selectedNames.add(discState.targetNames[i]); }
            renderTargetList(document.getElementById('xy-name-search')?.value || '');
            showToast('已智能全选前15名 (安全限制上限)', 'success');
            logMsg('已全选（触发点赞安全人数限制：最多15人）', 'silent', true); 
        };
        document.getElementById('xy-btn-deselect-all').onclick = () => { 
            discState.selectedNames.clear(); renderTargetList(document.getElementById('xy-name-search')?.value || ''); logMsg('已清空勾选', 'silent', true); 
        };
        document.getElementById('xy-btn-copy-names').onclick = async () => {
            const names = Array.from(discState.selectedNames).join('\n');
            if (!names) { showToast('当前未选择任何目标', 'warning'); return; }
            try {
                await navigator.clipboard.writeText(names);
                showToast(`成功复制 ${discState.selectedNames.size} 个人名到剪贴板！`, 'success');
            } catch(e) { showToast('复制失败，可能是浏览器限制', 'error'); }
        };
        document.getElementById('xy-btn-fetch-users').onclick = fetchCurrentUsers;
        const stopScrapeBtn = document.getElementById('xy-btn-stop-scrape');
        if (stopScrapeBtn) stopScrapeBtn.onclick = () => { playState.discScrapeAbort = true; stopScrapeBtn.disabled = true; };
        document.getElementById('xy-btn-clear-names').onclick = () => { 
            discState.targetNames = []; discState.selectedNames.clear();
            GM_setValue('xy_target_names', JSON.stringify([])); 
            renderTargetList(document.getElementById('xy-name-search')?.value || ''); 
            
            if(playState.enableDomScan) {
                playState.enableDomScan = false;
                const toggle = document.getElementById('xy-toggle-dom-scan');
                if(toggle) toggle.checked = false;
                logMsg('已清空全库 (已自动暂停智能DOM提取防回弹)', 'silent', true); 
            } else {
                logMsg('已清空名单库', 'silent', true); 
            }
        };
        
        const searchInput = document.getElementById('xy-name-search');
        if (searchInput) searchInput.addEventListener('input', (e) => { renderTargetList(e.target.value); });

        const listContainer = document.getElementById('xy-target-list');
        if (listContainer) {
            listContainer.addEventListener('change', (e) => {
                if(e.target.classList.contains('xy-target-checkbox')) {
                    if(e.target.checked) {
                        if (discState.selectedNames.size >= 15) {
                            e.target.checked = false;
                            showToast('为防风控，最多只允许勾选15个点赞目标！', 'warning');
                        } else { discState.selectedNames.add(e.target.value); }
                    } else { discState.selectedNames.delete(e.target.value); }
                    updateCheckedCount();
                }
            });
            renderTargetList();
        }

    }

        /* ── §6 布局行为：最小化 / 分区折叠 / 主题 / 拖拽移动 / 收尾调度 ── */
        const handle = document.getElementById('xy-drag-handle'), minBtn = document.getElementById('xy-minimize'), body = document.getElementById('xy-main-body'), handleRow2 = document.getElementById('xy-handle-row2');
        let isMin = false;
        minBtn.onclick = () => {
            isMin = !isMin;
            body.style.display = isMin ? 'none' : 'flex';
            if (handleRow2) handleRow2.style.display = isMin ? 'none' : 'flex';
            /* 最小化时挂起自定义高度，避免隐藏内容后外壳仍被拖大的 height 撑成空白大框；展开时恢复 */
            if (isMin && wrapper.style.height && Number(wrapper.style.height.replace('px', '')) > 0) {
                wrapper.dataset.rsH = wrapper.style.height;
                wrapper.style.height = '';
                rsHeightTouched = false;
            } else if (!isMin && wrapper.dataset.rsH) {
                wrapper.style.height = wrapper.dataset.rsH;
                rsHeightTouched = true;
            }
            handle.style.padding = isMin ? '8px 18px' : '14px 18px 12px 18px';
            handle.style.cursor = isMin ? 'default' : 'grab';
            minBtn.innerText = isMin ? '⊞' : '⊟';
            minBtn.title = isMin ? '展开面板' : '最小化面板';
        };

        
        const bindSection = (hdrId, bodyId, arrId) => {
            const hdr = document.getElementById(hdrId), bd = document.getElementById(bodyId), arr = document.getElementById(arrId);
            if (!hdr || !bd) return;
            hdr.onclick = () => {
                if (bd.style.display === 'none') { bd.style.display = ''; arr.style.transform = 'rotate(0deg)'; }
                else { bd.style.display = 'none'; arr.style.transform = 'rotate(-90deg)'; }
            };
        };
        bindSection('xy-hdr-actions', 'xy-body-actions', 'xy-arr-actions');
        bindSection('xy-hdr-engine', 'xy-body-engine', 'xy-arr-engine');

        const themeBtn = document.getElementById('xy-theme-toggle');
        if (themeBtn) themeBtn.onclick = () => {
            
            if (settingsState.theme === 'auto') settingsState.theme = 'light';
            else if (settingsState.theme === 'light') settingsState.theme = 'dark';
            else settingsState.theme = 'auto';
            GM_setValue('xy_theme', settingsState.theme);
            applyTheme();
            showToast(settingsState.theme === 'auto' ? '🌓 主题：跟随系统' : settingsState.theme === 'light' ? '☀️ 主题：浅色模式' : '🌙 主题：深色模式', 'info');
        };

        
        const feedbackLink = document.getElementById('xy-seg-feedback');
        if (feedbackLink) feedbackLink.onclick = () => xyShowFeedbackSurvey();
        let isDragging = false, dragStartX = 0, dragStartY = 0, initialLeft = 0, initialTop = 0;
        
        handle.addEventListener('mousedown', (e) => {
            if(e.target.tagName === 'BUTTON' || e.target === minBtn || e.target.tagName === 'INPUT' || e.target.closest('.xy-seg-item') || e.target.closest('.xy-overview-icon') || e.target.closest('#xy-theme-toggle') || e.target.id === 'xy-bc-toggle') return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const rect = wrapper.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            document.body.style.userSelect = 'none';
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if(!isDragging) return;
            let currentX = e.clientX - dragStartX;
            let currentY = e.clientY - dragStartY;
            let newX = initialLeft + currentX;
            let newY = initialTop + currentY;
            
            newX = Math.max(0, Math.min(newX, window.innerWidth - 60));
            newY = Math.max(0, Math.min(newY, window.innerHeight - 50));
            
            wrapper.style.left = newX + 'px';
            wrapper.style.top = newY + 'px';
            e.preventDefault();
        }, uiDocumentListenerOptions);

        document.addEventListener('mouseup', () => {
            if(isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                handle.style.cursor = 'grab';
                const rect = wrapper.getBoundingClientRect();
                GM_setValue('xy_ui_pos', JSON.stringify({ x: rect.left, y: rect.top }));
            }
        }, uiDocumentListenerOptions);

        /* ── 面板缩放：8 个边缘/角落热区 + 右下角 grip，mousedown 起始记录 →
           mousemove 按方向计算新尺寸（西/北方向同步平移 left/top 保持对边不动）→
           mouseup 持久化宽高到 GM 存储。双击 grip 复位默认尺寸。[DEEP-DOC] */
        const RS_MIN_W = 320, RS_MIN_H = 240;
        let isResizing = false, rsDir = '', rsStartX = 0, rsStartY = 0,
            rsStartW = 0, rsStartH = 0, rsStartLeft = 0, rsStartTop = 0,
            rsHeightTouched = false;

        document.querySelectorAll('#xy-super-console .xy-rs-edge, #xy-super-console .xy-rs-grip').forEach(zone => {
            zone.addEventListener('mousedown', (e) => {
                isResizing = true;
                rsDir = zone.getAttribute('data-dir') || 'se';
                rsStartX = e.clientX; rsStartY = e.clientY;
                const rect = wrapper.getBoundingClientRect();
                rsStartW = rect.width; rsStartH = rect.height;
                rsStartLeft = rect.left; rsStartTop = rect.top;
                if (wrapper.style.height && Number(wrapper.style.height.replace('px','')) > 0) rsHeightTouched = true;
                else { rsHeightTouched = false; rsStartH = Math.max(rsStartH, RS_MIN_H); }
                document.body.style.userSelect = 'none';
                e.preventDefault(); e.stopPropagation();
            });
        });

        const rsClampW = (w) => Math.max(RS_MIN_W, Math.min(w, window.innerWidth));
        const rsClampH = (h) => Math.max(RS_MIN_H, Math.min(h, window.innerHeight * 0.94));

        document.addEventListener('mousemove', (e) => {
            if(!isResizing) return;
            const dx = e.clientX - rsStartX, dy = e.clientY - rsStartY;
            let newW = rsStartW, newH = rsStartH;
            /* 宽度：东缘向右拉大、西缘向左拉大；西/北方向同步平移保持对边不动 */
            if (rsDir.includes('e')) newW = rsClampW(rsStartW + dx);
            if (rsDir.includes('w')) {
                newW = rsClampW(rsStartW - dx);
                wrapper.style.left = Math.max(0, Math.min(rsStartLeft + (rsStartW - newW), window.innerWidth - 60)) + 'px';
            }
            /* 高度：南缘向下拉大、北缘向上拉大；最小化状态下高度不参与调整 */
            if (!isMin) {
                if (rsDir.includes('s')) newH = rsClampH(rsStartH + dy);
                if (rsDir.includes('n')) {
                    newH = rsClampH(rsStartH - dy);
                    wrapper.style.top = Math.max(0, Math.min(rsStartTop + (rsStartH - newH), window.innerHeight - 50)) + 'px';
                }
            }
            wrapper.style.width = Math.round(newW) + 'px';
            if (!isMin && (rsDir.includes('n') || rsDir.includes('s'))) {
                wrapper.style.height = Math.round(newH) + 'px';
                rsHeightTouched = true;
            }
            e.preventDefault();
        }, uiDocumentListenerOptions);

        document.addEventListener('mouseup', () => {
            if(isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                GM_setValue('xy_panel_width', Math.round(parseFloat(wrapper.style.width) || rsStartW));
                if (rsHeightTouched) {
                    GM_setValue('xy_panel_height', Math.round(parseFloat(wrapper.style.height) || rsStartH));
                }
            }
        }, uiDocumentListenerOptions);

        const gripBtn = document.getElementById('xy-rs-grip');
        if (gripBtn) gripBtn.ondblclick = () => {
            GM_setValue('xy_panel_width', 360);
            GM_setValue('xy_panel_height', '');
            wrapper.style.width = '360px';
            wrapper.style.height = '';
            showToast('面板尺寸已复位为默认 (宽360 · 高度自适应)', 'info');
        };

        setTimeout(() => syncHardwareMute(), 100);
        fetchCloudIntelligence();
        setTimeout(() => xyUpdateAutoCheck(), 2500);
        playState.isTaskCompleted = false;
        applyThemeClasses();
        _uiCreating = false;
    }

    
    
    
    let _uiCreating = false;
    /**
     * UI 存活保障心跳：清理由页面框架重建产生的重复面板（querySelectorAll 多实例
     * 只留第一个）→ 面板缺失时 _uiCreating 互斥锁内 createUI → 存活则依次驱动
     * OverviewSyncRoute / KeepaliveWatchdog 启停 / runLowLevelScanner 扫描链 /
     * 作业路由 watcher 安装 / 反馈问卷注入。installUIObserver 在面板被移除时回调它。
     * [DEEP-DOC]
     */
    function ensureUI() {
        if (_uiCreating) return;
        
        const allPanels = document.querySelectorAll('#xy-super-console');
        if (allPanels.length > 1) {
            for (let i = 1; i < allPanels.length; i++) {
                try { allPanels[i].remove(); } catch(e) {}
            }
        }
        if (!document.getElementById('xy-super-console')) {
            if (!document.body) { scheduleEnsureUI(50); return; }
            _uiCreating = true;
            try {
                createUI();
            } catch (e) {
                _uiCreating = false;
                console.error('[小雅] 创建面板失败', e);
                return;
            }
        }
        if (!document.getElementById('xy-super-console')) return;

        xyOverviewSyncRoute();

        
        if (guardState.keepaliveEnabled && !keepaliveWatchdogTimer) {
            startKeepaliveWatchdog();
        }

        runLowLevelScanner().then(() => {
            updateCourseUI();
            updateDiscUI();
            
            if (hwQuestionsData.length === 0 && (new URL(window.location.href).searchParams.get('paper_id') || getPaperId())) {
                setTimeout(hwProactiveFetchData, 200);
            }
        }).catch(e => {
            console.warn('[小雅] 页面扫描失败:', e);
        });
    }

    let _ensureUIScheduled = false;
    /** ensureUI 的延时重试封装：document.body 未就绪（document-start）时按 delay
     * 毫秒后再尝试一次，避免启动期空指针。
     * [DEEP-DOC]
     */
    function scheduleEnsureUI(delay = 0) {
        if (_ensureUIScheduled) return;
        _ensureUIScheduled = true;
        setTimeout(() => {
            _ensureUIScheduled = false;
            ensureUI();
        }, delay);
    }

    let _uiObserver = null;
    /**
     * 面板存活观察器：MutationObserver 监听 body 子树，仅在检测到 #xy-super-console
     * 从 DOM 消失时回调 ensureUI 补建；普通 SPA 更新通过「面板存在」短路快速返回，
     * 避免高频回调开销。observer 自身幂等安装。
     * [DEEP-DOC]
     */
    function installUIObserver() {
        if (_uiObserver || !document) return;
        _uiObserver = new MutationObserver(() => {
            // 只在面板被页面重建/移除时补建，避免 SPA 的普通 DOM 更新触发重复扫描。
            if (!document.getElementById('xy-super-console')) scheduleEnsureUI(50);
        });
        _uiObserver.observe(document, { childList: true, subtree: true });
    }

    installUIObserver();
    /**
     * 作业路由变化处理：URL 的 paper/group 参数变化时比对 hwActiveTaskKey，
     * 不同试卷则 hwResetState 清场等待新题目捕获；同卷微调（如锚点变化）不动状态。
     * [DEEP-DOC]
     */
    function hwHandleRouteChange() {
        setTimeout(() => {
            
            if (_hwDataJustLoaded) return;
            if (!hwActiveTaskKey) return;
            const href = window.location.href;
            let match = true;
            try {
                const u = new URL(href, window.location.origin);
                if (u.searchParams.get('group_id') !== hwGroupId && hwGroupId) match = false;
                if (u.searchParams.get('node_id') !== hwNodeId && hwNodeId) match = false;
                if (u.searchParams.get('paper_id') !== hwPaperId && hwPaperId) match = false;
            } catch(e) {}
            const ids = [hwGroupId, hwNodeId].filter(Boolean);
            if (ids.length && !ids.every(id => href.includes(id))) match = false;
            if (hwPaperId && !href.includes(hwPaperId)) match = false;
            if (!match) {
                hwResetState('页面路由已离开当前作业任务');
            }
        }, 80);
    }
    /**
     * 路由监听安装（一次性）：包装 history.pushState/replaceState + popstate 事件，
     * 三路统一派发给 hwHandleRouteChange。使 SPA 无刷新跳转也能感知试卷切换。
     * [DEEP-DOC]
     */
    function hwInstallRouteWatcher() {
        if (hwInstallRouteWatcher._done) return;
        hwInstallRouteWatcher._done = true;
        const wrap = methodName => {
            const orig = history[methodName];
            if (typeof orig !== 'function') return;
            history[methodName] = function(...args) { const r = orig.apply(this, args); hwHandleRouteChange(); return r; };
        };
        wrap('pushState'); wrap('replaceState');
        window.addEventListener('popstate', hwHandleRouteChange);
        window.addEventListener('hashchange', () => { hwHandleRouteChange(); scheduleEnsureUI(100); });
    }
    hwInstallRouteWatcher();

    const pushState = history.pushState; history.pushState = function () { pushState.apply(history, arguments); scheduleEnsureUI(100); };
    const replaceState = history.replaceState; history.replaceState = function () { replaceState.apply(history, arguments); scheduleEnsureUI(100); };
    window.addEventListener('popstate', () => scheduleEnsureUI(100));

    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', () => { ensureUI(); });
    } else {
        ensureUI();
    }

    
    window.xyKeepaliveStatus = () => {
        console.log('[小雅] 后台保活:', guardState.keepaliveEnabled ? 'ON' : 'OFF');
        console.log('[小雅] 看门狗:', keepaliveWatchdogTimer ? '运行中' : '未启动');
    };
    window.xyExportFeedbacks = () => {
        const local = JSON.parse(GM_getValue('xy_local_feedbacks', '[]'));
        if (local.length === 0) { console.log('📭 暂无本地反馈'); return; }
        console.log(`📋 共 ${local.length} 条本地反馈：`);
        console.log(JSON.stringify(local, null, 2));
        console.log('\n💡 复制上面的 JSON 即可手动导入');
    };

    
    window.xySetupFeedbackForm = () => {
        const formUrl = prompt(
            '📋 配置 Google 表单反馈\n\n' +
            '1. 打开 https://forms.google.com 创建一个新表单\n' +
            '2. 只加一个「段落」（Paragraph）类型的题目\n' +
            '3. 点右上角「发送」→ 复制链接\n' +
            '4. 把链接粘贴到这里：\n\n' +
            '链接示例：https://forms.gle/XXXX 或 https://docs.google.com/forms/d/e/XXXX/viewform'
        );
        if (!formUrl) { console.log('已取消'); return; }

        
        const match1 = formUrl.match(/\/d\/e\/([^/]+)/);
        const match2 = formUrl.match(/forms\.gle\/([^/]+)/);
        let formId = match1 ? match1[1] : (match2 ? match2[1] : null);

        if (!formId) {
            console.log('❌ 无法从链接中提取表单 ID，请检查链接格式');
            console.log('   正确格式：https://docs.google.com/forms/d/e/XXXXXX/viewform');
            return;
        }

        
        const previewUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
        console.log('🔍 正在分析表单...');
        console.log('   如果自动检测失败，请打开此链接手动获取：' + previewUrl);
        console.log('   在页面源代码中搜索 entry. 找到类似 entry.123456789 的值');

        fetch(previewUrl)
            .then(r => r.text())
            .then(html => {
                const match = html.match(/entry\.(\d+)/);
                if (match) {
                    const entryId = 'entry.' + match[1];
                    GM_setValue('xy_feedback_form_id', formId);
                    GM_setValue('xy_feedback_entry_id', entryId);
                    console.log('✅ 配置成功！');
                    console.log('   Form ID: ' + formId);
                    console.log('   Entry ID: ' + entryId);
                    console.log('   现在提交反馈即可自动上传到 Google Sheets！');
                } else {
                    
                    const manual = prompt(
                        '⚠ 自动检测失败\n\n请在浏览器打开：' + previewUrl + '\n' +
                        '右键 → 查看页面源代码 → 搜索 "entry."\n' +
                        '找到类似 entry.123456789 的值，粘贴到这里：\n' +
                        '（例如：entry.123456789）'
                    );
                    if (manual && manual.startsWith('entry.')) {
                        GM_setValue('xy_feedback_form_id', formId);
                        GM_setValue('xy_feedback_entry_id', manual);
                        console.log('✅ 手动配置成功！');
                    } else {
                        console.log('❌ 配置失败，请重试');
                    }
                }
            })
            .catch(() => {
                console.log('⚠ 自动检测失败，请手动配置：');
                console.log('   1. 打开 ' + previewUrl);
                console.log('   2. 右键 → 查看页面源代码 → 搜索 entry.');
                console.log('   3. 执行：GM_setValue("xy_feedback_form_id", "' + formId + '");');
                console.log('   4. 执行：GM_setValue("xy_feedback_entry_id", "entry.XXXXXXXXX");');
            });
    };
    /** 反馈问卷浮层样式注入：一次性 style 标签（幂等：已存在跳过），内含遮罩/
     * 卡片/iframe 容器的全套 CSS。
     * [DEEP-DOC]
     */
    function xyInjectFeedbackStyle() {
        GM_addStyle(`
            /* ── 反馈问卷遮罩 ── */
            #xy-feedback-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.72); z-index: 2147483645;
                display: flex; justify-content: center; align-items: center;
                animation: xy-fb-in 0.25s ease-out;
            }
            @keyframes xy-fb-in { 0%{opacity:0} 100%{opacity:1} }
            @keyframes xy-fb-pop { 0%{opacity:0;transform:translateY(20px) scale(0.96)} 100%{opacity:1;transform:translateY(0) scale(1)} }

            #xy-feedback-modal {
                width: 620px; max-width: 92vw; max-height: 88vh; overflow-y: auto;
                background: rgba(15,23,42,0.96); border: 1px solid rgba(99,102,241,0.3);
                border-radius: 18px; box-shadow: 0 0 60px rgba(99,102,241,0.12), 0 24px 80px rgba(0,0,0,0.6);
                animation: xy-fb-pop 0.35s cubic-bezier(0.16,1,0.3,1);
                padding: 32px 36px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
            }
            #xy-feedback-modal .xy-fb-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 24px; padding-bottom: 18px;
                border-bottom: 1px solid rgba(99,102,241,0.2);
            }
            #xy-feedback-modal .xy-fb-title {
                font-size: 20px; font-weight: 700; color: #e2e8f0;
                display: flex; align-items: center; gap: 10px;
            }
            #xy-feedback-modal .xy-fb-close {
                cursor: pointer; color: #64748b; font-size: 22px; padding: 4px 8px;
                border-radius: 6px; transition: 0.2s; line-height: 1;
            }
            #xy-feedback-modal .xy-fb-close:hover { background: rgba(71,85,105,0.4); color: #e2e8f0; }

            /* ── 原生表单样式 ── */
            #xy-feedback-modal .xy-fb-q { margin-bottom: 22px; }
            #xy-feedback-modal .xy-fb-q-title { font-size: 14px; font-weight: 600; color: #e2e8f0; margin-bottom: 10px; }
            #xy-feedback-modal .xy-stars { display: flex; gap: 6px; }
            #xy-feedback-modal .xy-stars span { font-size: 32px; color: rgba(251,191,36,0.25); cursor: pointer; transition: 0.12s; user-select: none; }
            #xy-feedback-modal .xy-stars span:hover, #xy-feedback-modal .xy-stars span.active { color: #fbbf24; transform: scale(1.1); }
            #xy-feedback-modal .xy-checks { display: flex; flex-wrap: wrap; gap: 8px; }
            #xy-feedback-modal .xy-check { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #cbd5e1; cursor: pointer; padding: 6px 12px; background: rgba(30,41,59,0.6); border: 1px solid rgba(71,85,105,0.35); border-radius: 8px; transition: 0.15s; }
            #xy-feedback-modal .xy-check:hover { border-color: rgba(129,140,248,0.5); background: rgba(30,41,59,0.8); }
            #xy-feedback-modal .xy-check input[type="checkbox"] { accent-color: #818cf8; width: 15px; height: 15px; cursor: pointer; }
            #xy-feedback-modal .xy-fb-input, #xy-feedback-modal .xy-fb-textarea { width: 100%; box-sizing: border-box; background: rgba(30,41,59,0.8); color: #e2e8f0; border: 1px solid rgba(71,85,105,0.5); border-radius: 8px; padding: 10px 14px; font-size: 13px; font-family: inherit; resize: vertical; }
            #xy-feedback-modal .xy-fb-input:focus, #xy-feedback-modal .xy-fb-textarea:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); outline: none; }
            #xy-feedback-modal .xy-fb-input::placeholder, #xy-feedback-modal .xy-fb-textarea::placeholder { color: #64748b; }
            #xy-feedback-modal .xy-fb-submit { display: block; width: 100%; margin-top: 20px; padding: 12px; background: linear-gradient(135deg, #818cf8, #6366f1); color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; }
            #xy-feedback-modal .xy-fb-submit:hover { background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 16px rgba(99,102,241,0.35); transform: translateY(-1px); }
            #xy-feedback-modal .xy-fb-note { text-align: center; font-size: 11px; color: #64748b; margin-top: 10px; }

            /* ── 浅色模式 ── */
            body.xy-theme-light #xy-feedback-modal { background: #ffffff; border-color: #e2e8f0; box-shadow: 0 0 40px rgba(0,0,0,0.08), 0 24px 80px rgba(0,0,0,0.1); }
            body.xy-theme-light #xy-feedback-modal .xy-fb-title { color: #0f172a; }
            body.xy-theme-light #xy-feedback-modal .xy-fb-header { border-bottom-color: #e2e8f0; }
            body.xy-theme-light #xy-feedback-modal .xy-fb-q-title { color: #0f172a; }
            body.xy-theme-light #xy-feedback-modal .xy-fb-input, body.xy-theme-light #xy-feedback-modal .xy-fb-textarea { background: #f8fafc; color: #0f172a; border-color: #e2e8f0; }
            body.xy-theme-light #xy-feedback-modal .xy-check { background: #f8fafc; border-color: #e2e8f0; color: #334155; }
            body.xy-theme-light #xy-feedback-modal .xy-check:hover { border-color: #c7d2fe; background: #eef2ff; }
        `);
    }
    /**
     * 用户反馈问卷浮层：Google Forms iframe 内嵌（表单 ID 由 GM 存储读取，
     * 未配置时 console 打印配置指引而非弹空窗）。遮罩点击关闭；提交成功依赖
     * Forms 自身跳转，脚本侧不做回执校验。
     * [DEEP-DOC]
     */
    function xyShowFeedbackSurvey() {
        window.open('https://scriptcat.org/zh-CN/script-show-page/5881/issue/create', '_blank');
    }
    /**
     * 反馈上云通道：Gitee Issue 创建 API（token 鉴权）。成功返回 issue url；
     * 401/网络失败自动降级调 SaveFeedbackLocal 落本地并提示稍后重试。
     * [DEEP-DOC]
     */
    function xySaveFeedbackToGitee(surveyData) {
        const payload = {
            timestamp: new Date().toISOString(),
            version: SCRIPT_VERSION,
            userAgent: navigator.userAgent,
            platform: window.location.hostname,
            answers: surveyData
        };

        
        
        const feedbackText = JSON.stringify(payload, null, 2);

        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://scriptcat.org/api/v2/feedback',
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            data: JSON.stringify({
                Reason: 'other',
                title: '[小雅反馈] ' + (payload.answers && payload.answers.satisfaction ? '满意度' + payload.answers.satisfaction + '/5' : '用户体验调查'),
                content: '## 📋 小雅辅助工具 v' + SCRIPT_VERSION + ' 反馈\n\n```json\n' + feedbackText + '\n```',
                scriptId: 5881
            }),
            onload: function (resp) {
                try {
                    const result = JSON.parse(resp.responseText);
                    if (result.code === 0) {
                        logMsg('✅ 反馈已提交至 ScriptCat，感谢！', 'success', false);
                    } else {
                        logMsg('⚠ 提交失败：' + (result.msg || '未知错误'), 'warning', false);
                        xySaveFeedbackLocal(payload);
                    }
                } catch(e) {
                    xySaveFeedbackLocal(payload);
                }
            },
            onerror: function () {
                xySaveFeedbackLocal(payload);
            }
        });
    }
    /** 反馈本地降级存储：追加进 GM 数组 xy_local_feedbacks（带上时间戳与页面
     * URL 上下文），下次打开反馈面板时可一键重试上传。
     * [DEEP-DOC]
     */
    function xySaveFeedbackLocal(payload) {
        try {
            const localFeedbacks = JSON.parse(GM_getValue('xy_local_feedbacks', '[]'));
            localFeedbacks.push(payload);
            
            if (localFeedbacks.length > 50) localFeedbacks.splice(0, localFeedbacks.length - 50);
            GM_setValue('xy_local_feedbacks', JSON.stringify(localFeedbacks));
            logMsg('📦 反馈已暂存本地（共 ' + localFeedbacks.length + ' 条）', 'info', false);
        } catch (e) {
            logMsg('⚠ 本地存储失败', 'warning', false);
        }
    }


})();
