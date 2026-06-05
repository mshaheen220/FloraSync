import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const db = new Database(DB_FILE);

console.log('🌿 Updating God-Admin display name...');

try {
    const info = db.prepare("UPDATE users SET name = 'Michael' WHERE username = 'admin'").run();
    if (info.changes > 0) {
        console.log('✅ Successfully updated the admin display name to "Michael"!');
    } else {
        console.log('⚠️ Could not find the admin user. Have you run the migration script?');
    }
} catch (err) {
    console.error('❌ Error updating database:', err.message);
}