import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { runHealthCheck } from '../services/healthService';
import { Card } from '../components/ui/Card';

export function HealthCheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runHealthCheck().then(setResult).finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    runHealthCheck().then(setResult).finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-400">Running health checks...</div>
      </div>
    );
  }

  const { healthy, timestamp, version, checks } = result;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Health Check</h2>
        <button
          onClick={refresh}
          className="text-sm text-asahi font-medium hover:underline"
        >
          Refresh
        </button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-4 h-4 rounded-full ${
              healthy ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <div>
            <p className="font-semibold text-slate-800">
              {healthy ? 'All systems operational' : 'Issues detected'}
            </p>
            <p className="text-sm text-slate-500">
              {timestamp} • v{version}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-800">Supabase</p>
              <p className="text-sm text-slate-500">
                {checks.supabase.ok
                  ? `Connected (${checks.supabase.latencyMs}ms)`
                  : checks.supabase.error}
              </p>
            </div>
            <span
              className={`${checks.supabase.ok ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {checks.supabase.ok ? (
                <Check className="w-6 h-6" strokeWidth={2} />
              ) : (
                <X className="w-6 h-6" strokeWidth={2} />
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div>
              <p className="font-medium text-slate-800">Auth</p>
              <p className="text-sm text-slate-500">
                {checks.auth.ok
                  ? checks.auth.authenticated
                    ? 'Session active'
                    : 'No session'
                  : checks.auth.error}
              </p>
            </div>
            <span
              className={`${checks.auth.ok ? 'text-emerald-500' : 'text-red-500'}`}
            >
              {checks.auth.ok ? (
                <Check className="w-6 h-6" strokeWidth={2} />
              ) : (
                <X className="w-6 h-6" strokeWidth={2} />
              )}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
