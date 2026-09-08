/*
# Add profile type and setup wizard data to profiles

1. Modified Tables
   - `profiles`: adds `profile_type` (text, nullable) for student/employee/freelancer/business,
     `setup_completed` (boolean, default false) to track wizard completion,
     and `wizard_data` (jsonb) to store mode-specific financial information.
2. Security
   - No RLS changes — existing owner-scoped policies cover new columns.
3. Notes
   - wizard_data stores different fields per mode (allowance, salary, revenue, etc.)
   - setup_completed gates the wizard: false = show wizard, true = go to dashboard
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS setup_completed boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wizard_data jsonb DEFAULT '{}'::jsonb;
