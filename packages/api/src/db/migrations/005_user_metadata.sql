-- Migration 005: User Metadata (Roles & Departments)
-- Adds organizational structure for benchmarking

-- Departments within organizations
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

-- Role definitions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  category VARCHAR(50) CHECK (category IN (
    'technical',      -- Engineers, developers
    'analytical',     -- Analysts, data scientists
    'creative',       -- Writers, designers
    'managerial',     -- Managers, directors
    'operational',    -- Operations, support
    'strategic',      -- Executives, strategists
    'other'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

-- Extended user metadata
CREATE TABLE IF NOT EXISTS user_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Organizational placement
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,

  -- Seniority (for role-adjusted benchmarks)
  seniority_level VARCHAR(20) CHECK (seniority_level IN (
    'entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive'
  )),

  -- Experience context
  years_in_role INTEGER,
  years_with_ai_tools INTEGER,

  -- Preferences (opt-in data)
  primary_use_case VARCHAR(100),  -- e.g., "code review", "content creation"

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger
CREATE TRIGGER update_user_metadata_updated_at
  BEFORE UPDATE ON user_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_metadata_dept ON user_metadata(department_id);
CREATE INDEX IF NOT EXISTS idx_user_metadata_role ON user_metadata(role_id);
CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_category ON roles(category);
