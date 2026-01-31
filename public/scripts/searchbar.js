let municipalities = new Set();
let districtsMap = new Map();

export async function loadSuggestData() {
    console.log("Loading municipality/district list from server...");

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
}

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

function hideSuggestList() {
    const box = document.getElementById("suggest-box");
    if (box) box.remove();
}


