import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGameRecordStore from '../../stores/gameRecordStore';
import { CULTIVATION_REALM_NAMES, ATTRIBUTE_NAMES, ATTRIBUTE_ICONS, ATTRIBUTE_COLORS, RARITY_NAMES } from '../../data/simulationData';
import type { GameRecord, PlayerAttributes } from '../../types/simulation';
import { useToast } from '../../components/common';

const RecordDetailPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const { getRecord, loadRecords } = useGameRecordStore();
  const { addToast } = useToast();
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attributes' | 'deck' | 'relics' | 'timeline' | 'bonds'>('overview');

  useEffect(() => {
    if (recordId) {
      const found = getRecord(recordId);
      if (found) {
        setRecord(found);
      } else {
        loadRecords().then(() => {
          const retry = getRecord(recordId);
          if (retry) {
            setRecord(retry);
          } else {
            addToast({ type: 'error', message: '记录不存在' });
            navigate('/records');
          }
        });
      }
    }
  }, [recordId, getRecord, loadRecords, navigate, addToast]);

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-3 border-brand border-t-transparent rounded-full mb-4" />
          <p className="text-ink-muted text-sm">加载记录详情...</p>
        </div>
      </div>
    );
  }

  const gs = record.gameState;
  const deathYear = record.deathYear;

  const totalChoices = gs.choiceHistory.length;

  const timelineEvents = [
    ...gs.choiceHistory.map((c) => ({
      age: c.year - record.birthYear,
      year: c.year,
      title: c.description,
      type: 'choice' as const,
    })),
    ...gs.lifeRecords.map((r) => ({
      age: r.year - record.birthYear,
      year: r.year,
      title: r.title,
      type: 'record' as const,
    })),
  ].sort((a, b) => a.year - b.year);

  return (
    <div className="min-h-full bg-gradient-to-b from-bg-base to-bg-elevated">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-brand to-purple-600 px-8 py-10 text-center text-white">
            <button
              onClick={() => navigate('/records')}
              className="absolute left-6 top-6 text-white/70 hover:text-white transition-colors"
            >
              ← 返回
            </button>
            <div className="text-5xl mb-3">{record.titleIcon}</div>
            <h1 className="text-3xl font-bold mb-2">{record.title}</h1>
            <p className="text-white/80 text-lg">
              {record.birthYear}年 - {deathYear}年
            </p>
            <p className="text-white/60 text-sm mt-1">
              享年 {record.age} 岁 {gs.cultivation ? `· 寿元 ${gs.cultivation.maxLifespan}年` : `· 寿命上限 ${Math.round(record.maxLifespan)}年`}
            </p>
          </div>

          <div className="p-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { key: 'overview', label: '📊 概览' },
                { key: 'attributes', label: '🌟 属性' },
                { key: 'deck', label: '🃏 卡组' },
                { key: 'relics', label: '🏺 遗物' },
                { key: 'bonds', label: '🔗 羁绊' },
                { key: 'timeline', label: '📜 轨迹' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-ink-muted hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="最终年龄" value={`${record.age}岁`} icon="🎂" />
                  <StatCard label="总属性值" value={String(Object.values(record.finalAttributes).reduce((a, b) => a + b, 0))} icon="💪" />
                  <StatCard label="属性成长" value={`+${record.totalAttributeGain}`} icon="📈" />
                  <StatCard label="选择成功率" value={`${record.successRate}%`} icon="🎯" />
                  <StatCard label="获得金币" value={String(record.gold)} icon="💰" />
                  <StatCard label="收集卡牌" value={String(record.deckSize)} icon="🃏" />
                  <StatCard label="收集遗物" value={String(record.relicsCount)} icon="🏺" />
                  <StatCard label="人生选择" value={String(totalChoices)} icon="🔀" />
                </div>

                {gs.cultivation && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-purple-700">
                          {CULTIVATION_REALM_NAMES[gs.cultivation.realm] || gs.cultivation.realm}
                        </p>
                        <p className="text-sm text-purple-600 mt-1">
                          寿元延长至 {gs.cultivation.maxLifespan} 年
                        </p>
                      </div>
                      <div className="text-4xl">🧘</div>
                    </div>
                    {gs.cultivation.realmBonus && Object.keys(gs.cultivation.realmBonus).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(gs.cultivation.realmBonus).map(([attr, value]) => (
                          <span key={attr} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {ATTRIBUTE_NAMES[attr as keyof PlayerAttributes] || attr} +{String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {record.evaluations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-ink mb-3">🏆 人生成就</h3>
                    <div className="flex flex-wrap gap-2">
                      {record.evaluations.map((evaluation, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-sm font-medium rounded-full border border-amber-200"
                        >
                          {evaluation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(record.finalAttributes) as (keyof PlayerAttributes)[]).map((attr) => {
                  const value = record.finalAttributes[attr];
                  const base = record.baseAttributes[attr];
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
                              <span className={`ml-1 text-xs ${growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                ({growth > 0 ? '+' : ''}{growth})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
            )}

            {/* Deck Tab */}
            {activeTab === 'deck' && (
              <div>
                <h3 className="text-lg font-semibold text-ink mb-3">🃏 卡组 ({gs.deck.length}张)</h3>
                {gs.deck.length === 0 ? (
                  <p className="text-ink-muted text-center py-8">卡组为空</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {gs.deck.map((card) => (
                      <div key={card.id} className="p-2 bg-bg-elevated rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{card.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{card.name}</p>
                            <p className="text-xs text-gray-500">{RARITY_NAMES[card.rarity] || card.rarity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Relics Tab */}
            {activeTab === 'relics' && (
              <div>
                <h3 className="text-lg font-semibold text-ink mb-3">🏺 遗物收藏 ({gs.relics.length}件)</h3>
                {gs.relics.length === 0 ? (
                  <p className="text-ink-muted text-center py-8">无遗物</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {gs.relics.map((relic) => (
                      <div key={relic.id} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg">
                        <span className="text-2xl">{relic.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{relic.name}</p>
                          <p className="text-xs text-gray-500">{RARITY_NAMES[relic.rarity] || relic.rarity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bonds Tab */}
            {activeTab === 'bonds' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-bg-elevated rounded-lg">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="text-lg font-bold text-ink">{record.bondNpcCount}</div>
                    <div className="text-xs text-ink-muted">遇到NPC</div>
                  </div>
                  <div className="text-center p-3 bg-bg-elevated rounded-lg">
                    <div className="text-2xl mb-1">🔗</div>
                    <div className="text-lg font-bold text-brand">{record.bondGroupCount}</div>
                    <div className="text-xs text-ink-muted">激活羁绊</div>
                  </div>
                  <div className="text-center p-3 bg-bg-elevated rounded-lg">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-lg font-bold text-amber-500">{record.bondTotalTier}</div>
                    <div className="text-xs text-ink-muted">羁绊等级</div>
                  </div>
                  <div className="text-center p-3 bg-bg-elevated rounded-lg">
                    <div className="text-2xl mb-1">🎁</div>
                    <div className="text-lg font-bold text-green-500">0</div>
                    <div className="text-xs text-ink-muted">领取奖励</div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold text-ink mb-3">📜 人生轨迹</h3>
                {timelineEvents.length === 0 ? (
                  <p className="text-ink-muted text-center py-8">无记录</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-subtle" />
                    <div className="space-y-3">
                      {timelineEvents.slice(0, 20).map((event, index) => (
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
                      {timelineEvents.length > 20 && (
                        <p className="text-sm text-ink-muted text-center py-2">
                          共 {timelineEvents.length} 条记录，仅显示前 20 条
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-6 mt-6 border-t border-border-subtle">
              <button
                onClick={() => navigate('/records')}
                className="w-full py-3 bg-bg-elevated border border-border-subtle text-ink-muted rounded-xl font-medium hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2"
              >
                <span>←</span>
                <span>返回记录列表</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-ink-muted text-xs mt-4">
          {record.mode === 'endless' ? '修仙模式' : '普通模式'} · 记录于 {new Date(record.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-bg-elevated rounded-lg p-3 text-center">
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-lg font-bold text-ink">{value}</div>
    <div className="text-xs text-ink-muted">{label}</div>
  </div>
);

export default RecordDetailPage;
