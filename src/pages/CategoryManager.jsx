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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Category Manager</h2>
        <Button onClick={() => setShowAdd(true)}>+ Add Category</Button>
      </div>

      <Card className="p-6">
        <p className="text-sm text-slate-500 mb-6">
          Add parent categories (e.g. Audio, Parts) and child categories (e.g. Speakers under Audio).
          These appear in the dropdown when adding spare parts.
        </p>
        <div className="space-y-3">
          {parents.length === 0 ? (
            <div className="py-12 text-center">
              <NavIcon name="folder" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No categories yet.</p>
              <p className="text-sm text-slate-400 mt-1">Add your first category to organize spare parts.</p>
            </div>
          ) : (
            parents.map((parent) => {
              const children = getChildren(parent.id);
              const parentCount = itemCountByCategory[parent.name] || 0;
              return (
                <div key={parent.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-asahi/10 flex items-center justify-center shrink-0">
                        <NavIcon name="folder" className="w-5 h-5 text-asahi" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">{parent.name}</span>
                        {parentCount > 0 && (
                          <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {parentCount} item{parentCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        className="p-2"
                        onClick={() => setEditing({ id: parent.id, name: parent.name, parent_id: null })}
                        title="Edit"
                      >
                        <NavIcon name="pencil" className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="p-2 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(parent.id, parent.name)}
                        title="Delete"
                      >
                        <NavIcon name="trash" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {children.length > 0 && (
                    <div className="border-t border-slate-100">
                      {children.map((child, index) => {
                        const childCount = itemCountByCategory[`${parent.name} > ${child.name}`] || 0;
                        return (
                          <div
                            key={child.id}
                            className={`flex items-center justify-between gap-4 px-4 py-3 pl-14 ${
                              index < children.length - 1 ? 'border-b border-slate-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-400">└</span>
                              <span className="text-slate-700">{child.name}</span>
                              {childCount > 0 && (
                                <span className="text-xs text-slate-400">
                                  {childCount} item{childCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                className="p-1.5"
                                onClick={() => setEditing({ id: child.id, name: child.name, parent_id: child.parent_id })}
                                title="Edit"
                              >
                                <NavIcon name="pencil" className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                className="p-1.5 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDelete(child.id, child.name)}
                                title="Delete"
                              >
                                <NavIcon name="trash" className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
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
