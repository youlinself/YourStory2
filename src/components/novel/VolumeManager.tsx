import React, { useState, useCallback, useMemo } from 'react';
import type { NovelChapter, Volume } from '../../types/novel';

interface VolumeManagerProps {
  chapters: NovelChapter[];
  volumes: Volume[];
  onVolumeAdd: (volume: Omit<Volume, 'id'>) => void;
  onVolumeUpdate: (volumeId: string, updates: Partial<Volume>) => void;
  onVolumeDelete: (volumeId: string) => void;
  onChapterMove: (chapterId: string, volumeId: string | undefined) => void;
  onVolumeReorder: (fromIndex: number, toIndex: number) => void;
  onChapterSelect: (chapterId: string) => void;
}

const VolumeManager: React.FC<VolumeManagerProps> = ({
  chapters,
  volumes,
  onVolumeAdd,
  onVolumeUpdate,
  onVolumeDelete,
  onChapterMove,
  onVolumeReorder,
  onChapterSelect,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVolume, setEditingVolume] = useState<string | null>(null);
  const [newVolume, setNewVolume] = useState({ title: '', description: '' });
  const [draggedChapter, setDraggedChapter] = useState<string | null>(null);
  const [dragOverVolume, setDragOverVolume] = useState<string | null>(null);

  const unassignedChapters = useMemo(() => {
    return chapters.filter((ch) => !ch.volumeId);
  }, [chapters]);

  const chaptersByVolume = useMemo(() => {
    const map = new Map<string, NovelChapter[]>();
    for (const volume of volumes) {
      const volumeChapters = chapters.filter((ch) => ch.volumeId === volume.id);
      map.set(volume.id, volumeChapters);
    }
    return map;
  }, [chapters, volumes]);

  const handleAddVolume = useCallback(() => {
    if (!newVolume.title.trim()) return;
    onVolumeAdd({
      title: newVolume.title.trim(),
      description: newVolume.description.trim(),
      order: volumes.length,
      chapters: [],
      novelId: '',
    });
    setNewVolume({ title: '', description: '' });
    setShowAddModal(false);
  }, [newVolume, volumes.length, onVolumeAdd]);

  const handleDragStart = useCallback((chapterId: string) => {
    setDraggedChapter(chapterId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, volumeId: string | null) => {
    e.preventDefault();
    setDragOverVolume(volumeId);
  }, []);

  const handleDrop = useCallback(
    (volumeId: string | null) => {
      if (draggedChapter) {
        onChapterMove(draggedChapter, volumeId || undefined);
      }
      setDraggedChapter(null);
      setDragOverVolume(null);
    },
    [draggedChapter, onChapterMove]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-ink">分卷管理</h3>
        <button
          className="btn btn-primary btn-sm text-xs"
          onClick={() => setShowAddModal(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>新建卷</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {volumes.length > 0 ? (
          volumes.map((volume, volumeIndex) => {
            const volumeChapters = chaptersByVolume.get(volume.id) || [];
            return (
              <div
                key={volume.id}
                className={`rounded-lg border overflow-hidden transition-all ${
                  dragOverVolume === volume.id ? 'border-brand bg-brand/5' : 'border-border-subtle'
                }`}
                onDragOver={(e) => handleDragOver(e, volume.id)}
                onDrop={() => handleDrop(volume.id)}
              >
                <div className="flex items-center justify-between px-4 py-3 bg-bg-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        className="text-ink-faint hover:text-brand disabled:opacity-30"
                        disabled={volumeIndex === 0}
                        onClick={() => onVolumeReorder(volumeIndex, volumeIndex - 1)}
                      >
                        ▲
                      </button>
                      <button
                        className="text-ink-faint hover:text-brand disabled:opacity-30"
                        disabled={volumeIndex === volumes.length - 1}
                        onClick={() => onVolumeReorder(volumeIndex, volumeIndex + 1)}
                      >
                        ▼
                      </button>
                    </div>
                    <div>
                      {editingVolume === volume.id ? (
                        <input
                          className="input text-sm"
                          value={volume.title}
                          onChange={(e) => onVolumeUpdate(volume.id, { title: e.target.value })}
                          onBlur={() => setEditingVolume(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingVolume(null)}
                          autoFocus
                        />
                      ) : (
                        <h4
                          className="text-sm font-medium text-ink cursor-pointer hover:text-brand"
                          onClick={() => setEditingVolume(volume.id)}
                        >
                          {volume.title}
                        </h4>
                      )}
                      {volume.description && (
                        <p className="text-xs text-ink-faint mt-0.5">{volume.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-faint">{volumeChapters.length} 章</span>
                    <button
                      className="text-ink-faint hover:text-danger"
                      onClick={() => onVolumeDelete(volume.id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022-.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-border-subtle min-h-[40px]">
                  {volumeChapters.length > 0 ? (
                    volumeChapters.map((chapter, index) => (
                      <div
                        key={chapter.id}
                        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-bg-subtle transition-colors"
                        draggable
                        onDragStart={() => handleDragStart(chapter.id)}
                        onClick={() => onChapterSelect(chapter.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-ink-faint w-6">{index + 1}</span>
                          <span className="text-sm text-ink">{chapter.title}</span>
                        </div>
                        <span className="text-xs text-ink-faint">{chapter.wordCount} 字</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-ink-faint">
                      拖拽章节到此处
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-ink-muted">暂无分卷</p>
            <p className="text-xs text-ink-faint mt-1">点击"新建卷"开始组织你的小说结构</p>
          </div>
        )}

        {unassignedChapters.length > 0 && (
          <div
            className={`rounded-lg border overflow-hidden transition-all ${
              dragOverVolume === null ? 'border-brand bg-brand/5' : 'border-border-subtle'
            }`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDrop={() => handleDrop(null)}
          >
            <div className="px-4 py-3 bg-bg-subtle">
              <h4 className="text-sm font-medium text-ink">未分配章节</h4>
              <p className="text-xs text-ink-faint mt-0.5">{unassignedChapters.length} 章</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {unassignedChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-bg-subtle transition-colors"
                  draggable
                  onDragStart={() => handleDragStart(chapter.id)}
                  onClick={() => onChapterSelect(chapter.id)}
                >
                  <span className="text-sm text-ink">{chapter.title}</span>
                  <span className="text-xs text-ink-faint">{chapter.wordCount} 字</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">新建卷</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">卷标题 *</label>
                <input
                  className="input text-sm w-full"
                  placeholder="如：第一卷 启程"
                  value={newVolume.title}
                  onChange={(e) => setNewVolume({ ...newVolume, title: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">卷简介</label>
                <textarea
                  className="input text-sm w-full min-h-[80px]"
                  placeholder="描述本卷的内容..."
                  value={newVolume.description}
                  onChange={(e) => setNewVolume({ ...newVolume, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddModal(false);
                  setNewVolume({ title: '', description: '' });
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddVolume}
                disabled={!newVolume.title.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolumeManager;
