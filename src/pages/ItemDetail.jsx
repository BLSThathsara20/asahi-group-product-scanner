import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getItemById, getTransactions, updateItem, createTransaction } from '../services/itemService';
import { getProfilesByIds } from '../services/userService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { QRCodeDisplay, BarcodeDisplay } from '../components/QR';
import { NavIcon } from '../components/icons/NavIcons';
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
  const hasRetried = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const [itemData, txData] = await Promise.all([
        getItemById(id),
        getTransactions(id),
      ]);
      setItem(itemData);
      setTransactions(txData);
      if (itemData) {
        const ids = [
          ...new Set([
            itemData.added_by,
            itemData.last_used_by,
            ...txData.map((t) => t.performed_by),
          ]),
        ].filter((id) => id != null);
        if (ids.length > 0) {
          const names = await getProfilesByIds(ids);
          setPerformerNames(names);
        }
      }
    } catch (err) {
      console.error(err);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    hasRetried.current = false;
    load();
  }, [id]);

  // Retry once after 2s if item not found (handles read-after-write delay after add)
  useEffect(() => {
    if (!id || loading || item || hasRetried.current) return;
    const timer = setTimeout(() => {
      hasRetried.current = true;
      load();
    }, 2000);
    return () => clearTimeout(timer);
  }, [id, loading, item]);

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

      {/* Section 1: Item overview - ordered for clarity */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Photo - left on desktop, top on mobile */}
          <div className="shrink-0">
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full sm:w-36 h-36 rounded-xl object-cover"
              />
            ) : (
              <div className="w-full sm:w-36 h-36 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                <NavIcon name="package" className="w-16 h-16" />
              </div>
            )}
          </div>
          {/* Details - right on desktop, below photo on mobile */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{item.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={item.status} />
                <span className="text-sm text-slate-500">Qty: {item.quantity}</span>
              </div>
            </div>
            <p className="text-slate-600 text-sm">{item.description || 'No description'}</p>
            {/* Key details - clean list */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {item.category && (
                <>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="text-slate-800">{item.category}</dd>
                </>
              )}
              {item.store_location && (
                <>
                  <dt className="text-slate-500 flex items-center gap-1">
                    <NavIcon name="mapPin" className="w-3.5 h-3.5" /> Location
                  </dt>
                  <dd className="text-slate-800">{item.store_location}</dd>
                </>
              )}
              {item.vehicle_model && (
                <>
                  <dt className="text-slate-500 flex items-center gap-1">
                    <NavIcon name="car" className="w-3.5 h-3.5" /> Vehicle
                  </dt>
                  <dd className="text-slate-800">{item.vehicle_model}</dd>
                </>
              )}
              {item.model_name && (
                <>
                  <dt className="text-slate-500">Model</dt>
                  <dd className="text-slate-800">{item.model_name}</dd>
                </>
              )}
              {item.sku_code && (
                <>
                  <dt className="text-slate-500">SKU</dt>
                  <dd className="text-slate-800 font-mono">{item.sku_code}</dd>
                </>
              )}
            </dl>
            {/* Metadata */}
            <div className="text-sm text-slate-500 space-y-1 pt-2 border-t border-slate-100">
              {item.added_date && (
                <p>
                  Added {new Date(item.added_date).toLocaleDateString()}
                  {item.added_by && performerNames[item.added_by] && (
                    <span> by {performerNames[item.added_by]}</span>
                  )}
                </p>
              )}
              {item.last_used_date && (
                <p>
                  Last used {new Date(item.last_used_date).toLocaleDateString()}
                  {item.last_used_by && performerNames[item.last_used_by] && (
                    <span> by {performerNames[item.last_used_by]}</span>
                  )}
                </p>
              )}
            </div>
            {/* Actions */}
            <div className="flex gap-2 pt-2">
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

      {/* Section 2: QR & Barcode - grouped together */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
