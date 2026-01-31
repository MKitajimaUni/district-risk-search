import {fetchMap} from './map.js';
import {loadSuggestData} from './searchbar.js';

// when the page is loaded, load data for suggestion
window.addEventListener("DOMContentLoaded", loadSuggestData);

// listen to the search button
window.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("searchBtn")
        .addEventListener("click", searchHousingData);
});



// API endpoints and global values
const NEAREST_STATION_URL = "https://express.heartrails.com/api/json?method=getStations"
const CENTRAL_STATIONS_LIST = ["東京","渋谷","品川","上野","新宿","池袋"]

async function getCoordinate(municipality, district) {
    const address = "東京都" + municipality + district;

    const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(address)}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    const data = await response.json();

    if (!data || data.length === 0) {
        console.error("could not find any data");
    }

    console.log("geocode: ", data[0].lat, data[0].lon);

    return {
        lat: data[0].lat.toString(),
        lon: data[0].lon.toString()
    };
}

async function showNearestStation(data) {
    document.getElementById("station_list").innerHTML =
    `
    <>
    `;
}

async function searchNearestStations(municipality, district) {
    const coordinate = await getCoordinate(municipality, district);

    const URL = `${NEAREST_STATION_URL}&x=${coordinate.lon}&y=${coordinate.lat}`;
    const response = await fetch(URL, {})

    const data = await response.json();
    const stations = data.response.station;

    if (!data || data.length === 0) {
        console.error("could not find any data");
    }

    console.log("stations: ")
    stations.forEach((station) => console.log(station));
    return data;
}

async function searchHousingData() {
    const municipality = document.getElementById("municipality").value;
    const district = document.getElementById("district").value;

    await fetchMap(municipality, district);

    //TODO: validity check here

    await showNearestStation(searchNearestStations(municipality, district));

    // Make result data visible
    // document.getElementById("result").style.display = "block";
}