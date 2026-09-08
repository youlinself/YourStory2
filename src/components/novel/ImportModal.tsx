import React, { useState, useCallback, useRef } from 'react';
import NovelImportService, { ImportOptions, ImportResult } from '../../services/import/NovelImportService';

interface ImportModalProps {
  onImport: (result: ImportResult) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    chapterSeparator: 'heading',
    autoDetectChapters: true,
    importMetadata: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    setError(null);
    setPreview(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'text/plain' || f.type === 'text/markdown' || f.name.endsWith('.txt') || f.name.endsWith('.md')
    );
    setFiles(droppedFiles);
    setError(null);
    setPreview(null);
  }, []);

  const handlePreview = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await NovelImportService.parseFile(files[0], options);
      const validation = NovelImportService.validateImportResult(result);

      if (!validation.valid) {
        setError(validation.errors.join('; '));
      } else {
        setPreview(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
    } finally {
      setIsProcessing(false);
    }
  }, [files, options]);

  const handleImport = useCallback(() => {
    if (preview) {
      onImport(preview);
    }
  }, [preview, onImport]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-base rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-ink">导入小说</h2>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-subtle transition-colors"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div
            className="border-2 border-dashed border-border-subtle rounded-xl p-8 text-center hover:border-brand/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <svg className="w-12 h-12 text-ink-faint mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-ink mb-2">拖拽文件到此处或点击选择</p>
            <p className="text-xs text-ink-faint">支持 TXT、Markdown 格式</p>
            {files.length > 0 && (
              <div className="mt-4 space-y-1">
                {files.map((file, idx) => (
                  <p key={idx} className="text-xs text-brand">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-ink">导入选项</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink-muted block mb-1">章节分割方式</label>
                <select
                  className="input text-sm w-full"
                  value={options.chapterSeparator}
                  onChange={(e) => setOptions({ ...options, chapterSeparator: e.target.value as ImportOptions['chapterSeparator'] })}
                >
                  <option value="heading">按标题分割</option>
                  <option value="divider">按分隔符分割</option>
                  <option value="regex">自定义正则</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-ink-muted block mb-1">自定义分隔符 (正则)</label>
                <input
                  className="input text-sm w-full"
                  placeholder="如：/^第.+章/gm"
                  value={options.customSeparator || ''}
                  onChange={(e) => setOptions({ ...options, customSeparator: e.target.value })}
                  disabled={options.chapterSeparator !== 'regex'}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={options.autoDetectChapters}
                  onChange={(e) => setOptions({ ...options, autoDetectChapters: e.target.checked })}
                />
                自动检测章节
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={options.importMetadata}
                  onChange={(e) => setOptions({ ...options, importMetadata: e.target.checked })}
                />
                导入元数据
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              {error}
            </div>
          )}

          {preview && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-ink">预览</h4>
              <div className="p-3 rounded-lg bg-bg-subtle">
                <p className="text-sm font-medium text-ink mb-2">{preview.title}</p>
                <p className="text-xs text-ink-faint mb-3">
                  检测到 {preview.chapters.length} 个章节
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {preview.chapters.slice(0, 10).map((chapter, idx) => (
                    <div key={idx} className="p-2 rounded bg-bg-base text-xs">
                      <p className="font-medium text-ink truncate">{chapter.title}</p>
                      <p className="text-ink-faint">{chapter.content.length} 字符</p>
                    </div>
                  ))}
                  {preview.chapters.length > 10 && (
                    <p className="text-xs text-ink-faint text-center">
                      还有 {preview.chapters.length - 10} 个章节...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-subtle">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            取消
          </button>
          {!preview && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handlePreview}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? '解析中...' : '预览'}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleImport}
            disabled={!preview}
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
