import React, { useEffect, useRef, useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import { skillGroups as defaultSkillGroups, uiTexts as defaultUiTexts } from '../data/resume';

// 单项技能:进入视口时进度条从 0 增长到目标值
function SkillItem({ skill, color, delay, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0px)' : 'translateX(40px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
      }}
    >
      <div className="glow-card p-4 skill-hover-card h-full" style={{ '--glow-color': color }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="skill-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-sm font-medium text-white">{skill.name}</span>
          <span className="skill-pct">{skill.pct}%</span>
        </div>
        <div className="skill-track">
          <div
            className="skill-fill"
            style={{
              width: visible ? `${skill.pct}%` : '0%',
              background: `linear-gradient(90deg, ${color}, #22d3ee)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Skills({ skillGroups = defaultSkillGroups, uiTexts = defaultUiTexts }) {
  const title = useScrollReveal();

  return (
    <section id="skills" className="relative">
      <div className="section-container">
        <div ref={title.ref} style={{ transition: '0.6s ease-out', opacity: title.visible ? 1 : 0, transform: title.visible ? 'translateY(0)' : 'translateY(30px)' }}>
          <h2 className="section-title" data-index="03" data-kicker="CAPABILITY MATRIX">{uiTexts.skillsTitle}</h2>
          <p className="section-subtitle">{uiTexts.skillsSubtitle}</p>
        </div>

        {skillGroups.map((group, gIdx) => (
          <div className="mb-10" key={group.title}>
            <div
              className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
              style={{ transition: '0.6s ease-out', opacity: title.visible ? 1 : 0, transform: title.visible ? 'translateY(0)' : 'translateY(30px)' }}
            >
              <span
                className="w-2 h-2 inline-block"
                style={{ backgroundColor: group.color, color: group.color, transform: 'rotate(45deg)', borderRadius: 2, boxShadow: `0 0 8px ${group.color}` }}
              />
              {group.title}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.skills.map((skill, i) => (
                <SkillItem key={skill.name} skill={skill} color={group.color} delay={i * 0.08} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
