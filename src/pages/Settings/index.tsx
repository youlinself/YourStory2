import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAIStore } from '../../stores';
import { useToast } from '../../components';

const Settings: React.FC = () => {
  const { apiKey, model, baseUrl, vendor, temperature, maxOutputTokens, loadSettings, saveSettings, setApiKey, setModel, setBaseUrl, setVendor, setTemperature, setMaxOutputTokens } = useAIStore();
  const { addToast } = useToast();

  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);
  const [localVendor, setLocalVendor] = useState(vendor);
  const [localTemperature, setLocalTemperature] = useState(temperature);
  const [localMaxOutputTokens, setLocalMaxOutputTokens] = useState(maxOutputTokens);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setLocalApiKey(apiKey);
    setLocalModel(model);
    setLocalBaseUrl(baseUrl);
    setLocalVendor(vendor);
    setLocalTemperature(temperature);
    setLocalMaxOutputTokens(maxOutputTokens);
  }, [apiKey, model, baseUrl, vendor, temperature, maxOutputTokens]);

  const handleSave = async () => {
    try {
      setApiKey(localApiKey);
      setModel(localModel);
      setBaseUrl(localBaseUrl);
      setVendor(localVendor);
      setTemperature(localTemperature);
      setMaxOutputTokens(localMaxOutputTokens);
      await saveSettings();
      addToast({
        type: 'success',
        message: '设置已保存',
        duration: 3000,
      });
    } catch {
      addToast({
        type: 'error',
        message: '保存失败，请重试',
        duration: 4000,
      });
    }
  };

  const navItems = [
    { id: 'home', label: '首页', path: '/' },
    { id: 'dialogue', label: '对话创作', path: '/dialogue' },
    { id: 'autobiography', label: '我的自传', path: '/autobiography' },
    { id: 'settings', label: '设置', path: '/settings' },
  ];

  const [activeNav, setActiveNav] = useState('settings');

  const aiModels = [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo - 最强大模型', selected: false },
    { value: 'gpt-4', label: 'GPT-4 - 稳定可靠', selected: true },
    { value: 'claude-3', label: 'Claude 3 - 长文本优秀', selected: false },
    { value: 'deepseek-chat', label: 'DeepSeek - 国产大模型', selected: false },
  ];

  const [selectedModel, setSelectedModel] = useState('gpt-4');

  const writingPreferences = [
    { id: 'auto-save', label: '自动保存草稿', description: '每 30 秒自动保存当前编辑内容', checked: true },
    { id: 'auto-extract', label: '自动提取事件', description: '对话中自动识别并记录关键事件', checked: true },
    { id: 'gentle-guide', label: '温柔引导模式', description: 'AI 以温和渐进的方式引导对话', checked: true },
    { id: 'notifications', label: '发送通知', description: '定时提醒与创作建议推送', checked: false },
  ];

  const [prefs, setPrefs] = useState(writingPreferences);

  const handleTogglePref = (id: string) => {
    setPrefs(prefs.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  };

  return (
    <div className="main-area flex h-full">
      <aside className="w-[240px] bg-bg-elevated border-r border-border-subtle flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-md flex items-center justify-center bg-brand">
            <span className="text-white font-bold text-sm">YS</span>
          </div>
          <span className="font-semibold text-ink text-[0.9375rem] text-serif">YourStory</span>
        </div>

        <nav className="px-3 flex-1">
          <div className="mb-2 px-2">
            <span className="text-[0.6875rem] font-medium uppercase text-ink-faint" style={{ letterSpacing: '0.05em' }}>创作</span>
          </div>
          <ul className="space-y-1">
            {navItems.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`nav-link ${item.id === activeNav ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 mb-2 px-2">
            <span className="text-[0.6875rem] font-medium uppercase text-ink-faint" style={{ letterSpacing: '0.05em' }}>设置</span>
          </div>
          <ul className="space-y-1">
            <li>
              <Link
                to="/settings"
                className="nav-link active"
              >
                设置
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-border-subtle">
          <p className="text-xs text-ink-faint">YourStory v1.0.0</p>
          <p className="text-xs text-ink-faint mt-1">本应用数据存储在本地</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-bg">
        <div className="max-w-3xl mx-auto px-8 py-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-ink text-serif">设置</h1>
              <p className="text-sm text-ink-muted mt-1">配置 AI 参数与写作偏好，打造专属创作体验</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-8 pt-4">
            <button className="btn btn-ghost border border-border px-5">取消</button>
            <button onClick={handleSave} className="btn btn-primary px-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              保存设置
            </button>
          </div>

          <section className="mb-6 card p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-md bg-brand-surface flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">AI 配置</h2>
                <p className="text-xs text-ink-muted mt-0.5">配置 API 密钥与 AI 模型参数</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-ink-secondary mb-2">API Key</label>
              <div className="flex gap-2">
                <input type="password" className="input flex-1" placeholder="sk-..." value={localApiKey ? 'sk-proj-xxxxxxxxxxxxxxxx' : ''} readOnly={!!apiKey} />
                <button className="btn btn-primary shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  保存
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-muted">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span>密钥仅存储在本地浏览器，不会上传至任何服务器</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-ink-secondary mb-2">模型选择</label>
              <div className="grid grid-cols-2 gap-3">
                {aiModels.map((m) => (
                  <div
                    key={m.value}
                    onClick={() => { setSelectedModel(m.value); setLocalModel(m.value); }}
                    className={`model-card border rounded-md p-3 cursor-pointer transition-all hover:border-brand relative ${
                      selectedModel === m.value ? 'selected' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">{m.label.split(' - ')[0]}</span>
                      <svg className="model-check w-4 h-4 text-brand opacity-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-ink-muted">{m.label.split(' - ')[1]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink-secondary">创意程度</label>
                <span className="text-xs font-medium text-brand bg-brand-surface px-2 py-0.5 rounded-full">
                  {localTemperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localTemperature}
                onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
                className="range-slider"
              />
              <div className="flex justify-between mt-1.5 text-xs text-ink-faint">
                <span>精确稳定</span>
                <span>富有创意</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-2">系统提示词</label>
              <textarea
                value="你是一位富有同理心的写作引导者，擅长通过温柔的问题帮助用户回忆和表达生命中的故事。请以耐心、尊重的态度与用户对话。"
                className="input resize-none"
                rows={4}
                placeholder="自定义系统提示词..."
                readOnly
              />
            </div>
          </section>

          <section className="mb-6 card p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-md bg-gold-light flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">写作偏好</h2>
                <p className="text-xs text-ink-muted mt-0.5">自定义写作流程与交互方式</p>
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              {prefs.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{pref.label}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{pref.description}</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={pref.checked}
                      onChange={() => handleTogglePref(pref.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8 card p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-md bg-sage-light flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">数据与隐私</h2>
                <p className="text-xs text-ink-muted mt-0.5">管理本地数据存储与导出</p>
              </div>
            </div>

            <div className="bg-success-bg border border-success/15 rounded-md p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.678c1.026.557 1.75 1.66 1.75 2.893v7.104c0 1.342-.978 2.452-2.25 2.95m-14.5 0c-1.272-.498-2.25-1.608-2.25-2.95V9.571c0-1.233.724-2.336 1.75-2.893m14.5 0a2.25 2.25 0 00-1.75-.828H5.75a2.25 2.25 0 00-1.75.828m14.5 0l-1.75 1.012-3.5 2.025-3.5-2.025-1.75-1.012" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-ink">本地数据存储</p>
                  <p className="text-xs text-ink-muted">所有数据均安全保存在您的设备中</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success text-white">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                已启用
              </span>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-ghost border border-border">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                导出所有数据
              </button>
              <button className="btn btn-ghost border border-danger text-danger hover:bg-danger-bg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                清除所有数据
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
