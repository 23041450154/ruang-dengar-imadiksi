/**
 * Test Companion Login
 * Script untuk debug login teman ngobrol
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlrrqjsmffhtofkjijxb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscnJxanNtZmZodG9ma2ppanhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTU5MzgsImV4cCI6MjA4MjQ5MTkzOH0.3Q1lVjzzpWKUmk_ZMG465Qx5jwWu5eSuSj1teO4jmQY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLogin(username, password) {
  console.log('\n🔍 Testing login for:', username);
  console.log('━'.repeat(50));

  try {
    // 1. Check if companion exists
    const { data: companion, error } = await supabase
      .from('companions')
      .select('companion_id, username, password_hash, name, specialty, is_active')
      .eq('username', username.toLowerCase().trim())
      .single();

    if (error) {
      console.error('❌ Error fetching companion:', error.message);
      return;
    }

    if (!companion) {
      console.error('❌ Companion not found!');
      return;
    }

    console.log('✅ Companion found:');
    console.log('   - ID:', companion.companion_id);
    console.log('   - Username:', companion.username);
    console.log('   - Name:', companion.name);
    console.log('   - Specialty:', companion.specialty);
    console.log('   - Active:', companion.is_active);
    console.log('   - Password Hash:', companion.password_hash.substring(0, 20) + '...');

    // 2. Test password
    console.log('\n🔐 Testing password...');
    const isValid = await bcrypt.compare(password, companion.password_hash);
    
    if (isValid) {
      console.log('✅ Password VALID!');
    } else {
      console.log('❌ Password INVALID!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function listAllCompanions() {
  console.log('\n📋 All Companions in Database:');
  console.log('━'.repeat(50));

  try {
    const { data: companions, error } = await supabase
      .from('companions')
      .select('companion_id, username, name, specialty, is_active')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!companions || companions.length === 0) {
      console.log('❌ No companions found in database!');
      console.log('\n💡 Run migration SQL file first:');
      console.log('   supabase-companions-migration.sql');
      return;
    }

    companions.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.name} (@${c.username})`);
      console.log(`   - ID: ${c.companion_id}`);
      console.log(`   - Specialty: ${c.specialty}`);
      console.log(`   - Active: ${c.is_active}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function main() {
  console.log('🚀 SafeSpace - Companion Login Test');
  console.log('═'.repeat(50));

  // List all companions first
  await listAllCompanions();

  // Test login for each companion
  await testLogin('kaka', 'teman123');
  await testLogin('rara', 'teman123');
  await testLogin('budi', 'teman123');

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Test completed!');
}

main();
