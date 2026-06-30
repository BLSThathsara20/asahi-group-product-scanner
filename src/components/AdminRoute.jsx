import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { PageSkeleton } from './ui/PageLayout';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PageContainer } from './ui/PageLayout';

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <PageSkeleton />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <PageContainer width="wide">
        <Card className="p-8 text-center max-w-md mx-auto">
          <p className="text-slate-800 font-medium">Access restricted</p>
          <p className="text-sm text-slate-500 mt-2">
            Only admins can open this page. Contact your administrator if you need access.
          </p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            Go back
          </Button>
        </Card>
      </PageContainer>
    );
  }

  return children;
}

/** Redirect non-admins away from admin-only routes. */
export function AdminRedirect({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
