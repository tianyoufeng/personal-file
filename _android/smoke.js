// 真实浏览器冒烟测试：核心流程 人员→档案→条目→搜索→回收站→恢复
const { chromium } = require('C:/Users/q2764/.workbuddy/binaries/node/workspace/node_modules/playwright');

(async () => {
  let fail = 0;
  const bad = (m) => { console.log('FAIL:', m); fail = 1; };
  const ok = (m) => console.log('PASS:', m);

  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 400, height: 820 } });
  page.on('pageerror', e => bad('pageerror: ' + e.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('console.error:', msg.text()); });

  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html');
  await page.waitForTimeout(600);

  // 1) 列表页渲染
  if (!(await page.$('#pl-add'))) return bad('列表页未渲染');
  ok('列表页渲染');

  // 2) 新增人员
  await page.click('#pl-add');
  await page.fill('#pf-name', '王小明');
  await page.fill('#pf-rel', '自己');
  await page.click('[data-ok]');
  await page.waitForTimeout(500);
  if (!(await page.locator('.person-card').count())) return bad('人员卡片未出现');
  ok('新增人员 + 默认目录');

  // 3) 进入档案，检查默认目录树
  await page.click('.person-card');
  await page.waitForTimeout(400);
  const tCount = await page.locator('.titem').count();
  if (tCount < 9) return bad('默认目录不足 9 个: ' + tCount);
  const subCnt = await page.locator('.tsub').count();
  if (subCnt !== 4) return bad('教育经历子目录数: ' + subCnt);
  ok('档案页 + 9 个默认目录 + 4 个子目录');

  // 4) 新建条目
  await page.click('[data-newentry]');
  await page.waitForTimeout(500);
  if (!(await page.$('#ef-title'))) return bad('编辑页未打开');
  await page.fill('#ef-title', '小学入学登记');
  await page.fill('#ef-content', '1995 年 9 月入读市实验小学，学籍号 9501。');
  await page.fill('#ef-loc', '市实验小学');
  await page.waitForTimeout(1000); // 自动保存
  const st = await page.locator('#save-status').innerText();
  if (!st.includes('已自动保存')) bad('自动保存状态未显示: ' + st); else ok('自动保存生效');
  await page.click('[data-back-entry]');
  await page.waitForTimeout(400);
  if (!(await page.locator('.entry-card').count())) return bad('条目卡片未出现');
  ok('条目创建 + 列表显示');

  // 5) 新建子目录
  await page.click('[data-adddir]');
  await page.fill('#ad-name', '兴趣爱好');
  await page.click('[data-ok]');
  await page.waitForTimeout(400);
  if (!(await page.locator('.titem', { hasText: '兴趣爱好' }).count())) bad('新建目录未出现'); else ok('新建目录');

  // 6) 全局搜索
  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html#/search');
  await page.waitForTimeout(400);
  await page.fill('#sp-search', '学籍');
  await page.waitForTimeout(400);
  const rCnt = await page.locator('.r-item').count();
  if (rCnt < 1) return bad('搜索无结果');
  const markCnt = await page.locator('mark').count();
  if (markCnt < 1) bad('关键词未高亮');
  else ok('搜索命中 + 高亮 (' + rCnt + ' 条)');

  // 7) 删除条目 → 回收站 → 恢复
  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html#/list');
  await page.waitForTimeout(300);
  await page.click('.person-card');
  await page.waitForTimeout(400);
  // 当前目录可能不是教育经历/小学，先切到有条目的目录
  const hasEntry = await page.locator('.entry-card').count();
  if (!hasEntry) {
    const tabs = page.locator('.titem');
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(250);
      if (await page.locator('.entry-card').count()) break;
    }
  }
  await page.click('.entry-card');
  await page.waitForTimeout(400);
  await page.click('[data-deentry]');
  await page.waitForTimeout(300);
  await page.click('[data-a="1"]');
  await page.waitForTimeout(400);
  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html#/bin');
  await page.waitForTimeout(400);
  if (!(await page.locator('.bin-item').count())) return bad('回收站为空');
  ok('软删除 + 回收站');
  await page.click('[data-restore]');
  await page.waitForTimeout(400);
  if (await page.locator('.bin-item').count()) bad('恢复失败');
  else ok('恢复到原位置');

  // 8) 导出备份（浏览器路径）
  await page.goto('file:///D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/index.html#/settings');
  await page.waitForTimeout(400);
  const hasExport = await page.$('#st-export');
  if (!hasExport) return bad('设置页缺导出按钮');
  ok('设置页渲染');

  await browser.close();
  console.log(fail ? 'SMOKE TEST FAILED' : 'SMOKE TEST ALL PASS');
  process.exit(fail);
})().catch(e => { console.log('EXCEPTION:', e.message); process.exit(1); });
