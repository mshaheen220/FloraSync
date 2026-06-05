import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const db = new Database(DB_FILE);

console.log('🌿 Starting FloraSync Multi-Tenant Migration...');

// 1. Fetch existing legacy data
let oldState;
try { oldState = db.prepare('SELECT * FROM app_state WHERE id = 1').get(); } catch (err) {}

if (!oldState) {
    console.log('✅ No existing app_state found. Migration already completed!');
    process.exit(0);
}

// 2. Create the new Multi-Tenant Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS shared_dictionary (
    id INTEGER PRIMARY KEY,
    archetypes TEXT
  );

  CREATE TABLE IF NOT EXISTS user_gardens (
    user_id TEXT PRIMARY KEY,
    instances TEXT,
    locations TEXT,
    zones TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// 3. Setup the God-Admin Account
const adminId = 'usr-admin-001';
const adminUsername = 'admin';
const plainPassword = 'changeme123'; // You will log in with this later and can build a UI to change it
const adminName = 'Michael';
const saltRounds = 10;
const passwordHash = bcrypt.hashSync(plainPassword, saltRounds);

const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);

if (!existingAdmin) {
    db.prepare('INSERT INTO users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)').run(adminId, adminUsername, passwordHash, 'god-admin', adminName);
    console.log(`✅ Created God-Admin user | Username: ${adminUsername} | Password: ${plainPassword}`);
    
    // 4. Migrate the Data to the new tables
    db.prepare('INSERT INTO shared_dictionary (id, archetypes) VALUES (1, ?)').run(oldState.archetypes);
    console.log('✅ Migrated Plant Dictionary to global shared table.');

    db.prepare('INSERT INTO user_gardens (user_id, instances, locations, zones) VALUES (?, ?, ?, ?)').run(adminId, oldState.instances, oldState.locations, oldState.zones);
    console.log('✅ Migrated existing garden data to the new admin account.');

    // 5. Rename old table to serve as a rollback backup
    db.exec('ALTER TABLE app_state RENAME TO app_state_legacy_backup;');
    console.log('✅ Backed up legacy app_state table.');
} else {
    console.log('⚠️ Admin user already exists. Migration was likely already run. Aborting to prevent overwrites.');
}

console.log('🎉 Migration Complete! Your database is now ready for Multi-Tenant architecture.');