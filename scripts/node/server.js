import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');
const PRINTS_DIR = path.join(ROOT_DIR, 'src/data/code-prints');
const IMPORTS_DIR = path.join(ROOT_DIR, 'src/data/imports');
const JWT_SECRET = process.env.JWT_SECRET || 'florasync-secret-key-123'; // In a real prod environment, use an environment variable

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Simple request logger to verify proxy is working
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

// Initialize the SQLite database file
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT,
    image_url TEXT,
    garden_id TEXT
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
    image_url TEXT
  );
`);

// Safely add columns for existing databases that were already migrated
try {
  db.exec('ALTER TABLE users ADD COLUMN name TEXT;');
} catch (err) {}
try {
  db.exec('ALTER TABLE users ADD COLUMN image_url TEXT;');
} catch (err) {}
try {
  db.exec('ALTER TABLE gardens ADD COLUMN image_url TEXT;');
} catch (err) {}

// Auto-create shared dictionary row if missing
const dictStmt = db.prepare('SELECT id FROM shared_dictionary WHERE id = 1');
if (!dictStmt.get()) {
  db.prepare('INSERT INTO shared_dictionary (id, archetypes) VALUES (1, ?)').run('[]');
}

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Support token via header OR query string (for file downloads like QR sheets)
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, gardenId: user.garden_id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name, imageUrl: user.image_url } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Create Users
app.post('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can create new users.' });
  }

  const { username, password, name = '', gardenId, role = 'garden-owner' } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase());
    if (existing) return res.status(400).json({ error: 'Username already exists.' });

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const targetGardenId = gardenId || `gdn-${userId}`;
    let createdGardenName = null;

    if (!gardenId) {
      createdGardenName = `${name || username}'s Garden`;
      db.prepare('INSERT INTO gardens (id, name, instances, locations, zones) VALUES (?, ?, ?, ?, ?)').run(targetGardenId, createdGardenName, '[]', '[]', '[]');
    } else {
      createdGardenName = db.prepare('SELECT name FROM gardens WHERE id = ?').get(targetGardenId)?.name || 'Unknown Garden';
    }

    db.prepare('INSERT INTO users (id, username, password_hash, role, name, garden_id) VALUES (?, ?, ?, ?, ?, ?)').run(userId, username.toLowerCase(), passwordHash, role, name, targetGardenId);

    res.json({ 
      success: true, 
      user: { id: userId, username: username.toLowerCase(), role, name, gardenName: createdGardenName },
      newGarden: !gardenId ? { id: targetGardenId, name: createdGardenName } : null
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Get All Gardens
app.get('/api/gardens', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const gardens = db.prepare('SELECT id, name FROM gardens').all();
    res.json({ success: true, gardens });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Rename Garden
app.put('/api/gardens/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required.' });
  try {
    db.prepare('UPDATE gardens SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Get All Users
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can view users.' });
  }
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.image_url as imageUrl, g.name as gardenName 
      FROM users u 
      LEFT JOIN gardens g ON u.garden_id = g.id
    `).all();
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Delete User
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can delete users.' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself.' });
  }
  try {
    const user = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.params.id);
    
    // Clean up any legacy backups that might be enforcing foreign key constraints
    try { db.prepare('DELETE FROM user_gardens_legacy_backup WHERE user_id = ?').run(req.params.id); } catch (e) {}
    try { db.prepare('DELETE FROM user_gardens WHERE user_id = ?').run(req.params.id); } catch (e) {}
    
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    
    // If they were the last user in that garden, delete the garden too to save space
    const remaining = db.prepare('SELECT count(*) as count FROM users WHERE garden_id = ?').get(user.garden_id);
    if (remaining.count === 0) {
      db.prepare('DELETE FROM gardens WHERE id = ?').run(user.garden_id);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Reset User Password
app.put('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can edit users.' });
  }
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required.' });
  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Endpoint for users to update their own profile info
app.put('/api/users/:id/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Not authorized to edit this profile.' });
  }
  const { name, imageUrl } = req.body;
  try {
    db.prepare('UPDATE users SET name = ?, image_url = ? WHERE id = ?').run(name || '', imageUrl || '', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Endpoint for users to update their own password
app.put('/api/users/:id/password', authenticateToken, (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Not authorized to change this password.' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new passwords are required.' });
  
  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const validPassword = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Incorrect current password.' });

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Endpoint for users to update their shared garden's profile info
app.put('/api/garden/profile', authenticateToken, (req, res) => {
  const gardenId = req.user.gardenId || db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
  const { name, imageUrl } = req.body;
  if (!gardenId) return res.status(400).json({ error: 'No garden assigned.' });
  try {
    db.prepare('UPDATE gardens SET name = ?, image_url = ? WHERE id = ?').run(name || 'My Garden', imageUrl || '', gardenId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating garden profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/state', authenticateToken, (req, res) => {
  try {
    const userRow = db.prepare('SELECT id, username, role, name, image_url, garden_id FROM users WHERE id = ?').get(req.user.id);
    const gardenId = userRow?.garden_id || req.user.gardenId;
    const dict = db.prepare('SELECT archetypes FROM shared_dictionary WHERE id = 1').get();
    const garden = db.prepare('SELECT id, name, image_url, instances, locations, zones FROM gardens WHERE id = ?').get(gardenId);

    const safeParse = (str, fallback) => {
      if (!str || str === 'undefined') return fallback;
      try { return JSON.parse(str); } catch (e) { return fallback; }
    };

    res.json({ 
      user: userRow ? { 
        id: userRow.id, 
        username: userRow.username, 
        role: userRow.role, 
        name: userRow.name || userRow.username, 
        imageUrl: userRow.image_url || '' 
      } : null,
      garden: garden ? {
        id: garden.id,
        name: garden.name,
        imageUrl: garden.image_url || ''
      } : null,
      archetypes: safeParse(dict?.archetypes, []), 
      instances: safeParse(garden?.instances, []), 
      locations: safeParse(garden?.locations, []), 
      zones: safeParse(garden?.zones, []) 
    });
  } catch (err) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/state', authenticateToken, (req, res) => {
  try {
    const gardenId = req.user.gardenId || db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    
    db.prepare('UPDATE gardens SET instances = ?, locations = ?, zones = ? WHERE id = ?')
      .run(JSON.stringify(req.body.instances || []), JSON.stringify(req.body.locations || []), JSON.stringify(req.body.zones || []), gardenId);

    // 2. Only god-admin can update the shared global dictionary
    if (req.user.role === 'god-admin' && req.body.archetypes) {
      db.prepare('UPDATE shared_dictionary SET archetypes = ? WHERE id = 1')
        .run(JSON.stringify(req.body.archetypes));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating state:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to trigger Python QR Generator
app.post('/api/generate-qrs', authenticateToken, (req, res) => {
  const { mode, category, prefix, startId } = req.body;
  let command = '';

  // Smartly use a virtual environment if it exists, otherwise fallback to global python3
  const pythonCmd = fs.existsSync(path.join(ROOT_DIR, '.venv/bin/python3')) ? '.venv/bin/python3' : 'python3';

  if (mode === 'db') {
    command = `${pythonCmd} scripts/python/make_qrs.py --from-db`;
  } else if (mode === 'blank') {
    if (!category || !prefix || !startId) {
      return res.status(400).json({ error: 'Missing required fields for blank tags' });
    }
    command = `${pythonCmd} scripts/python/make_qrs.py --category ${category} --prefix ${prefix} --start-id ${startId}`;
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
app.get('/api/prints', authenticateToken, (req, res) => {
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
app.get('/api/prints/:filename', authenticateToken, (req, res) => {
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

// API to securely delete a generated sheet
app.delete('/api/prints/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ success: false, error: 'Invalid file' });
  }
  const filePath = path.join(PRINTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

// API to import a JSON array by leveraging the import-seed.js script
app.post('/api/import', authenticateToken, (req, res) => {
  // Restrict massive bulk imports to god-admins only to protect the database
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ success: false, error: 'Only admins can import data.' });
  }

  const { type, data } = req.body;

  if (!['archetypes', 'zones', 'locations'].includes(type) || !Array.isArray(data)) {
    return res.status(400).json({ success: false, error: 'Invalid import type or data format.' });
  }

  try {
    if (type === 'archetypes') {
      const dictRow = db.prepare('SELECT archetypes FROM shared_dictionary WHERE id = 1').get();
      let currentList = [];
      try { currentList = JSON.parse(dictRow?.archetypes || '[]'); } catch (e) {}
      
      const existingIds = new Set(currentList.map(item => item.id));
      for (const item of data) {
        if (item.id && !existingIds.has(item.id)) {
          currentList.push(item);
          existingIds.add(item.id);
        }
      }
      db.prepare('UPDATE shared_dictionary SET archetypes = ? WHERE id = 1').run(JSON.stringify(currentList));
    } else {
      const gardenId = req.user.gardenId || db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
      const gardenRow = db.prepare(`SELECT ${type} FROM gardens WHERE id = ?`).get(gardenId);
      let currentList = [];
      try { currentList = JSON.parse(gardenRow?.[type] || '[]'); } catch (e) {}

      const existingIds = new Set(currentList.map(item => item.id));
      for (const item of data) {
        if (item.id && !existingIds.has(item.id)) {
          currentList.push(item);
          existingIds.add(item.id);
        }
      }
      db.prepare(`UPDATE gardens SET ${type} = ? WHERE id = ?`).run(JSON.stringify(currentList), gardenId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Import failed:', err);
    res.status(500).json({ success: false, error: 'Server error during import.' });
  }
});

// Serve the built static React frontend from the dist directory
const DIST_DIR = path.join(ROOT_DIR, 'dist');
app.use(express.static(DIST_DIR));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`✅ 🌿 FloraSync SQLite API is running on port ${PORT} (Dual Stack)`));