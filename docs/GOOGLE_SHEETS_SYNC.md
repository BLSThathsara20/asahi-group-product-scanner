# Google Sheets sync (frontend trigger)

Your sheet: [Asahi Spare Parts Inventory](https://docs.google.com/spreadsheets/d/1CHpGzVxM47r1QOm7OdtLUDlrZiPdoV-22ykakWqxZBs/edit)

The app can **trigger an immediate sync** after any spare-part change (add, edit, check-in/out, delete). This works alongside a scheduled trigger if you still use one.

## 1. Add trigger endpoint to Apps Script

In the same Apps Script project as `syncInventoryFromSanity`, add:

```javascript
function doGet(e) {
  try {
    const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
    if (secret && e?.parameter?.secret !== secret) {
      return json_({ ok: false, error: 'Unauthorized' });
    }
    syncInventoryFromSanity();
    return json_({ ok: true, syncedAt: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 2. Deploy as Web App

1. **Deploy → New deployment → Web app**
2. Execute as: **Me**
3. Who has access: **Anyone**
4. Copy the **Web app URL**

## 3. Script Properties

| Property | Value |
|----------|--------|
| `WEBHOOK_SECRET` | A long random string (optional but recommended) |
| `SANITY_PROJECT_ID` | From `.env` |
| `SANITY_DATASET` | `production` |
| `SANITY_TOKEN` | Read token |
| `SHEET_NAME` | Your tab name |

## 4. App environment

Local `.env`:

```
VITE_GOOGLE_SHEETS_SYNC_URL=https://script.google.com/macros/s/XXXX/exec
VITE_GOOGLE_SHEETS_SYNC_SECRET=your-webhook-secret
```

GitHub Pages: add the same as **Actions secrets** and wire in `deploy.yml`.

## 5. How it behaves

- After inventory changes, the app calls your web app URL (debounced ~2.5s).
- Apps Script runs `syncInventoryFromSanity()` and updates the sheet.
- Scheduled trigger (every 10 min) can remain as a backup.
