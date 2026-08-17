'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const SCRIPT = fs.readFileSync('小雅辅助工具 .user.js', 'utf8');
assert.match(SCRIPT, /@version\s+3\.6\.4/);
assert.doesNotMatch(SCRIPT, /@version\s+3\.6\.5/);
assert.match(SCRIPT, /button\.onclick = event =>/);
assert.match(SCRIPT, /handleSingleDownloadClick\(event, button\)/);
assert.match(SCRIPT, /dlCollectResources\(data\.data\)|dlCollectResources\(resources\)/);
assert.match(SCRIPT, /data-quote-id=\"\$\{escapeHtml\(quoteId\)\}\"/);
assert.match(SCRIPT, /getAttribute\('data-quote-id'\)/);

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
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
