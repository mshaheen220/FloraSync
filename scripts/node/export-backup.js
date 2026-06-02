import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const DB_FILE = path.join(ROOT_DIR, 'florasync.db');
const BACKUP_DIR = path.join(ROOT_DIR, 'src/data/backups');

console.log('💾 FloraSync Database Backup');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

try {
  const db = new Database(DB_FILE, { fileMustExist: true });
  const row = db.prepare('SELECT instances FROM app_state WHERE id = 1').get();
  
  if (row && row.instances) {
    const instances = JSON.parse(row.instances);
    
    // Create a timestamped backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `instances_backup_${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(instances, null, 2));
    console.log(`✅ Successfully backed up ${instances.length} active plant instances to:\n   ${backupPath}`);
  } else {
    console.log('⚠️ No instances found in the database to backup.');
  }
} catch (err) {
  console.error('❌ Failed to backup database:', err.message);
}