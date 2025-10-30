import { supabase } from '@/integrations/supabase/client';

export async function debugAuthState() {
  console.log('=== Debugging Authentication State ===');
  
  // 1. Check current session
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', session);
    if (sessionError) {
      console.error('Session error:', sessionError);
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }
  
  // 2. Check user
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    if (userError) {
      console.error('User error:', userError);
    }
  } catch (error) {
    console.error('Error getting user:', error);
  }
  
  // 3. Check if we can access user_profiles
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    console.log('user_profiles table access:', {
      success: !error,
      rowCount: data?.length,
      error: error?.message
    });
  } catch (error) {
    console.error('Error accessing user_profiles:', error);
  }
  
  // 4. Check if we can access profiles
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log('profiles table access:', {
      success: !error,
      rowCount: data?.length,
      error: error?.message
    });
  } catch (error) {
    console.error('Error accessing profiles:', error);
  }
  
  console.log('=== End Debug ===');
}

export async function resetAuthState() {
  console.log('Resetting authentication state...');
  
  try {
    // Sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      console.log('Signed out successfully');
    }
    
    // Clear localStorage
    localStorage.removeItem('sb-rijvidluwvzvatoarqoe-auth-token');
    localStorage.removeItem('sb-rijvidluwvzvatoarqoe-storage-key');
    
    console.log('Authentication state reset completed');
  } catch (error) {
    console.error('Error resetting auth state:', error);
  }
}