'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SCRIPT = fs.readFileSync(path.join(__dirname, '小雅辅助工具 .user.js'), 'utf8');
const LOCAL_SCRIPT_VERSION = '3.7.2.3';
const PUBLISHED_MANIFEST_VERSION = '3.7.2.3';
const LATEST_MANIFEST = JSON.parse(fs.readFileSync(path.join(__dirname, 'xy-script.latest.json'), 'utf8'));
assert.match(SCRIPT, new RegExp(`@version\\s+${LOCAL_SCRIPT_VERSION.replaceAll('.', '\\.')}`));
assert.equal(LATEST_MANIFEST.version, PUBLISHED_MANIFEST_VERSION, 'cloud manifest must remain on the published version before release');
assert.match(SCRIPT, /@updateURL\s+https:\/\/gitee\.com\/fieldlu\/xy-script-assets\/raw\/main/);
assert.match(SCRIPT, /@downloadURL\s+https:\/\/gitee\.com\/fieldlu\/xy-script-assets\/raw\/main/);

// 3.7.2.1 今日学习提示规则：任务/课程排序必须可解释，并对不完整数据透明降级。
const todayPromptStart = SCRIPT.indexOf('    function xyTodayPromptDeadlineBucket');
assert(todayPromptStart >= 0 && SCRIPT.includes('    function xyTodayPromptBuildTaskSignal'), 'today prompt rule engine not found');
const todayPromptEnd = SCRIPT.indexOf('    function xyOverviewTaskStatus', todayPromptStart);
assert(todayPromptEnd > todayPromptStart, 'today prompt rule engine boundary not found');
const todayPromptContext = {
  Array, Date, Math, Number, String,
  xyOverviewNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
};
vm.runInNewContext(
  SCRIPT.slice(todayPromptStart, todayPromptEnd)
    + '\nglobalThis.__todayPrompt = { task: xyTodayPromptBuildTaskSignal, rankTasks: xyTodayPromptRankTasks, course: xyTodayPromptBuildCourseSignal, rankCourses: xyTodayPromptRankCourses, global: xyTodayPromptBuildGlobalSummary, single: xyTodayPromptBuildCourseSummary };',
  todayPromptContext
);
const today = Date.parse('2026-08-22T08:00:00Z');
const todayTasks = [
  { title: '未来任务', nodeId: 'future', status: { key: 'actionable' }, endTime: '2026-08-25T08:00:00Z' },
  { title: '今日截止', nodeId: 'today', status: { key: 'actionable' }, endTime: '2026-08-22T20:00:00Z' },
  { title: '待批阅', nodeId: 'pending', status: { key: 'pending' }, endTime: '2026-08-22T12:00:00Z' },
  { title: '已截止', nodeId: 'expired', status: { key: 'expired' }, endTime: '2026-08-21T20:00:00Z' }
];
const taskSignals = todayTasks.map(task => todayPromptContext.__todayPrompt.task(task, today));
assert.equal(taskSignals[1].deadlineBucket, 'today');
assert.equal(taskSignals[3].deadlineBucket, 'overdue');
assert.match(taskSignals[1].priorityReasons.join(' · '), /截止|可直接/);
assert.equal(todayPromptContext.__todayPrompt.rankTasks(taskSignals)[0].title, '今日截止');
assert.notEqual(todayPromptContext.__todayPrompt.rankTasks(taskSignals).at(-1).title, '今日截止');
const actionableCourse = todayPromptContext.__todayPrompt.course(
  { courseId: 'course-a', courseName: '课程 A', pendingCount: 2, expiredCount: 1, portrait: { taskCount: 10, finishedCount: 6 } },
  taskSignals,
  today
);
const quietCourse = todayPromptContext.__todayPrompt.course(
  { courseId: 'course-b', courseName: '课程 B', pendingCount: 0, expiredCount: 0, portrait: { taskCount: 10, finishedCount: 10 } },
  [],
  today
);
assert.equal(actionableCourse.state, 'urgent');
assert.equal(quietCourse.state, 'clear');
assert.equal(todayPromptContext.__todayPrompt.rankCourses([quietCourse, actionableCourse])[0].courseId, 'course-a');
const globalTodaySummary = todayPromptContext.__todayPrompt.global([quietCourse, actionableCourse], today);
assert.match(globalTodaySummary.title, /先处理|暂无/);
assert.equal(globalTodaySummary.counts.dueToday, 1, 'only reliably dated actionable tasks count as within 24 hours');
const loadingTodaySummary = todayPromptContext.__todayPrompt.global([], today, '正在读取课程与任务状态');
assert.equal(loadingTodaySummary.state, 'partial');
assert.deepEqual(Array.from(loadingTodaySummary.priorityReasons), ['正在读取课程与任务状态']);
assert.equal(todayPromptContext.__todayPrompt.single(quietCourse, today).state, 'clear');
const partialCourse = todayPromptContext.__todayPrompt.course(
  { courseId: 'course-c', courseName: '课程 C', pendingCount: 1, taskDetailsError: '任务接口失败' },
  [],
  today
);
assert.equal(todayPromptContext.__todayPrompt.single(partialCourse, today).state, 'unknown');
const oldGradedTask = todayPromptContext.__todayPrompt.task({
  title: '已批阅历史作业', status: { key: 'graded' }, endTime: '2020-01-01T00:00:00Z'
}, today);
assert.equal(oldGradedTask.isExpired, false, 'graded history must not become expired merely because its deadline passed');
const completedCourse = todayPromptContext.__todayPrompt.course(
  { courseId: 'course-d', courseName: '课程 D', pendingCount: 0, expiredCount: 0, portrait: { taskCount: 1, finishedCount: 1 } },
  [oldGradedTask],
  today
);
assert.equal(completedCourse.state, 'clear');
console.log('today study prompt rule regression: PASS');

// 两层今日提示必须作为正式内容区呈现，并保留真实任务跳转与单滚动约束。
assert.match(SCRIPT, /id="xy-course-dashboard-today"/, 'global today prompt container not found');
assert.match(SCRIPT, /function xyCourseDashboardRenderToday/, 'global today prompt renderer not found');
assert.match(SCRIPT, /xyCourseDashboardRenderToday\(\);/, 'global today prompt is not refreshed with dashboard');
assert.match(SCRIPT, /data-today-global-action="task"/, 'global prompt task action not found');
assert.match(SCRIPT, /data-today-global-action="overview"/, 'global prompt overview action not found');
assert.match(SCRIPT, /data-today-task-parent/, 'course prompt task parent id not found');
assert.match(SCRIPT, /data-today-task-node/, 'course prompt task node id not found');
assert.match(SCRIPT, /xy-today-prompt-step/, 'course prompt action step not found');
assert.match(SCRIPT, /xy-today-prompt-reason/, 'today prompt reason tag not found');
assert.match(SCRIPT, /overflow-wrap:anywhere/, 'today prompt long text wrapping not found');
assert.doesNotMatch(SCRIPT, /xy-course-dashboard-today[^\n]*overflow-y\s*:\s*(auto|scroll)/, 'global prompt must not create an extra vertical scroll area');
assert.match(SCRIPT, /taskGroupExpanded:\s*\{\}/, 'course task group state is not retained');
assert.match(SCRIPT, /data-course-task-group-type="\$\{type\}"/, 'task group type marker not found');
assert.match(SCRIPT, /course\.taskGroupExpanded\[groupType\]\s*=\s*group\.open/, 'task group collapse state is not persisted');
assert.doesNotMatch(SCRIPT, /\.xy-course-dashboard-list\s*\{[^}]*overflow-y:auto/, 'course dashboard list must not create a second vertical scroll area');
assert.doesNotMatch(SCRIPT, /\.xy-course-dashboard-task-list\s*\{[^}]*overflow-y:auto/, 'task group list must use the main vertical scroll area');
console.log('today study prompt UI regression: PASS');

// 情报站中的超长安装链接必须自动断行，不能把控制台横向撑宽。
const autoLinkStart = SCRIPT.indexOf('    function autoLink');
const autoLinkEnd = SCRIPT.indexOf('    function renderNotice', autoLinkStart);
assert(autoLinkStart >= 0 && autoLinkEnd > autoLinkStart, 'notice auto-link helper not found');
const autoLinkContext = {
  T(dark, light) { return light; },
  escapeHtml(value) { return String(value); }
};
vm.runInNewContext(
  SCRIPT.slice(autoLinkStart, autoLinkEnd) + '\nglobalThis.__autoLink = autoLink;',
  autoLinkContext
);
const longNoticeLink = autoLinkContext.__autoLink('更新链接：https://gitee.com/fieldlu/xy-script-assets/raw/main/very-long-userscript-installation-address.user.js');
assert.match(longNoticeLink, /overflow-wrap:anywhere/);
assert.match(longNoticeLink, /word-break:break-word/);
const renderNoticeStart = SCRIPT.indexOf('    function renderNotice');
const renderNoticeEnd = SCRIPT.indexOf('    function fetchCloudIntelligence', renderNoticeStart);
assert(renderNoticeStart >= 0 && renderNoticeEnd > renderNoticeStart, 'notice renderer not found');
const renderNoticeSource = SCRIPT.slice(renderNoticeStart, renderNoticeEnd);
assert.match(renderNoticeSource, /contentBox\.style\.overflowX = 'hidden'/);
assert.match(renderNoticeSource, /overflow-wrap:anywhere/);
assert.match(SCRIPT, /id="xy-main-body" style="padding: 10px 12px; min-width:0; overflow-x:hidden; overflow-y: auto;/);
console.log('intelligence station overflow regression: PASS');

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

// 总览卡片进入课程应落到资源目录；任务明细应携带父节点和任务节点直达原任务。
const courseResourceUrlStart = SCRIPT.indexOf('    function xyCourseDashboardResourceUrl');
assert(courseResourceUrlStart >= 0, 'course resource URL helper not found');
const courseResourceUrlEnd = SCRIPT.indexOf('    function xyCourseDashboardNormalizeCourses', courseResourceUrlStart);
assert(courseResourceUrlEnd > courseResourceUrlStart, 'course resource URL helper boundary not found');
const courseResourceUrlContext = { encodeURIComponent, xyCourseRoutePrefix() { return 'mycourse'; } };
vm.runInNewContext(
  SCRIPT.slice(courseResourceUrlStart, courseResourceUrlEnd) + '\nglobalThis.__courseResourceUrl = xyCourseDashboardResourceUrl;',
  courseResourceUrlContext
);
assert.equal(
  courseResourceUrlContext.__courseResourceUrl('6909361981107512502'),
  '/app/jx-web/mycourse/6909361981107512502/resource'
);

// 鉴权 Cookie 的值可能含有“=”填充符，读取时不能被截断。
const cookieStart = SCRIPT.indexOf('    function getCookie');
const cookieEnd = SCRIPT.indexOf('    async function getAuthToken', cookieStart);
assert(cookieStart >= 0 && cookieEnd > cookieStart, 'cookie helper not found');
const cookieContext = { document: { cookie: 'theme=dark; prd-access-token=token-value==; other=1' } };
vm.runInNewContext(SCRIPT.slice(cookieStart, cookieEnd) + '\nglobalThis.__getCookie = getCookie;', cookieContext);
assert.equal(cookieContext.__getCookie(), 'token-value==');
console.log('auth cookie parsing regression: PASS');

const taskOpenStart = SCRIPT.indexOf('    function xyOverviewOpenTask');
const taskOpenEnd = SCRIPT.indexOf('    function xyOverviewSyncRoute', taskOpenStart);
assert(taskOpenStart >= 0 && taskOpenEnd > taskOpenStart, 'task jump helper not found');
const taskOpenContext = {
  window: { location: { pathname: '/app/jx-web/mycourse', href: '' } },
  encodeURIComponent,
  xyCourseRoutePrefix() { return 'mycourse'; },
  showToast() {}
};
vm.runInNewContext(
  SCRIPT.slice(taskOpenStart, taskOpenEnd) + '\nglobalThis.__openTask = xyOverviewOpenTask;',
  taskOpenContext
);
taskOpenContext.__openTask('6909361981107512502', 'parent-node', 'task-node');
assert.equal(
  taskOpenContext.window.location.href,
  '/app/jx-web/mycourse/6909361981107512502/resource/parent-node/task-node'
);
console.log('course navigation regression: PASS');

// 主动打开当前课程学情后，课程总览、刷课和讨论路由扫描都不能覆盖该选择。
const overviewKeepStart = SCRIPT.indexOf('    function xyShouldKeepDashboardOverview');
const overviewKeepEnd = SCRIPT.indexOf('    function getNodeId', overviewKeepStart);
assert(overviewKeepStart >= 0 && overviewKeepEnd > overviewKeepStart, 'dashboard overview route guard not found');
const overviewKeepContext = {
  appState: { activeZone: 'overview' },
  xyOverviewState: { courseId: 'course-a', dashboardCourseId: 'course-a', pinnedCourseId: 'course-a' },
  courseHome: true
};
overviewKeepContext.isActiveCourseHomePage = () => overviewKeepContext.courseHome;
vm.runInNewContext(
  SCRIPT.slice(overviewKeepStart, overviewKeepEnd) + '\nglobalThis.__keepOverview = xyShouldKeepDashboardOverview;',
  overviewKeepContext
);
assert.equal(overviewKeepContext.__keepOverview(''), true);
overviewKeepContext.appState.activeZone = 'courses';
assert.equal(overviewKeepContext.__keepOverview(''), false);
overviewKeepContext.appState.activeZone = 'overview';
overviewKeepContext.courseHome = false;
assert.equal(overviewKeepContext.__keepOverview('course-a'), true, 'same course must stay in overview outside the dashboard page');
assert.equal(overviewKeepContext.__keepOverview('course-b'), false);
overviewKeepContext.xyOverviewState.pinnedCourseId = '';
assert.equal(overviewKeepContext.__keepOverview(''), false);
assert.match(SCRIPT, /if \(xyShouldKeepDashboardOverview\(groupId\)\) return;\s*switchToZone\('courses'\);/);
assert.doesNotMatch(SCRIPT, /routeDismissedUrl/, 'dismissed-route guard was removed in 3.7.2.3');
const scannerStart = SCRIPT.indexOf('    async function runLowLevelScanner');
const scannerEnd = SCRIPT.indexOf('    function courseGroupKey', scannerStart);
assert(scannerStart >= 0 && scannerEnd > scannerStart, 'low-level scanner boundary not found');
const noNodeCourseRouteStart = SCRIPT.indexOf('        if (!nodeId) {', scannerStart);
const noNodeCourseRouteEnd = SCRIPT.indexOf('        let taskType = -1;', noNodeCourseRouteStart);
assert(noNodeCourseRouteStart >= scannerStart && noNodeCourseRouteEnd > noNodeCourseRouteStart, 'course route without a resource node branch not found');
// task/home/courseTools 已取消独立任务区：无节点分支必须直接打开学习数据概览。
assert.match(
  SCRIPT.slice(noNodeCourseRouteStart, noNodeCourseRouteEnd),
  /routeKind === 'overview'[\s\S]{0,220}?xyOverviewLoad\(groupId, false\)/,
  'task/home/courseTools routes must open the learning data overview directly'
);
// 有资源节点的课程内容页不得被扫描器自动切到概览。
const scannerDeepBranchStart = SCRIPT.indexOf('        let taskType = -1;', scannerStart);
const scannerDeepBranchEnd = SCRIPT.indexOf('    function courseGroupKey', scannerStart);
assert(scannerDeepBranchStart >= scannerStart && scannerDeepBranchEnd > scannerDeepBranchStart, 'scanner deep branch boundary not found');
assert.doesNotMatch(
  SCRIPT.slice(scannerDeepBranchStart, scannerDeepBranchEnd),
  /xyOverviewOpen\(groupId\)/,
  'resource-node pages must never auto-open the overview'
);
assert.match(
  SCRIPT.slice(scannerStart, scannerEnd),
  /const routeCourseId = getCourseGroupId\(\);[\s\S]{0,180}?if \(xyShouldKeepDashboardOverview\(routeCourseId\)\) return;[\s\S]{0,180}?if \(appState\.activeZone === 'download'\)/
);
console.log('course overview persistence regression: PASS');

// 正在查看被固定的学情概览时，任何旧扫描都不得回切课程总览并清除概览锁。
const switchToZoneStart = SCRIPT.indexOf('    function switchToZone');
const switchToZoneEnd = SCRIPT.indexOf('    async function fetchRadarCached', switchToZoneStart);
assert(switchToZoneStart >= 0 && switchToZoneEnd > switchToZoneStart, 'zone switcher boundary not found');
const lockedOverviewSwitchContext = {
  appState: { activeZone: 'overview' },
  xyOverviewState: { courseId: 'course-a', dashboardCourseId: 'course-a', pinnedCourseId: 'course-a' },
  getCourseGroupId() { return ''; },
  isActiveCourseHomePage() { return true; },
  document: { getElementById() { return null; } },
  clearDynamicRefresh() {},
  xyCourseDashboardRender() {},
  toggleRecord() {},
  ensureAutoRecord() {},
  globalTaskStatusChecker() {},
  getNodeId() { return ''; },
  logMsg() {}
};
vm.runInNewContext(
  SCRIPT.slice(overviewKeepStart, overviewKeepEnd)
    + SCRIPT.slice(switchToZoneStart, switchToZoneEnd)
    + '\nglobalThis.__switchToZone = switchToZone;',
  lockedOverviewSwitchContext
);
lockedOverviewSwitchContext.__switchToZone('courses');
assert.equal(lockedOverviewSwitchContext.appState.activeZone, 'overview');
assert.equal(lockedOverviewSwitchContext.xyOverviewState.pinnedCourseId, 'course-a');
lockedOverviewSwitchContext.xyOverviewState.pinnedCourseId = '';
lockedOverviewSwitchContext.xyOverviewState.dashboardCourseId = '';
lockedOverviewSwitchContext.__switchToZone('courses');
assert.equal(lockedOverviewSwitchContext.appState.activeZone, 'courses', 'explicit overview return must still be able to restore the original zone');
console.log('locked overview zone arbitration regression: PASS');

// 右上角概览按钮必须在“原分区 ↔ 学情概览”之间双向切换；异步扫描返回后也不得覆盖用户选择。
const overviewToggleStart = SCRIPT.indexOf('    function xyOverviewReturnZone');
const overviewToggleEnd = SCRIPT.indexOf('    function xyOverviewRefresh', overviewToggleStart);
assert(overviewToggleStart >= 0 && overviewToggleEnd > overviewToggleStart, 'overview toggle helpers not found');
assert.match(SCRIPT, /returnZone:\s*''/, 'overview return zone state is not initialized');
const overviewToggleContext = {
  appState: { activeZone: 'course' },
  xyOverviewState: { courseId: 'course-a', dashboardCourseId: '', pinnedCourseId: '', returnZone: '' },
  getCourseGroupId() { return 'course-a'; },
  courseGroupKey(value) { return String(value || ''); },
  isActiveCourseHomePage() { return false; },
  document: { getElementById() { return null; } },
  showToast() {},
  xyOverviewLoad() {},
  switchToZone(zone) { overviewToggleContext.appState.activeZone = zone; }
};
vm.runInNewContext(
  SCRIPT.slice(overviewToggleStart, overviewToggleEnd)
    + '\nglobalThis.__toggleOverview = xyOverviewToggle;\nglobalThis.__returnOverview = xyOverviewReturn;',
  overviewToggleContext
);
overviewToggleContext.__toggleOverview();
assert.equal(overviewToggleContext.appState.activeZone, 'overview');
assert.equal(overviewToggleContext.xyOverviewState.returnZone, 'course');
overviewToggleContext.__toggleOverview();
assert.equal(overviewToggleContext.appState.activeZone, 'course');
assert.equal(overviewToggleContext.xyOverviewState.returnZone, '');
overviewToggleContext.appState.activeZone = 'overview';
overviewToggleContext.xyOverviewState.returnZone = 'disc';
assert.equal(overviewToggleContext.__returnOverview(), 'disc');
assert.equal(overviewToggleContext.appState.activeZone, 'disc');
const asyncScannerBody = SCRIPT.slice(scannerStart, scannerEnd);
assert.match(
  asyncScannerBody,
  /if \(!isSameScanContext\(\)\) return;\s*if \(xyShouldKeepDashboardOverview\(groupId\)\) return;\s*if \(taskType === 1\)/,
  'scanner must re-check the overview lock after asynchronous work'
);
console.log('course overview toggle and async-race regression: PASS');

// 任何异步捕获完成后的自动分区也必须尊重用户已打开的学情概览。
const discussionCaptureStart = SCRIPT.indexOf("    window.addEventListener('xy-disc-captured'");
const discussionCaptureEnd = SCRIPT.indexOf('    async function getTaskTypeAccurate', discussionCaptureStart);
assert(discussionCaptureStart >= 0 && discussionCaptureEnd > discussionCaptureStart, 'discussion capture handler not found');
assert.match(
  SCRIPT.slice(discussionCaptureStart, discussionCaptureEnd),
  /if \(xyShouldKeepDashboardOverview\(getCourseGroupId\(\)\)\) return;/,
  'discussion capture must not replace an open overview'
);
const homeworkProcessStart = SCRIPT.indexOf('    function hwProcessPaperData');
const homeworkProcessEnd = SCRIPT.indexOf('    let _hwProactiveFetching', homeworkProcessStart);
assert(homeworkProcessStart >= 0 && homeworkProcessEnd > homeworkProcessStart, 'homework processor not found');
assert.match(
  SCRIPT.slice(homeworkProcessStart, homeworkProcessEnd),
  /if\s*\(\s*hwQuestionsData\.length && !xyShouldKeepDashboardOverview\(hwGroupId \|\| getCourseGroupId\(\)\)\s*\)\s*switchToZone\('hw'\);/,
  'homework processing must not replace an open overview'
);
const homeworkPayloadGuardStart = SCRIPT.indexOf('    function hwIsCurrentPaperPayload');
const homeworkPayloadGuardEnd = SCRIPT.indexOf('    function hwProcessPaperData', homeworkPayloadGuardStart);
assert(homeworkPayloadGuardStart >= 0 && homeworkPayloadGuardEnd > homeworkPayloadGuardStart, 'homework payload route guard not found');
const homeworkPayloadGuardContext = {
  hwPaperId: 'paper-current',
  getCourseGroupId() { return 'course-current'; },
  getPaperId() { return 'paper-current'; }
};
vm.runInNewContext(
  SCRIPT.slice(homeworkPayloadGuardStart, homeworkPayloadGuardEnd) + '\nglobalThis.__isCurrentPaperPayload = hwIsCurrentPaperPayload;',
  homeworkPayloadGuardContext
);
assert.equal(homeworkPayloadGuardContext.__isCurrentPaperPayload({ data: { group_id: 'course-current' } }), true);
assert.equal(homeworkPayloadGuardContext.__isCurrentPaperPayload({ data: { group_id: 'course-stale' } }), false);
assert.equal(homeworkPayloadGuardContext.__isCurrentPaperPayload({ data: { group_id: 'course-current', paper_id: 'paper-stale' } }), false);
homeworkPayloadGuardContext.hwPaperId = 'paper-previous';
homeworkPayloadGuardContext.getPaperId = () => 'paper-current';
assert.equal(
  homeworkPayloadGuardContext.__isCurrentPaperPayload({ data: { group_id: 'course-current', paper_id: 'paper-previous' } }),
  false,
  'the active route paper ID must take precedence over an older cached paper ID'
);
assert.match(
  SCRIPT.slice(homeworkProcessStart, homeworkProcessEnd),
  /if\s*\(!hwIsCurrentPaperPayload\(json\)\)\s*\{[\s\S]{0,160}?return;/,
  'stale homework payload must be ignored before it mutates task state'
);
console.log('overview async-event protection regression: PASS');

// 从无课程 ID 的总览页打开任意课程学情后，右上角仍须可见并可返回课程总览。
const overviewOpenStart = SCRIPT.indexOf('    function xyOverviewReturnZone');
const overviewOpenEnd = SCRIPT.indexOf('    function xyOverviewRefresh', overviewOpenStart);
assert(overviewOpenStart >= 0 && overviewOpenEnd > overviewOpenStart, 'overview open helpers not found');
const dashboardOverviewContext = {
  appState: { activeZone: 'courses' },
  xyOverviewState: { courseId: '', dashboardCourseId: '', pinnedCourseId: '', returnZone: '' },
  getCourseGroupId() { return ''; },
  courseGroupKey(value) { return String(value || ''); },
  isActiveCourseHomePage() { return true; },
  document: { getElementById() { return null; } },
  showToast() {},
  xyOverviewLoad() {},
  switchToZone(zone) { dashboardOverviewContext.appState.activeZone = zone; }
};
vm.runInNewContext(
  SCRIPT.slice(overviewOpenStart, overviewOpenEnd)
    + '\nglobalThis.__openOverview = xyOverviewOpen;\nglobalThis.__toggleOverview = xyOverviewToggle;',
  dashboardOverviewContext
);
dashboardOverviewContext.__openOverview('course-a');
assert.equal(dashboardOverviewContext.appState.activeZone, 'overview');
assert.equal(dashboardOverviewContext.xyOverviewState.returnZone, 'courses');
dashboardOverviewContext.__toggleOverview();
assert.equal(dashboardOverviewContext.appState.activeZone, 'courses');
assert.match(
  SCRIPT,
  /openButton\.style\.display = \(courseId \|\| appState\.activeZone === 'overview'\) \? 'inline-flex' : 'none';/,
  'overview toggle must remain available after opening a dashboard course'
);
console.log('dashboard overview return regression: PASS');

// 面板因 SPA 重建时，旧的文档级拖拽监听必须撤销，避免重复移动与闭包泄漏。
const createUiStart = SCRIPT.indexOf('    function createUI()');
const createUiEnd = SCRIPT.indexOf('    let _uiCreating = false;', createUiStart);
assert(createUiStart >= 0 && createUiEnd > createUiStart, 'UI creation boundary not found');
const createUiSource = SCRIPT.slice(createUiStart, createUiEnd);
assert.match(createUiSource, /xyUiListenerAbort\?\.abort\(\);/, 'previous UI listeners are not disposed');
assert.match(createUiSource, /new AbortController\(\)/, 'UI listener lifecycle controller not created');
assert.match(createUiSource, /document\.addEventListener\('mousemove',[\s\S]{0,1600}?uiDocumentListenerOptions\);/, 'mousemove listener is not lifecycle-bound');
assert.match(createUiSource, /document\.addEventListener\('mouseup',[\s\S]{0,800}?uiDocumentListenerOptions\);/, 'mouseup listener is not lifecycle-bound');
console.log('UI listener lifecycle regression: PASS');

// 路由选择必须仅由 xyRouteKind 驱动，不能保留宽泛的“课程首页”判定。
assert.doesNotMatch(SCRIPT, /function isCourseOverviewPage\(/);
assert.match(SCRIPT.slice(noNodeCourseRouteStart, noNodeCourseRouteEnd), /routeKind === 'overview'[\s\S]*?xyOverviewLoad\(groupId, false\)/);
assert.doesNotMatch(SCRIPT.slice(noNodeCourseRouteStart, noNodeCourseRouteEnd), /courseHome|xyCourseHome/);
assert.doesNotMatch(SCRIPT.slice(noNodeCourseRouteStart, noNodeCourseRouteEnd), /switchToZone\('course'\)/);
assert.match(SCRIPT, /if \(!groupId\) \{[\s\S]*?switchToZone\('courses'\);[\s\S]*?xyCourseDashboardLoad\(false\)/);
assert.doesNotMatch(SCRIPT, /switchToZone\('standby'\)/);
assert.doesNotMatch(SCRIPT, /xy-view-standby/);
console.log('route-aware overview regression: PASS');

// 切换学情概览后返回时，单课程页面必须保留自己的原分区。
assert.match(SCRIPT, /\['course', 'disc', 'hw', 'dir', 'download', 'courses'\]/);
assert.doesNotMatch(SCRIPT, /xy-view-course-home|xyCourseHome|courseHome/);
assert.doesNotMatch(SCRIPT, /viewTask\.style\.display = newZone === 'task' \? 'flex' : 'none';/);
console.log('course route zone transition regression: PASS');

// 路由必须按页面语义分区：全局课程页才是总览，单课程任务页不能被映射到刷课区或全局总览。
const routeKindStart = SCRIPT.indexOf('    function getCourseGroupId');
const routeKindEnd = SCRIPT.indexOf('    const sleep', routeKindStart);
assert(routeKindStart >= 0 && routeKindEnd > routeKindStart, 'route helper boundary not found');
const routeKindContext = {
  window: { location: { href: 'https://whut.ai-augmented.com/app/jx-web/mycourse/100/task', pathname: '/app/jx-web/mycourse/100/task' } }
};
vm.runInNewContext(
  SCRIPT.slice(routeKindStart, routeKindEnd) + '\nglobalThis.__routeKind = xyRouteKind;',
  routeKindContext
);
assert.equal(routeKindContext.__routeKind('/app/jx-web/mycourse'), 'courses');
assert.equal(routeKindContext.__routeKind('/app/jx-web/mycourse/100/task'), 'overview');
assert.equal(routeKindContext.__routeKind('/app/jx-web/mycourse/100/home'), 'overview');
assert.equal(routeKindContext.__routeKind('/app/jx-web/mycourse/100/courseTools'), 'overview');
assert.equal(routeKindContext.__routeKind('/app/jx-web/mycourse/100/resource/200/300'), 'course');
assert.equal(routeKindContext.__routeKind('/app/jx-web/course/100/task'), 'overview');
assert.equal(routeKindContext.__routeKind('/app/jx-web/course/100/resource/200/300'), 'course');
assert.equal(routeKindContext.__routeKind('/app/jx-web/mycourse/100'), 'overview');
assert.match(SCRIPT, /function xyCourseRoutePrefix\(\)/);
assert.doesNotMatch(SCRIPT, /function xyCourseDashboardTaskUrl\(courseId\)/);
assert.match(SCRIPT, /function xyCourseDashboardResourceUrl\(courseId\)/);
console.log('route-native course zone classifier regression: PASS');

// task/home/courseTools 上用户手动关闭学情后，扫描器不得再次自动打开，避免“返回后立刻跳回”。
const routeReturnStart = SCRIPT.indexOf('    function xyOverviewReturnZone');
const routeReturnEnd = SCRIPT.indexOf('    function xyOverviewRefresh', routeReturnStart);
assert(routeReturnStart >= 0 && routeReturnEnd > routeReturnStart, 'overview return helper not found');
const routeReturnContext = {
  appState: { activeZone: 'overview' },
  xyOverviewState: { courseId: 'course-a', dashboardCourseId: '', pinnedCourseId: 'course-a', returnZone: 'courses' },
  getCourseGroupId() { return 'course-a'; },
  courseGroupKey(value) { return String(value || ''); },
  window: { location: { href: 'https://whut.ai-augmented.com/app/jx-web/mycourse/course-a/task' } },
  xyRouteKind() { return 'overview'; },
  switchToZone(zone) { routeReturnContext.appState.activeZone = zone; }
};
vm.runInNewContext(
  SCRIPT.slice(routeReturnStart, routeReturnEnd) + '\nglobalThis.__returnOverview = xyOverviewReturn;',
  routeReturnContext
);
routeReturnContext.__returnOverview();
assert.equal(routeReturnContext.appState.activeZone, 'courses');
assert.equal(routeReturnContext.xyOverviewState.returnZone, '');
assert.equal(routeReturnContext.xyOverviewState.pinnedCourseId, '');
console.log('overview return clears pinned state regression: PASS');

// 讨论页可能没有资源节点，扫描器必须在无节点分支中优先保留讨论区。
assert.match(SCRIPT.slice(noNodeCourseRouteStart, noNodeCourseRouteEnd), /if \(routeKind === 'disc'\) \{\s*switchToZone\('disc'\);\s*return;/);
const discussionHelperStart = SCRIPT.indexOf('    function xyIsDiscussionPage');
const discussionHelperEnd = SCRIPT.indexOf('    const sleep', discussionHelperStart);
assert(discussionHelperStart >= 0 && discussionHelperEnd > discussionHelperStart, 'discussion helper boundary not found');
assert.doesNotMatch(SCRIPT.slice(discussionHelperStart, discussionHelperEnd), /document\.body\.innerHTML/);
console.log('no-node discussion route regression: PASS');

// 单课程的 task/home/courseTools 不再有独立任务区：直接复用学习数据概览，且旧任务区痕迹必须清除。
assert.doesNotMatch(SCRIPT, /id="xy-view-task"/);
assert.doesNotMatch(SCRIPT, /xyCourseScopedState|xyCourseScopedLoad|xyCourseTaskRender|xy-course-task-content/);
assert.doesNotMatch(SCRIPT, /returnZone === 'task' && courseId/);
assert.match(SCRIPT, /async function xyOverviewFetchCourseData\(courseId, force = false\)/);
assert.match(SCRIPT, /Date\.now\(\) - cached\.loadedAt < xyOverviewState\.cacheTtl/);
assert.match(SCRIPT, /dataRequestSeq: new Map\(\)/);
assert.match(SCRIPT, /xyOverviewState\.dataRequestSeq\.get\(normalizedCourseId\) === dataRequestSeq/);
assert.match(SCRIPT, /dataVersion: dataRequestSeq/);
assert.match(SCRIPT, /if \(xyOverviewState\.dataRequestSeq\.get\(normalizedCourseId\) === dataRequestSeq\) \{/);
assert.match(SCRIPT, /cached\.dataVersion === xyOverviewState\.dataRequestSeq\.get\(normalizedCourseId\)/);
console.log('single-course learning data overview regression: PASS');

// 课程工作台首屏优先提示可做任务，完整成绩与状态明细保持可展开。
const overviewBreakdownStart = SCRIPT.indexOf('    function xyOverviewTaskBreakdown');
const overviewBreakdownEnd = SCRIPT.indexOf('    function xyOverviewRenderLoading', overviewBreakdownStart);
assert(overviewBreakdownStart >= 0 && overviewBreakdownEnd > overviewBreakdownStart, 'overview task breakdown helper not found');
const overviewBreakdownContext = { Array };
vm.runInNewContext(
  SCRIPT.slice(overviewBreakdownStart, overviewBreakdownEnd) + '\nglobalThis.__overviewTaskBreakdown = xyOverviewTaskBreakdown;',
  overviewBreakdownContext
);
const overviewBreakdown = overviewBreakdownContext.__overviewTaskBreakdown([
  { status: { key: 'actionable' } },
  { status: { key: 'graded' } },
  { status: { key: 'expired' } },
  { status: { key: 'pending' } }
]);
assert.deepEqual(JSON.parse(JSON.stringify(overviewBreakdown)), { actionable: 1, pending: 1, graded: 1, expired: 1 });
assert.match(SCRIPT, /xy-overview-focus/);
assert.match(SCRIPT, /xy-overview-task-details/);
assert.match(SCRIPT, /xy-overview-metric-title/);
assert.match(SCRIPT, /xy-overview-metric-rate/);
assert.match(SCRIPT, /xy-overview-value-suffix/);
assert.match(SCRIPT, /xy-overview-study-value/);
assert.match(SCRIPT, /\.xy-overview-study-value \{ font-size:16px;/);
console.log('course workbench summary regression: PASS');

// 路由同步会重绘工作台；用户手动展开或收起任务明细后，状态不能被默认值覆盖。
const overviewDetailsStateStart = SCRIPT.indexOf('    function xyOverviewTaskDetailsOpen');
const overviewDetailsStateEnd = SCRIPT.indexOf('    function xyOverviewRenderLoading', overviewDetailsStateStart);
assert(overviewDetailsStateStart >= 0 && overviewDetailsStateEnd > overviewDetailsStateStart, 'overview detail state helper not found');
const overviewDetailsStateContext = {};
vm.runInNewContext(
  SCRIPT.slice(overviewDetailsStateStart, overviewDetailsStateEnd) + '\nglobalThis.__overviewTaskDetailsOpen = xyOverviewTaskDetailsOpen;',
  overviewDetailsStateContext
);
assert.equal(overviewDetailsStateContext.__overviewTaskDetailsOpen(null, { actionable: 1 }), true);
assert.equal(overviewDetailsStateContext.__overviewTaskDetailsOpen(true, { actionable: 1 }), true);
assert.equal(overviewDetailsStateContext.__overviewTaskDetailsOpen(false, { actionable: 1 }), false);
console.log('course workbench detail state regression: PASS');

// 轮询只同步路由，不得重建已显示的概览 DOM，否则任务滚动条会回到顶部。
const overviewSyncStart = SCRIPT.indexOf('    function xyOverviewSyncRoute');
const overviewSyncEnd = SCRIPT.indexOf('    function xyCourseDashboardResourceUrl', overviewSyncStart);
assert(overviewSyncStart >= 0 && overviewSyncEnd > overviewSyncStart, 'overview route sync helper not found');
assert.doesNotMatch(SCRIPT.slice(overviewSyncStart, overviewSyncEnd), /xyOverviewRender\(xyOverviewState\.currentData\)/);
console.log('course workbench scroll preservation regression: PASS');

// 学情概览是主控台的正式区域，而非遮挡内容的抽屉；整个概览正文作为唯一可拖动的竖向滚动区。
assert.doesNotMatch(SCRIPT, /xy-overview-drawer/);
assert.doesNotMatch(SCRIPT, /xy-overview-close/);
assert.match(SCRIPT, /id="xy-view-overview"/);
assert.match(SCRIPT, /switchToZone\('overview'\)/);
assert.match(SCRIPT, /newZone === 'overview'/);
const overviewContentCss = SCRIPT.match(/#xy-super-console \.xy-overview-content \{[^}]+\}/)?.[0] || '';
assert.match(overviewContentCss, /\bflex:1 1 auto;/);
assert.match(overviewContentCss, /\boverflow-y:auto;/);
assert.match(overviewContentCss, /\boverscroll-behavior:contain;/);
assert.match(overviewContentCss, /\bscrollbar-gutter:stable;/);
assert.match(SCRIPT, /#xy-super-console \.xy-overview-task-list \{ max-height:none; overflow-y:visible; \}/);
assert.match(SCRIPT, /if \(overviewRefreshBtn\) overviewRefreshBtn\.onclick = \(\) => xyOverviewRefresh\(\);/);
const overviewViewCss = SCRIPT.match(/#xy-super-console \.xy-overview-view \{[^}]+\}/)?.[0] || '';
assert.match(overviewViewCss, /\bborder:1px solid var\(--xy-border\);/);
assert.match(overviewViewCss, /\bborder-radius:12px;/);
assert.match(overviewViewCss, /\bbackground:var\(--xy-surface\);/);
assert.match(SCRIPT, /#xy-main-body \{ min-height:0; \}/);
assert.match(SCRIPT, /mainBody\.style\.overflowY = newZone === 'overview' \? 'hidden' : 'auto';/);
console.log('course workbench integrated overview regression: PASS');

// 成员画像与待办接口不一致时，必须明确标注统计差异，不能虚构一个不可定位的待办任务。
const unresolvedTaskNoticeStart = SCRIPT.indexOf('    function xyOverviewUnresolvedTaskNotice');
assert(unresolvedTaskNoticeStart >= 0, 'unresolved task notice helper not found');
const unresolvedTaskNoticeEnd = SCRIPT.indexOf('    function xyOverviewRender(data)', unresolvedTaskNoticeStart);
assert(unresolvedTaskNoticeEnd > unresolvedTaskNoticeStart, 'unresolved task notice helper boundary not found');
const unresolvedTaskNoticeContext = {
  xyOverviewNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  },
  Math,
  Number
};
vm.runInNewContext(
  SCRIPT.slice(unresolvedTaskNoticeStart, unresolvedTaskNoticeEnd) + '\nglobalThis.__unresolvedTaskNotice = xyOverviewUnresolvedTaskNotice;',
  unresolvedTaskNoticeContext
);
assert.deepEqual(
  JSON.parse(JSON.stringify(unresolvedTaskNoticeContext.__unresolvedTaskNotice(162, 163))),
  {
    title: '平台统计相差 1 项',
    meta: '成员画像为 162 / 163，但待办接口未返回对应任务；请以“作业任务”页的状态为准。'
  }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(unresolvedTaskNoticeContext.__unresolvedTaskNotice(162, 163, '网络请求失败'))),
  {
    title: '待办接口加载失败',
    meta: '成员画像为 162 / 163；未能读取待办接口（网络请求失败），暂时无法定位对应任务。'
  }
);
console.log('course workbench task statistic discrepancy regression: PASS');

// 成员画像统计所有课程任务；非作业待办也应合入明细，并在已批阅项目之前出现。
const pendingTaskStart = SCRIPT.indexOf('    function xyOverviewNormalizePendingTasks');
const pendingTaskEnd = SCRIPT.indexOf('    function xyOverviewTaskBreakdown', pendingTaskStart);
assert(pendingTaskStart >= 0 && pendingTaskEnd > pendingTaskStart, 'overview pending task helper not found');
const pendingTaskContext = { Array, Date, Math, Number, String };
vm.runInNewContext(
  SCRIPT.slice(pendingTaskStart, pendingTaskEnd) + '\nglobalThis.__normalizePending = xyOverviewNormalizePendingTasks;\nglobalThis.__mergeTasks = xyOverviewMergeTasks;',
  pendingTaskContext
);
const pendingTasks = pendingTaskContext.__normalizePending([
  { group_id: 'course-a', title: '自主观看', node_id: 'video-1', parent_id: 'unit-1', end_time: '2099-01-01 00:00:00' },
  { group_id: 'course-a', title: '过期课件', node_id: 'file-1', end_time: '2020-01-01 00:00:00' },
  { group_id: 'course-b', title: '其他课程任务', node_id: 'other-1' }
], 'course-a', Date.parse('2026-08-21T00:00:00Z'));
assert.deepEqual(JSON.parse(JSON.stringify(pendingTasks.map(task => [task.title, task.status.key]))), [
  ['自主观看', 'actionable'], ['过期课件', 'expired']
]);
const mergedTasks = pendingTaskContext.__mergeTasks(pendingTasks, [
  { title: '已批阅测验', nodeId: 'paper-1', status: { key: 'graded' } },
  { title: '自主观看（作业接口副本）', nodeId: 'video-1', status: { key: 'graded' } }
]);
assert.equal(mergedTasks[0].status.key, 'actionable');
assert.equal(mergedTasks[0].title, '自主观看');
assert.equal(mergedTasks.at(-1).title, '已批阅测验');
console.log('course workbench pending task regression: PASS');

// 待办接口可能省略父节点；应由课程资源树按任务节点补齐，且能回退到路径中的父节点。
const pendingParentResolverStart = SCRIPT.indexOf('    function xyCourseDashboardResolveTaskParentId');
assert(pendingParentResolverStart >= 0, 'pending task parent resolver not found');
const pendingParentResolverEnd = SCRIPT.indexOf('    function xyCourseDashboardGroupPending', pendingParentResolverStart);
assert(pendingParentResolverEnd > pendingParentResolverStart, 'pending task parent resolver boundary not found');
const pendingParentResolverContext = {
  normalizeDownloadId(value) {
    if (value === null || value === undefined) return null;
    const id = String(value).trim();
    return id || null;
  },
  dlResourceId(resource) {
    return resource?.id ?? resource?.resource_id ?? resource?.node_id ?? resource?.nodeId ?? null;
  },
  dlCollectResources(resources) {
    const result = [];
    const visit = value => {
      if (Array.isArray(value)) return value.forEach(visit);
      if (!value || typeof value !== 'object') return;
      result.push(value);
      visit(value.children);
      visit(value.child_nodes);
      visit(value.items);
    };
    visit(resources);
    return result;
  },
  String
};
vm.runInNewContext(
  SCRIPT.slice(pendingParentResolverStart, pendingParentResolverEnd) + '\nglobalThis.__resolveTaskParentId = xyCourseDashboardResolveTaskParentId;',
  pendingParentResolverContext
);
assert.equal(pendingParentResolverContext.__resolveTaskParentId([{ id: 'task-1', parent_id: 'unit-1' }], 'task-1'), 'unit-1');
assert.equal(pendingParentResolverContext.__resolveTaskParentId([{ id: 'task-2', path: 'course/unit-2/task-2' }], 'task-2'), 'unit-2');
assert.equal(pendingParentResolverContext.__resolveTaskParentId([], 'task-3'), '');
console.log('pending task parent resolution regression: PASS');

// 点击课程卡片主体只展开/收起任务明细，不复用“进入课程”的资源目录跳转。
const detailToggleStart = SCRIPT.indexOf('    function xyCourseDashboardToggleTaskDetails');
assert(detailToggleStart >= 0, 'course task detail toggle not found');
const detailToggleEnd = SCRIPT.indexOf('    function xyCourseDashboardDeactivate', detailToggleStart);
assert(detailToggleEnd > detailToggleStart, 'course task detail toggle boundary not found');
const detailToggleCalls = { loads: 0, renders: 0 };
const detailToggleContext = {
  xyCourseDashboardLoadTaskDetails() { detailToggleCalls.loads++; },
  xyCourseDashboardRender() { detailToggleCalls.renders++; }
};
vm.runInNewContext(
  SCRIPT.slice(detailToggleStart, detailToggleEnd) + '\nglobalThis.__toggleTaskDetails = xyCourseDashboardToggleTaskDetails;',
  detailToggleContext
);
const toggleCourse = { taskDetailsExpanded: false };
detailToggleContext.__toggleTaskDetails(toggleCourse);
assert.equal(toggleCourse.taskDetailsExpanded, true);
assert.equal(detailToggleCalls.loads, 1);
detailToggleContext.__toggleTaskDetails(toggleCourse);
assert.equal(toggleCourse.taskDetailsExpanded, false);
assert.equal(detailToggleCalls.renders, 1);
toggleCourse.taskDetailsState = 'loaded';
detailToggleContext.__toggleTaskDetails(toggleCourse);
assert.equal(toggleCourse.taskDetailsExpanded, true);
assert.equal(detailToggleCalls.loads, 1);
assert.equal(detailToggleCalls.renders, 2);
console.log('course card detail toggle regression: PASS');

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

// 课程任务明细以成员画像为计数口径：全局待办只提供可命名的未完成任务，剩余差额必须明确标为待确认。
const taskDetailsStart = SCRIPT.indexOf('    function xyCourseDashboardBuildTaskDetails');
assert(taskDetailsStart >= 0, 'course task detail builder not found');
const taskDetailsEnd = SCRIPT.indexOf('    function xyCourseDashboardTaskBreakdown', taskDetailsStart);
assert(taskDetailsEnd > taskDetailsStart, 'course task detail builder boundary not found');
const taskDetailContext = { Number, Math, Date, Array };
vm.runInNewContext(
  SCRIPT.slice(SCRIPT.indexOf('    function xyOverviewNumber'), taskDetailsEnd)
    + '\nglobalThis.__buildTaskDetails = xyCourseDashboardBuildTaskDetails;',
  taskDetailContext
);
const taskDetails = taskDetailContext.__buildTaskDetails(
  { taskCount: 14, finishedCount: 13 },
  [
    { title: '可做练习', nodeId: 'open-1', endTime: '2099-01-01 00:00:00' },
    { title: '过期练习', nodeId: 'expired-1', endTime: '2020-01-01 00:00:00' }
  ],
  [{ title: '已完成测验', nodeId: 'done-1', status: { key: 'graded', label: '已批阅' } }],
  Date.parse('2026-08-21T00:00:00Z')
);
assert.equal(taskDetails.completedCount, 13);
assert.equal(taskDetails.actionable.length, 1);
assert.equal(taskDetails.expired.length, 1);
assert.equal(taskDetails.uncertainCount, 0);
const unmatchedTaskDetails = taskDetailContext.__buildTaskDetails(
  { taskCount: 14, finishedCount: 13 }, [], [], Date.parse('2026-08-21T00:00:00Z')
);
assert.equal(unmatchedTaskDetails.uncertainCount, 1);
console.log('course task detail regression: PASS');

// 任务明细在首次展开时单独加载，加载状态仅影响当前课程卡片。
const taskDetailLoaderStart = SCRIPT.indexOf('    async function xyCourseDashboardLoadTaskDetails');
const taskDetailLoaderEnd = SCRIPT.indexOf('    function xyCourseDashboardDeactivate', taskDetailLoaderStart);
assert(taskDetailLoaderStart >= 0 && taskDetailLoaderEnd > taskDetailLoaderStart, 'course task detail loader not found');
const taskDetailLoaderSource = SCRIPT.slice(taskDetailLoaderStart, taskDetailLoaderEnd);
assert.match(taskDetailLoaderSource, /course\.taskDetailsState = 'loading'/);
assert.match(taskDetailLoaderSource, /course\.taskDetailsState = 'loaded'/);
assert.match(taskDetailLoaderSource, /course\.taskDetailsState = 'error'/);
assert.match(taskDetailLoaderSource, /course\.taskDetailsState === 'loading'/);

// 卡片摘要默认收起，展开后提供状态分组、重试和作业原页跳转。
assert.match(SCRIPT, /data-course-action="details"/);
assert.match(SCRIPT, /data-course-action="retry-details"/);
assert.match(SCRIPT, /aria-expanded="\$\{course\.taskDetailsExpanded \? 'true' : 'false'\}"/);
assert.match(SCRIPT, /状态待确认/);
assert.match(SCRIPT, /data-course-task-type=/);

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
const downloadFilenameStart = SCRIPT.indexOf('    function xySanitizeDownloadFilename');
const downloadFilenameEnd = SCRIPT.indexOf('    function downloadFile(', downloadFilenameStart);
assert(downloadFilenameStart >= 0 && downloadFilenameEnd > downloadFilenameStart, 'download filename sanitizer not found');
const downloadFilenameContext = {};
vm.runInNewContext(
  SCRIPT.slice(downloadFilenameStart, downloadFilenameEnd) + '\nglobalThis.__sanitizeDownloadFilename = xySanitizeDownloadFilename;',
  downloadFilenameContext
);
assert.equal(downloadFilenameContext.__sanitizeDownloadFilename('..\\private\\report?.pdf'), 'report_.pdf');
assert.equal(downloadFilenameContext.__sanitizeDownloadFilename('../../'), '下载文件');
console.log('download filename sanitizer: PASS');

const downloadFileStart = SCRIPT.indexOf('    function downloadFile(');
const downloadFileEnd = SCRIPT.indexOf('    function formatDownloadBytes', downloadFileStart);
assert(downloadFileStart >= 0 && downloadFileEnd > downloadFileStart, 'downloadFile function not found');
const downloadFileSource = SCRIPT.slice(downloadFilenameStart, downloadFileEnd).trim();
let fetchImpl;
const clicks = [];
const appended = [];
const revoked = [];
const progressEvents = [];
const fetchCalls = [];
let downloadToken = 'test-token';
const context = {
  Blob,
  DOMException,
  console,
  setTimeout() { return 1; },
  getCookie() { return downloadToken; },
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
const downloadFile = vm.runInNewContext(`${downloadFileSource}\ndownloadFile;`, context);

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

// 登录凭证缺失时不应发出带 Bearer null 的下载请求。
const fetchCountBeforeMissingToken = fetchCalls.length;
downloadToken = '';
await assert.rejects(
  downloadFile('https://cdn.example/blocked.zip', 'blocked.zip', new AbortController().signal),
  /登录凭证已失效/
);
assert.equal(fetchCalls.length, fetchCountBeforeMissingToken);
downloadToken = 'test-token';
console.log('download credential guard: PASS');

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
