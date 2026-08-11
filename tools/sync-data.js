// ============================================================
// 同步后台导出的数据到源码默认数据文件
// 用法:
//   node tools/sync-data.js <导出的JSON文件> [输出文件]
// 说明:
//   - 后台「导出数据」下载的 portfolio-data-*.json 包含全部 11 个数据键
//   - 本脚本将其整体写入 src/data/resume.js,作为新的默认数据
//   - 下次构建/部署后,所有访客都能看到这些内容
// ============================================================
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('用法: node tools/sync-data.js <导出的JSON文件>');
  process.exit(1);
}
const output = process.argv[3] || path.join(__dirname, '..', 'src', 'data', 'resume.js');

if (!fs.existsSync(input)) {
  console.error('找不到文件: ' + input);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(input, 'utf8'));
} catch (e) {
  console.error('JSON 解析失败,请确认是「导出数据」下载的文件: ' + e.message);
  process.exit(1);
}

const KEYS = [
  'profile', 'heroTags', 'stats', 'coreTechs', 'projectAreas',
  'skillGroups', 'projects', 'experiences', 'navLinks', 'socials', 'uiTexts',
];
const missing = KEYS.filter((k) => !(k in data));
if (missing.length) {
  console.error('JSON 缺少数据键,不是有效的导出文件: ' + missing.join(', '));
  process.exit(1);
}

const header = `// ============================================================
// 简历数据(由 tools/sync-data.js 从后台导出的 JSON 自动生成)
// 如需改内容:请在后台「管理」中修改 → 导出数据 → 重新运行同步脚本
// 手动修改本文件会被下次同步覆盖
// ============================================================

`;

const body = KEYS.map((k) => `export const ${k} = ${JSON.stringify(data[k], null, 2)};`).join('\n\n');

fs.writeFileSync(output, header + body + '\n', 'utf8');
console.log('OK: 已写入 ' + output);
console.log('下一步: 运行 deploy.ps1 构建并部署上线');
