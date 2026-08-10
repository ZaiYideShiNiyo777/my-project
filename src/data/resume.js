// ============================================================
// 简历数据(集中管理,修改内容只需改这里)
// ============================================================

export const profile = {
  name: '张三',
  nameEn: 'San Zhang',
  title: '全栈开发工程师',
  location: '北京, 中国',
  email: 'san.zhang@example.com',
  avatarChar: '张',
  bio: '热爱技术和创造，拥有 5 年全栈开发经验。擅长 React、Node.js 等技术栈，对 3D 可视化、性能优化有深入研究。致力于用技术解决实际问题，创造有价值的产品。',
};

export const heroTags = [
  { label: 'React', color: '#61dafb' },
  { label: 'TypeScript', color: '#3178c6' },
  { label: 'Three.js', color: '#049ef4' },
  { label: 'Node.js', color: '#339933' },
  { label: 'UI/UX', color: '#f472b6' },
  { label: 'WebGL', color: '#e34f26' },
];

export const stats = [
  { value: '5+', label: '年开发经验' },
  { value: '30+', label: '完成项目' },
  { value: '99%', label: '客户好评' },
];

export const coreTechs = [
  { label: 'Blender', color: 'rgba(245, 121, 59, 0.314)' },
  { label: 'Maya', color: 'rgba(6, 150, 187, 0.314)' },
  { label: 'Unity', color: 'rgba(34, 44, 55, 0.314)' },
  { label: 'ZBrush', color: 'rgba(230, 162, 28, 0.314)' },
  { label: 'Substance', color: 'rgba(229, 91, 62, 0.314)' },
  { label: 'WebGL', color: 'rgba(227, 79, 38, 0.314)' },
];

export const projectAreas = [
  { label: '3D 可视化', color: '#3b82f6' },
  { label: '角色建模', color: '#8b5cf6' },
  { label: '场景设计', color: '#ec4899' },
  { label: '协作白板', color: '#14b8a6' },
];

export const skillGroups = [
  {
    title: '建模与渲染',
    color: '#3b82f6',
    skills: [
      { name: 'Blender', pct: 90 },
      { name: 'Maya', pct: 85 },
      { name: 'ZBrush', pct: 80 },
      { name: 'Substance Painter', pct: 88 },
      { name: 'Three.js', pct: 82 },
      { name: 'WebGL', pct: 78 },
    ],
  },
  {
    title: 'Unity 开发',
    color: '#10b981',
    skills: [
      { name: 'Unity', pct: 92 },
      { name: 'C#', pct: 88 },
      { name: 'Shader Graph', pct: 80 },
      { name: 'URP/HDRP', pct: 85 },
      { name: 'Animator', pct: 82 },
      { name: 'Particle System', pct: 78 },
    ],
  },
];

// 生成数字孪生风格占位图(SVG data URI,离线可用,发布时替换为真实作品图链接即可)
function makeShot(title, color, variant = 0) {
  const scanY = 130 + variant * 90;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg${variant}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="55%" stop-color="#0b0b10" stop-opacity="1"/>
    </linearGradient>
    <radialGradient id="glow${variant}" cx="50%" cy="44%" r="56%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="#0b0b10"/>
  <rect width="800" height="450" fill="url(#bg${variant})"/>
  <rect width="800" height="450" fill="url(#glow${variant})"/>
  <g stroke="${color}" stroke-opacity="0.22" stroke-width="1">
    ${Array.from({ length: 11 }, (_, i) => {
      const y = 330 + i * 24;
      const k = (i + 1) / 11;
      const w = 800 * (0.2 + 0.8 * k);
      const x = (800 - w) / 2;
      return `<line x1="${x.toFixed(1)}" y1="${y}" x2="${(800 - x).toFixed(1)}" y2="${y}"/>`;
    }).join('')}
    ${Array.from({ length: 9 }, (_, i) => {
      const x = (i / 8) * 800;
      return `<line x1="${x.toFixed(1)}" y1="328" x2="${(400 + (x - 400) * 2.4).toFixed(1)}" y2="450"/>`;
    }).join('')}
  </g>
  <line x1="0" y1="${scanY}" x2="800" y2="${scanY}" stroke="${color}" stroke-opacity="0.45" stroke-width="1.5"/>
  <circle cx="400" cy="248" r="54" fill="none" stroke="${color}" stroke-width="2" opacity="0.75"/>
  <circle cx="400" cy="248" r="27" fill="${color}" opacity="0.22"/>
  <circle cx="400" cy="248" r="8" fill="${color}" opacity="0.9"/>
  <line x1="400" y1="248" x2="348" y2="196" stroke="${color}" stroke-opacity="0.4" stroke-width="1.5"/>
  <line x1="400" y1="248" x2="452" y2="300" stroke="${color}" stroke-opacity="0.4" stroke-width="1.5"/>
  <text x="40" y="62" fill="#ffffff" font-size="25" font-family="Inter, system-ui, sans-serif" font-weight="600" opacity="0.92">${title}</text>
  <text x="40" y="88" fill="${color}" font-size="13" font-family="Inter, system-ui, sans-serif" letter-spacing="4" opacity="0.75">DIGITAL PROJECT · ${String(variant + 1).padStart(2, '0')}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const projects = [
  {
    title: '3D 可视化仪表盘',
    desc: '基于 Three.js 构建的实时数据可视化平台，支持 3D 图表、动态数据流和交互操作。',
    icon: '电',
    color: '#8b5cf6',
    imageCount: 3,
    media: [
      { type: 'image', src: makeShot('3D 可视化仪表盘', '#8b5cf6', 0) },
      { type: 'image', src: makeShot('3D 可视化仪表盘', '#8b5cf6', 1) },
      { type: 'image', src: makeShot('3D 可视化仪表盘', '#8b5cf6', 2) },
    ],
  },
  {
    title: '电商平台重构',
    desc: '全栈电商平台从 Vue 2 迁移到 React 18 + TypeScript，性能提升 60%。',
    icon: 'A',
    color: '#ec4899',
    imageCount: 3,
    videoCount: 1,
    media: [
      { type: 'image', src: makeShot('电商平台重构', '#ec4899', 0) },
      { type: 'image', src: makeShot('电商平台重构', '#ec4899', 1) },
      {
        type: 'video',
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        poster: makeShot('电商平台重构', '#ec4899', 2),
      },
    ],
  },
  {
    title: 'AI 智能客服系统',
    desc: '基于 NLP 的智能客服机器人，支持多轮对话、意图识别和知识库管理。',
    icon: '实',
    color: '#14b8a6',
    imageCount: 3,
    media: [
      { type: 'image', src: makeShot('AI 智能客服系统', '#14b8a6', 0) },
      { type: 'image', src: makeShot('AI 智能客服系统', '#14b8a6', 1) },
      { type: 'image', src: makeShot('AI 智能客服系统', '#14b8a6', 2) },
    ],
  },
  {
    title: '实时协作白板',
    desc: '支持多人实时协作的在线白板工具，包含画笔、图形、便签等丰富功能。',
    icon: '协',
    color: '#f59e0b',
    imageCount: 4,
    media: [
      { type: 'image', src: makeShot('实时协作白板', '#f59e0b', 0) },
      { type: 'image', src: makeShot('实时协作白板', '#f59e0b', 1) },
      { type: 'image', src: makeShot('实时协作白板', '#f59e0b', 2) },
      { type: 'image', src: makeShot('实时协作白板', '#f59e0b', 3) },
    ],
  },
];

export const experiences = [
  {
    period: '2023.06 - 至今',
    title: '高级前端开发工程师',
    company: '科技有限公司',
    desc: '负责核心产品前端架构设计，主导 3D 可视化平台开发，带领 5 人团队交付多个重点项目。',
  },
  {
    period: '2021.03 - 2023.05',
    title: '全栈开发工程师',
    company: '互联网有限公司',
    desc: '参与电商平台全栈开发，完成系统架构升级，优化首屏加载性能。',
  },
  {
    period: '2019.07 - 2021.02',
    title: '前端开发工程师',
    company: '数字科技工作室',
    desc: '负责多个客户项目的 Web 端开发，使用 React 和 Vue 构建响应式应用。',
  },
];

export const navLinks = [
  { label: '首页', id: 'home' },
  { label: '关于', id: 'about' },
  { label: '作品', id: 'projects' },
  { label: '技能', id: 'skills' },
  { label: '经历', id: 'experience' },
];

export const socials = [
  { title: 'Github', path: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' },
  { title: 'Linkedin', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { title: 'Twitter', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
];

// 页面静态文案(区块标题/按钮/页脚等可见文字,后台"其他数据"Tab 可在线编辑)
export const uiTexts = {
  navLogo: 'Portfolio',
  heroCtaPrimary: '查看作品',
  heroCtaSecondary: '了解更多',
  aboutTitle: '关于',
  aboutTitleAccent: '我',
  aboutSubtitle: '了解我的背景和经历',
  aboutCoreLabel: '核心技术栈',
  aboutAreaLabel: '项目经验',
  projectsTitle: '我的作品',
  projectsSubtitle: '精选项目展示 · 点击卡片查看详情',
  skillsTitle: '技术栈',
  skillsSubtitle: '我的技术能力',
  experienceTitle: '工作经历',
  experienceSubtitle: '我的职业发展历程',
  footerCopyright: `© ${new Date().getFullYear()} Portfolio. All rights reserved.`,
  footerBackTop: '回到顶部',
  footerContact: '联系我',
};
