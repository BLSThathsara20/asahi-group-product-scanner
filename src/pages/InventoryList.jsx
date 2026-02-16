import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useAuth } from '../context/AuthContext';
import { exportInventoryPDF, exportInventoryExcel } from '../services/reportService';
import { updateItem, createTransaction } from '../services/itemService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { CheckOutForm, CheckInForm } from '../components/Inventory';
import { Modal } from '../components/ui/Modal';
import { NavIcon } from '../components/icons/NavIcons';

export function InventoryList() {
  const { items, loading, error, refetch } = useItems();
  const { user, profile } = useAuth();
  const { success, error: notifyError } = useNotification();
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [checkinItem, setCheckinItem] = useState(null);
  const [checkinTargetStatus, setCheckinTargetStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = items.filter((item) => {
    const matchSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.qr_id?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.store_location?.toLowerCase().includes(search.toLowerCase()) ||
      item.vehicle_model?.toLowerCase().includes(search.toLowerCase()) ||
      item.model_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchLocation = !locationFilter || item.store_location === locationFilter;
    return matchSearch && matchStatus && matchCategory && matchLocation;
  });

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();
  const locations = [...new Set(items.map((i) => i.store_location).filter(Boolean))].sort();

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalFiltered = filtered.length;

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, locationFilter]);

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

  const handleStatusChange = (item, newStatus) => {
    if (newStatus === item.status) return;
    if (newStatus === 'out') {
      setCheckoutItem(item);
    } else if (item.status === 'out' && (newStatus === 'in_stock' || newStatus === 'reserved')) {
      setCheckinTargetStatus(newStatus);
      setCheckinItem(item);
    } else {
      updateItemStatus(item.id, newStatus);
    }
  };

  const updateItemStatus = async (id, status) => {
    try {
      await updateItem(id, { status, last_used_date: new Date().toISOString(), last_used_by: user?.id });
      success('Status updated');
      refetch();
    } catch (err) {
      notifyError(err.message || 'Update failed');
    }
  };

  const handleCheckOut = async (data) => {
    if (!checkoutItem) return;
    try {
      const qty = data.quantity ?? 1;
      const newQty = Math.max(0, (checkoutItem.quantity ?? 0) - qty);
      const recordedAt = new Date().toISOString();
      await createTransaction({
        item_id: checkoutItem.id,
        type: 'out',
        quantity: qty,
        recipient_name: data.recipientName,
        purpose: data.purpose,
        responsible_person: data.responsiblePerson || null,
        vehicle_model: data.vehicleModel || null,
        notes: data.notes || null,
        performed_by: user?.id,
        created_at: recordedAt,
      });
      await updateItem(checkoutItem.id, {
        quantity: newQty,
        status: newQty === 0 ? 'out' : 'in_stock',
        last_used_date: recordedAt,
        last_used_by: user?.id,
      });
      success('Item checked out');
      setCheckoutItem(null);
      refetch();
    } catch (err) {
      notifyError(err.message || 'Check out failed');
    }
  };

  const handleCheckIn = async (data) => {
    if (!checkinItem) return;
    const targetStatus = checkinTargetStatus || 'in_stock';
    try {
      const recordedAt = new Date().toISOString();
      await createTransaction({
        item_id: checkinItem.id,
        type: 'in',
        notes: data.notes || 'Item returned to inventory',
        performed_by: user?.id,
        created_at: recordedAt,
      });
      await updateItem(checkinItem.id, {
        status: targetStatus,
        last_used_date: recordedAt,
        last_used_by: user?.id,
      });
      success('Item checked in');
      setCheckinItem(null);
      setCheckinTargetStatus(null);
      refetch();
    } catch (err) {
      notifyError(err.message || 'Check in failed');
    }
  };

  const handleSaveEdit = async (updates) => {
    if (!editingItem) return;
    try {
      await updateItem(editingItem.id, updates);
      success('Item updated');
      setEditingItem(null);
      refetch();
    } catch (err) {
      notifyError(err.message || 'Update failed');
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by name, QR ID, category, location, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0"
            />
            <div className="flex flex-wrap gap-2 sm:ml-auto">
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Filters:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-asahi/30 min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="out">Out</option>
              <option value="reserved">Reserved</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-asahi/30 min-w-[140px]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-asahi/30 min-w-[140px]"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
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
              {paginated.map((item) => (
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
                          <NavIcon name="package" className="w-5 h-5" />
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
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-asahi/30"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out">Out</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        className="text-sm py-1.5"
                        onClick={() => setEditingItem({ ...item })}
                      >
                        Edit
                      </Button>
                      <Link to={`/inventory/${item.id}`}>
                        <Button variant="outline" className="text-sm py-1.5">
                          View
                        </Button>
                      </Link>
                    </div>
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
        {filtered.length > 0 && (
          <Pagination
            page={page}
            totalItems={totalFiltered}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Card>

      {editingItem && (
        <Modal onBackdropClick={() => setEditingItem(null)}>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Edit Item</h3>
            <EditItemForm
              item={editingItem}
              onSave={handleSaveEdit}
              onCancel={() => setEditingItem(null)}
            />
          </Card>
        </Modal>
      )}

      {checkoutItem && (
        <CheckOutForm
          onSubmit={handleCheckOut}
          onCancel={() => setCheckoutItem(null)}
          item={checkoutItem}
          currentUserId={user?.id}
          currentUserDisplay={profile?.full_name || user?.email}
        />
      )}

      {checkinItem && (
        <Modal onBackdropClick={() => setCheckinItem(null)}>
          <div>
            <p className="text-sm text-slate-600 mb-2">Check in: {checkinItem.name}</p>
            <CheckInForm
              onSubmit={handleCheckIn}
              onCancel={() => setCheckinItem(null)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: item.name || '',
    description: item.description || '',
    category: item.category || '',
    store_location: item.store_location || '',
    vehicle_model: item.vehicle_model || '',
    model_name: item.model_name || '',
    sku_code: item.sku_code || '',
    quantity: item.quantity ?? 1,
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category: form.category?.trim() || null,
      store_location: form.store_location?.trim() || null,
      vehicle_model: form.vehicle_model?.trim() || null,
      model_name: form.model_name?.trim() || null,
      sku_code: form.sku_code?.trim() || null,
      quantity: form.quantity || 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name *" name="name" value={form.name} onChange={handleChange} required />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none"
        />
      </div>
      <Input label="Category" name="category" value={form.category} onChange={handleChange} />
      <Input label="Store Location" name="store_location" value={form.store_location} onChange={handleChange} />
      <Input label="Vehicle Model" name="vehicle_model" value={form.vehicle_model} onChange={handleChange} />
      <Input label="Model Name" name="model_name" value={form.model_name} onChange={handleChange} />
      <Input label="SKU Code" name="sku_code" value={form.sku_code} onChange={handleChange} />
      <Input label="Quantity" name="quantity" type="number" min={1} value={form.quantity} onChange={handleChange} />
      <div className="flex gap-2 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
