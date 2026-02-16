import { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '../services/healthService';
import { Unavailable } from '../pages/Unavailable';

export function ConnectionGuard({ children }) {
  const [connected, setConnected] = useState(null);
  const [error, setError] = useState('');

  const check = async () => {
    setConnected(null);
    setError('');
    try {
      const result = await checkSupabaseConnection();
      setConnected(result.ok);
      setError(result.error || '');
    } catch (err) {
      setConnected(false);
      setError(err.message || 'Connection failed');
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (connected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Checking connection...</div>
      </div>
    );
  }

  if (!connected) {
    return <Unavailable error={error} onRetry={check} />;
  }

  return children;
}
