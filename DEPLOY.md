# Deploy AsahiGroup Inventory to Vercel

## Quick Deploy

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project**.
3. Import `BLSThathsara20/asahi-group-product-scanner` (or your fork).
4. **Environment Variables** – Add these in the project settings:
   - `VITE_SUPABASE_URL` – Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – Your Supabase anon/public key
5. Click **Deploy**.

Vercel will build with `npm run build` and serve the app. Your live URL will be something like `asahi-group-product-scanner.vercel.app`.

## Supabase Auth Settings

After deploying, update Supabase:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**, e.g.:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**`

## Custom Domain (Optional)

In Vercel: Project → **Settings** → **Domains** → add your domain.
