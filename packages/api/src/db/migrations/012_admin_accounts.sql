-- Admin accounts and magic link authentication
-- Supports: admin, team_admin roles with team-scoped access

-- Admin accounts table (for dashboard access, separate from users table)
CREATE TABLE admin_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_admin')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_ids UUID[] DEFAULT '{}', -- For team_admin: which teams they can access
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link tokens for passwordless auth
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_account_id UUID NOT NULL REFERENCES admin_accounts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL CHECK (token_type IN ('magic_link', 'refresh')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_accounts_email ON admin_accounts(email);
CREATE INDEX idx_admin_accounts_organization ON admin_accounts(organization_id);
CREATE INDEX idx_admin_accounts_role ON admin_accounts(role);
CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_admin ON auth_tokens(admin_account_id);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);

-- Updated at trigger
CREATE TRIGGER update_admin_accounts_updated_at
  BEFORE UPDATE ON admin_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed the existing admin
INSERT INTO admin_accounts (email, name, role, organization_id)
VALUES (
  'geoff.gibbins@gmail.com',
  'Geoff Gibbins',
  'admin',
  '00000000-0000-0000-0000-000000000001'
);

-- Create Pratt instructor accounts (team_admin role)
INSERT INTO admin_accounts (email, name, role, organization_id, team_ids)
VALUES
  (
    'tony@creative-ai.academy',
    'Tony (Pratt Instructor)',
    'team_admin',
    '00000000-0000-0000-0000-000000000001',
    ARRAY['40000000-0000-0000-0000-000000000001']::UUID[]
  ),
  (
    'dominik@creative-ai.academy',
    'Dominik (Pratt Instructor)',
    'team_admin',
    '00000000-0000-0000-0000-000000000001',
    ARRAY['40000000-0000-0000-0000-000000000001']::UUID[]
  );
