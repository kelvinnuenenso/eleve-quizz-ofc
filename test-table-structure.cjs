const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testTableStructure() {
  console.log('🔍 Testing table structure...');
  
  try {
    // Test 1: Try to select from user_profiles to see what columns exist
    console.log('\n1. Testing user_profiles table access...');
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Error accessing user_profiles:', profileError);
    } else {
      console.log('✅ user_profiles table accessible');
      console.log('📊 Sample data structure:', profiles);
    }
    
    // Test 2: Try to insert a minimal record
    console.log('\n2. Testing minimal insert...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        nome: 'Test User',
        email: 'test@example.com'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
      
      // Clean up
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('user_id', testUserId);
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testTableStructure();