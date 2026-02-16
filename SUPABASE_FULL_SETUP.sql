-- ============================================================
-- AsahiGroup Inventory - Complete Supabase Setup
-- Run this ENTIRE file in Supabase SQL Editor (one go)
-- ============================================================
-- ------------------------------------------------------------
-- 1. ITEMS TABLE (inventory)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  photo_url TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'out', 'reserved')),
  added_date TIMESTAMPTZ DEFAULT NOW(),
  last_used_date TIMESTAMPTZ,
  vehicle_model TEXT,
  store_location TEXT,
  added_by UUID REFERENCES auth.users(id),
  last_used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add new columns if table already exists (for migrations)
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'items'
    AND column_name = 'added_date'
) THEN
ALTER TABLE items
ADD COLUMN added_date TIMESTAMPTZ DEFAULT NOW();
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'items'
    AND column_name = 'last_used_date'
) THEN
ALTER TABLE items
ADD COLUMN last_used_date TIMESTAMPTZ;
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'items'
    AND column_name = 'vehicle_model'
) THEN
ALTER TABLE items
ADD COLUMN vehicle_model TEXT;
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'items'
    AND column_name = 'store_location'
) THEN
ALTER TABLE items
ADD COLUMN store_location TEXT;
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'items'
    AND column_name = 'added_by'
) THEN
ALTER TABLE items
ADD COLUMN added_by UUID REFERENCES auth.users(id);
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'items'
    AND column_name = 'last_used_by'
) THEN
ALTER TABLE items
ADD COLUMN last_used_by UUID REFERENCES auth.users(id);
END IF;
END $$;
-- ------------------------------------------------------------
-- 2. ITEM TRANSACTIONS TABLE (check-in/check-out history)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  recipient_name TEXT,
  purpose TEXT,
  responsible_person TEXT,
  vehicle_model TEXT,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'item_transactions'
    AND column_name = 'performed_by'
) THEN
ALTER TABLE item_transactions
ADD COLUMN performed_by UUID REFERENCES auth.users(id);
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'item_transactions'
    AND column_name = 'vehicle_model'
) THEN
ALTER TABLE item_transactions
ADD COLUMN vehicle_model TEXT;
END IF;
END $$;
-- ------------------------------------------------------------
-- 3. ITEMS & TRANSACTIONS - RLS (temporary, replaced later)
-- ------------------------------------------------------------
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for items" ON items;
DROP POLICY IF EXISTS "Allow all for transactions" ON item_transactions;
CREATE POLICY "Allow all for items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON item_transactions FOR ALL USING (true) WITH CHECK (true);
-- ------------------------------------------------------------
-- 4. PROFILES TABLE (user roles + contact)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (
    role IN (
      'super_admin',
      'admin',
      'inventory_manager',
      'worker'
    )
  ),
  address TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name = 'address'
) THEN
ALTER TABLE profiles
ADD COLUMN address TEXT;
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name = 'phone_number'
) THEN
ALTER TABLE profiles
ADD COLUMN phone_number TEXT;
END IF;
END $$;
-- Helper to avoid RLS recursion (profiles policy must not query profiles)
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TEXT LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
SELECT role
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;
$$;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR
SELECT USING (public.get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Admins can insert profiles" ON profiles FOR
INSERT WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Admins can update profiles" ON profiles FOR
UPDATE USING (public.get_my_role() IN ('super_admin', 'admin'));
CREATE POLICY "Super admin can delete profiles" ON profiles FOR DELETE USING (public.get_my_role() = 'super_admin');
CREATE POLICY "Users can insert own profile on signup" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
-- ------------------------------------------------------------
-- 5. AUTH TRIGGER (first user = super_admin)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE user_role TEXT;
invite_token TEXT;
BEGIN invite_token := NEW.raw_user_meta_data->>'invite_token';
IF invite_token IS NOT NULL THEN
SELECT role INTO user_role
FROM public.user_invites
WHERE token = invite_token
  AND email = NEW.email;
IF user_role IS NOT NULL THEN
DELETE FROM public.user_invites
WHERE token = invite_token;
ELSE user_role := 'worker';
END IF;
ELSE
SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM public.profiles
    ) = 0 THEN 'super_admin'
    ELSE 'worker'
  END INTO user_role;
END IF;
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ------------------------------------------------------------
-- 6. USER INVITES TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'inventory_manager', 'worker')),
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage invites" ON user_invites;
CREATE POLICY "Admins can manage invites" ON user_invites FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('super_admin', 'admin')
  )
);
-- ------------------------------------------------------------
-- 7. UPDATE ITEMS & TRANSACTIONS - require auth
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for items" ON items;
DROP POLICY IF EXISTS "Allow all for transactions" ON item_transactions;
CREATE POLICY "Authenticated users can manage items" ON items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage transactions" ON item_transactions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
-- ------------------------------------------------------------
-- 8. SETUP COMPLETE FUNCTION (hides "Create first admin" link)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_complete() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
SELECT EXISTS(
    SELECT 1
    FROM profiles
    WHERE role = 'super_admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.setup_complete() TO anon;
GRANT EXECUTE ON FUNCTION public.setup_complete() TO authenticated;
-- ------------------------------------------------------------
-- 9. STORAGE BUCKET (for product images)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true) ON CONFLICT (id) DO
UPDATE
SET public = true;
DROP POLICY IF EXISTS "Public read item-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload item-photos" ON storage.objects;
CREATE POLICY "Public read item-photos" ON storage.objects FOR
SELECT USING (bucket_id = 'item-photos');
CREATE POLICY "Authenticated upload item-photos" ON storage.objects FOR
INSERT WITH CHECK (
    bucket_id = 'item-photos'
    AND auth.role() = 'authenticated'
  );
-- ============================================================
-- DONE! Next steps:
-- 1. IMPORTANT: Disable "Confirm email" in Auth → Providers → Email
--    (Otherwise you'll get 400 "Email not confirmed" on login)
-- 2. Run: npm run dev
-- 3. Go to /setup and create your first super admin
-- ============================================================