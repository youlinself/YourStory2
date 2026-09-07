import React, { useState } from 'react';
import type { ExtractedContent } from '../../types';

interface ContentExtractCardProps {
  extract: ExtractedContent;
  onApprove: () => void;
  onReject: () => void;
  onEdit: (editedContent: string) => void;
}

const ContentExtractCard: React.FC<ContentExtractCardProps> = ({
  extract,
  onApprove,
  onReject,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(extract.paragraphs.join('\n\n'));

  const isProcessed = extract.status !== 'pending';

  return (
    <div className="mt-3 border border-brand/20 rounded-xl bg-brand-surface p-4 animate-slide-up">
      {/* 标题栏 */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="text-subheading text-brand">AI 提取的自传内容</span>
        {extract.status === 'approved' && (
          <span className="ml-auto text-xs text-success font-medium">已确认</span>
        )}
        {extract.status === 'rejected' && (
          <span className="ml-auto text-xs text-ink-muted font-medium">已丢弃</span>
        )}
      </div>

      {/* 标签 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {extract.timeTag && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-info/10 text-info text-xs font-medium">
            {extract.timeTag}
          </span>
        )}
        {extract.emotionTags?.map((tag) => (
          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
            {tag}
          </span>
        ))}
        {extract.people?.map((person) => (
          <span key={person} className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
            {person}
          </span>
        ))}
      </div>

      {/* 内容预览 / 编辑 */}
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="input-base w-full min-h-[120px] text-sm leading-relaxed mb-3"
          rows={5}
        />
      ) : (
        <div className="space-y-2 mb-3">
          {(extract.status === 'edited' ? [extract.editedContent!] : extract.paragraphs).map(
            (para, i) => (
              <p key={i} className="text-sm text-ink-secondary leading-relaxed">
                {para}
              </p>
            ),
          )}
        </div>
      )}

      {/* 操作按钮 */}
      {!isProcessed ? (
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  onEdit(editText);
                  setIsEditing(false);
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors"
              >
                保存修改
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-bg-secondary text-ink-secondary text-xs font-medium hover:bg-bg-primary transition-colors"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onApprove}
                className="flex-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors"
              >
                写入章节
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-bg-secondary text-ink-secondary text-xs font-medium hover:bg-bg-primary transition-colors"
              >
                编辑
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1.5 rounded-lg bg-bg-secondary text-ink-muted text-xs font-medium hover:text-error transition-colors"
              >
                丢弃
              </button>
            </>
          )}
        </div>
      ) : (
        extract.status === 'rejected' && (
          <p className="text-xs text-ink-muted italic">此内容已丢弃</p>
        )
      )}
    </div>
  );
};

export default ContentExtractCard;
