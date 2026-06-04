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
  const row = db.prepare('SELECT instances, archetypes, locations, zones FROM app_state WHERE id = 1').get();
  
  if (row) {
    const safeParse = (str) => {
      try { return JSON.parse(str || '[]'); } catch (e) { return []; }
    };
    
    const state = {
      instances: safeParse(row.instances),
      archetypes: safeParse(row.archetypes),
      locations: safeParse(row.locations),
      zones: safeParse(row.zones)
    };
    
    // Create a timestamped backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `full_backup_${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(state, null, 2));
    const totalInstances = state.instances.length;
    console.log(`✅ Successfully backed up ${totalInstances} active plant instances (and all other data) to:\n   ${backupPath}`);
  } else {
    console.log('⚠️ No state found in the database to backup.');
  }
} catch (err) {
  console.error('❌ Failed to backup database:', err.message);
}