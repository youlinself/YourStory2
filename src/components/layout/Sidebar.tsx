import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/dialogue', label: '对话创作', icon: '💬' },
    { path: '/autobiography', label: '我的自传', icon: '📖' },
    { path: '/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          创作工具
        </h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;