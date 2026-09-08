import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation } from '../../types/novel';

interface AnnotationMarkerProps {
  content: string;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAnnotationSelect: (annotationId: string) => void;
}

const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({
  content,
  annotations,
  onAnnotationAdd,
  onAnnotationSelect,
}) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowPopover(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setShowPopover(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const rect = range.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
    });

    setSelectedText(text);
    setSelectionRange({
      start: range.startOffset,
      end: range.endOffset,
    });
    setShowPopover(true);
  }, []);

  const handleAddAnnotation = useCallback(
    (type: Annotation['type']) => {
      onAnnotationAdd({
        startPos: selectionRange.start,
        endPos: selectionRange.end,
        text: selectedText,
        note: '',
        type,
      });
      setShowPopover(false);
      window.getSelection()?.removeAllRanges();
    },
    [onAnnotationAdd, selectionRange, selectedText]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderHighlightedContent = () => {
    if (annotations.length === 0) {
      return <span>{content}</span>;
    }

    const sortedAnnotations = [...annotations].sort((a, b) => a.startPos - b.startPos);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, idx) => {
      if (annotation.startPos > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{content.slice(lastIndex, annotation.startPos)}</span>
        );
      }

      const colorMap: Record<Annotation['type'], string> = {
        comment: 'rgba(59, 130, 246, 0.2)',
        todo: 'rgba(245, 158, 11, 0.2)',
        idea: 'rgba(16, 185, 129, 0.2)',
      };

      parts.push(
        <span
          key={`annotation-${idx}`}
          className="cursor-pointer border-b-2 border-dashed"
          style={{
            backgroundColor: colorMap[annotation.type],
            borderColor: annotation.type === 'comment' ? '#3b82f6' : annotation.type === 'todo' ? '#f59e0b' : '#10b981',
          }}
          onClick={() => onAnnotationSelect(annotation.id)}
          title={annotation.note}
        >
          {content.slice(annotation.startPos, annotation.endPos)}
        </span>
      );

      lastIndex = annotation.endPos;
    });

    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.slice(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div ref={containerRef} className="relative" onMouseUp={handleTextSelect}>
      <div className="whitespace-pre-wrap text-sm text-ink leading-relaxed">
        {renderHighlightedContent()}
      </div>

      {showPopover && (
        <div
          className="absolute z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ left: popoverPosition.x, top: popoverPosition.y }}
        >
          <div className="bg-bg-base rounded-lg shadow-lg border border-border-subtle p-2 flex gap-1">
            <button
              className="px-2 py-1 rounded text-xs bg-brand/10 text-brand hover:bg-brand/20"
              onClick={() => handleAddAnnotation('comment')}
            >
              批注
            </button>
            <button
              className="px-2 py-1 rounded text-xs bg-warning/10 text-warning hover:bg-warning/20"
              onClick={() => handleAddAnnotation('todo')}
            >
              待办
            </button>
            <button
              className="px-2 py-1 rounded text-xs bg-success/10 text-success hover:bg-success/20"
              onClick={() => handleAddAnnotation('idea')}
            >
              灵感
            </button>
          </div>
          <div className="w-2 h-2 bg-bg-base border-r border-b border-border-subtle transform rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  );
};

export default AnnotationMarker;
