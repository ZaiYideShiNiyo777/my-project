# 作品集更新与上线操作指南

> 本文档覆盖两条更新路径 + 通用验证,按步骤执行即可独立完成一次更新上线。
> 项目根目录:`D:\AI\AI_Porject\Resume\portfolio`
> 公网地址:**https://zaiyideshiniyo777.github.io/my-project/**

---

## 0. 三个必须知道的文件

| 文件 | 作用 | 是否可手改 |
|---|---|---|
| `src/data/resume.js` | 简历默认数据(全部 11 个数据块) | 可改,但会被同步脚本覆盖 |
| `src/data/resumeStore.js` | 数据存储层 + 管理口令(`ADMIN_PASS`) | 可改口令,改后需重新构建 |
| `dist/` | 构建产物(部署的就是它) | **永远不要手改**,会被 `npm run build` 覆盖 |

**核心原理**:后台「管理」改的数据只存在你**当前浏览器的 localStorage**,访客看不到。要让所有访客看到新内容,必须走一遍:**导出数据(JSON 或 ZIP)→ 同步进 resume.js → 构建 → 部署**。ZIP 仅在后台上传过大文件素材时才会生成,内含素材文件,同步脚本会自动解压到项目 `assets/`。

---

## 路径 A:仅更新内容(后台改数据)

### Step 1 · 在后台修改数据

1. 浏览器打开公网地址 → 导航栏点「管理」→ 输入口令进入后台
2. 在五个 Tab 中修改作品 / 技能 / 个人信息等(修改**自动保存**,无需点「完成」);作品媒体文件可直接上传本地图片/视频,系统自动处理,见第 6 节方案一
3. 点右上角「**导出数据**」→ 浏览器下载 `portfolio-data-日期.json`;**若上传过大文件素材则下载 `portfolio-data-日期.zip`**

### Step 2 · 同步到源码

1. 把下载的 `portfolio-data-日期.json`(或 **`.zip`**)复制到项目根目录(可改名为 `portfolio-data.json` / `portfolio-data.zip` 方便记忆)
2. 打开 PowerShell,执行:

```powershell
powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\sync-data.ps1 D:\AI\AI_Porject\Resume\portfolio\portfolio-data.zip
```

3. 看到 `OK: 已写入 ...\src\data\resume.js` 即成功;**zip 包会自动解压:素材复制到项目 `assets/`(随部署上传 GitHub),数据写入 resume.js**

> 同步脚本做的事:校验 JSON 的 11 个数据键 → 整体重写 `src/data/resume.js`(ES module 格式)→ 不碰其他任何文件;传入 zip 时先自动解压,把 `assets/` 素材复制到项目根目录再同步。**数据落盘位置是 `src/data/resume.js`**,它在 `src/` 下属于源码,构建时被读取、不会被覆盖;而 `dist/` 每次构建都会重新生成,改在 `dist/` 里的任何内容都会丢失。

### Step 3 · 构建并部署上线

```powershell
powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\deploy.ps1
```

### Step 4 · 验证(见第 5 节)

### 路径 A 注意事项

- **占位图固化**:同步后,未替换的默认作品图(SVG data URI)会以字符串形式写进源码,文件变大几十 KB,功能不受影响
- **页脚年份固化**:`footerCopyright` 会变成固定年份字符串;如需每年自动更新,可在后台「其他数据」Tab 修改,或忽略
- **不想用脚本**的手动替代:用记事本打开导出的 JSON 与 `src/data/resume.js`,把 JSON 中每个键的值替换到同名 `export const` 后面(键名一一对应:profile / heroTags / stats / coreTechs / projectAreas / skillGroups / projects / experiences / navLinks / socials / uiTexts)

---

## 路径 B:更新源码或素材(改代码 / 加作品图片)

### Step 1 · 修改源码

- 代码、样式:修改 `src/` 下的文件(组件在 `src/components/`,数据在 `src/data/`)
- 作品图片/视频素材:见第 6 节
- 修改管理口令:编辑 `src/data/resumeStore.js` 的 `ADMIN_PASS` 常量

### Step 2 · 构建

```powershell
$env:Path = "d:\AI\tools\node16\node-v16.20.2-win-x64;$env:Path"
Set-Location D:\AI\AI_Porject\Resume\portfolio
npm run build
```

确认构建成功:
- 输出中出现 `bundle.<新hash>.js`(如 `bundle.981db019254b3391be91.js`)
- `dist/index.html` 里的 `<script src="bundle.<新hash>.js">` 与产物一致(相对路径,子路径部署安全)
- 内容一改,hash 必变;**hash 没变 = 内容没变**(可用来事后确认更新是否生效)

### Step 3 · 部署(deploy.ps1)

```powershell
powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\deploy.ps1
```

**`-UseProxy` 何时用**:直连 GitHub 报网络错误/超时时加参数(需先开启代理软件,且本地 7890 端口在监听):

```powershell
powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\deploy.ps1 -UseProxy
```

**脚本内部实际执行 4 步**:

```
1/4 npm run build                  → 生成 dist/
2/4 git add dist && commit main    → dist 产物提交到 main 分支(无变化则跳过)
3/4 同步到 gh-pages 分支            → fetch → worktree 检出 → 复制 dist/* → commit → push(触发 Pages 构建)
4/4 push main                      → 源码同步
```

**失败排查表**:

| 现象 | 原因 | 处理 |
|---|---|---|
| `BUILD FAILED` / npm 报错 | 源码语法错误 | 看报错行号,修复后重跑 |
| `FETCH FAILED` / push 超时 / `Could not resolve host` | 直连 GitHub 不通 | 开代理软件,加 `-UseProxy` 重跑 |
| `proxy ... Connection refused` | 代理软件未开启 | 启动代理软件后再跑 |
| `Everything up-to-date` | 没有新提交 | 正常现象,说明无需推送 |
| `refusing to allow an OAuth App...workflow` | 仅发生在 GitHub Actions 方案 | 当前 gh-pages 分支方案**不受影响**,无需处理 |
| 页面旧内容 | 部署未完成 / 缓存 | 等 1~3 分钟 + 强刷(见第 5 节) |

---

## 5. 验证更新是否生效(每次必做)

### ① 查 GitHub Pages 构建状态(部署后立即执行)

```powershell
gh api repos/ZaiYideShiNiyo777/my-project/pages/builds/latest --jq '{status, commit}'
```

| status | 含义 |
|---|---|
| `running` | 正在构建,等 1~3 分钟再查 |
| `built` | 构建完成,已上线 |
| `errored` | 构建失败,检查 dist 产物是否完整 |

### ② 确认新 bundle 已生效

浏览器打开公网地址 → `F12` → Console 执行:

```js
document.querySelector('script[src]').src
```

应返回 `https://zaiyideshiniyo777.github.io/my-project/bundle.<新hash>.js`,与本地构建输出的 hash 一致。命令行方式:

```powershell
curl.exe -s https://zaiyideshiniyo777.github.io/my-project/ | findstr bundle
```

### ③ 确认新数据展示

- **必须用无痕/隐私窗口**打开公网地址(普通窗口会命中你自己浏览器里的 localStorage,看到的是旧数据,误以为没更新)
- 检查首页姓名、作品卡片、技能等是否为新内容

### ④ Console 零报错

`F12` → Console:不应出现红色错误(资源 404 / JS 异常)。

---

## 6. 素材上传(作品图片 / 视频)

后台「项目作品」→ 单个项目 → 媒体文件,支持**直接从本地选择文件上传**图片和视频,上传后自动填充 src 并显示预览(图片缩略图 / 视频播放器)。按文件大小自动选择处理方式,全程无需手动填路径。

### 方案一:后台直接上传本地文件(推荐,全自动)

1. 后台「项目作品」→ 该项目 → 媒体文件 → 类型选「图片/视频」→ 点「地址 src」旁的 **「上传文件」** 按钮,从本地选择文件
2. 系统按大小自动处理(图片 jpg/png/gif/webp/svg,视频 mp4/webm):
   - **图片 ≤2MB、视频 ≤3MB**:自动转 base64 内嵌,随导出 JSON 直接上线
   - **图片 2MB~10MB、视频 3MB~100MB**:自动暂存到浏览器(IndexedDB,容量远大于 localStorage),src **自动填相对路径**(`assets/images/原名` / `assets/videos/原名`),下方立即显示预览
   - **超过 10MB(图片)/ 100MB(视频)**:拒绝上传,请压缩后重试或改用图床 URL
3. 上传大文件后,点「导出数据」会下载 **zip 包**(数据 + 素材);把 zip 直接交给同步脚本,素材自动落到项目 `assets/`,随后构建部署,素材随站点一起上线(公网地址为 `https://zaiyideshiniyo777.github.io/my-project/assets/...`)
4. 小文件导出的是纯 JSON,与原来流程完全一致

> 大文件(>2MB 图 / >3MB 视频)不会转 base64——数据存 localStorage(约 5MB)并随导出 / 同步 / 构建全链路流转,内嵌会撑爆存储与构建链路;改为「浏览器暂存 + 导出打包 + 同步落盘」后,src 里只有相对路径字符串,数据链路完全不受影响。

### 方案二:图床 / 直链 URL(可选)

1. 把图片上传到免费图床(如 sm.ms、imgur),视频上传到可直链的存储(如 GitHub 仓库 raw 链接、对象存储)
2. 后台「地址 src」粘贴完整 `https://...` URL(视频可另填 `poster` 封面图)
3. 先在自己浏览器里打开该 URL 确认能显示,再走路径 A 同步上线

### 方案三:手动放仓库(不用后台上传时)

1. 把文件复制到项目根目录 `assets/` 下(视频建议 `assets/videos/`,图片 `assets/images/`),例如 `assets/videos/恒大液压.mp4`
2. 后台「地址 src」填相对路径:`assets/videos/恒大液压.mp4`(无需手动拷贝到 dist,`deploy.ps1` 会自动把 `assets/` 复制到 `dist/assets/`)
3. 上线后访问地址为 `https://zaiyideshiniyo777.github.io/my-project/assets/videos/恒大液压.mp4`
4. 素材文件随部署自动提交入库(deploy.ps1 的 `git add dist` 会带上 `dist/assets`);源文件 `assets/` 也在 Git 中保留

> 何时用方案二/三而不是直接上传:素材后续经常要换、文件超过硬上限(10MB/100MB)、不想让素材进入 GitHub 仓库等场景。

---

## 7. 一次更新上线的标准操作清单(照抄执行)

### 清单 A:只改内容(后台操作)

| # | 操作 | 命令 / 动作 |
|---|---|---|
| 1 | 公网打开后台改数据 | 管理 → 口令 → 修改(自动保存) |
| 2 | 导出 | 点「导出数据」→ 得到 json(**上传过大文件素材时为 zip**) |
| 3 | 放文件 | 复制到项目根目录,改名 `portfolio-data.json` / `portfolio-data.zip` |
| 4 | 同步 | `powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\sync-data.ps1 D:\AI\AI_Porject\Resume\portfolio\portfolio-data.zip`(zip 自动解压素材到 assets/) |
| 5 | 部署 | `powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\deploy.ps1`(网络不通加 `-UseProxy`) |
| 6 | 等构建 | 1~3 分钟 |
| 7 | 查状态 | `gh api repos/ZaiYideShiNiyo777/my-project/pages/builds/latest --jq '.status'` → 应为 `built` |
| 8 | 验证 | 无痕窗口打开公网地址,确认新内容 + Console 零报错 |

### 清单 B:改代码 / 素材

| # | 操作 | 命令 / 动作 |
|---|---|---|
| 1 | 改源码 | 修改 `src/` 下文件;素材放 `dist/assets/` 或图床 |
| 2 | 构建 | 见路径 B Step 2(注意记录输出的 hash) |
| 3 | 部署 | `powershell -ExecutionPolicy Bypass -File D:\AI\AI_Porject\Resume\portfolio\deploy.ps1` |
| 4 | 等构建 | 1~3 分钟 |
| 5 | 查状态 | `gh api repos/ZaiYideShiNiyo777/my-project/pages/builds/latest --jq '{status, commit}'` → `built` |
| 6 | 验证 | 无痕窗口 + 比对 bundle hash + Console 零报错 |

---

## 8. 常见问题

- **后台怎么上传本地图片/视频?** 项目作品 → 媒体文件 → 「地址 src」旁点「上传文件」直接选文件即可:≤2MB 图片 / ≤3MB 视频自动内嵌;更大的自动暂存浏览器并填相对路径,导出 zip 交给同步脚本,素材自动进项目 `assets/` 随部署上线(图片硬上限 10MB、视频 100MB,见第 6 节)
- **导出下载的是 zip 而不是 json?** 说明你上传过大文件素材(已暂存浏览器)。zip 内含数据 + 素材,同步脚本(sync-data.ps1)直接处理 zip 即可,会自动把素材解压到项目 `assets/`
- **后台预览素材正常,但访客看不到?** 大文件素材还在你浏览器里,未走同步部署:把导出的 zip 交给同步脚本(清单 A 第 4 步)后再部署,素材随 `assets/` 上传 GitHub 上线
- **改完线上没变化?** 等 1~3 分钟构建完成;`Ctrl+F5` 强刷(清缓存);用无痕窗口验证
- **访客看不到我后台改的数据?** 没走同步流程——后台数据只在你浏览器 localStorage,必须执行清单 A 的 4/5 步
- **忘记管理口令?** 编辑 `src/data/resumeStore.js` 的 `ADMIN_PASS` → 重新构建部署(清单 B)
- **同步脚本报 "JSON 缺少数据键"?** 确认用的是「导出数据」按钮下载的文件,不是自己手写的
- **本地预览**:`Set-Location dist; python -m http.server 8123`,浏览器开 `http://localhost:8123`
