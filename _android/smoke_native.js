// 模拟 APK 原生桥：导出备份必须走 saveFile 且内容为合法 JSON
const { chromium } = require('C:/Users/q2764/.workbuddy/binaries/node/workspace/node_modules/playwright');

(async () => {
  let fail = 0;
  const bad = (m) => { console.log('FAIL:', m); fail = 1; };
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 400, height: 820 } });
  await ctx.addInitScript(() => {
    window.__native = { calls: [] };
    window.ArchiveNative = {
      saveFile: (name, mime, content) => {
        window.__native.calls.push({ name, mime, len: content.length });
        window.__native.last = content;
        return true;
      }
    };
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => bad('pageerror: ' + e.message));

  // 先造一点数据
  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html');
  await page.waitForTimeout(600);
  await page.click('#pl-add');
  await page.fill('#pf-name', '导出测试');
  await page.click('[data-ok]');
  await page.waitForTimeout(400);

  // SW 不应注册（APK 内）
  const swCnt = await page.evaluate(() =>
    navigator.serviceWorker.getRegistrations()
      .then(r => r.length).catch(() => -1)); // file:// 下直接抛错 = 本就不支持 SW
  if (swCnt > 0) bad('APK 内 Service Worker 不应注册: ' + swCnt); else console.log('PASS: APK 内跳过 SW');

  // 导出
  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html#/settings');
  await page.waitForTimeout(400);
  await page.click('#st-export');
  await page.waitForTimeout(800);
  const res = await page.evaluate(() => window.__native.calls);
  if (!res || !res.length) return bad('saveFile 未被调用');
  const c = res[0];
  if (!/\.json$/.test(c.name)) bad('文件名不对: ' + c.name);
  if (c.mime !== 'application/json') bad('mime 不对: ' + c.mime);
  const json = JSON.parse(await page.evaluate(() => window.__native.last));
  if (json.app !== 'family-archive') bad('备份标识缺失');
  if (!Array.isArray(json.persons) || !json.persons.length) bad('备份缺少人员');
  if (!Array.isArray(json.entries)) bad('备份缺少条目');
  console.log('PASS: 导出走原生桥, 文件=' + c.name + ', 大小=' + c.len + '字符, 人员=' + json.persons.length);

  await browser.close();
  console.log(fail ? 'NATIVE TEST FAILED' : 'NATIVE TEST PASS');
  process.exit(fail);
})().catch(e => { console.log('EXCEPTION:', e.message); process.exit(1); });
