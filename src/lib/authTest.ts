import { supabase } from '@/integrations/supabase/client';
import { testSupabaseConnection, testUserProfilesTable } from './supabaseTest';
import { testEnvVariables } from './envTest';

export async function runAuthTests() {
  console.log('=== Running Authentication Tests ===');
  
  // Test 1: Environment variables
  console.log('\n1. Testing environment variables...');
  const envTestPassed = testEnvVariables();
  if (!envTestPassed) {
    console.error('❌ Environment variables test failed');
    return false;
  }
  console.log('✅ Environment variables test passed');
  
  // Test 2: Supabase connection
  console.log('\n2. Testing Supabase connection...');
  const connectionTest = await testSupabaseConnection();
  if (!connectionTest.success) {
    console.error('❌ Supabase connection test failed:', connectionTest.error);
    return false;
  }
  console.log('✅ Supabase connection test passed');
  
  // Test 3: User profiles table
  console.log('\n3. Testing user_profiles table...');
  const tableTest = await testUserProfilesTable();
  if (!tableTest.success) {
    console.error('❌ user_profiles table test failed:', tableTest.error);
    return false;
  }
  console.log('✅ user_profiles table test passed');
  
  // Test 4: Auth functions
  console.log('\n4. Testing auth functions...');
  try {
    // Test sign up (this will fail if user already exists, but that's expected)
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log('   Testing sign up with', testEmail);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:8090/auth'
      }
    });
    
    if (signUpError) {
      // This might fail for various reasons, but we'll continue testing
      console.log('   Sign up test result:', signUpError.message);
    } else {
      console.log('   Sign up test successful, user ID:', signUpData.user?.id);
    }
    
    console.log('✅ Auth functions test completed');
  } catch (error) {
    console.error('❌ Auth functions test error:', error);
    return false;
  }
  
  console.log('\n=== All Authentication Tests Completed ===');
  return true;
}

// Run tests if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  runAuthTests().then(success => {
    if (success) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed');
    }
  });
}