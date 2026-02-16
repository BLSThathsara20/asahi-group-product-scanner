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
        error('429 Too Many Requests — Too many signup attempts. Please wait 10–15 minutes and try again.');
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
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (hasUsers) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
          <Card className="p-6 max-w-md text-center">
            <p className="text-slate-600">An admin already exists.</p>
            <Link to="/login">
              <Button className="mt-4">Go to Login</Button>
            </Link>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="h-16 mx-auto object-contain" fallbackText="AsahiGroup" />
          <p className="text-slate-500 mt-2">Create Super Admin</p>
        </div>
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">First-time setup</h2>
          <p className="text-sm text-slate-500 mb-6">
            Create the first account. This user will be the super admin.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Optional"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Super Admin'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="text-asahi font-medium">Sign in</Link>
          </p>
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
