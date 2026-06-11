import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

// Initialize the SQLite database file
const db = new Database(DB_FILE);

// Enable WAL mode and optimize synchronization for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    image_url TEXT,
    garden_id TEXT,
    theme TEXT,
    color_theme TEXT,
    icon_theme TEXT
  );

  CREATE TABLE IF NOT EXISTS shared_dictionary (
    id INTEGER PRIMARY KEY,
    archetypes TEXT
  );

  CREATE TABLE IF NOT EXISTS gardens (
    id TEXT PRIMARY KEY,
    name TEXT,
    instances TEXT,
    locations TEXT,
    zones TEXT,
    print_queue TEXT,
    journal TEXT,
    image_url TEXT
  );
`);

// Safely add columns for existing databases that were already migrated
const migrations = [
  'ALTER TABLE users ADD COLUMN name TEXT;',
  'ALTER TABLE users ADD COLUMN image_url TEXT;',
  'ALTER TABLE gardens ADD COLUMN image_url TEXT;',
  "ALTER TABLE gardens ADD COLUMN print_queue TEXT DEFAULT '[]';",
  "ALTER TABLE gardens ADD COLUMN installed_addons TEXT DEFAULT '[]';",
  "ALTER TABLE gardens ADD COLUMN active_addons TEXT DEFAULT '[]';",
  "ALTER TABLE gardens ADD COLUMN addon_settings TEXT DEFAULT '{}';",
  'ALTER TABLE users ADD COLUMN theme TEXT;',
  'ALTER TABLE users ADD COLUMN color_theme TEXT;',
  'ALTER TABLE users ADD COLUMN icon_theme TEXT;',
  "ALTER TABLE users ADD COLUMN installed_addons TEXT DEFAULT '[]';",
  "ALTER TABLE users ADD COLUMN active_addons TEXT DEFAULT '[]';",
  "ALTER TABLE users ADD COLUMN addon_settings TEXT DEFAULT '{}';",
  "ALTER TABLE gardens ADD COLUMN journal TEXT DEFAULT '[]';"
];

for (const query of migrations) {
  try {
    db.exec(query);
  } catch (err) {}
}

// Auto-create shared dictionary row if missing
const dictStmt = db.prepare('SELECT id FROM shared_dictionary WHERE id = 1');
if (!dictStmt.get()) {
  db.prepare('INSERT INTO shared_dictionary (id, archetypes) VALUES (1, ?)').run('[]');
}

// Export the database instance for use in our routes
export default db;