# Sanity.io Setup

This app uses **Sanity** as the backend (replacing Supabase).

## 1. Environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SANITY_PROJECT_ID=your-project-id
VITE_SANITY_DATASET=production
VITE_SANITY_TOKEN=your-api-token
```

Create an API token at [sanity.io/manage](https://www.sanity.io/manage) → your project → **API** → **Tokens**. Use a token with **Editor** (read + write) permissions.

### Product images (ImgBB)

Item photos are uploaded to [ImgBB](https://imgbb.com/) and the URL is saved on each item in Sanity.

```
VITE_IMGBB_API_KEY=your-imgbb-api-key
```

Get your API key at [api.imgbb.com](https://api.imgbb.com/) (API v1).

## 2. Deploy schemas

From the `sanity` folder:

```bash
cd sanity
npm install
npm run schema
```

The schema script reads `VITE_SANITY_TOKEN` from the root `.env` automatically.

If deploy fails with **CorsOriginError**, your token was not loaded — run with an explicit token:

```bash
export SANITY_AUTH_TOKEN=your-token-with-deploy-studio-permission
npm run schema
```

Create the token at [sanity.io/manage](https://www.sanity.io/manage) → API → Tokens. Use **Editor** or a token that includes **Deploy Studio** permission.

```bash
cd sanity
npm run dev
```

Update `sanity/sanity.config.js` with your project ID and dataset, or set:

```
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production
```

## 3. First admin

1. Start the app: `npm run dev`
2. Go to `/setup` and create the super admin account
3. Sign in at `/login`

## Document types

| Type | Purpose |
|------|---------|
| `inventoryItem` | Spare parts / products |
| `inventoryTransaction` | Check in / check out history |
| `appUser` | App users (email + password) |
| `category` | Product categories |
| `userInvite` | Pending user activations |
| `itemBarcode` | Extra barcodes per item |

## Auth

Authentication is handled in-app (bcrypt passwords stored in `appUser` documents). Sessions are stored in browser localStorage.

## GitHub Pages deploy

Add these secrets in GitHub → Settings → Secrets:

- `VITE_SANITY_PROJECT_ID`
- `VITE_SANITY_DATASET`
- `VITE_SANITY_TOKEN`
