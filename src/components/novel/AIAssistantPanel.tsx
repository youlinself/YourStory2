import React, { useState } from 'react';

interface AIAssistantPanelProps {
  onAssist: (
    type: 'continue' | 'polish' | 'expand' | 'suggest',
    selectedText?: string
  ) => Promise<string | string[] | null>;
  onInsertText: (text: string) => void;
}

type AssistantTab = 'write' | 'inspire' | 'name';

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  onAssist,
  onInsertText,
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('write');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nameType, setNameType] = useState<'character' | 'location' | 'skill' | 'item'>('character');
  const [nameDescription, setNameDescription] = useState('');

  const handleAssist = async (type: 'continue' | 'polish' | 'expand' | 'suggest') => {
    setIsLoading(true);
    setResult('');
    setSuggestions([]);

    try {
      const response = await onAssist(type);
      if (Array.isArray(response)) {
        setSuggestions(response);
      } else if (typeof response === 'string') {
        setResult(response);
      }
    } catch (error) {
      setResult('请求失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameGenerate = async () => {
    if (!nameDescription.trim()) return;

    setIsLoading(true);
    setSuggestions([]);

    try {
      const NovelAIService = (await import('../../services/ai/NovelAIService')).default;
      const { default: useAIStore } = await import('../../stores/aiStore');
      const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore.getState();

      if (!apiKey) {
        setResult('请先在设置页面配置AI API Key');
        setIsLoading(false);
        return;
      }

      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature,
        customModelName,
      });

      const names = await aiService.generateNameSuggestions(nameType, nameDescription);
      setSuggestions(names);
    } catch {
      setResult('生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspire = async (type: 'plot' | 'character' | 'scene' | 'dialogue' | 'theme') => {
    setIsLoading(true);
    setResult('');

    try {
      const NovelAIService = (await import('../../services/ai/NovelAIService')).default;
      const { default: useAIStore } = await import('../../stores/aiStore');
      const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore.getState();

      if (!apiKey) {
        setResult('请先在设置页面配置AI API Key');
        setIsLoading(false);
        return;
      }

      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature,
        customModelName,
      });

      const inspiration = await aiService.generateInspiration(type);
      setResult(inspiration);
    } catch {
      setResult('生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-72 border-l border-border-subtle flex flex-col bg-bg-base">
      <div className="flex border-b border-border-subtle">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'write'
              ? 'text-brand border-b-2 border-brand'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setActiveTab('write')}
        >
          写作助手
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'inspire'
              ? 'text-brand border-b-2 border-brand'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setActiveTab('inspire')}
        >
          灵感
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'name'
              ? 'text-brand border-b-2 border-brand'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setActiveTab('name')}
        >
          命名
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'write' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="p-2 rounded-lg bg-bg-subtle hover:bg-brand/10 hover:text-brand transition-colors text-center"
                onClick={() => handleAssist('continue')}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-[10px]">续写</span>
              </button>
              <button
                className="p-2 rounded-lg bg-bg-subtle hover:bg-brand/10 hover:text-brand transition-colors text-center"
                onClick={() => handleAssist('polish')}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span className="text-[10px]">润色</span>
              </button>
              <button
                className="p-2 rounded-lg bg-bg-subtle hover:bg-brand/10 hover:text-brand transition-colors text-center"
                onClick={() => handleAssist('expand')}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <span className="text-[10px]">扩写</span>
              </button>
              <button
                className="p-2 rounded-lg bg-bg-subtle hover:bg-brand/10 hover:text-brand transition-colors text-center"
                onClick={() => handleAssist('suggest')}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <span className="text-[10px]">情节建议</span>
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>AI思考中...</span>
                </div>
              </div>
            )}

            {result && (
              <div className="p-3 rounded-lg bg-bg-subtle border border-border-subtle">
                <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{result}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    className="btn btn-primary btn-sm text-xs flex-1"
                    onClick={() => {
                      onInsertText(result);
                      setResult('');
                    }}
                  >
                    插入文本
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-xs"
                    onClick={() => setResult('')}
                  >
                    清除
                  </button>
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-bg-subtle border border-border-subtle hover:border-brand cursor-pointer transition-colors"
                    onClick={() => {
                      onInsertText(suggestion);
                      setSuggestions([]);
                    }}
                  >
                    <p className="text-xs text-ink">{suggestion}</p>
                  </div>
                ))}
                <button
                  className="w-full btn btn-ghost btn-sm text-xs"
                  onClick={() => setSuggestions([])}
                >
                  清除
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspire' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">点击获取灵感：</p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'plot', label: '情节', icon: '🎭' },
                { type: 'character', label: '角色', icon: '👤' },
                { type: 'scene', label: '场景', icon: '🌄' },
                { type: 'dialogue', label: '对话', icon: '💬' },
                { type: 'theme', label: '主题', icon: '💡' },
              ].map(({ type, label, icon }) => (
                <button
                  key={type}
                  className="p-3 rounded-lg bg-bg-subtle hover:bg-brand/10 hover:border-brand border border-transparent transition-all text-center"
                  onClick={() => handleInspire(type as any)}
                  disabled={isLoading}
                >
                  <span className="text-lg mb-1 block">{icon}</span>
                  <span className="text-xs text-ink-muted">{label}</span>
                </button>
              ))}
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>生成中...</span>
                </div>
              </div>
            )}

            {result && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg">💡</span>
                  <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap flex-1">{result}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary btn-sm text-xs flex-1"
                    onClick={() => {
                      onInsertText(result);
                      setResult('');
                    }}
                  >
                    使用这个灵感
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-xs"
                    onClick={() => setResult('')}
                  >
                    换一个
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'name' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">命名类型</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { type: 'character', label: '角色' },
                  { type: 'location', label: '地点' },
                  { type: 'skill', label: '技能' },
                  { type: 'item', label: '物品' },
                ].map(({ type, label }) => (
                  <button
                    key={type}
                    className={`px-2 py-1.5 rounded text-[10px] transition-all ${
                      nameType === type
                        ? 'bg-brand text-white'
                        : 'bg-bg-subtle text-ink-muted hover:bg-brand/10'
                    }`}
                    onClick={() => setNameType(type as any)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-ink-muted mb-1 block">描述特征</label>
              <textarea
                className="input text-xs min-h-[60px]"
                placeholder="描述你想要的特征..."
                value={nameDescription}
                onChange={(e) => setNameDescription(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-sm w-full"
              onClick={handleNameGenerate}
              disabled={isLoading || !nameDescription.trim()}
            >
              {isLoading ? '生成中...' : '生成名字'}
            </button>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-xs text-ink-faint">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>生成中...</span>
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-ink-muted">生成的名字：</p>
                {suggestions.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-bg-subtle border border-border-subtle hover:border-brand cursor-pointer transition-colors"
                    onClick={() => {
                      onInsertText(name);
                      setSuggestions([]);
                    }}
                  >
                    <span className="text-sm text-ink">{name}</span>
                    <button className="text-xs text-brand hover:underline">
                      使用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantPanel;
