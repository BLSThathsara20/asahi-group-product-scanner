import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function CheckInForm({ onSubmit, onCancel }) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ notes: notes.trim() || 'Item returned to inventory' });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Check In Item</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit">Confirm Check In</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
