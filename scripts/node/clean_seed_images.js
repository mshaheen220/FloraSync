import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FILE = path.join(__dirname, '../../src/data/backups/full_backup_2026-06-12T16-58-26-732Z.json');
const UPLOADS_DIR = path.join(__dirname, '../../src/data/uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

console.log('Reading backup file...');
const rawData = fs.readFileSync(BACKUP_FILE, 'utf-8');
const backup = JSON.parse(rawData);

// 1. Process Users: Extract base64, save to file, and replace with URL
backup.users.forEach(user => {
  if (user.image_url && user.image_url.startsWith('data:image')) {
    console.log(`Extracting profile image for user: ${user.username}`);
    
    // Extract the base64 data from the string
    const matches = user.image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const extension = matches[1].split('/')[1] || 'jpg';
      const buffer = Buffer.from(matches[2], 'base64');
      const fileName = `img-${user.username}-${Date.now()}.${extension}`;
      
      fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
      user.image_url = `/uploads/${fileName}`; // Update JSON with the new clean URL
      console.log(`Saved ${fileName}`);
    }
  }
});

// 2. Process Gardens -> Journal Entries: Remove duplicated authorImageUrl entirely!
backup.gardens.forEach(garden => {
  garden.instances.forEach(instance => {
    if (instance.journal) {
      instance.journal.forEach(entry => {
        if (entry.authorImageUrl !== undefined) {
          console.log(`Removing duplicated authorImageUrl from journal entry ${entry.id}`);
          delete entry.authorImageUrl; // Data normalization!
        }
      });
    }
  });
});

// Save cleaned backup
const CLEAN_BACKUP_FILE = path.join(__dirname, '../../src/data/backups/cleaned_backup.json');
fs.writeFileSync(CLEAN_BACKUP_FILE, JSON.stringify(backup, null, 2));
console.log(`\n✅ Done! Cleaned backup saved to ${CLEAN_BACKUP_FILE}`);