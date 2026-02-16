-- ============================================================
-- AsahiGroup Inventory - Delete & Health Migrations
-- Run this in Supabase SQL Editor after SUPABASE_FULL_SETUP.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. ITEMS: Super admin only can DELETE
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage items" ON items;

CREATE POLICY "Authenticated users can select items" ON items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert items" ON items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update items" ON items
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Super admin can delete items" ON items
  FOR DELETE USING (public.get_my_role() = 'super_admin');

-- ------------------------------------------------------------
-- 2. HEALTH: RPC to get database size (for Health page)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'db_size_pretty', pg_size_pretty(pg_database_size(current_database())),
    'free_tier_limit_mb', 500,
    'free_tier_limit_bytes', 500 * 1024 * 1024
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_database_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_stats() TO anon;

-- ------------------------------------------------------------
-- 3. STORAGE: Super admin can delete item photos
-- ------------------------------------------------------------
CREATE POLICY "Super admin can delete item-photos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'item-photos'
    AND public.get_my_role() = 'super_admin'
  );
