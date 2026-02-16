# Where Data is Stored

## Database (Supabase)

All inventory data, users, and transactions are stored in **Supabase** (PostgreSQL):

- **Items** – `items` table
- **Transactions** – `item_transactions` table  
- **Users/Profiles** – `profiles` table
- **Invites** – `user_invites` table

## Product Images (Supabase Storage)

Product images are stored in **Supabase Storage**:

- **Bucket:** `item-photos`
- **Path:** `items/{timestamp}-{random}.{ext}`
- **Access:** Public (images are viewable via URL)

Images are compressed before upload (max 0.5MB, 1200px) using `browser-image-compression`.

---

## Fix: setup_complete 404 Error

If you see `POST .../rpc/setup_complete 404 (Not Found)`:

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run the full `SUPABASE_FULL_SETUP.sql` file
3. Or run just this part:

```sql
CREATE OR REPLACE FUNCTION public.setup_complete() RETURNS BOOLEAN 
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM profiles WHERE role = 'super_admin');
$$;
GRANT EXECUTE ON FUNCTION public.setup_complete() TO anon;
GRANT EXECUTE ON FUNCTION public.setup_complete() TO authenticated;
```

---

## "runtime.lastError" in Console

The message `Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist` is usually from a **Chrome extension** (e.g. React DevTools, ad blockers), not from this app. It can be ignored.
