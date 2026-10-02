// 静态自检：资源引用完整性 + 关键函数 + manifest/sw 一致性
const fs = require('fs');
const p = 'D:/Before_file/WorkBuddy_File/家庭档案-app/v1.0/app/';
let fail = 0;
const bad = (m) => { console.log('FAIL:', m); fail = 1; };

const html = fs.readFileSync(p + 'index.html', 'utf8');
const js = fs.readFileSync(p + 'app.js', 'utf8');

for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const f = m[1];
  if (f.startsWith('http')) continue;
  if (!fs.existsSync(p + f)) bad('index.html missing asset: ' + f);
}
const mf = JSON.parse(fs.readFileSync(p + 'manifest.json', 'utf8'));
for (const ic of mf.icons) if (!fs.existsSync(p + ic.src)) bad('manifest missing icon: ' + ic.src);

const sw = fs.readFileSync(p + 'sw.js', 'utf8');
for (const m of sw.matchAll(/'\.\/([a-z\-.\/]+)'/g)) {
  const f = m[1];
  if (f === '') continue;
  if (!fs.existsSync(p + f)) bad('sw missing: ' + f);
}
for (const fn of ['renderPersonListReal', 'renderPersonPage', 'renderEntryEditor',
  'renderSearchPage', 'renderBin', 'renderSettings', 'exportBackup', 'restoreItem',
  'killItem', 'scheduleSave', 'closeTopOverlay', 'dirMenu', 'personMenu', 'autoClean']) {
  if (!js.includes('function ' + fn)) bad('missing fn: ' + fn);
}
// 默认目录 9 项两层结构
const defs = js.match(/const DEFAULT_DIRS=\[([\s\S]*?)\];/);
if (!defs) bad('DEFAULT_DIRS not found');
else {
  const tops = (defs[1].match(/\{name:/g) || []).length;
  if (tops !== 9) bad('DEFAULT_DIRS top count = ' + tops + ' (expect 9)');
  if (!defs[1].includes("'小学','初中','高中','大学/中专/大专'")) bad('edu subdirs missing');
}
// 头像功能必须为零
if (/avatar|头像|photo|uploadImg/i.test(js)) bad('avatar-related code found');
console.log(fail ? 'STATIC CHECKS FAILED' : 'STATIC CHECKS OK');
process.exit(fail);
