import React, { useEffect, useState } from 'react';
import { navLinks as defaultNavLinks, uiTexts as defaultUiTexts } from '../data/resume';

export default function Navbar({ navLinks = defaultNavLinks, uiTexts = defaultUiTexts, onOpenAdmin }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // 滚动监听:毛玻璃背景 + 阅读进度条 + 当前区块高亮
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);

      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (y / total) * 100) : 0);

      // 找到当前视口内的区块
      let current = 'home';
      navLinks.forEach((link) => {
        const el = document.getElementById(link.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          current = link.id;
        }
      });
      setActive(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jumpTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <span
            className="nav-logo text-xl font-bold pointer-events-none select-none cursor-pointer"
            onClick={() => jumpTo('home')}
          >
            <span className="gradient-text">{uiTexts.navLogo}</span>
          </span>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                className={`nav-link ${active === link.id ? 'nav-link-active' : ''}`}
                onClick={() => jumpTo(link.id)}
              >
                {link.label}
              </button>
            ))}
            {onOpenAdmin && (
              <button
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                onClick={onOpenAdmin}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                管理
              </button>
            )}
          </div>

          {/* 移动端汉堡菜单 */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 移动端下拉菜单 */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col items-center gap-4 bg-[#0a0a0f]/95 backdrop-blur-lg rounded-b-2xl py-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                className={`nav-link ${active === link.id ? 'nav-link-active' : ''}`}
                onClick={() => jumpTo(link.id)}
              >
                {link.label}
              </button>
            ))}
            {onOpenAdmin && (
              <button
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenAdmin();
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                管理
              </button>
            )}
          </div>
        )}
      </div>

      {/* 滚动阅读进度条 */}
      <div className="scroll-progress-track">
        <div
          className="scroll-progress-bar bg-gradient-to-r from-primary-500 via-accent-400 to-primary-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </nav>
  );
}
