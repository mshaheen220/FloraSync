import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const db = new Database(DB_FILE);

console.log('🌿 Starting FloraSync Workspace (Multi-Garden) Migration...');

try {
    // 1. Create the new junction table with the access role
    db.exec(`
      CREATE TABLE IF NOT EXISTS garden_members (
        user_id TEXT,
        garden_id TEXT,
        role TEXT,
        PRIMARY KEY (user_id, garden_id)
      );
    `);
    console.log('✅ Created garden_members junction table.');

    // 2. Migrate existing users into the junction table as 'owner'
    const users = db.prepare('SELECT id, garden_id FROM users WHERE garden_id IS NOT NULL').all();
    const insertMember = db.prepare('INSERT OR IGNORE INTO garden_members (user_id, garden_id, role) VALUES (?, ?, ?)');
    
    let migratedCount = 0;
    for (const user of users) {
        insertMember.run(user.id, user.garden_id, 'owner');
        migratedCount++;
    }
    
    console.log(`✅ Migrated ${migratedCount} users into their gardens as 'owner'.`);
    console.log('🎉 Migration Complete! Your database now supports Workspace roles (owner, helper, viewer).');
} catch (err) {
    console.error('❌ Migration failed:', err);
}