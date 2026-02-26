import { useState } from 'react';

const VEHICLE_BRANDS = [
  'AUDI',
  'BMW',
  'FIAT',
  'HONDA',
  'Kia',
  'LEXUS',
  'MAZDA',
  'MERCEDES-BENZ',
  'NISSAN',
  'SUZUKI',
  'TOYOTA',
  'VW',
];

export function VehicleModelSelect({ value, onChange, label = 'Vehicle Model (optional)', name = 'vehicle_model', placeholder }) {
  const isInList = value && VEHICLE_BRANDS.includes(value);
  const [otherSelected, setOtherSelected] = useState(false);
  const showOtherInput = otherSelected || (value && !isInList);
  const selectValue = isInList ? value : (showOtherInput ? 'Other' : '');

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      )}
      <select
        name={name}
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'Other') {
            setOtherSelected(true);
            onChange({ target: { name, value: value && !isInList ? value : '' } });
          } else {
            setOtherSelected(false);
            onChange({ target: { name, value: v } });
          }
        }}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
      >
        <option value="">{placeholder || 'Select vehicle make'}</option>
        {VEHICLE_BRANDS.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showOtherInput && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange({ target: { name, value: e.target.value } })}
          placeholder="Enter vehicle model"
          className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
        />
      )}
    </div>
  );
}
