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

  if (state.gardens && state.users) {
    console.log('V2 Multi-Tenant backup format detected.');
    
    db.transaction(() => {
      // Clear tables
      db.prepare('DELETE FROM garden_members').run();
      db.prepare('DELETE FROM gardens').run();
      db.prepare('DELETE FROM shared_dictionary').run();
      db.prepare('DELETE FROM users').run();

      // Insert shared dictionary
      for (const d of state.shared_dictionary) {
        const archStr = typeof d.archetypes === 'string' ? d.archetypes : JSON.stringify(d.archetypes || []);
        db.prepare('INSERT INTO shared_dictionary (id, archetypes) VALUES (?, ?)').run(d.id, archStr);
      }

      // Insert gardens
      for (const g of state.gardens) {
        if (typeof g.instances !== 'string') g.instances = JSON.stringify(g.instances || []);
        if (typeof g.locations !== 'string') g.locations = JSON.stringify(g.locations || []);
        if (typeof g.zones !== 'string') g.zones = JSON.stringify(g.zones || []);
        if (typeof g.print_queue !== 'string') g.print_queue = JSON.stringify(g.print_queue || []);
        if (typeof g.journal !== 'string') g.journal = JSON.stringify(g.journal || []);
        
        const columns = Object.keys(g);
        const placeholders = columns.map(() => '?').join(', ');
        db.prepare(`INSERT INTO gardens (${columns.join(', ')}) VALUES (${placeholders})`).run(...Object.values(g));
      }

      // Insert users
      for (const u of state.users) {
        // Users might have stringified arrays, handle them just in case
        if (Array.isArray(u.installed_addons)) u.installed_addons = JSON.stringify(u.installed_addons);
        if (Array.isArray(u.active_addons)) u.active_addons = JSON.stringify(u.active_addons);
        if (typeof u.addon_settings === 'object' && u.addon_settings !== null) u.addon_settings = JSON.stringify(u.addon_settings);

        const columns = Object.keys(u);
        const placeholders = columns.map(() => '?').join(', ');
        db.prepare(`INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`).run(...Object.values(u));
      }

      // Insert garden_members
      for (const gm of state.garden_members) {
        const columns = Object.keys(gm);
        const placeholders = columns.map(() => '?').join(', ');
        db.prepare(`INSERT INTO garden_members (${columns.join(', ')}) VALUES (${placeholders})`).run(...Object.values(gm));
      }
    })();
    
    let totalInstances = 0;
    state.gardens.forEach(g => {
      try {
        const inst = typeof g.instances === 'string' ? JSON.parse(g.instances) : g.instances;
        totalInstances += inst.length;
      } catch(e) {}
    });
    
    console.log(`✅ Successfully restored ${state.gardens.length} gardens (${totalInstances} total plants) and all system data from:\n   ${latestBackup}`);
  } else {
    console.log('Legacy backup format detected.');
    
    const admin = db.prepare("SELECT id, garden_id FROM users WHERE role = 'god-admin'").get();
    if (!admin || !admin.garden_id) {
       console.log('❌ Cannot restore legacy backup: God-admin or their garden is missing.');
       process.exit(1);
    }
    
    let instances, archetypes, locations, zones;
    if (Array.isArray(state)) {
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

    db.prepare('UPDATE gardens SET instances = ?, locations = ?, zones = ? WHERE id = ?')
      .run(JSON.stringify(instances), JSON.stringify(locations), JSON.stringify(zones), admin.garden_id);
      
    db.prepare('UPDATE shared_dictionary SET archetypes = ? WHERE id = 1')
      .run(JSON.stringify(archetypes));
      
    console.log(`✅ Successfully restored legacy backup into Garden ${admin.garden_id} from:\n   ${latestBackup}`);
  }
} catch (err) {
  console.error('❌ Failed to restore database:', err.message);
}