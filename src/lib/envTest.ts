// Test environment variables
export function testEnvVariables() {
  console.log('Testing environment variables...');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '[SET]' : '[NOT SET]');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[SET]' : '[NOT SET]');
  
  if (!supabaseUrl) {
    console.error('ERROR: VITE_SUPABASE_URL is not set');
    return false;
  }
  
  if (!supabaseAnonKey) {
    console.error('ERROR: VITE_SUPABASE_ANON_KEY is not set');
    return false;
  }
  
  console.log('Environment variables are properly set');
  return true;
}