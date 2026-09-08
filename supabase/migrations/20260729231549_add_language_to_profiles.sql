/*
# Add language preference to profiles

1. Modified Tables
   - `profiles`: adds `language` column (text, default 'en') to store the user's
     preferred interface language. Supports values like 'en', 'ar', 'es', 'fr'.
2. Security
   - No RLS policy changes — existing owner-scoped policies cover the new column.
3. Notes
   - Defaults to English ('en'). Arabic ('ar') triggers RTL layout in the frontend.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
