#!/usr/bin/env node

/**
 * Security Verification Script
 * 
 * This script checks for common security issues in your Quelle AI project.
 * Run with: node scripts/verify-security.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Quelle AI Security Verification\n');

// Check 1: Environment file exists
console.log('1. Checking environment file...');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check for hardcoded API keys
  const hardcodedKeys = [
    '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',
    'AIzaSyCe2DVXHWrrW5kWZWtCp8JZeZHnPhIVLmU'
  ];
  
  let foundHardcoded = false;
  hardcodedKeys.forEach(key => {
    if (envContent.includes(key)) {
      console.log(`   ❌ Found hardcoded API key: ${key.substring(0, 20)}...`);
      foundHardcoded = true;
    }
  });
  
  if (!foundHardcoded) {
    console.log('   ✅ No hardcoded API keys found');
  }
  
  // Check for placeholder values
  const placeholderValues = [
    'your_openai_api_key',
    'your_google_ai_studio_api_key',
    'your_replicate_api_token'
  ];
  
  let hasPlaceholders = false;
  placeholderValues.forEach(placeholder => {
    if (envContent.includes(placeholder)) {
      console.log(`   ⚠️  Found placeholder value: ${placeholder}`);
      hasPlaceholders = true;
    }
  });
  
  if (!hasPlaceholders) {
    console.log('   ✅ All API keys appear to be configured');
  }
  
} else {
  console.log('   ❌ .env.local file not found');
  console.log('   💡 Create .env.local with your API keys');
}

// Check 2: .gitignore includes .env.local
console.log('\n2. Checking .gitignore...');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env*.local') || gitignoreContent.includes('.env.local')) {
    console.log('   ✅ .env.local is properly ignored');
  } else {
    console.log('   ❌ .env.local not in .gitignore');
  }
} else {
  console.log('   ❌ .gitignore file not found');
}

// Check 3: Source code for hardcoded keys
console.log('\n3. Checking source code for hardcoded keys...');
const sourceDirs = ['app', 'components', 'lib'];
let foundInSource = false;

function checkDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      checkDirectory(filePath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for hardcoded API keys
        const hardcodedPatterns = [
          /sk-proj-[a-zA-Z0-9_-]+/g,
          /AIzaSy[a-zA-Z0-9_-]+/g,
          /sk-[a-zA-Z0-9_-]+/g
        ];
        
        hardcodedPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            console.log(`   ❌ Found hardcoded key in ${filePath}: ${matches[0].substring(0, 20)}...`);
            foundInSource = true;
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }
  });
}

sourceDirs.forEach(dir => checkDirectory(dir));

if (!foundInSource) {
  console.log('   ✅ No hardcoded API keys found in source code');
}

// Check 4: Documentation for exposed keys
console.log('\n4. Checking documentation...');
const docFiles = ['README.md', 'AI_SERVICES_SETUP.md', 'GOOGLE_AI_STUDIO_SETUP.md'];
let foundInDocs = false;

docFiles.forEach(docFile => {
  const docPath = path.join(process.cwd(), docFile);
  if (fs.existsSync(docPath)) {
    try {
      const content = fs.readFileSync(docPath, 'utf8');
      
      // Check for actual API keys (not placeholders)
      const actualKeyPatterns = [
        /sk-proj-[a-zA-Z0-9_-]+/g,
        /AIzaSy[a-zA-Z0-9_-]+/g
      ];
      
      actualKeyPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`   ❌ Found actual API key in ${docFile}: ${matches[0].substring(0, 20)}...`);
          foundInDocs = true;
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }
});

if (!foundInDocs) {
  console.log('   ✅ No actual API keys found in documentation');
}

// Summary
console.log('\n📋 Security Summary:');
console.log('===================');

if (fs.existsSync(envPath)) {
  console.log('✅ Environment file exists');
} else {
  console.log('❌ Environment file missing');
}

if (fs.existsSync(gitignorePath) && fs.readFileSync(gitignorePath, 'utf8').includes('.env*.local')) {
  console.log('✅ .env.local is properly ignored');
} else {
  console.log('❌ .env.local not properly ignored');
}

if (!foundInSource) {
  console.log('✅ No hardcoded keys in source code');
} else {
  console.log('❌ Hardcoded keys found in source code');
}

if (!foundInDocs) {
  console.log('✅ No exposed keys in documentation');
} else {
  console.log('❌ Keys exposed in documentation');
}

console.log('\n🔧 Next Steps:');
console.log('1. Ensure all API keys are in .env.local');
console.log('2. Never commit .env.local to version control');
console.log('3. Use environment variables in server-side code only');
console.log('4. Regularly rotate your API keys');
console.log('5. Monitor API usage for unauthorized access');

console.log('\n📖 For detailed security information, see SECURITY_GUIDE.md'); 