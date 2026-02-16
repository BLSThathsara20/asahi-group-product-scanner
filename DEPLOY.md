# Deploy to GitHub Pages

Your app is configured to deploy automatically to GitHub Pages when you push to `main`.

## One-time setup

### 1. Add Supabase secrets

The build needs your Supabase credentials. Add them as repository secrets:

1. Go to **GitHub** → your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:
   - `VITE_SUPABASE_URL` – your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – your Supabase anon/public key

### 2. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

### 3. Push to trigger deploy

```bash
git add -A
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

The workflow will build and deploy. After it finishes, your app will be live at:

**https://blsthathsara20.github.io/asahi-group-product-scanner/**

---

**Note:** If you skip adding the Supabase secrets, the build will still succeed, but the app will not connect to your database until you add them and redeploy.
