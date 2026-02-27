import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { updateProfile } from '../../services/userService';
import { Logo } from './Logo';
import { useNotification } from '../../context/NotificationContext';
import { HeaderSearch } from '../HeaderSearch';
import { HeaderNotifications } from '../HeaderNotifications';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { NavIcon } from '../icons/NavIcons';

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  inventory_manager: 'Inventory Manager',
  worker: 'Mechanic',
};

export function Header() {
  const { user, profile, signOut, updatePassword, refreshProfile } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuClosing(true);
    setTimeout(() => {
      setShowMenu(false);
      setMenuClosing(false);
    }, 150);
  }, []);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', address: '', phone_number: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handleSignOut = () => {
    signOut();
    navigate('/login');
    closeMenu();
  };

  const openProfile = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      address: profile?.address || '',
      phone_number: profile?.phone_number || '',
    });
    setShowProfile(true);
    closeMenu();
  };

  const openPassword = () => {
    setPasswordForm({ current: '', new: '', confirm: '' });
    setShowPassword(true);
    closeMenu();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(user.id, {
        full_name: profileForm.full_name?.trim() || null,
        address: profileForm.address?.trim() || null,
        phone_number: profileForm.phone_number?.trim() || null,
      });
      await refreshProfile();
      success('Profile updated');
      setShowProfile(false);
    } catch (err) {
      error(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      error('New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }
    try {
      await updatePassword(passwordForm.new);
      success('Password updated');
      setShowPassword(false);
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center md:hidden shrink-0">
          <Logo className="h-8 md:h-10 object-contain" fallbackText="AsahiGroup" />
        </Link>
          <div className="relative flex items-center gap-1 ml-auto">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Search spare parts"
              title="Search spare parts"
            >
              <NavIcon name="search" className="w-5 h-5" />
            </button>
            <HeaderNotifications />
            <button
              onClick={() => (showMenu ? closeMenu() : setShowMenu(true))}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-asahi/20 flex items-center justify-center text-asahi font-medium">
                {profile?.full_name?.[0] || user?.email?.[0] || '?'}
              </div>
              <span className="hidden sm:inline text-sm text-slate-600 truncate max-w-[120px]">
                {profile?.full_name || user?.email}
              </span>
            </button>
            {showMenu && (
              <>
                <div
                  className={`fixed inset-0 z-40 transition-opacity duration-150 ${menuClosing ? 'opacity-0' : 'opacity-100'}`}
                  onClick={closeMenu}
                  aria-hidden="true"
                />
                <div
                  className={`absolute right-0 top-full mt-1 py-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 min-w-[180px] ${
                    menuClosing ? 'animate-dropdown-out' : 'animate-dropdown-in'
                  }`}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-medium text-slate-800 truncate">{user?.email}</p>
                    <p className="text-xs text-slate-500">{roleLabels[profile?.role] || profile?.role}</p>
                  </div>
                  <button
                    onClick={openProfile}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={openPassword}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <HeaderSearch open={showSearch} onClose={() => setShowSearch(false)} />

      {showProfile && (
        <Modal onBackdropClick={() => setShowProfile(false)}>
          <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Update Profile</h3>
              <p className="text-sm text-slate-500 mb-4">Email cannot be changed.</p>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                />
                <Input
                  label="Address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Optional"
                />
                <Input
                  label="Phone"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone_number: e.target.value }))}
                  placeholder="Optional"
                />
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowProfile(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
          </Card>
        </Modal>
      )}

      {showPassword && (
        <Modal onBackdropClick={() => setShowPassword(false)}>
          <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit">Update Password</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowPassword(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
          </Card>
        </Modal>
      )}
    </>
  );
}
