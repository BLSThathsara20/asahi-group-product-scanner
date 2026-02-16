import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getItemById, getTransactions, updateItem, createTransaction } from '../services/itemService';
import { getProfilesByIds } from '../services/userService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { QRCodeDisplay, BarcodeDisplay } from '../components/QR';
import { CheckOutForm } from '../components/Inventory/CheckOutForm';

export function ItemDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: notifySuccess } = useNotification();
  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [performerNames, setPerformerNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCheckOut, setShowCheckOut] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [itemData, txData] = await Promise.all([
        getItemById(id),
        getTransactions(id),
      ]);
      setItem(itemData);
      setTransactions(txData);
      const ids = new Set([
        itemData?.added_by,
        itemData?.last_used_by,
        ...txData.map((t) => t.performed_by).filter(Boolean),
      ]);
      if (ids.size > 0) {
        const names = await getProfilesByIds([...ids]);
        setPerformerNames(names);
      }
    } catch (err) {
      console.error(err);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (item && searchParams.get('checkout') === '1' && item.status === 'in_stock') {
      setShowCheckOut(true);
    }
  }, [item, searchParams]);

  const handleCheckOut = async (data) => {
    await createTransaction({
      item_id: id,
      type: 'out',
      recipient_name: data.recipientName,
      purpose: data.purpose,
      responsible_person: data.responsiblePerson,
      vehicle_model: data.vehicleModel || null,
      notes: data.notes,
      performed_by: user?.id,
    });
    await updateItem(id, { status: 'out', last_used_date: new Date().toISOString(), last_used_by: user?.id });
    notifySuccess('Item checked out');
    setShowCheckOut(false);
    load();
  };

  const handleCheckIn = async () => {
    await createTransaction({
      item_id: id,
      type: 'in',
      notes: 'Item returned to inventory',
      performed_by: user?.id,
    });
    await updateItem(id, { status: 'in_stock', last_used_date: new Date().toISOString(), last_used_by: user?.id });
    notifySuccess('Item checked in');
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <Card className="p-6">
        <p className="text-slate-600">Item not found.</p>
        <Button className="mt-4" onClick={() => navigate('/inventory')}>
          Back to Inventory
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 md:col-span-2">
          <div className="flex gap-6">
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-32 h-32 rounded-xl object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-slate-200 flex items-center justify-center text-4xl">
                📦
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800">{item.name}</h2>
              <p className="text-slate-600 mt-1">{item.description || 'No description'}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <StatusBadge status={item.status} />
                <span className="text-sm text-slate-500">Qty: {item.quantity}</span>
                {item.category && (
                  <span className="text-sm text-slate-500">• {item.category}</span>
                )}
                {item.store_location && (
                  <span className="text-sm text-slate-500">• 📍 {item.store_location}</span>
                )}
                {item.vehicle_model && (
                  <span className="text-sm text-slate-500">• 🚗 {item.vehicle_model}</span>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-2 space-y-1">
                {item.added_date && (
                  <p>Added: {new Date(item.added_date).toLocaleDateString()}
                    {item.added_by && performerNames[item.added_by] && (
                      <span className="ml-1">by {performerNames[item.added_by]}</span>
                    )}
                  </p>
                )}
                {item.last_used_date && (
                  <p>Last used: {new Date(item.last_used_date).toLocaleDateString()}
                    {item.last_used_by && performerNames[item.last_used_by] && (
                      <span className="ml-1">by {performerNames[item.last_used_by]}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {item.status === 'in_stock' && (
                  <Button onClick={() => setShowCheckOut(true)}>Check Out</Button>
                )}
                {item.status === 'out' && (
                  <Button onClick={handleCheckIn}>Check In</Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">QR Code</h3>
          <QRCodeDisplay qrId={item.qr_id} itemName={item.name} />
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Barcode</h3>
          <BarcodeDisplay barcodeId={item.qr_id} itemName={item.name} />
        </Card>
      </div>

      {showCheckOut && (
        <CheckOutForm
          onSubmit={handleCheckOut}
          onCancel={() => setShowCheckOut(false)}
        />
      )}

      <Card>
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Transaction History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    tx.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tx.type === 'in' ? 'In' : 'Out'}
                </span>
                <p className="mt-1 text-slate-800 font-medium">
                  {tx.type === 'out' && tx.recipient_name && `To: ${tx.recipient_name}`}
                  {tx.type === 'out' && tx.purpose && ` • ${tx.purpose}`}
                  {tx.type === 'out' && tx.vehicle_model && ` • Vehicle: ${tx.vehicle_model}`}
                  {tx.type === 'in' && tx.notes}
                </p>
                {tx.responsible_person && (
                  <p className="text-sm text-slate-500">Responsible: {tx.responsible_person}</p>
                )}
                {tx.performed_by && performerNames[tx.performed_by] && (
                  <p className="text-sm text-slate-500">
                    {tx.type === 'out' ? 'Out recorded by' : 'In recorded by'}: {performerNames[tx.performed_by]}
                  </p>
                )}
              </div>
              <span className="text-sm text-slate-500 whitespace-nowrap">
                {new Date(tx.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-500">No transactions yet</div>
          )}
        </div>
      </Card>
    </div>
  );
}
