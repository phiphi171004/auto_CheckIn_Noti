import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('🔄 Starting database migration...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    console.log('📝 Creating tables...');
    await pool.query(schema);
    console.log('✅ Tables created successfully\n');

    // Check if we need to migrate existing account from .env
    const phoneNumber = process.env.PHONE_NUMBER;
    const password = process.env.PASSWORD;
    const deviceId = process.env.DEVICE_ID;
    const cronSchedule = process.env.CHECKIN_CRON || '0 6 * * *';

    if (phoneNumber && password && deviceId) {
      console.log('📱 Found account in .env, migrating...');
      
      // Check if account already exists
      const existingAccount = await pool.query(
        'SELECT * FROM accounts WHERE phone_number = $1',
        [phoneNumber]
      );

      if (existingAccount.rows.length === 0) {
        // Insert account
        await pool.query(
          `INSERT INTO accounts 
           (phone_number, password, device_id, cron_schedule) 
           VALUES ($1, $2, $3, $4)`,
          [phoneNumber, password, deviceId, cronSchedule]
        );
        console.log(`✅ Account migrated: ${phoneNumber}\n`);
      } else {
        console.log(`⚠️  Account already exists: ${phoneNumber}\n`);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Database Summary:');
    
    // Show accounts count
    const accountsCount = await pool.query('SELECT COUNT(*) FROM accounts');
    console.log(`   Accounts: ${accountsCount.rows[0].count}`);

    // Show active accounts
    const activeAccounts = await pool.query(
      'SELECT id, phone_number, cron_schedule, is_active FROM accounts ORDER BY id'
    );
    
    if (activeAccounts.rows.length > 0) {
      console.log('\n📋 Active Accounts:');
      activeAccounts.rows.forEach(acc => {
        console.log(`   [${acc.id}] ${acc.phone_number} - ${acc.cron_schedule} - ${acc.is_active ? '✅ Active' : '❌ Inactive'}`);
      });
    }

    console.log('\n✅ Ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrate();
