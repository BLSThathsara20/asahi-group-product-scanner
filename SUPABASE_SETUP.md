# Supabase Setup Guide for AsahiGroup Inventory

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, name the project (e.g. `asahigroup-inventory`)
4. Set a database password and select a region (e.g. London for UK)
5. Click **Create new project**

## 2. Get Your API Keys

1. In the Supabase dashboard, go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`

## 3. Create Environment File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and paste your URL and anon key

## 4. Create Database Tables

In Supabase, go to **SQL Editor** and run:

```sql
-- Items table (inventory)
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  photo_url TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'out', 'reserved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item transactions (check-in/check-out history)
CREATE TABLE item_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  recipient_name TEXT,
  purpose TEXT,
  responsible_person TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo (replace with proper auth later)
CREATE POLICY "Allow all for items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for transactions" ON item_transactions FOR ALL USING (true) WITH CHECK (true);
```

## 5. Enable Storage for Item Photos (Optional)

Photos will be skipped if storage isn't set up. To enable:

1. Go to **Storage** in Supabase dashboard
2. Create a bucket named `item-photos`
3. Set it to **Public** if you want photos viewable without auth
4. Add policy: **Storage** → **Policies** → **New Policy** → "For full customization"
   - Policy: `(bucket_id = 'item-photos')`
   - Operations: All (or at least INSERT, SELECT)

## 6. Auth & Roles (Migration V2)

Run the SQL in `SUPABASE_MIGRATION_V2.sql` in the SQL Editor. This adds:

- `profiles` table (user roles: super_admin, admin, inventory_manager, worker)
- `user_invites` table (for admin to invite users)
- Auth trigger (first user = super admin)
- RLS policies for authenticated access

## 6b. Setup Check (Migration V3) – Security

Run `SUPABASE_MIGRATION_V3_setup_check.sql` to add `setup_complete()` function. This hides the "Create first admin" link on the Login page once a super_admin exists.

## 7. Disable Email Confirmation (optional, for easier setup)

In **Authentication** → **Providers** → **Email**, turn off "Confirm email" if you want to log in immediately without verifying the email.

## 8. Test Connection

Run the app with `npm run dev`:

1. Go to `/setup` to create the first super admin (e.g. blsthathsara@gmail.com / ABcd12##)
2. Sign in at `/login`
3. Add an item to verify inventory works

---

**Note:** If you skip Storage setup, item photos won't be saved but the app will work. Items will be created without images.
