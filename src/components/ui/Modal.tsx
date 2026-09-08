import React, { useEffect, useState, useCallback, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const onCloseRef = useRef(onClose);

  // 保持 onClose 引用最新
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // 使用 requestAnimationFrame 确保动画触发
      const rafId = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => {
        document.body.style.overflow = 'unset';
        cancelAnimationFrame(rafId);
      };
    } else {
      // 当 isOpen 变为 false 时，直接重置状态
      setIsVisible(false);
      setIsLeaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLeaving) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLeaving]);

  const handleClose = useCallback(() => {
    if (isLeaving) return; // 防止重复点击
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onCloseRef.current();
    }, 200);
  }, [isLeaving]);

  // 阻止弹窗内部点击事件冒泡到蒙层
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen && !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 蒙层 - 保持现有效果 */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible && !isLeaving ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      {/* 弹窗主体 - 使用纯色背景 */}
      <div
        className={`relative bg-bg-elevated rounded-2xl border border-border-subtle ${size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg'} w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-200 ${
          isVisible && !isLeaving
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95'
        } ${className}`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
        onClick={handleModalClick}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-subtle/50">
            <h3 className="text-base font-semibold text-ink">
              {title}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-subtle transition-colors ml-4 text-ink-muted hover:text-ink"
              aria-label="关闭"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
