import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const ADDONS_DIR = path.join(ROOT_DIR, 'addons');
const DIST_DIR = path.join(ADDONS_DIR, 'dist');

const args = process.argv.slice(2);
const targetPlugin = args.find(arg => !arg.startsWith('--'));
const isMajor = args.includes('--major');
const isMinor = args.includes('--minor');
const isAll = args.includes('--all');

console.log('🧰 FloraSync Add-on Packager\n===========================');

if (!targetPlugin && !isAll) {
  console.error('❌ ERROR: Please specify an add-on folder to package, or use the --all flag to package everything.');
  console.log('Usage: node scripts/node/pack-addons.js <folder-name> [--major | --minor | --all]');
  process.exit(1);
}

if (!fs.existsSync(ADDONS_DIR)) {
  console.log('📁 No addons directory found. Creating one at ./addons');
  fs.mkdirSync(ADDONS_DIR);
  process.exit(0);
}

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

let plugins = fs.readdirSync(ADDONS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'dist')
  .map(dirent => dirent.name);

if (targetPlugin) {
  if (!plugins.includes(targetPlugin)) {
    console.error(`❌ Add-on folder '${targetPlugin}' not found in addons/ directory.`);
    process.exit(1);
  }
  plugins = [targetPlugin];
}

if (plugins.length === 0) {
  console.log('⚠️  No plugin folders found in the addons/ directory.');
  process.exit(0);
}

plugins.forEach(pluginFolder => {
  const pluginPath = path.join(ADDONS_DIR, pluginFolder);
  const manifestPath = path.join(pluginPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️  Skipping '${pluginFolder}': No manifest.json found.`);
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const oldVersion = manifest.version || '1.0.0';
    let [major, minor, tweak] = oldVersion.split('.').map(Number);
    
    if (isNaN(major)) major = 1;
    if (isNaN(minor)) minor = 0;
    if (isNaN(tweak)) tweak = 0;

    if (isMajor) {
      major++; minor = 0; tweak = 0;
    } else if (isMinor) {
      minor++; tweak = 0;
    } else {
      tweak++; // Default to a tweak bump
    }

    manifest.version = `${major}.${minor}.${tweak}`;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

    const zipName = `${manifest.id}-v${manifest.version}.zip`;
    const zipPath = path.join(DIST_DIR, zipName);

    const zip = new AdmZip();
    zip.addLocalFolder(pluginPath);
    zip.writeZip(zipPath);

    console.log(`✅ Packaged: ${manifest.name} (v${oldVersion} ➔ v${manifest.version}) -> addons/dist/${zipName}`);
  } catch (err) {
    console.error(`❌ Failed to package '${pluginFolder}':`, err.message);
  }
});