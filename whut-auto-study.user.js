// ==UserScript==
// @name         WUT网上党校 全能助手
// @namespace    https://gitee.com/fieldlu/party-member-treasury
// @version      1.3.1
// @description  全自动学习+云端题库+多Provider AI答题(DeepSeek/Kimi/ChatGPT/Claude/Gemini/智谱/千问)：视频断点续播/智能跳课、云端查答案/自动答题/强制捕获上传
// @author       FieldLu
// @license      MIT
// @match        *://wsdx.whut.edu.cn/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-idle
// @connect      gitee.com
// @connect      giteeusercontent.com
// @connect      whut-qbank-worker.tianye0126.workers.dev
// @connect      api.deepseek.com
// @connect      api.moonshot.cn
// @connect      api.openai.com
// @connect      open.bigmodel.cn
// @connect      dashscope.aliyuncs.com
// @connect      api.anthropic.com
// @connect      generativelanguage.googleapis.com
// @icon         iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAYAAAA4qEECAAAAAXNSR0IArs4c6QAAEthJREFUeF7lXXlwHNWZ/32vu+eW5EO2LM2MT41sHMNyY0JxGDBsSLCXYyGhyG4CaxuqKAMLJGxls1SAcBQkMQRjjnAluxtSgQRYCMdClgCJAZsYW7bMIWNpZOseyRrNjDRXv+X1WELHzHRPd49lKu8fCuv1977vN6+/913va8JhNpprFs2WZMdChfFTXDw7KwPZT+CLQGol46iRwGcKlrOgSJZYtwqKcWC/TGpzClLzoMT2ZoEdR+7d2XU4iUZTzUxboMHvJloFrp4C0BkEPocAyQpfKkhViboA/ioHtgyQ85WGcONnVmhafXZKgI7ULQpySbqKA+dInB8HoNx88CRJn2aBR7LEXp4XbmqyClypz5dbwHH8dAYXr1a4+m8EnFQqo3bOT4O9McyUpwZ96m+WNTWl7KRdiFbZge6sOcrrkIcu58C1RDjiUAhldI0MsQ4V/J7eCnljuQEvK9DdgforJbB7CHy6UeGnYl6apI4UsTsD4dmbCG9mysFDWYCO1IVWEuM/AejIcjBdLppZoqYIHP+8pG3nVrvXsBXoyIz6SnjoHgBrqPwHnN1YaPRUACmmPLMH0tpTw439di1iG9CRYP05xOlnAJbaxdxU0kmT1B6D9A+L2nZtsYMPW4Du9S++mpH6oB0MHW40DkiuH7a2zrxrhUXdbQnonurFFcyp/g6Esy0ROtzQncDPMMlvfSzVnLui5c1hs6yaxqdjTv0sh4w/EOh4s4uX9JxXBVWqQIrAEwQkCVBNs1/S0mLyEMmNfbK00qxrb4rTaF1DdYbhDYAfVTLHJh+gChWOC6NwXDAIVpfRwM7udCL7sXP0v2q3BGRMiWSIqxTJu8OS78wTW7Z0GnpgzKSSuRIgpxn/gIC5pS5my3wXh+OsOFw39UJakAaYFmECjzNkP3Ig9VwF0q/5oPbIORPC5pEiqSMsVRxbKtglAS3UhVNmrx/KnVwIJ6rMwvmtKFzr+3IqZWRwgPdLSL/lRvKJachscwPcXrTFzu6RpRWlqBHDQPOlSx190dSfD5lONoiNtCQJ9209UE4cyu3usSNNSL3mxfCD05FtdNkKuNDZn0jO01a0fHjACKuGgOaAdMAfepkTVhohesjneFS4b4jA9d0BQJm8fYVaSf6mEsMbZmi73a4xRMrb/ram04zQMwR0JBi6ERz3GJpsZNVyzGGA4x8H4Lm1B+TJoys4kP3EgcSts5B5y2MbBxHZ9a+hlkbhqBUduth119UfIzP6qx6hw+XvyjkxeO/tAk3PfxIKa2Xo3plIPjVNMxXtGO2Kb/WyvdteKEar6Eq52AUaCTQ1FsYI504O+ahhZD5wG7IklLPj8N7fCWES5h1ZIPnrKm13Y8g62GmSPv2z13/yhR+9ESl4eBf7FfoCof8CcJkdv7opGiKntWwY7psjkE8cwtDdM5F8fLoxsM8fhPdnXSBnAZODA6kXfUjcVKOZhlZHjBxPzW3b9Z2Sge72h46WCR9g8lluladxz0tHDWs6NduqAHHSVmNzMpBCKSh/H4NybvwLsDLQdqH22uvZyAQ41/XBc3OkcAZSgP2CD4nv1YAnrIGtgtAiV1xwfMsHz+UDKO97wwG5LxDaRsAyW1GdQExePgTfwx2gqiz4EANPASTkdXOQsB7yyM7TwNCd1Ug+ZmBnKxzeDV1wrBosLAYHkr+sQuKWWUDWmhpJQvq4dt9HSwwD3ecPXQXCprKC/NUEfJs6QTOyJS/Dk5RTI7+Yrmsb06wMKp/dBya8yEIjCyTuqEbyUX16esz2SN5rFrd+uHHivEk/IcdxSn8g2owyutjyKQn4HuwAzdB7/wuLpbYoiF4YABeuts5QVsbgfbgz95YUGHyQYfCf6pDd6tYjV/TvMaak3pXrZl/y2esDYydOAro/EFrPgfssrVbkYU1dPNQBmln6Th4hq+6XEbuyDtldTmNsyhzejZ1wnBcrOl/Y2YMXBcAPWHNqBpjz2gXhnfcXBFrbzf7oHhCCxiQobZYs1MWDndZA3icjtq4W2R2ukhZni1KofL4NVFXkLeLA0P0zMHyvVgxleiRJ3lPbtru+INB9wYZvgvNfm16h2E62oJPH7eS1pYOsPU+A564uOC+LFhWPxwnRVUGonxh8WwpQa3FUXXbsZ1tHsRynOiKB0KsEnGM30PLyBHwPWdzJpaqLPEKwhiQqX2oDuYqH81K/r0D8ujn6JmQRoGLM2Tg3vHM0Xj8KdG9dwxLG+G7bQRYH30YbQDa7kye8v95NHXB8vbiuFjb14PkBZC3u6j2satEJ4a1azd8o0JFA6FoCNtgJtHzywZ1swoQbVRftMmL/UpsLc9owRCzE92iHrhum2dY/mG1pxQhzbwiFd1w/EeidBHzFEuUxD8snHXRGrFgX3RJi3/Yj22RNX47b1NOyqHy9FaymuNXD+yQMrJwL3q1vPhbC7IDk+nhha6PmwGg7OlG3cO4wk1rsqurUdrJwRiyALPjivRJia2uR2WLNtp0IhHdjBxyriqsPkZWJra9B+rlK03tPnARvOP2hS/a82awBbacnaIczMlaycoCtrBqE74FO3Voq7VBcP8c00OLBOFPWB8NNP9eA7g80/IKDX2mJIgA7rIt8PNgNNvOnUfl/rSB3ceuD9zMMLF9gKeA0yBzPzgvvuji3owOhMGDNSbFLXRT6sdUuCbGrai27yBp9t4qqV8PF4x+a7gIGv+lH5i/mMzIJkiOBtt3VdDCz3Q5w01pf87qe3WdZJ+u9UWqvhLgdOpsBvsfboZwV11sSidurkXzYfNVxhhjec/sD1BOoP10Cvam7YrEJTg7vnV1wXDyoq/csrSOqPW0C23O3vpcoeE39rgLxa63p6ffdNSspEqy/gjg9ZhUA8qrw3N4Nx0WHAOwuCfGrrVkjrhsicF/Xpyt2+h03Ypf7LcWq9ym+/6C+QMOdAL9Zd0UjE1wc3ru7tLItI9d/1B5JC13StNLDpVZ3tvM7B+C5rUdXquzHDkS/PjdX62dyJEm6lyL++qeJ6FKTNCY/5lLhvaNbV42owuO7og6sOgth1xaNqhVgToAdW2PugHRcHNVyinpD8Bk9ax54zHyq64Ds+i31BUJvfW5Xn6q3YCl/z6mRHjguiubd2Vo8eUzsQj7tYCKgWAizENhdMmJXzSnZGlFWR+F7wADQPRKiK+aBD5iPUfdLrh3U5w99CMLflQKkobkF1MhEkEdoKaeLEoEuU6ktM2rEcUkU3p8YALr3INAWkgFxUj4VqqOLiKxFTwohL8C+4wtrRC8zopwRh/eBTlNqpFSnxrWuH+5/79XdM+Icsbqj08T6hOoQJ5F5Ta/DqqZGbuuGfPKQocyIpkZEqqtQ8UuR9Upxajw/6oHzCv36RLE5omdb09HC/yw70BouTg42KwN1n6K7g8SEsqsRAryPtsNxrr7DYofVoQFdVtVhCNb8k6yoEU1nr6lFpkBGmzwqKl4LQ5pXpAThIFvptz2IXV5n6RpHTnWU6zC0APLIo/IZcS3KZsr065IRv2pOXrClpUlUvtiWt8R3ItvJZyuQEGktC0M7DMth3lngadKj2s6+z6Q10nMwNjJhZ7tvimg3BYyModuqMfyI+ViHWKOPuRop4g89QYSCxXlGmCn3HOWMRM6pGXuFwuCik5war4rKV8KQ5uurDS16d0kAmXetJR56JPcr9rrgBoU3M00+XSR5TXqQnTJiV+ecGuUbB4P+BvwPHpFw4KvzP6+sNO8VCllzLngZkrJmgDTyTE6NiHo9k7GRa+bA/f0I5GOM3ctMPlOBxPXW9LOQq0Pxrafe4MITGJfeNyJo0Tmiri1dNnN8dGkNbFG+YEKNiGp/LatihE2RM7xmDtIvVFiG5j1P3YX2BP4XpuD5cTeG75uBzLvmsxFGJdLUyCZzTo3RNYRuj66cpyWIrQwR+H/bWRu0nMpi89PwPdoOaUkKIscmKnzSf/Ra4c3QszmnxpwaMbJA8vFpuZppiyNBSiTQ1lR9EOiGXwH88lJpaiA/sR9S/RcnuHYZ58fVSP53VVmvCwterTg1xWQVIdHo+UGozY5SIZk0P8Hk/wyEd3/bdLkBW5DSKn6kxZN7P3FxkfKZCq0y3857ffmklk+P50rOTIRYC6GY/G0lEjfWWKq9G6E9rtygpzpYJ7lc+4wGl8inouKZfZC+kiz6i2d3O5D40SxkNovbVEZOIHMbyIo1MnFFHmWIrg5AbbZeHSViHJvd85Z+49PXd4+tvXufgBMMiSoKu+/r1K/2ERn7JCH1fAWGfzoDaruiexXC0Pp5JlmxRkbJifroe2Zi+OczzLIx7rmI5G4Pte7wi38cBbrPH7odhB8YXUHcDal4ej+kBmNt48QpLjoPJB+bZjiKZ5SXkXnaFQpR6K5TlluIrojUaRX/FrIpY2n3M9fNi8KNd48DWnRXJMZEIY3hIR07jIon20HTjV+TEAdN6iWftsuzf3XZcscPHhXKqQm41vZDPmHYmJ2cR0q9qJ9hYA5O3C1PO+aUli0fjgNa/E9fILQZwPJSCIq7gJq3lu/+dTFCGUAkPtPveJB+1YfMDif4oJS7NqzX9kG8hy4VLJCB42sxOC6I5np3WDN5NW5FRkVL+IpbuhbGIHO8My+8azQXO+6E6gnWr5I4PV8SfQIclw7Ae1e3eUFFj41BpqmU7F4FIlOidsjajSsuXhZxkDIO5lPBgmmwuRmI9hEsmCl8M7YkIcZPVkVsRCR8LYC9V65ad1zL1kdGKE8yBSL+UJOR1pasLg1RA80WpsBm5ZqU5LuAaUHeKX3UihoZIrl3uzMdOK+5edQsmwR0nz+0DoSHCkopdvD5g3Df0qMBbChuMKWQmV9cUyOiLKLEu4dRyfm9+a07RaPF0TEJ6M6aGq+iVLUV6icqnxqH77EO3ZJX8+IdXk+mX/NqSWWjTbGGSO7Z7pwfPK/55XFORl4vIlJXfwWxPPV4Eofv6f1Qlg8VRUMY/eKypXzCEGC6RnXqAc9sc2k7mncaF6JH8tywuHX7TydyX9BdiwRCjRMv3dPsDKZt3gvohACG7p+O4ftmapVKIm2kqZipHqIDzWcK2OysoVIGYQXFr6yDOBiNDnHp/u1KdtQleXpSFwZa65iLV8a2kRBBpKo/tegeeok7ZiK5KeddCStBFKs4Lo2adiSMClponrBoRN4v+WQVpKOHdRO+YieLOuxSQD7YRmL58S0fvJePj+IdaAKhhwlYO/qgT0XV2y1aYWLBIQLma2uRfsU37iQQfTmEQ6GclYAoqjkUQ0QSRQ+84Y3Tkf3oi9iFcmYc3g2dedsBaepiXS14h/GdLGSJkfP3c9t2XlhILt1WP+Qh4cSMdtB1/7AHrrWFK3yyn4oy1yAwlCfPJpqeLEjBedkAHKsHcyrFWjpuslzCJo8yrbtM8slpuUuZeX5XDWxRyjCmIirT6ET8itLUhWAgSXLnZm/dMtOtfgSRSF39OcTo1RGJRIzD93gH5KMn5934AZa7rrZZP8simqGI9j3KaUMQ9RtS0IJnJ8CNMaT/5EH6Da/mbRo5wLS6EREbqVCR+dCJ+JrSQRa4tCuek5bt3V40HWgodjnxehxNy2p1EaJJlBYHThEy25xa1MvUDVeZa619pGOGIR2RhOTPQDhEGm0RIBJckkBTNH7V7pRprrLaJSO7O9ebVNxFFLq41KGsiGs1eHHR7qdEdSEiBX2y55ZQy/Zb9dY1BLQg0u8PvTaxwaAorYJDHOcE0RXAtpiz4ErcBBAJX3lCMlXgLeIhIhEsWvPoxUX0EBB/N5lYFg0GP2mbfaaR3tKGgdZ6Rbv4Hwn80LQxNgLQFM7JtcysOdFoT2nDQAuZDqcmsFOIMcraBHZEsClvazyVCIvrcIeirfGIjH+rO/uQNuoeC7ZDZn/4W9HZU9J6fgRsraf0QPolIpw9xW902ZYXRk1S+5iCc7XRXtElu+BGuBe9pfuCoeuJY1z81cizX4Y5A8x53YLwTsvt6UqyOooB019Xf4zK6Lkp6/1v86+WAfvkAHPd0BDe/qIdpG0DWnPXZ9RXkoc2ceBbX95POBHSJD3eTPKNh+UnnMb+6rlOvfyXX8aPkvWS+/tH2LSLx2Ji644eS1g4z5Fg/RriJD4UWZbOkHa80oJGiqRYktiN88JND9tFcyKdsgE9stDOpUsdtdH01Z+HbG8kIFAuQczQFXqYEzb0DEu/WtbTpNPNyswKXzxTdqBHTUEcp/QGoxeTiu+yKf76RYakrYNMumtR665nrcFn/OlDBvRYltrnhY5QMuxcYnwN41x8HrWsfAhbOMWkbSrofylDG+vam0oqfTMOZ+GZZRXQCIMd85fMV7L8a8TV4znoXDs/V805f/PzL9O9052t+p8j27e0GeGnXHOmHOiJgokPsMsu5zIHVxc51OyiNJPqmYq64h9gp2aZsvuTJHXH4fhLhmX2lPJ5pXKBO5bu/wMr7XHPLkz6IwAAAABJRU5ErkJggg==

// ==/UserScript==

(function () {
'use strict';


// ==================== 云端题库配置 ====================
const CLOUD = {
    rawBase: 'https://gitee.com/fieldlu/party-member-treasury/raw/master/qbank',
    apiBase: 'https://gitee.com/api/v5/repos/fieldlu/party-member-treasury/contents/qbank',
    workerBase: 'https://whut-qbank-worker.tianye0126.workers.dev',
    giteeToken: (() => {
        const stored = GM_getValue('whut_gitee_token', '');
        return stored || '';
    })(),
    autoAnswerEnabled: GM_getValue('whut_autoAnswerEnabled', false),
    aiEnabled: GM_getValue('whut_aiEnabled', false),
    aiProvider: GM_getValue('whut_aiProvider', 'deepseek'),
    aiModel: GM_getValue('whut_aiModel', 'deepseek-chat'),
    aiKeys: {},       // { providerId: key } 本地缓存（仅从本地 GM_setValue 加载，绝不从云端读取）
    aiProviders: null // 从云端 ai-config.json 加载
};
let autoAnswerTimer = null;



  const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : '1.0.0';

  const CFG = { checkInterval: 2000, coursePageTimeout: 900 };
  const hacked = new WeakSet();
  let stats = { completed: 0, total: 0, startTime: 0, scriptDone: 0 };
  let timers = [];
  let stopped = false;
  let navigating = false;
  let courseList = [];
  let currentCourse = null;
  let xmId = '';
  let videoDuration = 0;
  let finishedDuration = 0;
  let lastVidUpdate = 0;
  let currentVidTime = 0;
  let courseRecoveryTimer = null;
  let watchdogProgressTime = Date.now();
  let watchdogLastCurrentTime = -1;
  const WATCHDOG_STUCK_LIMIT = 180000; // 3分钟无进展则强刷

  // ==================== 持久化存储（断点续播 + 后台重载恢复） ====================
  function saveState() {
    try {
      GM_setValue('whut_xmId', xmId);
      GM_setValue('whut_stopped', stopped);
      GM_setValue('whut_completed', stats.completed);
      GM_setValue('whut_total', stats.total);
      GM_setValue('whut_scriptDone', stats.scriptDone);
    } catch(e) {}
  }

  // 重载前完整保存（含 courseList、进度、当前课程）
  function saveStateForReload() {
    try {
      saveState();
      if (courseList.length > 0) {
        sessionStorage.setItem('whut_courseList', JSON.stringify(courseList));
      }
      if (currentCourse) {
        sessionStorage.setItem('whut_currentCourse', JSON.stringify(currentCourse));
      }
      if (finishedDuration > 0) {
        sessionStorage.setItem('whut_finishedDuration', finishedDuration);
      }
      // 保存完整课程状态用于跨重载渲染
      const fullInfo = { total: stats.total, completed: stats.completed, scriptDone: stats.scriptDone };
      sessionStorage.setItem('whut_courseInfo', JSON.stringify(fullInfo));
      sessionStorage.setItem('whut_reload_reason', 'auto_recovery');
    } catch(e) {}
  }

  function renderCourseList() {
    if (!listEl) return;
    let html = '';
    const full = sessionStorage.getItem('whut_fullList');
    if (full) {
      try {
        JSON.parse(full).forEach(c => {
          const mode = c.studyMode || '';
          const prog = c.progress != null ? parseFloat(c.progress)
            : (c.finishedDuration >= c.duration ? 1 : 0);
          const cls = prog >= 1 ? 'done' : (prog > 0 ? 'half' : (mode !== 'WLXX' && mode !== '' ? 'skip' : 'todo'));
          html += '<span class=\"' + cls + '\">' + (prog >= 1 ? '✔' : (prog > 0 ? '◐' : '○')) + ' ' + (c.courseName || c.name || '') + ' ' + Math.round(prog * 100) + '%</span>\n';
        });
      } catch(e) {}
    }
    if (!html && courseList.length > 0) {
      courseList.forEach(c => {
        html += '<span class=\"todo\">○ ' + (c.courseName || c.name) + ' 0%</span>\n';
      });
    }
    if (html) listEl.innerHTML = html;
  }

  function loadState() {
    try {
      xmId = GM_getValue('whut_xmId', '');
      const wasStopped = GM_getValue('whut_stopped', true);
      stats.completed = GM_getValue('whut_completed', 0) | 0;
      stats.total = GM_getValue('whut_total', 0) | 0;
      stats.scriptDone = GM_getValue('whut_scriptDone', 0) | 0;
      // 尝试恢复课程列表
      const saved = sessionStorage.getItem('whut_courseList');
      if (saved) {
        try { courseList = JSON.parse(saved); } catch(e) {}
      }
      const savedCourse = sessionStorage.getItem('whut_currentCourse');
      if (savedCourse) {
        try { currentCourse = JSON.parse(savedCourse); } catch(e) {}
      }
      const savedFd = sessionStorage.getItem('whut_finishedDuration');
      if (savedFd) finishedDuration = parseFloat(savedFd) || 0;
      // 检查是否从重载中恢复
      const reloadReason = sessionStorage.getItem('whut_reload_reason');
      if (reloadReason) {
        sessionStorage.removeItem('whut_reload_reason');
        // 清理一次性恢复标记
        sessionStorage.removeItem('whut_finishedDuration');
        return 'reload_recovery';
      }
      if (xmId && wasStopped === false) {
        stopped = false;
        return 'session_restore';
      }
    } catch(e) {}
    return false;
  }

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];
  function isDetailPage() { return location.href.includes('/myTrain/detail'); }
  function isCoursePage() { return location.href.includes('/myTrain/course'); }

  // ==================== ID ====================
  function getXmId() {
    const qs = (location.hash || '').split('?')[1] || '';
    if (!qs) return '';
    const p = new URLSearchParams(qs);
    if (isCoursePage()) return p.get('xmId') || '';
    if (isDetailPage()) return p.get('id') || '';
    return p.get('xmId') || p.get('id') || '';
  }
  function getResourceId() {
    const qs = (location.hash || '').split('?')[1] || '';
    if (!qs || !isCoursePage()) return '';
    return new URLSearchParams(qs).get('id') || '';
  }

  // ==================== API ====================
  const API = {
    getXm: () => fetch('/api/student/xm/getById', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'id=' + xmId,
    }).then(r => r.json()),
    getCourse: (rid) =>
      fetch('/api/student/recommendCourse/getById?id=' + rid + '&xmId=' + xmId).then(r => r.json()),
  };

  // ==================== Toast 通知 ====================
  function toast(msg, duration) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:999999;'
      + 'background:#1e1e2e;color:#a6e3a1;padding:10px 24px;border-radius:20px;'
      + 'font:13px "Microsoft YaHei",sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.5);'
      + 'animation:fadeInOut ' + (duration || 3) + 's ease both;pointer-events:none;border:1px solid rgba(166,227,161,.3)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (duration || 3) * 1000);
  }

  // ==================== UI 面板 ====================
  let logEl, statusEl, progressEl, courseNameEl, listEl;
  let vidBarEl, vidTimeEl, vidTotalEl, vidEtaEl, bannerEl;

  function createPanel() {
    if (document.getElementById('__whut_panel')) return;

    // 注入动画
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeInOut{0%{opacity:0;transform:translateX(-50%) translateY(-10px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}85%{opacity:1}100%{opacity:0}}';
    document.head.appendChild(style);

    const d = document.createElement('div');
    d.id = '__whut_panel';
    d.innerHTML =
      '<style>'
      + '#__whut_panel *{box-sizing:border-box;margin:0;padding:0}'
      + '#__whut_panel{position:fixed;top:80px;right:10px;z-index:99999;width:310px;background:#16161e;color:#cdd6f4;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.65);font:12px/1.5 "Microsoft YaHei",sans-serif;border:1px solid #252536;user-select:none}'
      // header
      + '#__whut_panel .hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;cursor:move;border-bottom:1px solid #252536}'
      + '#__whut_panel .hdr .title{font-size:14px;font-weight:700;color:#cba6f7;display:flex;align-items:center;gap:6px}'
      + '#__whut_panel .hdr .title .ico{font-size:16px}'
      + '#__whut_panel .hdr .btns{display:flex;gap:6px;align-items:center}'
      + '#__whut_panel .hdr .btns button{width:22px;height:22px;border-radius:6px;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}'
      + '#__whut_panel .hdr .btn-hide{background:#313244;color:#a6adc8}'
      + '#__whut_panel .hdr .btn-close{background:#313244;color:#f38ba8}'
      // banner
      + '#__whut_panel .banner{display:none;padding:8px 16px;background:rgba(203,166,247,.08);border-bottom:1px solid #252536;font-size:12px;color:#cba6f7;text-align:center;font-weight:600}'
      // body
      + '#__whut_panel .body{padding:12px 16px}'
      // status block
      + '#__whut_panel .stat-blk{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#1e1e2e;border-radius:8px;margin-bottom:10px}'
      + '#__whut_panel .stat-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}'
      + '#__whut_panel .stat-dot.idle{background:#585b70}'
      + '#__whut_panel .stat-dot.scan{background:#f9e2af;animation:pulse 1s infinite}'
      + '#__whut_panel .stat-dot.play{background:#a6e3a1;animation:pulse 1s infinite}'
      + '#__whut_panel .stat-dot.done{background:#cba6f7}'
      + '#__whut_panel .stat-dot.err{background:#f38ba8}'
      + '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}'
      + '#__whut_panel .stat-txt{flex:1;min-width:0}'
      + '#__whut_panel .stat-txt .st1{font-size:13px;font-weight:700}'
      + '#__whut_panel .stat-txt .st2{font-size:10px;color:#a6adc8;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      // video progress
      + '#__whut_panel .vid-blk{display:none;margin-bottom:10px;padding:8px 10px;background:#1e1e2e;border-radius:8px}'
      + '#__whut_panel .vid-blk .vid-row{display:flex;justify-content:space-between;font-size:10px;color:#a6adc8;margin-bottom:4px}'
      + '#__whut_panel .vid-blk .vid-row .vid-cur{color:#a6e3a1;font-weight:600}'
      + '#__whut_panel .vid-blk .vid-row .vid-tot{color:#cdd6f4}'
      + '#__whut_panel .vid-blk .vid-row .vid-eta{color:#f9e2af}'
      + '#__whut_panel .vid-bar-wrap{height:5px;background:#313244;border-radius:3px;overflow:hidden}'
      + '#__whut_panel .vid-bar-inner{height:100%;background:linear-gradient(90deg,#a6e3a1,#cba6f7);border-radius:3px;transition:width 1s linear;width:0%}'
      // course progress
      + '#__whut_panel .course-blk{margin-bottom:10px}'
      + '#__whut_panel .course-row{display:flex;justify-content:space-between;font-size:10px;color:#a6adc8;margin-bottom:3px}'
      + '#__whut_panel .course-row .val{color:#f5c2e7;font-weight:600}'
      + '#__whut_panel .course-bar-wrap{height:4px;background:#313244;border-radius:2px;overflow:hidden}'
      + '#__whut_panel .course-bar-inner{height:100%;background:linear-gradient(90deg,#cba6f7,#f5c2e7);border-radius:2px;transition:width .5s;width:0%}'
      // course list
      + '#__whut_panel .clist-label{font-size:10px;color:#585b70;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}'
      + '#__whut_panel .clist{font-size:10px;color:#a6adc8;max-height:180px;overflow-y:auto;line-height:1.7;white-space:pre-wrap;background:#11111b;border-radius:6px;padding:6px 8px}'
      + '#__whut_panel .clist .done{color:#a6e3a1}'
      + '#__whut_panel .clist .half{color:#f9e2af}'
      + '#__whut_panel .clist .todo{color:#a6adc8}'
      + '#__whut_panel .clist .skip{color:#585b70}'
      // log
      + '#__whut_panel .log-label{font-size:10px;color:#585b70;text-transform:uppercase;letter-spacing:1px;margin:6px 0 4px}'
      + '#__whut_panel .log{height:90px;overflow-y:auto;font-size:10px;color:#a6adc8;line-height:1.7;background:#11111b;border-radius:6px;padding:6px 8px}'
      + '#__whut_panel .log .l{padding:1px 0;border-bottom:1px solid rgba(255,255,255,.03)}'
      + '#__whut_panel .log .l.ok{color:#a6e3a1}'
      + '#__whut_panel .log .l.warn{color:#fab387}'
      + '#__whut_panel .log .l.err{color:#f38ba8}'
      // actions
      + '#__whut_panel .acts{margin-top:8px;display:flex;gap:6px}'
      + '#__whut_panel .acts button{flex:1;padding:8px 0;border:none;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;transition:all .2s;letter-spacing:.5px}'
      + '#__whut_panel .acts button:active{transform:scale(.96)}'
      + '#__whut_panel .btn-go{background:linear-gradient(135deg,#a6e3a1,#89d89b);color:#1e1e2e}'
      + '#__whut_panel .btn-go:hover{box-shadow:0 0 16px rgba(166,227,161,.3)}'
      + '#__whut_panel .btn-scan{background:linear-gradient(135deg,#89b4fa,#74a8f5);color:#1e1e2e}'
      + '#__whut_panel .btn-scan:hover{box-shadow:0 0 16px rgba(137,180,250,.3)}'
      + '#__whut_panel .btn-stop{background:linear-gradient(135deg,#f38ba8,#e87a95);color:#1e1e2e}'
      + '#__whut_panel .btn-stop:hover{box-shadow:0 0 16px rgba(243,139,168,.3)}'
      + '#__whut_panel.collapsed .body{display:none}'
      + '</style>'
      // HTML
      + '<div class="hdr" id="__whut_hd">'
      + '<div class="title"><span class="ico">📖</span>党校学习</div>'
      + '<div class="btns"><button class="btn-hide" id="__whut_hide" title="折叠">−</button></div>'
      + '</div>'
      + '<div class="banner" id="__whut_banner"></div>'
      + '<div class="body" id="__whut_body">'
      // 状态块
      + '<div class="stat-blk"><div class="stat-dot idle" id="__whut_dot"></div>'
      + '<div class="stat-txt"><div class="st1" id="__whut_status">待命中</div><div class="st2" id="__whut_substatus">等待操作</div></div></div>'
      // 视频进度
      + '<div class="vid-blk" id="__whut_vidBlk">'
      + '<div class="vid-row"><span class="vid-cur" id="__whut_vidCur">0:00</span><span class="vid-eta" id="__whut_vidEta"></span><span class="vid-tot" id="__whut_vidTot">0:00</span></div>'
      + '<div class="vid-bar-wrap"><div class="vid-bar-inner" id="__whut_vidBar"></div></div></div>'
      // 课程进度
      + '<div class="course-blk"><div class="course-row"><span>课程进度</span><span class="val" id="__whut_progress">0 / 0</span></div>'
      + '<div class="course-bar-wrap"><div class="course-bar-inner" id="__whut_crsBar"></div></div></div>'
      // 课程列表
      + '<div class="clist-label">课程状态</div><div class="clist" id="__whut_courselist"></div>'
      // 日志
      + '<div class="log-label">运行日志</div><div class="log" id="__whut_log"></div>'
      // 按钮
      + '<div class="acts">'
      + '<button class="btn-go" id="__whut_start">▶ 全自动学习</button>'
      + '<button class="btn-scan" id="__whut_scan">🔄 扫描进度</button>'
      + '<button class="btn-stop" id="__whut_stop">⏹ 停止</button>'
      + '</div></div>';

    document.body.appendChild(d);

    // 绑定引用
    logEl = $('#__whut_log'); statusEl = $('#__whut_status');
    progressEl = $('#__whut_progress'); courseNameEl = $('#__whut_substatus');
    listEl = $('#__whut_courselist');
    vidBarEl = $('#__whut_vidBar'); vidTimeEl = $('#__whut_vidCur');
    vidTotalEl = $('#__whut_vidTot'); vidEtaEl = $('#__whut_vidEta');
    bannerEl = $('#__whut_banner');

    // 事件
    $('#__whut_start').addEventListener('click', start);
    $('#__whut_stop').addEventListener('click', stop);
    $('#__whut_scan').addEventListener('click', () => scanAndStart());
    $('#__whut_hide').addEventListener('click', () => d.classList.toggle('collapsed'));
    makeDraggable(d, $('#__whut_hd'));
  }

  function makeDraggable(el, hd) {
    let ox, oy, dx, dy, mv, up;
    hd.addEventListener('mousedown', e => {
      ox = e.clientX; oy = e.clientY;
      const r = el.getBoundingClientRect(); dx = r.left; dy = r.top;
      mv = ev => { el.style.left = (dx + ev.clientX - ox) + 'px'; el.style.top = (dy + ev.clientY - oy) + 'px'; el.style.right = 'auto'; };
      up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); mv = up = null; };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
      // 防止在窗口外松开鼠标导致事件监听泄漏
      document.addEventListener('mouseleave', up, { once: true });
    });
  }

  // ==================== UI 更新 ====================
  function setState(st) {
    const dot = $('#__whut_dot');
    if (dot) dot.className = 'stat-dot ' + st;
  }

  function setStatus(s, sub) {
    if (statusEl) statusEl.textContent = s;
    if (courseNameEl && sub !== undefined) courseNameEl.textContent = sub;
  }

  function setBanner(msg) {
    if (bannerEl) { bannerEl.textContent = msg; bannerEl.style.display = msg ? 'block' : 'none'; }
  }

  function updateCourseProgress() {
    const actual = (stats.completed|0) + (stats.scriptDone|0);
    if (progressEl) progressEl.textContent = actual + ' / ' + (stats.total|0);
    const bar = $('#__whut_crsBar');
    if (bar && stats.total > 0) bar.style.width = Math.min(100, (actual / (stats.total|0)) * 100) + '%';
  }

  function updateVidProgress() {
    const v = $('video');
    if (v && v.duration && !v.ended) {
      currentVidTime = v.currentTime;
      const total = v.duration; // 使用真实 video.duration，不依赖 API 推算
      const blk = $('#__whut_vidBlk');
      if (blk) blk.style.display = 'block';
      const pct = Math.min(100, (currentVidTime / total) * 100);
      if (vidBarEl) vidBarEl.style.width = pct + '%';
      if (vidTimeEl) vidTimeEl.textContent = fmtTime(currentVidTime);
      if (vidTotalEl) vidTotalEl.textContent = fmtTime(total);
      if (vidEtaEl) {
        const rem = total - currentVidTime;
        vidEtaEl.textContent = rem > 0 ? '剩余 ' + fmtTime(rem) : '';
      }
    }
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function log(msg, type) {
    const t = new Date().toLocaleTimeString();
    const el = document.createElement('div');
    el.className = 'l' + (type ? ' ' + type : '');
    el.textContent = t + '  ' + msg;
    if (logEl) { logEl.appendChild(el); logEl.scrollTop = logEl.scrollHeight; }
    console.log('%c[学习]', 'color:#cba6f7', msg);
    // 重要事件 toast
    if (type === 'ok' && (msg.includes('完成') || msg.includes('进入'))) toast(msg, 2);
    if (type === 'err') toast(msg, 4);
  }

  function showXmIdInput() {
    let box = $('#__whut_xmIdBox');
    if (!box) {
      box = document.createElement('div');
      box.id = '__whut_xmIdBox';
      box.style.cssText = 'margin-top:8px;display:flex;gap:4px';
      box.innerHTML = '<input id="__whut_xmIdInput" placeholder="或直接粘贴培训班ID到这里" style="flex:1;padding:6px 10px;border:1px solid #f9e2af;border-radius:6px;background:#11111b;color:#f9e2af;font-size:10px"><button id="__whut_xmIdBtn" style="padding:6px 12px;background:#f9e2af;color:#1e1e2e;border:none;border-radius:6px;cursor:pointer;font-size:10px;font-weight:700;white-space:nowrap">确认</button>';
      const body = $('#__whut_body');
      if (body) {
        const acts = body.querySelector('.acts');
        if (acts) body.insertBefore(box, acts);
        else body.appendChild(box);
      }
      $('#__whut_xmIdBtn').addEventListener('click', () => {
        const v = $('#__whut_xmIdInput').value.trim();
        if (v) { xmId = v; log('手动ID: ' + v, 'ok'); box.remove(); scanAndStart(); }
      });
    }
    box.style.display = 'flex';
  }

  // ==================== 视频劫持 ====================
  function hackVideo(video) {
    if (hacked.has(video)) return;
    hacked.add(video);

    video.muted = true;
    video.playbackRate = 1;

    // 智能计算跳播时长：处理 API 返回秒/分钟单位不一致
    let seekTo = finishedDuration;
    let seekDone = false;
    let seekRetries = 0;
    const MAX_SEEK_RETRIES = 20; // 10秒内每500ms重试

    const doSeek = () => {
      if (seekDone || seekRetries >= MAX_SEEK_RETRIES) return;
      if (!video.duration || video.duration <= 0) return;
      seekRetries++;
      // 单位修正：如果 finishedDuration 远大于实际时长，可能是重复乘了60
      if (seekTo > video.duration * 1.5) {
        const fixed = seekTo / 60;
        if (fixed > 0 && fixed < video.duration - 5) {
          log('单位修正: ' + fmtTime(seekTo) + ' → ' + fmtTime(fixed), 'warn');
          seekTo = fixed;
        }
      }
      if (seekTo > 0 && seekTo < video.duration - 5) {
        seekDone = true;
        video.currentTime = seekTo;
        watchdogLastCurrentTime = seekTo;
        watchdogProgressTime = Date.now();
        log('跳过已看 ' + fmtTime(seekTo) + '，继续播放', 'info');
      }
    };
    // 事件驱动 + 定时兜底，防 SPA 不触发原生事件
    video.addEventListener('loadedmetadata', doSeek);
    video.addEventListener('canplay', () => { doSeek(); }, { once: false });
    if (video.readyState >= 2 && video.duration) doSeek();

    const forceTimer = setInterval(() => {
      if (video.ended) { clearInterval(forceTimer); return; }
      if (!seekDone) doSeek(); // 定时重试跳播
      if (video.paused) {
        video.play().catch(() => { });
      } else {
        // 看门狗：视频在播放但 currentTime 变了才算有进展
        if (Math.abs(video.currentTime - watchdogLastCurrentTime) > 0.2) {
          watchdogLastCurrentTime = video.currentTime;
          watchdogProgressTime = Date.now();
        }
      }
      updateVidProgress();
    }, 500);

    video.play().catch(() => { });

    video.addEventListener('ended', () => {
      clearInterval(forceTimer);
      updateVidProgress();
      log('视频播放完毕 ✔', 'ok');
      toast('本视频播放完毕，自动进入下一节', 2);
      onVideoEnded();
    });
    video.addEventListener('emptied', () => { clearInterval(forceTimer); hacked.delete(video); });
    video.addEventListener('abort', () => { clearInterval(forceTimer); hacked.delete(video); });

    const vShow = fmtTime(video.duration || videoDuration);
    log('已接管 · 总长 ' + vShow, 'info');
    updateVidProgress();
  }

  function hackAllVideos() { $$('video').forEach(hackVideo); return $$('video').length; }

  // ==================== 结束处理 ====================
  let videoEndedHandled = false; // 防止 ended 事件和循环检测重复触发导航
  function onVideoEnded() {
    if (stopped || videoEndedHandled) return;
    videoEndedHandled = true;
    setTimeout(() => { tryGoNextOrBack(); videoEndedHandled = false; }, 1500);
  }

  function tryGoNextOrBack() {
    if (stopped || navigating) return;

    const kws = ['下一节', '下一章', '下一个', '继续学习', '继续'];
    for (const kw of kws) {
      for (const el of $$('button, a, span, div[class*=btn]')) {
        if (!el.offsetParent) continue;
        if ((el.textContent || '').trim().includes(kw)) {
          log('→ ' + kw, 'ok');
          navigating = true;
          el.click();
          setTimeout(() => { navigating = false; }, 2500);
          return;
        }
      }
    }

    const items = $$('.el-menu-item,[class*=chapter] [class*=item],[class*=lesson],[class*=catalog] li,[role=treeitem]').filter(e => e.offsetParent);
    for (let i = 0; i < items.length - 1; i++) {
      if ((items[i].className || '').match(/\b(active|is-active|current)\b/)) {
        log('→ 目录下一项', 'ok');
        navigating = true;
        items[i + 1].click();
        setTimeout(() => { navigating = false; }, 2500);
        return;
      }
    }

    if (courseList.length > 1) {
      log('本节完成 → 返回列表重扫', 'ok');
      stats.scriptDone = (stats.scriptDone | 0) + 1;
      updateCourseProgress();
      goBackAndContinue();
    } else {
      log('全部完成 → 返回列表', 'ok');
      stats.scriptDone = 0;
      stats.completed = stats.total | 0;
      updateCourseProgress();
      goBackAndContinue();
    }
  }

  function goBackAndContinue() {
    cancelCourseRecovery();
    sessionStorage.setItem('whut_goto_detail', xmId);
    saveStateForReload();
    location.reload();
  }

  // ==================== 扫描 ====================

  // 静默拉取课程列表和进度（不导航，只填充数据供课程页初始化用）
  async function fetchCourseStats() {
    try {
      const resp = await API.getXm();
      if (resp.code !== 0 || !resp.data) return;
      const list = resp.data.xmCourseSetting.chooseCourseList;
      setBanner(resp.data.name);
      courseList = list
        .filter(c => {
          const mode = c.studyMode || '';
          if (mode !== 'WLXX' && mode !== '') return false;
          if (!c.resourceId) return false;
          const prog = c.progress != null ? parseFloat(c.progress) : 0;
          return prog < 1;
        })
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
      // 过滤掉当前正在播放的课程，避免重复进入
      const resId = getResourceId();
      if (resId) courseList = courseList.filter(c => String(c.resourceId) !== resId);
      const totalOnline = list.filter(c => c.resourceId).length;
      stats.total = totalOnline | 0;
      stats.completed = (totalOnline - list.filter(c => {
        const mode = c.studyMode || '';
        if (mode !== 'WLXX' && mode !== '') return false;
        const prog = c.progress != null ? parseFloat(c.progress) : 0;
        return prog < 1;
      }).length) | 0;
      updateCourseProgress();
      // 渲染课程列表
      let html = '';
      list.forEach(c => {
        const mode = c.studyMode || '';
        const prog = c.progress != null ? parseFloat(c.progress) : (c.finishedDuration >= c.duration ? 1 : 0);
        const cls = prog >= 1 ? 'done' : (prog > 0 ? 'half' : (mode !== 'WLXX' && mode !== '' ? 'skip' : 'todo'));
        html += '<span class=\"' + cls + '\">' + (prog >= 1 ? '✔' : (prog > 0 ? '◐' : '○')) + ' ' + (c.courseName || c.name) + ' ' + Math.round(prog * 100) + '%</span>\n';
      });
      if (listEl) listEl.innerHTML = html;
    } catch(e) {}
  }

  // 静默扫描：只拉API渲染课程状态，不启动自动学习
  async function scanAndRender() {
    try {
      const resp = await API.getXm();
      if (resp.code !== 0 || !resp.data) return;
      const list = resp.data.xmCourseSetting.chooseCourseList;
      sessionStorage.setItem('whut_fullList', JSON.stringify(list));
      setBanner(resp.data.name);
      // 渲染全部课程状态
      let html = '';
      list.forEach(c => {
        const mode = c.studyMode || '';
        const prog = c.progress != null ? parseFloat(c.progress)
          : (c.finishedDuration >= c.duration ? 1 : 0);
        const cls = prog >= 1 ? 'done' : (prog > 0 ? 'half' : (mode !== 'WLXX' && mode !== '' ? 'skip' : 'todo'));
        html += '<span class=\"' + cls + '\">' + (prog >= 1 ? '✔' : (prog > 0 ? '◐' : '○')) + ' ' + (c.courseName || c.name) + ' ' + Math.round(prog * 100) + '%</span>\n';
      });
      if (listEl) listEl.innerHTML = html;
      // 填充 courseList 和 stats
      courseList = list
        .filter(c => {
          const mode = c.studyMode || '';
          if (mode !== 'WLXX' && mode !== '') return false;
          if (!c.resourceId) return false;
          return (c.progress != null ? parseFloat(c.progress) : 0) < 1;
        })
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
      const resId = getResourceId();
      if (resId) courseList = courseList.filter(c => String(c.resourceId) !== resId);
      stats.total = list.filter(c => c.resourceId).length | 0;
      stats.completed = (stats.total - courseList.length + (resId ? 1 : 0)) | 0;
      updateCourseProgress();
    } catch(e) {}
  }

  async function scanAndStart() {
    xmId = getXmId();
    if (!xmId) {
      setStatus('请先进入培训班详情页', '路径: 我的培训 → 选择培训班 → 点击进入');
      setState('err');
      log('未检测到培训班ID，请进入培训班详情页', 'err');
      log('当前页面: ' + location.href, 'warn');
      log('正确地址示例: /#/myTrain/detail?id=培训班ID', 'warn');
      showXmIdInput();
      return;
    }

    setStatus('正在获取课程列表...', '请稍候');
    setState('scan');
    setBanner('');

    let data;
    try {
      const resp = await API.getXm();
      if (resp.code !== 0) throw new Error('服务器返回 code=' + resp.code);
      data = resp.data;
    } catch (e) {
      setStatus('获取失败', e.message);
      setState('err');
      log('API 请求失败: ' + e.message, 'err');
      showXmIdInput();
      return;
    }

    setBanner(data.name);
    log('培训班: ' + data.name, 'ok');
    const list = data.xmCourseSetting.chooseCourseList;
    sessionStorage.setItem('whut_fullList', JSON.stringify(list));

    // 筛选 WLXX 未完成
    courseList = list
      .filter(c => {
        const mode = c.studyMode || '';
        if (mode !== 'WLXX' && mode !== '') return false;
        if (!c.resourceId) return false;
        const prog = c.progress != null ? parseFloat(c.progress) : 0;
        return prog < 1;
      })
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // 渲染课程列表（带颜色）
    let html = '';
    list.forEach(c => {
      const mode = c.studyMode || '';
      const prog = c.progress != null ? parseFloat(c.progress)
        : (c.finishedDuration >= c.duration ? 1 : 0);
      const cls = prog >= 1 ? 'done' : (prog > 0 ? 'half' : (mode !== 'WLXX' && mode !== '' ? 'skip' : 'todo'));
      const icon = prog >= 1 ? '✔' : (prog > 0 ? '◐' : '○');
      const pct = Math.round(prog * 100) + '%';
      html += '<span class="' + cls + '">' + icon + ' ' + (c.courseName || c.name) + ' ' + pct + '</span>\n';
    });
    if (listEl) listEl.innerHTML = html;

    const totalOnline = list.filter(c => c.resourceId).length;
    stats.total = totalOnline | 0;
    stats.completed = (totalOnline - courseList.length) | 0;
    updateCourseProgress();

    if (courseList.length === 0) {
      setStatus('全部完成!', totalOnline + ' 门课程已全部通过');
      setState('done');
      toast('所有课程已完成!', 3);
      navigating = false;
      return;
    }

    setStatus('准备开始', '共 ' + totalOnline + ' 门，剩 ' + courseList.length + ' 门待完成');
    setState('play');
    toast('开始自动学习 · 剩余 ' + courseList.length + ' 门', 2);
    enterNextCourse();
  }

  async function enterNextCourse() {
    if (stopped || courseList.length === 0) {
      setStatus('全部完成!', stats.total + ' 门课程已全部通过');
      setState('done');
      toast('全部课程已完成!', 3);
      navigating = false;
      return;
    }

    navigating = true;
    currentCourse = courseList.shift();
    const name = currentCourse.courseName || currentCourse.name;
    setStatus('进入课程', name);
    setState('play');
    updateCourseProgress();

    videoDuration = 0;
    finishedDuration = 0;
    try {
      const resp = await API.getCourse(currentCourse.resourceId);
      if (resp.code === 0 && resp.data) {
        videoDuration = (resp.data.duration || 0) * 60;
        const fd = resp.data.finishDruation != null ? resp.data.finishDruation
          : (resp.data.finishedDuration != null ? resp.data.finishedDuration : 0);
        finishedDuration = (fd || 0) * 60;
        if (finishedDuration > 0) {
          log('已看 ' + fmtTime(finishedDuration) + '，将跳过', 'info');
        }
      }
    } catch (e) { /* 静默 */ }

    // 真刷新进课：保存已完成进度 + 跳播位置 + 目标课程
    saveStateForReload();
    sessionStorage.setItem('whut_finishedDuration', finishedDuration);
    sessionStorage.setItem('whut_goto_course', JSON.stringify({
      resourceId: currentCourse.resourceId,
      xmId: xmId
    }));
    location.reload();
    // 如果 reload 被浏览器拦截未生效，恢复课程到列表头部防止丢课
    courseList.unshift(currentCourse);
    navigating = false;
  }

  // ==================== 重载恢复 ====================
  function scheduleCourseRecovery() {
    cancelCourseRecovery();
    courseRecoveryTimer = setTimeout(() => {
      if (!stopped && isCoursePage() && $$('video').length === 0 && !navigating) {
        log('超时无视频，强制刷新恢复...', 'warn');
        saveStateForReload(); location.reload();
      }
    }, 45000);
  }

  function cancelCourseRecovery() {
    if (courseRecoveryTimer) { clearTimeout(courseRecoveryTimer); courseRecoveryTimer = null; }
  }

  // ==================== 课程循环 ====================
  function startCourseLoop() {
    stats.startTime = Date.now();
    navigating = false;
    videoEndedHandled = false;
    watchdogProgressTime = Date.now();
    watchdogLastCurrentTime = -1;
    let watchdogStuckStart = 0;

    const timer = setInterval(() => {
      if (stopped) { clearInterval(timer); return; }
      if (!isCoursePage()) { clearInterval(timer); return; }

      const vids = $$('video');
      if (vids.length > 0) { cancelCourseRecovery(); }
      if (vids.length === 0) {
        window.scrollTo(0, document.body.scrollHeight);
        if (Date.now() - stats.startTime > CFG.coursePageTimeout * 1000) {
          log('超时无视频，返回列表', 'warn');
          clearInterval(timer);
          goBackAndContinue();
        }
      } else {
        hackAllVideos();
        // 🐕 看门狗：3分钟无播放进展则强刷
        if (Date.now() - watchdogProgressTime > WATCHDOG_STUCK_LIMIT) {
          log('看门狗：视频卡死超过3分钟，强制刷新恢复', 'err');
          setTimeout(() => { saveStateForReload(); location.reload(); }, 500);
          clearInterval(timer);
          return;
        }
        // 🐕 子检测：连续卡在0:00超过30秒则强刷（以首次检测到卡死时间为准，避免慢网误判）
        const allPaused = vids.every(v => v.paused && !v.ended);
        const stuckAtZero = allPaused && vids.some(v => v.currentTime < 0.5);
        if (stuckAtZero) {
          if (!watchdogStuckStart) watchdogStuckStart = Date.now();
          if (Date.now() - watchdogStuckStart > 30000) {
            log('视频卡死在0:00持续30秒，强制刷新恢复', 'err');
            setTimeout(() => { saveStateForReload(); location.reload(); }, 500);
            clearInterval(timer);
            return;
          }
        } else {
          watchdogStuckStart = 0;
        }
        const allDone = vids.every(v => v.ended || (isFinite(v.duration) && v.duration > 0 && v.currentTime >= v.duration - 1));
        if (allDone && !navigating) {
          clearInterval(timer);
          setTimeout(() => tryGoNextOrBack(), 1500);
        }
      }
    }, CFG.checkInterval);
    timers.push(timer);
  }

  // ==================== 启动/停止 ====================
  function start() {
    stopped = false; navigating = false;
    stats = { completed: 0, total: 0, startTime: 0, scriptDone: 0 };
    courseList = []; currentCourse = null;
    timers.forEach(clearInterval); timers = [];
    cancelCourseRecovery();
    updateCourseProgress();
    log('▶ 全自动学习启动', 'ok');
    saveState();
    scanAndStart();
  }

  function stop() {
    stopped = true; navigating = false;
    timers.forEach(clearInterval); timers = [];
    cancelCourseRecovery();
    if (videoObserver) { videoObserver.disconnect(); videoObserver = null; }
    // 清理 sessionStorage，防止手动刷新后误恢复
    sessionStorage.removeItem('whut_reload_reason');
    sessionStorage.removeItem('whut_courseList');
    sessionStorage.removeItem('whut_currentCourse');
    sessionStorage.removeItem('whut_finishedDuration');
    courseList = [];
    setStatus('已停止', '点击"开始学习"继续');
    setState('idle');
    const vBlk = $('#__whut_vidBlk');
    if (vBlk) vBlk.style.display = 'none';
    log('已停止 · 状态已保存，下次打开可继续', 'warn');
    saveState();
  }

  // ==================== URL 监听 ====================
  let lastUrl = location.href;
  let urlWatcher = setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (!stopped) {
        if (isCoursePage()) {
          navigating = false;
          // 从 loadState 恢复的数据渲染课程状态（不调 API，避免覆盖 scriptDone）
          renderCourseList();
          updateCourseProgress();
          setStatus('播放中...', currentCourse ? (currentCourse.courseName || currentCourse.name) : '');
          setState('play');
          let waited = 0;
          const w = setInterval(() => {
            waited++;
            if ($$('video').length > 0 || waited > 15) { clearInterval(w); startCourseLoop(); hackAllVideos(); }
          }, 1000);
        } else if (isDetailPage()) {
          navigating = false;
          setTimeout(() => { if (!stopped && isDetailPage()) scanAndStart(); }, 1500);
        }
      }
    }
  }, 1000);

  // ==================== 视频进度轮询 ====================
  let vidProgressTimer = setInterval(() => {
    if (!stopped && isCoursePage()) updateVidProgress();
  }, 2000);

  // ==================== 初始化 ====================
  let videoObserver = null;

  function init() {
    createPanel();

    videoObserver = new MutationObserver(mutations => {
      for (const m of mutations)
        for (const node of m.addedNodes) {
          if (node.nodeName === 'VIDEO') hackVideo(node);
          if (node.querySelectorAll) node.querySelectorAll('video').forEach(hackVideo);
        }
    }).observe(document.body || document.documentElement, { childList: true, subtree: true });

    // 从课程页回详情页的真刷新标记
    const gotoDetail = sessionStorage.getItem('whut_goto_detail');
    if (gotoDetail) {
      sessionStorage.removeItem('whut_goto_detail');
      stopped = false;
      xmId = gotoDetail;
      loadState(); // 恢复进度/课程列表等
      location.href = '#/myTrain/detail?id=' + xmId;
      return;
    }

    const gotoCourse = sessionStorage.getItem('whut_goto_course');
    if (gotoCourse) {
      sessionStorage.removeItem('whut_goto_course');
      try {
        const c = JSON.parse(gotoCourse);
        stopped = false;
        xmId = c.xmId;
        loadState(); // 恢复 finishedDuration、进度、currentCourse、courseList
        location.href = '#/myTrain/course?id=' + c.resourceId + '&xmId=' + c.xmId;
      } catch(e) {}
      return;
    }

    // 尝试恢复上次状态
    const restored = loadState();
    if (restored === 'reload_recovery') {
      log('后台重载恢复 · 培训班: ' + xmId, 'ok');
      log('恢复进度: ' + stats.completed + '/' + stats.total, 'info');
      if (courseList.length > 0) log('待完成: ' + courseList.length + ' 门', 'info');
      stopped = false;
    } else if (restored === 'session_restore') {
      log('已恢复上次会话 · 培训班ID: ' + xmId, 'ok');
      log('上次进度: ' + stats.completed + '/' + stats.total, 'info');
    }

    if (isCoursePage() && !stopped) {
      xmId = getXmId() || xmId;
      if (xmId) {
        const v = $('video');
        if (v && v.currentTime > 0) finishedDuration = v.currentTime;
        // 如果是重载恢复且已有 courseList，直接接管；否则异步拉取
        if (restored !== 'reload_recovery' || courseList.length === 0) {
          fetchCourseStats();
        } else {
          updateCourseProgress();
        }
        log('已检测到课程页面，自动接管', 'ok');
        setStatus('后台运行中', currentCourse ? (currentCourse.courseName || currentCourse.name) : '');
        setState('play');
        startCourseLoop();
      }
    } else if (isDetailPage()) {
      xmId = getXmId() || xmId;
      if (!xmId) {
        setStatus('请进入培训班', '点击左侧「我的培训」→ 选择培训班');
        setState('idle');
        return;
      }
      // 始终拉取并渲染全部课程状态
      scanAndRender();
      if (restored === 'reload_recovery' && !stopped && courseList.length > 0) {
        log('重载恢复：自动进入下一门课...', 'ok');
        setTimeout(() => { navigating = true; enterNextCourse(); }, 800);
      } else if (restored === 'session_restore' && !stopped) {
        log('检测到未完成任务，自动恢复...', 'ok');
        setTimeout(() => { if (isDetailPage()) scanAndStart(); }, 1000);
      } else {
        setStatus('准备就绪', '点击「全自动学习」开始');
        setState('idle');
      }
    } else {
      setStatus('请进入培训班', '点击左侧「我的培训」→ 选择培训班');
      setState('idle');
      log('请进入培训班详情页后使用', 'warn');
    }
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);


// ==================== 题库模块 ====================


    // ==========================================
    // ☁️ 云端题库配置
    // ==========================================
    
    // ==========================================
    // 1. 本地数据库模块
    // ==========================================
    const DB_KEY = 'whut_qbank_db_v1';

    function getDB() {
        try { return JSON.parse(GM_getValue(DB_KEY, '[]')); } catch (e) { return []; }
    }

    function saveToDB(newQuestions) {
        let db = getDB();
        let addedCount = 0;
        let addedItems = [];
        let existingIds = new Set(db.map(q => q.content));

        for (let raw of newQuestions) {
            let q = normalizeQuestion(raw);
            if (!q || !q.content) continue;
            if (!existingIds.has(q.content)) {
                db.push(q);
                existingIds.add(q.content);
                addedItems.push(q);
                addedCount++;
            }
        }

        if (addedCount > 0) {
            GM_setValue(DB_KEY, JSON.stringify(db));
            updateStats(db.length);
            // 自动上传到云端（AI答案不可靠，不自动上传）
            const verifiedItems = addedItems.filter(q => q.source !== 'ai');
            if (verifiedItems.length > 0) {
                contributeToCloud(verifiedItems, true); // 静默上传，失败不打扰
            }
            if (addedItems.length > verifiedItems.length) {
                qlog(`[入库] ${addedItems.length - verifiedItems.length} 题来自AI未验证，已保存本地但不上传云端`, 'warn');
            }
        }
        return addedCount;
    }

    function clearDB() {
        if(confirm("确定清空本地题库吗？清空后无法恢复！（云端题库不受影响）")) {
            GM_deleteValue(DB_KEY);
            updateStats(0);
            qlog("本地数据库已清空。");
        }
    }

    // ==========================================
    // 2. 数据清洗与规范化
    // ==========================================
    function normalizeQuestion(raw) {
        let q = raw.dataJson || raw;
        let typeStr = String(q.type || raw.type || raw.realType || '');
        let content = q.content || raw.content || '';
        let answer = q.answer || raw.answer || '';
        let options = q.options || raw.options || [];

        if (!content) return null;

        let realType = "未知题型";
        if (typeStr.includes('SINGLE')) realType = "单选题";
        else if (typeStr.includes('MULTIPLE')) realType = "多选题";
        else if (typeStr.includes('JUDGMENT')) realType = "判断题";
        else if (typeStr.includes('BLANKFILL')) realType = "填空题";
        else if (raw.realType) realType = raw.realType;

        content = content.replace(/<[^>]+>/g, '').trim();
        content = content.replace(/\[BlankArea\d*\]/gi, '______');

        let normOptions = [];
        if (Array.isArray(options)) {
            normOptions = options.map(opt => ({
                alias: opt.alisa || opt.alias || '',
                text: (opt.text || '').replace(/<[^>]+>/g, '').trim()
            }));
        }

        if (realType === "判断题") {
            if (answer === 'Y' || answer === 'true') answer = "正确";
            else if (answer === 'N' || answer === 'false') answer = "错误";
        } else if (realType === "填空题" && raw.blanks && Array.isArray(raw.blanks)) {
            answer = raw.blanks.map(b => b.value).join(" ; ");
        }

        return { type: realType, content, options: normOptions, answer,
            blanks: (raw.blanks || q.blanks || []),
            source: raw.source || q.source || 'import',
            verified: raw.verified || q.verified || false
        };
    }

    function extractQuestionsFromData(obj) {
        let questions = [];
        let cache = new Set();

        function search(item) {
            if (!item || typeof item !== 'object' || cache.has(item)) return;
            cache.add(item);
            if ((item.type || item.realType) && item.content) {
                const typeStr = typeof item.type === 'string' ? item.type : '';
                const realTypeStr = typeof item.realType === 'string' ? item.realType : '';
                if ((typeStr || realTypeStr) && ['SINGLE', 'MULTIPLE', 'JUDGMENT', 'BLANKFILL', 'ESSAY'].some(t => typeStr.includes(t) || realTypeStr.includes(t))) {
                    const qid = item.id || item.questionId || item.itemId || item.uuid || '';
                    questions.push({ ...item, id: qid || item.id });
                    // 填空题找到后跳过子对象搜索，避免把每个空当作独立题目
                    if (typeStr.includes('BLANKFILL') || realTypeStr.includes('BLANKFILL')) return;
                }
            }
            for (let key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) search(item[key]);
            }
        }
        search(obj);
        return questions;
    }

    // ==========================================
    // ☁️ 云端题库引擎 — 无课程分组，纯题目存储，逐题比对
    // ==========================================

    let cloudBank = null;

    // GM_xmlhttpRequest 封装 — 优先用 responseText，兼容性最好
    function gmFetch(url, opts = {}) {
        const method = opts.method || 'GET';
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method, url, timeout: 15000,
                headers: Object.assign({ 'Accept': 'application/json' }, opts.headers || {}),
                data: opts.body || undefined,
                onload: (r) => {
                    const status = r.status || 0;
                    const ok = status >= 200 && status < 300;
                    const raw = r.responseText || '';
                    let _parsed = undefined;
                    let _parsedDone = false;
                    resolve({
                        ok, status,
                        rawText: raw,
                        json: () => {
                            if (_parsedDone) return Promise.resolve(_parsed);
                            _parsedDone = true;
                            if (!raw) { _parsed = null; return Promise.resolve(null); }
                            try { _parsed = JSON.parse(raw); } catch(e) { _parsed = null; }
                            return Promise.resolve(_parsed);
                        },
                        text: () => Promise.resolve(raw)
                    });
                },
                onerror: () => resolve({ ok: false, status: 0, rawText: '', json: () => Promise.resolve(null), text: () => Promise.resolve('') }),
                ontimeout: () => resolve({ ok: false, status: 0, rawText: '', json: () => Promise.resolve(null), text: () => Promise.resolve('') })
            });
        });
    }

    // 加载云端全量题库：优先合并文件 → 回退逐课加载
    async function loadCloudBank(forceRefresh = false) {
        if (cloudBank && !forceRefresh) return cloudBank;

        // 尝试加载已合并的 qbank.json
        const qres = await gmFetch(`${CLOUD.rawBase}/qbank.json?t=${Date.now()}`);
        if (qres.ok) {
            const data = await qres.json().catch(() => null);
            if (Array.isArray(data) && data.length > 0) {
                cloudBank = data;
                qlog(`☁️ 云端题库已加载：${cloudBank.length} 题`, 'ok');
                updateCloudUI(cloudBank.length);
                return cloudBank;
            }
        }

        // 回退：逐课加载
        const idxRes = await gmFetch(`${CLOUD.rawBase}/index.json?t=${Date.now()}`);
        qlog(`[云端] index.json → ${idxRes.status}`, idxRes.ok ? 'ok' : 'warn');
        if (!idxRes.ok) {
            qlog('⚠️ 云端题库暂不可用');
            updateCloudUI(0);
            return [];
        }
        const index = await idxRes.json().catch(() => ({}));
        const courses = index.courses || [];
        if (!courses.length) { qlog('⚠️ 云端无课程数据'); updateCloudUI(0); return []; }

        qlog(`☁️ 加载 ${courses.length} 门课程...`);
        const results = await Promise.all(courses.map(async (c) => {
            const r = await gmFetch(`${CLOUD.rawBase}/${encodeURIComponent(c)}.json?t=${Date.now()}`);
            return r.ok ? (await r.json().catch(() => []) || []) : [];
        }));

        cloudBank = [];
        const seen = new Set();
        for (const bank of results) {
            if (!Array.isArray(bank)) continue;
            for (const q of bank) {
                const k = (q.content || '').replace(/\s+/g, '').substring(0, 30);
                if (!seen.has(k)) { seen.add(k); cloudBank.push(q); }
            }
        }
        qlog(`☁️ 云端题库已加载：${cloudBank.length} 题`, 'ok');
        updateCloudUI(cloudBank.length);

        // 异步合并推送
        if (CLOUD.giteeToken && cloudBank.length > 0) {
            setTimeout(() => mergeAndPushQbank(cloudBank), 100);
        }
        return cloudBank;
    }

    async function mergeAndPushQbank(questions) {
        try {
            let sha = null;
            const cr = await gmFetch(`${CLOUD.apiBase}/qbank.json?access_token=${CLOUD.giteeToken}&t=${Date.now()}`);
            if (cr.ok) {
                const info = await cr.json();
                if (info && typeof info === 'object' && !Array.isArray(info) && info.sha) {
                    sha = info.sha;
                }
            }
            const body = { access_token: CLOUD.giteeToken, content: toBase64(JSON.stringify(questions, null, 2)), message: `自动合并题库：${questions.length} 题`, branch: 'master' };
            if (sha) body.sha = sha;
            const method = sha ? 'PUT' : 'POST';
            const ur = await gmFetch(`${CLOUD.apiBase}/qbank.json`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (ur.ok || ur.status === 201) qlog(`☁️ qbank.json 已同步`, 'ok');
        } catch(e) {}
    }

    // 从云端查询单个答案（逐题比对）
    async function queryCloudAnswer(questionContent) {
        const bank = await loadCloudBank();
        if (!bank.length) return null;
        const normalizedQuery = questionContent.replace(/<[^>]+>/g, '').trim();
        const queryKeywords = extractKeywords(normalizedQuery);
        const found = bank.find(q => {
            let dbContent = (q.content || '').replace(/<[^>]+>/g, '').trim();
            const dbKeywords = extractKeywords(dbContent);
            const overlap = queryKeywords.filter(k => dbKeywords.includes(k)).length;
            return overlap >= Math.min(queryKeywords.length, 3);
        });
        return found || null;
    }

    // 从云端批量查询答案（逐题比对）
    async function queryCloudBatch(questions) {
        const bank = await loadCloudBank();
        if (!bank.length) return questions.map(() => null);
        return questions.map(q => {
            const normalizedQuery = (q.content || '').replace(/<[^>]+>/g, '').trim();
            const queryKeywords = extractKeywords(normalizedQuery);
            const found = bank.find(bq => {
                let dbContent = (bq.content || '').replace(/<[^>]+>/g, '').trim();
                const dbKeywords = extractKeywords(dbContent);
                const overlap = queryKeywords.filter(k => dbKeywords.includes(k)).length;
                return overlap >= Math.min(queryKeywords.length, 3);
            });
            return found || null;
        });
    }

    // 提取关键词（去标点 + 停用词）
    function extractKeywords(text) {
        return text
            .replace(/[，。、；：？！""''（）()《》【】\[\]{}.,;:!?\"\'\(\)\[\]{}<>\/\\|@#$%^&*+=~`_-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 2)
            .filter(w => !['以下','选项','的是','正确','错误','关于','下列','不是','属于'].includes(w));
    }

    // 贡献到云端（Gitee API → Worker 回退，失败不阻塞）
    function toBase64(str) {
        // 用 TextEncoder 实现可靠的 UTF-8 → base64
        const bytes = new TextEncoder().encode(str);
        let bin = '';
        bytes.forEach(b => bin += String.fromCharCode(b));
        return btoa(bin);
    }

    async function contributeToCloud(questions, silent = false) {
        if (!questions || questions.length === 0) return false;
        const cleanQuestions = questions.map(q => ({
            type: q.type, content: q.content, options: q.options, answer: q.answer
        }));
        if (!CLOUD.giteeToken) { if (!silent) qlog('⚠️ 未配置 Gitee Token'); return false; }

        // 构建最终内容（新题 + 本地全库合并去重）
        const allLocal = getDB().filter(q => q.source !== 'ai');
        const merged = [...allLocal, ...cleanQuestions];
        const seen = new Set();
        const unique = merged.filter(q => {
            const k = (q.content || '').replace(/\s+/g, '').substring(0, 30);
            if (seen.has(k)) return false;
            seen.add(k); return true;
        });
        const jsonStr = JSON.stringify(unique, null, 2);

        // 先 GET 确认文件是否存在，获取 sha
        const getUrl = `${CLOUD.apiBase}/qbank.json?access_token=${CLOUD.giteeToken}&t=${Date.now()}`;
        const cr = await gmFetch(getUrl);
        if (!silent) qlog(`[Gitee GET] 状态=${cr.status}`, cr.ok ? 'ok' : 'warn');

        let sha = null;
        if (cr.ok) {
            const info = await cr.json();
            // Gitee 对不存在的文件可能返回 []，需要排除
            if (info && typeof info === 'object' && !Array.isArray(info) && info.sha) {
                sha = info.sha;
                if (!silent) qlog(`[Gitee] 文件已存在 sha=${sha.substring(0, 8)}...`, 'ok');
            } else {
                if (!silent) qlog('[Gitee] 文件不存在，将创建新文件');
            }
        } else if (cr.status === 0) {
            if (!silent) qlog('⚠️ Gitee API 网络不通，检查 @connect 或网络', 'warn');
            return false;
        }
        // 404 = 文件不存在，sha 保持 null

        const body = {
            access_token: CLOUD.giteeToken,
            content: toBase64(jsonStr),
            message: `题库更新：${unique.length} 题 [${new Date().toLocaleDateString()}]`,
            branch: 'master'
        };
        if (sha) body.sha = sha;

        // 有 sha → 更新用 PUT；无 sha → 新建用 POST
        const method = sha ? 'PUT' : 'POST';
        const uploadUrl = `${CLOUD.apiBase}/qbank.json`;
        const ur = await gmFetch(uploadUrl, {
            method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        if (!silent) qlog(`[Gitee ${method}] 状态=${ur.status}`, (ur.ok || ur.status === 201) ? 'ok' : 'warn');

        if (ur.ok || ur.status === 201) {
            if (!silent) qlog(`☁️ 上传成功！云端共 ${unique.length} 题`, 'ok');
            cloudBank = null; return true;
        }
        const errText = await ur.text().catch(() => '');
        if (!silent) qlog(`⚠️ Gitee 上传失败 (${ur.status}): ${errText.substring(0, 100)}`, 'warn');
        return false;
    }

    // 一键上传本地全部题库到云端
    async function uploadAllToCloud() {
        const db = getDB();
        if (db.length === 0) { qlog('[上传] 本地题库为空', 'warn'); return; }
        const verified = db.filter(q => q.source !== 'ai');
        const aiCount = db.length - verified.length;
        let msg = `准备上传全部 ${db.length} 题到云端`;
        if (aiCount > 0) msg += ` (含 ${aiCount} 题AI未验证将跳过)`;
        if (!confirm(msg + '，确定？')) return;
        qlog(`[上传] 正在上传 ${verified.length} 题...`);
        await contributeToCloud(verified);
        updateStats(db.length);
    }

    // ==========================================
    // 🎯 自动答题引擎
    // ==========================================
    
    function parseCurrentPageQuestions(course) {
        let found = [];
        let paperId = '';
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
            if (el.__vue__) {
                try {
                    let vueData = JSON.parse(JSON.stringify(el.__vue__.$data || {}));
                    if (!paperId) {
                        const pid = findPaperId(vueData);
                        if (pid) paperId = pid;
                    }
                    let extracted = extractQuestionsFromData(vueData);
                    extracted = extracted.map(q => ({ ...q, _el: el, paperId: paperId || (q.paperId || '') }));
                    found = found.concat(extracted);
                } catch(e) {}
            }
            if (el.__vue_app__) {
                try {
                    const appData = JSON.parse(JSON.stringify(el.__vue_app__));
                    let extracted = extractQuestionsFromData(appData);
                    extracted = extracted.map(q => ({ ...q, _el: el, paperId: paperId || (q.paperId || '') }));
                    found = found.concat(extracted);
                } catch(e) {}
            }
        }
        if (found.length === 0) {
            const questionEls = document.querySelectorAll('[class*="question"], [class*="topic"], [class*="subject"], .q-title, .q-content');
            questionEls.forEach(el => {
                const text = el.textContent.trim();
                if (text.length > 10) {
                    found.push({ content: text, type: '未知题型', options: [], answer: '', _el: el, paperId: '' });
                }
            });
        }
        return found;
    }

    // 递归搜索 paperId
    function findPaperId(obj) {
        if (!obj || typeof obj !== 'object') return '';
        if (obj.paperId && typeof obj.paperId === 'string' && obj.paperId.length > 20) return obj.paperId;
        if (obj.paperId && obj.paperId.id) return obj.paperId.id;
        const cache = new Set();
        function search(item) {
            if (!item || typeof item !== 'object' || cache.has(item)) return '';
            cache.add(item);
            if (item.paperId && typeof item.paperId === 'string' && item.paperId.includes('-')) return item.paperId;
            if (item.id && typeof item.id === 'string' && item.id.includes('-') && item.id.length > 20 && item.type) return ''; // skip question ids
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    const r = search(item[key]);
                    if (r) return r;
                }
            }
            return '';
        }
        return search(obj);
    }

    // 通过 API 提交答案（POST /api/student/paper/saveData）
    async function submitAnswersAPI(answerCacheItems) {
        if (!answerCacheItems || answerCacheItems.length === 0) return 0;
        // 找到 paperId
        let paperId = '';
        for (const item of answerCacheItems) {
            if (item.pq.paperId) { paperId = item.pq.paperId; break; }
            if (item.match && item.match.paperId) { paperId = item.match.paperId; break; }
            if (item.pq.id && item.pq.id.includes('-') && item.pq.id.length > 20) {
                // 从页面重新扫描获取 paperId
            }
        }
        if (!paperId) {
            // 从全部 Vue 实例找 paperId
            const allEls = document.querySelectorAll('*');
            for (const el of allEls) {
                if (el.__vue__) {
                    try {
                        const data = JSON.parse(JSON.stringify(el.__vue__.$data || {}));
                        paperId = findPaperId(data);
                        if (paperId) break;
                    } catch(e) {}
                }
                if (el.__vue_app__) {
                    try {
                        const appData = JSON.parse(JSON.stringify(el.__vue_app__));
                        paperId = findPaperId(appData);
                        if (paperId) break;
                    } catch(e) {}
                }
            }
        }
        if (!paperId) {
            qlog('[API提交] 未找到 paperId，尝试从页面数据提取...', 'warn');
            // 从 URL hash 找
            const hash = location.hash || '';
            const m = hash.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (m) paperId = m[0];
            // 从 document 全文找
            if (!paperId) {
                const txt = document.body.textContent || '';
                const m2 = txt.match(/paperId[=:]\s*["']?([0-9a-f-]{30,})/i);
                if (m2) paperId = m2[1];
            }
        }
        if (!paperId) { qlog('[API提交] 无法找到 paperId', 'err'); return 0; }

        // 构建 form body
        let body = 'paperId=' + encodeURIComponent(paperId);
        let count = 0;
        const seen = new Set();
        for (const item of answerCacheItems) {
            if (!item.match || !item.match.answer) continue;
            const pq = item.pq || {};
            const m = item.match || {};
            const qid = pq.id || pq.questionId || pq.itemId || m.id || m.questionId || '';
            if (!qid || qid.length < 3 || seen.has(qid)) continue;
            seen.add(qid);
            const ans = String(item.match.answer).trim();
            // 答案标准化为选项字母（处理 多选用逗号/分号/空格分隔 的情况）
            let ansLetters = [];
            if (ans === '正确' || ans === 'Y' || ans === 'true') ansLetters = ['Y'];
            else if (ans === '错误' || ans === 'N' || ans === 'false') ansLetters = ['N'];
            else if (ans.includes(',') || ans.includes('，') || ans.includes(';') || ans.includes('；') || (ans.length > 1 && /^[A-F\s,，;；]+$/i.test(ans))) {
                // 多选：拆分 "A,B,C" → ["A","B","C"]，每个添加独立的 Q-uuid 条目
                ansLetters = ans.split(/[,，;；\s]+/).filter(a => /^[A-FYNP]$/i.test(a)).map(a => a.toUpperCase());
            } else {
                // 单选：单字母或单答案
                if (/^[A-FYNP]$/i.test(ans)) ansLetters = [ans.toUpperCase()];
                else ansLetters = [ans]; // 填空题等非字母答案
            }
            for (const letter of ansLetters) {
                body += '&Q-' + encodeURIComponent(qid) + '=' + encodeURIComponent(letter);
            }
            count += ansLetters.length;
        }
        if (count === 0) { qlog('[API提交] 没有有效题目可提交', 'warn'); return 0; }

        qlog(`[API提交] 正在提交 ${count} 题... paperId=${paperId.substring(0,8)}...`);
        try {
            const resp = await fetch('/api/student/paper/saveData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: body
            });
            const json = await resp.json();
            if (json.code === 0) {
                qlog(`[API提交] 成功提交 ${count} 题`, 'ok');
                return count;
            }
            qlog(`[API提交] 服务器返回 code=${json.code}`, 'err');
            return 0;
        } catch(e) {
            qlog(`[API提交] 网络异常: ${e.message}`, 'err');
            return 0;
        }
    }

    // ==========================================
    // 🤖 多Provider AI 答题引擎 (DeepSeek/Kimi/OpenAI/Claude/Gemini/智谱/千问/自定义)
    // ==========================================
    const BUILTIN_AI_PROVIDERS = [
        {id:'deepseek',name:'DeepSeek',apiType:'openai-compatible',endpoint:'https://api.deepseek.com/v1/chat/completions',models:['deepseek-chat','deepseek-reasoner'],defaultModel:'deepseek-chat'},
        {id:'kimi',name:'Kimi (月之暗面)',apiType:'openai-compatible',endpoint:'https://api.moonshot.cn/v1/chat/completions',models:['moonshot-v1-8k','moonshot-v1-32k','moonshot-v1-128k'],defaultModel:'moonshot-v1-8k'},
        {id:'openai',name:'ChatGPT (OpenAI)',apiType:'openai-compatible',endpoint:'https://api.openai.com/v1/chat/completions',models:['gpt-4o','gpt-4o-mini','gpt-3.5-turbo'],defaultModel:'gpt-4o-mini'},
        {id:'claude',name:'Claude (Anthropic)',apiType:'anthropic',endpoint:'https://api.anthropic.com/v1/messages',models:['claude-sonnet-4-6','claude-haiku-4-5'],defaultModel:'claude-haiku-4-5'},
        {id:'gemini',name:'Gemini (Google)',apiType:'google',endpoint:'https://generativelanguage.googleapis.com/v1beta/models',models:['gemini-2.5-flash','gemini-2.5-pro'],defaultModel:'gemini-2.5-flash'},
        {id:'zhipu',name:'智谱 GLM',apiType:'openai-compatible',endpoint:'https://open.bigmodel.cn/api/paas/v4/chat/completions',models:['glm-4-plus','glm-4-flash'],defaultModel:'glm-4-flash'},
        {id:'qwen',name:'通义千问',apiType:'openai-compatible',endpoint:'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',models:['qwen-turbo','qwen-plus','qwen-max'],defaultModel:'qwen-turbo'},
        {id:'custom',name:'自定义 (OpenAI兼容)',apiType:'openai-compatible',endpoint:'',models:[],defaultModel:''}
    ];

    function getLocalKey(providerId) {
        if (CLOUD.aiKeys[providerId]) return CLOUD.aiKeys[providerId];
        const key = GM_getValue('whut_aiKey_' + providerId, '');
        if (key) CLOUD.aiKeys[providerId] = key;
        return key;
    }
    function setLocalKey(providerId, key) {
        CLOUD.aiKeys[providerId] = key;
        GM_setValue('whut_aiKey_' + providerId, key);
    }

    async function loadAIProviders() {
        if (CLOUD.aiProviders) return CLOUD.aiProviders;
        try {
            const res = await gmFetch(`${CLOUD.rawBase}/ai-config.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.providers) && data.providers.length > 0) {
                    CLOUD.aiProviders = data.providers;
                    return data.providers;
                }
            }
        } catch(e) {}
        CLOUD.aiProviders = BUILTIN_AI_PROVIDERS;
        return BUILTIN_AI_PROVIDERS;
    }

    // 上传密钥到 Gitee 云端（所有用户共享密钥池）
    async function saveAIKeysToCloud(providerId, key) {
        if (!CLOUD.giteeToken) return;
        try {
            const getUrl = `${CLOUD.apiBase}/ai-config.json?access_token=${CLOUD.giteeToken}&t=${Date.now()}`;
            const cr = await gmFetch(getUrl);
            if (!cr.ok) return;
            const info = await cr.json();
            if (!info || !info.sha) return;
            const content = atob(info.content || '');
            let config = JSON.parse(content);
            if (!config.keys) config.keys = {};
            config.keys[providerId] = key;
            const newContent = toBase64(JSON.stringify(config, null, 2));
            const body = {
                access_token: CLOUD.giteeToken, content: newContent,
                message: `更新 ${providerId} 密钥`, branch: 'master', sha: info.sha
            };
            await gmFetch(`${CLOUD.apiBase}/ai-config.json`, {
                method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
            });
        } catch(e) {}
    }

    function getCurrentProvider() {
        const providers = CLOUD.aiProviders || BUILTIN_AI_PROVIDERS;
        return providers.find(p => p.id === CLOUD.aiProvider) || providers[0];
    }

    function getCurrentEndpoint() {
        const p = getCurrentProvider();
        return p.endpoint || GM_getValue('whut_aiCustomEndpoint', '');
    }

    function getCurrentModel() {
        if (CLOUD.aiModel) return CLOUD.aiModel;
        const p = getCurrentProvider();
        return p.defaultModel || (p.models && p.models[0]) || '';
    }

    function ensureAIKey() {
        const pid = CLOUD.aiProvider;
        if (getLocalKey(pid)) return true;
        const p = getCurrentProvider();
        const hint = p.apiType === 'google' ? '（Google API Key，从 aistudio.google.com 获取）'
                   : p.apiType === 'anthropic' ? '（Anthropic API Key，从 console.anthropic.com 获取）'
                   : '（API Key，格式通常为 sk-...）';
        const key = prompt(`请输入 ${p.name} 的 API 密钥：\n${hint}\n\n密钥保存在本地浏览器`);
        if (key && key.trim()) {
            setLocalKey(pid, key.trim());
            saveAIKeysToCloud(pid, key.trim()); 
            qlog(`🔑 ${p.name} 密钥已保存（仅本地）`, 'ok');
            return true;
        }
        return false;
    }

    // 构建 AI 请求并解析响应（兼容 OpenAI/Anthropic/Google 三种 API）
    async function queryAI(questionContent, questionType, options) {
        if (!CLOUD.aiEnabled) return null;
        if (!ensureAIKey()) { qlog('🤖 未配置 AI 密钥，跳过', 'warn'); return null; }
        if (!questionContent || !String(questionContent).trim()) return null;

        await loadAIProviders();
        const provider = getCurrentProvider();
        const endpoint = getCurrentEndpoint();
        if (!endpoint) { qlog('🤖 自定义端点未设置', 'err'); return null; }
        const model = getCurrentModel();
        if (!model) { qlog('🤖 未指定模型', 'err'); return null; }
        const apiKey = getLocalKey(CLOUD.aiProvider) || '';
        const apiType = provider.apiType || 'openai-compatible';

        const qType = String(questionType || '未知题型');
        let typeDesc = '';
        if (qType.includes('单选') || qType.includes('SINGLE')) typeDesc = '单选题（只有一个正确答案）';
        else if (qType.includes('多选') || qType.includes('MULTIPLE')) typeDesc = '多选题（可能有一个或多个正确答案）';
        else if (qType.includes('判断') || qType.includes('JUDGMENT')) typeDesc = '判断题（答案只能是"正确"或"错误"）';
        else if (qType.includes('填空') || qType.includes('BLANKFILL')) typeDesc = '填空题';
        else typeDesc = '未知题型';

        let optionsText = '';
        if (options && options.length > 0) {
            optionsText = '\n选项：\n' + options.filter(Boolean).map(o => ((o.alias || o.alisa || '') + '. ' + (o.text || ''))).join('\n');
        }

        const prompt = `你是一个党校考试答题助手。请回答以下${typeDesc}。

题目：${questionContent}${optionsText}

请严格按以下格式输出答案（只输出一行，不要任何解释）：
- 单选题：【答案】选项字母
- 多选题：【答案】选项字母（多个用逗号分隔，如 A,B,C）
- 判断题：【答案】正确 或 【答案】错误
- 填空题：【答案】填空内容（多个空用分号;分隔）

现在请输出答案：`;

        const systemPrompt = '你是一个精准的党校考试答题助手。只输出答案，不输出解释。';

        try {
            const result = await new Promise((resolve) => {
                let reqUrl, reqHeaders, reqData;

                if (apiType === 'anthropic') {
                    // Anthropic Messages API
                    reqUrl = endpoint;
                    reqHeaders = {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    };
                    reqData = JSON.stringify({
                        model: model,
                        max_tokens: 512,
                        system: systemPrompt,
                        messages: [{ role: 'user', content: prompt }]
                    });
                } else if (apiType === 'google') {
                    // Google Gemini API
                    reqUrl = `${endpoint}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
                    reqHeaders = { 'Content-Type': 'application/json' };
                    reqData = JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + prompt }] }],
                        generationConfig: { maxOutputTokens: 512, temperature: 0.1 }
                    });
                } else {
                    // OpenAI-compatible
                    reqUrl = endpoint;
                    reqHeaders = {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey
                    };
                    reqData = JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 512, temperature: 0.1, stream: false
                    });
                }

                GM_xmlhttpRequest({
                    method: 'POST', url: reqUrl, headers: reqHeaders, data: reqData,
                    timeout: 15000,
                    onload: (r) => { try { resolve(JSON.parse(r.responseText)); } catch(e) { resolve(null); } },
                    onerror: () => { qlog(`🤖 ${provider.name} 网络错误`, 'err'); resolve(null); },
                    ontimeout: () => { qlog(`🤖 ${provider.name} 请求超时`, 'err'); resolve(null); }
                });
            });

            if (!result) return null;

            // 提取文本响应（三种 API 格式不同）
            let aiText = '';
            if (apiType === 'anthropic') {
                aiText = result.content && result.content[0] ? (result.content[0].text || '') : '';
            } else if (apiType === 'google') {
                aiText = result.candidates && result.candidates[0] && result.candidates[0].content
                    ? result.candidates[0].content.parts.map(p => p.text || '').join('') : '';
            } else {
                aiText = result.choices && result.choices[0] ? (result.choices[0].message && result.choices[0].message.content || '') : '';
            }

            if (!aiText) return null;
            aiText = aiText.trim();
            qlog(`🤖 ${provider.name} 返回: ${aiText}`);

            const m = aiText.match(/【答案】\s*(.+)/);
            if (m) {
                let rawAnswer = m[1].replace(/^[\s　]+|[\s　]+$/g, '');
                if (qType.includes('判断') || qType.includes('JUDGMENT')) {
                    if (/正确|对|✓|✔|true|Y|yes/i.test(rawAnswer)) rawAnswer = '正确';
                    else if (/错误|错|✗|✘|false|N|no/i.test(rawAnswer)) rawAnswer = '错误';
                }
                return { type: qType, content: questionContent, options: options || [], answer: rawAnswer, source: 'ai', verified: false };
            }
            if (aiText.length < 50) {
                return { type: qType, content: questionContent, options: options || [], answer: aiText, source: 'ai', verified: false };
            }
            return null;
        } catch(e) {
            qlog(`🤖 AI 调用异常: ${e.message}`, 'err');
            return null;
        }
    }

    // ==========================================
    // 📋 答案暂存区（获取 → 填充 → 提交 三步流程）
    // ==========================================
    let answerCache = [];
    let fetchRunning = false;

    // 三级级联搜索（本地→云端→AI），供 fetchAnswers 和 doAutoAnswer 共享
    async function cascadeSearch(pageQuestions) {
        const db = getDB();
        const results = [];
        const remaining = [];

        // Step 1: 本地库关键词匹配
        for (const pq of pageQuestions) {
            const cleanContent = pq.content.replace(/<[^>]+>/g, '').trim();
            const queryKeywords = extractKeywords(cleanContent);
            const match = db.find(q => {
                const dbc = (q.content || '').replace(/<[^>]+>/g, '').trim();
                const dbk = extractKeywords(dbc);
                return queryKeywords.length > 0 && dbk.length > 0 && queryKeywords.filter(k => dbk.includes(k)).length >= Math.min(queryKeywords.length, 3);
            });
            if (match && match.answer) {
                results.push({ pq, cleanContent, match, source: 'local' });
            } else {
                remaining.push({ pq, cleanContent });
            }
        }
        if (remaining.length === 0) return results;

        // Step 2: 云端批量查询
        const cloudResults = await queryCloudBatch(remaining.map(r => r.pq));
        const stillRemaining = [];
        for (let i = 0; i < remaining.length; i++) {
            const { pq, cleanContent } = remaining[i];
            const match = cloudResults[i];
            if (match && match.answer) {
                match.source = match.source || 'cloud';
                if (pq.type && pq.type !== '未知题型' && match.type && match.type !== pq.type) {
                    match.type = pq.type;
                }
                results.push({ pq, cleanContent, match, source: 'cloud' });
                saveToDB([match]);
            } else {
                stillRemaining.push({ pq, cleanContent });
            }
        }
        if (stillRemaining.length === 0) return results;

        // Step 3: AI 逐题兜底
        for (const { pq, cleanContent } of stillRemaining) {
            if (!CLOUD.aiEnabled) {
                results.push({ pq, cleanContent, match: null, source: null });
                continue;
            }
            if (!ensureAIKey()) {
                results.push({ pq, cleanContent, match: null, source: null });
                continue;
            }
            const pqType = String(pq.type || '未知题型');
            const pqOptions = pq.options || [];
            const match = await queryAI(cleanContent, pqType, pqOptions);
            if (match && match.answer) {
                results.push({ pq, cleanContent, match, source: 'ai' });
                saveToDB([match]);
            } else {
                results.push({ pq, cleanContent, match: null, source: null });
            }
        }
        return results;
    }

    async function fetchAnswers(course) {
        if (fetchRunning) { qlog('⚠️ 正在查询中，请稍候...', 'warn'); return; }
        fetchRunning = true;
        answerCache = [];
        try {
            qlog('🔍 开始获取答案（本地→云端→AI）...');
            const pageQuestions = parseCurrentPageQuestions(course);
            if (pageQuestions.length === 0) { qlog('⚠️ 未在页面检测到题目'); return; }
            qlog(`📋 检测到 ${pageQuestions.length} 道题目`);

            const results = await cascadeSearch(pageQuestions);
            let foundCount = 0;
            for (const { pq, cleanContent, match, source } of results) {
                answerCache.push({ pq, match, cleanContent });
                if (match && match.answer) {
                    foundCount++;
                    if (source === 'cloud') {
                        qlog(`[云端] ${cleanContent.substring(0, 30)}... -> ${match.answer}`, 'ok');
                    } else if (source === 'ai') {
                        qlog(`[AI ?] ${cleanContent.substring(0, 30)}... -> ${match.answer} (未验证，请人工确认)`, 'warn');
                    } else {
                        const srcTag = match.verified ? '[本地 已验证]' : '[本地]';
                        qlog(`${srcTag} ${cleanContent.substring(0, 30)}... -> ${match.answer}`, 'ok');
                    }
                } else {
                    qlog(`❓ [未命中] ${cleanContent.substring(0, 40)}... → 未找到答案`, 'warn');
                }
            }
            const aiCount = answerCache.filter(a => a.match && a.match.source === 'ai').length;
            qlog(`查询完成: ${foundCount}/${pageQuestions.length} 题 (已验证 ${foundCount-aiCount} + AI未验证 ${aiCount})，请检查后点击「填充」`);
        } catch(e) {
            qlog(`❌ 查询异常: ${e.message}`, 'err');
        } finally {
            fetchRunning = false;
        }
    }

    async function fillAnswers() {
        if (fetchRunning) { qlog('⚠️ 正在查询答案中，请稍候再填充', 'warn'); return; }
        if (answerCache.length === 0) { qlog('⚠️ 请先点击「获取答案」', 'warn'); return; }
        const unfilled = answerCache.filter(a => a.match && a.match.answer);
        if (unfilled.length === 0) { qlog('⚠️ 没有可填充的答案', 'warn'); return; }

        // 优先使用 API 提交（POST /api/student/paper/saveData）
        qlog(`✍ 正在通过API提交 ${unfilled.length} 道题目...`);
        const apiCount = await submitAnswersAPI(unfilled);
        if (apiCount > 0) {
            qlog(`✍ API提交完成：${apiCount}/${unfilled.length} 题已填入页面。网络拦截器将在交卷后自动捕获正确答案并上传云端。`);
            return;
        }

        // API 失败则回退 DOM 点击
        qlog('API提交失败，回退到DOM点击填充...', 'warn');
        let filled = 0;
        for (const { pq, match, cleanContent } of unfilled) {
            const ok = fillAnswerToPage(pq, match);
            if (ok) {
                filled++;
                qlog(`✅ [${pq.type || '?'}] ${cleanContent.substring(0, 30)}... -> ${match.answer}`, 'ok');
            } else {
                qlog(`⚠️ [${pq.type || '?'}] 填充失败`, 'warn');
            }
        }
        qlog(`✍ DOM填充完成：${filled}/${unfilled.length} 题`);
    }

    async function aiDirectAnswer() {
        if (!CLOUD.aiEnabled) { qlog('[AI直答] 请先开启 AI 辅助答题开关', 'warn'); return; }
        if (!ensureAIKey()) { qlog('[AI直答] 未配置 AI 密钥，已取消', 'warn'); return; }
        if (fetchRunning) { qlog('[AI直答] 正在查询中，请稍候', 'warn'); return; }
        fetchRunning = true;
        try {
            const pageQuestions = parseCurrentPageQuestions('');
            if (pageQuestions.length === 0) { qlog('[AI直答] 未在页面检测到题目'); return; }
            qlog(`[AI直答] 检测到 ${pageQuestions.length} 题，全部使用 AI 查询...`);
            let hitCount = 0;
            answerCache = [];
            for (const pq of pageQuestions) {
                const cleanContent = pq.content.replace(/<[^>]+>/g, '').trim();
                const pqType = String(pq.type || '未知题型');
                const pqOptions = pq.options || [];
                qlog(`[AI直答] 查询: ${cleanContent.substring(0, 40)}...`);
                const match = await queryAI(cleanContent, pqType, pqOptions);
                if (match && match.answer) {
                    answerCache.push({ pq, match, cleanContent });
                    hitCount++;
                    qlog(`[AI直答] ${cleanContent.substring(0, 30)}... -> ${match.answer}`, 'ok');
                    saveToDB([match]);
                } else {
                    answerCache.push({ pq, match: null, cleanContent });
                    qlog(`[AI直答] ${cleanContent.substring(0, 30)}... -> 未识别`, 'warn');
                }
            }
            qlog(`[AI直答] 完成: ${hitCount}/${pageQuestions.length} 题 (未验证，请人工确认)`);
            document.getElementById('tk-cache-status').textContent = '暂存 ' + answerCache.filter(a => a.match).length + ' 题 (AI)';
        } finally {
            fetchRunning = false;
        }
    }

    function submitAnswers() {
        const allBtns = document.querySelectorAll('button, a, span[class*="btn"], div[class*="btn"], input[type="button"], input[type="submit"]');
        const keywords = ['提交', '交卷', 'submit', '下一题', '下一节', '确认', '确定'];
        let submitBtn = null;
        for (const kw of keywords) {
            for (const el of allBtns) {
                if (!el.offsetParent) continue;
                const txt = (el.textContent || el.value || '').trim();
                if (txt.includes(kw)) { submitBtn = el; break; }
            }
            if (submitBtn) break;
        }
        if (submitBtn) {
            const txt = (submitBtn.textContent || submitBtn.value || '').trim();
            if (confirm(`确定要点击「${txt}」提交吗？\n\n提交后会自动捕获正确答案并上传云端。`)) {
                submitBtn.click();
                qlog(`[提交] 已点击「${txt}」，网络拦截器将自动捕获正确答案...`, 'ok');
            }
        } else {
            qlog('⚠️ 未找到提交按钮，请手动提交', 'warn');
            const visibleBtns = [...allBtns].filter(b => b.offsetParent).map(b => (b.textContent || b.value || '').trim()).filter(t => t.length > 0 && t.length < 20);
            if (visibleBtns.length > 0) qlog('页面可见按钮: ' + [...new Set(visibleBtns)].join(', '));
        }
    }

    // 执行自动答题（保留兼容：仅当用户手动勾选自动答题时使用）
    let doAutoAnswerRunning = false;

    async function doAutoAnswer(course) {
        if (!CLOUD.autoAnswerEnabled) return;
        if (doAutoAnswerRunning) { qlog('⚠️ 自动答题已在运行中，跳过重复调用', 'warn'); return; }
        doAutoAnswerRunning = true;
        try {
            qlog('🎯 自动答题引擎启动，正在识别页面题目...');
            const pageQuestions = parseCurrentPageQuestions(course);
            if (pageQuestions.length === 0) { qlog('⚠️ 未在页面检测到题目'); return; }
            qlog(`📋 检测到 ${pageQuestions.length} 道题目，正在查询答案...`);

            const results = await cascadeSearch(pageQuestions);
            let answeredCount = 0;
            for (const { pq, cleanContent, match, source } of results) {
                if (!match || !match.answer) {
                    qlog(`❓ [${pq.type || '?'}] ${cleanContent.substring(0, 30)}... → 未找到答案`, 'warn');
                    continue;
                }
                const filled = fillAnswerToPage(pq, match);
                if (filled) {
                    answeredCount++;
                    const tag = source === 'ai' ? '[AI ?]' : source === 'cloud' ? '[云端]' : '[本地]';
                    qlog(`✅ ${tag} [${pq.type || '?'}] ${cleanContent.substring(0, 30)}... -> ${match.answer}`, source === 'ai' ? 'warn' : 'ok');
                } else {
                    qlog(`⚠️ [${pq.type || '?'}] 答案存在但无法填入页面，跳过`, 'warn');
                }
            }
            qlog(`🎯 自动答题完成：${answeredCount}/${pageQuestions.length} 题已填入答案`);
        } finally {
            doAutoAnswerRunning = false;
        }
    }

    // 将答案填入页面控件（通过 Vue 实例直接操作）
    function fillAnswerToPage(question, match) {
        const answer = match.answer;
        const type = match.type || question.type;
        const el = question._el; // parseCurrentPageQuestions 附上的 DOM 引用
        let filled = false;

        // 通过附带的 DOM 元素操作 Vue 实例
        if (el && el.__vue__) {
            try {
                const vm = el.__vue__;
                const data = vm.$data || vm;
                // 尝试常见 Vue 数据字段名
                const answerFields = ['answer', 'userAnswer', 'selectedAnswer', 'selected', 'value', 'result'];
                const optionsFields = ['options', 'optionList', 'choices', 'items', 'questionOptions'];
                const typeFields = ['type', 'questionType', 'realType'];

                // 直接设置 answer
                for (const f of answerFields) {
                    if (data[f] !== undefined) {
                        const old = data[f];
                        if (type.includes('判断') || type.includes('JUDGMENT')) {
                            data[f] = (answer === '正确' || answer === 'Y' || answer === 'true') ? 'Y' : 'N';
                        } else {
                            data[f] = answer;
                        }
                        if (data[f] !== old && vm.$forceUpdate) vm.$forceUpdate();
                        filled = true;
                        break;
                    }
                }

                // 操作选项列表
                if (!filled) {
                    for (const of of optionsFields) {
                        const opts = data[of];
                        if (Array.isArray(opts) && opts.length > 0) {
                            for (const opt of opts) {
                                const alias = opt.alias || opt.key || opt.value || opt.label || '';
                                if (type.includes('单选') || type.includes('SINGLE') || type.includes('判断') || type.includes('JUDGMENT')) {
                                    if (alias === answer || String(alias) === String(answer)) {
                                        if (opt.checked !== undefined) opt.checked = true;
                                        if (opt.selected !== undefined) opt.selected = true;
                                        if (opt.isSelected !== undefined) opt.isSelected = true;
                                        filled = true;
                                    } else {
                                        if (opt.checked !== undefined) opt.checked = false;
                                        if (opt.selected !== undefined) opt.selected = false;
                                    }
                                } else if (type.includes('多选') || type.includes('MULTIPLE')) {
                                    const answers = answer.split(/[,，\s;；]+/).filter(Boolean);
                                    if (answers.includes(alias) || answers.includes(String(alias))) {
                                        opt.checked = true; opt.selected = true;
                                        filled = true;
                                    }
                                }
                            }
                            if (vm.$forceUpdate) vm.$forceUpdate();
                            break;
                        }
                    }
                }
            } catch(e) {}
        }

        // 如果 Vue 操作无效，触发元素点击
        if (filled && el) {
            el.click();
            el.dispatchEvent(new Event('click', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 兜底：暴力匹配页面元素 + MouseEvent 模拟
        if (!filled) {
            if (type.includes('判断') || type.includes('JUDGMENT')) {
                const txt = (answer === '正确' || answer === 'Y' || answer === 'true') ? '正确' : '错误';
                const all = document.querySelectorAll('*');
                for (const e of all) {
                    const t = (e.textContent || '').trim();
                    if ((t === txt || t === (txt+'。')) && e.offsetParent) {
                        e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        e.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        e.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        if (e.parentElement) e.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        filled = true; break;
                    }
                }
            } else if (type.includes('多选') || type.includes('MULTIPLE')) {
                const answers = answer.split(/[,，\s;；]+/).filter(Boolean);
                if (answers.length > 1) {
                    // 多选题分别点击每个选项
                    let multiFilled = 0;
                    const all = document.querySelectorAll('*');
                    for (const ans of answers) {
                        for (const e of all) {
                            if (!e.offsetParent) continue;
                            const t = (e.textContent || '').trim();
                            if (t === ans || t.startsWith(ans + '.') || t.startsWith(ans + '、')) {
                                const target = e.closest('button, label, a, [class*="option"], [class*="choice"], [class*="item"]') || e;
                                target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                                target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                if (target.parentElement) target.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                multiFilled++;
                                break;
                            }
                        }
                    }
                    filled = multiFilled >= answers.length;
                } else {
                    // 单答案 fallthrough 到通用逻辑
                    const all2 = document.querySelectorAll('*');
                    for (const e of all2) {
                        if (!e.offsetParent) continue;
                        const t = (e.textContent || '').trim();
                        if (t === answer || t.startsWith(answer + '.') || t.startsWith(answer + '、')) {
                            const target = e.closest('button, label, a, [class*="option"], [class*="choice"], [class*="item"]') || e;
                            target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                            target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                            target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            if (target.parentElement) target.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            filled = true; break;
                        }
                    }
                }
            } else {
                const all = document.querySelectorAll('*');
                for (const e of all) {
                    if (!e.offsetParent) continue;
                    const t = (e.textContent || '').trim();
                    if (t === answer || t.startsWith(answer + '.') || t.startsWith(answer + '、')) {
                        const target = e.closest('button, label, a, [class*="option"], [class*="choice"], [class*="item"]') || e;
                        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        if (target.parentElement) target.parentElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        filled = true; break;
                    }
                }
            }
        }

        if (!filled) {
            qlog(`⚠️ 无法填入: ${type}`, 'warn');
            return false;
        }
        return true;
    }

    // 页面监控：检测到题目页面时自动触发答题
    function watchForQuestions(course) {
        if (autoAnswerTimer) clearInterval(autoAnswerTimer);
        autoAnswerTimer = setInterval(() => {
            if (!CLOUD.autoAnswerEnabled) return;
            const questions = parseCurrentPageQuestions(course);
            if (questions.length > 0) {
                clearInterval(autoAnswerTimer);
                doAutoAnswer(course);
            }
        }, 2000);
        // 30秒后停止扫描
        setTimeout(() => { if (autoAnswerTimer) clearInterval(autoAnswerTimer); }, 30000);
    }

    // ==========================================
    // 3. UI 界面构建
    // ==========================================
    let logArea, countSpan;

    function initPanel() {
        const panel = document.createElement('div');
        panel.id = '__whut_qbank';
        panel.style.cssText = `
            position:fixed;top:80px;left:10px;width:250px;max-height:88vh;overflow-y:auto;
            background:rgba(15,18,28,.92);backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%);
            color:#e2e8f0;border-radius:14px;box-shadow:0 4px 30px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06);
            z-index:99998;font:12px/1.5 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;user-select:none;
        `;

        panel.innerHTML = `
            <style>
            #__whut_qbank *{box-sizing:border-box;margin:0;padding:0}
            #__whut_qbank ::-webkit-scrollbar{width:3px}
            #__whut_qbank ::-webkit-scrollbar-track{background:transparent}
            #__whut_qbank ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:3px}
            #__whut_qbank button{transition:all .15s ease;cursor:pointer;font-family:inherit}
            #__whut_qbank button:active{transform:scale(.97)}
            #__whut_qbank button:hover:not(:disabled){filter:brightness(1.15)}
            #__whut_qbank .qb-section{margin-bottom:10px}
            #__whut_qbank .qb-section-title{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;padding:0 2px}
            #__whut_qbank .qb-btn{display:flex;align-items:center;justify-content:center;gap:4px;border:none;border-radius:8px;font-size:11px;font-weight:500;padding:8px 6px}
            #__whut_qbank .qb-btn-primary{background:#6366f1;color:#fff}
            #__whut_qbank .qb-btn-primary:hover{background:#4f46e5}
            #__whut_qbank .qb-btn-ghost{background:rgba(255,255,255,.04);color:#94a3b8;border:1px solid rgba(255,255,255,.06)}
            #__whut_qbank .qb-btn-ghost:hover{background:rgba(255,255,255,.08);color:#e2e8f0}
            #__whut_qbank .qb-btn-danger{background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.2)}
            #__whut_qbank .qb-row{display:flex;gap:6px;margin-bottom:6px}
            #__whut_qbank .qb-row:last-child{margin-bottom:0}
            #__whut_qbank .qb-toggle{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:6px;font-size:11px;color:#cbd5e1}
            #__whut_qbank .qb-toggle input[type="checkbox"]{width:34px;height:20px;appearance:none;-webkit-appearance:none;background:rgba(255,255,255,.1);border-radius:10px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;margin:0}
            #__whut_qbank .qb-toggle input[type="checkbox"]::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;background:#94a3b8;border-radius:50%;transition:all .2s}
            #__whut_qbank .qb-toggle input[type="checkbox"]:checked{background:#6366f1}
            #__whut_qbank .qb-toggle input[type="checkbox"]:checked::after{left:16px;background:#fff}
            #__whut_qbank .qb-cloud-bar{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:rgba(99,102,241,.08);border-radius:8px;margin-bottom:8px;border:1px solid rgba(99,102,241,.12)}
            #__whut_qbank .qb-cloud-bar span{font-size:11px;color:#a5b4fc}
            #__whut_qbank .qb-cloud-bar button{background:none;border:none;color:#818cf8;font-size:13px;cursor:pointer;padding:0 4px}
            #__whut_qbank .qb-log{width:100%;height:50px;font-size:10px;resize:none;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.06);color:#64748b;padding:6px 8px;border-radius:8px;outline:none;font-family:'SF Mono',Consolas,monospace;line-height:1.5}
            #__whut_qbank.collapsed .qb-body{display:none}
            #__whut_qbank.collapsed{width:auto}
            </style>
            <div id="tk-header" style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:move;border-bottom:1px solid rgba(255,255,255,.06);">
                <span style="font-weight:600;font-size:13px;color:#e2e8f0;">题库面板</span>
                <span id="tk-count" style="margin-left:auto;font-size:10px;color:#818cf8;background:rgba(99,102,241,.12);padding:2px 8px;border-radius:10px;font-weight:600;">0</span>
                <button id="btn-minimize" style="background:none;color:#64748b;border:none;font-size:16px;cursor:pointer;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:4px;">&minus;</button>
            </div>
            <div class="qb-body" style="padding:10px 12px;">

                <div class="qb-cloud-bar">
                    <span>☁ 云端题库</span>
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span id="tk-cloud-courses" style="font-size:10px;color:#818cf8;">--</span>
                        <button id="btn-cloud-refresh" style="background:none;border:none;color:#6366f1;cursor:pointer;font-size:14px;padding:0 2px;line-height:1;" title="刷新云端">&circlearrowright;</button>
                    </div>
                </div>

                <div class="qb-section">
                    <div class="qb-section-title">采集</div>
                    <div class="qb-row">
                        <button id="btn-scan-dom" class="qb-btn qb-btn-ghost" style="flex:1">扫描页面</button>
                        <button id="btn-pull-errors" class="qb-btn qb-btn-ghost" style="flex:1">拉取错题</button>
                    </div>
                </div>

                <div class="qb-section">
                    <div class="qb-section-title">答题</div>
                    <div class="qb-row">
                        <button id="btn-fetch-answers" class="qb-btn qb-btn-primary" style="flex:1">获取答案</button>
                        <button id="btn-fill-answers" class="qb-btn" style="flex:1;background:#f59e0b;color:#000">填充</button>
                        <button id="btn-submit-answers" class="qb-btn qb-btn-danger" style="flex:1">提交</button>
                    </div>
                    <div class="qb-row">
                        <button id="btn-ai-direct" class="qb-btn qb-btn-ghost" style="flex:1" title="跳过本地云端，直接用AI获取全部答案">AI 直答</button>
                        <span id="tk-cache-status" style="flex:1;font-size:9px;color:#475569;display:flex;align-items:center;justify-content:center;">暂存 0 题</span>
                    </div>
                </div>

                <div class="qb-toggle">
                    <span>AI 辅助答题</span>
                    <input type="checkbox" id="tk-ai-answer" ${CLOUD.aiEnabled?'checked':''}>
                </div>
                <div style="padding:6px 10px;background:rgba(255,255,255,.03);border-radius:8px;margin-bottom:6px;">
                    <div style="display:flex;gap:4px;margin-bottom:4px;">
                        <select id="tk-ai-provider" style="flex:1;padding:4px 6px;background:rgba(0,0,0,.3);color:#e2e8f0;border:1px solid rgba(255,255,255,.06);border-radius:6px;font-size:10px;outline:none;"></select>
                        <select id="tk-ai-model" style="flex:1;padding:4px 6px;background:rgba(0,0,0,.3);color:#e2e8f0;border:1px solid rgba(255,255,255,.06);border-radius:6px;font-size:10px;outline:none;"></select>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span id="btn-set-key" style="font-size:9px;color:#475569;cursor:pointer;" title="设置/更换密钥（仅保存在本地浏览器）">🔑 <span id="tk-key-status">${GM_getValue('whut_aiKey_' + CLOUD.aiProvider, '') ? '已设置 (更换)' : '设置密钥'}</span></span>
                        <input type="text" id="tk-custom-endpoint" placeholder="自定义端点URL" style="display:none;flex:1;padding:3px 6px;background:rgba(0,0,0,.3);color:#e2e8f0;border:1px solid rgba(255,255,255,.06);border-radius:4px;font-size:9px;outline:none;margin-left:4px;">
                    </div>
                </div>
                <div class="qb-toggle" style="margin-bottom:8px;">
                    <span>自动模式</span>
                    <input type="checkbox" id="tk-auto-answer" ${CLOUD.autoAnswerEnabled?'checked':''}>
                </div>

                <textarea id="tk-log" class="qb-log" readonly>就绪</textarea>

                <div class="qb-row" style="margin-top:6px;">
                    <button id="btn-export-txt" class="qb-btn qb-btn-ghost" style="flex:1;font-size:10px;">导出 TXT</button>
                    <button id="btn-export-json" class="qb-btn qb-btn-ghost" style="flex:1;font-size:10px;">导出 JSON</button>
                    <button id="btn-clear" class="qb-btn qb-btn-ghost" style="flex:1;font-size:10px;color:#f87171;">清空题库</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        logArea = document.getElementById('tk-log');
        countSpan = document.getElementById('tk-count');

        document.getElementById('btn-export-txt').onclick = exportTXT;
        document.getElementById('btn-export-json').onclick = exportJSON;
        document.getElementById('btn-clear').onclick = clearDB;
        document.getElementById('btn-pull-errors').onclick = autoPullErrors;
        document.getElementById('btn-scan-dom').onclick = scanDOMForQuestions;
        document.getElementById('btn-cloud-refresh').onclick = () => loadCloudBank(true);
        document.getElementById('btn-fetch-answers').onclick = () => {
            fetchAnswers('').then(() => {
                document.getElementById('tk-cache-status').textContent = '暂存 ' + answerCache.filter(a => a.match).length + ' 题';
            });
        };
        document.getElementById('btn-fill-answers').onclick = () => {
            fillAnswers();
            document.getElementById('tk-cache-status').textContent = '暂存 ' + answerCache.filter(a => a.match).length + ' 题';
        };
        document.getElementById('btn-submit-answers').onclick = () => submitAnswers();
        document.getElementById('btn-ai-direct').onclick = () => aiDirectAnswer();
        document.getElementById('tk-auto-answer').onchange = (e) => {
            CLOUD.autoAnswerEnabled = e.target.checked;
            GM_setValue('whut_autoAnswerEnabled', e.target.checked);
            qlog('自动模式: ' + (CLOUD.autoAnswerEnabled ? 'ON' : 'OFF'));
        };
        // --- Provider / Model / Key 选择器初始化 ---
        const providerSel = document.getElementById('tk-ai-provider');
        const modelSel = document.getElementById('tk-ai-model');
        const customEp = document.getElementById('tk-custom-endpoint');
        const keyLink = document.getElementById('btn-set-key');
        const keyStat = document.getElementById('tk-key-status');

        function updateKeyUI() {
            const pid = CLOUD.aiProvider;
            const hasKey = !!getLocalKey(pid);
            keyStat.textContent = hasKey ? '已设置 (更换)' : '设置密钥';
            keyStat.style.color = hasKey ? '#a5b4fc' : '#475569';
        }

        function renderProviderOptions() {
            const providers = CLOUD.aiProviders || BUILTIN_AI_PROVIDERS;
            providerSel.innerHTML = providers.map(p => `<option value="${p.id}" ${p.id===CLOUD.aiProvider?'selected':''}>${p.name}</option>`).join('');
            updateModelOptions();
        }

        function updateModelOptions() {
            const providers = CLOUD.aiProviders || BUILTIN_AI_PROVIDERS;
            const p = providers.find(p => p.id === CLOUD.aiProvider) || providers[0];
            if (p.id === 'custom') {
                modelSel.style.display = 'none';
                customEp.style.display = 'inline-block';
                customEp.value = GM_getValue('whut_aiCustomEndpoint', '');
            } else {
                modelSel.style.display = 'inline-block';
                customEp.style.display = 'none';
                const models = p.models || [];
                if (models.length === 0) models.push(p.defaultModel || 'default');
                modelSel.innerHTML = models.map(m => `<option value="${m}" ${m===getCurrentModel()?'selected':''}>${m}</option>`).join('');
            }
            updateKeyUI();
        }

        providerSel.onchange = () => {
            CLOUD.aiProvider = providerSel.value;
            GM_setValue('whut_aiProvider', CLOUD.aiProvider);
            const providers = CLOUD.aiProviders || BUILTIN_AI_PROVIDERS;
            const p = providers.find(p => p.id === CLOUD.aiProvider);
            if (p && p.defaultModel) {
                CLOUD.aiModel = p.defaultModel;
                GM_setValue('whut_aiModel', CLOUD.aiModel);
            }
            updateModelOptions();
            qlog('AI Provider: ' + CLOUD.aiProvider);
        };

        modelSel.onchange = () => {
            CLOUD.aiModel = modelSel.value;
            GM_setValue('whut_aiModel', CLOUD.aiModel);
            qlog('AI Model: ' + CLOUD.aiModel);
        };

        customEp.onchange = () => {
            GM_setValue('whut_aiCustomEndpoint', customEp.value.trim());
            qlog('自定义端点已更新');
        };

        keyLink.onclick = () => {
            const p = getCurrentProvider();
            const pid = CLOUD.aiProvider;
            const current = getLocalKey(pid);
            const hint = p.apiType === 'google' ? '（Google API Key，自 aistudio.google.com）'
                       : p.apiType === 'anthropic' ? '（Anthropic API Key，自 console.anthropic.com）'
                       : '（API Key，格式通常 sk-...）';
            const key = prompt(`${p.name} API 密钥：\n${hint}\n\n当前：${current ? current.substring(0,8)+'...' : '未设置'}\n\n密钥保存在本地`, current);
            if (key !== null && key.trim()) {
                setLocalKey(pid, key.trim());
                saveAIKeysToCloud(pid, key.trim());
                qlog(`🔑 ${p.name} 密钥已保存（仅本地）`, 'ok');
            } else if (key !== null && !key.trim()) {
                setLocalKey(pid, '');
                CLOUD.aiKeys[pid] = '';
                GM_setValue('whut_aiKey_' + pid, '');
                saveAIKeysToCloud(pid, '');
                qlog(`🔑 ${p.name} 密钥已清空`, 'warn');
            }
            updateKeyUI();
        };

        // 初始加载 AI Providers（含云端密钥）
        loadAIProviders().then(() => renderProviderOptions());

        document.getElementById('tk-ai-answer').onchange = (e) => {
            CLOUD.aiEnabled = e.target.checked;
            GM_setValue('whut_aiEnabled', e.target.checked);
            qlog('AI 辅助: ' + (CLOUD.aiEnabled ? 'ON' : 'OFF'));
        };
        document.getElementById('btn-minimize').onclick = (e) => {
            e.stopPropagation();
            panel.classList.toggle('collapsed');
            document.getElementById('btn-minimize').textContent = panel.classList.contains('collapsed') ? '+' : '−';
        };

        updateStats(getDB().length);
        loadCloudBank().then(() => updateCloudUI(cloudBank ? cloudBank.length : 0));

        // 拖拽
        const header = document.getElementById('tk-header');
        let isDragging = false, startX, startY, initialX, initialY;
        header.onmousedown = (e) => {
            isDragging = true; startX = e.clientX; startY = e.clientY;
            initialX = panel.offsetLeft; initialY = panel.offsetTop;
            const onMove = (ev) => {
                panel.style.left = (initialX + ev.clientX - startX) + 'px';
                panel.style.top = (initialY + ev.clientY - startY) + 'px';
                panel.style.right = 'auto';
            };
            const onUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('mouseleave', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            document.addEventListener('mouseleave', onUp, { once: true });
        };

        // 初始启动题目监控
        setTimeout(() => {
            watchForQuestions('');
        }, 3000);
    }

    function updateCloudUI(count) {
        const el = document.getElementById('tk-cloud-courses');
        if (!el) return;
        if (count != null && count > 0) {
            el.textContent = `${count} 题`;
        } else if (count === 0) {
            el.textContent = '题库为空';
        } else {
            el.textContent = '连接失败';
        }
    }

    function qlog(msg, type) {
        if(!logArea) return;
        const prefix = type ? `[${type.toUpperCase()}] ` : '';
        logArea.value += `[${new Date().toLocaleTimeString()}] ${prefix}${msg}\n`;
        logArea.scrollTop = logArea.scrollHeight;
    }

    function updateStats(count) {
        if(countSpan) countSpan.innerText = count;
    }

    // ==========================================
    // 4. 导出逻辑
    // ==========================================
    function exportTXT() {
        const db = getDB();
        if(db.length === 0) return alert("题库为空！");
        let txtContent = "";
        db.forEach((q) => {
            txtContent += `【${q.type}】题目：${q.content}\n`;
            if ((q.type === "单选题" || q.type === "多选题") && q.options && q.options.length > 0) {
                q.options.forEach(opt => {
                    if (opt.alias && opt.text) txtContent += `${opt.alias}. ${opt.text}\n`;
                });
            }
            txtContent += `答案：${q.answer}\n\n`;
        });
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `党校题库_${db.length}题.txt`);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        document.body.removeChild(link);
        qlog(`导出 TXT 成功。`);
    }

    function exportJSON() {
        const db = getDB();
        if(db.length === 0) return alert("题库为空！");
        const blob = new Blob([JSON.stringify(db, null, 4)], { type: 'application/json;charset=utf-8' });
        const link = document.createElement("a");
        const jsonUrl = URL.createObjectURL(blob);
        link.href = jsonUrl;
        link.download = `党校题库_${db.length}题.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(jsonUrl), 100);
        qlog(`导出 JSON 成功。`);
    }

    // 5. DOM 启发式扫描器
    // ==========================================
    function scanDOMForQuestions() {
        qlog("开始深度扫描当前网页元素...");
        let foundQuestions = [];
        const allElements = document.querySelectorAll('*');
        let rawDataSources = [];
        for (let el of allElements) {
            if (el.__vue__) {
                try {
                    let vueData = JSON.parse(JSON.stringify(el.__vue__.$data || {}));
                    rawDataSources.push(vueData);
                } catch(e){}
            }
            if (el.__vue_app__) {
                try {
                    const appData = JSON.parse(JSON.stringify(el.__vue_app__));
                    rawDataSources.push(appData);
                } catch(e) {}
            }
        }
        if (rawDataSources.length > 0) {
            rawDataSources.forEach(data => {
                let extracted = extractQuestionsFromData(data);
                foundQuestions = foundQuestions.concat(extracted);
            });
        }
        if (foundQuestions.length > 0) {
            let added = saveToDB(foundQuestions);
            qlog(`DOM底层数据扫描完成，找到有效题目，新入库 ${added} 题！`);
            // 已由 saveToDB 自动上传云端
        } else {
            qlog("未能从当前页面的底层数据中扫描到规范题库。");
            qlog("提示：如果页面显示了题目，建议通过『高级API接口』重新请求该页面的数据源。");
        }
    }

    // ==========================================
    // 6. 高级 API 挖掘器
    // ==========================================
    // 7. 错题本自动拉取
    // ==========================================
    async function autoPullErrors() {
        qlog("开始全量拉取错题本...");
        let current = 1; let totalPages = 1; let allRecords = [];
        while (current <= totalPages) {
            try {
                let res = await fetch("/api/student/test/myErrorQuestion/list", {
                    method: 'POST',
                    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
                    body: `current=${current}&size=100&keyword=`
                });
                let resJson = await res.json();
                if (resJson.code === 0 && resJson.data) {
                    totalPages = resJson.data.pages || 1;
                    let records = resJson.data.records || [];
                    if(records.length > 0){
                        allRecords = allRecords.concat(records);
                        let added = saveToDB(records);
                        qlog(`错题本第${current}页：新入库 ${added} 题。`);
                    } else break;
                } else break;
                current++;
                await new Promise(r => setTimeout(r, 600));
            } catch (e) { break; }
        }
        qlog("错题本全量拉取完成！(已由 saveToDB 自动上传云端)");
    }

    // ==========================================
    // 8. 网络拦截双引擎 — 抓取数据 + 强制捕获正确答案 + 自动上传
    // ==========================================
    let _forcedCaptureTimer = null;
    let _forcedCaptureDone = false;

    function _onSubmissionDetected(source) {
        if (_forcedCaptureDone) return;
        _forcedCaptureDone = true;
        qlog(`[强制捕获] ${source} 拦截到提交请求，将在批改完成后自动捕获正确答案...`, 'ok');
        toast('检测到提交！批改完成后将自动捕获正确答案并上传云端', 4);
        // 启动 MutationObserver 监控结果页
        if (_forcedCaptureTimer) clearTimeout(_forcedCaptureTimer);
        const watcher = new MutationObserver(() => {
            const indicators = document.querySelectorAll(
                '[class*="score"], [class*="grade"], [class*="result"], [class*="correct"], [class*="right"], a[href*="download"]'
            );
            if (indicators.length === 0) return;
            watcher.disconnect();
            _forcedCaptureTimer = null;
            qlog('[强制捕获] 检测到结果页，1.5秒后开始提取正确答案...', 'ok');
            toast('批改完成，正在提取正确答案...', 3);
            setTimeout(async () => {
                const added = _forceCaptureAndUpload();
                if (added === 0) {
                    // 第一次没抓到，再等2秒重试
                    await new Promise(r => setTimeout(r, 2000));
                    const retryAdded = _forceCaptureAndUpload();
                    if (retryAdded === 0) {
                        qlog('[强制捕获] 未能自动提取，请手动使用「扫描页面」', 'warn');
                        toast('未能自动提取正确答案，请手动扫描页面入库', 4);
                    }
                }
            }, 1500);
        });
        watcher.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        // 120秒超时
        _forcedCaptureTimer = setTimeout(() => {
            watcher.disconnect();
            _forcedCaptureTimer = null;
            _forcedCaptureDone = false;
            qlog('[强制捕获] 等待超时，本次不捕获', 'warn');
        }, 120000);
    }

    function _forceCaptureAndUpload() {
        qlog('[强制捕获] 正在提取正确答案...');
        let totalAdded = 0;
        const seen = new Set();
        const db = getDB();
        db.forEach(q => seen.add((q.content || '').replace(/\s+/g, '').substring(0, 40)));

        // 方法1: Vue 实例深挖
        let found = [];
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
            if (el.__vue__) {
                try { found = found.concat(extractQuestionsFromData(JSON.parse(JSON.stringify(el.__vue__.$data || {})))); } catch(e) {}
            }
            if (el.__vue_app__) {
                try { found = found.concat(extractQuestionsFromData(JSON.parse(JSON.stringify(el.__vue_app__)))); } catch(e) {}
            }
        }
        const withAnswer = found.filter(q => q.answer && String(q.answer).trim());
        if (withAnswer.length > 0) {
            const items = [];
            for (const q of withAnswer) {
                const key = (q.content || '').replace(/\s+/g, '').substring(0, 40);
                if (!seen.has(key)) { seen.add(key); items.push({ ...q, source: 'platform', verified: true }); }
            }
            if (items.length > 0) {
                const added = saveToDB(items);
                totalAdded += added;
                qlog(`[强制捕获 ✓] Vue提取 ${items.length} 题，入库 ${added} 题`, 'ok');
            }
        }

        // 方法2: DOM 结果块扫描
        if (totalAdded === 0) {
            const correctMarks = document.querySelectorAll('[class*="correct"], [class*="right"]');
            const items = [];
            for (const mark of correctMarks) {
                const container = mark.closest('div, li, tr, section');
                if (!container) continue;
                const txt = (container.textContent || '').replace(/\s+/g, ' ').trim();
                if (txt.length < 10 || txt.length > 2000) continue;
                const ansText = (mark.textContent || '').trim();
                const key = txt.substring(0, 40);
                if (!seen.has(key)) { seen.add(key); items.push({ content: txt, type: '未知题型', options: [], answer: ansText, source: 'platform', verified: true }); }
            }
            if (items.length > 0) { const added = saveToDB(items); totalAdded += added; qlog(`[强制捕获 ✓] DOM扫描 ${items.length} 题，入库 ${added} 题`, 'ok'); }
        }

        if (totalAdded > 0) {
            qlog(`[强制捕获 🎉] 完成！共入库 ${totalAdded} 题已验证答案，已自动上传云端`, 'ok');
            toast(`已捕获 ${totalAdded} 题正确答案并上传云端！`, 4);
        }
        _forcedCaptureDone = false;
        return totalAdded;
    }

    // XHR 拦截
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const origOpen = xhr.open;
        let _url = '';
        xhr.open = function(method, url) { _url = url; return origOpen.apply(this, arguments); };
        xhr.addEventListener('load', function() {
            try {
                const url = this.responseURL || _url || '';
                if (url.includes('saveData')) {
                    _onSubmissionDetected('XHR');
                }
                if (url.includes('/api/')) {
                    const resData = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
                    if (resData) { const added = saveToDB(extractQuestionsFromData(resData)); if (added > 0) qlog(`[XHR] 抓取 ${added} 题`, 'ok'); }
                }
            } catch (e) {}
        });
        return xhr;
    };

    // Fetch 拦截
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        const cloneRes = response.clone();
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        if (url.includes('saveData')) {
            _onSubmissionDetected('Fetch');
        }
        cloneRes.json().then(resData => {
            try {
                if (url.includes('/api/')) {
                    const added = saveToDB(extractQuestionsFromData(resData));
                    if (added > 0) qlog(`[Fetch] 抓取 ${added} 题`, 'ok');
                }
            } catch(e) {}
        }).catch(() => {});
        return response;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPanel);
    } else {
        initPanel();
    }



})();
