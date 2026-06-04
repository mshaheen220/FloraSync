# 🌿 FloraSync User Manual

Welcome to **FloraSync**, your local, privacy-first, offline-ready garden command center! FloraSync is designed to eliminate the friction of data entry when managing your home greenhouse or raised beds by bridging the physical and digital worlds using weatherproof QR codes.

This guide will walk you through the core features of the app and teach you how to get the absolute most out of your smart garden.

---

## 📱 1. Accessing the App

To use FloraSync on your phone, you simply need to navigate to your local server in your mobile browser (Safari or Chrome).

1. Open your browser and go to `https://theforge.local:8080`.
2. Because your local server generates its own secure HTTPS certificates (which is strictly required for your phone's camera to work), you will see a warning that says **"This Connection Is Not Private"**. 
3. **This is completely normal for local home networks!** To bypass it:
   * **Safari:** Tap **Show Details** at the bottom, then **visit this website**.
   * **Chrome:** Tap **Advanced**, then **Proceed to theforge.local (unsafe)**.

---

## 🌍 2. The Command Center (Dashboard)

The Dashboard is the heart of FloraSync. Instead of a standard list, it acts as a dynamic sorting engine that floats the most urgent tasks to the top of your screen.

*!Screenshot: The Dashboard showing Quick Actions, Garden Vitality, and the Needs Watering queue.*

*   **Garden Vitality:** A quick glance at your overall hydration and feeding percentages. Keep these in the green!
*   **Approaching Harvest & The Nursery:** These smart carousels *only* appear when they are relevant. If a plant is within 14 days of being ready to pick, or was planted in the last two weeks, it will magically appear here.
*   **Quick Actions:** Instantly water or feed your entire garden, or specifically target your macro-zones (like the Greenhouse or Raised Bed) with a single tap.
*   **Attention Queues:** The app actively calculates the exact time elapsed since you last watered/fed a plant against its specific dictionary requirements and environment (Greenhouses dry out slower!). If it needs care, it drops into the **Needs Watering** or **Hungry Plants** list.

---

## 📷 3. The Physical Bridge: QR Codes

The magic of FloraSync lies in the physical QR tags placed in your pots and beds. Tap the floating **Camera Button (📷)** on the Dashboard to open the scanner.

*!Screenshot: The in-app camera scanner targeting a physical QR code on a plant stake.*

### Printing Tags (The Print Center)
You can generate and download perfectly formatted sheets of QR codes directly from the app!
1. Open the Hamburger Menu and go to **Settings**.
2. Scroll to the **Print Center**.
3. Choose **Database Export** to print tags with names for everything currently in your system, or **Blank Tags** to print unassigned stickers.
4. Click **Generate** and download your PNG sheets!

### "Zero-Click" Care
If you generate a QR code with an action built-in (e.g., a "Water Me" tag), simply scanning that tag instantly updates the database and resets the hydration bar to 100%. No buttons to press, no forms to fill out.

### Just-In-Time (JIT) Registration
When you print a sheet of blank, unassigned tags, you don't need to register them on your computer first. 
1. Stick a blank tag in a new pot.
2. Scan it with your phone.
3. FloraSync will say, *"New Tag Detected! What are we planting here?"*
4. Pick a plant from your dictionary, assign it to a location, and you're done!

*!Screenshot: The New Tag Detected (JIT Registration) form showing the category and plant dropdowns.*

---

## 📖 4. The Plant Dictionary (Archetypes)

Before you can plant something, it needs to exist in your Dictionary. This is where you define the "baseline" rules for a specific species or strain.

*!Screenshot: The Plant Dictionary screen showing the accordion list of herbs and vegetables.*

Navigate to the **Plant Dictionary** via the Hamburger Menu. Here, you set the immutable traits of a crop:
*   **Care Intervals:** How many days between watering and feeding?
*   **Sunlight:** Full sun, part shade, or full shade?
*   **Lifecycle:** Annual, Biennial, or Perennial?
*   **Harvest:** How many days until it's ready to pick?

Once a plant is in the dictionary, you can spawn infinite physical *Instances* of it in your garden, and they will all inherit these rules!

---

## 📍 5. Managing Your Space: Zones & Locations

FloraSync uses a strict, organized hierarchy to prevent your inventory from turning into a chaotic list: `Zones` -> `Locations` -> `Plants`.

*!Screenshot: The Location Manager showing Locations neatly grouped under their parent Zones.*

1.  **Zones (Macro):** These are your large areas (e.g., *Greenhouse*, *Rear Patio*). You can assign an **Evaporation Modifier** to a Zone. For example, setting the Greenhouse to `0.8x` tells the app that plants inside it dry out 20% slower than normal!
2.  **Locations (Micro):** These live inside Zones (e.g., *Top Shelf*, *Left Bed*). Grouping plants by location allows you to hit "Water All" for a specific shelf without watering the entire greenhouse.

---

## 📓 6. The Plant Journal & Harvest Tracking

Clicking on any plant opens its **Plant Detail** view. At the bottom, you'll find the **Plant Journal**. This is where your garden's history comes alive.

*!Screenshot: A Plant Detail view scrolled down to the Journal, showing a photo and colorful stat badges.*

When you add a Journal Entry, you can:
*   **Snap a Photo:** Document growth, and even click "Set as Cover Photo" to override the dictionary image with a picture of your actual, living plant!
*   **Track Phenology:** Log exactly when the plant moves from *Seedling* to *Blooming* to *Fruiting*.
*   **Log Harvests:** Select "Harvest" as the Activity Type and log the exact weight or quantity you picked (e.g., "12 oz" or "3 Tomatoes"). 
*   **Monitor Health:** Log pest damage, wilting, or sunburn.

All entries stack into a beautiful vertical timeline so you can see the complete lifecycle of your crop.

---

##  7. Bulk Data Import

If you have a lot of existing garden data or want to share a customized plant dictionary with a friend, you can use the bulk Data Import tool instead of typing everything out manually!

1. Open the Hamburger Menu and go to **Settings**.
2. Scroll down to the **Data Import** section.
3. Select the type of data you are importing from the dropdown (*Plant Dictionary (Archetypes)*, *Zones*, or *Locations*).
4. Click **❓ Schema Help** to see the exact JSON format required.
5. Paste your formatted JSON array into the text box and click **Import Data**.

FloraSync will automatically read the data, skip any items with duplicate IDs to protect your existing garden, and seamlessly merge the new information into your database!

---

## 💡 8. Pro-Tips

**Unmonitored / Rain-Fed Plants**
Got a mature rhododendron in the front yard that you want in your inventory, but you don't want it begging for water every 4 days? 
Edit the plant and check the **"Unmonitored / Rain-fed"** box. It will turn grey, drop out of all your care queues, and no longer affect your Garden Vitality score, but you can still use its journal to track blooms!

**Inventory Grouping**
Inside the **Inventory Manager**, use the "Group By" dropdown at the top to instantly pivot your master list. Viewing your plants by "Category" is great for seeing all your Herbs at once, while viewing by "Zone" gives you a perfect physical map of your yard.

**Fast Searching**
Both the Dictionary and the Inventory Manager have a search bar. Start typing, and the relevant accordions will automatically pop open to reveal what you're looking for!