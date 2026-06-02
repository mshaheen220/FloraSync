import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import CircleModuleDrawer
import sqlite3
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
ICONS_DIR = os.path.join(ROOT_DIR, "public", "images", "icons", "qr")
DATA_DIR = os.path.join(ROOT_DIR, "src", "data")

OUTPUT_DIR = os.path.join(DATA_DIR, "code-prints")
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# ==========================================
# 1. AVERY TEMPLATE CONFIGURATION (In Inches)
# Standard Avery 1" Square (e.g., 22805 / 4321)
# ==========================================
PAGE_WIDTH = 8.5
PAGE_HEIGHT = 11.0
DPI = 300  # High resolution for crisp printing

# Grid layout
COLS = 6
ROWS = 8
TOTAL_LABELS_PER_SHEET = COLS * ROWS

LABEL_WIDTH = 1.0   # 1 inch (25.4mm)
LABEL_HEIGHT = 1.0  # 1 inch (25.4mm)

# Margins and spacing
MARGIN_LEFT = 0.75
MARGIN_TOP = 0.75
GAP_X = 1.2        # Center-to-center horizontal distance
GAP_Y = 1.2        # Center-to-center vertical distance

# Target QR size (Shrink slightly to leave room for the text label below it!)
QR_SIZE_INCHES = 0.82  
QR_SIZE_PIXELS = int(QR_SIZE_INCHES * DPI)

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================
def generate_qr_with_icon(data_url, icon_path):
    """Generates a high-quality QR code with a small centered icon."""
    # Create the QR base
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M, # Q-level (25%) reduces grid density while keeping it safe
        box_size=10,
        border=1,
    )
    qr.add_data(data_url)
    qr.make(fit=True)
    
    # Create the dotted QR code image
    qr_img = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=CircleModuleDrawer()
    ).convert("RGB")
    
    qr_img = qr_img.resize((QR_SIZE_PIXELS, QR_SIZE_PIXELS), Image.Resampling.LANCZOS)
    
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert("RGBA")
        
        # Keep the icon small (max 20% of QR size) so the code remains scannable
        icon_size = int(QR_SIZE_PIXELS * 0.20)
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        
        # Create a solid white box slightly larger than the icon to act as a clean "cutout"
        box_size = int(QR_SIZE_PIXELS * 0.25)
        white_box = Image.new("RGB", (box_size, box_size), "white")
        
        # Calculate center positions for both the box and the icon
        box_pos = ((QR_SIZE_PIXELS - box_size) // 2, (QR_SIZE_PIXELS - box_size) // 2)
        icon_pos = ((QR_SIZE_PIXELS - icon_size) // 2, (QR_SIZE_PIXELS - icon_size) // 2)
        
        # Paste the white cutout box first to clear out the complex QR dots
        qr_img.paste(white_box, box_pos)
        # Paste the icon on top of the white box using its alpha channel as a mask
        qr_img.paste(icon, icon_pos, icon)
    else:
        print(f"Warning: Icon asset '{icon_path}' not found. Generating QR without it.")
        
    return qr_img

# ==========================================
# 3. GENERATOR ENGINE
# ==========================================
def generate_sheets(category, ids_to_process, output_basename, start_id=None):
    if not ids_to_process:
        print(f"No IDs to process for category '{category}'. Skipping.")
        return

    total_ids = len(ids_to_process)
    labels_per_id = 1
    total_labels_to_generate = total_ids * labels_per_id
    num_sheets = (total_labels_to_generate + TOTAL_LABELS_PER_SHEET - 1) // TOTAL_LABELS_PER_SHEET

    id_index = 0
    
    for sheet_num in range(num_sheets):
        page_w_px = int(PAGE_WIDTH * DPI)
        page_h_px = int(PAGE_HEIGHT * DPI)
        page = Image.new("RGB", (page_w_px, page_h_px), "white")
        page_draw = ImageDraw.Draw(page)
        
        try:
            label_font = ImageFont.truetype("Arial.ttf", 24)
        except IOError:
            try:
                label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            except IOError:
                try:
                    label_font = ImageFont.load_default(size=24)
                except TypeError:
                    label_font = ImageFont.load_default()
        
        print(f"Generating {category} sheet {sheet_num + 1} of {num_sheets}...")

        for label_index in range(TOTAL_LABELS_PER_SHEET):
            if id_index >= total_ids:
                break

            item = ids_to_process[id_index]
            if isinstance(item, tuple):
                base_id, label_text = item
            else:
                base_id = item
                label_text = str(item)
            
            url = f"/{category}/{base_id}"
            icon = os.path.join(ICONS_DIR, f"{category}.png")
            
            qr_thumb = generate_qr_with_icon(url, icon)
            
            row = label_index // COLS
            col = label_index % COLS

            x_inch = MARGIN_LEFT + (col * GAP_X)
            y_inch = MARGIN_TOP + (row * GAP_Y)
            
            center_offset_x = (LABEL_WIDTH - QR_SIZE_INCHES) / 2
            center_offset_y = (LABEL_HEIGHT - QR_SIZE_INCHES) / 2
            
            pos_x_px = int((x_inch + center_offset_x) * DPI)
            pos_y_px = int((y_inch + center_offset_y) * DPI)
            
            page.paste(qr_thumb, (pos_x_px, pos_y_px))
            
            page_draw.text((pos_x_px + 10, pos_y_px + QR_SIZE_PIXELS + 2), label_text, fill="black", font=label_font)
            
            id_index += 1

        output_filename = os.path.join(OUTPUT_DIR, f"{output_basename}_sheet_{sheet_num + 1}.png")
        page.save(output_filename, "PNG", dpi=(DPI, DPI))
        print(f"Success! Saved printable template to {output_filename}")

    if start_id:
        next_id = int(start_id) + TOTAL_LABELS_PER_SHEET
        id_length = len(start_id)
        print(f"Next sheet should start with ID: --start-id {next_id:0{id_length}d}")

def main():
    parser = argparse.ArgumentParser(description="Generate a sheet of paired garden QR codes.")
    parser.add_argument("--from-db", action="store_true", help="Pull all existing IDs directly from the database.")
    parser.add_argument(
        "--category", 
        type=str, 
        choices=["plant", "zone", "location"],
        required=False, 
        help="The category of the QR code (plant, zone, location)"
    )

    # Mode selection
    parser.add_argument("--file", type=str, help="Name of a text file in src/data/ containing IDs to process (one per line).")
    
    # Sequential generation (optional if file is provided)
    parser.add_argument("--prefix", type=str, help="The prefix for the ID for sequential generation (e.g., qr, zn, loc)")
    parser.add_argument("--start-id", type=str, help="The numeric starting ID for sequential generation, with optional leading zeros (e.g., 001)")

    args = parser.parse_args()
    
    if args.from_db:
        db_path = os.path.join(ROOT_DIR, "florasync.db")
        if not os.path.exists(db_path):
            print(f"Error: Database not found at {db_path}")
            sys.exit(1)
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT instances, locations, zones, archetypes FROM app_state WHERE id = 1")
        row = c.fetchone()
        conn.close()
        
        if not row:
            print("Database is empty!")
            sys.exit(1)
            
        instances = json.loads(row[0] or "[]")
        locations = json.loads(row[1] or "[]")
        zones = json.loads(row[2] or "[]")
        archetypes = json.loads(row[3] or "[]")
        
        arch_dict = {a.get('id'): a.get('commonName', 'Unknown') for a in archetypes}
        
        plant_ids = [(inst['qrId'], arch_dict.get(inst.get('archetypeId'), inst['qrId'])) for inst in instances]
        loc_ids = [(loc['id'], loc.get('name', loc['id'])) for loc in locations]
        zone_ids = [(zone['id'], zone.get('name', zone['id'])) for zone in zones]
        
        print("--- Database Export Mode ---")
        if not args.category or args.category == "plant":
            generate_sheets("plant", plant_ids, "db_export_plants")
        if not args.category or args.category == "location":
            generate_sheets("location", loc_ids, "db_export_locations")
        if not args.category or args.category == "zone":
            generate_sheets("zone", zone_ids, "db_export_zones")
        return

    if not args.category:
        parser.error("Error: --category is required unless using --from-db.")

    ids_to_process = []
    output_basename = ""

    if args.file:
        if args.prefix or args.start_id:
            parser.error("Error: --file cannot be used with --prefix or --start-id.")
        
        file_path = os.path.join(DATA_DIR, args.file)
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}")
            sys.exit(1)
            
        with open(file_path, 'r') as f:
            ids_to_process = [line.strip() for line in f if line.strip()]
        
        output_basename = f"{args.category}_{os.path.splitext(args.file)[0]}"
        print(f"Generating QR codes for {len(ids_to_process)} IDs from {args.file}...")

    elif args.prefix and args.start_id:
        id_length = len(args.start_id)
        start_id_val = int(args.start_id)
        num_ids_needed = TOTAL_LABELS_PER_SHEET
        
        for i in range(num_ids_needed):
            ids_to_process.append(f"{args.prefix}-{start_id_val + i:0{id_length}d}")
            
        output_basename = f"{args.category}_{args.prefix}_sheet_start_{args.start_id}"
        print(f"Generating sequential sheet starting at ID: {ids_to_process[0]}...")
    else:
        parser.error("Error: You must provide either --file or both --prefix and --start-id.")

    generate_sheets(args.category, ids_to_process, output_basename, args.start_id)

if __name__ == "__main__":
    main()