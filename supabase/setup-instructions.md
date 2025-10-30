# Supabase Project Setup Instructions

## Step 1: Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note down your:
   - Project URL (e.g., `https://YOUR_PROJECT.supabase.co`)
   - Anonymous Key (anon key)
   - Service Role Key

## Step 2: Update Your Environment Variables

Update the `.env` file with your actual credentials:

```
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

## Step 3: Link Your Project and Run Migrations

Run these commands in your terminal:

```bash
# Link your local project to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_ID

# Run the database migrations
npx supabase db push
```

## Step 4: Test the Connection

After completing the above steps:
1. Restart your development server: `npm run dev`
2. Visit http://localhost:8081/app/supabase-test
3. Click "Test Connection" to verify everything is working

## Manual Migration (Alternative Method)

If the CLI method doesn't work, you can manually run the migrations:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each file in the `supabase/migrations` directory:
   - [20250916230720_7d7b279f-8389-4fca-afe9-3f4c337a7cf3.sql](file:///c:/Users/kel02/eleve-quizz-ofc-4/supabase/migrations/20250916230720_7d7b279f-8389-4fca-afe9-3f4c337a7cf3.sql)
   - [20250917031652_7dbbbd53-ef88-4374-a46f-68bb83d313ba.sql](file:///c:/Users/kel02/eleve-quizz-ofc-4/supabase/migrations/20250917031652_7dbbbd53-ef88-4374-a46f-68bb83d313ba.sql)
4. Run each script in order

## Troubleshooting

If you encounter any issues:
1. Check that your environment variables are correctly set
2. Verify your Supabase project is active
3. Ensure you have network connectivity
4. Check the browser console for any error messages