// Script to update emails for all accounts
// Run: node backend/update-emails.js

import { accountQueries } from './db/db.js';
import PiggiAPI from './piggi-api.js';

async function updateEmails() {
  console.log('🔄 Updating emails for all accounts...\n');

  const accounts = await accountQueries.getAll();
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const account of accounts) {
    const displayName = account.phone_number || account.user_name || `Account #${account.id}`;
    
    // Skip if already has email
    if (account.email) {
      console.log(`⏭️  ${displayName}: Already has email (${account.email})`);
      skipped++;
      continue;
    }

    // Skip if no JWT token
    if (!account.jwt_token) {
      console.log(`⚠️  ${displayName}: No JWT token, skipping`);
      skipped++;
      continue;
    }

    try {
      const api = new PiggiAPI('', '', account.device_id, account.firebase_token);
      api.token = account.jwt_token;
      
      const result = await api.getMe();
      
      if (result.success && result.user.email) {
        await accountQueries.update(account.id, {
          email: result.user.email
        });
        console.log(`✅ ${displayName}: Updated email to ${result.user.email}`);
        updated++;
      } else if (result.success && !result.user.email) {
        console.log(`⚠️  ${displayName}: No email in user profile`);
        skipped++;
      } else {
        console.log(`❌ ${displayName}: Failed to get user info - ${result.error}`);
        failed++;
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ ${displayName}: Error - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📱 Total: ${accounts.length}`);

  process.exit(0);
}

updateEmails().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
