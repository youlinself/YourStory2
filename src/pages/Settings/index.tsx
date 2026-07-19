import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

const SettingsPage: React.FC = () => {
  useSettingsStore();
  const [selectedModel, setSelectedModel] = useState('claude-sonnet');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [autoSave, setAutoSave] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const models = [
    { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: 'Anthropic', desc: '综合能力均衡，适合传记写作' },
    { id: 'claude-haiku', name: 'Claude Haiku 3.5', provider: 'Anthropic', desc: '响应速度快，适合快速对话' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', desc: '多模态理解能力强' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', desc: '经济实惠，适合日常使用' },
  ];

  return (
    <div className="main-area">
      <aside className="sidebar h-full">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-ink">YourStory</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          <a className="nav-link">
            <span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </span>
            <span>首页</span>
          </a>
          <a className="nav-link">
            <span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </span>
            <span>对话创作</span>
          </a>
          <a className="nav-link">
            <span>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </span>
            <span>我的自传</span>
          </a>
          <a className="nav-link active">
            <span className="text-brand">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>设置</span>
          </a>
        </nav>

        <div className="px-5 py-5 border-t border-border-subtle">
          <p className="text-xs text-ink-faint">版本 v1.0.0</p>
          <p className="text-[11px] text-ink-faint mt-1">© 2024 YourStory</p>
        </div>
      </aside>

      <main className="content-panel">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink mb-6">
            设置
          </h1>

          <div className="space-y-8">
            <section>
              <h2 className="section-title mb-4">AI 配置</h2>
              <div className="card p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">模型选择</label>
                  <div className="grid grid-cols-2 gap-3">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                        onClick={() => setSelectedModel(model.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-ink">{model.name}</span>
                          {selectedModel === model.id && (
                            <svg className="model-check w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted">{model.provider}</p>
                        <p className="text-xs text-ink-faint mt-1">{model.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">API Key</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      type="password"
                      placeholder="输入你的 API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button className="btn btn-outline">验证</button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink">温度参数</label>
                    <span className="text-sm text-ink-muted">{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-ink-faint mt-1">
                    <span>精确</span>
                    <span>创意</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="section-title mb-4">写作偏好</h2>
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">自动保存</p>
                    <p className="text-xs text-ink-faint mt-0.5">每 30 秒自动保存内容</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">深色模式</p>
                    <p className="text-xs text-ink-faint mt-0.5">切换深色主题</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={(e) => setDarkMode(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">消息通知</p>
                    <p className="text-xs text-ink-faint mt-0.5">接收写作提醒</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h2 className="section-title mb-4">数据与隐私</h2>
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">导出所有数据</p>
                    <p className="text-xs text-ink-faint mt-0.5">下载全部传记内容</p>
                  </div>
                  <button className="btn btn-outline text-xs">导出</button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-ink">清除对话历史</p>
                    <p className="text-xs text-ink-faint mt-0.5">删除所有对话记录</p>
                  </div>
                  <button className="btn btn-outline text-xs">清除</button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-danger">删除账户</p>
                    <p className="text-xs text-ink-faint mt-0.5">永久删除账户及所有数据</p>
                  </div>
                  <button className="btn btn-outline text-xs text-danger border-danger/20 hover:bg-danger/5">删除</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
