import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function CheckOutForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    recipientName: '',
    purpose: '',
    responsiblePerson: '',
    vehicleModel: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Check Out Item</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Recipient Name"
          name="recipientName"
          value={form.recipientName}
          onChange={handleChange}
          placeholder="Who received this item?"
        />
        <Input
          label="Purpose"
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          placeholder="What is it for? (e.g. Car repair job #123)"
        />
        <Input
          label="Vehicle Model"
          name="vehicleModel"
          value={form.vehicleModel}
          onChange={handleChange}
          placeholder="e.g. Toyota Camry 2020"
        />
        <Input
          label="Responsible Person"
          name="responsiblePerson"
          value={form.responsiblePerson}
          onChange={handleChange}
          placeholder="Staff member responsible"
        />
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
  );
}
