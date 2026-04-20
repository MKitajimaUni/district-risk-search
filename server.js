import {createClient} from '@supabase/supabase-js';
import {config} from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";


config();
const app = express();
app.use(express.json());
app.use(express.static("public"));

// Supabase consts
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_API_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_API_KEY;
const PORT = process.env.PORT || 3000;

// deploy
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Table Names
const TABLE_EARTHQUAKE = "earthquake_risk_full";
const TABLE_CRIME = "crime_data"
const TABLE_EVACUATION_SITE = "evacuation_site";
const TABLE_EVACUATION_SHELTER = "evacuation_shelter";

// Make authenticated client (only reading data is enabled)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

app.get("/api/suggest", async (req, res) => {
    // Only 1000 rows per API request, according to the default setting of Supabase
    const {start = 0, end = 999} = req.query;

    const {data, error} = await supabase
        .from(TABLE_EARTHQUAKE)
        .select('municipality, district')
        .range(start, end);

    if (error) return res.status(400).send({"error": error});
    res.json(data);
});

app.get("/api/search_earthquake", async (req, res) => {
    const {municipality, district} = req.query;

    const {data, error} = await supabase
        .from(TABLE_EARTHQUAKE)
        .select('*')
        .eq('municipality', municipality)
        .eq('district', district); // filter implies "AND" for previous clauses

    if (error) return res.status(400).send({"error": error});
    res.json(data);
});

app.get("/api/search_crime", async (req, res) => {
    const {municipality, district} = req.query;

    const {data, error} = await supabase
        .from(TABLE_CRIME)
        .select('*')
        .eq('municipality', municipality)
        .eq('district', district); // filter implies "AND" for previous clauses

    if (error) return res.status(400).send({"error": error});

    res.json(data);
});

app.get("/api/search_crime_per_municipality", async (req, res) => {
    const {municipality} = req.query;

    const {data, error} = await supabase
        .from(TABLE_CRIME)
        .select('*')
        .eq('municipality', municipality)
        .eq('district', `計`); // Means "sum". Follow the table format.

    if (error) return res.status(400).send({"error": error});

    res.json(data);

});

app.get("/api/total_crime_per_municipality", async (req, res) => {
    const {municipality} = req.query;
    if (!municipality) {
        return res.status(400).json({
            error: 'municipality parameter is required'
        });
    }

    const {data: data_municipality, error: error_municipality} = await supabase
        .from(TABLE_CRIME)
        .select('municipality, district, total_crimes')
        .eq('municipality', municipality)
        .neq('district', '計')
        .order('total_crimes', {ascending: false});

    if (error_municipality) return res.status(400).send({"error": error_municipality});

    res.json(data_municipality);
});

app.get('/api/total_crime_tokyo', async (req, res) => {

    const {data: data_prefecture, error: error_prefecture} = await supabase
        .from(TABLE_CRIME)
        .select('municipality, district, total_crimes')
        .like('district', '計')
        .order('total_crimes', {ascending: false});

    if (error_prefecture) return res.status(400).send({"error": error_prefecture});

    res.json(data_prefecture);
})

app.get('/api/search_flood', async (req, res) => {
    try {
        const {municipality} = req.query;

        if (!municipality) {
            return res.status(400).json({
                error: 'municipality parameter is required'
            });
        }

        // execute a query which is defined in supabase
        const {data, error} = await supabase.rpc('get_combined_flood_maps', {
            target_municipality: municipality
        });

        if (error) {
            console.error('Supabase RPC error:', error)
            return res.status(500).json({error: 'Database query failed'})
        }

        res.json(data);

    } catch (error) {
        console.error('Server error:', error)
        res.status(500).json({error: 'Internal server error'})
    }
});

app.get("/api/search_description", async (req, res) => {
    try {
        const {municipality} = req.query;

        if (!municipality) {
            return res.status(400).json({
                error: 'municipality parameter is required'
            });
        }

        // execute a query which is defined in supabase
        const {data, error} = await supabase.rpc('get_description', {
            target_municipality: municipality
        });

        if (error) {
            console.error('Supabase RPC error:', error)
            return res.status(500).json({error: 'Database query failed'})
        }

        res.json(data);

    } catch (error) {
        console.error('Server error:', error)
        res.status(500).json({error: 'Internal server error'})
    }
});

app.get("/api/search_evacuation_info_municipality", async (req, res) => {
    const {municipality} = req.query;

    if (!municipality) {
        return res.status(400).json({
            error: 'municipality parameter is required'
        });
    }

    const {data: siteData, error: siteError} = await supabase
        .from(TABLE_EVACUATION_SITE)
        .select('*')
        .like('address', `%${municipality}%`);

    if (siteError) return res.status(400).send({"error": siteError});

    // Assuming that we alrady fetched evacuation sites
    // which is also an evacuation shelter
    const {data: shelterData, error: shelterError} = await supabase
        .from(TABLE_EVACUATION_SHELTER)
        .select('*')
        .eq('is_also_evacuation_site', 'false')
        .like('address', `%${municipality}%`);
        
    if (shelterError) return res.status(400).send({"error": shelterError});

    res.json({
        sites: siteData,
        shelters: shelterData
    });
});

app.get("/api/search_evacuation_info_coordinate", async (req, res) => {
    const {lat, lon, rad} = req.query;

        if (!lat || !lon || !rad) {
            return res.status(400).json({
                error: 'lat, lon, and rad parameters are required'
            });
        }
});

//----------------------------
// helper functions
// ---------------------------


//----------------------------
// deploy
//----------------------------

// deriver dependent files
app.use('/scripts', express.static('scripts'));

app.get("*", (req, res) => {
    res.sendFile("index.html");
});

// start server
app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);
});
