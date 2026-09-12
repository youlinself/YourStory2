import React, { useMemo } from 'react';
import {
  Crown, Star, Sparkles, BookOpen, Sprout, Cake, Dumbbell, TrendingUp, Target,
  Coins, Layers, Landmark, Shuffle, Link2, Gift, Flower2, RotateCcw, type LucideIcon,
} from 'lucide-react';
import useSimulationStore from '../../stores/simulationStore';
import useBondStore from '../../stores/bondStore';
import { BOND_CARD_MAP, BOND_GROUPS } from '../../data/bondCards';
import {
  ERAS,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ICONS,
  ATTRIBUTE_COLORS,
  CULTIVATION_REALM_NAMES,
  RARITY_NAMES,
} from '../../data/simulationData';
import type { PlayerAttributes, LifeCard, LifeRelic } from '../../types/simulation';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-ink-muted',
  uncommon: 'text-success',
  rare: 'text-info',
  boss: 'text-power',
  legendary: 'text-warning',
};

interface LifeSummaryProps {
  onRestart: () => void;
}

const LifeSummary: React.FC<LifeSummaryProps> = ({ onRestart }) => {
  const birthYear = useSimulationStore((s: any) => s.birthYear);
  const age = useSimulationStore((s: any) => s.age);
  const maxLifespan = useSimulationStore((s: any) => s.maxLifespan);
  const attributes = useSimulationStore((s: any) => s.attributes);
  const baseAttributes = useSimulationStore((s: any) => s.baseAttributes);
  const cultivation = useSimulationStore((s: any) => s.cultivation);
  const deck = useSimulationStore((s: any) => s.deck);
  const relics = useSimulationStore((s: any) => s.relics);
  const gold = useSimulationStore((s: any) => s.gold);
  const choiceHistory = useSimulationStore((s: any) => s.choiceHistory);
  const lifeRecords = useSimulationStore((s: any) => s.lifeRecords);
  const mode = useSimulationStore((s: any) => s.mode);

  const bondCollection = useBondStore((s) => s.collection);
  const bondActiveGroups = useBondStore((s) => s.activeBondGroups);
  const bondActiveTiers = useBondStore((s) => s.activeBondTiers);
  const claimedRewards = useBondStore((s) => s.claimedRewards);
  const getCollectionStats = useBondStore((s) => s.getCollectionStats);

  const bondStats = getCollectionStats();

  const deathYear = birthYear ? birthYear + age : 0;
  const era = ERAS.find((e) => e.year === birthYear);

  const stats = useMemo(() => {
    const totalAttributeGain = Object.keys(attributes).reduce((sum: number, key) => {
      const attr = key as keyof PlayerAttributes;
      return sum + Math.max(0, (attributes as PlayerAttributes)[attr] - (baseAttributes as PlayerAttributes)[attr]);
    }, 0);

    const successChoices = (choiceHistory as any[]).filter((c: any) => c.success).length;
    const totalChoices = (choiceHistory as any[]).length;

    const attributeGrowth: { attr: keyof PlayerAttributes; gain: number }[] = Object.keys(attributes).map((key) => {
      const attr = key as keyof PlayerAttributes;
      return {
        attr,
        gain: (attributes as PlayerAttributes)[attr] - (baseAttributes as PlayerAttributes)[attr],
      };
    }).sort((a, b) => b.gain - a.gain);

    return {
      totalAttributeGain,
      successChoices,
      totalChoices,
      successRate: totalChoices > 0 ? Math.round((successChoices / totalChoices) * 100) : 0,
      attributeGrowth,
    };
  }, [attributes, baseAttributes, choiceHistory]);

  const lifeEvaluation = useMemo(() => {
    let score = 0;
    const evaluations: string[] = [];

    const totalAttrs = (Object.values(attributes) as number[]).reduce((a: number, b: number) => a + b, 0);

    if (totalAttrs >= 500) {
      score += 30;
      evaluations.push('属性超群');
    } else if (totalAttrs >= 400) {
      score += 20;
      evaluations.push('属性优秀');
    } else if (totalAttrs >= 300) {
      score += 10;
      evaluations.push('属性良好');
    }

    if (age >= 100) {
      score += 30;
      evaluations.push('百岁人瑞');
    } else if (age >= 80) {
      score += 20;
      evaluations.push('长寿安康');
    } else if (age >= 60) {
      score += 10;
      evaluations.push('安享天年');
    }

    if (cultivation) {
      const realmScores: Record<string, number> = {
        mortal: 0,
        qi_refining: 5,
        foundation: 10,
        golden_core: 15,
        nascent: 20,
        spirit: 25,
        void: 30,
        integration: 35,
        mahayana: 40,
        tribulation: 50,
      };
      const realmScore = realmScores[cultivation.realm] || 0;
      score += realmScore;
      if (realmScore > 0) {
        evaluations.push(`修仙${CULTIVATION_REALM_NAMES[cultivation.realm]}`);
      }
    }

    if (stats.successRate >= 80 && stats.totalChoices >= 10) {
      score += 15;
      evaluations.push('顺风顺水');
    }

    if (gold >= 500) {
      score += 10;
      evaluations.push('富甲一方');
    } else if (gold >= 200) {
      score += 5;
      evaluations.push('小有积蓄');
    }

    if (relics.length >= 10) {
      score += 10;
      evaluations.push('收藏家');
    }

    let title = '平凡一生';
    let titleIcon: LucideIcon = Sprout;
    if (score >= 100) {
      title = '传奇人生';
      titleIcon = Crown;
    } else if (score >= 80) {
      title = '辉煌人生';
      titleIcon = Star;
    } else if (score >= 60) {
      title = '精彩人生';
      titleIcon = Star;
    } else if (score >= 40) {
      title = '充实人生';
      titleIcon = Sparkles;
    } else if (score >= 20) {
      title = '普通人生';
      titleIcon = BookOpen;
    }

    return { score, title, titleIcon, evaluations };
  }, [attributes, age, cultivation, stats, gold, relics.length]);

  const timelineEvents = useMemo(() => {
    const events: { age: number; year: number; title: string; type: 'choice' | 'record' }[] = [];

    (choiceHistory as any[]).forEach((record: any) => {
      events.push({
        age: record.year - (birthYear || 0),
        year: record.year,
        title: record.description,
        type: 'choice',
      });
    });

    (lifeRecords as any[]).forEach((record: any) => {
      events.push({
        age: record.year - (birthYear || 0),
        year: record.year,
        title: record.title,
        type: 'record',
      });
    });

    return events.sort((a, b) => a.year - b.year);
  }, [choiceHistory, lifeRecords, birthYear]);

  const LifeTitleIcon = lifeEvaluation.titleIcon;

  return (
    <div className="min-h-full bg-gradient-to-b from-bg-base to-bg-elevated">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-bg-elevated rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-brand to-brand-hover px-8 py-10 text-center text-white">
            <div className="mb-3 flex justify-center"><LifeTitleIcon className="h-14 w-14" strokeWidth={1.5} /></div>
            <h1 className="text-3xl font-bold mb-2">{lifeEvaluation.title}</h1>
            <p className="text-white/80 text-lg">
              {birthYear}年 - {deathYear}年
            </p>
            <p className="text-white/60 text-sm mt-1">
              享年 {age} 岁 {cultivation ? `· 寿元 ${cultivation.maxLifespan}年` : `· 寿命上限 ${Math.round(maxLifespan)}年`}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <Section title="人生数据">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="最终年龄" value={`${age}岁`} icon={Cake} />
                <StatCard label="总属性值" value={String((Object.values(attributes) as number[]).reduce((a: number, b: number) => a + b, 0))} icon={Dumbbell} />
                <StatCard label="属性成长" value={`+${stats.totalAttributeGain}`} icon={TrendingUp} />
                <StatCard label="选择成功率" value={`${stats.successRate}%`} icon={Target} />
                <StatCard label="获得金币" value={String(gold)} icon={Coins} />
                <StatCard label="收集卡牌" value={String(deck.length)} icon={Layers} />
                <StatCard label="收集遗物" value={String(relics.length)} icon={Landmark} />
                <StatCard label="人生选择" value={String(stats.totalChoices)} icon={Shuffle} />
                <StatCard label="收集卡牌" value={String(bondStats.unique)} icon={Layers} />
                <StatCard label="激活羁绊" value={String(bondActiveGroups.length)} icon={Link2} />
                <StatCard label="羁绊等级" value={String(Object.values(bondActiveTiers).reduce((a: number, b: number) => a + b, 0))} icon={Star} />
                <StatCard label="领取奖励" value={String(claimedRewards.length)} icon={Gift} />
              </div>
            </Section>

            <Section title="最终属性">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(attributes) as (keyof PlayerAttributes)[]).map((attr) => {
                  const value = attributes[attr];
                  const base = baseAttributes[attr];
                  const growth = value - base;
                  return (
                    <div key={attr} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg">
                      <span className="text-xl">{ATTRIBUTE_ICONS[attr]}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-ink">{ATTRIBUTE_NAMES[attr]}</span>
                          <span className="text-sm font-bold" style={{ color: ATTRIBUTE_COLORS[attr] }}>
                            {value}
                            {growth !== 0 && (
                              <span className={`ml-1 text-xs ${growth > 0 ? 'text-success' : 'text-danger'}`}>
                                ({growth > 0 ? '+' : ''}{growth})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (value / 100) * 100)}%`,
                              backgroundColor: ATTRIBUTE_COLORS[attr],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {cultivation && (
              <Section title="修仙境界">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-power/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-power">
                        {CULTIVATION_REALM_NAMES[cultivation.realm] || cultivation.realm}
                      </p>
                      <p className="text-sm text-power mt-1">
                        寿元延长至 {cultivation.maxLifespan} 年
                      </p>
                    </div>
                    <Flower2 className="h-10 w-10 text-power" strokeWidth={1.5} />
                  </div>
                  {cultivation.realmBonus && Object.keys(cultivation.realmBonus).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(cultivation.realmBonus).map(([attr, value]) => (
                        <span key={attr} className="px-2 py-1 bg-power-light text-power text-xs rounded-full">
                          {ATTRIBUTE_NAMES[attr as keyof PlayerAttributes] || attr} +{String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {lifeEvaluation.evaluations.length > 0 && (
              <Section title="人生成就">
                <div className="flex flex-wrap gap-2">
                  {lifeEvaluation.evaluations.map((evaluation, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-warning text-sm font-medium rounded-full border border-warning/30"
                    >
                      {evaluation}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {(deck as any[]).length > 0 && (
              <Section title="卡组概览">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(deck as any[]).slice(0, 12).map((card: any) => (
                    <Card key={card.id} card={card as LifeCard} />
                  ))}
                  {(deck as any[]).length > 12 && (
                    <div className="flex items-center justify-center p-2 bg-bg-elevated rounded-lg text-sm text-ink-muted">
                      还有 {(deck as any[]).length - 12} 张...
                    </div>
                  )}
                </div>
              </Section>
            )}

            {bondCollection.length > 0 && (
              <Section title="羁绊回顾">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <Layers className="h-6 w-6 mx-auto mb-1 text-ink-secondary" strokeWidth={1.75} />
                      <div className="text-lg font-bold text-ink">{bondStats.unique}</div>
                      <div className="text-xs text-ink-muted">收集卡牌</div>
                    </div>
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <Link2 className="h-6 w-6 mx-auto mb-1 text-brand" strokeWidth={1.75} />
                      <div className="text-lg font-bold text-brand">{bondActiveGroups.length}</div>
                      <div className="text-xs text-ink-muted">激活羁绊</div>
                    </div>
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="text-lg font-bold text-warning">{Object.values(bondActiveTiers).reduce((a: number, b: number) => a + b, 0)}</div>
                      <div className="text-xs text-ink-muted">羁绊等级</div>
                    </div>
                    <div className="text-center p-3 bg-bg-elevated rounded-lg">
                      <Gift className="h-6 w-6 mx-auto mb-1 text-success" strokeWidth={1.75} />
                      <div className="text-lg font-bold text-success">{claimedRewards.length}</div>
                      <div className="text-xs text-ink-muted">领取奖励</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-ink mb-2">已激活的羁绊</h4>
                    <div className="flex flex-wrap gap-2">
                      {bondActiveGroups.length > 0 ? (
                        bondActiveGroups.map((groupId) => {
                          const group = BOND_GROUPS.find((g) => g.id === groupId);
                          if (!group) return null;
                          const tier = bondActiveTiers[groupId] || 0;
                          return (
                            <span
                              key={groupId}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-power text-sm font-medium rounded-full border border-power/30"
                            >
                              {group.icon} {group.name} {tier > 0 ? `T${tier}` : ''}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-ink-muted">未激活任何羁绊</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-ink mb-2">已收集卡牌</h4>
                    <div className="flex flex-wrap gap-2">
                      {bondCollection.length > 0 ? (
                        bondCollection.slice(0, 8).map((cardInstance) => {
                          const card = BOND_CARD_MAP[cardInstance.cardDefId];
                          if (!card) return null;
                          return (
                            <span
                              key={cardInstance.instanceId}
                              className="px-2 py-1 bg-bg-elevated text-ink text-xs rounded-full border border-border-subtle"
                              title={`${card.name} - ${card.description}`}
                            >
                              {card.icon} {card.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-ink-muted">未收集任何卡牌</span>
                      )}
                      {bondCollection.length > 8 && (
                        <span className="text-xs text-ink-muted">
                          +{bondCollection.length - 8} 更多...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {(relics as any[]).length > 0 && (
              <Section title="遗物收藏">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(relics as any[]).map((relic: any) => (
                    <Relic key={relic.id} relic={relic as LifeRelic} />
                  ))}
                </div>
              </Section>
            )}

            {timelineEvents.length > 0 && (
              <Section title="人生轨迹">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-subtle" />
                  <div className="space-y-3">
                    {timelineEvents.slice(0, 15).map((event, index) => (
                      <div key={index} className="relative pl-10">
                        <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${event.type === 'choice' ? 'bg-brand' : 'bg-gold'}`} />
                        <div className="bg-bg-elevated rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-ink">{event.title}</span>
                            <span className="text-xs text-ink-muted ml-2 whitespace-nowrap">
                              {event.age}岁 ({event.year}年)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {timelineEvents.length > 15 && (
                      <p className="text-sm text-ink-muted text-center py-2">
                        共 {timelineEvents.length} 条记录，仅显示前 15 条
                      </p>
                    )}
                  </div>
                </div>
              </Section>
            )}

            <div className="pt-4 border-t border-border-subtle">
              <button
                onClick={onRestart}
                className="w-full py-3 bg-gradient-to-r from-brand to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>开启新的人生</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-ink-muted text-xs mt-4">
          {era?.name || '未知年代'} · {mode === 'endless' ? '无尽模式' : '普通模式'}
        </p>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-ink mb-3">{title}</h3>
    {children}
  </div>
);

const StatCard: React.FC<{ label: string; value: string; icon: LucideIcon }> = ({ label, value, icon: Icon }) => (
  <div className="bg-bg-elevated rounded-lg p-3 text-center">
    <Icon className="h-6 w-6 mx-auto mb-1 text-brand" strokeWidth={1.75} />
    <div className="text-lg font-bold text-ink">{value}</div>
    <div className="text-xs text-ink-muted">{label}</div>
  </div>
);

const Card: React.FC<{ card: LifeCard }> = ({ card }) => (
  <div className="p-2 bg-bg-elevated rounded-lg">
    <div className="flex items-center gap-2">
      <span className="text-lg">{card.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{card.name}</p>
        <p className={`text-xs ${RARITY_COLORS[card.rarity] || 'text-ink-muted'}`}>
          {RARITY_NAMES[card.rarity] || card.rarity}
        </p>
      </div>
    </div>
  </div>
);

const Relic: React.FC<{ relic: LifeRelic }> = ({ relic }) => (
  <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg">
    <span className="text-2xl">{relic.icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-ink truncate">{relic.name}</p>
      <p className={`text-xs ${RARITY_COLORS[relic.rarity] || 'text-ink-muted'}`}>
        {RARITY_NAMES[relic.rarity] || relic.rarity}
      </p>
    </div>
  </div>
);

export default LifeSummary;
