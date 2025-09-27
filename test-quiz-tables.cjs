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

async function testQuizTables() {
  console.log('🔍 Testing quiz table structure...');
  
  const tablesToTest = ['quizzes', 'quiz_quizzes', 'quiz_results', 'quiz_leads'];
  
  for (const tableName of tablesToTest) {
    try {
      console.log(`\n📊 Testing table: ${tableName}`);
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${tableName}:`, error.message);
      } else {
        console.log(`✅ ${tableName} table accessible`);
        if (data && data.length > 0) {
          console.log('📋 Sample structure:', Object.keys(data[0]));
        } else {
          console.log('📋 Table is empty but accessible');
        }
      }
    } catch (error) {
      console.error(`💥 Unexpected error testing ${tableName}:`, error.message);
    }
  }
  
  // Test quiz creation with correct table
  console.log('\n🧪 Testing quiz creation...');
  try {
    const { data: quizData, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: 'Test Quiz',
        description: 'A test quiz',
        theme: 'Testing',
        user_id: '163b0565-05b5-448a-9628-9faab3bbf2a3'
      })
      .select()
      .single();
    
    if (quizError) {
      console.error('❌ Quiz creation error:', quizError);
    } else {
      console.log('✅ Quiz created successfully:', quizData);
      
      // Clean up
      await supabaseAdmin
        .from('quizzes')
        .delete()
        .eq('id', quizData.id);
      console.log('🧹 Test quiz cleaned up');
    }
  } catch (error) {
    console.error('💥 Quiz creation error:', error);
  }
}

testQuizTables();