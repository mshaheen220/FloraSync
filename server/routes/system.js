import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import bcrypt from 'bcrypt';
import db from '../database.js';
import { authenticateToken } from '../middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');
const PRINTS_DIR = path.join(ROOT_DIR, 'src/data/code-prints');

const router = express.Router();

// Endpoint to trigger Python QR Generator
router.post('/api/generate-qrs', authenticateToken, (req, res) => {
  const { mode, category, prefix, startId } = req.body;
  const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
  let command = '';

  // Smartly use a virtual environment if it exists, otherwise fallback to global python3
  const pythonCmd = fs.existsSync(path.join(ROOT_DIR, '.venv/bin/python3')) ? '.venv/bin/python3' : 'python3';

  if (mode === 'db') {
    command = `${pythonCmd} scripts/python/make_qrs.py --from-db --garden-id "${gardenId}"`;
  } else if (mode === 'blank') {
    if (!category || !prefix || !startId) {
      return res.status(400).json({ error: 'Missing required fields for blank tags' });
    }
    command = `${pythonCmd} scripts/python/make_qrs.py --category ${category} --prefix ${prefix} --start-id ${startId} --garden-id "${gardenId}"`;
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
router.get('/api/prints', authenticateToken, (req, res) => {
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    const gardenPrintsDir = path.join(PRINTS_DIR, gardenId || 'default');
    if (!fs.existsSync(gardenPrintsDir)) {
      return res.json({ files: [] });
    }
    // Return files sorted by newest first
    const files = fs.readdirSync(gardenPrintsDir)
      .filter(f => f.endsWith('.png'))
      .map(f => ({ name: f, time: fs.statSync(path.join(gardenPrintsDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API to securely download a generated sheet
router.get('/api/prints/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).send('Invalid file');
  }
  const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
  const gardenPrintsDir = path.join(PRINTS_DIR, gardenId || 'default');
  const filePath = path.join(gardenPrintsDir, filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// API to securely delete a generated sheet
router.delete('/api/prints/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ success: false, error: 'Invalid file' });
  }
  const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
  const gardenPrintsDir = path.join(PRINTS_DIR, gardenId || 'default');
  const filePath = path.join(gardenPrintsDir, filename);
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

// Endpoint to Initialize and Reset the Demo Garden
router.post('/api/system/reset-demo', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can reset the demo garden.' });
  }

  try {
    const demoUserId = 'usr-demo-001';
    const demoGardenId = 'gdn-demo-001';
    
    // 1. Ensure the demo user exists (reset password to 'demo' just in case)
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('demo');
    const passwordHash = bcrypt.hashSync('demo', 10);
    
    if (!existingUser) {
      db.prepare('INSERT INTO users (id, username, password_hash, role, name, garden_id) VALUES (?, ?, ?, ?, ?, ?)').run(
        demoUserId, 'demo', passwordHash, 'demo', 'Demo User', demoGardenId
      );
    } else {
      db.prepare('UPDATE users SET password_hash = ?, role = ?, garden_id = ? WHERE id = ?').run(
        passwordHash, 'demo', demoGardenId, existingUser.id
      );
    }

    // 2. Load Seed Data (or fallback to an empty sandbox layout)
    let instances = '[]';
    let locations = JSON.stringify([{ id: 'loc-demo-1', name: 'Main Bed', zoneId: 'zone-demo-1' }]);
    let zones = JSON.stringify([{ id: 'zone-demo-1', name: 'Sandbox Area', isCovered: false, evaporationModifier: 1.0 }]);
    let journal = '[]';

    const seedPath = path.join(ROOT_DIR, 'src/data/demo-seed.json');
    if (fs.existsSync(seedPath)) {
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      if (seedData.instances) instances = JSON.stringify(seedData.instances);
      if (seedData.locations) locations = JSON.stringify(seedData.locations);
      if (seedData.zones) zones = JSON.stringify(seedData.zones);
      if (seedData.journal) journal = JSON.stringify(seedData.journal);
    }

    // 3. Upsert the demo garden
    const existingGarden = db.prepare('SELECT id FROM gardens WHERE id = ?').get(demoGardenId);
    if (!existingGarden) {
      db.prepare('INSERT INTO gardens (id, name, instances, locations, zones, journal) VALUES (?, ?, ?, ?, ?, ?)').run(demoGardenId, 'FloraSync Sandbox', instances, locations, zones, journal);
    } else {
      db.prepare('UPDATE gardens SET name = ?, instances = ?, locations = ?, zones = ?, journal = ? WHERE id = ?').run('FloraSync Sandbox', instances, locations, zones, journal, demoGardenId);
    }

    // 4. Ensure permissions are set properly
    const finalUserId = existingUser ? existingUser.id : demoUserId;
    db.prepare('INSERT INTO garden_members (user_id, garden_id, role) VALUES (?, ?, ?) ON CONFLICT(user_id, garden_id) DO UPDATE SET role = excluded.role').run(finalUserId, demoGardenId, 'demo');
    db.prepare('INSERT INTO garden_members (user_id, garden_id, role) VALUES (?, ?, ?) ON CONFLICT(user_id, garden_id) DO UPDATE SET role = excluded.role').run(req.user.id, demoGardenId, 'owner');

    res.json({ success: true, message: 'Demo garden initialized and reset!' });
  } catch (err) {
    console.error('Error resetting demo garden:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;