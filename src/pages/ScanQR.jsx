import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getItemByQrId } from '../services/itemService';
import { QRScanner } from '../components/QR/QRScanner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CheckOutForm } from '../components/Inventory/CheckOutForm';
import { updateItem, createTransaction } from '../services/itemService';

export function ScanQR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scannedItem, setScannedItem] = useState(null);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [showCheckOut, setShowCheckOut] = useState(false);

  const handleScan = async (qrId) => {
    setError('');
    setScannedItem(null);
    try {
      const item = await getItemByQrId(qrId.trim());
      setScannedItem(item);
    } catch {
      setError(`Item not found for QR: ${qrId}`);
    }
  };

  const handleCheckOut = async (data) => {
    await createTransaction({
      item_id: scannedItem.id,
      type: 'out',
      recipient_name: data.recipientName,
      purpose: data.purpose,
      responsible_person: data.responsiblePerson,
      vehicle_model: data.vehicleModel || null,
      notes: data.notes,
      performed_by: user?.id,
    });
    await updateItem(scannedItem.id, { status: 'out', last_used_date: new Date().toISOString(), last_used_by: user?.id });
    setShowCheckOut(false);
    setScannedItem((prev) => ({ ...prev, status: 'out' }));
  };

  const handleCheckIn = async () => {
    await createTransaction({
      item_id: scannedItem.id,
      type: 'in',
      notes: 'Item returned via QR scan',
      performed_by: user?.id,
    });
    await updateItem(scannedItem.id, { status: 'in_stock', last_used_date: new Date().toISOString(), last_used_by: user?.id });
    setScannedItem((prev) => ({ ...prev, status: 'in_stock' }));
  };

  const resetScan = () => {
    setScannedItem(null);
    setError('');
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

      {error && (
        <Card className="p-6 border-amber-200 bg-amber-50">
          <p className="text-amber-800">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={resetScan}>
            Scan Again
          </Button>
        </Card>
      )}

      {scannedItem && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Scanned Item</h3>
          <div className="flex gap-4">
            {scannedItem.photo_url ? (
              <img
                src={scannedItem.photo_url}
                alt={scannedItem.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-slate-200 flex items-center justify-center text-2xl">
                📦
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-slate-800">{scannedItem.name}</p>
              <p className="text-sm text-slate-500 font-mono">{scannedItem.qr_id}</p>
              <StatusBadge status={scannedItem.status} className="mt-2" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/inventory/${scannedItem.id}`)}>
              View Details
            </Button>
            {scannedItem.status === 'in_stock' && (
              <Button onClick={() => setShowCheckOut(true)}>Check Out</Button>
            )}
            {scannedItem.status === 'out' && (
              <Button onClick={handleCheckIn}>Check In</Button>
            )}
            <Button variant="secondary" onClick={resetScan}>
              Scan Another
            </Button>
          </div>
        </Card>
      )}

      {showCheckOut && scannedItem && (
        <CheckOutForm
          onSubmit={handleCheckOut}
          onCancel={() => setShowCheckOut(false)}
        />
      )}
    </div>
  );
}
