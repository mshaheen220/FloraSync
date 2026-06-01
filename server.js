import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the SQLite database file
const db = new Database('florasync.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    instances TEXT,
    archetypes TEXT
  );
`);

// Seed the database with an empty row if it doesn't exist yet
const stmt = db.prepare('SELECT id FROM app_state WHERE id = 1');
if (!stmt.get()) {
  db.prepare('INSERT INTO app_state (id, instances, archetypes) VALUES (1, ?, ?)').run('[]', '[]');
}

app.get('/api/state', (req, res) => {
  const row = db.prepare('SELECT instances, archetypes FROM app_state WHERE id = 1').get();
  res.json({ instances: JSON.parse(row.instances), archetypes: JSON.parse(row.archetypes) });
});

app.post('/api/state', (req, res) => {
  db.prepare('UPDATE app_state SET instances = ?, archetypes = ? WHERE id = 1').run(JSON.stringify(req.body.instances), JSON.stringify(req.body.archetypes));
  res.json({ success: true });
});

app.listen(3001, '0.0.0.0', () => console.log('🌿 FloraSync SQLite API running on port 3001'));