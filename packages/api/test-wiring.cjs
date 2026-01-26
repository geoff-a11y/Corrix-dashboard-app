/**
 * Test script to verify Chrome extension → Supabase → Dashboard wiring
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

async function runTests() {
  console.log('🔧 Testing Chrome Extension → Supabase → Dashboard Wiring\n');
  console.log('=' .repeat(60) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Check alpha_users table exists and has data
  console.log('📋 Test 1: alpha_users table');
  try {
    const { data: users, error, count } = await supabase
      .from('alpha_users')
      .select('*', { count: 'exact' });

    if (error) throw error;

    console.log(`   ✅ Table exists with ${users.length} users`);
    if (users.length > 0) {
      console.log(`   📊 Sample user: ${users[0].email}`);
      console.log(`   📊 Fields: ${Object.keys(users[0]).join(', ')}`);
    }
    results.passed++;
    results.tests.push({ name: 'alpha_users table', status: 'passed', count: users.length });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'alpha_users table', status: 'failed', error: err.message });
  }

  // Test 2: Check behavioral_signals table
  console.log('\n📋 Test 2: behavioral_signals table');
  try {
    const { data: signals, error, count } = await supabase
      .from('behavioral_signals')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table exists with ${signals?.length || 0} signals (showing first 5)`);
    if (signals && signals.length > 0) {
      console.log(`   📊 Fields: ${Object.keys(signals[0]).join(', ')}`);
      console.log(`   📊 Sample signal timestamp: ${signals[0].timestamp}`);
    } else {
      console.log(`   ⚠️  No behavioral signals recorded yet`);
    }
    results.passed++;
    results.tests.push({ name: 'behavioral_signals table', status: 'passed', count: signals?.length || 0 });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'behavioral_signals table', status: 'failed', error: err.message });
  }

  // Test 3: Check coaching_outcomes table
  console.log('\n📋 Test 3: coaching_outcomes table');
  try {
    const { data: outcomes, error } = await supabase
      .from('coaching_outcomes')
      .select('*')
      .limit(5);

    if (error) throw error;

    console.log(`   ✅ Table exists with ${outcomes?.length || 0} outcomes (showing first 5)`);
    if (outcomes && outcomes.length > 0) {
      console.log(`   📊 Fields: ${Object.keys(outcomes[0]).join(', ')}`);
    } else {
      console.log(`   ⚠️  No coaching outcomes recorded yet`);
    }
    results.passed++;
    results.tests.push({ name: 'coaching_outcomes table', status: 'passed', count: outcomes?.length || 0 });
  } catch (err) {
    // Table might not exist yet
    console.log(`   ⚠️  Table may not exist: ${err.message}`);
    results.tests.push({ name: 'coaching_outcomes table', status: 'warning', error: err.message });
  }

  // Test 4: Check users have scores
  console.log('\n📋 Test 4: User scores populated');
  try {
    const { data: users, error } = await supabase
      .from('alpha_users')
      .select('user_id, email, latest_corrix_score, latest_results_score, latest_relationship_score, latest_resilience_score, baseline_completed')
      .not('latest_corrix_score', 'is', null);

    if (error) throw error;

    if (users && users.length > 0) {
      console.log(`   ✅ ${users.length} users have Corrix scores`);
      users.forEach(u => {
        console.log(`      - ${u.email.split('@')[0]}: Corrix=${u.latest_corrix_score}, R/R/R=${u.latest_results_score}/${u.latest_relationship_score}/${u.latest_resilience_score}`);
      });
      results.passed++;
    } else {
      console.log(`   ⚠️  No users have Corrix scores yet`);
    }
    results.tests.push({ name: 'user scores', status: users?.length > 0 ? 'passed' : 'warning', count: users?.length || 0 });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'user scores', status: 'failed', error: err.message });
  }

  // Test 5: Check baseline completion
  console.log('\n📋 Test 5: Baseline completion status');
  try {
    const { data: baselineUsers, error } = await supabase
      .from('alpha_users')
      .select('user_id, email, baseline_completed')
      .eq('baseline_completed', true);

    if (error) throw error;

    console.log(`   ✅ ${baselineUsers?.length || 0} users have completed baseline`);
    if (baselineUsers && baselineUsers.length > 0) {
      baselineUsers.forEach(u => {
        console.log(`      - ${u.email}`);
      });
    }
    results.passed++;
    results.tests.push({ name: 'baseline completion', status: 'passed', count: baselineUsers?.length || 0 });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'baseline completion', status: 'failed', error: err.message });
  }

  // Test 6: Check mode distribution
  console.log('\n📋 Test 6: Collaboration mode data');
  try {
    const { data: modeUsers, error } = await supabase
      .from('alpha_users')
      .select('email, mode_approving_pct, mode_consulting_pct, mode_supervising_pct, mode_delegating_pct')
      .or('mode_approving_pct.gt.0,mode_consulting_pct.gt.0,mode_supervising_pct.gt.0,mode_delegating_pct.gt.0');

    if (error) throw error;

    if (modeUsers && modeUsers.length > 0) {
      console.log(`   ✅ ${modeUsers.length} users have mode data`);
      modeUsers.slice(0, 3).forEach(u => {
        console.log(`      - ${u.email.split('@')[0]}: A=${u.mode_approving_pct}% C=${u.mode_consulting_pct}% S=${u.mode_supervising_pct}% D=${u.mode_delegating_pct}%`);
      });
      results.passed++;
    } else {
      console.log(`   ⚠️  No mode data recorded yet`);
    }
    results.tests.push({ name: 'mode distribution', status: modeUsers?.length > 0 ? 'passed' : 'warning', count: modeUsers?.length || 0 });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'mode distribution', status: 'failed', error: err.message });
  }

  // Test 7: Check daily_scores table
  console.log('\n📋 Test 7: daily_scores table');
  try {
    const { data: scores, error } = await supabase
      .from('daily_scores')
      .select('*')
      .limit(10);

    if (error) throw error;

    console.log(`   ✅ Table exists with ${scores?.length || 0} records`);
    if (scores && scores.length > 0) {
      console.log(`   📊 Fields: ${Object.keys(scores[0]).join(', ')}`);
      scores.slice(0, 3).forEach(s => {
        console.log(`      - ${s.date || s.created_at}: score=${s.corrix_score || s.score}`);
      });
    }
    results.passed++;
    results.tests.push({ name: 'daily_scores', status: 'passed', count: scores?.length || 0 });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
    results.tests.push({ name: 'daily_scores', status: 'failed', error: err.message });
  }

  // Test 8: List all tables
  console.log('\n📋 Test 8: Available tables');
  try {
    const tables = ['alpha_users', 'behavioral_signals', 'coaching_outcomes', 'daily_scores', 'interaction_sessions', 'coaching_tips', 'user_preferences'];
    console.log('   Checking known tables:');

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).limit(1);
        if (!error) {
          console.log(`      ✅ ${table} (${count || data?.length || 0} records)`);
        } else {
          console.log(`      ❌ ${table}: ${error.message}`);
        }
      } catch (e) {
        console.log(`      ❌ ${table}: ${e.message}`);
      }
    }
    results.passed++;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Total:  ${results.passed + results.failed}`);

  console.log('\n📋 DATA STATUS:');
  results.tests.forEach(t => {
    const icon = t.status === 'passed' ? '✅' : t.status === 'warning' ? '⚠️ ' : '❌';
    console.log(`   ${icon} ${t.name}: ${t.count !== undefined ? t.count + ' records' : t.error || 'OK'}`);
  });

  return results;
}

runTests().catch(console.error);
