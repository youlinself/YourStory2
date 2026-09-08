import React, { useState, useMemo } from 'react';
import type { DailyWritingStat } from '../../types';

interface WritingAnalyticsProps {
  dailyStats: DailyWritingStat[];
  totalWords: number;
  streakDays: number;
}

const WritingAnalytics: React.FC<WritingAnalyticsProps> = ({
  dailyStats,
  totalWords,
  streakDays,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const filteredStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return dailyStats;
    }

    return dailyStats.filter((s) => new Date(s.date) >= startDate);
  }, [dailyStats, timeRange]);

  const analytics = useMemo(() => {
    if (filteredStats.length === 0) {
      return {
        totalWordsInPeriod: 0,
        averageDaily: 0,
        maxDaily: 0,
        activeDays: 0,
        writingSpeed: 0,
        bestDay: null as DailyWritingStat | null,
        trend: 'stable' as 'up' | 'down' | 'stable',
      };
    }

    const totalWordsInPeriod = filteredStats.reduce((sum, s) => sum + s.wordCount, 0);
    const activeDays = filteredStats.filter((s) => s.wordCount > 0).length;
    const averageDaily = activeDays > 0 ? Math.round(totalWordsInPeriod / activeDays) : 0;
    const maxDaily = Math.max(...filteredStats.map((s) => s.wordCount));
    const bestDay = filteredStats.find((s) => s.wordCount === maxDaily) || null;

    const totalDuration = filteredStats.reduce((sum, s) => sum + s.duration, 0);
    const writingSpeed = totalDuration > 0 ? Math.round(totalWordsInPeriod / (totalDuration / 3600)) : 0;

    const firstHalf = filteredStats.slice(0, Math.floor(filteredStats.length / 2));
    const secondHalf = filteredStats.slice(Math.floor(filteredStats.length / 2));
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.wordCount, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.wordCount, 0) / Math.max(secondHalf.length, 1);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (secondAvg > firstAvg * 1.1) trend = 'up';
    else if (secondAvg < firstAvg * 0.9) trend = 'down';

    return {
      totalWordsInPeriod,
      averageDaily,
      maxDaily,
      activeDays,
      writingSpeed,
      bestDay,
      trend,
    };
  }, [filteredStats]);

  const chartData = useMemo(() => {
    const maxWords = Math.max(...filteredStats.map((s) => s.wordCount), 1);
    return filteredStats.map((stat) => ({
      date: stat.date,
      wordCount: stat.wordCount,
      height: (stat.wordCount / maxWords) * 100,
    }));
  }, [filteredStats]);

  const hourlyDistribution = useMemo(() => {
    const hours = new Array(24).fill(0);
    for (const stat of filteredStats) {
      const hour = new Date(stat.date).getHours();
      hours[hour] += stat.wordCount;
    }
    return hours;
  }, [filteredStats]);

  const peakHour = useMemo(() => {
    const max = Math.max(...hourlyDistribution);
    return hourlyDistribution.indexOf(max);
  }, [hourlyDistribution]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              className={`px-2 py-1 rounded text-xs transition-all ${
                timeRange === range
                  ? 'bg-brand text-white'
                  : 'bg-bg-subtle text-ink-muted hover:text-ink'
              }`}
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7天' : range === '30d' ? '30天' : range === '90d' ? '90天' : '全部'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-brand/5 border border-brand/20">
            <p className="text-2xl font-bold text-brand">{analytics.totalWordsInPeriod.toLocaleString()}</p>
            <p className="text-[10px] text-ink-faint mt-1">期间总字数</p>
          </div>
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <p className="text-2xl font-bold text-success">{analytics.averageDaily.toLocaleString()}</p>
            <p className="text-[10px] text-ink-faint mt-1">日均字数</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
            <p className="text-2xl font-bold text-warning">{analytics.maxDaily.toLocaleString()}</p>
            <p className="text-[10px] text-ink-faint mt-1">单日最高</p>
          </div>
          <div className="p-3 rounded-lg bg-ink-faint/5 border border-ink-faint/20">
            <p className="text-2xl font-bold text-ink">{analytics.activeDays}</p>
            <p className="text-[10px] text-ink-faint mt-1">活跃天数</p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-ink">字数增长趋势</h4>
            <div className="flex items-center gap-1 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  analytics.trend === 'up' ? 'bg-success' : analytics.trend === 'down' ? 'bg-danger' : 'bg-ink-faint'
                }`}
              />
              <span className="text-ink-faint">
                {analytics.trend === 'up' ? '上升' : analytics.trend === 'down' ? '下降' : '稳定'}
              </span>
            </div>
          </div>

          <div className="h-40 flex items-end gap-1">
            {chartData.length > 0 ? (
              chartData.map((data, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-brand/80 rounded-t hover:bg-brand transition-colors cursor-pointer"
                  style={{ height: `${data.height}%` }}
                  title={`${data.date}: ${data.wordCount} 字`}
                />
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-ink-faint">
                暂无数据
              </div>
            )}
          </div>
          {chartData.length > 0 && (
            <div className="flex justify-between mt-2 text-[10px] text-ink-faint">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border-subtle">
            <h4 className="text-sm font-medium text-ink mb-3">写作时段分布</h4>
            <div className="h-24 flex items-end gap-0.5">
              {hourlyDistribution.map((count, hour) => {
                const max = Math.max(...hourlyDistribution, 1);
                const height = (count / max) * 100;
                return (
                  <div
                    key={hour}
                    className={`flex-1 rounded-t transition-colors ${
                      hour === peakHour ? 'bg-brand' : 'bg-brand/30'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${hour}时: ${count} 字`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-ink-faint">
              <span>0时</span>
              <span>12时</span>
              <span>23时</span>
            </div>
            <p className="text-xs text-ink-faint mt-2">
              最佳写作时段: {peakHour}:00 - {peakHour + 1}:00
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border-subtle">
            <h4 className="text-sm font-medium text-ink mb-3">写作习惯</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">写作速度</span>
                <span className="text-sm font-medium text-ink">{analytics.writingSpeed} 字/时</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">连续写作</span>
                <span className="text-sm font-medium text-ink">{streakDays} 天</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">总字数</span>
                <span className="text-sm font-medium text-ink">{totalWords.toLocaleString()} 字</span>
              </div>
              {analytics.bestDay && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">最佳单日</span>
                  <span className="text-sm font-medium text-ink">
                    {analytics.bestDay.wordCount} 字 ({analytics.bestDay.date})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingAnalytics;
