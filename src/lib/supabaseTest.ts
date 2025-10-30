import { supabase } from '@/integrations/supabase/client';
import { isPublicIdUnique } from './supabaseQuiz';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: healthData, error: healthError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('Supabase connection test failed:', healthError);
      return { success: false, error: healthError };
    }
    
    console.log('Supabase connection test passed');
    
    // Test 2: Check auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Supabase auth test failed:', sessionError);
      return { success: false, error: sessionError };
    }
    
    console.log('Supabase auth test passed, session:', session?.user?.id || 'none');
    
    return { success: true, session: session };
  } catch (error) {
    console.error('Supabase test error:', error);
    return { success: false, error };
  }
}

export async function testUserProfilesTable() {
  try {
    console.log('Testing user_profiles table...');
    
    // Test if we can access the user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('user_profiles table test failed:', error);
      return { success: false, error };
    }
    
    console.log('user_profiles table test passed, found records:', data?.length || 0);
    return { success: true, data };
  } catch (error) {
    console.error('user_profiles table test error:', error);
    return { success: false, error };
  }
}

// Test function for public ID uniqueness
export async function testPublicIdUniqueness() {
  console.log('Testing public ID uniqueness check...');
  
  // Test with a definitely unique ID
  const uniqueId = 'test-unique-id-' + Date.now();
  const isUnique = await isPublicIdUnique(uniqueId);
  console.log(`ID "${uniqueId}" is unique: ${isUnique}`);
  
  // Test with an existing ID from the database
  try {
    // Get an existing public ID from the database
    const { data, error } = await supabase
      .from('quizzes')
      .select('public_id')
      .limit(1);
    
    if (data && data.length > 0 && data[0].public_id) {
      const existingId = data[0].public_id;
      const existingIsUnique = await isPublicIdUnique(existingId);
      console.log(`Existing ID "${existingId}" is unique: ${existingIsUnique}`);
    } else {
      console.log('No existing quizzes found in database');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in public ID uniqueness test:', error);
    return { success: false, error };
  }
}