import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getItemByQrId } from '../services/itemService';
import { QRScanner } from '../components/QR/QRScanner';
import { Card } from '../components/ui/Card';

export function ScanQR() {
  const navigate = useNavigate();
  const [cameraError, setCameraError] = useState('');

  const handleScan = async (qrId) => {
    const trimmed = qrId.trim();
    try {
      const item = await getItemByQrId(trimmed);
      if (item.status === 'in_stock') {
        navigate(`/inventory/${item.id}?checkout=1`);
      } else {
        navigate(`/inventory/${item.id}`);
      }
    } catch {
      navigate(`/inventory/add?barcode=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800">Scan QR Code</h2>

      <Card className="p-6">
        <QRScanner onScan={handleScan} onError={setCameraError} />
        {cameraError && (
          <p className="mt-4 text-amber-600 text-sm">
            Camera: {cameraError}. Ensure you're on HTTPS or localhost.
          </p>
        )}
      </Card>

      <p className="text-sm text-slate-500 text-center">
        Scan a QR code — existing items open for checkout, new items open Add form.
      </p>
    </div>
  );
}
