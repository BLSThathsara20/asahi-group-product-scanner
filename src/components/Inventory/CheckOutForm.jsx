import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { VehicleModelSelect } from '../VehicleModelSelect';
import { getProfiles } from '../../services/userService';

export function CheckOutForm({ onSubmit, onCancel, item, currentUserId, currentUserDisplay }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({
    quantity: 1,
    recipientName: currentUserDisplay || '',
    recipientId: '',
    purpose: '',
    responsiblePerson: currentUserDisplay || '',
    responsiblePersonId: '',
    vehicleModel: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setForm((prev) => ({
        ...prev,
        quantity: 1,
        vehicleModel: item.vehicle_model || '',
      }));
      setErrors((prev) => ({ ...prev, quantity: '' }));
    }
  }, [item?.id]);

  useEffect(() => {
    getProfiles()
      .then((profiles) => {
        setUsers(profiles);
        const display = currentUserDisplay || 'Current user';
        const currentId = currentUserId || '';
        const match = profiles.find((p) => p.id === currentId);
        const defaultName = match ? match.full_name?.trim() || match.email : display;
        const defaultId = match ? currentId : profiles[0]?.id || '';
        const defaultRespName = match ? defaultName : profiles[0] ? (profiles[0].full_name?.trim() || profiles[0].email) : display;
        const defaultRespId = match ? currentId : profiles[0]?.id || '';
        setForm((prev) => ({
          ...prev,
          recipientName: defaultName,
          recipientId: defaultId,
          responsiblePerson: defaultRespName,
          responsiblePersonId: defaultRespId,
        }));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [currentUserId, currentUserDisplay]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: name === 'quantity' ? (parseInt(value, 10) || 0) : value };
    setForm(next);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRecipientSelect = (e) => {
    const id = e.target.value;
    const user = users.find((u) => u.id === id);
    const name = user ? user.full_name?.trim() || user.email : '';
    setForm((prev) => ({ ...prev, recipientId: id, recipientName: name }));
    setErrors((prev) => ({ ...prev, recipient: '' }));
  };

  const handleResponsibleSelect = (e) => {
    const id = e.target.value;
    const user = users.find((u) => u.id === id);
    const name = user ? user.full_name?.trim() || user.email : '';
    setForm((prev) => ({ ...prev, responsiblePersonId: id, responsiblePerson: name }));
  };

  const validate = () => {
    const next = {};
    const available = item?.quantity ?? 0;
    const qty = form.quantity;

    if (!qty || qty < 1) {
      next.quantity = 'Quantity must be at least 1';
    } else if (qty > available) {
      next.quantity = `Cannot exceed available quantity (${available})`;
    }
    if (!form.recipientName?.trim()) {
      next.recipient = 'Recipient is required';
    }
    if (!form.purpose?.trim()) {
      next.purpose = 'Purpose is required';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      quantity: form.quantity,
      recipientName: form.recipientName,
      purpose: form.purpose,
      responsiblePerson: form.responsiblePerson,
      vehicleModel: form.vehicleModel,
      notes: form.notes,
    });
  };

  const userDisplay = (u) => u.full_name?.trim() || u.email || 'Unknown';

  return (
    <Modal onBackdropClick={onCancel}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Check Out Item</h3>
        {item && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-medium text-slate-800">{item.name}</p>
            {item.category && (
              <p className="text-sm text-slate-500">{item.category}</p>
            )}
            <p className="text-sm text-slate-600 mt-1">
              Available: <span className="font-medium">{item.quantity ?? 0}</span>
            </p>
            {item.qr_id && (
              <p className="text-xs text-slate-400 font-mono mt-1">Code: {item.qr_id}</p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantity to check out *
            </label>
            <input
              type="number"
              name="quantity"
              min={1}
              max={item?.quantity ?? 999}
              value={form.quantity}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none ${
                errors.quantity ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recipient Name * {errors.recipient && <span className="text-red-600 font-normal">({errors.recipient})</span>}
            </label>
            {loadingUsers ? (
              <div className="px-4 py-2 border border-slate-300 rounded-lg text-slate-500 text-sm">
                Loading users...
              </div>
            ) : users.length > 0 ? (
              <select
                name="recipientId"
                value={form.recipientId}
                onChange={handleRecipientSelect}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
              >
                <option value="">Select recipient</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {userDisplay(u)}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                name="recipientName"
                value={form.recipientName}
                onChange={handleChange}
                placeholder="Who received this item?"
                required
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Purpose / Reason *</label>
            <Input
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="What is it for? (e.g. Car repair job #123)"
                error={errors.purpose}
                required
              />
            {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
          </div>
          <VehicleModelSelect
            label="Vehicle Model"
            name="vehicleModel"
            value={form.vehicleModel}
            onChange={handleChange}
            placeholder="Select vehicle make"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Responsible Person
            </label>
            {loadingUsers ? (
              <div className="px-4 py-2 border border-slate-300 rounded-lg text-slate-500 text-sm">
                Loading...
              </div>
            ) : users.length > 0 ? (
              <select
                name="responsiblePersonId"
                value={form.responsiblePersonId}
                onChange={handleResponsibleSelect}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 focus:border-asahi outline-none"
              >
                <option value="">Select responsible person</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {userDisplay(u)}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                name="responsiblePerson"
                value={form.responsiblePerson}
                onChange={handleChange}
                placeholder="Staff member responsible"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none"
                placeholder="Optional notes"
              />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Confirm Check Out</Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </Modal>
  );
}
