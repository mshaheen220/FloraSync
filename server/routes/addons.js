import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import AdmZip from 'adm-zip';
import db from '../database.js';
import { authenticateToken } from '../middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '../..');
const PLUGINS_DIR = path.join(ROOT_DIR, 'src/data/plugins');

const router = express.Router();

const validatePluginManifest = (manifest) => {
  const requiredFields = ['id', 'name', 'version', 'uninstallScript'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      return { valid: false, error: `Invalid Plugin Package: Missing required field '${field}'. Plugins must include an uninstallScript for cleanup.` };
    }
  }
  return { valid: true };
};

router.post('/api/addons/install', authenticateToken, async (req, res) => {
  const { zipData, manifest: providedManifest } = req.body;
  if (!zipData && !providedManifest) return res.status(400).json({ error: 'No plugin package provided.' });
  
  try {
    const userRow = db.prepare('SELECT installed_addons FROM users WHERE id = ?').get(req.user.id);
    const addons = JSON.parse(userRow?.installed_addons || '[]');

    // Handle official/built-in plugins that don't require ZIP extraction
    if (!zipData && providedManifest) {
      if (!addons.includes(providedManifest.id)) {
        addons.push(providedManifest.id);
        db.prepare('UPDATE users SET installed_addons = ? WHERE id = ?').run(JSON.stringify(addons), req.user.id);
      }
      return res.json({ success: true, installedAddons: addons, manifest: providedManifest });
    }

    // 1. Unpack the ZIP in memory and locate the manifest
    const buffer = Buffer.from(zipData, 'base64');
    const zip = new AdmZip(buffer);
    const manifestEntry = zip.getEntries().find(e => 
      !e.isDirectory && 
      e.entryName.endsWith('manifest.json') && 
      !e.entryName.includes('__MACOSX') && 
      !e.entryName.includes('._')
    );
    if (!manifestEntry) return res.status(400).json({ error: 'Invalid Package: missing manifest.json' });

    const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
    const validation = validatePluginManifest(manifest);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    
    // 2. Smartly extract the plugin files (Flattens top-level folders if the user zipped a folder)
    const targetDir = path.join(PLUGINS_DIR, manifest.id);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    const manifestPathParts = manifestEntry.entryName.split('/');
    const basePath = manifestPathParts.length > 1 ? manifestPathParts.slice(0, -1).join('/') + '/' : '';

    zip.getEntries().forEach(entry => {
      if (entry.isDirectory || entry.entryName.includes('__MACOSX') || entry.entryName.includes('._')) return;
      const relativePath = (basePath && entry.entryName.startsWith(basePath)) ? entry.entryName.substring(basePath.length) : entry.entryName;
      const fullPath = path.join(targetDir, relativePath);
      if (!fs.existsSync(path.dirname(fullPath))) fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, entry.getData());
    });

    if (!addons.includes(manifest.id)) {
      addons.push(manifest.id);
      db.prepare('UPDATE users SET installed_addons = ? WHERE id = ?').run(JSON.stringify(addons), req.user.id);
    }

    // 3. Always run the install script on upload so developers can test logic without uninstalling
    if (manifest.installScript) {
      console.log(`[PLUGIN] Dynamically executing ${manifest.installScript} from package...`);
      const scriptPath = path.join(targetDir, manifest.installScript);
      if (fs.existsSync(scriptPath)) {
        // Cache-busting query parameter ensures Node doesn't use the old version in memory
        const pluginModule = await import(pathToFileURL(scriptPath).href + '?t=' + Date.now());
        if (typeof pluginModule.install === 'function') {
          await pluginModule.install(db, gardenId);
        }
      }
    }

    res.json({ success: true, installedAddons: addons, manifest });
  } catch (err) {
    console.error('Plugin Install Error:', err);
    res.status(500).json({ error: 'Failed to install plugin package.' });
  }
});

router.post('/api/addons/uninstall', authenticateToken, async (req, res) => {
  const { manifest } = req.body;
  const addonId = manifest?.id;
  if (!addonId) return res.status(400).json({ error: 'Valid Addon Manifest required.' });

  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;

    const userRow = db.prepare('SELECT installed_addons, active_addons FROM users WHERE id = ?').get(req.user.id);
    let installed = JSON.parse(userRow?.installed_addons || '[]');
    let active = JSON.parse(userRow?.active_addons || '[]');
    
    if (installed.includes(addonId)) {
      installed = installed.filter(id => id !== addonId);
      active = active.filter(id => id !== addonId);
      db.prepare('UPDATE users SET installed_addons = ?, active_addons = ? WHERE id = ?').run(JSON.stringify(installed), JSON.stringify(active), req.user.id);
      
      const targetDir = path.join(PLUGINS_DIR, manifest.id);
      if (manifest.uninstallScript) {
        console.log(`[PLUGIN] Dynamically executing ${manifest.uninstallScript} from package...`);
        const scriptPath = path.join(targetDir, manifest.uninstallScript);
        if (fs.existsSync(scriptPath)) {
          const pluginModule = await import(pathToFileURL(scriptPath).href);
          if (typeof pluginModule.uninstall === 'function') {
            await pluginModule.uninstall(db, gardenId);
          }
        }
      }
      
      // Clean up server disk space
      if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
    }
    res.json({ success: true, installedAddons: installed, activeAddons: active });
  } catch (err) {
    console.error('Plugin Uninstall Error:', err);
    res.status(500).json({ error: 'Failed to uninstall plugin package.' });
  }
});

router.post('/api/addons/activate', authenticateToken, (req, res) => {
  const { addonId } = req.body;
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    const access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, gardenId);
    const effectiveRole = access ? access.role : (req.user.role === 'god-admin' ? 'admin' : 'viewer');
    
    if (req.user.role !== 'god-admin' && effectiveRole !== 'owner') {
      return res.status(403).json({ error: 'Only admins and owners can activate add-ons.' });
    }

    const userRow = db.prepare('SELECT active_addons FROM users WHERE id = ?').get(req.user.id);
    const active = JSON.parse(userRow?.active_addons || '[]');
    if (!active.includes(addonId)) {
      active.push(addonId);
      db.prepare('UPDATE users SET active_addons = ? WHERE id = ?').run(JSON.stringify(active), req.user.id);
    }
    res.json({ success: true, activeAddons: active });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/api/addons/deactivate', authenticateToken, (req, res) => {
  const { addonId } = req.body;
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    const access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, gardenId);
    const effectiveRole = access ? access.role : (req.user.role === 'god-admin' ? 'admin' : 'viewer');
    
    if (req.user.role !== 'god-admin' && effectiveRole !== 'owner') {
      return res.status(403).json({ error: 'Only admins and owners can deactivate add-ons.' });
    }

    const userRow = db.prepare('SELECT active_addons FROM users WHERE id = ?').get(req.user.id);
    let active = JSON.parse(userRow?.active_addons || '[]');
    active = active.filter(id => id !== addonId);
    db.prepare('UPDATE users SET active_addons = ? WHERE id = ?').run(JSON.stringify(active), req.user.id);
    res.json({ success: true, activeAddons: active });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/api/addons/execute', authenticateToken, async (req, res) => {
  const { addonId, actionId, contextData } = req.body;
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    let targetDir = path.join(PLUGINS_DIR, addonId);
    
    let manifestPath = path.join(targetDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      targetDir = path.join(ROOT_DIR, 'addons', addonId);
      manifestPath = path.join(targetDir, 'manifest.json');
    }
    if (!fs.existsSync(manifestPath)) return res.status(404).json({ error: 'Plugin not found.' });
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.executeScript) return res.status(400).json({ error: 'Plugin does not support backend execution.' });

    const scriptPath = path.join(targetDir, manifest.executeScript);
    if (fs.existsSync(scriptPath)) {
      // Dynamically load the execute.js script from the plugin package
      const pluginModule = await import(pathToFileURL(scriptPath).href + '?t=' + Date.now());
      if (typeof pluginModule.execute === 'function') {
        const result = await pluginModule.execute(db, gardenId, actionId, contextData, req.user);
        return res.json({ success: true, result });
      }
    }
    res.status(500).json({ error: 'Execution script failed or not found.' });
  } catch (err) {
    console.error('Plugin Execution Error:', err);
    res.status(500).json({ error: 'Failed to execute plugin action.' });
  }
});

router.post('/api/addons/settings', authenticateToken, (req, res) => {
  const { addonId, settings } = req.body;
  try {
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.user.id)?.garden_id;
    const access = db.prepare('SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?').get(req.user.id, gardenId);
    const effectiveRole = access ? access.role : (req.user.role === 'god-admin' ? 'admin' : 'viewer');
    
    if (req.user.role !== 'god-admin' && effectiveRole !== 'owner') {
      return res.status(403).json({ error: 'Only admins and owners can modify add-on settings.' });
    }

    const userRow = db.prepare('SELECT addon_settings FROM users WHERE id = ?').get(req.user.id);
    const allSettings = JSON.parse(userRow?.addon_settings || '{}');
    allSettings[addonId] = settings;
    db.prepare('UPDATE users SET addon_settings = ? WHERE id = ?').run(JSON.stringify(allSettings), req.user.id);
    res.json({ success: true, addonSettings: allSettings });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;