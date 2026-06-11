import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import authRoutes from './server/routes/auth.js';
import usersRoutes from './server/routes/users.js';
import gardensRoutes from './server/routes/gardens.js';
import addonsRoutes from './server/routes/addons.js';
import systemRoutes from './server/routes/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

// Ensure Plugins directory exists
const PLUGINS_DIR = path.join(ROOT_DIR, 'src/data/plugins');
if (!fs.existsSync(PLUGINS_DIR)) {
  fs.mkdirSync(PLUGINS_DIR, { recursive: true });
}

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

// Mount Modular Routes
app.use('/', authRoutes);
app.use('/', usersRoutes);
app.use('/', gardensRoutes);
app.use('/', addonsRoutes);
app.use('/', systemRoutes);

// Serve the built static React frontend from the dist directory
const DIST_DIR = path.join(ROOT_DIR, 'dist');
app.use('/plugins', express.static(PLUGINS_DIR));
app.use(express.static(DIST_DIR));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`✅ 🌿 FloraSync API running smoothly on port ${PORT}`));
