import React, { useState, useCallback, useMemo } from 'react';
import type { WritingGoal } from '../../types/novel';

interface WritingGoalsPanelProps {
  goals: WritingGoal[];
  currentWordCount: number;
  todayWordCount: number;
  streakDays: number;
  onGoalAdd: (goal: Omit<WritingGoal, 'id' | 'createdAt'>) => void;
  onGoalUpdate: (goalId: string, updates: Partial<WritingGoal>) => void;
  onGoalDelete: (goalId: string) => void;
}

const WritingGoalsPanel: React.FC<WritingGoalsPanelProps> = ({
  goals,
  currentWordCount,
  todayWordCount,
  streakDays,
  onGoalAdd,
  onGoalUpdate,
  onGoalDelete,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'daily' as WritingGoal['type'],
    target: 2000,
    deadline: '',
  });

  const dailyGoals = useMemo(() => goals.filter((g) => g.type === 'daily'), [goals]);
  const chapterGoals = useMemo(() => goals.filter((g) => g.type === 'chapter'), [goals]);
  const totalGoals = useMemo(() => goals.filter((g) => g.type === 'total'), [goals]);

  const handleAddGoal = useCallback(() => {
    if (newGoal.target <= 0) return;
    onGoalAdd({
      novelId: '',
      type: newGoal.type,
      target: newGoal.target,
      deadline: newGoal.deadline || undefined,
      completed: false,
    });
    setNewGoal({ type: 'daily', target: 2000, deadline: '' });
    setShowAddModal(false);
  }, [newGoal, onGoalAdd]);

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const renderGoalCard = (goal: WritingGoal) => {
    const progress = goal.type === 'daily'
      ? getProgressPercentage(todayWordCount, goal.target)
      : goal.type === 'total'
      ? getProgressPercentage(currentWordCount, goal.target)
      : 0;

    return (
      <div
        key={goal.id}
        className={`p-3 rounded-lg border transition-all ${
          goal.completed ? 'border-success/30 bg-success/5' : 'border-border-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink">
              {goal.type === 'daily' ? '每日目标' : goal.type === 'chapter' ? '章节目标' : '总目标'}
            </span>
            {goal.completed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/20 text-success">
                已完成
              </span>
            )}
          </div>
          <button
            className="text-ink-faint hover:text-danger"
            onClick={() => onGoalDelete(goal.id)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-ink-faint">
            {goal.type === 'daily' ? todayWordCount : currentWordCount} / {goal.target} 字
          </span>
          <span className="text-xs text-brand font-medium">{Math.round(progress)}%</span>
        </div>

        <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              goal.completed ? 'bg-success' : 'bg-brand'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {goal.deadline && (
          <p className="text-[10px] text-ink-faint mt-2">
            截止: {new Date(goal.deadline).toLocaleDateString('zh-CN')}
          </p>
        )}

        {!goal.completed && progress >= 100 && (
          <button
            className="mt-2 w-full py-1 rounded text-xs bg-success/10 text-success hover:bg-success/20"
            onClick={() => onGoalUpdate(goal.id, { completed: true })}
          >
            标记完成
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-ink">写作目标</h3>
        <button
          className="btn btn-primary btn-sm text-xs"
          onClick={() => setShowAddModal(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>新建目标</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-brand/5 border border-brand/20 text-center">
            <p className="text-2xl font-bold text-brand">{todayWordCount}</p>
            <p className="text-[10px] text-ink-faint mt-1">今日字数</p>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
            <p className="text-2xl font-bold text-success">{streakDays}</p>
            <p className="text-[10px] text-ink-faint mt-1">连续天数</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-center">
            <p className="text-2xl font-bold text-warning">{currentWordCount}</p>
            <p className="text-[10px] text-ink-faint mt-1">总字数</p>
          </div>
        </div>

        {dailyGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-ink mb-2">每日目标</h4>
            <div className="space-y-2">{dailyGoals.map(renderGoalCard)}</div>
          </div>
        )}

        {chapterGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-ink mb-2">章节目标</h4>
            <div className="space-y-2">{chapterGoals.map(renderGoalCard)}</div>
          </div>
        )}

        {totalGoals.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-ink mb-2">总目标</h4>
            <div className="space-y-2">{totalGoals.map(renderGoalCard)}</div>
          </div>
        )}

        {goals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-ink-muted mb-2">还没有设置写作目标</p>
            <p className="text-xs text-ink-faint">设置目标可以帮助你保持写作动力</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">新建写作目标</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">目标类型</label>
                <select
                  className="input text-sm w-full"
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as WritingGoal['type'] })}
                >
                  <option value="daily">每日目标</option>
                  <option value="chapter">章节目标</option>
                  <option value="total">总目标</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">目标字数</label>
                <input
                  type="number"
                  className="input text-sm w-full"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: Math.max(0, parseInt(e.target.value) || 0) })}
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">截止日期 (可选)</label>
                <input
                  type="date"
                  className="input text-sm w-full"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddModal(false);
                  setNewGoal({ type: 'daily', target: 2000, deadline: '' });
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddGoal}
                disabled={newGoal.target <= 0}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingGoalsPanel;
