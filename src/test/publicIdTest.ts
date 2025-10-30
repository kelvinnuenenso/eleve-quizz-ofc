import { isPublicIdUnique } from '../lib/supabaseQuiz';
import { supabase } from '../../src/integrations/supabase/client';

async function testPublicIdUniqueness() {
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
  } catch (error) {
    console.error('Error fetching existing quiz:', error);
  }
  
  console.log('Test completed');
}

testPublicIdUniqueness().catch(console.error);