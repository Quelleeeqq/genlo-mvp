-- Fix RLS Policies for GenLo Chat Functionality
-- This script fixes the Row Level Security policies that are preventing chat creation

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('chats', 'chat_messages', 'users');

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Users can view own chats" ON chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;

DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON chat_messages;

-- Create more permissive policies for development/testing
-- Users policies
CREATE POLICY "Users can view own profile" ON users 
FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own profile" ON users 
FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Chat policies - more permissive for development
CREATE POLICY "Users can view own chats" ON chats 
FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own chats" ON chats 
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own chats" ON chats 
FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own chats" ON chats 
FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Chat messages policies - more permissive for development
CREATE POLICY "Users can view own chat messages" ON chat_messages 
FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own chat messages" ON chat_messages 
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own chat messages" ON chat_messages 
FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own chat messages" ON chat_messages 
FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Alternative: Temporarily disable RLS for testing (uncomment if needed)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('chats', 'chat_messages', 'users')
ORDER BY tablename, policyname;

-- Test query to verify access
SELECT 'RLS policies updated successfully' as status; 