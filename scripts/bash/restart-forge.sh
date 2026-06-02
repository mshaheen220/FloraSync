#!/bin/bash

echo "🌿 FloraSync - TheForge Server Recovery"

cd /Users/michael/Documents/dev/FloraSync || { echo "❌ Directory not found!"; exit 1; }

echo "1️⃣ Starting the Node backend with PM2..."
NODE_ENV=production PORT=5050 pm2 start scripts/node/server.js --name "florasync"
pm2 save

echo "2️⃣ Starting Caddy web server..."
# Note: use `caddy reload` if Caddy is already running but unresponsive
caddy start --config ~/.config/caddy/Caddyfile

echo "✅ Success! Servers are back online."