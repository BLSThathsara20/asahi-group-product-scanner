import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  getProfiles,
  getPendingInvites,
  updateProfileRole,
  updateProfile,
  deleteProfile,
  deleteInvite,
  addUser,
} from '../services/userService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { NavIcon } from '../components/icons/NavIcons';

const ROLES = [
  { value: 'worker', label: 'Mechanic' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function UserManagement() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { success, error } = useNotification();
  const [profiles, setProfiles] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    full_name: '',
    role: 'worker',
    temp_password: '',
  });
  const [generatedLink, setGeneratedLink] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const allUsers = useMemo(() => {
    const profileRows = profiles.map((p) => ({
      type: 'profile',
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      phone_number: p.phone_number,
      address: p.address,
      status: 'Active',
    }));
    const inviteRows = pendingInvites.map((i) => ({
      type: 'invite',
      id: i.id,
      email: i.email,
      full_name: i.full_name,
      role: i.role,
      phone_number: null,
      address: null,
      status: 'Pending invitation',
      token: i.token,
    }));
    return [...profileRows, ...inviteRows];
  }, [profiles, pendingInvites]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allUsers.slice(start, start + pageSize);
  }, [allUsers, page, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [profilesData, invitesData] = await Promise.all([
        getProfiles(),
        getPendingInvites(),
      ]);
      const profileEmails = new Set(profilesData.map((p) => p.email?.toLowerCase()));
      const invitesOnly = invitesData.filter(
        (i) => !profileEmails.has(i.email?.toLowerCase())
      );
      setProfiles(profilesData);
      setPendingInvites(invitesOnly);
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

  const handleDeleteInvite = async (inviteId, email) => {
    if (!confirm(`Cancel invitation for ${email}? They will not be able to activate.`)) return;
    try {
      await deleteInvite(inviteId);
      success('Invitation cancelled');
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
      const { activationLink } = await addUser(
        addUserForm.email,
        addUserForm.full_name || addUserForm.email,
        addUserForm.role,
        addUserForm.temp_password
      );
      setGeneratedLink(activationLink);
      success('Invite created. Send the link to the user.');
    } catch (err) {
      error(err.message);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      success('Link copied to clipboard');
    }
  };

  const getActivationLink = (token) => {
    if (!token) return null;
    const base = typeof window !== 'undefined'
      ? `${window.location.origin}${(import.meta.env?.BASE_URL || '').replace(/\/$/, '')}`
      : '';
    return `${base}/activate?token=${token}`;
  };

  const handleCopyInviteLink = async (token) => {
    const link = getActivationLink(token);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      success('Invite link copied to clipboard');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        success('Invite link copied to clipboard');
      } catch {
        error('Failed to copy. Please copy the link manually.');
      }
      document.body.removeChild(textarea);
    }
  };

  const handleCloseAddUser = () => {
    setShowAddUser(false);
    setGeneratedLink(null);
    setAddUserForm({ email: '', full_name: '', role: 'worker', temp_password: '' });
    load();
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
                  value={editingProfile.phone_number ?? ''}
                  onChange={(e) => setEditingProfile((prev) => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Optional"
                />
                <Input
                  label="Address"
                  value={editingProfile.address ?? ''}
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
        <Modal onBackdropClick={handleCloseAddUser}>
          <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add User</h3>
              {generatedLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-600 font-medium">User invite created. Send this link to the user:</p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 break-all font-mono">{generatedLink}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    User opens the link → enters temporary password → sets new password → account activated.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleCopyLink}>Copy link</Button>
                    <Button variant="secondary" onClick={handleCloseAddUser}>Done</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    Create a user with a temporary password. A link will be generated to send to them.
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
                        {ROLES.filter((r) => r.value !== 'super_admin').map((r) => (
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
                      <Button type="button" variant="secondary" onClick={handleCloseAddUser}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </>
              )}
          </Card>
        </Modal>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Address</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{row.email}</p>
                    <p className="text-sm text-slate-500">{row.full_name || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                        row.status === 'Pending invitation'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.status}
                      {row.status === 'Pending invitation' && row.token && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyInviteLink(row.token);
                          }}
                          className="p-1 -m-1 rounded hover:bg-amber-200/50 min-w-[28px] min-h-[28px] flex items-center justify-center"
                          title="Copy invite link"
                          aria-label="Copy invite link"
                        >
                          <NavIcon name="copy" className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">{row.phone_number || '-'}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-sm text-slate-600 truncate block" title={row.address}>{row.address || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.type === 'profile' ? (
                      <select
                        value={row.role || 'worker'}
                        onChange={(e) => handleRoleChange(row.id, e.target.value)}
                        disabled={row.id === user?.id}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      >
                        {ROLES.filter((r) => r.value !== 'super_admin').map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-slate-600">{ROLES.find((r) => r.value === row.role)?.label || row.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.type === 'profile' && (
                        <Button variant="outline" className="text-sm py-1.5" onClick={() => setEditingProfile({ id: row.id, email: row.email, full_name: row.full_name, address: row.address || '', phone_number: row.phone_number || '' })}>
                          Edit
                        </Button>
                      )}
                      {row.type === 'invite' ? (
                        <Button variant="outline" className="text-red-600 border-red-200 text-sm py-1.5" onClick={() => handleDeleteInvite(row.id, row.email)}>
                          Delete
                        </Button>
                      ) : (
                        isSuperAdmin && row.id !== user?.id && row.role !== 'super_admin' && (
                          <Button variant="outline" className="text-red-600 border-red-200 text-sm py-1.5" onClick={() => handleRemove(row.id)}>
                            Remove
                          </Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No users yet. Add your first user to get started.
          </div>
        )}
        {allUsers.length > 0 && (
          <Pagination
            page={page}
            totalItems={allUsers.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </Card>
    </div>
  );
}
