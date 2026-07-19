import React, { useEffect, useState } from 'react';
import useSimulationStore from '../../stores/simulationStore';
import { ERAS, ATTRIBUTE_NAMES, ATTRIBUTE_ICONS, ATTRIBUTE_COLORS, SCRIPT_TEMPLATES } from '../../data/simulationData';
import type { BirthYear, GameEvent, EventOption, PlayerAttributes } from '../../types/simulation';

// ==========================================
// 获取当前时代事件
// ==========================================
function getCurrentEraEvents(era: number): GameEvent[] {
  const template = SCRIPT_TEMPLATES[era];
  if (!template) return [];

  // 固定节点 + 随机抽取2个随机事件
  const fixed = template.fixedNodes;
  const randomPool = [...template.randomEventPool];
  const randomEvents: GameEvent[] = [];

  for (let i = 0; i < Math.min(2, randomPool.length); i++) {
    const idx = Math.floor(Math.random() * randomPool.length);
    randomEvents.push(randomPool.splice(idx, 1)[0]);
  }

  return [...fixed, ...randomEvents];
}

// ==========================================
// 属性条组件
// ==========================================
const AttributeBar: React.FC<{
  attr: keyof PlayerAttributes;
  value: number;
  showLabel?: boolean;
}> = ({ attr, value, showLabel = true }) => {
  const color = ATTRIBUTE_COLORS[attr] || '#6B7280';
  const icon = ATTRIBUTE_ICONS[attr] || '•';
  const name = ATTRIBUTE_NAMES[attr] || attr;

  return (
    <div className="flex items-center gap-2">
      <span className="text-base w-5 text-center">{icon}</span>
      {showLabel && <span className="text-xs text-ink-muted w-8">{name}</span>}
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-ink w-7 text-right">{Math.round(value)}</span>
    </div>
  );
};

// ==========================================
// 设置阶段 - 选择出生年
// ==========================================
const SetupPhase: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<BirthYear | null>(null);
  const startGame = useSimulationStore((s) => s.startGame);
  const saveGame = useSimulationStore((s) => s.saveGame);

  const handleStart = () => {
    if (selectedYear) {
      startGame(selectedYear);
      saveGame();
    }
  };

  const selectedEra = ERAS.find((e) => e.year === selectedYear);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-ink mb-3">🎮 模拟人生</h1>
        <p className="text-ink-muted text-sm max-w-md">
          选择一个出生时代，开启你唯一的人生旅程。
          <br />
          每个选择都会影响你的未来，历史也会因你而改变。
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold text-ink mb-4 text-center">选择你的出生年份</h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 mb-8">
          {ERAS.map((era) => (
            <button
              key={era.year}
              onClick={() => setSelectedYear(era.year)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedYear === era.year
                  ? 'bg-brand text-white shadow-md scale-105'
                  : 'bg-white border border-border-subtle text-ink hover:border-brand hover:text-brand'
              }`}
            >
              {era.year}
            </button>
          ))}
        </div>

        {selectedEra && (
          <div className="bg-white rounded-xl border border-border-subtle p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌟</span>
              <div>
                <h3 className="font-semibold text-ink">{selectedEra.name}</h3>
                <span className="text-xs text-ink-muted">{selectedEra.year}年代</span>
              </div>
            </div>
            <p className="text-sm text-ink-muted mb-4">{selectedEra.description}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span>❤️</span>
                <span className="text-ink-muted">预期寿命</span>
                <span className="font-semibold text-ink ml-auto">{selectedEra.baseLifeExpectancy}岁</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span>💰</span>
                <span className="text-ink-muted">初始财富</span>
                <span className="font-semibold text-ink ml-auto">{selectedEra.initialWealthRange[0]}-{selectedEra.initialWealthRange[1]}</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={!selectedYear}
            className={`px-8 py-3 rounded-lg font-medium text-base transition-all ${
              selectedYear
                ? 'bg-brand text-white hover:bg-brand/90 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            开始人生 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 事件选择阶段
// ==========================================
const EventPhase: React.FC<{
  event: GameEvent;
  onChoice: (event: GameEvent, option: EventOption) => void;
}> = ({ event, onChoice }) => {
  const attributes = useSimulationStore((s) => s.attributes);
  const hiddenTags = useSimulationStore((s) => s.hiddenTags);
  const choiceHistory = useSimulationStore((s) => s.choiceHistory);
  const getSuccessRate = useSimulationStore((s) => s.getSuccessRate);

  // 执行换皮
  const displayText = event.skinRule
    ? event.skinRule(attributes, choiceHistory, hiddenTags)
    : event.baseText;

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          event.type === 'world_event' ? 'bg-purple-100 text-purple-700' :
          event.type === 'fixed' ? 'bg-blue-100 text-blue-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {event.type === 'world_event' ? '世界事件' : event.type === 'fixed' ? '关键抉择' : '随机事件'}
        </span>
        {event.isMilestone && <span className="text-xs text-amber-600 font⭐">⭐ 里程碑</span>}
      </div>

      <h3 className="text-lg font-semibold text-ink mb-3">{event.title}</h3>
      <p className="text-ink-muted text-sm leading-relaxed mb-6">{displayText}</p>

      <div className="space-y-3">
        {event.options.map((option) => {
          const rate = getSuccessRate(option);
          return (
            <button
              key={option.id}
              onClick={() => onChoice(event, option)}
              className="w-full text-left p-4 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-ink group-hover:text-brand transition-colors">
                  {option.text}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-ink-muted">
                  {Math.round(rate * 100)}%
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(option.successRate).map(([attr, weight]) => (
                  <span key={attr} className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-ink-faint">
                    {ATTRIBUTE_ICONS[attr]} {ATTRIBUTE_NAMES[attr]} ×{weight}
                  </span>
                ))}
              </div>
              {option.tagModifier && hiddenTags.includes(option.tagModifier.tag) && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                  🏷️ 标签加成 +{Math.round(option.tagModifier.rateBonus * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 时代过渡阶段
// ==========================================
const EraTransitionPhase: React.FC<{
  onAdvance: () => void;
}> = ({ onAdvance }) => {
  const currentEra = useSimulationStore((s) => s.currentEra);
  const age = useSimulationStore((s) => s.age);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const lifeRecords = useSimulationStore((s) => s.lifeRecords);
  const eraLifeRecords = lifeRecords.filter((r) => r.era === currentEra);

  const eraStartYear = (birthYear || 1950) + currentEra * 10;

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6 shadow-sm">
      <div className="text-center mb-6">
        <span className="text-4xl mb-3 block">⏳</span>
        <h3 className="text-xl font-semibold text-ink mb-2">时代变迁</h3>
        <p className="text-ink-muted text-sm">
          {eraStartYear}年代即将结束，你{age}岁了
        </p>
      </div>

      {eraLifeRecords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-ink-muted mb-3">这个时代的重要时刻：</h4>
          <div className="space-y-2">
            {eraLifeRecords.slice(-5).map((record) => (
              <div key={record.id} className="flex items-start gap-2 text-sm">
                <span className="text-brand mt-0.5">•</span>
                <span className="text-ink-muted">{record.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onAdvance}
          className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
        >
          进入下一个十年 →
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 游戏结束阶段
// ==========================================
const EndPhase: React.FC = () => {
  const resetGame = useSimulationStore((s) => s.resetGame);
  const lifeRecords = useSimulationStore((s) => s.lifeRecords);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const age = useSimulationStore((s) => s.age);
  const choiceHistory = useSimulationStore((s) => s.choiceHistory);
  const hiddenTags = useSimulationStore((s) => s.hiddenTags);
  const worldState = useSimulationStore((s) => s.worldState);

  const handleExport = () => {
    // 生成小说文本
    const deathYear = (birthYear || 1950) + age;
    const title = `一个${birthYear}年出生者的人生故事`;

    let content = `# ${title}\n\n`;
    content += `> 从${birthYear}年到${deathYear}年，${age}年的人生旅程。\n\n`;

    // 按时代分章
    const eraGroups: Record<number, typeof lifeRecords> = {};
    lifeRecords.forEach((r) => {
      if (!eraGroups[r.era]) eraGroups[r.era] = [];
      eraGroups[r.era].push(r);
    });

    Object.entries(eraGroups).forEach(([era, records]) => {
      const eraYear = (birthYear || 1950) + parseInt(era) * 10;
      content += `## 第${parseInt(era) + 1}章：${eraYear}年代\n\n`;
      records.forEach((r) => {
        content += `${r.content}\n\n`;
      });
    });

    content += `## 终章\n\n`;
    content += `${age}年的旅程到此结束。那些决定性的瞬间，构成了独一无二的人生。\n`;

    // 下载文件
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successCount = choiceHistory.filter((c) => c.success).length;
  const successRate = choiceHistory.length > 0 ? Math.round((successCount / choiceHistory.length) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="bg-white rounded-xl border border-border-subtle p-8 shadow-sm max-w-lg w-full text-center">
        <span className="text-5xl mb-4 block">🕯️</span>
        <h2 className="text-2xl font-bold text-ink mb-2">人生落幕</h2>
        <p className="text-ink-muted mb-6">
          从{birthYear}年到{(birthYear || 1950) + age}年，{age}年的旅程到此结束。
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-brand">{choiceHistory.length}</div>
            <div className="text-xs text-ink-muted">总选择</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-green-600">{successRate}%</div>
            <div className="text-xs text-ink-muted">成功率</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xl font-bold text-amber-600">{hiddenTags.length}</div>
            <div className="text-xs text-ink-muted">获得标签</div>
          </div>
        </div>

        {hiddenTags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm text-ink-muted mb-2">你获得的人生标签：</h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {hiddenTags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm">
                  🏷️ {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {worldState.customEvents.length > 0 && (
          <div className="mb-6 text-left">
            <h4 className="text-sm text-ink-muted mb-2">你影响了时代：</h4>
            <div className="space-y-1">
              {worldState.customEvents.map((evt, i) => (
                <p key={i} className="text-xs text-ink-faint flex items-start gap-1">
                  <span>✨</span><span>{evt}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
          >
            📖 导出人生小说
          </button>
          <button
            onClick={resetGame}
            className="px-5 py-2.5 border border-border-subtle text-ink rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 主游戏界面
// ==========================================
const PlayingPhase: React.FC = () => {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eraEvents, setEraEvents] = useState<GameEvent[]>([]);
  const [phase, setPhase] = useState<'events' | 'transition'>('events');
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  const currentEra = useSimulationStore((s) => s.currentEra);
  const makeChoice = useSimulationStore((s) => s.makeChoice);
  const advanceEra = useSimulationStore((s) => s.advanceEra);

  // 初始化时代事件
  useEffect(() => {
    const events = getCurrentEraEvents(currentEra);
    setEraEvents(events);
    setCurrentEventIndex(0);
    setPhase('events');
  }, [currentEra]);

  const handleChoice = (event: GameEvent, option: EventOption) => {
    makeChoice(event, option);
    setLastOutcome(
      `${option.text} - ${Math.random() < useSimulationStore.getState().getSuccessRate(option) ? '成功' : '失败'}`
    );

    // 延迟进入下一个事件
    setTimeout(() => {
      if (currentEventIndex < eraEvents.length - 1) {
        setCurrentEventIndex((i) => i + 1);
      } else {
        setPhase('transition');
      }
    }, 800);
  };

  const handleAdvanceEra = () => {
    advanceEra();
  };

  if (phase === 'transition') {
    return <EraTransitionPhase onAdvance={handleAdvanceEra} />;
  }

  const currentEvent = eraEvents[currentEventIndex];

  if (!currentEvent) {
    return <EraTransitionPhase onAdvance={handleAdvanceEra} />;
  }

  return (
    <div className="space-y-4">
      {/* 进度指示 */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>时代进度：第{currentEra + 1}个十年</span>
        <span>事件 {currentEventIndex + 1} / {eraEvents.length}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-300"
          style={{ width: `${((currentEventIndex + 1) / eraEvents.length) * 100}%` }}
        />
      </div>

      {/* 事件卡片 */}
      <EventPhase event={currentEvent} onChoice={handleChoice} />

      {/* 上次结果 */}
      {lastOutcome && (
        <div className="text-center text-xs text-ink-faint animate-pulse">
          上次选择：{lastOutcome}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 主页面组件
// ==========================================
const SimulationPage: React.FC = () => {
  const phase = useSimulationStore((s) => s.phase);
  const birthYear = useSimulationStore((s) => s.birthYear);
  const currentEra = useSimulationStore((s) => s.currentEra);
  const age = useSimulationStore((s) => s.age);
  const remainingLife = useSimulationStore((s) => s.remainingLife);
  const attributes = useSimulationStore((s) => s.attributes);
  const lifeRecords = useSimulationStore((s) => s.lifeRecords);
  const hiddenTags = useSimulationStore((s) => s.hiddenTags);
  const loadGame = useSimulationStore((s) => s.loadGame);

  // 尝试加载存档
  useEffect(() => {
    loadGame();
  }, [loadGame]);

  return (
    <div className="flex h-full">
      {/* 左侧 - 游戏主区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {phase === 'setup' && <SetupPhase />}
        {phase === 'playing' && <PlayingPhase />}
        {phase === 'ended' && <EndPhase />}
      </div>

      {/* 右侧 - 状态面板 */}
      {phase !== 'setup' && phase !== 'ended' && (
        <div className="w-72 border-l border-border-subtle bg-gray-50 overflow-y-auto p-4 hidden lg:block">
          {/* 基本信息 */}
          <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
            <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <span>📋</span> 人生状态
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">出生年</span>
                <span className="font-medium">{birthYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">年龄</span>
                <span className="font-medium">{age}岁</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">时代</span>
                <span className="font-medium">第{currentEra + 1}个十年</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">剩余生命</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">❤️</span>
                  <span className="font-medium">{Math.round(remainingLife)}年</span>
                </div>
              </div>
            </div>
          </div>

          {/* 属性面板 */}
          <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
            <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
              <span>📊</span> 角色属性
            </h3>
            <div className="space-y-2.5">
              {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => (
                <AttributeBar key={attr} attr={attr} value={attributes[attr]} />
              ))}
            </div>
          </div>

          {/* 隐藏标签 */}
          {hiddenTags.length > 0 && (
            <div className="bg-white rounded-xl border border-border-subtle p-4 mb-4">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
                <span>🏷️</span> 人生标签
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {hiddenTags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 人生记录 */}
          {lifeRecords.length > 0 && (
            <div className="bg-white rounded-xl border border-border-subtle p-4">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2">
                <span>📜</span> 人生记录
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lifeRecords.slice().reverse().map((record) => (
                  <div key={record.id} className="text-xs pb-2 border-b border-border-subtle last:border-0">
                    <div className="text-ink-muted mb-0.5">[{(birthYear || 1950) + record.era * 10 + record.year}]</div>
                    <div className="text-ink">{record.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
