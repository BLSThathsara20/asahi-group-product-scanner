import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getItemByQrId } from '../services/itemService';
import { QRScanner } from '../components/QR/QRScanner';
import { Card } from '../components/ui/Card';

export function ScanQR() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cameraError, setCameraError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const barcode = searchParams.get('barcode');
    if (!barcode?.trim() || redirecting) return;
    setRedirecting(true);
    const lookup = async () => {
      try {
        const item = await getItemByQrId(barcode.trim());
        if (item.status === 'in_stock') {
          navigate(`/inventory/${item.id}?checkout=1`, { replace: true });
        } else if (item.status === 'out') {
          navigate(`/inventory/${item.id}?checkin=1`, { replace: true });
        } else {
          navigate(`/inventory/${item.id}`, { replace: true });
        }
      } catch {
        navigate(`/inventory/add?barcode=${encodeURIComponent(barcode.trim())}`, { replace: true });
      }
    };
    lookup();
  }, [searchParams, navigate, redirecting]);

  const extractBarcode = (value) => {
    const trimmed = value.trim();
    try {
      const url = new URL(trimmed);
      const barcode = url.searchParams.get('barcode');
      return barcode || trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleScan = async (qrId) => {
    const trimmed = extractBarcode(qrId);
    try {
      const item = await getItemByQrId(trimmed);
      if (item.status === 'in_stock') {
        navigate(`/inventory/${item.id}?checkout=1`);
      } else if (item.status === 'out') {
        navigate(`/inventory/${item.id}?checkin=1`);
      } else {
        navigate(`/inventory/${item.id}`);
      }
    } catch {
      navigate(`/inventory/add?barcode=${encodeURIComponent(trimmed)}`);
    }
  };

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <div className="animate-pulse text-slate-500">Opening product...</div>
      </div>
    );
  }

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
