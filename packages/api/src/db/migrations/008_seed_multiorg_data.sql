-- Migration: 008_seed_multiorg_data.sql
-- Seed data: 10 organizations with 8-12 teams each
-- Some organizations have an 'Innovation' team

-- Clear existing data (optional - for clean re-seed)
-- DELETE FROM behavioral_signals; DELETE FROM daily_scores; DELETE FROM users; DELETE FROM teams; DELETE FROM organizations;

-- Insert 10 organizations
INSERT INTO organizations (id, name, domain) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Acme Corporation', 'acme.com'),
  ('10000000-0000-0000-0000-000000000002', 'Globex Industries', 'globex.io'),
  ('10000000-0000-0000-0000-000000000003', 'Initech Solutions', 'initech.co'),
  ('10000000-0000-0000-0000-000000000004', 'Umbrella Corp', 'umbrella.com'),
  ('10000000-0000-0000-0000-000000000005', 'Stark Industries', 'stark.tech'),
  ('10000000-0000-0000-0000-000000000006', 'Wayne Enterprises', 'wayne.com'),
  ('10000000-0000-0000-0000-000000000007', 'Cyberdyne Systems', 'cyberdyne.ai'),
  ('10000000-0000-0000-0000-000000000008', 'Oscorp Technologies', 'oscorp.io'),
  ('10000000-0000-0000-0000-000000000009', 'Aperture Science', 'aperture.lab'),
  ('10000000-0000-0000-0000-000000000010', 'Massive Dynamic', 'massive.co')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, domain = EXCLUDED.domain;

-- Teams for Acme Corporation (10 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0001-000000000001', '10000000-0000-0000-0000-000000000001', 'Engineering'),
  ('20000000-0000-0001-0001-000000000002', '10000000-0000-0000-0000-000000000001', 'Product'),
  ('20000000-0000-0001-0001-000000000003', '10000000-0000-0000-0000-000000000001', 'Sales'),
  ('20000000-0000-0001-0001-000000000004', '10000000-0000-0000-0000-000000000001', 'Marketing'),
  ('20000000-0000-0001-0001-000000000005', '10000000-0000-0000-0000-000000000001', 'Innovation'),
  ('20000000-0000-0001-0001-000000000006', '10000000-0000-0000-0000-000000000001', 'Customer Success'),
  ('20000000-0000-0001-0001-000000000007', '10000000-0000-0000-0000-000000000001', 'Finance'),
  ('20000000-0000-0001-0001-000000000008', '10000000-0000-0000-0000-000000000001', 'HR'),
  ('20000000-0000-0001-0001-000000000009', '10000000-0000-0000-0000-000000000001', 'Legal'),
  ('20000000-0000-0001-0001-000000000010', '10000000-0000-0000-0000-000000000001', 'Operations')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Globex Industries (9 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0002-000000000001', '10000000-0000-0000-0000-000000000002', 'R&D'),
  ('20000000-0000-0001-0002-000000000002', '10000000-0000-0000-0000-000000000002', 'Product Design'),
  ('20000000-0000-0001-0002-000000000003', '10000000-0000-0000-0000-000000000002', 'Sales'),
  ('20000000-0000-0001-0002-000000000004', '10000000-0000-0000-0000-000000000002', 'Marketing'),
  ('20000000-0000-0001-0002-000000000005', '10000000-0000-0000-0000-000000000002', 'Innovation'),
  ('20000000-0000-0001-0002-000000000006', '10000000-0000-0000-0000-000000000002', 'Support'),
  ('20000000-0000-0001-0002-000000000007', '10000000-0000-0000-0000-000000000002', 'IT'),
  ('20000000-0000-0001-0002-000000000008', '10000000-0000-0000-0000-000000000002', 'Finance'),
  ('20000000-0000-0001-0002-000000000009', '10000000-0000-0000-0000-000000000002', 'Strategy')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Initech Solutions (8 teams, no Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0003-000000000001', '10000000-0000-0000-0000-000000000003', 'Development'),
  ('20000000-0000-0001-0003-000000000002', '10000000-0000-0000-0000-000000000003', 'QA'),
  ('20000000-0000-0001-0003-000000000003', '10000000-0000-0000-0000-000000000003', 'DevOps'),
  ('20000000-0000-0001-0003-000000000004', '10000000-0000-0000-0000-000000000003', 'Business Development'),
  ('20000000-0000-0001-0003-000000000005', '10000000-0000-0000-0000-000000000003', 'Account Management'),
  ('20000000-0000-0001-0003-000000000006', '10000000-0000-0000-0000-000000000003', 'Professional Services'),
  ('20000000-0000-0001-0003-000000000007', '10000000-0000-0000-0000-000000000003', 'Finance'),
  ('20000000-0000-0001-0003-000000000008', '10000000-0000-0000-0000-000000000003', 'Admin')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Umbrella Corp (12 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0004-000000000001', '10000000-0000-0000-0000-000000000004', 'Research'),
  ('20000000-0000-0001-0004-000000000002', '10000000-0000-0000-0000-000000000004', 'Development'),
  ('20000000-0000-0001-0004-000000000003', '10000000-0000-0000-0000-000000000004', 'Clinical Trials'),
  ('20000000-0000-0001-0004-000000000004', '10000000-0000-0000-0000-000000000004', 'Manufacturing'),
  ('20000000-0000-0001-0004-000000000005', '10000000-0000-0000-0000-000000000004', 'Quality Control'),
  ('20000000-0000-0001-0004-000000000006', '10000000-0000-0000-0000-000000000004', 'Innovation'),
  ('20000000-0000-0001-0004-000000000007', '10000000-0000-0000-0000-000000000004', 'Regulatory'),
  ('20000000-0000-0001-0004-000000000008', '10000000-0000-0000-0000-000000000004', 'Sales'),
  ('20000000-0000-0001-0004-000000000009', '10000000-0000-0000-0000-000000000004', 'Marketing'),
  ('20000000-0000-0001-0004-000000000010', '10000000-0000-0000-0000-000000000004', 'Legal'),
  ('20000000-0000-0001-0004-000000000011', '10000000-0000-0000-0000-000000000004', 'HR'),
  ('20000000-0000-0001-0004-000000000012', '10000000-0000-0000-0000-000000000004', 'Security')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Stark Industries (11 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0005-000000000001', '10000000-0000-0000-0000-000000000005', 'Advanced Research'),
  ('20000000-0000-0001-0005-000000000002', '10000000-0000-0000-0000-000000000005', 'Weapons Division'),
  ('20000000-0000-0001-0005-000000000003', '10000000-0000-0000-0000-000000000005', 'Clean Energy'),
  ('20000000-0000-0001-0005-000000000004', '10000000-0000-0000-0000-000000000005', 'AI Lab'),
  ('20000000-0000-0001-0005-000000000005', '10000000-0000-0000-0000-000000000005', 'Innovation'),
  ('20000000-0000-0001-0005-000000000006', '10000000-0000-0000-0000-000000000005', 'Manufacturing'),
  ('20000000-0000-0001-0005-000000000007', '10000000-0000-0000-0000-000000000005', 'Engineering'),
  ('20000000-0000-0001-0005-000000000008', '10000000-0000-0000-0000-000000000005', 'Marketing'),
  ('20000000-0000-0001-0005-000000000009', '10000000-0000-0000-0000-000000000005', 'Sales'),
  ('20000000-0000-0001-0005-000000000010', '10000000-0000-0000-0000-000000000005', 'Finance'),
  ('20000000-0000-0001-0005-000000000011', '10000000-0000-0000-0000-000000000005', 'Legal')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Wayne Enterprises (10 teams, no Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0006-000000000001', '10000000-0000-0000-0000-000000000006', 'Applied Sciences'),
  ('20000000-0000-0001-0006-000000000002', '10000000-0000-0000-0000-000000000006', 'Biotech'),
  ('20000000-0000-0001-0006-000000000003', '10000000-0000-0000-0000-000000000006', 'Medical'),
  ('20000000-0000-0001-0006-000000000004', '10000000-0000-0000-0000-000000000006', 'Aerospace'),
  ('20000000-0000-0001-0006-000000000005', '10000000-0000-0000-0000-000000000006', 'Electronics'),
  ('20000000-0000-0001-0006-000000000006', '10000000-0000-0000-0000-000000000006', 'Real Estate'),
  ('20000000-0000-0001-0006-000000000007', '10000000-0000-0000-0000-000000000006', 'Shipping'),
  ('20000000-0000-0001-0006-000000000008', '10000000-0000-0000-0000-000000000006', 'Foundation'),
  ('20000000-0000-0001-0006-000000000009', '10000000-0000-0000-0000-000000000006', 'Finance'),
  ('20000000-0000-0001-0006-000000000010', '10000000-0000-0000-0000-000000000006', 'Legal')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Cyberdyne Systems (9 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0007-000000000001', '10000000-0000-0000-0000-000000000007', 'AI Research'),
  ('20000000-0000-0001-0007-000000000002', '10000000-0000-0000-0000-000000000007', 'Robotics'),
  ('20000000-0000-0001-0007-000000000003', '10000000-0000-0000-0000-000000000007', 'Neural Networks'),
  ('20000000-0000-0001-0007-000000000004', '10000000-0000-0000-0000-000000000007', 'Innovation'),
  ('20000000-0000-0001-0007-000000000005', '10000000-0000-0000-0000-000000000007', 'Defense Contracts'),
  ('20000000-0000-0001-0007-000000000006', '10000000-0000-0000-0000-000000000007', 'Commercial Products'),
  ('20000000-0000-0001-0007-000000000007', '10000000-0000-0000-0000-000000000007', 'Engineering'),
  ('20000000-0000-0001-0007-000000000008', '10000000-0000-0000-0000-000000000007', 'Sales'),
  ('20000000-0000-0001-0007-000000000009', '10000000-0000-0000-0000-000000000007', 'Operations')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Oscorp Technologies (8 teams, no Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0008-000000000001', '10000000-0000-0000-0000-000000000008', 'Genetics'),
  ('20000000-0000-0001-0008-000000000002', '10000000-0000-0000-0000-000000000008', 'Nanotechnology'),
  ('20000000-0000-0001-0008-000000000003', '10000000-0000-0000-0000-000000000008', 'Pharmaceuticals'),
  ('20000000-0000-0001-0008-000000000004', '10000000-0000-0000-0000-000000000008', 'Engineering'),
  ('20000000-0000-0001-0008-000000000005', '10000000-0000-0000-0000-000000000008', 'Clinical'),
  ('20000000-0000-0001-0008-000000000006', '10000000-0000-0000-0000-000000000008', 'Sales'),
  ('20000000-0000-0001-0008-000000000007', '10000000-0000-0000-0000-000000000008', 'Marketing'),
  ('20000000-0000-0001-0008-000000000008', '10000000-0000-0000-0000-000000000008', 'Finance')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Aperture Science (10 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0009-000000000001', '10000000-0000-0000-0000-000000000009', 'Portal Research'),
  ('20000000-0000-0001-0009-000000000002', '10000000-0000-0000-0000-000000000009', 'AI Development'),
  ('20000000-0000-0001-0009-000000000003', '10000000-0000-0000-0000-000000000009', 'Testing'),
  ('20000000-0000-0001-0009-000000000004', '10000000-0000-0000-0000-000000000009', 'Innovation'),
  ('20000000-0000-0001-0009-000000000005', '10000000-0000-0000-0000-000000000009', 'Safety'),
  ('20000000-0000-0001-0009-000000000006', '10000000-0000-0000-0000-000000000009', 'Robotics'),
  ('20000000-0000-0001-0009-000000000007', '10000000-0000-0000-0000-000000000009', 'Materials Science'),
  ('20000000-0000-0001-0009-000000000008', '10000000-0000-0000-0000-000000000009', 'Engineering'),
  ('20000000-0000-0001-0009-000000000009', '10000000-0000-0000-0000-000000000009', 'Maintenance'),
  ('20000000-0000-0001-0009-000000000010', '10000000-0000-0000-0000-000000000009', 'HR')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Teams for Massive Dynamic (11 teams, includes Innovation)
INSERT INTO teams (id, organization_id, name) VALUES
  ('20000000-0000-0001-0010-000000000001', '10000000-0000-0000-0000-000000000010', 'Fringe Division'),
  ('20000000-0000-0001-0010-000000000002', '10000000-0000-0000-0000-000000000010', 'Biotech'),
  ('20000000-0000-0001-0010-000000000003', '10000000-0000-0000-0000-000000000010', 'Physics Research'),
  ('20000000-0000-0001-0010-000000000004', '10000000-0000-0000-0000-000000000010', 'Innovation'),
  ('20000000-0000-0001-0010-000000000005', '10000000-0000-0000-0000-000000000010', 'Defense'),
  ('20000000-0000-0001-0010-000000000006', '10000000-0000-0000-0000-000000000010', 'Pharmaceuticals'),
  ('20000000-0000-0001-0010-000000000007', '10000000-0000-0000-0000-000000000010', 'Technology'),
  ('20000000-0000-0001-0010-000000000008', '10000000-0000-0000-0000-000000000010', 'Sales'),
  ('20000000-0000-0001-0010-000000000009', '10000000-0000-0000-0000-000000000010', 'Marketing'),
  ('20000000-0000-0001-0010-000000000010', '10000000-0000-0000-0000-000000000010', 'Finance'),
  ('20000000-0000-0001-0010-000000000011', '10000000-0000-0000-0000-000000000010', 'Legal')
ON CONFLICT (organization_id, name) DO NOTHING;

-- Generate users for each team (5-15 users per team)
-- Using a function to generate users with random data

DO $$
DECLARE
  org_record RECORD;
  team_record RECORD;
  user_count INTEGER;
  i INTEGER;
  user_id UUID;
BEGIN
  FOR team_record IN SELECT id, organization_id, name FROM teams WHERE organization_id IN (
    SELECT id FROM organizations WHERE id::TEXT LIKE '10000000%'
  ) LOOP
    -- Random number of users per team (5-15)
    user_count := 5 + floor(random() * 11)::INTEGER;

    FOR i IN 1..user_count LOOP
      user_id := uuid_generate_v4();

      INSERT INTO users (id, organization_id, team_id, anonymous_id, privacy_tier)
      VALUES (
        user_id,
        team_record.organization_id,
        team_record.id,
        'anon_' || replace(team_record.id::TEXT, '-', '') || '_' || i,
        CASE floor(random() * 3)::INTEGER
          WHEN 0 THEN 'local'
          WHEN 1 THEN 'research'
          ELSE 'cohort'
        END
      )
      ON CONFLICT (anonymous_id) DO NOTHING;

      -- Generate daily scores for the last 90 days
      INSERT INTO daily_scores (
        user_id,
        date,
        corrix_score,
        results_score,
        relationship_score,
        resilience_score,
        results_outcome_satisfaction,
        results_edit_ratio,
        results_task_completion,
        relationship_prompt_quality,
        relationship_verification_rate,
        relationship_dialogue_depth,
        relationship_critical_engagement,
        resilience_skill_trajectory,
        resilience_error_recovery,
        resilience_adaptation,
        signal_count
      )
      SELECT
        user_id,
        current_date - (day_offset || ' days')::INTERVAL,
        -- Base score with some variance per team
        GREATEST(20, LEAST(100,
          50 + (random() * 30)::INTEGER +
          CASE WHEN team_record.name = 'Innovation' THEN 10 ELSE 0 END +
          (random() * 20 - 10)::INTEGER
        )),
        -- Results score
        GREATEST(20, LEAST(100, 45 + (random() * 40)::INTEGER)),
        -- Relationship score
        GREATEST(20, LEAST(100, 50 + (random() * 35)::INTEGER)),
        -- Resilience score
        GREATEST(20, LEAST(100, 48 + (random() * 38)::INTEGER)),
        -- Sub-components
        random() * 0.4 + 0.5,
        random() * 0.3 + 0.2,
        random() * 0.3 + 0.6,
        random() * 0.4 + 0.5,
        random() * 0.3 + 0.3,
        random() * 0.5 + 0.3,
        random() * 0.4 + 0.2,
        -- resilience sub-components
        random() * 0.3 + 0.5,
        random() * 0.4 + 0.4,
        random() * 0.5 + 0.3,
        -- Signal count (5-50)
        (5 + floor(random() * 46))::INTEGER
      FROM generate_series(0, 89) AS day_offset
      ON CONFLICT DO NOTHING;

      -- Generate some behavioral signals
      INSERT INTO behavioral_signals (
        user_id,
        session_id,
        timestamp,
        platform,
        prompt_has_context,
        prompt_has_constraints,
        prompt_has_examples,
        prompt_has_format_spec,
        prompt_quality_score,
        prompt_word_count,
        action_type,
        time_to_action_seconds,
        conversation_depth,
        is_follow_up,
        has_verification_request,
        has_pushback,
        has_clarification_request,
        outcome_rating,
        session_duration_seconds,
        session_start_hour
      )
      SELECT
        user_id,
        'session_' || user_id || '_' || signal_num,
        NOW() - (floor(random() * 90) || ' days')::INTERVAL - (floor(random() * 24) || ' hours')::INTERVAL,
        CASE floor(random() * 3)::INTEGER
          WHEN 0 THEN 'claude'
          WHEN 1 THEN 'chatgpt'
          ELSE 'gemini'
        END,
        random() > 0.3,
        random() > 0.5,
        random() > 0.7,
        random() > 0.6,
        (40 + floor(random() * 50))::INTEGER,
        (10 + floor(random() * 200))::INTEGER,
        CASE floor(random() * 5)::INTEGER
          WHEN 0 THEN 'accept'
          WHEN 1 THEN 'edit'
          WHEN 2 THEN 'copy'
          WHEN 3 THEN 'regenerate'
          ELSE 'abandon'
        END,
        random() * 120,
        (1 + floor(random() * 8))::INTEGER,
        random() > 0.5,
        random() > 0.6,
        random() > 0.8,
        random() > 0.7,
        CASE WHEN random() > 0.3 THEN (2 + floor(random() * 4))::INTEGER ELSE NULL END,
        (60 + floor(random() * 1800))::INTEGER,
        (8 + floor(random() * 12))::INTEGER
      FROM generate_series(1, 20 + floor(random() * 30)::INTEGER) AS signal_num;

    END LOOP;
  END LOOP;
END $$;

-- Summary of created data
SELECT
  o.name as organization,
  COUNT(DISTINCT t.id) as teams,
  COUNT(DISTINCT u.id) as users
FROM organizations o
LEFT JOIN teams t ON t.organization_id = o.id
LEFT JOIN users u ON u.team_id = t.id
WHERE o.id::TEXT LIKE '10000000%'
GROUP BY o.id, o.name
ORDER BY o.name;
