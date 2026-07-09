import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getDeletionLogs } from '../services/itemService';
import { getProfilesByIds } from '../services/userService';
import { displayPerformer } from '../lib/performer';
import { Card } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import {
  PageContainer,
  PageHeader,
  PageSkeleton,
  EmptyState,
} from '../components/ui/PageLayout';

export function DeletedItemsLog() {
  const { isAdmin } = useAuth();
  const { error } = useNotification();
  const [logs, setLogs] = useState([]);
  const [performerNames, setPerformerNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDeletionLogs({ limit: 200 });
      setLogs(data);
      const ids = [...new Set(data.map((log) => log.deleted_by).filter(Boolean))];
      if (ids.length > 0) {
        const names = await getProfilesByIds(ids);
        setPerformerNames(names);
      } else {
        setPerformerNames({});
      }
    } catch (err) {
      error(err.message || 'Failed to load deletion log');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page, pageSize]);

  if (!isAdmin) {
    return (
      <PageContainer>
        <EmptyState
          icon="warning"
          title="Admin access required"
          description="Only admins can view the deletion log"
        />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Deleted spare parts"
        subtitle="Permanent removals are recorded with who deleted each part and when"
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <p className="text-sm text-slate-500">
            {logs.length} deletion{logs.length === 1 ? '' : 's'} recorded
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {paginatedLogs.map((log) => {
            const who = displayPerformer(
              { performed_by: log.deleted_by, performer_name: log.deleter_name },
              performerNames
            );
            return (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{log.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                    {log.qr_id && (
                      <span className="font-mono text-xs text-slate-400">{log.qr_id}</span>
                    )}
                    {log.category && <span>{log.category}</span>}
                    {log.vehicle_model && <span>Vehicle: {log.vehicle_model}</span>}
                    {log.agl_number && <span>AGL: {log.agl_number}</span>}
                    {log.quantity != null && <span>Qty: {log.quantity}</span>}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Removed by <span className="font-medium text-slate-800">{who || 'Unknown user'}</span>
                  </p>
                </div>
                <span className="text-sm text-slate-500 whitespace-nowrap shrink-0">
                  {new Date(log.deleted_at).toLocaleString()}
                </span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="p-8 text-center text-slate-500">No deleted parts recorded yet</div>
          )}
        </div>
        <Pagination
          page={page}
          totalItems={logs.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>
    </PageContainer>
  );
}
