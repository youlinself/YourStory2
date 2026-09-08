import React, { useState, useMemo, useCallback } from 'react';
import type { NovelChapter, Character } from '../../types/novel';
import { CHARACTER_ROLE_LABELS } from '../../types/novel';

interface CharacterStatsPanelProps {
  chapters: NovelChapter[];
  characters: Character[];
  onChapterSelect: (chapterId: string) => void;
  onCharacterSelect: (characterId: string) => void;
}

interface CharacterStat {
  character: Character;
  appearanceCount: number;
  chapterIds: string[];
  lastAppearance: string;
  relationshipStrength: number;
}

const CharacterStatsPanel: React.FC<CharacterStatsPanelProps> = ({
  chapters,
  characters,
  onChapterSelect,
  onCharacterSelect,
}) => {
  const [sortBy, setSortBy] = useState<'appearances' | 'name' | 'lastAppearance'>('appearances');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showHeatmap, setShowHeatmap] = useState(false);

  const characterStats = useMemo(() => {
    const stats: CharacterStat[] = characters.map((character) => {
      const chapterIds: string[] = [];
      let appearanceCount = 0;

      for (const chapter of chapters) {
        const charNameLower = character.name.toLowerCase();
        const contentLower = chapter.content.toLowerCase();
        const aliasMatches = character.alias.some((a) => contentLower.includes(a.toLowerCase()));

        if (
          contentLower.includes(charNameLower) ||
          aliasMatches ||
          chapter.scenes?.some((s) =>
            s.characters.some(
              (c) => c.toLowerCase() === charNameLower || character.alias.some((a) => c.toLowerCase() === a.toLowerCase())
            )
          )
        ) {
          chapterIds.push(chapter.id);
          appearanceCount += (contentLower.match(new RegExp(charNameLower, 'g')) || []).length;
        }
      }

      const lastChapter = chapterIds.length > 0
        ? chapters.find((ch) => ch.id === chapterIds[chapterIds.length - 1])
        : null;

      const relationshipStrength = character.relationships.length;

      return {
        character,
        appearanceCount,
        chapterIds,
        lastAppearance: lastChapter?.title || '未出场',
        relationshipStrength,
      };
    });

    return stats;
  }, [characters, chapters]);

  const filteredAndSortedStats = useMemo(() => {
    let filtered = characterStats;
    if (filterRole !== 'all') {
      filtered = filtered.filter((s) => s.character.role === filterRole);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'appearances':
          return b.appearanceCount - a.appearanceCount;
        case 'name':
          return a.character.name.localeCompare(b.character.name);
        case 'lastAppearance': {
          const aIdx = chapters.findIndex((ch) => ch.id === a.chapterIds[a.chapterIds.length - 1]);
          const bIdx = chapters.findIndex((ch) => ch.id === b.chapterIds[b.chapterIds.length - 1]);
          return bIdx - aIdx;
        }
        default:
          return 0;
      }
    });
  }, [characterStats, filterRole, sortBy, chapters]);

  const dormantCharacters = useMemo(() => {
    const recentChapters = chapters.slice(-5);
    const recentChapterIds = new Set(recentChapters.map((ch) => ch.id));
    return characterStats.filter(
      (s) => s.chapterIds.length > 0 && !s.chapterIds.some((id) => recentChapterIds.has(id))
    );
  }, [characterStats, chapters]);

  const getHeatmapColor = useCallback((count: number, max: number) => {
    if (count === 0) return 'bg-bg-subtle';
    const intensity = Math.min(1, count / max);
    if (intensity > 0.7) return 'bg-brand';
    if (intensity > 0.4) return 'bg-brand/60';
    return 'bg-brand/30';
  }, []);

  const maxAppearances = useMemo(() => {
    return Math.max(...characterStats.map((s) => s.appearanceCount), 1);
  }, [characterStats]);

  const renderHeatmap = () => {
    const maxChapters = 20;
    const displayChapters = chapters.slice(0, maxChapters);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span>出场少</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-bg-subtle" />
            <div className="w-4 h-4 rounded bg-brand/30" />
            <div className="w-4 h-4 rounded bg-brand/60" />
            <div className="w-4 h-4 rounded bg-brand" />
          </div>
          <span>出场多</span>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="flex gap-1 mb-1">
              <div className="w-24 shrink-0" />
              {displayChapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="w-6 text-[9px] text-ink-faint text-center truncate"
                  title={ch.title}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {filteredAndSortedStats.slice(0, 15).map((stat) => (
              <div key={stat.character.id} className="flex gap-1 mb-0.5">
                <div
                  className="w-24 shrink-0 text-xs text-ink truncate cursor-pointer hover:text-brand"
                  onClick={() => onCharacterSelect(stat.character.id)}
                  title={stat.character.name}
                >
                  {stat.character.name}
                </div>
                {displayChapters.map((ch) => {
                  const count = (ch.content.match(new RegExp(stat.character.name, 'g')) || []).length;
                  return (
                    <div
                      key={ch.id}
                      className={`w-6 h-6 rounded ${getHeatmapColor(count, maxAppearances)}`}
                      title={`${ch.title}: ${count}次出场`}
                      onClick={() => onChapterSelect(ch.id)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <select
            className="input text-xs py-1 w-24"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">全部角色</option>
            <option value="protagonist">主角</option>
            <option value="supporting">配角</option>
            <option value="antagonist">反派</option>
            <option value="extra">龙套</option>
          </select>

          <select
            className="input text-xs py-1 w-28"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="appearances">按出场次数</option>
            <option value="name">按名称</option>
            <option value="lastAppearance">按最近出场</option>
          </select>

          <button
            className={`px-2 py-1 rounded text-xs transition-all ${
              showHeatmap ? 'bg-brand text-white' : 'bg-bg-subtle text-ink-muted hover:text-ink'
            }`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            热力图
          </button>
        </div>

        <span className="text-xs text-ink-faint">
          共 {characters.length} 个角色
        </span>
      </div>

      {showHeatmap ? (
        <div className="flex-1 overflow-y-auto p-4">{renderHeatmap()}</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredAndSortedStats.map((stat) => (
              <div
                key={stat.character.id}
                className="p-3 rounded-lg border border-border-subtle hover:border-border transition-all cursor-pointer"
                onClick={() => onCharacterSelect(stat.character.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{stat.character.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-subtle text-ink-faint">
                      {CHARACTER_ROLE_LABELS[stat.character.role]}
                    </span>
                  </div>
                  <span className="text-xs text-brand font-medium">
                    {stat.appearanceCount} 次出场
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-faint">
                  <span>出场章节: {stat.chapterIds.length}</span>
                  <span>最近: {stat.lastAppearance}</span>
                  <span>关系数: {stat.relationshipStrength}</span>
                </div>

                <div className="mt-2 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all"
                    style={{ width: `${(stat.chapterIds.length / Math.max(chapters.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dormantCharacters.length > 0 && !showHeatmap && (
        <div className="border-t border-border-subtle p-4">
          <h4 className="text-xs font-medium text-warning mb-2">
            长期未出场角色 ({dormantCharacters.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {dormantCharacters.slice(0, 5).map((stat) => (
              <button
                key={stat.character.id}
                className="px-2 py-1 rounded text-xs bg-warning/10 text-warning hover:bg-warning/20"
                onClick={() => onCharacterSelect(stat.character.id)}
              >
                {stat.character.name}
              </button>
            ))}
            {dormantCharacters.length > 5 && (
              <span className="text-xs text-ink-faint self-center">
                +{dormantCharacters.length - 5} 更多
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterStatsPanel;
