/**
 * Seed test behavioral data to Supabase
 * This creates realistic test data to verify dashboard wiring
 */

require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://nulxhkvlamdflwyxkwco.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PLATFORMS = ['claude', 'chatgpt', 'gemini'];
const MODES = ['approving', 'consulting', 'supervising', 'delegating'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

async function seedData() {
  console.log('🌱 Seeding test data to Supabase...\n');

  // Get existing users (need UUID 'id' for behavioral_signals foreign key)
  const { data: users, error: usersError } = await supabase
    .from('alpha_users')
    .select('id, user_id, email')
    .eq('baseline_completed', true);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.error('❌ No users with completed baseline found');
    process.exit(1);
  }

  console.log(`📋 Found ${users.length} users with completed baseline`);

  // Seed behavioral signals
  console.log('\n📊 Seeding behavioral_signals...');
  const signals = [];
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 200; i++) {
    const user = randomChoice(users);
    const timestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
    const promptQuality = randomInt(30, 95);

    signals.push({
      user_id: user.id,  // Use UUID id, not string user_id
      session_id: `session_${user.id.slice(0, 8)}_${i}`,
      timestamp: timestamp.toISOString(),
      platform: randomChoice(PLATFORMS),
      prompt_has_context: Math.random() > 0.5,
      prompt_has_constraints: Math.random() > 0.6,
      prompt_has_examples: Math.random() > 0.7,
      prompt_has_format_spec: Math.random() > 0.65,
      prompt_quality_score: promptQuality,
      prompt_word_count: randomInt(10, 300),
      action_type: randomChoice(['accept', 'edit', 'copy', 'regenerate']),
      time_to_action_seconds: randomFloat(5, 120),
      conversation_depth: randomInt(1, 10),
      is_follow_up: Math.random() > 0.6,
      has_verification_request: Math.random() > 0.85,
      has_pushback: Math.random() > 0.9,
      has_clarification_request: Math.random() > 0.8,
      outcome_rating: randomInt(2, 5),
      session_duration_seconds: randomInt(60, 1800),
      session_start_hour: randomInt(8, 22),
      collaboration_mode: randomChoice(MODES),
    });
  }

  // Insert in batches
  for (let i = 0; i < signals.length; i += 50) {
    const batch = signals.slice(i, i + 50);
    const { error } = await supabase.from('behavioral_signals').insert(batch);
    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i/50) + 1} failed:`, error.message);
    } else {
      console.log(`   ✅ Batch ${Math.floor(i/50) + 1}/${Math.ceil(signals.length/50)} inserted`);
    }
  }

  // Update user scores
  console.log('\n📊 Updating user scores...');
  for (const user of users) {
    const corrixScore = randomInt(45, 85);
    const resultsScore = randomInt(40, 90);
    const relationshipScore = randomInt(40, 90);
    const resilienceScore = randomInt(40, 90);

    const { error } = await supabase
      .from('alpha_users')
      .update({
        latest_corrix_score: corrixScore,
        latest_results_score: resultsScore,
        latest_relationship_score: relationshipScore,
        latest_resilience_score: resilienceScore,
        mode_approving_pct: randomInt(10, 40),
        mode_consulting_pct: randomInt(20, 40),
        mode_supervising_pct: randomInt(15, 35),
        mode_delegating_pct: randomInt(10, 30),
      })
      .eq('user_id', user.user_id);

    if (error) {
      console.log(`   ❌ ${user.email}: ${error.message}`);
    } else {
      console.log(`   ✅ ${user.email}: Corrix=${corrixScore}, R/R/R=${resultsScore}/${relationshipScore}/${resilienceScore}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Refresh the dashboard at https://corrix-dashboard.vercel.app');
  console.log('   2. Check that scores and charts now show data');
}

seedData().catch(console.error);
