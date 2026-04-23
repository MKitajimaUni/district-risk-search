export async function fetchEvacuationInfoByMunicipality(municipality) {
    const response = await fetch(`/api/search_evacuation_info_municipality?municipality=${encodeURIComponent(municipality)}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch evacuation info for municipality: ${municipality}`);
    }

    return await response.json();
}

async function fetchEvacuationInfoByCoordinate(lat, lon, rad) {
    const response = await fetch(`/api/search_evacuation_info_coordinate?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&rad=${encodeURIComponent(rad)}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch evacuation info for coordinates: (${lat}, ${lon}) with radius: ${rad}`);
    }

    // For debug
    console.log("Evacuation info for coordinates:", lat, lon, rad);
    return await response.json();
}

export async function showEvacuationInfoByMunicipality(municipality) {
    // for debugging
    const data = await fetchEvacuationInfoByMunicipality(municipality);
    
    //console.log("Evacuation info for municipality:", municipality);
    //console.log(data);
}

export async function showEvacuationInfoByCoordinate(lat, lon, rad) {
    // for debugging
    const data = await fetchEvacuationInfoByCoordinate(lat, lon, rad);
    
    //console.log("Evacuation info for coordinates:", lat, lon, rad);
    //console.log(data);
}

