import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const db = new Database(DB_FILE);

console.log('🌿 Migrating pinned items from garden to per-user structure...');

try {
    // NOTE: Change 'pinned_zones' and 'gardens' to match the actual column and table names from your old schema!
    // If you used the legacy app_state, change 'gardens' to 'app_state'.
    const oldData = db.prepare("SELECT id, pinned_zones FROM gardens LIMIT 1").get();

    if (oldData && oldData.pinned_zones) {
        console.log(`Found old pinned data: ${oldData.pinned_zones}`);
        
        // NOTE: Change 'pinned_items' to match the new column name in your users table.
        // This assigns the legacy pinned items to your primary admin user.
        const updateStmt = db.prepare("UPDATE users SET pinned_items = ? WHERE username = 'admin'");
        const info = updateStmt.run(oldData.pinned_zones);

        if (info.changes > 0) {
            console.log('✅ Successfully migrated pinned items to the admin user!');
        } else {
            console.log('⚠️ Could not find the admin user to update.');
        }
    } else {
        console.log('ℹ️ No old pinned data found (or column is empty). Nothing to migrate.');
    }
} catch (err) {
    console.error('❌ Error updating database:', err.message);
    console.error('Did you forget to add the new column to the users table first?');
}