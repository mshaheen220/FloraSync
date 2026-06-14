---
id: "feature-bulk-import"
title: "Bulk Data Import"
category: "Features"
parent: "settings-administration"
tags: ["import", "json", "dictionary", "zip", "package", "bulk"]
---

# 📦 Bulk Data Import

If you want to share a customized plant dictionary with a friend or jumpstart a brand new garden, you can use the Bulk Import tool instead of typing everything out manually!

Instead of a simple text box, FloraSync uses smart **Plant Packages (`.zip`)**. This allows you to import the plant rules *and* their beautiful cover photos all at the exact same time!

### How to Import a Plant Package
1. Open the Hamburger Menu and go to **Settings**.
2. Scroll down to the **Data Import** section.
3. Tap the **Choose File** button and select your `.zip` package.
4. Click **Import**.

FloraSync will automatically read the package, compress the images to save space, skip any plants you already have to protect your garden, and magically merge the new information into your master Dictionary!

### Building Your Own Package (For Advanced Users)
Want to build a package to share? It just requires a `.zip` file containing a `new-plants.json` file alongside a folder of your images. 

**Inside your `.zip` file:**
```text
/new-plants.json
/images/vegetables/spaghetti-squash.jpg
```

**Inside your `new-plants.json` file:**
```json
[
  {
    "id": "spaghetti-squash",
    "commonName": "Spaghetti Squash",
    "category": "Vegetables",
    "lifecycle": "Annual",
    "sunRequirement": "Full Sun",
    "waterIntervalDays": 3,
    "imageUrl": "images/vegetables/spaghetti-squash.jpg"
  }
]
```