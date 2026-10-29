import db from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running email column migration...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'add-email-column.sql'),
      'utf8'
    );
    
    await db.query(sql);
    
    console.log('✅ Email column migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.end();
  }
}

runMigration();
