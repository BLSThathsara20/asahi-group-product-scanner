-- Add user activation flow: admin creates invite with temp password, user opens link to activate
-- Run in Supabase SQL Editor

-- Add columns to user_invites
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS temp_password TEXT;
ALTER TABLE user_invites ADD COLUMN IF NOT EXISTS full_name TEXT;

-- RPC: Get invite by token (for activation page - returns email, full_name, role only)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(t TEXT)
RETURNS TABLE(email TEXT, full_name TEXT, role TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.email, i.full_name, i.role
  FROM user_invites i
  WHERE i.token = t;
$$;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(TEXT) TO authenticated;

-- RPC: Verify temp password and return success (for activation flow)
CREATE OR REPLACE FUNCTION public.verify_invite_temp_password(t TEXT, pwd TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_invites
    WHERE token = t AND temp_password = pwd
  );
$$;
GRANT EXECUTE ON FUNCTION public.verify_invite_temp_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_invite_temp_password(TEXT, TEXT) TO authenticated;
