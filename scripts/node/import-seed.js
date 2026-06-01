import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const ROOT_DIR = process.cwd();

const DB_FILE = path.join(ROOT_DIR, 'florasync.db');
const IMPORTS_DIR = path.join(ROOT_DIR, 'src/data/imports');
const PROCESSED_DIR = path.join(ROOT_DIR, 'src/data/processed');

console.log('🌿 FloraSync Database Importer');

// Ensure directories exist
if (!fs.existsSync(IMPORTS_DIR)) {
  fs.mkdirSync(IMPORTS_DIR, { recursive: true });
  console.log(`📁 Created ${IMPORTS_DIR}. Place your JSON files here.`);
}
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

// 1. Connect to the local SQLite database
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY,
    instances TEXT,
    archetypes TEXT,
    locations TEXT,
    zones TEXT
  );
`);

// Safely add new columns for existing databases
try {
  db.exec('ALTER TABLE app_state ADD COLUMN locations TEXT;');
} catch (err) {}
try {
  db.exec('ALTER TABLE app_state ADD COLUMN zones TEXT;');
} catch (err) {}

const stmt = db.prepare('SELECT id FROM app_state WHERE id = 1');
if (!stmt.get()) {
  db.prepare('INSERT INTO app_state (id, instances, archetypes, locations, zones) VALUES (1, ?, ?, ?, ?)').run('[]', '[]', '[]', '[]');
}

const row = db.prepare('SELECT archetypes, locations, zones FROM app_state WHERE id = 1').get();

let existingArchetypes = JSON.parse(row.archetypes || '[]');
const existingIds = new Set(existingArchetypes.map(a => a.id));

let existingLocations = JSON.parse(row.locations || '[]');
const existingLocIds = new Set(existingLocations.map(l => l.id));

let existingZones = JSON.parse(row.zones || '[]');
const existingZoneNames = new Set(existingZones.map(z => z.name));

let addedCount = 0;
let addedLocCount = 0;
let addedZoneCount = 0;

// Find all JSON files in the imports directory
const files = fs.readdirSync(IMPORTS_DIR).filter(file => file.endsWith('.json'));

// Ensure zones.json is always processed first so locations can safely reference them
files.sort((a, b) => {
  if (a === 'zones.json') return -1;
  if (b === 'zones.json') return 1;
  return a.localeCompare(b);
});

if (files.length === 0) {
  console.log(`🤷 No .json files found in ${IMPORTS_DIR} to process.`);
  process.exit(0);
}

// 2. Read and merge the datasets (ignoring duplicates)
for (const file of files) {
  const filePath = path.join(IMPORTS_DIR, file);
  try {
    const seedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let fileAddedCount = 0;
    let fileUpdatedCount = 0;
    
    if (file === 'zones.json') {
      for (const zone of seedData) {
        const existsById = existingZones.find(z => z.id === zone.id);
        if (!existsById && !existingZoneNames.has(zone.name)) {
          existingZones.push(zone);
          existingZoneNames.add(zone.name);
          addedZoneCount++;
          fileAddedCount++;
        } else {
          const index = existingZones.findIndex(z => z.id === zone.id || z.name === zone.name);
          existingZones[index] = { ...existingZones[index], ...zone };
          fileUpdatedCount++;
        }
      }
      console.log(`🌍 Processed ${file}: added ${fileAddedCount}, updated ${fileUpdatedCount} zones.`);
    } else if (file === 'locations.json') {
      for (const loc of seedData) {
        // Perform migration from `zone` text to `zoneId`
        if (loc.zone && !loc.zoneId) {
            let existingZone = existingZones.find(z => z.name === loc.zone);
            if (!existingZone) {
                const newZoneId = `zn-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                existingZone = { id: newZoneId, name: loc.zone };
                existingZones.push(existingZone);
                existingZoneNames.add(loc.zone);
            }
            loc.zoneId = existingZone.id;
            delete loc.zone;
        }

        if (!existingLocIds.has(loc.id)) {
          existingLocations.push(loc);
          existingLocIds.add(loc.id);
          addedLocCount++;
          fileAddedCount++;
        } else {
          const index = existingLocations.findIndex(l => l.id === loc.id);
          existingLocations[index] = { ...existingLocations[index], ...loc };
          fileUpdatedCount++;
        }
      }
      console.log(`📍 Processed ${file}: added ${fileAddedCount}, updated ${fileUpdatedCount} locations.`);
    } else {
      for (const plant of seedData) {
        if (!existingIds.has(plant.id)) {
          existingArchetypes.push(plant);
          existingIds.add(plant.id);
          addedCount++;
          fileAddedCount++;
        } else {
          const index = existingArchetypes.findIndex(a => a.id === plant.id);
          existingArchetypes[index] = { ...existingArchetypes[index], ...plant };
          fileUpdatedCount++;
        }
      }
      console.log(`📄 Processed ${file}: added ${fileAddedCount}, updated ${fileUpdatedCount} plants.`);
    }
    
    // Move file to processed folder
    const processedPath = path.join(PROCESSED_DIR, file);
    fs.renameSync(filePath, processedPath);
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err.message);
  }
}

// 3. Save back to database
db.prepare('UPDATE app_state SET archetypes = ?, locations = ?, zones = ? WHERE id = 1').run(JSON.stringify(existingArchetypes), JSON.stringify(existingLocations), JSON.stringify(existingZones));
console.log(`✅ Successfully imported ${addedCount} plants, ${addedZoneCount} zones, and ${addedLocCount} locations!`);