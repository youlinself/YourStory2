import React, { useState } from 'react';
import useNovelStore from '../../stores/novelStore';
import useAIStore from '../../stores/aiStore';
import NovelAIService from '../../services/ai/NovelAIService';
import { useToast } from '../common/Toast';
import Modal from '../ui/Modal';
import {
  CHARACTER_ROLE_LABELS,
  CharacterRole,
  CharacterGender,
} from '../../types/novel';
import type { Character } from '../../types/novel';

interface CharacterPanelProps {
  novelId: string;
  characters: Character[];
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({
  novelId,
  characters,
}) => {
  const { addCharacter, updateCharacter, deleteCharacter } = useNovelStore();
  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    alias: [] as string[],
    role: 'supporting' as CharacterRole,
    gender: 'unknown' as CharacterGender,
    age: 20,
    appearance: '',
    personality: '',
    background: '',
    goals: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      alias: [],
      role: 'supporting',
      gender: 'unknown',
      age: 20,
      appearance: '',
      personality: '',
      background: '',
      goals: '',
      notes: '',
    });
    setEditingCharacter(null);
  };

  const handleOpenModal = (character?: Character) => {
    if (character) {
      setEditingCharacter(character);
      setFormData({
        name: character.name,
        alias: character.alias,
        role: character.role,
        gender: character.gender,
        age: character.age,
        appearance: character.appearance,
        personality: character.personality,
        background: character.background,
        goals: character.goals,
        notes: character.notes,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleAIGenerate = async () => {
    if (!apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return;
    }

    if (!formData.name && !formData.appearance && !formData.personality) {
      toast.addToast({ type: 'warning', message: '请先输入一些角色特征' });
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
        formData.name && `名字：${formData.name}`,
        formData.appearance && `外貌：${formData.appearance}`,
        formData.personality && `性格：${formData.personality}`,
        formData.background && `背景：${formData.background}`,
        formData.goals && `目标：${formData.goals}`,
      ]
        .filter(Boolean)
        .join('\n');

      const profile = await aiService.generateCharacterProfile(description);
      if (profile) {
        setFormData((prev) => ({
          ...prev,
          name: profile.name || prev.name,
          gender: profile.gender || prev.gender,
          age: profile.age || prev.age,
          appearance: profile.appearance || prev.appearance,
          personality: profile.personality || prev.personality,
          background: profile.background || prev.background,
          goals: profile.goals || prev.goals,
        }));
        toast.addToast({ type: 'success', message: '角色设定已生成' });
      }
    } catch {
      toast.addToast({ type: 'error', message: '生成失败' });
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.addToast({ type: 'warning', message: '请输入角色名' });
      return;
    }

    try {
      if (editingCharacter) {
        await updateCharacter(novelId, editingCharacter.id, formData);
        toast.addToast({ type: 'success', message: '角色已更新' });
      } else {
        await addCharacter(novelId, {
          ...formData,
          avatar: '',
          relationships: [],
        });
        toast.addToast({ type: 'success', message: '角色已添加' });
      }
      handleCloseModal();
    } catch {
      toast.addToast({ type: 'error', message: '保存失败' });
    }
  };

  const handleDelete = async (characterId: string) => {
    if (!confirm('确定要删除这个角色吗？')) return;
    try {
      await deleteCharacter(novelId, characterId);
      toast.addToast({ type: 'success', message: '角色已删除' });
    } catch {
      toast.addToast({ type: 'error', message: '删除失败' });
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">角色管理</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleOpenModal()}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>添加角色</span>
          </button>
        </div>

        {characters.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="card cursor-pointer group"
                onClick={() => handleOpenModal(character)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center shrink-0">
                    {character.avatar ? (
                      <img
                        src={character.avatar}
                        alt={character.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-brand">
                        {character.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-ink truncate">
                        {character.name}
                      </h3>
                      <span className="badge badge-ghost text-[10px]">
                        {CHARACTER_ROLE_LABELS[character.role]}
                      </span>
                    </div>
                    <p className="text-xs text-ink-faint mb-2">
                      {character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '未知'} · {character.age}岁
                    </p>
                    {character.personality && (
                      <p className="text-xs text-ink-muted line-clamp-2">
                        {character.personality}
                      </p>
                    )}
                  </div>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="w-6 h-6 rounded-full bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(character.id);
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-ink-muted mb-4">还没有任何角色</p>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
            >
              添加第一个角色
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCharacter ? '编辑角色' : '添加角色'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={handleAIGenerate}
              disabled={isAIGenerating}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span>{isAIGenerating ? '生成中...' : 'AI补全'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink mb-1 block">
                角色名 <span className="text-danger">*</span>
              </label>
              <input
                className="input text-sm"
                placeholder="输入角色名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink mb-1 block">角色定位</label>
              <select
                className="input text-sm"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as CharacterRole })}
              >
                {Object.entries(CHARACTER_ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink mb-1 block">性别</label>
              <div className="flex gap-2">
                {[
                  { value: 'male', label: '男' },
                  { value: 'female', label: '女' },
                  { value: 'unknown', label: '未知' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                      formData.gender === value
                        ? 'bg-brand text-white'
                        : 'bg-bg-subtle text-ink-muted hover:bg-brand/10'
                    }`}
                    onClick={() => setFormData({ ...formData, gender: value as CharacterGender })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-ink mb-1 block">年龄</label>
              <input
                type="number"
                className="input text-sm"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink mb-1 block">外貌描写</label>
            <textarea
              className="input text-sm min-h-[60px]"
              placeholder="描述角色的外貌特征..."
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink mb-1 block">性格特点</label>
            <textarea
              className="input text-sm min-h-[60px]"
              placeholder="描述角色的性格特点..."
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink mb-1 block">背景故事</label>
            <textarea
              className="input text-sm min-h-[60px]"
              placeholder="角色的背景故事..."
              value={formData.background}
              onChange={(e) => setFormData({ ...formData, background: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink mb-1 block">目标/动机</label>
            <textarea
              className="input text-sm min-h-[60px]"
              placeholder="角色的目标和动机..."
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink mb-1 block">备注</label>
            <textarea
              className="input text-sm min-h-[60px]"
              placeholder="其他备注信息..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button className="btn btn-ghost" onClick={handleCloseModal}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingCharacter ? '保存' : '添加'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CharacterPanel;
