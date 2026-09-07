import React, { useState, useRef } from 'react';
import useNovelStore from '../../stores/novelStore';
import useAIStore from '../../stores/aiStore';
import NovelAIService from '../../services/ai/NovelAIService';
import { useToast } from '../common/Toast';
import type { Novel } from '../../types/novel';

interface NovelInfoPanelProps {
  novel: Novel;
}

type ImageStyle = 'realistic' | 'anime' | 'watercolor' | 'oil_painting' | 'sketch';

const IMAGE_STYLE_LABELS: Record<ImageStyle, string> = {
  realistic: '写实风格',
  anime: '动漫风格',
  watercolor: '水彩风格',
  oil_painting: '油画风格',
  sketch: '素描风格',
};

const NovelInfoPanel: React.FC<NovelInfoPanelProps> = ({ novel }) => {
  const { updateNovel } = useNovelStore();
  const { apiKey, model, baseUrl, vendor, temperature, customModelName } = useAIStore();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [formData, setFormData] = useState({
    title: novel.title,
    synopsis: novel.synopsis,
    coverImage: novel.coverImage,
  });

  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('anime');

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.addToast({ type: 'warning', message: '请输入小说标题' });
      return;
    }

    setIsSaving(true);
    try {
      await updateNovel(novel.id, {
        title: formData.title,
        synopsis: formData.synopsis,
        coverImage: formData.coverImage,
      });
      toast.addToast({ type: 'success', message: '小说信息已保存' });
      setIsEditing(false);
    } catch {
      toast.addToast({ type: 'error', message: '保存失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: novel.title,
      synopsis: novel.synopsis,
      coverImage: novel.coverImage,
    });
    setIsEditing(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.addToast({ type: 'warning', message: '请选择图片文件' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.addToast({ type: 'warning', message: '图片大小不能超过10MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({ ...prev, coverImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerateImage = async () => {
    if (!apiKey) {
      toast.addToast({ type: 'error', message: '请先在设置页面配置AI API Key' });
      return;
    }

    const prompt = imagePrompt || novel.synopsis || novel.title;
    if (!prompt.trim()) {
      toast.addToast({ type: 'warning', message: '请输入图片描述或先填写小说简介' });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const aiService = new NovelAIService({
        apiKey,
        model,
        baseUrl,
        vendor,
        temperature,
        customModelName,
      });

      const imageUrl = await aiService.generateCoverImage(prompt, imageStyle);
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, coverImage: imageUrl }));
        toast.addToast({ type: 'success', message: '封面图片已生成' });
        setShowImageModal(false);
        setImagePrompt('');
      } else {
        toast.addToast({ type: 'error', message: '图片生成失败' });
      }
    } catch (error) {
      toast.addToast({
        type: 'error',
        message: error instanceof Error ? error.message : '图片生成失败',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, coverImage: '' }));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-ink">小说信息</h2>
          {!isEditing ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsEditing(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>编辑</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-brand/5 border border-brand/20 mb-6">
            <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <span className="text-sm text-brand">编辑模式 - 修改小说基本信息</span>
          </div>
        )}

        <div className="space-y-6">
          {/* 封面图片 */}
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">小说封面</label>
            <div className="flex gap-6">
              <div className="w-40 h-56 rounded-lg border border-border-subtle bg-bg-subtle overflow-hidden flex items-center justify-center shrink-0">
                {formData.coverImage ? (
                  <img
                    src={formData.coverImage}
                    alt="小说封面"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 text-ink-faint mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="text-xs text-ink-faint">暂无封面</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                {isEditing && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <span>本地上传</span>
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowImageModal(true)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                        </svg>
                        <span>AI 生成封面</span>
                      </button>
                      {formData.coverImage && (
                        <button
                          className="btn btn-ghost btn-sm text-danger hover:bg-danger/10"
                          onClick={handleRemoveImage}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022-.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          <span>移除</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-ink-faint mt-3">
                      支持 JPG、PNG、WebP 格式，建议尺寸 2:3，最大 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 小说书名 */}
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">小说书名</label>
            {isEditing ? (
              <input
                className="input text-sm"
                placeholder="输入小说书名"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            ) : (
              <div className="p-4 rounded-lg bg-bg-subtle">
                <p className="text-sm text-ink font-medium">{novel.title || '未设置'}</p>
              </div>
            )}
          </div>

          {/* 小说简介 */}
          <div>
            <label className="text-sm font-medium text-ink mb-2 block">小说简介</label>
            {isEditing ? (
              <textarea
                className="input text-sm min-h-[120px]"
                placeholder="简要描述小说的核心故事、主角和看点..."
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
              />
            ) : (
              <div className="p-4 rounded-lg bg-bg-subtle">
                <p className="text-sm text-ink whitespace-pre-wrap">
                  {novel.synopsis || '未设置'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI 生成图片弹窗 */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-base rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">AI 生成封面</h3>
                  <p className="text-xs text-ink-faint mt-0.5">描述你想要的画面，AI 将为你生成独特的小说封面</p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-subtle transition-colors"
                onClick={() => {
                  setShowImageModal(false);
                  setImagePrompt('');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-5">
              {/* 图片描述输入 */}
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">
                  图片描述 <span className="text-ink-faint font-normal">（选填）</span>
                </label>
                <textarea
                  className="input text-sm min-h-[100px] resize-none"
                  placeholder="描述你想要的封面画面，例如：一位少年站在山巅，手持长剑，背后是绚丽的晚霞..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                />
                <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-faint">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <span>留空时将使用小说简介作为描述</span>
                </div>
              </div>

              {/* 图片风格选择 */}
              <div>
                <label className="text-sm font-medium text-ink mb-3 block">选择风格</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.entries(IMAGE_STYLE_LABELS) as [ImageStyle, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      className={`px-2 py-2.5 rounded-lg text-xs font-medium transition-all text-center ${
                        imageStyle === key
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'bg-bg-subtle text-ink-muted hover:bg-brand-surface hover:text-brand border border-border-subtle'
                      }`}
                      onClick={() => setImageStyle(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提示信息 */}
              <div className="p-3 rounded-lg bg-brand/5 border border-brand/10">
                <div className="flex gap-2">
                  <svg className="w-4 h-4 text-brand shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-brand leading-relaxed">
                    生成过程大约需要 10-30 秒，请耐心等待。生成的图片将自动设置为小说封面。
                  </p>
                </div>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-bg-subtle/50">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowImageModal(false);
                  setImagePrompt('');
                }}
                disabled={isGeneratingImage}
              >
                取消
              </button>
              <button
                className="btn btn-primary min-w-[100px]"
                onClick={handleAIGenerateImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    生成中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    开始生成
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovelInfoPanel;
