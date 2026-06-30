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
  createPasswordReset,
  generateTempPassword,
  canResetUserPassword,
} from '../services/userService';
import {
  getUserRoles,
  createUserRole,
  updateUserRole,
  deleteUserRole,
} from '../services/roleService';
import { assignableRoles, getRoleLabel } from '../lib/roles';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { NavIcon } from '../components/icons/NavIcons';
import { PageContainer, PageHeader, PageSkeleton } from '../components/ui/PageLayout';

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
  const [resetTarget, setResetTarget] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [showManageRoles, setShowManageRoles] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [roleSaving, setRoleSaving] = useState(false);
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

  const assignmentRoles = useMemo(() => {
    let roles = assignableRoles(userRoles);
    if (!isSuperAdmin) roles = roles.filter((r) => r.slug !== 'admin');
    return roles;
  }, [userRoles, isSuperAdmin]);

  const defaultAssignableRole = assignmentRoles[0]?.slug || 'worker';

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [profilesData, invitesData, rolesData] = await Promise.all([
        getProfiles(),
        getPendingInvites(),
        getUserRoles(),
      ]);
      const profileEmails = new Set(profilesData.map((p) => p.email?.toLowerCase()));
      const invitesOnly = invitesData.filter(
        (i) => !profileEmails.has(i.email?.toLowerCase())
      );
      setProfiles(profilesData);
      setPendingInvites(invitesOnly);
      setUserRoles(rolesData);
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
      await updateProfileRole(profileId, newRole, { actorIsSuperAdmin: isSuperAdmin });
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
        addUserForm.temp_password,
        { actorIsSuperAdmin: isSuperAdmin }
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

  const handleOpenResetPassword = (row) => {
    setResetTarget(row);
    setResetTempPassword(generateTempPassword());
    setResetResult(null);
  };

  const handleCloseResetPassword = () => {
    setResetTarget(null);
    setResetTempPassword('');
    setResetResult(null);
    setResetLoading(false);
  };

  const handleCreatePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetTarget?.id) return;
    if (!resetTempPassword?.trim() || resetTempPassword.length < 6) {
      error('Temporary password must be at least 6 characters');
      return;
    }
    setResetLoading(true);
    try {
      const result = await createPasswordReset(resetTarget.id, resetTempPassword.trim());
      setResetResult(result);
      success('Password reset link created');
    } catch (err) {
      error(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyResetDetails = async () => {
    if (!resetResult) return;
    const text = [
      `Password reset for ${resetResult.email}`,
      '',
      `Temporary password: ${resetResult.tempPassword}`,
      `Reset link: ${resetResult.resetLink}`,
      '',
      'Open the link, enter the temporary password, then choose a new password.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      success('Reset details copied to clipboard');
    } catch {
      error('Failed to copy. Please copy the details manually.');
    }
  };

  const handleCopyResetLink = async () => {
    if (!resetResult?.resetLink) return;
    try {
      await navigator.clipboard.writeText(resetResult.resetLink);
      success('Reset link copied');
    } catch {
      error('Failed to copy link');
    }
  };

  const canResetRow = (row) =>
    canResetUserPassword({
      isSuperAdmin,
      isAdmin,
      actorId: user?.id,
      target: row,
    });

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
    setAddUserForm({ email: '', full_name: '', role: defaultAssignableRole, temp_password: '' });
    load();
  };

  const handleAddUserRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setRoleSaving(true);
    try {
      await createUserRole(newRoleName.trim());
      setNewRoleName('');
      success('Role added');
      const roles = await getUserRoles();
      setUserRoles(roles);
    } catch (err) {
      error(err.message);
    } finally {
      setRoleSaving(false);
    }
  };

  const handleSaveRoleName = async (roleId, name) => {
    if (!name.trim()) return;
    setRoleSaving(true);
    try {
      await updateUserRole(roleId, name.trim());
      success('Role updated');
      setEditingRole(null);
      const roles = await getUserRoles();
      setUserRoles(roles);
    } catch (err) {
      error(err.message);
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    setRoleSaving(true);
    try {
      await deleteUserRole(role.id);
      success('Role deleted');
      const roles = await getUserRoles();
      setUserRoles(roles);
    } catch (err) {
      error(err.message);
    } finally {
      setRoleSaving(false);
    }
  };

  const handleCloseManageRoles = () => {
    setShowManageRoles(false);
    setNewRoleName('');
    setEditingRole(null);
  };

  if (!isAdmin) {
    return (
      <PageContainer width="wide">
        <Card className="p-6">
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </Card>
      </PageContainer>
    );
  }

  if (loading) {
    return <PageSkeleton variant="table" />;
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Users"
        subtitle={`${allUsers.length} user${allUsers.length !== 1 ? 's' : ''} and invites`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowManageRoles(true)}>
              Manage roles
            </Button>
            <Button onClick={() => {
              setAddUserForm((p) => ({ ...p, role: defaultAssignableRole }));
              setShowAddUser(true);
            }}>
              + Add user
            </Button>
          </div>
        }
      />

      {showManageRoles && (
        <Modal onBackdropClick={handleCloseManageRoles}>
          <Card className="p-6 max-w-md w-full">
            <h3 className="font-semibold text-slate-800 mb-1">User roles</h3>
            <p className="text-sm text-slate-500 mb-4">
              Roles appear when adding users. System roles cannot be deleted.
            </p>
            <form onSubmit={handleAddUserRole} className="flex gap-2 mb-4">
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="New role name"
                className="flex-1"
              />
              <Button type="submit" disabled={roleSaving || !newRoleName.trim()}>
                Add
              </Button>
            </form>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
              {userRoles.map((role) => (
                <li key={role.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  {editingRole?.id === role.id ? (
                    <form
                      className="flex flex-1 gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveRoleName(role.id, editingRole.name);
                      }}
                    >
                      <input
                        value={editingRole.name}
                        onChange={(e) => setEditingRole((p) => ({ ...p, name: e.target.value }))}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                        autoFocus
                      />
                      <Button type="submit" className="text-sm py-1 px-2" disabled={roleSaving}>
                        Save
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{role.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{role.slug}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingRole({ id: role.id, name: role.name })}
                          className="text-xs text-slate-500 hover:text-asahi px-2 py-1"
                        >
                          Rename
                        </button>
                        {!role.locked && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            className="text-xs text-red-600 hover:underline px-2 py-1"
                            disabled={roleSaving}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <Button variant="secondary" className="mt-4 w-full sm:w-auto" onClick={handleCloseManageRoles}>
              Done
            </Button>
          </Card>
        </Modal>
      )}

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

      {resetTarget && (
        <Modal onBackdropClick={handleCloseResetPassword}>
          <Card className="p-6 max-w-lg">
            <h3 className="font-semibold text-slate-800 mb-1">Reset password</h3>
            <p className="text-sm text-slate-500 mb-4">
              {resetTarget.email}
              {resetTarget.full_name ? ` · ${resetTarget.full_name}` : ''}
            </p>
            {resetResult ? (
              <div className="space-y-4">
                <p className="text-sm text-emerald-600 font-medium">
                  Share the temporary password and link with the user.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500">Temporary password:</span>{' '}
                    <span className="font-mono font-medium text-slate-800">{resetResult.tempPassword}</span>
                  </p>
                  <p className="text-slate-600 break-all font-mono text-xs">{resetResult.resetLink}</p>
                </div>
                <p className="text-xs text-slate-500">
                  User opens the link → enters temporary password → sets a new password.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCopyResetDetails}>Copy all details</Button>
                  <Button variant="outline" onClick={handleCopyResetLink}>Copy link only</Button>
                  <Button variant="secondary" onClick={handleCloseResetPassword}>Done</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePasswordReset} className="space-y-4">
                <p className="text-sm text-slate-500">
                  Set a temporary password, then send the reset link to the user.
                </p>
                <div>
                  <Input
                    label="Temporary password"
                    type="text"
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setResetTempPassword(generateTempPassword())}
                    className="text-xs text-asahi hover:underline mt-1"
                  >
                    Generate new password
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={resetLoading}>
                    {resetLoading ? 'Creating…' : 'Create reset link'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCloseResetPassword}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
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
                        {assignmentRoles.map((r) => (
                          <option key={r.slug} value={r.slug}>{r.name}</option>
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
                      row.role === 'super_admin' ? (
                        <span className="text-sm text-slate-600 font-medium">Super Admin</span>
                      ) : (
                        <select
                          value={row.role || 'worker'}
                          onChange={(e) => handleRoleChange(row.id, e.target.value)}
                          disabled={row.id === user?.id}
                          className="px-3 py-1.5 border rounded-lg text-sm"
                        >
                          {assignmentRoles.map((r) => (
                            <option key={r.slug} value={r.slug}>{r.name}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <span className="text-sm text-slate-600">{getRoleLabel(row.role, userRoles)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.type === 'profile' && (
                        <Button variant="outline" className="text-sm py-1.5" onClick={() => setEditingProfile({ id: row.id, email: row.email, full_name: row.full_name, address: row.address || '', phone_number: row.phone_number || '' })}>
                          Edit
                        </Button>
                      )}
                      {canResetRow(row) && (
                        <Button
                          variant="outline"
                          className="text-sm py-1.5"
                          onClick={() => handleOpenResetPassword(row)}
                        >
                          Reset password
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
    </PageContainer>
  );
}
