import React, { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Wrench, RotateCw } from 'lucide-react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  onSelect: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

/** 业务组件通过派发自定义事件注册自定义右键菜单项；未注册时回落到默认菜单 */
export const CONTEXT_MENU_EVENT = 'app:context-menu';

export const showContextMenu = (x: number, y: number, items: ContextMenuItem[]) => {
  window.dispatchEvent(new CustomEvent(CONTEXT_MENU_EVENT, { detail: { x, y, items } }));
};

const DEFAULT_ITEMS: ContextMenuItem[] = [];

export default function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, items: DEFAULT_ITEMS });
  const menuRef = useRef<HTMLDivElement>(null);

  const open = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    // 防止菜单贴出视口边缘
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - items.length * 36 - 16;
    setMenu({ visible: true, x: Math.min(x, maxX), y: Math.min(y, maxY), items });
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // 业务组件已通过自定义事件接管时跳过默认菜单
    if (e.defaultPrevented) return;
    e.preventDefault();
    open(e.clientX, e.clientY, DEFAULT_ITEMS);
  }, [open]);

  const handleCustomMenu = useCallback((e: Event) => {
    e.preventDefault();
    const detail = (e as CustomEvent).detail as { x: number; y: number; items: ContextMenuItem[] };
    if (detail?.items?.length) {
      open(detail.x, detail.y, detail.items);
    }
  }, [open]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenu(prev => ({ ...prev, visible: false }));
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F12') {
      e.preventDefault();
      invoke('toggle_devtools');
    }
    if (e.key === 'Escape') {
      setMenu(prev => ({ ...prev, visible: false }));
    }
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener(CONTEXT_MENU_EVENT, handleCustomMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener(CONTEXT_MENU_EVENT, handleCustomMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleContextMenu, handleCustomMenu, handleClick, handleKeyDown]);

  const handleOpenDevtools = async () => {
    await invoke('toggle_devtools');
    setMenu(prev => ({ ...prev, visible: false }));
  };

  const handleReload = () => {
    window.location.reload();
    setMenu(prev => ({ ...prev, visible: false }));
  };

  if (!menu.visible) return null;

  const isDefault = menu.items === DEFAULT_ITEMS;

  return (
    <div
      ref={menuRef}
      className="fixed z-[99999] min-w-[180px] overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated p-1 shadow-lg"
      style={{ top: menu.y, left: menu.x }}
    >
      {menu.items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 && <div className="my-1 h-px bg-border-subtle" />}
          <MenuItem
            onClick={() => { item.onSelect(); setMenu(prev => ({ ...prev, visible: false })); }}
            icon={item.icon}
            text={item.label}
            shortcut={item.shortcut}
            danger={item.danger}
          />
        </React.Fragment>
      ))}
      {isDefault && (
        <>
          <MenuItem onClick={handleOpenDevtools} icon={<Wrench className="h-3.5 w-3.5" />} text="开发者工具" shortcut="F12" />
          <div className="my-1 h-px bg-border-subtle" />
          <MenuItem onClick={handleReload} icon={<RotateCw className="h-3.5 w-3.5" />} text="重新加载" />
        </>
      )}
    </div>
  );
}

function MenuItem({ onClick, icon, text, shortcut, danger }: {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
  shortcut?: string;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer select-none items-center rounded-md px-4 py-2 text-[13px] transition-colors hover:bg-bg-hover ${
        danger ? 'text-danger' : 'text-ink'
      }`}
    >
      {icon && <span className={`mr-2.5 ${danger ? 'text-danger' : 'text-ink-muted'}`}>{icon}</span>}
      <span className="flex-1">{text}</span>
      {shortcut && (
        <span className="ml-4 rounded-sm bg-bg-subtle px-1.5 py-0.5 text-[11px] text-ink-muted">{shortcut}</span>
      )}
    </div>
  );
}
