import { useEffect, useMemo, useState } from 'react';
import { VEHICLE_BRANDS } from './VehicleModelSelect';
import { getVehicleModelsForMake } from '../services/vehicleCatalogService';
import { NOT_SPECIFIED_MODEL, normalizeVehicleFitments } from '../lib/vehicleFitments';
import { formInputClass, formSelectClass } from '../lib/formFieldStyles';

function applyMakeToState(make, setSelectedMake, setCustomMake) {
  if (!make) {
    setSelectedMake('');
    setCustomMake('');
    return;
  }
  if (VEHICLE_BRANDS.includes(make)) {
    setSelectedMake(make);
    setCustomMake('');
  } else {
    setSelectedMake('Other');
    setCustomMake(make);
  }
}

function getMakeStateFromFitments(fitments) {
  const activeMake = fitments[fitments.length - 1]?.make || fitments[0]?.make || '';
  if (!activeMake) return { selectedMake: '', customMake: '' };
  if (VEHICLE_BRANDS.includes(activeMake)) return { selectedMake: activeMake, customMake: '' };
  return { selectedMake: 'Other', customMake: activeMake };
}

export function VehicleFitmentEditor({
  value = [],
  onChange,
  label = null,
  required = false,
}) {
  const fitments = useMemo(() => normalizeVehicleFitments({ vehicle_fitments: value }), [value]);
  const fitmentsKey = useMemo(
    () => fitments.map((entry) => `${entry.make}:${entry.models.map((m) => m.name).join(',')}`).join('|'),
    [fitments]
  );

  const [selectedMake, setSelectedMake] = useState(() => getMakeStateFromFitments(fitments).selectedMake);
  const [customMake, setCustomMake] = useState(() => getMakeStateFromFitments(fitments).customMake);
  const [modelDraft, setModelDraft] = useState('');
  const [catalogModels, setCatalogModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const effectiveMake = useMemo(() => {
    if (selectedMake === 'Other') return customMake.trim();
    return selectedMake.trim();
  }, [selectedMake, customMake]);

  useEffect(() => {
    if (!fitments.length) {
      setSelectedMake('');
      setCustomMake('');
      return;
    }

    const current = selectedMake === 'Other' ? customMake.trim() : selectedMake.trim();
    const hasActiveSelection = current && fitments.some(
      (entry) => entry.make.toLowerCase() === current.toLowerCase()
    );

    if (!hasActiveSelection) {
      const next = getMakeStateFromFitments(fitments);
      setSelectedMake(next.selectedMake);
      setCustomMake(next.customMake);
    }
  }, [fitmentsKey]);

  const selectActiveMake = (make) => {
    applyMakeToState(make, setSelectedMake, setCustomMake);
    setModelDraft('');
  };

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

  const addModel = (useNotSpecified = false) => {
    const make = effectiveMake;
    if (!make) return;

    const modelName = useNotSpecified ? NOT_SPECIFIED_MODEL : modelDraft.trim() || NOT_SPECIFIED_MODEL;

    const next = fitments.map((entry) => ({
      ...entry,
      models: [...entry.models],
    }));
    const idx = next.findIndex((entry) => entry.make.toLowerCase() === make.toLowerCase());
    if (idx >= 0) {
      if (!next[idx].models.some((model) => model.name.toLowerCase() === modelName.toLowerCase())) {
        next[idx].models.push({ name: modelName });
      }
    } else {
      next.push({ make, models: [{ name: modelName }] });
    }
    updateFitments(next);
    setModelDraft('');
  };

  const removeModel = (make, modelName) => {
    const next = fitments
      .map((entry) => {
        if (entry.make !== make) return entry;
        return { ...entry, models: entry.models.filter((model) => model.name !== modelName) };
      })
      .filter((entry) => entry.models.length > 0);
    updateFitments(next);
  };

  const filteredSuggestions = catalogModels.filter(
    (model) => !modelDraft || model.toLowerCase().includes(modelDraft.toLowerCase())
  );

  const modelCount = fitments.reduce((count, entry) => count + entry.models.length, 0);

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
          className={formSelectClass('vehicle')}
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
            className={`mt-2 ${formInputClass('vehicle')}`}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Supported models</label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={modelDraft}
            onChange={(e) => setModelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addModel(false);
              }
            }}
            list="vehicle-model-suggestions"
            placeholder={effectiveMake ? 'Type or select model (optional)' : 'Select make first'}
            disabled={!effectiveMake}
            className={`flex-1 min-w-[140px] ${formInputClass('vehicle')}`}
          />
          <button
            type="button"
            onClick={() => addModel(false)}
            disabled={!effectiveMake}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm font-medium disabled:opacity-50"
          >
            Add model
          </button>
          <button
            type="button"
            onClick={() => addModel(true)}
            disabled={!effectiveMake}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm disabled:opacity-50"
          >
            Not specified
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
              : 'Add every model this part fits (e.g. A1, A3, Q5). Stock quantity is shared — set it in the Quantity field above.'}
          </p>
        )}
      </div>

      {fitments.length > 0 && (
        <div className="space-y-2 rounded-lg border-2 border-emerald-200 bg-emerald-50/40 p-3">
          {fitments.map((entry) => (
            <div key={entry.make}>
              <button
                type="button"
                onClick={() => selectActiveMake(entry.make)}
                className={`text-sm font-semibold rounded-md px-1.5 py-0.5 -ml-1.5 transition-colors ${
                  effectiveMake.toLowerCase() === entry.make.toLowerCase()
                    ? 'text-emerald-800 bg-emerald-100'
                    : 'text-slate-800 hover:bg-emerald-100/70'
                }`}
              >
                {entry.make}
              </button>
              <div className="mt-1 flex flex-wrap gap-2">
                {entry.models.map((model) => (
                  <span
                    key={`${entry.make}-${model.name}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-asahi/10 text-asahi text-sm font-medium"
                  >
                    {model.name}
                    <button
                      type="button"
                      onClick={() => removeModel(entry.make, model.name)}
                      className="rounded-full hover:bg-asahi/20 p-0.5"
                      aria-label={`Remove ${entry.make} ${model.name}`}
                    >
                      <span className="text-xs leading-none">×</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          {modelCount > 1 && (
            <p className="text-xs text-emerald-800 pt-1 border-t border-emerald-200">
              {modelCount} compatible models — all share the same stock quantity.
            </p>
          )}
        </div>
      )}

      {required && !fitments.some((entry) => entry.make) && (
        <p className="text-xs text-slate-500">Select at least one vehicle make.</p>
      )}
    </div>
  );
}
