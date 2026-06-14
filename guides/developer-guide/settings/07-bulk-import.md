---
id: "dev-bulk-import"
title: "Bulk Data Import"
category: "Developer Guide"
parent: "dev-settings-administration"
tags: ["import", "json", "dictionary", "zip", "package", "bulk", "archetypes", "dev"]
---

# Bulk Data Import (Developer Guide)

The **Bulk Data Import** feature allows garden owners and admins to quickly populate the shared plant dictionary by uploading compressed `.zip` packages containing plant profile data (JSON) and associated imagery. This eliminates the need for manual data entry and enables seamless knowledge sharing between gardens.

## Architecture Overview

### Frontend Components
- **Component:** [`DataImport.tsx`](../../src/components/core/settings/DataImport.tsx)
- **Parent:** `SettingsManager.tsx` (Settings & Administration)
- **Permissions:** `manage_dictionary` (typically Garden Owners and Admins)

### Backend APIs
- **Primary Route:** `/api/import` (POST)
  - Endpoint: `/api/import`
  - Method: `POST`
  - Authentication: Required (`authenticateToken` middleware)
  - Permission: `manage_dictionary`
  - Payload: `{ type: 'archetypes', data: [...] }`
  - Response: `{ success: boolean, error?: string }`

- **Secondary Route:** `/api/state` (GET/POST)
  - Used for fetching current dictionary and saving merged data
  - GET retrieves `shared_dictionary` archetypes
  - POST persists merged dictionary after deduplication

## Data Format Specification

### Package Structure
Plant packages are distributed as `.zip` files with the following structure:

```
plant-package.zip
├── archetypes.json          (or any name.json)
└── images/
    ├── flowers/
    │   └── rose.jpg
    ├── foliage/
    │   └── fern.png
    └── vegetables/
        └── spaghetti-squash.jpg
```

### JSON Schema
The JSON file must contain an **array of plant archetype objects**:

```json
[
  {
    "id": "spaghetti-squash",
    "commonName": "Spaghetti Squash",
    "scientificName": "Cucurbita pepo",
    "category": "Vegetables",
    "lifecycle": "Annual",
    "sunRequirement": "Full Sun",
    "waterIntervalDays": 3,
    "waterQuantityMl": 500,
    "fertilizeIntervalDays": 14,
    "pruningNotes": "Remove lateral vines to encourage vertical growth",
    "harvestDaysAfterPlanting": 70,
    "imageUrl": "images/vegetables/spaghetti-squash.jpg",
    "funFacts": [
      {
        "id": "fact-1",
        "title": "Spaghetti-Like Flesh",
        "description": "When cooked, the flesh separates into long strands resembling pasta.",
        "imageUrl": "images/vegetables/spaghetti-squash-cooked.jpg"
      }
    ]
  }
]
```

**Required Fields:**
- `id` — Unique identifier (lowercase, hyphenated)
- `commonName` — User-facing plant name
- `category` — Classification (e.g., "Vegetables", "Herbs", "Flowers")

**Optional Fields:**
- `scientificName` — Botanical name
- `lifecycle` — "Annual", "Perennial", "Biennial"
- `sunRequirement` — "Full Sun", "Partial Shade", "Full Shade"
- `waterIntervalDays` — Days between watering (integer)
- `waterQuantityMl` — Milliliters per watering session
- `fertilizeIntervalDays` — Days between fertilization
- `pruningNotes` — Cultivation guidance
- `harvestDaysAfterPlanting` — Time to maturity
- `imageUrl` — Relative path to cover image
- `funFacts` — Array of enrichment content with `id`, `title`, `description`, and optional `imageUrl`

## Frontend Implementation

### File Upload Handling
The `DataImport` component manages the complete upload workflow:

```tsx
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsImporting(true);
  try {
    const zip = await JSZip.loadAsync(file);
    
    // Step 1: Locate the JSON file
    const jsonFile = Object.values(zip.files).find(f => 
      !f.dir && f.name.endsWith('.json')
    );
    if (!jsonFile) {
      showToast('❌ No .json file found in the package.');
      return;
    }

    // Step 2: Parse JSON and validate array
    const jsonText = await jsonFile.async('text');
    const data = JSON.parse(jsonText);

    if (!Array.isArray(data)) {
      showToast('❌ The .json file must contain an array of plants.');
      return;
    }

    // Step 3: Extract and inline images as Base64 Data URIs
    for (const item of data) {
      if (item.imageUrl && typeof item.imageUrl === 'string') {
        const targetPath = item.imageUrl.startsWith('/') 
          ? item.imageUrl.substring(1) 
          : item.imageUrl;
        const imgFile = Object.values(zip.files).find(f => 
          !f.dir && f.name.endsWith(targetPath)
        );
        
        if (imgFile) {
          const base64Data = await imgFile.async('base64');
          const extension = targetPath.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : 
                          extension === 'webp' ? 'image/webp' : 
                          'image/jpeg';
          item.imageUrl = `data:${mimeType};base64,${base64Data}`;
        }
      }
    }

    // Step 4: Send to backend for deduplication and merge
    const res = await apiFetch('/api/import', {
      method: 'POST',
      body: JSON.stringify({ type: 'archetypes', data })
    });
    const result = await res.json();
    
    if (result.success) {
      showToast(`✅ Package imported successfully! Refreshing...`);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast(`❌ Import failed: ${result.error || 'Check data format.'}`);
    }
  } catch (err) { 
    console.error(err);
    showToast('❌ Failed to process the package file.'); 
  }
  
  setIsImporting(false);
  if (fileInputRef.current) fileInputRef.current.value = '';
};
```

### Key Processing Steps
1. **ZIP Extraction:** Uses `jszip` library to read the uploaded file in memory
2. **JSON Location:** Searches for the first `.json` file (regardless of name)
3. **Validation:** Confirms the JSON contains an array of plant objects
4. **Image Embedding:** Converts all image file references to Base64 data URIs for transport
5. **API Submission:** POSTs the enriched payload to `/api/import`

### Image Handling
- Images are embedded as Base64 data URIs in the JSON for seamless transport
- Supported formats: JPEG, PNG, WebP
- MIME types are automatically detected from file extension
- Paths are resolved relative to the ZIP root (`images/flowers/rose.jpg`)

## Backend Implementation

### API Endpoint: `/api/import`
The backend endpoint receives the processed package and performs intelligent merging:

```javascript
router.post('/api/import', authenticateToken, (req, res) => {
  const { type, data } = req.body;
  
  if (!type || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid import payload.' });
  }

  try {
    // Verify user has permission to manage dictionary
    const gardenId = db.prepare('SELECT garden_id FROM users WHERE id = ?')
      .get(req.user.id)?.garden_id;
    const access = db.prepare(
      'SELECT role FROM garden_members WHERE user_id = ? AND garden_id = ?'
    ).get(req.user.id, gardenId);
    const effectiveRole = access?.role || 'viewer';
    
    if (effectiveRole === 'viewer') {
      return res.status(403).json({ 
        error: 'Only owners and admins can import dictionary data.' 
      });
    }

    if (type === 'archetypes') {
      // Fetch current shared dictionary
      const dict = db.prepare('SELECT archetypes FROM shared_dictionary WHERE id = 1')
        .get();
      let existing = JSON.parse(dict?.archetypes || '[]');
      const existingIds = new Set(existing.map(a => a.id));

      // Merge: Add new entries, skip duplicates
      let importedCount = 0;
      for (const archetype of data) {
        if (!archetype.id) {
          console.warn('Skipping archetype without id:', archetype);
          continue;
        }
        
        if (!existingIds.has(archetype.id)) {
          existing.push(archetype);
          importedCount++;
        }
        // Silently skip duplicates to protect existing garden data
      }

      // Persist merged dictionary
      db.prepare('UPDATE shared_dictionary SET archetypes = ? WHERE id = 1')
        .run(JSON.stringify(existing));

      res.json({ success: true, imported: importedCount });
    } else {
      res.status(400).json({ error: 'Unknown import type.' });
    }
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ error: 'Failed to process import.' });
  }
});
```

### Deduplication Logic
- **Strategy:** ID-based matching
  - Incoming archetypes with duplicate `id` values are **silently skipped**
  - Protects existing garden instances and prevents data corruption
  - Users can manually edit duplicates if they want to merge different versions
- **Exception:** Common names are NOT used for matching (allows variations)

### Data Persistence
- Merged dictionary is immediately persisted to the `shared_dictionary` table
- All active gardens in the workspace automatically see the new entries on next sync
- No individual garden data is modified—only the global dictionary is updated

## Permission Model

### `manage_dictionary` Permission
Users with this permission can upload and merge plant packages:
- **Garden Owners:** Full permission (can manage dictionary)
- **Garden Admins:** Full permission (can manage dictionary)
- **Helpers:** No permission (cannot import)
- **Viewers:** No permission (cannot import)

### Validation
```tsx
// Frontend check
{hasPermission(currentUser, 'manage_dictionary') && (
  <SettingsSection title="Data Import">
    <DataImport ... />
  </SettingsSection>
)}

// Backend check
if (effectiveRole === 'viewer' || effectiveRole === 'helper') {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

## UI/UX Components

### Import Section
Located in **Settings > Data Import & Optimization**:

```tsx
<Card>
  <label>Plant Package Import</label>
  <button onClick={() => setShowImportHelp(!showImportHelp)}>
    <Icon name="help-circle" /> Package Format
  </button>

  {showImportHelp && (
    <div className="help-box">
      <p>Upload a .zip package containing your plants and images.</p>
      <pre>/any-name.json
/images/flowers/rose.jpg
/images/foliage/fern.png</pre>
    </div>
  )}

  <div className="dashed-border">
    <Icon name="package" size={48} />
    <p>Select a Plant Package</p>
    <p>Upload a .zip file containing your .json file and images.</p>
    <input 
      type="file" 
      accept=".zip,application/zip" 
      ref={fileInputRef}
      onChange={handleFileUpload}
    />
    <Button onClick={() => fileInputRef.current?.click()}>
      {isImporting ? 'Processing Package...' : 'Browse for .zip'}
    </Button>
  </div>
</Card>
```

### Feedback & States
- **Uploading:** Button shows "Processing Package..."
- **Success:** Toast: `✅ Package imported successfully! Refreshing...` + auto-reload
- **Error:** Toast with specific error message
  - Invalid JSON format
  - Missing `.json` file
  - Non-array JSON structure
  - Network/API failure

## Integration with Other Features

### Plant Dictionary System
- Imported archetypes become available in the global shared dictionary
- All instances in the garden can reference new archetypes immediately
- The dictionary is **workspace-wide** (shared across all gardens in the same database)

### Print Center
- New archetypes appear in "Bulk from DB" print generation
- QR codes can be generated for newly imported plant types

### Dynamic Registration
- When scanning new QR codes, users can select from the extended dictionary
- New imported plant types populate the "Find in Dictionary" search

## Database Schema

### Relevant Tables
```sql
-- Global shared dictionary (workspace-level)
CREATE TABLE shared_dictionary (
  id INTEGER PRIMARY KEY,
  archetypes TEXT  -- JSON array of plant archetypes
);

-- User permissions
CREATE TABLE garden_members (
  user_id TEXT,
  garden_id TEXT,
  role TEXT,  -- 'owner', 'admin', 'helper', 'viewer'
  PRIMARY KEY (user_id, garden_id)
);
```

## Common Use Cases

### 1. Sharing a Curated Plant Library
A gardener creates a comprehensive plant dictionary for their region and exports it as a package to share with friends:
- Includes 50+ vegetables, herbs, and companion plants
- Each entry has metadata (water schedule, sun requirements)
- Beautiful photos of each plant type

### 2. Bootstrapping a New Garden
A new workspace is created and the admin wants to pre-load a standard plant reference:
- Uploads a community-curated "Standard Herb Garden" package
- Immediately has 30+ common herbs ready to use
- Team members can create instances without manual dictionary data entry

### 3. Regional Adaptations
A gardener modifies a shared package for their climate zone and re-uploads:
- Adjusts water intervals and pruning schedules for local conditions
- Adds new varieties suited to the region
- Imports into their own workspace to test before sharing

## Error Handling & Edge Cases

### Validation Failures
| Error | Cause | Resolution |
|-------|-------|------------|
| "No .json file found" | ZIP doesn't contain a JSON file | Ensure at least one `.json` file is in the package root |
| "Must contain array" | JSON is an object, not array | Wrap archetype in `[ { ... } ]` |
| "Invalid import payload" | Malformed request body | Check client-side data processing |

### Image Handling
- **Missing Images:** The `imageUrl` field becomes a relative path (broken link)—ensure images exist in the ZIP
- **Invalid MIME Types:** Only JPEG, PNG, WebP supported; others default to JPEG
- **Oversized Images:** Large images are NOT automatically compressed on import (use Database Optimization tool after import)
- **Base64 Encoding:** Automatically detected and embedded; files never saved temporarily to disk

### Duplicate Handling
- **Duplicate IDs:** Silently skipped (no error thrown)
- **Duplicate Common Names:** Allowed (different archetype entries can share names)
- **No Merge on Import:** Existing data is never overwritten; set `id` to a unique value to create a new entry

## Performance Considerations

### Frontend
- ZIP extraction and Base64 conversion happen **in the browser** (no server processing overhead)
- Large images can cause UI lag—consider pre-compressing before packaging
- Use `jszip` library (lightweight, pure JS, no native dependencies)

### Backend
- Database insert is a single SQL statement (O(1) with respect to archive size)
- All image data is embedded in JSON (no separate file I/O)
- Deduplication uses Set lookups (O(n) where n = existing archetypes)

### Database Impact
- Dictionary size grows with each import (SQLite handles up to 1GB+ for typical gardens)
- No automatic cleanup—consider archiving old versions if dictionary becomes bloated

## Future Enhancement Ideas

1. **Selective Import:** Checkbox UI to choose which plants to import from a package
2. **Conflict Resolution:** UI to review and choose between duplicate IDs
3. **Image Optimization:** Automatic JPEG compression during import to reduce database size
4. **Version Control:** Track import history and allow rollbacks
5. **Community Registry:** Built-in package discovery and one-click install
6. **Batch Operations:** Import multiple packages in sequence
7. **Export Functionality:** Create shareable packages from current dictionary (inverse operation)

## Related Documentation
- [Settings & Administration Developer Guide](./07-Settings.md)
- [Plant Dictionary](./04-Plant-Dictionary.md)
- [Database Optimization](./settings/04-database-optimization.md)
- [User Guide: Bulk Data Import](../user-guide/settings/07-bulk-import.md)
