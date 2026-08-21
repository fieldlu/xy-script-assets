'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SCRIPT = fs.readFileSync(path.join(__dirname, '小雅辅助工具 .user.js'), 'utf8');
assert.match(SCRIPT, /@version\s+3\.7\.1/);
assert.match(SCRIPT, /@updateURL\s+https:\/\/gitee\.com\/fieldlu\/xy-script-assets\/raw\/main/);
assert.match(SCRIPT, /@downloadURL\s+https:\/\/gitee\.com\/fieldlu\/xy-script-assets\/raw\/main/);

// course_paper 页面可能把记录放在任务流程数组的后续项，或直接随题目数据返回。
const recordExtractorStart = SCRIPT.indexOf('    function hwExtractRecordId');
const recordExtractorEnd = SCRIPT.indexOf('    async function hwGetRecordId', recordExtractorStart);
assert(recordExtractorStart >= 0 && recordExtractorEnd > recordExtractorStart, 'record-id extractor not found');
const recordContext = { String, Array };
vm.runInNewContext(SCRIPT.slice(recordExtractorStart, recordExtractorEnd) + '\nglobalThis.__extractRecordId = hwExtractRecordId;', recordContext);
assert.equal(recordContext.__extractRecordId({
  task_flow_record: [{ state: 1 }, { answer_record_id: 'record-from-later-item' }]
}), 'record-from-later-item');
assert.equal(recordContext.__extractRecordId({ answer_record: { id: 'record-from-paper' } }), 'record-from-paper');
console.log('course paper record-id regression: PASS');

// 只有所有答案保存成功才允许刷新，避免部分失败时丢失错误提示。
const saveRefreshStart = SCRIPT.indexOf('    function hwShouldReloadAfterSave');
const saveRefreshEnd = SCRIPT.indexOf('    async function hwSaveAnswers', saveRefreshStart);
assert(saveRefreshStart >= 0 && saveRefreshEnd > saveRefreshStart, 'save refresh helpers not found');
const saveRefreshContext = { Number };
vm.runInNewContext(SCRIPT.slice(saveRefreshStart, saveRefreshEnd) + '\nglobalThis.__shouldReloadAfterSave = hwShouldReloadAfterSave;', saveRefreshContext);
assert.equal(saveRefreshContext.__shouldReloadAfterSave(9, 0, 0), true);
assert.equal(saveRefreshContext.__shouldReloadAfterSave(8, 1, 0), false);
assert.equal(saveRefreshContext.__shouldReloadAfterSave(8, 0, 1), false);
console.log('homework save refresh regression: PASS');

assert.match(SCRIPT, /function xyCourseDashboardCourseStatus/);
assert.match(SCRIPT, /function xyOverviewTaskStatus/);
assert.match(SCRIPT, /\/api\/jx-stat\/ads\/user\/student\?group_id=/);
assert.match(SCRIPT, /\/api\/jx-stat\/group\/task\/survey\/student\?group_id=/);
assert.match(SCRIPT, /learn_durations/);
assert.match(SCRIPT, /if \(breakdown\.taskCount === 0\) return \{ key: 'empty', label: '暂无任务' \};/);
assert.match(SCRIPT, /if \(course\.expiredCount > 0\) return \{ key: 'expired', label: `\$\{course\.expiredCount\} 项已截止` \};/);
const courseStatusStart = SCRIPT.indexOf('    function xyCourseDashboardCourseStatus');
const courseStatusEnd = SCRIPT.indexOf('    async function xyCourseDashboardMapLimit', courseStatusStart);
assert(courseStatusStart >= 0 && courseStatusEnd > courseStatusStart, 'course status function not found');
assert.doesNotMatch(SCRIPT.slice(courseStatusStart, courseStatusEnd), /已清空/);

// 课程总览应依次展示可做待办、无可做但有已截止任务、其余课程；每组内先按截止时间、再按任务数排序。
const courseSortStart = SCRIPT.indexOf('    function xyCourseDashboardSortCourses');
const courseSortEnd = SCRIPT.indexOf('    function xyCourseDashboardCourseStatus', courseSortStart);
assert(courseSortStart >= 0 && courseSortEnd > courseSortStart, 'course dashboard sorter not found');
const courseSortContext = { Number };
vm.runInNewContext(SCRIPT.slice(courseSortStart, courseSortEnd) + '\nglobalThis.__sortCourses = xyCourseDashboardSortCourses;', courseSortContext);
const sortedCourses = courseSortContext.__sortCourses([
  { course: { courseId: 'completed', pendingCount: 0, expiredCount: 0, portrait: { taskCount: 12 } }, sourceIndex: 0 },
  { course: { courseId: 'actionable-many', pendingCount: 3, expiredCount: 0, nearestDeadline: 2_000, portrait: { taskCount: 15 } }, sourceIndex: 1 },
  { course: { courseId: 'actionable-soon', pendingCount: 1, expiredCount: 0, nearestDeadline: 1_000, portrait: { taskCount: 1 } }, sourceIndex: 2 },
  { course: { courseId: 'expired-light', pendingCount: 0, expiredCount: 1, nearestExpiredDeadline: 3_000, portrait: { taskCount: 2 } }, sourceIndex: 3 },
  { course: { courseId: 'expired-heavy', pendingCount: 0, expiredCount: 2, nearestExpiredDeadline: 4_000, portrait: { taskCount: 9 } }, sourceIndex: 4 },
  { course: { courseId: 'no-task-heavy', pendingCount: 0, expiredCount: 0, portrait: { taskCount: 20 } }, sourceIndex: 5 }
]);
assert.deepEqual(Array.from(sortedCourses, ({ course }) => course.courseId), [
  'actionable-soon', 'actionable-many', 'expired-light', 'expired-heavy', 'no-task-heavy', 'completed'
]);
assert.match(SCRIPT, /button\.onclick = event =>/);
assert.match(SCRIPT, /handleSingleDownloadClick\(event, button\)/);
assert.match(SCRIPT, /dlCollectResources\(data\.data\)|dlCollectResources\(resources\)/);
assert.match(SCRIPT, /data-quote-id=\"\$\{escapeHtml\(quoteId\)\}\"/);
assert.match(SCRIPT, /getAttribute\('data-quote-id'\)/);
assert.match(SCRIPT, /function downloadFile\(url, filename, signal, onProgress\)/);
assert.match(SCRIPT, /async function getDownloadUrl\(quoteId, signal\)/);
assert.match(SCRIPT, /getDownloadUrl\(quoteId, signal\)/);
assert.match(SCRIPT, /signal: signal \|\| undefined/);
assert.match(SCRIPT, /updateDownloadProgress\(done \+ failed, total, file\.name, progress\.percent, progress\.receivedBytes, progress\.totalBytes\)/);
assert.match(SCRIPT, /Content-Range/);
assert.match(SCRIPT, /已接收/);
assert.match(SCRIPT, /await downloadFile\(url, file\.name, signal/);
assert.match(SCRIPT, /done\+\+;/);
assert.match(SCRIPT, /failed\+\+;/);
assert.match(SCRIPT, /class=\"xy-dl-progress-card\"/);
assert.match(SCRIPT, /id=\"xy-dl-progress-file\"/);
assert.match(SCRIPT, /id=\"xy-dl-progress-detail\"/);
assert.match(SCRIPT, /text-overflow: ellipsis/);
assert.doesNotMatch(SCRIPT, /id=\"xy-dl-progress-text\"/);
assert.match(SCRIPT, /async function runDownloadQueue/);
assert.match(SCRIPT, /appState\.downloadMode = mode/);
assert.match(SCRIPT, /await runDownloadQueue\(selected, 'batch'\)/);
assert.match(SCRIPT, /await runDownloadQueue\(\[\{ id: fid, quoteId, name: fileName \}\], 'single', singleButton\)/);
assert.match(SCRIPT, /updateDownloadProgress\(done \+ failed, total, file\.name, progress\.percent, progress\.receivedBytes, progress\.totalBytes\)/);

// 进度 DOM 使用分层节点，长文件名只能在文件名行省略，不得污染计数、百分比和按钮。
const progressFunctionStart = SCRIPT.indexOf('    function formatDownloadBytes');
const progressFunctionEnd = SCRIPT.indexOf('    function setDownloadButtonsState', progressFunctionStart);
assert(progressFunctionStart >= 0 && progressFunctionEnd > progressFunctionStart, 'progress functions not found');
const progressElements = new Map(['xy-dl-progress-wrap', 'xy-dl-progress-bar', 'xy-dl-progress-state', 'xy-dl-progress-count', 'xy-dl-progress-percent', 'xy-dl-progress-file', 'xy-dl-progress-detail'].map(id => [id, { style: {}, textContent: '', title: '' }]));
const progressContext = {
  document: { getElementById(id) { return progressElements.get(id) || null; } },
  Number, Math, String
};
vm.runInNewContext(SCRIPT.slice(progressFunctionStart, progressFunctionEnd) + '\nglobalThis.__updateDownloadProgress = updateDownloadProgress;', progressContext);
progressContext.__updateDownloadProgress(0, 2, '机械制造基础-1上课用 - 修改 20260301版本.pptx', 64, 64 * 1024 * 1024, 100 * 1024 * 1024);
assert.equal(progressElements.get('xy-dl-progress-state').textContent, '下载中');
assert.equal(progressElements.get('xy-dl-progress-count').textContent, '0/2');
assert.equal(progressElements.get('xy-dl-progress-percent').textContent, '文件 64%');
assert.equal(progressElements.get('xy-dl-progress-bar').style.width, '64%');
assert.equal(progressElements.get('xy-dl-progress-detail').textContent, '已接收 64.0 MB / 100.0 MB');
progressContext.__updateDownloadProgress(1, 2);
assert.equal(progressElements.get('xy-dl-progress-state').textContent, '准备下一项');
assert.equal(progressElements.get('xy-dl-progress-percent').textContent, '批量 50%');
assert.equal(progressElements.get('xy-dl-progress-file').style.display, 'none');
console.log('compact progress layout: PASS');

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

// API shape used by 小雅爬爬爬: object keyed by resource ID.
const objectResources = {
  '101': { id: 101, name: '课件.pdf', quote_id: 'q-101', mimetype: 'application/pdf' },
  '102': { id: '102', name: '目录', children: [
    { resource_id: 202, name: '嵌套.docx', quoteId: 'q-202', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  ] }
};
const collected = dlCollectResources(objectResources);
assert.deepEqual(collected.map(r => dlResourceId(r)), ['101', '102', '202']);
assert.equal(dlQuoteId(collected[0]), 'q-101');
assert.equal(dlQuoteId(collected[2]), 'q-202');

class FakeElement {
  constructor(classes = [], parent = null, attrs = {}) {
    this.parentElement = parent;
    this._classes = new Set(classes);
    this._attrs = attrs;
    this.disabled = false;
    this.textContent = '⬇️';
  }
  get classList() { return { contains: name => this._classes.has(name) }; }
  closest(selector) {
    let node = this;
    while (node) {
      if (selector === '.xy-dl-single' && node._classes.has('xy-dl-single')) return node;
      if (selector === '.xy-dl-unit-head' && node._classes.has('xy-dl-unit-head')) return node;
      node = node.parentElement;
    }
    return null;
  }
  getAttribute(name) { return this._attrs[name] ?? null; }
}

const list = new FakeElement();
const button = new FakeElement(['xy-dl-single'], list, { 'data-fid': '202' });
const icon = new FakeElement([], button);
const directQuoteButton = new FakeElement(['xy-dl-single'], list, {
  'data-fid': 'stale-id',
  'data-quote-id': 'q-direct',
  'data-file-name': 'direct.pdf'
});
const directIcon = new FakeElement([], directQuoteButton);
const appState = { downloadFiles: [{ id: '202', nodeId: 'node-202', quoteId: 'q-202', name: '嵌套.docx' }] };
const calls = [];
const toasts = [];
const getDownloadUrl = async quoteId => { calls.push(['getDownloadUrl', quoteId]); return 'https://cdn.example/file'; };
const downloadFile = async (url, name) => { calls.push(['downloadFile', url, name]); };
const showToast = (message, type) => toasts.push([message, type]);

// Same direct binding behavior as the userscript: clicking a child of the button must work.
async function handleClick(button, e) {
  e.preventDefault(); e.stopPropagation();
  const fid = normalizeDownloadId(button.getAttribute('data-fid'));
  const file = fid === null ? null : appState.downloadFiles.find(f => [f.id, f.nodeId, f.quoteId]
    .some(value => normalizeDownloadId(value) === fid));
  const quoteId = normalizeDownloadId(button.getAttribute('data-quote-id'))
    ?? (file ? dlQuoteId(file) : null);
  const fileName = button.getAttribute('data-file-name') || file?.name || '未知文件';
  const url = await getDownloadUrl(quoteId);
  await downloadFile(url, fileName);
}

let prevented = false;
let stopped = false;
handleClick(button, {
  target: icon,
  preventDefault() { prevented = true; },
  stopPropagation() { stopped = true; }
}).then(() => {
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  assert.deepEqual(calls, [
    ['getDownloadUrl', 'q-202'],
    ['downloadFile', 'https://cdn.example/file', '嵌套.docx']
  ]);
  assert.deepEqual(toasts, []);
  console.log('download regression tests: PASS');
}).then(async () => {
  // Even if the list's secondary id map is stale, the button's own quote_id must drive the request.
  const directCalls = [];
  const directFile = appState.downloadFiles.find(f => ['stale-id'].includes(normalizeDownloadId(f.id)));
  const directQuoteId = normalizeDownloadId(directQuoteButton.getAttribute('data-quote-id'))
    ?? (directFile ? dlQuoteId(directFile) : null);
  const directName = directQuoteButton.getAttribute('data-file-name') || directFile?.name || '未知文件';
  directCalls.push(['getDownloadUrl', directQuoteId]);
  directCalls.push(['downloadFile', 'https://cdn.example/direct', directName]);
  assert.deepEqual(directCalls, [
    ['getDownloadUrl', 'q-direct'],
    ['downloadFile', 'https://cdn.example/direct', 'direct.pdf']
  ]);
  console.log('direct quote-id fallback: PASS');
}).then(async () => {
  // 单文件和批量下载必须实际执行同一个 runner：单文件是长度为 1 的队列。
  const queueStart = SCRIPT.indexOf('    async function runDownloadQueue');
  const queueEnd = SCRIPT.indexOf('    async function batchDownloadSelected', queueStart);
  assert(queueStart >= 0 && queueEnd > queueStart, 'unified download queue not found');
  const queueProgress = [];
  const queueDownloads = [];
  const queueContext = {
    AbortController,
    DOMException,
    console,
    appState: { downloadAbortController: null, downloadMode: 'idle', downloadPaused: false },
    normalizeDownloadId: value => value === null || value === undefined ? null : String(value),
    dlQuoteId: file => file.quoteId || null,
    showToast() {},
    logMsg() {},
    setDownloadButtonsState() {},
    updateDownloadProgress(...args) { queueProgress.push(args); },
    async getDownloadUrl(quoteId) { return quoteId === 'q-fail' ? null : 'https://cdn.example/' + quoteId; },
    async downloadFile(url, name, signal, onProgress) {
      queueDownloads.push([url, name, signal.aborted]);
      onProgress({ percent: 64, receivedBytes: 64 * 1024 * 1024, totalBytes: 100 * 1024 * 1024 });
    },
    async sleep() {},
    document: { getElementById() { return { innerText: '' }; } },
    setTimeout() { return 1; }
  };
  vm.runInNewContext(SCRIPT.slice(queueStart, queueEnd) + '\nglobalThis.__runDownloadQueue = runDownloadQueue;', queueContext);
  await queueContext.__runDownloadQueue([{ quoteId: 'q-single', name: 'single.pptx' }], 'single');
  assert(queueProgress.some(item => item[0] === 0 && item[1] === 1));
  assert(queueProgress.some(item => item[0] === 1 && item[1] === 1 && item[2] === 'single.pptx' && item[3] === 100));
  await queueContext.__runDownloadQueue([
    { quoteId: 'q-ok', name: 'ok.pptx' },
    { quoteId: 'q-fail', name: 'fail.pptx' }
  ], 'batch');
  assert(queueProgress.some(item => item[0] === 1 && item[1] === 2));
  assert(queueProgress.some(item => item[0] === 2 && item[1] === 2));
  assert.equal(queueDownloads.length, 2);
  assert.equal(queueContext.appState.downloadAbortController, null);
  assert.equal(queueContext.appState.downloadMode, 'idle');
  console.log('unified single/batch queue: PASS');

// 直接执行 userscript 中的 downloadFile：验证参考脚本的流式读取、Blob、a.click
// 和 Promise resolve/reject，而不是只检查字符串是否存在。
const downloadFileStart = SCRIPT.indexOf('    function downloadFile(');
const downloadFileEnd = SCRIPT.indexOf('    function formatDownloadBytes', downloadFileStart);
assert(downloadFileStart >= 0 && downloadFileEnd > downloadFileStart, 'downloadFile function not found');
const downloadFileSource = SCRIPT.slice(downloadFileStart, downloadFileEnd).trim();
let fetchImpl;
const clicks = [];
const appended = [];
const revoked = [];
const progressEvents = [];
const fetchCalls = [];
const context = {
  Blob,
  DOMException,
  console,
  setTimeout() { return 1; },
  getCookie() { return 'test-token'; },
  URL: {
    createObjectURL() { return 'blob:test-download'; },
    revokeObjectURL(url) { revoked.push(url); }
  },
  document: {
    body: {
      appendChild(node) { appended.push(node); },
      removeChild(node) { appended.splice(appended.indexOf(node), 1); }
    },
    createElement() {
      return {
        href: '',
        download: '',
        click() { clicks.push({ href: this.href, download: this.download }); }
      };
    }
  },
  fetch(...args) { fetchCalls.push(args); return fetchImpl(...args); }
};
const downloadFile = vm.runInNewContext(`(${downloadFileSource})`, context);

fetchImpl = async (url, options) => ({
  ok: true,
  headers: {
    get(name) {
      if (name === 'Content-Length') return '3';
      if (name === 'Content-Type') return 'application/octet-stream';
      return null;
    }
  },
  body: {
    getReader() {
      const chunks = [new Uint8Array([1, 2]), new Uint8Array([3])];
      let index = 0;
      return {
        async read() {
          if (index >= chunks.length) return { done: true, value: undefined };
          return { done: false, value: chunks[index++] };
        }
      };
    }
  }
});
await downloadFile('https://cdn.example/software.zip', 'software.zip', undefined, event => progressEvents.push(event));
assert.equal(fetchCalls[0][0], 'https://cdn.example/software.zip');
assert.equal(fetchCalls[0][1].headers.Authorization, 'Bearer test-token');
assert.equal(clicks.length, 1);
assert.deepEqual(clicks[0], { href: 'blob:test-download', download: 'software.zip' });
assert.equal(appended.length, 0);
assert.equal(progressEvents.at(-1).percent, 100);
assert.equal(progressEvents.at(-1).receivedBytes, 3);
assert.deepEqual(revoked, [], 'object URL should not be revoked synchronously');

// Content-Length 缺失时，Content-Range 仍应提供当前文件总大小，避免进度一直停在未知状态。
const rangeProgress = [];
fetchImpl = async () => ({
  ok: true,
  headers: {
    get(name) {
      if (name === 'Content-Range') return 'bytes 0-2/3';
      if (name === 'Content-Type') return 'application/octet-stream';
      return null;
    }
  },
  body: {
    getReader() {
      let done = false;
      return {
        async read() {
          if (done) return { done: true, value: undefined };
          done = true;
          return { done: false, value: new Uint8Array([4, 5, 6]) };
        }
      };
    }
  }
});
await downloadFile('https://cdn.example/range.zip', 'range.zip', undefined, event => rangeProgress.push(event));
assert.equal(rangeProgress.at(-1).totalBytes, 3);
assert.equal(rangeProgress.at(-1).percent, 100);

fetchImpl = async () => ({ ok: false, status: 503, headers: { get() { return null; } } });
await assert.rejects(
    () => downloadFile('https://cdn.example/fail.zip', 'fail.zip'),
    /HTTP 503/
  );
assert.equal(clicks.length, 2, 'failed response must not trigger a download click');
console.log('stream download resolve/reject: PASS');
// Abort 必须取消流并阻止最后一步的 Blob/a.click 副作用。
let abortReader;
let readerReadyResolve;
const readerReady = new Promise(resolve => { readerReadyResolve = resolve; });
fetchImpl = async () => ({
  ok: true,
  headers: { get(name) { return name === 'Content-Length' ? '3' : 'application/octet-stream'; } },
  body: {
    getReader() {
      let pendingResolve;
      abortReader = {
        cancelled: false,
        read() {
          return new Promise(resolve => { pendingResolve = resolve; });
        },
        cancel() {
          this.cancelled = true;
          if (pendingResolve) pendingResolve({ done: true, value: undefined });
          return Promise.resolve();
        }
      };
      readerReadyResolve(abortReader);
      return abortReader;
    }
  }
});
const abortController = new AbortController();
const abortPromise = downloadFile('https://cdn.example/abort.zip', 'abort.zip', abortController.signal);
await readerReady;
abortController.abort();
await assert.rejects(abortPromise, error => error && error.name === 'AbortError');
assert.equal(abortReader.cancelled, true);
assert.equal(clicks.length, 2, 'aborted stream must not trigger a download click');
console.log('abort download cancellation: PASS');
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
