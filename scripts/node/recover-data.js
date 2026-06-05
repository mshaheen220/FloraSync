import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const db = new Database(DB_FILE);

console.log('🚨 Starting FloraSync Data Recovery...');

try {
    // 1. Find the admin user's ID and their assigned garden ID
    const admin = db.prepare("SELECT id, garden_id FROM users WHERE role = 'god-admin'").get();
    if (!admin) {
        console.error('❌ CRITICAL: God-admin user not found. Cannot proceed with recovery.');
        process.exit(1);
    }
    if (!admin.garden_id) {
        console.error('❌ CRITICAL: Admin user does not have a garden_id. The shared garden migration may not have run correctly.');
        process.exit(1);
    }
    console.log(`✅ Found admin user (${admin.id}) assigned to garden (${admin.garden_id})`);

    // 2. Read data from the legacy backup table
    const backupState = db.prepare('SELECT * FROM app_state_legacy_backup WHERE id = 1').get();
    if (!backupState || !backupState.archetypes || backupState.archetypes === '[]') {
        console.error('❌ CRITICAL: No data found in app_state_legacy_backup. Recovery is not possible with this script.');
        process.exit(1);
    }
    console.log('✅ Found legacy data in backup table.');

    // 3. Force-insert the archetypes into the shared dictionary
    db.prepare('INSERT OR REPLACE INTO shared_dictionary (id, archetypes) VALUES (1, ?)').run(backupState.archetypes);
    console.log('✅ Recovered Plant Dictionary.');

    // 4. Force-insert the garden data into the correct garden table
    db.prepare('INSERT OR REPLACE INTO gardens (id, name, instances, locations, zones) VALUES (?, ?, ?, ?, ?)').run(admin.garden_id, "Michael's Garden", backupState.instances, backupState.locations, backupState.zones);
    console.log(`✅ Recovered garden data and restored to garden: ${admin.garden_id}`);

    console.log('\n🎉🎉🎉 Recovery Complete! Please restart the server with `pm2 restart florasync` and check your data.');
} catch (err) {
    console.error('❌ An unexpected error occurred during recovery:', err);
}