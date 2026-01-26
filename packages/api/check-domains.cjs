require('dotenv').config({ path: '.env.prod' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  // Check for domain-related tables
  const tables = ['domain_scores', 'domain_daily_scores', 'user_domains', 'domains'];
  console.log('Checking domain tables:');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log('  ✅', table, '- exists');
      if (data.length > 0) console.log('     Fields:', Object.keys(data[0]).join(', '));
    } else {
      console.log('  ❌', table, '-', error.message);
    }
  }

  // Check alpha_users for domain fields
  console.log('\nChecking alpha_users domain fields:');
  const { data: users } = await supabase.from('alpha_users').select('*').eq('baseline_completed', true).limit(3);
  if (users && users.length > 0) {
    const domainFields = Object.keys(users[0]).filter(k => k.includes('domain'));
    console.log('  Domain fields:', domainFields.join(', ') || 'none');
    users.forEach(u => {
      console.log('\n  User:', u.email);
      domainFields.forEach(f => console.log('   ', f, '=', u[f]));
    });
  }
})();
