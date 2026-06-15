#!/bin/bash

# Exit immediately if any command fails
set -e

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
if ! npm run build; then
  echo -e "\033[1;31m❌ Build failed! Please fix the TypeScript/Vite errors above and try again.\033[0m"
  exit 1
fi

echo "2️⃣ Compressing the build folder..."
if ! tar -czf dist.tar.gz dist; then
  echo -e "\033[1;31m❌ Failed to compress the build folder.\033[0m"
  exit 1
fi

echo "3️⃣ Sending to TheForge's home folder..."
echo -e "\033[1;5;95m🔑 HEADS UP: Please enter your password for TheForge below...\033[0m"
if ! scp dist.tar.gz .env michael@theforge.local:~; then
  echo -e "\033[1;31m❌ File transfer failed! Check your password and network connection.\033[0m"
  exit 1
fi

echo "4️⃣ Committing and pushing to GitHub..."
git add .
git commit -m "$COMMIT_MSG"
git push

echo "✅ Success! Your code is shipped. Now run 'bash scripts/bash/deploy-forge.sh' on TheForge."