// ============================================================
// 简历数据存储层
// - 前台页面与后台管理统一从这里读取数据
// - 后台修改通过 saveResumeData 持久化到 localStorage
// - 未保存过任何修改时,自动使用 resume.js 中的默认数据
// ============================================================
import * as resumeData from './resume';
import { dataVersion } from './resume';

const STORAGE_KEY = 'portfolio_resume_data_v1';

// ============================================================
// 后台管理入口口令(仅本人知道,修改后重新构建生效)
// - 入口:顶部导航栏"管理"按钮,或地址栏访问 #admin 打开验证层
// - 口令大小写敏感;不提供带口令的 hash 直达,避免绕过验证
// ============================================================
export const ADMIN_PASS = 'Blender';

// 所有可编辑数据的默认值(与 resume.js 命名保持一致)
export const defaultData = {
  profile: resumeData.profile,
  heroTags: resumeData.heroTags,
  stats: resumeData.stats,
  coreTechs: resumeData.coreTechs,
  projectAreas: resumeData.projectAreas,
  skillGroups: resumeData.skillGroups,
  projects: resumeData.projects,
  experiences: resumeData.experiences,
  navLinks: resumeData.navLinks,
  socials: resumeData.socials,
  uiTexts: resumeData.uiTexts,
};

let cache = null;

// 读取当前简历数据(localStorage 优先,无则用默认值)
export function getResumeData() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 版本指纹校验:localStorage 数据必须与源码数据版本一致才生效;
      // 旧版本残留(如部署新数据前保存过的后台数据)自动丢弃并清理,
      // 保证不同浏览器、不同时间打开的页面都显示最新数据
      if (parsed && parsed.__version === dataVersion) {
        const { __version, ...rest } = parsed;
        // 与默认值合并,避免后续新增字段时页面缺数据;
        // 但 projects 不做默认回填:后台删光项目后前端应如实显示「暂无项目」,
        // 而不是把默认示例项目顶替上来(实事求是,不补占位)
        cache = {
          ...defaultData,
          ...rest,
          projects: Array.isArray(rest.projects) ? rest.projects : [],
        };
        return cache;
      }
      // 旧版本缓存:清理掉,下次直接走默认数据
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // 忽略清理失败
      }
    }
  } catch (e) {
    // localStorage 不可用或数据损坏,回退默认值
  }
  cache = { ...defaultData };
  return cache;
}

// 保存简历数据(localStorage 持久化)
export function saveResumeData(data) {
  // 保存时携带当前数据版本,确保与源码数据版本绑定,
  // 版本升级后旧缓存自动失效,不会混淆新旧数据
  const payload = { ...data, __version: dataVersion };
  cache = payload;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    // 隐私模式等场景下写入失败,仅内存生效
  }
}

// 恢复为 resume.js 中的默认数据
export function resetResumeData() {
  cache = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // 忽略清理失败
  }
}
