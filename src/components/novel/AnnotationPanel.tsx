import React, { useState, useCallback, useMemo } from 'react';
import type { Annotation } from '../../types/novel';

interface AnnotationPanelProps {
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
  onAnnotationDelete: (annotationId: string) => void;
  onAnnotationSelect: (annotationId: string) => void;
}

const ANNOTATION_TYPE_LABELS: Record<Annotation['type'], string> = {
  comment: '批注',
  todo: '待办',
  idea: '灵感',
};

const ANNOTATION_TYPE_COLORS: Record<Annotation['type'], string> = {
  comment: '#3b82f6',
  todo: '#f59e0b',
  idea: '#10b981',
};

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAnnotationSelect,
}) => {
  const [filterType, setFilterType] = useState<Annotation['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    startPos: 0,
    endPos: 0,
    text: '',
    note: '',
    type: 'comment' as Annotation['type'],
  });

  const filteredAnnotations = useMemo(() => {
    let filtered = annotations;
    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.type === filterType);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.text.toLowerCase().includes(query) ||
          a.note.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [annotations, filterType, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: annotations.length,
      comment: annotations.filter((a) => a.type === 'comment').length,
      todo: annotations.filter((a) => a.type === 'todo').length,
      idea: annotations.filter((a) => a.type === 'idea').length,
    };
  }, [annotations]);

  const handleAddAnnotation = useCallback(() => {
    if (!newAnnotation.note.trim()) return;
    onAnnotationAdd({
      startPos: newAnnotation.startPos,
      endPos: newAnnotation.endPos,
      text: newAnnotation.text,
      note: newAnnotation.note.trim(),
      type: newAnnotation.type,
    });
    setNewAnnotation({ startPos: 0, endPos: 0, text: '', note: '', type: 'comment' });
    setShowAddModal(false);
  }, [newAnnotation, onAnnotationAdd]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <select
            className="input text-xs py-1 w-24"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          >
            <option value="all">全部 ({stats.total})</option>
            <option value="comment">批注 ({stats.comment})</option>
            <option value="todo">待办 ({stats.todo})</option>
            <option value="idea">灵感 ({stats.idea})</option>
          </select>

          <input
            className="input text-xs py-1 w-40"
            placeholder="搜索注释..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-sm text-xs"
          onClick={() => setShowAddModal(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>添加注释</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredAnnotations.length > 0 ? (
            filteredAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="p-3 rounded-lg border border-border-subtle hover:border-border transition-all cursor-pointer"
                onClick={() => onAnnotationSelect(annotation.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ANNOTATION_TYPE_COLORS[annotation.type] }}
                    />
                    <span className="text-xs font-medium text-ink">
                      {ANNOTATION_TYPE_LABELS[annotation.type]}
                    </span>
                    <span className="text-[10px] text-ink-faint">
                      {new Date(annotation.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <button
                    className="text-ink-faint hover:text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnnotationDelete(annotation.id);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {annotation.text && (
                  <div className="px-2 py-1 rounded bg-bg-subtle text-xs text-ink-muted mb-2 truncate">
                    "{annotation.text}"
                  </div>
                )}

                <p className="text-sm text-ink">{annotation.note}</p>

                <div className="flex items-center gap-2 mt-2">
                  <select
                    className="input text-[10px] py-0.5 w-20"
                    value={annotation.type}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      onAnnotationUpdate(annotation.id, { type: e.target.value as Annotation['type'] })
                    }
                  >
                    <option value="comment">批注</option>
                    <option value="todo">待办</option>
                    <option value="idea">灵感</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-ink-muted">暂无注释</p>
              <p className="text-xs text-ink-faint mt-1">选中文本后点击"添加注释"开始记录</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">添加注释</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">注释类型</label>
                <select
                  className="input text-sm w-full"
                  value={newAnnotation.type}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, type: e.target.value as Annotation['type'] })}
                >
                  <option value="comment">批注</option>
                  <option value="todo">待办</option>
                  <option value="idea">灵感</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">选中文本 (可选)</label>
                <input
                  className="input text-sm w-full"
                  placeholder="输入或粘贴选中的文本..."
                  value={newAnnotation.text}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, text: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">注释内容 *</label>
                <textarea
                  className="input text-sm w-full min-h-[100px]"
                  placeholder="输入你的注释..."
                  value={newAnnotation.note}
                  onChange={(e) => setNewAnnotation({ ...newAnnotation, note: e.target.value })}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddModal(false);
                  setNewAnnotation({ startPos: 0, endPos: 0, text: '', note: '', type: 'comment' });
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddAnnotation}
                disabled={!newAnnotation.note.trim()}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationPanel;
