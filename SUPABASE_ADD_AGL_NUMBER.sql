-- Add AGL number (optional) to items table

ALTER TABLE items ADD COLUMN IF NOT EXISTS agl_number TEXT;
