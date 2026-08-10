import React, { useEffect, useState } from 'react';

// 图片(加载失败时降级为渐变占位,保证离线也能看)
function MediaImage({ src, icon, color, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`${className} flex items-center justify-center`}
        style={{ background: `linear-gradient(135deg, ${color}25, #101014 70%)` }}
      >
        <span className="text-5xl" style={{ color }}>{icon}</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

/**
 * 项目详情弹窗
 * - 展示项目标题 / 描述 / 图片·视频媒体预览(可左右切换、缩略图点选)
 * - 关闭方式:右上角按钮 / 点击遮罩层 / 按 ESC
 */
export default function ProjectModal({ project, onClose }) {
  const [current, setCurrent] = useState(0);
  const media = project.media && project.media.length ? project.media : [];
  const item = media[Math.min(current, Math.max(media.length - 1, 0))] || {};
  const isVideo = item.type === 'video';

  // ESC 关闭 + 打开时锁定背景滚动
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const step = (dir) => setCurrent((c) => (c + dir + media.length) % media.length);

  return (
    <div
      className="modal-overlay fixed inset-0 flex items-center justify-center p-4 sm:p-6"
      style={{
        zIndex: 100,
        background: 'rgba(8, 8, 12, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div className="modal-panel relative w-full max-w-3xl max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-gray-700/60 bg-[#14141b] shadow-2xl shadow-black/60">
        {/* 头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-gray-800/80 bg-[#14141b]/95 backdrop-blur-sm">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{project.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {media.length} 个媒体文件
              {isVideo ? ' · 视频预览' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭弹窗"
            className="flex-shrink-0 w-9 h-9 rounded-full border border-gray-700 bg-gray-800/60 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary-400/60 hover:bg-gray-700 transition-all duration-300"
          >
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 媒体主区域 */}
        <div className="px-5 sm:px-6 pt-5">
          <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-black/40" style={{ aspectRatio: '16 / 9' }}>
            {media.length > 0 ? (
              isVideo ? (
                <video
                  key={item.src}
                  controls
                  preload="metadata"
                  poster={item.poster}
                  className="w-full h-full object-cover media-switch"
                >
                  <source src={item.src} type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
              ) : (
                <MediaImage
                  key={item.src}
                  src={item.src}
                  icon={project.icon}
                  color={project.color}
                  alt={`${project.title} 图片 ${current + 1}`}
                  className="w-full h-full object-cover media-switch"
                />
              )
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${project.color}25, #101014 70%)` }}
              >
                <span className="text-6xl" style={{ color: project.color }}>{project.icon}</span>
              </div>
            )}

            {/* 左右切换按钮 */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() => step(-1)}
                  aria-label="上一个媒体"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-black/75 hover:border-primary-400/60 transition-all duration-300"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="下一个媒体"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-black/75 hover:border-primary-400/60 transition-all duration-300"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* 序号徽章 */}
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 text-xs text-gray-300 pointer-events-none">
              {current + 1} / {media.length}
            </span>
          </div>

          {/* 缩略图切换 */}
          {media.length > 1 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
              {media.map((m, i) => (
                <button
                  key={m.src}
                  onClick={() => setCurrent(i)}
                  aria-label={`查看第 ${i + 1} 个媒体`}
                  className={`flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === current ? 'border-primary-400 shadow-lg shadow-primary-500/20' : 'border-gray-700/70 opacity-60 hover:opacity-100'
                  }`}
                >
                  {m.type === 'video' ? (
                    <div
                      className="w-full h-full flex items-center justify-center relative"
                      style={{ background: `linear-gradient(135deg, ${project.color}30, #101014)` }}
                    >
                      <span className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-[10px] text-white pl-0.5">▶</span>
                    </div>
                  ) : (
                    <MediaImage
                      src={m.src}
                      icon={project.icon}
                      color={project.color}
                      alt={`${project.title} 缩略图 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 描述 */}
        <div className="px-5 sm:px-6 py-5">
          <p className="text-sm leading-relaxed text-gray-400">{project.desc}</p>
        </div>
      </div>
    </div>
  );
}
