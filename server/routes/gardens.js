import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { authenticateToken } from '../middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');
const PLUGINS_DIR = path.join(ROOT_DIR, 'src/data/plugins');

const router = express.Router();

// Admin Endpoint to Get All Gardens
router.get('/api/gardens', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const gardens = db.prepare('SELECT id, name FROM gardens').all();
    res.json({ success: true, gardens });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Rename Garden
router.put('/api/gardens/:id', authenticateToken, (req, res) => {
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

// Endpoint to get all gardens the user has access to
router.get('/api/workspaces', authenticateToken, (req, res) => {
  try {
    let workspaces;
    if (req.user.role === 'god-admin') {
      workspaces = db.prepare(`
        SELECT g.id, g.name, g.image_url as imageUrl, COALESCE(gm.role, 'admin') as role 
        FROM gardens g
        LEFT JOIN garden_members gm ON g.id = gm.garden_id AND gm.user_id = ?
        ORDER BY g.name ASC
      `).all(req.user.id);
    } else {
      workspaces = db.prepare(`
        SELECT g.id, g.name, g.image_url as imageUrl, gm.role 
        FROM garden_members gm
        JOIN gardens g ON gm.garden_id = g.id
        WHERE gm.user_id = ?
        ORDER BY g.name ASC
      `).all(req.user.id);
    }
    res.json({ success: true, workspaces });
  } catch (err) {
    console.error('Error fetching workspaces:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Endpoint for users to update their shared garden's profile info
router.put('/api/garden/profile', authenticateToken, (req, res) => {
  const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
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

router.get('/api/state', authenticateToken, (req, res) => {
  try {
    let requestedGardenId = req.query.gardenId;
    let access;
    
    if (requestedGardenId) {
      access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, requestedGardenId);
      if (!access && req.user.role !== 'god-admin') return res.status(403).json({ error: 'Access denied to this garden.' });
      if (!access && req.user.role === 'god-admin') access = { role: 'admin' };
      db.prepare('UPDATE users SET garden_id = ? WHERE id = ?').run(requestedGardenId, req.user.id);
    } else {
      requestedGardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
      access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, requestedGardenId);
      if (!access && req.user.role === 'god-admin') access = { role: 'admin' };
    }

    const userRow = db.prepare('SELECT id, username, role, name, image_url, garden_id, theme, color_theme, icon_theme, installed_addons, active_addons, addon_settings FROM users WHERE id = ?').get(req.user.id);
    const dict = db.prepare('SELECT archetypes FROM shared_dictionary WHERE id = 1').get();
    const garden = db.prepare('SELECT id, name, image_url, instances, locations, zones, print_queue, journal FROM gardens WHERE id = ?').get(requestedGardenId);

    const safeParse = (str, fallback) => {
      if (!str || str === 'undefined') return fallback;
      try { return JSON.parse(str); } catch (e) { return fallback; }
    };

    const activeAddonsIds = safeParse(userRow?.active_addons, []);
    const activeAddonsManifests = [];
    for (const addonId of activeAddonsIds) {
      const manifestPath = path.join(PLUGINS_DIR, addonId, 'manifest.json');
      const builtInPath = path.join(ROOT_DIR, 'addons', addonId, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
         try { activeAddonsManifests.push(JSON.parse(fs.readFileSync(manifestPath, 'utf8'))); } catch (e) {}
      } else if (fs.existsSync(builtInPath)) {
         try { activeAddonsManifests.push(JSON.parse(fs.readFileSync(builtInPath, 'utf8'))); } catch (e) {}
      }
    }

    res.json({ 
      user: userRow ? { 
        id: userRow.id, 
        username: userRow.username, 
        role: userRow.role, 
        name: userRow.name || userRow.username, 
        imageUrl: userRow.image_url || '',
        workspaceRole: access?.role || 'viewer',
        theme: userRow.theme,
        colorTheme: userRow.color_theme,
        iconTheme: userRow.icon_theme,
        installedAddons: safeParse(userRow.installed_addons, []),
        activeAddons: activeAddonsIds,
        addonSettings: safeParse(userRow.addon_settings, {}),
        activeAddonManifests: activeAddonsManifests
      } : null,
      garden: garden ? {
        id: garden.id,
        name: garden.name,
        imageUrl: garden.image_url || ''
      } : null,
      archetypes: safeParse(dict?.archetypes, []), 
      instances: safeParse(garden?.instances, []), 
      locations: safeParse(garden?.locations, []), 
      zones: safeParse(garden?.zones, []),
      printQueue: safeParse(garden?.print_queue, []),
      gardenJournal: safeParse(garden?.journal, [])
    });
  } catch (err) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/api/state', authenticateToken, (req, res) => {
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    
    const access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, gardenId);
    const effectiveRole = access ? access.role : (req.user.role === 'god-admin' ? 'admin' : 'viewer');
    
    if (effectiveRole === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot modify the garden state.' });
    }
    
    db.prepare('UPDATE gardens SET instances = ?, locations = ?, zones = ?, print_queue = ?, journal = ? WHERE id = ?')
      .run(JSON.stringify(req.body.instances || []), JSON.stringify(req.body.locations || []), JSON.stringify(req.body.zones || []), JSON.stringify(req.body.printQueue || []), JSON.stringify(req.body.gardenJournal || []), gardenId);

    // 2. Only god-admin and owners can update the shared global dictionary
    if ((req.user.role === 'god-admin' || effectiveRole === 'owner') && req.body.archetypes) {
      db.prepare('UPDATE shared_dictionary SET archetypes = ? WHERE id = 1')
        .run(JSON.stringify(req.body.archetypes));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating state:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Bulk Action Endpoint: Log Rain
router.post('/api/gardens/action/rain', authenticateToken, (req, res) => {
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    const access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, gardenId);
    const effectiveRole = access ? access.role : (req.user.role === 'god-admin' ? 'admin' : 'viewer');
    
    if (effectiveRole === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot modify the garden state.' });
    }

    const garden = db.prepare('SELECT instances, locations, zones, journal FROM gardens WHERE id = ?').get(gardenId);
    if (!garden) return res.status(404).json({ error: 'Garden not found.' });

    const zones = JSON.parse(garden.zones || '[]');
    const locations = JSON.parse(garden.locations || '[]');
    let instances = JSON.parse(garden.instances || '[]');
    const journal = JSON.parse(garden.journal || '[]');

    // 1. Map hierarchy to find covered plants (exclusion list is safer)
    const coveredZoneIds = new Set(zones.filter(z => z.isCovered === true || z.isCovered === 'true').map(z => z.id));
    const coveredLocationIds = new Set(locations.filter(l => coveredZoneIds.has(l.zoneId)).map(l => l.id));

    // 2. Update all affected instances
    const now = new Date().toISOString();
    let wateredCount = 0;

    instances = instances.map(inst => {
      if (!coveredLocationIds.has(inst.locationId) && !inst.untracked) {
        wateredCount++;
        return { ...inst, lastWatered: now };
      }
      return inst;
    });

    // 3. Create a single, clean batch journal entry
    if (wateredCount > 0) {
      journal.push({
        id: `jnl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'water',
        title: 'Garden received rain 🌧️',
        note: `Mother Nature naturally watered ${wateredCount} outdoor plant${wateredCount === 1 ? '' : 's'}.`,
        authorName: req.user.name || req.user.username,
        targetType: 'garden',
        targetId: gardenId
      });
    }

    // 4. Save and return
    db.prepare('UPDATE gardens SET instances = ?, journal = ? WHERE id = ?')
      .run(JSON.stringify(instances), JSON.stringify(journal), gardenId);

    res.json({ success: true, wateredCount, instances, journal });
  } catch (err) {
    console.error('Error logging rain:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;