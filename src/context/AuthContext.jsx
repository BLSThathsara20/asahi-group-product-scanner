import { createContext, useContext, useEffect, useState } from 'react';
import {
  loadSession,
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  updatePassword as authUpdatePassword,
  getUserById,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then(({ user: u, profile: p }) => {
        setUser(u);
        setProfile(p);
      })
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email, password) {
    const { user: u, profile: p } = await authSignIn(email, password);
    setUser(u);
    setProfile(p);
    return { user: u, profile: p };
  }

  async function signUp(email, password, fullName, extra = {}) {
    const { user: u, profile: p } = await authSignUp(email, password, fullName, extra);
    setUser(u);
    setProfile(p);
    return { user: u, profile: p };
  }

  async function signOut() {
    authSignOut();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (!user?.id) return;
    const p = await getUserById(user.id);
    setProfile(p);
  }

  async function updatePassword(newPassword) {
    if (!user?.id) throw new Error('Not signed in');
    await authUpdatePassword(user.id, newPassword);
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
