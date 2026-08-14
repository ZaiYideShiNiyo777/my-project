import React, { useEffect, useState } from 'react';
import MediaImage from './MediaImage';
import { useMediaSource } from '../hooks/useMediaSource';
import RichText from './RichText';

// 视频 MIME:按扩展名判断(后台支持 mp4 / webm 两种格式)
const videoMime = (src) =>
  typeof src === 'string' && src.toLowerCase().indexOf('.webm') > -1 ? 'video/webm' : 'video/mp4';

// 视频:assets/ 相对路径自动从 IndexedDB 取暂存文件(未部署也能播放);失败降级为渐变占位
function VideoStage({ src, poster, icon, color }) {
  const url = useMediaSource(src);
  const posterUrl = useMediaSource(poster);
  const [failed, setFailed] = useState(false);

  if (failed || !url) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}25, #101014 70%)` }}
      >
        <span className="text-5xl" style={{ color }}>{icon}</span>
      </div>
    );
  }

  return (
    <video
      controls
      preload="metadata"
      poster={posterUrl || undefined}
      className="w-full h-full object-cover media-switch"
      onError={() => setFailed(true)}
    >
      <source src={url} type={videoMime(src)} />
      您的浏览器不支持视频播放
    </video>
  );
}

// 视频缩略图:设置了封面图时显示封面,否则显示播放图标
function VideoThumb({ poster, color }) {
  const posterUrl = useMediaSource(poster);
  const [failed, setFailed] = useState(false);

  if (!poster || failed || !posterUrl) {
    return (
      <div
        className="w-full h-full flex items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${color}30, #101014)` }}
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white pl-0.5" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>▶</span>
      </div>
    );
  }

  return (
    <img src={posterUrl} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
  );
}

/**
 * 项目详情弹窗
 * - 展示项目标题 / 描述 / 图片·视频媒体预览(可左右切换、缩略图点选)
 * - 关闭方式:右上角按钮 / 点击遮罩层 / 按 ESC
 */
export default function ProjectModal({ project, onClose }) {
  const [current, setCurrent] = useState(0);
  // 当前图片自然宽高比:长图按自身比例自适应容器,避免被 16:9 裁剪
  const [imgRatio, setImgRatio] = useState(null);
  const media = project.media && project.media.length ? project.media : [];
  const item = media[Math.min(current, Math.max(media.length - 1, 0))] || {};
  const isVideo = item.type === 'video';

  // 切换媒体时重置图片比例(等待新图加载后重新测量)
  useEffect(() => {
    setImgRatio(null);
  }, [item.src]);

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

  // 主媒体容器:视频固定 16:9;图片按自然比例自适应(宽图 16:9 无裁剪,
  // 长图按图片比例完整显示并限制最大高度,居中不裁切)
  const stageStyle = isVideo
    ? { aspectRatio: '16 / 9' }
    : imgRatio && imgRatio < 16 / 9
      ? { aspectRatio: String(imgRatio), maxHeight: '70vh', marginLeft: 'auto', marginRight: 'auto' }
      : { aspectRatio: '16 / 9' };

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
      <div className="modal-panel relative w-full max-w-3xl max-h-[88vh] overflow-y-auto overflow-x-hidden">
        {/* 头部:HUD 标题栏 */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b"
          style={{ background: 'rgba(16, 21, 29, 0.96)', borderColor: 'rgba(96, 165, 250, 0.14)' }}
        >
          <div className="min-w-0">
            <span className="modal-head-label">PROJECT DETAIL // {String(current + 1).padStart(2, '0')}</span>
            <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{project.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {media.length} 个媒体文件
              {isVideo ? ' · 视频预览' : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label="关闭弹窗" className="modal-close flex-shrink-0">
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 媒体主区域 */}
        <div className="px-5 sm:px-6 pt-5">
          <div className="relative w-full rounded-xl overflow-hidden media-frame" style={{ ...stageStyle, backgroundColor: '#0b0b11' }}>
            {media.length > 0 ? (
              isVideo ? (
                <VideoStage
                  key={item.src}
                  src={item.src}
                  poster={item.poster}
                  icon={project.icon}
                  color={project.color}
                />
              ) : (
                <MediaImage
                  key={item.src}
                  src={item.src}
                  icon={project.icon}
                  color={project.color}
                  alt={`${project.title} 图片 ${current + 1}`}
                  className="w-full h-full object-cover media-switch"
                  onLoad={(w, h) => h > 0 && setImgRatio(w / h)}
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
                  className="absolute w-10 h-10 rounded-full border flex items-center justify-center text-white hover:border-primary-400 transition-all duration-300"
                  style={{ left: 12, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="下一个媒体"
                  className="absolute w-10 h-10 rounded-full border flex items-center justify-center text-white hover:border-primary-400 transition-all duration-300"
                  style={{ right: 12, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* 序号徽章(等宽读数) */}
            <span
              className="absolute px-2.5 py-1 rounded-md text-xs text-gray-300 pointer-events-none"
              style={{ bottom: 12, right: 12, backgroundColor: 'rgba(7, 9, 13, 0.78)', border: '1px solid rgba(96, 165, 250, 0.3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
            >
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
                    i === current ? 'thumb-active' : 'border-gray-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  {m.type === 'video' ? (
                    <VideoThumb poster={m.poster} color={project.color} />
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

        {/* 描述:多行文本按段落渲染 */}
        <div className="px-5 sm:px-6 py-5">
          <RichText text={project.desc} className="text-sm text-gray-400" />
        </div>
      </div>
    </div>
  );
}
