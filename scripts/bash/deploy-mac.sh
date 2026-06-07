#!/bin/bash

echo "🌿 FloraSync - Local Build & Transfer"

# Allow a custom commit message as the first argument, or fallback to a default
COMMIT_MSG=${1:-"Automated build and deployment"}

echo "1️⃣ Building the production UI..."
npm run build

echo "2️⃣ Compressing the build folder..."
tar -czf dist.tar.gz dist

echo "3️⃣ Sending to TheForge's home folder..."
echo -e "\033[1;5;91m🔑 HEADS UP: Please enter your password for TheForge below...\033[0m"
scp dist.tar.gz michael@theforge.local:~

echo "4️⃣ Committing and pushing to GitHub..."
git add .
git commit -m "$COMMIT_MSG"
git push

echo "✅ Success! Your code is shipped. Now run 'bash scripts/bash/deploy-forge.sh' on TheForge."