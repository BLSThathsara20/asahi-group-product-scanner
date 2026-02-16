import { useState, useRef } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { NavIcon } from '../icons/NavIcons';
import { compressAndUploadImage } from '../../services/imageService';

export function EditItemForm({ item, onSave, onCancel }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    store_location: item.store_location || '',
    vehicle_model: item.vehicle_model || '',
    model_name: item.model_name || '',
    sku_code: item.sku_code || '',
    quantity: item.quantity ?? 1,
    photo: null,
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, photo: file }));
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let photoUrl = item.photo_url;
      if (form.photo) {
        const url = await compressAndUploadImage(form.photo);
        if (url) photoUrl = url;
      }
      onSave({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        category: form.category?.trim() || null,
        store_location: form.store_location?.trim() || null,
        vehicle_model: form.vehicle_model?.trim() || null,
        model_name: form.model_name?.trim() || null,
        sku_code: form.sku_code?.trim() || null,
        quantity: form.quantity || 1,
        photo_url: photoUrl,
      });
    } finally {
      setUploading(false);
    }
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
      <Input label="Quantity" name="quantity" type="number" min={1} value={form.quantity} onChange={handleChange} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
        <p className="text-xs text-slate-500 mb-2">One image only. Add or replace.</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
            {form.photo ? (
              <img
                src={URL.createObjectURL(form.photo)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <NavIcon name="package" className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm inline-flex items-center gap-1.5"
            >
              <NavIcon name="folder" className="w-4 h-4" />
              {item.photo_url || form.photo ? 'Replace image' : 'Add image'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
