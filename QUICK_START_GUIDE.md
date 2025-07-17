# 🚀 Quick Start Guide

This guide previously described the setup for the AI Actor feature. That feature has now been removed, so no Supabase actors table or storage bucket setup is required.

## Step 1: Set Up Supabase Environment Variables

1. **Create `.env.local` file** in your project root:
```bash
# Copy from env.example
cp env.example .env.local
```

2. **Get your Supabase credentials**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project or use existing one
   - Go to Settings → API
   - Copy your Project URL and anon/public key

3. **Update `.env.local`** with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Set Up Supabase Database

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Run the schema** (copy from `supabase-schema.sql`):
```sql
-- Create actors table
CREATE TABLE IF NOT EXISTS actors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  payment_info TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_actors_email ON actors(email);
CREATE INDEX IF NOT EXISTS idx_actors_status ON actors(status);

-- Enable RLS
ALTER TABLE actors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own actor profile" ON actors
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Service role can manage all actor profiles" ON actors
  FOR ALL USING (auth.role() = 'service_role');
```

## Step 3: Set Up Supabase Storage

1. **Go to Storage** in your Supabase dashboard
2. **Create a new bucket** called `actor-uploads`
3. **Set it to public**
4. **Add storage policies** in SQL Editor:
```sql
-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload actor files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'actor-uploads' AND auth.role() = 'authenticated');

-- Allow public read access
CREATE POLICY "Public read access for actor files" ON storage.objects
  FOR SELECT USING (bucket_id = 'actor-uploads');
```

## Step 4: Test the Feature

1. **Start the development server**:
```bash
npm run dev
```

2. **Test Actor Signup**:
   - Visit `http://localhost:3000/become-actor`
   - Fill out the form with test data
   - Upload a photo or video file
   - Submit and check for success message

3. **Test Actor Dashboard**:
   - Visit `http://localhost:3000/actor-dashboard`
   - Enter the email you used in signup
   - Check that status shows "pending"

4. **Test Admin Dashboard**:
   - Visit `http://localhost:3000/admin/actors`
   - View your test application
   - Try approving/rejecting it

## Step 5: Verify Data in Supabase

1. **Check Database**: Go to Table Editor → actors table
2. **Check Storage**: Go to Storage → actor-uploads bucket
3. **Verify**: You should see your test data and uploaded file

## 🎉 You're Done!

Your AI Actor feature is now fully functional! 

### What You Can Do:
- ✅ Actors can sign up and upload files
- ✅ Files are stored securely in Supabase Storage
- ✅ Actor profiles are stored in the database
- ✅ Actors can check their application status
- ✅ Admins can manage applications
- ✅ Full CRUD operations with proper security

### Next Steps:
- Add email notifications
- Implement admin authentication
- Add payment processing
- Customize the UI/UX

## Troubleshooting

### Common Issues:

1. **"Failed to upload file"**
   - Check storage bucket exists and is public
   - Verify storage policies are set correctly

2. **"Failed to save actor profile"**
   - Check database table exists
   - Verify RLS policies are set correctly

3. **Environment variables not loading**
   - Ensure `.env.local` file exists
   - Restart the development server

4. **CORS errors**
   - Check Supabase project settings
   - Verify API keys are correct

### Need Help?
- Check the full setup guide in `ACTOR_FEATURE_SETUP.md`
- Review the Supabase documentation
- Check the browser console for errors 