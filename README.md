# FloraSync 🌿

FloraSync is a mobile-first, offline-ready local web application designed to eliminate data-entry friction in home greenhouse and raised garden bed management. By deploying weatherproof physical QR codes directly onto plant stakes, shelves, and garden beds, users can instantly log critical care metrics (watering, feeding) or register new plants with a single tap or scan.

The application is powered by a React frontend and a robust Node.js/SQLite local backend, ensuring complete data ownership and rapid local-network synchronization.

---

## 🚀 Architecture & Tech Stack

- **Frontend Core:** React 19 (TypeScript) + Vite
- **Backend API:** Node.js, Express, `better-sqlite3`
- **Styling Architecture:** Tailwind CSS (Utility Layouts) + Styled Components (Prop-driven structural states)
- **Physical Bridge:** Python-based automated Avery label QR Code generator (`qrcode`, `Pillow`)
- **Design System:** Mobile-first responsive grids, dark/light mode OS syncing, optimized for single-hand phone interaction.

---

## 📋 Core Features & Mechanics

### 1. "Zero-Click" Action Handling
Physical QR codes on individual stakes or shelf borders are encoded with explicit URLs (e.g., `/plant/qr-012/water`). 
- Scanning the code targets the specific frontend router layer.
- The state updates instantly without requiring manual form submissions.
- A centralized SQLite database syncs via a 200MB-payload-capable proxy tunnel.

### 2. Relational Cascade Hierarchy
To prevent tracking fatigue, data architecture follows a nested hierarchy:
`Zone (e.g. Greenhouse) -> Location (e.g. Shelf A) -> Individual Pots (Instances)`
Scanning a Location or Zone-level QR code provides instant macro-actions, such as a **"Water All Plants on Shelf A"** batch update.

### 3. Smart Attention Queue & Vitality Stats
The central dashboard acts as a dynamic sorting engine and garden command center. 
- **Vitality Stats:** View total active plants, overall hydration averages, and most populated zones.
- **Attention Queue:** Calculates care intervals against local system time to surface a **"Needs Attention Today"** stack, floating dehydrated or hungry plants directly to the top.

### 4. Dynamic Just-In-Time Registration
New blank QR codes deployed to the garden can be initialized dynamically. Scanning an unmapped tag opens a lightweight onboarding form. Selecting a plant from the dictionary inherits robust cultivation metrics (sunlight, harvest intervals, pruning tips) from the baseline archetype schema.

### 5. Bulk Data Import
Share and import plant dictionaries or location setups seamlessly via the UI. Paste a JSON array of Archetypes, Zones, or Locations into the Settings Data Import tool, and FloraSync will intelligently merge it into your database while skipping duplicates to protect your existing garden.

---

## 💾 Core Schema Reference

The database operates on a highly normalized relational schema:

- **`Zone`**: Macro-level areas (e.g., Greenhouse, Rear Patio).
- **`Location`**: Specific shelves, beds, or rails mapped to a Zone.
- **`PlantArchetype`**: The "Plant Dictionary." Defines immutable cultivation properties of a specific crop strain (e.g., Sweet Basil, Cherry Tomato). Contains rich data like `growthRequirements`, `flavorProfile`, and `daysToHarvest`.
- **`PlantInstance`**: The physical, living entities in the real world. Tracks `datePlanted`, `lastWatered`, `lastFed`, and maps back to an Archetype and Location.

---

## 🧰 CLI Tools & Scripts

FloraSync includes powerful Node and Python CLI tools to manage your physical and digital garden:

- **`npm run seed`**: Imports baseline Dictionary Archetypes, Zones, and Locations from `src/data/imports/` into the SQLite database.
- **`npm run backup`**: Safely extracts all living Plant Instances into a timestamped JSON file in `src/data/backups/`.
- **`npm run restore`**: Restores the database's live Plant Instances from the most recent backup.
- **Print Center / CLI**: Generate perfectly spaced Avery-compatible printable PNG sheets containing QR codes for every active plant, zone, and location in your system directly from the UI or via `python3 scripts/python/make_qrs.py --from-db`.

## 🛠️ Getting Started

### 1. Clone the repository:
```bash
git clone https://github.com/yourusername/FloraSync.git
cd FloraSync
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Run the development server:
```bash
npm run dev
```
