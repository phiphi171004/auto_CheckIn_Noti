// Final fix: Add +7 hours to ALL timestamps to get correct VN time
// This fixes the rollback that went too far back

import db from './db.js';

async function fixTimezonesFinal() {
  console.log('🔄 Final timezone fix: Adding +7 hours to all timestamps...\n');

  try {
    // 1. Fix checkin_history
    console.log('📊 Fixing checkin_history.created_at...');
    const historyResult = await db.query(`
      UPDATE checkin_history 
      SET created_at = created_at + INTERVAL '7 hours'
      WHERE created_at IS NOT NULL
      RETURNING id
    `);
    console.log(`✅ Fixed ${historyResult.rowCount} checkin_history records`);

    // 2. Fix accounts
    console.log('\n📊 Fixing accounts timestamps...');
    const accountsResult = await db.query(`
      UPDATE accounts 
      SET 
        created_at = created_at + INTERVAL '7 hours',
        updated_at = updated_at + INTERVAL '7 hours',
        last_login_at = CASE 
          WHEN last_login_at IS NOT NULL 
          THEN last_login_at + INTERVAL '7 hours'
          ELSE NULL 
        END,
        last_checkin_at = CASE 
          WHEN last_checkin_at IS NOT NULL 
          THEN last_checkin_at + INTERVAL '7 hours'
          ELSE NULL 
        END
      RETURNING id
    `);
    console.log(`✅ Fixed ${accountsResult.rowCount} accounts records`);

    // 3. Fix api_logs
    console.log('\n📊 Fixing api_logs.created_at...');
    const logsResult = await db.query(`
      UPDATE api_logs 
      SET created_at = created_at + INTERVAL '7 hours'
      WHERE created_at IS NOT NULL
      RETURNING id
    `);
    console.log(`✅ Fixed ${logsResult.rowCount} api_logs records`);

    // 4. Verify
    console.log('\n🔍 Verifying fix...');
    const sample = await db.query(`
      SELECT created_at
      FROM checkin_history 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    console.log('\n📅 Sample recent timestamps:');
    sample.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.created_at}`);
    });

    console.log('\n✅ All timestamps fixed to Vietnam time!');
    console.log('\n📋 Summary:');
    console.log('   - Database now stores Vietnam time (UTC+7)');
    console.log('   - Frontend displays timestamps directly (no conversion)');
    console.log('   - Cron runs on Vietnam timezone');

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

fixTimezonesFinal();
