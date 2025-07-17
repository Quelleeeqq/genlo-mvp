#!/usr/bin/env node

/**
 * Quelle AI - Supabase Setup Verification Script
 * 
 * This script helps verify your Supabase configuration and test the setup.
 * Run this after following the SUPABASE_SETUP_GUIDE.md
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Quelle AI - Supabase Setup Verification\n');

// Check if .env.local exists
function checkEnvFile() {
  console.log('📋 Checking environment variables...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    console.log('   Please create .env.local with your Supabase credentials.');
    console.log('   See SUPABASE_SETUP_GUIDE.md for instructions.\n');
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

// Check if schema file exists
function checkSchemaFile() {
  console.log('🗄️ Checking database schema...');
  
  const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ supabase-schema.sql not found!');
    console.log('   Please ensure the schema file exists.\n');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for key tables
  const requiredTables = [
    'users',
    'subscriptions', 
    'subscription_features',
    'actors',
    'projects',
    'generated_content'
  ];
  
  const missingTables = requiredTables.filter(table => !schemaContent.includes(`CREATE TABLE.*${table}`));
  
  if (missingTables.length > 0) {
    console.log('❌ Missing required tables in schema:');
    missingTables.forEach(table => console.log(`   - ${table}`));
    console.log('\n   Please check your supabase-schema.sql file.\n');
    return false;
  }
  
  console.log('✅ Database schema looks complete\n');
  return true;
}

// Check if auth pages exist
function checkAuthPages() {
  console.log('🔐 Checking authentication pages...');
  
  const authPages = [
    'app/auth/login/page.tsx',
    'app/auth/signup/page.tsx',
    'app/auth/forgot-password/page.tsx',
    'app/auth/verify-email/page.tsx',
    'app/auth/callback/route.ts'
  ];
  
  const missingPages = authPages.filter(page => !fs.existsSync(path.join(process.cwd(), page)));
  
  if (missingPages.length > 0) {
    console.log('❌ Missing authentication pages:');
    missingPages.forEach(page => console.log(`   - ${page}`));
    console.log('\n   Please ensure all auth pages are created.\n');
    return false;
  }
  
  console.log('✅ Authentication pages found\n');
  return true;
}

// Check if components exist
function checkComponents() {
  console.log('🧩 Checking components...');
  
  const components = [
    'components/AuthGuard.tsx',
    'components/UserMenu.tsx',
    'lib/contexts/AuthContext.tsx',
    'lib/supabaseClient.ts',
    'lib/types/auth.ts'
  ];
  
  const missingComponents = components.filter(comp => !fs.existsSync(path.join(process.cwd(), comp)));
  
  if (missingComponents.length > 0) {
    console.log('❌ Missing components:');
    missingComponents.forEach(comp => console.log(`   - ${comp}`));
    console.log('\n   Please ensure all components are created.\n');
    return false;
  }
  
  console.log('✅ Components found\n');
  return true;
}

// Generate setup instructions
function generateSetupInstructions() {
  console.log('📝 Next Steps:\n');
  
  console.log('1. 🗄️ Set up Supabase Database:');
  console.log('   - Go to your Supabase dashboard');
  console.log('   - Navigate to SQL Editor');
  console.log('   - Copy and paste the contents of supabase-schema.sql');
  console.log('   - Click "Run" to execute\n');
  
  console.log('2. 📁 Create Storage Buckets:');
  console.log('   - Go to Storage in Supabase dashboard');
  console.log('   - Create these buckets:');
  console.log('     * actor-uploads (public)');
  console.log('     * user-uploads (private)');
  console.log('     * generated-content (private)\n');
  
  console.log('3. 🔐 Configure Authentication:');
  console.log('   - Go to Authentication → Providers');
  console.log('   - Enable Email provider');
  console.log('   - Optionally set up Google/GitHub OAuth');
  console.log('   - Customize email templates\n');
  
  console.log('4. 🧪 Test the Setup:');
  console.log('   - Start development server: npm run dev');
  console.log('   - Visit http://localhost:3000/auth/signup');
  console.log('   - Create a test account');
  console.log('   - Verify email confirmation works');
  console.log('   - Test login/logout functionality\n');
  
  console.log('5. 🚀 Deploy to Production:');
  console.log('   - Push code to GitHub');
  console.log('   - Connect to Vercel');
  console.log('   - Add environment variables in Vercel dashboard');
  console.log('   - Deploy and test\n');
}

// Main verification function
function verifySetup() {
  console.log('🔍 Verifying Quelle AI setup...\n');
  
  const checks = [
    checkEnvFile,
    checkSchemaFile,
    checkAuthPages,
    checkComponents
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

module.exports = { verifySetup }; 