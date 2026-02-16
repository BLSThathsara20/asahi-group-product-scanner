import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { NavIcon } from '../icons/NavIcons';
import { compressAndUploadImage } from '../../services/imageService';

export function EditItemForm({ item, onSave, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }
    return () => {
      if (showCamera) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera]);

  const startCamera = async () => {
    setCameraError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      setCameraError(err.message || 'Camera access denied');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCameraError('');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setForm((prev) => ({ ...prev, photo: file }));
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
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
            <Button
              type="button"
              variant="outline"
              onClick={startCamera}
              className="text-sm inline-flex items-center gap-1.5"
            >
              <NavIcon name="camera" className="w-4 h-4" />
              {item.photo_url || form.photo ? 'Replace image' : 'Add image'}
            </Button>
          </div>
        </div>
      </div>

      {showCamera &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100] bg-black/80" onClick={stopCamera} />
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24 pb-20 overflow-y-auto">
              <div className="bg-slate-900 rounded-xl overflow-hidden max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-cover"
                />
                {cameraError && (
                  <p className="p-4 text-amber-400 text-sm">{cameraError}</p>
                )}
                <div className="flex gap-2 p-4 bg-slate-800">
                  <Button onClick={capturePhoto} className="flex-1">
                    Capture
                  </Button>
                  <Button variant="secondary" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
