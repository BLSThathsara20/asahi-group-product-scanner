-- Allow public (anonymous) read of items for shared item links
-- Run this if you want guests to view shared item details without logging in

CREATE POLICY "Allow public select items for share" ON items
  FOR SELECT
  USING (true);
