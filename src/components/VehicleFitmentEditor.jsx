import { useEffect, useMemo, useState } from 'react';
import { VEHICLE_BRANDS } from './VehicleModelSelect';
import { getVehicleModelsForMake } from '../services/vehicleCatalogService';
import { normalizeVehicleFitments } from '../lib/vehicleFitments';

export function VehicleFitmentEditor({
  value = [],
  onChange,
  label = 'Vehicle compatibility',
  required = false,
}) {
  const fitments = normalizeVehicleFitments({ vehicle_fitments: value });
  const [selectedMake, setSelectedMake] = useState('');
  const [customMake, setCustomMake] = useState('');
  const [modelDraft, setModelDraft] = useState('');
  const [catalogModels, setCatalogModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const effectiveMake = useMemo(() => {
    if (selectedMake === 'Other') return customMake.trim();
    return selectedMake.trim();
  }, [selectedMake, customMake]);

  useEffect(() => {
    if (!effectiveMake || (selectedMake === 'Other' && !customMake.trim())) {
      setCatalogModels([]);
      return;
    }
    setLoadingModels(true);
    getVehicleModelsForMake(effectiveMake)
      .then((models) => setCatalogModels(models))
      .catch(() => setCatalogModels([]))
      .finally(() => setLoadingModels(false));
  }, [effectiveMake, selectedMake, customMake]);

  const updateFitments = (next) => {
    onChange(normalizeVehicleFitments({ vehicle_fitments: next }));
  };

  const addModel = () => {
    const make = effectiveMake;
    const model = modelDraft.trim();
    if (!make || !model) return;

    const next = [...fitments];
    const idx = next.findIndex((entry) => entry.make.toLowerCase() === make.toLowerCase());
    if (idx >= 0) {
      if (!next[idx].models.some((m) => m.toLowerCase() === model.toLowerCase())) {
        next[idx] = { ...next[idx], models: [...next[idx].models, model] };
      }
    } else {
      next.push({ make, models: [model] });
    }
    updateFitments(next);
    setModelDraft('');
  };

  const removeModel = (make, model) => {
    const next = fitments
      .map((entry) => {
        if (entry.make !== make) return entry;
        return { ...entry, models: entry.models.filter((m) => m !== model) };
      })
      .filter((entry) => entry.models.length > 0);
    updateFitments(next);
  };

  const filteredSuggestions = catalogModels.filter(
    (model) => !modelDraft || model.toLowerCase().includes(modelDraft.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required ? ' *' : ''}
        </label>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle make</label>
        <select
          value={selectedMake}
          onChange={(e) => {
            setSelectedMake(e.target.value);
            if (e.target.value !== 'Other') setCustomMake('');
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
        >
          <option value="">Select vehicle make</option>
          {VEHICLE_BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
        {selectedMake === 'Other' && (
          <input
            type="text"
            value={customMake}
            onChange={(e) => setCustomMake(e.target.value)}
            placeholder="Enter vehicle make"
            className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle model</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addModel();
              }
            }}
            list="vehicle-model-suggestions"
            placeholder={effectiveMake ? 'Type or select model' : 'Select make first'}
            disabled={!effectiveMake}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none disabled:bg-slate-50"
          />
          <button
            type="button"
            onClick={addModel}
            disabled={!effectiveMake || !modelDraft.trim()}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <datalist id="vehicle-model-suggestions">
          {filteredSuggestions.map((model) => (
            <option key={model} value={model} />
          ))}
        </datalist>
        {effectiveMake && (
          <p className="mt-1 text-xs text-slate-500">
            {loadingModels
              ? 'Loading saved models…'
              : catalogModels.length
                ? 'Pick a saved model or type a new one — new models are saved for next time.'
                : 'No saved models yet for this make — type one to add it.'}
          </p>
        )}
      </div>

      {fitments.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {fitments.map((entry) => (
            <div key={entry.make}>
              <p className="text-sm font-semibold text-slate-800">{entry.make}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {entry.models.map((model) => (
                  <span
                    key={`${entry.make}-${model}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-asahi/10 text-asahi text-sm font-medium"
                  >
                    {model}
                    <button
                      type="button"
                      onClick={() => removeModel(entry.make, model)}
                      className="rounded-full hover:bg-asahi/20 p-0.5"
                      aria-label={`Remove ${entry.make} ${model}`}
                    >
                      <span className="text-xs leading-none">×</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {required && !fitments.some((entry) => entry.make && entry.models.length > 0) && (
        <p className="text-xs text-slate-500">Add at least one vehicle make and model.</p>
      )}
    </div>
  );
}
