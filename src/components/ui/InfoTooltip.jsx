import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ text, className = '' }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShow(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [show]);

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow((s) => !s); }}
        className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="More info"
      >
        <Info className="w-4 h-4" strokeWidth={2} />
      </button>
      {show && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[200px] max-w-[280px] px-3 py-2 text-xs text-slate-600 bg-slate-800 text-slate-100 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </div>
      )}
    </span>
  );
}
