-- ============================================================
-- Allow all users to update their own profile (username, address, phone)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Policy: any authenticated user can update their own row
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Trigger: when non-admin updates own profile, only allow full_name, address, phone_number
--    (prevents users from changing their own role or email)
CREATE OR REPLACE FUNCTION public.profiles_restrict_self_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.id = auth.uid() AND public.get_my_role() NOT IN ('super_admin', 'admin') THEN
    NEW.role := OLD.role;
    NEW.email := OLD.email;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_before_update_restrict ON profiles;
CREATE TRIGGER profiles_before_update_restrict
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_restrict_self_update();
