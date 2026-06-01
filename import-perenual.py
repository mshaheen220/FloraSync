import requests
import json

# Replace with your actual Perenual API key
API_KEY = "sk-yE7L6a1cf419681b117842"

# Base Endpoints
LIST_URL = "https://perenual.com/api/v2/species-list"
DETAILS_URL = "https://perenual.com/api/v2/species/details"

def fetch_local_edibles():
    # Setup parameters: Hardiness zone 6 (Western PA), edible=1 to fetch herbs/veggies
    params = {
        "key": API_KEY,
        "edible": 1,
        "hardiness": "6",
        "page": 1
    }
    
    print("Fetching local edible plant list...")
    response = requests.get(LIST_URL, params=params)
    if response.status_code != 200:
        print(f"Error fetching list: {response.text}")
        return []
        
    species_list = response.json().get("data", [])
    custom_plant_array = []
    
    # We will pull the top common crops from the results to map
    for plant in species_list[:5]:  # Adjust limit as needed
        plant_id = plant.get("id")
        common_name = plant.get("common_name", "Unknown")
        scientific_name = plant.get("scientific_name", ["Unknown"])[0]
        
        print(f"Fetching deep care details for: {common_name} (ID: {plant_id})...")
        details_resp = requests.get(f"{DETAILS_URL}/{plant_id}", params={"key": API_KEY})
        
        if details_resp.status_code == 200:
            details = details_resp.json()
            
            # Helper to map complex watering benchmarks down to a clean integer string/number
            # Perenual often uses strings like "Every 7-10 days" or "Every 3 days"
            benchmark = details.get("watering_general_benchmark", {}).get("value", "7")
            try:
                water_days = int(''.join(filter(str.isdigit, benchmark.split('-')[0])))
            except ValueError:
                water_days = 7
                
            # Parse sun requirements array into a scannable string
            sun = ", ".join(details.get("sunlight", ["Full Sun"]))
            
            # Construct the exact clean schema requested
            mapped_plant = {
                "id": str(plant_id),
                "commonName": common_name,
                "scientificName": scientific_name,
                "category": "Herb" if "herb" in str(details.get("type", "")).lower() else "Vegetable",
                "sunRequirement": sun.title(),
                "waterIntervalDays": water_days,
                "feedingIntervalDays": 30 if "tomato" not in common_name.lower() else 7,
                "whatToFeed": "Balanced organic fertilizer" if "tomato" not in common_name.lower() else "High phosphorus and potassium tomato feed.",
                "pruningTips": details.get("pruning_description", "Prune lightly to maintain structural health and air flow."),
                "flavorProfile": "Fresh, culinary grade harvest.",
                "companionPlants": details.get("companion_plants", ["Basil", "Marigold"]),
                "combativePlants": ["None reported"],
                "growthHabit": details.get("dimension", "Clumping/Bush type"),
                "daysToHarvest": 60
            }
            custom_plant_array.append(mapped_plant)
            
    return custom_plant_array

if __name__ == "__main__":
    result_data = fetch_local_edibles()
    # Save output to a local json file
    with open("local_garden_plants.json", "w") as f:
        json.dump(result_data, f, indent=2)
    print("\nSuccess! Saved to local_garden_plants.json")