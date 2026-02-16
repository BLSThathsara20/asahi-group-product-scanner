import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function EditItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    store_location: item.store_location || '',
    vehicle_model: item.vehicle_model || '',
    model_name: item.model_name || '',
    sku_code: item.sku_code || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category: form.category?.trim() || null,
      store_location: form.store_location?.trim() || null,
      vehicle_model: form.vehicle_model?.trim() || null,
      model_name: form.model_name?.trim() || null,
      sku_code: form.sku_code?.trim() || null,
      quantity: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name *" name="name" value={form.name} onChange={handleChange} required />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none"
        />
      </div>
      <Input label="Category" name="category" value={form.category} onChange={handleChange} />
      <Input label="Store Location" name="store_location" value={form.store_location} onChange={handleChange} />
      <Input label="Vehicle Model" name="vehicle_model" value={form.vehicle_model} onChange={handleChange} />
      <Input label="Model Name" name="model_name" value={form.model_name} onChange={handleChange} />
      <Input label="SKU Code" name="sku_code" value={form.sku_code} onChange={handleChange} />
      <div className="flex gap-2 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
