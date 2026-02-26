-- ============================================================
-- Add categories table for parent/child category management
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read categories" ON categories;
CREATE POLICY "Authenticated can read categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage categories (requires get_my_role from main setup)
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Admins can insert categories" ON categories
  FOR INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Admins can update categories" ON categories
  FOR UPDATE USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Admins can delete categories" ON categories
  FOR DELETE USING (public.get_my_role() IN ('super_admin', 'admin'));
