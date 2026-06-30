import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { NavIcon } from '../components/icons/NavIcons';

export function Unavailable({ error, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <NavIcon name="warning" className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mb-2">Connection unavailable</h1>
        <p className="text-sm text-slate-500 mb-5">
          Cannot reach Sanity. Check your configuration and try again.
        </p>
        <ul className="text-left text-sm text-slate-600 mb-6 space-y-2 bg-slate-50 rounded-lg p-4">
          <li>· Set <strong>VITE_SANITY_*</strong> in <strong>.env</strong></li>
          <li>· Deploy schemas from the <strong>sanity</strong> folder</li>
          <li>· Confirm your API token has read/write access</li>
        </ul>
        {error && (
          <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg text-left">{error}</p>
        )}
        <Button onClick={onRetry} className="w-full sm:w-auto">Retry</Button>
      </Card>
    </div>
  );
}
