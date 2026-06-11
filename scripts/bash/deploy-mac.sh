#!/bin/bash

echo "🌿 FloraSync - Local Build & Transfer"

# Handle commit message and version flags
COMMIT_MSG="$1"
if [[ "$COMMIT_MSG" == "--minor" || "$COMMIT_MSG" == "--major" || -z "$COMMIT_MSG" ]]; then
  COMMIT_MSG="Automated build and deployment"
fi

VERSION_FLAG=""
if [[ "$*" == *"--major"* ]]; then
  VERSION_FLAG="--major"
elif [[ "$*" == *"--minor"* ]]; then
  VERSION_FLAG="--minor"
fi

# Bump the version BEFORE building the UI so the new version number is compiled into React
node scripts/node/bump-app-version.js $VERSION_FLAG

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