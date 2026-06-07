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

const db = new Database(DB_FILE, { readonly: true });

// 1. Load the shared dictionary (Archetypes)
const dictRow = db.prepare('SELECT archetypes FROM shared_dictionary WHERE id = 1').get();
let allArchetypes = [];
if (dictRow && dictRow.archetypes) {
  try { allArchetypes = JSON.parse(dictRow.archetypes); } catch(e) {}
}

// 2. Load all plant instances across all gardens
const gardenRows = db.prepare('SELECT instances FROM gardens').all();
let allInstances = [];
gardenRows.forEach(row => {
  if (row.instances) {
    try { allInstances.push(...JSON.parse(row.instances)); } catch(e) {}
  }
});

let totalFunFacts = 0;
let archetypesWithFacts = 0;

let activeFunFacts = 0;
let activeArchetypesWithFacts = 0;

// Unique archetype IDs that are currently planted in any garden
const activeArchIds = new Set(allInstances.map(i => i.archetypeId));

for (const a of allArchetypes) {
  let facts = a.funFacts || [];
  
  if (facts.length > 0) {
    totalFunFacts += facts.length;
    archetypesWithFacts++;
    
    // Check if this plant is currently in the inventory
    if (activeArchIds.has(a.id)) {
      activeFunFacts += facts.length;
      activeArchetypesWithFacts++;
    }
  }
}

console.log('=========================================');
console.log('         🌿 FloraSync Fun Facts 🌿       ');
console.log('=========================================');
console.log(`Total Archetypes in Dictionary: ${allArchetypes.length}`);
console.log(`Total Plants in Gardens:        ${allInstances.length}`);
console.log('-----------------------------------------');
console.log(`Total Fun Facts in System:      ${totalFunFacts}`);
console.log(`Archetypes with Facts:          ${archetypesWithFacts}`);
console.log('-----------------------------------------');
console.log(`Fun Facts for Active Inventory: ${activeFunFacts}`);
console.log(`Active Archetypes with Facts:   ${activeArchetypesWithFacts}`);
console.log('=========================================');
