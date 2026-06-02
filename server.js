import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Initialize the SQLite database file
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    instances TEXT,
    archetypes TEXT,
    locations TEXT,
    zones TEXT
  );
`);

// Safely add the column for existing databases
try {
  db.exec('ALTER TABLE app_state ADD COLUMN locations TEXT;');
} catch (err) {}
try {
  db.exec('ALTER TABLE app_state ADD COLUMN zones TEXT;');
} catch (err) {}

// Seed the database with an empty row if it doesn't exist yet
const stmt = db.prepare('SELECT id FROM app_state WHERE id = 1');
if (!stmt.get()) {
  db.prepare('INSERT INTO app_state (id, instances, archetypes, locations, zones) VALUES (1, ?, ?, ?, ?)').run('[]', '[]', '[]', '[]');
}

app.get('/api/state', (req, res) => {
  const row = db.prepare('SELECT instances, archetypes, locations, zones FROM app_state WHERE id = 1').get();
  res.json({ instances: JSON.parse(row.instances), archetypes: JSON.parse(row.archetypes), locations: row.locations ? JSON.parse(row.locations) : [], zones: row.zones ? JSON.parse(row.zones) : [] });
});

app.post('/api/state', (req, res) => {
  db.prepare('UPDATE app_state SET instances = ?, archetypes = ?, locations = ?, zones = ? WHERE id = 1').run(JSON.stringify(req.body.instances), JSON.stringify(req.body.archetypes), JSON.stringify(req.body.locations), JSON.stringify(req.body.zones));
  res.json({ success: true });
});

app.listen(3001, '0.0.0.0', () => console.log('✅ 🌿 FloraSync SQLite API is running at http://localhost:3001'));