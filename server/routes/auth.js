import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { JWT_SECRET } from '../middleware.js';

const router = express.Router();

// Login Endpoint
router.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

    let bestGardenId = user.garden_id;
    try {
      let hasAccess = false;
      
      // First, verify if the user still has access to their last saved garden
      if (bestGardenId) {
        if (user.role === 'god-admin') {
          const g = db.prepare('SELECT id FROM gardens WHERE id = ?').get(bestGardenId);
          if (g) hasAccess = true;
        } else {
          const access = db.prepare('SELECT garden_id FROM garden_members WHERE user_id = ? AND garden_id = ?').get(user.id, bestGardenId);
          if (access) hasAccess = true;
        }
      }

      // If they don't have a saved garden or lost access to it, find the next best one alphabetically
      if (!hasAccess) {
        let bestGarden;
        if (user.role === 'god-admin') {
          bestGarden = db.prepare(`
            SELECT g.id as garden_id
            FROM gardens g
            LEFT JOIN garden_members gm ON g.id = gm.garden_id AND gm.user_id = ?
            ORDER BY
              CASE COALESCE(gm.role, 'admin')
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'helper' THEN 3
                WHEN 'viewer' THEN 4
                ELSE 5
              END,
              g.name ASC
            LIMIT 1
          `).get(user.id);
        } else {
          bestGarden = db.prepare(`
            SELECT gm.garden_id
            FROM garden_members gm
            JOIN gardens g ON gm.garden_id = g.id
            WHERE gm.user_id = ?
            ORDER BY
              CASE gm.role
                WHEN 'owner' THEN 1
                WHEN 'helper' THEN 2
                WHEN 'viewer' THEN 3
                ELSE 4
              END,
              g.name ASC
            LIMIT 1
          `).get(user.id);
        }
        
        if (bestGarden && bestGarden.garden_id) {
          bestGardenId = bestGarden.garden_id;
          db.prepare('UPDATE users SET garden_id = ? WHERE id = ?').run(bestGardenId, user.id);
        }
      }
    } catch (e) {
      console.error('Error determining default garden:', e);
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name, 
        imageUrl: user.image_url,
        theme: user.theme,
        colorTheme: user.color_theme,
        iconTheme: user.icon_theme
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;