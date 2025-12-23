-- Seed Phase 2 demo data
-- This adds departments, roles, temporal indicators, skill tracking, and benchmarks

-- Insert departments (map to existing teams for demo)
INSERT INTO departments (id, organization_id, name, slug, parent_department_id) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000001', 'Engineering', 'engineering', NULL),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000001', 'Product', 'product', NULL),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000001', 'Design', 'design', NULL),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000001', 'Marketing', 'marketing', NULL),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000001', 'Sales', 'sales', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert roles
INSERT INTO roles (id, organization_id, name, slug, category) VALUES
  ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000001', 'Software Engineer', 'software-engineer', 'technical'),
  ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000001', 'Senior Engineer', 'senior-engineer', 'technical'),
  ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000001', 'Product Manager', 'product-manager', 'managerial'),
  ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000001', 'Designer', 'designer', 'creative'),
  ('00000000-0000-0000-0003-000000000005', '00000000-0000-0000-0000-000000000001', 'Marketing Manager', 'marketing-manager', 'managerial'),
  ('00000000-0000-0000-0003-000000000006', '00000000-0000-0000-0000-000000000001', 'Sales Rep', 'sales-rep', 'operational'),
  ('00000000-0000-0000-0003-000000000007', '00000000-0000-0000-0000-000000000001', 'Data Analyst', 'data-analyst', 'analytical')
ON CONFLICT (id) DO NOTHING;

-- Function to seed Phase 2 data for existing users
CREATE OR REPLACE FUNCTION seed_phase2_data() RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_dept_id UUID;
  v_role_id UUID;
  dept_ids UUID[] := ARRAY[
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0002-000000000005'
  ];
  role_ids UUID[] := ARRAY[
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0003-000000000005',
    '00000000-0000-0000-0003-000000000006',
    '00000000-0000-0000-0003-000000000007'
  ];
  d DATE;
  skill_base FLOAT;
  velocity_rate FLOAT;
  pe_score FLOAT;
  oe_score FLOAT;
  ver_score FLOAT;
  iter_score FLOAT;
  adapt_score FLOAT;
  ct_score FLOAT;
  overall_score FLOAT;
  indicator_rec RECORD;
BEGIN
  -- Assign departments and roles to existing users
  FOR v_user IN SELECT id, team_id FROM users WHERE organization_id = '00000000-0000-0000-0000-000000000001' LOOP
    -- Map team to department
    v_dept_id := CASE
      WHEN v_user.team_id = '00000000-0000-0000-0001-000000000001' THEN '00000000-0000-0000-0002-000000000001'
      WHEN v_user.team_id = '00000000-0000-0000-0001-000000000002' THEN '00000000-0000-0000-0002-000000000002'
      WHEN v_user.team_id = '00000000-0000-0000-0001-000000000003' THEN '00000000-0000-0000-0002-000000000003'
      WHEN v_user.team_id = '00000000-0000-0000-0001-000000000004' THEN '00000000-0000-0000-0002-000000000004'
      ELSE '00000000-0000-0000-0002-000000000005'
    END;

    -- Assign random role
    v_role_id := role_ids[1 + (random() * 6)::INTEGER];

    -- Insert user metadata
    INSERT INTO user_metadata (user_id, department_id, role_id, seniority_level, years_in_role)
    VALUES (
      v_user.id,
      v_dept_id,
      v_role_id,
      CASE (random() * 5)::INTEGER
        WHEN 0 THEN 'entry'
        WHEN 1 THEN 'junior'
        WHEN 2 THEN 'mid'
        WHEN 3 THEN 'senior'
        WHEN 4 THEN 'lead'
        ELSE 'mid'
      END,
      (random() * 10 + 1)::INTEGER
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Generate skill snapshots for last 90 days (weekly)
    skill_base := 40 + random() * 30;
    velocity_rate := 0.1 + random() * 0.4;
    d := CURRENT_DATE - 84;

    WHILE d <= CURRENT_DATE LOOP
      -- Calculate skill components with some variation and growth
      pe_score := LEAST(100, skill_base + (velocity_rate * (CURRENT_DATE - d)::INTEGER / 7) + (random() * 8 - 4));
      oe_score := LEAST(100, skill_base + 5 + (velocity_rate * (CURRENT_DATE - d)::INTEGER / 7) + (random() * 8 - 4));
      ver_score := LEAST(100, skill_base - 5 + (velocity_rate * 0.8 * (CURRENT_DATE - d)::INTEGER / 7) + (random() * 8 - 4));
      iter_score := LEAST(100, skill_base + 3 + (velocity_rate * 1.1 * (CURRENT_DATE - d)::INTEGER / 7) + (random() * 8 - 4));
      adapt_score := LEAST(100, skill_base - 3 + (velocity_rate * 0.9 * (CURRENT_DATE - d)::INTEGER / 7) + (random() * 8 - 4));
      ct_score := LEAST(100, skill_base + 8 + (velocity_rate * 1.2 * (CURRENT_DATE - d)::INTEGER / 7) + (random() * 8 - 4));
      overall_score := (pe_score + oe_score + ver_score + iter_score + adapt_score + ct_score) / 6;

      INSERT INTO skill_snapshots (
        user_id, date, overall_skill_score,
        skill_prompt_engineering, skill_output_evaluation, skill_verification,
        skill_iteration, skill_adaptation, skill_critical_thinking,
        trajectory_direction, sessions_in_period, interactions_in_period
      ) VALUES (
        v_user.id, d,
        GREATEST(0, overall_score),
        GREATEST(0, pe_score),
        GREATEST(0, oe_score),
        GREATEST(0, ver_score),
        GREATEST(0, iter_score),
        GREATEST(0, adapt_score),
        GREATEST(0, ct_score),
        CASE WHEN velocity_rate > 0.3 THEN 'accelerating' WHEN velocity_rate > 0.15 THEN 'steady' ELSE 'plateauing' END,
        (5 + random() * 15)::INTEGER,
        (20 + random() * 80)::INTEGER
      )
      ON CONFLICT (user_id, date) DO NOTHING;

      d := d + 7;
    END LOOP;

    -- Generate competency events
    IF skill_base > 45 THEN
      INSERT INTO competency_events (user_id, event_type, milestone_name, milestone_value, days_since_first_use, occurred_at)
      VALUES (v_user.id, 'reached_baseline', 'baseline_reached', 50, (random() * 14 + 7)::INTEGER, NOW() - ((random() * 60 + 30)::INTEGER || ' days')::INTERVAL);
    END IF;

    IF skill_base > 55 THEN
      INSERT INTO competency_events (user_id, event_type, milestone_name, milestone_value, days_since_first_use, occurred_at)
      VALUES (v_user.id, 'reached_competent', 'competent', 70, (random() * 21 + 21)::INTEGER, NOW() - ((random() * 30 + 14)::INTEGER || ' days')::INTERVAL);
    END IF;

    IF skill_base > 65 THEN
      INSERT INTO competency_events (user_id, event_type, milestone_name, milestone_value, days_since_first_use, occurred_at)
      VALUES (v_user.id, 'reached_proficient', 'proficient', 85, (random() * 30 + 45)::INTEGER, NOW() - ((random() * 14)::INTEGER || ' days')::INTERVAL);
    END IF;

    -- Generate learning velocity
    INSERT INTO learning_velocity (
      user_id, velocity_7d, velocity_14d, velocity_30d, velocity_90d,
      acceleration, rank_in_org, percentile_in_org
    ) VALUES (
      v_user.id,
      velocity_rate * 7,
      velocity_rate * 14,
      velocity_rate * 30,
      velocity_rate * 90,
      (random() * 0.2 - 0.1),
      (random() * 100 + 1)::INTEGER,
      random() * 100
    );

    -- Generate temporal indicators for this user (last 7 days)
    FOR indicator_rec IN SELECT name, dimension, temporality FROM indicator_definitions WHERE is_active = true LOOP
      INSERT INTO temporal_indicators (
        user_id, date, indicator_name, dimension, temporality,
        current_value, baseline_value, population_value,
        deviation_from_baseline, deviation_from_population,
        percentile_rank, trend_direction, trend_velocity
      ) VALUES (
        v_user.id, CURRENT_DATE, indicator_rec.name, indicator_rec.dimension, indicator_rec.temporality,
        40 + random() * 40,
        35 + random() * 30,
        45 + random() * 20,
        -10 + random() * 30,
        -15 + random() * 25,
        random() * 100,
        CASE WHEN random() > 0.6 THEN 'improving' WHEN random() > 0.3 THEN 'stable' ELSE 'declining' END,
        -0.5 + random() * 1.0
      )
      ON CONFLICT (user_id, date, indicator_name) DO NOTHING;
    END LOOP;

  END LOOP;

  -- Generate organization-level benchmarks
  INSERT INTO benchmarks (
    scope_type, scope_id, metric_name, metric_dimension,
    mean, median, stddev, p10, p25, p50, p75, p90, p95,
    sample_size, active_users, period_start, period_end
  ) VALUES
    ('organization', '00000000-0000-0000-0000-000000000001', 'corrix_score', NULL,
     62.5, 65.0, 12.5, 42.0, 52.0, 65.0, 75.0, 85.0, 90.0, 102, 85, CURRENT_DATE - 30, CURRENT_DATE),
    ('organization', '00000000-0000-0000-0000-000000000001', 'results', 'results',
     58.2, 60.0, 14.2, 38.0, 48.0, 60.0, 70.0, 82.0, 88.0, 102, 85, CURRENT_DATE - 30, CURRENT_DATE),
    ('organization', '00000000-0000-0000-0000-000000000001', 'relationship', 'relationship',
     64.8, 67.0, 11.8, 45.0, 55.0, 67.0, 76.0, 84.0, 90.0, 102, 85, CURRENT_DATE - 30, CURRENT_DATE),
    ('organization', '00000000-0000-0000-0000-000000000001', 'resilience', 'resilience',
     60.1, 62.0, 13.1, 40.0, 50.0, 62.0, 72.0, 80.0, 86.0, 102, 85, CURRENT_DATE - 30, CURRENT_DATE)
  ON CONFLICT (scope_type, scope_id, metric_name, period_start) DO NOTHING;

  -- Generate department benchmarks
  INSERT INTO benchmarks (
    scope_type, scope_id, metric_name, metric_dimension,
    mean, median, stddev, p25, p50, p75, p90,
    sample_size, active_users, period_start, period_end
  )
  SELECT
    'department',
    d.id,
    'corrix_score',
    NULL,
    55 + random() * 25,
    57 + random() * 25,
    10 + random() * 5,
    45 + random() * 15,
    57 + random() * 20,
    70 + random() * 15,
    80 + random() * 12,
    (15 + random() * 30)::INTEGER,
    (10 + random() * 25)::INTEGER,
    CURRENT_DATE - 30,
    CURRENT_DATE
  FROM departments d
  WHERE d.organization_id = '00000000-0000-0000-0000-000000000001'
  ON CONFLICT (scope_type, scope_id, metric_name, period_start) DO NOTHING;

  -- Generate role benchmarks
  INSERT INTO benchmarks (
    scope_type, scope_id, metric_name, metric_dimension,
    mean, median, stddev, p25, p50, p75, p90,
    sample_size, active_users, period_start, period_end
  )
  SELECT
    'role',
    r.id,
    'corrix_score',
    NULL,
    50 + random() * 30,
    52 + random() * 30,
    8 + random() * 6,
    40 + random() * 20,
    52 + random() * 25,
    65 + random() * 20,
    78 + random() * 15,
    (5 + random() * 20)::INTEGER,
    (3 + random() * 15)::INTEGER,
    CURRENT_DATE - 30,
    CURRENT_DATE
  FROM roles r
  WHERE r.organization_id = '00000000-0000-0000-0000-000000000001'
  ON CONFLICT (scope_type, scope_id, metric_name, period_start) DO NOTHING;

END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT seed_phase2_data();

-- Drop the function after use
DROP FUNCTION seed_phase2_data();
