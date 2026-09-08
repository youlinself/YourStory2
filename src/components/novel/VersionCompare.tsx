import React, { useState, useMemo, useCallback } from 'react';

interface Version {
  id: string;
  content: string;
  description: string;
  createdAt: string;
  wordCount: number;
  isAutoSave: boolean;
}

interface VersionCompareProps {
  versions: Version[];
  currentContent: string;
  onRestoreVersion: (content: string) => void;
  onSaveVersion: (description: string) => void;
  onClose: () => void;
}

interface DiffResult {
  type: 'equal' | 'add' | 'delete';
  text: string;
}

const VersionCompare: React.FC<VersionCompareProps> = ({
  versions,
  currentContent,
  onSaveVersion,
  onClose,
}) => {
  const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveDescription, setSaveDescription] = useState('');

  const calculateDiff = useCallback((text1: string, text2: string): DiffResult[] => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const result: DiffResult[] = [];

    const lcs = computeLCS(lines1, lines2);

    let i = 0;
    let j = 0;
    let k = 0;

    while (i < lines1.length || j < lines2.length) {
      if (k < lcs.length && i < lines1.length && lines1[i] === lcs[k]) {
        if (j < lines2.length && lines2[j] === lcs[k]) {
          result.push({ type: 'equal', text: lines1[i] });
          i++;
          j++;
          k++;
        } else if (j < lines2.length) {
          result.push({ type: 'add', text: lines2[j] });
          j++;
        }
      } else if (i < lines1.length && (k >= lcs.length || lines1[i] !== lcs[k])) {
        result.push({ type: 'delete', text: lines1[i] });
        i++;
      } else if (j < lines2.length) {
        result.push({ type: 'add', text: lines2[j] });
        j++;
      }
    }

    return result;
  }, []);

  const computeLCS = (arr1: string[], arr2: string[]): string[] => {
    const m = arr1.length;
    const n = arr2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const lcs: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  };

  const diff = useMemo(() => {
    const [id1, id2] = selectedVersions;
    if (!id1 || !id2) return [];

    const version1 = id1 === '__current__' ? { content: currentContent } : versions.find((v) => v.id === id1);
    const version2 = id2 === '__current__' ? { content: currentContent } : versions.find((v) => v.id === id2);

    if (!version1 || !version2) return [];

    return calculateDiff(version1.content, version2.content);
  }, [selectedVersions, versions, currentContent, calculateDiff]);

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    for (const d of diff) {
      if (d.type === 'add') additions++;
      else if (d.type === 'delete') deletions++;
      else unchanged++;
    }

    return { additions, deletions, unchanged };
  }, [diff]);

  const handleSaveVersion = useCallback(() => {
    if (!saveDescription.trim()) return;
    onSaveVersion(saveDescription.trim());
    setSaveDescription('');
    setShowSaveModal(false);
  }, [saveDescription, onSaveVersion]);

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [versions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-base rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-subtle">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-ink">版本对比</h2>
              <p className="text-xs text-ink-faint mt-0.5">比较不同版本之间的差异</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary btn-sm text-xs"
              onClick={() => setShowSaveModal(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>保存当前版本</span>
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-base transition-colors"
              onClick={onClose}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-3 border-b border-border-subtle">
          <div className="flex-1">
            <label className="text-xs text-ink-muted block mb-1">版本 A (旧)</label>
            <select
              className="input text-sm w-full"
              value={selectedVersions[0] || ''}
              onChange={(e) => setSelectedVersions([e.target.value, selectedVersions[1]])}
            >
              <option value="">选择版本...</option>
              <option value="__current__">当前内容</option>
              {sortedVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.description || new Date(v.createdAt).toLocaleString('zh-CN')}
                </option>
              ))}
            </select>
          </div>
          <svg className="w-5 h-5 text-ink-faint mt-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <div className="flex-1">
            <label className="text-xs text-ink-muted block mb-1">版本 B (新)</label>
            <select
              className="input text-sm w-full"
              value={selectedVersions[1] || ''}
              onChange={(e) => setSelectedVersions([selectedVersions[0], e.target.value])}
            >
              <option value="">选择版本...</option>
              <option value="__current__">当前内容</option>
              {sortedVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.description || new Date(v.createdAt).toLocaleString('zh-CN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedVersions[0] && selectedVersions[1] && (
          <div className="flex items-center gap-4 px-6 py-2 border-b border-border-subtle bg-bg-subtle/50 text-xs">
            <span className="flex items-center gap-1 text-success">
              <span className="w-3 h-3 rounded bg-success" />
              新增: {stats.additions} 行
            </span>
            <span className="flex items-center gap-1 text-danger">
              <span className="w-3 h-3 rounded bg-danger" />
              删除: {stats.deletions} 行
            </span>
            <span className="flex items-center gap-1 text-ink-faint">
              <span className="w-3 h-3 rounded bg-bg-base" />
              未变: {stats.unchanged} 行
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {selectedVersions[0] && selectedVersions[1] ? (
            diff.length > 0 ? (
              <div className="p-4 font-mono text-sm">
                {diff.map((d, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 ${
                      d.type === 'add'
                        ? 'bg-success/10 border-l-2 border-success'
                        : d.type === 'delete'
                        ? 'bg-danger/10 border-l-2 border-danger line-through opacity-70'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <span className="inline-block w-6 text-xs text-ink-faint select-none">
                      {d.type === 'add' ? '+' : d.type === 'delete' ? '-' : ' '}
                    </span>
                    <span className={d.type === 'equal' ? 'text-ink-muted' : ''}>{d.text || ' '}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-ink-muted">两个版本内容相同</p>
              </div>
            )
          ) : (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-ink-faint mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-ink-muted">选择两个版本进行对比</p>
              <p className="text-xs text-ink-faint mt-1">可以从下拉菜单中选择历史版本与当前内容或其他版本对比</p>
            </div>
          )}
        </div>

        <div className="border-t border-border-subtle">
          <div className="px-6 py-3">
            <h4 className="text-xs font-medium text-ink mb-2">版本历史</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sortedVersions.map((version) => (
                <div
                  key={version.id}
                  className={`flex-shrink-0 w-40 p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedVersions.includes(version.id)
                      ? 'border-brand bg-brand/5'
                      : 'border-border-subtle hover:border-border'
                  }`}
                  onClick={() => {
                    if (!selectedVersions[0]) {
                      setSelectedVersions([version.id, selectedVersions[1]]);
                    } else if (!selectedVersions[1]) {
                      setSelectedVersions([selectedVersions[0], version.id]);
                    } else {
                      setSelectedVersions([version.id, null]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-ink-faint">
                      {new Date(version.createdAt).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {version.isAutoSave && (
                      <span className="text-[10px] text-brand">自动</span>
                    )}
                  </div>
                  <p className="text-xs text-ink truncate">
                    {version.description || '无描述'}
                  </p>
                  <p className="text-[10px] text-ink-faint mt-1">
                    {version.wordCount} 字
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-bg-base rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-ink mb-4">保存当前版本</h3>
            <input
              className="input text-sm w-full mb-4"
              placeholder="版本描述 (如: 完成第一章初稿)..."
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveDescription('');
                }}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveVersion}
                disabled={!saveDescription.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionCompare;
