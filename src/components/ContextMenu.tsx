import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

export default function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, []);

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
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleContextMenu, handleClick, handleKeyDown]);

  const handleOpenDevtools = async () => {
    await invoke('toggle_devtools');
    setMenu(prev => ({ ...prev, visible: false }));
  };

  const handleReload = () => {
    window.location.reload();
    setMenu(prev => ({ ...prev, visible: false }));
  };

  if (!menu.visible) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: menu.y,
        left: menu.x,
        zIndex: 99999,
        background: '#1e1e1e',
        borderRadius: '8px',
        padding: '4px 0',
        minWidth: '180px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        border: '1px solid #333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        color: '#e0e0e0',
        overflow: 'hidden',
      }}
    >
      <MenuItem onClick={handleOpenDevtools} icon="🔧" text="开发者工具" shortcut="F12" />
      <div style={{ height: 1, background: '#333', margin: '4px 0' }} />
      <MenuItem onClick={handleReload} icon="🔄" text="重新加载" />
    </div>
  );
}

function MenuItem({ onClick, icon, text, shortcut }: {
  onClick: () => void;
  icon: string;
  text: string;
  shortcut?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#094771';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ marginRight: 10, fontSize: 14 }}>{icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
      {shortcut && (
        <span style={{
          fontSize: 11,
          color: '#888',
          marginLeft: 16,
          background: '#333',
          padding: '2px 6px',
          borderRadius: 3,
        }}>{shortcut}</span>
      )}
    </div>
  );
}
