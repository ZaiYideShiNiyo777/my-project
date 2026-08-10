import React, { useCallback, useMemo, useRef, useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import ProjectModal from './ProjectModal';
import { uiTexts as defaultUiTexts } from '../data/resume';

const CARD_WIDTH = 280;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;
// 无限循环方案:把项目列表克隆多份连成一条长轨,
// 在克隆区完成"回卷"后再无动画跳回中间段(首尾内容一致,视觉无感知)
const COPIES = 5;

export default function Projects({ projects, uiTexts = defaultUiTexts }) {
  const title = useScrollReveal();
  const TOTAL = projects.length;
  // 项目数据变化(后台编辑)时重新生成长轨
  const list = useMemo(() => Array.from({ length: COPIES }, () => projects).flat(), [projects]);
  const [index, setIndex] = useState(TOTAL); // 初始指向第一份克隆 → 展示真实第一张
  const [animating, setAnimating] = useState(true);
  const [active, setActive] = useState(null);
  const trackRef = useRef(null);

  // 左右无限循环:直接向两侧滑动,不做边界截断
  const go = (dir) => {
    setAnimating(true);
    setIndex((i) => i + dir);
  };

  // 一次滑动过渡结束后,把下标回卷到中间克隆区(等价位置,无跳变)
  const onTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return; // 忽略子元素(hover 等)冒泡的过渡事件
    setIndex((i) => {
      if (i >= TOTAL && i <= 2 * TOTAL - 1) return i;
      let n = i;
      while (n > 2 * TOTAL - 1) n -= TOTAL;
      while (n < TOTAL) n += TOTAL;
      return n;
    });
    setAnimating(false); // 回卷瞬间禁用过渡,下一帧恢复
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
  };

  const closeModal = useCallback(() => setActive(null), []);

  return (
    <section id="projects" className="relative">
      <div className="section-container">
        <div ref={title.ref} style={{ transition: '0.6s ease-out', opacity: title.visible ? 1 : 0, transform: title.visible ? 'translateY(0)' : 'translateY(30px)' }}>
          <h2 className="section-title">{uiTexts.projectsTitle}</h2>
          <p className="section-subtitle">{uiTexts.projectsSubtitle}</p>
        </div>

        <div className="relative flex items-center justify-center">
          {/* 左箭头 */}
          <button
            className="absolute left-0 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 hover:border-primary-400/50 transition-all duration-300"
            style={{ transform: 'translateX(-50%)' }}
            onClick={() => go(-1)}
            aria-label="上一个项目"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 轮播视口 */}
          <div className="flex items-start gap-4 mx-12 sm:mx-16 overflow-hidden">
            <div
              ref={trackRef}
              className="flex items-start gap-4"
              onTransitionEnd={onTransitionEnd}
              style={{
                transform: `translateX(${-index * STEP}px)`,
                transition: animating ? 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                willChange: 'transform',
              }}
            >
              {list.map((p, i) => {
                // 视频数量徽章:从媒体列表自动统计,后台增删媒体后自动同步
                const videoCount = (p.media || []).filter((m) => m.type === 'video').length;
                return (
                  <div
                    key={`${p.title}-${i}`}
                    onClick={() => setActive(p)}
                    className="project-card-carousel group cursor-pointer rounded-2xl overflow-hidden bg-gray-900/30 flex-shrink-0"
                    style={{ width: CARD_WIDTH }}
                  >
                    {/* 封面 */}
                    <div className="project-card-cover relative overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-gray-800"
                        style={{ background: `linear-gradient(135deg, ${p.color}20, ${p.color}05)` }}
                      >
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${p.color}30`, color: p.color }}
                        >
                          {p.icon}
                        </div>
                      </div>

                      {/* hover 遮罩 */}
                      <div className="absolute inset-0 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="px-4 py-2 bg-primary-500/80 rounded-full text-sm text-white font-medium">查看详情</span>
                      </div>

                      {/* 媒体数量徽章 */}
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-full text-xs text-white flex items-center gap-1 pointer-events-none">
                        <span>🖼 {p.imageCount}</span>
                        {videoCount ? <span>▶ {videoCount}</span> : null}
                      </div>
                    </div>

                    {/* 信息 */}
                    <div className="mt-3 px-3 pb-3">
                      <h3 className="text-base font-semibold transition-colors truncate text-white group-hover:text-primary-400">
                        {p.title}
                      </h3>
                      <p className="text-sm mt-1 line-clamp-2 leading-relaxed text-gray-400">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右箭头 */}
          <button
            className="absolute right-0 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 hover:border-primary-400/50 transition-all duration-300"
            style={{ transform: 'translateX(50%)' }}
            onClick={() => go(1)}
            aria-label="下一个项目"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 项目详情弹窗 */}
      {active && <ProjectModal project={active} onClose={closeModal} />}
    </section>
  );
}
