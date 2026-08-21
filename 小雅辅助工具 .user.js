// ==UserScript==
// @name         小雅辅助工具
// @namespace    https://gitee.com/fieldlu/xy-script-assets
// @version      3.7.1
// @description  小雅平台浏览器用户脚本：视频与文档处理、课件批量下载、作业题目导出与AI作答保存、讨论区互动等常用功能集成
// @author       Confidential
// @license      GPL-3.0-or-later
// @match        https://*.ai-augmented.com/*
// @noframes
// @run-at       document-start
// @updateURL    https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js
// @downloadURL  https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js
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

    
    const _hw_nativeFetch = window.fetch;
    const _hw_nativeXhrOpen = XMLHttpRequest.prototype.open;
    const _hw_nativeXhrSend = XMLHttpRequest.prototype.send;

    
    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '未知';

    const domain = window.location.hostname;

    // ================= 脚本更新模块 =================
    // 与 WHUT教务小助手一致：从 Gitee 版本清单 JSON 拉取最新版本号，比对后提示
    const SCRIPT_UPDATE = {
        infoURL: 'https://gitee.com/fieldlu/xy-script-assets/raw/main/xy-script.latest.json',
        downloadURL: 'https://gitee.com/fieldlu/xy-script-assets/raw/main/%E5%B0%8F%E9%9B%85%E8%BE%85%E5%8A%A9%E5%B7%A5%E5%85%B7%20.user.js',
        projectURL: 'https://gitee.com/fieldlu/xy-script-assets'
    };

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

    function xyCloseUpdateModal() {
        const modal = xyUpdateModal;
        if (!modal || !document.body.contains(modal)) return;
        const box = modal.querySelector('#xy-update-box');
        modal.style.opacity = '0';
        if (box) box.style.transform = 'scale(0.95)';
        setTimeout(() => modal.remove(), 300);
        xyUpdateModal = null;
    }

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
                        gain.gain.value = 0.001; // 近乎无声，但浏览器认为在播音频
                        _antiThrottleOsc.type = 'sine';
                        _antiThrottleOsc.frequency.value = 20000; // 20kHz，人耳听不见
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

    
    const appState = {
        activeZone: 'uninitialized',
        discScrapeAbort: false,
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
        _lastCourseNodeId: null, 
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
        downloadCourseGroupKey: '',
        downloadSelectedIds: new Set(),
        downloadSearchKeyword: '',
        downloadSortMode: GM_getValue('xy_dl_sort', 'unit'),
        downloadSortMap: {},
        downloadDirTree: null,
        downloadTypeFilter: (function() {
            const all = ['video','audio','pdf','doc','ppt','xls','zip','other'];
            let saved = [];
            try { saved = String(GM_getValue('xy_dl_types','')||'').split(',').filter(k => all.includes(k)); } catch(e) {}
            return new Set(saved.length ? saved : all);
        })(),
        downloadAbortController: null,
        downloadMode: 'idle',
        downloadPaused: false,
        prevZone: 'course',
        
        deepCamouflage: GM_getValue('xy_deep_camo', true),
        camoScrollActive: false,
        camoKeyboardActive: false,
        
        keepaliveEnabled: GM_getValue('xy_keepalive', true),
        keepaliveWatchdog: null,
        camoClickActive: false
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

    function hwBuildTaskKey(gid, nid, pid) { return [gid||'', nid||'', pid||''].join(':'); }
    function hwResetState(reason) {
        if (!hwActiveTaskKey && !hwQuestionsData.length) return;
        hwQuestionsData = []; hwExtractedText = ''; hwImageAssets = []; hwPdfQuestions = [];
        hwSubmissionResult = { state: 'waiting', message: '等待题目数据加载...' };
        hwGroupId = ''; hwNodeId = ''; hwPaperId = ''; hwActiveTaskKey = '';
        hwRecordId = ''; hwResultFilter = 'all'; hwResultOpen = false; hwActiveTab = 'answer';
        hwUpdateUI();
    }
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
    try { _m = GM_getValue('xy_schedule_last_mode', 'sequence'); if (!_m) _m = 'sequence'; } catch(e) { _m = 'sequence'; }

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
            if (q.infinite) q.strategy = 'infinite';
            else if (q.duration === -1) q.strategy = 'infinite';
            else q.strategy = 'duration';
            delete q.infinite;
        }
        if (!q.strategy) q.strategy = 'until_done';
        
        if (q.strategy === 'duration' && (!q.duration || q.duration < 1)) q.duration = 30;
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

    function saveScheduleState() {
        GM_setValue('xy_schedule_queue', JSON.stringify(xyScheduleState.queue));
        GM_setValue('xy_schedule_running', xyScheduleState.isRunning);
        GM_setValue('xy_schedule_paused', xyScheduleState.isPaused);
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
    const courseResourceRequests = new Map();
    const courseResourcesCacheByGroup = new Map();
    const downloadResourceRequests = new Map();
    let downloadPanelRequestSeq = 0;
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

    
    let dynamicRefreshTimeoutId = null;
    let refreshCountdownTimer = null;
    let lastRefreshStrategy = 'none';

    function syncHardwareMute() { document.dispatchEvent(new CustomEvent('xy-volume-change', { detail: { mute: appState.hardwareMute } })); }
    function getCourseGroupId() { const match = window.location.href.match(/(?:mycourse|course)\/(\d+)/); return match ? match[1] : null; }
    function isActiveCourseHomePage() { return /^\/app\/jx-web\/mycourse\/?$/.test(window.location.pathname); }
    function getNodeId() { const match = window.location.href.match(/resource\/\d+\/(\d+)/); return match ? match[1] : null; }
    function getPaperId() {
        
        let match = window.location.href.match(/course_paper\/mycourse\/\d+\/(\d+)/);
        if (match) return match[1];
        
        match = window.location.href.match(/resource\/(\d+)\/(\d+)/);
        return match ? match[2] : null;
    }
    function getResourceNodeId() {
        
        let match = window.location.href.match(/course_paper\/mycourse\/\d+\/\d+\/(\d+)/);
        if (match) return match[1];
        
        match = window.location.href.match(/resource\/(\d+)\//);
        return match ? match[1] : null;
    }

    function isCourseDirPage() {
        return /\/mycourse\/\d+(?:\/resource(?:\/\d+)?)?\/?$/.test(window.location.pathname);
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    function getCookie(keyword = 'prd-access-token') { for (const cookie of document.cookie.split('; ')) { const [name, value] = cookie.split('='); if (name.includes(keyword)) return value; } return null; }
    async function getAuthToken() { const token = getCookie(); if (token) return token; throw new Error('未找到Token'); }

    const xyOverviewState = {
        isOpen: false,
        courseId: '',
        requestSeq: 0,
        userId: '',
        currentData: null,
        cache: new Map(),
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

    function xyOverviewNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function xyOverviewFormatMinutes(value) {
        const total = Math.max(0, Math.round(xyOverviewNumber(value)));
        const hours = Math.floor(total / 60);
        const minutes = total % 60;
        if (hours && minutes) return `${hours} 小时 ${minutes} 分钟`;
        if (hours) return `${hours} 小时`;
        return `${minutes} 分钟`;
    }

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

    function xyOverviewNormalizeTasks(data) {
        if (!Array.isArray(data)) return [];
        return data.filter(task => task && typeof task === 'object').map(task => {
            const status = xyOverviewTaskStatus(task);
            return {
                title: String(task.title || '未命名任务'),
                totalScore: Math.max(0, xyOverviewNumber(task.total_score)),
                myScore: task.my_score === null || task.my_score === undefined ? null : xyOverviewNumber(task.my_score),
                answerTime: task.answer_time || '',
                parentId: task.parent_id === null || task.parent_id === undefined ? '' : String(task.parent_id),
                nodeId: task.node_id === null || task.node_id === undefined ? '' : String(task.node_id),
                status
            };
        });
    }

    async function xyOverviewGetUserId() {
        if (xyOverviewState.userId) return xyOverviewState.userId;
        const data = await xyOverviewFetchJson('/api/jx-auth/oauth2/info');
        const userId = data?.info?.id;
        if (!userId) throw new Error('无法识别当前用户');
        xyOverviewState.userId = String(userId);
        return xyOverviewState.userId;
    }

    function xyOverviewErrorMessage(reason) {
        const message = reason instanceof Error ? reason.message : String(reason || '数据加载失败');
        if (/Token|登录|401|403/.test(message)) return '登录状态已失效，请刷新页面后重试';
        return message;
    }

    function xyOverviewRenderLoading() {
        const content = document.getElementById('xy-overview-content');
        if (!content) return;
        content.innerHTML = `
            <div class="xy-overview-loading">
                <span class="xy-overview-spinner" aria-hidden="true"></span>
                <span>正在读取课程学习数据...</span>
            </div>`;
    }

    function xyOverviewRenderErrorModule(title, message) {
        return `
            <div class="xy-overview-panel xy-overview-error">
                <div class="xy-overview-panel-title">${escapeHtml(title)}</div>
                <div>${escapeHtml(message)}</div>
            </div>`;
    }

    function xyOverviewRender(data) {
        const content = document.getElementById('xy-overview-content');
        if (!content || !data) return;

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
            summaryHtml = `
                <div class="xy-overview-grid">
                    <div class="xy-overview-panel xy-overview-metric">
                        <div class="xy-overview-label">学习时长</div>
                        <div class="xy-overview-value">${escapeHtml(durationValue)}</div>
                        <div class="xy-overview-meta">学习 ${portrait.days} 天 · 日均 ${escapeHtml(xyOverviewFormatMinutes(portrait.average))}</div>
                    </div>
                    <div class="xy-overview-panel xy-overview-metric">
                        <div class="xy-overview-label">任务完成度</div>
                        <div class="xy-overview-value">${escapeHtml(completionValue)}</div>
                        ${completionProgress}
                        <div class="xy-overview-meta">${escapeHtml(completionMeta)}</div>
                    </div>
                </div>`;
        }

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
            const rows = data.tasks.data.map((task, taskIndex) => {
                const scoreText = task.status.key === 'graded'
                    ? `${task.myScore ?? 0} / ${task.totalScore}`
                    : `— / ${task.totalScore}`;
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
                <div class="xy-overview-panel xy-overview-task-panel">
                    <div class="xy-overview-panel-title">
                        <span>作业分数</span>
                        <span class="xy-overview-count">${data.tasks.data.length} 项</span>
                    </div>
                    <div id="xy-overview-task-list" class="xy-overview-task-list">${rows}</div>
                </div>`;
        }

        content.innerHTML = `${summaryHtml}${tasksHtml}`;
    }

    async function xyOverviewLoad(courseId, force = false) {
        const normalizedCourseId = courseGroupKey(courseId);
        if (!normalizedCourseId) return;

        const cached = xyOverviewState.cache.get(normalizedCourseId);
        if (!force && cached && Date.now() - cached.loadedAt < xyOverviewState.cacheTtl) {
            xyOverviewState.courseId = normalizedCourseId;
            xyOverviewState.currentData = cached;
            xyOverviewRender(cached);
            return;
        }

        const requestSeq = ++xyOverviewState.requestSeq;
        xyOverviewState.courseId = normalizedCourseId;
        xyOverviewRenderLoading();

        const portraitPromise = xyOverviewGetUserId().then(userId => xyOverviewFetchJson(
            `/api/jx-stat/ads/user/student?group_id=${encodeURIComponent(normalizedCourseId)}&user_id=${encodeURIComponent(userId)}`
        ));
        const tasksPromise = xyOverviewFetchJson(
            `/api/jx-stat/group/task/survey/student?group_id=${encodeURIComponent(normalizedCourseId)}`
        );
        const courseNamePromise = getCourseNameFromAPI(normalizedCourseId);
        const [portraitResult, tasksResult, courseNameResult] = await Promise.allSettled([
            portraitPromise,
            tasksPromise,
            courseNamePromise
        ]);

        const routeCourseId = courseGroupKey(getCourseGroupId());
        const isCourseHomeTarget = isActiveCourseHomePage()
            && xyOverviewState.isOpen
            && xyOverviewState.courseId === normalizedCourseId;
        if (requestSeq !== xyOverviewState.requestSeq || (routeCourseId ? routeCourseId !== normalizedCourseId : !isCourseHomeTarget)) return;

        const result = {
            courseId: normalizedCourseId,
            courseName: courseNameResult.status === 'fulfilled' ? (courseNameResult.value || '') : '',
            loadedAt: Date.now(),
            portrait: portraitResult.status === 'fulfilled'
                ? { data: xyOverviewNormalizePortrait(portraitResult.value), error: '' }
                : { data: null, error: xyOverviewErrorMessage(portraitResult.reason) },
            tasks: tasksResult.status === 'fulfilled'
                ? { data: xyOverviewNormalizeTasks(tasksResult.value), error: '' }
                : { data: [], error: xyOverviewErrorMessage(tasksResult.reason) }
        };
        xyOverviewState.cache.set(normalizedCourseId, result);
        xyOverviewState.currentData = result;
        xyOverviewRender(result);
    }

    function xyOverviewOpen(courseId = getCourseGroupId()) {
        const normalizedCourseId = courseGroupKey(courseId);
        if (!normalizedCourseId) {
            showToast('请先进入具体课程页面', 'warning');
            return;
        }
        const body = document.getElementById('xy-main-body');
        if (body?.style.display === 'none') document.getElementById('xy-minimize')?.click();
        const drawer = document.getElementById('xy-overview-drawer');
        if (!drawer) return;
        xyOverviewState.isOpen = true;
        drawer.style.display = 'flex';
        drawer.setAttribute('aria-hidden', 'false');
        void xyOverviewLoad(normalizedCourseId, false);
    }

    function xyOverviewClose() {
        xyOverviewState.isOpen = false;
        xyOverviewState.requestSeq++;
        const drawer = document.getElementById('xy-overview-drawer');
        if (drawer) {
            drawer.style.display = 'none';
            drawer.setAttribute('aria-hidden', 'true');
        }
    }

    function xyOverviewRefresh() {
        const courseId = getCourseGroupId() || (isActiveCourseHomePage() ? xyOverviewState.courseId : '');
        if (!courseId) return;
        xyOverviewState.cache.delete(courseGroupKey(courseId));
        void xyOverviewLoad(courseId, true);
    }

    function xyOverviewOpenTask(courseId, parentId, nodeId) {
        if (!courseId || !parentId || !nodeId) {
            showToast('该任务缺少跳转信息', 'warning');
            return;
        }
        const prefix = window.location.pathname.includes('/course/') ? 'course' : 'mycourse';
        window.location.href = `/app/jx-web/${prefix}/${encodeURIComponent(courseId)}/resource/${encodeURIComponent(parentId)}/${encodeURIComponent(nodeId)}`;
    }

    function xyOverviewSyncRoute() {
        const courseId = getCourseGroupId() || '';
        const isCourseHome = isActiveCourseHomePage();
        const openButton = document.getElementById('xy-overview-open');
        if (openButton) openButton.style.display = courseId ? 'inline-flex' : 'none';

        if (!courseId) {
            if (!isCourseHome) {
                if (xyOverviewState.isOpen) xyOverviewClose();
                xyOverviewState.courseId = '';
            } else if (xyOverviewState.isOpen && xyOverviewState.currentData?.courseId === xyOverviewState.courseId) {
                xyOverviewRender(xyOverviewState.currentData);
            }
            return;
        }
        if (!xyOverviewState.isOpen) return;

        const drawer = document.getElementById('xy-overview-drawer');
        if (drawer) {
            drawer.style.display = 'flex';
            drawer.setAttribute('aria-hidden', 'false');
        }
        if (xyOverviewState.courseId !== courseId) {
            void xyOverviewLoad(courseId, false);
        } else if (xyOverviewState.currentData) {
            xyOverviewRender(xyOverviewState.currentData);
        }
    }

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
                portrait: null,
                portraitState: 'loading',
                portraitError: ''
            });
            return courses;
        }, []);
    }

    function xyCourseDashboardGroupPending(data, now = Date.now()) {
        const grouped = new Map();
        if (!Array.isArray(data)) return grouped;
        data.forEach(task => {
            const courseId = courseGroupKey(task?.group_id);
            if (!courseId) return;
            const current = grouped.get(courseId) || { actionableCount: 0, expiredCount: 0, nearestDeadline: null };
            const deadline = Date.parse(task?.end_time || '');
            if (Number.isFinite(deadline) && deadline <= now) {
                current.expiredCount++;
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

    function xyCourseDashboardSortCourses(items) {
        const getPriority = course => course?.pendingCount > 0 ? 0 : (course?.pendingCount === null || course?.pendingCount === undefined ? 1 : 2);
        return [...items].sort((left, right) => {
            const priorityDelta = getPriority(left.course) - getPriority(right.course);
            if (priorityDelta) return priorityDelta;
            const leftIndex = Number.isFinite(left.sourceIndex) ? left.sourceIndex : 0;
            const rightIndex = Number.isFinite(right.sourceIndex) ? right.sourceIndex : 0;
            if (getPriority(left.course) !== 0) return leftIndex - rightIndex;
            const leftDeadline = Number.isFinite(left.course.nearestDeadline) ? left.course.nearestDeadline : Number.POSITIVE_INFINITY;
            const rightDeadline = Number.isFinite(right.course.nearestDeadline) ? right.course.nearestDeadline : Number.POSITIVE_INFINITY;
            if (leftDeadline !== rightDeadline) return leftDeadline - rightDeadline;
            const pendingDelta = right.course.pendingCount - left.course.pendingCount;
            return pendingDelta || leftIndex - rightIndex;
        });
    }

    function xyCourseDashboardCourseStatus(course, breakdown) {
        if (course.pendingCount === null) return { key: 'unknown', label: '可做任务未知' };
        if (course.pendingCount > 0) return { key: 'pending', label: `${course.pendingCount} 项可做` };
        if (course.expiredCount > 0) return { key: 'expired', label: `${course.expiredCount} 项已截止` };
        if (!breakdown) return { key: 'idle', label: '暂无可做待办' };
        if (breakdown.taskCount === 0) return { key: 'empty', label: '暂无任务' };
        if (breakdown.finishedCount >= breakdown.taskCount) return { key: 'complete', label: '任务已完成' };
        return { key: 'idle', label: '暂无可做待办' };
    }

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

    function xyCourseDashboardIsCurrent(requestSeq) {
        return requestSeq === xyCourseDashboardState.requestSeq && isActiveCourseHomePage();
    }

    function xyCourseDashboardScheduleRender() {
        if (xyCourseDashboardState.renderTimer) return;
        xyCourseDashboardState.renderTimer = setTimeout(() => {
            xyCourseDashboardState.renderTimer = null;
            xyCourseDashboardRender();
        }, 40);
    }

    function xyCourseDashboardApplyCache(cached) {
        xyCourseDashboardState.courses = cached.courses.map(course => ({
            ...course,
            portrait: course.portrait ? { ...course.portrait } : null
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

    function xyCourseDashboardRefresh() {
        xyCourseDashboardState.cache = null;
        void xyCourseDashboardLoad(true);
    }

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

        list.innerHTML = visibleCourses.map(({ course, sourceIndex }) => {
            const breakdown = xyCourseDashboardTaskBreakdown(course);
            const courseStatus = xyCourseDashboardCourseStatus(course, breakdown);
            const deadline = xyCourseDashboardFormatDeadline(course.nearestDeadline);
            let portraitHtml = '<div class="xy-course-dashboard-course-meta">正在读取完成度与学习时长...</div>';
            if (course.portraitState === 'error') {
                portraitHtml = '<div class="xy-course-dashboard-course-meta is-error">完成度与学习时长暂不可用</div>';
            } else if (breakdown) {
                const duration = course.portrait.duration > 0 ? xyOverviewFormatMinutes(course.portrait.duration) : '暂无时长';
                const breakdownText = breakdown.actionableCount === null
                    ? `已完成 ${breakdown.finishedCount} / ${breakdown.taskCount} · 可做与截止暂不可用`
                    : `已完成 ${breakdown.finishedCount} · 可做 ${breakdown.actionableCount} · 已截止 ${breakdown.expiredCount}`;
                const progressHtml = breakdown.taskCount > 0
                    ? `<div class="xy-course-dashboard-progress" role="progressbar" aria-label="课程任务完成度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(breakdown.rate)}">
                           <span style="width:${breakdown.rate}%"></span>
                       </div>`
                    : '';
                portraitHtml = `${progressHtml}
                    <div class="xy-course-dashboard-course-meta">
                        <span>${breakdown.taskCount > 0 ? escapeHtml(breakdownText) : '暂无任务'}</span>
                        <span>${escapeHtml(duration)}</span>
                    </div>`;
            }
            return `
                <div class="xy-course-dashboard-course" data-course-index="${sourceIndex}">
                    <div class="xy-course-dashboard-course-main" role="link" tabindex="0">
                        <div class="xy-course-dashboard-course-head">
                            <strong>${escapeHtml(course.courseName)}</strong>
                            <span class="xy-course-dashboard-status is-${courseStatus.key}">${escapeHtml(courseStatus.label)}</span>
                        </div>
                        ${course.termName ? `<div class="xy-course-dashboard-term">${escapeHtml(course.termName)}</div>` : ''}
                        ${portraitHtml}
                        ${deadline ? `<div class="xy-course-dashboard-deadline">最近待办截止：${escapeHtml(deadline)}</div>` : ''}
                    </div>
                    <div class="xy-course-dashboard-actions">
                        <button class="xy-mini-btn" type="button" data-course-action="enter">进入课程</button>
                        <button class="xy-mini-btn" type="button" data-course-action="overview">学情</button>
                    </div>
                </div>`;
        }).join('');
    }

    function cleanName(str) { if (!str) return ""; return str.replace(/[\u200B-\u200D\uFEFF]/g, '').trim(); }
    function escapeHtml(value) { if (value === null || value === undefined) return ''; const div = document.createElement('div'); div.textContent = String(value); return div.innerHTML; }
    function normalizeDownloadId(value) {
        if (value === null || value === undefined) return null;
        const id = String(value).trim();
        return id ? id : null;
    }
    function dlResourceId(resource) {
        if (!resource || typeof resource !== 'object') return null;
        return normalizeDownloadId(resource.id)
            ?? normalizeDownloadId(resource.resource_id)
            ?? normalizeDownloadId(resource.node_id)
            ?? normalizeDownloadId(resource.resourceId)
            ?? normalizeDownloadId(resource.nodeId);
    }
    function dlQuoteId(resource) {
        if (!resource || typeof resource !== 'object') return null;
        return normalizeDownloadId(resource.quote_id)
            ?? normalizeDownloadId(resource.quoteId)
            ?? dlResourceId(resource);
    }
    function dlResourceValues(value) {
        if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object');
        if (!value || typeof value !== 'object') return [];
        if (dlResourceId(value) !== null || dlQuoteId(value) !== null || value.name || value.title) return [value];
        return Object.values(value).filter(item => item && typeof item === 'object');
    }
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

    
    
    function extractFilesFromResources(arr) {
        let res = [];
        let __seq = 0;
        const FILE_EXT_RE = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i;
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
                    const isMedia = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
                    const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
                    
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

    
    
    
    function switchToZone(newZone) {
        if (appState.activeZone === newZone) {
            if (newZone === 'courses') {
                const viewCourses = document.getElementById('xy-view-courses');
                if (viewCourses) viewCourses.style.display = 'flex';
                const segZone = document.getElementById('xy-seg-zone');
                if (segZone) segZone.textContent = '📚 课程总览';
                const courseList = document.getElementById('xy-course-dashboard-list');
                if (courseList && !courseList.childElementCount) xyCourseDashboardRender();
            }
            return;
        }
        const oldZone = appState.activeZone;
        appState.activeZone = newZone;

        if (oldZone === 'course') {
            toggleRecord(false); 
        }
        
        
        if (newZone === 'standby' || newZone === 'courses' || newZone === 'disc') {
            clearDynamicRefresh();
            lastRefreshStrategy = 'none';
        }
        
        
        const superConsole = document.getElementById('xy-super-console');
        if (superConsole) {
            superConsole.style.display = 'flex';
        }
        
        const viewC = document.getElementById('xy-view-course'), viewD = document.getElementById('xy-view-disc'), viewS = document.getElementById('xy-view-standby'), viewCourses = document.getElementById('xy-view-courses'), viewDL = document.getElementById('xy-view-download'), viewHW = document.getElementById('xy-view-hw'), viewDIR = document.getElementById('xy-view-dir'), segZone = document.getElementById('xy-seg-zone');
        if (viewC && viewD && viewS && viewCourses && viewDL && segZone) {
            viewC.style.display = newZone === 'course' ? 'block' : 'none';
            viewD.style.display = newZone === 'disc' ? 'block' : 'none';
            viewS.style.display = newZone === 'standby' ? 'flex' : 'none';
            viewCourses.style.display = newZone === 'courses' ? 'flex' : 'none';
            viewDL.style.display = newZone === 'download' ? 'block' : 'none';
            if (viewHW) viewHW.style.display = newZone === 'hw' ? 'block' : 'none';
            if (viewDIR) viewDIR.style.display = newZone === 'dir' ? 'block' : 'none';

            const zoneLabel = newZone === 'course' ? '📚 刷课区' : newZone === 'courses' ? '📚 课程总览' : newZone === 'disc' ? '💭 讨论区' : newZone === 'download' ? '📥 下载区' : newZone === 'hw' ? '📝 作业区' : newZone === 'dir' ? '📂 课程目录' : '🏝️ 待命区';
            segZone.innerHTML = zoneLabel;
            segZone.classList.add('active');
        }

        if (oldZone !== 'uninitialized') {
            const zoneName = newZone === 'course' ? '视频/文档自动引擎' : newZone === 'courses' ? '进行中课程总览' : newZone === 'disc' ? '互动点赞引擎' : newZone === 'download' ? '课件下载区' : newZone === 'hw' ? '作业答题台' : newZone === 'dir' ? '课程目录区' : '系统隔离待命区';
            logMsg(`📍 底层指令：已切换至【${zoneName}】`, newZone === 'standby' ? 'warning' : 'success', false);
        }

        if (newZone === 'course') {
            ensureAutoRecord();
            globalTaskStatusChecker(true);
            
            const currentNodeId = getNodeId();
            if (!appState._lastCourseNodeId || appState._lastCourseNodeId !== currentNodeId) {
                appState._lastCourseNodeId = currentNodeId;
                appState.docReadTime = 0;
                appState.lastDocSubmitTime = 0;
                appState.videoScriptProgress = undefined;
                appState.isTaskCompleted = false;
            }
        }
        if (newZone === 'dir') {
            setTimeout(loadCourseDirectory, 150);
        }
        if (newZone === 'courses') xyCourseDashboardRender();
    }

    
    let _radarCache = { data: null, time: 0, promise: null };
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

    async function runLowLevelScanner() {
        if (!isActiveCourseHomePage()) xyCourseDashboardDeactivate();
        
        if (appState.activeZone === 'download') {
            const currentGroupId = getCourseGroupId();
            const currentGroupKey = courseGroupKey(currentGroupId);
            if (!currentGroupKey) {
                downloadPanelRequestSeq++;
                appState.downloadCourseGroupKey = '';
                appState.downloadCourseName = '';
                appState.downloadFiles = [];
                appState.downloadSelectedIds.clear();
                appState.downloadSearchKeyword = '';
                appState.downloadSortMap = {};
                appState.downloadDirTree = null;
                renderDownloadList();
                switchToZone('standby');
                return;
            }
            if (appState.downloadCourseGroupKey !== currentGroupKey) {
                void loadDownloadPanel(currentGroupId).catch(e => {
                    console.warn('[小雅] 下载区课程切换加载失败:', e);
                });
            }
            return;
        }
        if (appState.discLockedUrl === window.location.href) { switchToZone('disc'); return; }
        const groupId = getCourseGroupId(); const nodeId = getNodeId() || getResourceNodeId() || getPaperId();
        const scanGroupKey = courseGroupKey(groupId);
        const scanNodeKey = courseGroupKey(nodeId);
        const isSameScanContext = () => isCurrentCourseGroup(scanGroupKey)
            && courseGroupKey(getNodeId() || getResourceNodeId() || getPaperId()) === scanNodeKey;
        if (!groupId || !nodeId) {
            if (isActiveCourseHomePage()) {
                switchToZone('courses');
                void xyCourseDashboardLoad(false);
            } else if (isCourseDirPage()) {
                if (appState.activeZone !== 'dir') logMsg('📂 侦测到课程目录页 → 已切换课程目录区', 'success', false);
                switchToZone('dir');
                setTimeout(loadCourseDirectory, 200);
            } else {
                switchToZone('standby');
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
                    if (!appState.isTaskCompleted && appState.activeZone === 'course') {
                        appState.isTaskCompleted = true;
                        logMsg('✅ [雷达秒判] 当前任务已在全局雷达达成，瞬间放行！', 'success', false);
                        updateCourseUI();
                    }
                }
            }
        } catch(e) { console.warn('[小雅] 全局任务雷达请求失败', e); }

        if (!isSameScanContext()) return;
        if (taskType === 1) { switchToZone('course'); return; }
        else if (taskType === 6) { switchToZone('disc'); return; }
        else if (taskType > 1 && taskType <= 5) {
            if (appState.activeZone !== 'hw') logMsg('📝 侦测到【测验/作业/问卷】→ 已切换作业区', 'success', false);
            switchToZone('hw');
            setTimeout(hwProactiveFetchData, 300);
            return;
        }

        const htmlStr = document.body ? document.body.innerHTML : '';
        
        if (window.location.href.includes('/course_paper/')) {
            if (appState.activeZone !== 'hw') logMsg('📝 侦测到【作业/测验页面】→ 已切换作业区', 'success', false);
            switchToZone('hw');
            setTimeout(hwProactiveFetchData, 300);
            return;
        }
        if (document.querySelector('video, iframe[src*="ow365"], iframe[src*="office"], .prism-player, .aliplayer, .xy_disk_preview, .pdf-viewer')) {
            switchToZone('course'); return;
        }
        if (document.querySelector('.discussion-container, .jx-discussion, [class*="discuss"]') || htmlStr.includes('发表评论') || htmlStr.includes('全部评论')) {
            switchToZone('disc'); return;
        }
        
        if (appState.activeZone === 'hw' && window.location.href.includes('/resource/') && getPaperId()) {
            return;
        }
        if (isCourseDirPage()) {
            if (appState.activeZone !== 'dir') logMsg('📂 侦测到课程目录页 → 已切换课程目录区', 'success', false);
            switchToZone('dir');
            setTimeout(loadCourseDirectory, 200);
            return;
        }
        switchToZone('standby');
    }

    function courseGroupKey(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    function isCurrentCourseGroup(groupId) {
        const expected = courseGroupKey(groupId);
        return !!expected && courseGroupKey(getCourseGroupId()) === expected;
    }

    async function loadCourseResources(groupId) {
        const key = courseGroupKey(groupId);
        if (!key) return null;

        const cached = courseResourcesCacheByGroup.get(key);
        if (cached) {
            if (isCurrentCourseGroup(key)) {
                appState.courseResourcesCache = cached;
                appState.lastCourseGroupId = key;
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
                    appState.courseResourcesCache = data.data;
                    appState.lastCourseGroupId = key;
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

    
    function dirUnitChildren(n) {
        return (n && n._children) || [];
    }

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
        return !/\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(String(n.name || n.title || ''));
    }

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

    function dirFileSize(n) {
        const s = Number(n.file_size || n.size || 0);
        if (!s) return '';
        return s > 1048576 ? (s / 1048576).toFixed(1) + 'MB' : (s / 1024).toFixed(0) + 'KB';
    }

    function countDirFiles(nodes) {
        let c = 0;
        (Array.isArray(nodes) ? nodes : []).forEach(n => {
            if (dirUnitChildren(n).length) c += countDirFiles(dirUnitChildren(n));
            else c++;
        });
        return c;
    }

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

    function renderCourseDirectory(nodes) {
        const box = document.getElementById('xy-dir-list');
        if (!box) return;
        box.innerHTML = buildDirHtml(nodes, 0);
    }

    function countVisibleFiles(node, visibleIds) {
        if (!dirIsUnit(node)) return visibleIds.has(node._id) ? 1 : 0;
        return dirUnitChildren(node).reduce((s, k) => s + countVisibleFiles(k, visibleIds), 0);
    }

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
                const checked = appState.downloadSelectedIds.has(String(n._id));
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

    
    function dlParseTs(v) {
        if (v === undefined || v === null || v === '') return 0;
        if (typeof v === 'number') return (v < 1e12) ? v * 1000 : v;
        const t = Date.parse(v);
        return Number.isFinite(t) ? t : 0;
    }

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
                    return /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
                }).map(r => {
                    const id = dlResourceId(r);
                    if (id === null) return null;
                    return {
                        id,
                        nodeId: normalizeDownloadId(r.node_id) ?? normalizeDownloadId(r.nodeId) ?? id,
                        name: r.name || r.title || '未知文件',
                        type: /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test((r.name || '').toLowerCase()) ? 'video' : 'doc',
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

    // 与“小雅爬爬爬”的 handleFetchDownload 保持同一条链路：
    // fetch(带 Authorization) → ReadableStream 逐块读取 → Blob → a.click()。
    // onProgress 只用于显示当前文件进度，不改变批量下载的完成计数。
    function downloadFile(url, filename, signal, onProgress) {
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
                    a.download = filename;
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

    function formatDownloadBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
        return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

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
    function setDownloadButtonsState(downloading, paused) {
        const batchBtn = document.getElementById('xy-dl-batch-download');
        const stopBtn = document.getElementById('xy-dl-stop');
        const pauseBtn = document.getElementById('xy-dl-pause');
        if (batchBtn) { batchBtn.style.display = downloading ? 'none' : ''; batchBtn.disabled = false; }
        if (stopBtn) stopBtn.style.display = downloading ? '' : 'none';
        if (pauseBtn) {
            const canPause = appState.downloadMode === 'batch';
            pauseBtn.style.display = downloading && canPause ? '' : 'none';
            pauseBtn.textContent = paused ? '▶️ 继续' : '⏸️ 暂停';
        }
    }

    // 单个下载和批量下载统一走同一个队列执行器，确保进度、终止和状态互不打架。
    function stopBatchDownload() {
        const mode = appState.downloadMode;
        const controller = appState.downloadAbortController;
        if (!controller) return;
        controller.abort();
        appState.downloadPaused = false;
        logMsg(mode === 'single' ? '⏹️ 用户终止了单文件下载' : '⏹️ 用户终止了批量下载', 'info', true);
    }

    async function runDownloadQueue(files, mode, activeButton = null) {
        const queue = Array.isArray(files) ? files.filter(file => file && file.name) : [];
        if (queue.length === 0) return;
        if (appState.downloadAbortController) {
            showToast('已有下载任务进行中，请等待完成或先终止当前任务', 'warning');
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;
        const originalButtonText = activeButton ? activeButton.textContent : '';
        const total = queue.length;
        let done = 0;
        let failed = 0;
        appState.downloadAbortController = controller;
        appState.downloadMode = mode;
        appState.downloadPaused = false;
        if (activeButton) {
            activeButton.disabled = true;
            activeButton.textContent = '⏳';
        }
        setDownloadButtonsState(true, false);
        updateDownloadProgress(0, total);

        try {
            for (const file of queue) {
                if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');
                while (appState.downloadPaused && !signal.aborted) await sleep(300);
                if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');

                updateDownloadProgress(done + failed, total);
                let lastProgress = { receivedBytes: 0, totalBytes: 0, percent: null };
                let fileSucceeded = false;
                try {
                    const quoteId = normalizeDownloadId(file.quoteId) ?? dlQuoteId(file);
                    const url = await getDownloadUrl(quoteId, signal);
                    if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');
                    if (!url) {
                        failed++;
                        logMsg('❌ 获取失败: ' + file.name, 'error', true);
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
                    logMsg('❌ 下载失败: ' + file.name, 'error', true);
                }

                if (signal.aborted) throw new DOMException('用户终止下载', 'AbortError');
                updateDownloadProgress(done + failed, total, file.name, fileSucceeded ? 100 : lastProgress.percent, lastProgress.receivedBytes, lastProgress.totalBytes);
                if (done + failed < total && !appState.downloadPaused) await sleep(500);
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
            if (appState.downloadAbortController === controller) appState.downloadAbortController = null;
            appState.downloadMode = 'idle';
            appState.downloadPaused = false;
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

    async function batchDownloadSelected() {
        const selected = appState.downloadFiles.filter(f => {
            const id = normalizeDownloadId(f.id);
            return id !== null && appState.downloadSelectedIds.has(id);
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

    
    function dlUnitCompare(a, b) {
        const sortMap = appState.downloadSortMap || {};
        const ap = String(a.path || '').split('/').filter(Boolean);
        const bp = String(b.path || '').split('/').filter(Boolean);
        const minLen = Math.min(ap.length, bp.length);
        for (let i = 0; i < minLen; i++) {
            if (ap[i] !== bp[i]) return (sortMap[ap[i]] || 0) - (sortMap[bp[i]] || 0);
        }
        if (ap.length !== bp.length) return ap.length - bp.length;
        return (a.order || 0) - (b.order || 0);
    }

    async function handleSingleDownloadClick(event, singleButton) {
        if (!singleButton) return;
        event.preventDefault();
        event.stopPropagation();

        const fid = normalizeDownloadId(singleButton.getAttribute('data-fid'));
        const file = fid === null ? null : appState.downloadFiles.find(f => [f.id, f.nodeId, f.quoteId]
            .some(value => normalizeDownloadId(value) === fid));
        // 优先使用按钮生成时绑定的值，避免列表刷新后状态映射短暂不一致。
        const quoteId = normalizeDownloadId(singleButton.getAttribute('data-quote-id'))
            ?? (file ? dlQuoteId(file) : null);
        const fileName = singleButton.getAttribute('data-file-name') || file?.name || '未知文件';
        if (quoteId === null) {
            console.warn('[小雅] 单文件下载缺少 quote_id:', { fid, fileName, button: singleButton });
            showToast('找不到下载资源编号，请刷新下载列表', 'error');
            return;
        }

        await runDownloadQueue([{ id: fid, quoteId, name: fileName }], 'single', singleButton);
    }

    function bindDownloadButtons(container) {
        if (!container) return;
        container.querySelectorAll('.xy-dl-single').forEach(button => {
            button.onclick = event => { void handleSingleDownloadClick(event, button); };
        });
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
        const typeSet = appState.downloadTypeFilter;
        const filtered = appState.downloadFiles.filter(f => {
            if (typeSet && typeSet.size > 0 && !typeSet.has(dlFileType(f.name))) return false;
            return !keyword || f.name.toLowerCase().includes(keyword);
        });
        
        const mode = appState.downloadSortMode;
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
        if (mode === 'unit' && appState.downloadDirTree && appState.downloadDirTree.length) {
            const visibleIds = new Set(filtered.map(f => String(f.id)));
            let treeHtml = buildDownloadTreeHtml(appState.downloadDirTree, visibleIds, 0);
            if (!treeHtml) treeHtml = `<div style="color:${T('#94a3b8','#64748b')}; text-align:center; padding:24px 0; font-size:13px;">📭 无匹配文件</div>`;
            listDiv.innerHTML = treeHtml;
            bindDownloadButtons(listDiv);
            return;
        }
        const showUnit = mode === 'unit';
        const showTime = mode === 'time_desc' || mode === 'time_asc';
        let html = '';
        filtered.forEach(f => {
            const checked = appState.downloadSelectedIds.has(String(f.id));
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

    async function loadDownloadPanel(groupId) {
        const requestId = ++downloadPanelRequestSeq;
        const statusEl = document.getElementById('xy-dl-status');
        const nameEl = document.getElementById('xy-dl-course-name');
        const requestedGroupKey = courseGroupKey(groupId);
        if (requestedGroupKey && !isCurrentCourseGroup(requestedGroupKey)) return;
        const isCurrentPanelRequest = () => requestId === downloadPanelRequestSeq
            && isCurrentCourseGroup(requestedGroupKey);
        appState.downloadCourseGroupKey = requestedGroupKey;
        appState.downloadCourseName = '';
        appState.downloadSortMap = {};
        appState.downloadDirTree = null;
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

        try {
            const apiName = await getCourseNameFromAPI(groupId);
            if (!isCurrentPanelRequest()) return;
            appState.downloadCourseName = apiName || '课件资源';
            if (nameEl) nameEl.textContent = '📦 ' + appState.downloadCourseName;

            const resourceResult = await fetchDownloadResources(groupId);
            if (!isCurrentPanelRequest()) return;
            if (resourceResult === null) {
                appState.downloadCourseGroupKey = '';
                appState.downloadCourseName = '';
                appState.downloadFiles = [];
                appState.downloadSortMap = {};
                appState.downloadDirTree = null;
                if (statusEl) statusEl.innerHTML = `<span style="color:${T('#f87171','#b91c1c')};">⚠️ 课件资源加载失败，可点击刷新重试</span>`;
                renderDownloadList();
                return;
            }
            appState.downloadSortMap = resourceResult.sortMap;
            appState.downloadDirTree = resourceResult.dirTree;
            appState.downloadFiles = resourceResult.files;
            if (statusEl) {
                statusEl.innerHTML = resourceResult.files.length > 0
                    ? `<span style="color:${T('#34d399','#065f46')};">✅ 已加载 ${resourceResult.files.length} 个课件文件</span>`
                    : `<span style="color:${T('#94a3b8','#64748b')};">📭 当前课程无可下载的课件</span>`;
            }
            renderDownloadList();
        } catch (e) {
            if (!isCurrentPanelRequest()) return;
            appState.downloadCourseGroupKey = '';
            appState.downloadCourseName = '';
            appState.downloadFiles = [];
            appState.downloadSortMap = {};
            appState.downloadDirTree = null;
            if (statusEl) statusEl.innerHTML = `<span style="color:${T('#f87171','#b91c1c')};">⚠️ 课件资源加载异常，可点击刷新重试</span>`;
            renderDownloadList();
            console.warn('[小雅] 下载区面板加载失败:', e);
        }
    }

    function enterDownloadZone() {
        if (appState.activeZone !== 'download') appState.prevZone = appState.activeZone;
        const groupId = getCourseGroupId();
        switchToZone('download');
        void loadDownloadPanel(groupId).catch(e => {
            console.warn('[小雅] 下载区加载失败:', e);
        });
    }

    
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
        return task.id; 
    }

    
    
    
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

    function logMsg(msg, type = 'info', isSilent = false) {
        const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#38bdf8', silent: '#94a3b8' };
        const color = isSilent ? colors.silent : (colors[type] || colors.info);
        const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
        const logStr = `[${time}] ${msg}`;
        sessionLogs.push({ text: logStr, color: color });
        if (sessionLogs.length > 80) sessionLogs.shift();
        
        
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
                console.log('[小雅辅助·作业区] 已捕获 fetch 题目数据包');
                hwCaptureParams(rawUrl);
                const response = await _hw_nativeFetch.apply(this, arguments);
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
                console.log('[小雅辅助·作业区] 已捕获 XHR 题目数据包');
                hwCaptureParams(self._hw_url);
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

                appState.jumpFailCount = 0; 
                setTimeout(() => { 
                    window.location.href = `/app/jx-web/${pathPrefix}/${targetTask.group_id}/resource/${resId}/${targetTask.node_id}`; 
                }, 500);
                
                setTimeout(() => { isJumpingLock = false; }, 5000);
                return;
            }
            
            appState.jumpFailCount++;
            const failCount = appState.jumpFailCount;
            
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

    
    
    
    let deepCamoTimers = { scroll: null, keyboard: null, click: null };

    function simulateNaturalScroll() {
        if (!appState.deepCamouflage || !appState.camoScrollActive) return;
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
                    appState.recordCount++; appState.lastRecordDate = new Date();
                    appState.totalTime += 30;
                    sessionStorage.setItem('xy_recordCount', appState.recordCount); sessionStorage.setItem('xy_totalTime', appState.totalTime); updateCourseUI();
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

    async function sendRecordRequest() {
        if (appState.activeZone !== 'course') return;
        if (isRecordSending) return;
        const groupId = getCourseGroupId(); const resourceId = getNodeId(); if (!groupId || !resourceId) return;
        isRecordSending = true;
        try { await _origSendRecordRequest(); } catch (e) { console.warn('[小雅] sendRecord 失败', e.message || e); }
        isRecordSending = false;
    }

    
    const _persistentIntervals = new Set();
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

    
    
    
    let keepaliveWatchdogTimer = null;
    let keepaliveLastBeatTime = 0;

    function startKeepaliveWatchdog() {
        if (keepaliveWatchdogTimer) return;
        keepaliveLastBeatTime = Date.now();
        keepaliveWatchdogTimer = setInterval(() => {
            if (!appState.keepaliveEnabled || appState.activeZone !== 'course') return;
            
            const gap = Date.now() - keepaliveLastBeatTime;
            if (gap > 75000) {
                logMsg('💓 [保活] 检测到心跳缺口 ' + Math.round(gap / 1000) + 's，强制补发', 'warning', true);
                sendRecordRequest().then(() => { keepaliveLastBeatTime = Date.now(); });
            }
            
            if (!recordIntervalTimer && appState.recordActive) {
                logMsg('💓 [保活] 心跳定时器丢失，自动重建', 'warning', true);
                if (recordIntervalTimer) recordIntervalTimer.clear();
                recordIntervalTimer = createPersistentInterval(sendRecordRequest, 30000, 20);
            }
        }, 10000);
        logMsg('💓 后台保活看门狗已启动（10s巡检）', 'silent', true);
    }

    function stopKeepaliveWatchdog() {
        if (keepaliveWatchdogTimer) { clearInterval(keepaliveWatchdogTimer); keepaliveWatchdogTimer = null; }
    }

    
    
    

    let watchdogLastActiveTime = Date.now();
    let lastAutoActionMinute = '';

    
    createPersistentInterval(async () => {
        await runLowLevelScanner(); 

        checkDynamicRefresh();

        if (appState.activeZone !== 'course') {
            if (appState.activeZone === 'download' && appState.guardActive) forceDismissPopups(document);
            watchdogLastActiveTime = Date.now();
            return;
        }
        if (appState.guardActive) forceDismissPopups(document);

        appState.currentEngine = await getTaskTypeAccurate();

        
        const timeoutLimit = xyScheduleState.isRunning ? 1800000 : 180000; 
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
                            appState.videoScriptProgress = Math.round(video.currentTime);
                            appState.videoLastTime = video.currentTime;
                        }

                        if (video.currentTime - appState.videoLastTime > 3) {
                            logMsg('⚠️ 检测到拖动进度条，已弹回原位', 'warning', true);
                            video.currentTime = appState.videoLastTime;
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
        if (appState.theme === 'auto') applyTheme();
    }, 1000, 30);

    
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
        const stopBtn = document.getElementById('xy-btn-stop-scrape');
        if(btn) { btn.disabled = true; btn.innerText = "深潜抓取中..."; }

        logMsg('🧹 正在深度扫描全部评论页，自动去重收录...', 'info');

        try {
            appState.discScrapeAbort = false;
            if (stopBtn) { stopBtn.style.display = 'inline-block'; stopBtn.disabled = false; }
            let pageIndex = 1;
            const seenIds = new Set();
            while (true) {
                if (appState.discScrapeAbort) { logMsg('⏹ 已手动停止深度抓取', 'warning'); break; }
                if(btn) btn.innerText = `深潜抓取中 (第${pageIndex}页)...`;
                const list = await fetchDiscussions(20, pageIndex);
                if (!list || list.length === 0) break;

                let newInPage = 0;
                list.forEach(item => {
                    if (item && item.id && !seenIds.has(item.id)) { seenIds.add(item.id); newInPage++; }
                    const realName = decodeNickname(item.nickname);
                    if (realName && realName !== "匿名" && !realName.includes("=")) {
                        if (!appState.targetNames.includes(realName)) {
                            appState.targetNames.push(realName);
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
                if (!appState.targetNames.includes(name)) {
                    appState.targetNames.push(name);
                }
            });

            GM_setValue('xy_target_names', JSON.stringify(appState.targetNames));
            renderTargetList(document.getElementById('xy-name-search')?.value || '');
            logMsg(appState.discScrapeAbort ? `⏸ 已停止，总库现存 ${appState.targetNames.length} 人。` : `✅ 扫描到底！总库现存 ${appState.targetNames.length} 人。`, 'success');
        } catch (error) { logMsg('抓取失败，请检查网络或刷新重试', 'error'); } finally { if(stopBtn) stopBtn.style.display = 'none'; if(btn) { btn.disabled = false; btn.innerText = originalText || "🔄 手动刷新名单"; } }
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
            "🗓️ 同为有待办的课程，按最近截止时间从早到晚排序",
            "📚 无可做待办的课程保持原有顺序并排在后面",
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

    function autoLink(text) {
        
        const urlRe = /(https?:\/\/[^\s<>"']+)/gi;
        const parts = [];
        let lastIdx = 0;
        let match;
        while ((match = urlRe.exec(text)) !== null) {
            parts.push(escapeHtml(text.slice(lastIdx, match.index)));
            parts.push(`<a href="${match[0]}" target="_blank" rel="noopener" style="color:${T('#818cf8','#4f46e5')}; text-decoration:underline;" onclick="event.stopPropagation()">${escapeHtml(match[0])}</a>`);
            lastIdx = urlRe.lastIndex;
        }
        parts.push(escapeHtml(text.slice(lastIdx)));
        return parts.join('');
    }

    function renderNotice(data) {
        const contentBox = document.getElementById('xy-bc-content');
        if (!contentBox) return;
        contentBox.innerHTML =
            `<div style="padding:16px 20px;">
                <div style="font-weight:bold; color:${T('#e2e8f0','#0f172a')}; margin-bottom:12px; font-size:14px;">${autoLink(data.title || '系统公告')}</div>
                <ul style="margin:0; padding-left:18px; color:${T('#cbd5e1','#475569')}; line-height:1.6;">
                    ${(data.items || []).map(item => `<li style="margin-bottom:8px;">${autoLink(item)}</li>`).join('')}
                </ul>
            </div>`;
        contentBox.style.display = 'block';
        const arrow = document.getElementById('xy-bc-arrow');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }

    function fetchCloudIntelligence() {
        const contentBox = document.getElementById('xy-bc-content');
        if (!contentBox) return;

        
        let hasCache = false;
        try {
            const cached = GM_getValue('xy_notice_cache', '');
            if (cached) { renderNotice(JSON.parse(cached)); hasCache = true; }
        } catch (e) {  }

        
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
                    } catch (e) {  }
                },
                onerror: function() {  },
                ontimeout: function() {  }
            });
        } catch (e) {  }
    }

    
    
    
    function formatTime(s) { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60).toString().padStart(2,'0'), sec = (s%60).toString().padStart(2,'0'); return h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`; }

    function updateCourseUI() {
        if (appState.activeZone !== 'course') return;
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
            try { courseMap = JSON.parse(GM_getValue('xy_course_map', '{}')); } catch(e) {}

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
                    } catch (e) { return null; }
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

    async function fetchCourseResourcesForRadar(gid) {
        try {
            const token = await getAuthToken();
            const res = await fetch(`https://${domain}/api/jx-iresource/resource/queryCourseResources?group_id=${gid}`, { headers: { "authorization": `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data) return data.data;
        } catch(e) {}
        return null;
    }

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

    function buildRadarTaskCard(task) {
        window.xyGlobalTaskMap.set(task.task_id || task.id, task);
        const now = new Date();
        const endTime = new Date(task.end_time);
        const startTime = new Date(task.start_time);
        const isCompleted = task.finish === 2;
        const isAutoable = task.task_type === 1;
        const enableCheck = (!isCompleted) && (isAutoable || appState.isFreedomMode);
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
                    <input type="checkbox" id="xy-freedom-switch" style="opacity:0; width:0; height:0;" ${appState.isFreedomMode ? 'checked' : ''}>
                    <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:${appState.isFreedomMode?'#f59e0b':'#475569'}; border-radius:34px; transition:.4s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                        <span style="position:absolute; height:22px; width:22px; left:4px; bottom:4px; background:#e2e8f0; border-radius:50%; transition:.4s; transform:${appState.isFreedomMode?'translateX(26px)':'translateX(0)'}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>
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

    
    
    
    function optimizeScheduleOrder(tasks) {
        if (!tasks || tasks.length === 0) return [];
        const now = Date.now();
        const scored = tasks.map(task => {
            const endTime = new Date(task.end_time).getTime();
            const daysLeft = Math.max(0, (endTime - now) / (1000 * 60 * 60 * 24));
            const name = (task.name || '').toLowerCase();
            const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
            const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);

            
            const ddlScore = daysLeft < 1 ? 100 : daysLeft < 3 ? 80 : daysLeft < 7 ? 60 : daysLeft < 14 ? 40 : daysLeft < 30 ? 20 : 5;
            
            const completionPenalty = task.finish === 2 ? 0.3 : 1.0;
            
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

        
        const sorted = [];
        const remaining = [...scored];
        let lastWasVideo = null;

        while (remaining.length > 0) {
            
            remaining.forEach(item => {
                let typeBonus = 0;
                if (lastWasVideo === true && item.isDoc) typeBonus = 25; 
                if (lastWasVideo === false && item.isVideo) typeBonus = 25; 
                if (lastWasVideo === null) typeBonus = 10; 

                
                const hasOtherCourse = remaining.some(r => r.groupId !== item.groupId);
                const courseSwitchBonus = (hasOtherCourse && sorted.length > 0 && item.groupId !== sorted[sorted.length-1].groupId) ? 15 : 0;

                item.score = item.ddlScore + typeBonus + courseSwitchBonus;
            });

            
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
            const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
            const isDoc = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
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
                strategy: 'until_done', 
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

        
        xyScheduleState.lastMode = appState.mode;
        appState.mode = 'manual';
        GM_setValue('xy_play_mode', 'manual');

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
                    let minStr = currentTask.strategy === 'infinite' ? '∞' : (currentTask.strategy === 'until_done' ? '达标' : currentTask.duration);
                    let unit = (currentTask.strategy === 'until_done' || currentTask.strategy === 'infinite') ? '' : '分';
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
                return /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name) || /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|wps|csv|zip|rar|7z)$/i.test(name);
            };

            const buildSchLibCard = (task) => {
                window.xyGlobalTaskMap.set(task.task_id || task.id, task);
                const isCompleted = task.finish === 2;
                const name = (task.name || '').toLowerCase();
                const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv|m3u8|webm|mp3|wav|aac)$/i.test(name);
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
                            strategy: task.finish === 2 ? 'duration' : 'until_done',
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

            xyScheduleState.lastMode = appState.mode;
            appState.mode = 'manual';
            GM_setValue('xy_play_mode', 'manual');

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

            appState.mode = xyScheduleState.lastMode || 'sequence';
            GM_setValue('xy_play_mode', appState.mode);
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
        
        else if (appState.isJumping) {
            card.style.borderLeftColor = T('#f59e0b','#d97706');
            card.style.background = T('rgba(251,191,36,0.06)','#fffbeb');
            html = `<b style="color:${T('#fcd34d','#b45309')};">🚀 正在跳转至「${escapeHtml((task.name||'未知').substring(0,14))}」...</b>`;
        }
        else {
            const idx = xyScheduleState.currentIdx + 1;
            const name = escapeHtml((task.name || '未知').substring(0, 16));
            const elapsed = task.elapsedSec || 0;
            const elapStr = elapsed >= 3600 ? `${Math.floor(elapsed/3600)}h${Math.floor((elapsed%3600)/60)}m` : `${Math.floor(elapsed/60)}m${elapsed%60}s`;
            const durStr = task.strategy === 'infinite' ? '∞' : task.strategy === 'until_done' ? '达标连播' : `刷${task.duration||30}min`;
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
        xyScheduleState.lastMode = appState.mode;
        appState.mode = 'manual';
        GM_setValue('xy_play_mode', 'manual');
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
        appState.mode = xyScheduleState.lastMode || 'sequence';
        GM_setValue('xy_play_mode', appState.mode);
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
        appState.isJumping = false;
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
        xyScheduleState.lastMode = appState.mode;
        appState.mode = 'manual';
        GM_setValue('xy_play_mode', 'manual');
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

            
            appState.mode = 'manual'; 
            GM_setValue('xy_play_mode', 'manual');
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
            if (!appState.isJumping) {
                appState.isJumping = true;
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

        
        
        
        const desiredMode = currentTask.strategy === 'until_done' ? 'sequence' : 'loop';
        if (appState.mode !== desiredMode) {
            appState.mode = desiredMode;
            GM_setValue('xy_play_mode', desiredMode);
            updateCourseUI();
        }
        
        currentTask.elapsedSec = (currentTask.elapsedSec || 0) + 1;
        
        
        watchdogLastActiveTime = Date.now();

        if (currentTask.elapsedSec % 5 === 0) saveScheduleState(); 

        updateSchCard(); 

        
        if (window.xyUpdateScheduleProgress) window.xyUpdateScheduleProgress(currentTask);

        let isDone = false;
        
        if (currentTask.strategy === 'until_done') {
            
            if (appState.isTaskCompleted && currentTask.elapsedSec > 5) {
                isDone = true;
            }
        } else if (currentTask.strategy === 'duration') {
            
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


    function dismissSplash() {
        try { if (window._xySplashDismiss) window._xySplashDismiss(); } catch(e) {}
    }

    
    
    

    function hwEscapeHTML(v) { return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function hwSafeText(v) { return String(v??'').slice(0,32767); }
    function hwToNum(v) { const n=Number(v); return Number.isFinite(n)?n:null; }
    function hwMaybeParse(v) { if(typeof v!=='string')return v; const t=v.trim(); if(!t||/^\d+$/.test(t))return v; try{return JSON.parse(t)}catch(e){return v}; }

    function hwGetImageSrc(data={}) {
        const type=String(data.type||data.blockType||data.kind||"").toUpperCase();
        return data.src||data.imageUrl||data.image_url||data?.data?.src||data?.data?.imageUrl||data?.data?.image_url||data?.data?.file||data?.data?.url||((type.includes("IMAGE")||type=="IMG")?(data.url||data.href||data.file||data?.data?.url||data?.data?.href||data?.data?.file||""):"");
    }
    function hwGetFormula(data={}) { return data.teX||data.tex||data.latex||data.formula||data.value||data.content||data.text||data?.data?.teX||data?.data?.tex||data?.data?.latex||""; }

    function hwGetEntityByKey(em,key) {
        if(!em||typeof em!=="object")return null;
        if(Object.prototype.hasOwnProperty.call(em,key))return em[key];
        const sk=String(key);
        if(sk!==String(key)&&Object.prototype.hasOwnProperty.call(em,sk))return em[sk];
        return null;
    }

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
    function hwCollectImages(qi,parsed,optL) { if(!parsed||!Array.isArray(parsed.images))return; parsed.images.forEach(im=>{if(!im.src)return;if(!hwImageAssets.some(a=>a.qi===qi&&a.src===im.src&&a.optL===optL))hwImageAssets.push({qi,src:im.src,optL})})}

    function hwTypeLabel(t) { return {1:'[单选题]',2:'[多选题]',4:'[填空题]',5:'[判断题]',6:'[简答题]',7:'[附件题]',13:'[匹配题]'}[t]||'[其他]' }

    function hwExtractPlainText(v) {
        if(v===null||v===undefined)return'';
        const p=hwMaybeParse(v);
        if(p&&typeof p==='object'&&Array.isArray(p.blocks))return p.blocks.map(b=>b?.text||'').join('\n').trim();
        if(Array.isArray(p))return p.map(hwExtractPlainText).filter(Boolean).join('；');
        if(p&&typeof p==='object')return Object.values(p).map(hwExtractPlainText).filter(Boolean).join('；');
        return String(p).trim();
    }

    function hwExtractRichDisplay(v) {
        if(v===null||v===undefined||v==='')return'';
        const p=hwParseRichContent(v);
        return p.text||hwExtractPlainText(v);
    }

    function hwNormalizeAnswerIds(a) {
        if(Array.isArray(a))return a.map(x=>String(x).trim()).filter(Boolean);
        if(a===null||a===undefined)return[];
        const p=hwMaybeParse(a);
        if(Array.isArray(p))return p.map(x=>String(x).trim()).filter(Boolean);
        return String(p).split(/[,，、\s]+/).map(x=>x.trim()).filter(Boolean);
    }

    function hwFormatChoice(qData,answer) {
        const ids=hwNormalizeAnswerIds(answer);if(!ids.length)return'未作答';
        return ids.map(id=>{const o=qData.options?.find(x=>String(x.id)===String(id));if(!o)return id;const t=o.text?' '+o.text:'';return o.letter+'.'+t}).join('；');
    }
    function hwFormatFill(qData,answer) {
        const p=hwMaybeParse(answer);
        if(!p||typeof p!=='object'||Array.isArray(p)){const t=hwExtractPlainText(answer);return t||'未作答';}
        const parts=(qData.sItems||[]).map((it,i)=>{const v=hwExtractPlainText(p[it.id]);return'空'+(i+1)+'：'+(v||'未填')});
        return parts.length?parts.join('；'):'未作答';
    }
    function hwFormatMatching(qData,answer) {
        const p=hwMaybeParse(answer);const l=qData.matchingLeftItems||[],r=qData.matchingRightItems||[];
        if(!p||typeof p!=='object'||Array.isArray(p)){const t=hwExtractPlainText(answer);return t||'未作答';}
        const rm=new Map(r.map(x=>[String(x.id),x]));let has=false;
        const lines=l.map(li=>{const rv=p[li.id]??p[String(li.id)];const rids=hwNormalizeAnswerIds(rv);if(!rids.length)return li.letter+'. '+(li.text||'')+' => 未匹配';has=true;const rt=rids.map(id=>{const ri=rm.get(String(id));return ri?ri.letter+'. '+(ri.text||''):id}).join('、');return li.letter+'. '+(li.text||'')+' => '+rt});
        return has?lines.join('\n'):'未作答';
    }
    function hwFormatAnswer(qData,answer) {
        if(!qData)return hwExtractPlainText(answer)||'未作答';
        if(qData.type===1||qData.type===2||qData.type===5)return hwFormatChoice(qData,answer);
        if(qData.type===4)return hwFormatFill(qData,answer);
        if(qData.type===6)return hwExtractRichDisplay(answer)||'未作答';
        if(qData.type===7)return'附件题';
        if(qData.type===13)return hwFormatMatching(qData,answer);
        return hwExtractPlainText(answer)||'未作答';
    }
    function hwGetStdAnswer(qData,canShow) {
        if(!canShow||!qData)return'';
        if(qData.type===1||qData.type===2||qData.type===5){const co=(qData.options||[]).filter(o=>o.answerChecked===2);return co.map(o=>{const t=o.text?' '+o.text:'';return o.letter+'.'+t}).join('；')||''}
        if(qData.type===4){const parts=(qData.sItems||[]).map((it,i)=>{const v=hwExtractPlainText(it.answer);return v?'空'+(i+1)+'：'+v:''}).filter(Boolean);return parts.join('；')}
        if(qData.type===6&&(qData.sItems||[])[0])return hwExtractRichDisplay(qData.sItems[0].answer);
        return'';
    }
    function hwGetResultState(a,qd) {
        if(!a)return{label:'未作答',tone:'muted'};
        const s=hwToNum(a.score),c=hwToNum(a.correct),fs=hwToNum(qd?.score);
        if(c===2||(s!==null&&fs!==null&&fs>0&&s>=fs))return{label:'正确',tone:'ok'};
        if(s!==null&&s>0)return{label:'部分得分',tone:'partial'};
        if(c===1||(s!==null&&s===0))return{label:'错误',tone:'bad'};
        return{label:'待批改',tone:'pending'};
    }

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

    function hwProcessPaperData(json) {
        if(!json||!json.data||!json.data.questions){console.warn('[小雅辅助·作业区] 题目数据结构不完整，已跳过处理',!!json,!!json?.data,!!json?.data?.questions);return;}
        clearTimeout(window._hwResetGuard);
        _hwDataJustLoaded = true;
        setTimeout(() => { _hwDataJustLoaded = false; }, 3000);
        console.log('[小雅辅助·作业区] 开始处理题目数据，题目数:', json.data.questions.length);
        hwPaperId=hwPaperId||json.data.paper_id||json.data.paperId||json.data.id||'';
        if(!hwGroupId)hwGroupId=json.data.group_id;
        if(!hwNodeId)hwNodeId=getNodeId()||'';
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
        if(hwQuestionsData.length) switchToZone('hw');
        hwUpdateUI();
    }

    
    let _hwProactiveFetching = false;
    async function hwProactiveFetchData() {
        if (_hwProactiveFetching) return;
        if (hwQuestionsData.length > 0) return;
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
                    const resUrl = `https://${domain}/api/jx-iresource/resource/queryResource/v3?node_id=${encodeURIComponent(paperId)}`;
                    console.log('[小雅辅助·作业区] resource 页面用 queryResource/v3');
                    const res = await _hw_nativeFetch(resUrl, { headers: { 'Authorization': `Bearer ${token}` } });
                    const data = await res.json();
                    if (data && data.success && data.data && data.data.resource && Array.isArray(data.data.resource.questions)) {
                        const questions = data.data.resource.questions;
                        console.log('[小雅辅助·作业区] queryResource/v3 获取到题目:', questions.length, '题');
                        const paperIdFromRes = data.data.resource.id || paperId;
                        
                        const allQuestions = [];
                        questions.forEach(q => {
                            allQuestions.push(q);
                            if (q.type === 9 && Array.isArray(q.subQuestions)) {
                                q.subQuestions.forEach(sq => { sq._parentId = q.id; allQuestions.push(sq); });
                            }
                        });
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
                    const url = `https://${domain}/api/jx-iresource/quiz/queryStuPaper/v2?group_id=${encodeURIComponent(groupId)}&node_id=${encodeURIComponent(nodeId)}&paper_id=${encodeURIComponent(paperId)}`;
                    
                    const res = await window.fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (!res.ok) {  }
                } catch(e) {  }
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
        }
    }

    

    function hwDataUrlToArrayBuffer(dataUrl){const b64=dataUrl.split(',')[1];const bs=atob(b64);const bytes=new Uint8Array(bs.length);for(let i=0;i<bs.length;i++)bytes[i]=bs.charCodeAt(i);return bytes.buffer}
    function hwGetImageSize(ab){return new Promise((resolve,reject)=>{const blob=new Blob([ab]);const url=URL.createObjectURL(blob);const img=new Image();img.onload=()=>{const d={width:img.width,height:img.height};URL.revokeObjectURL(url);resolve(d)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('无法获取图片尺寸'))};img.src=url})}
    async function hwFetchImageBlob(src){var s=String(src);var p=s.indexOf("file_access/");if(p===-1)throw new Error("无法解析图片ID");var id=s.substring(p+12).split(/[?/]/)[0];var url=window.location.origin+"/api/jx-oresource/cloud/file_access/"+id+"?random="+Date.now();var r=await fetch(url,{method:"GET"});if(!r.ok)throw new Error("图片请求失败:"+r.status);return await r.arrayBuffer()}
    async function hwMapLimit(list,limit,worker){const res=new Array(list.length);let c=0;const runners=Array.from({length:Math.min(limit,list.length)},async()=>{while(c<list.length){const i=c++;res[i]=await worker(list[i],i)}});await Promise.all(runners);return res}

    async function hwHydrateImageMap(extra){const all=[...hwImageAssets,...(extra||[])];const us=Array.from(new Set(all.map(a=>a.src).filter(Boolean)));if(!us.length)return new Map();const results=await hwMapLimit(us,3,async src=>{try{const ab=await hwFetchImageBlob(src);let w=300,h=180;try{const d=await hwGetImageSize(ab.slice(0));if(d.width&&d.height){w=d.width;h=d.height;if(w>450){h=Math.round(h*(450/w));w=450}}}catch(e){}return{src,ok:true,arrayBuffer:ab,width:w,height:h}}catch(e){return{src,ok:false,error:e?.message||String(e)}}});const m=new Map();results.forEach(r=>m.set(r.src,r));return m}

    function hwRenderSegments(segs,imMap,indentLvl){const{Paragraph,TextRun,ImageRun}=window.docx;const paras=[];const indent=indentLvl?{left:indentLvl*240}:undefined;if(!segs||!segs.length)return paras;let txtRuns=[];
    const flush=()=>{if(txtRuns.length){paras.push(new Paragraph({children:txtRuns,spacing:{before:40,after:40},...(indent?{indent}:{})}));txtRuns=[]}};
    segs.forEach(seg=>{if(seg.type==='image'&&seg.src){flush();const rec=imMap.get(seg.src);if(rec&&rec.ok&&rec.arrayBuffer){try{paras.push(new Paragraph({children:[new ImageRun({data:rec.arrayBuffer,transformation:{width:rec.width,height:rec.height}})],spacing:{before:60,after:60},...(indent?{indent}:{})}))}catch(e){paras.push(new Paragraph({children:[new TextRun({text:'[图片嵌入失败]',size:20,color:'#e45a64',italics:true})],spacing:{before:40,after:40}}))}}else{paras.push(new Paragraph({children:[new TextRun({text:'[图片]',size:20,color:'#9ca3af',italics:true})],spacing:{before:40,after:40}}))}}else if(seg.type==='text'&&seg.value){txtRuns.push(new TextRun({text:hwSafeText(seg.value),size:22}))}else if(seg.type==='formula'&&seg.value){txtRuns.push(new TextRun({text:'[公式: '+hwSafeText(seg.value)+']',size:22,italics:true}))}});
    flush();return paras}

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

    function hwCopyAiPrompt() {
        if (!hwQuestionsData.length) { logMsg('还没有读取到题目数据，无法复制','error'); return; }
        const text = hwBuildAiPrompt();
        hwExtractedText = text;
        if (hwCopyText(text)) { logMsg(`✅ 已复制 ${hwQuestionsData.length} 道题给 AI，去聊天窗口粘贴吧`,'success'); showToast('📋 题目模板已复制', 'success'); }
        else { logMsg('复制失败，请手动复制','error'); showToast('复制失败，请手动复制', 'error'); }
    }

    async function hwGetRecordId() {
        if (!hwGroupId || !hwNodeId) throw new Error('未获取到课程或节点参数');
        const token = getCookie();
        if (!token) throw new Error('未获取到登录 Token');
        const url = `${window.location.origin}/api/jx-iresource/survey/course/task/flow/v2?node_id=${encodeURIComponent(hwNodeId)}&group_id=${encodeURIComponent(hwGroupId)}`;
        const res = await _hw_nativeFetch(url, { headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' }, credentials: 'include' });
        if (!res.ok) throw new Error(`Record ID 请求失败：${res.status}`);
        const data = await res.json();
        if (data && data.success && data.data) {
            if (data.data.task_flow_record && data.data.task_flow_record[0] && data.data.task_flow_record[0].answer_record_id) return data.data.task_flow_record[0].answer_record_id;
            if (data.data.task_flow_template && data.data.task_flow_template[0] && data.data.task_flow_template[0].answer_record_id) return data.data.task_flow_template[0].answer_record_id;
        }
        throw new Error('无法获取 Record ID');
    }

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

    function hwCreateRichAnswer(text) {
        const lines = String(text || '').trim().split(/\r?\n/);
        return JSON.stringify({ blocks: lines.map((line, i) => ({ key: `ans-${i}`, text: line, type: 'unstyled', depth: 0, inlineStyleRanges: [], entityRanges: [], data: {} })), entityMap: {} });
    }

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
        try { data = await res.json(); } catch(e) {}
        if (!res.ok || (data && data.success === false)) {
            const msg = (data && (data.message || data.error)) || `保存作答失败：${res.status}`;
            throw new Error(msg);
        }
        return data;
    }

    async function hwRefreshPaperData() {
        if (!hwGroupId || !hwPaperId) return false;
        const token = getCookie();
        if (!token) return false;
        const nodeId = hwNodeId || getResourceNodeId() || '';
        const url = `${window.location.origin}/api/jx-iresource/quiz/queryStuPaper/v2?group_id=${encodeURIComponent(hwGroupId)}&node_id=${encodeURIComponent(nodeId)}&paper_id=${encodeURIComponent(hwPaperId)}`;
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                
                await window.fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            } catch(e) {}
            if (hwSubmissionResult.state === 'submitted') return true;
            if (attempt < 4) await sleep(400 * (attempt + 1));
        }
        return hwSubmissionResult.state === 'submitted';
    }

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
            showToast(`✅ 已保存 ${ok} 道题作答` + (refreshed ? '，结果已刷新' : ''), 'success');
        } else {
            showToast(`未保存任何答案（成功 ${ok} / 失败 ${fail} / 跳过 ${skip}）`, fail ? 'error' : 'warning');
            logMsg(`未保存任何答案：成功 ${ok}，失败 ${fail}，跳过 ${skip}`, fail ? 'error' : 'warning');
        }
    }

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


    function createUI() {
        if (document.getElementById('xy-super-console')) { _uiCreating = false; return; }
        if (!document.body) { _uiCreating = false; scheduleEnsureUI(50); return; }
        
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
                #xy-super-console .xy-overview-drawer { display:none; position:absolute; inset:0; z-index:30; flex-direction:column; min-height:0; overflow:hidden; color:var(--xy-text); background:var(--xy-surface); border-radius:inherit; backdrop-filter:blur(24px) saturate(1.2); -webkit-backdrop-filter:blur(24px) saturate(1.2); }
                #xy-super-console .xy-overview-head { display:flex; align-items:center; gap:6px; padding:13px 14px; border-bottom:1px solid var(--xy-border); background:var(--xy-surface2); flex-shrink:0; }
                #xy-super-console .xy-overview-heading { flex:1; min-width:0; }
                #xy-super-console .xy-overview-heading strong { display:block; overflow:hidden; color:var(--xy-text); font-size:13px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
                #xy-super-console .xy-overview-updated { display:block; margin-top:2px; color:var(--xy-text-muted); font-size:9.5px; }
                #xy-super-console .xy-overview-content { min-height:0; padding:10px 12px 14px; overflow-y:auto; }
                #xy-super-console .xy-overview-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px; }
                #xy-super-console .xy-overview-panel { min-width:0; margin-bottom:10px; padding:12px; overflow:hidden; border:1px solid var(--xy-border); border-radius:11px; background:var(--xy-surface2); }
                #xy-super-console .xy-overview-grid .xy-overview-panel { margin-bottom:0; }
                #xy-super-console .xy-overview-label { margin-bottom:5px; color:var(--xy-text2); font-size:10px; font-weight:700; letter-spacing:0.4px; }
                #xy-super-console .xy-overview-value { color:var(--xy-text); font-size:17px; font-weight:700; line-height:1.25; text-wrap:pretty; }
                #xy-super-console .xy-overview-meta { margin-top:6px; color:var(--xy-text-muted); font-size:9.5px; line-height:1.45; }
                #xy-super-console .xy-overview-progress { width:100%; height:6px; margin-top:8px; overflow:hidden; border-radius:999px; background:rgba(148,163,184,0.22); }
                #xy-super-console .xy-overview-progress-fill { height:100%; border-radius:inherit; background:var(--xy-success); transition:width 0.25s ease; }
                #xy-super-console .xy-overview-panel-title { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; color:var(--xy-text2); font-size:11px; font-weight:700; }
                #xy-super-console .xy-overview-count { color:var(--xy-text-muted); font-size:9.5px; font-weight:600; }
                #xy-super-console .xy-overview-task-panel { padding:0; }
                #xy-super-console .xy-overview-task-panel > .xy-overview-panel-title { margin:0; padding:11px 12px 9px; border-bottom:1px solid var(--xy-border); }
                #xy-super-console .xy-overview-task-list { max-height:340px; overflow-y:auto; }
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
                #xy-super-console .xy-course-dashboard-list { max-height:430px; overflow-y:auto; border:1px solid var(--xy-border); border-radius:10px; background:var(--xy-surface2); }
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
                #xy-super-console .xy-course-dashboard-state { display:flex; min-height:150px; padding:22px 16px; align-items:center; justify-content:center; flex-direction:column; gap:9px; color:var(--xy-text-muted); font-size:10.5px; line-height:1.6; text-align:center; }
                #xy-super-console .xy-course-dashboard-state strong { color:var(--xy-text2); font-size:11.5px; }
                #xy-super-console .xy-course-dashboard-state.is-error span { color:var(--xy-danger); }
                @keyframes xy-overview-spin { to { transform:rotate(360deg); } }
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
                    <div id="xy-seg-zone" class="xy-seg-item active" title="当前区域">🏝️ 待命区</div>
                    <div id="xy-seg-feedback" class="xy-seg-item" title="反馈问题或建议">💬 反馈</div>
                    <div id="xy-seg-qq" class="xy-seg-item" title="点击复制QQ群号">👥 QQ群</div>
                    <div id="xy-seg-update" class="xy-seg-item" title="检查脚本更新">↻ 检查更新<span class="xy-seg-dot"></span></div>
                </div>
            </div>

            <div id="xy-main-body" style="padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; flex: 1; gap: 6px;">

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

                <div id="xy-view-standby" style="display:none; flex-direction:column; align-items:center; justify-content:center; padding: 32px 16px; text-align:center; flex-shrink: 0;">
                    <div style="font-size: 40px; margin-bottom: 12px; opacity: 0.6;">🌙</div>
                    <div style="font-size: 14px; font-weight: 600; color: ${T('#94a3b8','#64748b')}; margin-bottom: 8px;">系统休眠中</div>
                    <div style="font-size: 12px; color: ${T('#64748b','#475569')}; line-height: 1.7; margin-bottom: 24px;">当前位于不可自动化的区域<br>进入<span style="color:${T('#34d399','#059669')};">视频/文档/讨论区</span>自动激活引擎</div>
                    <div style="display:flex; gap:10px; width:85%; margin: 0 auto;">
                        <button class="xy-action-btn" id="xy-btn-radarplay-standby" style="background:${T('rgba(16,185,129,0.15)','#ecfdf5')}; border-color:${T('rgba(16,185,129,0.3)','#a7f3d0')}; color:${T('#34d399','#059669')}; flex:1; padding: 12px; font-size: 13px; font-weight:700;">一键连播</button>
                        <button class="xy-action-btn" id="xy-btn-dashboard-standby" style="background:${T('rgba(99,102,241,0.2)','#eef2ff')}; border-color:${T('rgba(129,140,248,0.3)','#c7d2fe')}; flex:1; padding: 12px; font-size: 13px;">全局雷达</button>
                        <button class="xy-action-btn" id="xy-btn-schedule-standby" style="background:${T('rgba(251,191,36,0.12)','#fffbeb')}; border-color:${T('rgba(251,191,36,0.25)','#fde68a')}; color:${T('#fcd34d','#92400e')}; flex:1; padding: 12px; font-size: 13px;">计划调度</button>
                    </div>
                </div>

                <div id="xy-view-dir" style="display:none; flex-shrink: 0;">
                    <div style="display:flex; align-items:center; gap:9px; padding:10px 14px; border-radius:10px; background: ${T('rgba(99,102,241,0.08)','#eef2ff')}; border: 1px solid ${T('rgba(129,140,248,0.22)','#c7d2fe')}; margin-bottom:10px;">
                        <span style="width:8px; height:8px; border-radius:99px; background:#818cf8; box-shadow:0 0 10px rgba(129,140,248,.6); flex-shrink:0;"></span>
                        <span style="font-size:12.5px; font-weight:700; color:${T('#e2e8f0','#0f172a')};">课程目录</span>
                        <span id="xy-dir-status" style="margin-left:auto; font-size:10px; color:${T('#94a3b8','#64748b')};">读取中...</span>
                    </div>
                    <div style="display:flex; gap:8px; margin-bottom:10px;">
                        <button class="xy-action-btn" id="xy-dir-play" style="flex:1; min-height:36px; font-size:12px; background:${T('rgba(16,185,129,0.12)','#ecfdf5')}; border-color:${T('rgba(16,185,129,0.25)','#a7f3d0')}; color:${T('#34d399','#059669')};">▶️ 一键连播</button>
                        <button class="xy-action-btn" id="xy-dir-download" style="flex:1; min-height:36px; font-size:12px; background:${T('rgba(52,211,153,0.12)','#d1fae5')}; border-color:${T('rgba(52,211,153,0.25)','#a7f3d0')}; color:${T('#6ee7b7','#059669')};">📥 进入下载区</button>
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
                    <div class="xy-panel" style="padding:10px 14px; margin-bottom:10px;">
                        <div class="xy-section-hdr" id="xy-hdr-toggles" style="font-size:12px; font-weight:600; color:${T('#94a3b8','#475569')}; display:flex; justify-content:space-between; align-items:center; user-select:none; cursor:pointer;">
                            <span>⚙️ 开关控制</span><span id="xy-arr-toggles" style="font-size:10px; transition:transform 0.25s;">▼</span>
                        </div>
                        <div id="xy-body-toggles" style="margin-top: 10px;">
                            <div style="display:none; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                                <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🛡️ 防休眠</span>
                            <button id="xy-btn-guard" style="font-size:12px; font-weight:700; padding:5px 14px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.guardActive ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.guardActive ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${appState.guardActive ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:none; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">💓 后台保活</span>
                            <button id="xy-btn-keepalive" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.keepaliveEnabled ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.keepaliveEnabled ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${appState.keepaliveEnabled ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🔇 强制静音</span>
                            <button id="xy-btn-quick-mute" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.hardwareMute ? T('rgba(52,211,153,0.2)','#d1fae5') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.hardwareMute ? T('#34d399','#065f46') : T('#94a3b8','#64748b')};">${appState.hardwareMute ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:none; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🖱️ 鼠标模拟</span>
                            <button id="xy-btn-mouse-sim" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.mouseSimActive ? T('rgba(236,72,153,0.2)','#fce7f3') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.mouseSimActive ? T('#f9a8d4','#be185d') : T('#94a3b8','#64748b')};">${appState.mouseSimActive ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:none; align-items:center; justify-content:space-between; padding:7px 0; border-bottom:1px solid ${T('rgba(71,85,105,0.1)','#e2e8f0')};">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🕵️ 深度伪装</span>
                            <button id="xy-btn-deep-camo" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:none; transition:0.2s; background: ${appState.deepCamouflage ? T('rgba(168,85,247,0.2)','#f3e8ff') : T('rgba(71,85,105,0.2)','#e2e8f0')}; color: ${appState.deepCamouflage ? T('#c4b5fd','#7c3aed') : T('#94a3b8','#64748b')};">${appState.deepCamouflage ? 'ON' : 'OFF'}</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:7px 0;">
                            <span style="font-size:12px; font-weight:600; color:${T('#e2e8f0','#0f172a')};">🔄 页面重载</span>
                            <button id="btn-manual-refresh" style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; cursor:pointer; border:1px solid ${T('rgba(129,140,248,0.25)','#c7d2fe')}; transition:0.2s; background:${T('rgba(99,102,241,0.12)','#eef2ff')}; color:${T('#a5b4fc','#4338ca')};">⚡ 刷新</button>
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

            <div id="xy-view-disc" style="display:none; flex-shrink: 0;">
                <div id="xy-disc-status" style="padding: 10px 14px; border-radius: 8px; background: ${T('rgba(30,41,59,0.5)','#f8fafc')}; border: 1px solid var(--xy-border); font-size: 12px; font-weight: 600; margin-bottom: 10px; text-align: center; color: ${T('#94a3b8','#64748b')};">初始化中...</div>

                <div class="xy-panel">
                    <div class="xy-panel-title">
                        <span>👥 互动名单</span>
                        <label style="display: none; cursor: pointer; font-size: 11px; color: ${T('#a5b4fc','#3730a3')}; background: ${T('rgba(99,102,241,0.1)','#e0e7ff')}; padding: 3px 8px; border-radius: 6px; border: 1px solid ${T('rgba(129,140,248,0.2)','#c7d2fe')}; transition: 0.2s;">
                            <input type="checkbox" id="xy-toggle-dom-scan" ${appState.enableDomScan ? 'checked' : ''} style="accent-color: #818cf8; vertical-align: middle; margin-right: 3px; width: 11px; height: 11px;">智能DOM
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

            <div id="xy-sys-ctrl" class="xy-panel" style="background:${T('rgba(30,41,59,0.3)','#f8fafc')}; border-style:dashed;">
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

            <div id="xy-bottom-containers" style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; margin-bottom: 6px;">
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

            <div id="xy-overview-drawer" class="xy-overview-drawer" aria-hidden="true">
                <div class="xy-overview-head">
                    <div class="xy-overview-heading">
                        <strong id="xy-overview-title">课程学习数据概览</strong>
                        <span id="xy-overview-updated" class="xy-overview-updated">等待加载</span>
                    </div>
                    <button id="xy-overview-refresh" class="xy-mini-btn" type="button" style="padding:5px 8px; font-size:10px;">刷新</button>
                    <button id="xy-overview-close" class="xy-mini-btn" type="button" style="padding:5px 8px; font-size:10px;">关闭</button>
                </div>
                <div id="xy-overview-content" class="xy-overview-content"></div>
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
        if (overviewOpenBtn) overviewOpenBtn.onclick = (e) => { e.stopPropagation(); xyOverviewOpen(); };
        const overviewCloseBtn = document.getElementById('xy-overview-close');
        if (overviewCloseBtn) overviewCloseBtn.onclick = () => xyOverviewClose();
        const overviewRefreshBtn = document.getElementById('xy-overview-refresh');
        if (overviewRefreshBtn) overviewRefreshBtn.onclick = () => xyOverviewRefresh();
        const overviewContent = document.getElementById('xy-overview-content');
        if (overviewContent) {
            overviewContent.addEventListener('click', (event) => {
                const taskButton = event.target.closest('.xy-overview-task');
                if (!taskButton || taskButton.disabled) return;
                const taskIndex = Number(taskButton.getAttribute('data-task-index'));
                const currentData = xyOverviewState.currentData;
                const task = Number.isInteger(taskIndex) ? currentData?.tasks?.data?.[taskIndex] : null;
                const courseId = currentData?.courseId;
                const routeCourseId = courseGroupKey(getCourseGroupId());
                const validCourseHomeTarget = isActiveCourseHomePage()
                    && xyOverviewState.isOpen
                    && xyOverviewState.courseId === courseId;
                if (!task || (routeCourseId ? courseId !== routeCourseId : !validCourseHomeTarget)) return;
                xyOverviewClose();
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
        const courseDashboardList = document.getElementById('xy-course-dashboard-list');
        if (courseDashboardList) {
            const getCourseFromTarget = target => {
                const row = target.closest('[data-course-index]');
                if (!row) return null;
                const courseIndex = Number(row.getAttribute('data-course-index'));
                return Number.isInteger(courseIndex) ? xyCourseDashboardState.courses[courseIndex] : null;
            };
            courseDashboardList.addEventListener('click', event => {
                const actionButton = event.target.closest('[data-course-action]');
                const action = actionButton?.getAttribute('data-course-action') || 'enter';
                if (action === 'retry') {
                    xyCourseDashboardRefresh();
                    return;
                }
                if (!actionButton && !event.target.closest('.xy-course-dashboard-course-main')) return;
                const course = getCourseFromTarget(event.target);
                if (!course) return;
                if (action === 'overview') {
                    xyOverviewOpen(course.courseId);
                    return;
                }
                window.location.href = `/app/jx-web/mycourse/${encodeURIComponent(course.courseId)}`;
            });
            courseDashboardList.addEventListener('keydown', event => {
                if (!event.target.matches('.xy-course-dashboard-course-main') || (event.key !== 'Enter' && event.key !== ' ')) return;
                const course = getCourseFromTarget(event.target);
                if (!course) return;
                event.preventDefault();
                window.location.href = `/app/jx-web/mycourse/${encodeURIComponent(course.courseId)}`;
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
            if (xyScheduleState.isRunning) { xySchStop(); }
            appState.mode = 'manual';
            GM_setValue('xy_play_mode', 'manual');
            clearDynamicRefresh();
            logMsg('已暂停，且已强制停止所有重载任务', 'success');
            updateCourseUI();
        };
        document.getElementById('btn-mode-loop').onclick = () => { if (!getCourseGroupId() || !getNodeId()) { xyShowModal('⚠️ 无法开启', '请进入具体的视频或文档内容页后再开启'); return; } if (xyScheduleState.isRunning) { xySchStop(); } appState.mode = 'loop'; GM_setValue('xy_play_mode', 'loop'); logMsg('安全刷时长模式开启，恢复经典无限循环', 'success'); updateCourseUI(); globalTaskStatusChecker(true); };
        document.getElementById('btn-mode-seq').onclick = () => { oneClickRadarPlay(); };
        
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
        
        if (appState.mouseSimActive) { scheduleMouseSim(); }
        document.getElementById('xy-btn-dashboard').onclick = openGlobalTaskDashboard;
        document.getElementById('xy-btn-dashboard-standby').onclick = openGlobalTaskDashboard;
        document.getElementById('xy-btn-radarplay-standby').onclick = oneClickRadarPlay;
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


        const scheduleStandbyBtn = document.getElementById('xy-btn-schedule-standby');
        if (scheduleStandbyBtn) scheduleStandbyBtn.onclick = openScheduleDashboard;

        const toggleDomScan = document.getElementById('xy-toggle-dom-scan');
        if(toggleDomScan) { toggleDomScan.onchange = (e) => { appState.enableDomScan = e.target.checked; logMsg(e.target.checked ? '✅ 智能DOM提取已开启' : '⏸️ 智能DOM提取已暂停', 'info', true); }; }

        const toggleCustomReply = document.getElementById('xy-toggle-custom-reply');
        if(toggleCustomReply) { toggleCustomReply.onchange = (e) => { appState.useCustomReply = e.target.checked; GM_setValue('xy_use_custom_reply', appState.useCustomReply); }; }
        const btnEditReply = document.getElementById('xy-btn-edit-reply');
        if (btnEditReply) btnEditReply.onclick = openReplySettingsModal;

        
        const dlSearchInput = document.getElementById('xy-dl-search');
        if (dlSearchInput) {
            dlSearchInput.addEventListener('input', () => {
                appState.downloadSearchKeyword = dlSearchInput.value;
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
                cb.checked = appState.downloadTypeFilter.has(t.key);
                cb.style.cssText = `width:12px;height:12px;accent-color:#22d3ee;cursor:pointer;`;
                cb.onchange = () => {
                    if (cb.checked) appState.downloadTypeFilter.add(t.key);
                    else appState.downloadTypeFilter.delete(t.key);
                    try { GM_setValue('xy_dl_types', Array.from(appState.downloadTypeFilter).join(',')); } catch(e) {}
                    renderDownloadList();
                };
                label.appendChild(cb);
                label.appendChild(document.createTextNode(t.label));
                typeFilterBox.appendChild(label);
            });
        }

        const dlSortSelect = document.getElementById('xy-dl-sort');
        if (dlSortSelect) {
            dlSortSelect.value = appState.downloadSortMode || 'unit';
            dlSortSelect.onchange = () => {
                appState.downloadSortMode = dlSortSelect.value;
                try { GM_setValue('xy_dl_sort', dlSortSelect.value); } catch(e) {}
                renderDownloadList();
            };
        }
        document.getElementById('xy-dl-select-all').onclick = () => {
            const keyword = (appState.downloadSearchKeyword || '').toLowerCase().trim();
            const targets = keyword
                ? appState.downloadFiles.filter(f => f.name.toLowerCase().includes(keyword))
                : appState.downloadFiles;
            targets.forEach(f => {
                const id = normalizeDownloadId(f.id);
                if (id !== null) appState.downloadSelectedIds.add(id);
            });
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
                if (target.checked) appState.downloadSelectedIds.add(fid);
                else appState.downloadSelectedIds.delete(fid);
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
        const stopScrapeBtn = document.getElementById('xy-btn-stop-scrape');
        if (stopScrapeBtn) stopScrapeBtn.onclick = () => { appState.discScrapeAbort = true; stopScrapeBtn.disabled = true; };
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

        const handle = document.getElementById('xy-drag-handle'), minBtn = document.getElementById('xy-minimize'), body = document.getElementById('xy-main-body'), handleRow2 = document.getElementById('xy-handle-row2');
        let isMin = false;
        minBtn.onclick = () => {
            isMin = !isMin;
            body.style.display = isMin ? 'none' : 'flex';
            if (handleRow2) handleRow2.style.display = isMin ? 'none' : 'flex';
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
        bindSection('xy-hdr-toggles', 'xy-body-toggles', 'xy-arr-toggles');
        bindSection('xy-hdr-engine', 'xy-body-engine', 'xy-arr-engine');

        const themeBtn = document.getElementById('xy-theme-toggle');
        if (themeBtn) themeBtn.onclick = () => {
            
            if (appState.theme === 'auto') appState.theme = 'light';
            else if (appState.theme === 'light') appState.theme = 'dark';
            else appState.theme = 'auto';
            GM_setValue('xy_theme', appState.theme);
            applyTheme();
            showToast(appState.theme === 'auto' ? '🌓 主题：跟随系统' : appState.theme === 'light' ? '☀️ 主题：浅色模式' : '🌙 主题：深色模式', 'info');
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
        setTimeout(() => xyUpdateAutoCheck(), 2500);
        appState.isTaskCompleted = false;
        applyThemeClasses();
        _uiCreating = false;
    }

    
    
    
    let _uiCreating = false;
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

        
        if (appState.keepaliveEnabled && !keepaliveWatchdogTimer) {
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
    function scheduleEnsureUI(delay = 0) {
        if (_ensureUIScheduled) return;
        _ensureUIScheduled = true;
        setTimeout(() => {
            _ensureUIScheduled = false;
            ensureUI();
        }, delay);
    }

    let _uiObserver = null;
    function installUIObserver() {
        if (_uiObserver || !document) return;
        _uiObserver = new MutationObserver(() => {
            // 只在面板被页面重建/移除时补建，避免 SPA 的普通 DOM 更新触发重复扫描。
            if (!document.getElementById('xy-super-console')) scheduleEnsureUI(50);
        });
        _uiObserver.observe(document, { childList: true, subtree: true });
    }

    installUIObserver();

    
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
        console.log('[小雅] 后台保活:', appState.keepaliveEnabled ? 'ON' : 'OFF');
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


    function xyShowFeedbackSurvey() {
        window.open('https://scriptcat.org/zh-CN/script-show-page/5881/issue/create', '_blank');
    }

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
