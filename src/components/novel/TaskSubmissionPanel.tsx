import React, { useState, useEffect } from 'react';
import useAIWorkshopStore from '../../stores/aiWorkshopStore';
import useThinkTankStore from '../../stores/thinkTankStore';
import { TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS } from '../../agent/workshop/types';
import type { TaskCategory, TaskPriority } from '../../agent/workshop/types';

const TaskSubmissionPanel: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('plot');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { members, loadMembers } = useThinkTankStore();
  const { submitTask, isRunning, initialize, isInitialized } = useAIWorkshopStore();

  useEffect(() => {
    const initWorkshop = async () => {
      await loadMembers();
      if (!isInitialized) {
        initialize();
      }
      // 确保 workshop 的 dispatcher 同步最新的成员列表
      useAIWorkshopStore.getState().refreshMembers();
    };
    initWorkshop();
  }, [loadMembers, initialize, isInitialized]);

  const enabledMembers = members.filter((m) => m.isEnabled && m.config.apiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('请输入任务标题');
      return;
    }

    if (!description.trim()) {
      setError('请输入任务描述');
      return;
    }

    if (enabledMembers.length === 0) {
      setError('没有可用的AI成员，请先在智囊团设置中添加并启用成员');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitTask({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });

      setTitle('');
      setDescription('');
      setCategory('plot');
      setPriority('medium');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交任务失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border-subtle p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🚀</span>
        <div>
          <h2 className="text-lg font-semibold text-ink">发布新任务</h2>
          <p className="text-sm text-ink-muted">向AI智囊团发布创作任务</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">任务标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：创作一个关于时间旅行的短篇故事"
            className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">任务描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述你的创作需求，包括故事背景、角色设定、风格要求等..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">任务类型</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand"
              disabled={isSubmitting}
            >
              {Object.entries(TASK_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-white text-sm focus:outline-none focus:border-brand"
              disabled={isSubmitting}
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {enabledMembers.length} 个AI成员可用
            </span>
            {isRunning && (
              <span className="flex items-center gap-1 text-brand">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                正在执行任务
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || enabledMembers.length === 0}
            className="px-6 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                提交中...
              </>
            ) : (
              <>
                <span>📤</span>
                发布任务
              </>
            )}
          </button>
        </div>
      </form>

      {enabledMembers.length === 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <p className="font-medium">⚠️ 没有可用的AI成员</p>
          <p className="mt-1 text-xs">请前往「智囊团」页面添加并启用AI成员，才能发布任务。</p>
        </div>
      )}
    </div>
  );
};

export default TaskSubmissionPanel;
