-- Temporarily disable RLS for testing chat functionality
-- WARNING: This is for development/testing only. Re-enable RLS for production.

-- Disable RLS on chat-related tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'chats', 'chat_messages')
ORDER BY tablename;

-- Test message
SELECT 'RLS disabled for testing. Remember to re-enable for production!' as status; 