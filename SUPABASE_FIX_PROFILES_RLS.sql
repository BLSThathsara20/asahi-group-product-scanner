-- ============================================================
-- Fix: "infinite recursion detected in policy for relation profiles"
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. Ensure profiles exist for all auth users (in case trigger ran late)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  CASE WHEN (SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin') = 0 THEN 'super_admin' ELSE 'worker' END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 1. Create helper that bypasses RLS (no recursion)
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TEXT
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Drop old policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;

-- 2b. Add policy for users to update own profile (full_name, address, phone)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Recreate using get_my_role() (no profiles subquery = no recursion)
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT
  USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT
  WITH CHECK (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE
  USING (public.get_my_role() IN ('super_admin', 'admin'));

CREATE POLICY "Super admin can delete profiles" ON profiles FOR DELETE
  USING (public.get_my_role() = 'super_admin');
