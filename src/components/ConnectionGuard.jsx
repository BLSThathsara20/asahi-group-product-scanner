import { useState, useEffect } from 'react';
import { checkSanityConnection } from '../services/healthService';
import { Unavailable } from '../pages/Unavailable';
import { PageSkeleton } from './ui/PageLayout';

export function ConnectionGuard({ children }) {
  const [connected, setConnected] = useState(null);
  const [error, setError] = useState('');

  const check = async () => {
    setConnected(null);
    setError('');
    try {
      const result = await checkSanityConnection();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (!connected) {
    return <Unavailable error={error} onRetry={check} />;
  }

  return children;
}
