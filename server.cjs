require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing');
  process.exit(1);
}

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabase: {
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey
    }
  });
});

// User management endpoints
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, nome } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Admin client not configured' });
    }

    // Create user with Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: nome || email.split('@')[0],
        nome: nome || email.split('@')[0]
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      
      // Fallback: Return error with detailed information for debugging
      console.log('Supabase Auth user creation failed. This indicates a database configuration issue.');
      console.log('Possible causes:');
      console.log('- Database triggers are not working properly');
      console.log('- RLS policies are blocking user creation');
      console.log('- Database connection issues');
      
      return res.status(500).json({ 
        error: 'User creation failed', 
        details: 'Supabase Auth is unable to create users. Please check database configuration.',
        suggestions: [
          'Verify database migrations are applied',
          'Check RLS policies on auth.users',
          'Verify database triggers are working',
          'Check Supabase project status'
        ]
      });
    }

    // If user creation succeeded, try to create profile manually
    console.log('User created successfully, creating profile...');
    
    // Wait a bit for any triggers to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if profile was created automatically
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    let profileData = existingProfile;
    
    if (!existingProfile) {
      // Create profile manually
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userData.user.id,
          display_name: nome || userData.user.user_metadata?.full_name || email.split('@')[0],
          username: email.split('@')[0],
          plan: 'starter'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Manual profile creation error:', profileError);
        // Don't fail the request, user was created successfully
        console.log('User created but profile creation failed');
      } else {
        profileData = newProfile;
      }
    }

    res.status(201).json({ 
      message: 'User created successfully', 
      user: {
        id: userData.user.id,
        email: userData.user.email,
        nome: profileData?.display_name || nome || email.split('@')[0],
        plano: profileData?.plan || 'starter'
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quiz management endpoints
app.post('/api/quizzes', async (req, res) => {
  try {
    const { name, description, theme, user_id } = req.body;

    if (!name || !user_id) {
      return res.status(400).json({ error: 'Name and user_id are required' });
    }

    // Generate a unique public_id
    const publicId = crypto.randomUUID().substring(0, 8);

    // Create quiz
    const { data: quizData, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        user_id,
        public_id: publicId,
        name,
        description,
        theme: theme ? { name: theme } : {},
        status: 'draft',
        questions: [],
        outcomes: {},
        settings: {}
      })
      .select()
      .single();

    if (quizError) {
      console.error('Quiz creation error:', quizError);
      return res.status(500).json({ error: 'Error creating quiz', details: quizError.message });
    }

    res.status(201).json({ message: 'Quiz created successfully', quiz: quizData });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quizzes', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = supabaseAdmin.from('quizzes').select('*');
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    const { data: quizzes, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      return res.status(500).json({ error: 'Error fetching quizzes' });
    }

    res.json({ quizzes });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching quiz:', error);
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ quiz });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/users`);
  console.log(`   GET  /api/users/:id`);
  console.log(`   POST /api/quizzes`);
  console.log(`   GET  /api/quizzes`);
  console.log(`   GET  /api/quizzes/:id`);
  console.log(`🔗 Supabase connected: ${supabaseUrl}`);
});