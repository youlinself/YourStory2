import React, { useEffect, useState, useCallback, useRef } from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
  isLoading = false,
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
      const rafId = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => {
        document.body.style.overflow = 'unset';
        cancelAnimationFrame(rafId);
      };
    } else {
      setIsVisible(false);
      setIsLeaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !isLeaving) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, isLeaving]);

  const handleClose = useCallback(() => {
    if (isLeaving || isLoading) return; // 防止重复点击或加载时关闭
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      onCloseRef.current();
    }, 200);
  }, [isLeaving, isLoading]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

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
        className={`relative bg-bg-elevated rounded-2xl max-w-md w-full mx-4 border border-border-subtle shadow-2xl transition-all duration-200 ${
          isVisible && !isLeaving
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
        onClick={handleModalClick}
      >
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-ink">
            {title}
          </h3>
          {description && (
            <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-border-subtle bg-bg-subtle/30">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
