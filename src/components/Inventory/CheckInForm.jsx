import { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { listFitmentStockOptions } from '../../lib/vehicleFitments';

export function CheckInForm({ onSubmit, onCancel, item }) {
  const stockOptions = useMemo(() => listFitmentStockOptions(item), [item]);
  const [quantity, setQuantity] = useState(1);
  const [vehicleFitmentKey, setVehicleFitmentKey] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = useMemo(
    () => stockOptions.find((option) => option.key === vehicleFitmentKey) || null,
    [stockOptions, vehicleFitmentKey]
  );

  useEffect(() => {
    if (!item) return;
    const options = listFitmentStockOptions(item);
    setVehicleFitmentKey(options[0]?.key || '');
    setQuantity(1);
  }, [item?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10) || 0;
    const nextErrors = {};
    if (qty < 1) {
      nextErrors.quantity = 'Quantity must be at least 1';
    }
    if (stockOptions.length > 0 && !vehicleFitmentKey) {
      nextErrors.vehicle = 'Select a vehicle model';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (submitting) return;
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({
        quantity: qty,
        vehicleFitmentKey,
        vehicleModel: selectedOption?.label || '',
        notes: notes.trim() || 'Item returned to spare parts',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Check In Item</h3>
      {item && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="font-medium text-slate-800">{item.name}</p>
          {item.category && (
            <p className="text-sm text-slate-500">{item.category}</p>
          )}
          <p className="text-sm text-slate-600 mt-1">
            Current quantity: <span className="font-medium">{item.quantity ?? 0}</span>
          </p>
          {item.qr_id && (
            <p className="text-xs text-slate-400 font-mono mt-1">Code: {item.qr_id}</p>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {stockOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Return to vehicle model *
            </label>
            <select
              value={vehicleFitmentKey}
              onChange={(e) => {
                setVehicleFitmentKey(e.target.value);
                if (errors.vehicle) setErrors((prev) => ({ ...prev, vehicle: '' }));
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none ${
                errors.vehicle ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">Select model</option>
              {stockOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label} ({option.quantity} in stock)
                </option>
              ))}
            </select>
            {errors.vehicle && (
              <p className="mt-1 text-sm text-red-600">{errors.vehicle}</p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Quantity to check in *
          </label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none ${
              errors.quantity ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none"
            placeholder="Optional: e.g. Returned from job #123"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={submitting} disabled={submitting}>
            {submitting ? 'Checking in…' : 'Confirm Check In'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
