# Deploy to GitHub Pages

Your app deploys automatically to GitHub Pages when you push to `main`.

## One-time setup

### 1. Add Sanity & ImgBB secrets

The build bakes env vars into the static bundle. Add them as repository secrets:

1. Go to **GitHub** → your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Secret | Description |
|--------|-------------|
| `VITE_SANITY_PROJECT_ID` | Sanity project ID |
| `VITE_SANITY_DATASET` | Usually `production` |
| `VITE_SANITY_TOKEN` | API token with read/write access |
| `VITE_SANITY_API_VERSION` | e.g. `2024-01-01` |
| `VITE_IMGBB_API_KEY` | ImgBB key for image uploads |

Use the same values as your local `.env` file.

### 2. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

### 3. Push to trigger deploy

```bash
git push origin main
```

After the workflow succeeds, the app is live at:

**https://blsthathsara20.github.io/asahi-group-product-scanner/**

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Old “Database Unavailable / Supabase” page | Deploy failed — check **Actions** tab for errors |
| “Connection unavailable / Sanity not configured” | Add or fix `VITE_SANITY_*` secrets, then re-run deploy |
| `npm ci` lock file error | Run `npm install` locally, commit `package-lock.json`, push |
| 404 on refresh | Workflow copies `index.html` → `404.html` for SPA routing |

To re-deploy without code changes: **Actions** → **Deploy to GitHub Pages** → **Run workflow**.
