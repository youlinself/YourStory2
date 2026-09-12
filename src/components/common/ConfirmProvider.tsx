import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmContextValue {
  /** Promise 化确认框：resolve(true) 表示用户确认，resolve(false) 表示取消 */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = (): ConfirmContextValue['confirm'] => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const pendingRef = useRef<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    // 若已有待确认项，先以"取消"结清，避免 Promise 悬挂
    pendingRef.current?.resolve(false);
    return new Promise<boolean>((resolve) => {
      const next = { ...options, resolve };
      pendingRef.current = next;
      setPending(next);
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    pendingRef.current?.resolve(confirmed);
    pendingRef.current = null;
    setPending(null);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={pending !== null}
        onClose={() => settle(false)}
        onConfirm={() => settle(true)}
        title={pending?.title || ''}
        description={pending?.description}
        confirmText={pending?.confirmText}
        cancelText={pending?.cancelText}
        confirmVariant={pending?.confirmVariant}
      />
    </ConfirmContext.Provider>
  );
};
