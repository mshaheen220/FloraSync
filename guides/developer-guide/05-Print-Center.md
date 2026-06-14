---
id: "dev-feature-print-center"
title: "Print Center & QR Codes"
category: "Developer Guide"
tags: ["print", "qr codes", "labels", "blank tags", "zero-click", "qrcode.react"]
---

# Print Center & QR Codes (Developer Guide)

The Print Center allows users to generate physical QR code labels to connect the physical garden with the digital database. The system renders PDF-ready printable sheets using the `qrcode.react` library.

## Print Queue Data Storage

Individual print requests are stored as a JSON array within the garden's data.

* **Database Table:** `gardens`
* **Column:** `print_queue TEXT DEFAULT '[]'`
* **Synchronization:** Like the rest of the workspace state, the queue is fetched via `GET /api/state` and persisted via `POST /api/state`.

## Three Modes of Printing

The print generation logic is handled in `src/components/core/settings/PrintCenter.tsx`, supporting three main flows:

1. **The Print Queue (`queue`):** Renders the user's manual queue. 
   * **Smart Fill:** If a standard sheet of labels (e.g., 30 per page) isn't completely filled by the queue, the client calculates the remainder. If "Smart Fill" is active, it programmatically appends dynamically generated, sequential blank tags (e.g., `PREFIX-001`, `PREFIX-002`) to the print array so no label space is wasted.
2. **Bulk Print (`db`):** Bypasses the queue and maps over the entire `instances`, `locations`, and `zones` arrays from the global garden state to generate a massive sheet of all existing items.
3. **Blank Sequences (`blank`):** Generates arrays of unassigned tags using a user-defined prefix (`blankPrefix`) and an auto-incrementing start ID (`blankStartId`).

## QR Code Payload & Routing (`PrintLayout.tsx`)

The system does not encode a full domain URL in the QR code. Instead, it encodes the app's internal routing path. This allows the application (or a smart camera handler routing into the app) to instantly resolve the scanned entity.

* **Standard Tags:** The encoded URL structure is `/${item.type}/${item.id}` (e.g., `/plant/ABC-123`).
* **Zero-Click Actions:** 
  Users can print specialized tags that trigger immediate actions without navigating to an entity profile. The `action` property can be `'water'` or `'feed'`.
  The encoded URL appends the action to the route: `/${item.type}/${item.id}/${item.action}` (e.g., `/zone/Z-999/water`).
  When scanned, the app's router intercepts this path and immediately executes the bulk action (e.g., logging a watering event for all plants in the zone) without requiring further UI interaction.

## Visual Rendering

QR codes are generated client-side using `QRCodeSVG`. An icon corresponding to the item's type (`plant.png`, `location.png`, or `zone.png`) is dynamically overlaid in the center of the QR code using the `imageSettings` prop to help users visually distinguish the tag type before scanning. For Zero-Click tags, a specific action icon (e.g., a water drop) is overlaid instead.