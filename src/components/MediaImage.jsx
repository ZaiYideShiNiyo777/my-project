import React, { useState } from 'react';
import { useMediaSource } from '../hooks/useMediaSource';

// 图片:assets/ 相对路径自动从 IndexedDB 取暂存文件(未部署也能预览);
// 加载失败或仍在解析时降级为渐变占位,保证离线也能看
export default function MediaImage({ src, icon, color, alt, className, onLoad }) {
  const [failed, setFailed] = useState(false);
  const resolved = useMediaSource(src);

  if (failed || !resolved) {
    return (
      <div
        className={`${className} flex items-center justify-center`}
        style={{ background: `linear-gradient(135deg, ${color}25, #101014 70%)` }}
      >
        <span className="text-5xl" style={{ color }}>{icon}</span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      onLoad={(e) => onLoad && onLoad(e.target.naturalWidth, e.target.naturalHeight)}
    />
  );
}
