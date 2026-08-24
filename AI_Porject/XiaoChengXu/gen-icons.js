// 临时脚本：将线条风格 SVG 图标编码为 base64，生成 utils/icons.js
// 参考 Meela 金融 UI 风格：圆角线条图标（stroke-based，round cap/join）
const fs = require('fs')
const path = require('path')

// 图标定义：名称 -> { svg 路径内容, stroke 颜色 }
// viewBox 0 0 24 24，stroke-width 1.8，fill none
function svg(paths, color, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra}>${paths}</svg>`
}

const defs = {
  // ---------------- tabBar（灰/蓝双态） ----------------
  'tab-diet': (c) => svg(
    '<circle cx="10.5" cy="13" r="6"/><path d="M10.5 9.8v6.4"/><path d="M8 12.2h5"/><path d="M16.5 4.5v6"/><path d="M19.5 4.5v6"/><path d="M16.5 13h3"/>', c),
  'tab-shop': (c) => svg(
    '<path d="M5.8 8.5h12.4l-1 10a2 2 0 0 1-2 1.7H8.8a2 2 0 0 1-2-1.7l-1-10z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>', c),
  'tab-memo': (c) => svg(
    '<path d="M6.5 3.5h7.5l3.5 3.5V20.5h-11z"/><path d="M14 3.5V7h3.5"/><path d="M9 12.5h6"/><path d="M9 16h6"/>', c),
  'tab-price': (c) => svg(
    '<path d="M20.3 13.3 13.3 20.3a1.8 1.8 0 0 1-2.6 0L3.5 13.2V3.5h9.7l7.1 7.1a1.8 1.8 0 0 1 0 2.7z"/><circle cx="7.8" cy="7.8" r="1.4"/>', c),
  'tab-mine': (c) => svg(
    '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.4-3.4 4.3-5 7.5-5s6.1 1.6 7.5 5"/>', c),

  // ---------------- 购物清单页 ----------------
  'search': (c) => svg(
    '<circle cx="11" cy="11" r="6.5"/><path d="M20.5 20.5 16 16"/>', c),
  'share': (c) => svg(
    '<circle cx="5.5" cy="12" r="2.3"/><circle cx="18.5" cy="5.5" r="2.3"/><circle cx="18.5" cy="18.5" r="2.3"/><path d="M7.6 10.9 16.4 6.6"/><path d="M7.6 13.1 16.4 17.4"/>', c),
  'trash': (c) => svg(
    '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13.5h9l1-13.5"/>', c),
  'calendar': (c) => svg(
    '<rect x="3.8" y="5.2" width="16.4" height="15" rx="2.5"/><path d="M3.8 10h16.4"/><path d="M8 3v4M16 3v4"/>', c),
  'plus': (c) => svg(
    '<path d="M12 5v14"/><path d="M5 12h14"/>', c),
  'clock': (c) => svg(
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', c),
  'check': (c) => svg(
    '<path d="M4.5 12.5l5 5 10-11"/>', c),
  'check-circle': (c) => svg(
    '<circle cx="12" cy="12" r="8.5"/><path d="M8 12.5l2.8 2.8L16.5 9"/>', c),
  'user': (c) => svg(
    '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5"/>', c),
  'users': (c) => svg(
    '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4"/><path d="M15.5 6.2a3.2 3.2 0 0 1 0 5.6"/><path d="M17.5 15.4c1.6.7 2.7 1.9 3 3.6"/>', c),
  'pin': (c) => svg(
    '<path d="M12 3.5 8 7.5l-1 4-2 2 5.5 5.5 2-2 4-1 4-4z"/><path d="M9.5 14.5 4.5 19.5"/>', c),
  'x': (c) => svg(
    '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>', c),
  'tag': (c) => svg(
    '<path d="M20.3 13.3 13.3 20.3a1.8 1.8 0 0 1-2.6 0L3.5 13.2V3.5h9.7l7.1 7.1a1.8 1.8 0 0 1 0 2.7z"/><circle cx="7.8" cy="7.8" r="1.4"/>', c),
  'attach': (c) => svg(
    '<path d="M9.8 14.2 15.8 8.2a2.6 2.6 0 0 1 3.7 3.7l-7.3 7.3a4.6 4.6 0 0 1-6.5-6.5l6.8-6.8"/>', c),
  'bulb': (c) => svg(
    '<path d="M9.2 18.2h5.6"/><path d="M10.3 21h3.4"/><path d="M12 3a6 6 0 0 1 3.5 10.9c-.9.6-1.5 1.3-1.5 2.3h-4c0-1-.6-1.7-1.5-2.3A6 6 0 0 1 12 3z"/>', c),
  'bell': (c) => svg(
    '<path d="M6.2 9.5a5.8 5.8 0 0 1 11.6 0c0 4.6 1.7 5.9 1.7 5.9H4.5s1.7-1.3 1.7-5.9"/><path d="M10.2 19.5a1.9 1.9 0 0 0 3.6 0"/>', c),
  'family': (c) => svg(
    '<circle cx="8.5" cy="8.2" r="3"/><circle cx="16.3" cy="9.6" r="2.4"/><path d="M3 19.6c.8-3 2.9-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><path d="M14.3 15.4c1.6.5 2.8 1.8 3.4 4.2"/>', c),
  'pet': (c) => svg(
    '<path d="M12 14.1c-2.3 0-3.6-1.7-3.6-3.6s1.3-3.6 3.6-3.6 3.6 1.7 3.6 3.6-1.3 3.6-3.6 3.6z"/><circle cx="5.8" cy="8.6" r="1.6"/><circle cx="9.6" cy="5.4" r="1.6"/><circle cx="14.4" cy="5.4" r="1.6"/><circle cx="18.2" cy="8.6" r="1.6"/>', c),
  'coin': (c) => svg(
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2v9.6"/><path d="M15 9.6c-.7-1-1.8-1.6-3-1.6-1.6 0-3 .9-3 2.5 0 3.2 6 1.5 6 4.7 0 1.6-1.4 2.5-3 2.5-1.2 0-2.3-.6-3-1.6"/>', c),
  'chevron-up': (c) => svg('<path d="M5.5 14.5 12 8l6.5 6.5"/>', c),
  'chevron-down': (c) => svg('<path d="M5.5 9.5 12 16l6.5-6.5"/>', c),
  'sun': (c) => svg(
    '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>', c),
  'moon': (c) => svg(
    '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z"/>', c),
  'pill': (c) => svg(
    '<path d="M8.6 4.6l10.8 10.8a3.5 3.5 0 0 1-5 5L3.6 9.6a3.5 3.5 0 0 1 5-5z"/><path d="M7.2 8.2l8.6 8.6"/>', c),
  'bowl': (c) => svg(
    '<path d="M4.5 11h15a7.5 7.5 0 0 1-15 0z"/><path d="M8 18.5h8"/><path d="M9.8 8c.4-1.2 1.6-2 1.6-3.2"/>', c),
  'egg': (c) => svg(
    '<path d="M12 4.5C8 4.5 6 7.5 6 11c0 4 2.5 7 6 7s6-3 6-7c0-3.5-2-6.5-6-6.5z"/>', c),
  'leaf': (c) => svg(
    '<path d="M5 19C5 9 11 4.5 19.5 4.5 19.5 13 14 19 5 19z"/><path d="M5 19c3-6 6-9.5 10-12"/>', c),
  'apple': (c) => svg(
    '<path d="M12 8.5c-3.6 0-6 2.3-6 5.4S8.6 19 12 19s6-2 6-5.1-2.4-5.4-6-5.4z"/><path d="M12 8.5c-.5-2-2-3-4-3 0 1.8.8 2.8 2.5 3.2"/><path d="M12 8.5c.5-2 2-3 4-3 0 1.8-.8 2.8-2.5 3.2"/>', c),
  'snack': (c) => svg(
    '<path d="M7 10.5h10l-.8 7a2 2 0 0 1-2 1.8H9.8a2 2 0 0 1-2-1.8z"/><path d="M8.8 10.5c-.6-1.6.5-3.2 2.1-3.2s2.7 1.5 2.1 3.1"/><path d="M13 10.5c-.6-1.6.5-3.2 2.1-3.2s2.7 1.5 2.1 3.1"/>', c),
  'pot': (c) => svg(
    '<path d="M5 8.5h14"/><path d="M7 8.5l1 10.5h8l1-10.5"/><path d="M12 5.5V7"/><path d="M9.5 5v1.2M14.5 5v1.2"/>', c),

  // ---------------- 饮食计划页 ----------------
  'meal-plate': (c) => svg(
    '<circle cx="10.5" cy="13" r="6"/><path d="M10.5 9.8v6.4"/><path d="M8 12.2h5"/><path d="M16.5 4.5v6"/><path d="M19.5 4.5v6"/><path d="M16.5 13h3"/>', c),
  'flame': (c) => svg(
    '<path d="M12 21.5c-3.5 0-6-2.4-6-5.8 0-2.9 1.9-4.4 3-6.3.5-1 .9-2.4.5-4.2 2.9 1 4.9 3.4 5.4 5.9.6-.9 1.6-1.4 2.1-.9 1.6 1.5 3 3.4 3 5.5 0 3.4-2.5 5.8-8 5.8z"/><path d="M12 21.5c-1.9 0-3-1.5-3-3 0-1.5.9-2.2 1.6-3.2.5-.6.9-1.3 1.4-1.9.5.6.9 1.3 1.4 1.9.7 1 1.6 1.7 1.6 3.2 0 1.5-1.1 3-3 3z"/>', c),
  'pencil': (c) => svg(
    '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', c),
  'arrow-right': (c) => svg('<path d="M9 5l7 7-7 7"/>', c),
  'chevron-left': (c) => svg('<path d="M14.5 5.5 8 12l6.5 6.5"/>', c),
  'chevron-right': (c) => svg('<path d="M9.5 5.5 16 12l-6.5 6.5"/>', c)
}

// 颜色（base64 编码后无需 URL 转义，直接用 #）
const COLORS = {
  tabGray: '#9aa0a6',
  tabBlue: '#1E5EFF',
  blue: '#1E5EFF',
  blueDark: '#1748CC',
  gray: '#8a919f',
  lightGray: '#b6bcc6',
  white: '#ffffff',
  orange: '#ff6b35',
  red: '#e64340'
}

const lines = []
lines.push('// 线条风格 SVG 图标库（base64 data URI）')
lines.push('// 参考「Meela 金融 UI」风格：圆角线条图标，简单明了通俗易懂；')
lines.push('// 页面内以 <image src="{{icon.xxx}}"> 或 wxss background-image 使用，与 emoji 混排统一为线条风')
lines.push('// 生成脚本见仓库根 gen-icons.js（可重新生成）')
lines.push('')

// 编码辅助（生成时使用）
function encode(svgStr) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svgStr).toString('base64')
}

const named = {}
Object.keys(defs).forEach((key) => {
  const gen = defs[key]
  Object.keys(COLORS).forEach((cname) => {
    const colorKey = `${key}-${cname}`
    named[colorKey] = encode(gen(COLORS[cname]))
  })
})

lines.push('module.exports = {')
Object.keys(named).forEach((k) => {
  lines.push(`  '${k}': '${named[k]}',`)
})
lines.push('}')

const outPath = path.join(__dirname, 'miniprogram', 'utils', 'icons.js')
fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('generated:', outPath)
console.log('total icons:', Object.keys(named).length)
