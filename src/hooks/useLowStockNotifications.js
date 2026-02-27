import { useState, useEffect, useCallback } from 'react';
import { getLowStockItems } from '../services/itemService';

export function useLowStockNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const list = await getLowStockItems();
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [refresh]);

  return { items, count: items.length, loading, refresh };
}
