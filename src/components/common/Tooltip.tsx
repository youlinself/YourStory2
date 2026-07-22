import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const posClass = position === 'top'
    ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
    : 'top-full mt-2 left-1/2 -translate-x-1/2';

  const arrowClass = position === 'top'
    ? 'top-full left-1/2 -translate-x-1/2 border-t-ink border-l-transparent border-r-transparent border-b-transparent'
    : 'bottom-full left-1/2 -translate-x-1/2 border-b-ink border-l-transparent border-r-transparent border-t-transparent';

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 px-3 py-2 rounded-lg bg-gray-800 text-white text-xs shadow-xl pointer-events-none ${posClass}`} style={{ minWidth: '180px', maxWidth: '240px' }}>
          {content}
          <span className={`absolute w-0 h-0 border-4 ${arrowClass}`} />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
