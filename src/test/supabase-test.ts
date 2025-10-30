import { supabase } from '@/integrations/supabase/client';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test a simple query to check connection
    const { data, error } = await supabase
      .from('quizzes')
      .select('count()');
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('✅ Supabase is properly configured and accessible');
  } else {
    console.log('❌ Supabase connection failed');
  }
});