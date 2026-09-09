import React, { useState } from 'react';
import useAIWorkshopStore from '../../stores/aiWorkshopStore';
import useThinkTankStore from '../../stores/thinkTankStore';
import { TASK_STATUS_LABELS, TASK_CATEGORY_LABELS } from '../../agent/workshop/types';
import type { Task, SubTask, WorkshopLog } from '../../agent/workshop/types';

const LogItem: React.FC<{ log: WorkshopLog }> = ({ log }) => {
  const levelStyles = {
    info: 'text-blue-600 bg-blue-50',
    warn: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
    success: 'text-green-600 bg-green-50',
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

const SubtaskCard: React.FC<{ subtask: SubTask }> = ({ subtask }) => {
  const statusStyles = {
    pending: 'border-gray-200 bg-gray-50',
    analyzing: 'border-blue-200 bg-blue-50',
    assigning: 'border-purple-200 bg-purple-50',
    executing: 'border-amber-200 bg-amber-50',
    reviewing: 'border-indigo-200 bg-indigo-50',
    completed: 'border-green-200 bg-green-50',
    failed: 'border-red-200 bg-red-50',
  };

  const statusIcons = {
    pending: '⏳',
    analyzing: '🔍',
    assigning: '📋',
    executing: '⚡',
    reviewing: '🔎',
    completed: '✅',
    failed: '❌',
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border p-3 ${statusStyles[subtask.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{statusIcons[subtask.status]}</span>
          <span className="text-sm font-medium text-ink">{subtask.memberName}</span>
          <span className="text-xs text-ink-muted px-2 py-0.5 rounded-full bg-white/50">
            {subtask.role}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-ink-muted hover:text-ink"
        >
          {expanded ? '收起' : '详情'}
        </button>
      </div>

      <p className="text-xs text-ink-muted mt-1">{subtask.description}</p>

      {subtask.result && expanded && (
        <div className="mt-2 p-2 rounded bg-white/50 text-xs text-ink max-h-32 overflow-y-auto">
          {subtask.result}
        </div>
      )}

      {subtask.error && (
        <p className="mt-1 text-xs text-red-500">错误：{subtask.error}</p>
      )}

      {subtask.tokensUsed > 0 && (
        <p className="mt-1 text-[10px] text-ink-faint">Token消耗：{subtask.tokensUsed}</p>
      )}
    </div>
  );
};

const TaskCard: React.FC<{ task: Task; subtasks: SubTask[]; logs: WorkshopLog[] }> = ({ task, subtasks, logs }) => {
  const [activeTab, setActiveTab] = useState<'subtasks' | 'logs'>('subtasks');

  const statusColors = {
    pending: 'bg-gray-100 text-gray-600',
    analyzing: 'bg-blue-100 text-blue-600',
    assigning: 'bg-purple-100 text-purple-600',
    executing: 'bg-amber-100 text-amber-600',
    reviewing: 'bg-indigo-100 text-indigo-600',
    completed: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
  };

  const completedSubtasks = subtasks.filter((st) => st.status === 'completed').length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
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
            </div>
            <h3 className="text-base font-semibold text-ink">{task.title}</h3>
            <p className="text-sm text-ink-muted mt-1 line-clamp-2">{task.description}</p>
          </div>
        </div>

        {task.status === 'executing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
              <span>进度</span>
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('subtasks')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'subtasks'
              ? 'text-brand border-b-2 border-brand'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          子任务 ({subtasks.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-brand border-b-2 border-brand'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          日志 ({logs.length})
        </button>
      </div>

      <div className="p-4 max-h-64 overflow-y-auto">
        {activeTab === 'subtasks' ? (
          <div className="space-y-2">
            {subtasks.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">暂无子任务</p>
            ) : (
              subtasks.map((st) => <SubtaskCard key={st.id} subtask={st} />)
            )}
          </div>
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
  const enabledMembers = members.filter((m) => m.isEnabled);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border-subtle p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏭</span>
            <div>
              <h2 className="text-lg font-semibold text-ink">AI工作间</h2>
              <p className="text-sm text-ink-muted">管理和监控AI智囊团的任务执行</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={cancelCurrentTask}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                取消当前任务
              </button>
            )}
            {taskQueue.length > 0 && (
              <button
                onClick={clearQueue}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                清空队列
              </button>
            )}
            <button
              onClick={clearLogs}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              清空日志
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-brand/5 border border-brand/10">
            <div className="text-2xl font-bold text-brand">{enabledMembers.length}</div>
            <div className="text-xs text-ink-muted">可用成员</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
            <div className="text-2xl font-bold text-amber-600">{taskQueue.length}</div>
            <div className="text-xs text-ink-muted">待执行</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {isRunning ? 1 : 0}
            </div>
            <div className="text-xs text-ink-muted">执行中</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <div className="text-xs text-ink-muted">已完成</div>
          </div>
        </div>
      </div>

      {currentTask && (
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
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
          <h3 className="text-sm font-semibold text-ink mb-3">已完成任务</h3>
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
        <div className="bg-white rounded-xl border border-border-subtle p-12 text-center">
          <span className="text-5xl mb-4 block">🏭</span>
          <h3 className="text-lg font-semibold text-ink mb-2">工作间空闲中</h3>
          <p className="text-sm text-ink-muted">发布一个新任务，让AI智囊团开始工作吧！</p>
        </div>
      )}
    </div>
  );
};

export default WorkshopView;
