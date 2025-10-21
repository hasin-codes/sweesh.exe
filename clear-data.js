/**
 * Clear All User Data Script
 * 
 * This script clears all user data including:
 * - Authentication tokens
 * - API keys
 * - Onboarding status
 * - Transcriptions
 * 
 * Run this script with: node clear-data.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine the app name and user data path
const appName = 'sweesh'; // This should match your app name in package.json
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', appName);

console.log('Sweesh Data Cleaner');
console.log('===================');
console.log(`Looking for user data at: ${userDataPath}`);
console.log('');

// Files to delete
const filesToDelete = [
  'auth.enc',
  'credentials.enc',
  'onboarding.json',
  'transcriptions.json'
];

let deletedCount = 0;
let notFoundCount = 0;

// Check if user data directory exists
if (!fs.existsSync(userDataPath)) {
  console.log('❌ User data directory not found.');
  console.log('   This means no data has been stored yet, or the app name is different.');
  console.log('');
  console.log('Common locations on Windows:');
  console.log(`   - ${path.join(os.homedir(), 'AppData', 'Roaming', 'sweesh-pc')}`);
  console.log(`   - ${path.join(os.homedir(), 'AppData', 'Roaming', 'sweesh')}`);
  console.log(`   - ${path.join(os.homedir(), 'AppData', 'Roaming', 'Electron')}`);
  process.exit(0);
}

console.log('✓ User data directory found!');
console.log('');

// Delete each file
filesToDelete.forEach(fileName => {
  const filePath = path.join(userDataPath, fileName);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted: ${fileName}`);
      deletedCount++;
    } catch (error) {
      console.log(`❌ Failed to delete ${fileName}: ${error.message}`);
    }
  } else {
    console.log(`- Not found: ${fileName}`);
    notFoundCount++;
  }
});

console.log('');
console.log('Summary:');
console.log(`  Deleted: ${deletedCount} file(s)`);
console.log(`  Not found: ${notFoundCount} file(s)`);
console.log('');
console.log('✓ Data clearing complete!');
console.log('  You can now restart the app to see the onboarding flow.');

