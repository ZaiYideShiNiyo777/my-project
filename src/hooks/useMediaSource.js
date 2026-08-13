import { useEffect, useState } from 'react';
import { getMediaBlob } from '../utils/mediaStore';

// 与后台一致的 assets/ 相对路径判断(大文件暂存 IndexedDB 的标记)
const isAssetPath = (v) => typeof v === 'string' && v.indexOf('assets/') === 0;

/**
 * 解析媒体展示地址:
 * - assets/ 相对路径:优先从 IndexedDB 取暂存文件生成 blob URL,
 *   未部署时(仅后台刚上传)也能立即预览;取不到说明素材已随项目 assets/ 发布,回退原路径
 * - data: URI / https:// 等:原样返回
 * 返回 null 表示仍在解析中,渲染时应使用 src={url || undefined}
 */
export function useMediaSource(src) {
  const [url, setUrl] = useState(() => (isAssetPath(src) ? null : src));

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;
    if (isAssetPath(src)) {
      setUrl(null);
      getMediaBlob(src)
        .then((blob) => {
          if (cancelled) return;
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            setUrl(objectUrl);
          } else {
            setUrl(src); // 无暂存 → 按原相对路径加载(已部署场景)
          }
        })
        .catch(() => {
          if (!cancelled) setUrl(src);
        });
    } else {
      setUrl(src);
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return url;
}
