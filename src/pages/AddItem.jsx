import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import { parseOcrForProduct } from '../lib/ocrParse';
import { createItem, createTransaction, checkQrIdExists, getNextItemCode } from '../services/itemService';
import { compressAndUploadImage } from '../services/imageService';
import { useNotification } from '../context/NotificationContext';
import { QRScanner } from '../components/QR/QRScanner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { NavIcon } from '../components/icons/NavIcons';

export function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    model_name: '',
    sku_code: '',
    added_date: new Date().toISOString().slice(0, 10),
    barcode: '',
    photo: null,
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showOcrCamera, setShowOcrCamera] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeChecking, setBarcodeChecking] = useState(false);
  const videoRef = useRef(null);
  const ocrVideoRef = useRef(null);
  const streamRef = useRef(null);
  const ocrStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
    if (name === 'barcode') setBarcodeError('');
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

  const startOcrCamera = async () => {
    setCameraError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      ocrStreamRef.current = stream;
      setShowOcrCamera(true);
    } catch (err) {
      setCameraError(err.message || 'Camera access denied');
      notifyError('Could not open camera');
    }
  };

  const stopOcrCamera = () => {
    ocrStreamRef.current?.getTracks().forEach((t) => t.stop());
    ocrStreamRef.current = null;
    setShowOcrCamera(false);
    setCameraError('');
  };

  const captureAndScanOcr = async () => {
    const video = ocrVideoRef.current;
    if (!video || !video.videoWidth) return;
    setOcrProcessing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      );
      if (!blob) throw new Error('Failed to capture image');
      stopOcrCamera();
      const worker = await createWorker('eng');
      const { data } = await worker.recognize(URL.createObjectURL(blob));
      await worker.terminate();
      const parsed = parseOcrForProduct(data.text);
      setForm((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        model_name: parsed.model_name || prev.model_name,
        sku_code: parsed.sku_code || prev.sku_code,
      }));
      success(parsed.name || parsed.model_name || parsed.sku_code ? 'Text extracted. Review and edit if needed.' : 'No product text found. Try a clearer photo.');
    } catch (err) {
      notifyError(err.message || 'OCR failed');
    } finally {
      setOcrProcessing(false);
    }
  };

  useEffect(() => {
    const barcode = searchParams.get('barcode');
    if (barcode) {
      try {
        setForm((prev) => ({ ...prev, barcode: decodeURIComponent(barcode) }));
      } catch {
        setForm((prev) => ({ ...prev, barcode }));
      }
    }
  }, [searchParams]);

  // Validate barcode when scanned or entered - check if already registered
  useEffect(() => {
    const barcode = (form.barcode || '').trim();
    if (!barcode) {
      setBarcodeError('');
      return;
    }
    const timer = setTimeout(async () => {
      setBarcodeChecking(true);
      setBarcodeError('');
      try {
        const exists = await checkQrIdExists(barcode);
        setBarcodeError(exists ? 'This barcode/QR code is already registered. Use a different code or find the existing item.' : '');
      } catch {
        setBarcodeError('');
      } finally {
        setBarcodeChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.barcode]);

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

  useEffect(() => {
    if (showOcrCamera && ocrStreamRef.current && ocrVideoRef.current) {
      const video = ocrVideoRef.current;
      video.srcObject = ocrStreamRef.current;
      video.play().catch(() => {});
    }
    return () => {
      if (showOcrCamera) {
        ocrStreamRef.current?.getTracks().forEach((t) => t.stop());
        ocrStreamRef.current = null;
      }
    };
  }, [showOcrCamera]);

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
    if (barcodeError) {
      setError('Fix the barcode error before adding.');
      return;
    }
    setLoading(true);
    try {
      const qrId = (form.barcode || '').trim() || (await getNextItemCode());

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
        quantity: 1,
        store_location: form.store_location.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        model_name: form.model_name?.trim() || null,
        sku_code: form.sku_code?.trim() || null,
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
      success('Item added. Download QR code PDF from the item page.');
      // Brief delay before navigate to allow DB read-after-write consistency
      await new Promise((r) => setTimeout(r, 300));
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={startOcrCamera}
                className="shrink-0 p-2"
                title="Scan label to auto-fill name, model, SKU"
              >
                <NavIcon name="camera" className="w-5 h-5" />
              </Button>
              <Input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Car Audio Player"
                className="flex-1 min-w-0"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Click camera to scan product label and auto-fill</p>
          </div>

          <Input
            label="Model Name"
            name="model_name"
            value={form.model_name}
            onChange={handleChange}
            placeholder="e.g. XYZ-2000"
          />

          <Input
            label="SKU Code"
            name="sku_code"
            value={form.sku_code}
            onChange={handleChange}
            placeholder="e.g. SKU-12345"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product Barcode / QR Code (optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Use product&apos;s existing barcode, scan, or click Auto Generate for a unique code. Duplicates are blocked.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="sm:flex-1 min-w-0">
                <Input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder="Scan or enter barcode/QR code"
                  error={barcodeError}
                  className={barcodeChecking ? 'opacity-70' : ''}
                />
                {barcodeChecking && (
                  <p className="mt-1 text-xs text-slate-500">Checking if barcode exists...</p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    const code = await getNextItemCode();
                    setForm((prev) => ({ ...prev, barcode: code }));
                    setBarcodeError('');
                  } catch (err) {
                    notifyError(err.message || 'Failed to generate code');
                  }
                }}
                className="shrink-0"
              >
                Auto Generate
              </Button>
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
                    setBarcodeError('');
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
            value={1}
            disabled
            title="Each item has quantity 1"
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
                <NavIcon name="camera" className="w-6 h-6" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="p-3"
                title="Choose from Library"
              >
                <NavIcon name="folder" className="w-6 h-6" />
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

          {showOcrCamera &&
            createPortal(
              <>
                <div className="fixed inset-0 z-[100] bg-black/80" onClick={stopOcrCamera} />
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24 pb-20 overflow-y-auto">
                  <div className="bg-slate-900 rounded-xl overflow-hidden max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                    <p className="p-3 text-sm text-slate-300 text-center">
                      Point camera at product label (name, model, SKU)
                    </p>
                    <video
                      ref={ocrVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full aspect-video object-cover"
                    />
                    {cameraError && (
                      <p className="p-4 text-amber-400 text-sm">{cameraError}</p>
                    )}
                    <div className="flex gap-2 p-4 bg-slate-800">
                      <Button onClick={captureAndScanOcr} className="flex-1" disabled={ocrProcessing}>
                        {ocrProcessing ? 'Scanning...' : 'Capture & Scan'}
                      </Button>
                      <Button variant="secondary" onClick={stopOcrCamera} disabled={ocrProcessing}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </>,
              document.body
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
