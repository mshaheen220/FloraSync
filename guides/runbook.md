# FloraSync 🌿 - Operations & Runbook

This document is the official operational manual for developing, deploying, and recovering the FloraSync application across your local network.

## 🏗️ 1. Making Changes (On Your MacBook)

When you want to add a new feature or update the code, you will do all your active development on your primary modern MacBook.

### Local Development
1. Start the backend API: `npm run api`
2. Start the Vite frontend: `npm run dev`
3. Open `http://localhost:5173` to test your changes.

### Preparing for Deployment
Because the deployment server (TheForge) is running an older macOS that cannot natively compile the frontend via `esbuild`, you must build the UI on your laptop and transfer the static files over:

## ⚡ 1. Fast Way (Automated)
   ```bash
   ./scripts/bash/deploy-mac.sh
   ```

## 🐢 2. Manual Way
1. **Build the production UI:**
   ```bash
   npm run build
   ```
2. **Compress the build folder:**
   ```bash
   tar -czf dist.tar.gz dist
   ```
3. **Send the compressed file to TheForge's home folder:** *(Sending to `~` bypasses macOS Full Disk Access restrictions)*
   ```bash
   scp dist.tar.gz michael@theforge.local:~
   ```
4. **Commit and push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Describe your changes"
   git push
   ```

---

## 🚀 2. Deploying (On TheForge)

Once the UI is compiled and transferred, SSH or Screen Share into *TheForge* and open a terminal.

### ⚡ 1. Fast Way (Automated)
   ```bash
   ./scripts/bash/deploy-forge.sh
   ```

### 🐢 2. Manual Way
```bash
# 1. Navigate to the project folder
cd /Users/michael/Documents/dev/FloraSync

# 2. Ensure a clean slate and pull the latest backend code from GitHub
git restore .
git pull

# 3. Move the zipped UI from the home folder and extract it
mv ~/dist.tar.gz .
tar -xzf dist.tar.gz

# 4. Clean the node_modules and strictly install the backend dependencies
# (The --omit=dev flag prevents Vite/esbuild from crashing the install)
rm -rf node_modules
npm install --omit=dev

# 5. Restart the PM2 application to apply the changes
pm2 restart florasync
```

*Your updates are now live at `https://theforge.local:8080`!*

---

## ⚡ 3. Disaster Recovery (Power Outages & Reboots)

If TheForge loses power or reboots, the servers *should* automatically come back online. If they don't, or if you need to manually restart the services from scratch, follow these steps on **TheForge**:

### Restarting the Node Backend (PM2)
PM2 manages the Node API and serves the database and UI on Port 5050.
```bash
cd /Users/michael/Documents/dev/FloraSync

# Start the server explicitly on Port 5050 in production mode
NODE_ENV=production PORT=5050 pm2 start scripts/node/server.js --name "florasync"

# Save the current PM2 state so it auto-starts on the next boot
pm2 save
```

### Restarting the Web Server (Caddy)
Caddy acts as the front door. It listens on Port 8080, handles the secure `https://` local certificates (which are strictly required for your iPhone's camera to work), and securely routes traffic to the backend on Port 5050.
```bash
# Start Caddy in the background using your global config file
caddy start --config ~/.config/caddy/Caddyfile
```
*(If Caddy is already running but acting up, use `caddy reload --config ~/.config/caddy/Caddyfile` instead).*

#### This script should start up both
   ```bash
   ./scripts/bash/restart-forge.sh
   ```


---

## 💾 4. Database Management & Backups

Your entire physical garden (your `PlantInstances`) lives solely inside the `florasync.db` SQLite file on TheForge. Always back it up before making major changes!

### Backing up the garden
Run this command on TheForge to safely export your living garden to a timestamped JSON file in `src/data/backups/`:
```bash
npm run backup
```

### Restoring the garden
If your database gets corrupted or accidentally wiped, run this command on TheForge to instantly inject the most recent JSON backup back into SQLite:
```bash
npm run restore
```