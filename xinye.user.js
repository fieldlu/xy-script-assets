// ==UserScript==
// @name         欣野（小雅辅助工具）
// @version      2.2.3
// @description  「欣野」✨ 小雅网页版终极效率外挂！双核驱动刷课+讨论区自动点赞～ 刷课智能防卡、循环连播、心跳加密🥳；点赞精准狙击、API抓名单、仿生间隔超安全🎯！致敬前辈 zygame1314 ❤️，一个面板全搞定，效率拉满🚀！
// @author       xinye (Fixed by Gemini)
// @license      MIT
// @match        https://*.ai-augmented.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @updateURL    https://gitee.com/fieldlu/xy-script-assets/raw/main/xinye.user.js
// @icon         data:image/png;base64,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

// ==/UserScript==

(function () {
    'use strict';

    const domain = window.location.hostname;

    (function injectStealthEngine() {
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                // 1. 视界欺骗（防切屏）
                Object.defineProperties(document, {
                    hidden: { value: false, configurable: false },
                    visibilityState: { value: 'visible', configurable: false }
                });
                
                const originAdd = EventTarget.prototype.addEventListener;
                EventTarget.prototype.addEventListener = function(type, fn, opts) {
                    if (['visibilitychange', 'blur', 'pagehide'].includes(type) && (this === window || this === document)) return;
                    return originAdd.call(this, type, fn, opts);
                };

                // 2. 暴力音轨剥离（Web Audio API + DOM Media 双重拦截）
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
            })();
        `;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    })();

    
    const appState = {
        activeZone: 'uninitialized', 
        mode: GM_getValue('xy_play_mode', 'sequence'), 
        recordActive: false,
        guardActive: GM_getValue('xy_guard_active', true),
        hardwareMute: GM_getValue('xy_hw_mute', true), 
        isTaskCompleted: false, 
        recordCount: parseInt(sessionStorage.getItem('xy_recordCount')) || 0,
        totalTime: parseInt(sessionStorage.getItem('xy_totalTime')) || 0,
        realTime: parseInt(sessionStorage.getItem('xy_realTime')) || 0,
        lastRecordDate: null,
        lastPopupClickTime: 0,
        isFreedomMode: false,
        aiMode: GM_getValue('xy_ai_mode', true),
        videoAutoSubmit: GM_getValue('xy_video_submit', true),
        docBatchSubmit: GM_getValue('xy_doc_batch', true),
        showRefreshPanel: GM_getValue('xy_show_refresh_panel', true),
        showTerminal: GM_getValue('xy_show_terminal', false),
        enableDomScan: true, 
        currentEngine: 'none',
        docReadTime: 0,
        lastDocSubmitTime: 0,
        videoScriptProgress: undefined,
        videoLastTime: 0,
        batchDocSubmitting: false,
        courseResourcesCache: null,
        lastCourseGroupId: null,
        discGroupId: null, 
        discussionId: null,
        targetNames: [],
        selectedNames: new Set(),
        docPreviewDoneNodeId: null,
        discLockedUrl: null,
        jumpFailCount: 0,
        jumpSleepUntil: 0,
        useCustomReply: GM_getValue('xy_use_custom_reply', false),
        customReplies: []
    };

    try { 
        appState.targetNames = JSON.parse(GM_getValue('xy_target_names', '[]')); 
    } catch(e) { 
        appState.targetNames = []; 
    }

    try {
        appState.customReplies = JSON.parse(GM_getValue('xy_custom_replies', '[]'));
    } catch(e) {
        appState.customReplies = [];
    }
    
    let sessionLogs = [];
    try { sessionLogs = JSON.parse(sessionStorage.getItem('xy_session_logs')) || []; } catch(e) { sessionLogs = []; }
    
    let recordIntervalTimer = null; 
    let realTimeTimer = null;
    let isFetchingResources = false;
    let isSubmittingLock = false;
    let isJumpingLock = false;

    // 动态定时重载调度器变量
    let dynamicRefreshTimeoutId = null;
    let refreshCountdownTimer = null;
    let lastRefreshStrategy = 'none';

    function syncHardwareMute() { document.dispatchEvent(new CustomEvent('xy-volume-change', { detail: { mute: appState.hardwareMute } })); }
    function getCourseGroupId() { const match = window.location.href.match(/(?:mycourse|course)\/(\d+)/); return match ? match[1] : null; }
    function getNodeId() { const match = window.location.href.match(/resource\/\d+\/(\d+)/); return match ? match[1] : null; }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    function getCookie(keyword = 'prd-access-token') { for (const cookie of document.cookie.split('; ')) { const [name, value] = cookie.split('='); if (name.includes(keyword)) return value; } return null; }
    async function getAuthToken() { const token = getCookie(); if (token) return token; throw new Error('未找到Token'); }
    function cleanName(str) { if (!str) return ""; return str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim(); }
    function decodeNickname(encodedStr) {
        if (!encodedStr) return "匿名"; let res = encodedStr;
        try { res = decodeURIComponent(escape(atob(encodedStr))).split('').reverse().join(''); } catch(e) { try { res = new TextDecoder().decode(Uint8Array.from(atob(encodedStr), c => c.charCodeAt(0))).split('').reverse().join(''); } catch (err) {} }
        return cleanName(res);
    }

    function flattenResources(arr) {
        let res = [];
        if (!Array.isArray(arr)) return res;
        arr.forEach(item => {
            res.push(item);
            if (item.children) res = res.concat(flattenResources(item.children));
            if (item.child_nodes) res = res.concat(flattenResources(item.child_nodes));
            if (item.items) res = res.concat(flattenResources(item.items));
        });
        return res;
    }

    // ==========================================
    // 🚀 底层雷达系统 & 状态秒判
    // ==========================================
    function switchToZone(newZone) {
        if (appState.activeZone === newZone) return;
        const oldZone = appState.activeZone;
        appState.activeZone = newZone;

        if (oldZone === 'course') {
            toggleRecord(false); 
        }
        
        if (newZone === 'standby' || newZone === 'disc') {
            clearDynamicRefresh();
        }
        
        const superConsole = document.getElementById('xy-super-console');
        if (superConsole) {
            superConsole.style.display = 'flex';
        }
        
        const viewC = document.getElementById('xy-view-course'), viewD = document.getElementById('xy-view-disc'), viewS = document.getElementById('xy-view-standby'), badge = document.getElementById('xy-zone-badge');
        if (viewC && viewD && viewS && badge) {
            viewC.style.display = newZone === 'course' ? 'block' : 'none';
            viewD.style.display = newZone === 'disc' ? 'block' : 'none';
            viewS.style.display = newZone === 'standby' ? 'flex' : 'none';
            
            if (newZone === 'course') {
                badge.innerHTML = '📚 刷课区'; badge.style.background = '#dbeafe'; badge.style.color = '#1e40af'; 
            } else if (newZone === 'disc') {
                badge.innerHTML = '💭 讨论区'; badge.style.background = '#ffedd5'; badge.style.color = '#c2410c'; 
            } else {
                badge.innerHTML = '🏝️ 待命区'; badge.style.background = '#f1f5f9'; badge.style.color = '#475569'; 
            }
        }
        
        if (oldZone !== 'uninitialized') {
            const zoneName = newZone === 'course' ? '视频/文档自动引擎' : newZone === 'disc' ? '互动点赞引擎' : '系统隔离待命区';
            logMsg(`📍 底层指令：已切换至【${zoneName}】`, newZone === 'standby' ? 'warning' : 'success', false);
        }
        
        if (newZone === 'course') {
            ensureAutoRecord(); 
            globalTaskStatusChecker(true);
            appState.docReadTime = 0; 
            appState.lastDocSubmitTime = 0;
            appState.videoScriptProgress = undefined; 
            appState.isTaskCompleted = false;
        }
    }

    async function runLowLevelScanner() {
        if (appState.discLockedUrl === window.location.href) { switchToZone('disc'); return; }
        const groupId = getCourseGroupId(); const nodeId = getNodeId();
        if (!groupId || !nodeId) { switchToZone('standby'); return; }

        let taskType = -1;
        
        try {
            const token = await getAuthToken();
            const radarRes = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { headers: { "authorization": `Bearer ${token}` } });
            const radarData = await radarRes.json();
            if (radarData.success && radarData.data) {
                const rTask = radarData.data.find(t => t.node_id == nodeId);
                if (rTask) {
                    taskType = rTask.task_type;
                } else {
                    const resources = await loadCourseResources(groupId);
                    if (resources) {
                        const flatRes = flattenResources(resources);
                        const currentRes = flatRes.find(r => r.node_id == nodeId || r.id == nodeId);
                        if (currentRes) taskType = currentRes.task_type;
                    }
                    if (!appState.isTaskCompleted && appState.activeZone === 'course') {
                        appState.isTaskCompleted = true;
                        logMsg('✅ [雷达秒判] 当前任务已在全局雷达达成，瞬间放行！', 'success', false);
                        updateCourseUI();
                    }
                }
            }
        } catch(e) {}

        if (taskType === 1) { switchToZone('course'); return; } 
        else if (taskType === 6) { switchToZone('disc'); return; } 
        else if (taskType > 1 && taskType <= 5) {
            if (appState.activeZone !== 'standby') logMsg(`⚠️ API侦测到【测验/作业/问卷】任务！引擎休眠！`, 'error', false);
            switchToZone('standby'); return;
        }

        const htmlStr = document.body ? document.body.innerHTML : '';
        if (document.querySelector('video, iframe[src*="ow365"], iframe[src*="office"], .prism-player, .aliplayer, .xy_disk_preview, .pdf-viewer')) {
            switchToZone('course'); return;
        }
        if (document.querySelector('.discussion-container, .jx-discussion, [class*="discuss"]') || htmlStr.includes('发表评论') || htmlStr.includes('全部评论')) {
            switchToZone('disc'); return;
        }
        switchToZone('standby');
    }

    async function loadCourseResources(groupId) {
        if(appState.lastCourseGroupId === groupId && appState.courseResourcesCache) return appState.courseResourcesCache;
        if(isFetchingResources) { let waitLoops = 0; while(isFetchingResources && waitLoops < 50) { await sleep(100); waitLoops++; } return appState.courseResourcesCache; }
        isFetchingResources = true;
        try {
            const token = await getAuthToken(); 
            const res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${groupId}`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) { appState.courseResourcesCache = data.data; appState.lastCourseGroupId = groupId; }
        } catch(e) {} 
        isFetchingResources = false;
        return appState.courseResourcesCache;
    }

    // ==========================================
    // 🛠️ 弹窗、日志与UI交互
    // ==========================================
    function xyShowModal(title, message, onConfirm = null) {
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 2147483647; opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(8px); padding: 20px;`;
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(249,250,251,0.98)); border-radius: 20px; min-width: 400px; max-width: 90%; padding: 28px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.8); transform: scale(0.95); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ef4444, #f87171); opacity: 0.8;"></div>
                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 16px; background: linear-gradient(145deg, #fee2e2, #fecaca); display: flex; align-items: center; justify-content: center; font-size: 24px;">⚠️</div>
                    <h3 style="margin: 0; color: #991b1b; font-size: 20px; font-weight: 600;">${title}</h3>
                </div>
                <div style="color: #7f1d1d; line-height: 1.7; margin-bottom: 28px; font-size: 15px; background: rgba(254,226,226,0.5); padding: 20px; border-radius: 16px; border: 1px solid rgba(239,68,68,0.2);">${message}</div>
                <div style="display: flex; justify-content: flex-end; gap: 16px;">
                    <button class="modal-confirm" style="padding: 10px 24px; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(145deg, #ef4444, #dc2626); color: white; box-shadow: 0 4px 12px rgba(220,38,38,0.3); transition: 0.2s;">我知道了</button>
                </div>
            </div>`;
        modal.appendChild(content); document.body.appendChild(modal);
        requestAnimationFrame(() => { modal.style.opacity = '1'; content.firstElementChild.style.transform = 'scale(1)'; });
        const closeModal = () => { modal.style.opacity = '0'; content.firstElementChild.style.transform = 'scale(0.95)'; setTimeout(() => modal.remove(), 300); };
        content.querySelector('.modal-confirm').onclick = () => { closeModal(); if(onConfirm) onConfirm(); };
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    function showToast(msg, type = 'info') {
        const colors = { success: { bg: 'linear-gradient(145deg, #10b981, #059669)', icon: '🎉' }, warning: { bg: 'linear-gradient(145deg, #f59e0b, #d97706)', icon: '⚠️' }, error: { bg: 'linear-gradient(145deg, #ef4444, #dc2626)', icon: '❌' }, info: { bg: 'linear-gradient(145deg, #3b82f6, #2563eb)', icon: 'ℹ️' } };
        const currentType = colors[type] || colors.info;
        let container = document.getElementById('xy-toast-box');
        if (!container) { container = document.createElement('div'); container.id = 'xy-toast-box'; container.style.cssText = `position:fixed; top:24px; left:50%; transform:translateX(-50%); z-index:9999999; display:flex; flex-direction:column; gap:12px; pointer-events:none;`; document.body.appendChild(container); }
        const toast = document.createElement('div');
        toast.style.cssText = `background:${currentType.bg}; color:white; padding:14px 20px; border-radius:12px; font-weight:bold; font-size:14px; box-shadow:0 10px 25px rgba(0,0,0,0.2); transition:all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); opacity:0; transform:translateY(-30px) scale(0.9); backdrop-filter: blur(8px); display:flex; align-items:center; overflow:hidden; position:relative;`;
        toast.innerHTML = `<span style="margin-right:10px; font-size:18px;">${currentType.icon}</span><span style="flex:1; z-index:1;">${msg}</span><div style="position:absolute; bottom:0; left:0; height:3px; background:rgba(255,255,255,0.4); width:100%; transform-origin:left; animation: xy-toast-progress 3s linear forwards;"></div>`;
        container.appendChild(toast);
        if(!document.getElementById('xy-toast-style')) { const style = document.createElement('style'); style.id = 'xy-toast-style'; style.innerHTML = `@keyframes xy-toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`; document.head.appendChild(style); }
        requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0) scale(1)'; });
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px) scale(0.9)'; setTimeout(() => toast.remove(), 400); }, 3000);
    }

    function logMsg(msg, type = 'info', isSilent = false) {
        const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#38bdf8', silent: '#64748b' };
        const color = isSilent ? colors.silent : (colors[type] || colors.info);
        const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
        const logStr = `[${time}] ${msg}`;
        sessionLogs.push({ text: logStr, color: color });
        if (sessionLogs.length > 80) sessionLogs.shift();
        sessionStorage.setItem('xy_session_logs', JSON.stringify(sessionLogs));
        const logBox = document.getElementById('xy-activity-log');
        if (logBox) {
            const el = document.createElement('div'); el.style.color = color; el.innerText = logStr; logBox.appendChild(el);
            logBox.scrollTop = logBox.scrollHeight;
            if (logBox.children.length > 80) logBox.removeChild(logBox.firstChild);
        }
        if (!isSilent && (type === 'success' || type === 'error' || type === 'warning' || type === 'info')) showToast(msg, type);
    }

    function robustClick(el) {
        if (!el) return;
        try { const opts = { bubbles: true, cancelable: true, view: window }; el.dispatchEvent(new MouseEvent('pointerdown', opts)); el.dispatchEvent(new MouseEvent('click', opts)); el.click(); } catch (e) { el.click(); }
    }

    // ==========================================
    // 动态条件定时重载引擎
    // ==========================================
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

    // 🔥暴力且彻底地销毁调度器的方法
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

    function checkDynamicRefresh() {
        // 如果处于待命区/讨论区，无条件拦截并清空倒计时
        if (appState.activeZone !== 'course') {
            if (lastRefreshStrategy !== 'none' || dynamicRefreshTimeoutId) { 
                clearDynamicRefresh(); 
            }
            return;
        }

        const currentTaskType = appState.currentEngine;

        if (appState.mode === 'loop') {
            if (currentTaskType === 'doc') {
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
        } else if (appState.mode === 'sequence') {
            if (appState.isTaskCompleted || Date.now() < appState.jumpSleepUntil) {
                if (lastRefreshStrategy !== 'sequence_completed') {
                    lastRefreshStrategy = 'sequence_completed';
                    scheduleDynamicRefresh(10 * 60 * 1000, `连播状态休眠探测`);
                }
            } else if (currentTaskType === 'doc') {
                if (lastRefreshStrategy !== 'sequence_doc') {
                    lastRefreshStrategy = 'sequence_doc';
                    scheduleDynamicRefresh(15 * 60 * 1000, `文档挂机防卡死`);
                }
            } else {
                if (lastRefreshStrategy !== 'none') {
                    clearDynamicRefresh(); 
                }
            }
        } else {
            if (currentTaskType === 'doc') {
                if (lastRefreshStrategy !== 'manual_doc') {
                    lastRefreshStrategy = 'manual_doc';
                    scheduleDynamicRefresh(15 * 60 * 1000, `文档挂机防卡死`);
                }
            } else {
                if (lastRefreshStrategy !== 'none') {
                    clearDynamicRefresh(); 
                }
            }
        }
    }

    // ==========================================
    // 🕸️ 网络抓包与DOM双向解析：零延迟讨论区监听
    // ==========================================
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

    function dispatchCaptureEvent(did, gid) {
        if (did && gid && (appState.discussionId !== did || appState.discGroupId !== gid)) {
            appState.discussionId = did; appState.discGroupId = gid;
            window.dispatchEvent(new CustomEvent('xy-disc-captured', { detail: { did, gid } }));
        }
    }

    function processDiscussionList(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const newNames = [];
        list.forEach(item => { const realName = decodeNickname(item.nickname); if (realName && realName !== "匿名" && !realName.includes("=")) newNames.push(realName); });
        
        if (newNames.length > 0) {
            const beforeCount = appState.targetNames.length;
            let added = false;
            newNames.forEach(n => {
                if(!appState.targetNames.includes(n)) {
                    appState.targetNames.push(n);
                    added = true;
                }
            });
            if (added) {
                GM_setValue('xy_target_names', JSON.stringify(appState.targetNames));
                renderTargetList(document.getElementById('xy-name-search')?.value || '');
                if(appState.activeZone === 'disc') logMsg(`📄 网络包捕获 ${appState.targetNames.length - beforeCount} 位新用户`, 'info', true);
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
            } catch(e) {}
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
            } catch(e) {}
        });
        return originalXhrSend.apply(this, arguments);
    };

    window.addEventListener('xy-disc-captured', (e) => { 
        appState.discLockedUrl = window.location.href; 
        if (appState.activeZone !== 'disc') { 
            logMsg(`🎯 抓包拦截：零延迟识别讨论区网络流！`, 'success', false); 
            switchToZone('disc'); 
        }
        
        logMsg('🔄 检测到新讨论区，自动清空旧名单并开启全量采集...', 'info');
        appState.targetNames = [];
        appState.selectedNames.clear();
        GM_setValue('xy_target_names', JSON.stringify([]));
        renderTargetList(document.getElementById('xy-name-search')?.value || '');
        
        setTimeout(() => {
            fetchCurrentUsers();
        }, 800);

        updateDiscUI(); 
    });

    // ==========================================
    // 🔥 核心战斗模块：纯净雷达寻路与提交
    // ==========================================
    async function getTaskTypeAccurate() {
        if (document.querySelector('video') || document.querySelector('.prism-player') || document.querySelector('.aliplayer')) return 'video';
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            const src = iframes[i].src || ''; if (src.includes('player') || src.includes('video') || src.includes('aliplayer')) return 'video';
            try { if (iframes[i].contentDocument && iframes[i].contentDocument.querySelector('video')) return 'video'; } catch(e) {}
        }
        return 'doc';
    }

    async function autoSubmitCurrentTask(silent = false) {
        if (isSubmittingLock) return false;
        isSubmittingLock = true;
        try {
            const token = await getAuthToken(); const groupId = getCourseGroupId(); const nodeId = getNodeId(); if (!groupId || !nodeId) return false;
            
            let taskId = null;
            const radarRes = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { headers: { "authorization": `Bearer ${token}` } });
            const radarData = await radarRes.json();
            if (radarData.success && radarData.data) {
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
                    const flatRes = flattenResources(resources);
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
                if (!silent) logMsg('✅ [API] 任务时长达标，后端已成功确认！', 'success', false);
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

    async function tryJumpToNext() {
        if (isJumpingLock) return; 
        if (Date.now() < appState.jumpSleepUntil) return; // 休眠保护机制

        isJumpingLock = true;
        
        try {
            const currentGroupId = getCourseGroupId(); 
            const currentNodeId = getNodeId(); 
            
            logMsg('🔄 正在通过【全局雷达】匹配下一项自主观看任务...', 'info', false);
            
            const token = await getAuthToken(); 
            const res = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { headers: { "authorization": `Bearer ${token}` } });
            const unfinishData = await res.json();
            const unfinishTasks = (unfinishData.success && unfinishData.data) ? unfinishData.data : [];
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
                targetTask = courseTasks.length > 0 ? courseTasks[0] : watchTasks[0];
            }

            if (targetTask) {
                let resId = targetTask.resource_id;

                if (!resId) {
                    const resources = await loadCourseResources(targetTask.group_id);
                    if (resources) {
                        const flatRes = flattenResources(resources);
                        const rInfo = flatRes.find(r => r.node_id == targetTask.node_id || r.id == targetTask.node_id);
                        if (rInfo) {
                            resId = rInfo.id || rInfo.resource_id;
                        }
                    }
                }

                if (!resId) resId = targetTask.id;

                logMsg(`⏭️ 雷达锁定目标：${targetTask.name}，执行跨节点跳转！`, 'success', false);

                const pathPrefix = window.location.href.includes('/course/') ? 'course' : 'mycourse';

                appState.jumpFailCount = 0; // 跳转成功，清空失败计数
                setTimeout(() => { 
                    window.location.href = `/app/jx-web/${pathPrefix}/${targetTask.group_id}/resource/${resId}/${targetTask.node_id}`; 
                }, 500);
                
                setTimeout(() => { isJumpingLock = false; }, 5000);
                return;
            }
            
            appState.jumpFailCount++;
            if (appState.jumpFailCount >= 3) {
                 logMsg('⏳ 连续3次探测无新任务，引擎进入休眠模式，10分钟后重载...', 'warning', false);
                 appState.jumpSleepUntil = Date.now() + 10 * 60 * 1000;
                 appState.jumpFailCount = 0;
                 updateCourseUI();
                 isJumpingLock = false;
            } else {
                 logMsg(`⏳ 探测无新任务，5秒后重试 (第${appState.jumpFailCount}次)...`, 'warning', false);
                 setTimeout(() => { isJumpingLock = false; }, 5000);
            }

        } catch(e) {
            appState.jumpFailCount++;
            if (appState.jumpFailCount >= 3) {
                 logMsg('⏳ 网络探测连续3次异常，进入深度休眠，10分钟后重新探测...', 'warning', false);
                 appState.jumpSleepUntil = Date.now() + 10 * 60 * 1000;
                 appState.jumpFailCount = 0;
                 updateCourseUI();
                 isJumpingLock = false;
            } else {
                 logMsg('雷达连通异常，5秒后重试跳转', 'error', false);
                 setTimeout(() => { isJumpingLock = false; }, 5000);
            }
        }
    }

    let lastTaskCheck = 0;
    async function globalTaskStatusChecker(forceCheck = false) {
        if (appState.mode === 'manual' && !forceCheck) return;
        const groupId = getCourseGroupId(); const nodeId = getNodeId();
        if (!groupId || !nodeId || (Date.now() - lastTaskCheck < 6000 && !forceCheck)) return;
        lastTaskCheck = Date.now();
        
        try {
            const token = await getAuthToken(); const res = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) {
                const isStillUnfinished = data.data.filter(t => t.task_type === 1).some(t => t.node_id == nodeId);
                if (!isStillUnfinished) {
                    if (!appState.isTaskCompleted) {
                        appState.isTaskCompleted = true; updateCourseUI(); await autoSubmitCurrentTask(true);
                        logMsg('✅ [雷达] 当前任务已在全局雷达达成！', 'success', false);
                    }
                } else { 
                    if (appState.isTaskCompleted || (document.getElementById('xy-status-banner') && document.getElementById('xy-status-banner').innerText.includes('初始化'))) { 
                        appState.isTaskCompleted = false; updateCourseUI(); 
                    } 
                }
            }
        } catch(e) {}
    }

    function forceDismissPopups(doc = document) {
        if (!appState.guardActive) return false;
        try {
            const dialogs = doc.querySelectorAll('.el-message-box:not([style*="none"]), .el-dialog:not([style*="none"]), .dialog-wrapper:not([style*="none"]), .v-modal');
            for (let box of dialogs) {
                if (box.offsetParent !== null) { 
                    const boxText = (box.innerText || "").replace(/\s+/g, ''); 
                    if (/长时间.*操作|无操作|没有操作|暂停|休息一下|继续|确认打开|预览确认/.test(boxText)) {
                        let targetBtn = box.querySelector('.el-button--primary, .el-message-box__btns .el-button:nth-child(2)');
                        if (!targetBtn) {
                            const btns = Array.from(box.querySelectorAll('button, .el-button, [role="button"]'));
                            targetBtn = btns.find(b => /确定|继续|是|我知道了|恢复|确认/.test((b.innerText || "").replace(/\s+/g, '')));
                        }
                        if (targetBtn && Date.now() - appState.lastPopupClickTime > 2000) { appState.lastPopupClickTime = Date.now(); setTimeout(() => { robustClick(targetBtn); logMsg(`🛡️ 拦截系统弹窗...`, 'success', false); }, 300); return true; } 
                    }
                }
            }
            const bodyText = doc.body ? (doc.body.innerText || "").replace(/\s+/g, '') : "";
            if (/长时间.*操作|无操作|没有操作|任务暂停|休息一下|确认打开/.test(bodyText)) {
                const allButtons = Array.from(doc.querySelectorAll('button, [role="button"], .btn, span[class*="btn"]'));
                const targetBtn = allButtons.find(b => b.offsetParent !== null && /确定|继续|恢复|是|我知道了|确认/.test((b.innerText || "").replace(/\s+/g, '')));
                if (targetBtn && Date.now() - appState.lastPopupClickTime > 2000) { appState.lastPopupClickTime = Date.now(); setTimeout(() => { robustClick(targetBtn); logMsg(`🛡️ 拦截系统弹窗...`, 'success', false); }, 500); return true; }
            }
        } catch(e) {} return false;
    }

    async function triggerDocBatchSniper() {
        appState.batchDocSubmitting = true; logMsg('🔄 启动【全局文档清理】，静默完成阅读...', 'warning', false);
        try {
            const token = await getAuthToken(); const res = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) {
                const docTasks = data.data.filter(t => t.task_type === 1 && t.finish !== 2);
                if (docTasks.length > 0) {
                    for (let i = 0; i < docTasks.length; i++) {
                        const t = docTasks[i]; if (t.node_id == getNodeId() || /mp4|avi|mov|wmv|flv|mkv/i.test(t.name || '')) continue;
                        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 4000) + 3000));
                        await fetch(`https://${domain}/api/jx-iresource/resource/finishActivity`, { method: "POST", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify({ group_id: t.group_id, node_id: t.node_id, task_id: t.task_id }) });
                        logMsg(`📄 自动处理：静默提交文档 -> ${t.name}`, 'success', false);
                    }
                    logMsg('🎉 文档自动清理完成，全网未读文档已提交！', 'success', false);
                }
            }
        } catch (e) {} finally { appState.batchDocSubmitting = false; }
    }

    function checkAndClickDocPreview() {
        const nodeId = getNodeId();
        if (!nodeId || appState.docPreviewDoneNodeId === nodeId) return;
        appState.docPreviewDoneNodeId = nodeId; 
    }

    async function sendRecordRequest() {
        if (appState.activeZone !== 'course') return;
        const groupId = getCourseGroupId(); const resourceId = getNodeId(); if (!groupId || !resourceId) return;

        try {
            const token = await getAuthToken(); const uRes = await fetch(`https://${domain}/api/jx-auth/oauth2/info`, { headers: { "authorization": `Bearer ${token}` }});
            const uData = await uRes.json(); const userId = uData?.data?.info?.id; if(!userId) return;

            const msgObj = { user_id: userId, group_id: groupId, clientType: 1, roleType: 1, resourceId: resourceId };
            const message = JSON.stringify(msgObj); const timestamp = Date.now().toString(); const nonce = crypto.randomUUID();
            const arr = [encodeURIComponent(message), timestamp, nonce, "--xy-create-signature--"].sort().join("");
            const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(arr));
            const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

            const response = await fetch(`https://${domain}/api/jx-iresource/learnLength/learnRecord`, { method: 'POST', headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ message, signature, timestamp, nonce }) });
            const result = await response.json();
            if (result.code === 200 || result.success) {
                appState.recordCount++; appState.totalTime += 30; appState.lastRecordDate = new Date();
                sessionStorage.setItem('xy_recordCount', appState.recordCount); sessionStorage.setItem('xy_totalTime', appState.totalTime); updateCourseUI(); 
            } 
        } catch (e) {}
    }

    function toggleRecord(start) {
        if (appState.recordActive === start) return;
        appState.recordActive = start;
        if (start) {
            sendRecordRequest(); recordIntervalTimer = setInterval(sendRecordRequest, 30000); 
            realTimeTimer = setInterval(() => { appState.realTime++; sessionStorage.setItem('xy_realTime', appState.realTime); updateCourseUI(); }, 1000);
            if (!appState.guardActive) { appState.guardActive = true; GM_setValue('xy_guard_active', true); }
        } else {
            clearInterval(recordIntervalTimer); clearInterval(realTimeTimer); recordIntervalTimer = null; realTimeTimer = null;
        }
        updateCourseUI();
    }

    function ensureAutoRecord() {
        if (appState.activeZone !== 'course') return;
        const nodeId = getNodeId();
        if (nodeId && !appState.recordActive) toggleRecord(true); else if (!nodeId && appState.recordActive) toggleRecord(false);
    }

    // ==========================================
    // ⚙️ 双频驱动引擎：UI渲染(1秒) + 暴力操作(5秒)
    // ==========================================

    let watchdogLastActiveTime = Date.now();

    // 频段1：1秒级状态维持（脚本进度隔离、文档计时、弹窗点击）
    setInterval(async () => {
        await runLowLevelScanner(); 

        // 🔥 核心修复：将清理检测提到最外层，100%保证进入非刷课页面就直接销毁倒计时
        checkDynamicRefresh();

        if (appState.activeZone !== 'course') {
            watchdogLastActiveTime = Date.now(); // 防死锁强刷：处于待命区/讨论区时，持续给看门狗喂时间戳
            return;
        }
        if (appState.guardActive) forceDismissPopups(document);

        // 统一提取当前任务类型，用于全局调度和引擎判断
        appState.currentEngine = await getTaskTypeAccurate();

        if (Date.now() - watchdogLastActiveTime > 180000) {
            sessionStorage.setItem('xy_reload_reason', '180秒无响应，防死锁刷新');
            logMsg(`💀 发生死锁！执行强刷...`, 'error', false);
            setTimeout(() => window.location.reload(), 1000);
            return;
        }

        // 如果正处于休眠探测状态，则跳过后续检查，直接放行循环
        if (appState.mode === 'sequence' && Date.now() < appState.jumpSleepUntil) {
            updateCourseUI();
            watchdogLastActiveTime = Date.now(); 
            return; 
        }

        const groupId = getCourseGroupId();
        if (groupId && appState.mode !== 'manual') {
            const taskType = appState.currentEngine; // 直接复用

            const vEngine = document.getElementById('xy-engine-video'), dEngine = document.getElementById('xy-engine-doc');
            if(vEngine) vEngine.style.opacity = taskType === 'video' ? '1' : '0.4';
            if(dEngine) dEngine.style.opacity = taskType === 'doc' ? '1' : '0.4';

            let isMakingProgress = false;

            if (taskType === 'video') {
                let video = document.querySelector('video');
                if (!video) { const iframes = document.querySelectorAll('iframe'); for (let i = 0; i < iframes.length; i++) { try { if (iframes[i].contentDocument) video = iframes[i].contentDocument.querySelector('video'); } catch(e){} if (video) break; } }
                
                if (video) {
                    if (video.paused && !video.ended) video.play().catch(() => { if(!appState.hardwareMute) video.muted = true; video.play().catch(()=>{}); });
                    
                    if (appState.hardwareMute && !video.muted) video.muted = true;

                    if (appState.mode === 'sequence') {
                        if (appState.videoScriptProgress === undefined) {
                            appState.videoScriptProgress = 0;
                            appState.videoLastTime = video.currentTime;
                            if (video.currentTime > 2) {
                                logMsg('🔄 强制视频从头开始播放...', 'warning', true);
                                video.currentTime = 0;
                                appState.videoLastTime = 0;
                            }
                        }

                        if (video.currentTime - appState.videoLastTime > 3) {
                            logMsg('❌ 检测到违规拖动进度条，强制刷新重试！', 'error');
                            appState.videoLastTime = video.currentTime;
                            setTimeout(() => window.location.reload(), 500);
                            return;
                        }

                        if (!video.paused && !video.ended) {
                            appState.videoScriptProgress += 1;
                        }
                        appState.videoLastTime = video.currentTime;

                        let duration = video.duration || 1;
                        let scriptProgressPct = Math.min((appState.videoScriptProgress / duration) * 100, 100);
                        
                        const statusEl = document.getElementById('xy-video-status');
                        if (statusEl) {
                            statusEl.innerText = (video.ended || appState.videoScriptProgress >= duration) ? '已播完, 验证中...' : `脚本进度 ${scriptProgressPct.toFixed(1)}%`;
                        }
                        
                        if (video.currentTime > 0 && !video.paused) isMakingProgress = true;
                        if (video.ended || appState.videoScriptProgress >= duration) isMakingProgress = true;
                    } 
                    else {
                        let progress = (video.currentTime / video.duration) * 100 || 0;
                        const statusEl = document.getElementById('xy-video-status');
                        if (statusEl) {
                             if (appState.mode === 'loop' && appState.isTaskCompleted) {
                                  statusEl.innerText = `[循环] 进度 ${progress.toFixed(1)}%`;
                             } else {
                                  statusEl.innerText = video.ended ? '已播完, 验证中...' : `进度 ${progress.toFixed(1)}%`;
                             }
                        }
                        
                        if (video.ended && appState.mode === 'loop' && !appState.isProcessingJump) {
                             appState.isProcessingJump = true;
                             autoSubmitCurrentTask(true).then(success => {
                                 if (success || appState.isTaskCompleted) {
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
            } else if (taskType === 'doc') {
                checkAndClickDocPreview(); 

                if (!appState.isTaskCompleted) {
                    appState.docReadTime += 1; 
                    
                    if (appState.mode === 'sequence') {
                        let progress = Math.min((appState.docReadTime / 130) * 100, 100);
                        const statusEl = document.getElementById('xy-doc-status'), progressEl = document.getElementById('xy-doc-progress');
                        if(statusEl) {
                            if (appState.docReadTime < 130) {
                                statusEl.innerText = `阅读倒数: ${progress.toFixed(1)}%`;
                            } else if (appState.docReadTime < 300) {
                                statusEl.innerText = `验证重试中: ${appState.docReadTime}s`;
                            } else {
                                statusEl.innerText = `强制提交阶段: ${appState.docReadTime}s`;
                            }
                        }
                        if(progressEl) progressEl.style.width = `${progress}%`;
                    } 
                    else {
                        let progress = Math.min((appState.docReadTime / 120) * 100, 100);
                        const statusEl = document.getElementById('xy-doc-status'), progressEl = document.getElementById('xy-doc-progress');
                        if(statusEl) {
                            if (appState.mode === 'loop' && appState.docReadTime >= 120) {
                                statusEl.innerText = `[循环] 挂机中: ${appState.docReadTime}s`;
                            } else {
                                statusEl.innerText = progress < 100 ? `等待 ${progress.toFixed(1)}%` : `请求验证中...`;
                            }
                        }
                        if(progressEl) progressEl.style.width = `${progress}%`;
                        
                        if (appState.mode === 'loop' && appState.docReadTime >= 120 && !appState.isProcessingJump) {
                             appState.isProcessingJump = true;
                             autoSubmitCurrentTask(true).then(success => {
                                 if (success) {
                                     appState.isTaskCompleted = true;
                                     logMsg('✅ 安全循环：文档已达标，继续静默挂机...', 'success', false);
                                 }
                                 appState.isProcessingJump = false;
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

            if (isMakingProgress || appState.isProcessingJump || appState.recordActive) {
                watchdogLastActiveTime = Date.now();
            }
        } else {
            watchdogLastActiveTime = Date.now();
        }
    }, 1000);

    // 频段2：5秒级跳课与连播模式的专属提交调度
    setInterval(async () => {
        if (!appState.aiMode || appState.activeZone !== 'course' || appState.mode !== 'sequence') return;

        if (Date.now() < appState.jumpSleepUntil) return;

        const groupId = getCourseGroupId();
        const nodeId = getNodeId();

        if (!groupId || !nodeId) {
            await tryJumpToNext();
            return;
        }

        if (appState.isTaskCompleted) {
            await tryJumpToNext();
            return;
        }

        const taskType = await getTaskTypeAccurate();

        if (taskType === 'video') {
            let video = document.querySelector('video');
            if (!video) { const iframes = document.querySelectorAll('iframe'); for (let i = 0; i < iframes.length; i++) { try { if (iframes[i].contentDocument) video = iframes[i].contentDocument.querySelector('video'); } catch(e){} if (video) break; } }
            
            if (video && (video.ended || (video.duration > 0 && appState.videoScriptProgress >= video.duration))) {
                logMsg('⏳ 满足连播脚本进度，发起视频验证请求...', 'info', true);
                const success = await autoSubmitCurrentTask();
                
                if (success) {
                    appState.isTaskCompleted = true;
                    logMsg('✅ [API] 视频任务已获服务器成功确认！', 'success');
                    updateCourseUI();
                    await tryJumpToNext();
                } else {
                    logMsg('⚠️ 后台仍判未达标，5秒后继续强交！', 'warning', true);
                }
            }
        } else if (taskType === 'doc') {
            if (appState.docReadTime >= 130) {
                if (appState.lastDocSubmitTime === 0 || (appState.docReadTime - appState.lastDocSubmitTime >= 30)) {
                    let isDocRetry = appState.lastDocSubmitTime > 0;
                    logMsg(isDocRetry ? `⏳ 文档未达标，周期性重试提交 (${appState.docReadTime}s)...` : '⏳ 2分10秒已到，发起首次文档验证请求...', 'info', true);
                    
                    const success = await autoSubmitCurrentTask();
                    appState.lastDocSubmitTime = appState.docReadTime;

                    if (success) {
                        appState.isTaskCompleted = true;
                        logMsg('✅ [API] 文档任务已获服务器成功确认！', 'success');
                        updateCourseUI();

                        if (appState.docBatchSubmit && !appState.batchDocSubmitting) triggerDocBatchSniper();
                        await tryJumpToNext();
                    } else {
                        if (appState.docReadTime >= 300) {
                            logMsg('⚡ 超过5分钟仍未达标，触发【强制提交放行】保护机制！', 'warning', false);
                            appState.isTaskCompleted = true;
                            updateCourseUI();
                            
                            if (appState.docBatchSubmit && !appState.batchDocSubmitting) triggerDocBatchSniper();
                            await tryJumpToNext();
                        } else {
                            logMsg(`⚠️ 文档验证未通过，将在30秒后利用API重试 (当前${appState.docReadTime}s/300s强行线)`, 'warning', false);
                        }
                    }
                }
            }
        }
    }, 5000);

    // 频段3：讨论区DOM智能扫描探测 (3秒一次，不影响主轴)
    setInterval(() => {
        if (appState.activeZone === 'disc' && appState.enableDomScan) {
            const domNames = scanDomForUserNames();
            let added = false;
            domNames.forEach(name => {
                if (!appState.targetNames.includes(name)) {
                    appState.targetNames.push(name);
                    added = true;
                }
            });
            if (added) {
                GM_setValue('xy_target_names', JSON.stringify(appState.targetNames));
                renderTargetList(document.getElementById('xy-name-search')?.value || '');
            }
        }
    }, 3000);

    // ==========================================
    // 🎯 讨论区点赞抓取模块：自动全页扫描
    // ==========================================
    async function fetchDiscussions(pageSize = 20, pageIndex = 1) {
        if (!appState.discussionId || !appState.discGroupId) { showToast('未捕获到ID，请重刷页面获取截包！', 'warning'); return null; }
        try {
            const token = await getAuthToken(); 
            const res = await fetch(`https://${domain}/api/jx-iresource/discussion/queryDiscussion?discussion_id=${appState.discussionId}&group_id=${appState.discGroupId}&sort_type=1&sort_way=desc&page_index=${pageIndex}&page_size=${pageSize}&channel=`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) {
                if (Array.isArray(data.data.list)) return data.data.list; if (Array.isArray(data.data.records)) return data.data.records; if (Array.isArray(data.data.points)) return data.data.points; if (Array.isArray(data.data)) return data.data;
            } return [];
        } catch(e) { return null; }
    }

    async function fetchCurrentUsers() {
        if (appState.activeZone !== 'disc') return;
        if(!appState.discussionId) { logMsg('未拦截到讨论区ID，请随便点击一下任意评论！', 'warning'); return; }
        const btn = document.getElementById('xy-btn-fetch-users'); const originalText = btn ? btn.innerText : ''; 
        if(btn) { btn.disabled = true; btn.innerText = "深潜抓取中..."; }
        
        logMsg('🧹 正在深度扫描全部评论页，自动去重收录...', 'info');

        try {
            let pageIndex = 1;
            while (true) { 
                if(btn) btn.innerText = `深潜抓取中 (第${pageIndex}页)...`;
                const list = await fetchDiscussions(20, pageIndex); 
                if (!list || list.length === 0) break;
                
                list.forEach(item => { 
                    const realName = decodeNickname(item.nickname); 
                    if (realName && realName !== "匿名" && !realName.includes("=")) {
                        if (!appState.targetNames.includes(realName)) {
                            appState.targetNames.push(realName);
                        }
                    } 
                });
                if (list.length < 20) break; 
                await sleep(300); 
                pageIndex++;
                if (pageIndex > 300) break; 
            }

            const domNames = scanDomForUserNames();
            domNames.forEach(name => {
                if (!appState.targetNames.includes(name)) {
                    appState.targetNames.push(name);
                }
            });

            GM_setValue('xy_target_names', JSON.stringify(appState.targetNames));
            renderTargetList(document.getElementById('xy-name-search')?.value || ''); 
            logMsg(`✅ 全量扫描到底！总库现存 ${appState.targetNames.length} 人。`, 'success');
        } catch (error) { logMsg('抓取失败，请检查网络或刷新重试', 'error'); } finally { if(btn) { btn.disabled = false; btn.innerText = originalText || "🔄 手动刷新名单"; } }
    }

    function getCheckedTargetNames() { return Array.from(appState.selectedNames); }

    async function autoLikeAction(isTargeted = false) {
        if (appState.activeZone !== 'disc') return;
        if(!appState.discussionId) { logMsg('网络流未就绪，请随便点击一个评论触发抓包', 'warning'); return; }
        const checkedNames = isTargeted ? getCheckedTargetNames() : [];
        if (isTargeted && checkedNames.length === 0) { logMsg('请先勾选目标人物', 'warning'); return; }

        const btn = document.getElementById(isTargeted ? 'xy-btn-target-like' : 'xy-btn-like'); const originalText = btn.innerText;
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
                const item = uniqueTargets[i]; const payload = { discussion_id: appState.discussionId, group_id: appState.discGroupId, point_id: item.id, like: 1 };
                try {
                    const likeRes = await fetch(`https://${domain}/api/jx-iresource/discussion/like`, { method: "POST", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(payload) });
                    const likeData = await likeRes.json(); if (likeData.success || likeData.code === 200 || likeData.code === 0) successCount++;
                } catch(e) {} await sleep(Math.floor(Math.random() * 700) + 800); 
            }
            logMsg(`🎉 点赞任务结束！成功点赞 ${successCount} 次！即将刷新页面...`, 'success'); setTimeout(() => { window.location.reload(); }, 1500);
        } catch (e) { logMsg('点赞异常', 'error'); } finally { btn.disabled = false; btn.innerText = originalText; }
    }

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
        
        if (appState.useCustomReply && appState.customReplies && appState.customReplies.length > 0) {
            // 过滤符合条件的句子（≥16汉字）
            const validCustoms = appState.customReplies.filter(text => (text.match(/[\u4e00-\u9fa5]/g) || []).length >= 16);
            if (validCustoms.length > 0) {
                return validCustoms[Math.floor(Math.random() * validCustoms.length)];
            } else {
                logMsg('⚠️ 自定义回复库中没有合规句子，系统已自动回退到默认语料', 'warning', true);
            }
        }
        return templates[Math.floor(Math.random() * templates.length)];
    }

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

    async function autoReplyAction(isTargeted = false) {
        if (appState.activeZone !== 'disc') return;
        if(!appState.discussionId) { logMsg('网络流未就绪，请随便点击一个评论触发抓包', 'warning'); return; }
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
                    discussion_id: appState.discussionId, 
                    group_id: appState.discGroupId, 
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
                } catch(e) {} 
                await sleep(Math.floor(Math.random() * 1200) + 1800); 
            }
            logMsg(`🎉 回复任务结束！成功回复 ${successCount} 次！即将刷新页面...`, 'success'); 
            setTimeout(() => { window.location.reload(); }, 2000);
        } catch (e) { logMsg('回复异常', 'error'); } finally { if (btn) { btn.disabled = false; btn.innerText = originalText; } }
    }

    // ==========================================
    // ☁️ 欣野云端情报站 (系统公告) 
    // ==========================================
    function fetchCloudIntelligence() {
        const contentBox = document.getElementById('xy-bc-content');
        if (!contentBox) return;
        
        const timestamp = Date.now();
        const url = `https://gitee.com/fieldlu/xy-script-assets/raw/main/notice.json?t=${timestamp}`;

        try {
            if (typeof GM_xmlhttpRequest !== "undefined") {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
                    nocache: true,
                    timeout: 10000, 
                    onload: function(response) {
                        if (response.status >= 200 && response.status < 300) {
                            try {
                                const realData = JSON.parse(response.responseText);
                                contentBox.innerHTML = `
                                    <div style="padding: 12px 14px 16px 14px;">
                                        <div style="font-weight:bold; color:#0f172a; margin-bottom:8px; font-size: 13px;">${realData.title || '系统公告'}</div>
                                        <ul style="margin:0; padding-left:16px; color:#475569;">
                                            ${(realData.items || []).map(item => `<li style="margin-bottom:6px;">${item}</li>`).join('')}
                                        </ul>
                                    </div>
                                `;
                            } catch (err) { contentBox.innerHTML = `<div style="padding: 12px 14px; color:#ef4444;">获取云端情报失败 (数据格式异常)。</div>`; }
                        } else { contentBox.innerHTML = `<div style="padding: 12px 14px; color:#ef4444;">获取云端情报失败 (状态码: ${response.status})。</div>`; }
                    },
                    onerror: function(err) { contentBox.innerHTML = `<div style="padding: 12px 14px; color:#ef4444;">获取云端情报网络异常，请检查网络连接。</div>`; },
                    ontimeout: function() { contentBox.innerHTML = `<div style="padding: 12px 14px; color:#ef4444;">获取云端情报超时，服务器可能正忙。</div>`; }
                });
            } else {
                fetch(url, { cache: 'no-store' }).then(res => res.json()).then(realData => {
                     contentBox.innerHTML = `
                        <div style="padding: 12px 14px 16px 14px;">
                            <div style="font-weight:bold; color:#0f172a; margin-bottom:8px; font-size: 13px;">${realData.title || '系统公告'}</div>
                            <ul style="margin:0; padding-left:16px; color:#475569;">
                                ${(realData.items || []).map(item => `<li style="margin-bottom:6px;">${item}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }).catch(e => { contentBox.innerHTML = `<div style="padding: 12px 14px; color:#ef4444;">获取云端情报失败，且当前环境不支持跨域请求。</div>`; });
            }
        } catch (e) {
            contentBox.innerHTML = `<div style="padding: 12px 14px; color:#ef4444;">获取云端情报时发生了不可预知的错误。</div>`;
        }
    }

    // ==========================================
    // 🎨 UI 界面渲染与控制
    // ==========================================
    function formatTime(s) { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60).toString().padStart(2,'0'), sec = (s%60).toString().padStart(2,'0'); return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`; }

    function updateCourseUI() {
        if (appState.activeZone !== 'course') return;
        const statusBanner = document.getElementById('xy-status-banner');
        if (statusBanner) {
            if (appState.mode === 'manual') { 
                statusBanner.innerHTML = `<span style="color:#475569;">⏸️ 挂机休眠中</span>`; 
                statusBanner.style.background = 'rgba(241, 245, 249, 0.6)'; 
                statusBanner.style.borderColor = 'rgba(226,232,240,0.6)'; 
            } 
            else if (!getCourseGroupId()) {
                if (appState.mode === 'sequence' && Date.now() < appState.jumpSleepUntil) {
                    let leftMin = Math.ceil((appState.jumpSleepUntil - Date.now()) / 60000);
                    statusBanner.innerHTML = `<span style="color:#b45309;">💤 寻路深度休眠 (约 ${leftMin} 分钟后重载探测)</span>`; 
                    statusBanner.style.background = 'rgba(254, 243, 197, 0.6)'; 
                    statusBanner.style.borderColor = 'rgba(253,230,138,0.6)'; 
                } else {
                    statusBanner.innerHTML = `<span style="color:#4338ca;">🌐 雷达系统扫描中...</span>`; 
                    statusBanner.style.background = 'rgba(224, 231, 255, 0.6)'; 
                    statusBanner.style.borderColor = 'rgba(199,210,254,0.6)'; 
                }
            } 
            else if (appState.isTaskCompleted) { 
                statusBanner.innerHTML = appState.mode === 'loop' 
                    ? `<span style="color:#047857;">✅ 已达标 (持续安全循环中)</span>` 
                    : `<span style="color:#047857;">✅ 已达标 (即将自动跳转)</span>`; 
                statusBanner.style.background = 'rgba(209, 250, 229, 0.6)'; 
                statusBanner.style.borderColor = 'rgba(167,243,208,0.6)'; 
            } 
            else { 
                statusBanner.innerHTML = `<span style="color:#b45309;">⏳ 引擎防封运作中...</span>`; 
                statusBanner.style.background = 'rgba(254, 243, 197, 0.6)'; 
                statusBanner.style.borderColor = 'rgba(253,230,138,0.6)'; 
            }
        }
        ['man', 'loop', 'seq'].forEach(m => { const btn = document.getElementById(`btn-mode-${m}`); if(btn) btn.className = `xy-mode-btn ${appState.mode === (m==='man'?'manual':m==='loop'?'loop':'sequence') ? 'active' : ''}`; });
        
        const cRecTime = document.getElementById('xy-rec-time'), cRealTime = document.getElementById('xy-real-time'), cCount = document.getElementById('xy-rec-count');
        if(cRecTime) cRecTime.innerText = formatTime(appState.totalTime); if(cRealTime) cRealTime.innerText = formatTime(appState.realTime); if(cCount) cCount.innerText = appState.recordCount;
        
        const btnGuard = document.getElementById('xy-btn-guard');
        if(btnGuard) { if(appState.guardActive) { btnGuard.innerHTML = '🛡️ 防休眠 ON'; btnGuard.className = 'xy-action-btn active-guard'; } else { btnGuard.innerHTML = '⚠️ 防休眠 OFF'; btnGuard.className = 'xy-action-btn inactive-guard'; } }
    }

    function updateDiscUI() {
        if (appState.activeZone !== 'disc') return;
        const statusEl = document.getElementById('xy-disc-status');
        if (statusEl) {
            if (appState.discussionId) { statusEl.innerHTML = `<span style="color:#047857;">✅ 已锁定讨论区：${appState.discussionId.substring(0,8)}...</span>`; statusEl.style.background = 'rgba(209, 250, 229, 0.6)'; document.querySelectorAll('.xy-action-btn.disc-btn').forEach(b => b.style.opacity = '1'); } 
            else { statusEl.innerHTML = `<span style="color:#b45309;">⚠️ 请在讨论区内刷新页面 (或随意点击评论) 触发网络包获取ID</span>`; statusEl.style.background = 'rgba(254, 243, 197, 0.6)'; }
        }
    }

    const updateCheckedCount = () => { 
        const span = document.getElementById('xy-checked-count'); 
        if(span) span.textContent = appState.selectedNames.size; 
        const totalSpan = document.getElementById('xy-total-count');
        if(totalSpan) totalSpan.textContent = appState.targetNames.length;
    };

    function renderTargetList(filterText = '') {
        const listDiv = document.getElementById('xy-target-list'); if (!listDiv) return;
        
        if (appState.targetNames.length === 0) { 
            listDiv.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:16px 0; grid-column: 1 / -1;">✨ 正在等待或自动全量扫描中...</div>'; 
            updateCheckedCount();
            return; 
        }
        
        const terms = filterText.split(/[\s,，;；]+/).map(t => t.trim()).filter(t => t);
        let displayNames = appState.targetNames;
        
        if (terms.length > 0) {
            displayNames = displayNames.filter(name => terms.some(term => name.toLowerCase().includes(term.toLowerCase())));
        }
    
        if (displayNames.length === 0) {
            listDiv.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:16px 0; grid-column: 1 / -1;">无匹配的结果，尝试换个词？</div>';
            return;
        }
    
        let html = `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">`;
        displayNames.forEach((name) => { 
            let displayNameHtml = name;
            if (terms.length > 0) {
                terms.forEach(term => {
                    const regex = new RegExp(`(${term})`, 'gi');
                    displayNameHtml = displayNameHtml.replace(regex, `<span style="background-color: #fde047; color: #854d0e; font-weight: bold; border-radius: 2px; padding: 0 2px;">$1</span>`);
                });
            }
            const isChecked = appState.selectedNames.has(name);
            html += `
                <label class="xy-target-item" title="${name}" style="background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); padding: 8px 10px; border-radius: 8px; display: flex; align-items: center; gap: 8px; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s;">
                    <input type="checkbox" class="xy-target-checkbox" value="${name}" ${isChecked ? 'checked' : ''} style="accent-color: #4f46e5; flex-shrink: 0; width: 14px; height: 14px; cursor: pointer;">
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size: 13px; color: #334155; user-select: none;">${displayNameHtml}</span>
                </label>
            `; 
        });
        html += `</div>`;
        listDiv.innerHTML = html; 
        updateCheckedCount();
    }

    // ==========================================
    // 🌟 自定义回复设置模态框
    // ==========================================
    function openReplySettingsModal() {
        let overlay = document.getElementById('xy-reply-settings-overlay');
        if (overlay) return;
        
        overlay = document.createElement('div');
        overlay.id = 'xy-reply-settings-overlay';
        overlay.style.cssText = `position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15, 23, 42, 0.6); z-index:2147483646; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(6px); opacity:0; transition:opacity 0.3s;`;
        
        function showModalToast(msg, type = 'info') {
            const modalBody = overlay.firstElementChild;
            if (!modalBody) return;
            
            let toastContainer = document.getElementById('xy-modal-toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'xy-modal-toast-container';
                toastContainer.style.cssText = `position:absolute; top:24px; left:50%; transform:translateX(-50%); z-index:99999; display:flex; flex-direction:column; gap:8px; pointer-events:none;`;
                modalBody.appendChild(toastContainer);
            }
            
            const colors = {
                success: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', icon: '✅' },
                error: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', icon: '❌' },
                warning: { bg: '#fef3c7', color: '#92400e', border: '#fde68a', icon: '⚠️' },
                info: { bg: '#e0f2fe', color: '#075985', border: '#bae6fd', icon: 'ℹ️' }
            };
            const currentType = colors[type] || colors.info;
            
            const toast = document.createElement('div');
            toast.style.cssText = `background:${currentType.bg}; color:${currentType.color}; border: 1px solid ${currentType.border}; padding:10px 16px; border-radius:10px; font-weight:bold; font-size:13px; box-shadow:0 10px 25px rgba(0,0,0,0.15); transition:all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); opacity:0; transform:translateY(-20px) scale(0.9); display:flex; align-items:center; backdrop-filter: blur(8px); white-space: nowrap;`;
            toast.innerHTML = `<span style="margin-right:8px; font-size:16px;">${currentType.icon}</span><span>${msg}</span>`;
            toastContainer.appendChild(toast);
            
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0) scale(1)';
            });
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px) scale(0.9)';
                setTimeout(() => toast.remove(), 400);
            }, 2500);
        }

        function renderContent() {
            let listHtml = '';
            if (appState.customReplies.length === 0) {
                listHtml = `<div style="text-align:center; color:#94a3b8; padding:30px 20px; font-size:14px;">空空如也，请在下方添加语料</div>`;
            } else {
                appState.customReplies.forEach((text, index) => {
                    let hanziCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
                    let isOk = hanziCount >= 16;
                    listHtml += `
                        <div style="background:#f8fafc; border:1px solid ${isOk ? '#e2e8f0' : '#fca5a5'}; border-radius:10px; padding:12px; margin-bottom:12px; position:relative; display:flex; gap:12px; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                            <div style="flex:1; font-size:13px; color:#334155; line-height:1.6;">${text}</div>
                            <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-end; gap:6px;">
                                <span style="font-size:11px; font-weight:bold; color:${isOk ? '#10b981' : '#ef4444'};">${hanziCount} 汉字</span>
                                <button class="xy-del-reply-btn" data-index="${index}" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; transition:0.2s;" onmouseover="this.style.filter='brightness(0.95)'" onmouseout="this.style.filter='none'">删除</button>
                            </div>
                        </div>
                    `;
                });
            }

            return `
                <div style="position:relative; background:white; width:90%; max-width:550px; border-radius:20px; box-shadow:0 25px 50px rgba(0,0,0,0.25); display:flex; flex-direction:column; overflow:hidden; transform:scale(0.95); transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                    <div style="padding:16px 24px; background:linear-gradient(135deg, #0ea5e9, #0284c7); display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:18px; font-weight:bold; color:white; display:flex; align-items:center; gap:8px;">⚙️ 自定义回复语料库</div>
                        <button id="xy-close-reply-settings" style="background:none; border:none; font-size:20px; color:#e0f2fe; cursor:pointer; padding:0; transition:0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#e0f2fe'">✖</button>
                    </div>
                    
                    <div style="padding:16px 24px; background:#f0f9ff; border-bottom:1px solid #bae6fd; font-size:13px; color:#0369a1; line-height:1.6;">
                        <strong>规则要求：</strong><br>
                        1. 最多可保存 <strong>10</strong> 句语料，当前已存 <strong style="color:#0ea5e9;">${appState.customReplies.length}</strong> 句。<br>
                        2. 为防被拦截，每句必须包含至少 <strong>16</strong> 个汉字。<br>
                        3. 启用自定义功能后，每次回复将从这些句子中<strong style="color:#0ea5e9;">完全随机</strong>抽取。
                    </div>

                    <div id="xy-reply-list" style="flex:1; max-height:300px; overflow-y:auto; padding:20px 24px; background:white;">
                        ${listHtml}
                    </div>

                    <div style="padding:20px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; flex-direction:column; gap:12px;">
                        <textarea id="xy-new-reply-text" placeholder="在此输入新的回复内容 (至少包含16个汉字)..." style="width:100%; height:90px; padding:12px; border:1px solid #cbd5e1; border-radius:10px; font-size:14px; resize:none; outline:none; transition:0.2s; box-shadow:inset 0 1px 2px rgba(0,0,0,0.05);" ${appState.customReplies.length >= 10 ? 'disabled' : ''}></textarea>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span id="xy-reply-counter" style="font-size:13px; color:#64748b; font-weight:500;">当前汉字: <span style="font-weight:bold; color:#ef4444; font-size:15px;">0</span> (需要 ≥ 16)</span>
                            <button id="xy-add-reply-btn" style="background:${appState.customReplies.length >= 10 ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #0284c7)'}; color:white; border:none; padding:10px 20px; border-radius:10px; font-size:14px; font-weight:bold; cursor:${appState.customReplies.length >= 10 ? 'not-allowed' : 'pointer'}; box-shadow:0 4px 12px rgba(14,165,233,0.3); transition:0.2s;" ${appState.customReplies.length >= 10 ? 'disabled' : ''}>+ 添加入库</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function attachEvents() {
            document.getElementById('xy-close-reply-settings').onclick = () => {
                overlay.style.opacity = '0';
                overlay.firstElementChild.style.transform = 'scale(0.95)';
                setTimeout(() => overlay.remove(), 300);
            };

            const textarea = document.getElementById('xy-new-reply-text');
            const counter = document.getElementById('xy-reply-counter');
            const addBtn = document.getElementById('xy-add-reply-btn');

            if (textarea) {
                textarea.addEventListener('input', () => {
                    const hanziCount = (textarea.value.match(/[\u4e00-\u9fa5]/g) || []).length;
                    counter.innerHTML = `当前汉字: <span style="font-weight:bold; font-size:15px; color:${hanziCount >= 16 ? '#10b981' : '#ef4444'};">${hanziCount}</span> (需要 ≥ 16)`;
                    if(hanziCount >= 16) {
                        textarea.style.borderColor = '#10b981';
                        textarea.style.boxShadow = '0 0 0 2px rgba(16,185,129,0.2)';
                    } else {
                        textarea.style.borderColor = '#cbd5e1';
                        textarea.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                    }
                });
                
                textarea.addEventListener('focus', () => {
                    if((textarea.value.match(/[\u4e00-\u9fa5]/g) || []).length < 16) {
                        textarea.style.borderColor = '#0ea5e9';
                        textarea.style.boxShadow = '0 0 0 2px rgba(14,165,233,0.2)';
                    }
                });
                textarea.addEventListener('blur', () => {
                    if((textarea.value.match(/[\u4e00-\u9fa5]/g) || []).length < 16) {
                        textarea.style.borderColor = '#cbd5e1';
                        textarea.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                    }
                });
            }

            if (addBtn) {
                addBtn.onclick = () => {
                    const text = textarea.value.trim();
                    if (!text) return;
                    const hanziCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
                    if (hanziCount < 16) {
                        showModalToast('字数不足，需包含至少16个汉字！', 'error');
                        return;
                    }
                    if (appState.customReplies.length >= 10) {
                        showModalToast('已达到最大限制(10句)！', 'warning');
                        return;
                    }
                    appState.customReplies.push(text);
                    GM_setValue('xy_custom_replies', JSON.stringify(appState.customReplies));
                    
                    overlay.innerHTML = renderContent();
                    attachEvents();
                    showModalToast('语料添加成功！', 'success');
                };
            }

            document.querySelectorAll('.xy-del-reply-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.getAttribute('data-index'));
                    appState.customReplies.splice(idx, 1);
                    GM_setValue('xy_custom_replies', JSON.stringify(appState.customReplies));
                    
                    overlay.innerHTML = renderContent();
                    attachEvents();
                    showModalToast('语料已删除', 'info');
                };
            });
        }

        overlay.innerHTML = renderContent();
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            overlay.firstElementChild.style.transform = 'scale(1)';
        });
        
        attachEvents();
    }


    function createUI() {
        if (document.getElementById('xy-super-console')) return;
        if (!document.body) { requestAnimationFrame(createUI); return; }

        const wrapper = document.createElement('div'); wrapper.id = 'xy-super-console';
        let pos = { x: window.innerWidth - 440, y: 50 }; 
        try { const p = JSON.parse(GM_getValue('xy_ui_pos')); if(p && typeof p.x === 'number') pos = p; } catch(e){}
        
        wrapper.style.cssText = `
            position: fixed; left: ${pos.x}px; top: ${pos.y}px; width: 420px; max-height: 95vh; 
            background: rgba(255, 255, 255, 0.75); border-radius: 20px; 
            border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 10px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1); 
            z-index: 2147483640; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            overflow: hidden; transition: opacity 0.2s; display: flex; flex-direction: column;
        `;
        
        wrapper.innerHTML = `
            <style>
                #xy-super-console * { box-sizing: border-box; }
                #xy-super-console button { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border: none; font-family: inherit; } 
                #xy-super-console button:active { transform: scale(0.96) !important; }
                #xy-super-console ::-webkit-scrollbar { width: 4px; } 
                #xy-super-console ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 4px; }
                
                #xy-main-body > * { flex-shrink: 0 !important; }
                
                .xy-panel { background: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.6); border-radius: 16px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); flex-shrink: 0; }
                .xy-panel-title { font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
                
                .xy-mode-btn { padding: 10px 4px; border-radius: 10px; border: 1px solid rgba(226,232,240,0.6); background: rgba(255,255,255,0.6); color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }
                .xy-mode-btn:hover { background: #f8fafc; }
                .xy-mode-btn.active { background: #1e293b; color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(30,41,59,0.2); }
                
                .xy-action-btn { padding: 10px; border-radius: 10px; color: white; font-size: 13px; font-weight: 600; cursor: pointer; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .xy-action-btn:hover { filter: brightness(1.05); transform: translateY(-1px); }
                .xy-action-btn.active-guard { background: #10b981; }
                .xy-action-btn.inactive-guard { background: #94a3b8; }
                
                .xy-mini-btn { background: rgba(255,255,255,0.7); color: #475569; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; border: 1px solid rgba(226,232,240,0.8); cursor:pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: all 0.2s;}
                .xy-mini-btn:hover { background: #ffffff; color: #0f172a; border-color: #cbd5e1; }
                
                .xy-stat-box { display: flex; justify-content: space-between; align-items: center; background: rgba(240, 253, 244, 0.6); border: 1px solid rgba(187, 247, 208, 0.5); padding: 12px 16px; border-radius: 12px; }
                
                .xy-input-box { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font-size: 13px; text-align: center; outline: none; background: rgba(255,255,255,0.8); transition: border 0.2s; }
                .xy-input-box:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
                
                .xy-target-item:hover { background: #f8fafc !important; border-color: #cbd5e1 !important; transform: translateY(-1px); }
            </style>
            
            <div id="xy-drag-handle" style="padding: 12px 16px; background: rgba(248, 250, 252, 0.5); border-bottom: 1px solid rgba(226,232,240,0.6); cursor: grab; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <div style="font-weight: 800; color: #0f172a; font-size: 15px; display:flex; align-items:center; gap:6px;">
                     欣野 <span>🖐️</span>
                     <span id="xy-qq-group" style="font-size: 11px; font-weight: 600; color: #4f46e5; background: #e0e7ff; border: 1px solid #c7d2fe; padding: 2px 6px; border-radius: 6px; cursor: pointer; transition: all 0.2s; margin-left: 4px;" title="点击复制QQ群号" onmouseover="this.style.background='#c7d2fe'" onmouseout="this.style.background='#e0e7ff'">QQ群: 1095232169</span>
                </div>
                <div id="xy-zone-badge" style="font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 12px;"></div>
                <div id="xy-minimize" style="cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent'">➖</div>
            </div>

            <div id="xy-main-body" style="padding: 16px; overflow-y: auto; display: flex; flex-direction: column; flex: 1;">
                
                <div class="xy-panel" style="padding: 0; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.4);">
                    <div id="xy-bc-toggle" style="background: linear-gradient(90deg, rgba(240,249,255,0.8), rgba(224,242,254,0.8)); padding: 10px 14px; font-size: 13px; font-weight: 700; color: #0369a1; display: flex; justify-content: space-between; cursor: pointer; user-select: none;">
                        <span>📣 欣野情报站 (系统公告)</span>
                        <span id="xy-bc-arrow" style="transition: transform 0.3s; font-size: 12px; color: #0284c7;">▼</span>
                    </div>
                    <div id="xy-bc-content" style="font-size: 12px; color: #334155; line-height: 1.6; display: none; background: rgba(255,255,255,0.6); border-top: 1px solid rgba(56, 189, 248, 0.2); max-height: 160px; overflow-y: auto;">
                        <div style="padding: 12px 14px;">
                            <span style="color:#94a3b8; animation: pulse 1.5s infinite;">正在解析云端通讯...</span>
                        </div>
                    </div>
                </div>

                <div id="xy-view-standby" style="display:none; flex-direction:column; align-items:center; justify-content:center; padding: 30px 10px; text-align:center; flex-shrink: 0;">
                    <div style="font-size: 44px; margin-bottom: 12px;">🏝️</div>
                    <div style="font-size: 16px; font-weight: bold; color: #334155; margin-bottom: 8px;">🟢 系统休眠隔离，确保无干扰</div>
                    <div style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">你当前位于 <span style="color:#ef4444; font-weight:bold;">作业/考试/其他区域</span><br>欣野已自动收起武器，专心做题吧！<br><br>如需激活自动化，请进入具体的<span style="color:#10b981; font-weight:bold;">视频/文档/讨论区</span>。</div>
                    <button class="xy-action-btn" id="xy-btn-dashboard-standby" style="background: #6366f1; width: 80%;">🌍 打开全局雷达，一键寻路</button>
                </div>

                <div id="xy-view-course" style="display:none; flex-shrink: 0;">
                    <div id="xy-status-banner" style="text-align: center; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; background: rgba(241, 245, 249, 0.6); font-size: 13px; margin-bottom: 14px; font-weight: 600;">初始化中...</div>
                    
                    <div class="xy-panel">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            <button class="xy-mode-btn" id="btn-mode-man">手动休眠</button>
                            <button class="xy-mode-btn" id="btn-mode-loop">安全循环</button>
                            <button class="xy-mode-btn" id="btn-mode-seq">雷达连播</button>
                        </div>
                    </div>

                    <div class="xy-panel xy-stat-box" style="margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 11px; color: #059669; font-weight:700; margin-bottom: 4px;">⏱️ 有效挂机时长</div>
                            <div id="xy-rec-time" style="font-size: 24px; font-weight: 800; color: #047857; font-family: monospace; line-height: 1;">0m 00s</div>
                        </div>
                        <div style="text-align: right; font-size: 11px; color: #065f46; opacity: 0.8;">
                            <div>实计: <span id="xy-real-time" style="font-weight:600;">0m 00s</span></div>
                            <div style="margin-top:2px;">心跳: <span id="xy-rec-count" style="font-weight:bold;">0</span> 次</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px;">
                        <button class="xy-action-btn" id="xy-btn-guard" title="底层拦截离开检测与弹窗">🛡️ 幽灵伪装</button>
                        <button class="xy-action-btn" id="xy-btn-dashboard" style="background: #6366f1;">🌍 全局雷达</button>
                        <button class="xy-action-btn" id="xy-btn-quick-mute" style="background: ${appState.hardwareMute ? '#14b8a6' : '#94a3b8'};">🔇 强制静音: ${appState.hardwareMute ? 'ON' : 'OFF'}</button>
                        <button class="xy-action-btn" id="btn-manual-refresh" style="background: #3b82f6;">🔄 手动重载</button>
                    </div>

                    <div class="xy-panel" style="padding: 12px;">
                        <div style="font-weight:700; font-size:12px; color:#1e293b; display:flex; justify-content:space-between; margin-bottom: 8px;">
                            <span>🤖 智能双引擎中枢</span>
                            <div style="display:flex; gap: 12px;">
                                <label style="font-size:11px; cursor:pointer; color:#64748b;"><input type="checkbox" id="toggle-ai-mode" ${appState.aiMode ? 'checked' : ''}> 自动运行</label>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <div id="xy-engine-video" style="flex:1; padding:10px; background:rgba(240,253,244,0.5); border:1px solid rgba(187,247,208,0.6); border-radius:10px;">
                                <div style="font-size:12px; font-weight:bold; color:#166534; margin-bottom:6px;">📺 视频 (<span id="xy-video-status">待命</span>)</div>
                                <label style="font-size:11px; color:#15803d; cursor:pointer;"><input type="checkbox" id="toggle-video-submit" ${appState.videoAutoSubmit ? 'checked' : ''}> 播完跳课</label>
                            </div>
                            <div id="xy-engine-doc" style="flex:1; padding:10px; background:rgba(253,244,255,0.5); border:1px solid rgba(233,213,255,0.6); border-radius:10px;">
                            <div style="font-size:12px; font-weight:bold; color:#6b21a8; margin-bottom:6px;">📄 文档 (<span id="xy-doc-status">待命</span>)</div>
                            <div style="width:100%; height:4px; background:rgba(243,232,255,0.8); border-radius:2px; margin-bottom:6px;"><div id="xy-doc-progress" style="width:0%; height:100%; background:#9333ea; transition:width 0.5s;"></div></div>
                            <label style="font-size:11px; color:#7e22ce; cursor:pointer;"><input type="checkbox" id="toggle-doc-batch" ${appState.docBatchSubmit ? 'checked' : ''}> 达标连交</label>
                        </div>
                    </div>
                </div>

                <div class="xy-panel" style="padding: 12px;">
                    <div style="font-weight:700; font-size:12px; color:#1e293b; display:flex; justify-content:space-between; margin-bottom: 8px;">
                        <span>♻️ 系统数据与界面控制</span>
                        <div style="display:flex; gap: 8px;">
                            <label style="font-size:11px; cursor:pointer; color:#64748b;"><input type="checkbox" id="toggle-refresh-panel" ${appState.showRefreshPanel ? 'checked' : ''}> ⏳ 重载视窗</label>
                            <label style="font-size:11px; cursor:pointer; color:#64748b;"><input type="checkbox" id="toggle-terminal" ${appState.showTerminal ? 'checked' : ''}> 🖥️ 终端面板</label>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end;">
                        <div style="display:flex; gap:6px;">
                            <button class="xy-mini-btn" id="btn-clear-logs" style="font-size:11px; padding:4px 8px;">清空日志</button>
                            <button class="xy-mini-btn" id="btn-clear-progress" style="font-size:11px; padding:4px 8px; color:#dc2626;">重置时长</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="xy-view-disc" style="display:none; flex-shrink: 0;">
                <div id="xy-disc-status" style="padding: 10px; border-radius: 10px; background: rgba(248, 250, 252, 0.6); border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; margin-bottom: 14px; text-align: center;">初始化中...</div>

                <div class="xy-panel" style="padding: 14px 10px;">
                    <div class="xy-panel-title" style="padding: 0 4px;">
                        <span>👥 互动点赞名单</span>
                        <label style="cursor: pointer; font-size: 10px; color: #4f46e5; background: rgba(224,231,255,0.6); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(199,210,254,0.6);">
                            <input type="checkbox" id="xy-toggle-dom-scan" ${appState.enableDomScan ? 'checked' : ''} style="accent-color: #4f46e5; vertical-align: middle; margin-right: 3px; width: 10px; height: 10px;">智能DOM提取
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 6px; margin-bottom: 10px; padding: 0 4px;">
                        <button class="xy-mini-btn" id="xy-btn-fetch-users" style="background:linear-gradient(145deg,#3b82f6,#2563eb); color:white; border:none; flex:1;">🔄 手动刷新名单</button>
                        <button class="xy-mini-btn" id="xy-btn-clear-names" style="flex:1;">清空全库</button>
                    </div>

                    <div style="margin-bottom: 10px; padding: 0 4px;">
                        <input type="text" id="xy-name-search" class="xy-input-box" placeholder="🔍 检索人名 (支持空格/逗号组合多词)" style="width: 100%; text-align: left; padding-left: 12px; background: rgba(255,255,255,0.9);">
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: rgba(248,250,252,0.8); padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0 4px 8px 4px;">
                        <span style="font-size:11px; color:#64748b;">已选 <span id="xy-checked-count" style="font-weight:bold; color:#0f172a; font-size: 13px;">0</span> / <span id="xy-total-count">0</span> 人 <span style="color:#ef4444; margin-left:4px;">(最多15人)</span></span>
                        <div style="display: flex; gap: 4px;">
                            <span class="xy-mini-btn" id="xy-btn-copy-names" style="padding:2px 8px; font-size:11px; color:#4f46e5; border-color: rgba(199,210,254,1); background: #e0e7ff;" title="一键复制已勾选人名到剪贴板">📋 复制</span>
                            <span class="xy-mini-btn" id="xy-btn-select-all" style="padding:2px 8px; font-size:11px;">全选</span>
                            <span class="xy-mini-btn" id="xy-btn-deselect-all" style="padding:2px 8px; font-size:11px;">清空</span>
                        </div>
                    </div>

                    <div id="xy-target-list" style="max-height: 180px; overflow-y: auto; padding: 4px; margin-bottom: 12px; background: rgba(241,245,249,0.4); border-radius: 8px; border: 1px inset rgba(255,255,255,0.5);"></div>

                    <div style="display:flex; gap:8px; padding: 0 4px;">
                        <button class="xy-action-btn disc-btn" id="xy-btn-like" style="background: #64748b; flex:1;">👍 全局扫盘盲赞</button>
                        <button class="xy-action-btn disc-btn" id="xy-btn-target-like" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed); flex:1.5;">⚡ 批量点赞选中用户</button>
                    </div>
                    <div style="display:flex; gap:8px; padding: 0 4px; margin-top: 8px;">
                        <button class="xy-action-btn disc-btn" id="xy-btn-reply" style="background: #0ea5e9; flex:1;">💬 全局盲回</button>
                        <button class="xy-action-btn disc-btn" id="xy-btn-target-reply" style="background: linear-gradient(145deg, #0284c7, #0369a1); flex:1.5;">🎯 批量回复选中用户</button>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding: 10px; background: rgba(240,249,255,0.6); border: 1px solid rgba(186,230,253,0.8); border-radius: 8px; margin-left: 4px; margin-right: 4px;">
                        <label style="font-size:12px; font-weight:bold; color:#0369a1; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <input type="checkbox" id="xy-toggle-custom-reply" ${appState.useCustomReply ? 'checked' : ''} style="accent-color:#0284c7; width:14px; height:14px; cursor:pointer;"> 启用自定义语料
                        </label>
                        <button class="xy-mini-btn" id="xy-btn-edit-reply" style="color:#0284c7; border-color:#bae6fd; background:white; font-size:11px;">⚙️ 语料库设置</button>
                    </div>
                </div>
            </div>

            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;">
                <div id="xy-refresh-container" style="display: ${appState.showRefreshPanel ? 'block' : 'none'}; background: linear-gradient(145deg, #fffbeb, #fef3c7); padding: 12px; border-radius: 12px; border: 1px solid #fde68a; box-shadow: inset 0 2px 4px rgba(255,255,255,0.8);">
                    <div style="font-size: 11px; color: #b45309; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><span>⏳</span> 动态重载调度器</div>
                    <div id="xy-refresh-status" style="font-size: 13px; color: #92400e; font-weight: bold; font-family: monospace;">目前无重载任务</div>
                </div>

                <div id="xy-terminal-container" style="display: ${appState.showTerminal ? 'block' : 'none'}; background: #0f172a; padding: 12px; border-radius: 12px; box-shadow: inset 0 4px 10px rgba(0,0,0,0.5);">
                    <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;"><span style="color:#10b981; font-family:monospace;">~_</span> 终端日志</div>
                    <div id="xy-activity-log" style="height: 110px; overflow-y: auto; font-family: 'SF Mono', Consolas, monospace; font-size: 11px; display: flex; flex-direction: column; gap: 4px; color: #10b981;"></div>
                </div>
            </div>

            </div>
        `;
        document.body.appendChild(wrapper);

        const logBox = document.getElementById('xy-activity-log');
        if (logBox && sessionLogs.length > 0) {
            logBox.innerHTML = ''; sessionLogs.forEach(log => { const el = document.createElement('div'); el.style.color = log.color === '#64748b' ? '#64748b' : (log.color === '#38bdf8' ? '#10b981' : log.color); el.innerText = log.text; logBox.appendChild(el); });
            logBox.scrollTop = logBox.scrollHeight;
        } else {
            logMsg('=============================', 'silent', true);
            logMsg('欣野雷达 已就绪', 'info', false);
            logMsg('📡 全局雷达网持续扫描中...', 'silent', true);
        }

        const qqBadge = document.getElementById('xy-qq-group');
        if (qqBadge) {
            qqBadge.onclick = (e) => {
                e.stopPropagation(); 
                try {
                    const ta = document.createElement('textarea'); ta.value = '1095232169'; ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                    showToast('🎉 QQ群号 1095232169 已成功复制到剪贴板！', 'success');
                } catch(err) { showToast('请手动复制 QQ群号: 1095232169', 'error'); }
            };
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
                appState.hardwareMute = !appState.hardwareMute;
                GM_setValue('xy_hw_mute', appState.hardwareMute);
                syncHardwareMute(); 
                btnQuickMute.innerHTML = appState.hardwareMute ? '🔇 强制静音: ON' : '🔊 强制静音: OFF';
                btnQuickMute.style.background = appState.hardwareMute ? '#14b8a6' : '#94a3b8';
                document.querySelectorAll('video, audio').forEach(m => { m.muted = appState.hardwareMute; });
                logMsg(`🔕 底层音轨强制拦截引擎已${appState.hardwareMute ? '启动' : '关闭'}！`, appState.hardwareMute ? 'success' : 'warning', false);
            };
        }

        const toggleAi = document.getElementById('toggle-ai-mode'); if(toggleAi) toggleAi.onchange = (e) => { appState.aiMode = e.target.checked; GM_setValue('xy_ai_mode', appState.aiMode); };
        const toggleVideo = document.getElementById('toggle-video-submit'); if(toggleVideo) toggleVideo.onchange = (e) => { appState.videoAutoSubmit = e.target.checked; GM_setValue('xy_video_submit', appState.videoAutoSubmit); };
        const toggleDoc = document.getElementById('toggle-doc-batch'); if(toggleDoc) toggleDoc.onchange = (e) => { appState.docBatchSubmit = e.target.checked; GM_setValue('xy_doc_batch', appState.docBatchSubmit); };
        
        // 刷新视窗显示开关事件
        const toggleRefresh = document.getElementById('toggle-refresh-panel');
        if (toggleRefresh) {
            toggleRefresh.onchange = (e) => {
                appState.showRefreshPanel = e.target.checked;
                GM_setValue('xy_show_refresh_panel', appState.showRefreshPanel);
                const refBox = document.getElementById('xy-refresh-container');
                if (refBox) refBox.style.display = appState.showRefreshPanel ? 'block' : 'none';
            };
        }

        // 终端显示开关事件
        const toggleTerminal = document.getElementById('toggle-terminal');
        if (toggleTerminal) {
            toggleTerminal.onchange = (e) => {
                appState.showTerminal = e.target.checked;
                GM_setValue('xy_show_terminal', appState.showTerminal);
                const termBox = document.getElementById('xy-terminal-container');
                if (termBox) termBox.style.display = appState.showTerminal ? 'block' : 'none';
            };
        }

        const toggleCustomReply = document.getElementById('xy-toggle-custom-reply');
        if (toggleCustomReply) {
            toggleCustomReply.onchange = (e) => {
                appState.useCustomReply = e.target.checked;
                GM_setValue('xy_use_custom_reply', appState.useCustomReply);
                logMsg(e.target.checked ? '✅ 已启用自定义回复语料' : '⏸️ 已切换回默认回复', 'info', true);
            };
        }

        const btnEditReply = document.getElementById('xy-btn-edit-reply');
        if (btnEditReply) {
            btnEditReply.onclick = () => {
                openReplySettingsModal();
            };
        }

        document.getElementById('btn-manual-refresh').onclick = () => { logMsg('🔄 手动重载页面...', 'warning', false); setTimeout(() => window.location.reload(), 500); };
        document.getElementById('btn-clear-logs').onclick = () => { sessionLogs = []; sessionStorage.removeItem('xy_session_logs'); const box = document.getElementById('xy-activity-log'); if(box) box.innerHTML = ''; logMsg('🧹 终端日志已清空', 'silent', true); };
        document.getElementById('btn-clear-progress').onclick = () => { appState.recordCount = 0; appState.totalTime = 0; appState.realTime = 0; sessionStorage.removeItem('xy_recordCount'); sessionStorage.removeItem('xy_totalTime'); sessionStorage.removeItem('xy_realTime'); updateCourseUI(); logMsg('🗑️ 时长记录归零', 'error', false); };

        document.getElementById('btn-mode-man').onclick = () => { appState.mode = 'manual'; GM_setValue('xy_play_mode', 'manual'); logMsg('已暂停，切入手动模式', 'success'); updateCourseUI(); };
        document.getElementById('btn-mode-loop').onclick = () => { if (!getCourseGroupId() || !getNodeId()) { xyShowModal('⚠️ 无法开启', '请进入具体的视频或文档内容页后再开启'); return; } appState.mode = 'loop'; GM_setValue('xy_play_mode', 'loop'); logMsg('安全刷时长模式开启，恢复经典无限循环', 'success'); updateCourseUI(); globalTaskStatusChecker(true); };
        document.getElementById('btn-mode-seq').onclick = () => { appState.mode = 'sequence'; GM_setValue('xy_play_mode', 'sequence'); logMsg('🚀 连播破壁引擎开启，特种规则接管文档与防拖拽', 'success'); updateCourseUI(); if (!getCourseGroupId()) tryJumpToNext(); else globalTaskStatusChecker(true); };
        
        document.getElementById('xy-btn-guard').onclick = () => { appState.guardActive = !appState.guardActive; GM_setValue('xy_guard_active', appState.guardActive); updateCourseUI(); };
        document.getElementById('xy-btn-dashboard').onclick = openGlobalTaskDashboard;
        document.getElementById('xy-btn-dashboard-standby').onclick = openGlobalTaskDashboard;

        const toggleDomScan = document.getElementById('xy-toggle-dom-scan');
        if(toggleDomScan) { toggleDomScan.onchange = (e) => { appState.enableDomScan = e.target.checked; logMsg(e.target.checked ? '✅ 智能DOM提取已开启' : '⏸️ 智能DOM提取已暂停', 'info', true); }; }

        document.getElementById('xy-btn-like').onclick = () => autoLikeAction(false);
        document.getElementById('xy-btn-target-like').onclick = () => autoLikeAction(true);
        document.getElementById('xy-btn-reply').onclick = () => autoReplyAction(false);
        document.getElementById('xy-btn-target-reply').onclick = () => autoReplyAction(true);
        document.getElementById('xy-btn-select-all').onclick = () => { 
            appState.selectedNames.clear();
            for(let i = 0; i < Math.min(appState.targetNames.length, 15); i++) { appState.selectedNames.add(appState.targetNames[i]); }
            renderTargetList(document.getElementById('xy-name-search')?.value || '');
            showToast('已智能全选前15名 (安全限制上限)', 'success');
            logMsg('已全选（触发点赞安全人数限制：最多15人）', 'silent', true); 
        };
        document.getElementById('xy-btn-deselect-all').onclick = () => { 
            appState.selectedNames.clear(); renderTargetList(document.getElementById('xy-name-search')?.value || ''); logMsg('已清空勾选', 'silent', true); 
        };
        document.getElementById('xy-btn-copy-names').onclick = () => {
            const names = Array.from(appState.selectedNames).join('\n');
            if (!names) { showToast('当前未选择任何目标', 'warning'); return; }
            try {
                const ta = document.createElement('textarea'); ta.value = names; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                showToast(`成功复制 ${appState.selectedNames.size} 个人名到剪贴板！`, 'success');
            } catch(e) { showToast('复制失败，可能是浏览器限制', 'error'); }
        };
        document.getElementById('xy-btn-fetch-users').onclick = fetchCurrentUsers;
        document.getElementById('xy-btn-clear-names').onclick = () => { 
            appState.targetNames = []; appState.selectedNames.clear();
            GM_setValue('xy_target_names', JSON.stringify([])); 
            renderTargetList(document.getElementById('xy-name-search')?.value || ''); 
            
            if(appState.enableDomScan) {
                appState.enableDomScan = false;
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
        listContainer.addEventListener('change', (e) => {
            if(e.target.classList.contains('xy-target-checkbox')) {
                if(e.target.checked) {
                    if (appState.selectedNames.size >= 15) {
                        e.target.checked = false;
                        showToast('为防风控，最多只允许勾选15个点赞目标！', 'warning');
                    } else { appState.selectedNames.add(e.target.value); }
                } else { appState.selectedNames.delete(e.target.value); }
                updateCheckedCount();
            }
        });
        renderTargetList();

        const handle = document.getElementById('xy-drag-handle'), minBtn = document.getElementById('xy-minimize'), body = document.getElementById('xy-main-body');
        let isMin = false; minBtn.onclick = () => { isMin = !isMin; body.style.display = isMin ? 'none' : 'flex'; minBtn.innerText = isMin ? '➕' : '➖'; };

        let isDragging = false, dragStartX = 0, dragStartY = 0, initialLeft = 0, initialTop = 0;
        
        handle.addEventListener('mousedown', (e) => {
            if(e.target.tagName === 'BUTTON' || e.target === minBtn || e.target.tagName === 'INPUT' || e.target.id === 'xy-qq-group' || e.target.id === 'xy-bc-toggle') return;
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
        });

        document.addEventListener('mouseup', () => {
            if(isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                handle.style.cursor = 'grab';
                const rect = wrapper.getBoundingClientRect();
                GM_setValue('xy_ui_pos', JSON.stringify({ x: rect.left, y: rect.top }));
            }
        });

        syncHardwareMute();
        fetchCloudIntelligence(); 
    }

    // ==========================================
    // 🌟 全局任务大屏 (雷达)
    // ==========================================
    async function fetchGlobalTasks() {
        try { const token = await getAuthToken(); const response = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { method: "GET", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" } }); const data = await response.json(); return data.success ? data.data : []; } catch (error) { return []; }
    }

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
                        statusIndicator.style.background = '#fef08a';
                        statusIndicator.style.color = '#854d0e';
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
                            statusIndicator.style.background = '#dcfce7';
                            statusIndicator.style.color = '#166534';
                        }
                        const checkbox = taskCard ? taskCard.querySelector('.xy-task-check') : null;
                        if (checkbox) { checkbox.disabled = true; checkbox.checked = false; }
                        if (taskCard) taskCard.style.borderColor = '#dcfce7';
                    } else {
                        if (statusIndicator) {
                            statusIndicator.innerHTML = '❌ 验证失败';
                            statusIndicator.style.background = '#fee2e2';
                            statusIndicator.style.color = '#991b1b';
                        }
                        if (taskCard) taskCard.style.borderColor = '#fee2e2';
                    }
                } catch (err) {
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '⚠️ 网络异常';
                        statusIndicator.style.background = '#fef2f2';
                        statusIndicator.style.color = '#b91c1c';
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

        } catch(e) {}
    }

    async function openGlobalTaskDashboard() {
        let overlay = document.getElementById('xy-dashboard-overlay');
        if (!overlay) { overlay = document.createElement('div'); overlay.id = 'xy-dashboard-overlay'; overlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); z-index:2147483645; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(8px); opacity:0; transition:opacity 0.3s;`; document.body.appendChild(overlay); }
        overlay.innerHTML = `
            <div style="background:white; width:90%; max-width:900px; height:85vh; border-radius:20px; box-shadow:0 25px 50px rgba(0,0,0,0.25); display:flex; flex-direction:column; overflow:hidden; transform:scale(0.95); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="padding:20px 24px; background:linear-gradient(135deg, #4f46e5, #3b82f6); border-bottom:1px solid #6366f1; display:flex; justify-content:space-between; align-items:center; flex-shrink: 0;">
                    <div style="font-size:20px; font-weight:bold; color:white; display:flex; align-items:center; gap:10px;">🌍 全局智能导航雷达</div>
                    <button id="xy-close-dashboard" style="background:none; border:none; font-size:24px; color:#e0e7ff; cursor:pointer; padding:0; transition: 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#e0e7ff'">✖</button>
                </div>
                <div id="xy-dashboard-content" style="flex:1; overflow-y:auto; padding:24px; background:#f8fafc;">
                    <div style="text-align:center; padding:40px; color:#64748b; font-size:16px;"><span style="display:inline-block; animation:pulse 1s infinite;">📡 正在拉取 API 数据...</span></div>
                </div>
                <div id="xy-dashboard-footer" style="display:none; padding:16px 24px; background:white; border-top:1px solid #e2e8f0; flex-shrink: 0; justify-content:center;">
                    <button id="xy-batch-submit-btn" style="width:100%; max-width:600px; background:linear-gradient(135deg, #4f46e5, #3b82f6); color:white; border:none; padding:16px; border-radius:12px; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 8px 16px rgba(79,70,229,0.3); transition:0.2s;">🚀 一键提交勾选任务</button>
                </div>
            </div>
        `;
        requestAnimationFrame(() => { overlay.style.opacity = '1'; overlay.firstElementChild.style.transform = 'scale(1)'; });
        document.getElementById('xy-close-dashboard').onclick = () => { overlay.style.opacity = '0'; overlay.firstElementChild.style.transform = 'scale(0.95)'; setTimeout(() => overlay.remove(), 300); };
        const tasks = await fetchGlobalTasks(); renderGlobalDashboardContent(tasks);
    }

    function renderGlobalDashboardContent(tasks) {
        const contentBox = document.getElementById('xy-dashboard-content'), footerBox = document.getElementById('xy-dashboard-footer');
        if (!contentBox) return;
        if (!tasks || tasks.length === 0) { contentBox.innerHTML = `<div style="text-align:center; padding:80px; color:#94a3b8; font-size:20px;">🎉 全网已无未完成的任务！</div>`; if (footerBox) footerBox.style.display = 'none'; return; }
        if (footerBox) footerBox.style.display = 'flex';

        let html = `
            <div style="background:linear-gradient(145deg, #fef3c7, #fde68a); padding:16px; border-radius:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; border:1px solid #fcd34d;">
                <div>
                    <div style="font-weight:bold; color:#92400e; font-size:15px; margin-bottom:4px;">⚠️ 跨课高危自由模式</div>
                    <div style="color:#b45309; font-size:12px;">允许跨课程批量强交【非视频类】作业（有查水表风险，切忌交空卷）</div>
                </div>
                <label style="position:relative; display:inline-block; width:50px; height:26px;">
                    <input type="checkbox" id="xy-freedom-switch" style="opacity:0; width:0; height:0;" ${appState.isFreedomMode ? 'checked' : ''}>
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${appState.isFreedomMode?'#92400e':'#d1d5db'}; border-radius:34px; transition:.4s;">
                        <span style="position:absolute; height:20px; width:20px; left:3px; bottom:3px; background:white; border-radius:50%; transition:.4s; transform:${appState.isFreedomMode?'translateX(24px)':'translateX(0)'};"></span>
                    </span>
                </label>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 4px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; color: #334155; font-size: 15px; user-select: none;">
                <input type="checkbox" id="xy-select-all" style="width: 18px; height: 18px; accent-color: #4f46e5; cursor: pointer;"> ✅ 全选可提交任务
            </label>
        </div>
        <div id="xy-global-task-container" style="display:flex; flex-direction:column; gap:20px;">
        `;

        const groupedTasks = tasks.reduce((acc, t) => { if(!acc[t.group_name]) acc[t.group_name] = []; acc[t.group_name].push(t); return acc; }, {});
        window.xyGlobalTaskMap = new Map();

        Object.entries(groupedTasks).forEach(([courseName, courseTasks]) => {
            courseTasks.sort((a,b) => new Date(a.end_time) - new Date(b.end_time));
            html += `
                <div style="background:white; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                    <div style="background:#f1f5f9; padding:12px 20px; font-weight:bold; color:#334155; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between;">
                        <span>📚 ${courseName || '未知课程'}</span><span style="background:#e0e7ff; color:#4f46e5; padding:2px 8px; border-radius:10px; font-size:12px;">接口 ${courseTasks.length} 个</span>
                    </div>
                    <div style="padding:16px; display:flex; flex-direction:column; gap:12px;">
            `;
            courseTasks.forEach(task => {
                window.xyGlobalTaskMap.set(task.task_id || task.id, task);
                const now = new Date();
                const endTime = new Date(task.end_time);
                const startTime = new Date(task.start_time);
                
                const isCompleted = task.finish === 2;
                const isAutoable = task.task_type === 1;
                const enableCheck = (!isCompleted) && (isAutoable || appState.isFreedomMode);
                
                let statusTag = ''; let statusColorBg = ''; let statusColorText = '';
                if (isCompleted) { statusTag = '✓ 已完成'; statusColorBg = '#dcfce7'; statusColorText = '#166534'; } 
                else if (endTime < now) { statusTag = '⚠️ 已截止'; statusColorBg = '#fee2e2'; statusColorText = '#991b1b'; } 
                else if (startTime > now) { statusTag = '🔒 未开始'; statusColorBg = '#f1f5f9'; statusColorText = '#475569'; } 
                else { statusTag = '⏳ 进行中'; statusColorBg = '#eff6ff'; statusColorText = '#1e40af'; }

                const currentNodeId = getNodeId();
                const isCurrentNode = currentNodeId && task.node_id == currentNodeId;
                const borderStyle = isCurrentNode ? 'border: 2px solid #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.2);' : (enableCheck ? 'border: 1px solid #cbd5e1;' : 'border: 1px solid transparent;');
                const currentMark = isCurrentNode ? `<span style="background:#3b82f6; color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:6px;">📍 当前位置</span>` : '';
                const typeStr = {1:'👁️ 自主观看', 2:'✍️ 作业', 3:'📚 课堂练习', 4:'💯 测验', 5:'📋 问卷', 6:'💭 讨论'}[task.task_type] || '📌 未知';

                html += `
                    <div id="xy-global-task-card-${task.task_id || task.id}" style="background:#f8fafc; border-radius:8px; padding:12px; display:flex; align-items:center; gap:16px; transition: all 0.3s; ${borderStyle}">
                        <input type="checkbox" class="xy-task-check" value="${task.task_id || task.id}" ${enableCheck?'':'disabled'} style="width:18px; height:18px; cursor:${enableCheck?'pointer':'not-allowed'}; accent-color:#4f46e5; flex-shrink: 0;">
                        <div style="flex:1;">
                            <div style="font-size:14px; font-weight:bold; color:#1e293b; margin-bottom:4px; display:flex; align-items:center;">
                                ${task.name || '未知任务'} ${currentMark}
                            </div>
                            <div style="font-size:12px; color:#64748b; display:flex; gap:16px;">
                                <span>${typeStr}</span>
                                <span>截止: ${new Date(task.end_time).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div>
                            <span class="xy-task-status-indicator" style="background:${statusColorBg}; color:${statusColorText}; padding:4px 8px; border-radius:6px; font-size:12px; font-weight:bold; white-space:nowrap; transition:all 0.3s;">${statusTag}</span>
                        </div>
                    </div>`;
            });
            html += `</div></div>`;
        });
        html += `</div>`; contentBox.innerHTML = html;

        const selectAllCb = document.getElementById('xy-select-all'), taskCheckboxes = document.querySelectorAll('.xy-task-check:not([disabled])');
        if (selectAllCb) selectAllCb.onchange = (e) => { taskCheckboxes.forEach(cb => { cb.checked = e.target.checked; }); };
        taskCheckboxes.forEach(cb => { cb.onchange = () => { if (!cb.checked && selectAllCb) selectAllCb.checked = false; else if (selectAllCb) selectAllCb.checked = Array.from(taskCheckboxes).every(c => c.checked); }; });
        const fSwitch = document.getElementById('xy-freedom-switch');
        if (fSwitch) fSwitch.onchange = (e) => {
            if (e.target.checked) { xyShowModal("⚠️ 越级警告", "强行解除非视频节点的锁极易导致数据异常，请确保你清楚后果！", () => { appState.isFreedomMode = true; renderGlobalDashboardContent(tasks); }); e.target.checked = false; } 
            else { appState.isFreedomMode = false; renderGlobalDashboardContent(tasks); }
        };
        const submitBtn = document.getElementById('xy-batch-submit-btn');
        if (submitBtn) submitBtn.onclick = () => {
            const checkedNodes = Array.from(document.querySelectorAll('.xy-task-check:checked')).map(cb => cb.value);
            if (checkedNodes.length === 0) { showToast('未勾选任何提交目标', 'warning'); return; }
            submitBtn.innerText = '⏳ 正在批量提交任务...'; submitBtn.disabled = true;
            batchSubmitGlobalTasks(checkedNodes.map(id => window.xyGlobalTaskMap.get(id)).filter(Boolean));
        };
    }

    // ==========================================
    // 🛡️ 启动系统与全局路由监听
    // ==========================================
    function ensureUI() {
        if (!document.getElementById('xy-super-console')) { createUI(); appState.isTaskCompleted = false; }
        
        runLowLevelScanner().then(() => {
            updateCourseUI(); 
            updateDiscUI(); 
        });
    }

    const observer = new MutationObserver(() => ensureUI());
    observer.observe(document.body, { childList: true, subtree: false });

    const pushState = history.pushState; history.pushState = function () { pushState.apply(history, arguments); setTimeout(ensureUI, 100); };
    const replaceState = history.replaceState; history.replaceState = function () { replaceState.apply(history, arguments); setTimeout(ensureUI, 100); };
    window.addEventListener('popstate', () => setTimeout(ensureUI, 100));

    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', () => { ensureUI(); });
    } else {
        ensureUI(); 
    }
})();