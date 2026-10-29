import pool from './db/db.js';
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `backup_${timestamp}.sql`;
  
  try {
    console.log('📦 Starting database backup...\n');
    
    // Export accounts
    const accounts = await pool.query('SELECT * FROM accounts ORDER BY id');
    console.log(`✅ Accounts: ${accounts.rows.length} records`);
    
    // Export checkin_history
    const history = await pool.query('SELECT * FROM checkin_history ORDER BY created_at DESC');
    console.log(`✅ Check-in History: ${history.rows.length} records`);
    
    // Export api_logs
    const logs = await pool.query('SELECT * FROM api_logs ORDER BY created_at DESC');
    console.log(`✅ API Logs: ${logs.rows.length} records`);
    
    // Generate SQL
    let sql = '-- Piggi Auto Check-in Database Backup\n';
    sql += `-- Date: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`;
    sql += `-- Timezone: Asia/Ho_Chi_Minh (UTC+7)\n\n`;
    
    sql += '-- Accounts\n';
    sql += 'TRUNCATE TABLE accounts RESTART IDENTITY CASCADE;\n';
    accounts.rows.forEach(row => {
      const values = Object.keys(row).map(key => {
        const val = row[key];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return val;
      }).join(', ');
      sql += `INSERT INTO accounts (${Object.keys(row).join(', ')}) VALUES (${values});\n`;
    });
    
    sql += '\n-- Check-in History\n';
    sql += 'TRUNCATE TABLE checkin_history RESTART IDENTITY CASCADE;\n';
    history.rows.forEach(row => {
      const values = Object.keys(row).map(key => {
        const val = row[key];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (val instanceof Date) return `'${val.toISOString()}'`;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        return val;
      }).join(', ');
      sql += `INSERT INTO checkin_history (${Object.keys(row).join(', ')}) VALUES (${values});\n`;
    });
    
    sql += '\n-- API Logs\n';
    sql += 'TRUNCATE TABLE api_logs RESTART IDENTITY CASCADE;\n';
    logs.rows.forEach(row => {
      const values = Object.keys(row).map(key => {
        const val = row[key];
        if (val === null) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return val;
      }).join(', ');
      sql += `INSERT INTO api_logs (${Object.keys(row).join(', ')}) VALUES (${values});\n`;
    });
    
    // Write to file
    fs.writeFileSync(filename, sql);
    
    console.log(`\n✅ Backup completed: ${filename}`);
    console.log(`📊 Total: ${accounts.rows.length + history.rows.length + logs.rows.length} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase();
