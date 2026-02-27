-- Add reminder_count to items table for low-stock notifications
-- When quantity <= reminder_count, show "low stock, want to restock" notification
-- Default 1: notify when 1 or fewer items left

ALTER TABLE items ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 1;

-- Optional: backfill existing items with default
UPDATE items SET reminder_count = 1 WHERE reminder_count IS NULL;
