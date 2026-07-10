import { useState } from 'react';

export const STORE_LOCATIONS = [
  '1st row - left',
  '1st row - middle',
  '1st row - right',
  '2nd row - left',
  '2nd row - middle',
  '2nd row - right',
  '3rd row - left',
  '3rd row - middle',
  '3rd row - right',
  '4th row - left',
  '4th row - middle',
  '4th row - right',
  'Not in rack',
];

import { formInputClass, formSelectClass } from '../lib/formFieldStyles';

export function StoreLocationSelect({ value, onChange, label = 'Store Location', name = 'store_location', placeholder, variant = 'location', showLabel = true }) {
  const isInList = value && STORE_LOCATIONS.includes(value);
  const [otherSelected, setOtherSelected] = useState(false);
  const showOtherInput = otherSelected || (value && !isInList);
  const selectValue = isInList ? value : (showOtherInput ? 'Other' : '');

  return (
    <div>
      {showLabel && label && (
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
        className={formSelectClass(variant)}
      >
        <option value="">{placeholder || 'Select location'}</option>
        {STORE_LOCATIONS.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showOtherInput && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange({ target: { name, value: e.target.value } })}
          placeholder="Enter location"
          className={`mt-2 ${formInputClass(variant)}`}
        />
      )}
    </div>
  );
}
