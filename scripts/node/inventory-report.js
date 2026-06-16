import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

if (!fs.existsSync(DB_FILE)) {
  console.error(`Database not found at ${DB_FILE}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const includeUnmonitored = args.includes('--include-unmonitored');

let targetGarden = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--garden' && args[i + 1]) {
    targetGarden = args[i + 1];
  }
}

let groupBy = 'category';
if (args.includes('--group-by-zone')) groupBy = 'zone';
if (args.includes('--group-by-location')) groupBy = 'location';

// Parse category filters
const categoryFilters = [];
if (args.includes('--flowers')) categoryFilters.push('Flower');
if (args.includes('--herbs')) categoryFilters.push('Herb');
if (args.includes('--fruits')) categoryFilters.push('Fruit');
if (args.includes('--foliage')) categoryFilters.push('Foliage Accent', 'Foliage');
if (args.includes('--vegetables')) categoryFilters.push('Vegetable');
if (args.includes('--trees')) categoryFilters.push('Tree');

const db = new Database(DB_FILE, { readonly: true });

// 1. Load the shared dictionary (Archetypes)
const dictRow = db.prepare('SELECT archetypes FROM shared_dictionary WHERE id = 1').get();
let allArchetypes = [];
if (dictRow && dictRow.archetypes) {
  try { allArchetypes = JSON.parse(dictRow.archetypes); } catch(e) {}
}

const archetypeMap = new Map();
allArchetypes.forEach(a => {
  archetypeMap.set(a.id, a);
});

// 2. Load all plant instances across all gardens
let query = 'SELECT name, instances, zones, locations FROM gardens';
let queryParams = [];
if (targetGarden) {
  query = 'SELECT name, instances, zones, locations FROM gardens WHERE id = ? OR name = ?';
  queryParams = [targetGarden, targetGarden];
}

const zoneMap = new Map();
const locationMap = new Map();
const locationToZoneMap = new Map();

const gardenRows = db.prepare(query).all(...queryParams);
let allInstances = [];
gardenRows.forEach(row => {
  if (row.zones) {
    try { JSON.parse(row.zones).forEach(z => zoneMap.set(z.id, z.name)); } catch(e) {}
  }
  if (row.locations) {
    try { 
      JSON.parse(row.locations).forEach(l => {
        locationMap.set(l.id, l.name);
        if (l.zoneId) locationToZoneMap.set(l.id, l.zoneId);
      }); 
    } catch(e) {}
  }
  if (row.instances) {
    try { 
      const instances = JSON.parse(row.instances);
      instances.forEach(inst => {
        inst.gardenName = row.name;
        allInstances.push(inst);
      });
    } catch(e) {}
  }
});

// 3. Filter and Group
const report = {};

allInstances.forEach(inst => {
  if (!includeUnmonitored && inst.unmonitored) return;

  const arch = archetypeMap.get(inst.archetypeId);
  if (!arch) return; // Skip if archetype not found

  let category = arch.category || 'Uncategorized';
  
  // Apply filters if any are set
  if (categoryFilters.length > 0 && !categoryFilters.includes(category)) {
    return;
  }

  let groupKey = 'Uncategorized';
  if (groupBy === 'category') {
    groupKey = category;
  } else if (groupBy === 'zone') {
    const derivedZoneId = inst.zoneId || (inst.locationId ? locationToZoneMap.get(inst.locationId) : null);
    groupKey = derivedZoneId ? (zoneMap.get(derivedZoneId) || 'Unassigned Zone') : 'Unassigned Zone';
  } else if (groupBy === 'location') {
    const derivedZoneId = inst.zoneId || (inst.locationId ? locationToZoneMap.get(inst.locationId) : null);
    const zoneName = derivedZoneId ? (zoneMap.get(derivedZoneId) || 'Unassigned Zone') : 'Unassigned Zone';
    groupKey = inst.locationId ? `${zoneName} • ${locationMap.get(inst.locationId) || 'Unassigned Location'}` : 'Unassigned Location';
  }

  if (!report[groupKey]) {
    report[groupKey] = [];
  }

  report[groupKey].push({
    name: inst.name || arch.commonName || 'Unknown Plant',
    garden: inst.gardenName,
    unmonitored: inst.unmonitored || false
  });
});

// 4. Print Report
console.log('=========================================');
console.log('       🌿 FloraSync Inventory Report     ');
if (targetGarden) {
  const gardenNameDisplay = gardenRows.length > 0 ? gardenRows[0].name : targetGarden;
  console.log(`       Garden: ${gardenNameDisplay}`);
}
console.log('=========================================');

if (Object.keys(report).length === 0) {
  console.log('No plants found matching the criteria.');
}

let groupLabel = 'Category';
if (groupBy === 'zone') groupLabel = 'Zone';
if (groupBy === 'location') groupLabel = 'Location';

for (const [group, plants] of Object.entries(report)) {
  console.log(`\n📂 ${groupLabel}: ${group} (${plants.length} plants)`);
  console.log('-----------------------------------------');
  plants.forEach(p => {
    const unmonitoredTag = p.unmonitored ? ' [Unmonitored]' : '';
    const gardenTag = targetGarden ? '' : ` (Garden: ${p.garden})`;
    console.log(` - ${p.name}${gardenTag}${unmonitoredTag}`);
  });
}
console.log('\n=========================================');