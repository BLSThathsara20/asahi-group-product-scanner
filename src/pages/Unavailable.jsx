import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Unavailable({ error, onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="p-8 max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Database Unavailable</h1>
        <p className="text-slate-600 mb-4">
          Cannot connect to the database. Please check:
        </p>
        <ul className="text-left text-sm text-slate-600 mb-6 space-y-2">
          <li>• <strong>.env</strong> has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
          <li>• Run <strong>SUPABASE_FULL_SETUP.sql</strong> in Supabase SQL Editor</li>
          <li>• <strong>404 on setup_complete?</strong> Run the SQL above to create the function</li>
          <li>• Your Supabase project is active (not paused)</li>
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
