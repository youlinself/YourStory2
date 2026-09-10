import React, { useState, useEffect } from 'react';
import useAIWorkshopStore from '../../stores/aiWorkshopStore';
import useThinkTankStore from '../../stores/thinkTankStore';
import { TASK_CATEGORY_LABELS, TASK_PRIORITY_LABELS } from '../../agent/workshop/types';
import type { TaskCategory, TaskPriority } from '../../agent/workshop/types';

const QUICK_TEMPLATES = [
  { label: '📖 创作小说', title: '创作一个短篇故事', category: 'plot' as TaskCategory },
  { label: '👤 设计角色', title: '设计一个新角色', category: 'character' as TaskCategory },
  { label: '🌍 构建世界', title: '构建世界观设定', category: 'worldbuilding' as TaskCategory },
  { label: '💬 优化对话', title: '优化角色对话', category: 'dialogue' as TaskCategory },
];

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

  const handleQuickTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setTitle(template.title);
    setCategory(template.category);
  };

  return (
    <div className="rounded-2xl border border-border-subtle overflow-hidden bg-white shadow-sm h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-brand/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center">
            <span className="text-sm">📋</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">指令下达</h3>
            <p className="text-[10px] text-ink-muted">向AI智囊团下达创作指令</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-ink-muted font-medium">快捷指令</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_TEMPLATES.map((template) => (
              <button
                key={template.label}
                onClick={() => handleQuickTemplate(template)}
                className="px-3 py-2 rounded-lg bg-bg-subtle border border-border-subtle text-xs text-ink-secondary hover:bg-brand-surface hover:border-brand/30 hover:text-brand transition-all text-left"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger-bg border border-danger/20 text-danger text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">指令标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：创作一个关于时间旅行的短篇故事"
              className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-white text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">详细说明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述你的创作需求，包括故事背景、角色设定、风格要求等..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-white text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">任务类型</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-white text-sm text-ink focus:outline-none focus:border-brand"
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
              <label className="block text-xs font-medium text-ink mb-1.5">优先级</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-white text-sm text-ink focus:outline-none focus:border-brand"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || enabledMembers.length === 0}
              className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand to-brand-hover text-white text-sm font-medium hover:shadow-md hover:shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  下达中...
                </>
              ) : (
                <>
                  <span>📤</span>
                  下达指令
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-ink-muted">
                {enabledMembers.length} 个AI待命
              </span>
            </div>
            {isRunning && (
              <div className="flex items-center gap-1.5 text-brand">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span>执行中</span>
              </div>
            )}
          </div>
        </div>

        {enabledMembers.length === 0 && (
          <div className="p-3 rounded-lg bg-warning-bg border border-warning/20 text-warning text-xs">
            <p className="font-medium">⚠️ 没有可用的AI成员</p>
            <p className="mt-1 text-[10px] text-warning/70">请前往「智囊团」页面添加并启用AI成员</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSubmissionPanel;
