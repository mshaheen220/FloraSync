import express from 'express';
import bcrypt from 'bcrypt';
import db from '../database.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

// Admin Endpoint to Create Users
router.post('/api/users', authenticateToken, (req, res) => {
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
    db.prepare('INSERT INTO garden_members (user_id, garden_id, role) VALUES (?, ?, ?)').run(userId, targetGardenId, 'owner');

    res.json({ 
      success: true, 
      user: { id: userId, username: username.toLowerCase(), role, name, accesses: [{ id: targetGardenId, name: createdGardenName, role: 'owner' }] },
      newGarden: !gardenId ? { id: targetGardenId, name: createdGardenName } : null
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Get All Users
router.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can view users.' });
  }
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.image_url as imageUrl,
      (
        SELECT json_group_array(json_object('id', g.id, 'name', g.name, 'role', gm.role))
        FROM garden_members gm
        JOIN gardens g ON gm.garden_id = g.id
        WHERE gm.user_id = u.id
      ) as accesses
      FROM users u
    `).all();
    users.forEach(u => {
      try { u.accesses = JSON.parse(u.accesses); } catch (e) { u.accesses = []; }
    });
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Delete User
router.delete('/api/users/:id', authenticateToken, (req, res) => {
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
    
    db.prepare('DELETE FROM garden_members WHERE user_id = ?').run(req.params.id);
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

// Admin Endpoint to Get User Garden Access
router.get('/api/users/:id/gardens', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can view user gardens.' });
  }
  try {
    const access = db.prepare(`
      SELECT gm.garden_id as gardenId, g.name as gardenName, gm.role 
      FROM garden_members gm
      JOIN gardens g ON gm.garden_id = g.id
      WHERE gm.user_id = ?
    `).all(req.params.id);
    res.json({ success: true, access });
  } catch (err) {
    console.error('Error fetching user garden access:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Grant Garden Access
router.post('/api/users/:id/gardens', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can grant garden access.' });
  }
  const { gardenId, role } = req.body;
  if (!gardenId || !role) {
    return res.status(400).json({ error: 'Garden ID and role are required.' });
  }

  try {
    db.prepare(`
      INSERT INTO garden_members (user_id, garden_id, role) 
      VALUES (?, ?, ?) 
      ON CONFLICT(user_id, garden_id) 
      DO UPDATE SET role = excluded.role
    `).run(req.params.id, gardenId, role);
    res.json({ success: true });
  } catch (err) {
    console.error('Error granting garden access:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Revoke Garden Access
router.delete('/api/users/:id/gardens/:gardenId', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin') {
    return res.status(403).json({ error: 'Only admins can revoke garden access.' });
  }
  
  try {
    db.prepare('DELETE FROM garden_members WHERE user_id = ? AND garden_id = ?').run(req.params.id, req.params.gardenId);
    
    const user = db.prepare('SELECT garden_id FROM users WHERE id = ?').get(req.params.id);
    if (user && user.garden_id === req.params.gardenId) {
      const otherGarden = db.prepare('SELECT garden_id FROM garden_members WHERE user_id = ? LIMIT 1').get(req.params.id);
      db.prepare('UPDATE users SET garden_id = ? WHERE id = ?').run(otherGarden ? otherGarden.garden_id : null, req.params.id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error revoking garden access:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Admin Endpoint to Reset User Password
router.put('/api/users/:id', authenticateToken, (req, res) => {
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
router.put('/api/users/:id/profile', authenticateToken, (req, res) => {
  if (req.user.role !== 'god-admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Not authorized to edit this profile.' });
  }
  const { name, imageUrl, theme, colorTheme, iconTheme } = req.body;
  try {
    // Using COALESCE allows partial updates (e.g. only updating the theme without wiping out the name)
    db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name), 
        image_url = COALESCE(?, image_url),
        theme = COALESCE(?, theme),
        color_theme = COALESCE(?, color_theme),
        icon_theme = COALESCE(?, icon_theme)
      WHERE id = ?
    `).run(
      name !== undefined ? name : null, 
      imageUrl !== undefined ? imageUrl : null, 
      theme !== undefined ? theme : null, 
      colorTheme !== undefined ? colorTheme : null, 
      iconTheme !== undefined ? iconTheme : null, 
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Endpoint for users to update their own password
router.put('/api/users/:id/password', authenticateToken, (req, res) => {
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

export default router;