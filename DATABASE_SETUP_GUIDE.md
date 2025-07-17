# GenLo Database Setup Guide

This guide will help you set up the database and storage for GenLo's chat history and image saving functionality.

## 🗄️ Database Setup

### 1. Supabase Project Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing one
3. Note down your project URL and anon key

### 2. Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-migration-final.sql`
3. Paste it into the SQL editor
4. Click **Run** to execute the migration

This will create:
- `users` table (for user profiles)
- `chats` table (for chat sessions)
- `chat_messages` table (for individual messages)
- `subscriptions` table (for billing)
- `generated_content` table (for AI-generated content)
- `usage_tracking` table (for analytics)
- All necessary indexes and security policies

### 3. Verify Tables Created

After running the migration, you should see these tables in your **Table Editor**:
- ✅ `users`
- ✅ `chats` 
- ✅ `chat_messages`
- ✅ `subscriptions`
- ✅ `subscription_features`
- ✅ `projects`
- ✅ `generated_content`
- ✅ `usage_tracking`
- ✅ `api_keys`

## 📁 Storage Setup

### 1. Create Storage Buckets

In your Supabase dashboard, go to **Storage** and create these buckets:

#### Chat Images Bucket (Public)
- **Name**: `chat-images`
- **Public**: ✅ Yes
- **File size limit**: 10MB
- **Allowed MIME types**: `image/*`

#### User Uploads Bucket (Private)
- **Name**: `user-uploads`
- **Public**: ❌ No
- **File size limit**: 50MB
- **Allowed MIME types**: `image/*, video/*`

#### Generated Content Bucket (Private)
- **Name**: `generated-content`
- **Public**: ❌ No
- **File size limit**: 100MB
- **Allowed MIME types**: `image/*, video/*, audio/*`

### 2. Storage Policies

The migration script includes RLS policies, but you may need to add storage policies:

```sql
-- Allow authenticated users to upload to chat-images
CREATE POLICY "Users can upload chat images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-images' AND auth.role() = 'authenticated'
);

-- Allow public access to chat-images
CREATE POLICY "Public access to chat images" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-images');

-- Allow users to delete their own chat images
CREATE POLICY "Users can delete own chat images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔐 Authentication Setup

### 1. Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### 2. Optional OAuth Providers

You can also enable:
- **Google** OAuth
- **GitHub** OAuth
- **Discord** OAuth

### 3. Email Templates

Customize email templates in **Authentication** → **Email Templates**:
- Confirm signup
- Reset password
- Magic link

## 🧪 Testing the Setup

### 1. Local Development

```bash
# Start the development server
npm run dev

# Visit the signup page
http://localhost:3000/auth/signup
```

### 2. Test Chat Functionality

1. Create a new account
2. Go to the dashboard
3. Start a new chat
4. Send a message with an image
5. Verify the image is saved and displayed
6. Check that chat history persists

### 3. Verify Database Records

In Supabase dashboard, check:
- **Table Editor** → `chats` - should show your chat sessions
- **Table Editor** → `chat_messages` - should show your messages
- **Storage** → `chat-images` - should show uploaded images

## 🚀 Production Deployment

### 1. Environment Variables

Make sure these are set in your production environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Vercel Deployment

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy and test

### 3. Domain Setup

1. Add your custom domain in Vercel
2. Update Supabase auth redirect URLs
3. Test authentication flow

## 🔧 Troubleshooting

### Common Issues

#### 1. "Table doesn't exist" errors
- Make sure you ran the migration script
- Check that all tables were created in Supabase dashboard

#### 2. "RLS policy violation" errors
- Verify RLS policies were created
- Check that user is authenticated
- Ensure user has proper permissions

#### 3. Image upload failures
- Check storage bucket exists
- Verify storage policies are correct
- Check file size limits

#### 4. Chat history not loading
- Verify `chats` and `chat_messages` tables exist
- Check that user ID is being passed correctly
- Ensure RLS policies allow user access

### Debug Commands

```bash
# Check database setup
node setup-database.js

# Test Supabase connection
npm run dev
# Then visit http://localhost:3000/api/health
```

## 📊 Monitoring

### 1. Database Usage

Monitor in Supabase dashboard:
- **Database** → **Logs** - for query performance
- **Database** → **Usage** - for storage and bandwidth

### 2. Storage Usage

Monitor in Supabase dashboard:
- **Storage** → **Usage** - for file storage
- **Storage** → **Logs** - for upload/download activity

### 3. Authentication

Monitor in Supabase dashboard:
- **Authentication** → **Users** - for user activity
- **Authentication** → **Logs** - for auth events

## 🔒 Security Considerations

1. **RLS Policies**: All tables have row-level security enabled
2. **Storage Policies**: Images are properly secured
3. **API Keys**: Never expose service role key in client code
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Validation**: Validate all user inputs

## 📈 Performance Optimization

1. **Indexes**: All necessary indexes are created
2. **Pagination**: Implement pagination for large chat histories
3. **Image Optimization**: Consider image compression
4. **Caching**: Implement caching for frequently accessed data

---

**Need Help?** Check the troubleshooting section or create an issue in the repository. 