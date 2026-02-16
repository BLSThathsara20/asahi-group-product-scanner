# AsahiGroup Inventory

A mobile-first product inventory management app for garage & parts. Register items with photos, generate QR codes, and track check-in/check-out via QR scanning.

## Features

- **Mobile-first responsive** – Sticky bottom nav on mobile, sidebar on desktop
- **Expandable menu** – Tap ⊕ (More) for Reports, User Management
- **Auth & roles** – Super Admin, Admin, Inventory Manager, Worker
- **User management** – Admins can invite users, change roles, remove users
- **Dashboard** – Overview of inventory stats
- **Add Items** – Register items with name, description, category, photo
- **QR Codes** – Unique ID per item, downloadable as PDF
- **Scan QR** – Check out items (recipient, purpose, responsible person) or check in
- **Status** – In Stock, Out, Reserved
- **Reports** – Download inventory as PDF or CSV
- **Notifications** – Toast notifications for actions

## Tech Stack

- React 19 + Vite
- Tailwind CSS (light theme, Asahi red `rgb(193 58 42)`)
- Supabase (auth, database, optional storage)
- qrcode.react, html5-qrcode, jspdf

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) for step-by-step setup (recommended)
   - Or [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for reference
   - Run the base SQL (items, transactions)
   - Run [SUPABASE_MIGRATION_V2.sql](./SUPABASE_MIGRATION_V2.sql) for auth & roles
   - Copy `.env.example` to `.env` and add your Supabase URL and anon key

3. **Create first admin**
   - Go to `/setup` and create the super admin (e.g. blsthathsara@gmail.com / ABcd12##)

4. **Run**
   ```bash
   npm run dev
   ```

## Verify All (lint + test + build)

```bash
npm run verify
```

## Testing

```bash
npm run test        # Watch mode
npm run test:run    # Single run (for CI)
```

Tests cover: utils, health service, Button, StatusBadge, HealthCheck page.

## Health Check

Visit **More** → **Health** (or `/health`) to see:

- Supabase connection status and latency
- Auth session status

Useful for debugging connectivity and monitoring.

## Project Structure

```
src/
├── components/
│   ├── Layout/       # AppLayout, Header, DesktopNav, BottomNav
│   ├── ui/           # Button, Card, Input, StatusBadge
│   ├── QR/           # QRCodeDisplay, QRScanner
│   └── Inventory/    # CheckOutForm
├── context/          # AuthContext, NotificationContext
├── pages/            # Dashboard, Inventory, AddItem, ItemDetail, ScanQR, Reports, UserManagement
├── hooks/            # useItems
├── services/         # itemService, userService, reportService
└── lib/              # supabase, utils
```

## License

MIT
