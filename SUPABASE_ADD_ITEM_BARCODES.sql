-- Add item_barcodes table for multiple barcodes per item (max 4 total: qr_id + 3 alt)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS item_barcodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barcode)
);

CREATE INDEX IF NOT EXISTS idx_item_barcodes_item_id ON item_barcodes(item_id);
CREATE INDEX IF NOT EXISTS idx_item_barcodes_barcode ON item_barcodes(barcode);

ALTER TABLE item_barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for item_barcodes" ON item_barcodes;
CREATE POLICY "Allow all for item_barcodes" ON item_barcodes FOR ALL USING (true) WITH CHECK (true);
