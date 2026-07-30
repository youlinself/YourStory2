import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGameRecordStore from '../../stores/gameRecordStore';
import { CULTIVATION_REALM_NAMES } from '../../data/simulationData';
import type { GameRecord } from '../../types/simulation';
import { useToast } from '../../components/common';

const GameRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { records, isLoading, loadRecords, deleteRecord, clearAllRecords } = useGameRecordStore();
  const { addToast } = useToast();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleViewDetail = (record: GameRecord) => {
    navigate(`/records/${record.id}`);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteRecord(id);
    addToast({ type: 'info', message: '记录已删除' });
  };

  const handleClearAll = async () => {
    await clearAllRecords();
    setShowConfirmClear(false);
    addToast({ type: 'info', message: '所有记录已清空' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 100) return 'text-amber-500';
    if (score >= 80) return 'text-purple-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-green-500';
    if (score >= 20) return 'text-gray-500';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-10 h-10 border-3 border-brand border-t-transparent rounded-full mb-4" />
          <p className="text-ink-muted text-sm">加载记录中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <span>📜</span>
            <span>游戏记录</span>
          </h1>
          <p className="text-ink-muted text-sm mt-1">共 {records.length} 条记录</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="px-4 py-2 text-sm text-danger border border-danger/30 rounded-lg hover:bg-danger/10 transition-all"
          >
            清空记录
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-xl border border-border-subtle p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-ink mb-2">暂无游戏记录</h3>
          <p className="text-ink-muted text-sm mb-6">完成一次游戏后，记录会自动保存到这里</p>
          <button
            onClick={() => navigate('/simulation')}
            className="px-6 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
          >
            开始新游戏
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              onClick={() => handleViewDetail(record)}
              className="bg-white rounded-xl border border-border-subtle p-5 hover:border-brand hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{record.titleIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-ink group-hover:text-brand transition-colors">
                      {record.title}
                    </h3>
                    <span className={`text-sm font-bold ${getScoreColor(record.score)}`}>
                      {record.score}分
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ink-muted mb-3">
                    <span>{record.birthYear}年 - {record.deathYear}年</span>
                    <span>享年 {record.age} 岁</span>
                    <span>{record.mode === 'endless' ? '修仙模式' : '普通模式'}</span>
                    {record.cultivationRealm && (
                      <span className="text-purple-600">
                        {CULTIVATION_REALM_NAMES[record.cultivationRealm] || record.cultivationRealm}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {record.evaluations.map((evaluation, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200"
                      >
                        {evaluation}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                    <div className="text-center p-2 bg-bg-elevated rounded-lg">
                      <div className="font-bold text-ink">{record.totalAttributeGain}</div>
                      <div className="text-ink-faint">属性成长</div>
                    </div>
                    <div className="text-center p-2 bg-bg-elevated rounded-lg">
                      <div className="font-bold text-ink">{record.gold}</div>
                      <div className="text-ink-faint">金币</div>
                    </div>
                    <div className="text-center p-2 bg-bg-elevated rounded-lg">
                      <div className="font-bold text-ink">{record.deckSize}</div>
                      <div className="text-ink-faint">卡牌</div>
                    </div>
                    <div className="text-center p-2 bg-bg-elevated rounded-lg">
                      <div className="font-bold text-ink">{record.relicsCount}</div>
                      <div className="text-ink-faint">遗物</div>
                    </div>
                    <div className="text-center p-2 bg-bg-elevated rounded-lg">
                      <div className="font-bold text-ink">{record.successRate}%</div>
                      <div className="text-ink-faint">成功率</div>
                    </div>
                    <div className="text-center p-2 bg-bg-elevated rounded-lg">
                      <div className="font-bold text-ink">{record.bondGroupCount}</div>
                      <div className="text-ink-faint">羁绊</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-ink-faint">{formatDate(record.createdAt)}</span>
                  <button
                    onClick={(e) => handleDelete(record.id, e)}
                    className="text-xs text-ink-faint hover:text-danger transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 清空确认弹窗 */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirmClear(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-ink mb-2">确认清空所有记录？</h3>
              <p className="text-sm text-ink-muted">此操作不可撤销</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2.5 border border-border-subtle text-ink-muted rounded-lg hover:border-brand hover:text-brand transition-all"
              >
                取消
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 bg-danger text-white rounded-lg hover:bg-danger/90 transition-all"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRecordsPage;
