import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import type { EditorMode, SaveStatus } from '../../types';

interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

interface MarkdownEditorProps {
  initialContent: string;
  onChange: (value: string) => void;
  mode: EditorMode;
  placeholder?: string;
  saveStatus?: SaveStatus;
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onSelectionChange?: (range: SelectionRange | null) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent,
  onChange,
  mode,
  placeholder = '开始写作...',
  saveStatus = 'saved',
  onUndo,
  onRedo,
  onFind,
  onReplace,
  onSelectionChange,
  canUndo = false,
  canRedo = false,
}) => {
  const [localContent, setLocalContent] = useState(initialContent);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentSelection, setCurrentSelection] = useState<SelectionRange | null>(null);

  const contentRef = useRef(initialContent);
  const isExternalUpdate = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialContent !== contentRef.current) {
      isExternalUpdate.current = true;
      setLocalContent(initialContent);
      contentRef.current = initialContent;
      setTimeout(() => {
        isExternalUpdate.current = false;
      }, 0);
    }
  }, [initialContent]);

  useEffect(() => {
    if (!onSelectionChange) return;

    const handleSelectionChange = () => {
      const textarea = textareaRef.current || document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);

      if (selected.length > 0) {
        const range = { start, end, text: selected };
        setCurrentSelection(range);
        onSelectionChange(range);
      } else {
        setCurrentSelection(null);
        onSelectionChange(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    const textarea = textareaRef.current || document.querySelector('textarea');
    if (textarea) {
      textarea.addEventListener('mouseup', handleSelectionChange);
      textarea.addEventListener('keyup', handleSelectionChange);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (textarea) {
        textarea.removeEventListener('mouseup', handleSelectionChange);
        textarea.removeEventListener('keyup', handleSelectionChange);
      }
    };
  }, [onSelectionChange]);

  const handleLocalChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      contentRef.current = value;
      onChange(value);
    },
    [onChange]
  );

  const insertIndent = useCallback(() => {
    const textarea = textareaRef.current || document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const indent = '  ';

    const newContent =
      localContent.substring(0, start) + indent + localContent.substring(end);

    setLocalContent(newContent);
    contentRef.current = newContent;
    onChange(newContent);

    requestAnimationFrame(() => {
      textarea.selectionStart = start + indent.length;
      textarea.selectionEnd = start + indent.length;
    });
  }, [localContent, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        insertIndent();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
        onFind?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
        onReplace?.();
      }
    },
    [onUndo, onRedo, onFind, onReplace, insertIndent]
  );

  const handleReplaceAll = useCallback(() => {
    if (!findText) return;
    const newValue = localContent.split(findText).join(replaceText);
    handleLocalChange(newValue);
  }, [findText, replaceText, localContent, handleLocalChange]);

  const saveStatusIndicator = useMemo(() => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-xs text-ink-faint flex items-center gap-1">
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            保存中...
          </span>
        );
      case 'unsaved':
        return <span className="text-xs text-warning">未保存</span>;
      case 'error':
        return <span className="text-xs text-danger">保存失败</span>;
      default:
        return (
          <span className="text-xs text-success flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            已保存
          </span>
        );
    }
  }, [saveStatus]);

  const insertFormatting = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = localContent.substring(start, end);
        const newContent =
          localContent.substring(0, start) + prefix + selected + suffix + localContent.substring(end);
        handleLocalChange(newContent);
      }
    },
    [localContent, handleLocalChange]
  );

  const renderToolbar = () => (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle bg-bg-subtle/50">
      <div className="flex items-center gap-1">
        <button
          className={`p-1.5 rounded hover:bg-bg-base transition-colors ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </button>
        <button
          className={`p-1.5 rounded hover:bg-bg-base transition-colors ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
          onClick={onRedo}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
          </svg>
        </button>
      </div>

      <div className="w-px h-5 bg-border-subtle mx-1" />

      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded hover:bg-bg-base transition-colors"
          onClick={() => insertFormatting('**', '**')}
          title="加粗 (Ctrl+B)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 4.5h3.5a3.5 3.5 0 010 7h-3.5v-7zM6.75 12h4a4 4 0 010 8h-4v-8z" />
          </svg>
        </button>
        <button
          className="p-1.5 rounded hover:bg-bg-base transition-colors italic"
          onClick={() => insertFormatting('*', '*')}
          title="斜体 (Ctrl+I)"
        >
          <span className="text-sm font-serif">I</span>
        </button>
      </div>

      <div className="w-px h-5 bg-border-subtle mx-1" />

      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded hover:bg-bg-base transition-colors"
          onClick={() => setShowFindReplace(!showFindReplace)}
          title="查找/替换 (Ctrl+F)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>

      <div className="flex-1" />

      {saveStatusIndicator}
    </div>
  );

  const renderFindReplace = () => (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-bg-subtle/30">
      <input
        type="text"
        className="input text-xs flex-1"
        placeholder="查找..."
        value={findText}
        onChange={(e) => setFindText(e.target.value)}
      />
      <input
        type="text"
        className="input text-xs flex-1"
        placeholder="替换为..."
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
      />
      <button className="btn btn-ghost btn-sm text-xs" onClick={handleReplaceAll}>
        全部替换
      </button>
      <button
        className="p-1 rounded hover:bg-bg-base transition-colors"
        onClick={() => setShowFindReplace(false)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const renderSelectionBar = () => {
    if (!currentSelection) return null;

    const previewText = currentSelection.text.length > 50
      ? currentSelection.text.slice(0, 50) + '...'
      : currentSelection.text;

    return (
      <div className="flex items-center gap-3 px-3 py-2 border-b border-brand/20 bg-brand/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-4 h-4 text-brand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
          </svg>
          <span className="text-xs text-brand font-medium">已选择 {currentSelection.text.length} 字</span>
          <span className="text-xs text-ink-muted truncate">{previewText}</span>
        </div>
        <button
          className="p-1 rounded hover:bg-bg-base transition-colors text-ink-muted hover:text-ink"
          onClick={() => {
            setCurrentSelection(null);
            onSelectionChange?.(null);
          }}
          title="取消选择"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  };

  if (mode === 'markdown' || mode === 'split') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" onKeyDown={handleKeyDown}>
        {renderToolbar()}
        {renderSelectionBar()}
        {showFindReplace && renderFindReplace()}
        {mode === 'split' ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r border-border-subtle">
              <MDEditor
                value={localContent}
                onChange={(val) => handleLocalChange(val || '')}
                height="100%"
                preview="edit"
                textareaProps={{
                  placeholder,
                  style: {
                    fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                  },
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <MDEditor.Markdown
                source={localContent || '*暂无内容*'}
                style={{ padding: '1rem' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <MDEditor
              value={localContent}
              onChange={(val) => handleLocalChange(val || '')}
              height="100%"
              preview="live"
              textareaProps={{
                placeholder,
                style: {
                  fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
                },
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" onKeyDown={handleKeyDown}>
      {renderToolbar()}
      {renderSelectionBar()}
      {showFindReplace && renderFindReplace()}
      <textarea
        ref={textareaRef}
        className="flex-1 w-full resize-none bg-transparent text-base text-ink leading-relaxed focus:outline-none p-6"
        placeholder={placeholder}
        value={localContent}
        onChange={(e) => handleLocalChange(e.target.value)}
        style={{ fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif' }}
      />
    </div>
  );
};

export default React.memo(MarkdownEditor);
