import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import CircleModuleDrawer
import sqlite3
import json
import textwrap

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
ICONS_DIR = os.path.join(ROOT_DIR, "public", "images", "icons", "qr")
DATA_DIR = os.path.join(ROOT_DIR, "src", "data")

# ==========================================
# 1. GRID & TEMPLATE CONFIGURATION (In Inches)
# Optimized for manual cutting on vinyl sticker sheets
# (Also compatible with Standard Avery 1" Square e.g., 22805 / 4321)
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
MARGIN_TOP = 0.9
GAP_X = 1.2        # Center-to-center horizontal distance
GAP_Y = 1.2        # Center-to-center vertical distance

# Target QR size (Shrink slightly to leave room for the text label below it!)
QR_SIZE_INCHES = 0.75
QR_SIZE_PIXELS = int(QR_SIZE_INCHES * DPI)

DRAW_CUT_GUIDES = True # Set to True to draw faint outlines around each sticker for manual cutting

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================
def generate_qr(data_url):
    """Generates a high-quality QR code."""
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
    
        
    return qr_img

# ==========================================
# 3. GENERATOR ENGINE
# ==========================================
def generate_sheets(category, ids_to_process, output_basename, output_dir, start_id=None):
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
            label_font = ImageFont.truetype("Arial.ttf", 20)
        except IOError:
            try:
                label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
            except IOError:
                try:
                    label_font = ImageFont.load_default(size=20)
                except TypeError:
                    label_font = ImageFont.load_default()
        
        print(f"Generating {category} sheet {sheet_num + 1} of {num_sheets}...")

        for label_index in range(TOTAL_LABELS_PER_SHEET):
            if id_index >= total_ids:
                break

            item = ids_to_process[id_index]
            if isinstance(item, tuple):
                if len(item) == 3:
                    item_cat, base_id, label_text = item
                else:
                    base_id, label_text = item
                    item_cat = category
            else:
                base_id = item
                label_text = str(item)
                item_cat = category
            
            url = f"/{item_cat}/{base_id}"
            
            qr_thumb = generate_qr(url)
            
            row = label_index // COLS
            col = label_index % COLS

            x_inch = MARGIN_LEFT + (col * GAP_X)
            y_inch = MARGIN_TOP + (row * GAP_Y)
            
            # Draw cut guides if enabled to assist with manual vinyl cutting
            if DRAW_CUT_GUIDES:
                cell_x1 = int(x_inch * DPI)
                cell_y1 = int(y_inch * DPI)
                cell_x2 = int((x_inch + LABEL_WIDTH) * DPI)
                cell_y2 = int((y_inch + LABEL_HEIGHT) * DPI)
                page_draw.rectangle([cell_x1, cell_y1, cell_x2, cell_y2], outline="#CCCCCC", width=2)
            
            # Respect explicit newlines, or wrap if it's a single long line
            if "\n" in label_text:
                wrapped_lines = label_text.split("\n")[:2]
                # Ensure manually split lines still don't overflow the sticker width
                wrapped_lines = [(line[:19] + "...") if len(line) > 22 else line for line in wrapped_lines]
            else:
                wrapped_lines = textwrap.wrap(label_text, width=22)
                if len(wrapped_lines) > 2:
                    wrapped_lines = wrapped_lines[:2]
                    wrapped_lines[1] = wrapped_lines[1][:19] + "..."
            wrapped_label = "\n".join(wrapped_lines)
            
            # Calculate text dimensions to vertically center the entire block (QR + Text)
            bbox = page_draw.multiline_textbbox((0, 0), wrapped_label, font=label_font, spacing=2)
            text_height = bbox[3] - bbox[1]
            
            total_block_height = QR_SIZE_PIXELS + 4 + text_height
            label_height_px = int(LABEL_HEIGHT * DPI)
            
            center_offset_x_px = int(((LABEL_WIDTH - QR_SIZE_INCHES) / 2) * DPI)
            center_offset_y_px = (label_height_px - total_block_height) // 2
            
            pos_x_px = int(x_inch * DPI) + center_offset_x_px
            pos_y_px = int(y_inch * DPI) + center_offset_y_px
            
            page.paste(qr_thumb, (pos_x_px, pos_y_px))
            
            # Center-align the text directly beneath the QR code
            center_x = pos_x_px + (QR_SIZE_PIXELS // 2)
            page_draw.multiline_text(
                (center_x, pos_y_px + QR_SIZE_PIXELS + 4), 
                wrapped_label, fill="black", font=label_font, anchor="ma", align="center", spacing=2
            )
            
            id_index += 1

        output_filename = os.path.join(output_dir, f"{output_basename}_sheet_{sheet_num + 1}.png")
        page.save(output_filename, "PNG", dpi=(DPI, DPI))
        print(f"Success! Saved printable template to {output_filename}")

    if start_id:
        next_id = int(start_id) + TOTAL_LABELS_PER_SHEET
        id_length = len(start_id)
        print(f"Next sheet should start with ID: --start-id {next_id:0{id_length}d}")

def main():
    parser = argparse.ArgumentParser(description="Generate a sheet of paired garden QR codes.")
    parser.add_argument("--from-db", action="store_true", help="Pull all existing IDs directly from the database.")
    parser.add_argument("--garden-id", type=str, required=False, help="The specific garden ID to pull from and use for the output folder.")
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
    
    garden_id_str = args.garden_id if args.garden_id else "default"
    output_dir = os.path.join(DATA_DIR, "code-prints", garden_id_str)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    if args.from_db:
        db_path = os.path.join(ROOT_DIR, "florasync.db")
        if not os.path.exists(db_path):
            print(f"Error: Database not found at {db_path}")
            sys.exit(1)
        
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("SELECT archetypes FROM shared_dictionary WHERE id = 1")
        dict_row = c.fetchone()
        archetypes = json.loads(dict_row[0] if dict_row and dict_row[0] else "[]")
        
        instances = []
        locations = []
        zones = []
        
        if args.garden_id:
            c.execute("SELECT instances, locations, zones FROM gardens WHERE id = ?", (args.garden_id,))
            row = c.fetchone()
            if row:
                instances = json.loads(row[0] or "[]")
                locations = json.loads(row[1] or "[]")
                zones = json.loads(row[2] or "[]")
        else:
            try:
                c.execute("SELECT instances, locations, zones FROM app_state WHERE id = 1")
                row = c.fetchone()
                if row:
                    instances = json.loads(row[0] or "[]")
                    locations = json.loads(row[1] or "[]")
                    zones = json.loads(row[2] or "[]")
            except sqlite3.OperationalError:
                pass
                
        conn.close()
        
        if not instances and not locations and not zones:
            print("Database is empty!")
            sys.exit(1)
            
        arch_dict = {a.get('id'): a.get('commonName', 'Unknown') for a in archetypes}
        zone_dict = {z.get('id'): z.get('name', 'Unknown Zone') for z in zones}
        
        plant_ids = [(inst['qrId'], arch_dict.get(inst.get('archetypeId'), inst['qrId'])) for inst in instances]
        loc_ids = [(loc['id'], f"{zone_dict.get(loc.get('zoneId'), 'Unknown')}\n{loc.get('name', loc['id'])}") for loc in locations]
        zone_ids = [(zone['id'], zone.get('name', zone['id'])) for zone in zones]
        
        print("--- Database Export Mode ---")
        if not args.category or args.category == "plant":
            generate_sheets("plant", plant_ids, "db_export_plants", output_dir)
        if not args.category:
            mixed_ids = [("zone", z[0], z[1]) for z in zone_ids] + [("location", l[0], l[1]) for l in loc_ids]
            if mixed_ids:
                generate_sheets("Spaces (Zones & Locations)", mixed_ids, "db_export_spaces", output_dir)
        else:
            if args.category == "location":
                generate_sheets("location", loc_ids, "db_export_locations", output_dir)
            if args.category == "zone":
                generate_sheets("zone", zone_ids, "db_export_zones", output_dir)
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

    generate_sheets(args.category, ids_to_process, output_basename, output_dir, args.start_id)

if __name__ == "__main__":
    main()