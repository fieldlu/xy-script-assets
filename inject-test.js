/**
 * 小雅辅助工具 — 手动时长注入引擎 · 独立测试代码
 *
 * 用法：
 *   node inject-test.js <minutes> [--dry] [--verbose]
 *
 * 示例：
 *   node inject-test.js 1           # 注入 1 分钟（2 包），实际发包
 *   node inject-test.js 5 --dry     # 模拟注入 5 分钟，不发包
 *   node inject-test.js 10 --verbose # 注入 10 分钟，打印每包详情
 *
 * 运行前需设置环境变量：
 *   XY_DOMAIN    — 平台域名（默认 ai-augmented.com）
 *   XY_TOKEN     — prd-access-token（从浏览器 Cookie 中获取）
 *   XY_GROUP_ID  — 课程 group_id（从 URL 提取）
 *   XY_RESOURCE_ID — 资源 resourceId（从 URL 提取）
 */

// ============================================================
// 0. 环境变量读取 & 参数解析
// ============================================================
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry');
const VERBOSE = args.includes('--verbose');
const minutesArg = args.find(a => /^\d+$/.test(a));
if (!minutesArg) {
  console.error('用法: node inject-test.js <minutes> [--dry] [--verbose]');
  process.exit(1);
}
const MINUTES = parseInt(minutesArg, 10);

const DOMAIN = process.env.XY_DOMAIN || 'ai-augmented.com';
const TOKEN  = process.env.XY_TOKEN  || '';
const GROUP_ID = process.env.XY_GROUP_ID || '';
const RESOURCE_ID = process.env.XY_RESOURCE_ID || '';

// ============================================================
// 1. 模拟浏览器环境
// ============================================================
global.crypto = require('crypto').webcrypto;

// Mock window.location
global.window = { location: { href: `https://${DOMAIN}/mycourse/${GROUP_ID}/resource/1/${RESOURCE_ID}` } };

// Mock document.cookie
global.document = { cookie: TOKEN ? `prd-access-token=${TOKEN}` : '' };

// Mock sessionStorage
const _sessionStore = {};
global.sessionStorage = {
  getItem(k)  { return _sessionStore[k] || null; },
  setItem(k,v){ _sessionStore[k] = String(v); },
};

// Mock GM_*
global.GM_getValue = (k, def) => _sessionStore[k] || def;
global.GM_setValue = (k, v) => { _sessionStore[k] = v; };

// ============================================================
// 2. 工具函数（从原脚本提取）
// ============================================================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function generateUUID() {
  return crypto.randomUUID();
}

function getCourseGroupId() {
  const m = window.location.href.match(/(?:mycourse|course)\/(\d+)/);
  return m ? m[1] : null;
}

function getNodeId() {
  const m = window.location.href.match(/resource\/\d+\/(\d+)/);
  return m ? m[1] : null;
}

function getCookie(keyword = 'prd-access-token') {
  for (const c of document.cookie.split('; ')) {
    const [name, value] = c.split('=');
    if (name.includes(keyword)) return value;
  }
  return null;
}

async function getAuthToken() {
  const token = getCookie();
  if (token) return token;
  throw new Error('未找到Token');
}

// ============================================================
// 3. 应用状态
// ============================================================
const appState = {
  activeZone: 'course',
  recordCount: 0,
  totalTime: 0,
  realTime: 0,
  lastRecordDate: null,
  injectActive: false,
  injectTotal: 0,
  injectCompleted: 0,
};
let isRecordSending = false;
let recordFailCount = 0;
let keepaliveLastBeatTime = 0;
const sessionLogs = [];

// ============================================================
// 4. UI 桩函数（测试环境不渲染 UI）
// ============================================================
function logMsg(msg, type = 'info') {
  const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const prefix = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' }[type] || '  ';
  console.log(`[${now}] ${prefix} ${msg}`);
}
function updateCourseUI() { /* noop in test */ }
function updateInjectUI() {
  if (appState.injectTotal > 0) {
    const pct = Math.round(appState.injectCompleted / appState.injectTotal * 100);
    console.log(`  📊 进度: ${appState.injectCompleted}/${appState.injectTotal} (${pct}%)`);
  }
}

// ============================================================
// 5. 核心发包函数
// ============================================================
async function _origSendRecordRequest() {
  const groupId = getCourseGroupId();
  const resourceId = getNodeId();
  if (!groupId || !resourceId) throw new Error('no resource');

  // 干跑模式：直接模拟成功
  if (DRY_RUN) {
    appState.recordCount++;
    appState.lastRecordDate = new Date();
    appState.totalTime += 30;
    recordFailCount = 0;
    keepaliveLastBeatTime = Date.now();
    if (VERBOSE) console.log(`    [DRY] ✅ 模拟发包成功  totalTime=${appState.totalTime}s`);
    return;
  }

  let token = await getAuthToken();

  const maxRetries = 3;
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) await sleep(Math.pow(3, attempt) * 1000);

      const uRes = await fetch(`https://${DOMAIN}/api/jx-auth/oauth2/info`, {
        headers: { authorization: `Bearer ${token}` }
      });
      if (!uRes.ok) {
        lastError = new Error(`oauth2/info HTTP ${uRes.status}`);
        continue;
      }
      const uData = await uRes.json();
      const userId = uData?.data?.info?.id;
      if (!userId) {
        lastError = new Error('no userId');
        continue;
      }

      const msgObj = {
        user_id: userId, group_id: groupId, clientType: 1, roleType: 1,
        resourceId: resourceId,
      };
      const message = JSON.stringify(msgObj);
      const timestamp = Date.now().toString();
      const nonce = generateUUID();
      const arr = [encodeURIComponent(message), timestamp, nonce, '--xy-create-signature--']
        .sort().join('');
      const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(arr));
      const signature = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch(
        `https://${DOMAIN}/api/jx-iresource/learnLength/learnRecord`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ message, signature, timestamp, nonce }),
        }
      );
      const result = await response.json();

      if (result.code === 0 || result.success) {
        appState.recordCount++;
        appState.lastRecordDate = new Date();
        appState.totalTime += 30;
        sessionStorage.setItem('xy_recordCount', appState.recordCount);
        sessionStorage.setItem('xy_totalTime', appState.totalTime);
        recordFailCount = 0;
        keepaliveLastBeatTime = Date.now();
        if (VERBOSE) console.log(`    ✅ 包成功  code=${result.code}  totalTime=${appState.totalTime}s`);
        return;
      }
      lastError = new Error(`code=${result.code} msg=${result.message}`);
      if (VERBOSE) console.warn(`    ⚠️ 服务端拒绝  ${lastError.message}`);
    } catch (e) {
      lastError = e;
      if (VERBOSE) console.warn(`    🔄 第${attempt + 1}次失败: ${e.message}`);
    }
  }

  recordFailCount++;
  if (recordFailCount >= 10) {
    logMsg('学习记录连续失败10次，请检查网络或Token是否过期', 'error');
    recordFailCount = 0;
  }
  throw lastError || new Error('sendRecord failed');
}

// ============================================================
// 6. 手动时长注入引擎
// ============================================================
async function injectDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    logMsg('时长必须为正数（分钟）', 'error');
    return;
  }
  const MAX_INJECT_MINUTES = 300;
  if (minutes > MAX_INJECT_MINUTES) {
    logMsg(`单次最多注入 ${MAX_INJECT_MINUTES} 分钟`, 'error');
    return;
  }
  if (appState.injectActive) {
    logMsg('当前有注入任务正在执行，请等待完成或先点停止', 'warning');
    return;
  }
  if (appState.activeZone !== 'course') {
    logMsg('请先进入课程内容页面', 'error');
    return;
  }
  const groupId = getCourseGroupId();
  const resourceId = getNodeId();
  if (!groupId || !resourceId) {
    logMsg('未识别课程/资源ID，请进入课程页面后再注入', 'error');
    return;
  }

  const totalPackets = Math.ceil((minutes * 60) / 30);
  isRecordSending = true;
  appState.injectActive = true;
  appState.injectTotal = totalPackets;
  appState.injectCompleted = 0;

  logMsg(`开始注入 ${minutes} 分钟时长（共 ${totalPackets} 包，间隔 1.5s）`, 'success');
  if (DRY_RUN) logMsg('⚠️ 干跑模式：不会发送真实网络请求', 'warning');

  const startTime = Date.now();
  try {
    for (let i = 0; i < totalPackets; i++) {
      if (!appState.injectActive) {
        logMsg(`注入已中断（已发 ${appState.injectCompleted}/${totalPackets} 包）`, 'warning');
        break;
      }
      try {
        await _origSendRecordRequest();
        appState.injectCompleted++;
      } catch (e) {
        if (VERBOSE) console.warn(`  ❌ 包 ${i + 1} 失败: ${e.message}`);
      }

      if ((i + 1) % 10 === 0 || i === totalPackets - 1) {
        updateInjectUI();
      }

      if (i < totalPackets - 1 && appState.injectActive) {
        await sleep(1500);
      }
    }
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    logMsg(`注入完成：${appState.injectCompleted}/${totalPackets} 成功，耗时 ${elapsed}s`, 'success');
  } finally {
    isRecordSending = false;
    appState.injectActive = false;
    updateInjectUI();
  }
}

// ============================================================
// 7. 主流程
// ============================================================
(async () => {
  console.log('═══════════════════════════════════════');
  console.log('  小雅辅助工具 — 时长注入测试');
  console.log('═══════════════════════════════════════');
  console.log(`  域名     : ${DOMAIN}`);
  console.log(`  课程 ID  : ${GROUP_ID || '(未设置)'}`);
  console.log(`  资源 ID  : ${RESOURCE_ID || '(未设置)'}`);
  console.log(`  Token    : ${TOKEN ? TOKEN.slice(0, 8) + '...' + TOKEN.slice(-4) : '(未设置)'}`);
  console.log(`  注入时长 : ${MINUTES} 分钟`);
  console.log(`  总包数   : ${Math.ceil(MINUTES * 60 / 30)}`);
  console.log(`  模式     : ${DRY_RUN ? '干跑 (不发包)' : '真实发包'}`);
  console.log('───────────────────────────────────────');

  if (!DRY_RUN && (!TOKEN || !GROUP_ID || !RESOURCE_ID)) {
    console.log('\n❌ 真实发包模式需要设置以下环境变量：');
    if (!TOKEN)      console.log('   XY_TOKEN        — 从浏览器 Cookie 复制 prd-access-token');
    if (!GROUP_ID)    console.log('   XY_GROUP_ID     — 从课程 URL 提取 (mycourse/xxx)');
    if (!RESOURCE_ID) console.log('   XY_RESOURCE_ID  — 从资源 URL 提取 (resource/x/xxx)');
    console.log('\n或使用 --dry 进行干跑测试：');
    console.log('   node inject-test.js ' + MINUTES + ' --dry --verbose');
    process.exit(1);
  }

  console.log('');
  await injectDuration(MINUTES);
  console.log('');
  console.log('───────────────────────────────────────');
  console.log(`  累计记录 : ${appState.recordCount} 次`);
  console.log(`  累计时长 : ${appState.totalTime}s (${(appState.totalTime / 60).toFixed(1)}min)`);
  console.log('═══════════════════════════════════════');
})();
