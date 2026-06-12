import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load the .env file into memory to access Cloudinary!
try {
  process.loadEnvFile(path.join(__dirname, '../../.env'));
} catch (err) {}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect directly to your downloaded live database!
const db = new Database('./florasync_live.db');

console.log('🔍 Connecting to florasync_live.db for direct SQLite migration...\n');

async function runMigration() {
  let uploadedCount = 0;

  // Recursive helper to find and upload base64 strings hidden anywhere in JSON arrays
  async function extractAndUploadImages(obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('data:image/')) {
        try {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(obj[key], {
              folder: 'florasync_migrated',
              transformation: [{ width: 1024, crop: 'limit', quality: 'auto' }]
            }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            });
          });
          
          obj[key] = result.secure_url;
          uploadedCount++;
          console.log(`✅ Uploaded to: ${result.secure_url}`);
        } catch (err) {
          console.error('❌ Cloudinary upload failed:', err);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        await extractAndUploadImages(obj[key]);
      }
    }
  }

  // 1. Process Users Table
  console.log('👤 Checking Users table...');
  const users = db.prepare("SELECT id, username, image_url FROM users WHERE image_url LIKE 'data:image/%'").all();
  for (const user of users) {
    console.log(`Uploading profile picture for user: ${user.username}...`);
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(user.image_url, {
          folder: 'florasync_profiles',
          transformation: [{ width: 250, height: 250, crop: 'fill', gravity: 'face', quality: 'auto' }]
        }, (error, res) => {
          if (error) reject(error);
          else resolve(res);
        });
      });
      db.prepare("UPDATE users SET image_url = ? WHERE id = ?").run(result.secure_url, user.id);
      uploadedCount++;
      console.log(`✅ Updated user ${user.username} in database.`);
    } catch (err) {
      console.error(`❌ Failed to update user ${user.username}:`, err);
    }
  }

  // 2. Process Gardens Table (Journal Entries & Photos)
  console.log('\n🌿 Checking Gardens table...');
  const gardens = db.prepare("SELECT id, instances FROM gardens WHERE instances LIKE '%data:image/%' OR instances LIKE '%authorImageUrl%'").all();
  for (const garden of gardens) {
    console.log(`Processing garden: ${garden.id}...`);
    const instances = JSON.parse(garden.instances);
    
    // Normalize: remove authorImageUrl duplication
    instances.forEach(inst => {
      if (inst.journal) {
        inst.journal.forEach(entry => delete entry.authorImageUrl);
      }
    });

    await extractAndUploadImages(instances);
    db.prepare("UPDATE gardens SET instances = ? WHERE id = ?").run(JSON.stringify(instances), garden.id);
  }

  // 3. Process Shared Dictionary Table
  console.log('\n📚 Checking Shared Dictionary table...');
  const dicts = db.prepare("SELECT id, archetypes FROM shared_dictionary WHERE archetypes LIKE '%data:image/%'").all();
  for (const dict of dicts) {
    console.log(`Processing dictionary: ${dict.id}...`);
    const archetypes = JSON.parse(dict.archetypes);
    await extractAndUploadImages(archetypes);
    db.prepare("UPDATE shared_dictionary SET archetypes = ? WHERE id = ?").run(JSON.stringify(archetypes), dict.id);
  }

  console.log(`\n🎉 Database Migration Complete! Uploaded a total of ${uploadedCount} images to Cloudinary.`);
  console.log('➡️  Next step: Upload florasync_live.db back to your server!');
}

runMigration();