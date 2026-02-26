import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { useAuth } from '../context/AuthContext';
import { getCategories, buildCategoryOptions } from '../services/categoryService';
import { STORE_LOCATIONS } from '../components/StoreLocationSelect';
import { exportInventoryPDF, exportInventoryExcel } from '../services/reportService';
import { updateItem, createTransaction } from '../services/itemService';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { CheckOutForm, CheckInForm, EditItemForm } from '../components/Inventory';
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
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategoryOptions(buildCategoryOptions(cats)))
      .catch(() => setCategoryOptions([]));
  }, []);

  const customLocations = [...new Set(items.map((i) => i.store_location).filter(Boolean))]
    .filter((loc) => !STORE_LOCATIONS.includes(loc))
    .sort();

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
    const qty = data.quantity ?? 1;
    const newQty = (checkinItem.quantity ?? 0) + qty;
    try {
      const recordedAt = new Date().toISOString();
      await createTransaction({
        item_id: checkinItem.id,
        type: 'in',
        quantity: qty,
        notes: data.notes || 'Item returned to spare parts',
        performed_by: user?.id,
        created_at: recordedAt,
      });
      await updateItem(checkinItem.id, {
        quantity: newQty,
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Spare Parts</h2>
        <Link to="/inventory/add">
          <Button className="text-sm py-1.5 px-3">+ Add</Button>
        </Link>
      </div>

      {/* Minimal filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-asahi/40 focus:border-asahi/50 outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-asahi/40 outline-none"
          >
            <option value="all">Status</option>
            <option value="in_stock">In Stock</option>
            <option value="out">Out</option>
            <option value="reserved">Reserved</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-asahi/40 outline-none min-w-[120px]"
          >
            <option value="all">Category</option>
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-asahi/40 outline-none min-w-[120px]"
          >
            <option value="">Location</option>
            <optgroup label="Rack">
              {STORE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </optgroup>
            {customLocations.length > 0 && (
              <optgroup label="Other">
                {customLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="flex gap-1 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={exporting || filtered.length === 0}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              {exporting === 'pdf' ? '...' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || filtered.length === 0}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              {exporting === 'excel' ? '...' : 'Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Minimal table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Loc</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    <Link to={`/inventory/${item.id}`} className="flex items-center gap-2.5">
                      {item.photo_url ? (
                        <img src={item.photo_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                          <NavIcon name="package" className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{item.qr_id}</td>
                  <td className="px-4 py-2.5 text-slate-500">{item.category || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{item.store_location || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      disabled={item.status === 'out'}
                      className={`text-xs px-2 py-0.5 rounded border border-slate-200 focus:ring-1 focus:ring-asahi/40 outline-none ${
                        item.status === 'out' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-600'
                      }`}
                      title={item.status === 'out' ? 'Check in first' : ''}
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out">Out</option>
                      <option value="reserved">Reserved</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end items-center gap-3">
                      {item.status === 'in_stock' && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...item })}
                          className="text-slate-400 hover:text-slate-600"
                          title="Edit"
                        >
                          <NavIcon name="pencil" className="w-4 h-4" />
                        </button>
                      )}
                      <Link to={`/inventory/${item.id}`} className="text-xs text-slate-500 hover:text-asahi" title="View">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">No items found</div>
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
      </div>

      {editingItem && editingItem.status === 'in_stock' && (
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
          <CheckInForm
            item={checkinItem}
            onSubmit={handleCheckIn}
            onCancel={() => setCheckinItem(null)}
          />
        </Modal>
      )}
    </div>
  );
}
