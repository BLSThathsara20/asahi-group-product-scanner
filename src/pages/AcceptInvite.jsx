import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/Layout/Logo';
import { Footer } from '../components/Layout/Footer';

export function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('invite');
  const [invite, setInvite] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { signUp } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    supabase
      .from('user_invites')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data }) => {
        setInvite(data);
        setChecking(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invite) return;
    setLoading(true);
    try {
      await signUp(invite.email, password, '', { invite_token: token }); // 4th arg = extra metadata
      success('Account created! You can now sign in.');
      navigate('/login');
    } catch (err) {
      error(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!token || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="p-6 max-w-md text-center">
          <p className="text-slate-600">Invalid or expired invite link.</p>
          <Link to="/login">
            <Button className="mt-4">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="h-16 mx-auto object-contain" fallbackText="AsahiGroup" />
            <p className="text-slate-500 mt-2">Accept Invitation</p>
          </div>
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Create your account</h2>
          <p className="text-sm text-slate-500 mb-4">You've been invited as {invite.role}.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" value={invite.email} disabled />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
