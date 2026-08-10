import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Footer from './components/Footer';
import GlobalBackground from './components/GlobalBackground';
import AuthGate from './components/AuthGate';
import AdminPanel from './components/AdminPanel';
import { getResumeData, saveResumeData, resetResumeData } from './data/resumeStore';
import './index.css';

// 解析 URL hash,决定打开"口令验证层"还是"管理面板"
// - 空      → 全部关闭
// - #admin  → 打开口令验证层(需输入口令;不提供带口令的直达,避免绕过验证)
// - 其他    → 全部关闭
function parseHash(hash) {
  if (!hash || hash === '#') return { auth: false, admin: false };
  if (hash.startsWith('#admin')) return { auth: true, admin: false };
  return { auth: false, admin: false };
}

function App() {
  // 简历数据统一状态:前台展示与后台管理共享,修改后页面即时更新
  const [data, setData] = useState(() => getResumeData());
  const [authOpen, setAuthOpen] = useState(false); // 口令验证层
  const [adminOpen, setAdminOpen] = useState(false); // 管理面板

  // URL hash 驱动:刷新/直达均可进入,浏览器后退可退出
  useEffect(() => {
    const onHash = () => {
      const s = parseHash(window.location.hash);
      setAuthOpen(s.auth);
      setAdminOpen(s.admin);
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleDataChange = (next) => {
    saveResumeData(next); // 持久化到 localStorage
    setData(next); // 通知前台组件重新渲染
  };

  const handleReset = () => {
    resetResumeData();
    setData(getResumeData());
  };

  const closeAll = () => {
    // 清空 hash 触发 hashchange,统一关闭验证层与面板
    if (window.location.hash) window.location.hash = '';
    setAuthOpen(false);
    setAdminOpen(false);
  };

  return (
    <div className="min-h-screen relative">
      {/* 全局固定动态背景层:位于所有内容层之下,不遮挡交互 */}
      <GlobalBackground paused={authOpen || adminOpen} />
      {/* 全局可读性遮罩:让文字/卡片始终清晰,同时保持背景可见 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#101010]/35" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#101010]/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#101010]/75 to-transparent" />
      </div>

      {/* 内容层 */}
      <div className="relative z-10">
        <Navbar
          navLinks={data.navLinks}
          uiTexts={data.uiTexts}
          onOpenAdmin={() => {
            window.location.hash = 'admin';
          }}
        />
        <Hero profile={data.profile} heroTags={data.heroTags} socials={data.socials} uiTexts={data.uiTexts} />
        <About
          profile={data.profile}
          stats={data.stats}
          coreTechs={data.coreTechs}
          projectAreas={data.projectAreas}
          uiTexts={data.uiTexts}
        />
        <Projects projects={data.projects} uiTexts={data.uiTexts} />
        <Skills skillGroups={data.skillGroups} uiTexts={data.uiTexts} />
        <Experience experiences={data.experiences} uiTexts={data.uiTexts} />
        <Footer profile={data.profile} uiTexts={data.uiTexts} />
      </div>

      {/* 口令验证层(#admin 时打开,入口隐藏) */}
      {authOpen && (
        <AuthGate
          onSuccess={() => {
            setAdminOpen(true);
            setAuthOpen(false);
            // 保持 #admin(不改 hash,避免地址栏暴露口令)
          }}
          onCancel={closeAll}
        />
      )}

      {/* 后台管理面板(口令验证通过后打开) */}
      {adminOpen && (
        <AdminPanel data={data} onDataChange={handleDataChange} onReset={handleReset} onClose={closeAll} />
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
