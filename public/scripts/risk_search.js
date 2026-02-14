const TABLE = "earthquake_risk_full";
const AREA_COUNT = 5192;
const Translations = new Map([
    ["municipality", "区市町名"],
    ["district", "町丁目名"],
    ["ground_classification", "地盤分類"],
    ["building_collapse_risk", "建物倒壊危険度危険量（棟/ha）"],
    ["building_collapse_risk_rank", "建物倒壊危険度順位"],
    ["building_collapse_risk_index", "建物倒壊危険度ランク"],
    ["fire_risk", "火災危険度危険量（棟/ha）"],
    ["fire_risk_rank", "火災危険度順位"],
    ["fire_risk_index", "火災危険度ランク"],
    ["activity_difficulty_factor", "災害時活動困難度困難係数"],
    ["total_risk", "総合危険度危険量（棟/ha）"],
    ["total_risk_rank", "総合危険度順位"],
    ["total_risk_index", "総合危険度ランク"]
]);
const CrimeTranslations = new Map([
    ["municipality", "区市町名"],
    ["district", "町丁目名"],
    ["total_crimes", "総合計"],
    ["violent_crimes_total", "凶悪犯計"],
    ["violent_robbery", "凶悪犯強盗"],
    ["violent_other", "凶悪犯その他"],
    ["assault_total", "粗暴犯計"],
    ["weapon_gathering", "粗暴犯凶器準備集合"],
    ["assault", "粗暴犯暴行"],
    ["injury", "粗暴犯傷害"],
    ["threat", "粗暴犯脅迫"],
    ["extortion", "粗暴犯恐喝"],
    ["burglary_total", "侵入窃盗計"],
    ["safe_cracking", "侵入窃盗金庫破り"],
    ["school_break_in", "侵入窃盗学校荒し"],
    ["office_break_in", "侵入窃盗事務所荒し"],
    ["store_break_in", "侵入窃盗出店荒し"],
    ["empty_house", "侵入窃盗空き巣"],
    ["sneaking_in", "侵入窃盗忍込み"],
    ["residence_busy", "侵入窃盗居空き"],
    ["burglary_other", "侵入窃盗その他"],
    ["non_burglary_total", "非侵入窃盗計"],
    ["car_theft", "非侵入窃盗自動車盗"],
    ["motorcycle_theft", "非侵入窃盗オートバイ盗"],
    ["bicycle_theft", "非侵入窃盗自転車盗"],
    ["car_break_in", "非侵入窃盗車上ねらい"],
    ["vending_machine_theft", "非侵入窃盗自販機ねらい"],
    ["construction_site_theft", "非侵入窃盗工事場ねらい"],
    ["pickpocket", "非侵入窃盗すり"],
    ["snatching", "非侵入窃盗ひったくり"],
    ["lifting", "非侵入窃盗置引き"],
    ["shoplifting", "非侵入窃盗万引き"],
    ["non_burglary_other", "非侵入窃盗その他"],
    ["other_total", "その他計"],
    ["fraud", "その他詐欺"],
    ["misappropriation", "その他占有離脱物横領"],
    ["intellectual_crimes", "その他その他知能犯"],
    ["gambling", "その他賭博"],
    ["other_penal_codes", "その他その他刑法犯"]
]);
const ElementColor = new Map(
    [[1, "secondary"],
        [2, "primary"],
        [3, "success"],
        [4, "warning"],
        [5, "danger"],]
);


// ----------------------------
// Data for suggestion
// ----------------------------
let municipalities = new Set();
let districtsMap = new Map();

// ----------------------------
// Load when content is loaded
// ----------------------------
window.addEventListener("DOMContentLoaded", loadSuggestData);

// ----------------------------
// For map
// ----------------------------
let baseMap;

let riverLayer;
let pluvialLayer;
let riverMaxLayer;
let tsunamiLayer;
let heightLayer;
let heightAllTokyoLayer;

let marker;

let floodLegend;
let heightLegend;
let heightTokyoLegend;

//----------------
// for chart
//----------------
let chartPerMunicipality;
let chartPerDistrict;

//----------------
// for loading modal
//----------------
let loadingModal = null;

async function loadSuggestData() {
    console.log("Loading municipality/district list from server...");
    enableLoadingHover();
    setLoadingDescription("検索用データを読み込み中...");

    let start = 0;
    const pagesize = 1000;
    let rows;

    do {
        const end = start + pagesize - 1;

        const response = await fetch(`/api/suggest?start=${start}&end=${end}`);
        rows = await response.json();

        rows.forEach(row => {
            municipalities.add(row.municipality);

            if (!districtsMap.has(row.municipality)) {
                districtsMap.set(row.municipality, []);
            }
            districtsMap.get(row.municipality).push(row.district);
        });

        start += pagesize;

    } while (rows.length === pagesize);

    console.log("Municipalities:", municipalities.size);
    console.log("districtsMap:", districtsMap.size);

    attachSuggestListeners();
    disableLoadingHover();
}

// ----------------------------
// Suggestions
// ----------------------------
function attachSuggestListeners() {
    const municipalityInput = document.getElementById("municipality");
    const districtInput = document.getElementById("district");

    municipalityInput.addEventListener("input", () =>
        showSuggestList(municipalityInput, [...municipalities])
    );

    districtInput.addEventListener("input", () => {
        const m = municipalityInput.value.trim();
        if (!districtsMap.has(m)) return hideSuggestList();
        showSuggestList(districtInput, districtsMap.get(m));
    });

    document.addEventListener("click", e => {
        const box = document.getElementById("suggest-box");
        if (box && e.target.classList.contains("suggest-item")) {
            document.getElementById(box.dataset.target).value =
                e.target.textContent;
        }
        hideSuggestList();
    });
}

// ----------------------------
function showSuggestList(input, items) {
    hideSuggestList();

    const value = input.value.trim();
    if (!value) return;

    const filtered = items.filter(x => x.includes(value));
    if (!filtered.length) return;

    const box = document.createElement("div");
    box.id = "suggest-box";
    box.dataset.target = input.id;
    box.style.position = "absolute";
    box.style.border = "1px solid #ccc";
    box.style.background = "white";
    box.style.width = input.offsetWidth + "px";
    box.style.zIndex = 1000;

    const rect = input.getBoundingClientRect();
    box.style.left = rect.left + "px";
    box.style.top = rect.bottom + "px";

    filtered.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("suggest-item");
        div.textContent = item;
        div.style.padding = "5px";
        div.style.cursor = "pointer";

        // hover
        div.addEventListener("mouseover", () => {
            div.style.background = "blue";
            div.style.color = "white";
        });
        div.addEventListener("mouseout", () => {
            div.style.background = "white";
            div.style.color = "";
        });

        box.appendChild(div);
    });

    document.body.appendChild(box);
}

// ----------------------------
function hideSuggestList() {
    const box = document.getElementById("suggest-box");
    if (box) box.remove();
}

// ----------------------------
// Search
// ----------------------------
async function searchFloodData(description) {
    const municipality = document.getElementById("municipality").value;

    const response = await fetch(
        `/api/search_flood?municipality=${encodeURIComponent(municipality)}`
    );

    const data = await response.json();

    if (!data || data.length === 0) {
        document.getElementById("result_flood").innerHTML =
            `<h2>洪水危険度</h2><div class="alert alert-danger">データが見つかりませんでした。</div>`;
        return;
    }

    // 1レコード想定
    const row = data[0];

    // Assumption: pluvial_url is a subset of river_url.
    if (row["pluvial_url"] == null) {
        row["pluvial_url"] = row["river_url"];
    }

    document.getElementById("result_flood").innerHTML = `
    <h2>洪水に関する情報</h2>
    <div class="card mb-4">
        <div class="card-header bg-info text-white">
            ${municipality}に関する一般情報
        </div>    
        <div class="card-body">
            ${description["flood_description"]}
        </div>
        <div class="card-footer bg-transparent border-none">
        <small>AIによって生成された情報であり、間違いを含む可能性があります。</small>
        </div>
    </div>
      
    </div>
    <div class="card mb-4">
        <div class="card-header bg-primary text-white">
            ${municipality}の洪水・内水ハザードマップURL
        </div>
        <div class="card-body">
            <table class="table table-bordered">
                <tbody>
                    <tr>
                        <th class="bg-light">洪水ハザードマップ</th>
                        <td><a href="${row["river_url"]}">こちらからアクセスできます</a></td>
                    </tr>
                    <tr>
                        <th class="bg-light">内水ハザードマップ</th>
                        <td><a href="${row["pluvial_url"]}">こちらからアクセスできます</a></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `;
}

async function searchEarthquakeData(description) {
    const municipality = document.getElementById("municipality").value;
    const district = document.getElementById("district").value;

    const response = await fetch(
        `/api/search_earthquake?municipality=${encodeURIComponent(municipality)}&district=${encodeURIComponent(district)}`
    );

    const data = await response.json();

    if (!data || data.length === 0) {
        document.getElementById("result_earthquake").innerHTML =
            `<h2>地震危険度</h2><div class="alert alert-danger">データが見つかりませんでした。</div>`;
        return;
    }

    // 1レコード想定
    const row = data[0];

    // 表HTMLを作成
    document.getElementById("result_earthquake").innerHTML = `
        <h2>地震危険度</h2>
        <div class="card mb-4">
            <div class="card-header bg-info text-white">
                ${municipality}に関する一般情報
            </div>    
            <div class="card-body">
                ${description["earthquake_description"]}
            </div>
            <div class="card-footer bg-transparent border-none">
            <small>AIによって生成された情報であり、間違いを含む可能性があります。</small>
            </div>
        </div>
        <div class="row text-center">
            <!-- 総合危険度 -->          
            <div class="col-md-4">
                <div class="card text-bg-light border-mb-3 border-${ElementColor.get(row["total_risk_index"])}">
                    <div class="card-header">総合危険度</div>
                    <div class="card-body">
                        <h2 class="card-title text-center text-${ElementColor.get(row["total_risk_index"])}">
                            ${row["total_risk_index"]}
                        </h2>
                        <p class="card-text text-center">
                            #${row["total_risk_rank"]} / ${AREA_COUNT} 位
                        </p>
                        <p class="card-text">
                            <small class="text-muted">                              
                            </small></p>
                    </div>
                </div>
            </div>
            <!-- 火災危険度 -->
            <div class="col-md-4">
                <div class="card text-bg-light mb-3 border-${ElementColor.get(row["fire_risk_index"])}">
                    <div class="card-header">火災危険度</div>
                    <div class="card-body">
                        <h2 class="card-title text-center text-${ElementColor.get(row["fire_risk_index"])}">
                            ${row["fire_risk_index"]}
                        </h2>
                        <p class="card-text text-center">
                            #${row["fire_risk_rank"]} / ${AREA_COUNT} 位
                        </p>
                       <p class="card-text">
                            <small class="text-muted">                               
                            </small></p>
                    </div>
                </div>
            </div>
            <!-- 建物倒壊危険度 -->
            <div class="col-md-4">
                <div class="card text-bg-light mb-3 border-${ElementColor.get(row["building_collapse_risk_index"])}">
                    <div class="card-header">建物倒壊危険度</div>
                    <div class="card-body">
                        <h2 class="card-title text-center text-${ElementColor.get(row["building_collapse_risk_index"])}">
                            ${row["building_collapse_risk_index"]}
                        </h2>
                        <p class="card-text text-center">
                            #${row["building_collapse_risk_rank"]} / ${AREA_COUNT} 位
                        </p>
                        <p class="card-text">
                            <small class="text-muted">
                            </small></p>
                    </div>
                </div>
            </div>
　　　　　</div>
    `;

    document.getElementById("result_earthquake_detailed").innerHTML = `
　　<h2>地震危険度</h2>
    <div class="card">
        <div class="card-header bg-primary text-white">
            詳細情報
        </div>
        <div class="card-body">
            <table class="table table-bordered">
                <tbody>
                    ${Object.entries(row).map(([key, value]) => `
                        <tr>
                            <th class="bg-light">${Translations.get(key)}</th>
                            <td>${value === null ? "" : value}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    </div>
    `;
}

async function searchCrimeData(description) {
    const municipality = document.getElementById("municipality").value;
    const district = document.getElementById("district").value;

    const response = await fetch(
        `/api/search_crime?municipality=${encodeURIComponent(municipality)}&district=${encodeURIComponent(district)}`
    );
    const response_per_municipality = await fetch(
        `/api/search_crime_per_municipality?municipality=${encodeURIComponent(municipality)}`
    );

    const data = await response.json();
    const data_per_municipality = await response_per_municipality.json();

    if (!data || data.length === 0 || !data_per_municipality || data_per_municipality.length === 0) {
        document.getElementById("result_crime").innerHTML =
            `<h2>犯罪数（令和6年度）</h2><div class="alert alert-danger">データが見つかりませんでした。</div>`;
        return;
    }

    // Assumption: only one record
    const row = data[0];
    const row_per_municipality = data_per_municipality[0];

    // Make card lists
    document.getElementById("result_crime_card").innerHTML = `
        <h2>犯罪件数（令和6年度）</h2>
        <div class="card mb-4">
            <div class="card-header bg-info text-white">
                ${municipality}に関する一般情報
            </div>    
            <div class="card-body">
                ${description["crime_description"]}
            </div>
            <div class="card-footer bg-transparent border-none">
            <small>AIによって生成された情報であり、間違いを含む可能性があります。</small>
            </div>
        </div>
        <h5>${municipality}${district}</h5>
        
        <div class="row text-center">
            <div class="col-md-4">
                <div class="card text-bg-light border-mb-3">
                    <div class="card-header">凶悪犯</div>
                    <div class="card-body">
                        <h2 class="card-title text-center">
                            ${row["violent_crimes_total"]}
                        </h2>
                        <p class="card-text">
                            <small class="text-muted">
                                殺人、強盗、放火、強姦など
                            </small></p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-bg-light border-mb-3">
                    <div class="card-header">粗暴犯</div>
                    <div class="card-body">
                        <h2 class="card-title text-center">
                            ${row["assault_total"]}
                        </h2>
                        <p class="card-text">
                            <small class="text-muted">
                                暴行など、暴力で他人に損害を与えた犯行
                            </small></p>
                
                    </div>
                </div>
            </div>           
            <div class="col-md-4">
                <div class="card text-bg-light mb-3">
                    <div class="card-header">侵入窃盗</div>
                    <div class="card-body">
                        <h2 class="card-title text-center">
                            ${row["burglary_total"]}
                        </h2>
                        <p class="card-text">
                            <small class="text-muted">
                                空き巣や忍込みなど
                            </small></p>          
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-bg-light mb-3">
                    <div class="card-header">非侵入窃盗</div>
                    <div class="card-body">
                        <h2 class="card-title text-center text-">
                            ${row["non_burglary_total"]}
                        </h2>
                       <p class="card-text">
                            <small class="text-muted">                         
                                ひったくり、すり、自動車盗、万引きなど 
                            </small></p>                        
                    </div>
                </div>
            </div>
　　　　　</div>
        <h5>${municipality}全体</h5>
        <div class="row text-center">
            <div class="col-md-4">
                <div class="card text-bg-light border-mb-3">
                    <div class="card-header">凶悪犯</div>
                    <div class="card-body">
                        <h2 class="card-title text-center">
                            ${row_per_municipality["violent_crimes_total"]}
                        </h2>
                        <p class="card-text">
                            <small class="text-muted">
                                殺人、強盗、放火、強姦など
                            </small></p>
                       </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-bg-light border-mb-3">
                    <div class="card-header">粗暴犯</div>
                    <div class="card-body">
                        <h2 class="card-title text-center}">
                            ${row_per_municipality["assault_total"]}
                        </h2>
                        <p class="card-text">
                            <small class="text-muted">
                                暴行など、暴力で他人に損害を与えた犯行
                            </small></p>
                
                    </div>
                </div>
            </div>           
            <div class="col-md-4">
                <div class="card text-bg-light mb-3">
                    <div class="card-header">侵入窃盗</div>
                    <div class="card-body">
                        <h2 class="card-title text-center">
                            ${row_per_municipality["burglary_total"]}
                        </h2>
                        <p class="card-text">
                            <small class="text-muted">
                                空き巣や忍込みなど
                            </small></p>          
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-bg-light mb-3">
                    <div class="card-header">非侵入窃盗</div>
                    <div class="card-body">
                        <h2 class="card-title text-center text-">
                            ${row_per_municipality["non_burglary_total"]}
                        </h2>
                       <p class="card-text">
                            <small class="text-muted">                         
                                ひったくり、すり、自動車盗、万引きなど 
                            </small></p>                        
                    </div>
                </div>
            </div>
　　　　　</div>
        `;

    document.getElementById("result_crime_detailed").innerHTML = `
　　<h2>犯罪件数（令和6年度）</h2>
    <div class="card mb-4">
        <div class="card-header bg-primary text-white">
            ${municipality}${district}の詳細情報（発生したもののみ）
        </div>
        <div class="card-body">
            <table class="table table-bordered">
                <tbody>
                    ${Object.entries(row).filter(([_, value]) => value > 0).map(([key, value]) => `
                        <tr>
                            <th class="bg-light">${CrimeTranslations.get(key)}</th>
                            <td>${value === null ? "" : value}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    </div>
    <div class="card mb-4">
        <div class="card-header bg-primary text-white">
            ${municipality}全体の詳細情報（発生したもののみ）
        </div>
        <div class="card-body">
            <table class="table table-bordered">
                <tbody>
                ${Object.entries(row_per_municipality).filter(([_, value]) => value > 0).map(([key, value]) => `
                            <tr>
                                <th class="bg-light">${CrimeTranslations.get(key)}</th>
                                <td>${value === null ? "" : value}</td>
                            </tr>
                        `).join("")}
                </tbody>
            </table>
        </div>
    </div>
    `;

    // Make radar chart of $municipality vs average
    chartPerMunicipality && chartPerMunicipality.destroy();
    chartPerDistrict && chartPerDistrict.destroy();

    const ctx_mun = document.getElementById('result_crime_chart');
    const ctx_dis = document.getElementById('result_crime_chart_district');

    const chartDataMun = {
        labels: [
            CrimeTranslations.get("violent_crimes_total"),
            CrimeTranslations.get("assault_total"),
            CrimeTranslations.get("non_burglary_total"),
            CrimeTranslations.get("burglary_total")
        ],
        datasets: [{
            label: `${municipality}全体`,
            data: [
                row_per_municipality["violent_crimes_total"],
                row_per_municipality["assault_total"],
                row_per_municipality["non_burglary_total"],
                row_per_municipality["burglary_total"],
            ],
            backgroundColor: [
                'rgb(255, 0, 0)',
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
            ],
            hoverOffset: 4,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${municipality}全体`
                    }
                }
            }
        }]
    };

    const chartDataDis = {
        labels: [
            CrimeTranslations.get("violent_crimes_total"),
            CrimeTranslations.get("assault_total"),
            CrimeTranslations.get("non_burglary_total"),
            CrimeTranslations.get("burglary_total")
        ],
        datasets: [{
            label: `${municipality}${district}`,
            data: [
                row["violent_crimes_total"],
                row["assault_total"],
                row["non_burglary_total"],
                row["burglary_total"],
            ],
            backgroundColor: [
                'rgb(255, 0, 0)',
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
            ],
            hoverOffset: 4,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${municipality}${district}`
                    }
                }
            }
        }]
    };

    chartPerMunicipality = new Chart(ctx_mun, {
        type: 'pie',
        data: chartDataMun
    });

    chartPerDistrict = new Chart(ctx_dis, {
        type: 'pie',
        data: chartDataDis
    });
}

async function showHeader() {
    const municipality = document.getElementById("municipality").value;
    const district = document.getElementById("district").value;

    document.getElementById("result").style.display = "block";
    document.getElementById("result_title").innerHTML = `<h1>${municipality}${district}の検索結果</h1>`;
    document.getElementById("result_title_detailed").innerHTML = `<h1>詳細情報</h1>`;
}

function isInputValid() {
    const municipality = document.getElementById("municipality").value;
    const district = document.getElementById("district").value;

    // empty input or no district in given municipality
    return !(municipality.length === 0
        || district.length === 0
        || !districtsMap.has(municipality)
        || !districtsMap.get(municipality).includes(district)
    );
}

// -----------
// description
// -----------
async function fetchDescription() {
    const municipality = document.getElementById("municipality").value;

    const response = await fetch(
        `/api/search_description?municipality=${encodeURIComponent(municipality)}`
    );

    return await response.json();
}

// ----------------------------
// Map initialization and layer
// ----------------------------
async function fetchMap() {
    const municipality = document.getElementById("municipality").value;
    const district = document.getElementById("district").value;
    const {lat, lon} = await getGeocodeAddress("東京都" + municipality + district);
    const zoom = 15;

    if (!baseMap) {
        baseMap = L.map("map_flood").setView([lat, lon], zoom);

        const baseLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {attribution: "© OpenStreetMap"}
        );

        baseLayer.addTo(baseMap);


    } else {
        baseMap.setView([lat, lon], zoom);
    }

    if (marker) marker.remove();

    marker = L.marker([lat, lon]).addTo(baseMap);
}

function clearUpperLayers() {
    riverLayer && baseMap.removeLayer(riverLayer);
    pluvialLayer && baseMap.removeLayer(pluvialLayer);
    riverMaxLayer && baseMap.removeLayer(riverMaxLayer);
    tsunamiLayer && baseMap.removeLayer(tsunamiLayer);
    heightLayer && baseMap.removeLayer(heightLayer);
    heightAllTokyoLayer && baseMap.removeLayer(heightAllTokyoLayer);

    if (floodLegend) {
        baseMap.removeControl(floodLegend);
        floodLegend = null;
    }

    if (heightLegend) {
        baseMap.removeControl(heightLegend);
        heightLegend = null;
    }

    if (heightTokyoLegend) {
        baseMap.removeControl(heightTokyoLegend);
        heightTokyoLegend = null;
    }
}

async function fetchMapWithRiverFlood() {
    clearUpperLayers();

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
    clearUpperLayers();

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
    clearUpperLayers();

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
    clearUpperLayers();

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

async function fetchMapWithHeight() {
    clearUpperLayers();

    try {
        if (!heightLayer) {
            heightLayer = L.tileLayer(
                "https://cyberjapandata.gsi.go.jp/xyz/d1-no455/{z}/{x}/{y}.png",
                {
                    // Because this tile map has another map as a base map,
                    // Overlap tile with the layer
                    opacity: 1.0,
                    attribution: '出典: <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
                }
            );
        }
        heightLayer.addTo(baseMap);
        addHeightLegend();

    } catch (error) {
        console.log(error);
        alert("標高情報取得に失敗しました");
    }
}

async function fetchMapWithAllTokyoHeight() {
    clearUpperLayers();

    try {
        if (!heightAllTokyoLayer) {
            heightAllTokyoLayer = L.tileLayer(
                "https://cyberjapandata.gsi.go.jp/xyz/d1-no955/{z}/{x}/{y}.png",
                {
                    opacity: 0.6,
                    attribution: '出典: <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
                }
            );
        }
        heightAllTokyoLayer.addTo(baseMap);

    } catch (error) {
        console.log(error);
        alert("標高情報取得に失敗しました");
    }

    addHeightTokyoLegend();
}

function addFloodLegend() {
    if (floodLegend) return;

    floodLegend = L.control({position: "bottomright"});

    floodLegend.onAdd = function () {
        const div = L.DomUtil.create("div", "flood-legend");
        div.innerHTML = `
            <img src="/img/flood_legend.png"
                 style="width:120px; background:white; padding:5px; border-radius:4px;">
        `;
        return div;
    };

    floodLegend.addTo(baseMap);
}

function addHeightLegend() {
    if (heightLegend) return;

    heightLegend = L.control({position: "bottomright"});

    heightLegend.onAdd = function () {
        const div = L.DomUtil.create("div", "height");
        div.innerHTML = `
        <img src="/img/height_legend.png"
            style="width:120px; padding:5px; border-radius:4px;">
        `;

        return div;
    }

    heightLegend.addTo(baseMap);
}

function addHeightTokyoLegend() {
    if (heightTokyoLegend) return;

    heightTokyoLegend = L.control({position: "bottomright"});

    heightTokyoLegend.onAdd = function () {
        const div = L.DomUtil.create("div", "height");
        div.innerHTML = `
        <img src="/img/height_tokyo_legend.png"
            style="width:120px; padding:5px; border-radius:4px;">
        `;

        return div;
    }

    heightTokyoLegend.addTo(baseMap);
}

function addMapLayer() {
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
        case "height": {
            fetchMapWithHeight();
            document.getElementById("map-current-state").innerText = `表示中：（23区のみ）標高地形図`;
            break;
        }
        case "height-tokyo": {
            fetchMapWithAllTokyoHeight();
            document.getElementById("map-current-state").innerHTML = `表示中：（東京都全域）標高地形図`;
            break;
        }
        case "clear": {
            clearUpperLayers();
            document.getElementById("map-current-state").innerText = ``;
            break;
        }
        default:
            break;
    }
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


// ---------------
// loading modal
// ---------------
function enableLoadingHover() {
    const modalEl = document.getElementById("loading-popup");

    if (!modalEl) {
        console.error("loading-popup not found");
        return;
    }

    loadingModal = bootstrap.Modal.getOrCreateInstance(modalEl, {
        backdrop: "static",
        keyboard: false
    });

    loadingModal.show();
}

function disableLoadingHover() {
    if (!loadingModal) return;

    loadingModal.hide();
}

function setLoadingDescription(text) {
    const descEl = document.getElementById("loading-description");

    if (!descEl) {
        console.error("loading-description not found");
        return;
    }

    descEl.textContent = text;
}


// check input validity -> fetch data -> fetch map -> show header
async function searchData() {

    if (!isInputValid()) {
        alert("入力が不正です。")
        return;
    }

    enableLoadingHover();

    setLoadingDescription("危険性情報を取得中...");

    const description = await fetchDescription()
    const raw = description[0];

    await Promise.all([
        searchEarthquakeData(raw),
        searchCrimeData(raw),
        searchFloodData(raw)
    ]);

    setLoadingDescription("マップデータを取得中...");

    await fetchMap();

    if (baseMap) {
        setTimeout(() => {
            baseMap.invalidateSize();
        }, 0);
    }

    await showHeader();

    disableLoadingHover();
}
