import React, { useState, useCallback, useMemo } from 'react';
import type { SavedInspiration } from '../../types';
import InspirationImportModal from './InspirationImportModal';
import useAIStore from '../../stores/aiStore';
import NovelAIService from '../../services/ai/NovelAIService';

interface InspirationBoardProps {
  inspirations: SavedInspiration[];
  onInspirationAdd: (inspiration: Omit<SavedInspiration, 'id' | 'createdAt'>) => void;
  onInspirationDelete: (id: string) => void;
  onInspirationUse: (id: string) => void;
}

const getRandomInspiration = (inspirations: SavedInspiration[]): SavedInspiration | null => {
  const unused = inspirations.filter((i) => !i.isUsed);
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
};

const INSPIRATION_TYPE_LABELS: Record<SavedInspiration['type'], string> = {
  plot: '情节',
  character: '角色',
  scene: '场景',
  dialogue: '对话',
  theme: '主题',
};

const INSPIRATION_TYPE_ICONS: Record<SavedInspiration['type'], string> = {
  plot: '📖',
  character: '👤',
  scene: '🌄',
  dialogue: '💬',
  theme: '🎭',
};

const INSPIRATION_TYPE_COLORS: Record<SavedInspiration['type'], string> = {
  plot: '#3b82f6',
  character: '#10b981',
  scene: '#f59e0b',
  dialogue: '#8b5cf6',
  theme: '#ec4899',
};

const InspirationBoard: React.FC<InspirationBoardProps> = ({
  inspirations,
  onInspirationAdd,
  onInspirationDelete,
  onInspirationUse,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filterType, setFilterType] = useState<SavedInspiration['type'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unused' | 'used'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRandom, setShowRandom] = useState(false);
  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);
  const [randomInspiration, setRandomInspiration] = useState<SavedInspiration | null>(null);
  const [newInspiration, setNewInspiration] = useState({
    type: 'plot' as SavedInspiration['type'],
    content: '',
    tags: [] as string[],
    novelId: '',
    chapterId: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSelectedType, setAiSelectedType] = useState<SavedInspiration['type']>('plot');
  const [aiResult, setAiResult] = useState('');

  const filteredInspirations = useMemo(() => {
    let filtered = inspirations;
    if (filterType !== 'all') {
      filtered = filtered.filter((i) => i.type === filterType);
    }
    if (filterStatus === 'unused') {
      filtered = filtered.filter((i) => !i.isUsed);
    } else if (filterStatus === 'used') {
      filtered = filtered.filter((i) => i.isUsed);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.content.toLowerCase().includes(query) ||
          i.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inspirations, filterType, filterStatus, searchQuery]);

  const handleRandomInspiration = useCallback(() => {
    if (inspirations.length === 0) {
      setShowEmptyPrompt(true);
      return;
    }
    const newRandom = getRandomInspiration(inspirations);
    setRandomInspiration(newRandom);
    setShowRandom(true);
  }, [inspirations]);

  const handleImportInspirations = useCallback((newInspirations: Omit<SavedInspiration, 'id' | 'createdAt'>[]) => {
    newInspirations.forEach(inspiration => {
      onInspirationAdd(inspiration);
    });
    setShowImportModal(false);
  }, [onInspirationAdd]);

  const handleAddInspiration = useCallback(() => {
    if (!newInspiration.content.trim()) return;
    onInspirationAdd({
      type: newInspiration.type,
      content: newInspiration.content.trim(),
      tags: newInspiration.tags,
      novelId: newInspiration.novelId || undefined,
      chapterId: newInspiration.chapterId || undefined,
      isUsed: false,
    });
    setNewInspiration({ type: 'plot', content: '', tags: [], novelId: '', chapterId: '' });
    setTagInput('');
    setShowAddModal(false);
  }, [newInspiration, onInspirationAdd]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !newInspiration.tags.includes(tag)) {
      setNewInspiration({ ...newInspiration, tags: [...newInspiration.tags, tag] });
      setTagInput('');
    }
  }, [tagInput, newInspiration]);

  const handleAIGenerate = useCallback(async () => {
    setAiGenerating(true);
    setAiResult('');

    try {
      const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore.getState();

      if (!apiKey) {
        setAiResult('请先在设置页面配置AI API Key');
        setAiGenerating(false);
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

      const inspiration = await aiService.generateInspiration(aiSelectedType);
      setAiResult(inspiration);
    } catch {
      setAiResult('生成失败，请重试');
    } finally {
      setAiGenerating(false);
    }
  }, [aiSelectedType]);

  const handleAISave = useCallback(() => {
    if (!aiResult.trim()) return;
    onInspirationAdd({
      type: aiSelectedType,
      content: aiResult.trim(),
      tags: [],
      isUsed: false,
    });
    setAiResult('');
    setShowAIModal(false);
  }, [aiResult, aiSelectedType, onInspirationAdd]);

  const stats = useMemo(() => {
    return {
      total: inspirations.length,
      unused: inspirations.filter((i) => !i.isUsed).length,
      used: inspirations.filter((i) => i.isUsed).length,
    };
  }, [inspirations]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <select
            className="input text-xs py-1 w-24"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          >
            <option value="all">全部类型</option>
            {Object.entries(INSPIRATION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            className="input text-xs py-1 w-24"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="all">全部状态</option>
            <option value="unused">未使用 ({stats.unused})</option>
            <option value="used">已使用 ({stats.used})</option>
          </select>

          <input
            className="input text-xs py-1 w-40"
            placeholder="搜索灵感..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={() => setShowImportModal(true)}
            title="从 Excel 导入灵感"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>导入</span>
          </button>
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={handleRandomInspiration}
          >
            🎲 随机
          </button>
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={() => setShowAIModal(true)}
            title="AI 生成灵感"
          >
            🤖 AI生成
          </button>
          <button
            className="btn btn-primary btn-sm text-xs"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>记录灵感</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredInspirations.length > 0 ? (
            filteredInspirations.map((inspiration) => (
              <div
                key={inspiration.id}
                className={`p-3 rounded-lg border transition-all ${
                  inspiration.isUsed
                    ? 'border-border-subtle opacity-60'
                    : 'border-border-subtle hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${INSPIRATION_TYPE_COLORS[inspiration.type]}20` }}
                    >
                      {INSPIRATION_TYPE_ICONS[inspiration.type]}
                    </span>
                    <span className="text-xs font-medium text-ink">
                      {INSPIRATION_TYPE_LABELS[inspiration.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!inspiration.isUsed && (
                      <button
                        className="text-[10px] text-brand hover:underline"
                        onClick={() => onInspirationUse(inspiration.id)}
                      >
                        使用
                      </button>
                    )}
                    <button
                      className="text-ink-faint hover:text-danger"
                      onClick={() => onInspirationDelete(inspiration.id)}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className={`text-sm text-ink mb-2 ${inspiration.isUsed ? 'line-through' : ''}`}>
                  {inspiration.content}
                </p>

                {inspiration.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {inspiration.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-ink-faint">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-ink-faint mt-2">
                  {new Date(inspiration.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-ink-muted">暂无灵感记录</p>
              <p className="text-xs text-ink-faint mt-1">点击"记录灵感"开始收集你的创意</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-[500px] shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">记录新灵感</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">灵感类型</label>
                <div className="flex gap-2">
                  {Object.entries(INSPIRATION_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      className={`px-3 py-1.5 rounded text-xs transition-all ${
                        newInspiration.type === key
                          ? 'text-white'
                          : 'bg-bg-subtle text-ink-muted hover:text-ink'
                      }`}
                      style={newInspiration.type === key ? { backgroundColor: INSPIRATION_TYPE_COLORS[key as SavedInspiration['type']] } : {}}
                      onClick={() => setNewInspiration({ ...newInspiration, type: key as SavedInspiration['type'] })}
                    >
                      {INSPIRATION_TYPE_ICONS[key as SavedInspiration['type']]} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">灵感内容 *</label>
                <textarea
                  className="input text-sm w-full min-h-[120px]"
                  placeholder="记录你的灵感..."
                  value={newInspiration.content}
                  onChange={(e) => setNewInspiration({ ...newInspiration, content: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">标签</label>
                <div className="flex gap-2">
                  <input
                    className="input text-sm flex-1"
                    placeholder="输入标签后回车..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={handleAddTag}>
                    添加
                  </button>
                </div>
                {newInspiration.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newInspiration.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-brand/10 text-brand">
                        {tag}
                        <button
                          onClick={() =>
                            setNewInspiration({
                              ...newInspiration,
                              tags: newInspiration.tags.filter((t) => t !== tag),
                            })
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddModal(false);
                  setNewInspiration({ type: 'plot', content: '', tags: [], novelId: '', chapterId: '' });
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddInspiration}
                disabled={!newInspiration.content.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showRandom && randomInspiration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl text-center">
            <span className="text-4xl mb-4 block">
              {INSPIRATION_TYPE_ICONS[randomInspiration.type]}
            </span>
            <h3 className="text-base font-semibold text-ink mb-2">
              随机灵感 · {INSPIRATION_TYPE_LABELS[randomInspiration.type]}
            </h3>
            <p className="text-sm text-ink-muted mb-4">{randomInspiration.content}</p>
            <div className="flex justify-center gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRandom(false)}
              >
                关闭
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onInspirationUse(randomInspiration.id);
                  setShowRandom(false);
                }}
              >
                标记已使用
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmptyPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl text-center">
            <span className="text-4xl mb-4 block">💡</span>
            <h3 className="text-base font-semibold text-ink mb-2">灵感库为空</h3>
            <p className="text-sm text-ink-muted mb-4">还没有任何灵感记录，先去收集一些创意吧！</p>
            <div className="flex justify-center gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowEmptyPrompt(false)}
              >
                稍后再说
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowEmptyPrompt(false);
                  setShowAddModal(true);
                }}
              >
                去记录灵感
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <InspirationImportModal
          onImport={handleImportInspirations}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-[500px] shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">🤖 AI 灵感生成</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">灵感类型</label>
                <div className="flex gap-2">
                  {Object.entries(INSPIRATION_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      className={`px-3 py-1.5 rounded text-xs transition-all ${
                        aiSelectedType === key
                          ? 'text-white'
                          : 'bg-bg-subtle text-ink-muted hover:text-ink'
                      }`}
                      style={aiSelectedType === key ? { backgroundColor: INSPIRATION_TYPE_COLORS[key as SavedInspiration['type']] } : {}}
                      onClick={() => setAiSelectedType(key as SavedInspiration['type'])}
                    >
                      {INSPIRATION_TYPE_ICONS[key as SavedInspiration['type']]} {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm w-full"
                onClick={handleAIGenerate}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : (
                  '生成灵感'
                )}
              </button>

              {aiResult && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-lg">💡</span>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap flex-1">{aiResult}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary btn-sm text-xs flex-1"
                      onClick={handleAISave}
                    >
                      保存到灵感库
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={handleAIGenerate}
                    >
                      换一个
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAIModal(false);
                  setAiResult('');
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationBoard;
