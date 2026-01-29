-- Restructure admin accounts for new organization structure
-- Organizations (created by sync service on startup):
--   1. Corrix (c0000000-0000-0000-0000-000000000001) - Chrome extension users
--   2. Corrix assessment (a0000000-0000-0000-0000-000000000001) - Assessment users
--   3. Pratt Institute (p0000000-0000-0000-0000-000000000001) - AI Design pilot

-- Update geoff's admin account to have no org restriction (admin sees all)
UPDATE admin_accounts
SET organization_id = NULL
WHERE email = 'geoff.gibbins@gmail.com';

-- Add new admin account for hello@human-machines.com
INSERT INTO admin_accounts (email, name, role, organization_id)
VALUES (
  'hello@human-machines.com',
  'Human Machines',
  'admin',
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  organization_id = NULL;

-- Update Tony's account to Pratt Institute org with AI Design pilot team access
UPDATE admin_accounts
SET
  organization_id = 'p0000000-0000-0000-0000-000000000001',
  team_ids = ARRAY['p0000000-0000-0000-0000-000000000002']::UUID[]
WHERE email = 'tony@creative-ai.academy';

-- Update Dominik's account to Pratt Institute org with AI Design pilot team access
UPDATE admin_accounts
SET
  organization_id = 'p0000000-0000-0000-0000-000000000001',
  team_ids = ARRAY['p0000000-0000-0000-0000-000000000002']::UUID[]
WHERE email = 'dominik@creative-ai.academy';
