import React, { useState } from 'react';
import useNovelStore from '../../stores/novelStore';
import useAIStore from '../../stores/aiStore';
import NovelAIService from '../../services/ai/NovelAIService';
import { useToast } from '../common/Toast';
import type { WorldBuilding } from '../../types/novel';

interface WorldBuildingPanelProps {
  novelId: string;
  worldBuilding: WorldBuilding | null;
}

const WorldBuildingPanel: React.FC<WorldBuildingPanelProps> = ({
  novelId,
  worldBuilding,
}) => {
  const { updateWorldBuilding } = useNovelStore();
  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(!worldBuilding);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [formData, setFormData] = useState({
    setting: worldBuilding?.setting || '',
    era: worldBuilding?.era || '',
    location: worldBuilding?.location || '',
    magicSystem: worldBuilding?.magicSystem || '',
    factions: worldBuilding?.factions?.join('\n') || '',
    rules: worldBuilding?.rules?.join('\n') || '',
    notes: worldBuilding?.notes || '',
  });

  const handleAIGenerate = async () => {
    if (!apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return;
    }

    if (!formData.setting && !formData.era && !formData.location) {
      toast.addToast({ type: 'warning', message: '请先输入一些世界观设定' });
      return;
    }

    setIsAIGenerating(true);
    try {
      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature,
        customModelName,
      });

      const description = [
        formData.setting && `世界设定：${formData.setting}`,
        formData.era && `时代：${formData.era}`,
        formData.location && `地点：${formData.location}`,
        formData.magicSystem && `力量体系：${formData.magicSystem}`,
      ]
        .filter(Boolean)
        .join('\n');

      const result = await aiService.generateWorldBuilding(description);
      if (result) {
        setFormData((prev) => ({
          ...prev,
          setting: result.setting || prev.setting,
          era: result.era || prev.era,
          location: result.location || prev.location,
          magicSystem: result.magicSystem || prev.magicSystem,
          factions: result.factions?.join('\n') || prev.factions,
          rules: result.rules?.join('\n') || prev.rules,
        }));
        toast.addToast({ type: 'success', message: '世界观已生成' });
      }
    } catch {
      toast.addToast({ type: 'error', message: '生成失败' });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateWorldBuilding(novelId, {
        setting: formData.setting,
        era: formData.era,
        location: formData.location,
        magicSystem: formData.magicSystem,
        factions: formData.factions.split('\n').filter((f) => f.trim()),
        rules: formData.rules.split('\n').filter((r) => r.trim()),
        notes: formData.notes,
      });
      toast.addToast({ type: 'success', message: '世界观已保存' });
      setIsEditing(false);
    } catch {
      toast.addToast({ type: 'error', message: '保存失败' });
    }
  };

  const handleCancel = () => {
    if (worldBuilding) {
      setFormData({
        setting: worldBuilding.setting,
        era: worldBuilding.era,
        location: worldBuilding.location,
        magicSystem: worldBuilding.magicSystem,
        factions: worldBuilding.factions.join('\n'),
        rules: worldBuilding.rules.join('\n'),
        notes: worldBuilding.notes,
      });
      setIsEditing(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">世界观设定</h2>
          {!isEditing && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsEditing(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>编辑</span>
            </button>
          )}
        </div>

        {worldBuilding || isEditing ? (
          <div className="space-y-6">
            {isEditing && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-brand/5 border border-brand/20">
                <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
                <span className="text-sm text-brand">编辑模式</span>
                <div className="flex-1" />
                <button
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={handleAIGenerate}
                  disabled={isAIGenerating}
                >
                  {isAIGenerating ? '生成中...' : 'AI补全'}
                </button>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-ink mb-2 block">世界概述</label>
              {isEditing ? (
                <textarea
                  className="input text-sm min-h-[100px]"
                  placeholder="描述这个世界的基本设定..."
                  value={formData.setting}
                  onChange={(e) => setFormData({ ...formData, setting: e.target.value })}
                />
              ) : (
                <div className="p-4 rounded-lg bg-bg-subtle">
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {worldBuilding?.setting || '未设置'}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">时代背景</label>
                {isEditing ? (
                  <input
                    className="input text-sm"
                    placeholder="如：古代、现代、未来..."
                    value={formData.era}
                    onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-bg-subtle">
                    <p className="text-sm text-ink">{worldBuilding?.era || '未设置'}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">主要地点</label>
                {isEditing ? (
                  <input
                    className="input text-sm"
                    placeholder="故事发生的主要地点..."
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-bg-subtle">
                    <p className="text-sm text-ink">{worldBuilding?.location || '未设置'}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-2 block">力量体系</label>
              {isEditing ? (
                <textarea
                  className="input text-sm min-h-[80px]"
                  placeholder="修炼体系、魔法体系、科技水平等..."
                  value={formData.magicSystem}
                  onChange={(e) => setFormData({ ...formData, magicSystem: e.target.value })}
                />
              ) : (
                <div className="p-4 rounded-lg bg-bg-subtle">
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {worldBuilding?.magicSystem || '未设置'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-2 block">势力/组织</label>
              {isEditing ? (
                <textarea
                  className="input text-sm min-h-[80px]"
                  placeholder="每行一个势力或组织..."
                  value={formData.factions}
                  onChange={(e) => setFormData({ ...formData, factions: e.target.value })}
                />
              ) : (
                <div className="p-4 rounded-lg bg-bg-subtle">
                  {worldBuilding?.factions && worldBuilding.factions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {worldBuilding.factions.map((faction, index) => (
                        <span key={index} className="badge badge-ghost text-xs">
                          {faction}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-faint">未设置</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-2 block">世界规则</label>
              {isEditing ? (
                <textarea
                  className="input text-sm min-h-[80px]"
                  placeholder="每行一条世界规则..."
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                />
              ) : (
                <div className="p-4 rounded-lg bg-bg-subtle">
                  {worldBuilding?.rules && worldBuilding.rules.length > 0 ? (
                    <ul className="space-y-2">
                      {worldBuilding.rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-ink">
                          <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink-faint">未设置</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-2 block">备注</label>
              {isEditing ? (
                <textarea
                  className="input text-sm min-h-[60px]"
                  placeholder="其他备注信息..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              ) : (
                <div className="p-4 rounded-lg bg-bg-subtle">
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {worldBuilding?.notes || '无'}
                  </p>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
                {worldBuilding && (
                  <button className="btn btn-ghost" onClick={handleCancel}>
                    取消
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleSave}>
                  保存
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-ink-faint mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <p className="text-ink-muted mb-4">还没有世界观设定</p>
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              开始设定世界观
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldBuildingPanel;
