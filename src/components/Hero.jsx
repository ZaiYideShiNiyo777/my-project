import React from 'react';
import { profile as defaultProfile, heroTags as defaultHeroTags, socials as defaultSocials, uiTexts as defaultUiTexts } from '../data/resume';

export default function Hero({ profile = defaultProfile, heroTags = defaultHeroTags, socials = defaultSocials, uiTexts = defaultUiTexts }) {
  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden">
      {/* 首屏可读性渐变遮罩(全局动态背景由 App 提供,这里只负责文字清晰度) */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(9, 12, 18, 0.68), rgba(9, 12, 18, 0.32), transparent)' }} />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(9, 12, 18, 0.82), rgba(9, 12, 18, 0.1), transparent)' }} />

      {/* 氛围光球(蓝 / 青) */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(59, 130, 246, 0.12)', filter: 'blur(64px)' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(34, 211, 238, 0.1)', filter: 'blur(64px)' }} />

      <div className="relative z-10 min-h-screen flex flex-col justify-end pb-24 px-6 sm:px-12 lg:px-20">
        <div className="max-w-2xl">
          {/* 终端 kicker(等宽青色标签) */}
          <p className="hero-kicker animate-fade-in" style={{ animationDelay: '0.05s' }}>
            DIGITAL TWIN SYSTEM // ONLINE
          </p>
        
          {/* 技术标签(品牌色) */}
          <div className="flex flex-wrap gap-2 mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {heroTags.map((tag) => (
              <span
                key={tag.label}
                className="frost-pill inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  color: tag.color,
                  borderColor: `${tag.color}50`,
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {profile.title}
          </h1>
          <p className="text-primary-400 font-medium tracking-widest uppercase text-sm mb-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            {profile.nameEn}
          </p>

          {/* 简介 */}
          <p className="text-gray-400 max-w-xl leading-relaxed mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {profile.bio}
          </p>

          {/* 社交图标 */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {socials.map((s) => (
              <div
                key={s.title}
                title={s.title}
                className="frost-icon-btn w-10 h-10 rounded-full flex items-center justify-center text-gray-400 cursor-default"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={s.path} />
                </svg>
              </div>
            ))}
          </div>

          {/* CTA 按钮 */}
          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <a href="#projects" className="btn-primary">
              {uiTexts.heroCtaPrimary}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a href="#about" className="btn-outline">
              {uiTexts.heroCtaSecondary}
            </a>
          </div>
        </div>
      </div>

      {/* 终端数据读数(纯 CSS 静态装饰,移动端隐藏) */}
      <div className="hero-terminal hidden sm:block">
        <div className="hero-terminal-line"><span>LAT</span><b>31.2304°N</b></div>
        <div className="hero-terminal-line"><span>LON</span><b>121.4737°E</b></div>
        <div className="hero-terminal-line"><span>ALT</span><b>042.8M</b></div>
        <div className="hero-terminal-line"><span>SYS</span><b className="ok">ONLINE</b></div>
      </div>
    </section>
  );
}
