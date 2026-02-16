import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateQrId } from '../lib/utils';
import { createItem, createTransaction, checkQrIdExists } from '../services/itemService';
import { compressAndUploadImage } from '../services/imageService';
import { useNotification } from '../context/NotificationContext';
import { QRScanner } from '../components/QR/QRScanner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function AddItem() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 1,
    store_location: '',
    vehicle_model: '',
    added_date: new Date().toISOString().slice(0, 10),
    barcode: '',
    photo: null,
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleDateChange = (e) => {
    setForm((prev) => ({ ...prev, added_date: e.target.value || new Date().toISOString().slice(0, 10) }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, photo: file }));
  };

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
      notifyError('Could not open camera');
    }
  };

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
    return () => {
      if (!showCamera) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera]);

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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Item name is required');
      return;
    }
    setLoading(true);
    try {
      const qrId = (form.barcode || '').trim() || generateQrId();

      const exists = await checkQrIdExists(qrId);
      if (exists) {
        setError(`This barcode/QR code is already registered: ${qrId}. Use a different code or find the existing item.`);
        notifyError('Barcode/QR already exists in inventory');
        setLoading(false);
        return;
      }

      let photoUrl = null;
      if (form.photo) {
        photoUrl = await compressAndUploadImage(form.photo);
      }

      const item = await createItem({
        qr_id: qrId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        quantity: form.quantity || 1,
        store_location: form.store_location.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        added_date: form.added_date ? new Date(form.added_date).toISOString() : null,
        photo_url: photoUrl,
        status: 'in_stock',
        added_by: user?.id,
      });
      await createTransaction({
        item_id: item.id,
        type: 'in',
        notes: 'Item registered in inventory',
        performed_by: user?.id,
      });
      success('Item added to inventory');
      navigate(`/inventory/${item.id}`);
    } catch (err) {
      const msg = err.message || 'Failed to add item';
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addedByDisplay = profile?.full_name || user?.email || 'Unknown';

  return (
    <div className="w-full max-w-xl min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Add New Item</h2>
        <p className="text-sm text-slate-500">
          Adding as: <span className="font-medium text-slate-700">{addedByDisplay}</span>
        </p>
      </div>

      <Card className="p-4 sm:p-6 overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <Input
            label="Item Name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Car Audio Player"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Barcode / QR Code (optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Use product&apos;s existing barcode or QR. Leave empty to generate unique ID. Duplicates are blocked.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Scan or enter barcode/QR code"
                className="sm:flex-1 min-w-0"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
                className="shrink-0"
              >
                {showBarcodeScanner ? 'Hide' : 'Scan'}
              </Button>
            </div>
            {showBarcodeScanner && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <QRScanner
                  scannerId="add-item-barcode-scanner"
                  onScan={(code) => {
                    setForm((prev) => ({ ...prev, barcode: code }));
                    setShowBarcodeScanner(false);
                  }}
                  onError={(msg) => notifyError(msg)}
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional details..."
              rows={3}
              className="w-full min-w-0 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
            />
          </div>

          <Input
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Audio, Parts"
          />

          <Input
            label="Store Location"
            name="store_location"
            value={form.store_location}
            onChange={handleChange}
            placeholder="e.g. Shelf A, Warehouse 1"
          />

          <Input
            label="Vehicle Model (optional)"
            name="vehicle_model"
            value={form.vehicle_model}
            onChange={handleChange}
            placeholder="e.g. Toyota Camry 2020"
          />

          <Input
            label="Added Date"
            name="added_date"
            type="date"
            value={form.added_date}
            onChange={handleDateChange}
          />

          <Input
            label="Quantity"
            name="quantity"
            type="number"
            min={1}
            value={form.quantity}
            onChange={handleChange}
          />

          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Image</label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <Button
                type="button"
                onClick={startCamera}
                className="ring-2 ring-asahi ring-offset-2 p-3"
                title="Open Camera"
              >
                <span className="text-2xl">📷</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="p-3"
                title="Choose from Library"
              >
                <span className="text-2xl">📁</span>
              </Button>
            </div>
            {form.photo && (
              <div className="mt-3 flex items-center gap-3 min-w-0">
                <img
                  src={URL.createObjectURL(form.photo)}
                  alt="Preview"
                  className="w-20 h-20 shrink-0 rounded-lg object-cover border border-slate-200"
                />
                <p className="text-sm text-slate-500 truncate">Chosen: {form.photo.name}</p>
              </div>
            )}
          </div>

          {showCamera && (
            <>
              <div className="fixed inset-0 z-50 bg-black/80" onClick={stopCamera} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            </>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Adding...' : 'Add to Inventory'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
