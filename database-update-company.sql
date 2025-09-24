-- Add company field to existing profiles table
-- Run this if you already have the database created

ALTER TABLE profiles ADD COLUMN company VARCHAR(255) AFTER full_name;