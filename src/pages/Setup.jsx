import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { isSetupComplete } from '../services/setupService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/Layout/Logo';
import { Footer } from '../components/Layout/Footer';
import { PageSkeleton } from '../components/ui/PageLayout';

export function Setup() {
  const [email, setEmail] = useState('blsthathsara@gmail.com');
  const [password, setPassword] = useState('ABcd12##');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasUsers, setHasUsers] = useState(false);
  const { signUp } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    isSetupComplete()
      .then((complete) => {
        setHasUsers(complete);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      success('Account created! You are the super admin.');
      navigate('/');
    } catch (err) {
      const msg = err?.message || 'Sign up failed';
      const isRateLimit =
        err?.status === 429 ||
        msg.includes('429') ||
        msg.toLowerCase().includes('too many') ||
        msg.toLowerCase().includes('rate limit') ||
        msg.toLowerCase().includes('email rate limit') ||
        err?.error === 'over_email_send_rate_limit';
      if (isRateLimit) {
        error('Too many signup attempts. Please wait and try again.');
      } else {
        error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <PageSkeleton />
      </div>
    );
  }

  if (hasUsers) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md text-center">
            <p className="text-slate-600">An admin already exists.</p>
            <Link to="/login">
              <Button className="mt-4">Go to sign in</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="h-14 mx-auto object-contain" fallbackText="AsahiGroup" />
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-6">First-time setup</h1>
            <p className="text-sm text-slate-500 mt-1">Create the super admin account</p>
          </div>
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Optional" />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating…' : 'Create super admin'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-asahi font-medium hover:underline">Sign in</Link>
            </p>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
