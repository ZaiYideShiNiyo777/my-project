import { useEffect, useRef, useState } from 'react';

/**
 * 滚动进入视口时的渐入动画 Hook
 * @param {object} options - 可选: { threshold, rootMargin }
 * @returns {{ ref, visible }} - ref 绑定到目标元素, visible 表示是否已进入视口
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
