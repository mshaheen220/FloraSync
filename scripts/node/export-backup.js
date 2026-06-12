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
  
  const users = db.prepare('SELECT * FROM users').all();
  const garden_members = db.prepare('SELECT * FROM garden_members').all();
  
  const gardens = db.prepare('SELECT * FROM gardens').all().map(g => {
    try { g.instances = JSON.parse(g.instances || '[]'); } catch(e) { g.instances = []; }
    try { g.locations = JSON.parse(g.locations || '[]'); } catch(e) { g.locations = []; }
    try { g.zones = JSON.parse(g.zones || '[]'); } catch(e) { g.zones = []; }
    try { g.print_queue = JSON.parse(g.print_queue || '[]'); } catch(e) { g.print_queue = []; }
    try { g.journal = JSON.parse(g.journal || '[]'); } catch(e) { g.journal = []; }
    return g;
  });

  const shared_dictionary = db.prepare('SELECT * FROM shared_dictionary').all().map(d => {
    try { d.archetypes = JSON.parse(d.archetypes || '[]'); } catch(e) { d.archetypes = []; }
    return d;
  });
    
  const state = {
    users,
    gardens,
    shared_dictionary,
    garden_members
  };
    
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `full_backup_${timestamp}.json`);
    
  fs.writeFileSync(backupPath, JSON.stringify(state, null, 2));
  
  let totalInstances = 0;
  gardens.forEach(g => {
    totalInstances += (g.instances ? g.instances.length : 0);
  });

  console.log(`✅ Successfully backed up ${gardens.length} gardens (${totalInstances} total plants) and all system data to:\n   ${backupPath}`);
} catch (err) {
  console.error('❌ Failed to backup database:', err.message);
}