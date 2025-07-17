# AI Actor Feature Setup Guide

This guide previously described the setup for the "Become Our AI Actor" feature. This feature has now been removed from the product, so no Supabase setup is required for actors or related storage buckets.

## 2. Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Features Overview

### Actor Signup Flow
- **Page**: `/become-actor`
- **Form**: Collects name, email, payment info, consent, and file upload
- **Storage**: Files uploaded to Supabase Storage
- **Database**: Actor profile stored in `actors` table

### Admin Dashboard
- **Page**: `/admin/actors`
- **Function**: Admin interface to manage actor applications
- **Features**: 
  - View all applications with filtering
  - Approve/reject applications
  - View statistics
  - Delete applications
  - View uploaded files

## 4. File Structure

```
app/
├── become-actor/
│   └── page.tsx              # Actor signup form
├── admin/actors/
│   └── page.tsx              # Admin dashboard
└── api/actor-signup/
    └── route.ts              # API endpoint for signup

lib/
├── services/
│   └── actor-service.ts      # Actor management service
├── types/
│   └── actor.ts              # TypeScript interfaces
└── supabaseClient.ts         # Supabase client

supabase-schema.sql           # Database schema
```

## 5. Testing the Feature

1. **Test Actor Signup**:
   - Visit `/become-actor`
   - Fill out the form and upload a file
   - Check that data is stored in Supabase

2. **Test Admin Dashboard**:
   - Visit `/admin/actors`