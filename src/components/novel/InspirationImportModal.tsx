import React, { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { SavedInspiration } from '../../types';

interface InspirationImportModalProps {
  onImport: (inspirations: Omit<SavedInspiration, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}

interface ParsedRow {
  type: SavedInspiration['type'];
  content: string;
  tags: string[];
  isValid: boolean;
  error?: string;
}

const VALID_TYPES: SavedInspiration['type'][] = ['plot', 'character', 'scene', 'dialogue', 'theme'];

const TYPE_LABELS: Record<SavedInspiration['type'], string> = {
  plot: '情节',
  character: '角色',
  scene: '场景',
  dialogue: '对话',
  theme: '主题',
};

const InspirationImportModal: React.FC<InspirationImportModalProps> = ({ onImport, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseExcel = useCallback((data: ArrayBuffer): ParsedRow[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return [];
    }

    const rows: ParsedRow[] = [];
    const startRow = jsonData.length > 1 && typeof jsonData[0][0] === 'string' &&
      (jsonData[0][0] as string).toLowerCase().includes('类型') ? 1 : 0;

    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown as unknown[];
      if (!row || row.length === 0) continue;

      const typeValue = String(row[0] || '').trim();
      const contentValue = String(row[1] || '').trim();
      const tagsValue = row[2] !== undefined ? String(row[2] || '').trim() : '';

      if (!typeValue && !contentValue) continue;

      let type: SavedInspiration['type'] | null = null;
      for (const validType of VALID_TYPES) {
        if (typeValue === validType || typeValue === TYPE_LABELS[validType]) {
          type = validType;
          break;
        }
      }

      if (!type) {
        rows.push({
          type: 'plot',
          content: contentValue,
          tags: [],
          isValid: false,
          error: `无法识别的类型: "${typeValue}"，请使用: ${VALID_TYPES.map(t => TYPE_LABELS[t]).join('/')}`,
        });
        continue;
      }

      if (!contentValue) {
        rows.push({
          type,
          content: '',
          tags: [],
          isValid: false,
          error: '灵感内容不能为空',
        });
        continue;
      }

      const tags = tagsValue
        ? tagsValue.split(/[,，;；|]/).map(t => t.trim()).filter(Boolean)
        : [];

      rows.push({
        type,
        content: contentValue,
        tags,
        isValid: true,
      });
    }

    return rows;
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setParsedRows([]);

    if (selectedFile) {
      handleParseFile(selectedFile);
    }
  }, []);

  const handleParseFile = useCallback((file: File) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const rows = parseExcel(data);
        setParsedRows(rows);

        if (rows.length === 0) {
          setError('未解析到有效数据，请检查文件格式');
        }
      } catch {
        setError('文件解析失败，请确保上传的是有效的 Excel 文件');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('文件读取失败');
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  }, [parseExcel]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setParsedRows([]);
      handleParseFile(droppedFile);
    }
  }, [handleParseFile]);

  const handleImport = useCallback(() => {
    const validRows = parsedRows.filter(r => r.isValid);
    const inspirations: Omit<SavedInspiration, 'id' | 'createdAt'>[] = validRows.map(row => ({
      type: row.type,
      content: row.content,
      tags: row.tags,
      isUsed: false,
    }));
    onImport(inspirations);
  }, [parsedRows, onImport]);

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  const handleDownloadTemplate = useCallback(() => {
    const templateData = [
      ['类型', '灵感内容', '标签（可选，用逗号分隔）'],
      ['情节', '主角在雨夜发现了一封神秘信件', '悬疑,雨夜,信件'],
      ['角色', '一个失去记忆的神秘剑客', '剑客,失忆'],
      ['场景', '古老的图书馆，书架间弥漫着灰尘', '图书馆,古老'],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '灵感模板');
    XLSX.writeFile(workbook, '灵感导入模板.xlsx');
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-base rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-semibold text-ink">导入灵感</h2>
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
          <div className="p-4 rounded-xl bg-bg-subtle border border-border-subtle">
            <h4 className="text-sm font-medium text-ink mb-2">Excel 格式说明</h4>
            <p className="text-xs text-ink-muted mb-3">Excel 文件需要包含以下列：</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-2 px-3 text-ink-muted font-medium">列</th>
                    <th className="text-left py-2 px-3 text-ink-muted font-medium">名称</th>
                    <th className="text-left py-2 px-3 text-ink-muted font-medium">说明</th>
                    <th className="text-left py-2 px-3 text-ink-muted font-medium">必填</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-subtle">
                    <td className="py-2 px-3 text-ink">A列</td>
                    <td className="py-2 px-3 text-ink">类型</td>
                    <td className="py-2 px-3 text-ink-muted">
                      {VALID_TYPES.map(t => TYPE_LABELS[t]).join(' / ')}
                    </td>
                    <td className="py-2 px-3 text-brand">是</td>
                  </tr>
                  <tr className="border-b border-border-subtle">
                    <td className="py-2 px-3 text-ink">B列</td>
                    <td className="py-2 px-3 text-ink">灵感内容</td>
                    <td className="py-2 px-3 text-ink-muted">灵感的具体描述</td>
                    <td className="py-2 px-3 text-brand">是</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-ink">C列</td>
                    <td className="py-2 px-3 text-ink">标签</td>
                    <td className="py-2 px-3 text-ink-muted">多个标签用逗号分隔</td>
                    <td className="py-2 px-3 text-ink-faint">否</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="mt-3 text-xs text-brand hover:underline flex items-center gap-1"
              onClick={handleDownloadTemplate}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              下载模板文件
            </button>
          </div>

          <div
            className="border-2 border-dashed border-border-subtle rounded-xl p-8 text-center hover:border-brand/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <svg className="w-12 h-12 text-ink-faint mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-ink mb-2">拖拽文件到此处或点击选择</p>
            <p className="text-xs text-ink-faint">支持 XLSX、XLS、CSV 格式</p>
            {file && (
              <p className="mt-4 text-xs text-brand">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {isProcessing && (
            <div className="p-3 rounded-lg bg-brand/10 border border-brand/20 text-sm text-brand">
              正在解析文件...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
              {error}
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-ink">解析结果</h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-success">✓ 有效 {validCount} 条</span>
                  {invalidCount > 0 && (
                    <span className="text-danger">✗ 无效 {invalidCount} 条</span>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-border-subtle rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-bg-subtle sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 text-ink-muted font-medium">#</th>
                      <th className="text-left py-2 px-3 text-ink-muted font-medium">类型</th>
                      <th className="text-left py-2 px-3 text-ink-muted font-medium">内容</th>
                      <th className="text-left py-2 px-3 text-ink-muted font-medium">标签</th>
                      <th className="text-left py-2 px-3 text-ink-muted font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-border-subtle">
                        <td className="py-2 px-3 text-ink-faint">{idx + 1}</td>
                        <td className="py-2 px-3 text-ink">{TYPE_LABELS[row.type] || '-'}</td>
                        <td className="py-2 px-3 text-ink max-w-[200px] truncate" title={row.content}>
                          {row.content || '-'}
                        </td>
                        <td className="py-2 px-3 text-ink-faint">
                          {row.tags.length > 0 ? row.tags.join(', ') : '-'}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-danger" title={row.error}>✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-subtle">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleImport}
            disabled={validCount === 0}
          >
            导入 {validCount > 0 ? `${validCount} 条灵感` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InspirationImportModal;
