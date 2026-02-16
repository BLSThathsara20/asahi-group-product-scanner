import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getProfiles,
  updateProfileRole,
  updateProfile,
  deleteProfile,
  addUser,
} from '../services/userService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';

const ROLES = [
  { value: 'worker', label: 'Worker' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function UserManagement() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { success, error } = useNotification();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    full_name: '',
    role: 'worker',
    temp_password: '',
  });
  const [editingProfile, setEditingProfile] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return profiles.slice(start, start + pageSize);
  }, [profiles, page, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRoleChange = async (profileId, newRole) => {
    try {
      await updateProfileRole(profileId, newRole);
      success('Role updated');
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleSaveProfile = async (profileId, address, phoneNumber) => {
    try {
      await updateProfile(profileId, { address: address || null, phone_number: phoneNumber || null });
      success('Profile updated');
      setEditingProfile(null);
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleRemove = async (profileId) => {
    if (!confirm('Remove this user? They will no longer have access.')) return;
    try {
      await deleteProfile(profileId);
      success('User removed');
      load();
    } catch (err) {
      error(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addUserForm.temp_password?.trim() || addUserForm.temp_password.length < 6) {
      error('Temporary password must be at least 6 characters');
      return;
    }
    try {
      await addUser(
        addUserForm.email,
        addUserForm.full_name || addUserForm.email,
        addUserForm.role,
        addUserForm.temp_password
      );
      success('User added. They can log in with the temporary password and change it in their profile.');
      setShowAddUser(false);
      setAddUserForm({ email: '', full_name: '', role: 'worker', temp_password: '' });
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
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <Button onClick={() => setShowAddUser(true)}>+ Add User</Button>
      </div>

      {editingProfile && (
        <Modal onBackdropClick={() => setEditingProfile(null)}>
          <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Edit User</h3>
              <p className="text-sm text-slate-500 mb-4">
                {editingProfile.email} {editingProfile.full_name && `(${editingProfile.full_name})`}
              </p>
              <div className="space-y-4">
                <Input
                  label="Phone"
                  value={editingProfile.phone_number}
                  onChange={(e) => setEditingProfile((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Optional"
                />
                <Input
                  label="Address"
                  value={editingProfile.address}
                  onChange={(e) => setEditingProfile((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Optional"
                />
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleSaveProfile(editingProfile.id, editingProfile.address, editingProfile.phone_number)}>
                    Save
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingProfile(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
          </Card>
        </Modal>
      )}

      {showAddUser && (
        <Modal onBackdropClick={() => setShowAddUser(false)}>
          <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add User</h3>
              <p className="text-sm text-slate-500 mb-4">
                Create a user with a temporary password. They can change it after logging in.
              </p>
              <form onSubmit={handleAddUser} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <Input
                  label="Full Name"
                  value={addUserForm.full_name}
                  onChange={(e) => setAddUserForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Optional"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={addUserForm.role}
                    onChange={(e) => setAddUserForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    {ROLES.filter((r) => r.value !== 'super_admin' || isSuperAdmin).map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Temporary Password"
                  type="password"
                  value={addUserForm.temp_password}
                  onChange={(e) => setAddUserForm((p) => ({ ...p, temp_password: e.target.value }))}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <div className="flex gap-2">
                  <Button type="submit">Add User</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
          </Card>
        </Modal>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Address</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProfiles.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.email}</p>
                    <p className="text-sm text-slate-500">{p.full_name || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{p.phone_number || '-'}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-sm text-slate-600 truncate block" title={p.address}>{p.address || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.role}
                      onChange={(e) => handleRoleChange(p.id, e.target.value)}
                      disabled={p.id === user?.id}
                      className="px-3 py-1.5 border rounded-lg text-sm"
                    >
                      {ROLES.filter((r) => r.value !== 'super_admin' || isSuperAdmin).map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" className="text-sm py-1.5" onClick={() => setEditingProfile({ id: p.id, email: p.email, full_name: p.full_name, address: p.address || '', phone_number: p.phone_number || '' })}>
                        Edit
                      </Button>
                      {isSuperAdmin && p.id !== user?.id && p.role !== 'super_admin' && (
                        <Button variant="outline" className="text-red-600 border-red-200 text-sm py-1.5" onClick={() => handleRemove(p.id)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profiles.length > 0 && (
          <Pagination
            page={page}
            totalItems={profiles.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Card>
    </div>
  );
}
