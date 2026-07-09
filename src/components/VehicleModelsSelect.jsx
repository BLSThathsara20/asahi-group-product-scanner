import { useState } from 'react';
import { VEHICLE_BRANDS } from './VehicleModelSelect';

export function VehicleModelsSelect({
  value = [],
  onChange,
  label = 'Vehicle Models',
  required = false,
  placeholder = 'Add vehicle make',
}) {
  const models = Array.isArray(value) ? value : [];
  const [picker, setPicker] = useState('');
  const [otherText, setOtherText] = useState('');
  const [showOther, setShowOther] = useState(false);

  const addModel = (raw) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed) return;
    const upper = trimmed.toUpperCase();
    const normalized = VEHICLE_BRANDS.includes(upper) ? upper : trimmed;
    if (models.some((m) => m.toLowerCase() === normalized.toLowerCase())) return;
    onChange([...models, normalized]);
    setPicker('');
    setOtherText('');
    setShowOther(false);
  };

  const removeModel = (model) => {
    onChange(models.filter((m) => m !== model));
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required ? ' *' : ''}
        </label>
      )}

      {models.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {models.map((model) => (
            <span
              key={model}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-asahi/10 text-asahi text-sm font-medium"
            >
              {model}
              <button
                type="button"
                onClick={() => removeModel(model)}
                className="rounded-full hover:bg-asahi/20 p-0.5"
                aria-label={`Remove ${model}`}
              >
                <span className="text-xs leading-none">×</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={showOther ? 'Other' : picker}
          onChange={(e) => {
            const next = e.target.value;
            if (next === 'Other') {
              setShowOther(true);
              setPicker('');
              return;
            }
            setShowOther(false);
            setPicker(next);
            if (next) addModel(next);
          }}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
        >
          <option value="">{placeholder}</option>
          {VEHICLE_BRANDS.filter((b) => !models.includes(b)).map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {showOther && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Enter vehicle model"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
          />
          <button
            type="button"
            onClick={() => addModel(otherText)}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium"
          >
            Add
          </button>
        </div>
      )}

      {required && models.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">Add at least one vehicle model</p>
      )}
    </div>
  );
}
