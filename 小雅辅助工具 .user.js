// ==UserScript==
// @name         小雅辅助工具
// @namespace    https://gitee.com/fieldlu/xy-script-assets
// @version      3.4.5
// @description  小雅平台全自动辅助：视频/文档智能连播挂机、讨论区抓包批量点赞/自定义回复、计划调度中心跨课编排、全局任务雷达一键秒交、课件批量下载、深度伪装反检测、后台保活防节流、手动时长注入
// @author       Confidential
// @license      仅供个人使用与传播，禁止修改、复制、售卖、代刷
// @match        https://*.ai-augmented.com/*
// @run-at       document-start
// @updateURL    https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js
// @downloadURL  https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @icon         data:image/png;base64,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

// ==/UserScript==

(function () {
    'use strict';

    // 彻底动态化：读取头部 @version，无任何写死的数字，以后发版只需改头部注释即可！
    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '未知';

    const domain = window.location.hostname;

    // ⚡ 二次元启动程序 — 仅冷启动显示，刷新跳过
    (function initSplash() {
        try {
            // 用 sessionStorage 判断：新标签页=显示，刷新/F5=跳过
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

                // 网格背景已用 CSS 实现

                // 扫描线已在 CSS ::after 伪元素中

                // 脉冲点
                for (let i = 0; i < 3; i++) {
                    const pls = document.createElement('div');
                    pls.className = 'pls';
                    el.appendChild(pls);
                }

                // 六边形装饰
                const hex = document.createElement('div');
                hex.className = 'hex';
                el.appendChild(hex);

                // 星空
                const stars = document.createElement('div');
                for (let i = 0; i < 70; i++) {
                    const s = document.createElement('div'); s.className = 'st';
                    const sz = Math.random() * 2 + 0.8;
                    const colors = ['rgba(255,255,255,0.9)','rgba(167,139,250,0.7)','rgba(6,182,212,0.6)','rgba(244,63,94,0.5)'];
                    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};--d:${Math.random()*3+2}s;--dl:${Math.random()*4}s;box-shadow:0 0 ${sz*3}px ${colors[Math.floor(Math.random()*colors.length)]}`;
                    stars.appendChild(s);
                }
                el.appendChild(stars);

                // 光环
                [1,2,3].forEach(i => {
                    const r = document.createElement('div');
                    r.className = `ri ri-${i}`;
                    el.appendChild(r);
                });

                // 粒子 — 混合菱形和圆形
                const parts = document.createElement('div');
                const pcols = ['rgba(124,58,237,0.45)','rgba(167,139,250,0.35)','rgba(6,182,212,0.35)','rgba(244,63,94,0.35)','rgba(139,92,246,0.3)','rgba(129,140,248,0.25)'];
                for (let i = 0; i < 24; i++) {
                    const p = document.createElement('div');
                    p.className = 'pt ' + (Math.random() > 0.5 ? 'diamond' : 'circle');
                    p.style.cssText = `left:${Math.random()*100}%;--s:${Math.random()*6+3}px;--c:${pcols[Math.floor(Math.random()*pcols.length)]};--d:${Math.random()*10+6}s;--dl:${Math.random()*6}s;--a:${Math.random()>0.5?'xy-f2':'xy-f1'}`;
                    parts.appendChild(p);
                }
                el.appendChild(parts);

                // 中心 HUD 卡片
                const card = document.createElement('div');
                card.className = 'cd';
                card.innerHTML = '<div class="sc"></div><div class="cr cr-tl"></div><div class="cr cr-tr"></div><div class="cr cr-bl"></div><div class="cr cr-br"></div><div class="icon">⚡</div><div class="title">小雅辅助工具</div><div class="sub">系 统 启 动 中</div><div class="ver">版本 ' + SCRIPT_VERSION + '</div><div class="po"><div class="pi" id="xy-sp"></div><div class="ps"></div></div><div class="ft">初 始 化 引 擎</div>';
                el.appendChild(card);

                document.body.appendChild(el);

                // 进度条
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
        } catch(e) { /* 不影响主脚本 */ }
    })();

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
        _lastCourseNodeId: null, // 智能重置：跟踪当前课程节点 ID
        aiMode: GM_getValue('xy_ai_mode', true),
        videoAutoSubmit: GM_getValue('xy_video_submit', true),
        docBatchSubmit: GM_getValue('xy_doc_batch', true),
        mouseSimActive: GM_getValue('xy_mouse_sim', true),
        showRefreshPanel: GM_getValue('xy_show_refresh_panel', true),
        showTerminal: GM_getValue('xy_show_terminal', false),
        theme: GM_getValue('xy_theme', 'auto'),
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
        isProcessingJump: false,
        isJumping: false,
        useCustomReply: GM_getValue('xy_use_custom_reply', false),
        customReplies: [],
        downloadFiles: [],
        downloadCourseName: '',
        downloadSelectedIds: new Set(),
        downloadSearchKeyword: '',
        downloadAbortController: null,
        downloadPaused: false,
        prevZone: 'course',
        // 🆕 反检测深度伪装 2.0
        deepCamouflage: GM_getValue('xy_deep_camo', true),
        camoScrollActive: false,
        camoKeyboardActive: false,
        // 🆕 后台保活 + 时长注入
        keepaliveEnabled: GM_getValue('xy_keepalive', true),
        keepaliveWatchdog: null,
        injectActive: false,
        injectTotal: 0,
        injectCompleted: 0,
        camoClickActive: false
    };

    // ==========================================
    // 🌟 全新外挂架构：计划调度中心状态
    // ==========================================
    const xyScheduleState = {
        queue: JSON.parse(GM_getValue('xy_schedule_queue', '[]')),
        isRunning: GM_getValue('xy_schedule_running', false),
        currentIdx: parseInt(GM_getValue('xy_schedule_idx', 0)),
        lastMode: GM_getValue('xy_schedule_last_mode', 'sequence'),
        autoStart: GM_getValue('xy_schedule_auto_start', ''),
        autoStop: GM_getValue('xy_schedule_auto_stop', '')
    };

    // 数据向上迁移与格式兼容
    xyScheduleState.queue.forEach(q => {
        if (q.infinite !== undefined) {
            if (q.infinite) q.strategy = 'infinite';
            else if (q.duration === -1) q.strategy = 'infinite';
            else q.strategy = 'duration';
            delete q.infinite;
        }
        if (!q.strategy) q.strategy = 'until_done';
    });

    // 每次启动默认不自动运行计划调度，防止浏览器重开时意外自动执行
    if (xyScheduleState.isRunning) {
        xyScheduleState.isRunning = false;
        xyScheduleState.currentIdx = 0;
        xyScheduleState.queue.forEach(q => { q.status = 'pending'; q.elapsedSec = 0; });
        GM_setValue('xy_schedule_running', false);
        GM_setValue('xy_schedule_idx', 0);
        GM_setValue('xy_schedule_queue', JSON.stringify(xyScheduleState.queue));
    }

    function saveScheduleState() {
        GM_setValue('xy_schedule_queue', JSON.stringify(xyScheduleState.queue));
        GM_setValue('xy_schedule_running', xyScheduleState.isRunning);
        GM_setValue('xy_schedule_idx', xyScheduleState.currentIdx);
        GM_setValue('xy_schedule_last_mode', xyScheduleState.lastMode);
    }

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
    let isRecordSending = false;
    let recordFailCount = 0;

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
    function escapeHtml(str) { if (!str) return ''; const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
    function escapeRegex(str) { if (!str) return ''; return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

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
        } catch(e) { return null; }
    }

    function resolveTheme() {
        if (appState.theme === 'auto') {
            const h = new Date().getHours();
            return (h >= 6 && h < 18) ? 'light' : 'dark';
        }
        return appState.theme;
    }

    // 主题色切换辅助：T(深色值, 浅色值) → 根据当前有效主题返回对应颜色
    function T(dark, light) { return resolveTheme() === 'light' ? light : dark; }

    let _lastEffectiveTheme = null;

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
        // Zone badge
        const badge = document.getElementById('xy-zone-badge');
        if (badge && appState.activeZone !== 'uninitialized') {
            const isLight = effective === 'light';
            if (appState.activeZone === 'course') {
                badge.style.background = isLight ? '#dbeafe' : 'rgba(99,102,241,0.15)';
                badge.style.color = isLight ? '#1e40af' : '#a5b4fc';
            } else if (appState.activeZone === 'disc') {
                badge.style.background = isLight ? '#ffedd5' : 'rgba(245,158,11,0.15)';
                badge.style.color = isLight ? '#c2410c' : '#fcd34d';
            } else {
                badge.style.background = isLight ? '#f1f5f9' : 'rgba(71,85,105,0.2)';
                badge.style.color = isLight ? '#475569' : '#94a3b8';
            }
        }
        // Toggle icon
        const btn = document.getElementById('xy-theme-toggle');
        if (btn) {
            if (appState.theme === 'auto') {
                btn.textContent = effective === 'light' ? '☀️' : '🌙';
                btn.title = '自动模式 (' + effective + ') - 点击切换';
            } else if (appState.theme === 'light') {
                btn.textContent = '☀️'; btn.title = '浅色模式 - 点击切换';
            } else {
                btn.textContent = '🌙'; btn.title = '深色模式 - 点击切换';
            }
        }
    }

    function applyTheme() {
        const effective = resolveTheme();
        if (_lastEffectiveTheme === effective) return;

        // 主题发生变化，刷新网页以全新主题重新渲染所有样式
        window.location.reload();
    }

    const originalTitle = document.title;

    function updateTitleBar() {
        if (xyScheduleState.isRunning) {
            const cur = xyScheduleState.queue[xyScheduleState.currentIdx];
            const name = cur ? cur.name.substring(0, 10) : '...';
            document.title = `[${xyScheduleState.currentIdx + 1}/${xyScheduleState.queue.length}] 计划调度 · ${name}`;
            return;
        }
        if (appState.activeZone === 'course') {
            const taskType = appState.currentEngine;
            if (taskType === 'video') {
                let video = document.querySelector('video');
                if (video && video.duration) {
                    const pct = Math.round((video.currentTime / video.duration) * 100);
                    document.title = `[${pct}%] ${appState.mode === 'loop' ? '循环' : '连播'}挂机中`;
                } else {
                    document.title = '[视频] 挂机中';
                }
            } else if (taskType === 'doc') {
                const pct = Math.min(Math.round((appState.docReadTime / 130) * 100), 100);
                document.title = appState.isTaskCompleted ? '[✓] 文档已达标' : `[${pct}%] 文档阅读中`;
            } else {
                document.title = appState.isTaskCompleted ? '[✓] 已达标' : '[·] 挂机中';
            }
        } else if (appState.activeZone === 'disc') {
            document.title = `[${appState.targetNames.length}人] 讨论区`;
        } else {
            document.title = originalTitle;
        }
    }
    function decodeNickname(encodedStr) {
        if (!encodedStr) return "匿名"; let res = encodedStr;
        try { res = new TextDecoder().decode(Uint8Array.from(atob(encodedStr), c => c.charCodeAt(0))).split('').reverse().join(''); } catch(e) { try { res = decodeURIComponent(escape(atob(encodedStr))).split('').reverse().join(''); } catch (err) {} }
        return cleanName(res);
    }

    // 🌟终极修复：精确识别测验/作业，且对自主学习节点(视频/文档)进行严格的后缀名校验以剔除空文件夹！
    function extractFilesFromResources(arr) {
        let res = [];
        if (!Array.isArray(arr)) return res;
        arr.forEach(item => {
            if (item.children) res = res.concat(extractFilesFromResources(item.children));
            if (item.child_nodes) res = res.concat(extractFilesFromResources(item.child_nodes));
            if (item.items) res = res.concat(extractFilesFromResources(item.items));

            const type = item.task_type !== undefined ? item.task_type : item.type;
            if (type === undefined || type === null) return;

            const name = (item.name || item.title || '').toLowerCase();
            
            // 核心修正：如果是测验(4)、作业(2)、问卷(5)、练习(3) 等，直接保留，不需要后缀名！
            if (type >= 2 && type <= 5) {
                const cleanItem = Object.assign({}, item);
                cleanItem.computed_task_type = type;
                res.push(cleanItem);
            } 
            // 否则（如类型1 自主学习，或其它类型），必须严格校验后缀名防空文件夹！
            else {
                const isMedia = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
                const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
                
                // 唯有真正匹配到后缀的文件，才予以放行
                if (isMedia || isDoc) {
                    const cleanItem = Object.assign({}, item);
                    cleanItem.computed_task_type = 1; // 媒体/文档文件必定是自主学习(类型1)
                    res.push(cleanItem);
                }
            }
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
        
        // 核心修复：进入待命区或讨论区时，立刻销毁动态重载调度器
        if (newZone === 'standby' || newZone === 'disc') {
            clearDynamicRefresh();
            lastRefreshStrategy = 'none';
        }
        
        // 确保主UI面板本体不会被隐藏
        const superConsole = document.getElementById('xy-super-console');
        if (superConsole) {
            superConsole.style.display = 'flex';
        }
        
        const viewC = document.getElementById('xy-view-course'), viewD = document.getElementById('xy-view-disc'), viewS = document.getElementById('xy-view-standby'), viewDL = document.getElementById('xy-view-download'), badge = document.getElementById('xy-zone-badge');
        if (viewC && viewD && viewS && viewDL && badge) {
            viewC.style.display = newZone === 'course' ? 'block' : 'none';
            viewD.style.display = newZone === 'disc' ? 'block' : 'none';
            viewS.style.display = newZone === 'standby' ? 'flex' : 'none';
            viewDL.style.display = newZone === 'download' ? 'block' : 'none';

            const isLight = resolveTheme() === 'light';
            if (newZone === 'course') {
                badge.innerHTML = '📚 刷课区';
                badge.style.background = isLight ? '#dbeafe' : 'rgba(99,102,241,0.15)';
                badge.style.color = isLight ? '#1e40af' : '#a5b4fc';
            } else if (newZone === 'disc') {
                badge.innerHTML = '💭 讨论区';
                badge.style.background = isLight ? '#ffedd5' : 'rgba(245,158,11,0.15)';
                badge.style.color = isLight ? '#c2410c' : '#fcd34d';
            } else if (newZone === 'download') {
                badge.innerHTML = '📥 下载区';
                badge.style.background = isLight ? '#d1fae5' : 'rgba(52,211,153,0.12)';
                badge.style.color = isLight ? '#065f46' : '#6ee7b7';
            } else {
                badge.innerHTML = '🏝️ 待命区';
                badge.style.background = isLight ? '#f1f5f9' : 'rgba(71,85,105,0.2)';
                badge.style.color = isLight ? '#475569' : '#94a3b8';
            }
        }

        if (oldZone !== 'uninitialized') {
            const zoneName = newZone === 'course' ? '视频/文档自动引擎' : newZone === 'disc' ? '互动点赞引擎' : newZone === 'download' ? '课件下载区' : '系统隔离待命区';
            logMsg(`📍 底层指令：已切换至【${zoneName}】`, newZone === 'standby' ? 'warning' : 'success', false);
        }

        if (newZone === 'course') {
            ensureAutoRecord();
            globalTaskStatusChecker(true);
            // 智能重置：只在进入新节点时重置完成状态，避免已完成任务被重复提交
            const currentNodeId = getNodeId();
            if (!appState._lastCourseNodeId || appState._lastCourseNodeId !== currentNodeId) {
                appState._lastCourseNodeId = currentNodeId;
                appState.docReadTime = 0;
                appState.lastDocSubmitTime = 0;
                appState.videoScriptProgress = undefined;
                appState.isTaskCompleted = false;
            }
        }
    }

    // 雷达 API 缓存（3秒TTL，减少高频轮询中的重复请求）
    let _radarCache = { data: null, time: 0, promise: null };
    async function fetchRadarCached() {
        const now = Date.now();
        if (_radarCache.data && (now - _radarCache.time) < 3000) return _radarCache.data;
        if (_radarCache.promise) return _radarCache.promise; // 合并并发请求
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

    async function runLowLevelScanner() {
        // 下载区手动模式：不自动切换区域，由用户手动控制
        if (appState.activeZone === 'download') return;
        if (appState.discLockedUrl === window.location.href) { switchToZone('disc'); return; }
        const groupId = getCourseGroupId(); const nodeId = getNodeId();
        if (!groupId || !nodeId) { switchToZone('standby'); return; }

        let taskType = -1;

        try {
            const radarData = await fetchRadarCached();
            if (radarData.success && radarData.data) {
                const rTask = radarData.data.find(t => t.node_id == nodeId);
                if (rTask) {
                    taskType = rTask.task_type;
                } else {
                    const resources = await loadCourseResources(groupId);
                    if (resources) {
                        const flatRes = extractFilesFromResources(resources);
                        const currentRes = flatRes.find(r => r.node_id == nodeId || r.id == nodeId);
                        if (currentRes) taskType = currentRes.computed_task_type;
                    }
                    if (!appState.isTaskCompleted && appState.activeZone === 'course') {
                        appState.isTaskCompleted = true;
                        logMsg('✅ [雷达秒判] 当前任务已在全局雷达达成，瞬间放行！', 'success', false);
                        updateCourseUI();
                    }
                }
            }
        } catch(e) { console.warn('[小雅] 全局任务雷达请求失败', e); }

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
        } catch(e) { console.warn('[小雅] loadCourseResources 请求失败', e); } 
        isFetchingResources = false;
        return appState.courseResourcesCache;
    }

    // ==========================================
    // 📥 下载区核心引擎
    // ==========================================
    function decryptFileUrl(encryptedUrl) {
        try {
            const key = "94374647";
            const vector = "99526255";
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

    async function fetchDownloadResources(groupId) {
        if (!groupId) return [];
        try {
            const token = getCookie();
            if (!token) return [];
            const res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${groupId}`, {
                headers: { 'authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success || !data.data) return [];
            const flat = extractFilesFromResources(data.data);
            return flat.filter(r => {
                const name = (r.name || r.title || '').toLowerCase();
                return /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
            }).map(r => ({
                id: r.id || r.resource_id,
                nodeId: r.node_id || r.id,
                name: r.name || r.title || '未知文件',
                type: /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test((r.name || '').toLowerCase()) ? 'video' : 'doc',
                quoteId: r.quote_id || r.id,
                size: r.file_size || r.size || 0
            }));
        } catch(e) { return []; }
    }

    async function getDownloadUrl(quoteId) {
        for (let i = 0; i < 3; i++) {
            try {
                const token = getCookie();
                if (!token) continue;
                const res = await fetch(`https://${domain}/api/jx-oresource/cloud/file_url/${quoteId}`, {
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
            } catch(e) { console.warn('[小雅] getDownloadUrl 失败', e); }
            await sleep(500);
        }
        return null;
    }

    function downloadFile(url, filename, signal) {
        return new Promise((resolve, reject) => {
            const token = getCookie();
            const abortHandler = () => reject(new DOMException('用户终止下载', 'AbortError'));
            if (signal) {
                if (signal.aborted) { abortHandler(); return; }
                signal.addEventListener('abort', abortHandler, { once: true });
            }
            fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: signal || undefined
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            }).then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(a.href), 5000);
                resolve(true);
            }).catch(err => {
                if (signal) signal.removeEventListener('abort', abortHandler);
                reject(err);
            });
        });
    }

    function updateDownloadProgress(done, total) {
        const bar = document.getElementById('xy-dl-progress-bar');
        const text = document.getElementById('xy-dl-progress-text');
        if (bar) bar.style.width = total > 0 ? `${(done / total * 100).toFixed(0)}%` : '0%';
        if (text) text.textContent = total > 0 ? `${done}/${total} (${(done/total*100).toFixed(0)}%)` : '';
        const wrap = document.getElementById('xy-dl-progress-wrap');
        if (wrap) wrap.style.display = total > 0 ? 'block' : 'none';
    }

    function setDownloadButtonsState(downloading, paused) {
        const batchBtn = document.getElementById('xy-dl-batch-download');
        const stopBtn = document.getElementById('xy-dl-stop');
        const pauseBtn = document.getElementById('xy-dl-pause');
        if (batchBtn) { batchBtn.style.display = downloading ? 'none' : ''; batchBtn.disabled = false; }
        if (stopBtn) stopBtn.style.display = downloading ? '' : 'none';
        if (pauseBtn) {
            pauseBtn.style.display = downloading ? '' : 'none';
            pauseBtn.textContent = paused ? '▶️ 继续' : '⏸️ 暂停';
        }
    }

    function stopBatchDownload() {
        if (appState.downloadAbortController) {
            appState.downloadAbortController.abort();
            appState.downloadAbortController = null;
        }
        appState.downloadPaused = false;
        setDownloadButtonsState(false, false);
        const btn = document.getElementById('xy-dl-batch-download');
        if (btn) btn.innerText = '⬇️ 下载选中';
        logMsg('⏹️ 用户终止了批量下载', 'info', true);
    }

    async function batchDownloadSelected() {
        const selected = appState.downloadFiles.filter(f => appState.downloadSelectedIds.has(f.id));
        if (selected.length === 0) { showToast('请先勾选要下载的文件', 'warning'); return; }
        appState.downloadAbortController = new AbortController();
        appState.downloadPaused = false;
        const signal = appState.downloadAbortController.signal;
        setDownloadButtonsState(true, false);
        let done = 0, failed = 0;
        const total = selected.length;
        updateDownloadProgress(0, total);
        for (let i = 0; i < selected.length; i++) {
            // 检查终止
            if (signal.aborted) {
                updateDownloadProgress(done + failed, total);
                setDownloadButtonsState(false, false);
                const btn = document.getElementById('xy-dl-batch-download');
                if (btn) btn.innerText = '⬇️ 下载选中';
                showToast(`下载已终止: ${done}/${total} 个文件`, 'warning');
                setTimeout(() => updateDownloadProgress(-1, 0), 3000);
                return;
            }
            // 检查暂停
            while (appState.downloadPaused && !signal.aborted) {
                await sleep(300);
            }
            if (signal.aborted) {
                updateDownloadProgress(done + failed, total);
                setDownloadButtonsState(false, false);
                const btn = document.getElementById('xy-dl-batch-download');
                if (btn) btn.innerText = '⬇️ 下载选中';
                showToast(`下载已终止: ${done}/${total} 个文件`, 'warning');
                setTimeout(() => updateDownloadProgress(-1, 0), 3000);
                return;
            }
            const file = selected[i];
            const url = await getDownloadUrl(file.quoteId);
            if (signal.aborted) {
                updateDownloadProgress(done + failed, total);
                setDownloadButtonsState(false, false);
                const btn = document.getElementById('xy-dl-batch-download');
                if (btn) btn.innerText = '⬇️ 下载选中';
                showToast(`下载已终止: ${done}/${total} 个文件`, 'warning');
                setTimeout(() => updateDownloadProgress(-1, 0), 3000);
                return;
            }
            if (url) {
                try {
                    await downloadFile(url, file.name, signal);
                    done++;
                    logMsg(`📥 已下载: ${file.name}`, 'success', true);
                } catch (e) {
                    if (e.name === 'AbortError') {
                        updateDownloadProgress(done + failed, total);
                        setDownloadButtonsState(false, false);
                        const btn = document.getElementById('xy-dl-batch-download');
                        if (btn) btn.innerText = '⬇️ 下载选中';
                        showToast(`下载已终止: ${done}/${total} 个文件`, 'warning');
                        setTimeout(() => updateDownloadProgress(-1, 0), 3000);
                        return;
                    }
                    failed++;
                    logMsg(`❌ 下载失败: ${file.name}`, 'error', true);
                }
            } else {
                failed++;
                logMsg(`❌ 获取失败: ${file.name}`, 'error', true);
            }
            updateDownloadProgress(done + failed, total);
            if (i < selected.length - 1 && !signal.aborted && !appState.downloadPaused) {
                await sleep(500);
            }
        }
        appState.downloadAbortController = null;
        appState.downloadPaused = false;
        setDownloadButtonsState(false, false);
        const btn = document.getElementById('xy-dl-batch-download');
        if (btn) btn.innerText = '⬇️ 下载选中';
        showToast(`下载完成: ${done}/${total} 个文件` + (failed > 0 ? ` (${failed} 个失败)` : ''), 'success');
        setTimeout(() => updateDownloadProgress(-1, 0), 3000);
    }

    function renderDownloadList() {
        const listDiv = document.getElementById('xy-dl-file-list');
        if (!listDiv) return;
        if (appState.downloadFiles.length === 0) {
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">暂无课件资源</div>`;
            const countEl = document.getElementById('xy-dl-file-count');
            if (countEl) countEl.textContent = '0 个文件';
            return;
        }
        const keyword = (appState.downloadSearchKeyword || '').toLowerCase().trim();
        const filtered = keyword
            ? appState.downloadFiles.filter(f => f.name.toLowerCase().includes(keyword))
            : appState.downloadFiles;
        const countEl = document.getElementById('xy-dl-file-count');
        if (countEl) countEl.textContent = filtered.length + ' 个文件' + (keyword ? ' (已过滤)' : '');
        if (filtered.length === 0) {
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">📭 无匹配文件</div>`;
            return;
        }
        let html = '';
        filtered.forEach(f => {
            const checked = appState.downloadSelectedIds.has(f.id);
            const icon = f.type === 'video' ? '🎬' : '📄';
            const sizeStr = f.size ? (f.size > 1048576 ? (f.size/1048576).toFixed(1)+'MB' : (f.size/1024).toFixed(0)+'KB') : '';
            html += `
                <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-bottom:1px solid ${T('rgba(71,85,105,0.12)','#e2e8f0')}; font-size:13px; color:${T('#cbd5e1','#334155')};">
                    <input type="checkbox" class="xy-dl-check" data-fid="${f.id}" ${checked?'checked':''} style="accent-color:#818cf8; flex-shrink:0; width:15px; height:15px; cursor:pointer;">
                    <span style="flex-shrink:0;">${icon}</span>
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:${T('#e2e8f0','#0f172a')}; font-weight:500;" title="${f.name}">${f.name}</span>
                    <span style="font-size:11px; color:${T('#64748b','#94a3b8')}; flex-shrink:0;">${sizeStr}</span>
                    <button class="xy-mini-btn xy-dl-single" data-fid="${f.id}" style="padding:3px 10px; font-size:11px; flex-shrink:0;">⬇️</button>
                </div>`;
        });
        listDiv.innerHTML = html;
    }

    async function loadDownloadPanel(groupId) {
        const statusEl = document.getElementById('xy-dl-status');
        const nameEl = document.getElementById('xy-dl-course-name');
        if (statusEl) statusEl.innerHTML = `<span style="color:${T('#a5b4fc','#3730a3')};">📡 正在加载课件资源...</span>`;
        if (nameEl) nameEl.textContent = '📦 课件资源';

        appState.downloadFiles = [];
        appState.downloadSelectedIds.clear();
        appState.downloadSearchKeyword = '';
        const searchInput = document.getElementById('xy-dl-search');
        if (searchInput) searchInput.value = '';
        renderDownloadList();

        if (!groupId) {
            if (statusEl) statusEl.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">⚠️ 未检测到课程 ID，请进入课程页面后重试</span>`;
            return;
        }

        const apiName = await getCourseNameFromAPI(groupId);
        appState.downloadCourseName = apiName || '课件资源';
        if (nameEl) nameEl.textContent = '📦 ' + appState.downloadCourseName;

        const files = await fetchDownloadResources(groupId);
        appState.downloadFiles = files;
        if (statusEl) {
            statusEl.innerHTML = files.length > 0
                ? `<span style="color:${T('#34d399','#065f46')};">✅ 已加载 ${files.length} 个课件文件</span>`
                : `<span style="color:${T('#94a3b8','#64748b')};">📭 当前课程无可下载的课件</span>`;
        }
        renderDownloadList();
    }

    function enterDownloadZone() {
        if (appState.activeZone !== 'download') appState.prevZone = appState.activeZone;
        const groupId = getCourseGroupId();
        switchToZone('download');
        loadDownloadPanel(groupId);
    }

    // 获取特定任务的真实资源 ID (给计划调度和跳课共用)
    async function getTaskResourceId(task) {
        if (task.resource_id) return task.resource_id;
        try {
            const resources = await loadCourseResources(task.group_id);
            if (resources) {
                const flatRes = extractFilesFromResources(resources);
                const rInfo = flatRes.find(r => r.node_id == task.node_id || r.id == task.node_id);
                if (rInfo) return (rInfo.id || rInfo.resource_id);
            }
        } catch(e) {}
        return task.id; // 最后退避使用自身 ID
    }

    // ==========================================
    // 🛠️ 弹窗、日志与UI交互
    // ==========================================
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

    function showToast(msg, type = 'info') {
        // 核心修复：如果网页 DOM 还没完全加载完毕，延迟 500ms 后再次尝试弹出，避免抛错卡死引擎
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
        toast.innerHTML = `<span style="margin-right:10px; font-size:18px;">${currentType.icon}</span><span style="flex:1; z-index:1; line-height: 1.4;">${msg}</span><div style="position:absolute; bottom:0; left:0; height:3px; background:${currentType.accent}; width:100%; transform-origin:left; animation: xy-toast-progress 3s linear forwards; opacity: 0.5;"></div>`;
        container.appendChild(toast);
        if(!document.getElementById('xy-toast-style')) { const style = document.createElement('style'); style.id = 'xy-toast-style'; style.innerHTML = `@keyframes xy-toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }`; document.head.appendChild(style); }
        requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0) scale(1)'; });
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-20px) scale(0.9)'; setTimeout(() => toast.remove(), 400); }, 3000);
    }

    function logMsg(msg, type = 'info', isSilent = false) {
        const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#38bdf8', silent: '#94a3b8' };
        const color = isSilent ? colors.silent : (colors[type] || colors.info);
        const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
        const logStr = `[${time}] ${msg}`;
        sessionLogs.push({ text: logStr, color: color });
        if (sessionLogs.length > 80) sessionLogs.shift();
        
        // 核心防御：跨域或无痕模式下直接访问 sessionStorage 极易抛出安全异常导致崩溃，用 try-catch 包裹
        try { sessionStorage.setItem('xy_session_logs', JSON.stringify(sessionLogs)); } catch (e) {}
        
        const logBox = document.getElementById('xy-activity-log');
        if (logBox) {
            const el = document.createElement('div'); el.style.color = color; el.style.marginBottom = '4px'; el.style.lineHeight = '1.5'; el.innerText = logStr; logBox.appendChild(el);
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
        // 如果被计划调度中心接管（manual 模式），强停原生重载
        if (appState.activeZone !== 'course' || appState.mode === 'manual') {
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

    async function tryJumpToNext() {
        if (isJumpingLock) return; 
        if (Date.now() < appState.jumpSleepUntil) return; 
        if (xyScheduleState.isRunning) return; // 🌟 核心拦截：如果超级计划调度在运行，禁止原生引擎私自跳课，完全交由计划器接管跳转！

        isJumpingLock = true;
        
        try {
            const currentGroupId = getCourseGroupId(); 
            const currentNodeId = getNodeId(); 
            
            logMsg('🔄 正在通过【全局雷达】匹配下一项自主观看任务...', 'info', false);
            
            _radarCache.time = 0; // 跳转时强制刷新
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
                    // 同课程内：按 node_id 升序排列，优先跳转到未访问的下一节点
                    courseTasks.sort((a, b) => (parseInt(a.node_id) || 0) - (parseInt(b.node_id) || 0));
                    // 优先选 node_id 大于当前节点的（往后跳），否则选最小的（从头开始）
                    targetTask = courseTasks.find(t => (parseInt(t.node_id) || 0) > (parseInt(currentNodeId) || 0)) || courseTasks[0];
                } else {
                    // 跨课程：按同课程数量降序（优先清完一门课），再按 node_id 升序
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

                appState.jumpFailCount = 0; 
                setTimeout(() => { 
                    window.location.href = `/app/jx-web/${pathPrefix}/${targetTask.group_id}/resource/${resId}/${targetTask.node_id}`; 
                }, 500);
                
                setTimeout(() => { isJumpingLock = false; }, 5000);
                return;
            }
            
            appState.jumpFailCount++;
            const failCount = appState.jumpFailCount;
            // 指数退避：5s → 10s → 20s → 40s → 80s → 10min
            const delays = [5000, 10000, 20000, 40000, 80000, 600000];
            const delay = delays[Math.min(failCount - 1, delays.length - 1)];

            if (failCount >= 6) {
                 logMsg('⏳ 连续6次探测无新任务，引擎进入休眠模式，10分钟后重载...', 'warning', false);
                 appState.jumpSleepUntil = Date.now() + 10 * 60 * 1000;
                 appState.jumpFailCount = 0;
                 updateCourseUI();
                 isJumpingLock = false;
            } else {
                 const waitSec = Math.round(delay / 1000);
                 logMsg(`⏳ 探测无新任务，${waitSec}秒后重试 (第${failCount}次，指数退避)...`, 'warning', false);
                 setTimeout(() => { isJumpingLock = false; }, delay);
            }

        } catch(e) {
            appState.jumpFailCount++;
            const failCount = appState.jumpFailCount;
            const delays = [10000, 30000, 60000, 300000, 600000];
            const delay = delays[Math.min(failCount - 1, delays.length - 1)];

            if (failCount >= 5) {
                 logMsg('⏳ 网络探测连续5次异常，进入深度休眠，10分钟后重新探测...', 'warning', false);
                 appState.jumpSleepUntil = Date.now() + 10 * 60 * 1000;
                 appState.jumpFailCount = 0;
                 updateCourseUI();
                 isJumpingLock = false;
            } else {
                 logMsg(`雷达连通异常，${Math.round(delay/1000)}秒后重试 (第${failCount}次)...`, 'error', false);
                 setTimeout(() => { isJumpingLock = false; }, delay);
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
            const data = await fetchRadarCached();
            if (data && data.success && data.data) {
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

    // ==========================================
    // 🖱️ 鼠标轨迹模拟引擎
    // ==========================================
    let mouseSimTimer = null;
    let simMouseX = Math.random() * window.innerWidth;
    let simMouseY = Math.random() * window.innerHeight;

    function cubicBezier(t, p0, p1, p2, p3) {
        const u = 1 - t;
        return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    }

    function simulateMouseMove() {
        if (!appState.mouseSimActive) return;

        const targetX = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
        const targetY = Math.random() * window.innerHeight * 0.7 + window.innerHeight * 0.1;
        const cp1x = simMouseX + (Math.random() - 0.5) * 400;
        const cp1y = simMouseY + (Math.random() - 0.5) * 300;
        const cp2x = targetX + (Math.random() - 0.5) * 400;
        const cp2y = targetY + (Math.random() - 0.5) * 300;

        const steps = 40 + Math.floor(Math.random() * 30);
        let step = 0;

        function animateStep() {
            if (!appState.mouseSimActive) return;
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

    function toggleMouseSim(active) {
        appState.mouseSimActive = active;
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

    function scheduleMouseSim() {
        if (!appState.mouseSimActive) return;
        const delay = 30000 + Math.random() * 60000;
        mouseSimTimer = setTimeout(() => {
            simulateMouseMove();
            scheduleMouseSim();
        }, delay);
    }

    // ==========================================
    // 🕵️ 反检测深度伪装 2.0 — 滚动/键盘/点击全维模拟
    // ==========================================
    let deepCamoTimers = { scroll: null, keyboard: null, click: null };

    function simulateNaturalScroll() {
        if (!appState.deepCamouflage || !appState.camoScrollActive) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) { scheduleDeepCamo('scroll'); return; }

        // 随机目标位置，模拟分段阅读
        const currentY = window.scrollY;
        const targetY = Math.max(0, Math.min(maxScroll, currentY + (Math.random() - 0.4) * window.innerHeight * 0.7));
        const distance = Math.abs(targetY - currentY);
        const duration = 800 + Math.random() * 2200; // 0.8-3秒完成
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
                // 模拟阅读停顿
                const pauseTime = 3000 + Math.random() * 15000;
                deepCamoTimers.scroll = setTimeout(() => scheduleDeepCamo('scroll'), pauseTime);
            }
        }
        requestAnimationFrame(scrollStep);
    }

    function simulateKeyboardActivity() {
        if (!appState.deepCamouflage || !appState.camoKeyboardActive) return;
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

    function simulateRandomClick() {
        if (!appState.deepCamouflage || !appState.camoClickActive) return;
        // 点击页面空白区域，避开所有交互元素
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

    function scheduleDeepCamo(type) {
        if (!appState.deepCamouflage) return;
        const ranges = { scroll: [15000, 60000], keyboard: [20000, 90000], click: [30000, 120000] };
        const [min, max] = ranges[type];
        const delay = min + Math.random() * (max - min);
        const fn = type === 'scroll' ? simulateNaturalScroll : type === 'keyboard' ? simulateKeyboardActivity : simulateRandomClick;
        deepCamoTimers[type] = setTimeout(fn, delay);
    }

    function startDeepCamouflage() {
        appState.deepCamouflage = true;
        appState.camoScrollActive = true;
        appState.camoKeyboardActive = true;
        appState.camoClickActive = true;
        GM_setValue('xy_deep_camo', true);
        ['scroll','keyboard','click'].forEach(t => scheduleDeepCamo(t));
        logMsg('🕵️ 深度伪装2.0 已启动：滚动+键盘+点击全维模拟', 'success', true);
    }

    function stopDeepCamouflage() {
        appState.deepCamouflage = false;
        appState.camoScrollActive = false;
        appState.camoKeyboardActive = false;
        appState.camoClickActive = false;
        GM_setValue('xy_deep_camo', false);
        Object.values(deepCamoTimers).forEach(t => clearTimeout(t));
        deepCamoTimers = { scroll: null, keyboard: null, click: null };
        logMsg('⏸️ 深度伪装2.0 已关闭', 'warning', true);
    }

    // 恢复上次的伪装状态
    if (appState.deepCamouflage) {
        setTimeout(() => {
            appState.camoScrollActive = true;
            appState.camoKeyboardActive = true;
            appState.camoClickActive = true;
            ['scroll','keyboard','click'].forEach(t => scheduleDeepCamo(t));
        }, 3000);
    }

    async function triggerDocBatchSniper() {
        appState.batchDocSubmitting = true; logMsg('🔄 启动【全局文档清理】，静默完成阅读...', 'warning', false);
        try {
            const token = await getAuthToken();
            const data = await fetchRadarCached();
            if (data && data.success && data.data) {
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
        } catch (e) { console.warn('[小雅] triggerDocBatchSniper 失败', e); } finally { appState.batchDocSubmitting = false; }
    }

    function checkAndClickDocPreview() {
        const nodeId = getNodeId();
        if (!nodeId || appState.docPreviewDoneNodeId === nodeId) return;
        appState.docPreviewDoneNodeId = nodeId; 
    }

    async function sendRecordRequest() {
        if (appState.activeZone !== 'course') return;
        if (isRecordSending) return;
        const groupId = getCourseGroupId(); const resourceId = getNodeId(); if (!groupId || !resourceId) return;

        isRecordSending = true;
        let token = null;
        try { token = await getAuthToken(); } catch (e) { console.warn('[小雅] sendRecord: 获取Token失败', e); isRecordSending = false; return; }

        const maxRetries = 3;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (attempt > 0) await sleep(Math.pow(3, attempt) * 1000);

                const uRes = await fetch(`https://${domain}/api/jx-auth/oauth2/info`, { headers: { "authorization": `Bearer ${token}` }});
                if (!uRes.ok) { console.warn(`[小雅] sendRecord: oauth2/info HTTP ${uRes.status}`); continue; }
                const uData = await uRes.json(); const userId = uData?.data?.info?.id; if (!userId) { console.warn('[小雅] sendRecord: 无法获取userId'); continue; }

                const msgObj = { user_id: userId, group_id: groupId, clientType: 1, roleType: 1, resourceId: resourceId };
                const message = JSON.stringify(msgObj); const timestamp = Date.now().toString(); const nonce = generateUUID();
                const arr = [encodeURIComponent(message), timestamp, nonce, "--xy-create-signature--"].sort().join("");
                const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(arr));
                const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

                const response = await fetch(`https://${domain}/api/jx-iresource/learnLength/learnRecord`, { method: 'POST', headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ message, signature, timestamp, nonce }) });
                const result = await response.json();
                if (result.code === 0 || result.success) {
                    appState.recordCount++; appState.lastRecordDate = new Date();
                    appState.totalTime += 30;
                    sessionStorage.setItem('xy_recordCount', appState.recordCount); sessionStorage.setItem('xy_totalTime', appState.totalTime); updateCourseUI();
                    recordFailCount = 0;
                    keepaliveLastBeatTime = Date.now(); // 仅在真实成功后更新时间戳
                    isRecordSending = false;
                    return;
                }
                console.warn(`[小雅] sendRecord: 服务端返回非成功 code=${result.code} msg=${result.message}`);
            } catch (e) {
                console.warn(`[小雅] sendRecord: 第${attempt + 1}次失败`, e.message || e);
            }
        }
        recordFailCount++;
        if (recordFailCount >= 10) {
            logMsg('⚠️ 学习记录连续失败10次，请检查网络或Token是否过期', 'error', false);
            recordFailCount = 0;
        }
        isRecordSending = false;
    }

    // 🕐 持久化定时器：防止浏览器后台节流导致定时器停摆
    const _persistentIntervals = [];
    function createPersistentInterval(fn, ms, maxCatchUp = 20) {
        let lastTick = Date.now();
        let timerId = null;
        let running = true;

        function tick() {
            if (!running) return;
            const now = Date.now();
            const elapsed = now - lastTick;
            if (elapsed >= ms) {
                const missed = Math.min(Math.floor(elapsed / ms), maxCatchUp);
                for (let i = 0; i < missed; i++) {
                    try { fn(); } catch(e) {}
                }
                lastTick = now;
            }
        }

        timerId = setInterval(tick, Math.max(ms / 4, 250));
        _persistentIntervals.push({ fn, ms, maxCatchUp, lastTick: () => lastTick, tick, clear: () => { running = false; clearInterval(timerId); } });

        return {
            clear: () => { running = false; clearInterval(timerId); },
            resetTimer: () => { lastTick = Date.now(); }
        };
    }

    // 监听窗口切回前台，立即补偿所有持久化定时器
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            _persistentIntervals.forEach(p => {
                const elapsed = Date.now() - p.lastTick();
                if (elapsed >= p.ms * 1.2) {
                    const missed = Math.min(Math.floor(elapsed / p.ms), p.maxCatchUp);
                    for (let i = 0; i < missed; i++) {
                        try { p.fn(); } catch(e) {}
                    }
                }
            });
        }
    });

    function toggleRecord(start) {
        if (appState.recordActive === start) return;
        appState.recordActive = start;
        if (start) {
            sendRecordRequest();
            recordIntervalTimer = createPersistentInterval(sendRecordRequest, 30000, 20);
            realTimeTimer = createPersistentInterval(() => { appState.realTime++; sessionStorage.setItem('xy_realTime', appState.realTime); updateCourseUI(); }, 1000, 30);
            if (!appState.guardActive) { appState.guardActive = true; GM_setValue('xy_guard_active', true); }
        } else {
            if (recordIntervalTimer) { recordIntervalTimer.clear(); recordIntervalTimer = null; }
            if (realTimeTimer) { realTimeTimer.clear(); realTimeTimer = null; }
        }
        updateCourseUI();
    }

    function ensureAutoRecord() {
        if (appState.activeZone !== 'course') return;
        const nodeId = getNodeId();
        if (nodeId && !appState.recordActive) toggleRecord(true); else if (!nodeId && appState.recordActive) toggleRecord(false);
    }

    // ==========================================
    // 💓 后台保活引擎：防止浏览器节流导致心跳中断
    // ==========================================
    let keepaliveWatchdogTimer = null;
    let keepaliveLastBeatTime = 0;

    function startKeepaliveWatchdog() {
        if (keepaliveWatchdogTimer) return;
        keepaliveLastBeatTime = Date.now();
        keepaliveWatchdogTimer = setInterval(() => {
            if (!appState.keepaliveEnabled || appState.activeZone !== 'course') return;
            // 看门狗：距离上次心跳超过 75s（2.5 个周期），强制补发
            const gap = Date.now() - keepaliveLastBeatTime;
            if (gap > 75000) {
                logMsg('💓 [保活] 检测到心跳缺口 ' + Math.round(gap / 1000) + 's，强制补发', 'warning', true);
                sendRecordRequest().then(() => { keepaliveLastBeatTime = Date.now(); });
            }
            // 如果心跳定时器丢失（被GC/节流回收），重新拉起
            if (!recordIntervalTimer && appState.recordActive) {
                logMsg('💓 [保活] 心跳定时器丢失，自动重建', 'warning', true);
                recordIntervalTimer = setInterval(sendRecordRequest, 30000);
            }
        }, 10000);
        logMsg('💓 后台保活看门狗已启动（10s巡检）', 'silent', true);
    }

    function stopKeepaliveWatchdog() {
        if (keepaliveWatchdogTimer) { clearInterval(keepaliveWatchdogTimer); keepaliveWatchdogTimer = null; }
    }

    // ==========================================
    // ⏱️ 手动时长注入引擎
    // ==========================================
    async function injectDuration(minutes) {
        if (!Number.isFinite(minutes) || minutes <= 0) {
            logMsg('⏱️ 时长必须为正数（分钟）', 'error', false);
            return;
        }
        if (appState.injectActive) {
            logMsg('⏱️ 当前有注入任务正在执行，请等待完成或先点停止', 'warning', false);
            return;
        }
        const groupId = getCourseGroupId();
        const resourceId = getNodeId();
        if (!groupId || !resourceId) {
            logMsg('⏱️ 未识别课程/资源ID，请进入课程页面后再注入', 'error', false);
            return;
        }
        const totalPackets = Math.ceil((minutes * 60) / 30);
        appState.injectActive = true;
        appState.injectTotal = totalPackets;
        appState.injectCompleted = 0;

        logMsg(`⏱️ 开始注入 ${minutes} 分钟时长（共 ${totalPackets} 包）`, 'success', false);
        updateInjectUI();

        const startTime = Date.now();
        for (let i = 0; i < totalPackets; i++) {
            if (!appState.injectActive) {
                logMsg('⏱️ 注入已中断（已发 ' + appState.injectCompleted + '/' + totalPackets + ' 包）', 'warning', false);
                break;
            }
            let ok = false;
            for (let retry = 0; retry < 3; retry++) {
                if (retry > 0) await sleep(Math.pow(2, retry) * 1000);
                try {
                    // 直接复用小雅核心心跳函数
                    await _origSendRecordRequest();
                    ok = true; break;
                } catch(e) {}
            }
            if (ok) {
                appState.injectCompleted++;
                // recordCount/totalTime/sessionStorage 已由 sendRecordRequest 内部自动累加
            }
            if ((i + 1) % 10 === 0 || i === totalPackets - 1) {
                updateInjectUI();
                updateCourseUI();
            }
            if (i < totalPackets - 1 && appState.injectActive) {
                await sleep(1500); // 每包间隔 1.5s，防止服务端限流
            }
        }
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        logMsg(`⏱️ 注入完成：${appState.injectCompleted}/${totalPackets} 成功，耗时 ${elapsed}s`, 'success', false);
        appState.injectActive = false;
        updateInjectUI();
        updateCourseUI();
    }

    function stopInject() {
        if (!appState.injectActive) return;
        appState.injectActive = false;
        logMsg('⏱️ 已发送停止信号...', 'warning', false);
    }

    function updateInjectUI() {
        const progDiv = document.getElementById('xy-inject-progress');
        const progText = document.getElementById('xy-inject-progress-text');
        const progBar = document.getElementById('xy-inject-progress-bar');
        if (!progDiv || !progText || !progBar) return;
        if (appState.injectActive) {
            progDiv.style.display = 'block';
            const pct = appState.injectTotal > 0 ? Math.round(appState.injectCompleted / appState.injectTotal * 100) : 0;
            progText.textContent = `进度：${appState.injectCompleted}/${appState.injectTotal} (${pct}%)`;
            progBar.style.width = pct + '%';
        } else {
            progDiv.style.display = 'none';
        }
    }

    // ==========================================
    // ⚙️ 双频驱动引擎：UI渲染(1秒) + 暴力操作(5秒)
    // ==========================================

    let watchdogLastActiveTime = Date.now();
    let lastAutoActionMinute = '';

    // 频段1：1秒级状态维持（脚本进度隔离、文档计时、弹窗点击）- 持久化防后台节流
    createPersistentInterval(async () => {
        await runLowLevelScanner(); 

        checkDynamicRefresh();

        if (appState.activeZone !== 'course') {
            watchdogLastActiveTime = Date.now(); 
            return;
        }
        if (appState.guardActive) forceDismissPopups(document);

        appState.currentEngine = await getTaskTypeAccurate();

        // 放宽计划调度时的死锁判定（无限挂机需要较长时间不动作）
        const timeoutLimit = xyScheduleState.isRunning ? 1800000 : 180000; // 计划模式下30分钟死锁强刷
        if (Date.now() - watchdogLastActiveTime > timeoutLimit) {
            sessionStorage.setItem('xy_reload_reason', '防死锁刷新');
            logMsg(`💀 发生死锁！执行强刷...`, 'error', false);
            setTimeout(() => window.location.reload(), 1000);
            return;
        }

        if (appState.mode === 'sequence' && Date.now() < appState.jumpSleepUntil) {
            updateCourseUI();
            watchdogLastActiveTime = Date.now(); 
            return; 
        }

        const groupId = getCourseGroupId();
        if (groupId && appState.mode !== 'manual') {
            const taskType = appState.currentEngine; 

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
            watchdogLastActiveTime = Date.now(); // 保证计划模式下能持续喂狗
        }

        // 定时自动启动/停止
        const nowHM = new Date().toLocaleTimeString('zh-CN', { hour12: false }).substring(0, 5);
        if (nowHM !== lastAutoActionMinute) {
            if (!xyScheduleState.isRunning && xyScheduleState.autoStart && nowHM === xyScheduleState.autoStart && xyScheduleState.queue.length > 0) {
                lastAutoActionMinute = nowHM;
                const startBtn = document.getElementById('xy-sch-start-btn');
                if (startBtn && !startBtn.disabled) startBtn.click();
                logMsg(`⏰ 定时启动：${nowHM} 已触发计划调度！`, 'success');
            }
            if (xyScheduleState.isRunning && xyScheduleState.autoStop && nowHM === xyScheduleState.autoStop) {
                lastAutoActionMinute = nowHM;
                const stopBtn = document.getElementById('xy-sch-stop-btn');
                if (stopBtn && !stopBtn.disabled) stopBtn.click();
                logMsg(`⏰ 定时停止：${nowHM} 已触发停止并交还主控！`, 'warning');
            }
        }

        updateTitleBar();
        if (appState.theme === 'auto') applyTheme();
    }, 1000, 30);

    // 频段2：5秒级跳课与连播模式的专属提交调度 - 持久化防后台节流
    createPersistentInterval(async () => {
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
    }, 5000, 10);

    // 频段3：讨论区DOM智能扫描探测 (3秒一次，不影响主轴) - 持久化防后台节流
    createPersistentInterval(() => {
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
    }, 3000, 10);

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
                const item = uniqueTargets[i]; const payload = { discussion_id: appState.discussionId, group_id: appState.discGroupId, point_id: item.id, like: 1 };
                try {
                    const likeRes = await fetch(`https://${domain}/api/jx-iresource/discussion/like`, { method: "POST", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify(payload) });
                    const likeData = await likeRes.json(); if (likeData.success || likeData.code === 200 || likeData.code === 0) { successCount++; }
                } catch(e) { console.warn('[小雅] 讨论点赞失败', e); } await sleep(Math.floor(Math.random() * 700) + 800); 
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
                } catch(e) { console.warn('[小雅] 讨论回复失败', e); } 
                await sleep(Math.floor(Math.random() * 1200) + 1800); 
            }
            logMsg(`🎉 回复任务结束！成功回复 ${successCount} 次！即将刷新页面...`, 'success'); 
            setTimeout(() => { window.location.reload(); }, 2000);
        } catch (e) { logMsg('回复异常', 'error'); } finally { if (btn) { btn.disabled = false; btn.innerText = originalText; } }
    }

    // ==========================================
    // ☁️ 小雅辅助工具云端情报站 (系统公告) 
    // ==========================================
    function fetchCloudIntelligence() {
        const contentBox = document.getElementById('xy-bc-content');
        if (!contentBox) return;
        
        const timestamp = Date.now();
        const url = `https://gitee.com/fieldlu/xy-script-assets/raw/main/notice_new.json?t=${timestamp}`;

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
                                    <div style="padding: 16px 20px;">
                                        <div style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; margin-bottom:12px; font-size: 14px;">${realData.title || '系统公告'}</div>
                                        <ul style="margin:0; padding-left:18px; color:${T('#cbd5e1','#475569')}; line-height: 1.6;">
                                            ${(realData.items || []).map(item => `<li style="margin-bottom:8px;">${item}</li>`).join('')}
                                        </ul>
                                    </div>
                                `;
                            } catch (err) { contentBox.innerHTML = `<div style="padding: 16px 20px; color:#ef4444;">获取云端情报失败 (数据格式异常)。</div>`; }
                        } else { contentBox.innerHTML = `<div style="padding: 16px 20px; color:#ef4444;">获取云端情报失败 (状态码: ${response.status})。</div>`; }
                    },
                    onerror: function(err) { contentBox.innerHTML = `<div style="padding: 16px 20px; color:#ef4444;">获取云端情报网络异常，请检查网络连接。</div>`; },
                    ontimeout: function() { contentBox.innerHTML = `<div style="padding: 16px 20px; color:#ef4444;">获取云端情报超时，服务器可能正忙。</div>`; }
                });
            } else {
                fetch(url, { cache: 'no-store' }).then(res => res.json()).then(realData => {
                     contentBox.innerHTML = `
                        <div style="padding: 16px 20px;">
                            <div style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; margin-bottom:12px; font-size: 14px;">${realData.title || '系统公告'}</div>
                            <ul style="margin:0; padding-left:18px; color:${T('#cbd5e1','#475569')}; line-height: 1.6;">
                                ${(realData.items || []).map(item => `<li style="margin-bottom:8px;">${item}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }).catch(e => { contentBox.innerHTML = `<div style="padding: 16px 20px; color:#ef4444;">获取云端情报失败，且当前环境不支持跨域请求。</div>`; });
            }
        } catch (e) {
            contentBox.innerHTML = `<div style="padding: 16px 20px; color:#ef4444;">获取云端情报时发生了不可预知的错误。</div>`;
        }
    }

    // ==========================================
    // 🎨 核心UI 界面渲染与控制
    // ==========================================
    function formatTime(s) { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60).toString().padStart(2,'0'), sec = (s%60).toString().padStart(2,'0'); return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`; }

    function updateCourseUI() {
        if (appState.activeZone !== 'course') return;
        const statusBanner = document.getElementById('xy-status-banner');
        if (statusBanner) {
            if (xyScheduleState.isRunning) {
                statusBanner.innerHTML = `<span style="color:${T('#fcd34d','#92400e')};">📅 计划调度中 (外挂托管)</span>`;
                statusBanner.style.background = T('rgba(245,158,11,0.12)','#fffbeb');
                statusBanner.style.borderColor = T('rgba(245,158,11,0.25)','#fde68a');
            }
            else if (appState.mode === 'manual') {
                statusBanner.innerHTML = `<span style="color:${T('#94a3b8','#64748b')};">⏸️ 挂机休眠中</span>`;
                statusBanner.style.background = T('rgba(71,85,105,0.15)','#f8fafc');
                statusBanner.style.borderColor = T('rgba(71,85,105,0.2)','#e2e8f0');
            }
            else if (!getCourseGroupId()) {
                if (appState.mode === 'sequence' && Date.now() < appState.jumpSleepUntil) {
                    let leftMin = Math.ceil((appState.jumpSleepUntil - Date.now()) / 60000);
                    statusBanner.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">💤 寻路深度休眠 (约 ${leftMin} 分钟后重载探测)</span>`;
                    statusBanner.style.background = T('rgba(251,191,36,0.1)','#fffbeb');
                    statusBanner.style.borderColor = T('rgba(251,191,36,0.2)','#fde68a');
                } else {
                    statusBanner.innerHTML = `<span style="color:${T('#a5b4fc','#3730a3')};">🌐 雷达系统扫描中...</span>`;
                    statusBanner.style.background = T('rgba(99,102,241,0.1)','#eef2ff');
                    statusBanner.style.borderColor = T('rgba(99,102,241,0.2)','#c7d2fe');
                }
            }
            else if (appState.isTaskCompleted) {
                statusBanner.innerHTML = appState.mode === 'loop'
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
        ['man', 'loop', 'seq'].forEach(m => { const btn = document.getElementById(`btn-mode-${m}`); if(btn) btn.className = `xy-mode-btn ${appState.mode === (m==='man'?'manual':m==='loop'?'loop':'sequence') ? 'active' : ''}`; });
        
        const cRealTime = document.getElementById('xy-real-time');
        if (cRealTime) cRealTime.innerText = formatTime(appState.realTime);
        
        const btnGuard = document.getElementById('xy-btn-guard');
        if(btnGuard) {
            btnGuard.textContent = appState.guardActive ? 'ON' : 'OFF';
            btnGuard.style.background = appState.guardActive ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0');
            btnGuard.style.color = appState.guardActive ? T('#34d399','#065f46') : T('#94a3b8','#64748b');
        }

        const btnKeepalive = document.getElementById('xy-btn-keepalive');
        if(btnKeepalive) {
            btnKeepalive.textContent = appState.keepaliveEnabled ? 'ON' : 'OFF';
            btnKeepalive.style.background = appState.keepaliveEnabled ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0');
            btnKeepalive.style.color = appState.keepaliveEnabled ? T('#34d399','#065f46') : T('#94a3b8','#64748b');
        }
    }

    function openReplySettingsModal() {
        if (!document.body) return;
        const phrases = (appState.customReplies && appState.customReplies.length > 0)
            ? appState.customReplies.join('\n')
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
                        <span style="font-size:11px; color:${T('#64748b','#94a3b8')};" id="xy-reply-count">${appState.customReplies.length} 条</span>
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
            appState.customReplies = lines;
            GM_setValue('xy_custom_replies', JSON.stringify(lines));
            closeModal();
            showToast(`语料库已保存 (${lines.length} 条)`, 'success');
        };
    }

    function updateDiscUI() {
        if (appState.activeZone !== 'disc') return;
        const statusEl = document.getElementById('xy-disc-status');
        if (statusEl) {
            if (appState.discussionId) { statusEl.innerHTML = `<span style="color:${T('#34d399','#065f46')};">✅ 已锁定讨论区：${appState.discussionId.substring(0,8)}...</span>`; statusEl.style.background = T('rgba(52,211,153,0.1)','#ecfdf5'); statusEl.style.borderColor = T('rgba(52,211,153,0.2)','#a7f3d0'); document.querySelectorAll('.xy-action-btn.disc-btn').forEach(b => b.style.opacity = '1'); }
            else { statusEl.innerHTML = `<span style="color:${T('#fbbf24','#92400e')};">⚠️ 请在讨论区内刷新页面 (或随意点击评论) 触发网络包获取ID</span>`; statusEl.style.background = T('rgba(251,191,36,0.1)','#fffbeb'); statusEl.style.borderColor = T('rgba(251,191,36,0.2)','#fde68a'); }
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
            listDiv.innerHTML = `<div style="color:${T('#94a3b8','#64748b')}; font-size:13px; text-align:center; padding:24px 0; grid-column: 1 / -1; letter-spacing: 0.5px;">✨ 正在等待或自动全量扫描中...</div>`;
            updateCheckedCount();
            return; 
        }
        
        const terms = filterText.split(/[\s,，;；]+/).map(t => t.trim()).filter(t => t);
        let displayNames = appState.targetNames;
        
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
            const isChecked = appState.selectedNames.has(name);
            html += `
                <label class="xy-target-item" title="${safeName}" style="background: ${T('rgba(30,41,59,0.35)','#ffffff')}; box-shadow: ${T('0 2px 4px rgba(0,0,0,0.1)','none')}; padding: 10px 12px; border-radius: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: 1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; transition: all 0.2s;">
                    <input type="checkbox" class="xy-target-checkbox" value="${safeName}" ${isChecked ? 'checked' : ''} style="accent-color: #818cf8; flex-shrink: 0; width: 16px; height: 16px; cursor: pointer;">
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size: 14px; color: ${T('#e2e8f0','#0f172a')}; user-select: none;">${displayNameHtml}</span>
                </label>
            `; 
        });
        html += `</div>`;
        listDiv.innerHTML = html; 
        updateCheckedCount();
    }

    // ==========================================
    // 🌟 全局任务大屏 (雷达) 附带全量已完成提取逻辑
    // ==========================================
    async function fetchGlobalTasks() {
        let allTasks = [];
        try { 
            const token = await getAuthToken(); 
            
            // 1. 获取全网未完成任务（主雷达）
            const res1 = await fetch(`https://${domain}/api/jx-stat/group/task/un_finish`, { method: "GET", headers: { "authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" } }); 
            const data1 = await res1.json(); 
            let unfinishedTasks = [];
            if (data1.success && data1.data) {
                unfinishedTasks = data1.data;
                allTasks = JSON.parse(JSON.stringify(unfinishedTasks));
            }

            // 2. 缓存全局课程ID字典，实现在待命区也能调出全部课程的已完成任务
            let courseMap = {};
            try { courseMap = JSON.parse(GM_getValue('xy_course_map', '{}')); } catch(e) {}

            unfinishedTasks.forEach(t => {
                if (t.group_id && t.group_name) courseMap[t.group_id] = t.group_name;
            });

            // 记录当前进入的课程：优先用 API 获取正确课程名
            const currentGroupId = getCourseGroupId();
            if (currentGroupId && !courseMap[currentGroupId]) {
                const apiName = await getCourseNameFromAPI(currentGroupId);
                if (apiName) courseMap[currentGroupId] = apiName;
            }
            // 批量刷新未在未完成列表中的缓存课程名（修复旧 DOM 抓取的错名）
            const unfinishedGroupIds = new Set(unfinishedTasks.map(t => t.group_id).filter(Boolean));
            const staleIds = Object.keys(courseMap).filter(gId => !unfinishedGroupIds.has(gId));
            if (staleIds.length > 0) {
                await Promise.all(staleIds.map(async (gId) => {
                    const apiName = await getCourseNameFromAPI(gId);
                    if (apiName) courseMap[gId] = apiName;
                }));
            }
            GM_setValue('xy_course_map', JSON.stringify(courseMap));

            // 3. 并发拉取已知所有课程的【全量资源目录】
            const groupIds = Object.keys(courseMap);
            if (groupIds.length > 0) {
                const fetchPromises = groupIds.map(async (gId) => {
                    try {
                        const r = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${gId}`, { headers: { "authorization": `Bearer ${token}` } });
                        const d = await r.json();
                        return { gId, gName: courseMap[gId], data: d };
                    } catch (e) { return null; }
                });

                const results = await Promise.all(fetchPromises);
                
                results.forEach(res => {
                    if (res && res.data && res.data.success && res.data.data) {
                        const flatRes = extractFilesFromResources(res.data.data);
                        flatRes.forEach(r => {
                            // 在【全量资源】中找，如果在【未完成雷达】中不存在，说明它必定是【已完成】的！
                            const existItem = allTasks.find(t => t.node_id == (r.node_id || r.id) && t.group_id == res.gId);
                            if (!existItem) {
                                allTasks.push({
                                    task_id: r.task_id || r.id,
                                    id: r.task_id || r.id,
                                    node_id: r.node_id || r.id,
                                    group_id: res.gId,
                                    resource_id: r.resource_id || r.id,
                                    name: r.name || r.title || '未知任务', // 恢复原名称，不再拼接
                                    task_type: r.computed_task_type || 1, // 精确填入计算出的类型
                                    finish: 2, // 强行贴上已完成标签
                                    start_time: r.start_time || new Date().toISOString(),
                                    end_time: r.end_time || "2099-12-31T00:00:00.000Z",
                                    group_name: res.gName || "未知课程" // 只要能识别课程名称，就放回对应的原课程组中
                                });
                            } else {
                                // 校准现存任务的组名
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

    function renderGlobalDashboardContent(tasks) {
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
                    <input type="checkbox" id="xy-freedom-switch" style="opacity:0; width:0; height:0;" ${appState.isFreedomMode ? 'checked' : ''}>
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${appState.isFreedomMode?'#f59e0b':'#475569'}; border-radius:34px; transition:.4s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <span style="position:absolute; height:22px; width:22px; left:4px; bottom:4px; background:#e2e8f0; border-radius:50%; transition:.4s; transform:${appState.isFreedomMode?'translateX(26px)':'translateX(0)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
                    </span>
                </label>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 8px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: 700; color: ${T('#cbd5e1','#334155')}; font-size: 16px; user-select: none; transition: 0.2s;" onmouseover="this.style.color='${T('#e2e8f0','#0f172a')}'" onmouseout="this.style.color='${T('#cbd5e1','#334155')}'">
                <input type="checkbox" id="xy-select-all" style="width: 20px; height: 20px; accent-color: #818cf8; cursor: pointer;"> ✅ 全选可提交任务
            </label>
        </div>
        <div id="xy-global-task-container" style="display:flex; flex-direction:column; gap:24px;">
        `;

        const groupedTasks = tasks.reduce((acc, t) => { if(!acc[t.group_name]) acc[t.group_name] = []; acc[t.group_name].push(t); return acc; }, {});
        window.xyGlobalTaskMap = new Map();

        Object.entries(groupedTasks).forEach(([courseName, courseTasks], groupIdx) => {
            // 让未完成的任务优先排在上面，已完成的排在底下
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
            courseTasks.forEach(task => {
                window.xyGlobalTaskMap.set(task.task_id || task.id, task);
                const now = new Date();
                const endTime = new Date(task.end_time);
                const startTime = new Date(task.start_time);
                
                const isCompleted = task.finish === 2;
                const isAutoable = task.task_type === 1;
                const enableCheck = (!isCompleted) && (isAutoable || appState.isFreedomMode);

                let statusTag = ''; let statusColorBg = ''; let statusColorText = '';
                if (isCompleted) { statusTag = '✓ 已完成'; statusColorBg = 'rgba(52,211,153,0.12)'; statusColorText = '#34d399'; }
                else if (endTime < now) { statusTag = '⚠️ 已截止'; statusColorBg = 'rgba(248,113,113,0.12)'; statusColorText = '#f87171'; }
                else if (task.start_time && startTime > now) { statusTag = '🔒 未开始'; statusColorBg = 'rgba(71,85,105,0.15)'; statusColorText = '#94a3b8'; }
                else { statusTag = '⏳ 进行中'; statusColorBg = 'rgba(99,102,241,0.12)'; statusColorText = '#a5b4fc'; }

                const currentNodeId = getNodeId();
                const isCurrentNode = currentNodeId && task.node_id == currentNodeId;
                const borderStyle = isCurrentNode ? 'border: 2px solid #818cf8; box-shadow: 0 0 15px rgba(129,140,248,0.15);' : (enableCheck ? `border: 1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')};` : 'border: 1px solid transparent;');
                const currentMark = isCurrentNode ? `<span style="background:#6366f1; color:white; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:bold; margin-left:10px; box-shadow: 0 2px 4px rgba(99,102,241,0.3);">📍 当前位置</span>` : '';
                const typeStr = {1:'👁️ 自主观看', 2:'✍️ 作业', 3:'📚 课堂练习', 4:'💯 测验', 5:'📋 问卷', 6:'💭 讨论'}[task.task_type] || '📌 未知';

                html += `
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
            });
            html += `</div></div>`;
        });
        html += `</div>`; contentBox.innerHTML = html;

        // 全局大屏折叠事件绑定
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
    // 🧠 智能排课优化器 — DDL紧迫度+类型交错+课程分组
    // ==========================================
    function optimizeScheduleOrder(tasks) {
        if (!tasks || tasks.length === 0) return [];
        const now = Date.now();
        const scored = tasks.map(task => {
            const endTime = new Date(task.end_time).getTime();
            const daysLeft = Math.max(0, (endTime - now) / (1000 * 60 * 60 * 24));
            const name = (task.name || '').toLowerCase();
            const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
            const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);

            // DDL 分数：越紧迫越高（0-100）
            const ddlScore = daysLeft < 1 ? 100 : daysLeft < 3 ? 80 : daysLeft < 7 ? 60 : daysLeft < 14 ? 40 : daysLeft < 30 ? 20 : 5;
            // 已完成的任务优先级降低
            const completionPenalty = task.finish === 2 ? 0.3 : 1.0;
            // 类型权重（保持混合多样性）
            const typeWeight = isVideo ? 0.5 : isDoc ? 0.5 : 0.3;

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

        // 排序：综合考虑DDL紧迫度和类型交错
        const sorted = [];
        const remaining = [...scored];
        let lastWasVideo = null;

        while (remaining.length > 0) {
            // 为每个候选项计算综合分数
            remaining.forEach(item => {
                let typeBonus = 0;
                if (lastWasVideo === true && item.isDoc) typeBonus = 25; // 视频后优先文档
                if (lastWasVideo === false && item.isVideo) typeBonus = 25; // 文档后优先视频
                if (lastWasVideo === null) typeBonus = 10; // 首个任务微奖励

                // 避免连续同课程（如果队列中有其他课程）
                const hasOtherCourse = remaining.some(r => r.groupId !== item.groupId);
                const courseSwitchBonus = (hasOtherCourse && sorted.length > 0 && item.groupId !== sorted[sorted.length-1].groupId) ? 15 : 0;

                item.score = item.ddlScore + typeBonus + courseSwitchBonus;
            });

            // 选最高分
            remaining.sort((a, b) => b.score - a.score);
            const best = remaining.shift();
            sorted.push(best);
            lastWasVideo = best.isVideo;
        }

        return sorted.map(s => s.task);
    }

    async function smartOptimizeAndImport() {
        const tasks = await fetchGlobalTasks();
        const watchTasks = tasks.filter(t => {
            const name = (t.name || '').toLowerCase();
            const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
            const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
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
                strategy: task.finish === 2 ? 'duration' : 'until_done',
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

    // ==========================================
    // ==========================================
    // ⚡ 一键极速秒交 — 仅提交当前页面任务，秒级响应
    // ==========================================
    let quickKillRunning = false;

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
                appState.isTaskCompleted = true;
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

    // ==========================================
    // 📅 新增核心组件：极简外挂计划调度中心
    // ==========================================
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

                let minStr = item.strategy === 'infinite' ? '∞' : (item.strategy === 'until_done' ? '达标' : item.duration);
                let unit = (item.strategy === 'until_done' || item.strategy === 'infinite') ? '' : '分';
                let elapMin = Math.floor((item.elapsedSec || 0) / 60);
                
                let contentHtml = `
                    <div style="display:flex; align-items:center; gap:8px;">
                        <select class="xy-sch-strategy" data-uuid="${item.uuid}" style="padding:4px 8px; border-radius:6px; border:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; font-size:13px; outline:none; background:${T('rgba(15,23,42,0.5)','#ffffff')}; color:${T('#e2e8f0','#0f172a')};" ${isActive||isCompleted ? 'disabled' : ''}>
                            <option value="until_done" ${item.strategy==='until_done'?'selected':''}>🎯 达标即跳(连播)</option>
                            <option value="duration" ${item.strategy==='duration'?'selected':''}>🕒 刷固定时长</option>
                            <option value="infinite" ${item.strategy==='infinite'?'selected':''}>♾️ 无限挂机</option>
                        </select>
                        <input type="number" class="xy-sch-min-input" data-uuid="${item.uuid}" value="${item.duration || 30}" style="width:50px; padding:4px; text-align:center; border:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; border-radius:6px; font-size:13px; background:${T('rgba(15,23,42,0.5)','#ffffff')}; color:${T('#e2e8f0','#0f172a')}; display:${item.strategy==='duration'?'block':'none'};" ${isActive||isCompleted ? 'disabled' : ''}>
                        <span class="xy-sch-min-unit" data-uuid="${item.uuid}" style="font-size:13px; color:${T('#94a3b8','#64748b')}; display:${item.strategy==='duration'?'block':'none'};">分</span>
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
                        renderQueueList(); // 重新渲染以控制时间输入框的显隐
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

            // —— 拖拽排序 ——
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

                    // 如果拖到目标下方，插入位置 +1
                    const rect = row.getBoundingClientRect();
                    if (e.clientY > rect.top + rect.height / 2) dstIdx++;
                    // 如果源在目标前面，移除源后目标索引需要 -1
                    if (srcIdx < dstIdx) dstIdx--;

                    const [moved] = xyScheduleState.queue.splice(srcIdx, 1);
                    xyScheduleState.queue.splice(dstIdx, 0, moved);

                    // 如果正在执行中且移动了当前项前后的任务，同步修正 currentIdx
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
                    let minStr = currentTask.strategy === 'infinite' ? '∞' : (currentTask.strategy === 'until_done' ? '达标' : currentTask.duration);
                    let unit = (currentTask.strategy === 'until_done' || currentTask.strategy === 'infinite') ? '' : '分';
                    let elapMin = Math.floor((currentTask.elapsedSec || 0) / 60);
                    infoSpan.innerHTML = `<span style="color:${T('#a5b4fc','#3730a3')};">▶️ 执行中</span> <span style="font-weight:normal; opacity:0.8;">(驻留: ${elapMin}/${minStr}${unit})</span>`;
                }
            }
        };

        const renderLibraryList = (tasks) => {
            const container = document.getElementById('xy-sch-lib-list');
            if (!container) return;
            if (!tasks || tasks.length === 0) { container.innerHTML = `<div style="text-align:center; padding:40px; color:${T('#94a3b8','#64748b')};">暂无可用任务</div>`; return; }

            if (!window.xyGlobalTaskMap) window.xyGlobalTaskMap = new Map();

            const groupedTasks = tasks.reduce((acc, t) => { if(!acc[t.group_name]) acc[t.group_name] = []; acc[t.group_name].push(t); return acc; }, {});
            let html = '';
            let hasAnyValidTask = false;
            
            Object.entries(groupedTasks).forEach(([courseName, courseTasks], groupIdx) => {
                // 核心过滤：在计划调度中心的任务提取池中，只保留视频和文档
                let validTasks = courseTasks.filter(task => {
                    const name = (task.name || '').toLowerCase();
                    const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
                    const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
                    return isVideo || isDoc;
                });

                if (validTasks.length === 0) return; // 如果过滤后该课程为空，直接跳过不显示该课程栏
                hasAnyValidTask = true;

                validTasks.sort((a,b) => {
                    if (a.finish !== b.finish) return a.finish - b.finish; 
                    return new Date(a.end_time) - new Date(b.end_time);
                });

                // 引入丝滑折叠标题栏
                html += `
                    <div class="xy-sch-group-header" data-idx="${groupIdx}" style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; padding:12px 16px; background:${T('rgba(30,41,59,0.5)','#f8fafc')}; border-radius:10px; margin: 16px 0 8px 0; font-size:14px; position:sticky; top:0; z-index:2; cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none; border:1px solid ${T('rgba(71,85,105,0.15)','#e2e8f0')}; transition:background 0.2s;">
                        <span>📚 ${courseName || '未知课程'} <span style="font-size:12px; color:${T('#94a3b8','#64748b')}; font-weight:normal; margin-left:6px;">(${validTasks.length}个节点)</span></span>
                        <span class="xy-sch-group-arrow" style="transition: transform 0.2s; font-size:12px; color:${T('#64748b','#94a3b8')};">▼</span>
                    </div>
                    <div class="xy-sch-group-content" id="xy-sch-group-${groupIdx}" style="display:flex; flex-direction:column; gap:8px;">
                `;

                validTasks.forEach(task => {
                    window.xyGlobalTaskMap.set(task.task_id || task.id, task);
                    const isCompleted = task.finish === 2;
                    
                    const name = (task.name || '').toLowerCase();
                    const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
                    
                    let typeStr = isVideo ? '📺 视频' : '📄 文档';

                    const statusUI = isCompleted
                        ? `<span style="color:${T('#34d399','#065f46')}; font-weight:bold; background:${T('rgba(52,211,153,0.1)','#ecfdf5')}; padding:2px 6px; border-radius:6px;">✅ 已完成(可刷)</span>`
                        : `<span style="color:${T('#fbbf24','#92400e')}; font-weight:bold; background:${T('rgba(251,191,36,0.1)','#fffbeb')}; padding:2px 6px; border-radius:6px;">⏳ 待完成</span>`;

                    html += `
                        <div style="background:${T('rgba(30,41,59,0.3)','#ffffff')}; border:1px solid ${isCompleted ? T('rgba(52,211,153,0.15)','#a7f3d0') : T('rgba(71,85,105,0.12)','#e2e8f0')}; border-radius:10px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; box-shadow: ${T('0 2px 4px rgba(0,0,0,0.1)','0 1px 2px rgba(0,0,0,0.04)')};">
                            <div style="flex:1; overflow:hidden;">
                                <div style="font-size:14px; font-weight:600; color:${T('#e2e8f0','#0f172a')}; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(task.name)}">${escapeHtml(task.name)}</div>
                                <div style="display:flex; gap:12px; font-size:12px; align-items:center;">
                                    <span style="color:${T('#94a3b8','#64748b')};">${typeStr}</span>
                                    ${statusUI}
                                </div>
                            </div>
                            <button class="xy-sch-add-btn" data-tid="${task.task_id || task.id}" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:white; border:none; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:bold; cursor:pointer; transform: translateY(0); transition:0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">+ 添加</button>
                        </div>
                    `;
                });
                
                html += `</div>`; // 结束折叠内容区
            });
            
            if (!hasAnyValidTask) {
                html = `<div style="text-align:center; padding:40px; color:${T('#94a3b8','#64748b')};">当前全网未发现可挂机的视频或文档任务</div>`;
            }
            
            container.innerHTML = html;

            // 绑定计划中心丝滑折叠事件
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
                            type: 1, // 这里只会有视频文档进队列，统一为1
                            strategy: task.finish === 2 ? 'duration' : 'until_done', // 智能默认：已完成的默认刷时长，未完成的默认达标连播
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
                        <div style="padding:20px 24px; background:${T('rgba(15,23,42,0.6)','#f8fafc')}; border-top:1px solid ${T('rgba(71,85,105,0.2)','#e2e8f0')}; display:flex; gap:16px; box-shadow: ${T('0 -4px 20px rgba(0,0,0,0.15)','none')};">
                            <button id="xy-sch-start-btn" style="flex:2; background:linear-gradient(135deg, #10b981, #059669); color:white; border:none; padding:16px; border-radius:14px; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 6px 16px rgba(16,185,129,0.3); transition:0.2s;" ${xyScheduleState.isRunning ? 'disabled' : ''}>${xyScheduleState.isRunning ? '🚀 调度引擎已在运行...' : '🚀 启动计划调度'}</button>
                            <button id="xy-sch-stop-btn" style="flex:1; background:linear-gradient(135deg, #ef4444, #dc2626); color:white; border:none; padding:16px; border-radius:14px; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 6px 16px rgba(239,68,68,0.3); transition:0.2s;" ${!xyScheduleState.isRunning ? 'disabled' : ''}>🛑 强停交还主控</button>
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
        const stopBtn = document.getElementById('xy-sch-stop-btn');

        startBtn.onclick = () => {
            if (xyScheduleState.queue.length === 0) { showToast('队列为空，请先添加任务', 'warning'); return; }
            
            const allDone = xyScheduleState.queue.every(q => q.status === 'completed');
            if (allDone) {
                xyScheduleState.queue.forEach(q => { q.status = 'pending'; q.elapsedSec = 0; q.actionDone = false; });
                xyScheduleState.currentIdx = 0;
            }

            xyScheduleState.lastMode = appState.mode;
            appState.mode = 'manual'; 
            GM_setValue('xy_play_mode', 'manual');
            updateCourseUI();

            xyScheduleState.isRunning = true;
            saveScheduleState();
            
            startBtn.disabled = true; startBtn.innerText = '🚀 调度引擎已在运行...';
            stopBtn.disabled = false;
            
            renderQueueList();
            logMsg('📅 计划调度中心已接管引擎最高权限，准备跳跃！', 'success');
        };

        stopBtn.onclick = () => {
            xyScheduleState.isRunning = false;
            
            appState.mode = xyScheduleState.lastMode || 'sequence';
            GM_setValue('xy_play_mode', appState.mode);
            updateCourseUI();

            saveScheduleState();
            
            startBtn.disabled = false; startBtn.innerText = '🚀 启动计划调度';
            stopBtn.disabled = true;

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

    // ==========================================
    // ⚙️ 计划调度器专属外挂 Timer
    // ==========================================
    // 独立于双频引擎的调度专属1秒轮询 - 持久化防后台节流
    createPersistentInterval(async () => {
        if (!xyScheduleState.isRunning || xyScheduleState.queue.length === 0) return;

        const currentTask = xyScheduleState.queue[xyScheduleState.currentIdx];
        
        if (!currentTask) {
            logMsg('✅ 所有计划调度任务已圆满完成！已自动切换为手动休眠。', 'success', false);

            xyScheduleState.isRunning = false;
            
            // 用户特别诉求：跑完后进入彻底手动暂停
            appState.mode = 'manual'; 
            GM_setValue('xy_play_mode', 'manual');
            updateCourseUI();
            
            saveScheduleState();
            
            const startBtn = document.getElementById('xy-sch-start-btn');
            if(startBtn) { startBtn.disabled = false; startBtn.innerText = '🚀 重新启动计划'; }
            const stopBtn = document.getElementById('xy-sch-stop-btn');
            if(stopBtn) { stopBtn.disabled = true; }
            
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

        // 判断是否在目标节点
        if (currentGroupId != currentTask.groupId || currentNodeId != currentTask.nodeId) {
            if (!appState.isJumping) {
                appState.isJumping = true;
                currentTask.status = 'running';
                saveScheduleState();
                
                logMsg(`🚀 计划调度：跨空间跳跃前往【${currentTask.name.substring(0,10)}】...`, 'info', false);
                
                setTimeout(() => {
                    window.location.href = `/app/jx-web/${pathPrefix}/${currentTask.groupId}/resource/${currentTask.resourceId}/${currentTask.nodeId}`;
                }, 1500);
            }
            return;
        }

        // --- 已在目标页面，接管主引擎，智能调度时长与提交 ---
        
        // 核心妙招：根据策略，强行改写主引擎的模式，让它为调度器打工！
        const desiredMode = currentTask.strategy === 'until_done' ? 'sequence' : 'loop';
        if (appState.mode !== desiredMode) {
            appState.mode = desiredMode;
            GM_setValue('xy_play_mode', desiredMode);
            updateCourseUI();
        }
        
        currentTask.elapsedSec = (currentTask.elapsedSec || 0) + 1;
        
        // 刷新本地防死锁狗，保证调度不被原生框架干掉
        watchdogLastActiveTime = Date.now();

        if (currentTask.elapsedSec % 5 === 0) saveScheduleState(); // 5秒存一次进度

        // 更新调度中心界面UI时间 (如果打开着)
        if (window.xyUpdateScheduleProgress) window.xyUpdateScheduleProgress(currentTask);

        let isDone = false;
        
        if (currentTask.strategy === 'until_done') {
            // 只要底层的雷达/提交器判定完成了，且给它至少留了 5 秒的初始缓冲期，我们就认为这关过了
            if (appState.isTaskCompleted && currentTask.elapsedSec > 5) {
                isDone = true;
            }
        } else if (currentTask.strategy === 'duration') {
            // 固定时长策略，时间到了就行
            if (currentTask.elapsedSec >= currentTask.duration * 60) {
                isDone = true;
            }
        }
        // infinite 永远不会变成 isDone

        if (isDone) {
            logMsg(`✅ 计划调度：任务【${currentTask.name.substring(0,8)}...】已达标！即将进行下一项。`, 'success', false);
            currentTask.status = 'completed';
            saveScheduleState();
            if (window.xyRenderScheduleQueue) window.xyRenderScheduleQueue();
        }
        
    }, 1000, 30);


    function dismissSplash() {
        try { if (window._xySplashDismiss) window._xySplashDismiss(); } catch(e) {}
    }


    function createUI() {
        if (document.getElementById('xy-super-console')) return;
        if (!document.body) { requestAnimationFrame(createUI); return; }

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
        
        wrapper.innerHTML = `
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
                #xy-main-body > * { flex-shrink: 0 !important; }
                .xy-panel { background: var(--xy-surface2); border: 1px solid var(--xy-border); border-radius: 12px; padding: 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); flex-shrink: 0; }
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
            </style>
            
            <div id="xy-drag-handle" style="padding: 14px 18px 12px 18px; background: rgba(15,23,42,0.5); border-bottom: 1px solid var(--xy-border); cursor: grab; display: flex; flex-direction: column; gap: 10px; user-select: none;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: 700; color: ${T('#e2e8f0','#0f172a')}; font-size: 15px; display:flex; align-items:center; gap:8px;">
                         小雅辅助工具
                         <span class="xy-badge xy-badge-success">v${SCRIPT_VERSION}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:2px;">
                        <div id="xy-width-toggle" style="cursor: pointer; color: ${T('#64748b','#94a3b8')}; padding: 4px 5px; border-radius: 6px; font-size: 13px; transition: 0.2s; font-weight:700;" title="切换面板宽度" onmouseover="this.style.background='${T('rgba(71,85,105,0.4)','#f1f5f9')}';" onmouseout="this.style.background='transparent';">↔</div>
                        <div id="xy-theme-toggle" style="cursor: pointer; color: ${T('#64748b','#94a3b8')}; padding: 4px 6px; border-radius: 6px; font-size: 14px; transition: 0.2s;" onmouseover="this.style.background='${T('rgba(71,85,105,0.4)','#f1f5f9')}';" onmouseout="this.style.background='transparent';">🌙</div>
                        <div id="xy-minimize" style="cursor: pointer; color: ${T('#64748b','#94a3b8')}; padding: 4px 7px; border-radius: 6px; font-size: 14px; transition: 0.2s; font-weight:700;" onmouseover="this.style.background='${T('rgba(71,85,105,0.4)','#f1f5f9')}'; this.style.color='${T('#e2e8f0','#0f172a')}';" onmouseout="this.style.background='transparent'; this.style.color='${T('#64748b','#94a3b8')}';">⊟</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div id="xy-zone-badge" class="xy-badge xy-badge-info"></div>
                    <span id="xy-qq-group" class="xy-badge xy-badge-info" style="cursor:pointer; transition:all 0.2s;" title="点击复制QQ群号" onmouseover="this.style.background='${T('rgba(129,140,248,0.25)','#c7d2fe')}';" onmouseout="this.style.background='${T('rgba(129,140,248,0.15)','#e0e7ff')}';">QQ群: 1095232169</span>
                </div>
            </div>

            <div id="xy-main-body" style="padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; flex: 1; gap: 6px;">

                <div class="xy-panel" style="padding: 0; overflow: hidden; border-color: ${T('rgba(129,140,248,0.15)','#c7d2fe')};">
                    <div id="xy-bc-toggle" style="background: ${T('rgba(99,102,241,0.06)','#eef2ff')}; padding: 10px 16px; font-size: 12px; font-weight: 600; color: ${T('#a5b4fc','#3730a3')}; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;">
                        <span>📣 情报站</span>
                        <span id="xy-bc-arrow" style="transition: transform 0.3s; font-size: 10px; color: ${T('#818cf8','#4f46e5')};">▼</span>
                    </div>
                    <div id="xy-bc-content" style="font-size: 12px; color: ${T('#94a3b8','#475569')}; line-height: 1.7; display: none; background: ${T('rgba(15,23,42,0.4)','#f8fafc')}; border-top: 1px solid var(--xy-border); max-height: 180px; overflow-y: auto;">
                        <div style="padding: 12px 16px;">
                            <span style="color:${T('#64748b','#94a3b8')};">正在解析云端通讯...</span>
                        </div>
                    </div>
                </div>

                <div id="xy-view-standby" style="display:none; flex-direction:column; align-items:center; justify-content:center; padding: 32px 16px; text-align:center; flex-shrink: 0;">
                    <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.6;">🌙</div>
                    <div style="font-size: 14px; font-weight: 600; color: ${T('#94a3b8','#64748b')}; margin-bottom: 8px;">系统休眠中</div>
                    <div style="font-size: 12px; color: ${T('#64748b','#475569')}; line-height: 1.7; margin-bottom: 24px;">当前位于不可自动化的区域<br>进入<span style="color:${T('#34d399','#059669')};">视频/文档/讨论区</span>自动激活引擎</div>
                    <div style="display:flex; gap:10px; width:85%; margin: 0 auto;">
                        <button class="xy-action-btn" id="xy-btn-dashboard-standby" style="background:${T('rgba(99,102,241,0.2)','#eef2ff')}; border-color:${T('rgba(129,140,248,0.3)','#c7d2fe')}; flex:1; padding: 12px; font-size: 13px;">🌍 全局雷达</button>
                        <button class="xy-action-btn" id="xy-btn-schedule-standby" style="background:${T('rgba(251,191,36,0.12)','#fffbeb')}; border-color:${T('rgba(251,191,36,0.25)','#fde68a')}; color:${T('#fcd34d','#92400e')}; flex:1; padding: 12px; font-size: 13px;">📅 计划调度</button>
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
                    <div class="xy-panel" style="padding:10px 14px; margin-bottom:10px;">
                        <div class="xy-section-hdr" id="xy-hdr-toggles" style="font-size:12px; font-weight:600; color:${T('#94a3b8','#475569')}; display:flex; justify-content:space-between; align-items:center; user-select:none; cursor:pointer;">
                            <span>⚙️ 开关控制</span><span id="xy-arr-toggles" style="font-size:10px; transition:transform 0.25s;">▼</span>
                        </div>
                        <div id="xy-body-toggles" style="margin-top: 10px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                                <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🛡️ 防休眠</span>
                            <button id="xy-btn-guard" style="font-size:12px; font-weight:700; padding:5px 14px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.guardActive ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.guardActive ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${appState.guardActive ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">💓 后台保活</span>
                            <button id="xy-btn-keepalive" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.keepaliveEnabled ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.keepaliveEnabled ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${appState.keepaliveEnabled ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🔇 强制静音</span>
                            <button id="xy-btn-quick-mute" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.hardwareMute ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.hardwareMute ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${appState.hardwareMute ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🖱️ 鼠标模拟</span>
                            <button id="xy-btn-mouse-sim" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.mouseSimActive ? T('rgba(236,72,153,0.2)','#fce7f3') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.mouseSimActive ? T('#f9a8d4','#be185d') : T('#94a3b8','#64748b')};">${appState.mouseSimActive ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🕵️ 深度伪装</span>
                            <button id="xy-btn-deep-camo" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.deepCamouflage ? T('rgba(168,85,247,0.2)','#f3e8ff') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.deepCamouflage ? T('#c4b5fd','#7c3aed') : T('#94a3b8','#64748b')};">${appState.deepCamouflage ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0;">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🔄 页面重载</span>
                            <button id="btn-manual-refresh" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:1px solid ${T('rgba(129,140,248,0.25)','#c7d2fe')}; transition:0.2s; background:${T('rgba(99,102,241,0.12)','#eef2ff')}; color:${T('#a5b4fc','#4338ca')};">⚡ 刷新</button>
                        </div>
                        </div>
                    </div>

                    <div class="xy-panel" style="padding:10px 14px; margin-bottom:10px; border: 1px solid ${T('rgba(239,68,68,0.2)','#fecaca')};">
                        <div class="xy-section-hdr" id="xy-hdr-inject" style="font-size:12px; font-weight:600; color:${T('#f87171','#dc2626')}; display:flex; justify-content:space-between; align-items:center; user-select:none; cursor:pointer;">
                            <span>⚠️ 学时注入（高危 · 未测试）</span><span id="xy-arr-inject" style="font-size:10px; transition:transform 0.25s; transform:rotate(-90deg);">▼</span>
                        </div>
                        <div id="xy-body-inject" style="margin-top: 8px; display:none;">
                            <div style="font-size:10px; color:${T('#f87171','#dc2626')}; margin-bottom:8px; line-height:1.5; padding:6px 8px; background:${T('rgba(239,68,68,0.06)','#fef2f2')}; border-radius:6px; border-left:3px solid ${T('#f87171','#ef4444')};">
                                ⚡ 此功能通过高频发包模拟学习时长，可能触发平台风控机制导致<b>账号异常</b>。仅供紧急补救使用，切勿日常依赖。使用前请确认了解风险！
                            </div>
                            <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                                <input type="number" id="xy-inject-minutes" value="" min="1" max="300" style="flex:1; padding:7px 10px; border-radius:8px; border:1px solid ${T('rgba(239,68,68,0.3)','#fecaca')}; background:${T('rgba(15,23,42,0.6)','#ffffff')}; color:${T('#fca5a5','#dc2626')}; font-size:13px; font-weight:600; text-align:center;" placeholder="必须手动输入">
                                <span style="font-size:12px; font-weight:600; color:${T('#f87171','#dc2626')}; white-space:nowrap;">分钟</span>
                            </div>
                            <div style="display:flex; gap:6px;">
                                <button class="xy-action-btn" id="xy-btn-inject" style="flex:1; background:${T('rgba(239,68,68,0.12)','#fef2f2')}; border-color:${T('rgba(239,68,68,0.3)','#fecaca')}; color:${T('#fca5a5','#dc2626')}; font-size:12px; padding:8px;">⚠️ 确认注入</button>
                                <button class="xy-mini-btn" id="xy-btn-inject-stop" style="color:${T('#94a3b8','#64748b')}; border-color:${T('rgba(71,85,105,0.2)','#e2e8f0')}; background:${T('rgba(71,85,105,0.08)','#f8fafc')}; font-size:11px;">⏹ 停止</button>
                            </div>
                            <div id="xy-inject-progress" style="display:none; margin-top:8px; padding:8px 10px; background:${T('rgba(239,68,68,0.06)','#fef2f2')}; border-radius:8px; border:1px solid ${T('rgba(239,68,68,0.2)','#fecaca')};">
                                <div style="font-size:11px; font-weight:600; color:${T('#fca5a5','#dc2626')}; margin-bottom:4px;" id="xy-inject-progress-text">准备中...</div>
                                <div style="width:100%; height:4px; background:${T('rgba(239,68,68,0.15)','#fee2e2')}; border-radius:2px; overflow:hidden;"><div id="xy-inject-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #f87171, #ef4444); transition:width 0.3s ease-out; border-radius:2px;"></div></div>
                            </div>
                        </div>
                    </div>

                    <div class="xy-panel" style="padding: 12px;">
                        <div class="xy-section-hdr" id="xy-hdr-engine" style="font-weight:600; font-size:12px; color:${T('#94a3b8','#475569')}; display:flex; justify-content:space-between; align-items:center; user-select:none; cursor:pointer;">
                            <span>智能双引擎中枢</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <label style="font-size:10px; cursor:pointer; color:${T('#64748b','#475569')}; font-weight:600; display:flex; align-items:center; gap:3px;" onclick="event.stopPropagation()"><input type="checkbox" id="toggle-ai-mode" ${appState.aiMode ? 'checked' : ''} style="width:12px; height:12px; accent-color:#818cf8; cursor:pointer;"> 自动</label>
                                <span id="xy-arr-engine" style="font-size:10px; transition:transform 0.25s;">▼</span>
                            </div>
                        </div>
                        <div id="xy-body-engine" style="margin-top: 10px;">
                            <div style="display:flex; gap:8px;">
                            <div id="xy-engine-video" style="flex:1; padding:10px; background:${T('rgba(52,211,153,0.05)','#f0fdf4')}; border:1px solid ${T('rgba(52,211,153,0.15)','#bbf7d0')}; border-radius:8px; transition: opacity 0.3s;">
                                <div style="font-size:11px; font-weight:600; color:${T('#6ee7b7','#059669')}; margin-bottom:6px;">📺 视频 <span id="xy-video-status" style="font-weight:400; font-size:10px; color:${T('#94a3b8','#64748b')};">待命</span></div>
                                <label style="font-size:10px; color:${T('#34d399','#059669')}; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:3px;"><input type="checkbox" id="toggle-video-submit" ${appState.videoAutoSubmit ? 'checked' : ''} style="width:12px; height:12px; accent-color:#34d399; cursor:pointer;"> 播完跳课</label>
                            </div>
                            <div id="xy-engine-doc" style="flex:1; padding:10px; background:${T('rgba(168,85,247,0.05)','#faf5ff')}; border:1px solid ${T('rgba(168,85,247,0.15)','#e9d5ff')}; border-radius:8px; transition: opacity 0.3s;">
                                <div style="font-size:11px; font-weight:600; color:${T('#c4b5fd','#7c3aed')}; margin-bottom:4px;">📄 文档 <span id="xy-doc-status" style="font-weight:400; font-size:10px; color:${T('#94a3b8','#64748b')};">待命</span></div>
                                <div style="width:100%; height:4px; background:${T('rgba(168,85,247,0.15)','#e9d5ff')}; border-radius:2px; margin-bottom:6px; overflow:hidden;"><div id="xy-doc-progress" style="width:0%; height:100%; background:linear-gradient(90deg, #a855f7, #818cf8); transition:width 0.5s ease-out; border-radius:2px;"></div></div>
                                <label style="font-size:10px; color:${T('#a78bfa','#7c3aed')}; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:3px;"><input type="checkbox" id="toggle-doc-batch" ${appState.docBatchSubmit ? 'checked' : ''} style="width:12px; height:12px; accent-color:#a855f7; cursor:pointer;"> 达标连交</label>
                            </div>
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
                        <label style="cursor: pointer; font-size: 11px; color: ${T('#a5b4fc','#3730a3')}; background: ${T('rgba(99,102,241,0.1)','#e0e7ff')}; padding: 3px 8px; border-radius: 6px; border: 1px solid ${T('rgba(129,140,248,0.2)','#c7d2fe')}; transition: 0.2s;">
                            <input type="checkbox" id="xy-toggle-dom-scan" ${appState.enableDomScan ? 'checked' : ''} style="accent-color: #818cf8; vertical-align: middle; margin-right: 3px; width: 11px; height: 11px;">智能DOM
                        </label>
                    </div>

                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                        <button class="xy-mini-btn" id="xy-btn-fetch-users" style="background:${T('rgba(99,102,241,0.2)','#eef2ff')}; color:${T('#c7d2fe','#4338ca')}; border-color:${T('rgba(129,140,248,0.25)','#c7d2fe')}; flex:1;">🔄 刷新名单</button>
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
                        <button class="xy-action-btn disc-btn" id="xy-btn-target-like" style="background:rgba(139,92,246,0.2); border-color:rgba(139,92,246,0.3); color:#c4b5fd; flex:1.5; font-size:12px;">⚡ 点赞选中</button>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="xy-action-btn disc-btn" id="xy-btn-reply" style="background:rgba(14,165,233,0.15); border-color:rgba(14,165,233,0.25); color:#7dd3fc; flex:1; font-size:12px;">💬 全局盲回</button>
                        <button class="xy-action-btn disc-btn" id="xy-btn-target-reply" style="background:rgba(2,132,199,0.15); border-color:rgba(2,132,199,0.25); color:#67e8f9; flex:1.5; font-size:12px;">🎯 回复选中</button>
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding: 10px 14px; background: ${T('rgba(99,102,241,0.04)','#eef2ff')}; border: 1px solid ${T('rgba(129,140,248,0.12)','#c7d2fe')}; border-radius: 8px;">
                        <label style="font-size:12px; font-weight:600; color:${T('#a5b4fc','#3730a3')}; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <input type="checkbox" id="xy-toggle-custom-reply" ${appState.useCustomReply ? 'checked' : ''} style="accent-color:#818cf8; width:14px; height:14px; cursor:pointer;"> 自定义语料
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 11px; color: ${T('#94a3b8','#64748b')};">
                        <span id="xy-dl-file-count">0 个文件</span>
                    </div>
                    <div style="max-height:200px; overflow-y:auto; margin-bottom:8px;" id="xy-dl-file-list">
                        <div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">暂无课件资源</div>
                    </div>
                    <div id="xy-dl-progress-wrap" style="display:none; margin-bottom: 10px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span id="xy-dl-progress-text" style="font-size:11px; font-weight:600; color:${T('#6ee7b7','#059669')}; white-space:nowrap;"></span>
                            <div style="display:flex; gap:4px; margin-left:auto;">
                                <button class="xy-mini-btn" id="xy-dl-pause" style="display:none; padding:2px 8px; font-size:11px;">⏸️ 暂停</button>
                                <button class="xy-mini-btn" id="xy-dl-stop" style="display:none; padding:2px 8px; font-size:11px; color:#f87171; border-color:${T('rgba(248,113,113,0.25)','#fecaca')}; background:${T('rgba(248,113,113,0.08)','#fef2f2')};">⏹️ 终止</button>
                            </div>
                        </div>
                        <div style="width:100%; height:8px; background:${T('rgba(71,85,105,0.2)','#e2e8f0')}; border-radius:4px; overflow:hidden;">
                            <div id="xy-dl-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #34d399, #818cf8); border-radius:4px; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="xy-mini-btn" id="xy-dl-select-all" style="flex:1;">全选</button>
                        <button class="xy-mini-btn" id="xy-dl-deselect-all" style="flex:1;">清空</button>
                        <button class="xy-action-btn" id="xy-dl-batch-download" style="flex:1.5; background:${T('rgba(52,211,153,0.12)','#ecfdf5')}; border-color:${T('rgba(52,211,153,0.25)','#a7f3d0')}; color:${T('#6ee7b7','#059669')};">⬇️ 下载选中</button>
                    </div>
                </div>
            </div>

            <div class="xy-panel" style="background:${T('rgba(30,41,59,0.3)','#f8fafc')}; border-style:dashed;">
                <div style="font-weight:600; font-size:12px; color:${T('#94a3b8','#475569')}; display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                    <span>系统控制</span>
                    <div style="display:flex; gap: 10px;">
                        <label style="font-size:11px; cursor:pointer; color:${T('#64748b','#475569')}; font-weight:600; display:flex; align-items:center; gap:3px;"><input type="checkbox" id="toggle-refresh-panel" ${appState.showRefreshPanel ? 'checked' : ''} style="width:12px; height:12px; accent-color:#64748b; cursor:pointer;"> 重载视窗</label>
                        <label style="font-size:11px; cursor:pointer; color:${T('#64748b','#475569')}; font-weight:600; display:flex; align-items:center; gap:3px;"><input type="checkbox" id="toggle-terminal" ${appState.showTerminal ? 'checked' : ''} style="width:12px; height:12px; accent-color:#64748b; cursor:pointer;"> 终端</label>
                    </div>
                </div>
                <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end;">
                    <button class="xy-mini-btn" id="btn-clear-logs" style="font-size:11px; padding:5px 10px;">清空日志</button>
                    <button class="xy-mini-btn" id="btn-clear-progress" style="font-size:11px; padding:5px 10px; color:#f87171; border-color:${T('rgba(248,113,113,0.2)','#fecaca')}; background:${T('rgba(248,113,113,0.08)','#fef2f2')};">重置时长</button>
                </div>
            </div>

            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; margin-bottom: 6px;">
                <div id="xy-refresh-container" style="display: ${appState.showRefreshPanel ? 'block' : 'none'}; background: ${T('rgba(251,191,36,0.06)','#fffbeb')}; padding: 12px 16px; border-radius: 10px; border: 1px solid ${T('rgba(251,191,36,0.15)','#fde68a')};">
                    <div style="font-size: 11px; color: ${T('#fcd34d','#92400e')}; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">⏳ 动态重载调度</div>
                    <div id="xy-refresh-status" style="font-size: 12px; color: ${T('#fbbf24','#92400e')}; font-weight: 600; font-family: monospace;">目前无重载任务</div>
                </div>

                <div id="xy-terminal-container" style="display: ${appState.showTerminal ? 'block' : 'none'}; background: ${T('rgba(0,0,0,0.5)','#f1f5f9')}; padding: 12px; border-radius: 10px; border: 1px solid ${T('rgba(71,85,105,0.3)','#e2e8f0')};">
                    <div style="font-size: 11px; color: ${T('#64748b','#475569')}; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><span style="color:${T('#34d399','#059669')}; font-family:monospace; font-size:13px;">❯</span> 终端</div>
                    <div id="xy-activity-log" style="height: 110px; overflow-y: auto; font-family: 'SF Mono', 'JetBrains Mono', Consolas, monospace; font-size: 11px; display: flex; flex-direction: column; color: ${T('#34d399','#059669')}; padding-right: 4px; line-height: 1.6;"></div>
                </div>
            </div>

            </div>
        `;
        document.body.appendChild(wrapper);

        const logBox = document.getElementById('xy-activity-log');
        if (logBox && sessionLogs.length > 0) {
            logBox.innerHTML = ''; sessionLogs.forEach(log => { const el = document.createElement('div'); el.style.color = log.color === '#64748b' ? '#94a3b8' : (log.color === '#38bdf8' ? '#10b981' : log.color); el.style.marginBottom = '4px'; el.style.lineHeight = '1.5'; el.innerText = log.text; logBox.appendChild(el); });
            logBox.scrollTop = logBox.scrollHeight;
        } else {
            logMsg('=============================', 'silent', true);
            logMsg('雷达 已就绪', 'info', false);
            logMsg('📡 全局雷达网持续扫描中...', 'silent', true);
        }

        const qqBadge = document.getElementById('xy-qq-group');
        if (qqBadge) {
            qqBadge.onclick = async (e) => {
                e.stopPropagation();
                try {
                    await navigator.clipboard.writeText('1095232169');
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
                btnQuickMute.textContent = appState.hardwareMute ? 'ON' : 'OFF';
                btnQuickMute.style.background = appState.hardwareMute ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0');
                btnQuickMute.style.color = appState.hardwareMute ? T('#34d399','#065f46') : T('#94a3b8','#64748b');
                document.querySelectorAll('video, audio').forEach(m => { m.muted = appState.hardwareMute; });
                logMsg(`🔕 底层音轨强制拦截引擎已${appState.hardwareMute ? '启动' : '关闭'}！`, appState.hardwareMute ? 'success' : 'warning', false);
            };
        }

        const toggleAi = document.getElementById('toggle-ai-mode'); if(toggleAi) toggleAi.onchange = (e) => { appState.aiMode = e.target.checked; GM_setValue('xy_ai_mode', appState.aiMode); };
        const toggleVideo = document.getElementById('toggle-video-submit'); if(toggleVideo) toggleVideo.onchange = (e) => { appState.videoAutoSubmit = e.target.checked; GM_setValue('xy_video_submit', appState.videoAutoSubmit); };
        const toggleDoc = document.getElementById('toggle-doc-batch'); if(toggleDoc) toggleDoc.onchange = (e) => { appState.docBatchSubmit = e.target.checked; GM_setValue('xy_doc_batch', appState.docBatchSubmit); };
        
        const toggleRefresh = document.getElementById('toggle-refresh-panel');
        if (toggleRefresh) {
            toggleRefresh.onchange = (e) => {
                appState.showRefreshPanel = e.target.checked;
                GM_setValue('xy_show_refresh_panel', appState.showRefreshPanel);
                const refBox = document.getElementById('xy-refresh-container');
                if (refBox) refBox.style.display = appState.showRefreshPanel ? 'block' : 'none';
            };
        }

        const toggleTerminal = document.getElementById('toggle-terminal');
        if (toggleTerminal) {
            toggleTerminal.onchange = (e) => {
                appState.showTerminal = e.target.checked;
                GM_setValue('xy_show_terminal', appState.showTerminal);
                const termBox = document.getElementById('xy-terminal-container');
                if (termBox) termBox.style.display = appState.showTerminal ? 'block' : 'none';
            };
        }

        document.getElementById('btn-manual-refresh').onclick = () => { logMsg('🔄 手动重载页面...', 'warning', false); setTimeout(() => window.location.reload(), 500); };
        document.getElementById('btn-clear-logs').onclick = () => { sessionLogs = []; sessionStorage.removeItem('xy_session_logs'); const box = document.getElementById('xy-activity-log'); if(box) box.innerHTML = ''; logMsg('🧹 终端日志已清空', 'silent', true); };
        document.getElementById('btn-clear-progress').onclick = () => { appState.recordCount = 0; appState.totalTime = 0; appState.realTime = 0; sessionStorage.removeItem('xy_recordCount'); sessionStorage.removeItem('xy_totalTime'); sessionStorage.removeItem('xy_realTime'); updateCourseUI(); logMsg('🗑️ 时长记录归零', 'error', false); };

        document.getElementById('btn-mode-man').onclick = () => { 
            if (xyScheduleState.isRunning) { document.getElementById('xy-sch-stop-btn')?.click(); } // 联动关闭调度
            appState.mode = 'manual'; 
            GM_setValue('xy_play_mode', 'manual'); 
            clearDynamicRefresh(); 
            logMsg('已暂停，且已强制停止所有重载任务', 'success'); 
            updateCourseUI(); 
        };
        document.getElementById('btn-mode-loop').onclick = () => { if (!getCourseGroupId() || !getNodeId()) { xyShowModal('⚠️ 无法开启', '请进入具体的视频或文档内容页后再开启'); return; } if (xyScheduleState.isRunning) { document.getElementById('xy-sch-stop-btn')?.click(); } appState.mode = 'loop'; GM_setValue('xy_play_mode', 'loop'); logMsg('安全刷时长模式开启，恢复经典无限循环', 'success'); updateCourseUI(); globalTaskStatusChecker(true); };
        document.getElementById('btn-mode-seq').onclick = () => { if (xyScheduleState.isRunning) { document.getElementById('xy-sch-stop-btn')?.click(); } appState.mode = 'sequence'; GM_setValue('xy_play_mode', 'sequence'); logMsg('🚀 连播破壁引擎开启，特种规则接管文档与防拖拽', 'success'); updateCourseUI(); if (!getCourseGroupId()) tryJumpToNext(); else globalTaskStatusChecker(true); };
        
        document.getElementById('xy-btn-guard').onclick = () => { appState.guardActive = !appState.guardActive; GM_setValue('xy_guard_active', appState.guardActive); updateCourseUI(); logMsg(`🛡️ 防休眠${appState.guardActive ? '已开启':'已关闭'}`, 'info', true); };
        document.getElementById('xy-btn-keepalive').onclick = () => {
            appState.keepaliveEnabled = !appState.keepaliveEnabled;
            GM_setValue('xy_keepalive', appState.keepaliveEnabled);
            if (appState.keepaliveEnabled) {
                startKeepaliveWatchdog();
                if (appState.activeZone === 'course' && getNodeId() && !appState.recordActive) toggleRecord(true);
            } else {
                stopKeepaliveWatchdog();
            }
            updateCourseUI();
            logMsg(`💓 后台保活${appState.keepaliveEnabled ? '已开启':'已关闭'}`, 'info', true);
        };
        const injectBtn = document.getElementById('xy-btn-inject');
        if (injectBtn) injectBtn.onclick = () => {
            const input = document.getElementById('xy-inject-minutes');
            const minutes = parseInt(input?.value);
            if (!minutes || minutes < 1) { showToast('请先手动输入要注入的分钟数！', 'error'); return; }
            xyShowModal('⚠️ 高危操作确认',
                `<div style="line-height:1.8; color:${T('#e2e8f0','#0f172a')};">
                    <p style="color:${T('#fca5a5','#dc2626')}; font-weight:bold; font-size:15px;">你即将注入 <span style="font-size:20px;">${minutes}</span> 分钟学习时长</p>
                    <p style="font-size:12px; color:${T('#94a3b8','#64748b')};">此操作会以高频发包方式模拟学习记录，存在以下风险：</p>
                    <ul style="font-size:12px; color:${T('#f87171','#dc2626')}; padding-left:16px; margin:8px 0;">
                        <li>可能触发平台风控系统</li>
                        <li>可能导致账号功能受限</li>
                        <li>仅供紧急补救，切勿日常依赖</li>
                    </ul>
                    <p style="font-size:12px; color:${T('#fca5a5','#dc2626')}; font-weight:bold;">请在下方重新输入 ${minutes} 以确认：</p>
                    <input id="xy-inject-confirm" type="number" style="width:100%; padding:8px; border-radius:6px; border:2px solid ${T('#f87171','#ef4444')}; background:${T('rgba(15,23,42,0.6)','#ffffff')}; color:${T('#e2e8f0','#0f172a')}; font-size:16px; text-align:center;" placeholder="输入 ${minutes} 确认">
                </div>`,
                () => {
                    const confirmInput = document.getElementById('xy-inject-confirm');
                    if (confirmInput && parseInt(confirmInput.value) === minutes) {
                        injectDuration(minutes);
                    } else {
                        showToast('❌ 确认数字不匹配，注入已取消', 'error');
                    }
                }
            );
        };
        document.getElementById('xy-btn-inject-stop').onclick = () => stopInject();
        document.getElementById('xy-btn-mouse-sim').onclick = () => {
            toggleMouseSim(!appState.mouseSimActive);
            const btn = document.getElementById('xy-btn-mouse-sim');
            if (btn) {
                btn.textContent = appState.mouseSimActive ? 'ON' : 'OFF';
                btn.style.background = appState.mouseSimActive ? T('rgba(236,72,153,0.2)','#fce7f3') : T('rgba(71,85,105,0.2)','#e2e8f0');
                btn.style.color = appState.mouseSimActive ? T('#f9a8d4','#be185d') : T('#94a3b8','#64748b');
            }
        };
        document.getElementById('xy-btn-deep-camo').onclick = () => {
            if (appState.deepCamouflage) {
                stopDeepCamouflage();
            } else {
                startDeepCamouflage();
            }
            const btn = document.getElementById('xy-btn-deep-camo');
            if (btn) {
                btn.textContent = appState.deepCamouflage ? 'ON' : 'OFF';
                btn.style.background = appState.deepCamouflage ? T('rgba(168,85,247,0.2)','#f3e8ff') : T('rgba(71,85,105,0.2)','#e2e8f0');
                btn.style.color = appState.deepCamouflage ? T('#c4b5fd','#7c3aed') : T('#94a3b8','#64748b');
            }
        };
        // 恢复上次的模拟状态
        if (appState.mouseSimActive) { scheduleMouseSim(); }
        document.getElementById('xy-btn-dashboard').onclick = openGlobalTaskDashboard;
        document.getElementById('xy-btn-dashboard-standby').onclick = openGlobalTaskDashboard;
        document.getElementById('xy-btn-schedule').onclick = openScheduleDashboard;
        document.getElementById('xy-btn-download-zone').onclick = () => enterDownloadZone();
        document.getElementById('xy-btn-quick-kill').onclick = () => {
            quickKillCurrentTask();
        };

        const scheduleStandbyBtn = document.getElementById('xy-btn-schedule-standby');
        if (scheduleStandbyBtn) scheduleStandbyBtn.onclick = openScheduleDashboard;

        const toggleDomScan = document.getElementById('xy-toggle-dom-scan');
        if(toggleDomScan) { toggleDomScan.onchange = (e) => { appState.enableDomScan = e.target.checked; logMsg(e.target.checked ? '✅ 智能DOM提取已开启' : '⏸️ 智能DOM提取已暂停', 'info', true); }; }

        const toggleCustomReply = document.getElementById('xy-toggle-custom-reply');
        if(toggleCustomReply) { toggleCustomReply.onchange = (e) => { appState.useCustomReply = e.target.checked; GM_setValue('xy_use_custom_reply', appState.useCustomReply); }; }
        const btnEditReply = document.getElementById('xy-btn-edit-reply');
        if (btnEditReply) btnEditReply.onclick = openReplySettingsModal;

        // ── 下载区事件 ──
        const dlSearchInput = document.getElementById('xy-dl-search');
        if (dlSearchInput) {
            dlSearchInput.addEventListener('input', () => {
                appState.downloadSearchKeyword = dlSearchInput.value;
                renderDownloadList();
            });
        }
        document.getElementById('xy-dl-select-all').onclick = () => {
            const keyword = (appState.downloadSearchKeyword || '').toLowerCase().trim();
            const targets = keyword
                ? appState.downloadFiles.filter(f => f.name.toLowerCase().includes(keyword))
                : appState.downloadFiles;
            targets.forEach(f => appState.downloadSelectedIds.add(f.id));
            renderDownloadList();
        };
        document.getElementById('xy-dl-deselect-all').onclick = () => {
            appState.downloadSelectedIds.clear();
            renderDownloadList();
        };
        document.getElementById('xy-dl-batch-download').onclick = () => batchDownloadSelected();
        document.getElementById('xy-dl-stop').onclick = () => stopBatchDownload();
        document.getElementById('xy-dl-pause').onclick = () => {
            appState.downloadPaused = !appState.downloadPaused;
            setDownloadButtonsState(true, appState.downloadPaused);
            logMsg(appState.downloadPaused ? '⏸️ 下载已暂停' : '▶️ 下载已继续', 'info', true);
        };
        document.getElementById('xy-dl-back').onclick = () => {
            switchToZone(appState.prevZone || 'course');
        };
        document.getElementById('xy-dl-refresh').onclick = () => {
            const gid = getCourseGroupId();
            if (gid) loadDownloadPanel(gid);
            else showToast('未检测到课程 ID', 'warning');
        };
        const dlFileList = document.getElementById('xy-dl-file-list');
        if (dlFileList) {
            dlFileList.addEventListener('change', (e) => {
                if (e.target.classList.contains('xy-dl-check')) {
                    const fid = e.target.getAttribute('data-fid');
                    if (e.target.checked) appState.downloadSelectedIds.add(fid);
                    else appState.downloadSelectedIds.delete(fid);
                }
            });
            dlFileList.addEventListener('click', (e) => {
                if (e.target.classList.contains('xy-dl-single')) {
                    const fid = e.target.getAttribute('data-fid');
                    const file = appState.downloadFiles.find(f => f.id == fid);
                    if (file) {
                        getDownloadUrl(file.quoteId).then(url => {
                            if (url) downloadFile(url, file.name);
                            else showToast('获取下载链接失败', 'error');
                        });
                    }
                }
            });
        }

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
        document.getElementById('xy-btn-copy-names').onclick = async () => {
            const names = Array.from(appState.selectedNames).join('\n');
            if (!names) { showToast('当前未选择任何目标', 'warning'); return; }
            try {
                await navigator.clipboard.writeText(names);
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
        if (listContainer) {
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
        }

        const handle = document.getElementById('xy-drag-handle'), minBtn = document.getElementById('xy-minimize'), body = document.getElementById('xy-main-body');
        let isMin = false; minBtn.onclick = () => { isMin = !isMin; body.style.display = isMin ? 'none' : 'flex'; minBtn.innerText = isMin ? '⊞' : '⊟'; };

        // ── 宽度切换：360 → 300 → 420 循环 ──
        const widthBtn = document.getElementById('xy-width-toggle');
        const widths = [360, 300, 420];
        let widthIdx = widths.indexOf(savedWidth);
        if (widthIdx === -1) widthIdx = 0;
        const applyWidth = () => { wrapper.style.width = widths[widthIdx] + 'px'; GM_setValue('xy_panel_width', widths[widthIdx]); };
        widthBtn.onclick = () => { widthIdx = (widthIdx + 1) % widths.length; applyWidth(); showToast(widths[widthIdx] === 300 ? '📐 紧凑模式' : widths[widthIdx] === 420 ? '📐 宽屏模式' : '📐 标准模式', 'info'); };

        // ── 折叠面板通用绑定 ──
        const bindSection = (hdrId, bodyId, arrId) => {
            const hdr = document.getElementById(hdrId), bd = document.getElementById(bodyId), arr = document.getElementById(arrId);
            if (!hdr || !bd) return;
            hdr.onclick = () => {
                if (bd.style.display === 'none') { bd.style.display = ''; arr.style.transform = 'rotate(0deg)'; }
                else { bd.style.display = 'none'; arr.style.transform = 'rotate(-90deg)'; }
            };
        };
        bindSection('xy-hdr-actions', 'xy-body-actions', 'xy-arr-actions');
        bindSection('xy-hdr-toggles', 'xy-body-toggles', 'xy-arr-toggles');
        bindSection('xy-hdr-inject', 'xy-body-inject', 'xy-arr-inject');
        bindSection('xy-hdr-engine', 'xy-body-engine', 'xy-arr-engine');

        const themeBtn = document.getElementById('xy-theme-toggle');
        if (themeBtn) themeBtn.onclick = () => {
            // Cycle: auto → light → dark → auto
            if (appState.theme === 'auto') appState.theme = 'light';
            else if (appState.theme === 'light') appState.theme = 'dark';
            else appState.theme = 'auto';
            GM_setValue('xy_theme', appState.theme);
            applyTheme();
            showToast(appState.theme === 'auto' ? '🌓 主题：跟随系统' : appState.theme === 'light' ? '☀️ 主题：浅色模式' : '🌙 主题：深色模式', 'info');
        };

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

        setTimeout(() => syncHardwareMute(), 100);
        fetchCloudIntelligence();
    }

    // ==========================================
    // 🛡️ 启动系统与全局路由监听
    // ==========================================
    function ensureUI() {
        if (!document.getElementById('xy-super-console')) { createUI(); appState.isTaskCompleted = false; applyThemeClasses(); }

        // 后台保活引擎初始化
        if (appState.keepaliveEnabled && !keepaliveWatchdogTimer) {
            startKeepaliveWatchdog();
        }

        runLowLevelScanner().then(() => {
            updateCourseUI();
            updateDiscUI();
        });
    }

    const observer = new MutationObserver(() => ensureUI());
    try { observer.observe(document.body, { childList: true, subtree: false }); } catch(e) { /* body 暂未就绪，由 DOMContentLoaded 兜底 */ }

    const pushState = history.pushState; history.pushState = function () { pushState.apply(history, arguments); setTimeout(ensureUI, 100); };
    const replaceState = history.replaceState; history.replaceState = function () { replaceState.apply(history, arguments); setTimeout(ensureUI, 100); };
    window.addEventListener('popstate', () => setTimeout(ensureUI, 100));

    if (document.readyState === "loading") {
        document.addEventListener('DOMContentLoaded', () => { ensureUI(); });
    } else {
        ensureUI();
    }

    // 🆕 导出控制台快捷命令
    window.xyInjectDuration = (mins) => injectDuration(mins);
    window.xyStopInject = () => stopInject();
    window.xyKeepaliveStatus = () => {
        console.log('[小雅] 后台保活:', appState.keepaliveEnabled ? 'ON' : 'OFF');
        console.log('[小雅] 看门狗:', keepaliveWatchdogTimer ? '运行中' : '未启动');
        console.log('[小雅] 注入状态:', appState.injectActive ? `进行中 ${appState.injectCompleted}/${appState.injectTotal}` : '空闲');
    };

})();