#!/bin/bash

echo "🌿 FloraSync - TheForge Deployment"

cd /Users/michael/Documents/dev/FloraSync || { echo "❌ Directory not found!"; exit 1; }

WITH_BACKUP=false
for arg in "$@"; do
    if [ "$arg" == "--with-backup" ]; then
        WITH_BACKUP=true
    fi
done

if [ "$WITH_BACKUP" = true ] && [ -f florasync.db ]; then
    echo "💾 Temporarily moving florasync.db to florasync.safe..."
    mv florasync.db florasync.safe
fi

echo "1️⃣ Pulling latest code from GitHub..."
git restore .
git pull

if [ "$WITH_BACKUP" = true ] && [ -f florasync.safe ]; then
    echo "♻️ Restoring florasync.db from florasync.safe..."
    mv florasync.safe florasync.db
fi

echo "2️⃣ Moving and extracting the UI..."
mv ~/dist.tar.gz .
tar -xzf dist.tar.gz

echo "3️⃣ Installing backend dependencies (safely skipping dev tools)..."
rm -rf node_modules
npm install --omit=dev

echo "4️⃣ Restarting PM2 server..."
pm2 restart florasync

echo "✅ Success! FloraSync is live at https://theforge.local:8080"