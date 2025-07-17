# 🚀 Complete Supabase Setup Guide for GenLo

This guide will walk you through setting up your entire Supabase project for GenLo, including database tables, storage buckets, and security policies.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Project Created**: Create a new Supabase project
3. **Admin Access**: You'll need admin access to your Supabase project

## 🎯 Step 1: Create Supabase Project

### 1.1 Create New Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `quelle-ai` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Get Your Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`)

## 🗄️ Step 2: Set Up Database Tables

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

### 2.2 Run Complete Schema
Copy and paste the entire contents of `supabase-schema.sql` into the SQL Editor and run it.

**Or run this simplified version for immediate setup:**

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription features table
CREATE TABLE IF NOT EXISTS subscription_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'campaign')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  prompt TEXT NOT NULL,
  file_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Generated content indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(type);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Generated content policies
CREATE POLICY "Users can view own content" ON generated_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content" ON generated_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content" ON generated_content
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Create free subscription for new user
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.3 Verify Tables Created
1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `users`
   - `subscriptions`
   - `subscription_features`
   - `projects`
   - `generated_content`
   - `usage_tracking`

## 📁 Step 3: Set Up Storage Buckets

### 3.1 Create Storage Buckets
1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**

#### Create `generated-content` Bucket
- **Name**: `generated-content`
- **Public bucket**: ✅ **Check this**
- **File size limit**: `100 MB`
- **Allowed MIME types**: `image/*,video/*,audio/*`

#### Create `user-uploads` Bucket
- **Name**: `user-uploads`
- **Public bucket**: ✅ **Check this**
- **File size limit**: `50 MB`
- **Allowed MIME types**: `image/*,video/*,application/pdf,text/*`

### 3.2 Set Up Storage Policies
Go to **SQL Editor** and run these policies:

```sql
-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Generated content bucket policies
CREATE POLICY "Authenticated users can upload generated content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'generated-content' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for generated content" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-content');

CREATE POLICY "Users can update their own generated content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'generated-content' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generated content" ON storage.objects
  FOR DELETE USING (bucket_id = 'generated-content' AND auth.uid()::text = (storage.foldername(name))[1]);

-- User uploads bucket policies
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔐 Step 4: Configure Authentication

### 4.1 Set Up Auth Providers
1. Go to **Authentication** → **Providers**
2. Configure the providers you want to use:

#### Email Auth (Required)
- ✅ **Enable Email Auth**
- ✅ **Enable Email Confirmations**
- ✅ **Enable Secure Email Change**

#### Google Auth (Optional)
- ✅ **Enable Google Auth**
- Add your Google OAuth credentials

#### GitHub Auth (Optional)
- ✅ **Enable GitHub Auth**
- Add your GitHub OAuth credentials

### 4.2 Configure Auth Settings
1. Go to **Authentication** → **Settings**
2. Set up your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production URL when ready

## ⚙️ Step 5: Environment Variables

### 5.1 Create `.env.local`
Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key
TOGETHER_API_KEY=your_together_api_key

# Veo 3 Video Generation (Choose one provider)
VEO3_PROVIDER=google-ai-studio
VEO3_API_KEY=your_veo3_api_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 5.2 Get Your Supabase Keys
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

## 🧪 Step 6: Test Your Setup

### 6.1 Test Database Connection
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/test-connection`
3. Check that the connection is successful

### 6.2 Test Actor Feature
1. Visit `http://localhost:3000/become-actor`
2. Fill out the form and upload a file
3. Check that the data appears in your Supabase dashboard

### 6.3 Test Storage
1. Upload a file through the actor form
2. Go to **Storage** → **actor-uploads** in Supabase
3. Verify the file was uploaded successfully

## 🔍 Step 7: Verify Everything Works

### 7.1 Check Database Tables
Go to **Table Editor** and verify:
- ✅ All tables are created
- ✅ Indexes are present
- ✅ RLS policies are enabled

### 7.2 Check Storage Buckets
Go to **Storage** and verify:
- ✅ `generated-content` bucket exists and is public
- ✅ `user-uploads` bucket exists and is public

### 7.3 Check Authentication
Go to **Authentication** → **Users** and verify:
- ✅ Email auth is enabled
- ✅ OAuth providers are configured (if using)

## 🚀 Step 8: Production Deployment

### 8.1 Update Environment Variables
When deploying to production, update your environment variables:

```env
# Production URLs
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

# Update Supabase site URL
# Go to Authentication → Settings → Site URL
```

### 8.2 Set Up Production Auth
1. Go to **Authentication** → **Settings**
2. Update **Site URL** to your production domain
3. Add your production domain to **Redirect URLs**

## 🎉 You're Done!

Your Supabase project is now fully configured for GenLo! 

### What You Have:
- ✅ Complete database schema with all tables
- ✅ Storage buckets for file uploads
- ✅ Row Level Security policies
- ✅ Authentication setup
- ✅ Performance indexes
- ✅ Automatic user creation triggers

### Next Steps:
1. Test all features locally
2. Deploy to production
3. Set up payment processing (Stripe)
4. Configure email notifications

## 🆘 Troubleshooting

### Common Issues:

**"Failed to connect to Supabase"**
- Check your environment variables
- Verify your Supabase project is active
- Check your internet connection

**"RLS policy violation"**
- Verify RLS policies are created correctly
- Check that users are authenticated
- Review the policy conditions

**"Storage upload failed"**
- Check bucket exists and is public
- Verify storage policies are set
- Check file size limits

**"Authentication not working"**
- Verify auth providers are enabled
- Check redirect URLs are correct
- Ensure site URL is set properly

### Need Help?
- Check the Supabase documentation
- Review the browser console for errors
- Verify all SQL commands executed successfully
- Test with the provided test scripts 