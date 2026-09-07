import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { WritingStats, WritingGoals } from '../../types';

interface WritingStatsPanelProps {
  stats: WritingStats;
  goals: WritingGoals;
  totalWords: number;
  onOpenGoals: () => void;
}

const WritingStatsPanel: React.FC<WritingStatsPanelProps> = ({
  stats,
  goals,
  totalWords,
  onOpenGoals,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const todayStats = useMemo(() => {
    return stats.daily.find((d) => d.date === today);
  }, [stats.daily, today]);

  const todayProgress = useMemo(() => {
    if (!goals.dailyWordCount) return 0;
    return Math.min(100, ((todayStats?.wordCount || 0) / goals.dailyWordCount) * 100);
  }, [todayStats, goals.dailyWordCount]);

  const weeklyData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStat = stats.daily.find((d) => d.date === dateStr);
      result.push({
        day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        words: dayStat?.wordCount || 0,
        date: dateStr,
      });
    }
    return result;
  }, [stats.daily]);

  const weeklyTotal = useMemo(() => {
    return weeklyData.reduce((sum, d) => sum + d.words, 0);
  }, [weeklyData]);

  const monthlyTotal = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return stats.daily
      .filter((d) => new Date(d.date) >= thirtyDaysAgo)
      .reduce((sum, d) => sum + d.wordCount, 0);
  }, [stats.daily]);

  const writingDays = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return stats.daily.filter((d) => new Date(d.date) >= thirtyDaysAgo && d.wordCount > 0).length;
  }, [stats.daily]);

  const estimatedDaysToComplete = useMemo(() => {
    if (!goals.novelWordCount || goals.novelWordCount <= totalWords) return 0;
    const remaining = goals.novelWordCount - totalWords;
    const avgDaily = weeklyTotal / 7;
    if (avgDaily <= 0) return Infinity;
    return Math.ceil(remaining / avgDaily);
  }, [goals.novelWordCount, totalWords, weeklyTotal]);

  const getCalendarData = () => {
    const data = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStat = stats.daily.find((d) => d.date === dateStr);
      data.push({
        date: dateStr,
        words: dayStat?.wordCount || 0,
        level: dayStat
          ? dayStat.wordCount >= (goals.dailyWordCount || 2000)
            ? 3
            : dayStat.wordCount >= (goals.dailyWordCount || 2000) / 2
            ? 2
            : 1
          : 0,
      });
    }
    return data;
  };

  const calendarData = getCalendarData();

  return (
    <div className="w-80 border-l border-border-subtle bg-bg-base overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">写作统计</h3>
          <button
            className="text-xs text-brand hover:underline"
            onClick={onOpenGoals}
          >
            目标设置
          </button>
        </div>

        <div className="bg-gradient-to-br from-brand/5 to-brand/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-muted">今日写作</span>
            <span className="text-xs text-ink-faint">
              {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-end gap-4 mb-3">
            <div>
              <span className="text-2xl font-bold text-ink">
                {todayStats?.wordCount?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-ink-faint ml-1">字</span>
            </div>
            <div className="text-xs text-ink-faint">
              目标: {goals.dailyWordCount.toLocaleString()} 字
            </div>
          </div>
          <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand/80 rounded-full transition-all duration-500"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-ink-faint">
              {todayProgress.toFixed(0)}% 完成
            </span>
            {goals.dailyWordCount > 0 && todayStats && todayStats.wordCount >= goals.dailyWordCount && (
              <span className="text-[10px] text-success flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                目标达成
              </span>
            )}
          </div>
        </div>

        <div className="bg-bg-subtle rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔥</span>
            <div>
              <div className="text-sm font-semibold text-ink">
                连续写作 {stats.streak.current} 天
              </div>
              <div className="text-[10px] text-ink-faint">
                最长记录: {stats.streak.longest} 天
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-ink-muted mb-2">近28天写作日历</div>
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day) => (
              <div
                key={day.date}
                className={`w-full aspect-square rounded-sm ${
                  day.level === 3
                    ? 'bg-success'
                    : day.level === 2
                    ? 'bg-success/60'
                    : day.level === 1
                    ? 'bg-success/30'
                    : 'bg-bg-subtle'
                }`}
                title={`${day.date}: ${day.words}字`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-ink-faint">
            <span>少</span>
            <div className="w-3 h-3 rounded-sm bg-bg-subtle" />
            <div className="w-3 h-3 rounded-sm bg-success/30" />
            <div className="w-3 h-3 rounded-sm bg-success/60" />
            <div className="w-3 h-3 rounded-sm bg-success" />
            <span>多</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs text-ink-muted mb-2">近7天写作趋势</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--color-ink-faint)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value} 字`, '写作量']}
                />
                <Bar
                  dataKey="words"
                  fill="var(--color-brand)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-subtle rounded-lg p-3">
            <div className="text-[10px] text-ink-faint mb-1">本周写作</div>
            <div className="text-sm font-semibold text-ink">
              {weeklyTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-ink-faint">字</div>
          </div>
          <div className="bg-bg-subtle rounded-lg p-3">
            <div className="text-[10px] text-ink-faint mb-1">本月写作</div>
            <div className="text-sm font-semibold text-ink">
              {monthlyTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-ink-faint">字</div>
          </div>
          <div className="bg-bg-subtle rounded-lg p-3">
            <div className="text-[10px] text-ink-faint mb-1">本月写作天数</div>
            <div className="text-sm font-semibold text-ink">{writingDays}</div>
            <div className="text-[10px] text-ink-faint">天</div>
          </div>
          <div className="bg-bg-subtle rounded-lg p-3">
            <div className="text-[10px] text-ink-faint mb-1">累计写作</div>
            <div className="text-sm font-semibold text-ink">
              {(totalWords > 10000
                ? `${(totalWords / 10000).toFixed(1)}万`
                : totalWords.toLocaleString())}
            </div>
            <div className="text-[10px] text-ink-faint">字</div>
          </div>
        </div>

        {goals.novelWordCount > 0 && (
          <div className="bg-bg-subtle rounded-xl p-4">
            <div className="text-xs text-ink-muted mb-2">小说目标进度</div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-lg font-bold text-ink">
                {((totalWords / goals.novelWordCount) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-ink-faint mb-1">
                {totalWords.toLocaleString()} / {goals.novelWordCount.toLocaleString()} 字
              </span>
            </div>
            <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand/80 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalWords / goals.novelWordCount) * 100)}%` }}
              />
            </div>
            {estimatedDaysToComplete > 0 && estimatedDaysToComplete !== Infinity && (
              <div className="text-[10px] text-ink-faint">
                按当前速度，预计还需 {estimatedDaysToComplete} 天完成
              </div>
            )}
            {goals.deadline && (
              <div className="text-[10px] text-ink-faint mt-1">
                截止日期: {new Date(goals.deadline).toLocaleDateString('zh-CN')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingStatsPanel;
