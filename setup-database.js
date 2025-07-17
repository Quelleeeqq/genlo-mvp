#!/usr/bin/env node

/**
 * Database Setup Script for GenLo
 * 
 * This script sets up the database tables and runs migrations.
 * Run this after setting up your Supabase project.
 */

const fs = require('fs');
const path = require('path');

console.log('🗄️ GenLo Database Setup\n');

// Check if .env.local exists
function checkEnvFile() {
  console.log('📋 Checking environment variables...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    console.log('   Please create .env.local with your Supabase credentials.');
    console.log('   Required variables:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY\n');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\n   Please add these to your .env.local file.\n');
    return false;
  }
  
  console.log('✅ Environment variables found\n');
  return true;
}

// Check if migration file exists
function checkMigrationFile() {
  console.log('🗄️ Checking migration file...');
  
  const migrationPath = path.join(process.cwd(), 'supabase-migration-final.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ supabase-migration-final.sql not found!');
    console.log('   Please ensure the migration file exists.\n');
    return false;
  }
  
  console.log('✅ Migration file found\n');
  return true;
}

// Generate setup instructions
function generateSetupInstructions() {
  console.log('📝 Database Setup Instructions:\n');
  
  console.log('1. 🗄️ Set up Supabase Database:');
  console.log('   - Go to your Supabase dashboard');
  console.log('   - Navigate to SQL Editor');
  console.log('   - Copy and paste the contents of supabase-migration-final.sql');
  console.log('   - Click "Run" to execute\n');
  
  console.log('2. 📁 Create Storage Buckets:');
  console.log('   - Go to Storage in Supabase dashboard');
  console.log('   - Create these buckets:');
  console.log('     * chat-images (public) - for chat images');
  console.log('     * user-uploads (private) - for user uploads');
  console.log('     * generated-content (private) - for AI generated content\n');
  
  console.log('3. 🔐 Configure Authentication:');
  console.log('   - Go to Authentication → Providers');
  console.log('   - Enable Email provider');
  console.log('   - Optionally set up Google/GitHub OAuth');
  console.log('   - Customize email templates\n');
  
  console.log('4. 🧪 Test the Setup:');
  console.log('   - Start development server: npm run dev');
  console.log('   - Visit http://localhost:3000/auth/signup');
  console.log('   - Create a test account');
  console.log('   - Test chat functionality');
  console.log('   - Verify images are saved properly\n');
  
  console.log('5. 🚀 Deploy to Production:');
  console.log('   - Push code to GitHub');
  console.log('   - Connect to Vercel');
  console.log('   - Add environment variables in Vercel dashboard');
  console.log('   - Deploy and test\n');
}

// Main verification function
function verifySetup() {
  console.log('🔍 Verifying GenLo database setup...\n');
  
  const checks = [
    checkEnvFile,
    checkMigrationFile
  ];
  
  const results = checks.map(check => check());
  const allPassed = results.every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 All checks passed! Your setup looks good.\n');
    generateSetupInstructions();
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above before proceeding.\n');
  }
  
  return allPassed;
}

// Run verification if this script is executed directly
if (require.main === module) {
  verifySetup();
} 