# How to Run AsahiGroup Inventory

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env (copy from .env.example and add your Supabase credentials)
cp .env.example .env
# Edit .env: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Run the app
npm run dev
```

Open **http://localhost:5173**

---

## Check Database Connection

### Option 1: Health Check Page (Recommended)

1. Run `npm run dev`
2. Go to **http://localhost:5173/setup** and create the first admin
3. Log in, then go to **More** → **Health** (or `/health`)
4. You'll see:
   - **Supabase** ✓ Connected (latency in ms) or ✕ with error
   - **Auth** ✓ Session active or No session

### Option 2: Add an Item

1. Log in
2. Go to **Add Item**
3. Add a test item with name and photo
4. If it appears in **Inventory** and **Dashboard**, DB is connected

### Option 3: Terminal Check

```bash
# Run tests (includes health service mock)
npm run test:run

# Build (fails if critical imports break)
npm run build
```

---

## Verify Setup Checklist

- [ ] `.env` exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Supabase tables created (see SUPABASE_SETUP.md)
- [ ] Supabase Storage bucket `item-photos` created (for product images)
- [ ] Run `SUPABASE_MIGRATION_V2.sql` for auth/roles
- [ ] **Email confirmation disabled** in Supabase (Auth → Providers → Email → turn OFF "Confirm email") — **required** if you get 400 "Email not confirmed" on login

## Troubleshooting: 400 Bad Request on Login

If you see `400 (Bad Request)` when signing in:

1. **"Email not confirmed"** — Your account exists but Supabase requires email verification. Fix: Supabase Dashboard → **Authentication** → **Providers** → **Email** → turn **OFF** "Confirm email" → Save. Then try logging in again.
2. **"Invalid credentials"** — Wrong email/password, or no account. Create the first admin via `/setup` if you haven't yet.

## Troubleshooting: 500 on profiles (infinite recursion)

If you see `500 Internal Server Error` when loading after login (profiles query fails with "infinite recursion detected in policy"):

1. Run `SUPABASE_FIX_PROFILES_RLS.sql` in Supabase SQL Editor.
2. Refresh the app and log in again.

---

## Frontend-Only Hosting (Vercel, Netlify, etc.)

1. Build: `npm run build`
2. Deploy the `dist/` folder
3. Set environment variables in your host:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. No backend needed – all data goes to Supabase

---

## Product Images

- **Storage:** Supabase Storage (free 1GB)
- **Flow:** Image selected → compressed (max 0.5MB, 1200px) → uploaded as File → URL saved in DB
- **No base64** – files uploaded directly to Supabase
- **Compression:** `browser-image-compression` reduces size before upload
