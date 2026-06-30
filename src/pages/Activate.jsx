import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getInviteByToken, verifyInviteTempPassword } from '../services/userService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/Layout/Logo';
import { Footer } from '../components/Layout/Footer';
import { PageSkeleton } from '../components/ui/PageLayout';

export function Activate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [invite, setInvite] = useState(null);
  const [step, setStep] = useState(1);
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { success } = useNotification();

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    getInviteByToken(token)
      .then(setInvite)
      .catch(() => setInvite(null))
      .finally(() => setChecking(false));
  }, [token]);

  const handleVerifyTempPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const valid = await verifyInviteTempPassword(token, tempPassword);
      if (valid) {
        setStep(2);
      } else {
        setError('Incorrect temporary password.');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(invite.email, newPassword, invite.full_name || invite.email, {
        invite_token: token,
      });
      success('Account activated! You can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Activation failed');
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

  if (!token || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="p-6 max-w-md text-center">
          <p className="text-slate-600">Invalid or expired activation link.</p>
          <Link to="/login">
            <Button className="mt-4">Go to sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Logo className="h-14 mx-auto object-contain" fallbackText="AsahiGroup" />
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-6">Activate account</h1>
            <p className="text-sm text-slate-500 mt-1">Step {step} of 2</p>
          </div>
          <Card className="p-6">
            {step === 1 ? (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Enter the temporary password sent by your admin.
                </p>
                <form onSubmit={handleVerifyTempPassword} className="space-y-4">
                  <Input label="Email" value={invite.email} disabled />
                  <Input
                    label="Temporary password"
                    type="password"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Verifying…' : 'Continue'}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">Choose a new password for your account.</p>
                <form onSubmit={handleSetPassword} className="space-y-4">
                  <Input label="Email" value={invite.email} disabled />
                  <Input
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Input
                    label="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Activating…' : 'Activate account'}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
