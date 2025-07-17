-- Quelle AI - Final Database Migration
-- Creates all tables first, then adds missing columns

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables first (if they don't exist)
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

CREATE TABLE IF NOT EXISTS subscription_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add missing columns to existing tables
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if users table has metadata column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'metadata'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE users ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to users table';
    END IF;
    
    -- Check if subscriptions table has cancel_at_period_end column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'cancel_at_period_end'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added cancel_at_period_end column to subscriptions table';
    END IF;
    
    -- Check if subscription_features table has is_enabled column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_features' 
        AND column_name = 'is_enabled'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE subscription_features ADD COLUMN is_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_enabled column to subscription_features table';
    END IF;
    
    -- Check if subscription_features table has created_at column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscription_features' 
        AND column_name = 'created_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE subscription_features ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to subscription_features table';
    END IF;
    
    -- Check if projects table has settings column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'settings'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE projects ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added settings column to projects table';
    END IF;
    
    -- Check if generated_content table has metadata column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'generated_content' 
        AND column_name = 'metadata'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE generated_content ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to generated_content table';
    END IF;
    
    -- Check if usage_tracking table has metadata column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'usage_tracking' 
        AND column_name = 'metadata'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE usage_tracking ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added metadata column to usage_tracking table';
    END IF;
    
    -- Check if api_keys table has permissions column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys' 
        AND column_name = 'permissions'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE api_keys ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added permissions column to api_keys table';
    END IF;
END $$;

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_features_subscription_id ON subscription_features(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_features_feature_name ON subscription_features(feature_name);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_project_id ON generated_content(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(type);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if users table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON users;
        DROP POLICY IF EXISTS "Users can update own profile" ON users;
        DROP POLICY IF EXISTS "Users can insert own profile" ON users;
    END IF;
    
    -- Check if subscriptions table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscriptions'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
        DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
    END IF;
    
    -- Check if subscription_features table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subscription_features'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own subscription features" ON subscription_features;
        DROP POLICY IF EXISTS "Service role can manage all subscription features" ON subscription_features;
    END IF;
    
    -- Check if projects table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own projects" ON projects;
        DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
        DROP POLICY IF EXISTS "Users can update own projects" ON projects;
        DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
    END IF;
    
    -- Check if generated_content table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'generated_content'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own generated content" ON generated_content;
        DROP POLICY IF EXISTS "Users can insert own generated content" ON generated_content;
        DROP POLICY IF EXISTS "Users can update own generated content" ON generated_content;
        DROP POLICY IF EXISTS "Users can delete own generated content" ON generated_content;
    END IF;
    
    -- Check if usage_tracking table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'usage_tracking'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
        DROP POLICY IF EXISTS "Service role can insert usage tracking" ON usage_tracking;
    END IF;
    
    -- Check if api_keys table exists and drop policies
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'api_keys'
    ) INTO table_exists;
    
    IF table_exists THEN
        DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
        DROP POLICY IF EXISTS "Users can insert own API keys" ON api_keys;
        DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
        DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
    END IF;
END $$;

-- Create policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own subscription features" ON subscription_features FOR SELECT USING (
  EXISTS (SELECT 1 FROM subscriptions WHERE subscriptions.id = subscription_features.subscription_id AND subscriptions.user_id = auth.uid())
);
CREATE POLICY "Service role can manage all subscription features" ON subscription_features FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own generated content" ON generated_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated content" ON generated_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generated content" ON generated_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated content" ON generated_content FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert usage tracking" ON usage_tracking FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view own API keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_generated_content_updated_at ON generated_content;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial data (only for subscriptions that don't have features yet)
INSERT INTO subscription_features (subscription_id, feature_name, is_enabled)
SELECT s.id, feature_name, is_enabled
FROM subscriptions s
CROSS JOIN (
  VALUES 
    ('basic-image-generation', true),
    ('basic-video-generation', false),
    ('ai-actor-signup', true),
    ('community-support', true)
) AS features(feature_name, is_enabled)
WHERE s.plan = 'free' AND NOT EXISTS (
  SELECT 1 FROM subscription_features sf WHERE sf.subscription_id = s.id
);

INSERT INTO subscription_features (subscription_id, feature_name, is_enabled)
SELECT s.id, feature_name, is_enabled
FROM subscriptions s
CROSS JOIN (
  VALUES 
    ('basic-image-generation', true),
    ('advanced-image-generation', true),
    ('veo3-video-generation', true),
    ('ai-actor-signup', true),
    ('priority-support', true),
    ('advanced-settings', true),
    ('batch-processing', true),
    ('api-access', true)
) AS features(feature_name, is_enabled)
WHERE s.plan = 'pro' AND NOT EXISTS (
  SELECT 1 FROM subscription_features sf WHERE sf.subscription_id = s.id
);

SELECT 'Final database migration completed successfully! All tables, columns, and policies are now properly configured.' as status; 