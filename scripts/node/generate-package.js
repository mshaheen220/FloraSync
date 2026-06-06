import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const PACKAGES_DIR = path.join(ROOT_DIR, 'src/data/packages');

// Native Node.js .env loading (v21.7.0+)
try {
  process.loadEnvFile(path.join(ROOT_DIR, '.env'));
} catch (err) {
  // Ignore if .env doesn't exist, we check for the variable later
}

// 📝 1. Get the list of plant common names from command line arguments!
const PLANTS_TO_GENERATE = process.argv.slice(2);

if (PLANTS_TO_GENERATE.length === 0) {
  console.error('❌ ERROR: Please provide at least one plant name as an argument.');
  console.log('Usage: node scripts/node/generate-package.js "Dragon Carrot" "Lemon Thyme" "Ghost Fern"');
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function askGeminiForPlantData(commonName) {
  const prompt = `You are a botanical database assistant. Generate a JSON object for a plant with the common name: "${commonName}".
  The JSON must match exactly this structure, providing realistic horticultural data:
  {
    "scientificName": "...",
    "category": "...", // e.g. Vegetable, Herb, Foliage Accent, Flower
    "folder": "...", // MUST be exactly one of: flowers, fruits, foliage, herbs, vegetables
    "imageSearchTerm": "...", // A 3-5 word search query for Wikimedia Commons. MUST use the Scientific/Latin name. MUST include 'blooming' or 'flowers' for flowers, and 'fruiting' or 'growing' for vegetables/vines. (e.g. 'blooming Hemerocallis', 'fruiting Vitis vinifera', 'growing Brassica rapa').
    "lifecycle": "...", // e.g. Annual, Biennial, Perennial
    "sunRequirement": "...",
    "waterIntervalDays": 3, // integer
    "feedingIntervalDays": 14, // integer
    "daysToHarvest": 60, // integer
    "whatToFeed": "...",
    "pruningTips": "...",
    "flavorProfile": "...",
    "companionPlants": ["...", "..."], // array of strings
    "combativePlants": [], // array of strings
    "growthHabit": "...",
    "whenToPlant": "...",
    "whenToHarvest": "...",
    "usesForLargeHarvests": "...",
    "hardinessZones": [4, 5, 6], // array of integers
    "hardinessNote": "...",
    "plantingInstructions": "...",
    "growthRequirements": "..."
  }
  Return ONLY raw JSON. No markdown formatting, no backticks, no explanations.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } })
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text.trim();
  const cleanedText = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  
  return JSON.parse(cleanedText);
}

async function generatePackage() {
  if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: Please set your GEMINI_API_KEY in the .env file.');
    process.exit(1);
  }

  console.log('📦 Starting AI-powered plant package generation...');
  
  if (!fs.existsSync(PACKAGES_DIR)) {
    fs.mkdirSync(PACKAGES_DIR, { recursive: true });
  }

  const zip = new JSZip();
  const archetypes = [];

  for (const plantName of PLANTS_TO_GENERATE) {
    // Add a short 2-second delay between plants to respect Gemini's free-tier rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n🤖 Asking Gemini to research: ${plantName}...`);
    
    let aiData;
    let dataSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        aiData = await askGeminiForPlantData(plantName);
        console.log(`✅ Gemini successfully generated data for ${plantName}.`);
        dataSuccess = true;
        break;
      } catch (err) {
        if (attempt < 3) {
          console.log(`   ⚠️ Gemini API error (Attempt ${attempt}/3): ${err.message}. Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error(`❌ Failed to get data for ${plantName} after 3 attempts:`, err.message);
        }
      }
    }

    if (!dataSuccess) continue; // Skip to next plant

    const id = plantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let relativeImagePath = "";

    console.log(`🖼️  Sourcing high-quality photograph for: ${plantName}...`);
    try {
      const fetchCommons = async (url) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // Increased to 15s to prevent timeouts on complex queries
        const res = await fetch(url, { 
          headers: { 'User-Agent': 'FloraSync-Bot/1.0 (dev@florasync.local)' },
          signal: controller.signal
        });
        clearTimeout(timeout);
        return res.json();
      };

      const getBestPage = (pages) => {
        if (!pages) return null;
        const pageList = Object.values(pages);
        // Client-side filtering: drastically faster and more reliable than making Wikimedia do it.
        // We fetch the top 5 results and discard any where the file title contains these red flags.
        const badWords = ['person', 'people', 'man', 'woman', 'farmer', 'holding', 'harvest', 'prize', 'giant', 'huge', 'boy', 'girl', 'child', 'basket', 'smile', 'record', 'competition', 'display', 'shirt', 'art', 'drawing', 'illustration', 'painting'];
        const best = pageList.find(p => {
          const title = p.title.toLowerCase();
          return !badWords.some(bad => title.includes(bad));
        });
        // If all results are bad, return null to force the script to try the next fallback tier!
        return best || null;
      };

      const executeSearch = async (term) => {
        // gsrlimit=5 fetches the top 5 results instead of 1, allowing us to filter them in JavaScript
        const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json`;
        const data = await fetchCommons(url);
        return getBestPage(data.query?.pages);
      };

      const queryName = (aiData.scientificName && aiData.scientificName !== 'Unknown') ? aiData.scientificName : plantName;
      const simpleScientific = queryName.split(' ').slice(0, 2).join(' ');
      const aiSearchTerm = aiData.imageSearchTerm || `${simpleScientific} plant`;

      // Keep negative filters extremely short to prevent Wikimedia's search engine from choking/timing out
      const negativeFilters = '-illustration -drawing -art -harvest -person -holding';
      
      // 1. Try Gemini's AI search term
      let bestPage = await executeSearch(`filetype:bitmap ${aiSearchTerm} ${negativeFilters}`);
      
      // 2. Fall back to Scientific Name
      if (!bestPage) {
        console.log(`   ⚠️ AI search missed. Trying scientific name for ${plantName}...`);
        bestPage = await executeSearch(`filetype:bitmap "${queryName}" plant ${negativeFilters}`);
      }
      
      // 3. Fall back to Simplified Scientific Name
      if (!bestPage && simpleScientific !== queryName && simpleScientific.length > 3) {
        console.log(`   ⚠️ Full scientific search missed. Trying simplified scientific name for ${plantName}...`);
        bestPage = await executeSearch(`filetype:bitmap "${simpleScientific}" plant ${negativeFilters}`);
      }

      // 4. Fall back to Common Name
      if (!bestPage) {
        console.log(`   ⚠️ Scientific search missed. Trying common name for ${plantName}...`);
        bestPage = await executeSearch(`filetype:bitmap "${plantName}" plant ${negativeFilters}`);
      }
      
      // 5. Absolute Last Resort: Naked Common Name (Javascript filtering still protects us!)
      if (!bestPage) {
        console.log(`   ⚠️ Filtered searches missed. Trying naked common name for ${plantName}...`);
        bestPage = await executeSearch(`filetype:bitmap "${plantName}"`);
      }
      
      if (bestPage) {
        // Try to grab the web-optimized thumbnail, fallback to the original if thumbnail fails
        const imgUrl = bestPage.imageinfo[0].thumburl || bestPage.imageinfo[0].url;
        const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'FloraSync-Bot/1.0 (dev@florasync.local)' } });
        
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer();
          const ext = imgUrl.split('.').pop()?.toLowerCase() || 'jpg';
          
          const allowedFolders = ['flowers', 'fruits', 'foliage', 'herbs', 'vegetables'];
          let safeFolder = (aiData.folder || '').toLowerCase();
          if (!allowedFolders.includes(safeFolder)) {
            if (safeFolder.includes('veg')) safeFolder = 'vegetables';
            else if (safeFolder.includes('fruit')) safeFolder = 'fruits';
            else if (safeFolder.includes('flower')) safeFolder = 'flowers';
            else if (safeFolder.includes('herb')) safeFolder = 'herbs';
            else safeFolder = 'foliage'; // ultimate fallback
          }
          
          relativeImagePath = `images/${safeFolder}/${id}.${ext}`;
          zip.file(relativeImagePath, imgBuffer);
          console.log(`✅ Added stunning photograph from Wikimedia Commons: ${relativeImagePath}`);
        } else {
          console.log(`⚠️ Failed to download the image file from Wikimedia.`);
        }
      } else {
        console.log(`⚠️ No suitable photographs found on Wikimedia Commons for ${plantName}.`);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.error(`❌ Image search timed out for ${plantName}. Skipping...`);
      } else {
        console.error(`❌ Error fetching image for ${plantName}:`, e.message);
      }
    }

    // 🏗️ 2. Build the baseline dictionary archetype from AI data
    archetypes.push({
      id,
      commonName: plantName,
      scientificName: aiData.scientificName || 'Unknown',
      category: aiData.category || 'Uncategorized',
      lifecycle: aiData.lifecycle || "Annual",
      sunRequirement: aiData.sunRequirement || "Full Sun",
      waterIntervalDays: aiData.waterIntervalDays || 3,
      feedingIntervalDays: aiData.feedingIntervalDays || 14,
      daysToHarvest: aiData.daysToHarvest || 60,
      imageUrl: relativeImagePath,
      whatToFeed: aiData.whatToFeed || "Balanced organic fertilizer.",
      pruningTips: aiData.pruningTips || "None required.",
      flavorProfile: aiData.flavorProfile || "Earthy.",
      companionPlants: aiData.companionPlants || [],
      combativePlants: aiData.combativePlants || [],
      growthHabit: aiData.growthHabit || "Upright",
      whenToPlant: aiData.whenToPlant || "After frost.",
      whenToHarvest: aiData.whenToHarvest || "When mature.",
      usesForLargeHarvests: aiData.usesForLargeHarvests || "Storage or fresh eating.",
      hardinessZones: aiData.hardinessZones || [],
      hardinessNote: aiData.hardinessNote || "",
      plantingInstructions: aiData.plantingInstructions || "Sow directly.",
      growthRequirements: aiData.growthRequirements || "Well-draining soil."
    });
  }

  // 📄 3. Generate the core JSON file at the root of the ZIP
  console.log('\n📝 Assembling new-plants.json...');
  zip.file('new-plants.json', JSON.stringify(archetypes, null, 2));

  // 💾 4. Build the final .zip archive
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeFirstName = PLANTS_TO_GENERATE[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const packageName = `package-${safeFirstName}-${timestamp}.zip`;
  const outputPath = path.join(PACKAGES_DIR, packageName);
  console.log(`💾 Compressing and saving package to: ${packageName}`);
  
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, content);
  
  console.log('✅ Package generation complete! Ready for import.');
}

generatePackage().catch(err => {
  console.error('Fatal error during package generation:', err);
});