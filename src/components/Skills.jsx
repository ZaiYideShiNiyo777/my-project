import React, { useEffect, useRef, useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import { skillGroups as defaultSkillGroups, uiTexts as defaultUiTexts } from '../data/resume';

// 单项技能:进入视口时进度条从 0 增长到目标值
function SkillItem({ skill, color, delay }) {
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
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white">{skill.name}</span>
          <span className="text-xs text-gray-500">{skill.pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: visible ? `${skill.pct}%` : '0%', backgroundColor: color }}
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
          <h2 className="section-title">{uiTexts.skillsTitle}</h2>
          <p className="section-subtitle">{uiTexts.skillsSubtitle}</p>
        </div>

        {skillGroups.map((group, gIdx) => (
          <div className="mb-10" key={group.title}>
            <div
              className="text-lg font-semibold text-white mb-4 flex items-center gap-2"
              style={{ transition: '0.6s ease-out', opacity: title.visible ? 1 : 0, transform: title.visible ? 'translateY(0)' : 'translateY(30px)' }}
            >
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: group.color }} />
              {group.title}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.skills.map((skill, i) => (
                <SkillItem key={skill.name} skill={skill} color={group.color} delay={i * 0.08} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
