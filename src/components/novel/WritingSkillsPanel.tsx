import React, { useState, useCallback } from 'react';
import useWritingSkillStore from '../../stores/writingSkillStore';
import useAIStore from '../../stores/aiStore';
import NovelAIService from '../../services/ai/NovelAIService';
import type { CustomWritingSkill, SkillCategory, WritingStylePreset } from '../../types/writing';

type SkillsTabType = 'skills' | 'styles' | 'config';

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  writing: '写作辅助',
  analysis: '内容分析',
  generation: '内容生成',
  organization: '整理归纳',
  custom: '自定义',
};

const CATEGORY_ICONS: Record<SkillCategory, string> = {
  writing: '✍️',
  analysis: '🔍',
  generation: '✨',
  organization: '📋',
  custom: '⚙️',
};

const GENRE_OPTIONS = [
  { value: '', label: '通用类型' },
  { value: 'fantasy', label: '玄幻/修仙' },
  { value: 'romance', label: '言情/爱情' },
  { value: 'sci-fi', label: '科幻/未来' },
  { value: 'mystery', label: '悬疑/推理' },
  { value: 'historical', label: '历史/古代' },
  { value: 'modern', label: '现代/现实' },
  { value: 'wuxia', label: '武侠/江湖' },
  { value: 'urban', label: '都市/职场' },
  { value: 'horror', label: '恐怖/惊悚' },
];

interface WritingSkillsPanelProps {
  onApplySkill?: (skill: CustomWritingSkill) => void;
  onApplyStyle?: (preset: WritingStylePreset) => void;
}

const WritingSkillsPanel: React.FC<WritingSkillsPanelProps> = ({
  onApplySkill,
  onApplyStyle,
}) => {
  const [activeTab, setActiveTab] = useState<SkillsTabType>('skills');
  const [isCreating, setIsCreating] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);

  const {
    skills,
    extensionConfig,
    addSkill,
    updateSkill,
    deleteSkill,
    toggleSkill,
    addStylePreset,
    updateStylePreset,
    deleteStylePreset,
    setDefaultStylePreset,
    updateExtensionConfig,
  } = useWritingSkillStore();

  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();

  const [skillForm, setSkillForm] = useState<Omit<CustomWritingSkill, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    category: 'writing',
    promptTemplate: '',
    triggerWords: [],
    paramsOverride: undefined,
    isEnabled: true,
  });

  const [styleForm, setStyleForm] = useState<Omit<WritingStylePreset, 'id'>>({
    name: '',
    description: '',
    stylePrompt: '',
    exampleText: '',
    params: {},
    isDefault: false,
  });

  const [triggerWordInput, setTriggerWordInput] = useState('');

  const [showAISkillGenerator, setShowAISkillGenerator] = useState(false);
  const [showAIStyleGenerator, setShowAIStyleGenerator] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [aiGeneratedSkills, setAiGeneratedSkills] = useState<Array<{
    name: string;
    description: string;
    category: string;
    promptTemplate: string;
    triggerWords: string[];
  }>>([]);
  const [aiGeneratedStyle, setAiGeneratedStyle] = useState<{
    name: string;
    description: string;
    stylePrompt: string;
    exampleText: string;
    params: { continue: { length: string; style: string; direction: string; temperature: number } };
  } | null>(null);

  const [aiSkillDescription, setAiSkillDescription] = useState('');
  const [aiSkillGenre, setAiSkillGenre] = useState('');
  const [aiStyleDescription, setAiStyleDescription] = useState('');
  const [aiStyleExample, setAiStyleExample] = useState('');

  const [showPromptEnhancer, setShowPromptEnhancer] = useState(false);
  const [enhancePromptInput, setEnhancePromptInput] = useState('');
  const [enhanceRequirement, setEnhanceRequirement] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const resetSkillForm = useCallback(() => {
    setSkillForm({
      name: '',
      description: '',
      category: 'writing',
      promptTemplate: '',
      triggerWords: [],
      paramsOverride: undefined,
      isEnabled: true,
    });
    setTriggerWordInput('');
    setIsCreating(false);
    setEditingSkillId(null);
  }, []);

  const resetStyleForm = useCallback(() => {
    setStyleForm({
      name: '',
      description: '',
      stylePrompt: '',
      exampleText: '',
      params: {},
      isDefault: false,
    });
    setEditingStyleId(null);
  }, []);

  const handleSaveSkill = useCallback(() => {
    if (!skillForm.name.trim() || !skillForm.promptTemplate.trim()) return;

    if (editingSkillId) {
      updateSkill(editingSkillId, skillForm);
    } else {
      addSkill(skillForm);
    }
    resetSkillForm();
  }, [skillForm, editingSkillId, addSkill, updateSkill, resetSkillForm]);

  const handleEditSkill = useCallback((skill: CustomWritingSkill) => {
    setSkillForm({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      promptTemplate: skill.promptTemplate,
      triggerWords: skill.triggerWords,
      paramsOverride: skill.paramsOverride,
      isEnabled: skill.isEnabled,
    });
    setEditingSkillId(skill.id);
    setIsCreating(true);
  }, []);

  const handleAddTriggerWord = useCallback(() => {
    if (!triggerWordInput.trim()) return;
    if (!skillForm.triggerWords.includes(triggerWordInput.trim())) {
      setSkillForm((prev) => ({
        ...prev,
        triggerWords: [...prev.triggerWords, triggerWordInput.trim()],
      }));
    }
    setTriggerWordInput('');
  }, [triggerWordInput, skillForm.triggerWords]);

  const handleRemoveTriggerWord = useCallback((word: string) => {
    setSkillForm((prev) => ({
      ...prev,
      triggerWords: prev.triggerWords.filter((w) => w !== word),
    }));
  }, []);

  const handleSaveStyle = useCallback(() => {
    if (!styleForm.name.trim() || !styleForm.stylePrompt.trim()) return;

    if (editingStyleId) {
      updateStylePreset(editingStyleId, styleForm);
    } else {
      addStylePreset(styleForm);
    }
    resetStyleForm();
  }, [styleForm, editingStyleId, addStylePreset, updateStylePreset, resetStyleForm]);

  const handleEditStyle = useCallback((preset: WritingStylePreset) => {
    setStyleForm({
      name: preset.name,
      description: preset.description,
      stylePrompt: preset.stylePrompt,
      exampleText: preset.exampleText,
      params: preset.params,
      isDefault: preset.isDefault,
    });
    setEditingStyleId(preset.id);
  }, []);

  const handleGenerateSkills = useCallback(async () => {
    if (!aiSkillDescription.trim()) return;
    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    setIsGeneratingSkills(true);
    setAiGeneratedSkills([]);

    try {
      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature: 0.8,
        customModelName,
      });

      const generatedSkills = await aiService.generateWritingSkills(aiSkillDescription, aiSkillGenre);
      setAiGeneratedSkills(generatedSkills);
    } catch (error) {
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGeneratingSkills(false);
    }
  }, [aiSkillDescription, aiSkillGenre, apiKey, model, baseUrl, vendor, temperature, customModelName]);

  const handleGenerateStyle = useCallback(async () => {
    if (!aiStyleDescription.trim()) return;
    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    setIsGeneratingStyle(true);
    setAiGeneratedStyle(null);

    try {
      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature: 0.8,
        customModelName,
      });

      const generatedStyle = await aiService.generateStylePreset(aiStyleDescription, aiStyleExample || undefined);
      setAiGeneratedStyle(generatedStyle);
    } catch (error) {
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGeneratingStyle(false);
    }
  }, [aiStyleDescription, aiStyleExample, apiKey, model, baseUrl, vendor, temperature, customModelName]);

  const handleEnhancePrompt = useCallback(async () => {
    if (!enhancePromptInput.trim() || !enhanceRequirement.trim()) return;
    if (!apiKey) {
      alert('请先在设置页面配置AI API Key');
      return;
    }

    setIsEnhancing(true);

    try {
      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature: 0.7,
        customModelName,
      });

      const result = await aiService.enhanceSkillPrompt(enhancePromptInput, enhanceRequirement);
      setEnhancedPrompt(result);
    } catch (error) {
      alert(`优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsEnhancing(false);
    }
  }, [enhancePromptInput, enhanceRequirement, apiKey, model, baseUrl, vendor, temperature, customModelName]);

  const handleAddGeneratedSkill = useCallback((generatedSkill: typeof aiGeneratedSkills[0]) => {
    addSkill({
      name: generatedSkill.name,
      description: generatedSkill.description,
      category: generatedSkill.category as SkillCategory,
      promptTemplate: generatedSkill.promptTemplate,
      triggerWords: generatedSkill.triggerWords,
      isEnabled: true,
    });
  }, [addSkill]);

  const handleAddGeneratedStyle = useCallback(() => {
    if (!aiGeneratedStyle) return;
    addStylePreset({
      name: aiGeneratedStyle.name,
      description: aiGeneratedStyle.description,
      stylePrompt: aiGeneratedStyle.stylePrompt,
      exampleText: aiGeneratedStyle.exampleText,
      params: aiGeneratedStyle.params as Partial<import('../../types/writing').AIParams>,
      isDefault: false,
    });
  }, [aiGeneratedStyle, addStylePreset]);

  const renderAISkillGenerator = () => (
    <div className="p-4 rounded-lg border border-brand/30 bg-gradient-to-br from-brand/5 to-brand/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-ink flex items-center gap-2">
          <span className="text-lg">🤖</span>
          AI 技能生成器
        </h4>
        <button
          className="text-ink-faint hover:text-ink"
          onClick={() => {
            setShowAISkillGenerator(false);
            setAiGeneratedSkills([]);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <label className="text-xs text-ink-muted mb-1 block">描述你需要的技能 *</label>
        <textarea
          className="input text-sm w-full min-h-[60px]"
          placeholder="例如：我写玄幻小说，需要一些帮助描写打斗场景、修炼突破、法宝对决的技能..."
          value={aiSkillDescription}
          onChange={(e) => setAiSkillDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-ink-muted mb-1 block">小说类型（可选）</label>
        <select
          className="input text-sm w-full"
          value={aiSkillGenre}
          onChange={(e) => setAiSkillGenre(e.target.value)}
        >
          {GENRE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary btn-sm w-full"
        onClick={handleGenerateSkills}
        disabled={isGeneratingSkills || !aiSkillDescription.trim()}
      >
        {isGeneratingSkills ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI生成中...
          </span>
        ) : (
          '生成技能'
        )}
      </button>

      {aiGeneratedSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted font-medium">生成的技能（点击添加）：</p>
          {aiGeneratedSkills.map((skill, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-bg-base border border-border-subtle hover:border-brand cursor-pointer transition-all"
              onClick={() => handleAddGeneratedSkill(skill)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{CATEGORY_ICONS[skill.category as SkillCategory] || '⚙️'}</span>
                <h5 className="text-sm font-medium text-ink">{skill.name}</h5>
              </div>
              <p className="text-xs text-ink-muted mb-2">{skill.description}</p>
              <div className="flex flex-wrap gap-1">
                {skill.triggerWords.map((word) => (
                  <span
                    key={word}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-brand/10 text-brand"
                  >
                    /{word}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-ink-faint mt-2 line-clamp-2">
                {skill.promptTemplate}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAIStyleGenerator = () => (
    <div className="p-4 rounded-lg border border-brand/30 bg-gradient-to-br from-brand/5 to-brand/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-ink flex items-center gap-2">
          <span className="text-lg">🎨</span>
          AI 风格生成器
        </h4>
        <button
          className="text-ink-faint hover:text-ink"
          onClick={() => {
            setShowAIStyleGenerator(false);
            setAiGeneratedStyle(null);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <label className="text-xs text-ink-muted mb-1 block">描述你想要的风格 *</label>
        <textarea
          className="input text-sm w-full min-h-[60px]"
          placeholder="例如：我想要一种类似金庸武侠的风格，半文半白，大气磅礴，有古典韵味..."
          value={aiStyleDescription}
          onChange={(e) => setAiStyleDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-ink-muted mb-1 block">参考文本（可选）</label>
        <textarea
          className="input text-sm w-full min-h-[60px]"
          placeholder="粘贴一段体现你想要的风格的文本，AI会根据它来生成风格预设..."
          value={aiStyleExample}
          onChange={(e) => setAiStyleExample(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary btn-sm w-full"
        onClick={handleGenerateStyle}
        disabled={isGeneratingStyle || !aiStyleDescription.trim()}
      >
        {isGeneratingStyle ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI生成中...
          </span>
        ) : (
          '生成风格'
        )}
      </button>

      {aiGeneratedStyle && (
        <div className="p-3 rounded-lg bg-bg-base border border-brand/30 space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-ink">{aiGeneratedStyle.name}</h5>
            <button
              className="btn btn-primary btn-sm text-xs"
              onClick={handleAddGeneratedStyle}
            >
              添加此风格
            </button>
          </div>
          <p className="text-xs text-ink-muted">{aiGeneratedStyle.description}</p>
          <div className="p-2 rounded bg-bg-subtle border border-border-subtle">
            <p className="text-xs text-ink-muted italic">"{aiGeneratedStyle.exampleText}"</p>
          </div>
          <div className="text-[10px] text-ink-faint">
            温度参数: {aiGeneratedStyle.params.continue.temperature} | 
            风格: {aiGeneratedStyle.params.continue.style}
          </div>
        </div>
      )}
    </div>
  );

  const renderPromptEnhancer = () => (
    <div className="p-4 rounded-lg border border-brand/30 bg-gradient-to-br from-brand/5 to-brand/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-ink flex items-center gap-2">
          <span className="text-lg">✨</span>
          提示词优化器
        </h4>
        <button
          className="text-ink-faint hover:text-ink"
          onClick={() => {
            setShowPromptEnhancer(false);
            setEnhancedPrompt('');
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div>
        <label className="text-xs text-ink-muted mb-1 block">当前提示词</label>
        <textarea
          className="input text-sm w-full min-h-[60px]"
          placeholder="粘贴你想要优化的提示词..."
          value={enhancePromptInput}
          onChange={(e) => setEnhancePromptInput(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-ink-muted mb-1 block">优化需求 *</label>
        <input
          className="input text-sm w-full"
          placeholder="例如：让提示词更具体、增加示例、优化结构等"
          value={enhanceRequirement}
          onChange={(e) => setEnhanceRequirement(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary btn-sm w-full"
        onClick={handleEnhancePrompt}
        disabled={isEnhancing || !enhancePromptInput.trim() || !enhanceRequirement.trim()}
      >
        {isEnhancing ? '优化中...' : '优化提示词'}
      </button>

      {enhancedPrompt && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted font-medium">优化结果：</p>
            <button
              className="text-xs text-brand hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(enhancedPrompt);
                alert('已复制到剪贴板');
              }}
            >
              复制
            </button>
          </div>
          <div className="p-3 rounded-lg bg-bg-base border border-border-subtle">
            <p className="text-xs text-ink whitespace-pre-wrap">{enhancedPrompt}</p>
          </div>
          <button
            className="btn btn-outline btn-sm w-full text-xs"
            onClick={() => {
              setEnhancePromptInput(enhancedPrompt);
              setEnhancedPrompt('');
            }}
          >
            使用优化后的提示词
          </button>
        </div>
      )}
    </div>
  );

  const renderSkillsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">自定义写作技能可在AI助手面板中快速调用</p>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm text-xs"
            onClick={() => setShowPromptEnhancer(true)}
          >
            ✨ 优化提示词
          </button>
          <button
            className="btn btn-outline btn-sm text-xs"
            onClick={() => setShowAISkillGenerator(true)}
          >
            🤖 AI生成
          </button>
          <button
            className="btn btn-primary btn-sm text-xs"
            onClick={() => setIsCreating(true)}
          >
            + 新建
          </button>
        </div>
      </div>

      {showPromptEnhancer && renderPromptEnhancer()}
      {showAISkillGenerator && renderAISkillGenerator()}

      {isCreating && (
        <div className="p-4 rounded-lg border border-brand/30 bg-brand/5 space-y-3">
          <h4 className="text-sm font-medium text-ink">
            {editingSkillId ? '编辑技能' : '创建新技能'}
          </h4>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">技能名称 *</label>
            <input
              className="input text-sm w-full"
              placeholder="如：武侠打斗描写"
              value={skillForm.name}
              onChange={(e) => setSkillForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">技能描述</label>
            <input
              className="input text-sm w-full"
              placeholder="简要描述这个技能的用途"
              value={skillForm.description}
              onChange={(e) => setSkillForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">技能分类</label>
            <select
              className="input text-sm w-full"
              value={skillForm.category}
              onChange={(e) => setSkillForm((prev) => ({ ...prev, category: e.target.value as SkillCategory }))}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">提示词模板 *</label>
            <textarea
              className="input text-sm w-full min-h-[80px]"
              placeholder="输入技能提示词，可使用 {selection} 表示选中文本，{context} 表示上下文"
              value={skillForm.promptTemplate}
              onChange={(e) => setSkillForm((prev) => ({ ...prev, promptTemplate: e.target.value }))}
            />
            <p className="text-[10px] text-ink-faint mt-1">
              可用变量：{'{selection}'} 选中文本，{'{context}'} 章节上下文
            </p>
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">快捷触发词</label>
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="输入触发词后按回车添加"
                value={triggerWordInput}
                onChange={(e) => setTriggerWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTriggerWord();
                  }
                }}
              />
              <button
                className="btn btn-outline btn-sm text-xs"
                onClick={handleAddTriggerWord}
              >
                添加
              </button>
            </div>
            {skillForm.triggerWords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {skillForm.triggerWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs"
                  >
                    {word}
                    <button
                      className="hover:text-danger"
                      onClick={() => handleRemoveTriggerWord(word)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={handleSaveSkill}
              disabled={!skillForm.name.trim() || !skillForm.promptTemplate.trim()}
            >
              {editingSkillId ? '保存修改' : '创建技能'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={resetSkillForm}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {skills.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-faint">暂无自定义技能</p>
            <p className="text-xs text-ink-faint mt-1">点击上方按钮创建你的第一个写作技能</p>
            <p className="text-xs text-brand mt-2">💡 试试 AI 生成技能，快速获得专业写作辅助</p>
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.id}
              className={`p-3 rounded-lg border transition-all ${
                skill.isEnabled
                  ? 'border-border-subtle bg-bg-base'
                  : 'border-border-subtle/50 bg-bg-subtle/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CATEGORY_ICONS[skill.category]}</span>
                  <div>
                    <h4 className="text-sm font-medium text-ink">{skill.name}</h4>
                    <span className="text-[10px] text-ink-faint px-1.5 py-0.5 rounded bg-bg-subtle">
                      {CATEGORY_LABELS[skill.category]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={skill.isEnabled}
                      onChange={() => toggleSkill(skill.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              {skill.description && (
                <p className="text-xs text-ink-muted mb-2">{skill.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {skill.triggerWords.slice(0, 3).map((word) => (
                    <span
                      key={word}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-bg-subtle text-ink-faint"
                    >
                      /{word}
                    </span>
                  ))}
                  {skill.triggerWords.length > 3 && (
                    <span className="text-[10px] text-ink-faint">
                      +{skill.triggerWords.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-brand"
                    onClick={() => onApplySkill?.(skill)}
                    title="立即使用"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-brand"
                    onClick={() => handleEditSkill(skill)}
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-danger"
                    onClick={() => {
                      if (confirm('确定要删除这个技能吗？')) {
                        deleteSkill(skill.id);
                      }
                    }}
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderStylesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">写作风格预设可快速切换AI输出风格</p>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm text-xs"
            onClick={() => setShowAIStyleGenerator(true)}
          >
            🎨 AI生成
          </button>
          <button
            className="btn btn-primary btn-sm text-xs"
            onClick={() => setEditingStyleId('new')}
          >
            + 新建
          </button>
        </div>
      </div>

      {showAIStyleGenerator && renderAIStyleGenerator()}

      {editingStyleId && (
        <div className="p-4 rounded-lg border border-brand/30 bg-brand/5 space-y-3">
          <h4 className="text-sm font-medium text-ink">
            {editingStyleId === 'new' ? '创建新风格' : '编辑风格'}
          </h4>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">风格名称 *</label>
            <input
              className="input text-sm w-full"
              placeholder="如：金庸武侠风"
              value={styleForm.name}
              onChange={(e) => setStyleForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">风格描述</label>
            <input
              className="input text-sm w-full"
              placeholder="简要描述这种风格的特点"
              value={styleForm.description}
              onChange={(e) => setStyleForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">风格提示词 *</label>
            <textarea
              className="input text-sm w-full min-h-[60px]"
              placeholder="描述AI应如何调整写作风格"
              value={styleForm.stylePrompt}
              onChange={(e) => setStyleForm((prev) => ({ ...prev, stylePrompt: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">示例文本</label>
            <textarea
              className="input text-sm w-full min-h-[60px]"
              placeholder="一段体现该风格的示例文字"
              value={styleForm.exampleText}
              onChange={(e) => setStyleForm((prev) => ({ ...prev, exampleText: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="set-default-style"
              checked={styleForm.isDefault}
              onChange={(e) => setStyleForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
            />
            <label htmlFor="set-default-style" className="text-xs text-ink-muted">
              设为默认风格
            </label>
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={handleSaveStyle}
              disabled={!styleForm.name.trim() || !styleForm.stylePrompt.trim()}
            >
              {editingStyleId === 'new' ? '创建风格' : '保存修改'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={resetStyleForm}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {extensionConfig.writingStylePresets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-faint">暂无风格预设</p>
            <p className="text-xs text-ink-faint mt-2">💡 试试 AI 生成风格，快速获得专业写作风格</p>
          </div>
        ) : (
          extensionConfig.writingStylePresets.map((preset) => (
            <div
              key={preset.id}
              className={`p-3 rounded-lg border transition-all ${
                preset.isDefault
                  ? 'border-brand/40 bg-brand/5'
                  : 'border-border-subtle bg-bg-base'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-ink">{preset.name}</h4>
                    {preset.isDefault && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand text-white">
                        默认
                      </span>
                    )}
                  </div>
                  {preset.description && (
                    <p className="text-xs text-ink-faint mt-0.5">{preset.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!preset.isDefault && (
                    <button
                      className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-brand"
                      onClick={() => setDefaultStylePreset(preset.id)}
                      title="设为默认"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-brand"
                    onClick={() => onApplyStyle?.(preset)}
                    title="应用风格"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-brand"
                    onClick={() => handleEditStyle(preset)}
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-bg-subtle text-ink-faint hover:text-danger"
                    onClick={() => {
                      if (confirm('确定要删除这个风格预设吗？')) {
                        deleteStylePreset(preset.id);
                      }
                    }}
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {preset.exampleText && (
                <div className="mt-2 p-2 rounded bg-bg-subtle border border-border-subtle">
                  <p className="text-xs text-ink-muted line-clamp-2 italic">
                    "{preset.exampleText}"
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderConfigTab = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-ink">AI 扩展配置</h3>

        <div>
          <label className="text-xs text-ink-muted mb-1 block">自定义系统提示词</label>
          <textarea
            className="input text-sm w-full min-h-[80px]"
            placeholder="添加额外的系统提示词，将附加到所有AI请求中"
            value={extensionConfig.customSystemPrompt}
            onChange={(e) => updateExtensionConfig({ customSystemPrompt: e.target.value })}
          />
          <p className="text-[10px] text-ink-faint mt-1">
            此提示词将作为补充指令发送给AI，不会覆盖默认提示词
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle">
          <div>
            <p className="text-sm font-medium text-ink">自动触发技能</p>
            <p className="text-xs text-ink-faint mt-0.5">
              当写作内容匹配触发词时自动推荐相关技能
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={extensionConfig.autoTriggerSkills}
              onChange={(e) => updateExtensionConfig({ autoTriggerSkills: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        <div>
          <label className="text-xs text-ink-muted mb-1 block">
            技能建议阈值: {Math.round(extensionConfig.skillSuggestionThreshold * 100)}%
          </label>
          <input
            type="range"
            className="range-slider"
            min="0.3"
            max="0.9"
            step="0.1"
            value={extensionConfig.skillSuggestionThreshold}
            onChange={(e) => updateExtensionConfig({ skillSuggestionThreshold: parseFloat(e.target.value) })}
          />
          <div className="flex justify-between text-[10px] text-ink-faint mt-1">
            <span>更频繁</span>
            <span>更精准</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border-subtle">
        <h3 className="text-sm font-medium text-ink mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="p-3 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand/5 transition-all text-center"
            onClick={() => {
              const data = JSON.stringify({ skills, extensionConfig }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `writing-skills-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg className="w-5 h-5 mx-auto mb-1 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
            </svg>
            <span className="text-xs text-ink-muted">导出配置</span>
          </button>
          <button
            className="p-3 rounded-lg border border-border-subtle hover:border-brand hover:bg-brand/5 transition-all text-center"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  if (data.skills) {
                    data.skills.forEach((skill: CustomWritingSkill) => {
                      addSkill(skill);
                    });
                  }
                  if (data.extensionConfig) {
                    updateExtensionConfig(data.extensionConfig);
                  }
                  alert('导入成功！');
                } catch {
                  alert('导入失败：文件格式错误');
                }
              };
              input.click();
            }}
          >
            <svg className="w-5 h-5 mx-auto mb-1 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
            </svg>
            <span className="text-xs text-ink-muted">导入配置</span>
          </button>
          <button
            className="p-3 rounded-lg border border-border-subtle hover:border-danger hover:bg-danger/5 transition-all text-center"
            onClick={() => {
              if (confirm('确定要清空所有自定义技能吗？此操作不可撤销。')) {
                skills.forEach((s) => deleteSkill(s.id));
              }
            }}
          >
            <svg className="w-5 h-5 mx-auto mb-1 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <span className="text-xs text-ink-muted">清空技能</span>
          </button>
          <button
            className="p-3 rounded-lg border border-border-subtle hover:border-warning hover:bg-warning/5 transition-all text-center"
            onClick={() => {
              if (confirm('确定要恢复默认设置吗？自定义技能将保留。')) {
                updateExtensionConfig({
                  customSystemPrompt: '',
                  autoTriggerSkills: true,
                  skillSuggestionThreshold: 0.6,
                });
              }
            }}
          >
            <svg className="w-5 h-5 mx-auto mb-1 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span className="text-xs text-ink-muted">重置配置</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-subtle">
        <button
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === 'skills'
              ? 'bg-bg-base text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setActiveTab('skills')}
        >
          写作技能
        </button>
        <button
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === 'styles'
              ? 'bg-bg-base text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setActiveTab('styles')}
        >
          风格预设
        </button>
        <button
          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            activeTab === 'config'
              ? 'bg-bg-base text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
          onClick={() => setActiveTab('config')}
        >
          AI配置
        </button>
      </div>

      {activeTab === 'skills' && renderSkillsTab()}
      {activeTab === 'styles' && renderStylesTab()}
      {activeTab === 'config' && renderConfigTab()}
    </div>
  );
};

export default WritingSkillsPanel;
