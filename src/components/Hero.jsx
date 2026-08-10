import React from 'react';
import { profile as defaultProfile, heroTags as defaultHeroTags, socials as defaultSocials, uiTexts as defaultUiTexts } from '../data/resume';

export default function Hero({ profile = defaultProfile, heroTags = defaultHeroTags, socials = defaultSocials, uiTexts = defaultUiTexts }) {
  return (
    <section id="home" className="relative min-h-screen w-full overflow-hidden">
      {/* 首屏可读性渐变遮罩(全局动态背景由 App 提供,这里只负责文字清晰度) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#101010]/65 via-[#101010]/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#101010]/80 via-[#101010]/10 to-transparent pointer-events-none" />

      {/* 氛围光球 */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col justify-end pb-24 px-6 sm:px-12 lg:px-20">
        <div className="max-w-2xl">
          {/* 技术标签（品牌色） */}
          <div className="flex flex-wrap gap-2 mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {heroTags.map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm"
                style={{
                  color: tag.color,
                  borderColor: `${tag.color}50`,
                  backgroundColor: `${tag.color}10`,
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
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary-400/50 hover:bg-primary-500/15 hover:scale-125 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 cursor-default"
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
    </section>
  );
}
