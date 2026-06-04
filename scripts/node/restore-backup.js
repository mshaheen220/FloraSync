import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const DB_FILE = path.join(ROOT_DIR, 'florasync.db');
const BACKUP_DIR = path.join(ROOT_DIR, 'src/data/backups');

console.log('🔄 FloraSync Database Restore');

if (!fs.existsSync(BACKUP_DIR)) {
  console.log('⚠️ No backups directory found.');
  process.exit(1);
}

const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.log('⚠️ No backup files found in the backups directory.');
  process.exit(1);
}

// Sort files alphabetically descending (since they are timestamped, the newest is first)
files.sort((a, b) => b.localeCompare(a));
const latestBackup = files[0];
const backupPath = path.join(BACKUP_DIR, latestBackup);

try {
  const db = new Database(DB_FILE, { fileMustExist: true });
  const backupData = fs.readFileSync(backupPath, 'utf8');
  const state = JSON.parse(backupData);

  // Handle both old (array of instances) and new (state object) backup formats
  let instances, archetypes, locations, zones;
  if (Array.isArray(state)) {
    console.log('Legacy backup format detected (instances only).');
    instances = state;
    archetypes = [];
    locations = [];
    zones = [];
  } else {
    instances = state.instances || [];
    archetypes = state.archetypes || [];
    locations = state.locations || [];
    zones = state.zones || [];
  }

  db.prepare('UPDATE app_state SET instances = ?, archetypes = ?, locations = ?, zones = ? WHERE id = 1')
    .run(JSON.stringify(instances), JSON.stringify(archetypes), JSON.stringify(locations), JSON.stringify(zones));
    
  console.log(`✅ Successfully restored ${instances.length} active plant instances (and all other data) from:\n   ${latestBackup}`);
} catch (err) {
  console.error('❌ Failed to restore database:', err.message);
}