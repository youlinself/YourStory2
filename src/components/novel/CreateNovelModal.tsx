import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import useNovelStore from '../../stores/novelStore';
import useAIStore from '../../stores/aiStore';
import { UnifiedLLMService } from '../../agent/llm/UnifiedLLMService';
import { useToast } from '../common/Toast';
import {
  GENRE_LABELS,
  NOVEL_TEMPLATES,
  NovelGenre,
} from '../../types/novel';
import type { NovelTemplate, CharacterRole, CharacterGender } from '../../types/novel';

interface CreateNovelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateMethod = 'blank' | 'template' | 'ai';

const CreateNovelModal: React.FC<CreateNovelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { createNovel, addChapter, addCharacter, updateWorldBuilding } = useNovelStore();
  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [createMethod, setCreateMethod] = useState<CreateMethod>('blank');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<NovelGenre>('fantasy');
  const [synopsis, setSynopsis] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<NovelTemplate | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createProgress, setCreateProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  const resetForm = () => {
    setStep(1);
    setCreateMethod('blank');
    setTitle('');
    setGenre('fantasy');
    setSynopsis('');
    setTargetWordCount(0);
    setSelectedTemplate(null);
    setAiInput('');
    setCreateProgress(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMethodSelect = (method: CreateMethod) => {
    setCreateMethod(method);
    setStep(2);
  };

  const handleCreate = async () => {
    if (createMethod === 'ai') {
      if (!aiInput.trim()) {
        toast.addToast({ type: 'warning', message: '请描述你的想法' });
        return;
      }
    } else {
      if (!title.trim()) {
        toast.addToast({ type: 'warning', message: '请输入小说标题' });
        return;
      }
    }

    setIsCreating(true);
    setCreateProgress({ current: 0, total: 4, message: '准备创建...' });

    try {
      let finalTitle = title;
      let finalSynopsis = synopsis;
      let finalGenre = genre;
      let generatedOutline: Array<{ title: string; summary: string }> = [];
      let generatedCharacters: Array<{
        name: string;
        role: CharacterRole;
        gender: CharacterGender;
        age: number;
        appearance: string;
        personality: string;
        background: string;
        goals: string;
      }> = [];
      let generatedWorldBuilding: {
        setting: string;
        era: string;
        location: string;
        magicSystem: string;
        factions: string[];
        rules: string[];
      } | null = null;

      if (createMethod === 'ai' && aiInput.trim()) {
        if (!apiKey) {
          toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
          setIsCreating(false);
          setCreateProgress(null);
          return;
        }

        const llmService = new UnifiedLLMService({
          apiKey,
          model,
          baseUrl,
          vendor,
          temperature,
          customModelName,
          maxOutputTokens: 16000,
        });

        setCreateProgress({ current: 1, total: 4, message: '正在生成小说蓝图（大纲、角色、世界观）...' });
        const blueprint = await generateNovelBlueprint(llmService, aiInput);

        if (blueprint) {
          finalTitle = blueprint.title || title;
          finalGenre = (blueprint.genre as NovelGenre) || genre;
          finalSynopsis = blueprint.synopsis || synopsis;
          generatedOutline = blueprint.outline || [];
          generatedCharacters = (blueprint.characters || []).map((c) => ({
            name: c.name || '未命名',
            role: (c.role as CharacterRole) || 'supporting',
            gender: (c.gender as CharacterGender) || 'unknown',
            age: c.age || 20,
            appearance: c.appearance || '',
            personality: c.personality || '',
            background: c.background || '',
            goals: c.goals || '',
          }));
          generatedWorldBuilding = blueprint.worldBuilding;
        } else {
          toast.addToast({ type: 'error', message: 'AI生成失败，请重试' });
          setIsCreating(false);
          setCreateProgress(null);
          return;
        }
      }

      setCreateProgress({ current: 2, total: 4, message: '正在创建小说...' });
      const novelId = await createNovel({
        title: finalTitle,
        genre: finalGenre,
        synopsis: finalSynopsis,
        targetWordCount: targetWordCount || undefined,
      });

      if (createMethod === 'ai') {
        if (generatedWorldBuilding) {
          setCreateProgress({ current: 3, total: 4, message: '正在保存世界观设定...' });
          await updateWorldBuilding(novelId, {
            setting: generatedWorldBuilding.setting,
            era: generatedWorldBuilding.era,
            location: generatedWorldBuilding.location,
            magicSystem: generatedWorldBuilding.magicSystem,
            factions: generatedWorldBuilding.factions,
            rules: generatedWorldBuilding.rules,
            notes: '',
          });
        }

        setCreateProgress({
          current: 3,
          total: 4,
          message: `正在创建角色（${generatedCharacters.length}个）...`,
        });
        for (const char of generatedCharacters) {
          await addCharacter(novelId, {
            name: char.name,
            alias: [],
            role: char.role,
            gender: char.gender,
            age: char.age,
            appearance: char.appearance,
            personality: char.personality,
            background: char.background,
            goals: char.goals,
            relationships: [],
            avatar: '',
            notes: '',
          });
        }

        setCreateProgress({
          current: 4,
          total: 4,
          message: `正在创建章节（${generatedOutline.length}章）...`,
        });
        for (const chapter of generatedOutline) {
          await addChapter(novelId, chapter.title);
        }
      }

      setCreateProgress({ current: 4, total: 4, message: '创建完成！' });
      toast.addToast({ type: 'success', message: '小说创建成功' });
      handleClose();
      navigate(`/novel/${novelId}`);
    } catch {
      toast.addToast({ type: 'error', message: '创建失败，请重试' });
      setCreateProgress(null);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTemplates = NOVEL_TEMPLATES.filter(
    (t) => genre === 'other' || t.genres.includes(genre)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="新建小说" size="lg">
      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">选择一种创作方式开始：</p>

          <div className="grid grid-cols-3 gap-4">
            <button
              className="p-6 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-surface/30 transition-all text-center group"
              onClick={() => handleMethodSelect('blank')}
            >
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand/20 transition-colors">
                <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">空白创建</h3>
              <p className="text-xs text-ink-faint">已有完整构思，自由写作</p>
            </button>

            <button
              className="p-6 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-surface/30 transition-all text-center group"
              onClick={() => handleMethodSelect('template')}
            >
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand/20 transition-colors">
                <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">模板创建</h3>
              <p className="text-xs text-ink-faint">选择结构模板，快速开始</p>
            </button>

            <button
              className="p-6 rounded-xl border border-border-subtle hover:border-brand hover:bg-brand-surface/30 transition-all text-center group"
              onClick={() => handleMethodSelect('ai')}
            >
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand/20 transition-colors">
                <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">AI辅助创建</h3>
              <p className="text-xs text-ink-faint">描述想法，AI生成大纲、角色、世界观</p>
            </button>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <button className="btn btn-ghost" onClick={handleClose}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-ink-faint">
            <button
              className="hover:text-brand transition-colors"
              onClick={() => setStep(1)}
            >
              选择方式
            </button>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-ink">
              {createMethod === 'blank'
                ? '空白创建'
                : createMethod === 'template'
                ? '模板创建'
                : 'AI辅助创建'}
            </span>
          </div>

          {createMethod === 'ai' ? (
            <div>
              <label className="text-sm font-medium text-ink mb-2 block">
                描述你的想法
              </label>
              <textarea
                className="input min-h-[120px] text-sm"
                placeholder="例如：我想写一个关于少年成长的玄幻小说，主角拥有特殊体质，修炼路上遇到各种挑战和伙伴..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <p className="text-xs text-ink-faint mt-2">
                AI会根据你的描述生成完整的小说蓝图，包括大纲、角色设定和世界观
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">
                  小说标题 <span className="text-danger">*</span>
                </label>
                <input
                  className="input"
                  placeholder="输入小说标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-2 block">题材</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(GENRE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        genre === key
                          ? 'bg-brand text-white'
                          : 'bg-bg-subtle text-ink-muted hover:bg-brand-surface hover:text-brand'
                      }`}
                      onClick={() => setGenre(key as NovelGenre)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {createMethod === 'template' && (
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">选择模板</label>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedTemplate?.id === template.id
                            ? 'border-brand bg-brand-surface'
                            : 'border-border-subtle hover:border-border'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <p className="text-sm font-medium text-ink">{template.name}</p>
                        <p className="text-xs text-ink-faint mt-0.5">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-ink mb-2 block">简介（可选）</label>
                <textarea
                  className="input min-h-[80px] text-sm"
                  placeholder="简要描述你的小说..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-2 block">
                  目标字数（可选）
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input flex-1"
                    placeholder="0"
                    value={targetWordCount || ''}
                    onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-ink-muted self-center">字</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[30000, 50000, 100000, 200000].map((count) => (
                    <button
                      key={count}
                      className="px-3 py-1 rounded-full text-xs bg-bg-subtle text-ink-muted hover:bg-brand-surface hover:text-brand transition-all"
                      onClick={() => setTargetWordCount(count)}
                    >
                      {count / 10000}万字
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isCreating && createProgress && (
            <div className="pt-3 border-t border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-muted">{createProgress.message}</span>
                <span className="text-xs text-ink-faint">
                  {createProgress.current}/{createProgress.total}
                </span>
              </div>
              <div className="w-full h-2 bg-bg-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${(createProgress.current / createProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              className="btn btn-ghost"
              onClick={() => setStep(1)}
              disabled={isCreating}
            >
              返回
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? '创建中...' : '创建小说'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateNovelModal;

async function generateNovelBlueprint(
  llmService: UnifiedLLMService,
  idea: string
): Promise<{
  title: string;
  genre: string;
  synopsis: string;
  outline: Array<{ title: string; summary: string }>;
  characters: Array<{
    name: string;
    role: string;
    gender: string;
    age: number;
    appearance: string;
    personality: string;
    background: string;
    goals: string;
  }>;
  worldBuilding: {
    setting: string;
    era: string;
    location: string;
    magicSystem: string;
    factions: string[];
    rules: string[];
  };
} | null> {
  const messages = [
    {
      role: 'system' as const,
      content: `你是一位专业的小说策划大师。用户会提供一个想法，你需要根据这个想法生成完整的小说蓝图。

【输出格式】
请输出JSON格式，不要包含任何其他文字：
{
  "title": "小说标题",
  "genre": "fantasy/romance/sci-fi/mystery/historical/modern/wuxia/urban/horror/other",
  "synopsis": "小说简介（100-200字，包含核心冲突和看点）",
  "outline": [
    { "title": "第一章标题", "summary": "本章内容概要（50-100字）" },
    { "title": "第二章标题", "summary": "本章内容概要（50-100字）" }
  ],
  "characters": [
    {
      "name": "角色名",
      "role": "protagonist/supporting/antagonist/extra",
      "gender": "male/female/unknown",
      "age": 年龄数字,
      "appearance": "外貌描写",
      "personality": "性格特点",
      "background": "背景故事",
      "goals": "目标/动机"
    }
  ],
  "worldBuilding": {
    "setting": "世界设定概述",
    "era": "时代背景",
    "location": "主要地点",
    "magicSystem": "力量体系",
    "factions": ["势力1", "势力2"],
    "rules": ["世界规则1", "世界规则2"]
  }
}

【创作要求】
1. 标题：简洁有力，有吸引力，符合题材风格
2. 简介：包含主角、核心冲突、故事卖点，引人入胜
3. 大纲：5-8章，每章有明确的标题和概要，情节递进合理
4. 角色：3-5个主要角色，包含主角、配角、反派，性格鲜明
5. 世界观：与题材匹配，设定合理，有独特之处

【题材说明】
- fantasy: 玄幻/修仙
- romance: 言情/爱情
- sci-fi: 科幻/未来
- mystery: 悬疑/推理
- historical: 历史/古代
- modern: 现代/现实
- wuxia: 武侠/江湖
- urban: 都市/职场
- horror: 恐怖/惊悚
- other: 其他`,
    },
    {
      role: 'user' as const,
      content: `【用户想法】
${idea}

请根据以上想法生成完整的小说蓝图：`,
    },
  ];

  try {
    const response = await llmService.sendRequest(messages);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || '未命名小说',
        genre: parsed.genre || 'fantasy',
        synopsis: parsed.synopsis || '',
        outline: parsed.outline || [],
        characters: parsed.characters || [],
        worldBuilding: {
          setting: parsed.worldBuilding?.setting || '',
          era: parsed.worldBuilding?.era || '',
          location: parsed.worldBuilding?.location || '',
          magicSystem: parsed.worldBuilding?.magicSystem || '',
          factions: parsed.worldBuilding?.factions || [],
          rules: parsed.worldBuilding?.rules || [],
        },
      };
    }
    return null;
  } catch (error) {
    console.error('生成小说蓝图失败:', error);
    return null;
  }
}
