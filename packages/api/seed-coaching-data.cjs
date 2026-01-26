/**
 * Seed test coaching outcomes data to Supabase
 */

require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const COACHING_TYPES = [
  'prompt_quality',
  'critical_thinking',
  'verification',
  'reflection',
  'sycophancy_detection',
  'hallucination_risk',
  'action_extraction',
];

const ACTIONS = ['injected_prompt', 'thumbs_up', 'thumbs_down', 'dismissed', 'clicked_away', 'ignored'];
const EXPERTISE_STAGES = ['novice', 'advanced_beginner', 'competent', 'proficient', 'expert'];
const DOMAINS = ['AI/Technology Strategy', 'Research/Academia', 'Product Management', 'Technology/Software'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo) {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function seedCoachingData() {
  console.log('🌱 Seeding coaching outcomes data...\n');

  // First check if table exists
  console.log('📋 Checking if coaching_outcomes table exists...');
  const { error: checkError } = await supabase.from('coaching_outcomes').select('*').limit(1);

  if (checkError && checkError.message.includes('does not exist')) {
    console.log('❌ coaching_outcomes table does not exist');
    console.log('\n📝 Please create the table with this SQL in Supabase:\n');
    console.log(`
CREATE TABLE coaching_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES alpha_users(id),
  organization_id TEXT,
  team_id TEXT,
  coaching_type TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  expertise_stage TEXT,
  domain TEXT,
  behavior_profile TEXT,
  next_prompt_improved BOOLEAN,
  prompt_score_before INTEGER,
  prompt_score_after INTEGER,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_outcomes_user ON coaching_outcomes(user_id);
CREATE INDEX idx_coaching_outcomes_type ON coaching_outcomes(coaching_type);
CREATE INDEX idx_coaching_outcomes_created ON coaching_outcomes(created_at);
`);
    return;
  }

  // Get existing users
  const { data: users, error: usersError } = await supabase
    .from('alpha_users')
    .select('id, user_id, email, baseline_completed, baseline_primary_domain, baseline_domain_stage')
    .eq('baseline_completed', true);

  if (usersError || !users || users.length === 0) {
    console.error('❌ No users found:', usersError?.message);
    return;
  }

  console.log(`✅ Found ${users.length} users with completed baseline\n`);

  // Generate coaching outcomes
  const outcomes = [];

  for (let i = 0; i < 150; i++) {
    const user = randomChoice(users);
    const coachingType = randomChoice(COACHING_TYPES);
    const action = randomChoice(ACTIONS);
    const timestamp = randomDate(30);

    // Make some actions more likely to be positive for certain coaching types
    const isPositive = action === 'injected_prompt' || action === 'thumbs_up';
    const nextPromptImproved = isPositive ? Math.random() > 0.3 : Math.random() > 0.7;

    outcomes.push({
      client_id: `client_${user.id.slice(0, 8)}`,
      user_id: user.id,
      org_id: 'org-corrix-alpha',
      coaching_type: coachingType,
      action_taken: action,
      expertise_stage: user.baseline_domain_stage || randomChoice(EXPERTISE_STAGES),
      domain: user.baseline_primary_domain || randomChoice(DOMAINS),
      next_prompt_improved: nextPromptImproved,
      platform: 'claude',
      client_timestamp: timestamp.toISOString(),
      created_at: timestamp.toISOString(),
    });
  }

  // Insert in batches
  console.log('📊 Inserting coaching outcomes...');
  for (let i = 0; i < outcomes.length; i += 50) {
    const batch = outcomes.slice(i, i + 50);
    const { error } = await supabase.from('coaching_outcomes').insert(batch);
    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i/50) + 1} failed:`, error.message);
    } else {
      console.log(`   ✅ Batch ${Math.floor(i/50) + 1}/${Math.ceil(outcomes.length/50)} inserted`);
    }
  }

  // Summary stats
  const actionCounts = {};
  outcomes.forEach(o => {
    actionCounts[o.action_taken] = (actionCounts[o.action_taken] || 0) + 1;
  });

  console.log('\n📊 Summary:');
  console.log(`   Total outcomes: ${outcomes.length}`);
  console.log('   By action:');
  Object.entries(actionCounts).forEach(([action, count]) => {
    console.log(`     - ${action}: ${count}`);
  });

  const improved = outcomes.filter(o => o.next_prompt_improved).length;
  console.log(`   Improved next prompt: ${improved} (${Math.round(improved/outcomes.length*100)}%)`);

  console.log('\n✅ Seeding complete!');
}

seedCoachingData().catch(console.error);
