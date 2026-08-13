import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import { experiences as defaultExperiences, uiTexts as defaultUiTexts } from '../data/resume';

const revealStyle = (visible) => ({
  transition: '0.6s ease-out',
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0px) translateX(0px)' : 'translateY(30px)',
});

// 单条经历卡片(独立组件以遵守 Hooks 规则)
function ExperienceItem({ exp }) {
  const reveal = useScrollReveal();
  return (
    <div className="relative pl-16 exp-timeline-item" ref={reveal.ref} style={revealStyle(reveal.visible)}>
      <div className="glow-card p-6 skill-hover-card exp-card-wrapper">
        <div className="exp-timeline-dot" />
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="exp-period">{exp.period}</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">{exp.title}</h3>
        <p className="text-sm text-gray-400 mb-3">{exp.company}</p>
        <p className="text-sm text-gray-500 leading-relaxed">{exp.desc}</p>
      </div>
    </div>
  );
}

export default function Experience({ experiences = defaultExperiences, uiTexts = defaultUiTexts }) {
  const title = useScrollReveal();

  return (
    <section id="experience" className="relative">
      <div className="section-container">
        <div ref={title.ref} style={revealStyle(title.visible)}>
          <h2 className="section-title" data-index="04" data-kicker="WORK HISTORY">{uiTexts.experienceTitle}</h2>
          <p className="section-subtitle">{uiTexts.experienceSubtitle}</p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* 左侧青蓝渐变时间线 */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 timeline-line" />

          <div className="space-y-12">
            {experiences.map((exp) => (
              <ExperienceItem key={exp.title + exp.period} exp={exp} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
