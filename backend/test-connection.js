import pool from './db/db.js';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully!');
    console.log(`🕐 Server time (UTC): ${result.rows[0].current_time}`);
    
    // Test VN timezone
    const vnTime = await pool.query(`SELECT TIMEZONE('Asia/Ho_Chi_Minh', NOW()) as vn_time`);
    console.log(`🇻🇳 VN time (UTC+7): ${vnTime.rows[0].vn_time}`);
    
    // Test tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    console.log(`\n📊 Tables found: ${tables.rows.map(r => r.table_name).join(', ')}`);
    
    // Count records
    const accounts = await pool.query('SELECT COUNT(*) FROM accounts');
    const history = await pool.query('SELECT COUNT(*) FROM checkin_history');
    const logs = await pool.query('SELECT COUNT(*) FROM api_logs');
    
    console.log('\n📈 Record counts:');
    console.log(`   Accounts: ${accounts.rows[0].count}`);
    console.log(`   Check-in History: ${history.rows[0].count}`);
    console.log(`   API Logs: ${logs.rows[0].count}`);
    
    console.log('\n✨ All checks passed! Ready to deploy.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(error.message);
    console.log('\n💡 Check your DATABASE_URL in .env file\n');
    process.exit(1);
  }
}

testConnection();
