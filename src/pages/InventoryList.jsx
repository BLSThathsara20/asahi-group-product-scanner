import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { exportInventoryPDF, exportInventoryExcel } from '../services/reportService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function InventoryList() {
  const { items, loading, error } = useItems();
  const { success, error: notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  const filtered = items.filter((item) => {
    const matchSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.qr_id?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.store_location?.toLowerCase().includes(search.toLowerCase()) ||
      item.vehicle_model?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchLocation = !locationFilter || item.store_location?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchStatus && matchCategory && matchLocation;
  });

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      await exportInventoryPDF(filtered);
      success(`PDF exported (${filtered.length} items)`);
    } catch (err) {
      notifyError(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      await exportInventoryExcel(filtered);
      success(`Excel exported (${filtered.length} items)`);
    } catch (err) {
      notifyError(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Error: {error}</p>
        <p className="text-sm text-slate-500 mt-2">Check SUPABASE_SETUP.md for connection guide.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Inventory</h2>
        <Link to="/inventory/add">
          <Button>+ Add Item</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
            placeholder="Search by name, QR ID, category, location, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="out">Out</option>
              <option value="reserved">Reserved</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-40"
            />
          </div>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                className="text-sm py-1.5"
                onClick={handleExportPDF}
                disabled={exporting || filtered.length === 0}
              >
                {exporting === 'pdf' ? '...' : 'Export PDF'}
              </Button>
              <Button
                variant="outline"
                className="text-sm py-1.5"
                onClick={handleExportExcel}
                disabled={exporting || filtered.length === 0}
              >
                {exporting === 'excel' ? '...' : 'Export Excel'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Item</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">QR ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Location</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Qty</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/inventory/${item.id}`} className="flex items-center gap-3">
                      {item.photo_url ? (
                        <img
                          src={item.photo_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                          📦
                        </div>
                      )}
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-sm">{item.qr_id}</td>
                  <td className="px-4 py-3 text-slate-600">{item.category || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{item.store_location || '-'}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/inventory/${item.id}`}>
                      <Button variant="outline" className="text-sm py-1.5">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No items found. Add your first item to get started.
          </div>
        )}
      </Card>
    </div>
  );
}
