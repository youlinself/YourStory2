import React, { useState } from 'react';
import useAIWorkshopStore from '../../stores/aiWorkshopStore';
import useThinkTankStore from '../../stores/thinkTankStore';
import { TASK_STATUS_LABELS, TASK_CATEGORY_LABELS } from '../../agent/workshop/types';
import type { Task, SubTask, WorkshopLog } from '../../agent/workshop/types';

const LogItem: React.FC<{ log: WorkshopLog }> = ({ log }) => {
  const levelStyles = {
    info: 'text-info bg-info-light',
    warn: 'text-warning bg-warning-bg',
    error: 'text-danger bg-danger-bg',
    success: 'text-success bg-success-bg',
  };

  const levelIcons = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${levelStyles[log.level]} text-xs`}>
      <span className="flex-shrink-0">{levelIcons[log.level]}</span>
      <div className="flex-1 min-w-0">
        <p className="break-words">{log.message}</p>
        <p className="text-[10px] opacity-60 mt-0.5">
          {new Date(log.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

const SubtaskCard: React.FC<{ subtask: SubTask; defaultExpanded?: boolean }> = ({ subtask, defaultExpanded = false }) => {
  const statusStyles: Record<string, string> = {
    pending: 'border-border-subtle bg-bg-subtle',
    analyzing: 'border-info/30 bg-info-light',
    assigning: 'border-purple-300/30 bg-purple-50',
    executing: 'border-warning/30 bg-warning-bg',
    reviewing: 'border-indigo-300/30 bg-indigo-50',
    completed: 'border-success/30 bg-success-bg',
    failed: 'border-danger/30 bg-danger-bg',
    skipped: 'border-border-subtle bg-bg-subtle opacity-60',
  };

  const statusIcons: Record<string, string> = {
    pending: '⏳',
    analyzing: '🔍',
    assigning: '📋',
    executing: '⚡',
    reviewing: '🔎',
    completed: '✅',
    failed: '❌',
    skipped: '⏭️',
  };

  const isCompleted = subtask.status === 'completed';
  const hasResult = !!subtask.result;
  const [expanded, setExpanded] = useState(defaultExpanded && hasResult);

  const isSkipped = subtask.status === 'skipped';

  return (
    <div className={`rounded-lg border p-3 ${statusStyles[subtask.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{statusIcons[subtask.status]}</span>
          <span className="text-sm font-medium text-ink">{subtask.memberName}</span>
          <span className="text-xs text-ink-muted px-2 py-0.5 rounded-full bg-white/70">
            {subtask.role}
          </span>
          {subtask.isFallback && (
            <span className="text-xs text-warning px-2 py-0.5 rounded-full bg-warning-bg">
              替代
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasResult && !isSkipped && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                expanded
                  ? 'bg-brand text-white'
                  : 'bg-brand-light text-brand hover:bg-brand/20'
              }`}
            >
              {expanded ? '收起结果' : '查看结果'}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-ink-muted mt-1">{subtask.description}</p>

      {isSkipped && subtask.skipReason && (
        <p className="mt-1 text-xs text-ink-faint">跳过原因：{subtask.skipReason}</p>
      )}

      {isCompleted && hasResult && expanded && !isSkipped && (
        <div className="mt-3 rounded-lg border border-success/30 bg-white overflow-hidden">
          <div className="px-3 py-2 bg-success-bg border-b border-success/20 flex items-center gap-2">
            <span className="text-xs font-medium text-success">📄 执行结果</span>
          </div>
          <div className="p-3 text-xs text-ink leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
            {subtask.result}
          </div>
        </div>
      )}

      {subtask.error && (
        <p className="mt-1 text-xs text-danger">错误：{subtask.error}</p>
      )}

      {subtask.tokensUsed > 0 && (
        <p className="mt-1 text-[10px] text-ink-faint">Token消耗：{subtask.tokensUsed}</p>
      )}
    </div>
  );
};

interface ResultSummaryProps {
  subtasks: SubTask[];
}

const ResultSummary: React.FC<ResultSummaryProps> = ({ subtasks }) => {
  const completedWithResults = subtasks.filter(
    (st) => st.status === 'completed' && st.result
  );

  if (completedWithResults.length === 0) {
    return (
      <div className="text-sm text-ink-muted text-center py-8">
        <span className="text-2xl block mb-2">📝</span>
        暂无执行结果
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedWithResults.map((st) => (
        <div key={st.id} className="rounded-lg border border-success/30 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-success-bg to-success-bg/50 border-b border-success/20">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-xs">✅</span>
              <span className="text-sm font-medium text-ink">{st.memberName}</span>
              <span className="text-xs text-ink-muted px-2 py-0.5 rounded bg-white/80">
                {st.role}
              </span>
            </div>
          </div>
          <div className="p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-serif">
            {st.result}
          </div>
        </div>
      ))}
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; subtasks: SubTask[]; logs: WorkshopLog[] }> = ({ task, subtasks, logs }) => {
  const [activeTab, setActiveTab] = useState<'subtasks' | 'results' | 'logs'>('subtasks');

  const isCompleted = task.status === 'completed' || task.status === 'partially_completed';

  const statusColors: Record<string, string> = {
    pending: 'bg-bg-subtle text-ink-muted',
    analyzing: 'bg-info-light text-info',
    assigning: 'bg-purple-50 text-purple-600',
    executing: 'bg-warning-bg text-warning',
    reviewing: 'bg-indigo-50 text-indigo-600',
    completed: 'bg-success-bg text-success',
    partially_completed: 'bg-warning-bg text-warning',
    failed: 'bg-danger-bg text-danger',
  };

  const completedSubtasks = subtasks.filter((st) => st.status === 'completed' || st.status === 'skipped').length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
  const skippedSubtasks = subtasks.filter((st) => st.status === 'skipped').length;

  const resultCount = subtasks.filter((st) => st.result && st.status === 'completed').length;

  return (
    <div className="rounded-2xl border border-border-subtle overflow-hidden bg-white shadow-sm">
      <div className="p-4 border-b border-border-subtle">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[task.status]}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
              <span className="text-xs text-ink-muted">
                {TASK_CATEGORY_LABELS[task.category]}
              </span>
              {resultCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-brand-light text-brand">
                  {resultCount} 个结果
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-ink">{task.title}</h3>
            <p className="text-sm text-ink-muted mt-1 line-clamp-2">{task.description}</p>
          </div>
        </div>

        {task.status === 'executing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
              <span>执行进度</span>
              <span>
                {completedSubtasks}/{totalSubtasks}
                {skippedSubtasks > 0 && (
                  <span className="text-warning ml-1">（跳过{skippedSubtasks}）</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  skippedSubtasks > 0 ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 bg-bg-subtle rounded-full overflow-hidden">
              <div className="h-full w-full bg-success rounded-full" />
            </div>
            <span className="text-xs text-success">100%</span>
          </div>
        )}
      </div>

      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('subtasks')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'subtasks'
              ? 'text-brand border-b-2 border-brand bg-brand-surface'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          子任务 ({subtasks.length})
        </button>
        {isCompleted && resultCount > 0 && (
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-brand border-b-2 border-brand bg-brand-surface'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            结果汇总 ({resultCount})
          </button>
        )}
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-brand border-b-2 border-brand bg-brand-surface'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          日志 ({logs.length})
        </button>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'subtasks' ? (
          <div className="space-y-2">
            {subtasks.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">暂无子任务</p>
            ) : (
              subtasks.map((st) => (
                <SubtaskCard
                  key={st.id}
                  subtask={st}
                  defaultExpanded={isCompleted}
                />
              ))
            )}
          </div>
        ) : activeTab === 'results' ? (
          <ResultSummary subtasks={subtasks} />
        ) : (
          <div className="space-y-1">
            {logs.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">暂无日志</p>
            ) : (
              logs.map((log) => <LogItem key={log.id} log={log} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const WorkshopView: React.FC = () => {
  const {
    currentTask,
    taskQueue,
    completedTasks,
    isRunning,
    cancelCurrentTask,
    clearQueue,
    clearLogs,
    getSubtasksByTaskId,
    getLogsByTaskId,
  } = useAIWorkshopStore();

  const { members } = useThinkTankStore();
  const enabledMembers = members.filter((m) => m.isEnabled && m.config.apiKey);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border-subtle bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage to-sage-light flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">任务追踪</h2>
              <p className="text-xs text-ink-muted">监控AI团队执行情况</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={cancelCurrentTask}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-danger bg-danger-bg hover:bg-danger/20 border border-danger/20 transition-colors"
              >
                取消当前任务
              </button>
            )}
            {taskQueue.length > 0 && (
              <button
                onClick={clearQueue}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted bg-bg-subtle hover:bg-border-subtle border border-border-subtle transition-colors"
              >
                清空队列
              </button>
            )}
            <button
              onClick={clearLogs}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted bg-bg-subtle hover:bg-border-subtle border border-border-subtle transition-colors"
            >
              清空日志
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-bg-subtle border border-border-subtle">
            <div className="text-2xl font-bold text-ink">{enabledMembers.length}</div>
            <div className="text-xs text-ink-muted">可用成员</div>
          </div>
          <div className="p-3 rounded-xl bg-warning-bg border border-warning/20">
            <div className="text-2xl font-bold text-warning">{taskQueue.length}</div>
            <div className="text-xs text-ink-muted">待执行</div>
          </div>
          <div className="p-3 rounded-xl bg-info-light border border-info/20">
            <div className="text-2xl font-bold text-info">
              {isRunning ? 1 : 0}
            </div>
            <div className="text-xs text-ink-muted">执行中</div>
          </div>
          <div className="p-3 rounded-xl bg-success-bg border border-success/20">
            <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
            <div className="text-xs text-ink-muted">已完成</div>
          </div>
        </div>
      </div>

      {currentTask && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            当前任务
          </h3>
          <TaskCard
            task={currentTask}
            subtasks={getSubtasksByTaskId(currentTask.id)}
            logs={getLogsByTaskId(currentTask.id)}
          />
        </div>
      )}

      {taskQueue.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">任务队列</h3>
          <div className="space-y-3">
            {taskQueue.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={getSubtasksByTaskId(task.id)}
                logs={getLogsByTaskId(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3">
            已完成任务
            {completedTasks.some((t) => t.status === 'partially_completed') && (
              <span className="ml-2 text-xs text-warning font-normal">
                （部分任务可能缺少某些角色）
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {completedTasks.slice().reverse().map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={getSubtasksByTaskId(task.id)}
                logs={getLogsByTaskId(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!currentTask && taskQueue.length === 0 && completedTasks.length === 0 && (
        <div className="rounded-2xl border border-border-subtle bg-white shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-subtle flex items-center justify-center border border-border-subtle">
            <span className="text-3xl opacity-50">🏭</span>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">工作间空闲中</h3>
          <p className="text-sm text-ink-muted">发布一个新任务，让AI智囊团开始工作吧！</p>
        </div>
      )}
    </div>
  );
};

export default WorkshopView;
