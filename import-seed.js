import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DB_FILE = 'florasync.db';
const IMPORTS_DIR = 'src/data/imports';
const PROCESSED_DIR = 'src/data/processed';

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

const row = db.prepare('SELECT archetypes FROM app_state WHERE id = 1').get();
if (!row) {
  console.error('❌ Database not initialized. Please start your server.js once first.');
  process.exit(1);
}

let existingArchetypes = JSON.parse(row.archetypes || '[]');
const existingIds = new Set(existingArchetypes.map(a => a.id));

let addedCount = 0;

// Find all JSON files in the imports directory
const files = fs.readdirSync(IMPORTS_DIR).filter(file => file.endsWith('.json'));

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
    for (const plant of seedData) {
      if (!existingIds.has(plant.id)) {
        existingArchetypes.push(plant);
        existingIds.add(plant.id);
        addedCount++;
        fileAddedCount++;
      }
    }
    
    // Move file to processed folder
    const processedPath = path.join(PROCESSED_DIR, file);
    fs.renameSync(filePath, processedPath);
    console.log(`📄 Processed ${file}: added ${fileAddedCount} new plants.`);
  } catch (err) {
    console.error(`❌ Error processing ${file}:`, err.message);
  }
}

// 3. Save back to database
db.prepare('UPDATE app_state SET archetypes = ? WHERE id = 1').run(JSON.stringify(existingArchetypes));
console.log(`✅ Successfully imported ${addedCount} new plant archetypes into the database!`);