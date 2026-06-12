import Database from 'better-sqlite3';
const db = new Database('./florasync_live.db');

console.log('🔍 Checking database for base64 images...\n');

const users = db.prepare("SELECT COUNT(*) as count FROM users WHERE image_url LIKE 'data:image/%'").get();
console.log(`👤 Users with base64 profile pictures: ${users.count}`);

const gardens = db.prepare("SELECT COUNT(*) as count FROM gardens WHERE instances LIKE '%data:image/%'").get();
console.log(`🌿 Gardens with base64 journal photos: ${gardens.count}`);

const sharedDict = db.prepare("SELECT COUNT(*) as count FROM shared_dictionary WHERE archetypes LIKE '%data:image/%'").get();
console.log(`📚 Shared Dictionary with base64 images: ${sharedDict.count}`);

// Safely check legacy backup tables in case you've already deleted them
try {
  const legacyState = db.prepare("SELECT COUNT(*) as count FROM app_state_legacy_backup WHERE instances LIKE '%data:image/%'").get();
  console.log(`🗄️  Legacy App State with base64 images: ${legacyState.count}`);
  const legacyUserGardens = db.prepare("SELECT COUNT(*) as count FROM user_gardens_legacy_backup WHERE instances LIKE '%data:image/%'").get();
  console.log(`🗄️  Legacy User Gardens with base64 images: ${legacyUserGardens.count}`);
} catch (err) {}

console.log('\n✅ Check complete!');