import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStockAlerts } from '../services/itemService';
import { groupOrderAlertsByMake } from '../lib/stockTree';

export function useLowStockNotifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getStockAlerts();
      setAlerts(list);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const groups = useMemo(() => groupOrderAlertsByMake(alerts), [alerts]);

  return { alerts, groups, count: alerts.length, loading, refresh };
}
