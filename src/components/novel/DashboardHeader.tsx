import React from 'react';
import useAIWorkshopStore from '../../stores/aiWorkshopStore';
import useThinkTankStore from '../../stores/thinkTankStore';

const DashboardHeader: React.FC = () => {
  const { isRunning, completedTasks, currentTask } = useAIWorkshopStore();
  const { members } = useThinkTankStore();

  const enabledMembers = members.filter((m) => m.isEnabled && m.config.apiKey);
  const todayCompleted = completedTasks.filter((t) => {
    const today = new Date().toDateString();
    return new Date(t.updatedAt).toDateString() === today;
  }).length;

  const successRate = completedTasks.length > 0
    ? Math.round((completedTasks.filter((t) => t.status === 'completed').length / completedTasks.length) * 100)
    : 100;

  return (
    <div className="bg-white border-b border-border-subtle shadow-sm">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-md shadow-brand/20">
                <span className="text-lg">👔</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink tracking-wide">创意指挥中心</h1>
                <p className="text-[11px] text-ink-muted">AI智囊团 · 总监控台</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 ml-4 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand/20">
              <span className="text-[10px] text-ink-muted">创意总监</span>
              <span className="text-[10px] text-brand font-medium ml-1">在线</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:grid grid-cols-4 gap-3">
              <div className="px-3 py-2 rounded-lg bg-white border border-border-subtle min-w-[80px] shadow-sm">
                <div className="text-lg font-bold text-ink">{enabledMembers.length}</div>
                <div className="text-[10px] text-ink-muted">团队人数</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-success-bg border border-success/20 min-w-[80px]">
                <div className="text-lg font-bold text-success">{todayCompleted}</div>
                <div className="text-[10px] text-ink-muted">今日完成</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-gold-light border border-gold/20 min-w-[80px]">
                <div className="text-lg font-bold text-gold">{successRate}%</div>
                <div className="text-[10px] text-ink-muted">成功率</div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-white border border-border-subtle min-w-[80px] shadow-sm">
                <div className="flex items-center gap-1.5">
                  {isRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-sm font-medium text-success">运行中</span>
                    </>
                  ) : currentTask ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      <span className="text-sm font-medium text-warning">暂停</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-ink-faint" />
                      <span className="text-sm font-medium text-ink-muted">待命</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">系统状态</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-border-subtle">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center shadow-sm">
                <span className="text-xs text-white font-bold">CD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
