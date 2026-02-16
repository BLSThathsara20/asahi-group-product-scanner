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

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetupLink, setShowSetupLink] = useState(false);
  const { signIn } = useAuth();
  const { success, error } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    isSetupComplete().then((complete) => setShowSetupLink(!complete));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = err?.message || '';
      const errCode = err?.error || err?.code || '';
      const isRateLimit = err?.status === 429 || msg.toLowerCase().includes('rate limit');
      const isEmailNotConfirmed =
        err?.status === 400 &&
        (msg.toLowerCase().includes('email not confirmed') ||
          String(errCode).includes('email_not_confirmed'));
      const isInvalidCreds =
        err?.status === 400 &&
        (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials'));
      if (isRateLimit) {
        error('429 Too Many Requests — Please wait a few minutes and try again.');
      } else if (isEmailNotConfirmed) {
        error(
          '400 Bad Request — Email not confirmed. Check your inbox or disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email.'
        );
      } else if (isInvalidCreds) {
        error('400 Bad Request — Unauthorized. No account? Create first admin to get started.');
      } else {
        error(msg || 'Sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="h-16 mx-auto object-contain" fallbackText="AsahiGroup" />
            <p className="text-slate-500 mt-2">Inventory Management</p>
          </div>
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          {showSetupLink && (
            <p className="mt-4 text-center text-sm text-slate-500">
              No account?{' '}
              <Link to="/setup" className="text-asahi font-medium">
                Create first admin
              </Link>
            </p>
          )}
        </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
