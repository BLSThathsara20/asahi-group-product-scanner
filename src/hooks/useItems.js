import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    const { data, err } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return { items, loading, error, refetch: fetchItems };
}
