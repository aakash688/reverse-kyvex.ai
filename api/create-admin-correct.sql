-- Create admin user in Supabase
-- Run this in Supabase SQL Editor

INSERT INTO admins (id, email, password_hash, name, is_active, created_at)
VALUES (
  'a97e86eb-21a9-4e8b-ab80-785493c9ccfe',
  'aakashsingh688@gmail.com',
  '9d1de997f3a8e71c69d9d11a6911921290b7c76f544222d4ff446f24913a7a2f',
  'Aakash Singh',
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  is_active = true;

