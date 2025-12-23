-- Seed demo data for development
-- This creates a sample organization with teams and users

-- Insert demo organization
INSERT INTO organizations (id, name, domain) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo.corrix.ai');

-- Insert demo teams
INSERT INTO teams (id, organization_id, name) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Product'),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Design'),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Marketing'),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Sales');

-- Create function to generate random users with scores
CREATE OR REPLACE FUNCTION generate_demo_users() RETURNS void AS $$
DECLARE
  team_ids UUID[] := ARRAY[
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0001-000000000005'
  ];
  team_sizes INTEGER[] := ARRAY[45, 12, 8, 15, 22];
  i INTEGER;
  j INTEGER;
  v_user_id UUID;
  base_score INTEGER;
  d DATE;
BEGIN
  FOR i IN 1..5 LOOP
    FOR j IN 1..team_sizes[i] LOOP
      v_user_id := uuid_generate_v4();

      -- Insert user
      INSERT INTO users (id, organization_id, team_id, anonymous_id, first_seen_at)
      VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000001',
        team_ids[i],
        'demo_user_' || i || '_' || j,
        NOW() - (random() * INTERVAL '90 days')
      );

      -- Generate daily scores for last 30 days
      base_score := 40 + (random() * 35)::INTEGER;
      d := CURRENT_DATE - 30;

      WHILE d <= CURRENT_DATE LOOP
        INSERT INTO daily_scores (
          user_id, date, corrix_score,
          results_score, relationship_score, resilience_score,
          signal_count
        ) VALUES (
          v_user_id, d,
          base_score + (random() * 10 - 5)::INTEGER,
          base_score + (random() * 15 - 7)::INTEGER,
          base_score + (random() * 12 - 6)::INTEGER,
          base_score + (random() * 10 - 5)::INTEGER,
          (random() * 20 + 5)::INTEGER
        )
        ON CONFLICT (user_id, date) DO NOTHING;

        d := d + 1;
      END LOOP;

    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT generate_demo_users();

-- Drop the function after use
DROP FUNCTION generate_demo_users();
