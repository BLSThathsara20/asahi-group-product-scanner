-- Add model_name and sku_code to items table
-- Run this in Supabase SQL Editor

ALTER TABLE items ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS sku_code TEXT;
