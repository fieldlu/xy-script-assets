// ==========================================
// Gitee 云端题库合并 & 上传工具
// 使用方法：在 wsdx.whut.edu.cn 页面打开控制台 (F12)，粘贴全部代码，回车运行
// ==========================================

(async function mergeAndUpload() {
    'use strict';

    const RAW_BASE = 'https://gitee.com/fieldlu/party-member-treasury/raw/master/qbank';
    const API_BASE = 'https://gitee.com/api/v5/repos/fieldlu/party-member-treasury/contents/qbank';

    // ⚠️ 在这里填入你的 Gitee 私人令牌（Personal Access Token）
    // 获取方式：gitee.com → 设置 → 私人令牌 → 生成新令牌（勾选 projects 权限）
    const GITEE_TOKEN = prompt('请输入你的 Gitee 私人令牌（Personal Access Token）：\n\n获取方式：gitee.com → 设置 → 私人令牌 → 生成新令牌');
    if (!GITEE_TOKEN) { console.log('❌ 已取消：未提供令牌'); return; }

    console.log('📡 步骤 1/4：加载课程索引...');

    // 1. 获取课程列表
    let index;
    try {
        const idxRes = await fetch(`${RAW_BASE}/index.json?t=${Date.now()}`);
        if (!idxRes.ok) throw new Error('索引加载失败 HTTP ' + idxRes.status);
        index = await idxRes.json();
    } catch(e) {
        console.error('❌ 无法加载索引：', e.message);
        return;
    }

    const courses = index.courses || [];
    console.log(`📋 发现 ${courses.length} 门课程：${courses.join(', ')}`);

    // 2. 并行加载所有课程文件
    console.log('📡 步骤 2/4：加载所有课程题库...');
    let allQuestions = [];
    const seen = new Set();

    for (const course of courses) {
        try {
            const res = await fetch(`${RAW_BASE}/${encodeURIComponent(course)}.json?t=${Date.now()}`);
            if (!res.ok) { console.warn(`⚠️ 跳过 ${course}（HTTP ${res.status}）`); continue; }
            const bank = await res.json();
            if (!Array.isArray(bank)) { console.warn(`⚠️ ${course} 不是数组格式，跳过`); continue; }
            let added = 0;
            for (const q of bank) {
                const key = (q.content || '').replace(/\s+/g, '').substring(0, 30);
                if (!seen.has(key)) {
                    seen.add(key);
                    allQuestions.push({
                        type: q.type || '未知题型',
                        content: q.content || '',
                        options: q.options || [],
                        answer: q.answer || ''
                    });
                    added++;
                }
            }
            console.log(`  ✅ ${course}: ${bank.length} 题 → 合并 ${added} 新题`);
        } catch(e) {
            console.warn(`  ⚠️ ${course}: ${e.message}`);
        }
    }

    console.log(`📊 合并完成：共 ${allQuestions.length} 题`);

    // 3. 下载本地备份
    console.log('📡 步骤 3/4：生成 qbank.json 并下载本地备份...');
    const jsonStr = JSON.stringify(allQuestions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qbank.json';
    a.click();
    URL.revokeObjectURL(url);
    console.log('  ✅ 已下载 qbank.json 到本地（' + allQuestions.length + ' 题）');

    // 4. 上传到 Gitee
    console.log('📡 步骤 4/4：上传到 Gitee...');
    const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

    // 先检查文件是否已存在（获取 sha）
    let sha = null;
    try {
        const checkRes = await fetch(`${API_BASE}/qbank.json?access_token=${GITEE_TOKEN}`);
        if (checkRes.ok) {
            const info = await checkRes.json();
            sha = info.sha;
            console.log('  ℹ️ qbank.json 已存在，将更新（sha: ' + sha.substring(0, 8) + '...）');
        }
    } catch(e) {}

    const uploadBody = {
        access_token: GITEE_TOKEN,
        content: contentBase64,
        message: `合并题库：${allQuestions.length} 题 [${new Date().toLocaleDateString()}]`,
        branch: 'master'
    };
    if (sha) uploadBody.sha = sha;

    try {
        const uploadRes = await fetch(`${API_BASE}/qbank.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadBody)
        });
        const result = await uploadRes.json();
        if (uploadRes.ok || uploadRes.status === 201) {
            console.log(`🎉 上传成功！qbank.json 已更新（${allQuestions.length} 题）`);
            console.log('  现在云端题库将通过 qbank.json 一次性加载，速度更快！');
        } else {
            console.error('❌ 上传失败：', result.message || JSON.stringify(result));
            console.log('  请手动上传已下载的 qbank.json 到 Gitee 仓库的 qbank/ 目录下');
        }
    } catch(e) {
        console.error('❌ 上传网络错误：', e.message);
        console.log('  请手动上传已下载的 qbank.json 到 Gitee 仓库的 qbank/ 目录下');
    }

    console.log('\n✅ 全部操作完成！');
})();
