let baseMap;
let riverLayer;
let pluvialLayer;
let riverMaxLayer;
let tsunamiLayer;
let marker;
let floodLegend;

export async function fetchMap(municipality, district) {
    const {lat, lon} = await getGeocodeAddress("東京都" + municipality + district);
    const zoom = 15;

    //keeps the layer state when the pin moved
    //clearFloodLayers();

    if (!baseMap) {
        //map = L.map("map").setView([lat, lon], zoom);
        baseMap = L.map("map_flood").setView([lat, lon], zoom);

        const baseLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {attribution: "© OpenStreetMap"}
        );

        //baseMap.addTo(map);
        baseLayer.addTo(baseMap);


    } else {
        //map.setView([lat, lon], zoom);
        baseMap.setView([lat, lon], zoom);
    }

    //if (marker) marker.remove();
    if (marker) marker.remove();

    //marker = L.marker([lat, lon]).addTo(map);
    marker = L.marker([lat, lon]).addTo(baseMap);

    if (baseMap) {
        setTimeout(() => {
            baseMap.invalidateSize();
        }, 0);
    }
}

export function addMapLayer() {
    let type = document.getElementById("flood-select").value;

    switch (type) {
        case "river": {
            fetchMapWithRiverFlood();
            document.getElementById("map-current-state").innerText = `表示中：洪水浸水想定区域（計画規模（現在の凡例））`;
            break;
        }
        case "pluvial": {
            fetchMapWithPluvialFlood();
            document.getElementById("map-current-state").innerText = `表示中：（福生市のみ）内水（雨水出水）浸水想定区域`;
            break;
        }
        case "river-max": {
            fetchMapWithMaxRiverFlood();
            document.getElementById("map-current-state").innerText = `表示中：洪水浸水想定区域（想定最大規模）`;
            break;
        }
        case "tsunami": {
            fetchMapWithTsunami();
            document.getElementById("map-current-state").innerText = `表示中：（島嶼部のみ）津波浸水想定`;
            break;
        }
        default:
            break;
    }
}

function clearFloodLayers() {
    riverLayer && baseMap.removeLayer(riverLayer);
    pluvialLayer && baseMap.removeLayer(pluvialLayer);
    riverMaxLayer && baseMap.removeLayer(riverMaxLayer);
    tsunamiLayer && baseMap.removeLayer(tsunamiLayer);

    if (floodLegend) {
        baseMap.removeControl(floodLegend);
        floodLegend = null;
    }
}

async function fetchMapWithRiverFlood() {
    clearFloodLayers();

    try {
        if (!riverLayer) {
            riverLayer = L.tileLayer(
                "https://disaportaldata.gsi.go.jp/raster/01_flood_l1_shinsuishin_newlegend_data/{z}/{x}/{y}.png",
                {
                    opacity: 0.6,
                    attribution: '出典: <a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/pamphlet/pamphlet.html">ハザードマップポータルサイト</a>'
                }
            );
        }
        riverLayer.addTo(baseMap);
        addFloodLegend();

    } catch (error) {
        console.log(error);
        alert("洪水情報取得に失敗しました");
    }
}

async function fetchMapWithMaxRiverFlood() {
    clearFloodLayers();

    try {
        if (!riverMaxLayer) {
            riverMaxLayer = L.tileLayer(
                "https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
                {
                    opacity: 0.6,
                    attribution: '出典: <a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/pamphlet/pamphlet.html">ハザードマップポータルサイト</a>'
                }
            );
        }
        riverMaxLayer.addTo(baseMap);
        addFloodLegend();

    } catch (error) {
        console.log(error);
        alert("洪水情報取得に失敗しました");
    }
}

async function fetchMapWithPluvialFlood() {
    clearFloodLayers();

    try {
        if (!pluvialLayer) {
            pluvialLayer = L.tileLayer(
                "https://disaportaldata.gsi.go.jp/raster/02_naisui_pref_data/13/{z}/{x}/{y}.png",
                {
                    opacity: 0.6,
                    attribution: '出典: <a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/pamphlet/pamphlet.html">ハザードマップポータルサイト</a>'
                }
            );
        }
        pluvialLayer.addTo(baseMap);
        addFloodLegend();

    } catch (error) {
        console.log(error);
        alert("洪水情報取得に失敗しました");
    }
}

async function fetchMapWithTsunami() {
    clearFloodLayers();

    try {
        if (!tsunamiLayer) {
            tsunamiLayer = L.tileLayer(
                "https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_pref_data/13/{z}/{x}/{y}.png",
                {
                    opacity: 0.6,
                    attribution: '出典: <a href="https://disaportal.gsi.go.jp/hazardmapportal/hazardmap/pamphlet/pamphlet.html">ハザードマップポータルサイト</a>'
                }
            );
        }
        tsunamiLayer.addTo(baseMap);
        addFloodLegend();

    } catch (error) {
        console.log(error);
        alert("洪水情報取得に失敗しました");
    }
}

function addFloodLegend() {
    if (floodLegend) return;

    floodLegend = L.control({position: "bottomright"});

    floodLegend.onAdd = function () {
        const div = L.DomUtil.create("div", "flood-legend");
        div.innerHTML = `
            <img src="../img/flood_legend.png"
                 style="width:120px; background:white; padding:5px; border-radius:4px;">
        `;
        return div;
    };

    floodLegend.addTo(baseMap);
}

async function getGeocodeAddress(address) {
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
        throw new Error("住所から位置を取得できませんでした");
    }

    console.log("geocode: ", data[0].lat, data[0].lon);
    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
    };
}