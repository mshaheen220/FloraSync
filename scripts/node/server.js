import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');
const PRINTS_DIR = path.join(ROOT_DIR, 'src/data/code-prints');

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

// Endpoint to trigger Python QR Generator
app.post('/api/generate-qrs', (req, res) => {
  const { mode, category, prefix, startId } = req.body;
  let command = '';

  if (mode === 'db') {
    command = `python3 scripts/python/make_qrs.py --from-db`;
  } else if (mode === 'blank') {
    if (!category || !prefix || !startId) {
      return res.status(400).json({ error: 'Missing required fields for blank tags' });
    }
    command = `python3 scripts/python/make_qrs.py --category ${category} --prefix ${prefix} --start-id ${startId}`;
  } else {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  exec(command, { cwd: ROOT_DIR }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating QRs: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    
    const files = [];
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.includes('Saved printable template to')) {
        const filePath = line.split('Saved printable template to ')[1].trim();
        const fileName = path.basename(filePath);
        files.push(fileName);
      }
    }

    res.json({ success: true, files, output: stdout });
  });
});

// API to list all generated QR sheets
app.get('/api/prints', (req, res) => {
  try {
    if (!fs.existsSync(PRINTS_DIR)) {
      return res.json({ files: [] });
    }
    // Return files sorted by newest first
    const files = fs.readdirSync(PRINTS_DIR)
      .filter(f => f.endsWith('.png'))
      .map(f => ({ name: f, time: fs.statSync(path.join(PRINTS_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to securely download a generated sheet
app.get('/api/prints/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).send('Invalid file');
  }
  const filePath = path.join(PRINTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Serve the built static React frontend from the dist directory
const DIST_DIR = path.join(ROOT_DIR, 'dist');
app.use(express.static(DIST_DIR));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ 🌿 FloraSync SQLite API is running on port ${PORT}`));