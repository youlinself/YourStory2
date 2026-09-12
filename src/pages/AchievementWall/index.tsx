import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAchievementStore, { ACHIEVEMENTS } from '../../stores/achievementStore';
import { getRarityColor, getRarityName } from '../../data/achievementData';
import type { Achievement, AchievementCategory } from '../../types/simulation';
import { DATA_COLORS } from '../../utils/palette';
import { Trophy, Swords, Sprout, Moon, Layers, Sparkles, Search, Check, type LucideIcon } from 'lucide-react';

const CATEGORIES: { id: AchievementCategory | 'all'; name: string; icon: LucideIcon }[] = [
  { id: 'all', name: '全部', icon: Trophy },
  { id: 'combat', name: '战斗', icon: Swords },
  { id: 'life', name: '人生', icon: Sprout },
  { id: 'cultivation', name: '修仙', icon: Moon },
  { id: 'collection', name: '收集', icon: Layers },
  { id: 'special', name: '特殊', icon: Sparkles },
];

const AchievementCard: React.FC<{
  achievement: Achievement;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}> = ({ achievement, isUnlocked, progress, maxProgress }) => {
  const rarityColor = getRarityColor(achievement.rarity);
  const progressPercent = maxProgress > 0 ? Math.min(100, (progress / maxProgress) * 100) : 0;

  return (
    <div
      className={`relative rounded-xl p-4 transition-all ${
        isUnlocked
          ? 'bg-bg-elevated border-2 shadow-md hover:shadow-lg hover:scale-[1.02]'
          : 'bg-bg-subtle border border-border opacity-70 hover:opacity-90'
      }`}
      style={{
        borderColor: isUnlocked ? rarityColor : undefined,
      }}
    >
      {isUnlocked && (
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
          style={{ backgroundColor: rarityColor }}
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${
            isUnlocked ? 'bg-bg-subtle' : 'bg-bg-subtle grayscale'
          }`}
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-sm ${isUnlocked ? 'text-ink' : 'text-ink-muted'}`}>
              {achievement.hidden && !isUnlocked ? '???' : achievement.name}
            </h3>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${rarityColor}20`,
                color: rarityColor,
              }}
            >
              {getRarityName(achievement.rarity)}
            </span>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed mb-2">
            {achievement.hidden && !isUnlocked ? '隐藏成就，解锁后查看' : achievement.description}
          </p>

          {achievement.maxProgress && achievement.maxProgress > 1 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-ink-faint">进度</span>
                <span className="text-[10px] font-mono text-ink-muted">
                  {Math.min(progress, maxProgress)}/{maxProgress}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: isUnlocked ? rarityColor : DATA_COLORS.slate,
                  }}
                />
              </div>
            </div>
          )}

          {isUnlocked && (
            <div className="mt-2 flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] text-success"><Check className="h-3 w-3" />已解锁</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AchievementWallPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const {
    unlockedAchievements,
    loadAchievements,
    getProgressForAchievement,
    getMaxProgressForAchievement,
    isAchievementUnlocked,
    totalGamesPlayed,
    totalGamesWon,
    totalCombatsWon,
    highestAge,
  } = useAchievementStore();

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const filteredAchievements = ACHIEVEMENTS.filter((a) => {
    if (activeCategory !== 'all' && a.category !== activeCategory) return false;
    if (showUnlockedOnly && !isAchievementUnlocked(a.id)) return false;
    return true;
  });

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="content-panel flex-1 overflow-y-auto">
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/simulation')}
                className="p-2 rounded-lg hover:bg-bg-subtle transition-colors"
              >
                <svg className="w-5 h-5 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-semibold heading-serif tracking-tight text-ink">
                <Trophy className="inline h-5 w-5 text-gold" /> 成就墙
              </h1>
            </div>
            <div className="text-sm text-ink-muted">
              {unlockedCount}/{totalCount} ({completionPercent}%)
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-bg-elevated rounded-xl border border-border-subtle p-4 text-center">
              <div className="text-2xl font-bold text-brand">{totalGamesPlayed}</div>
              <div className="text-xs text-ink-muted mt-1">总游戏次数</div>
            </div>
            <div className="bg-bg-elevated rounded-xl border border-border-subtle p-4 text-center">
              <div className="text-2xl font-bold text-success">{totalGamesWon}</div>
              <div className="text-xs text-ink-muted mt-1">胜利次数</div>
            </div>
            <div className="bg-bg-elevated rounded-xl border border-border-subtle p-4 text-center">
              <div className="text-2xl font-bold text-danger">{totalCombatsWon}</div>
              <div className="text-xs text-ink-muted mt-1">战斗胜利</div>
            </div>
            <div className="bg-bg-elevated rounded-xl border border-border-subtle p-4 text-center">
              <div className="text-2xl font-bold text-gold">{highestAge}</div>
              <div className="text-xs text-ink-muted mt-1">最高年龄</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-bg-elevated border border-border-subtle text-ink-muted hover:border-brand hover:text-brand'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                <span>{cat.name}</span>
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showUnlockedOnly
                  ? 'bg-gold text-white'
                  : 'bg-bg-elevated border border-border-subtle text-ink-muted hover:border-gold hover:text-gold'
              }`}
            >
              {showUnlockedOnly ? <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" />已解锁</span> : '已解锁'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isAchievementUnlocked(achievement.id)}
                progress={getProgressForAchievement(achievement.id)}
                maxProgress={getMaxProgressForAchievement(achievement.id)}
              />
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-10 w-10 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-ink-muted">没有找到符合条件的成就</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementWallPage;
