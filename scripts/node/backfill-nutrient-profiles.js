import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DB_FILE = path.join(ROOT_DIR, 'florasync.db');

console.log('🌿 Safely Backfilling Nutrient Profiles in Database...');

// Intelligently guess the best feed profile based on the plant's category
function getProfileForCategory(category) {
  if (!category) return 'LOW_FEED';
  const cat = category.toLowerCase();
  if (cat.includes('berry') || cat.includes('hydrangea')) return 'ACID_LOVERS';
  if (cat.includes('flower') || cat.includes('fruit')) return 'BLOOM_BOOST';
  if (cat.includes('vegetable')) return 'VEG_GROW';
  if (cat.includes('herb') || cat.includes('foliage') || cat.includes('tree')) return 'LOW_FEED';
  return 'LOW_FEED';
}

// Update the Live Database (Shared Dictionary)
if (fs.existsSync(DB_FILE)) {
  const db = new Database(DB_FILE);
  const row = db.prepare('SELECT id, archetypes FROM shared_dictionary WHERE id = 1').get();
  if (row && row.archetypes) {
    let archetypes = JSON.parse(row.archetypes);
    let updatedCount = 0;
    
    archetypes = archetypes.map(a => {
      if (!a.preferredNutrientProfile) {
        a.preferredNutrientProfile = getProfileForCategory(a.category);
        updatedCount++;
      }
      return a;
    });

    if (updatedCount > 0) {
      db.prepare('UPDATE shared_dictionary SET archetypes = ? WHERE id = 1').run(JSON.stringify(archetypes));
      console.log(`✅ Successfully backfilled ${updatedCount} plants with default nutrient profiles based on their categories!`);
    } else {
      console.log('✅ Database is already up to date. No plants needed backfilling.');
    }
  }
  db.close();
} else {
  console.error(`❌ Database not found at ${DB_FILE}`);
}