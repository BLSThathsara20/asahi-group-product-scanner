import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useItems } from '../hooks/useItems';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { NavIcon } from '../components/icons/NavIcons';

export function CategoryManager() {
  const { isAdmin } = useAuth();
  const { success, error } = useNotification();
  const { items } = useItems();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', parent_id: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parents = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId) => categories.filter((c) => c.parent_id === parentId);

  const itemCountByCategory = useMemo(() => {
    const counts = {};
    (items || []).forEach((item) => {
      const cat = item.category?.trim();
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);


  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      error('Name is required');
      return;
    }
    try {
      await createCategory(form.name.trim(), form.parent_id || null);
      success('Category added');
      setShowAdd(false);
      setForm({ name: '', parent_id: '' });
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing || !editing.name?.trim()) return;
    try {
      await updateCategory(editing.id, {
        name: editing.name.trim(),
        parent_id: editing.parent_id || null,
      });
      success('Category updated');
      setEditing(null);
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? Child categories will also be removed.`)) return;
    try {
      await deleteCategory(id);
      success('Category deleted');
      load();
    } catch (err) {
      error(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-slate-600">You don't have permission to access this page.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  const CategoryRow = ({ cat, isChild, count }) => (
    <div className={`flex items-center justify-between gap-2 py-3 ${isChild ? 'pl-8' : ''} ${!isChild ? 'border-b border-slate-100 last:border-0' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        {!isChild && <NavIcon name="folder" className="w-4 h-4 text-asahi shrink-0" />}
        <span className={isChild ? 'text-slate-600' : 'font-medium text-slate-800'}>{cat.name}</span>
        {count > 0 && (
          <span className="text-xs text-slate-400 shrink-0">{count} item{count !== 1 ? 's' : ''}</span>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setEditing({ id: cat.id, name: cat.name, parent_id: cat.parent_id || null })}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          aria-label="Edit"
        >
          <NavIcon name="pencil" className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleDelete(cat.id, cat.name)}
          className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
          aria-label="Delete"
        >
          <NavIcon name="trash" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Categories</h2>
        <Button onClick={() => setShowAdd(true)} className="shrink-0">+ Add</Button>
      </div>

      <Card className="p-4">
        <p className="text-sm text-slate-500 mb-4">
          Parent and child categories for spare parts.
        </p>
        {parents.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>No categories yet.</p>
            <Button variant="outline" className="mt-3" onClick={() => setShowAdd(true)}>Add first</Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {parents.map((parent) => {
              const children = getChildren(parent.id);
              const parentCount = itemCountByCategory[parent.name] || 0;
              return (
                <div key={parent.id}>
                  <CategoryRow cat={parent} isChild={false} count={parentCount} />
                  {children.map((child) => {
                    const childCount = itemCountByCategory[`${parent.name} > ${child.name}`] || 0;
                    return <CategoryRow key={child.id} cat={child} isChild count={childCount} />;
                  })}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showAdd && (
        <Modal onBackdropClick={() => { setShowAdd(false); setForm({ name: '', parent_id: '' }); }}>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Add Category</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent (optional)</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none"
                >
                  <option value="">— None (top-level category) —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Category Name *"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Audio, Speakers"
                required
              />
              <div className="flex gap-2">
                <Button type="submit">Add</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setForm({ name: '', parent_id: '' }); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </Modal>
      )}

      {editing && (
        <Modal onBackdropClick={() => setEditing(null)}>
          <Card className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Edit Category</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent (optional)</label>
                <select
                  value={editing.parent_id || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, parent_id: e.target.value || null }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-asahi/30 outline-none"
                >
                  <option value="">— None (top-level) —</option>
                  {parents.filter((p) => p.id !== editing.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Change parent to move this category.</p>
              </div>
              <Input
                label="Category Name *"
                value={editing.name}
                onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Audio"
                required
              />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </Modal>
      )}
    </div>
  );
}
