import React, { useEffect, useRef, useState } from 'react';
import { ADMIN_PASS } from '../data/resumeStore';

// ============================================================
// 后台管理口令验证层
// - 入口:顶部导航栏"管理"按钮,或地址栏访问 #admin
// - 输入正确口令后进入后台管理面板;错误时仅提示,不暴露任何管理信息
// - 关闭方式:取消按钮 / 点击遮罩层 / 按 ESC
// ============================================================
export default function AuthGate({ onSuccess, onCancel }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  // ESC 关闭 + 锁定背景滚动
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 自动聚焦输入框
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  const submit = (e) => {
    e.preventDefault();
    if (value === ADMIN_PASS) {
      onSuccess();
    } else {
      setError(true);
      setValue('');
      inputRef.current && inputRef.current.focus();
    }
  };

  return (
    <div
      className="auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="访问验证"
    >
      <form className="auth-card modal-panel" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-white mb-1">管理验证</h2>
        <p className="text-xs text-gray-500 mb-4">请输入管理口令以继续</p>

        <input
          ref={inputRef}
          type="password"
          className="admin-input"
          placeholder="管理口令"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          autoComplete="off"
        />

        {error && <p className="text-xs text-red-400 mt-2">口令不正确,请重试</p>}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" className="admin-btn-ghost" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="admin-btn-primary">
            进入
          </button>
        </div>
      </form>
    </div>
  );
}
