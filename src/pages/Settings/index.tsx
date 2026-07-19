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
    <div className="content-panel">
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
    </div>
  );
};

export default SettingsPage;
