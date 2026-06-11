import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
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

export default router;