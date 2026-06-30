import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { runHealthCheck } from '../services/healthService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageContainer, PageHeader, PageSkeleton } from '../components/ui/PageLayout';

function CheckRow({ title, detail, ok, warn }) {
  const iconClass = ok ? 'text-emerald-500' : warn ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-slate-50/80">
      <div className="min-w-0">
        <p className="font-medium text-slate-800">{title}</p>
        <p className="text-sm text-slate-500 mt-0.5">{detail}</p>
      </div>
      <span className={iconClass}>
        {ok ? <Check className="w-5 h-5" strokeWidth={2} /> : <X className="w-5 h-5" strokeWidth={2} />}
      </span>
    </div>
  );
}

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
    return <PageSkeleton />;
  }

  const { healthy, timestamp, version, checks } = result;

  return (
    <PageContainer>
      <PageHeader
        title="Health check"
        subtitle="System status and connectivity"
        action={
          <Button variant="outline" className="text-sm" onClick={refresh}>
            Refresh
          </Button>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className={`w-3 h-3 rounded-full shrink-0 ${healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div>
            <p className="font-semibold text-slate-800">
              {healthy ? 'All systems operational' : 'Issues detected'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{timestamp} · v{version}</p>
          </div>
        </div>

        <div className="space-y-3">
          <CheckRow
            title="Sanity"
            detail={
              checks.sanity.ok
                ? `Connected (${checks.sanity.latencyMs}ms)`
                : checks.sanity.error
            }
            ok={checks.sanity.ok}
          />
          <CheckRow
            title="Auth"
            detail={
              checks.auth.ok
                ? checks.auth.authenticated ? 'Session active' : 'No session'
                : checks.auth.error
            }
            ok={checks.auth.ok}
          />
          <CheckRow
            title="Content"
            detail={
              checks.contentStats?.ok && checks.contentStats?.data
                ? `${checks.contentStats.data.items ?? 0} items · ${checks.contentStats.data.transactions ?? 0} transactions · ${checks.contentStats.data.users ?? 0} users`
                : checks.contentStats?.error ?? '—'
            }
            ok={checks.contentStats?.ok}
            warn={!checks.contentStats?.ok}
          />
        </div>
      </Card>
    </PageContainer>
  );
}
