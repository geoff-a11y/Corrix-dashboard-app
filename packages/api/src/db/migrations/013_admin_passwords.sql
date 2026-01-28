-- Add password support for admin accounts
-- Allows team_admin users to login with username/password in addition to magic links

ALTER TABLE admin_accounts ADD COLUMN password_hash TEXT;

-- Set password for Tony and Dominik (bcrypt hash of 'pratt2024')
UPDATE admin_accounts
SET password_hash = '$2b$10$VI3LXn.OdsA9AEFm6vNS9OKTaahumm75HfD6cqPgTEJdBEcyzBYQa'
WHERE email IN ('tony@creative-ai.academy', 'dominik@creative-ai.academy');
