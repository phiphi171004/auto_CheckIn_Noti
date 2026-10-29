import pool from './db.js';

async function checkTimestamps() {
  try {
    console.log('\n📊 Checking latest timestamps...\n');
    
    // Check latest checkin_history
    const checkins = await pool.query(`
      SELECT id, account_id, created_at, 
             TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as formatted
      FROM checkin_history 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('🔹 Latest Check-ins:');
    checkins.rows.forEach(row => {
      console.log(`  ID ${row.id} - Account ${row.account_id}: ${row.formatted}`);
    });
    
    // Check current VN time
    const now = await pool.query(`
      SELECT 
        TIMEZONE('Asia/Ho_Chi_Minh', NOW()) as vn_time,
        TO_CHAR(TIMEZONE('Asia/Ho_Chi_Minh', NOW()), 'DD/MM/YYYY HH24:MI:SS') as formatted
    `);
    
    console.log('\n🕐 Current VN Time (from DB):');
    console.log(`  ${now.rows[0].formatted}`);
    
    // Check latest accounts update
    const accounts = await pool.query(`
      SELECT id, phone_number, email, last_checkin_at,
             TO_CHAR(last_checkin_at, 'DD/MM/YYYY HH24:MI:SS') as formatted
      FROM accounts 
      WHERE last_checkin_at IS NOT NULL
      ORDER BY last_checkin_at DESC 
      LIMIT 3
    `);
    
    console.log('\n🔹 Latest Account Updates:');
    accounts.rows.forEach(row => {
      const identifier = row.email || row.phone_number || `ID ${row.id}`;
      console.log(`  ${identifier}: ${row.formatted}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTimestamps();
