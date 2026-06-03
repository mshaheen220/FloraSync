# FloraSync 🌿 - Operations & Runbook

This document is the official operational manual for developing, deploying, and recovering the FloraSync application across your local network.

## 🏗️ 1. Making Changes (On Your MacBook)

When you want to add a new feature or update the code, you will do all your active development on your primary modern MacBook.

### Local Development
1. Start the backend API: `npm run api`
2. Start the Vite frontend: `npm run dev`
3. Open `http://localhost:5173` to test your changes.

### Preparing for Deployment
Because the deployment server (TheForge) is running an older macOS that cannot natively compile the frontend via `esbuild`, you must build the UI on your laptop and transfer the static files over.

**The Fast Way (Automated)**  
Run this script on your MacBook to automatically build the UI, compress it, transfer it, and push your code to GitHub. The message is optional but a good idea as it serves as the commit message.
```bash
./scripts/bash/deploy-mac.sh "Describe your changes here"
```

*Note: it will prompt you for password for theforge. it is easy to forget. just watch the console.*

---

## 🚀 2. Deploying (On TheForge)

Once the UI is compiled and transferred, SSH or Screen Share into TheForge and open a terminal.

### Deployment Steps
Run this single script on TheForge to automatically pull the latest code, unpack the UI, safely install backend dependencies, and restart the server.

To keep your existing data, be sure to use the --with-backup flag. It will create a backup of florasync.db, pull latest from github repo, then restore the florsync.db from the backup.
```bash
./scripts/bash/deploy-forge.sh --with-backup
```

For a clean instance update, omit that flag:
```bash
./scripts/bash/deploy-forge.sh
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