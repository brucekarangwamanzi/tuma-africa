-- Fix imageUrl column to support base64 images (which can be very long)
-- Run this as postgres superuser: sudo -u postgres psql -d tuma_africa_cargo -f fix-imageurl-column.sql

ALTER TABLE products ALTER COLUMN "imageUrl" TYPE TEXT;

-- Verify the change
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'imageUrl';

