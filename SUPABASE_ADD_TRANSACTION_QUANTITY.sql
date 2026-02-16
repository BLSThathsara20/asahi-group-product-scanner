-- Add quantity to item_transactions for checkout/check-in
-- Run in Supabase SQL Editor

ALTER TABLE item_transactions
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL;
