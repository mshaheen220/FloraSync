# 🖨️ FloraSync QR Code Generation Guide

The `make_qrs.py` script is a powerful tool designed to generate beautifully formatted, printable PNG sheets of QR codes for your garden. 

The output is specifically optimized for printing on **vinyl sticker paper** with faint grey cut guides to help you manually trim them into perfect 1-inch square labels.

## 📋 Prerequisites
Ensure you have the required Python libraries installed on your machine before running the script:
```bash
pip3 install Pillow qrcode
```
*Note: Always run these commands from the root `FloraSync` directory.*

---

## 🚀 Modes of Operation

The script can be run in three different ways depending on what you need to print.

### 1. Database Export Mode (Recommended)
This is the easiest and most powerful way to print tags. It reads your live SQLite database and generates tags for every single Plant, Zone, and Location that currently exists in your system. 

Crucially, it pulls the human-readable names from your dictionary (e.g., "Sweet Basil" instead of "qr-001") and centers them neatly beneath the QR codes.

**Command:**
```bash
python3 scripts/python/make_qrs.py --from-db
```
*Output:* Generates separate sheets for plants, zones, and locations directly in the `src/data/code-prints/` folder.

---

### 2. Sequential Blank Tag Generation
If you just want to print a fresh sheet of unassigned, blank tags to stick into pots later, you can generate a sequential list of IDs (e.g., `qr-001`, `qr-002`, etc.).

You must provide the `--category`, a `--prefix`, and a numeric `--start-id`. The script will automatically generate exactly enough IDs to fill one complete sheet (48 tags).

**Command (Blank Plant Tags):**
```bash
python3 scripts/python/make_qrs.py --category plant --prefix qr --start-id 001
```

**Command (Blank Location Tags):**
```bash
python3 scripts/python/make_qrs.py --category location --prefix loc --start-id 050
```

*Pro-Tip: When the script finishes, it will print out the next available `--start-id` in the terminal so you know exactly where to pick up on your next sheet!*

---

### 3. Custom List Generation
If you only want to reprint a few specific tags that got damaged in the garden, you can feed the script a custom text file.

1. Create a text file in `src/data/` (e.g., `reprints.txt`).
2. Add the exact IDs you want to generate, one per line:
   ```text
   qr-012
   qr-045
   qr-088
   ```
3. Run the script pointing to that file:

**Command:**
```bash
python3 scripts/python/make_qrs.py --category plant --file reprints.txt
```

---

## 📁 Output Details

All generated images are saved to the **`src/data/code-prints/`** directory.

- **Sheet Size:** 8.5" x 11" (Standard US Letter)
- **Grid Layout:** 6 columns by 8 rows (48 tags per sheet)
- **Label Size:** 1" x 1" with visible grey cut-lines