import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const DB_FILE = path.join(ROOT_DIR, 'florasync.db');
const BACKUP_DIR = path.join(ROOT_DIR, 'src/data/backups');

// Parse command line arguments
const args = process.argv.slice(2);
let targetGardenId = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--garden' && args[i + 1]) {
    targetGardenId = args[i + 1];
  }
}

console.log(targetGardenId ? `💾 FloraSync Targeted Backup: ${targetGardenId}` : '💾 FloraSync Database Backup');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

try {
  const db = new Database(DB_FILE, { fileMustExist: true });
  
  let users, garden_members, gardens, shared_dictionary;

  if (targetGardenId) {
    // Targeted Backup
    gardens = db.prepare('SELECT * FROM gardens WHERE id = ?').all(targetGardenId);
    if (gardens.length === 0) {
      console.error(`❌ Garden with ID ${targetGardenId} not found.`);
      process.exit(1);
    }
    
    garden_members = db.prepare('SELECT * FROM garden_members WHERE garden_id = ?').all(targetGardenId);
    
    const userIds = garden_members.map(m => m.user_id);
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      users = db.prepare(`SELECT * FROM users WHERE id IN (${placeholders})`).all(...userIds);
    } else {
      users = [];
    }
  } else {
    // Full Backup
    users = db.prepare('SELECT * FROM users').all();
    garden_members = db.prepare('SELECT * FROM garden_members').all();
    gardens = db.prepare('SELECT * FROM gardens').all();
  }
  
  gardens = gardens.map(g => {
    try { g.instances = JSON.parse(g.instances || '[]'); } catch(e) { g.instances = []; }
    try { g.locations = JSON.parse(g.locations || '[]'); } catch(e) { g.locations = []; }
    try { g.zones = JSON.parse(g.zones || '[]'); } catch(e) { g.zones = []; }
    try { g.print_queue = JSON.parse(g.print_queue || '[]'); } catch(e) { g.print_queue = []; }
    try { g.journal = JSON.parse(g.journal || '[]'); } catch(e) { g.journal = []; }
    return g;
  });

  const state = {
    users,
    gardens,
    garden_members
  };

  // Only include the global dictionary for full backups
  if (!targetGardenId) {
    state.shared_dictionary = db.prepare('SELECT * FROM shared_dictionary').all().map(d => {
      try { d.archetypes = JSON.parse(d.archetypes || '[]'); } catch(e) { d.archetypes = []; }
      return d;
    });
  }
    
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const prefix = targetGardenId ? `garden_${targetGardenId}` : 'full_backup';
  const backupPath = path.join(BACKUP_DIR, `${prefix}_${timestamp}.json`);
    
  fs.writeFileSync(backupPath, JSON.stringify(state, null, 2));
  
  let totalInstances = 0;
  gardens.forEach(g => {
    totalInstances += (g.instances ? g.instances.length : 0);
  });

  if (targetGardenId) {
    console.log(`✅ Successfully backed up garden '${gardens[0].name}' (${totalInstances} total plants) and ${users.length} associated user(s) to:\n   ${backupPath}`);
  } else {
    console.log(`✅ Successfully backed up ${gardens.length} gardens (${totalInstances} total plants) and all system data to:\n   ${backupPath}`);
  }
} catch (err) {
  console.error('❌ Failed to backup database:', err.message);
}