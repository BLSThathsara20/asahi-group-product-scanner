import { useState, useEffect } from 'react';
import { getCategories, buildCategoryOptions } from '../services/categoryService';

export function CategorySelect({ value, onChange, label = 'Category', name = 'category', placeholder }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const options = buildCategoryOptions(categories);
  const isInList = value && options.some((o) => o.value === value);
  const [otherSelected, setOtherSelected] = useState(false);
  const showOtherInput = otherSelected || (value && !isInList);
  const selectValue = isInList ? value : (showOtherInput ? 'Other' : '');

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

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
        <option value="">{placeholder || 'Select category'}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.value}>{opt.label}</option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showOtherInput && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange({ target: { name, value: e.target.value } })}
          placeholder="Enter category"
          className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
        />
      )}
      {loading && (
        <p className="mt-1 text-xs text-slate-500">Loading categories...</p>
      )}
    </div>
  );
}
