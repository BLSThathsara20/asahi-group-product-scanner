import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { formInputClass, formTextareaClass } from '../../lib/formFieldStyles';
import { ProductImage } from '../ui/ProductImage';
import { VehicleFitmentEditor } from '../VehicleFitmentEditor';
import { normalizeVehicleFitments, finalizeVehicleFitments } from '../../lib/vehicleFitments';
import { StoreLocationSelect } from '../StoreLocationSelect';
import { CategorySelect } from '../CategorySelect';
import { NavIcon } from '../icons/NavIcons';
import { sanitizeBarcodeInput, BARCODE_MAX_LENGTH } from '../../lib/barcodeUtils';
import { compressAndUploadImage } from '../../services/imageService';
import { getItemBarcodes } from '../../services/itemService';

export function EditItemForm({ item, onSave, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [form, setForm] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    store_location: item.store_location || '',
    vehicle_fitments: normalizeVehicleFitments(item),
    agl_number: item.agl_number || '',
    unit_price: item.unit_price ?? '',
    quantity: item.quantity ?? 1,
    photo: null,
    barcodes: [],
  });
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const photoPreviewUrl = useMemo(
    () => (form.photo ? URL.createObjectURL(form.photo) : null),
    [form.photo]
  );

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!item?.id) return;
    getItemBarcodes(item.id).then((barcodes) => {
      setForm((prev) => ({ ...prev, barcodes: barcodes || [] }));
    });
  }, [item?.id]);

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
      [name]:
        type === 'number'
          ? name === 'unit_price'
            ? value
            : parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleBarcodeChange = (index, value) => {
    setForm((prev) => {
      const next = [...(prev.barcodes || [''])];
      next[index] = value;
      return { ...prev, barcodes: next };
    });
  };

  const commitBarcodeValue = (index, rawValue) => {
    const clean = sanitizeBarcodeInput(rawValue);
    setForm((prev) => {
      const next = [...(prev.barcodes || [''])];
      next[index] = clean;
      return { ...prev, barcodes: next };
    });
  };

  const addBarcodeInput = () => {
    setForm((prev) => {
      const barcodes = prev.barcodes || [];
      return { ...prev, barcodes: [...barcodes, ''] };
    });
  };

  const removeBarcodeInput = (index) => {
    setForm((prev) => {
      const barcodes = prev.barcodes || [];
      const next = barcodes.filter((_, i) => i !== index);
      return { ...prev, barcodes: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = item.photo_url;
      if (form.photo) {
        const url = await compressAndUploadImage(form.photo);
        if (url) photoUrl = url;
      }
      const altBarcodes = (form.barcodes || []).map((b) => String(b || '').trim()).filter(Boolean);
      let unitPrice = null;
      if (form.unit_price !== '' && form.unit_price != null) {
        const parsed = Number(form.unit_price);
        if (Number.isFinite(parsed) && parsed >= 0) unitPrice = parsed;
      }
      const vehicle_fitments = finalizeVehicleFitments(form.vehicle_fitments);
      await onSave({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        category: form.category?.trim() || null,
        store_location: form.store_location?.trim() || null,
        vehicle_fitments,
        agl_number: form.agl_number?.trim() || null,
        unit_price: unitPrice,
        quantity: form.quantity || 1,
        photo_url: photoUrl,
        barcodes: altBarcodes,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField variant="name" label="Name" required>
        <Input name="name" variant="name" value={form.name} onChange={handleChange} required />
      </FormField>
      <FormField variant="description" label="Description">
        <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className={formTextareaClass('description')}
          />
      </FormField>
      <FormField variant="agl" label="AGL number">
        <Input name="agl_number" variant="agl" value={form.agl_number} onChange={handleChange} placeholder="AGL000" />
      </FormField>
      <FormField variant="price" label="Unit price £ (optional)">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">£</span>
          <input
            name="unit_price"
            type="number"
            min={0}
            step="0.01"
            value={form.unit_price}
            onChange={handleChange}
            placeholder="12.50"
            className={`pl-8 pr-4 ${formInputClass('price')}`}
          />
        </div>
      </FormField>
      <FormField variant="category" label="Category">
        <CategorySelect name="category" value={form.category} onChange={handleChange} placeholder="Select category" showLabel={false} />
      </FormField>
      <FormField variant="location" label="Store Location">
        <StoreLocationSelect name="store_location" value={form.store_location} onChange={handleChange} placeholder="Select location" showLabel={false} />
      </FormField>
      <FormField variant="vehicle" label="Vehicle compatibility">
        <VehicleFitmentEditor
          key={item.id}
          value={form.vehicle_fitments}
          onChange={(fitments) => setForm((prev) => ({ ...prev, vehicle_fitments: fitments }))}
        />
      </FormField>
      <FormField variant="quantity" label="Quantity" hint="Low-stock alert when below 2 units.">
        <Input name="quantity" type="number" min={0} variant="quantity" value={form.quantity} onChange={handleChange} />
      </FormField>

      <FormField variant="barcode" label="Barcodes" hint="Primary (QR ID) is fixed. Add extra barcodes for the same product.">
        <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 w-14 shrink-0">Primary</span>
            <code className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-700 truncate">
              {item.qr_id}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addBarcodeInput}
              className="shrink-0 p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              title="Add barcode"
              aria-label="Add barcode"
            >
              <NavIcon name="add" className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-slate-500">Add extra barcode</span>
          </div>
          {(form.barcodes || []).map((barcode, index) => (
            <div key={index} className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => removeBarcodeInput(index)}
                className="shrink-0 p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700"
                title="Remove"
                aria-label="Remove barcode"
              >
                <NavIcon name="close" className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-slate-500 w-12 shrink-0">Extra {index + 1}</span>
              <input
                value={barcode}
                onChange={(e) => handleBarcodeChange(index, e.target.value)}
                onBlur={(e) => commitBarcodeValue(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitBarcodeValue(index, e.target.value ?? barcode);
                  }
                }}
                maxLength={BARCODE_MAX_LENGTH * 2}
                placeholder="Barcode"
                className={`flex-1 min-w-0 text-sm ${formInputClass('barcode')}`}
              />
            </div>
          ))}
        </div>
      </FormField>

      <FormField variant="photo" label="Product Image" hint="One image only. Add or replace.">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
            {form.photo ? (
              <ProductImage
                src={photoPreviewUrl}
                alt="Preview"
                className="w-full h-full"
                iconClassName="w-8 h-8"
              />
            ) : item.photo_url ? (
              <ProductImage
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full"
                iconClassName="w-8 h-8"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <NavIcon name="package" className="w-8 h-8" />
              </div>
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
      </FormField>

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
        <Button type="submit" loading={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
