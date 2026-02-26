-- ============================================================
-- Optional: Ensure schema supports voice input & store location
-- Run in Supabase SQL Editor if needed
-- ============================================================
-- No schema changes required. The app uses:
-- - items.model_name, items.sku_code (nullable, for backward compatibility)
-- - items.store_location (TEXT - stores values like "1st row - left", "Not in rack", etc.)
-- - items.vehicle_model (TEXT - stores make like TOYOTA, BMW, or custom)
--
-- If you haven't run SUPABASE_ADD_MODEL_SKU.sql, run this:
ALTER TABLE items ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sku_code TEXT;
