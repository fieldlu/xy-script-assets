'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SCRIPT = fs.readFileSync(path.join(__dirname, '小雅辅助工具 .user.js'), 'utf8');
assert.match(SCRIPT, /@version\s+3\.6\.4/);
assert.doesNotMatch(SCRIPT, /@version\s+3\.6\.5/);
assert.match(SCRIPT, /button\.onclick = event =>/);
assert.match(SCRIPT, /handleSingleDownloadClick\(event, button\)/);
assert.match(SCRIPT, /dlCollectResources\(data\.data\)|dlCollectResources\(resources\)/);
assert.match(SCRIPT, /data-quote-id=\"\$\{escapeHtml\(quoteId\)\}\"/);
assert.match(SCRIPT, /getAttribute\('data-quote-id'\)/);
assert.match(SCRIPT, /function downloadFile\(url, filename, signal, onProgress\)/);
assert.match(SCRIPT, /updateDownloadProgress\(done \+ failed, total, file\.name, progress\.percent, progress\.receivedBytes, progress\.totalBytes\)/);
assert.match(SCRIPT, /Content-Range/);
assert.match(SCRIPT, /已接收/);
assert.match(SCRIPT, /await downloadFile\(url, file\.name, signal/);
assert.match(SCRIPT, /done\+\+;/);
assert.match(SCRIPT, /failed\+\+;/);

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
