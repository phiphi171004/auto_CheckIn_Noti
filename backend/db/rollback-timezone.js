// Rollback timezone conversion (subtract 7 hours back to UTC)
import db from './db.js';

async function rollbackTimezones() {
  console.log('🔄 Rolling back timezone conversion (converting back to UTC)...\n');

  try {
    // 1. Rollback checkin_history
    console.log('📊 Rolling back checkin_history.created_at...');
    const historyResult = await db.query(`
      UPDATE checkin_history 
      SET created_at = created_at - INTERVAL '7 hours'
      WHERE created_at IS NOT NULL
      RETURNING id
    `);
    console.log(`✅ Rolled back ${historyResult.rowCount} checkin_history records`);

    // 2. Rollback accounts
    console.log('\n📊 Rolling back accounts timestamps...');
    const accountsResult = await db.query(`
      UPDATE accounts 
      SET 
        created_at = created_at - INTERVAL '7 hours',
        updated_at = updated_at - INTERVAL '7 hours',
        last_login_at = CASE 
          WHEN last_login_at IS NOT NULL 
          THEN last_login_at - INTERVAL '7 hours'
          ELSE NULL 
        END,
        last_checkin_at = CASE 
          WHEN last_checkin_at IS NOT NULL 
          THEN last_checkin_at - INTERVAL '7 hours'
          ELSE NULL 
        END
      RETURNING id
    `);
    console.log(`✅ Rolled back ${accountsResult.rowCount} accounts records`);

    // 3. Rollback api_logs
    console.log('\n📊 Rolling back api_logs.created_at...');
    const logsResult = await db.query(`
      UPDATE api_logs 
      SET created_at = created_at - INTERVAL '7 hours'
      WHERE created_at IS NOT NULL
      RETURNING id
    `);
    console.log(`✅ Rolled back ${logsResult.rowCount} api_logs records`);

    console.log('\n✅ All timestamps rolled back to UTC successfully!');

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    throw error;
  } finally {
    await db.end();
  }
}

rollbackTimezones();
