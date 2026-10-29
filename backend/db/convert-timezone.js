// Script to convert all timestamps from UTC to Vietnam timezone (UTC+7)
// This is a ONE-TIME migration for existing data

import db from './db.js';

async function convertTimezones() {
  console.log('🔄 Converting all timestamps to Vietnam timezone (UTC+7)...\n');

  try {
    // 1. Update checkin_history timestamps
    console.log('📊 Converting checkin_history.created_at...');
    const historyResult = await db.query(`
      UPDATE checkin_history 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
      WHERE created_at IS NOT NULL
      RETURNING id
    `);
    console.log(`✅ Updated ${historyResult.rowCount} checkin_history records`);

    // 2. Update accounts timestamps
    console.log('\n📊 Converting accounts timestamps...');
    
    const accountsResult = await db.query(`
      UPDATE accounts 
      SET 
        created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh',
        updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh',
        last_login_at = CASE 
          WHEN last_login_at IS NOT NULL 
          THEN last_login_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
          ELSE NULL 
        END,
        last_checkin_at = CASE 
          WHEN last_checkin_at IS NOT NULL 
          THEN last_checkin_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
          ELSE NULL 
        END
      RETURNING id
    `);
    console.log(`✅ Updated ${accountsResult.rowCount} accounts records`);

    // 3. Update api_logs timestamps
    console.log('\n📊 Converting api_logs.created_at...');
    const logsResult = await db.query(`
      UPDATE api_logs 
      SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'
      WHERE created_at IS NOT NULL
      RETURNING id
    `);
    console.log(`✅ Updated ${logsResult.rowCount} api_logs records`);

    // 4. Verify conversion
    console.log('\n🔍 Verifying conversion...');
    const sample = await db.query(`
      SELECT created_at, 
             created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' as vn_time
      FROM checkin_history 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (sample.rows.length > 0) {
      console.log('\n📅 Sample timestamp:');
      console.log(`   UTC:     ${sample.rows[0].created_at}`);
      console.log(`   VN Time: ${sample.rows[0].vn_time}`);
    }

    console.log('\n✅ ✅ ✅ All timestamps converted successfully!');
    console.log('\n⚠️  IMPORTANT: This script should only be run ONCE!');
    console.log('   Running it again will add another +7 hours.');

  } catch (error) {
    console.error('\n❌ Conversion failed:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

convertTimezones();
