# FloraSync 🌿

FloraSync is a mobile-first, context-aware React web application designed to eliminate data-entry friction in home greenhouse and raised garden bed management. By deploying weatherproof physical QR codes directly onto plant stakes, shelves, and garden beds, users can instantly log critical care metrics (watering, feeding) with a single tap or scan.

The interface pairs an earthy, bohemian-modern aesthetic with hyper-efficient single-purpose URL execution to keep tracking secondary to actual gardening.

---

## 🚀 Architecture & Tech Stack

- **Frontend Core:** React (TypeScript)
- **Styling Architecture:** Tailwind CSS (Utility Layouts) + Styled Components (Prop-driven structural states)
- **Iconography:** Lucide React
- **Design System:** Mobile-first responsive grids optimized for single-hand phone interaction.

---

## 📋 Core Features & Mechanics

### 1. "Zero-Click" Action Handling
Physical QR codes on individual stakes or shelf borders are encoded with explicit query parameters (e.g., `?qr=012&action=water`). 
- Scanning the code targets the specific backend routing layer.
- The state updates instantly (`last_watered = NOW()`) without requiring manual form submissions or button taps on the mobile screen.
- A success toast pattern gives immediate feedback.

### 2. Location & Cascade Hierarchy
To prevent tracking fatigue, data architecture follows a nested hierarchy:
`Zone (Greenhouse) -> Section (Shelf A) -> Individual Pots (Instances)`
Scanning a Section or Zone level QR code provides instant macro-actions, such as a **"Water All Plants on Shelf A"** batch update.

### 3. Smart Attention Queue
The central dashboard acts as a dynamic sorting engine. Instead of a standard list, it calculates care intervals against local system time to surface a **"What Needs Attention Today"** stack, floating dehydrated or hungry plants directly to the top.

### 4. Dynamic Just-In-Time Registration
New QR codes deployed to the garden can be initialized dynamically. Scanning an unmapped tag opens a lightweight onboarding field. Entering a single identifier (e.g., "Sweet Basil") pulls structured cultivation metrics (sunlight, baseline care intervals) from a decoupled reference schema, inheriting pre-mapped location contexts automatically.

---

## 💾 Core Schema Reference

### `PlantArchetype`
Defines the immutable cultivation properties of a specific crop strain.
```typescript
interface PlantArchetype {
  id: string;              // e.g., "sweet-basil"
  commonName: string;      // e.g., "Sweet Basil"
  sunRequirement: string;  // e.g., "Full Sun"
  waterIntervalDays: number; // e.g., 2
  feedingIntervalDays: number; // e.g., 14
  pruningTips: string;
}
```

### 'PlantInstance'
Defines the mutable state properties tracking physical entities in the real world.
```typescript
interface PlantInstance {
  qrId: string;            // e.g., "qr-greenhouse-045"
  archetypeId: string;     // FK mapping back to Archetype
  locationId: string;      // e.g., "greenhouse-shelf-a"
  datePlanted: string;
  lastWatered: string;     // ISO Timestamp
  lastFed: string;         // ISO Timestamp
}
```
## 🛠️ Getting Started

### 1. Clone the repository:
```bash
git clone [https://github.com/yourusername/thrivetag.git](https://github.com/yourusername/thrivetag.git)
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Run the development server:
```bash
npm run dev
```

## 🗺️ Implementation Roadmap

- [ ] Initialize React + TS framework template setup
- [ ] Scaffold global StyledElements primitive directory
- [ ] Integrate Tailwind configuration foundations
- [ ] Construct query string processing hook for automated scanning simulations
- [ ] Build Dashboard and Queue prioritization matrices
- [ ] Implement cascaded location batch-actions
