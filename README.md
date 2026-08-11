# 个人作品集 Portfolio

个人简历作品集网页,暗色科技风,数字孪生视觉主题(蓝青数据网络、三维空间网格、坐标扫描)。

## 功能特性

- **全局动态背景**:粒子连线网络、透视网格、扫描线、坐标扫描平面、三维线框参考框,后台打开时动画自动暂停,移动端自动降低粒子数量
- **作品轮播**:左右无限循环滑动,hover 动效,点击卡片打开详情弹窗
- **后台管理**:导航栏「管理」按钮 → 口令验证 → 五个 Tab(基本信息/技能/项目作品/工作经历/其他数据)增删改查,修改即时生效并持久化到浏览器 localStorage(口令常量见 `src/data/resumeStore.js` 的 `ADMIN_PASS`,修改后需重新构建)

## 技术栈

- React 17 + Webpack 4
- Tailwind CSS 1.x + PostCSS
- Three.js / @react-three/fiber / drei(3D 背景)
- 字体:Inter(Google Fonts)

## 目录结构

```
portfolio/
├── src/                        # 源码
│   ├── main.jsx                # 入口文件(hash 路由:验证层 / 管理面板)
│   ├── index.css               # 全局样式(Tailwind + 自定义)
│   ├── data/
│   │   ├── resume.js           # 简历数据(默认内容,后台可改并存入 localStorage)
│   │   └── resumeStore.js      # 数据读写 / 重置 / 管理口令常量
│   ├── hooks/
│   │   └── useScrollReveal.js  # 滚动渐入动画 Hook
│   └── components/
│       ├── Navbar.jsx          # 顶部导航(毛玻璃 + 阅读进度条 + 管理按钮)
│       ├── Hero.jsx            # 首屏(技术标语 + 社交图标)
│       ├── About.jsx           # 关于区(头像 + 数据指标 + 标签)
│       ├── Projects.jsx        # 作品轮播
│       ├── ProjectModal.jsx    # 项目详情弹窗
│       ├── Skills.jsx          # 技能进度条
│       ├── Experience.jsx      # 工作经历时间线
│       ├── Footer.jsx          # 页脚
│       ├── GlobalBackground.jsx# 全局固定动态背景(数字孪生科技风)
│       ├── AuthGate.jsx        # 管理口令验证层
│       └── AdminPanel.jsx      # 后台管理面板
├── dist/                       # 构建产物(部署用)
├── assets/                      # 静态素材(视频/图片,deploy 自动复制到 dist/assets)
├── index.html                  # 页面模板
├── webpack.config.js           # 构建配置(dev 端口 3001)
├── tailwind.config.js          # 主题配置(primary/accent 颜色)
└── 打开我的作品集.bat          # 一键启动脚本
```

## 更新与上线指南

**完整可独立执行的更新/上线操作指南见 [UPDATE_GUIDE.md](./UPDATE_GUIDE.md)**,覆盖:

- 路径 A:后台改数据 → 「导出数据」→ `sync-data.ps1` 同步源码 → 部署
- 路径 B:改源码/素材 → `npm run build` → `deploy.ps1` 部署
- 验证方法(bundle hash / Pages 构建状态 / 无痕窗口)
- 素材上传(后台直接上传本地文件 / 图床 / 仓库)与标准操作清单

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式(dev 端口 3001)
npm start

# 生产构建(输出到 dist/)
npm run build

# 本地预览构建产物(端口 3000)
python -m http.server 3000
```

浏览器访问 `http://localhost:3000`,导航栏点「管理」输入口令即可进入后台编辑。

## 部署上线(GitHub Pages)

在线地址:**https://zaiyideshiniyo777.github.io/my-project/**

部署采用 **gh-pages 分支**方案:构建产物 `dist/` 同步到 `gh-pages` 分支根目录,由 GitHub Pages 托管(仓库已公开)。

### 一键部署(推荐)

```powershell
# 构建 + 提交 dist 到 main + 同步 gh-pages 并推送
powershell -ExecutionPolicy Bypass -File deploy.ps1

# 直连不通时走代理
powershell -ExecutionPolicy Bypass -File deploy.ps1 -UseProxy
```

执行后等待 1~3 分钟 Pages 构建刷新,线上即生效。

## 后台数据同步到 Git(重要)

后台管理的所有修改只保存在**当前浏览器的 localStorage**,不会自动进 Git,访客看到的是 `src/data/resume.js` 中的默认数据。要让新内容对所有访客生效,需按以下闭环操作:

1. **后台导出**:进入后台 → 顶部点「导出数据」,下载 `portfolio-data-日期.json`
2. **更新源码**:将 JSON 中对应字段(如 `projects`)合并到 `src/data/resume.js`
3. **重新部署**:运行 `deploy.ps1`,1~3 分钟后线上生效

> 后台作品媒体支持**直接上传本地文件**:点「地址 src」旁的「上传文件」按钮,图片(≤2MB)与视频(≤3MB)自动转为内嵌格式并显示预览(硬上限:图片 10MB、视频 100MB);更大的文件**不会转内嵌**(避免撑爆 localStorage 与构建链路),请把文件放到项目 `assets/` 目录后填相对路径,或先传图床再填 URL,详见 [UPDATE_GUIDE.md](./UPDATE_GUIDE.md) 第 6 节。
