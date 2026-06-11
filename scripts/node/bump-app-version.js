import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

const args = process.argv.slice(2);
const isMajor = args.includes('--major');
const isMinor = args.includes('--minor');

try {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const oldVersion = pkg.version || '1.0.0';
  let [major, minor, patch] = oldVersion.split('.').map(Number);
  
  if (isNaN(major)) major = 1;
  if (isNaN(minor)) minor = 0;
  if (isNaN(patch)) patch = 0;

  if (isMajor) {
    major++; minor = 0; patch = 0;
  } else if (isMinor) {
    minor++; patch = 0;
  } else {
    patch++; // Default to patch bump
  }

  pkg.version = `${major}.${minor}.${patch}`;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n');
  
  console.log(`✅ FloraSync Version Bumped: v${oldVersion} ➔ v${pkg.version}`);
} catch (err) {
  console.error(`❌ Failed to bump app version:`, err.message);
  process.exit(1);
}