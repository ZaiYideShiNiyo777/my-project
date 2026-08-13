import React, { useCallback, useMemo, useRef, useState } from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import ProjectModal from './ProjectModal';
import MediaImage from './MediaImage';
import { useMediaSource } from '../hooks/useMediaSource';
import { uiTexts as defaultUiTexts } from '../data/resume';

const CARD_WIDTH = 280;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;

// 卡片视频封面:自动静音循环播放(首页即可预览视频),失败降级为图标占位
function VideoCover({ src, poster, icon, color }) {
  const url = useMediaSource(src);
  const posterUrl = useMediaSource(poster);
  const [failed, setFailed] = useState(false);

  if (failed || !url) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}20, ${color}05)` }}
      >
        <span className="text-4xl" style={{ color }}>{icon}</span>
      </div>
    );
  }

  return (
    <video
      src={url}
      poster={posterUrl || undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

// 卡片封面:优先展示第一个有内容的媒体(图片/视频),无媒体时显示图标占位
function CardCover({ p }) {
  const first = (p.media || []).find((m) => m.src);
  if (!first) {
    return (
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
    );
  }
  if (first.type === 'video') {
    return <VideoCover src={first.src} poster={first.poster} icon={p.icon} color={p.color} />;
  }
  return (
    <MediaImage
      src={first.src}
      icon={p.icon}
      color={p.color}
      alt={`${p.title} 封面`}
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

export default function Projects({ projects, uiTexts = defaultUiTexts }) {
  const title = useScrollReveal();
  const TOTAL = projects.length;
  // 直接使用真实项目数组:后台有几个项目,前端就展示几个,不克隆、不重复、不补占位
  const list = useMemo(() => projects, [projects]);
  const [index, setIndex] = useState(0); // 当前滑动到的起始卡片下标
  const [animating, setAnimating] = useState(false);
  const [active, setActive] = useState(null);
  const trackRef = useRef(null);

  // 有边界滑动:滑到两端后对应箭头禁用(不做无限循环克隆)
  const canPrev = index > 0;
  const canNext = index < TOTAL - 1;
  const go = (dir) => {
    setAnimating(true);
    setIndex((i) => Math.max(0, Math.min(TOTAL - 1, i + dir)));
  };

  // 一次滑动过渡结束,复位动画状态等待下一次滑动
  const onTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return; // 忽略子元素(hover 等)冒泡的过渡事件
    setAnimating(false);
  };

  const closeModal = useCallback(() => setActive(null), []);

  // 空状态:后台没有任何项目时如实显示「暂无项目」,不渲染占位卡片
  if (TOTAL === 0) {
    return (
      <section id="projects" className="relative">
        <div className="section-container">
          <div
            ref={title.ref}
            style={{
              transition: '0.6s ease-out',
              opacity: title.visible ? 1 : 0,
              transform: title.visible ? 'translateY(0)' : 'translateY(30px)',
            }}
          >
            <h2 className="section-title">{uiTexts.projectsTitle}</h2>
            <p className="section-subtitle">{uiTexts.projectsSubtitle}</p>
          </div>
          <p className="text-center text-gray-500 py-16">暂无项目</p>
        </div>
      </section>
    );
  }

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
            className="absolute left-0 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 hover:border-primary-400/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-800/80 disabled:hover:text-gray-400 disabled:hover:border-gray-700"
            style={{ transform: 'translateX(-50%)' }}
            disabled={!canPrev}
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
                return (
                  <div
                    key={`${p.title}-${i}`}
                    onClick={() => setActive(p)}
                    className="project-card-carousel group cursor-pointer rounded-2xl overflow-hidden bg-gray-900/30 flex-shrink-0"
                    style={{ width: CARD_WIDTH }}
                  >
                    {/* 封面:优先展示第一个媒体(图片/视频),无媒体时显示图标占位 */}
                    <div className="project-card-cover relative overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <CardCover p={p} />

                      {/* hover 遮罩 */}
                      <div className="absolute inset-0 bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="px-4 py-2 bg-primary-500/80 rounded-full text-sm text-white font-medium">查看详情</span>
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
            className="absolute right-0 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800/80 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 hover:border-primary-400/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-800/80 disabled:hover:text-gray-400 disabled:hover:border-gray-700"
            style={{ transform: 'translateX(50%)' }}
            disabled={!canNext}
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
