import { useState } from 'react';

export function MultiValueInput({
  value = [],
  onChange,
  label,
  required = false,
  placeholder = 'Type and add',
  addLabel = 'Add',
  emptyHint,
}) {
  const values = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState('');

  const addValue = () => {
    const trimmed = String(draft || '').trim();
    if (!trimmed) return;
    if (values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...values, trimmed]);
    setDraft('');
  };

  const removeValue = (entry) => {
    onChange(values.filter((v) => v !== entry));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required ? ' *' : ''}
        </label>
      )}

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((entry) => (
            <span
              key={entry}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium"
            >
              {entry}
              <button
                type="button"
                onClick={() => removeValue(entry)}
                className="rounded-full hover:bg-slate-200 p-0.5"
                aria-label={`Remove ${entry}`}
              >
                <span className="text-xs leading-none">×</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
        />
        <button
          type="button"
          onClick={addValue}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
        >
          {addLabel}
        </button>
      </div>

      {required && values.length === 0 && emptyHint && (
        <p className="mt-1 text-xs text-slate-500">{emptyHint}</p>
      )}
    </div>
  );
}
