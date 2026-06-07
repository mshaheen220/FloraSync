#!/bin/bash

echo "🌿 FloraSync - TheForge Deployment"

cd /Users/michael/Documents/dev/FloraSync || { echo "❌ Directory not found!"; exit 1; }

echo "1️⃣ Pulling latest code from GitHub..."
git restore .
git pull

echo "2️⃣ Moving and extracting the UI..."
mv ~/dist.tar.gz .
tar -xzf dist.tar.gz

echo "3️⃣ Installing backend dependencies (safely skipping dev tools)..."
rm -rf node_modules
npm install --omit=dev --loglevel=error --no-audit --no-fund

echo "4️⃣ Restarting PM2 server..."
# Ensure global binary paths are loaded so the script can find PM2
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:~/.npm-global/bin
pm2 restart florasync || npx pm2 restart florasync

echo "✅ Success! FloraSync is live at https://theforge.local:8080"