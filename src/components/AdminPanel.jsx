import React, { useEffect, useRef, useState } from 'react';
import { defaultData } from '../data/resumeStore';
import { saveMediaBlob, getMediaBlob, deleteMediaBlob } from '../utils/mediaStore';
import { makeZip } from '../utils/zip';

// ============================================================
// 后台管理面板
// - 通过导航栏"管理"按钮或 URL hash(#admin)验证口令后打开
// - 对 resume.js 中的简历数据(基本信息/技能/项目/经历等)查看与编辑
// - 每次修改即时保存到 localStorage,前台页面随之更新
// - 关闭方式:右上角「退出」按钮 / 点击遮罩层 / 按 ESC
// - 「完成」仅提示保存结果,不退出面板,方便继续编辑
// ============================================================

/* ---------- 通用表单小部件 ---------- */
function Field({ label, value, onChange, textarea, rows, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {textarea ? (
        <textarea
          className="admin-input"
          rows={rows || 3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="admin-input"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

// 颜色输入:色盘 + 文本双通道(rgba 等旧值文本可继续手输)
function ColorField({ label, value, onChange }) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : '#3b82f6';
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="admin-color"
          title="选择颜色"
        />
        <input
          className="admin-input flex-1"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
}

/* ---------- 媒体上传:本地文件自动处理,或手动填 URL ---------- */
// 数据会存 localStorage(约 5MB)并随导出 JSON / resume.js / 构建产物全链路流转,
// 因此按文件大小分三档:
//   1) 内嵌安全阈值(EMBED_*)内:自动转 base64 内嵌,随 JSON 全链路流转
//   2) 阈值以上、硬上限(MAX_*)内:不转 base64,自动暂存浏览器 IndexedDB(容量远大于
//      localStorage),src 自动填相对路径(assets/images|videos/原名),预览正常;
//      「导出数据」打包为 zip,同步脚本解压后素材落到项目 assets/,随部署自动上线
//   3) 超过硬上限:拒绝上传,提示压缩或改用图床 URL(见 UPDATE_GUIDE.md 第 6 节)
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 图片硬上限 10MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 视频硬上限 100MB
const EMBED_IMAGE_BYTES = 2 * 1024 * 1024; // 图片超过 2MB 不内嵌(改走 IndexedDB 暂存)
const EMBED_VIDEO_BYTES = 3 * 1024 * 1024; // 视频超过 3MB 不内嵌(改走 IndexedDB 暂存)
const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const VIDEO_ACCEPT = ['video/mp4', 'video/webm'];
const ASSET_IMAGE_DIR = 'assets/images/'; // 大图片相对路径目录(发布时随 assets/ 上传 GitHub)
const ASSET_VIDEO_DIR = 'assets/videos/'; // 大视频相对路径目录
// 以 assets/ 开头的 src:素材随仓库 assets/ 发布;若同时在 IndexedDB 有暂存,导出时会打包
const isAssetPath = (v) => typeof v === 'string' && v.indexOf('assets/') === 0;

// 释放一批媒体条目在浏览器中的暂存文件(删除/改写 src 时调用,尽力而为)
function releaseMedia(media) {
  (media || []).forEach((m) => {
    if (isAssetPath(m.src)) deleteMediaBlob(m.src);
  });
}

// 触发浏览器下载 Blob 文件
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function MediaUploadField({ type, value, onChange }) {
  const fileRef = useRef(null);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [previewUrl, setPreviewUrl] = useState(''); // IndexedDB 暂存文件的 blob 预览地址
  const isImage = type !== 'video';

  // 相对路径素材:优先取 IndexedDB 暂存文件预览(未部署时也能看到);取不到则按 src 直接加载
  useEffect(() => {
    let url = '';
    let cancelled = false;
    if (isAssetPath(value)) {
      getMediaBlob(value)
        .then((blob) => {
          if (cancelled || !blob) return;
          url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [value]);

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // 清空 value,允许再次选择同一文件
    if (!file) return;

    const allowed = isImage ? IMAGE_ACCEPT : VIDEO_ACCEPT;
    if (!allowed.includes(file.type)) {
      setErr(isImage ? '图片仅支持 jpg / png / gif / webp / svg 格式' : '视频仅支持 mp4 / webm 格式');
      return;
    }
    const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    const embedLimit = isImage ? EMBED_IMAGE_BYTES : EMBED_VIDEO_BYTES;
    const mb = (file.size / 1024 / 1024).toFixed(1);
    if (file.size > limit) {
      setErr(
        isImage
          ? `图片 ${mb}MB 超过 10MB 上限。请压缩后再上传,或改用图床 URL(见 UPDATE_GUIDE.md 第 6 节)`
          : `视频 ${mb}MB 超过 100MB 上限。请改用图床 URL(见 UPDATE_GUIDE.md 第 6 节)`
      );
      return;
    }
    if (file.size > embedLimit) {
      // 大文件不转 base64:自动暂存浏览器 IndexedDB(容量远大于 localStorage),
      // src 自动填相对路径,导出时打包,发布时随 assets/ 自动上传 GitHub 上线
      const src = (isImage ? ASSET_IMAGE_DIR : ASSET_VIDEO_DIR) + file.name;
      try {
        await saveMediaBlob(src, file);
        setErr('');
        setInfo(`✓ 已暂存(${mb}MB),src 已自动填入相对路径;「导出数据」会自动打包该文件,同步后随站点上线`);
        onChange(src);
      } catch (e) {
        setErr('浏览器暂存大文件失败(可能处于隐私/无痕模式),请改用小文件内嵌,或图床 URL(见 UPDATE_GUIDE.md 第 6 节)');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setErr('');
      setInfo('');
      onChange(reader.result); // base64 data URI,直接写入 src
    };
    reader.onerror = () => setErr('文件读取失败,请重试');
    reader.readAsDataURL(file);
  };

  // src 被改写时,同步释放旧路径的暂存文件
  const handleSrcChange = (v) => {
    if (v !== value && isAssetPath(value)) deleteMediaBlob(value);
    onChange(v);
  };

  const isDataUri = typeof value === 'string' && value.indexOf('data:') === 0;
  const isAsset = isAssetPath(value);

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Field
            textarea
            rows={1}
            label="地址 src"
            value={value}
            onChange={handleSrcChange}
            placeholder="点右侧「上传文件」自动填充;或粘贴 https:// 图床 URL"
          />
        </div>
        <div className="pt-[1.15rem] flex-shrink-0">
          <button
            type="button"
            className="admin-btn-ghost !py-1 !px-2 text-xs whitespace-nowrap"
            onClick={() => fileRef.current && fileRef.current.click()}
            title={
              isImage
                ? '从本地选择图片:≤2MB 自动内嵌;2MB~10MB 自动暂存并填相对路径,发布时随 assets/ 上线'
                : '从本地选择视频:≤3MB 自动内嵌;3MB~100MB 自动暂存并填相对路径,发布时随 assets/ 上线'
            }
          >
            上传文件
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={isImage ? IMAGE_ACCEPT.join(',') : VIDEO_ACCEPT.join(',')}
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>
      {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
      {info && <p className="text-xs text-emerald-400 mt-1">{info}</p>}
      {value ? (
        <div className="mt-2">
          {isDataUri && (
            <p className="text-xs text-emerald-400 mb-1">✓ 已内嵌到数据中,导出 JSON / 同步上线时自动携带</p>
          )}
          {isAsset && previewUrl && (
            <p className="text-xs text-emerald-400 mb-1">✓ 素材已暂存于浏览器,导出数据时自动打包;发布时随 assets/ 上传 GitHub</p>
          )}
          {isImage ? (
            <img
              src={previewUrl || value}
              alt="图片预览"
              className="max-h-24 rounded border border-gray-700"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <video src={previewUrl || value} controls className="max-h-24 rounded border border-gray-700" />
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- 数组列表块:支持增删条目 ---------- */
function ListBlock({ title, hint, items, onChange, renderItem, makeNew, addLabel }) {
  const update = (i, patch) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, makeNew()]);

  return (
    <div className="admin-block">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{title}</h4>
          {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
        </div>
        <button className="admin-btn-add flex-shrink-0" onClick={add}>
          {addLabel || '+ 添加'}
        </button>
      </div>

      {items.length === 0 && <p className="text-xs text-gray-600 py-2">暂无数据,点击"添加"新建</p>}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="admin-item">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                {renderItem(item, (patch) => update(i, patch))}
              </div>
              <button
                className="admin-btn-remove flex-shrink-0"
                onClick={() => remove(i)}
                title="删除此项"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Tab 1:基本信息
   ============================================================ */
function ProfileTab({ data, onChange }) {
  const p = data.profile;
  const set = (patch) => onChange({ ...data, profile: { ...p, ...patch } });

  return (
    <div className="space-y-4">
      <div className="admin-block">
        <h4 className="text-sm font-semibold text-white mb-3">个人信息</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="姓名" value={p.name} onChange={(v) => set({ name: v })} />
          <Field label="英文名" value={p.nameEn} onChange={(v) => set({ nameEn: v })} />
          <Field label="职位" value={p.title} onChange={(v) => set({ title: v })} />
          <Field label="所在地" value={p.location} onChange={(v) => set({ location: v })} />
          <Field label="邮箱" value={p.email} onChange={(v) => set({ email: v })} />
          <Field label="头像文字" value={p.avatarChar} onChange={(v) => set({ avatarChar: v })} />
        </div>
        <div className="mt-3">
          <Field
            textarea
            rows={3}
            label="个人简介"
            value={p.bio}
            onChange={(v) => set({ bio: v })}
          />
        </div>
      </div>

      <ListBlock
        title="数据指标"
        hint="关于区块顶部展示的统计数字"
        items={data.stats}
        onChange={(items) => onChange({ ...data, stats: items })}
        makeNew={() => ({ value: '', label: '' })}
        renderItem={(s, update) => (
          <>
            <Field label="数值" value={s.value} onChange={(v) => update({ value: v })} />
            <Field label="说明" value={s.label} onChange={(v) => update({ label: v })} />
          </>
        )}
      />

      <ListBlock
        title="首屏技术标签"
        hint="Hero 首屏顶部的圆角标签"
        items={data.heroTags}
        onChange={(items) => onChange({ ...data, heroTags: items })}
        makeNew={() => ({ label: '', color: '#3b82f6' })}
        renderItem={(t, update) => (
          <>
            <Field label="标签文字" value={t.label} onChange={(v) => update({ label: v })} />
            <ColorField label="颜色" value={t.color} onChange={(v) => update({ color: v })} />
          </>
        )}
      />

      <ListBlock
        title="核心技术栈"
        hint="关于区块右侧展示"
        items={data.coreTechs}
        onChange={(items) => onChange({ ...data, coreTechs: items })}
        makeNew={() => ({ label: '', color: 'rgba(59, 130, 246, 0.3)' })}
        renderItem={(t, update) => (
          <>
            <Field label="名称" value={t.label} onChange={(v) => update({ label: v })} />
            <ColorField label="颜色" value={t.color} onChange={(v) => update({ color: v })} />
          </>
        )}
      />

      <ListBlock
        title="项目经验标签"
        hint="关于区块右侧展示"
        items={data.projectAreas}
        onChange={(items) => onChange({ ...data, projectAreas: items })}
        makeNew={() => ({ label: '', color: '#3b82f6' })}
        renderItem={(t, update) => (
          <>
            <Field label="名称" value={t.label} onChange={(v) => update({ label: v })} />
            <ColorField label="颜色" value={t.color} onChange={(v) => update({ color: v })} />
          </>
        )}
      />
    </div>
  );
}

/* ============================================================
   Tab 2:技能
   ============================================================ */
function SkillsTab({ data, onChange }) {
  const groups = data.skillGroups;
  const updateGroup = (i, patch) =>
    onChange({ ...data, skillGroups: groups.map((g, idx) => (idx === i ? { ...g, ...patch } : g)) });
  const addGroup = () =>
    onChange({
      ...data,
      skillGroups: [...groups, { title: '新技能组', color: '#3b82f6', skills: [] }],
    });
  const removeGroup = (i) =>
    onChange({ ...data, skillGroups: groups.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi} className="admin-block">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <Field label="技能组名" value={g.title} onChange={(v) => updateGroup(gi, { title: v })} />
              <ColorField label="主题色" value={g.color} onChange={(v) => updateGroup(gi, { color: v })} />
            </div>
            <button className="admin-btn-remove flex-shrink-0" onClick={() => removeGroup(gi)} title="删除技能组">
              ✕
            </button>
          </div>

          <ListBlock
            items={g.skills}
            onChange={(skills) => updateGroup(gi, { skills })}
            makeNew={() => ({ name: '', pct: 80 })}
            addLabel="+ 添加技能"
            renderItem={(s, update) => (
              <>
                <Field label="技能名" value={s.name} onChange={(v) => update({ name: v })} />
                <Field
                  type="number"
                  label="熟练度 %"
                  value={String(s.pct)}
                  onChange={(v) => update({ pct: parseInt(v, 10) || 0 })}
                />
              </>
            )}
          />
        </div>
      ))}
      <button className="admin-btn-add" onClick={addGroup}>
        + 添加技能组
      </button>
    </div>
  );
}

/* ============================================================
   Tab 3:项目作品
   ============================================================ */
function ProjectsTab({ data, onChange }) {
  const projects = data.projects;
  const updateProject = (i, patch) =>
    onChange({ ...data, projects: projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  const addProject = () =>
    onChange({
      ...data,
      projects: [
        ...projects,
        {
          title: '新项目',
          desc: '项目描述',
          icon: '项',
          color: '#8b5cf6',
          imageCount: 1,
          media: [{ type: 'image', src: '' }],
        },
      ],
    });
  const removeProject = (i) => {
    // 删除项目时同步释放浏览器暂存的大文件素材
    releaseMedia(projects[i].media);
    onChange({ ...data, projects: projects.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      {projects.map((p, pi) => (
        <div key={pi} className="admin-block">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <Field label="项目标题" value={p.title} onChange={(v) => updateProject(pi, { title: v })} />
              <Field label="图标文字(单个汉字/字母)" value={p.icon} onChange={(v) => updateProject(pi, { icon: v })} />
              <ColorField label="主题色" value={p.color} onChange={(v) => updateProject(pi, { color: v })} />
              <Field
                type="number"
                label="图片数量(卡片徽章,视频数自动统计)"
                value={String(p.imageCount || 0)}
                onChange={(v) => updateProject(pi, { imageCount: parseInt(v, 10) || 0 })}
              />
              <div className="sm:col-span-2">
                <Field textarea rows={2} label="项目描述" value={p.desc} onChange={(v) => updateProject(pi, { desc: v })} />
              </div>
            </div>
            <button className="admin-btn-remove flex-shrink-0" onClick={() => removeProject(pi)} title="删除项目">
              ✕
            </button>
          </div>

          {/* 媒体文件编辑 */}
          <div className="border-t border-gray-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">媒体文件(直接「上传文件」:≤2MB 图片 / ≤3MB 视频自动内嵌;更大的自动暂存浏览器并填相对路径,导出 zip 打包、发布时随 assets/ 自动上线;也可粘贴图床 URL;点击卡片弹窗中展示)</p>
              <button
                className="admin-btn-add !py-1 !px-2 text-xs"
                onClick={() =>
                  updateProject(pi, { media: [...(p.media || []), { type: 'image', src: '', poster: '' }] })
                }
              >
                + 添加媒体
              </button>
            </div>
            {(p.media || []).length === 0 && <p className="text-xs text-gray-600">暂无媒体</p>}
            <div className="space-y-2">
              {(p.media || []).map((m, mi) => (
                <div key={mi} className="flex items-start gap-2 admin-item !p-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                    <label className="block">
                      <span className="admin-label">类型</span>
                      <select
                        className="admin-input"
                        value={m.type}
                        onChange={(e) => {
                          const media = [...(p.media || [])];
                          // 切换类型时,已暂存素材的路径目录与类型不匹配:释放并清空 src
                          if (isAssetPath(media[mi].src)) {
                            deleteMediaBlob(media[mi].src);
                            media[mi] = { ...media[mi], type: e.target.value, src: '' };
                          } else {
                            media[mi] = { ...media[mi], type: e.target.value };
                          }
                          updateProject(pi, { media });
                        }}
                      >
                        <option value="image">图片</option>
                        <option value="video">视频</option>
                      </select>
                    </label>
                    <div className="sm:col-span-2">
                      <MediaUploadField
                        type={m.type}
                        value={m.src}
                        onChange={(v) => {
                          const media = [...(p.media || [])];
                          media[mi] = { ...media[mi], src: v };
                          updateProject(pi, { media });
                        }}
                      />
                    </div>
                    {m.type === 'video' && (
                      <div className="sm:col-span-3">
                        <Field
                          textarea
                          rows={1}
                          label="封面 poster(视频封面图,可选)"
                          value={m.poster || ''}
                          onChange={(v) => {
                            const media = [...(p.media || [])];
                            media[mi] = { ...media[mi], poster: v };
                            updateProject(pi, { media });
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    className="admin-btn-remove flex-shrink-0 !w-7 !h-7"
                    onClick={() => {
                      // 删除媒体时释放浏览器暂存文件
                      const cur = (p.media || [])[mi];
                      if (cur && isAssetPath(cur.src)) deleteMediaBlob(cur.src);
                      const media = (p.media || []).filter((_, idx) => idx !== mi);
                      updateProject(pi, { media });
                    }}
                    title="删除媒体"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button className="admin-btn-add" onClick={addProject}>
        + 添加项目
      </button>
    </div>
  );
}

/* ============================================================
   Tab 4:工作经历
   ============================================================ */
function ExperienceTab({ data, onChange }) {
  return (
    <ListBlock
      title="工作经历"
      hint="时间线区块展示,按数组顺序排列"
      items={data.experiences}
      onChange={(items) => onChange({ ...data, experiences: items })}
      makeNew={() => ({ period: '', title: '', company: '', desc: '' })}
      renderItem={(e, update) => (
        <>
          <Field label="时间区间" value={e.period} onChange={(v) => update({ period: v })} />
          <Field label="公司" value={e.company} onChange={(v) => update({ company: v })} />
          <Field label="职位" value={e.title} onChange={(v) => update({ title: v })} />
          <div className="sm:col-span-2">
            <Field textarea rows={2} label="描述" value={e.desc} onChange={(v) => update({ desc: v })} />
          </div>
        </>
      )}
    />
  );
}

/* ============================================================
   Tab 5:其他数据(导航 / 社交 / 页面文案 / 只读说明)
   ============================================================ */
function OtherTab({ data, onChange }) {
  const ui = data.uiTexts || {};
  const setUi = (patch) => onChange({ ...data, uiTexts: { ...ui, ...patch } });

  return (
    <div className="space-y-4">
      <ListBlock
        title="导航链接"
        hint="顶部导航栏展示,id 对应页面区块的锚点"
        items={data.navLinks}
        onChange={(items) => onChange({ ...data, navLinks: items })}
        makeNew={() => ({ label: '', id: '' })}
        renderItem={(n, update) => (
          <>
            <Field label="显示文字" value={n.label} onChange={(v) => update({ label: v })} />
            <Field label="锚点 id" value={n.id} onChange={(v) => update({ id: v })} />
          </>
        )}
      />

      <ListBlock
        title="社交链接"
        hint="首屏社交图标(SVG path 一般无需修改)"
        items={data.socials}
        onChange={(items) => onChange({ ...data, socials: items })}
        makeNew={() => ({ title: '', path: '' })}
        renderItem={(s, update) => (
          <>
            <Field label="名称" value={s.title} onChange={(v) => update({ title: v })} />
            <div className="sm:col-span-2">
              <Field textarea rows={3} label="SVG path" value={s.path} onChange={(v) => update({ path: v })} />
            </div>
          </>
        )}
      />

      {/* 页面静态文案编辑:与页面上每个区块的标题/按钮/页脚文字一一对应 */}
      <div className="admin-block">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-white">页面文案</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            覆盖页面所有区块标题、按钮与页脚文字,修改后前台立即更新
          </p>
        </div>

        <p className="admin-label !mb-1.5 mt-4">导航栏</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="品牌 Logo 文字" value={ui.navLogo || ''} onChange={(v) => setUi({ navLogo: v })} />
        </div>

        <p className="admin-label !mb-1.5 mt-4">首屏 Hero</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="主按钮文字" value={ui.heroCtaPrimary || ''} onChange={(v) => setUi({ heroCtaPrimary: v })} />
          <Field label="次按钮文字" value={ui.heroCtaSecondary || ''} onChange={(v) => setUi({ heroCtaSecondary: v })} />
        </div>

        <p className="admin-label !mb-1.5 mt-4">关于我</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="标题" value={ui.aboutTitle || ''} onChange={(v) => setUi({ aboutTitle: v })} />
          <Field label="标题强调字(渐变字)" value={ui.aboutTitleAccent || ''} onChange={(v) => setUi({ aboutTitleAccent: v })} />
          <Field label="副标题" value={ui.aboutSubtitle || ''} onChange={(v) => setUi({ aboutSubtitle: v })} />
          <Field label="核心技术栈小标题" value={ui.aboutCoreLabel || ''} onChange={(v) => setUi({ aboutCoreLabel: v })} />
          <Field label="项目经验小标题" value={ui.aboutAreaLabel || ''} onChange={(v) => setUi({ aboutAreaLabel: v })} />
        </div>

        <p className="admin-label !mb-1.5 mt-4">作品集 / 技能 / 经历</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="作品标题" value={ui.projectsTitle || ''} onChange={(v) => setUi({ projectsTitle: v })} />
          <Field label="作品副标题" value={ui.projectsSubtitle || ''} onChange={(v) => setUi({ projectsSubtitle: v })} />
          <Field label="技能标题" value={ui.skillsTitle || ''} onChange={(v) => setUi({ skillsTitle: v })} />
          <Field label="技能副标题" value={ui.skillsSubtitle || ''} onChange={(v) => setUi({ skillsSubtitle: v })} />
          <Field label="经历标题" value={ui.experienceTitle || ''} onChange={(v) => setUi({ experienceTitle: v })} />
          <Field label="经历副标题" value={ui.experienceSubtitle || ''} onChange={(v) => setUi({ experienceSubtitle: v })} />
        </div>

        <p className="admin-label !mb-1.5 mt-4">页脚</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="版权文字" value={ui.footerCopyright || ''} onChange={(v) => setUi({ footerCopyright: v })} />
          <Field label="回到顶部链接文字" value={ui.footerBackTop || ''} onChange={(v) => setUi({ footerBackTop: v })} />
          <Field label="联系我链接文字" value={ui.footerContact || ''} onChange={(v) => setUi({ footerContact: v })} />
        </div>
      </div>

      {/* 只读/说明:明确区分哪些元素不可在线编辑 */}
      <div className="admin-block border-gray-800">
        <h4 className="text-sm font-semibold text-white mb-3">只读元素说明(不可在线编辑)</h4>
        <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 leading-relaxed">
          <li>
            全局动态背景(粒子连线网络 / 透视网格 / 扫描线 / 数据流 / 鼠标交互):由
            GlobalBackground.jsx 的动画参数控制,为视觉与性能统一而固定,不在本面板提供编辑
          </li>
          <li>装饰性光效与渐变遮罩(首屏氛围光球、区块上下渐隐、导航栏毛玻璃、滚动进度条、卡片 hover 动效、弹窗动画):纯 CSS / 装饰元素,不可在线编辑</li>
          <li>项目卡片媒体数量徽章:图片数来自上方"图片数量"字段,视频数根据媒体列表自动统计,无需单独编辑</li>
          <li>
            导航锚点 id 需与页面区块对应,修改后请确认页面存在同名 id 的区块,否则点击跳转可能失效
          </li>
          <li>后台入口口令在 src/data/resumeStore.js 的 ADMIN_PASS 常量中修改(修改后需重新构建)</li>
        </ul>
      </div>
    </div>
  );
}

/* ============================================================
   面板主体
   ============================================================ */
const TABS = [
  { id: 'profile', label: '基本信息' },
  { id: 'skills', label: '技能' },
  { id: 'projects', label: '项目作品' },
  { id: 'experience', label: '工作经历' },
  { id: 'other', label: '其他数据' },
];

export default function AdminPanel({ data, onDataChange, onReset, onClose }) {
  const [tab, setTab] = useState('profile');
  // 编辑草稿:深拷贝,避免直接改动 props 数据
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(data)));
  const [savedAt, setSavedAt] = useState(null);
  const [doneFlash, setDoneFlash] = useState(false); // 「完成」按钮的短暂反馈提示
  const [exportMsg, setExportMsg] = useState(''); // 导出结果的短暂提示
  const doneTimer = useRef(null);
  const exportTimer = useRef(null);

  // ESC 关闭 + 锁定背景滚动
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // 任意修改:更新草稿 + 即时持久化并刷新前台
  const update = (next) => {
    setDraft(next);
    onDataChange(next);
    setSavedAt(new Date());
  };

  const handleReset = () => {
    if (window.confirm('确定恢复为 resume.js 中的默认数据吗?当前 localStorage 中的修改将被清除,浏览器暂存的大文件素材也会一并清理。')) {
      // 清理浏览器暂存的大文件素材,避免残留占用空间
      (draft.projects || []).forEach((p) => releaseMedia(p.media || []));
      onReset();
      setDraft(JSON.parse(JSON.stringify(defaultData)));
      setSavedAt(null);
    }
  };

  // 「导出数据」:下载当前全部数据。
  // 存在浏览器暂存的大文件素材时打包为 zip(JSON + assets/ 文件),否则直接下载 JSON
  const handleExport = async () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const json = JSON.stringify(draft, null, 2);

    // 收集相对路径素材:优先取 IndexedDB 暂存文件;取不到说明素材已在项目 assets/,无需打包
    const seen = new Set();
    const assetSrcs = [];
    (draft.projects || []).forEach((p) =>
      (p.media || []).forEach((m) => {
        if (isAssetPath(m.src) && !seen.has(m.src)) {
          seen.add(m.src);
          assetSrcs.push(m.src);
        }
      })
    );
    const files = [];
    for (const src of assetSrcs) {
      try {
        const blob = await getMediaBlob(src);
        if (blob) files.push({ name: src, blob });
      } catch (e) {
        // 单个素材读取失败不阻塞导出,该文件视为已在项目 assets/ 中
      }
    }

    const jsonName = `portfolio-data-${dateStr}.json`;
    if (files.length) {
      try {
        const zip = await makeZip([{ name: jsonName, blob: new Blob([json], { type: 'application/json' }) }, ...files]);
        downloadBlob(zip, `portfolio-data-${dateStr}.zip`);
        setExportMsg(`✓ 已导出 zip(内含 ${files.length} 个素材):同步脚本可直接处理 zip,素材自动落到项目 assets/`);
      } catch (e) {
        setExportMsg('✗ zip 打包失败,已改导纯 JSON,请检查浏览器存储');
        downloadBlob(new Blob([json], { type: 'application/json' }), jsonName);
      }
    } else {
      downloadBlob(new Blob([json], { type: 'application/json' }), jsonName);
      setExportMsg('✓ 已导出 JSON(无浏览器暂存素材,直接同步即可)');
    }
    clearTimeout(exportTimer.current);
    exportTimer.current = setTimeout(() => setExportMsg(''), 8000);
  };

  // 「完成」:数据为自动保存,此处仅提示保存结果,不关闭面板
  const handleDone = () => {
    setSavedAt(new Date());
    setDoneFlash(true);
    clearTimeout(doneTimer.current);
    doneTimer.current = setTimeout(() => setDoneFlash(false), 2000);
  };

  useEffect(
    () => () => {
      clearTimeout(doneTimer.current);
      clearTimeout(exportTimer.current);
    },
    []
  );

  return (
    <div
      className="modal-overlay admin-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="后台管理"
    >
      <div className="admin-panel modal-panel">
        {/* 顶部栏 */}
        <div className="admin-header">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-400 inline-block" />
              后台管理
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {exportMsg ||
                (doneFlash
                  ? '✓ 已保存,可继续编辑 · 点右上角「退出」关闭后台'
                  : savedAt
                    ? `已自动保存 · ${savedAt.toLocaleTimeString()} · 数据存于浏览器 localStorage`
                    : '修改自动保存到浏览器 localStorage,前台页面实时更新')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="admin-btn-ghost"
              onClick={handleExport}
              title="下载全部数据(JSON),同步到 Git 源码后重新部署即可让所有访客看到"
            >
              导出数据
            </button>
            <button className="admin-btn-ghost" onClick={handleReset}>
              恢复默认
            </button>
            <button className="admin-btn-ghost" onClick={handleDone}>
              完成
            </button>
            <button className="admin-btn-primary" onClick={onClose}>
              退出
            </button>
          </div>
        </div>

        {/* Tab 栏 */}
        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'admin-tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div className="admin-body">
          {tab === 'profile' && <ProfileTab data={draft} onChange={update} />}
          {tab === 'skills' && <SkillsTab data={draft} onChange={update} />}
          {tab === 'projects' && <ProjectsTab data={draft} onChange={update} />}
          {tab === 'experience' && <ExperienceTab data={draft} onChange={update} />}
          {tab === 'other' && <OtherTab data={draft} onChange={update} />}
        </div>
      </div>
    </div>
  );
}
