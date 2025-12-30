-- Migration: Add permissions column to models table
-- Run this in Supabase SQL Editor if you have existing models

ALTER TABLE models 
ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '';

-- Update existing models to have empty permissions if needed
UPDATE models 
SET permissions = '' 
WHERE permissions IS NULL;

