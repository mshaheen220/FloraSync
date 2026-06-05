import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const db = new Database(DB_FILE);

console.log('🌿 Starting FloraSync Shared Gardens Migration...');

try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS gardens (
        id TEXT PRIMARY KEY,
        name TEXT,
        instances TEXT,
        locations TEXT,
        zones TEXT
      );
    `);
    
    try { db.exec('ALTER TABLE users ADD COLUMN garden_id TEXT;'); } catch (e) {}

    let userGardens = [];
    try { userGardens = db.prepare('SELECT * FROM user_gardens').all(); } catch (e) {}
    
    for (const ug of userGardens) {
        const user = db.prepare('SELECT name, username FROM users WHERE id = ?').get(ug.user_id);
        const gardenName = user ? `${user.name || user.username}'s Garden` : `Garden ${ug.user_id}`;
        const gardenId = `gdn-${ug.user_id}`;

        db.prepare('INSERT OR REPLACE INTO gardens (id, name, instances, locations, zones) VALUES (?, ?, ?, ?, ?)').run(gardenId, gardenName, ug.instances, ug.locations, ug.zones);
        db.prepare('UPDATE users SET garden_id = ? WHERE id = ?').run(gardenId, ug.user_id);
    }

    try { db.exec('DROP TABLE IF EXISTS user_gardens_legacy_backup;'); } catch (e) {}
    try { db.exec('ALTER TABLE user_gardens RENAME TO user_gardens_legacy_backup;'); } catch (e) {}
    console.log('🎉 Migration Complete! Your database now supports Shared Gardens.');
} catch (err) {
    console.error('❌ Migration failed:', err);
}