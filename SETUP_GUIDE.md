# Complete Setup Guide – AsahiGroup Inventory

Follow these steps in order. You’ll create the database, tables, storage, auth, and your first user.

**One SQL file for everything:** `SUPABASE_FULL_SETUP.sql`

---

## Step 1: Create Supabase Project

1. Go to **https://supabase.com** and sign in (or create an account).
2. Click **New Project**.
3. Fill in:
   - **Name:** `asahigroup-inventory` (or any name)
   - **Database Password:** Choose a strong password and save it
   - **Region:** Choose closest to you (e.g. London for UK)
4. Click **Create new project** and wait 1–2 minutes.

---

## Step 2: Get API Keys

1. In the left sidebar, click the **gear icon** (Project Settings).
2. Click **API** in the left menu.
3. Copy these values:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## Step 3: Create `.env` File

1. Open your project folder in a terminal.
2. Run:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and paste your values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Save the file.

---

## Step 4: Run All SQL (one file)

1. In Supabase, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `SUPABASE_FULL_SETUP.sql` in your project.
4. Copy the **entire** file contents and paste into the SQL Editor.
5. Click **Run**.
6. You should see "Success. No rows returned."

This creates: items, item_transactions, profiles, user_invites, auth trigger, setup_complete function, and storage bucket `item-photos`.

**If storage bucket fails:** Create it manually in **Storage** → **New bucket** → name `item-photos`, set Public ON.

---

## Step 5: Disable Email Confirmation (recommended for setup)

1. Go to **Authentication** → **Providers** (left sidebar).
2. Click **Email**.
3. Turn **OFF** "Confirm email".
4. Click **Save**.

---

## Step 6: Create Your First User (Super Admin)

1. In your project folder, run:
   ```bash
   npm install
   npm run dev
   ```
2. Open **http://localhost:5173** in your browser.
3. You should see the Login page with a **"Create first admin"** link.
4. Click **Create first admin**.
5. Fill in:
   - **Email:** `blsthathsara@gmail.com` (or your email)
   - **Password:** `ABcd12##` (or a strong password)
   - **Full Name:** (optional)
6. Click **Create Super Admin**.
7. You should be logged in and see the Dashboard.

---

## Step 7: Verify Everything Works

1. **Add an item:** Go to **Add Item**, enter a name, optionally add a photo, and save.
2. **Check inventory:** Go to **Inventory** and confirm the item appears.
3. **Health check:** Go to **More** → **Health** and confirm Supabase shows ✓ Connected.

---

## Troubleshooting

| Problem | Solution |
|--------|----------|
| "Create first admin" link not showing | Run `SUPABASE_MIGRATION_V3_setup_check.sql` |
| Can't log in after signup | Disable "Confirm email" in Auth → Providers → Email |
| Photo upload fails | Ensure `item-photos` bucket exists and has a policy |
| "relation does not exist" | Run Step 4 and Step 6 SQL in order |
| RLS policy errors | Run full `SUPABASE_MIGRATION_V2.sql` |

---

## Summary Checklist

- [ ] Supabase project created
- [ ] `.env` file with URL and anon key
- [ ] `SUPABASE_FULL_SETUP.sql` run in SQL Editor
- [ ] Email confirmation disabled
- [ ] First super admin created via `/setup`
- [ ] Test: add item, view inventory, check health
