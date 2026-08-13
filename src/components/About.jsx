import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import {
  profile as defaultProfile,
  stats as defaultStats,
  coreTechs as defaultCoreTechs,
  projectAreas as defaultProjectAreas,
  uiTexts as defaultUiTexts,
} from '../data/resume';

const revealStyle = (visible) => ({
  transition: '0.6s ease-out',
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0px) translateX(0px)' : 'translateY(30px)',
});

export default function About({
  profile = defaultProfile,
  stats = defaultStats,
  coreTechs = defaultCoreTechs,
  projectAreas = defaultProjectAreas,
  uiTexts = defaultUiTexts,
}) {
  const title = useScrollReveal();
  const left = useScrollReveal();
  const right = useScrollReveal();

  return (
    <section id="about" className="relative">
      <div className="section-container">
        <div ref={title.ref} style={revealStyle(title.visible)}>
          <h2 className="section-title" data-index="01" data-kicker="SYSTEM PROFILE">
            {uiTexts.aboutTitle} <span className="gradient-text">{uiTexts.aboutTitleAccent}</span>
          </h2>
          <p className="section-subtitle">{uiTexts.aboutSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* 左侧：头像 + 基本信息 */}
          <div className="flex flex-col items-center md:items-start" ref={left.ref} style={revealStyle(left.visible)}>
            {/* 头像:全息扫描框(渐变描边 + 网格底纹 + 扫描线) */}
            <div className="w-52 h-52 mb-6">
              <div className="scan-frame w-full h-full">
                <div className="scan-frame-inner flex items-center justify-center">
                  <span className="text-5xl font-bold gradient-text">{profile.avatarChar}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
              <p className="text-primary-400 font-medium">{profile.title}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profile.email}
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：简介 + 指标 + 标签 */}
          <div className="space-y-6" ref={right.ref} style={revealStyle(right.visible)}>
            <p className="text-gray-300 leading-relaxed text-lg">{profile.bio}</p>

            {/* 数据仪表指标 */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="glow-card stat-card p-4 text-center">
                  <div className="stat-value mb-1">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 核心技术栈 */}
            <div>
              <p className="text-sm text-gray-500 mb-3">{uiTexts.aboutCoreLabel}</p>
              <div className="flex flex-wrap gap-2">
                {coreTechs.map((t) => (
                  <span key={t.label} className="tag-pill text-xs" style={{ borderColor: t.color }}>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* 项目经验标签 */}
            <div>
              <p className="text-sm text-gray-500 mb-3">{uiTexts.aboutAreaLabel}</p>
              <div className="flex flex-wrap gap-2">
                {projectAreas.map((t) => (
                  <span
                    key={t.label}
                    className="frost-pill px-3 py-2 rounded-lg text-xs font-medium"
                    style={{
                      borderColor: `${t.color}40`,
                      color: t.color,
                    }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
