import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { NavIcon } from '../components/icons/NavIcons';

export function Unavailable({ error, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="p-8 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <NavIcon name="warning" className="w-16 h-16 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Database Unavailable</h1>
        <p className="text-slate-600 mb-4">
          Cannot connect to Sanity. Please check:
        </p>
        <ul className="text-left text-sm text-slate-600 mb-6 space-y-2">
          <li>• <strong>.env</strong> has VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, and VITE_SANITY_TOKEN</li>
          <li>• Deploy schemas: run <strong>npm run sanity:deploy</strong> in the sanity folder</li>
          <li>• Your Sanity API token has read/write permissions</li>
          <li>• Internet connection is working</li>
        </ul>
        {error && (
          <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>
        )}
        <Button onClick={onRetry}>Retry Connection</Button>
      </Card>
    </div>
  );
}
