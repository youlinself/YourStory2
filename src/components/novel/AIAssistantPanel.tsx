import React, { useState, useCallback } from 'react';
import type { AIParams, AIHistoryItem } from '../../types';
import { DEFAULT_AI_PARAMS } from '../../types';
import ThinkTankSelector from './ThinkTankSelector';

interface AIAssistantPanelProps {
  onAssist: (
    type: 'continue' | 'polish' | 'expand' | 'suggest',
    params?: AIParams,
    memberId?: string | null
  ) => Promise<string | string[] | null>;
  onInsertText: (text: string) => void;
  history: AIHistoryItem[];
  onClearHistory: () => void;
  onToggleFavorite: (id: string) => void;
  selectedMemberId?: string | null;
  onSelectedMemberChange?: (memberId: string | null) => void;
  selectedText?: string;
}

type AssistantTab = 'write' | 'name' | 'history';

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  onAssist,
  onInsertText,
  history,
  onClearHistory,
  onToggleFavorite,
  selectedMemberId = null,
  onSelectedMemberChange,
  selectedText = '',
}) => {
  const [activeTab, setActiveTab] = useState<AssistantTab>('write');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nameType, setNameType] = useState<'character' | 'location' | 'skill' | 'item'>('character');
  const [nameDescription, setNameDescription] = useState('');
  const [params, setParams] = useState<AIParams>(DEFAULT_AI_PARAMS);
  const [showParams, setShowParams] = useState(false);

  const handleAssist = useCallback(
    async (type: 'continue' | 'polish' | 'expand' | 'suggest') => {
      setIsLoading(true);
      setResult('');
      setSuggestions([]);

      try {
        const response = await onAssist(type, params, selectedMemberId);
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
    },
    [onAssist, params, selectedMemberId]
  );

  const handleRegenerate = useCallback(async () => {
    if (activeTab === 'write') {
      await handleAssist('continue');
    }
  }, [activeTab, handleAssist]);

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

  const renderWriteTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">续写参数</span>
        <button
          className="text-xs text-brand hover:underline"
          onClick={() => setShowParams(!showParams)}
        >
          {showParams ? '收起' : '展开'}
        </button>
      </div>

      {showParams && (
        <div className="space-y-2 p-2 bg-bg-subtle rounded-lg">
          <div>
            <label className="text-[10px] text-ink-faint block mb-1">生成长度</label>
            <div className="flex gap-1">
              {[
                { value: 'short', label: '短篇' },
                { value: 'medium', label: '中篇' },
                { value: 'long', label: '长篇' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`flex-1 px-2 py-1 rounded text-[10px] transition-all ${
                    params.continue.length === opt.value
                      ? 'bg-brand text-white'
                      : 'bg-bg-base text-ink-muted hover:bg-brand/10'
                  }`}
                  onClick={() =>
                    setParams({
                      ...params,
                      continue: { ...params.continue, length: opt.value as 'short' | 'medium' | 'long' },
                    })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-ink-faint block mb-1">写作风格</label>
            <div className="flex gap-1 flex-wrap">
              {[
                { value: 'original', label: '保持原样' },
                { value: 'literary', label: '文学性' },
                { value: 'colloquial', label: '口语化' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={`px-2 py-1 rounded text-[10px] transition-all ${
                    params.continue.style === opt.value
                      ? 'bg-brand text-white'
                      : 'bg-bg-base text-ink-muted hover:bg-brand/10'
                  }`}
                  onClick={() =>
                    setParams({
                      ...params,
                      continue: { ...params.continue, style: opt.value as 'original' | 'literary' | 'colloquial' },
                    })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-ink-faint block mb-1">续写方向</label>
            <input
              type="text"
              className="input text-xs w-full"
              placeholder="可选，如：主角遇到强敌..."
              value={params.continue.direction}
              onChange={(e) =>
                setParams({
                  ...params,
                  continue: { ...params.continue, direction: e.target.value },
                })
              }
            />
          </div>

          <div>
            <label className="text-[10px] text-ink-faint block mb-1">
              创造性: {params.continue.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={params.continue.temperature}
              onChange={(e) =>
                setParams({
                  ...params,
                  continue: { ...params.continue, temperature: parseFloat(e.target.value) },
                })
              }
              className="w-full h-1 bg-bg-base rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

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
          onClick={() => selectedText && handleAssist('polish')}
          disabled={isLoading || !selectedText}
          title={selectedText ? '润色选中文本' : '请先选择要润色的文本'}
        >
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span className="text-[10px]">润色</span>
        </button>
        <button
          className="p-2 rounded-lg bg-bg-subtle hover:bg-brand/10 hover:text-brand transition-colors text-center"
          onClick={() => selectedText && handleAssist('expand')}
          disabled={isLoading || !selectedText}
          title={selectedText ? '扩写选中文本' : '请先选择要扩写的文本'}
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
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={handleRegenerate}
              title="重新生成"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={() => {
                navigator.clipboard.writeText(result);
              }}
              title="复制"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            </button>
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={() => setResult('')}
              title="关闭"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
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
              onClick={() => onInsertText(suggestion)}
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
  );

  const renderNameTab = () => (
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
              <button className="text-xs text-brand hover:underline">使用</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">AI历史记录</span>
        {history.length > 0 && (
          <button
            className="text-xs text-danger hover:underline"
            onClick={onClearHistory}
          >
            清空
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-ink-faint">暂无历史记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-bg-subtle border border-border-subtle"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-ink-faint">
                  {item.type === 'continue'
                    ? '续写'
                    : item.type === 'polish'
                    ? '润色'
                    : item.type === 'expand'
                    ? '扩写'
                    : item.type === 'suggest'
                    ? '建议'
                    : item.type === 'name'
                    ? '命名'
                    : '灵感'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className={`p-1 rounded hover:bg-bg-base transition-colors ${
                      item.isFavorited ? 'text-warning' : 'text-ink-faint'
                    }`}
                    onClick={() => onToggleFavorite(item.id)}
                    title={item.isFavorited ? '取消收藏' : '收藏'}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill={item.isFavorited ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                  <span className="text-[10px] text-ink-faint">
                    {new Date(item.timestamp).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink line-clamp-3 mb-2">{item.output}</p>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm text-[10px] flex-1"
                  onClick={() => onInsertText(item.output)}
                >
                  插入
                </button>
                <button
                  className="btn btn-ghost btn-sm text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(item.output);
                  }}
                >
                  复制
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-72 border-l border-border-subtle flex flex-col bg-bg-base">
      <div className="border-b border-border-subtle">
        <div className="flex">
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
              activeTab === 'name'
                ? 'text-brand border-b-2 border-brand'
                : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setActiveTab('name')}
          >
            命名
          </button>
          <button
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-brand border-b-2 border-brand'
                : 'text-ink-muted hover:text-ink'
            }`}
            onClick={() => setActiveTab('history')}
          >
            历史
          </button>
        </div>
        {onSelectedMemberChange && (
          <div className="px-3 py-2 border-t border-border-subtle/50">
            <ThinkTankSelector
              selectedMemberId={selectedMemberId}
              onSelect={onSelectedMemberChange}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'write' && renderWriteTab()}
        {activeTab === 'name' && renderNameTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};

export default AIAssistantPanel;
